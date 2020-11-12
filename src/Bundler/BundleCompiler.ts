import { CompilerResult } from "../Compiler/CompilerResult"
import { StatisticsReporter } from "../Reporting/StatisticsReporter"
import { CachingCompilerHost }  from "../Compiler/CachingCompilerHost"
import { TsCompilerOptions } from "../Compiler/TsCompilerOptions"
import { CompileStream }  from "../Compiler/CompileStream"
import { Logger } from "../Reporting/Logger"
import { BundleParser, Bundle, BundleConfig } from "../Bundler/BundleParser"
import { BundleResult, BundleFile } from "../Bundler/BundleResult"
import { BundleMinifier } from "../Minifier/BundleMinifier"
import { DependencyBuilder } from "./DependencyBuilder"
import { Glob } from "../Project/Glob"

import { Utils } from "../Utils/Utilities"
import { TsCore } from "../Utils/TsCore"
import { format } from "../Utils/Formatter"

import * as ts from "typescript"
import * as fs from "fs"
import * as path from "path"
import VinylFile = require( "vinyl" )

export class BundleCompiler {

    private compilerHost: CachingCompilerHost;
    private program: ts.Program;
    private outputStream: CompileStream;
    private compilerOptions: TsCompilerOptions;

    private emitTime: number = 0;
    private compileTime: number = 0;
    private preEmitTime: number = 0;

    private bundleSourceFiles: ts.MapLike<string> = {};

    constructor( compilerHost: CachingCompilerHost, program: ts.Program, outputStream: CompileStream ) {
        this.compilerHost = compilerHost
        this.program = program;
        this.outputStream = outputStream;
        this.compilerOptions = this.program.getCompilerOptions();
    }

