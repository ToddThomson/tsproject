import ts = require( 'typescript' );
import * as utils from "./utilities";

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
        utils.forEach( program.getSourceFiles(), file => {
            if ( !utils.isDeclarationFile( file ) ) {
                count += this.getLineStarts( file ).length;
            }
        });

        return count;
    }

    private getLineStarts( sourceFile: ts.SourceFile ): number[] {
        // return sourceFile.lineMap || ( sourceFile.lineMap = ts.computeLineStarts( sourceFile.text ) );
        return ts.computeLineStarts( sourceFile.text );
    }
} 