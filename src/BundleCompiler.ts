import { CompilerResult } from "./CompilerResult";
import { CompilerStatistics } from "./CompilerStatistics";
import { CompilerHost }  from "./CompilerHost";
import { CompileStream }  from "./CompileStream";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle } from "./BundleParser";
import { DependencyBuilder } from "./DependencyBuilder";
import * as utils from "./Utilities";
import * as tsCore from "./TsCore";

import ts = require( 'typescript' );
import fs = require( "fs" );
import path = require( 'path' );

export class BundleCompiler {

    private compilerHost: CompilerHost;
    private program: ts.Program;
    private compilerOptions: ts.CompilerOptions;

    private outputText: ts.Map <string> = {};
    private bundleText: string = "";
    private bundleImportedFiles: ts.Map<string> = {};
    private bundleSourceFiles: ts.Map<string> = {};

    constructor( compilerHost: CompilerHost, program: ts.Program ) {
        this.compilerHost = compilerHost
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }

    public compileBundleToStream( outputStream: CompileStream, bundle: Bundle ): CompilerResult {
        let dependencyBuilder = new DependencyBuilder( this.compilerHost, this.program );

        // Construct bundle output file name
        let bundleBaseDir = path.dirname( bundle.name );

        if ( bundle.config.outDir ) {
            bundleBaseDir = path.normalize( path.resolve( bundleBaseDir, bundle.config.outDir) );
            Logger.info( "Adjusting bundleBaseDir to: ", bundleBaseDir );
        }

        let bundleFilePath = path.join( bundleBaseDir, path.basename( bundle.name ) );
        Logger.info( "Bundle full path name: ", bundleFilePath );

        // We now have an array of files to bundle together..
        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleSourceFiles = {};

        let allDependencies: ts.Map<ts.Symbol[]> = {};

        for ( var filesKey in bundle.files ) {
            let fileName = bundle.files[filesKey];
            Logger.info( "Processing bundle file:", fileName );

            let bundleSourceFileName = this.compilerHost.getCanonicalFileName( tsCore.normalizeSlashes( fileName ) );
            Logger.info( "BundleSourceFileName:", bundleSourceFileName );

            let bundleSourceFile = this.program.getSourceFile( bundleSourceFileName );

            if ( !bundleSourceFile ) {
                let diagnostic = tsCore.createDiagnostic( { code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle Source File '{0}' not found." }, bundleSourceFileName );
                return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( this.program, 0 ), [diagnostic] );
            }

            let sourceDependencies = dependencyBuilder.getSourceFileDependencies( bundleSourceFile );

            // merge current bundle file dependencies into all dependencies
            for ( var key in sourceDependencies ) {
                if ( !utils.hasProperty( allDependencies, key ) ) {
                    allDependencies[key] = sourceDependencies[key];
                }
            }

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
                let dependentSourceFile = this.program.getSourceFile( key );
                let outputFileName = dependentSourceFile.fileName;

                if ( !utils.hasProperty( this.bundleImportedFiles, outputFileName ) ) {
                    this.addSourceFile( dependentSourceFile );
                }
            }

            // Finally, add bundle source file
            this.addSourceFile( bundleSourceFile );
        }

        Logger.info( "Streaming vinyl ts: ", bundleFilePath + ".ts" );
        var tsVinylFile = new TsVinylFile( {
            path: bundleFilePath + ".ts",
            contents: new Buffer( this.bundleText )
        });

        outputStream.push( tsVinylFile );

        // Compile the bundle to generate javascript and declaration file
        let compileResult = this.compileBundle( path.basename(bundle.name ) + ".ts", this.bundleText );
        let compileStatus = compileResult.getStatus();

        // Only stream bundle if there is some compiled output
        if ( compileStatus !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped ) {
            
            // js should have been generated, but just in case!
            if ( utils.hasProperty( this.outputText, path.basename( bundle.name ) + ".js" ) ) {
                Logger.info( "Streaming vinyl js: ", bundleFilePath + ".js" );
                var bundleJsVinylFile = new TsVinylFile( {
                    path: path.join( bundleFilePath + ".js" ),
                    contents: new Buffer( this.outputText[path.basename( bundle.name ) + ".js"] )
                });

                outputStream.push( bundleJsVinylFile );
            }
        }

        // Only stream bundle definition if the compile was successful
        if ( compileStatus === ts.ExitStatus.Success ) {
            
            // d.ts should have been generated, but just in case
            if ( utils.hasProperty( this.outputText, path.basename( bundle.name ) + ".d.ts" ) ) {
                Logger.info( "Streaming vinyl d.ts: ", bundleFilePath + "d.ts" );
                var bundleDtsVinylFile = new TsVinylFile( {
                    path: path.join( bundleFilePath + ".d.ts" ),
                    contents: new Buffer( this.outputText[ path.basename( bundle.name ) + ".d.ts"] )
                });

                outputStream.push( bundleDtsVinylFile );
            }
        }

        return compileResult;
    }

