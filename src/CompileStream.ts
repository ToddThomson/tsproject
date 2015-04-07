/// <reference path="../definitions/node.d.ts" />

import stream = require( "stream" );

export class CompileStream extends stream.Readable {

    constructor(opts?: stream.ReadableOptions) {
        super( { objectMode: true });
    }

    _read() {
        // Safely do nothing
    }
}