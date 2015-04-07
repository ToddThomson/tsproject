/// <reference path="../definitions/typescript.d.ts" />

export var levels = {
    none: 0,
    log: 1
};

export class Logger {
    private static logLevel: number = levels.none;

    public static setLevel( level: number ) {
        this.logLevel = level;
    }

    public static log( ...args: any[] ) {
        if ( this.logLevel < levels.log ) {
            return;
        }

        console.log( args );
    }
} 