import { Logger } from "./Logger";
import * as ts from "typescript";
import chalk from "chalk";

export class DiagnosticsReporter {
    
    public static reportDiagnostics( diagnostics: ReadonlyArray<ts.Diagnostic> ) {
        if ( !diagnostics ) {
            return;
        }

        for ( var i = 0; i < diagnostics.length; i++ ) {
            this.reportDiagnostic( diagnostics[i] );
        }
    }

    public static reportDiagnostic( diagnostic: ts.Diagnostic ) {
        if ( !diagnostic ) {
            return;
        }

        var output = "";

        if ( diagnostic.file ) {
            var loc = ts.getLineAndCharacterOfPosition( diagnostic.file, diagnostic.start );

            output += chalk.gray( `${ diagnostic.file.fileName }(${ loc.line + 1 },${ loc.character + 1 }): ` );
        }

        var category;

        switch ( diagnostic.category ) {
            case ts.DiagnosticCategory.Error:
                category = chalk.red( ts.DiagnosticCategory[diagnostic.category].toLowerCase() );
                break;
            case ts.DiagnosticCategory.Warning:
                category = chalk.yellow( ts.DiagnosticCategory[diagnostic.category].toLowerCase() );
                break;
            default:
                category = chalk.green( ts.DiagnosticCategory[diagnostic.category].toLowerCase() );
        }

        output += `${category} TS${chalk.white( diagnostic.code + '' )}: ${chalk.grey( ts.flattenDiagnosticMessageText( diagnostic.messageText, "\n" ) )}`;

        Logger.log( output );
    }
} 