    private processImportStatements( file: ts.SourceFile ): string {
        let editText = file.text;

        ts.forEachChild( file, node => {
            if ( node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration ) {
                let moduleNameExpr = tsCore.getExternalModuleName( node );

                if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
                    let moduleSymbol = this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );

                    if ( ( moduleSymbol ) && ( this.isCodeModule( moduleSymbol ) ) ) {

                        Logger.info( ".. symbol: ", moduleSymbol.name, node.pos, node.end );

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
                }
            }
            else {
                //Logger.info( "passing node: ", node.getFullText() );
            }
        });

        return editText;
    }

    private addSourceFile( file: ts.SourceFile ) {
        Logger.info( "Entering addSourceFile() with: ", file.fileName );

        if ( this.isCodeSourceFile( file ) ) {
            // Before adding the source text, we must white out import statement(s)
            let editText = this.processImportStatements( file );

            this.bundleText += editText + "\n";
            this.bundleImportedFiles[file.fileName] = file.fileName;
        }
        else {
            // Add d.ts files to the build source files context
            if ( !utils.hasProperty( this.bundleSourceFiles, file.fileName ) ) {
                Logger.info( "Adding definition file to bundle source context: ", file.fileName );
                this.bundleSourceFiles[file.fileName] = file.text;
            }
        }
    }

    // Replace with Transpile function from typescript 1.5 when available
    private compileBundle( bundleFileName: string, bundleText: string ): CompilerResult {

        // Create bundle source file
        var bundleSourceFile = ts.createSourceFile( bundleFileName, bundleText, this.compilerOptions.target );
        this.bundleSourceFiles[bundleFileName] = bundleText;

        // Clear bundle output text
        this.outputText = {};

        // Create a compilerHost object to allow the compiler to read and write files
        var bundlerCompilerHost: ts.CompilerHost = {
            getSourceFile: ( fileName, languageVersion ) => {
                Logger.info( "getSourceFile(): ", path.normalize( fileName ) );
                if ( path.normalize( fileName ) === path.normalize( ts.getDefaultLibFilePath( this.compilerOptions ) ) ) {
                    let libSourceText = fs.readFileSync( fileName ).toString( "utf8" );
                    var libSourceFile = ts.createSourceFile( fileName, libSourceText, languageVersion );

                    return libSourceFile;
                }
                else if ( utils.hasProperty( this.bundleSourceFiles, fileName ) ) {
                    Logger.info( "getSourceFile() found included file: ", fileName );
                    return ts.createSourceFile( fileName, this.bundleSourceFiles[ fileName ], languageVersion );
                }
                 
                if ( fileName === bundleFileName ) {
                    Logger.info( "getSourceFile() found: ", fileName );
                    return bundleSourceFile;
                }
                Logger.warn( " getSourceFile(): file not found: ", fileName );

                return undefined;
            },
            writeFile: ( name, text, writeByteOrderMark ) => {
                this.outputText[name] = text;
            },
            getDefaultLibFileName: () => ts.getDefaultLibFilePath( this.compilerOptions ),
            useCaseSensitiveFileNames: () => false,
            getCanonicalFileName: fileName => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n"
        };

        // Get bundleSourceFileNames

        let bundleFiles: string[] = [];
        for ( let key in this.bundleSourceFiles ) {
            bundleFiles.push(key);
        }

        Logger.info( "bundle files: ", bundleFiles );

        var bundlerProgram = ts.createProgram( bundleFiles, this.compilerOptions, bundlerCompilerHost );

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

    private isCodeSourceFile( file: ts.SourceFile ): boolean {
        return ( file.kind === ts.SyntaxKind.SourceFile &&
            !( file.flags & ts.NodeFlags.DeclarationFile ) );
    }

    private isCodeModule( importSymbol: ts.Symbol ): boolean {
        let declaration = importSymbol.getDeclarations()[0];

        return ( declaration.kind === ts.SyntaxKind.SourceFile &&
            !( declaration.flags & ts.NodeFlags.DeclarationFile ) );
    }

    
} 