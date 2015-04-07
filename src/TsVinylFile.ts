import ts = require( "typescript" );
import File = require( "vinyl" );

export class TsVinylFile extends File {

    constructor( options ) {
        super( options );
    }

    public sourceFile: ts.SourceFile;
} 