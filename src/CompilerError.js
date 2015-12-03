var CompilerError = (function () {
    function CompilerError(info) {
        var startPos = info.file.getLineAndCharacterOfPosition(info.start);
        this.fileName = info.file.fileName;
        this.line = startPos.line;
        this.column = startPos.character;
        this.name = 'TS' + info.code;
        this.message = info.messageText;
    }
    CompilerError.prototype.toString = function () {
        return this.fileName + '(' + this.line + ',' + this.column + '): ' + this.name + ': ' + this.message;
    };
    return CompilerError;
})();
exports.CompilerError = CompilerError;
//# sourceMappingURL=CompilerError.js.map