import ts = require( "typescript" );

import { Bundle } from "../Bundler/BundleParser";

export interface ProjectConfig {
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    fileNames?: string[];
    bundles?: Bundle[];
    errors?: ts.Diagnostic[];
}
