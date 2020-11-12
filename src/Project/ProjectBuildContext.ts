import * as ts from "typescript";

import { Compiler } from "../Compiler/Compiler";
import { ProjectConfig } from "../Project/ProjectConfig";
import { CachingCompilerHost }  from "../Compiler/CachingCompilerHost";
import { CompileStream }  from "../Compiler/CompileStream";
import { TsCore } from "../Utils/TsCore";
import { Utils } from "../Utils/Utilities";

export class ProjectBuildContext {

    public host: CachingCompilerHost;
    private program: ts.Program;
    public config: ProjectConfig;

    // FIXME: Not referenced
    private files: ts.MapLike<string>;

    constructor( host: CachingCompilerHost, config: ProjectConfig, program?: ts.Program ) {
        this.host = host;
        this.setProgram( program );
        this.config = config;
    }

    public getProgram() {
        return this.program;
    }

    public setProgram( program: ts.Program ) {
        // Update the host with the new program
        //this.host.setReuseableProgram( program );

        this.program = program;
    }
}