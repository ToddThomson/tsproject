import * as ts from "typescript";
import { Bundle } from "TsBundler";
import * as ts2js from "ts2js";
import * as stream from "stream";
interface ProjectConfig {
    fileName: string;
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    files?: string[];
    bundles?: Bundle[];
    errors?: ReadonlyArray<ts.Diagnostic>;
}
interface ProjectOptions {
    logLevel?: number;
    verbose?: boolean;
    outputToDisk?: boolean;
}
declare class Project {
    private configFilePath;
    private options;
    constructor(configFilePath: string, options?: ProjectOptions);
    getOptions(): ProjectOptions;
    getConfig(): ProjectConfig;
    private readFile(fileName);
    private getSettingsCompilerOptions(jsonSettings, configDirPath);
    private getDefaultOptions();
}
interface BuildResult {
    errors: ReadonlyArray<ts.Diagnostic>;
    compileResults?: ts2js.CompileResult[];
    succeeded(): boolean;
}
declare class ProjectBuilder {
    private project;
    private config;
    private options;
    private outputStream;
    private totalBuildTime;
    private totalCompileTime;
    private totalPreBuildTime;
    private totalBundleTime;
    constructor(project: Project);
    build(buildCompleted: (result: BuildResult) => void): void;
    src(): stream.Readable;
    private buildWorker(buildCompleted);
    private reportBuildStatus(buildResult);
    private reportStatistics();
}
export { ProjectConfig };
export { ProjectOptions };
export { BuildResult };
export { Project };
export { ProjectBuilder };
export declare namespace TsProject {
    function getProjectConfig(configFilePath: string): ProjectConfig;
    function builder(configFilePath: string, options?: ProjectOptions, buildCompleted?: (result: BuildResult) => void): ProjectBuilder;
    function src(configFilePath: string, options?: ProjectOptions): stream.Readable;
}
