import { CompilerResult } from "./CompilerResult";
import { StatisticsReporter } from "./StatisticsReporter";
import { WatchCompilerHost }  from "./WatchCompilerHost";
import { CompileStream }  from "./CompileStream";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle, BundleConfig } from "./BundleParser";
import { BundleResult, BundleFile } from "./BundleResult";
import { DependencyBuilder } from "./DependencyBuilder";
import { Glob } from "./Glob";

import { Utils } from "./Utilities";
import { TsCore } from "./TsCore";

import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( 'path' );

export class BundleCompiler {

    private compilerHost: WatchCompilerHost;
    private program: ts.Program;
    private outputStream: CompileStream;
    private compilerOptions: ts.CompilerOptions;

    private emitTime: number = 0;
    private compileTime: number = 0;
    private preEmitTime: number = 0;

    private bundleSourceFiles: ts.Map<string> = {};

    constructor( compilerHost: WatchCompilerHost, program: ts.Program, outputStream: CompileStream ) {
        this.compilerHost = compilerHost
        this.program = program;
        this.outputStream = outputStream;
        this.compilerOptions = this.program.getCompilerOptions();
    }

    public compile( bundleFile: BundleFile, bundleConfig: BundleConfig ): CompilerResult {
        Logger.log( "Compiling bundle files..." );

        this.compileTime = this.preEmitTime = new Date().getTime();

        let outputText: ts.Map<string> = {};
        let defaultGetSourceFile: ( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ) => ts.SourceFile;

        let bundleFileName = bundleFile.path;
        let bundleFileText = bundleFile.text;
        
        var bundleSourceFile = ts.createSourceFile( bundleFile.path, bundleFile.text, this.compilerOptions.target );
        this.bundleSourceFiles[ bundleFileName ] = bundleFileText;
        
        // Reuse the project program source files
        Utils.forEach( this.program.getSourceFiles(), file => {
            this.bundleSourceFiles[ file.fileName ] = file.text;
        });

        function writeFile( fileName: string, data: string, writeByteOrderMark: boolean, onError?: ( message: string ) => void ) {
            outputText[ fileName ] = data;
        }

        function getSourceFile( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ): ts.SourceFile {
            if ( fileName === bundleFileName ) {
                return bundleSourceFile;
            }
            // Use base class to get the source file
            let sourceFile: TsCore.WatchedSourceFile = defaultGetSourceFile( fileName, languageVersion, onError );

            return sourceFile;
        }

        // Override the compileHost getSourceFile() function to get the bundle source file
        defaultGetSourceFile = this.compilerHost.getSourceFile;
        this.compilerHost.getSourceFile = getSourceFile;
        this.compilerHost.writeFile = writeFile;

        // Get the list of bundle files to pass to program 
        let bundleFiles: string[] = [];
        bundleFiles.push( bundleFileName );

        Utils.forEach( this.program.getSourceFiles(), file => {
            bundleFiles.push( file.fileName );
        });

        // Allow bundle config to extent the project compilerOptions for declaration and source map emitted output
        let compilerOptions = this.compilerOptions;
        
        compilerOptions.declaration = bundleConfig.declaration || this.compilerOptions.declaration;
        compilerOptions.sourceMap = bundleConfig.sourceMap || this.compilerOptions.sourceMap;
        compilerOptions.noEmit = false; // Always emit bundle output

        // Pass the current project build program to reuse program structure
        var bundlerProgram = ts.createProgram( bundleFiles, compilerOptions, this.compilerHost );//CompilerHost, this.program );

        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics( bundlerProgram );

        this.preEmitTime = new Date().getTime() - this.preEmitTime;

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, preEmitDiagnostics );
        }

        this.emitTime = new Date().getTime();

        var emitResult = bundlerProgram.emit( bundleSourceFile );

        this.emitTime = new Date().getTime() - this.emitTime;

        // If the emitter didn't emit anything, then pass that value along.
        if ( emitResult.emitSkipped ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped );//, emitResult.diagnostics );
        }

        let allDiagnostics = preEmitDiagnostics.concat( emitResult.diagnostics );

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics );
        }

        // Stream the bundle source file ts, and emitted files...
        Logger.info( "Streaming vinyl bundle source: ", bundleFile.path );
        var tsVinylFile = new TsVinylFile( {
            path: bundleFile.path,
            contents: new Buffer( bundleFile.text )
        });

        this.outputStream.push( tsVinylFile );
            
        let bundleDir = path.dirname( bundleFile.path );
        let bundleName = path.basename( bundleFile.path, bundleFile.extension );

        let jsBundlePath = TsCore.normalizeSlashes( path.join( bundleDir, bundleName + ".js" ) );

        // js should have been generated, but just in case!
        if ( Utils.hasProperty( outputText, jsBundlePath ) ) {
            Logger.info( "Streaming vinyl js: ", bundleName );
            var bundleJsVinylFile = new TsVinylFile( {
                path: jsBundlePath,
                contents: new Buffer( outputText[ jsBundlePath ] )
            });

            this.outputStream.push( bundleJsVinylFile );
        }

        let dtsBundlePath = TsCore.normalizeSlashes( path.join( bundleDir, bundleName + ".d.ts" ) );
        
        // d.ts is generated, if compiler option declaration is true
        if ( Utils.hasProperty( outputText, dtsBundlePath ) ) {
            Logger.info( "Streaming vinyl d.ts: ", dtsBundlePath );
            var bundleDtsVinylFile = new TsVinylFile( {
                path: dtsBundlePath,
                contents: new Buffer( outputText[ dtsBundlePath ] )
            });

            this.outputStream.push( bundleDtsVinylFile );
        }

        let mapBundlePath = TsCore.normalizeSlashes( path.join( bundleDir, bundleName + ".js.map" ) );
        
        // js.map is generated, if compiler option sourceMap is true
        if ( Utils.hasProperty( outputText, mapBundlePath ) ) {
            Logger.info( "Streaming vinyl js.map: ", mapBundlePath );
            var bundleMapVinylFile = new TsVinylFile( {
                path: mapBundlePath,
                contents: new Buffer( outputText[mapBundlePath] )
            });

            this.outputStream.push( bundleMapVinylFile );
        }

        this.compileTime = new Date().getTime() - this.compileTime;

        if ( this.compilerOptions.diagnostics )
            this.reportStatistics();

        return new CompilerResult( ts.ExitStatus.Success );
    }

    private reportStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportTime( "Pre-emit time", this.preEmitTime );
        statisticsReporter.reportTime( "Emit time", this.emitTime );
        statisticsReporter.reportTime( "Compile time", this.compileTime );
    }
} 