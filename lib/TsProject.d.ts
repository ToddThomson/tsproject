import * as ts from "typescript";
import { Bundle } from "TsBundler";
import * as stream from "stream";
interface ProjectConfig {
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    fileNames?: string[];
    bundles?: Bundle[];
    errors?: ReadonlyArray<ts.Diagnostic>;
}
export { ProjectConfig };
export declare namespace TsProject {
    function getProjectConfig(configFilePath: string): ProjectConfig;
    function src(configFilePath: string, settings?: any): stream.Readable;
}
