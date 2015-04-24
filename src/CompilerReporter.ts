import { CompilerResult } from "./CompilerResult";
import { DiagnosticsReporter } from "./DiagnosticsReporter";
import { Logger } from "./Logger";

import ts = require( "typescript" );
import chalk = require( "chalk" );
import * as utils from "./utilities";

export class CompilerReporter extends DiagnosticsReporter{
    private result: CompilerResult;

    constructor( result: CompilerResult ) {
        super( result.getErrors() );
        this.result = result;
    }

    public reportStatistics() {
        var statistics = this.result.getStatistics();

        this.reportCountStatistic( "Files", statistics.numberOfFiles );
        this.reportCountStatistic( "Lines", statistics.numberOfLines );
        this.reportTimeStatistic( "Compile time", statistics.compileTime );
    }

    private reportStatisticalValue( name: string, value: string ) {
        Logger.log( this.padRight( name + ":", 12 ) + chalk.magenta( this.padLeft( value.toString(), 10 ) ) );
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
 