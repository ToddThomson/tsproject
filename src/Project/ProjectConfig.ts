import * as ts from "typescript";
import { Bundle } from "TsBundler";

export interface ProjectConfig {
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    fileNames?: string[];
    bundles?: Bundle[];
    errors?: ReadonlyArray<ts.Diagnostic>;
}
