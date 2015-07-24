var ts = require('typescript');
var CompilerResult = (function () {
    function CompilerResult(status, statistics, errors) {
        this.status = status;
        this.statistics = statistics,
            this.errors = errors;
    }
    CompilerResult.prototype.getErrors = function () {
        return this.errors;
    };
    CompilerResult.prototype.getStatistics = function () {
        return this.statistics;
    };
    CompilerResult.prototype.getStatus = function () {
        return this.status;
    };
    CompilerResult.prototype.succeeded = function () {
        return (this.status === ts.ExitStatus.Success);
    };
    return CompilerResult;
})();
exports.CompilerResult = CompilerResult;
//# sourceMappingURL=CompilerResult.js.map