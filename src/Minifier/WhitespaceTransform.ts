import * as ts from "typescript";

import { BundleConfig } from "../Bundler/BundleParser"
import { Ast } from "../Ast/Ast"
import { StatisticsReporter } from "../Reporting/StatisticsReporter"
import { Logger } from "../Reporting/Logger"
import { NameGenerator } from "./NameGenerator"
import { Container } from "./ContainerContext"
import { IdentifierInfo } from "./IdentifierInfo"
import { TsCompilerOptions } from "../Compiler/TsCompilerOptions"
import { Debug } from "../Utils/Debug"
import { format } from "../Utils/formatter"
import { Utils } from "../Utils/Utilities"
import { TsCore } from "../Utils/TsCore"

export function getWhitespaceTransform(): ts.TransformerFactory<ts.SourceFile> {
    return ( context: ts.TransformationContext ) => whitespaceTransform( context );
}

function whitespaceTransform( context: ts.TransformationContext ): ts.Transformer<ts.SourceFile> {

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
export class WhitespaceMinifier {
    private whiteSpaceBefore: number;
    private whiteSpaceAfter: number;

    private whiteSpaceTime: number;
    

    public removeWhitespace( jsContents: string ): string {
        // ES6 whitespace rules..

        // Special Cases..
        // break, continue, function: space right if next token is [Expression]
        // return, yield: space if next token is not a semicolon
        // else:

        // Space to left and right of keyword..
        // extends, in, instanceof : space left and right

        // Space to the right of the keyword..
        // case, class, const, delete, do, export, get, import, let, new, set, static, throw, typeof, var, void

        // Space not required..
        // catch, debugger, default, finally, for, if, super, switch, this, try, while, with

        // Notes..
        // export: Not supported yet? For now add space
        // default: When used with export?

        this.whiteSpaceTime = new Date().getTime();
        this.whiteSpaceBefore = jsContents.length;

        let output = "";
        let lastNonTriviaToken = ts.SyntaxKind.Unknown;
        let isTrivia = false;
        let token: ts.SyntaxKind;

        const scanner = ts.createScanner( ts.ScriptTarget.ES5, /* skipTrivia */ false, ts.LanguageVariant.Standard, jsContents );

        while ( ( token = scanner.scan() ) !== ts.SyntaxKind.EndOfFileToken ) {
            isTrivia = false;

            if ( Ast.isTrivia( token ) ) {
                // TJT: Uncomment to add new line trivia to output for testing purposes
                //if ( token === ts.SyntaxKind.NewLineTrivia ) {
                //    output += scanner.getTokenText();
                //}
                isTrivia = true;
            }

            if ( !isTrivia ) {
                // Process the last non trivia token
                switch ( lastNonTriviaToken ) {
                    case ts.SyntaxKind.FunctionKeyword:
                        // Space required after function keyword if next token is an identifier
                        if ( token === ts.SyntaxKind.Identifier ) {
                            output += " ";
                        }
                        break;

                    case ts.SyntaxKind.BreakKeyword:
                    case ts.SyntaxKind.ContinueKeyword:
                    case ts.SyntaxKind.ReturnKeyword:
                    case ts.SyntaxKind.YieldKeyword:
                        // Space not required after return keyword if the current token is a semicolon
                        if ( token !== ts.SyntaxKind.SemicolonToken ) {
                            output += " ";
                        }
                        break;

                    case ts.SyntaxKind.ElseKeyword:
                        // Space not required after return keyword if the current token is a punctuation
                        if ( token !== ts.SyntaxKind.OpenBraceToken ) {
                            output += " ";
                        }
                        break;
                }

                // Process the current token..
                switch ( token ) {
                    // Keywords that require a right space
                    case ts.SyntaxKind.CaseKeyword:
                    case ts.SyntaxKind.ClassKeyword:
                    case ts.SyntaxKind.ConstKeyword:
                    case ts.SyntaxKind.DeleteKeyword:
                    case ts.SyntaxKind.DoKeyword:
                    case ts.SyntaxKind.ExportKeyword: // TJT: Add a space just to be sure right now 
                    case ts.SyntaxKind.GetKeyword:
                    case ts.SyntaxKind.ImportKeyword:
                    case ts.SyntaxKind.LetKeyword:
                    case ts.SyntaxKind.NewKeyword:
                    case ts.SyntaxKind.SetKeyword:
                    case ts.SyntaxKind.StaticKeyword:
                    case ts.SyntaxKind.ThrowKeyword:
                    case ts.SyntaxKind.TypeOfKeyword:
                    case ts.SyntaxKind.VarKeyword:
                    case ts.SyntaxKind.VoidKeyword:
                        output += scanner.getTokenText() + " ";
                        break;

                    // Keywords that require space left and right..
                    case ts.SyntaxKind.ExtendsKeyword:
                    case ts.SyntaxKind.InKeyword:
                    case ts.SyntaxKind.InstanceOfKeyword:
                        output += " " + scanner.getTokenText() + " ";
                        break;

                    // Avoid concatenations of ++, + and --, - operators
                    case ts.SyntaxKind.PlusToken:
                    case ts.SyntaxKind.PlusPlusToken:
                        if ( ( lastNonTriviaToken === ts.SyntaxKind.PlusToken ) ||
                            ( lastNonTriviaToken === ts.SyntaxKind.PlusPlusToken ) ) {
                            output += " ";
                        }
                        output += scanner.getTokenText();
                        break;

                    case ts.SyntaxKind.MinusToken:
                    case ts.SyntaxKind.MinusMinusToken:
                        if ( ( lastNonTriviaToken === ts.SyntaxKind.MinusToken ) ||
                            ( lastNonTriviaToken === ts.SyntaxKind.MinusMinusToken ) ) {
                            output += " ";
                        }

                        output += scanner.getTokenText();
                        break;

                    default:
                        // All other tokens can be output. Keywords that do not require whitespace.
                        output += scanner.getTokenText();
                        break;
                }
            }

            if ( !isTrivia ) {
                lastNonTriviaToken = token;
            }
        }

        this.whiteSpaceAfter = output.length;
        this.whiteSpaceTime = new Date().getTime() - this.whiteSpaceTime;

        // FIXME:
        //if ( this.compilerOptions.diagnostics )
        //    this.reportWhitespaceStatistics();
        
        return jsContents; // output;
    }

    private reportWhitespaceStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportTime( "Whitespace time", this.whiteSpaceTime );
        statisticsReporter.reportPercentage( "Whitespace reduction", ( ( this.whiteSpaceBefore - this.whiteSpaceAfter ) / this.whiteSpaceBefore ) * 100.00 );
    }
}