var Logger_1 = require("./Logger");
var ts = require("typescript");
var chalk = require("chalk");
var DiagnosticsReporter = (function () {
    function DiagnosticsReporter(errors) {
        this.errors = errors;
    }
    DiagnosticsReporter.prototype.reportDiagnostics = function () {
        var diagnostics = this.errors;
        for (var i = 0; i < diagnostics.length; i++) {
            this.reportDiagnostic(diagnostics[i]);
        }
    };
    DiagnosticsReporter.prototype.reportDiagnostic = function (diagnostic) {
        var output = "";
        if (diagnostic.file) {
            var loc = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            output += chalk.gray(diagnostic.file.fileName + "(" + (loc.line + 1) + "," + (loc.character + 1) + "): ");
        }
        var category = chalk.red(ts.DiagnosticCategory[diagnostic.category].toLowerCase());
        output += category + " TS" + chalk.red(diagnostic.code + '') + ": " + chalk.grey(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        Logger_1.Logger.log(output);
    };
    return DiagnosticsReporter;
})();
exports.DiagnosticsReporter = DiagnosticsReporter;
//# sourceMappingURL=DiagnosticsReporter.js.map