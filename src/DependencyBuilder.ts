import { Logger } from "./Logger";

import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( "path" );
import * as utils from "./Utilities";
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

    public getSourceFileDependencies( sourceFile: ts.SourceFile ): ts.Map<ts.Node[]> {
        var self = this;
        var dependencies: ts.Map<ts.Node[]> = {};
        var importWalked: ts.Map<boolean> = {};

        function walkModuleImports( importNodes: ts.Node[] ) {
            importNodes.forEach( importNode => {
                // Get the import symbol for the import node
                let importSymbol = self.getSymbolFromNode( importNode );
                let importSymbolSourceFile = self.getSourceFileFromSymbol( importSymbol );
                let canonicalFileName = self.host.getCanonicalFileName( importSymbolSourceFile.fileName );
                Logger.info( "Import symbol file name: ", canonicalFileName );

                // Don't walk imports that we've already processed
                if ( !utils.hasProperty( importWalked, canonicalFileName ) ) {
                    importWalked[canonicalFileName] = true;

                    // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    walkModuleImports( self.getImportsOfModule( importSymbolSourceFile ) );
                }

                if ( !utils.hasProperty( dependencies, canonicalFileName ) ) {
                    Logger.info( "Adding module import dependencies for file: ", canonicalFileName );
                    dependencies[canonicalFileName] = self.getImportsOfModule( importSymbolSourceFile );
                }
            });
        }

        // Get the top level imports
        var sourceFileImports = self.getImportsOfModule(sourceFile);

        // Walk the module import tree
        walkModuleImports(sourceFileImports);

        let canonicalSourceFileName = self.host.getCanonicalFileName( sourceFile.fileName );

        if (!utils.hasProperty(dependencies, canonicalSourceFileName)) {
            Logger.info("Adding top level import dependencies for file: ", canonicalSourceFileName);
            dependencies[canonicalSourceFileName] = sourceFileImports;
        }

        return dependencies;
    }

    public getImportsOfModule( file: ts.SourceFile ): ts.Node[] {
        var importNodes: ts.Node[] = [];
        var self = this;
        
        function getImports(searchNode: ts.Node) {
            ts.forEachChild(searchNode, node => {
                if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
                    Logger.info("Found import declaration");
                    let moduleNameExpr = tsCore.getExternalModuleName(node);

                    if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
                        let moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);

                        if (moduleSymbol) {
                            Logger.info("Adding import symbol: ", moduleSymbol.name, file.fileName);
                            importNodes.push(node);
                        }
                        else {
                            Logger.warn("Module symbol not found");
                        }
                    }
                }
                else if (node.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.ModuleDeclaration>node).name.kind === ts.SyntaxKind.StringLiteral && (node.flags & ts.NodeFlags.Ambient || tsCore.isDeclarationFile(file))) {
                    // An AmbientExternalModuleDeclaration declares an external module.
                    var moduleDeclaration = <ts.ModuleDeclaration>node;
                    Logger.info("Processing ambient module declaration: ", moduleDeclaration.name.text);
                    getImports((<ts.ModuleDeclaration>node).body);
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
        let moduleNameExpr = tsCore.getExternalModuleName( node );

        if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
            return this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );
        }
    }

    private getSourceFileFromNode( importNode: ts.Node ): ts.SourceFile {
        return importNode.getSourceFile();
    }

    private getSourceFileFromSymbol( importSymbol: ts.Symbol ): ts.SourceFile {
        let declaration = importSymbol.getDeclarations()[0];
        let isCodeModule = declaration.kind === ts.SyntaxKind.SourceFile &&
            !( declaration.flags & ts.NodeFlags.DeclarationFile );
        let file = declaration.getSourceFile();

        return file;
    }
}