import * as stream from "stream";

export class BuildStream extends stream.Readable
{

    constructor( opts?: stream.ReadableOptions )
    {
        super( { objectMode: true } );
    }

    _read()
    {
        // Safely do nothing
    }
}