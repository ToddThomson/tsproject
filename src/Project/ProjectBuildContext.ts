import * as ts from "typescript";

import { Compiler } from "../Compiler/Compiler";
import { ProjectConfig } from "../Project/ProjectConfig";
import { WatchCompilerHost }  from "../Compiler/WatchCompilerHost";
import { CompileStream }  from "../Compiler/CompileStream";
import { TsCore } from "../Utils/TsCore";
import { Utils } from "../Utils/Utilities";

export class ProjectBuildContext {

    public host: WatchCompilerHost;
    private program: ts.Program;
    public config: ProjectConfig;

    // FIXME: Not referenced
    private files: ts.MapLike<string>;

    constructor( host: WatchCompilerHost, config: ProjectConfig, program?: ts.Program ) {
        this.host = host;
        this.setProgram( program );
        this.config = config;
    }

    public isWatchMode() {
        this.config.compilerOptions.watch || false;
    }

    public getProgram() {
        return this.program;
    }

    public setProgram( program: ts.Program ) {

        if ( this.program ) {

            let newSourceFiles = program ? program.getSourceFiles() : undefined;

            Utils.forEach( this.program.getSourceFiles(), sourceFile => {

                // Remove fileWatcher from the outgoing program source files if they are not in the 
                // new program source file set

                if ( !( newSourceFiles && Utils.contains( newSourceFiles, sourceFile ) ) ) {

                    let watchedSourceFile: TsCore.WatchedSourceFile = sourceFile;

                    if ( watchedSourceFile.fileWatcher ) {
                        watchedSourceFile.fileWatcher.unwatch( watchedSourceFile.fileName );
                    }
                }
            });
        }

        // Update the host with the new program
        this.host.setReuseableProgram( program );

        this.program = program;
    }
}