import * as ts from "typescript";
import { BundleMinifier } from "./Minifier"

export function getMinifierTransform( program: ts.Program ): ts.TransformerFactory<ts.SourceFile> {
    return ( context: ts.TransformationContext ) => minifierTransform( program, context );
}

function minifierTransform( program: ts.Program, context: ts.TransformationContext ): ts.Transformer<ts.SourceFile> {

    const compilerOptions = context.getCompilerOptions();
    let currentSourceFile: ts.SourceFile;
    let bundleConfig = null;
    let minifier = new BundleMinifier( program, compilerOptions, bundleConfig );
    //bundleSourceFile = minifier.transform( bundleSourceFile );

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

        minifier.walkContainerChain( node );

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