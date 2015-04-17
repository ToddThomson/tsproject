/// <reference path="references.d.ts" />
/// <reference path="bundleparser.ts" />

import { CompilerResult } from "./CompilerResult";
import { CompilerHost }  from "./CompilerHost";
import { CompileStream }  from "./CompileStream";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle } from "./BundleParser";
import { DependencyBuilder } from "./DependencyBuilder";
import  * as utilities from "./Utilities";

import ts = require( 'typescript' );
import path = require( 'path' );

export class Compiler {

    public configFileName: string;
    private configDirPath: string;
    public errors: ts.Diagnostic[] = [];
    private rootFileNames: string[];
    private bundles: Bundle[];

    private compilerHost: CompilerHost;
    private program: ts.Program;
    private compilerOptions: ts.CompilerOptions = { charset: "utf-8" };

    constructor( compilerHost: CompilerHost, program: ts.Program ) {
        this.compilerHost = compilerHost
        this.program = program;
    }

    public compileFilesToStream( compileStream: CompileStream,
                            onComplete?: ( result: CompilerResult, program: ts.Program ) => void,
                            onError?: ( message: string ) => void ) {

        // Compile the source files..
        var emitResult = this.program.emit();

        var allDiagnostics = ts.getPreEmitDiagnostics( this.program ).concat( emitResult.diagnostics );

        var fileOutput = this.compilerHost.output;

        for ( var fileName in fileOutput ) {
            var fileData = fileOutput[fileName];

            var tsVinylFile = new TsVinylFile( {
                path: fileName,
                contents: new Buffer( fileData )
            });

            compileStream.push( tsVinylFile );
        } 

        // var result = new CompilerResult( fileOutput, allDiagnostics );

        // onComplete( result, program );
    }
} 