var CompilerResult_1 = require("./CompilerResult");
var StatisticsReporter_1 = require("./StatisticsReporter");
var Logger_1 = require("./Logger");
var TsVinylFile_1 = require("./TsVinylFile");
var Utilities_1 = require("./Utilities");
var TsCore_1 = require("./TsCore");
var ts = require("typescript");
var path = require('path');
var BundleCompiler = (function () {
    function BundleCompiler(compilerHost, program, outputStream) {
        this.bundleSourceFiles = {};
        this.compilerHost = compilerHost;
        this.program = program;
        this.outputStream = outputStream;
        this.compilerOptions = this.program.getCompilerOptions();
    }
    BundleCompiler.prototype.compile = function (bundleFile) {
        var _this = this;
        Logger_1.Logger.log("Compiling bundle files...");
        this.compileTime = this.preEmitTime = new Date().getTime();
        var outputText = {};
        var hostGetSourceFile;
        var bundleFileName = bundleFile.path;
        var bundleFileText = bundleFile.text;
        var bundleSourceFile = ts.createSourceFile(bundleFile.path, bundleFile.text, this.compilerOptions.target);
        this.bundleSourceFiles[bundleFileName] = bundleFileText;
        // Reuse the project program source files
        Utilities_1.Utils.forEach(this.program.getSourceFiles(), function (file) {
            _this.bundleSourceFiles[file.fileName] = file.text;
        });
        function writeFile(fileName, data, writeByteOrderMark, onError) {
            outputText[fileName] = data;
        }
        function getSourceFile(fileName, languageVersion, onError) {
            if (fileName === bundleFileName) {
                return bundleSourceFile;
            }
            // Use base class to get the source file
            var sourceFile = hostGetSourceFile(fileName, languageVersion, onError);
            return sourceFile;
        }
        // Override the compileHost getSourceFile() function to get the bundle source file
        hostGetSourceFile = this.compilerHost.getSourceFile;
        this.compilerHost.getSourceFile = getSourceFile;
        this.compilerHost.writeFile = writeFile;
        // Get the list of bundle files to pass to program 
        var bundleFiles = [];
        bundleFiles.push(bundleFileName);
        Utilities_1.Utils.forEach(this.program.getSourceFiles(), function (file) {
            bundleFiles.push(file.fileName);
        });
        // Pass the current project build program to reuse program structure
        var bundlerProgram = ts.createProgram(bundleFiles, this.compilerOptions, this.compilerHost); //CompilerHost, this.program );
        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics(bundlerProgram);
        this.preEmitTime = new Date().getTime() - this.preEmitTime;
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, preEmitDiagnostics);
        }
        this.emitTime = new Date().getTime();
        var emitResult = bundlerProgram.emit();
        //var emitResult = this.getBundleOutput( bundleSourceFile, bundlerProgram );
        this.emitTime = new Date().getTime() - this.emitTime;
        // If the emitter didn't emit anything, then pass that value along.
        if (emitResult.emitSkipped) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped); //, emitResult.diagnostics );
        }
        var allDiagnostics = preEmitDiagnostics.concat(emitResult.diagnostics);
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (allDiagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics);
        }
        // Stream the bundle source file ts, and emitted files...
        this.streamIoTime = new Date().getTime();
        Logger_1.Logger.info("Streaming vinyl bundle source: ", bundleFile.path);
        var tsVinylFile = new TsVinylFile_1.TsVinylFile({
            path: bundleFile.path,
            contents: new Buffer(bundleFile.text)
        });
        this.outputStream.push(tsVinylFile);
        var bundleDir = path.dirname(bundleFile.path);
        var bundleName = path.basename(bundleFile.path, bundleFile.extension);
        var jsBundlePath = TsCore_1.TsCore.normalizeSlashes(path.join(bundleDir, bundleName + ".js"));
        // js should have been generated, but just in case!
        if (Utilities_1.Utils.hasProperty(outputText, jsBundlePath)) {
            Logger_1.Logger.info("Streaming vinyl js: ", bundleName);
            var bundleJsVinylFile = new TsVinylFile_1.TsVinylFile({
                path: jsBundlePath,
                contents: new Buffer(outputText[jsBundlePath])
            });
            this.outputStream.push(bundleJsVinylFile);
        }
        var dtsBundlePath = TsCore_1.TsCore.normalizeSlashes(path.join(bundleDir, bundleName + ".d.ts"));
        // d.ts is generated, if compiler option declaration is true
        if (Utilities_1.Utils.hasProperty(outputText, dtsBundlePath)) {
            Logger_1.Logger.info("Streaming vinyl d.ts: ", dtsBundlePath);
            var bundleDtsVinylFile = new TsVinylFile_1.TsVinylFile({
                path: dtsBundlePath,
                contents: new Buffer(outputText[dtsBundlePath])
            });
            this.outputStream.push(bundleDtsVinylFile);
        }
        var mapBundlePath = TsCore_1.TsCore.normalizeSlashes(path.join(bundleDir, bundleName + ".js.map"));
        // js.map is generated, if compiler option sourceMap is true
        if (Utilities_1.Utils.hasProperty(outputText, mapBundlePath)) {
            Logger_1.Logger.info("Streaming vinyl js.map: ", mapBundlePath);
            var bundleMapVinylFile = new TsVinylFile_1.TsVinylFile({
                path: mapBundlePath,
                contents: new Buffer(outputText[mapBundlePath])
            });
            this.outputStream.push(bundleMapVinylFile);
        }
        this.streamIoTime = new Date().getTime() - this.streamIoTime;
        this.compileTime = new Date().getTime() - this.compileTime;
        if (this.compilerOptions.diagnostics)
            this.reportStatistics();
        return new CompilerResult_1.CompilerResult(ts.ExitStatus.Success);
    };
    BundleCompiler.prototype.getBundleOutput = function (bundleSourceFile, program) {
        var outputFiles = [];
        function writeFile(fileName, data, writeByteOrderMark) {
            outputFiles.push({
                name: fileName,
                writeByteOrderMark: writeByteOrderMark,
                text: data
            });
        }
        var emitOutput = program.emit(bundleSourceFile, writeFile);
        return {
            outputFiles: outputFiles,
            emitSkipped: emitOutput.emitSkipped
        };
    };
    BundleCompiler.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter_1.StatisticsReporter();
        statisticsReporter.reportTime("Pre-emit time", this.preEmitTime);
        statisticsReporter.reportTime("Emit time", this.emitTime);
        statisticsReporter.reportTime("Stream IO time", this.streamIoTime);
        statisticsReporter.reportTime("Compile time", this.compileTime);
    };
    return BundleCompiler;
})();
exports.BundleCompiler = BundleCompiler;
//# sourceMappingURL=BundleCompiler.js.map