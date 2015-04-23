/// <reference path="references.d.ts" />

import { Project } from "./Project";
import { CompileStream } from "./CompileStream";
import { Logger } from "./Logger";

import ts = require( 'typescript' );
import chalk = require( "chalk" );

function src( configDirPath: string, settings?: any ) {

    if ( configDirPath === undefined && typeof configDirPath !== 'string' ) {
        throw new Error( "Provide a valid directory path to the project tsconfig.json" );
    }
    settings = settings || {};
    settings.logLevel = settings.logLevel || 0;
    Logger.setLevel( settings.logLevel );
    Logger.setName( "TsProject" );

    var outputStream = new CompileStream();

    var project = new Project( configDirPath );
    var buildStatus = project.build( outputStream );

    switch ( buildStatus ) {
        case ts.ExitStatus.Success:
            Logger.log( chalk.green( "Project build completed successfully." ) );
            break;
        case ts.ExitStatus.DiagnosticsPresent_OutputsSkipped:
            Logger.log( chalk.red( "Build completed with errors." ) );
            break;
        case ts.ExitStatus.DiagnosticsPresent_OutputsGenerated:
            Logger.log( chalk.red( "Build completed with errors. " + chalk.italic( "Outputs generated." ) ) );
            break;
    }

    return outputStream;
}

var tsproject = {
    src: src
    // FUTURE: to meet full vinyl adapter requirements
    // dest: dest,
    // watch: watch
}

export = tsproject;