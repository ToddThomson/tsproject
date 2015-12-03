import { Logger } from "./Logger";

import ts = require( "typescript" );
import chalk = require( "chalk" );

export class StatisticsReporter {

    public reportTitle( name: string ) {
        Logger.log( name );
    }

    public reportValue( name: string, value: string ) {
        Logger.log( this.padRight( name + ":", 18 ) + chalk.magenta( this.padLeft( value.toString(), 10 ) ) );
    }

    public reportCount( name: string, count: number ) {
        this.reportValue( name, "" + count );
    }

    public reportTime( name: string, time: number ) {
        this.reportValue( name, ( time / 1000 ).toFixed( 2 ) + "s" );
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
 