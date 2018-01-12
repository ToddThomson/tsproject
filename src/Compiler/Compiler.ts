import { CompilerResult } from "./CompilerResult";
import { CachingCompilerHost }  from "./CachingCompilerHost";
import { CompileStream }  from "./CompileStream";
import { TsCompilerOptions } from "./TsCompilerOptions";
import { StatisticsReporter } from "../Reporting/StatisticsReporter";
import { Logger } from "../Reporting/Logger";
import { Utils } from "../Utils/Utilities";
import { TsCore } from "../Utils/TsCore";

import * as ts from "typescript";
import * as path from "path";
import VinylFile = require( "vinyl" )

export class Compiler {

    private compilerHost: CachingCompilerHost;
    private program: ts.Program;
    private compileStream: CompileStream;
    private compilerOptions: TsCompilerOptions;

    private preEmitTime: number = 0;
    private emitTime: number = 0;
    private compileTime: number = 0;

    constructor( compilerHost: CachingCompilerHost, program: ts.Program, compileStream: CompileStream ) {
        this.compilerHost = compilerHost
        this.program = program;
        this.compileStream = compileStream;
        this.compilerOptions = this.program.getCompilerOptions();
    }

    public compile( onError?: ( message: string ) => void ): CompilerResult {
        this.compileTime = this.preEmitTime = new Date().getTime();

        Logger.log( "Compiling project files..." );

        // Check for preEmit diagnostics
        var diagnostics = ts.getPreEmitDiagnostics( this.program );

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && diagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics );
        }

        this.preEmitTime = new Date().getTime() - this.preEmitTime;

        if ( !this.compilerOptions.noEmit ) {
            // Compile the source files..
            let startTime = new Date().getTime();

            const emitResult = this.program.emit();

            this.emitTime = new Date().getTime() - startTime;

            diagnostics = diagnostics.concat( emitResult.diagnostics as ts.Diagnostic[] );

            // If the emitter didn't emit anything, then we're done
            if ( emitResult.emitSkipped ) {
                return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics );
            }

            // Stream the compilation output...
            var fileOutput = this.compilerHost.getOutput();

            for ( var fileName in fileOutput ) {
                var fileData = fileOutput[fileName];

                var tsVinylFile = new VinylFile( {
                    path: fileName,
                    contents: new Buffer( fileData )
                });

                this.compileStream.push( tsVinylFile );
            }
        }

        this.compileTime = new Date().getTime() - this.compileTime;

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( diagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, diagnostics );
        }

        // TODO: diagnostics is now internal

        if ( this.compilerOptions.diagnostics ) {
            this.reportStatistics();
        }

        return new CompilerResult( ts.ExitStatus.Success );
    }

    private reportStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportCount( "Files", this.program.getSourceFiles().length );
        statisticsReporter.reportCount( "Lines", this.compiledLines() );
        statisticsReporter.reportTime( "Pre-emit time", this.preEmitTime );
        statisticsReporter.reportTime( "Emit time", this.emitTime );
        statisticsReporter.reportTime( "Compile time", this.compileTime );
    }

    private compiledLines(): number {
        var count = 0;
        Utils.forEach( this.program.getSourceFiles(), file => {
            if ( !file.isDeclarationFile ) {
                count += this.getLineStarts( file ).length;
            }
        });

        return count;
    }

    private getLineStarts( sourceFile: ts.SourceFile ): ReadonlyArray<number> {
        return sourceFile.getLineStarts();
    }
} 