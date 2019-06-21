import * as ts from "typescript"

// This file contains Typescript AST version 3.5.2 code found in utilities.ts
export namespace Ast {

    export interface ContainerNode extends ts.Node {
        nextContainer?: ContainerNode;
    }

    export function getModifierFlagsNoCache( node: ts.Node ): ts.ModifierFlags {
        let flags = ts.ModifierFlags.None;

        if ( node.modifiers ) {
            for ( const modifier of node.modifiers ) {
                flags |= modifierToFlag( modifier.kind );
            }
        }

        if ( node.flags & ts.NodeFlags.NestedNamespace || ( node.kind === ts.SyntaxKind.Identifier && ( <ts.Identifier>node ).isInJSDocNamespace ) ) {
            flags |= ts.ModifierFlags.Export;
        }

        return flags;
    }

    export function modifierToFlag( token: ts.SyntaxKind ): ts.ModifierFlags {
        switch ( token ) {
            case ts.SyntaxKind.StaticKeyword: return ts.ModifierFlags.Static;
            case ts.SyntaxKind.PublicKeyword: return ts.ModifierFlags.Public;
            case ts.SyntaxKind.ProtectedKeyword: return ts.ModifierFlags.Protected;
            case ts.SyntaxKind.PrivateKeyword: return ts.ModifierFlags.Private;
            case ts.SyntaxKind.AbstractKeyword: return ts.ModifierFlags.Abstract;
            case ts.SyntaxKind.ExportKeyword: return ts.ModifierFlags.Export;
            case ts.SyntaxKind.DeclareKeyword: return ts.ModifierFlags.Ambient;
            case ts.SyntaxKind.ConstKeyword: return ts.ModifierFlags.Const;
            case ts.SyntaxKind.DefaultKeyword: return ts.ModifierFlags.Default;
            case ts.SyntaxKind.AsyncKeyword: return ts.ModifierFlags.Async;
            case ts.SyntaxKind.ReadonlyKeyword: return ts.ModifierFlags.Readonly;
        }

        return ts.ModifierFlags.None;
    }

    export const enum ContainerFlags {
        // The current node is not a container, and no container manipulation should happen before
        // recursing into it.
        None = 0,

        // The current node is a container.  It should be set as the current container (and block-
        // container) before recursing into it.  The current node does not have locals.  Examples:
        //
        //      Classes, ObjectLiterals, TypeLiterals, Interfaces...
        IsContainer = 1 << 0,

        // The current node is a block-scoped-container.  It should be set as the current block-
        // container before recursing into it.  Examples:
        //
        //      Blocks (when not parented by functions), Catch clauses, For/For-in/For-of statements...
        IsBlockScopedContainer = 1 << 1,

        // The current node is the container of a control flow path. The current control flow should
        // be saved and restored, and a new control flow initialized within the container.
        IsControlFlowContainer = 1 << 2,

        IsFunctionLike = 1 << 3,
        IsFunctionExpression = 1 << 4,
        HasLocals = 1 << 5,
        IsInterface = 1 << 6,
        IsObjectLiteralOrClassExpressionMethod = 1 << 7,

        // If the current node is a container that also contains locals.  Examples:
        //
        //      Functions, Methods, Modules, Source-files.
        IsContainerWithLocals = IsContainer | HasLocals
    }
    
    export function isPrototypeAccessAssignment( expression: ts.Node ): boolean {

        if ( expression.kind !== ts.SyntaxKind.BinaryExpression ) {
            return false;
        }

        const expr = <ts.BinaryExpression>expression;
    
        if ( expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken || expr.left.kind !== ts.SyntaxKind.PropertyAccessExpression ) {
            return false;
        }
        
        const lhs = <ts.PropertyAccessExpression>expr.left;
        
        if ( lhs.expression.kind === ts.SyntaxKind.PropertyAccessExpression ) {
            // chained dot, e.g. x.y.z = expr; this var is the 'x.y' part
            const innerPropertyAccess = <ts.PropertyAccessExpression>lhs.expression;
            
            if ( innerPropertyAccess.expression.kind === ts.SyntaxKind.Identifier && innerPropertyAccess.name.text === "prototype" ) {
                return true;
            }    
        }

        return false;
    }

    export function isFunctionLike( node: ts.Node ): node is ts.FunctionLike {
        return node && isFunctionLikeKind( node.kind );
    }

    export function isFunctionLikeDeclarationKind( kind: ts.SyntaxKind ): boolean {
        switch ( kind ) {
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return true;
            default:
                return false;
        }
    }

    export function isFunctionLikeKind( kind: ts.SyntaxKind ): boolean {
        switch ( kind ) {
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.ConstructorType:
                return true;
            default:
                return isFunctionLikeDeclarationKind( kind );
        }
    }

    export function isObjectLiteralOrClassExpressionMethod( node: ts.Node): node is ts.MethodDeclaration {
        return node.kind === ts.SyntaxKind.MethodDeclaration &&
            ( node.parent.kind === ts.SyntaxKind.ObjectLiteralExpression ||
              node.parent.kind === ts.SyntaxKind.ClassExpression );
    }

