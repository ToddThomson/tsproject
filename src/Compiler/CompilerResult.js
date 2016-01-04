var ts = require("typescript");
var CompilerResult = (function () {
    function CompilerResult(status, errors) {
        this.status = status;
        this.errors = errors;
    }
    CompilerResult.prototype.getErrors = function () {
        return this.errors;
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