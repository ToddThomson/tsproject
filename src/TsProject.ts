/// <reference path="references.d.ts" />

import { Project } from "./Project";
import { Compiler } from "./Compiler";
import { CompilerResult } from "./CompilerResult";
import { CompileStream } from "./CompileStream";
import { Bundler } from "./Bundler";
import { Logger } from "./Logger";

function src( configDirPath: string ) {

    if ( configDirPath === undefined && typeof configDirPath !== 'string' ) {
        throw new Error( "Provide a valid directory path to the project tsconfig.json" );
    }

    Logger.setLevel( 1 );

    var outputStream = new CompileStream();

    var project = new Project( configDirPath );
    project.build( outputStream );

    return outputStream;
}

var tsproject = {
    src: src
}

export = tsproject;