    export function isInterfaceInternal( symbol: ts.Symbol ): boolean {
        if ( symbol && ( symbol.flags & ts.SymbolFlags.Interface ) ) {
            if ( symbol.valueDeclaration ) {
                let flags = getModifierFlagsNoCache( symbol.valueDeclaration );

                //if ( !( flags & ts.ModifierFlags.Export ) ) {
                //    return true;
                //}

                // FUTURE: How to make interfaces internal by convention?
                return false;
            }
        }

        return false;
    }

    export function isClassInternal( symbol: ts.Symbol ): boolean {
        if ( symbol && ( symbol.flags & ts.SymbolFlags.Class ) ) {

            // If the class is from an extern API or ambient then it cannot be considered internal.
            if ( Ast.isExportContext( symbol ) || Ast.isAmbientContext( symbol ) ) {
                return false;
            }

            // A class always has a value declaration
            let flags = getModifierFlagsNoCache( symbol.valueDeclaration );

            // By convention, "Internal" classes are ones that are not exported.
            if ( !( flags & ts.ModifierFlags.Export ) ) {
                return true;
            }
        }

        return false;
    }

    export function isClassAbstract( classSymbol: ts.Symbol ): boolean {
        if ( classSymbol && classSymbol.valueDeclaration ) {
            if ( getModifierFlagsNoCache( classSymbol.valueDeclaration ) & ts.ModifierFlags.Abstract ) {
                return true;
            }
        }

        return false;
    }

    export function getClassHeritageProperties( classNodeU: ts.Node, checker: ts.TypeChecker ): ts.Symbol[] {
        let classExportProperties: ts.Symbol[] = [];
        
        function getHeritageExportProperties( heritageClause: ts.HeritageClause, checker: ts.TypeChecker ): void {
            const inheritedTypeNodes = heritageClause.types;

            if ( inheritedTypeNodes ) {
                for ( const typeRefNode of inheritedTypeNodes ) {
                    // The "properties" of inheritedType includes all the base class/interface properties
                    const inheritedType: ts.Type = checker.getTypeAtLocation( typeRefNode );

                    let inheritedTypeDeclaration = inheritedType.symbol.valueDeclaration;
                    
                    if ( inheritedTypeDeclaration ) {
                        let inheritedTypeHeritageClauses = (<ts.ClassLikeDeclaration>inheritedTypeDeclaration).heritageClauses;
        
                        if ( inheritedTypeHeritageClauses ) {
                            for ( const inheritedTypeHeritageClause of inheritedTypeHeritageClauses ) {
                                getHeritageExportProperties( inheritedTypeHeritageClause, checker );
                            }
                        }
                    }

                    const inheritedTypeProperties: ts.Symbol[] = inheritedType.getProperties();

                    for ( const propertySymbol of inheritedTypeProperties ) {
                        if ( Ast.isExportContext( propertySymbol ) ) {
                            classExportProperties.push( propertySymbol );
                        }
                    }
                }
            }
        }

        let heritageClauses = (<ts.ClassLikeDeclaration>classNodeU).heritageClauses;
        
        if ( heritageClauses ) {
            for ( const heritageClause of heritageClauses ) {
                getHeritageExportProperties( heritageClause, checker );
            } 
        }

        return classExportProperties;
    }

    export function getClassAbstractProperties( extendsClause: ts.HeritageClause, checker: ts.TypeChecker ): ts.Symbol[] {
        let abstractProperties: ts.Symbol[] = [];
        
        const abstractTypeNodes = extendsClause.types;

        for ( const abstractTypeNode of abstractTypeNodes ) {
            const abstractType: ts.Type = checker.getTypeAtLocation( abstractTypeNode );
            let abstractTypeSymbol = abstractType.getSymbol();
       
            if ( abstractTypeSymbol.valueDeclaration ) {
                if ( getModifierFlagsNoCache( abstractTypeSymbol.valueDeclaration ) & ts.ModifierFlags.Abstract ) {
                    const props: ts.Symbol[] = abstractType.getProperties();

                    for ( const prop of props ) {
                        abstractProperties.push( prop );
                    }
                }
            }
        }
        
        return abstractProperties;
    }

    export function getImplementsProperties( implementsClause: ts.HeritageClause, checker: ts.TypeChecker ): ts.Symbol[] {
        let implementsProperties: ts.Symbol[] = [];
        
        const typeNodes = implementsClause.types;

        for ( const typeNode of typeNodes ) {
            const type: ts.Type = checker.getTypeAtLocation( typeNode );
            const props: ts.Symbol[] = type.getProperties();

            for ( const prop of props ) {
                implementsProperties.push( prop );
            }
        }
        
        return implementsProperties;
    }

