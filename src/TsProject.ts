/// <reference path="references.d.ts" />

import { Compiler } from "./Compiler";
import { CompilerResult } from "./CompilerResult";
import { CompileStream } from "./CompileStream";
import { Logger } from "./Logger";

function tsproject( configPath ) {

    Logger.setLevel( 0 );

    var compileStream = new CompileStream();
    var compiler = new Compiler( configPath );

    compiler.compileToStream( compileStream ); //, this.onComplete(), this.onError() );

    function onComplete( result: CompilerResult ) {
    }

    function onError( message: string ): void {
    }

    return compileStream;
}

export = tsproject;