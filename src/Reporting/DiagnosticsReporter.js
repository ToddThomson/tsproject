var Logger_1 = require("./Logger");
var ts = require("typescript");
var chalk = require("chalk");
var DiagnosticsReporter = (function () {
    function DiagnosticsReporter() {
    }
    DiagnosticsReporter.reportDiagnostics = function (diagnostics) {
        if (!diagnostics) {
            return;
        }
        for (var i = 0; i < diagnostics.length; i++) {
            this.reportDiagnostic(diagnostics[i]);
        }
    };
    DiagnosticsReporter.reportDiagnostic = function (diagnostic) {
        if (!diagnostic) {
            return;
        }
        var output = "";
        if (diagnostic.file) {
            var loc = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            output += chalk.gray(diagnostic.file.fileName + "(" + (loc.line + 1) + "," + (loc.character + 1) + "): ");
        }
        var category;
        switch (diagnostic.category) {
            case ts.DiagnosticCategory.Error:
                category = chalk.red(ts.DiagnosticCategory[diagnostic.category].toLowerCase());
                break;
            case ts.DiagnosticCategory.Warning:
                category = chalk.yellow(ts.DiagnosticCategory[diagnostic.category].toLowerCase());
                break;
            default:
                category = chalk.green(ts.DiagnosticCategory[diagnostic.category].toLowerCase());
        }
        output += category + " TS" + chalk.white(diagnostic.code + '') + ": " + chalk.grey(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        Logger_1.Logger.log(output);
    };
    return DiagnosticsReporter;
})();
exports.DiagnosticsReporter = DiagnosticsReporter;
//# sourceMappingURL=DiagnosticsReporter.js.map