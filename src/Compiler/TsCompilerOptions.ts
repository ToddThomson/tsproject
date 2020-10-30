import * as ts from "typescript";

import { Logger } from "../Reporting/Logger";
import { TsCore } from "../Utils/TsCore";
import { Utils } from "../Utils/Utilities";

/**
 * @description Full typescript compiler options.
 */
export interface TsCompilerOptions extends ts.CompilerOptions {
    diagnostics?: boolean;
    listFiles?: boolean;
    watch?: boolean;
}