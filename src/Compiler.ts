import { CompilerResult } from "./CompilerResult";
import { CachingCompilerHost }  from "./CachingCompilerHost";
import { CompileStream }  from "./CompileStream";
import { StatisticsReporter } from "./StatisticsReporter";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { Utils } from "./Utilities";
import { TsCore } from "./TsCore";

import ts = require( "typescript" );
import path = require( "path" );

export class Compiler {

    private compilerHost: CachingCompilerHost;
    private program: ts.Program;
    private compileStream: CompileStream;
    private compilerOptions: ts.CompilerOptions;

    private preEmitTime;
    private emitTime;
    private streamTime;
    private compileTime;

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
        var preEmitDiagnostics = ts.getPreEmitDiagnostics( this.program );

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, preEmitDiagnostics );
        }

        this.preEmitTime = new Date().getTime() - this.preEmitTime;

        // Compile the source files..
        let startTime = new Date().getTime();

        var emitResult = this.program.emit();

        this.emitTime = new Date().getTime() - startTime;

        let allDiagnostics = preEmitDiagnostics.concat( emitResult.diagnostics );

        // If the emitter didn't emit anything, then we're done
        if ( emitResult.emitSkipped ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, allDiagnostics );
        }

        this.streamTime = new Date().getTime();
        
        // Stream the compilation output...
        var fileOutput = this.compilerHost.getOutput();

        for ( var fileName in fileOutput ) {
            var fileData = fileOutput[fileName];

            var tsVinylFile = new TsVinylFile( {
                path: fileName,
                contents: new Buffer( fileData )
            });

            this.compileStream.push( tsVinylFile );
        }

        this.streamTime = new Date().getTime() - this.streamTime;
        this.compileTime = new Date().getTime() - this.compileTime;

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics );
        }

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
        statisticsReporter.reportTime( "Stream IO time", this.streamTime );
        statisticsReporter.reportTime( "Compile time", this.compileTime );
    }

    private compiledLines(): number {
        var count = 0;
        Utils.forEach( this.program.getSourceFiles(), file => {
            if ( !TsCore.isDeclarationFile( file ) ) {
                count += this.getLineStarts( file ).length;
            }
        });

        return count;
    }

    private getLineStarts( sourceFile: ts.SourceFile ): number[] {
        return sourceFile.getLineStarts();
    }
} 