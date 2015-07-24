/// <reference path="references.d.ts" />

import { CompilerResult } from "./CompilerResult";
import { CompilerStatistics } from "./CompilerStatistics";
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
    private rootFileNames: string[];

    private compilerHost: CompilerHost;
    private program: ts.Program;
    private compilerOptions: ts.CompilerOptions;

    constructor( compilerHost: CompilerHost, program: ts.Program ) {
        this.compilerHost = compilerHost
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }

    public compileFilesToStream(
        compileStream: CompileStream,
        onError?: ( message: string ) => void ): CompilerResult {

        Logger.log( "TypeScript compiler version: ", ts.version );
        Logger.log( "Compiling Project Files..." );

        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics( this.program );

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( this.program ), preEmitDiagnostics );
        }

        // Compile the source files..
        let emitTime = 0;
        let startTime = new Date().getTime();

        var emitResult = this.program.emit();

        emitTime += new Date().getTime() - startTime;

        // If the emitter didn't emit anything, then pass that value along.
        if ( emitResult.emitSkipped ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( this.program, 0 ), emitResult.diagnostics );
        }

        var fileOutput = this.compilerHost.output;

        for ( var fileName in fileOutput ) {
            var fileData = fileOutput[fileName];

            var tsVinylFile = new TsVinylFile( {
                path: fileName,
                contents: new Buffer( fileData )
            });

            compileStream.push( tsVinylFile );
        }

        let allDiagnostics = preEmitDiagnostics.concat( emitResult.diagnostics );
        
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics( this.program, emitTime ), allDiagnostics );
        }

        return new CompilerResult( ts.ExitStatus.Success, new CompilerStatistics( this.program, emitTime ) );
    }
} 