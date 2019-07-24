import * as ts from "typescript";
import { ProjectConfig } from "../Project/ProjectConfig";

export class BuildContext {
    public host: ts.CompilerHost;
    private program: ts.Program;
    public config: ProjectConfig;

    constructor( config: ProjectConfig, program?: ts.Program ) {
        this.config = config; this.config = config;
        this.program = program;
    }

    public getProgram() {
        return this.program;
    }

    public setProgram( program: ts.Program ) {
        this.program = program;
    }
}