    public compile( bundleFile: BundleFile, bundleConfig: BundleConfig ): CompilerResult {
        Logger.log( "Compiling bundle..." );

        this.compileTime = this.preEmitTime = new Date().getTime();

        // Bundle data
        let bundleFileName: string;
        let bundleFileText: string;
        let bundleSourceFile: ts.SourceFile;

        // The list of bundle files to pass to program 
        // TJT: Shouldn't there only be 1 module after bundling!
        let bundleFiles: string[] = [];

        let outputText: ts.MapLike<string> = {};
        let defaultGetSourceFile: ( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ) => ts.SourceFile;

        let minifyBundle = bundleConfig.minify || false;

        if ( minifyBundle ) {
            // Create the minified bundle fileName
            let bundleDir = path.dirname( bundleFile.path );
            let bundleName = path.basename( bundleFile.path, bundleFile.extension );

            bundleFileName = TsCore.normalizeSlashes( path.join( bundleDir, bundleName + ".min.ts" ) );
        }
        else {
            bundleFileName = bundleFile.path;
        }

        bundleFiles.push( bundleFileName );

        bundleFileText = bundleFile.text;
        this.bundleSourceFiles[ bundleFileName ] = bundleFileText;
        bundleSourceFile = ts.createSourceFile( bundleFileName, bundleFile.text, this.compilerOptions.target );
        
        function writeFile( fileName: string, data: string, writeByteOrderMark: boolean, onError?: ( message: string ) => void ) {
            outputText[ fileName ] = data;
        }

        function getSourceFile( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ): ts.SourceFile {
            if ( fileName === bundleFileName ) {
                return bundleSourceFile;
            }

            // Use base class to get the all source files other than the bundle
            let sourceFile: ts.SourceFile = defaultGetSourceFile( fileName, languageVersion, onError );

            return sourceFile;
        }

        // Override the compileHost getSourceFile() function to get the bundle source file
        defaultGetSourceFile = this.compilerHost.getSourceFile;
        this.compilerHost.getSourceFile = getSourceFile;
        this.compilerHost.writeFile = writeFile;

        // Allow bundle config to extent the project compilerOptions for declaration and source map emitted output
        let compilerOptions = this.compilerOptions;
        
        compilerOptions.declaration = bundleConfig.declaration || this.compilerOptions.declaration;
        compilerOptions.sourceMap = bundleConfig.sourceMap || this.compilerOptions.sourceMap;
        compilerOptions.noEmit = false; // Always emit bundle output

        if ( minifyBundle ) {
            // TJT: Temporary workaround. If declaration is true when minifying an emit error occurs.
            compilerOptions.declaration = false;
            compilerOptions.removeComments = true;
        }

        this.program = ts.createProgram( bundleFiles, compilerOptions, this.compilerHost );

        if ( minifyBundle )
        {
            Logger.log( "Minifying bundle..." );

            let minifier = new BundleMinifier( this.program, compilerOptions, bundleConfig );
            bundleSourceFile = minifier.transform( bundleSourceFile );

            this.program = ts.createProgram( bundleFiles, compilerOptions, this.compilerHost );
        }

        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics( this.program );

        this.preEmitTime = new Date().getTime() - this.preEmitTime;

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, preEmitDiagnostics );
        }

        this.emitTime = new Date().getTime();

        var emitResult = this.program.emit( bundleSourceFile );

        this.emitTime = new Date().getTime() - this.emitTime;

        // Always stream the bundle source file ts - even if emit errors.
        Logger.info( "Streaming vinyl bundle source: ", bundleFileName );
        var tsVinylFile = new VinylFile( {
            path: bundleFileName,
            contents: Buffer.from( format( bundleSourceFile.text ) )
        });

        this.outputStream.push( tsVinylFile );
        
        // Concat any emit errors
        let allDiagnostics = preEmitDiagnostics.concat( emitResult.diagnostics as ts.Diagnostic[] );
        
        // If the emitter didn't emit anything, then pass that value along.
        if ( emitResult.emitSkipped ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, allDiagnostics );
        }

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( this.compilerOptions.noEmitOnError && allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics );
        }

        // Emit the output files even if errors ( noEmitOnError is false ).

        // Stream the emitted files...
        let bundleDir = path.dirname( bundleFile.path );
        let bundleName = path.basename( bundleFile.path, bundleFile.extension );
        let bundlePrefixExt = minifyBundle ? ".min" : "";

        let jsBundlePath = TsCore.normalizeSlashes( path.join( bundleDir, bundleName + bundlePrefixExt + ".js" ) );

        // js should have been generated, but just in case!
        if ( Utils.hasProperty( outputText, jsBundlePath ) ) {
            let jsContents = outputText[ jsBundlePath ];
            if ( minifyBundle ) {
                // Whitespace removal cannot be performed in the AST minification transform, so we do it here for now
                let minifier = new BundleMinifier( this.program, compilerOptions, bundleConfig );
                jsContents = minifier.removeWhitespace( jsContents );
                
            }
            Logger.info( "Streaming vinyl js: ", bundleName );
            var bundleJsVinylFile = new VinylFile( {
                path: jsBundlePath,
                contents: Buffer.from( jsContents )
            });

            this.outputStream.push( bundleJsVinylFile );
        }

        let dtsBundlePath = TsCore.normalizeSlashes( path.join( bundleDir, bundleName + bundlePrefixExt + ".d.ts" ) );
        
        // d.ts is generated, if compiler option declaration is true
        if ( Utils.hasProperty( outputText, dtsBundlePath ) ) {
            Logger.info( "Streaming vinyl d.ts: ", dtsBundlePath );
            var bundleDtsVinylFile = new VinylFile( {
                path: dtsBundlePath,
                contents: Buffer.from( outputText[ dtsBundlePath ] )
            });

            this.outputStream.push( bundleDtsVinylFile );
        }

        let mapBundlePath = TsCore.normalizeSlashes( path.join( bundleDir, bundleName + bundlePrefixExt + ".js.map" ) );
        
        // js.map is generated, if compiler option sourceMap is true
        if ( Utils.hasProperty( outputText, mapBundlePath ) ) {
            Logger.info( "Streaming vinyl js.map: ", mapBundlePath );
            var bundleMapVinylFile = new VinylFile( {
                path: mapBundlePath,
                contents: Buffer.from( outputText[mapBundlePath] )
            });

            this.outputStream.push( bundleMapVinylFile );
        }

        this.compileTime = new Date().getTime() - this.compileTime;

        if ( this.compilerOptions.diagnostics )
            this.reportStatistics();

        if ( allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics );
        }
        else {
            return new CompilerResult( ts.ExitStatus.Success );
        }
    }

    private reportStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportTime( "Pre-emit time", this.preEmitTime );
        statisticsReporter.reportTime( "Emit time", this.emitTime );
        statisticsReporter.reportTime( "Compile time", this.compileTime );
    }
} 