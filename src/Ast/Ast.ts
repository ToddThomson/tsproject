import ts = require( "typescript" );

export module Ast {

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

        HasLocals = 1 << 2,

        // If the current node is a container that also container that also contains locals.  Examples:
        //
        //      Functions, Methods, Modules, Source-files.
        IsContainerWithLocals = IsContainer | HasLocals
    }

    export function isFunctionLike( node: ts.Node ): boolean {
        if ( node ) {
            switch ( node.kind ) {
                case ts.SyntaxKind.Constructor:
                case ts.SyntaxKind.FunctionExpression:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.ArrowFunction:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                case ts.SyntaxKind.CallSignature:
                case ts.SyntaxKind.ConstructSignature:
                case ts.SyntaxKind.IndexSignature:
                case ts.SyntaxKind.FunctionType:
                case ts.SyntaxKind.ConstructorType:
                    return true;
            }
        }

        return false;
    }

    export function getContainerFlags( node: ts.Node ): ContainerFlags {
        switch ( node.kind ) {
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.TypeLiteral:
            case ts.SyntaxKind.ObjectLiteralExpression:
                return ContainerFlags.IsContainer;

            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructorType:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.SourceFile:
            case ts.SyntaxKind.TypeAliasDeclaration:
                return ContainerFlags.IsContainerWithLocals;

            case ts.SyntaxKind.CatchClause:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.CaseBlock:
                return ContainerFlags.IsBlockScopedContainer;

            case ts.SyntaxKind.Block:
                // do not treat blocks directly inside a function as a block-scoped-container.
                // Locals that reside in this block should go to the function locals. Othewise 'x'
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

    export function isKeyword( token: ts.SyntaxKind ): boolean {
        return ts.SyntaxKind.FirstKeyword <= token && token <= ts.SyntaxKind.LastKeyword;
    }

    export function isPuncuation( token: ts.SyntaxKind ): boolean {
        return ts.SyntaxKind.FirstPunctuation <= token && token <= ts.SyntaxKind.LastPunctuation;
    }

    export function isTrivia( token: ts.SyntaxKind ) {
        return ts.SyntaxKind.FirstTriviaToken <= token && token <= ts.SyntaxKind.LastTriviaToken;
    }

    export function displaySymbolFlags( flags: ts.SymbolFlags ): void {
        if( flags & ts.SymbolFlags.FunctionScopedVariable ) {
            console.log( "Symbol flag: FunctionScopedVariable" );
        }
        if ( flags & ts.SymbolFlags.BlockScopedVariable ) {
            console.log( "Symbol flag: BlockScopedVariable " );
        }
        if ( flags & ts.SymbolFlags.Property ) {
            console.log( "Symbol flag: Property" );
        }
        if ( flags & ts.SymbolFlags.EnumMember ) {
            console.log( "Symbol flag: EnumMember" );
        }
        if ( flags & ts.SymbolFlags.Function ) {
            console.log( "Symbol flag: Function" );
        }
        if ( flags & ts.SymbolFlags.Class ) {
            console.log( "Symbol flag: Class" );
        }
        if ( flags & ts.SymbolFlags.Interface ) {
            console.log( "Symbol flag: Interface" );
        }
        if ( flags & ts.SymbolFlags.ConstEnum ) {
            console.log( "Symbol flag: ConstEnum" );
        }
        if ( flags & ts.SymbolFlags.RegularEnum ) {
            console.log( "Symbol flag: RegularEnum" );
        }
        if ( flags & ts.SymbolFlags.ValueModule ) {
            console.log( "Symbol flag: ValueModule" );
        }
        if ( flags & ts.SymbolFlags.NamespaceModule ) {
            console.log( "Symbol flag: NamespaceModule" );
        }
        if ( flags & ts.SymbolFlags.TypeLiteral ) {
            console.log( "Symbol flag: TypeLiteral" );
        }
        if ( flags & ts.SymbolFlags.ObjectLiteral ) {
            console.log( "Symbol flag: ObjectLiteral" );
        }
        if ( flags & ts.SymbolFlags.Method ) {
            console.log( "Symbol flag: Method" );
        }
        if ( flags & ts.SymbolFlags.Constructor ) {
            console.log( "Symbol flag: Constructor" );
        }
        if ( flags & ts.SymbolFlags.GetAccessor ) {
            console.log( "Symbol flag: GetAccessor" );
        }
        if ( flags & ts.SymbolFlags.SetAccessor ) {
            console.log( "Symbol flag: SetAccessor" );
        }
        if ( flags & ts.SymbolFlags.Signature ) {
            console.log( "Symbol flag: Signature" );
        }
        if ( flags & ts.SymbolFlags.TypeParameter ) {
            console.log( "Symbol flag: TypeParameter" );
        }
        if ( flags & ts.SymbolFlags.TypeAlias ) {
            console.log( "Symbol flag: TypeAlias" );
        }
        if ( flags & ts.SymbolFlags.ExportValue ) {
            console.log( "Symbol flag: ExportValue" );
        }
        if ( flags & ts.SymbolFlags.ExportType ) {
            console.log( "Symbol flag: ExportType" );
        }
        if ( flags & ts.SymbolFlags.ExportNamespace ) {
            console.log( "Symbol flag: ExportNamespace" );
        }
        if ( flags & ts.SymbolFlags.Alias ) {
            console.log( "Symbol flag: Alias" );
        }
        if ( flags & ts.SymbolFlags.Instantiated ) {
            console.log( "Symbol flag: Instantiated" );
        }
        if ( flags & ts.SymbolFlags.Merged ) {
            console.log( "Symbol flag: Merged" );
        }
        if ( flags & ts.SymbolFlags.Transient ) {
            console.log( "Symbol flag: Transient" );
        }
        if ( flags & ts.SymbolFlags.Prototype ) {
            console.log( "Symbol flag: Prototype" );
        }
        if ( flags & ts.SymbolFlags.SyntheticProperty ) {
            console.log( "Symbol flag: SyntheticProperty" );
        }
        if ( flags & ts.SymbolFlags.Optional ) {
            console.log( "Symbol flag: Optional" );
        }
        if ( flags & ts.SymbolFlags.ExportStar ) {
            console.log( "Symbol flag: ExportStar" );
        }
    }

    export function displayNodeFlags( flags: ts.NodeFlags ): void {
        if( flags & ts.NodeFlags.Export ) {
            console.log( "Node flag: Export" );
        }
        if ( flags & ts.NodeFlags.Ambient ) {
            console.log( "Node flag: Ambient" );
        }
        if ( flags & ts.NodeFlags.Public ) {
            console.log( "Node Flag: Public" );
        }
        if ( flags & ts.NodeFlags.Private ) {
            console.log( "Node Flag: Private" );
        }
        if ( flags & ts.NodeFlags.Static ) {
            console.log( "Node Flag: Static" );
        }
        if ( flags & ts.NodeFlags.Abstract ) {
            console.log( "Node Flag: Abstract" );
        }
        if ( flags & ts.NodeFlags.Async ) {
            console.log( "Node Flag: Async" );
        }
        if ( flags & ts.NodeFlags.Default ) {
            console.log( "Node Flag: Default" );
        }
        if ( flags & ts.NodeFlags.MultiLine ) {
            console.log( "Node Flag: MultiLine" );
        }
        if ( flags & ts.NodeFlags.Synthetic ) {
            console.log( "Node Flag: Synthetic" );
        }
        if ( flags & ts.NodeFlags.DeclarationFile ) {
            console.log( "Node Flag: DeclarationFile" );
        }
        if ( flags & ts.NodeFlags.Let ) {
            console.log( "Node Flag: Let" );
        }
        if ( flags & ts.NodeFlags.Const ) {
            console.log( "Node Flag: Const" );
        }
        if ( flags & ts.NodeFlags.OctalLiteral ) {
            console.log( "Node Flag: OctalLiteral" );
        }
        if ( flags & ts.NodeFlags.Namespace ) {
            console.log( "Node Flag: Namespace" );
        }
        if ( flags & ts.NodeFlags.ExportContext ) {
            console.log( "Node Flag: ExportContext" );
        }
        if ( flags & ts.NodeFlags.ContainsThis ) {
            console.log( "Node Flag: ContainsThis" );
        }
        if ( flags & ts.NodeFlags.Modifier ) {
            console.log( "Node Flag: Modifier" );
        }
        if ( flags & ts.NodeFlags.AccessibilityModifier ) {
            console.log( "Node Flag: AccessibilityModifier" );
        }
        if ( flags & ts.NodeFlags.BlockScoped ) {
            console.log( "Node Flag: BlockScoped" );
        }
    }
}