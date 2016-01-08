import ts = require( "typescript" );

export interface AstTransform {
    transform( node: ts.Node ): ts.Node;
}