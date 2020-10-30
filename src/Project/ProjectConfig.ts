import * as ts from "typescript";

import { TsCompilerOptions } from "../Compiler/TsCompilerOptions";
import { Bundle } from "../Bundler/BundleParser";

export interface ProjectConfig {
    success: boolean;
    compilerOptions?: TsCompilerOptions;
    fileNames?: string[];
    bundles?: Bundle[];
    errors?: ts.Diagnostic[];
}
