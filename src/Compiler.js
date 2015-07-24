/// <reference path="references.d.ts" />
var CompilerResult_1 = require("./CompilerResult");
var CompilerStatistics_1 = require("./CompilerStatistics");
var Logger_1 = require("./Logger");
var TsVinylFile_1 = require("./TsVinylFile");
var ts = require('typescript');
var Compiler = (function () {
    function Compiler(compilerHost, program) {
        this.compilerHost = compilerHost;
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }
    Compiler.prototype.compileFilesToStream = function (compileStream, onError) {
        Logger_1.Logger.log("TypeScript compiler version: ", ts.version);
        Logger_1.Logger.log("Compiling Project Files...");
        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics(this.program);
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics_1.CompilerStatistics(this.program), preEmitDiagnostics);
        }
        // Compile the source files..
        var emitTime = 0;
        var startTime = new Date().getTime();
        var emitResult = this.program.emit();
        emitTime += new Date().getTime() - startTime;
        // If the emitter didn't emit anything, then pass that value along.
        if (emitResult.emitSkipped) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics_1.CompilerStatistics(this.program, 0), emitResult.diagnostics);
        }
        var fileOutput = this.compilerHost.output;
        for (var fileName in fileOutput) {
            var fileData = fileOutput[fileName];
            var tsVinylFile = new TsVinylFile_1.TsVinylFile({
                path: fileName,
                contents: new Buffer(fileData)
            });
            compileStream.push(tsVinylFile);
        }
        var allDiagnostics = preEmitDiagnostics.concat(emitResult.diagnostics);
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (allDiagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics_1.CompilerStatistics(this.program, emitTime), allDiagnostics);
        }
        return new CompilerResult_1.CompilerResult(ts.ExitStatus.Success, new CompilerStatistics_1.CompilerStatistics(this.program, emitTime));
    };
    return Compiler;
})();
exports.Compiler = Compiler;
//# sourceMappingURL=Compiler.js.map