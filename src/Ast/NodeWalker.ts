import * as ts from "typescript";

export abstract class NodeWalker {

    public walk( node: ts.Node ) {
        this.visitNode( node );
    }

    protected visitNode( node: ts.Node ) {
        this.walkChildren( node );
    }

    protected walkChildren( node: ts.Node ) {
        ts.forEachChild( node, ( child ) => this.visitNode( child ) );
    }
}