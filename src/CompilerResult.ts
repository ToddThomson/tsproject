import ts = require( "typescript" );
import { CompilerStatistics } from "./CompilerStatistics";

export class CompilerResult {

    private status: ts.ExitStatus;
    private errors: ts.Diagnostic[];
    private statistics: CompilerStatistics;

    constructor( status: ts.ExitStatus, statistics?: CompilerStatistics, errors?: ts.Diagnostic[] ) {
        this.status = status;
        this.statistics = statistics,
        this.errors = errors;
    }

    public getErrors(): ts.Diagnostic[] {
        return this.errors;
    }

    public getStatistics(): CompilerStatistics {
        return this.statistics;
    }

    public getStatus(): ts.ExitStatus {
        return this.status;
    }

    public succeeded(): boolean {
        return ( this.status === ts.ExitStatus.Success );
    }
}