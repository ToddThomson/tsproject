var CompilerResult_1 = require("../Compiler/CompilerResult");
var StatisticsReporter_1 = require("../Reporting/StatisticsReporter");
var Logger_1 = require("../Reporting/Logger");
var TsVinylFile_1 = require("../Project/TsVinylFile");
var BundleMinifier_1 = require("../Minifier/BundleMinifier");
var Utilities_1 = require("../Utils/Utilities");
var TsCore_1 = require("../Utils/TsCore");
var ts = require("typescript");
var path = require('path');
var BundleCompiler = (function () {
    function BundleCompiler(compilerHost, program, outputStream) {
        this.emitTime = 0;
        this.compileTime = 0;
        this.preEmitTime = 0;
        this.bundleSourceFiles = {};
        this.compilerHost = compilerHost;
        this.program = program;
        this.outputStream = outputStream;
        this.compilerOptions = this.program.getCompilerOptions();
    }
    BundleCompiler.prototype.compile = function (bundleFile, bundleConfig) {
        var _this = this;
        Logger_1.Logger.log("Compiling bundle...");
        this.compileTime = this.preEmitTime = new Date().getTime();
        // The list of bundle files to pass to program 
        var bundleFiles = [];
        // Bundle data
        var bundleFileName;
        var bundleFileText;
        var bundleSourceFile;
        Utilities_1.Utils.forEach(this.program.getSourceFiles(), function (file) {
            bundleFiles.push(file.fileName);
        });
        var outputText = {};
        var defaultGetSourceFile;
        var minifyBundle = bundleConfig.minify || false;
        if (minifyBundle) {
            // Create the minified bundle fileName
            var bundleDir_1 = path.dirname(bundleFile.path);
            var bundleName_1 = path.basename(bundleFile.path, bundleFile.extension);
            bundleFileName = TsCore_1.TsCore.normalizeSlashes(path.join(bundleDir_1, bundleName_1 + ".min.ts"));
        }
        else {
            bundleFileName = bundleFile.path;
        }
        bundleFileText = bundleFile.text;
        this.bundleSourceFiles[bundleFileName] = bundleFileText;
        bundleSourceFile = ts.createSourceFile(bundleFileName, bundleFile.text, this.compilerOptions.target);
        bundleFiles.push(bundleFileName);
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
            var sourceFile = defaultGetSourceFile(fileName, languageVersion, onError);
            return sourceFile;
        }
        // Override the compileHost getSourceFile() function to get the bundle source file
        defaultGetSourceFile = this.compilerHost.getSourceFile;
        this.compilerHost.getSourceFile = getSourceFile;
        this.compilerHost.writeFile = writeFile;
        // Allow bundle config to extent the project compilerOptions for declaration and source map emitted output
        var compilerOptions = this.compilerOptions;
        compilerOptions.declaration = bundleConfig.declaration || this.compilerOptions.declaration;
        compilerOptions.sourceMap = bundleConfig.sourceMap || this.compilerOptions.sourceMap;
        compilerOptions.noEmit = false; // Always emit bundle output
        if (minifyBundle) {
            compilerOptions.removeComments = true;
        }
        // Pass the current project build program to reuse program structure
        var bundlerProgram = ts.createProgram(bundleFiles, compilerOptions, this.compilerHost); //CompilerHost, this.program );
        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics(bundlerProgram);
        this.preEmitTime = new Date().getTime() - this.preEmitTime;
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, preEmitDiagnostics);
        }
        if (minifyBundle) {
            Logger_1.Logger.log("Minifying bundle...");
            var minifier = new BundleMinifier_1.BundleMinifier(bundlerProgram, compilerOptions);
            bundleSourceFile = minifier.transform(bundleSourceFile);
        }
        this.emitTime = new Date().getTime();
        var emitResult = bundlerProgram.emit(bundleSourceFile);
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
        Logger_1.Logger.info("Streaming vinyl bundle source: ", bundleFileName);
        var tsVinylFile = new TsVinylFile_1.TsVinylFile({
            path: bundleFileName,
            contents: new Buffer(bundleFile.text)
        });
        this.outputStream.push(tsVinylFile);
        var bundleDir = path.dirname(bundleFile.path);
        var bundleName = path.basename(bundleFile.path, bundleFile.extension);
        var bundlePrefixExt = minifyBundle ? ".min" : "";
        var jsBundlePath = TsCore_1.TsCore.normalizeSlashes(path.join(bundleDir, bundleName + bundlePrefixExt + ".js"));
        // js should have been generated, but just in case!
        if (Utilities_1.Utils.hasProperty(outputText, jsBundlePath)) {
            var jsContents = outputText[jsBundlePath];
            if (minifyBundle) {
                // Whitespace removal cannot be performed in the AST minification transform, so
                // we do it here for now
                var minifier = new BundleMinifier_1.BundleMinifier(bundlerProgram, compilerOptions);
                jsContents = minifier.removeWhitespace(jsContents);
            }
            Logger_1.Logger.info("Streaming vinyl js: ", bundleName);
            var bundleJsVinylFile = new TsVinylFile_1.TsVinylFile({
                path: jsBundlePath,
                contents: new Buffer(jsContents)
            });
            this.outputStream.push(bundleJsVinylFile);
        }
        var dtsBundlePath = TsCore_1.TsCore.normalizeSlashes(path.join(bundleDir, bundleName + bundlePrefixExt + ".d.ts"));
        // d.ts is generated, if compiler option declaration is true
        if (Utilities_1.Utils.hasProperty(outputText, dtsBundlePath)) {
            Logger_1.Logger.info("Streaming vinyl d.ts: ", dtsBundlePath);
            var bundleDtsVinylFile = new TsVinylFile_1.TsVinylFile({
                path: dtsBundlePath,
                contents: new Buffer(outputText[dtsBundlePath])
            });
            this.outputStream.push(bundleDtsVinylFile);
        }
        var mapBundlePath = TsCore_1.TsCore.normalizeSlashes(path.join(bundleDir, bundleName + bundlePrefixExt + ".js.map"));
        // js.map is generated, if compiler option sourceMap is true
        if (Utilities_1.Utils.hasProperty(outputText, mapBundlePath)) {
            Logger_1.Logger.info("Streaming vinyl js.map: ", mapBundlePath);
            var bundleMapVinylFile = new TsVinylFile_1.TsVinylFile({
                path: mapBundlePath,
                contents: new Buffer(outputText[mapBundlePath])
            });
            this.outputStream.push(bundleMapVinylFile);
        }
        this.compileTime = new Date().getTime() - this.compileTime;
        if (this.compilerOptions.diagnostics)
            this.reportStatistics();
        return new CompilerResult_1.CompilerResult(ts.ExitStatus.Success);
    };
    BundleCompiler.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter_1.StatisticsReporter();
        statisticsReporter.reportTime("Pre-emit time", this.preEmitTime);
        statisticsReporter.reportTime("Emit time", this.emitTime);
        statisticsReporter.reportTime("Compile time", this.compileTime);
    };
    return BundleCompiler;
})();
exports.BundleCompiler = BundleCompiler;
//# sourceMappingURL=BundleCompiler.js.map