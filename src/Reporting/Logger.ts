import chalk = require( "chalk" );

export var level = {
    none: 0,
    info: 1,
    warn: 2,
    error: 3
};

export class Logger {
    private static logLevel: number = level.none;
    private static logName: string = "logger";

    public static setLevel( level: number ) {
        this.logLevel = level;
    }

    public static setName( name: string ) {
        this.logName = name;
    }

    public static log( ...args: any[] ) {
        console.log( chalk.gray( `[${this.logName}]` ), ...args );
    }

    public static info( ...args: any[] ) {
        if ( this.logLevel < level.info ) {
            return;
        }

        console.log( chalk.gray( `[${this.logName}]` + chalk.blue( " INFO: " ) ), ...args );
    }

    public static warn( ...args: any[] ) {
        if ( this.logLevel < level.warn ) {
            return;
        }

        console.log( `[${this.logName}]` + chalk.yellow( " WARNING: " ), ...args );
    }

    public static error( ...args: any[] ) {
        if ( this.logLevel < level.error ) {
            return;
        }

        console.log( `[${this.logName}]` + chalk.red( " ERROR: " ), ...args );
    }
}  