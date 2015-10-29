import ts = require ( "typescript" );

export class CompilerError {

    private fileName: string;
    private line: number;
    private column: number;
    private name: string;
    private message: any;

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