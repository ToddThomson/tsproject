import ts = require( "typescript" );
import { Utils } from "./Utilities";
import { TsCore } from "./TsCore";

export class CompilerStatistics {
    public numberOfFiles: number;
    public numberOfLines: number;
    public compileTime: number;

    constructor( program: ts.Program, compileTime?: number ) {
        this.numberOfFiles = program.getSourceFiles().length;
        this.numberOfLines = this.compiledLines( program );
        this.compileTime = compileTime;
    }

    private compiledLines( program: ts.Program ): number {
        var count = 0;
        Utils.forEach( program.getSourceFiles(), file => {
            if ( !TsCore.isDeclarationFile( file ) ) {
                count += this.getLineStarts( file ).length;
            }
        });

        return count;
    }

    private getLineStarts( sourceFile: ts.SourceFile ): number[] {
        return sourceFile.getLineStarts();
    }
} 