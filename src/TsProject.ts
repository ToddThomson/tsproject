/// <reference path="references.d.ts" />

import { Project } from "./Project";
import { Compiler } from "./Compiler";
import { CompilerResult } from "./CompilerResult";
import { CompileStream } from "./CompileStream";
import { BundleCompiler } from "./BundleCompiler";
import { Logger } from "./Logger";

function src( configDirPath: string, options?: any ) {

    if ( configDirPath === undefined && typeof configDirPath !== 'string' ) {
        throw new Error( "Provide a valid directory path to the project tsconfig.json" );
    }
    options = options || {};
    options.logLevel = options.logLevel || 0;
    Logger.setLevel( options.logLevel );

    var outputStream = new CompileStream();

    var project = new Project( configDirPath );
    project.build( outputStream );

    return outputStream;
}

var tsproject = {
    src: src
}

export = tsproject;