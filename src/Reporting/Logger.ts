import chalk from "chalk";

export var level = {
    none: 0,
    error: 1,
    warn: 2,
    trace: 3,
    info: 4
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

    public static trace( ...args: any[] ) {
        if ( this.logLevel < level.error ) {
            return;
        }

        console.log( `[${this.logName}]` + chalk.gray( " TRACE: " ), ...args );
    }
}  