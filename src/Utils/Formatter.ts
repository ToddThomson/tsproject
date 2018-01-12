import * as ts from "typescript";

export function format( input: string ): string {
    var settings = getDefaultFormatCodeSettings();

    const sourceFile = ts.createSourceFile( "file.js", input, ts.ScriptTarget.Latest );

    // Get the formatting edits on the input sources
    var edits = ( ts as any ).formatting.formatDocument( sourceFile, getRuleProvider( settings ), settings );

    return applyEdits( sourceFile.getText(), edits );

    function getRuleProvider( settings: ts.FormatCodeSettings ) {
        var ruleProvider = new ( <any>ts ).formatting.RulesProvider();
        ruleProvider.ensureUpToDate( settings );

        return ruleProvider;
    }

    function applyEdits( text: string, edits: ts.TextChange[] ): string {
        let result = text;

        for ( let i = edits.length - 1; i >= 0; i-- ) {
            let change = edits[i];
            let head = result.slice( 0, change.span.start );
            let tail = result.slice( change.span.start + change.span.length );

            result = head + change.newText + tail;
        }

        return result;
    }

    function getDefaultFormatCodeSettings(): ts.FormatCodeSettings {
        return {
            indentSize: 4,
            tabSize: 4,
            indentStyle: ts.IndentStyle.Smart,
            newLineCharacter: "\r\n",
            convertTabsToSpaces: true,
            insertSpaceAfterCommaDelimiter: true,
            insertSpaceAfterSemicolonInForStatements: true,
            insertSpaceBeforeAndAfterBinaryOperators: true,
            insertSpaceAfterKeywordsInControlFlowStatements: true,
            insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
            insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
            placeOpenBraceOnNewLineForFunctions: false,
            placeOpenBraceOnNewLineForControlBlocks: false,
        };
    }
}
