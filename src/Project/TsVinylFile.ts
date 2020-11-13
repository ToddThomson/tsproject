﻿import * as ts from "typescript";
import File = require( "vinyl" );

export class TsVinylFile extends File {

    constructor( options?: any  ) {
        super( options );
    }

    public sourceFile: ts.SourceFile;
} 