/// <reference path="references.d.ts" />
var Logger_1 = require("./Logger");
var ts = require("typescript");
var fs = require("fs");
var CompilerHost = (function () {
    function CompilerHost(compilerOptions) {
        var _this = this;
        this.output = {};
        this.writeFile = function (fileName, data, writeByteOrderMark, onError) {
            _this.output[fileName] = data;
        };
        this.compilerOptions = compilerOptions;
    }
    CompilerHost.prototype.getSourceFile = function (fileName, languageVersion, onError) {
        var text;
        // return undefined for a non-existent fileName
        if (!fs.existsSync(fileName)) {
            Logger_1.Logger.warn("File not found: ", fileName);
            return undefined;
        }
        try {
            text = fs.readFileSync(fileName).toString("utf8");
        }
        catch (e) {
            if (onError) {
                onError(e.message);
            }
        }
        if (text !== undefined) {
            return ts.createSourceFile(fileName, text, languageVersion);
        }
        Logger_1.Logger.warn("File not readable: ", fileName);
        return undefined;
    };
    CompilerHost.prototype.getDefaultLibFileName = function () {
        return ts.getDefaultLibFilePath(this.compilerOptions);
    };
    CompilerHost.prototype.useCaseSensitiveFileNames = function () {
        // var platform: string = os.platform();
        // win32\win64 are case insensitive platforms, MacOS (darwin) by default is also case insensitive
        return false; // ( platform !== "win32" && platform !== "win64" && platform !== "darwin" );
    };
    CompilerHost.prototype.getCanonicalFileName = function (fileName) {
        // if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
        // otherwise use toLowerCase as a canonical form.
        return fileName.toLowerCase();
    };
    CompilerHost.prototype.getCurrentDirectory = function () {
        return this.currentDirectory || (this.currentDirectory = process.cwd());
    };
    CompilerHost.prototype.getNewLine = function () {
        return "\n";
    };
    return CompilerHost;
})();
exports.CompilerHost = CompilerHost;
//# sourceMappingURL=CompilerHost.js.map