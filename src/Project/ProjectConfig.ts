import * as ts from "typescript"
import { Bundle } from "TsBundler"

export interface ProjectConfig
{
    fileName: string;
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    files?: string[];
    bundles?: Bundle[];
    errors?: ReadonlyArray<ts.Diagnostic>;
}
