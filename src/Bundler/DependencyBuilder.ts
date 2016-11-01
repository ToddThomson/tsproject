import { Logger } from "../Reporting/Logger";
import { Utils } from "../Utils/Utilities";
import { TsCore } from "../Utils/TsCore";

import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

export class DependencyBuilder {
    private host: ts.CompilerHost;
    private program: ts.Program;
    private options: ts.CompilerOptions;
    private moduleImportsByName: ts.MapLike<ts.Symbol[]> = {};

    constructor( host: ts.CompilerHost, program: ts.Program ) {
        this.host = host;
        this.program = program;
        this.options = this.program.getCompilerOptions();
    }

    public getSourceFileDependencies( sourceFile: ts.SourceFile ): ts.MapLike<ts.Node[]> {
        var self = this;
        var dependencies: ts.MapLike<ts.Node[]> = {};
        var importWalked: ts.MapLike<boolean> = {};

        function walkModuleImports( importNodes: ts.Node[] ) {
            importNodes.forEach( importNode => {
                // Get the import symbol for the import node
                let importSymbol = self.getSymbolFromNode( importNode );
                let importSymbolSourceFile = self.getSourceFileFromSymbol( importSymbol );
                let canonicalFileName = self.host.getCanonicalFileName( importSymbolSourceFile.fileName );
                
                Logger.info( "Import symbol file name: ", canonicalFileName );

                // Don't walk imports that we've already processed
                if ( !Utils.hasProperty( importWalked, canonicalFileName ) ) {
                    importWalked[canonicalFileName] = true;

                     // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    if ( !importSymbolSourceFile.isDeclarationFile )
                        walkModuleImports( self.getImportsOfModule( importSymbolSourceFile ) );
                }

                if ( !Utils.hasProperty( dependencies, canonicalFileName ) ) {
                    Logger.info( "Adding module import dependencies for file: ", canonicalFileName );
                    dependencies[canonicalFileName] = self.getImportsOfModule( importSymbolSourceFile );
                }
            });
        }

        // Get the top level source file imports
        var sourceFileImports = self.getImportsOfModule( sourceFile );

        // Walk the module import tree
        walkModuleImports( sourceFileImports );

        let canonicalSourceFileName = self.host.getCanonicalFileName( sourceFile.fileName );

        if (!Utils.hasProperty(dependencies, canonicalSourceFileName)) {
            Logger.info("Adding top level import dependencies for file: ", canonicalSourceFileName );
            dependencies[ canonicalSourceFileName ] = sourceFileImports;
        }

        return dependencies;
    }

    public getImportsOfModule( file: ts.SourceFile ): ts.Node[] {
        var importNodes: ts.Node[] = [];
        var self = this;
        
        function getImports( searchNode: ts.Node ) {
            ts.forEachChild(searchNode, node => {
                if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
                    Logger.info("Found import declaration");
                    let moduleNameExpr = TsCore.getExternalModuleName( node );

                    if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
                        let moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );

                        if ( moduleSymbol ) {
                            Logger.info("Adding import symbol: ", moduleSymbol.name, file.fileName) ;
                            importNodes.push( node );
                        }
                        else {
                            Logger.warn("Module symbol not found");
                        }
                    }
                }
                else if ( node.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.ModuleDeclaration>node).name.kind === ts.SyntaxKind.StringLiteral && ( node.flags & ts.NodeFlags.Ambient || file.isDeclarationFile ) ) {
                    // An AmbientExternalModuleDeclaration declares an external module.
                    var moduleDeclaration = <ts.ModuleDeclaration>node;
                    Logger.info( "Processing ambient module declaration: ", moduleDeclaration.name.text );
                    getImports( (<ts.ModuleDeclaration>node).body );
                }
            });
        };

        getImports( file );

        return importNodes;
    }

    private isExternalModuleImportEqualsDeclaration( node: ts.Node ) {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration && ( <ts.ImportEqualsDeclaration>node ).moduleReference.kind === ts.SyntaxKind.ExternalModuleReference;
    }

    private getExternalModuleImportEqualsDeclarationExpression( node: ts.Node ) {
        return ( <ts.ExternalModuleReference>( <ts.ImportEqualsDeclaration>node ).moduleReference ).expression;
    }

    private getSymbolFromNode( node: ts.Node ): ts.Symbol {
        let moduleNameExpr = TsCore.getExternalModuleName( node );

        if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
            return this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );
        }
    }

    private getSourceFileFromSymbol( importSymbol: ts.Symbol ): ts.SourceFile {
        let declaration = importSymbol.getDeclarations()[0];
        
        return declaration.getSourceFile();
    }
}