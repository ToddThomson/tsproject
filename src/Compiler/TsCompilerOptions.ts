import * as ts from "typescript";

/**
 * @description Full typescript compiler options.
 */
export interface TsCompilerOptions extends ts.CompilerOptions {
    diagnostics?: boolean;
    listFiles?: boolean;
    traceResolution?: boolean;
}