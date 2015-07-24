var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var DiagnosticsReporter_1 = require("./DiagnosticsReporter");
var Logger_1 = require("./Logger");
var chalk = require("chalk");
var CompilerReporter = (function (_super) {
    __extends(CompilerReporter, _super);
    function CompilerReporter(result) {
        _super.call(this, result.getErrors());
        this.result = result;
    }
    CompilerReporter.prototype.reportStatistics = function () {
        var statistics = this.result.getStatistics();
        this.reportCountStatistic("Files", statistics.numberOfFiles);
        this.reportCountStatistic("Lines", statistics.numberOfLines);
        this.reportTimeStatistic("Compile time", statistics.compileTime);
    };
    CompilerReporter.prototype.reportStatisticalValue = function (name, value) {
        Logger_1.Logger.log(this.padRight(name + ":", 12) + chalk.magenta(this.padLeft(value.toString(), 10)));
    };
    CompilerReporter.prototype.reportCountStatistic = function (name, count) {
        this.reportStatisticalValue(name, "" + count);
    };
    CompilerReporter.prototype.reportTimeStatistic = function (name, time) {
        this.reportStatisticalValue(name, (time / 1000).toFixed(2) + "s");
    };
    CompilerReporter.prototype.padLeft = function (s, length) {
        while (s.length < length) {
            s = " " + s;
        }
        return s;
    };
    CompilerReporter.prototype.padRight = function (s, length) {
        while (s.length < length) {
            s = s + " ";
        }
        return s;
    };
    return CompilerReporter;
})(DiagnosticsReporter_1.DiagnosticsReporter);
exports.CompilerReporter = CompilerReporter;
//# sourceMappingURL=CompilerReporter.js.map