    export function getIdentifierUID( symbol: ts.Symbol ): string {
        if ( !symbol ) {
            return undefined;
        }

        let id = ( <any>symbol ).id;

        // Try to get the symbol id from the identifier value declaration
        if ( id === undefined && symbol.valueDeclaration ) {
            id = ( <any>symbol.valueDeclaration ).symbol.id;
        }

        return id ? id.toString() : undefined;
    }

    export function getContainerFlags( node: ts.Node ): ContainerFlags {
        switch ( node.kind ) {
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.TypeLiteral:
            case ts.SyntaxKind.JSDocTypeLiteral:
            case ts.SyntaxKind.JsxAttributes:
                return ContainerFlags.IsContainer;

            case ts.SyntaxKind.InterfaceDeclaration:
                return ContainerFlags.IsContainer | ContainerFlags.IsInterface;

            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.MappedType:
                return ContainerFlags.IsContainer | ContainerFlags.HasLocals;

            case ts.SyntaxKind.SourceFile:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals;

            case ts.SyntaxKind.MethodDeclaration:
                if ( isObjectLiteralOrClassExpressionMethod( node ) ) {
                    return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike | ContainerFlags.IsObjectLiteralOrClassExpressionMethod;
                }
            // falls through
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.ConstructorType:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike;

            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike | ContainerFlags.IsFunctionExpression;

            case ts.SyntaxKind.ModuleBlock:
                return ContainerFlags.IsControlFlowContainer;
            case ts.SyntaxKind.PropertyDeclaration:
                return ( <ts.PropertyDeclaration>node ).initializer ? ContainerFlags.IsControlFlowContainer : 0;

            case ts.SyntaxKind.CatchClause:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.CaseBlock:
                return ContainerFlags.IsBlockScopedContainer;

            case ts.SyntaxKind.Block:
                // do not treat blocks directly inside a function as a block-scoped-container.
                // Locals that reside in this block should go to the function locals. Otherwise 'x'
                // would not appear to be a redeclaration of a block scoped local in the following
                // example:
                //
                //      function foo() {
                //          var x;
                //          let x;
                //      }
                //
                // If we placed 'var x' into the function locals and 'let x' into the locals of
                // the block, then there would be no collision.
                //
                // By not creating a new block-scoped-container here, we ensure that both 'var x'
                // and 'let x' go into the Function-container's locals, and we do get a collision
                // conflict.
                return isFunctionLike( node.parent ) ? ContainerFlags.None : ContainerFlags.IsBlockScopedContainer;
        }

        return ContainerFlags.None;
    }

    export function getImplementsClause( node: ts.Node ): ts.HeritageClause {
        if ( node ) {
            let heritageClauses = (<ts.ClassLikeDeclaration>node).heritageClauses;
            
            if ( heritageClauses ) {
                for ( const clause of heritageClauses ) {
                    if ( clause.token === ts.SyntaxKind.ImplementsKeyword ) {
                        return clause;
                    }
                }
            }
        }

        return undefined;
    }

    export function getExtendsClause( node: ts.Node ): ts.HeritageClause {
        if ( node ) {
            let heritageClauses = (<ts.ClassLikeDeclaration>node).heritageClauses;
            
            if ( heritageClauses ) {
                for ( const clause of heritageClauses ) {
                    if ( clause.token === ts.SyntaxKind.ExtendsKeyword ) {
                        return clause;
                    }
                }
            }
        }

        return undefined;
    }

    export function isKeyword( token: ts.SyntaxKind ): boolean {
        return ts.SyntaxKind.FirstKeyword <= token && token <= ts.SyntaxKind.LastKeyword;
    }

    export function isPuncuation( token: ts.SyntaxKind ): boolean {
        return ts.SyntaxKind.FirstPunctuation <= token && token <= ts.SyntaxKind.LastPunctuation;
    }

    export function isTrivia( token: ts.SyntaxKind ) {
        return ts.SyntaxKind.FirstTriviaToken <= token && token <= ts.SyntaxKind.LastTriviaToken;
    }

    export function isExportContext( propertySymbol: ts.Symbol ): boolean {
        let node: ts.Node = propertySymbol.valueDeclaration;

        // TJT: Same code. Remove

        //while ( node ) {
        //    if ( getModifierFlags( node ) & ts.ModifierFlags.Export ) {
        //        return true;
        //    }
        //    node = node.parent;
        //}
        while ( node ) {
            if ( node.flags & ts.NodeFlags.ExportContext ) {
                return true;
            }
            node = node.parent;
        }
        
        return false;
    }

    export function isAmbientContext( propertySymbol: ts.Symbol ): boolean {
        let node: ts.Node = propertySymbol.valueDeclaration;
        while ( node ) {
            if ( getModifierFlagsNoCache( node ) & ts.ModifierFlags.Ambient ) {
                return true;
            }
            node = node.parent;
        }
        
        return false;
    }

    export function isSourceCodeFile( file: ts.SourceFile ): boolean {
        return ( file.kind === ts.SyntaxKind.SourceFile && !file.isDeclarationFile );
    }
}