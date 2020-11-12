import { Ast } from "../Ast/Ast"
import { Logger } from "../Reporting/Logger"
import { Utils } from "../Utils/Utilities"
import { TsCore } from "../Utils/TsCore"

import * as ts from "typescript"
import * as fs from "fs"
import * as path from "path"

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
                let importSourceFile = self.getSourceFileFromSymbol( importSymbol );
                let canonicalFileName = self.host.getCanonicalFileName( importSourceFile.fileName );
                
                // Don't walk imports that we've already processed
                if ( !Utils.hasProperty( importWalked, canonicalFileName ) ) {
                    importWalked[ canonicalFileName ] = true;

                     // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    if ( !importSourceFile.isDeclarationFile ) {
                        Logger.info( "Walking Import module: ", canonicalFileName );
                        walkModuleImports( self.getImportsOfModule( importSourceFile ) );
                    }
                }

                if ( !Utils.hasProperty( dependencies, canonicalFileName ) ) {
                    Logger.info( "Getting and adding imports of module file: ", canonicalFileName );
                    dependencies[ canonicalFileName ] = self.getImportsOfModule( importSourceFile );
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
        if ( !Ast.isSourceCodeFile( file ) ) {
            return [];
        }
        
        var importNodes: ts.Node[] = [];
        var self = this;
        
        function getImports( searchNode: ts.Node ) {
            ts.forEachChild( searchNode, node => {
                if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
                    let moduleNameExpr = TsCore.getExternalModuleName( node );

                    if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
                        let moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );

                        if ( moduleSymbol ) {
                            Logger.info("Adding import node: ", moduleSymbol.name ) ;
                            importNodes.push( node );
                        }
                        else {
                            Logger.warn("Module symbol not found");
                        }
                    }
                }
                else if ( node.kind === ts.SyntaxKind.ModuleDeclaration ) {
                    // For a namespace ( or module ), traverse the body to locate ES6 module dependencies.
                    // TJT: This section needs to be reviewed. Should namespace/module syntax kinds be scanned or
                    //      Do we only support ES6 import/export syntax, where dependencies must be declared top level?

                    const moduleDeclaration: ts.ModuleDeclaration = <ts.ModuleDeclaration>node;

                    if ( ( moduleDeclaration.name.kind === ts.SyntaxKind.StringLiteral ) &&
                        ( Ast.getSyntacticModifierFlagsNoCache( moduleDeclaration ) & ts.ModifierFlags.Ambient || file.isDeclarationFile ) ) {
                        // An AmbientExternalModuleDeclaration declares an external module.
                        Logger.info( "Scanning for dependencies within ambient module declaration: ", moduleDeclaration.name.text );

                        getImports( moduleDeclaration.body );
                    }
                }
            });
        };

        Logger.info( "Getting imports for source file: ", file.fileName );
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

        return undefined;
    }

    private getSourceFileFromSymbol( importSymbol: ts.Symbol ): ts.SourceFile {
        let declaration = importSymbol.getDeclarations()[0];
        
        return declaration.getSourceFile();
    }
}