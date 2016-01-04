var CompilerResult_1 = require("./CompilerResult");
var StatisticsReporter_1 = require("../Reporting/StatisticsReporter");
var Logger_1 = require("../Reporting/Logger");
var TsVinylFile_1 = require("../Project/TsVinylFile");
var Utilities_1 = require("../Utils/Utilities");
var TsCore_1 = require("../Utils/TsCore");
var ts = require("typescript");
var Compiler = (function () {
    function Compiler(compilerHost, program, compileStream) {
        this.preEmitTime = 0;
        this.emitTime = 0;
        this.compileTime = 0;
        this.compilerHost = compilerHost;
        this.program = program;
        this.compileStream = compileStream;
        this.compilerOptions = this.program.getCompilerOptions();
    }
    Compiler.prototype.compile = function (onError) {
        this.compileTime = this.preEmitTime = new Date().getTime();
        Logger_1.Logger.log("Compiling project files...");
        // Check for preEmit diagnostics
        var diagnostics = ts.getPreEmitDiagnostics(this.program);
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && diagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics);
        }
        this.preEmitTime = new Date().getTime() - this.preEmitTime;
        if (!this.compilerOptions.noEmit) {
            // Compile the source files..
            var startTime = new Date().getTime();
            var emitResult = this.program.emit();
            this.emitTime = new Date().getTime() - startTime;
            diagnostics = diagnostics.concat(emitResult.diagnostics);
            // If the emitter didn't emit anything, then we're done
            if (emitResult.emitSkipped) {
                return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics);
            }
            // Stream the compilation output...
            var fileOutput = this.compilerHost.getOutput();
            for (var fileName in fileOutput) {
                var fileData = fileOutput[fileName];
                var tsVinylFile = new TsVinylFile_1.TsVinylFile({
                    path: fileName,
                    contents: new Buffer(fileData)
                });
                this.compileStream.push(tsVinylFile);
            }
        }
        this.compileTime = new Date().getTime() - this.compileTime;
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (diagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, diagnostics);
        }
        if (this.compilerOptions.diagnostics) {
            this.reportStatistics();
        }
        return new CompilerResult_1.CompilerResult(ts.ExitStatus.Success);
    };
    Compiler.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter_1.StatisticsReporter();
        statisticsReporter.reportCount("Files", this.program.getSourceFiles().length);
        statisticsReporter.reportCount("Lines", this.compiledLines());
        statisticsReporter.reportTime("Pre-emit time", this.preEmitTime);
        statisticsReporter.reportTime("Emit time", this.emitTime);
        statisticsReporter.reportTime("Compile time", this.compileTime);
    };
    Compiler.prototype.compiledLines = function () {
        var _this = this;
        var count = 0;
        Utilities_1.Utils.forEach(this.program.getSourceFiles(), function (file) {
            if (!TsCore_1.TsCore.isDeclarationFile(file)) {
                count += _this.getLineStarts(file).length;
            }
        });
        return count;
    };
    Compiler.prototype.getLineStarts = function (sourceFile) {
        return sourceFile.getLineStarts();
    };
    return Compiler;
})();
exports.Compiler = Compiler;
//# sourceMappingURL=Compiler.js.map