var utils = require("./Utilities");
var tsCore = require("./TsCore");
var CompilerStatistics = (function () {
    function CompilerStatistics(program, compileTime) {
        this.numberOfFiles = program.getSourceFiles().length;
        this.numberOfLines = this.compiledLines(program);
        this.compileTime = compileTime;
    }
    CompilerStatistics.prototype.compiledLines = function (program) {
        var _this = this;
        var count = 0;
        utils.forEach(program.getSourceFiles(), function (file) {
            if (!tsCore.isDeclarationFile(file)) {
                count += _this.getLineStarts(file).length;
            }
        });
        return count;
    };
    CompilerStatistics.prototype.getLineStarts = function (sourceFile) {
        return sourceFile.getLineStarts();
    };
    return CompilerStatistics;
})();
exports.CompilerStatistics = CompilerStatistics;
//# sourceMappingURL=CompilerStatistics.js.map