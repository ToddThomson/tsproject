import { CompilerResult } from "./CompilerResult";
import { StatisticsReporter } from "./StatisticsReporter";
import { WatchCompilerHost }  from "./WatchCompilerHost";
import { CompileStream }  from "./CompileStream";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle } from "./BundleParser";
import { BundleResult } from "./BundleResult";
import { DependencyBuilder } from "./DependencyBuilder";
import { Glob } from "./Glob";

import { Utils } from "./Utilities";
import { TsCore } from "./TsCore";

import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( 'path' );

export class BundleBuilder {

    private compilerHost: WatchCompilerHost;
    private program: ts.Program;

    private dependencyTime = 0;
    private dependencyWalkTime = 0;
    private emitTime = 0;
    private buildTime = 0;

    private bundleText: string = "";
    private bundleImportedFiles: ts.Map<string> = {};
    private bundleModuleImports: ts.Map<ts.Map<string>> = {};
    private bundleSourceFiles: ts.Map<string> = {};

    constructor( compilerHost: WatchCompilerHost, program: ts.Program ) {
        this.compilerHost = compilerHost
        this.program = program;
    }

    public build( bundle: Bundle ): BundleResult {
        this.buildTime = new Date().getTime();

        let dependencyBuilder = new DependencyBuilder( this.compilerHost, this.program );

        // Construct bundle output file name
        let bundleBaseDir = path.dirname( bundle.name );

        if ( bundle.config.outDir ) {
            bundleBaseDir = path.join( bundleBaseDir, bundle.config.outDir );
        }

        let bundleFilePath = path.join( bundleBaseDir, path.basename( bundle.name ) );
        bundleFilePath = TsCore.normalizeSlashes( bundleFilePath );

        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleModuleImports = {};
        this.bundleSourceFiles = {};

        // Look for tsx source files in bunle name or bundle dependencies.
        // Output tsx for bundle extension if typescript react files found

        var isBundleTsx = false;

        let allDependencies: ts.Map<ts.Node[]> = {};

        for ( var filesKey in bundle.fileNames ) {
            let fileName = bundle.fileNames[filesKey];
            Logger.info( ">>> Processing bundle file:", fileName );

            let bundleSourceFileName = this.compilerHost.getCanonicalFileName( TsCore.normalizeSlashes( fileName ) );
            Logger.info( "BundleSourceFileName:", bundleSourceFileName );

            let bundleSourceFile = this.program.getSourceFile( bundleSourceFileName );

            if ( !bundleSourceFile ) {
                let diagnostic = TsCore.createDiagnostic( { code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle Source File '{0}' not found." }, bundleSourceFileName );

                return new BundleResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, [diagnostic] );
            }

            // Check for TSX
            if ( bundleSourceFile.languageVariant == ts.LanguageVariant.JSX ) {
                isBundleTsx = true;
            }

            // Get bundle source file dependencies...
            let startTime = new Date().getTime();

            let sourceDependencies = dependencyBuilder.getSourceFileDependencies( bundleSourceFile );

            this.dependencyTime += new Date().getTime() - startTime;

            // Merge current bundle file dependencies into all dependencies
            for ( var mergeKey in sourceDependencies ) {
                if ( !Utils.hasProperty( allDependencies, mergeKey ) ) {
                    allDependencies[mergeKey] = sourceDependencies[mergeKey];
                }
            }

            startTime = new Date().getTime();

            Logger.info( "traversing source dependencies for: ", bundleSourceFile.fileName );
            for ( var depKey in sourceDependencies ) {
                // Add module dependencies first..
                sourceDependencies[depKey].forEach( importNode => {
                    var importSymbol = this.getSymbolFromNode( importNode );

                    if ( this.isCodeModule( importSymbol ) ) {
                        let declaration = importSymbol.getDeclarations()[0];
                        let importedSource = declaration.getSourceFile();
                        let importedSourceFileName = importedSource.fileName;

                        if ( !Utils.hasProperty( this.bundleImportedFiles, importedSourceFileName ) ) {
                            this.addSourceFile( importedSource );
                        }
                    }
                    else {
                        if ( importNode.kind === ts.SyntaxKind.ImportEqualsDeclaration ) {
                            // For ImportEqualsDeclarations we emit the import declaration
                            // if it hasn't already been added to the bundle.

                            // Get the import and module names
                            let importName = ( <ts.ImportEqualsDeclaration>importNode ).name.text;
                            var moduleName = this.getImportModuleName( <ts.ImportEqualsDeclaration>importNode );

                            if ( this.addModuleImport( moduleName, importName ) ) {
                                this.emitModuleImportDeclaration( importNode.getText() );
                            }
                        }
                        else {
                            // ImportDeclaration kind..
                            this.writeImportDeclaration( <ts.ImportDeclaration>importNode );
                        }
                    }
                });
            }

            // Finally, add bundle source file
            this.addSourceFile( bundleSourceFile );

            this.dependencyWalkTime += new Date().getTime() - startTime;
        }

        var bundleExtension = isBundleTsx ? ".tsx" : ".ts";
        var bundleSourceFile = { path: bundleFilePath + bundleExtension, extension: bundleExtension, text: this.bundleText };

        this.buildTime = new Date().getTime() - this.buildTime;

        if ( this.program.getCompilerOptions().diagnostics ) {
            this.reportStatistics();
        }

        return new BundleResult( ts.ExitStatus.Success, undefined, bundleSourceFile );
    }

    private getImportModuleName( node: ts.ImportEqualsDeclaration ): string {

        if ( node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference ) {
            let moduleReference = ( <ts.ExternalModuleReference>node.moduleReference );
            return ( <ts.LiteralExpression>moduleReference.expression ).text;
        }
        else {
            // TJT: This code should never be hit as we currently do not process dependencies of this kind. 
            return ( <ts.EntityName>node.moduleReference ).getText();
        }
    }

    private addModuleImport( moduleName: string, importName: string ): boolean {

        if ( !Utils.hasProperty( this.bundleModuleImports, moduleName ) ) {
            this.bundleModuleImports[moduleName] = {};
        }

        var moduleImports = this.bundleModuleImports[moduleName];

        if ( !Utils.hasProperty( moduleImports, importName ) ) {
            moduleImports[importName] = importName;

            return true;
        }

        return false;
    }

    private writeImportDeclaration( node: ts.ImportDeclaration ) {

        if ( !node.importClause ) {
            return;
        }

        let moduleName = ( <ts.LiteralExpression>node.moduleSpecifier ).text;

        var importToWrite = "import ";
        var hasDefaultBinding = false;
        var hasNamedBindings = false;

        if ( node.importClause ) {
            if ( node.importClause.name && this.addModuleImport( moduleName, node.importClause.name.text ) ) {
                importToWrite += node.importClause.name.text;
                hasDefaultBinding = true;
            }
        }

        if ( node.importClause.namedBindings ) {
            if ( node.importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport ) {
                if ( this.addModuleImport( moduleName, ( <ts.NamespaceImport>node.importClause.namedBindings ).name.text ) ) {
                    if ( hasDefaultBinding ) {
                        importToWrite += ", ";
                    }

                    importToWrite += "* as ";
                    importToWrite += ( <ts.NamespaceImport>node.importClause.namedBindings ).name.text;

                    hasNamedBindings = true;
                }
            }
            else {
                if ( hasDefaultBinding ) {
                    importToWrite += ", ";
                }

                importToWrite += "{ ";

                Utils.forEach(( <ts.NamedImports>node.importClause.namedBindings ).elements, element => {
                    if ( this.addModuleImport( moduleName, element.name.text ) ) {
                        if ( !hasNamedBindings ) {
                            hasNamedBindings = true;
                        }
                        else {
                            importToWrite += ", ";
                        }

                        let alias = element.propertyName;

                        if ( alias ) {
                            importToWrite += alias.text + " as " + element.name.text;
                        }
                        else {
                            importToWrite += element.name.text;
                        }
                    }
                });

                importToWrite += " }";
            }
        }

        importToWrite += " from ";
        importToWrite += node.moduleSpecifier.getText();
        importToWrite += ";";

        if ( hasDefaultBinding || hasNamedBindings ) {
            this.emitModuleImportDeclaration( importToWrite );
        }
    }

    private processImportStatements( file: ts.SourceFile ): string {
        Logger.info( "Processing import statements in file: ", file.fileName );
        let editText = file.text;

        ts.forEachChild( file, node => {
            if ( node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration ) {
                Logger.info( "processImportStatements() found import" );
                let moduleNameExpr = TsCore.getExternalModuleName( node );

                if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {

                    let moduleSymbol = this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );

                    if ( ( moduleSymbol ) && ( this.isCodeModule( moduleSymbol ) || this.isAmbientModule ) ) {
                        Logger.info( "processImportStatements() removing code module symbol" );
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
        });

        return editText;
    }

    private emitModuleImportDeclaration( moduleBlockText: string ) {
        Logger.info( "Entering emitModuleImportDeclaration()" );

        this.bundleText += moduleBlockText + "\n";
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
            if ( !Utils.hasProperty( this.bundleSourceFiles, file.fileName ) ) {
                Logger.info( "Adding definition file to bundle source context: ", file.fileName );
                this.bundleSourceFiles[file.fileName] = file.text;
            }
        }
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

    private isAmbientModule( importSymbol: ts.Symbol ): boolean {
        let declaration = importSymbol.getDeclarations()[0];

        return ( ( declaration.kind === ts.SyntaxKind.ModuleDeclaration ) && ( ( declaration.flags & ts.NodeFlags.Ambient ) > 0 ) );
    }

    // TJT: Review duplicate code. Move to TsCore pass program as arg.
    private getSymbolFromNode( node: ts.Node ): ts.Symbol {
        let moduleNameExpr = TsCore.getExternalModuleName( node );

        if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
            return this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );
        }
    }

    private reportStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportTime( "Deps gen time", this.dependencyTime );
        statisticsReporter.reportTime( "Deps walk time", this.dependencyWalkTime );
        statisticsReporter.reportTime( "Source gen time", this.buildTime );
    }
}