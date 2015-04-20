import ts = require( "typescript" );
import chalk = require( "chalk" );
import { CompilerResult } from "./CompilerResult";
import * as utils from "./utilities";

export class CompilerReporter {
    private result: CompilerResult;

    constructor( result: CompilerResult ) {
        this.result = result;
    }

    public reportDiagnostics() {
        var diagnostics = this.result.getErrors();

        for ( var i = 0; i < diagnostics.length; i++ ) {
            this.reportDiagnostic( diagnostics[i] );
        }
    }

    public reportStatistics() {
        var statistics = this.result.getStatistics();

        this.reportCountStatistic( "Files", statistics.numberOfFiles );
        this.reportCountStatistic( "Lines", statistics.numberOfLines );
        this.reportTimeStatistic( "Compile time", statistics.compileTime );
    }

    private reportDiagnostic( diagnostic: ts.Diagnostic ) {
        var output = "";

        if ( diagnostic.file ) {
            var loc = ts.getLineAndCharacterOfPosition( diagnostic.file, diagnostic.start );

            output += chalk.gray( `${ diagnostic.file.fileName }(${ loc.line + 1 },${ loc.character + 1 }): ` );
        }

        var category = chalk.red( ts.DiagnosticCategory[diagnostic.category].toLowerCase() );
        output += `${ category } TS${ chalk.red( diagnostic.code + '' ) }: ${ chalk.grey( ts.flattenDiagnosticMessageText( diagnostic.messageText, "\n" ) ) }`;

        console.log( output );
    }

    private reportStatisticalValue( name: string, value: string ) {
        console.log( this.padRight( name + ":", 12 ) + this.padLeft( value.toString(), 10 ) );
    }

    private reportCountStatistic( name: string, count: number ) {
        this.reportStatisticalValue( name, "" + count );
    }

    private reportTimeStatistic( name: string, time: number ) {
        this.reportStatisticalValue( name, ( time / 1000 ).toFixed( 2 ) + "s" );
    }

    private padLeft( s: string, length: number ) {
        while ( s.length < length ) {
            s = " " + s;
        }
        return s;
    }

    private padRight( s: string, length: number ) {
        while ( s.length < length ) {
            s = s + " ";
        }

        return s;
    }
}
 