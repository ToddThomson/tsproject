import * as ts from "typescript"
import * as ts2js from "ts2js"
import * as Bundler from "tsbundler"

export interface BuildResult {
    errors: ReadonlyArray<ts.Diagnostic>;
    compileResult?: ts2js.CompileResult;
    succeeded(): boolean;
};

export class ProjectBuildResult implements BuildResult {
    errors: ReadonlyArray<ts.Diagnostic>;
    //bundleBuilderResults?: Bundler.BundleBuildResult[];
    compileResult?: ts2js.CompileResult;

    constructor( errors: ReadonlyArray<ts.Diagnostic>, compileResult?: ts2js.CompileResult ) {
        this.errors = errors;
        //this.bundleBuilderResults = bundleBuilderResults;
        this.compileResult = compileResult;
    }

    public succeeded(): boolean {
        return ( this.errors.length == 0 );
    }
}