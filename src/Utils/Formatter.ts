import * as ts from "typescript";
import * as prettify from "prettier";

export function format( input: string ): string {

    const sourceFile = ts.createSourceFile( "file.js", input, ts.ScriptTarget.Latest );

    return prettify.format(sourceFile.getText(), { parser: "typescript" } );
}
