import * as ts from "typescript";

export interface AstTransform {
    transform( node: ts.Node ): ts.Node;
}