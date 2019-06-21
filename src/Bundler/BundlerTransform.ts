import * as ts from "typescript";

export function getBundlerTransform( program: ts.Program ): ts.TransformerFactory<ts.SourceFile> {
    const checker = program.getTypeChecker();

    return bundlerTransform;
}

function bundlerTransform( context: ts.TransformationContext ): ts.Transformer<ts.SourceFile> {

    const compilerOptions = context.getCompilerOptions();
    let currentSourceFile: ts.SourceFile;

    return transformSourceFile;

    /**
     * Minify the provided SourceFile.
     *
     * @param node A SourceFile node.
     */
    function transformSourceFile( node: ts.SourceFile ) {
        if ( node.isDeclarationFile ) {
            return node;
        }

        currentSourceFile = node;

        const visited = ts.visitEachChild( node, visitor, context );

        //addEmitHelpers( visited, context.readEmitHelpers() );

        return visited;
    }

    function visitor( node: ts.Node ): ts.VisitResult<ts.Node> {
        switch ( node.kind ) {
            case ts.SyntaxKind.Identifier:
                return visitIdentifier( <ts.Identifier>node );
        }

        return node;
    }

    function visitIdentifier( node: ts.Identifier ) {
        return node;
    }
}