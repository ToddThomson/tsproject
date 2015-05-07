import { Logger } from "./Logger";

import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( "path" );
import * as utilities from "./Utilities";
import * as tsCore from "./TsCore";

export class DependencyBuilder {
    private host: ts.CompilerHost;
    private program: ts.Program;
    private options: ts.CompilerOptions;
    private moduleImportsByName: ts.Map<ts.Symbol[]> = {};

    constructor( host: ts.CompilerHost, program: ts.Program ) {
        this.host = host;
        this.program = program;
        this.options = this.program.getCompilerOptions();
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

        var importSymbols: ts.Symbol[] = [];
        var self = this;
        
        function getImports( searchNode: ts.Node ) {
            ts.forEachChild( searchNode, node => {
                if ( node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration ) {
                    let moduleNameExpr = tsCore.getExternalModuleName( node );

                    if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
                        let moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );

                        if ( moduleSymbol ) {
                            importSymbols.push( moduleSymbol );
                        }
                        else {
                            Logger.warn( "Module symbol not found" );
                        }
                    }
                }
                else if ( node.kind === ts.SyntaxKind.ModuleDeclaration && ( <ts.ModuleDeclaration>node ).name.kind === ts.SyntaxKind.StringLiteral && ( node.flags & ts.NodeFlags.Ambient || tsCore.isDeclarationFile( file ) ) ) {
                    // An AmbientExternalModuleDeclaration declares an external module. 
                    Logger.info( "Processing ambient module declaration..." );
                    getImports(( <ts.ModuleDeclaration>node ).body );
                }
            });
        };

        getImports( file );

        return importSymbols;
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