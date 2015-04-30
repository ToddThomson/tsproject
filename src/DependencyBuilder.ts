import { Logger } from "./Logger";

import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( "path" );
import * as utilities from "./Utilities";

export class DependencyBuilder {
    private host: ts.CompilerHost;
    private program: ts.Program;
    private options: ts.CompilerOptions;
    private moduleImportsByName: ts.Map<ts.Symbol[]> = {};

    constructor( host: ts.CompilerHost, program: ts.Program ) {
        this.host = host;
        this.program = program;
        this.options = this.program.getCompilerOptions();

        //this.buildDependencyGraph();
    }

    public dumpDependencyGraph() {
        Logger.log( this.moduleImportsByName );
    }

    public getSourceFileDependencies( sourceFile: ts.SourceFile ): ts.Map<ts.Symbol[]> {
        var self = this;
        Logger.info( "---> Entering getSourceFileDependencies()" );
        var dependencies: ts.Map<ts.Symbol[]> = {};
        var importWalked: ts.Map<boolean> = {};

        function walkModuleImports( sourceFile: ts.SourceFile ) {
            Logger.info( "---> Entering walkModuleImports() with: ", sourceFile.fileName );
            self.getImportsOfModule( sourceFile ).forEach( importSymbol => {
                let symbolSourceFile = self.getSourceFileFromSymbol( importSymbol );
                let canonicalFileName = self.host.getCanonicalFileName( symbolSourceFile.fileName );

                // Don't walk imports that we've already processed
                if ( !utilities.hasProperty( importWalked, canonicalFileName ) ) {
                    importWalked[canonicalFileName] = true;

                    // Build dependencies bottom up, left to right
                    walkModuleImports( symbolSourceFile );
                }
                
                if ( !utilities.hasProperty( dependencies, canonicalFileName ) ) {
                    dependencies[canonicalFileName] = self.getImportsOfModule( symbolSourceFile );
                }
            });
        }

        walkModuleImports( sourceFile );

        return dependencies;
    }

    public getImportsOfModule( file: ts.SourceFile ): ts.Symbol[] {
        Logger.info( "---> Entering getImportsOfModule() for file: ", file.fileName );

        let importSymbols: ts.Symbol[] = [];

        ts.forEachChild( file, node => {
            if ( node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration ) {
                let moduleNameExpr = this.getExternalModuleName( node );
                Logger.info( "Import kind: ", moduleNameExpr.kind );

                if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
                    let moduleSymbol = this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );

                    if ( moduleSymbol ) {
                        importSymbols.push( moduleSymbol );
                    }
                    else {
                        Logger.warn( "Module symbol NOT FOUND" );
                    }
                }
            }
            else if ( node.kind === ts.SyntaxKind.ModuleDeclaration && ( <ts.ModuleDeclaration>node ).name.kind === ts.SyntaxKind.StringLiteral && ( node.flags & ts.NodeFlags.Ambient || utilities.isDeclarationFile( file ) ) ) {
                // An AmbientExternalModuleDeclaration declares an external module. 
                Logger.info( "Processing ambient module declaration..." );
                ts.forEachChild(( <ts.ModuleDeclaration>node ).body, node => {
                    Logger.info( "Investigating node..." );
                    if ( this.isExternalModuleImportEqualsDeclaration( node ) &&
                        this.getExternalModuleImportEqualsDeclarationExpression( node ).kind === ts.SyntaxKind.StringLiteral ) {
                        let nameLiteral = <ts.LiteralExpression>this.getExternalModuleImportEqualsDeclarationExpression( node );
                        let moduleName = nameLiteral.text;
                        Logger.info( "Module name: ", moduleName );

                        if ( moduleName ) {
                        }
                    }
                    else {
                        Logger.info( "No child module name" );
                    }
                });
            }
        });

        return importSymbols;
    }

    private buildDependencyGraph() {
        Logger.info( "---> Entering buildDependecyGraph()" );
        this.program.getSourceFiles().forEach( sourceFile => {
            let canonicalFileName = this.host.getCanonicalFileName( sourceFile.fileName );

            if ( !utilities.hasProperty( this.moduleImportsByName, canonicalFileName ) ) {

                this.moduleImportsByName[canonicalFileName] = [];

                this.getImportsOfModule( sourceFile ).forEach( importSymbol => {
                    let importFile = this.getSourceFileFromSymbol( importSymbol );
                    this.moduleImportsByName[canonicalFileName].push( importSymbol );
                    this.processSourceFileDependencies( this.getSourceFileFromSymbol( importSymbol ) );
                });
            }
        });
    }

    private processSourceFileDependencies( sourceFile: ts.SourceFile ) {
        Logger.info( "---> Entering processSourceFileDependencies() for file: ", sourceFile.fileName );
        let canonicalSourceFileName = this.host.getCanonicalFileName( sourceFile.fileName );

        // If we've haven't visited this module yet, get it's dependencies
        if ( !utilities.hasProperty( this.moduleImportsByName, canonicalSourceFileName ) ) {
            this.moduleImportsByName[ canonicalSourceFileName ] = [];

            this.getImportsOfModule( sourceFile ).forEach( importSymbol => {
                this.moduleImportsByName[canonicalSourceFileName].push( importSymbol );
                let importFile = this.getSourceFileFromSymbol( importSymbol );
                let canonicalImportFileName = this.host.getCanonicalFileName( importFile.fileName );
                
                // If we haven't visited this import, we need to walk it's dependencies
                if ( !utilities.hasProperty( this.moduleImportsByName, canonicalImportFileName ) ) {
                    this.processSourceFileDependencies( importFile );
                }
            });
        }
    }

    private getExternalModuleName( node: ts.Node ): ts.Expression {
        if ( node.kind === ts.SyntaxKind.ImportDeclaration ) {
            return ( <ts.ImportDeclaration>node ).moduleSpecifier;
        }
        if ( node.kind === ts.SyntaxKind.ImportEqualsDeclaration ) {
            let reference = ( <ts.ImportEqualsDeclaration>node ).moduleReference;
            if ( reference.kind === ts.SyntaxKind.ExternalModuleReference ) {
                return ( <ts.ExternalModuleReference>reference ).expression;
            }
        }
        if ( node.kind === ts.SyntaxKind.ExportDeclaration ) {
            return ( <ts.ExportDeclaration>node ).moduleSpecifier;
        }
    }

    private isExternalModuleImportEqualsDeclaration( node: ts.Node ) {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration && ( <ts.ImportEqualsDeclaration>node ).moduleReference.kind === ts.SyntaxKind.ExternalModuleReference;
    }

    private getExternalModuleImportEqualsDeclarationExpression( node: ts.Node ) {
        return ( <ts.ExternalModuleReference>( <ts.ImportEqualsDeclaration>node ).moduleReference ).expression;
    }

    private getSourceFileFromSymbol( importSymbol: ts.Symbol ): ts.SourceFile {
        let declaration = importSymbol.getDeclarations()[0];
        let isCodeModule = declaration.kind === ts.SyntaxKind.SourceFile &&
            !( declaration.flags & ts.NodeFlags.DeclarationFile );
        let file = declaration.getSourceFile();

        return file;
    }
}