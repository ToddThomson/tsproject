import * as ts from "typescript";

export interface BundleFile {
    path: string,
    extension: string,
    text: string
}

export class BundleBuildResult {

    private status: ts.ExitStatus;
    private errors: ts.Diagnostic[];
    private bundleSource: BundleFile;

    constructor( status: ts.ExitStatus, errors?: ts.Diagnostic[], bundleSource?: BundleFile ) {
        this.status = status;
        this.errors = errors;
        this.bundleSource = bundleSource;
    }
    
    public getBundleSource(): BundleFile {
        return this.bundleSource;
    }

    public getErrors(): ts.Diagnostic[] {
        return this.errors;
    }
    
    public getStatus(): ts.ExitStatus {
        return this.status;
    }

    public succeeded(): boolean {
        return ( this.status === ts.ExitStatus.Success );
    }
}