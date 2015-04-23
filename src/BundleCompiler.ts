import { CompilerResult } from "./CompilerResult";
import { CompilerStatistics } from "./CompilerStatistics";
import { CompilerHost }  from "./CompilerHost";
import { CompileStream }  from "./CompileStream";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle } from "./BundleParser";
import { DependencyBuilder } from "./DependencyBuilder";
import * as utils from "./Utilities";

import ts = require( 'typescript' );
import fs = require( "fs" );
import path = require( 'path' );

export class BundleCompiler {

    private compilerHost: CompilerHost;
    private program: ts.Program;
    private compilerOptions: ts.CompilerOptions = { charset: "utf-8" };

    private outputText: ts.Map <string> = { };
    private bundleText: string = "";
    private bundleImportedFiles: ts.Map<string> = {};

    constructor( compilerHost: CompilerHost, program: ts.Program ) {
        this.compilerHost = compilerHost
        this.program = program;
    }

    public compileBundleToStream( outputStream: CompileStream, bundle: Bundle ): CompilerResult {
        var dependencyBuilder = new DependencyBuilder( this.compilerHost, this.program );

        let bundleSourceFileName = this.compilerHost.getCanonicalFileName( utils.normalizeSlashes( bundle.source ) );
        var bundleSourceFile = this.program.getSourceFile( bundleSourceFileName );

        var sourceDependencies = dependencyBuilder.getSourceFileDependencies( bundleSourceFile );

        this.bundleText = "";
        this.bundleImportedFiles = { };

        for ( var key in sourceDependencies ) {
            // Add module dependencies first..
            sourceDependencies[key].forEach( importSymbol => {
                if ( this.isCodeModule( importSymbol ) ) {
                    let declaration = importSymbol.getDeclarations()[0];
                    let importedSource = declaration.getSourceFile();
                    let importedSourceFileName = importedSource.fileName;

                    if ( !utils.hasProperty( this.bundleImportedFiles, importedSourceFileName ) ) {
                        this.addSourceFile( importedSource );
                    }
                }
            });

            // Add the source module as specified by key
            var dependentSourceFile = this.program.getSourceFile( key );
            let outputFileName = dependentSourceFile.fileName;

            if ( !utils.hasProperty( this.bundleImportedFiles, outputFileName ) ) {
                this.addSourceFile( dependentSourceFile );
            }
        }

        // Finally, add bundle source file
        let outputFileName = bundleSourceFile.fileName;
        this.addSourceFile( bundleSourceFile );

        var tsVinylFile = new TsVinylFile( {
            path: bundle.name + ".ts",
            contents: new Buffer( this.bundleText )
        });

        outputStream.push( tsVinylFile );

        // Compile the bundle to generate javascript and declaration file
        let result = this.compileBundle( bundle.name + ".ts", this.bundleText, this.program.getCompilerOptions() );

        var bundleJsVinylFile = new TsVinylFile( {
            path: bundle.name + ".js",
            contents: new Buffer( this.outputText[ bundle.name + ".js" ])
        });

        outputStream.push( bundleJsVinylFile );

        var bundleDtsVinylFile = new TsVinylFile( {
            path: bundle.name + ".d.ts",
            contents: new Buffer( this.outputText[bundle.name + ".d.ts"] )
        });

        outputStream.push( bundleDtsVinylFile );

        return result;
    }

    private isCodeModule( importSymbol: ts.Symbol ): boolean {
        let declaration = importSymbol.getDeclarations()[0];

        return ( declaration.kind === ts.SyntaxKind.SourceFile &&
            !( declaration.flags & ts.NodeFlags.DeclarationFile ) );
    }

    private editImportStatements( file: ts.SourceFile ): string {
        Logger.info( "---> editImportStatement()" );
        let editText = file.text;
        ts.forEachChild( file, node => {
            if ( node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration ) {
                let pos = node.pos;
                let end = node.end;

                // White out import statement. 
                // NOTE: Length needs to stay the same as original import statement
                let length = end - pos;
                let middle = "";
                for ( var i = 0; i < length; i++ ) {
                    middle += " ";
                }
                
                var prefix = editText.substring( 0, pos );
                var suffix = editText.substring( end );

                editText = prefix + middle + suffix;
            }
        });

        return editText;
    }

    private addSourceFile( file: ts.SourceFile ) {
        // Before adding the source text, we must white out import statement(s)
        let editText = this.editImportStatements( file );

        this.bundleText += editText + "\n";
        this.bundleImportedFiles[file.fileName] = file.fileName;
    }

    // Replace with Transpile function from typescript 1.5 when available
    private compileBundle( fileName: string, input: string, compilerOptions?: ts.CompilerOptions ): CompilerResult {
        let options = compilerOptions ? utils.clone( compilerOptions ) : ts.getDefaultCompilerOptions();

        // Parse
        var inputFileName = fileName;
        var sourceFile = ts.createSourceFile( inputFileName, input, options.target, true );

        // Clear bundle output text
        this.outputText = {};

        // Create a compilerHost object to allow the compiler to read and write files
        var bundlerCompilerHost: ts.CompilerHost = {
            getSourceFile: ( fileName, languageVersion ) => {
                Logger.info( "getSourceFile(): ", path.normalize( fileName ) );
                if ( path.normalize( fileName ) === path.normalize( ts.getDefaultLibFilePath( this.compilerOptions ) )  ){
                    let libSourceText = fs.readFileSync( fileName ).toString( "utf8" );
                    var libSourceFile = ts.createSourceFile( fileName, libSourceText, languageVersion );

                    return libSourceFile;
                }
                else {
                    return fileName === inputFileName ? sourceFile : undefined
                }
            },
            writeFile: ( name, text, writeByteOrderMark ) => {
                Logger.info( "writeFile() with: ", name );
                this.outputText[name] = text;
            },
            getDefaultLibFileName: () => ts.getDefaultLibFilePath( this.compilerOptions ),
            useCaseSensitiveFileNames: () => false,
            getCanonicalFileName: fileName => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n"
        };

        var bundlerProgram = ts.createProgram( [inputFileName], options, bundlerCompilerHost );

        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics( bundlerProgram );

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( bundlerProgram ), preEmitDiagnostics );
        }

        let emitTime = 0;
        let startTime = new Date().getTime();

        var emitResult = bundlerProgram.emit();

        emitTime += new Date().getTime() - startTime;

        // If the emitter didn't emit anything, then pass that value along.
        if ( emitResult.emitSkipped ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( bundlerProgram, 0 ), emitResult.diagnostics );
        }

        let allDiagnostics = preEmitDiagnostics.concat( emitResult.diagnostics );

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics( bundlerProgram, emitTime ), allDiagnostics );
        }

        return new CompilerResult( ts.ExitStatus.Success, new CompilerStatistics( bundlerProgram, emitTime ) );
    }
} 