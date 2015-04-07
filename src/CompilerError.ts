/// <reference path="./references.d.ts" />

import ts = require ( 'typescript' );

export class CompilerError {

    private fileName;
    private line;
    private column;
    private name;
    private message;

    constructor( info: ts.Diagnostic ) {

        var startPos = info.file.getLineAndCharacterOfPosition( info.start );

        this.fileName = info.file.fileName;
        this.line = startPos.line;
        this.column = startPos.character;
        this.name = 'TS' + info.code;
        this.message = info.messageText;
    }

    toString(): string {
        return this.fileName + '(' + this.line + ',' + this.column + '): ' + this.name + ': ' + this.message;
    }
}