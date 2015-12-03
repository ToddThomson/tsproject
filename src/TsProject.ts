import { Project } from "./Project";
import { CompileStream } from "./CompileStream";
import { Logger } from "./Logger";

import ts = require( "typescript" );
import chalk = require( "chalk" );

function src( configFilePath: string, settings?: any ) {

    if ( configFilePath === undefined && typeof configFilePath !== 'string' ) {
        throw new Error( "Provide a valid directory or file path to the Typescript project configuration json file." );
    }

    settings = settings || {};
    settings.logLevel = settings.logLevel || 0;

    Logger.setLevel( settings.logLevel );
    Logger.setName( "TsProject" );

    var outputStream = new CompileStream();

    var project = new Project( configFilePath, settings );
    project.build( outputStream );

    return outputStream;
}

var tsproject = {
    src: src
    // FUTURE: to meet full vinyl adapter requirements
    // dest: dest,
    // watch: watch
}

module.exports = tsproject;
