import ts = require( "typescript" );
import { Bundle } from "./BundleParser";

export interface ProjectConfig {
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    fileNames?: string[];
    bundles?: Bundle[];
    errors?: ts.Diagnostic[];
}
