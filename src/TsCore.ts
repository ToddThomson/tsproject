import ts = require( "typescript" );

export function getExternalModuleName( node: ts.Node ): ts.Expression {
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

export function createDiagnostic( message: ts.DiagnosticMessage, ...args: any[] ): ts.Diagnostic {
    let text = message.key;

    if ( arguments.length > 1 ) {
        text = formatStringFromArgs( text, arguments, 1 );
    }

    return {
        file: undefined,
        start: undefined,
        length: undefined,
        messageText: text,
        category: message.category,
        code: message.code
    };
}

function formatStringFromArgs( text: string, args: any, baseIndex: number ) {
    baseIndex = baseIndex || 0;
    return text.replace( /{(\d+)}/g, function ( match: any, index: any ) {
        return args[+index + baseIndex];
    });
}

export function isDeclarationFile( file: ts.SourceFile ): boolean {
    return ( file.flags & ts.NodeFlags.DeclarationFile ) !== 0;
}

// An alias symbol is created by one of the following declarations:
// import <symbol> = ...
// import <symbol> from ...
// import * as <symbol> from ...
// import { x as <symbol> } from ...
// export { x as <symbol> } from ...
// export = ...
// export default ...
export function isAliasSymbolDeclaration( node: ts.Node ): boolean {
    return node.kind === ts.SyntaxKind.ImportEqualsDeclaration ||
        node.kind === ts.SyntaxKind.ImportClause && !!( <ts.ImportClause>node ).name ||
        node.kind === ts.SyntaxKind.NamespaceImport ||
        node.kind === ts.SyntaxKind.ImportSpecifier ||
        node.kind === ts.SyntaxKind.ExportSpecifier ||
        node.kind === ts.SyntaxKind.ExportAssignment && ( <ts.ExportAssignment>node ).expression.kind === ts.SyntaxKind.Identifier;
}

export function normalizeSlashes( path: string ): string {
    return path.replace( /\\/g, "/" );
}

export function outputExtension( path: string ): string {
    return path.replace( /\.ts/, ".js" );
} 