import * as ts from "typescript";
import * as prettify from "prettier";


export function format( input: string ): string {
    //var settings = getDefaultFormatCodeSettings();

    const sourceFile = ts.createSourceFile( "file.js", input, ts.ScriptTarget.Latest );

    // Get the formatting edits on the input sources
    //var edits = ( ts as any ).formatting.formatDocument( sourceFile, getRuleProvider( settings ), settings );

    return prettify.format(sourceFile.getText(), { parser: "typescript" } );

    //function getRuleProvider( settings: ts.FormatCodeSettings ) {
    //    var ruleProvider = new ( <any>ts ).formatting.RulesProvider();
    //    ruleProvider.ensureUpToDate( settings );

    //    return ruleProvider;
    //}

    //function applyEdits( text: string, edits: ts.TextChange[] ): string {
    //    let result = text;

    //    for ( let i = edits.length - 1; i >= 0; i-- ) {
    //        let change = edits[i];
    //        let head = result.slice( 0, change.span.start );
    //        let tail = result.slice( change.span.start + change.span.length );

    //        result = head + change.newText + tail;
    //    }

    //    return result;
    //}

    //function getDefaultFormatCodeSettings(): ts.FormatCodeSettings {
    //    return {
    //        baseIndentSize: 4,
    //        indentSize: 4,
    //        tabSize: 4,
    //        newLineCharacter: "\r\n",
    //        convertTabsToSpaces: true,
    //        indentStyle: ts.IndentStyle.Smart,

    //        insertSpaceAfterCommaDelimiter: true,
    //        insertSpaceAfterSemicolonInForStatements: true,
    //        insertSpaceBeforeAndAfterBinaryOperators: true,
    //        insertSpaceAfterConstructor: true,
    //        insertSpaceAfterKeywordsInControlFlowStatements: true,
    //        insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
    //        insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    //        insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
    //        insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
    //        insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
    //        insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
    //        insertSpaceAfterTypeAssertion: false,
    //        insertSpaceBeforeFunctionParenthesis: false,
    //        placeOpenBraceOnNewLineForFunctions: false,
    //        placeOpenBraceOnNewLineForControlBlocks: false,
    //    };
    //}
}
