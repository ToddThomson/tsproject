var ts = require("typescript");
var BundleResult = (function () {
    function BundleResult(status, errors, bundleSource) {
        this.status = status;
        this.errors = errors;
        this.bundleSource = bundleSource;
    }
    BundleResult.prototype.getBundleSource = function () {
        return this.bundleSource;
    };
    BundleResult.prototype.getErrors = function () {
        return this.errors;
    };
    BundleResult.prototype.getStatus = function () {
        return this.status;
    };
    BundleResult.prototype.succeeded = function () {
        return (this.status === ts.ExitStatus.Success);
    };
    return BundleResult;
})();
exports.BundleResult = BundleResult;
//# sourceMappingURL=BundleResult.js.map