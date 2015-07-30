var CompilerResult_1 = require("./CompilerResult");
var CompilerStatistics_1 = require("./CompilerStatistics");
var Logger_1 = require("./Logger");
var TsVinylFile_1 = require("./TsVinylFile");
var DependencyBuilder_1 = require("./DependencyBuilder");
var utils = require("./Utilities");
var tsCore = require("./TsCore");
var ts = require('typescript');
var fs = require("fs");
var path = require('path');
var BundleCompiler = (function () {
    function BundleCompiler(compilerHost, program) {
        this.outputText = {};
        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleImportedModuleBlocks = {};
        this.bundleSourceFiles = {};
        this.compilerHost = compilerHost;
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }
    BundleCompiler.prototype.compileBundleToStream = function (outputStream, bundle) {
        var _this = this;
        var dependencyBuilder = new DependencyBuilder_1.DependencyBuilder(this.compilerHost, this.program);
        // Construct bundle output file name
        var bundleBaseDir = path.dirname(bundle.name);
        if (bundle.config.outDir) {
            bundleBaseDir = path.normalize(path.resolve(bundleBaseDir, bundle.config.outDir));
        }
        var bundleFilePath = path.join(bundleBaseDir, path.basename(bundle.name));
        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleImportedModuleBlocks = {};
        this.bundleSourceFiles = {};
        var allDependencies = {};
        for (var filesKey in bundle.files) {
            var fileName = bundle.files[filesKey];
            Logger_1.Logger.info(">>> Processing bundle file:", fileName);
            var bundleSourceFileName = this.compilerHost.getCanonicalFileName(tsCore.normalizeSlashes(fileName));
            Logger_1.Logger.info("BundleSourceFileName:", bundleSourceFileName);
            var bundleSourceFile = this.program.getSourceFile(bundleSourceFileName);
            if (!bundleSourceFile) {
                var diagnostic = tsCore.createDiagnostic({ code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle Source File '{0}' not found." }, bundleSourceFileName);
                return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics_1.CompilerStatistics(this.program, 0), [diagnostic]);
            }
            var sourceDependencies = dependencyBuilder.getSourceFileDependencies(bundleSourceFile);
            // Merge current bundle file dependencies into all dependencies
            for (var mergeKey in sourceDependencies) {
                if (!utils.hasProperty(allDependencies, mergeKey)) {
                    allDependencies[mergeKey] = sourceDependencies[mergeKey];
                }
            }
            Logger_1.Logger.info("traversing source dependencies for: ", bundleSourceFile.fileName);
            for (var depKey in sourceDependencies) {
                // Add module dependencies first..
                sourceDependencies[depKey].forEach(function (importNode) {
                    var importSymbol = _this.getSymbolFromNode(importNode);
                    if (_this.isCodeModule(importSymbol)) {
                        var declaration = importSymbol.getDeclarations()[0];
                        var importedSource = declaration.getSourceFile();
                        var importedSourceFileName = importedSource.fileName;
                        if (!utils.hasProperty(_this.bundleImportedFiles, importedSourceFileName)) {
                            _this.addSourceFile(importedSource);
                        }
                    }
                    else {
                        // Import Module block
                        var importedModuleBlockName = importSymbol.name;
                        if (!utils.hasProperty(_this.bundleImportedModuleBlocks, importedModuleBlockName)) {
                            var moduleBlockText = importNode.getText();
                            _this.addModuleBlock(moduleBlockText);
                            _this.bundleImportedModuleBlocks[importedModuleBlockName] = importedModuleBlockName;
                        }
                    }
                });
            }
            // Finally, add bundle source file
            this.addSourceFile(bundleSourceFile);
        }
        Logger_1.Logger.info("Streaming vinyl ts: ", bundleFilePath + ".ts");
        var tsVinylFile = new TsVinylFile_1.TsVinylFile({
            path: bundleFilePath + ".ts",
            contents: new Buffer(this.bundleText)
        });
        outputStream.push(tsVinylFile);
        // Compile the bundle to generate javascript and declaration file
        var compileResult = this.compileBundle(path.basename(bundle.name) + ".ts", this.bundleText);
        var compileStatus = compileResult.getStatus();
        // Only stream bundle if there is some compiled output
        if (compileStatus !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped) {
            // js should have been generated, but just in case!
            if (utils.hasProperty(this.outputText, path.basename(bundle.name) + ".js")) {
                Logger_1.Logger.info("Streaming vinyl js: ", bundleFilePath + ".js");
                var bundleJsVinylFile = new TsVinylFile_1.TsVinylFile({
                    path: path.join(bundleFilePath + ".js"),
                    contents: new Buffer(this.outputText[path.basename(bundle.name) + ".js"])
                });
                outputStream.push(bundleJsVinylFile);
            }
        }
        // Only stream bundle definition if the compile was successful
        if (compileStatus === ts.ExitStatus.Success) {
            // d.ts should have been generated, but just in case
            if (utils.hasProperty(this.outputText, path.basename(bundle.name) + ".d.ts")) {
                Logger_1.Logger.info("Streaming vinyl d.ts: ", bundleFilePath + ".d.ts");
                var bundleDtsVinylFile = new TsVinylFile_1.TsVinylFile({
                    path: path.join(bundleFilePath + ".d.ts"),
                    contents: new Buffer(this.outputText[path.basename(bundle.name) + ".d.ts"])
                });
                outputStream.push(bundleDtsVinylFile);
            }
        }
        return compileResult;
    };
    BundleCompiler.prototype.processImportStatements = function (file) {
        var _this = this;
        Logger_1.Logger.info("Processing import statements in file: ", file.fileName);
        var editText = file.text;
        ts.forEachChild(file, function (node) {
            if (node.kind === 210 /* ImportDeclaration */ || node.kind === 209 /* ImportEqualsDeclaration */ || node.kind === 216 /* ExportDeclaration */) {
                Logger_1.Logger.info("processImportStatements() found import");
                var moduleNameExpr = tsCore.getExternalModuleName(node);
                if (moduleNameExpr && moduleNameExpr.kind === 8 /* StringLiteral */) {
                    var moduleSymbol = _this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
                    if ((moduleSymbol) && (_this.isCodeModule(moduleSymbol) || _this.isAmbientModule)) {
                        Logger_1.Logger.info("processImportStatements() removing code module symbol");
                        var pos = node.pos;
                        var end = node.end;
                        // White out import statement. 
                        // NOTE: Length needs to stay the same as original import statement
                        var length_1 = end - pos;
                        var middle = "";
                        for (var i = 0; i < length_1; i++) {
                            middle += " ";
                        }
                        var prefix = editText.substring(0, pos);
                        var suffix = editText.substring(end);
                        editText = prefix + middle + suffix;
                    }
                }
            }
        });
        return editText;
    };
    BundleCompiler.prototype.addModuleBlock = function (moduleBlockText) {
        Logger_1.Logger.info("Entering addModuleBlock()");
        this.bundleText += moduleBlockText + "\n";
    };
    BundleCompiler.prototype.addSourceFile = function (file) {
        Logger_1.Logger.info("Entering addSourceFile() with: ", file.fileName);
        if (this.isCodeSourceFile(file)) {
            // Before adding the source text, we must white out import statement(s)
            var editText = this.processImportStatements(file);
            this.bundleText += editText + "\n";
            this.bundleImportedFiles[file.fileName] = file.fileName;
        }
        else {
            // Add d.ts files to the build source files context
            if (!utils.hasProperty(this.bundleSourceFiles, file.fileName)) {
                Logger_1.Logger.info("Adding definition file to bundle source context: ", file.fileName);
                this.bundleSourceFiles[file.fileName] = file.text;
            }
        }
    };
    BundleCompiler.prototype.compileBundle = function (bundleFileName, bundleText) {
        var _this = this;
        // Create bundle source file
        var bundleSourceFile = ts.createSourceFile(bundleFileName, bundleText, this.compilerOptions.target);
        this.bundleSourceFiles[bundleFileName] = bundleText;
        // Clear bundle output text
        this.outputText = {};
        // Create a compilerHost object to allow the compiler to read and write files
        var bundlerCompilerHost = {
            getSourceFile: function (fileName, languageVersion) {
                if (path.normalize(fileName) === path.normalize(ts.getDefaultLibFilePath(_this.compilerOptions))) {
                    var libSourceText = fs.readFileSync(fileName).toString("utf8");
                    var libSourceFile = ts.createSourceFile(fileName, libSourceText, languageVersion);
                    return libSourceFile;
                }
                else if (utils.hasProperty(_this.bundleSourceFiles, fileName)) {
                    return ts.createSourceFile(fileName, _this.bundleSourceFiles[fileName], languageVersion);
                }
                if (fileName === bundleFileName) {
                    return bundleSourceFile;
                }
                // return undefined for a non-existent fileName
                if (!fs.existsSync(fileName)) {
                    Logger_1.Logger.warn(" getSourceFile(): file not found: ", fileName);
                    return undefined;
                }
                var text;
                try {
                    text = fs.readFileSync(fileName).toString("utf8");
                }
                catch (e) { }
                if (text !== undefined) {
                    return ts.createSourceFile(fileName, text, languageVersion);
                }
                Logger_1.Logger.warn(" getSourceFile(): file not readable: ", fileName);
                return undefined;
            },
            writeFile: function (name, text, writeByteOrderMark) {
                _this.outputText[name] = text;
            },
            getDefaultLibFileName: function () { return ts.getDefaultLibFilePath(_this.compilerOptions); },
            useCaseSensitiveFileNames: function () { return false; },
            getCanonicalFileName: function (fileName) { return fileName; },
            getCurrentDirectory: function () { return process.cwd(); },
            getNewLine: function () { return "\n"; }
        };
        // Get the list of bundle files to pass to program 
        var bundleFiles = [];
        for (var key in this.bundleSourceFiles) {
            bundleFiles.push(key);
        }
        var bundlerProgram = ts.createProgram(bundleFiles, this.compilerOptions, bundlerCompilerHost);
        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics(bundlerProgram);
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics_1.CompilerStatistics(bundlerProgram), preEmitDiagnostics);
        }
        var emitTime = 0;
        var startTime = new Date().getTime();
        var emitResult = bundlerProgram.emit();
        emitTime += new Date().getTime() - startTime;
        // If the emitter didn't emit anything, then pass that value along.
        if (emitResult.emitSkipped) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics_1.CompilerStatistics(bundlerProgram, 0), emitResult.diagnostics);
        }
        var allDiagnostics = preEmitDiagnostics.concat(emitResult.diagnostics);
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (allDiagnostics.length > 0) {
            return new CompilerResult_1.CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics_1.CompilerStatistics(bundlerProgram, emitTime), allDiagnostics);
        }
        return new CompilerResult_1.CompilerResult(ts.ExitStatus.Success, new CompilerStatistics_1.CompilerStatistics(bundlerProgram, emitTime));
    };
    BundleCompiler.prototype.isCodeSourceFile = function (file) {
        return (file.kind === 228 /* SourceFile */ &&
            !(file.flags & 2048 /* DeclarationFile */));
    };
    BundleCompiler.prototype.isCodeModule = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return (declaration.kind === 228 /* SourceFile */ &&
            !(declaration.flags & 2048 /* DeclarationFile */));
    };
    BundleCompiler.prototype.isAmbientModule = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return ((declaration.kind === 206 /* ModuleDeclaration */) && ((declaration.flags & 2 /* Ambient */) > 0));
    };
    // TJT: Review duplicate code. Move to TsCore pass program as arg.
    BundleCompiler.prototype.getSymbolFromNode = function (node) {
        var moduleNameExpr = tsCore.getExternalModuleName(node);
        if (moduleNameExpr && moduleNameExpr.kind === 8 /* StringLiteral */) {
            return this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
        }
    };
    return BundleCompiler;
})();
exports.BundleCompiler = BundleCompiler;
//# sourceMappingURL=BundleCompiler.js.map