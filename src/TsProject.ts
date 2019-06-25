import { ProjectBuilder } from "./Project/ProjectBuilder";
import { CompileStream } from "./Compiler/CompileStream";
import { Logger } from "./Reporting/Logger";

import * as stream from "stream";

export namespace TsProject {
    export function src( configFilePath: string, settings?: any ): stream.Readable {
        if ( configFilePath === undefined && typeof configFilePath !== 'string' ) {
            throw new Error( "Provide a valid directory or file path to the Typescript project configuration json file." );
        }

        settings = settings || {};
        settings.logLevel = settings.logLevel || 0;

        Logger.setLevel( settings.logLevel );
        Logger.setName( "TsProject" );

        var outputStream = new CompileStream();

        var project = new ProjectBuilder( configFilePath, settings );
        project.build( outputStream );

        return outputStream;
    }
}

// Nodejs module exports
module.exports = TsProject;