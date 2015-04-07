import { CompilerError } from "./CompilerError";
import ts = require( 'typescript' );

export class CompilerResult {

    private fileResults;
    private code;
    private errors;

    constructor( fileResults, errorLines: ts.Diagnostic[] ) {
        this.fileResults = fileResults;
        var lines = [];
        fileResults.forEach( function ( v ) { return lines = lines.concat( v.file.lines ); });
        this.code = lines.join( "\n" );
        this.errors = [];

        for ( var i = 0; i < errorLines.length; i++ ) {
            var error = errorLines[i];
            this.errors.push( new CompilerError( error ) );
        }
    }

    isErrorAt( line, column, message ): boolean {
        for ( var i = 0; i < this.errors.length; i++ ) {
            if ( this.errors[i].line === line && this.errors[i].column === column && this.errors[i].message === message )
                return true;
        }

        return false;
    }
}