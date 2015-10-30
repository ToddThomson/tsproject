var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ts = require("typescript");
var Utils;
(function (Utils) {
    function forEach(array, callback) {
        if (array) {
            for (var i = 0, len = array.length; i < len; i++) {
                var result = callback(array[i], i);
                if (result) {
                    return result;
                }
            }
        }
        return undefined;
    }
    Utils.forEach = forEach;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function hasProperty(map, key) {
        return hasOwnProperty.call(map, key);
    }
    Utils.hasProperty = hasProperty;
    function clone(object) {
        var result = {};
        for (var id in object) {
            result[id] = object[id];
        }
        return result;
    }
    Utils.clone = clone;
    function map(array, f) {
        var result;
        if (array) {
            result = [];
            for (var _i = 0; _i < array.length; _i++) {
                var v = array[_i];
                result.push(f(v));
            }
        }
        return result;
    }
    Utils.map = map;
    function extend(first, second) {
        var result = {};
        for (var id in first) {
            result[id] = first[id];
        }
        for (var id in second) {
            if (!hasProperty(result, id)) {
                result[id] = second[id];
            }
        }
        return result;
    }
    Utils.extend = extend;
})(Utils = exports.Utils || (exports.Utils = {}));
var TsCore;
(function (TsCore) {
    function getExternalModuleName(node) {
        if (node.kind === 220 /* ImportDeclaration */) {
            return node.moduleSpecifier;
        }
        if (node.kind === 219 /* ImportEqualsDeclaration */) {
            var reference = node.moduleReference;
            if (reference.kind === 230 /* ExternalModuleReference */) {
                return reference.expression;
            }
        }
        if (node.kind === 226 /* ExportDeclaration */) {
            return node.moduleSpecifier;
        }
    }
    TsCore.getExternalModuleName = getExternalModuleName;
    function createDiagnostic(message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var text = message.key;
        if (arguments.length > 1) {
            text = formatStringFromArgs(text, arguments, 1);
        }
        return {
            file: undefined,
            start: undefined,
            length: undefined,
            messageText: text,
            category: message.category,
            code: message.code
        };
    }
    TsCore.createDiagnostic = createDiagnostic;
    function formatStringFromArgs(text, args, baseIndex) {
        baseIndex = baseIndex || 0;
        return text.replace(/{(\d+)}/g, function (match, index) {
            return args[+index + baseIndex];
        });
    }
    function isDeclarationFile(file) {
        return (file.flags & 8192 /* DeclarationFile */) !== 0;
    }
    TsCore.isDeclarationFile = isDeclarationFile;
    // An alias symbol is created by one of the following declarations:
    // import <symbol> = ...
    // import <symbol> from ...
    // import * as <symbol> from ...
    // import { x as <symbol> } from ...
    // export { x as <symbol> } from ...
    // export = ...
    // export default ...
    function isAliasSymbolDeclaration(node) {
        return node.kind === 219 /* ImportEqualsDeclaration */ ||
            node.kind === 221 /* ImportClause */ && !!node.name ||
            node.kind === 222 /* NamespaceImport */ ||
            node.kind === 224 /* ImportSpecifier */ ||
            node.kind === 228 /* ExportSpecifier */ ||
            node.kind === 225 /* ExportAssignment */ && node.expression.kind === 67 /* Identifier */;
    }
    TsCore.isAliasSymbolDeclaration = isAliasSymbolDeclaration;
    function normalizeSlashes(path) {
        return path.replace(/\\/g, "/");
    }
    TsCore.normalizeSlashes = normalizeSlashes;
    function outputExtension(path) {
        return path.replace(/\.ts/, ".js");
    }
    TsCore.outputExtension = outputExtension;
})(TsCore = exports.TsCore || (exports.TsCore = {}));
var CompilerStatistics = (function () {
    function CompilerStatistics(program, compileTime) {
        this.numberOfFiles = program.getSourceFiles().length;
        this.numberOfLines = this.compiledLines(program);
        this.compileTime = compileTime;
    }
    CompilerStatistics.prototype.compiledLines = function (program) {
        var _this = this;
        var count = 0;
        Utils.forEach(program.getSourceFiles(), function (file) {
            if (!TsCore.isDeclarationFile(file)) {
                count += _this.getLineStarts(file).length;
            }
        });
        return count;
    };
    CompilerStatistics.prototype.getLineStarts = function (sourceFile) {
        return sourceFile.getLineStarts();
    };
    return CompilerStatistics;
})();
exports.CompilerStatistics = CompilerStatistics;
var chalk = require("chalk");
var stream = require("stream");
exports.level = {
    none: 0,
    info: 1,
    warn: 2,
    error: 3
};
var Logger = (function () {
    function Logger() {
    }
    Logger.setLevel = function (level) {
        this.logLevel = level;
    };
    Logger.setName = function (name) {
        this.logName = name;
    };
    Logger.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        console.log.apply(console, [chalk.gray("[" + this.logName + "]")].concat(args));
    };
    Logger.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (this.logLevel < exports.level.info) {
            return;
        }
        console.log.apply(console, [chalk.gray(("[" + this.logName + "]") + chalk.blue(" INFO: "))].concat(args));
    };
    Logger.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (this.logLevel < exports.level.warn) {
            return;
        }
        console.log.apply(console, [("[" + this.logName + "]") + chalk.yellow(" WARNING: ")].concat(args));
    };
    Logger.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (this.logLevel < exports.level.error) {
            return;
        }
        console.log.apply(console, [("[" + this.logName + "]") + chalk.red(" ERROR: ")].concat(args));
    };
    Logger.logLevel = exports.level.none;
    Logger.logName = "logger";
    return Logger;
})();
exports.Logger = Logger;
var fs = require("fs");
var path = require("path");
var File = require("vinyl");
var CompilerResult = (function () {
    function CompilerResult(status, statistics, errors) {
        this.status = status;
        this.statistics = statistics,
            this.errors = errors;
    }
    CompilerResult.prototype.getErrors = function () {
        return this.errors;
    };
    CompilerResult.prototype.getStatistics = function () {
        return this.statistics;
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
var CompilerHost = (function () {
    function CompilerHost(compilerOptions) {
        var _this = this;
        this.output = {};
        this.writeFile = function (fileName, data, writeByteOrderMark, onError) {
            _this.output[fileName] = data;
        };
        this.compilerOptions = compilerOptions;
    }
    CompilerHost.prototype.fileExists = function (fileName) {
        var result = ts.sys.fileExists(fileName);
        Logger.info("CompilerHost:fileExists for: ", fileName, result);
        return result;
    };
    CompilerHost.prototype.getSourceFile = function (fileName, languageVersion, onError) {
        var text;
        // return undefined for a non-existent fileName
        if (!fs.existsSync(fileName)) {
            Logger.warn("File not found: ", fileName);
            return undefined;
        }
        try {
            text = fs.readFileSync(fileName).toString("utf8");
        }
        catch (e) {
            if (onError) {
                onError(e.message);
            }
        }
        if (text !== undefined) {
            return ts.createSourceFile(fileName, text, languageVersion);
        }
        Logger.warn("File not readable: ", fileName);
        return undefined;
    };
    CompilerHost.prototype.readFile = function (fileName) {
        Logger.info("CompilerHost in readFile() with: ", fileName);
        var result = ts.sys.readFile(fileName);
        return result;
    };
    CompilerHost.prototype.getDefaultLibFileName = function (options) {
        return ts.getDefaultLibFilePath(this.compilerOptions);
    };
    CompilerHost.prototype.useCaseSensitiveFileNames = function () {
        // var platform: string = os.platform();
        // win32\win64 are case insensitive platforms, MacOS (darwin) by default is also case insensitive
        return false; // ( platform !== "win32" && platform !== "win64" && platform !== "darwin" );
    };
    CompilerHost.prototype.getCanonicalFileName = function (fileName) {
        // if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
        // otherwise use toLowerCase as a canonical form.
        return fileName.toLowerCase();
    };
    CompilerHost.prototype.getCurrentDirectory = function () {
        return this.currentDirectory || (this.currentDirectory = process.cwd());
    };
    CompilerHost.prototype.getNewLine = function () {
        return "\n";
    };
    return CompilerHost;
})();
exports.CompilerHost = CompilerHost;
var CompileStream = (function (_super) {
    __extends(CompileStream, _super);
    function CompileStream(opts) {
        _super.call(this, { objectMode: true });
    }
    CompileStream.prototype._read = function () {
        // Safely do nothing
    };
    return CompileStream;
})(stream.Readable);
exports.CompileStream = CompileStream;
var TsVinylFile = (function (_super) {
    __extends(TsVinylFile, _super);
    function TsVinylFile(options) {
        _super.call(this, options);
    }
    return TsVinylFile;
})(File);
exports.TsVinylFile = TsVinylFile;
var BundleParser = (function () {
    function BundleParser() {
    }
    BundleParser.prototype.parseConfigFile = function (json, basePath) {
        var errors = [];
        return {
            bundles: getBundles(),
            errors: errors
        };
        function getBundles() {
            var bundles = [];
            var jsonBundles = json["bundles"];
            if (jsonBundles) {
                Logger.info(jsonBundles);
                for (var id in jsonBundles) {
                    Logger.info("Bundle Id: ", id, jsonBundles[id]);
                    var jsonBundle = jsonBundles[id];
                    var bundleName;
                    var fileNames = [];
                    var config = {};
                    // Name
                    bundleName = path.join(basePath, id);
                    // Files..
                    if (Utils.hasProperty(jsonBundle, "files")) {
                        if (jsonBundle["files"] instanceof Array) {
                            fileNames = Utils.map(jsonBundle["files"], function (s) { return path.join(basePath, s); });
                            Logger.info("bundle files: ", fileNames);
                        }
                        else {
                            errors.push(TsCore.createDiagnostic({ code: 6063, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' files is not an array." }, id));
                        }
                    }
                    else {
                        errors.push(TsCore.createDiagnostic({ code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' requires an array of files." }, id));
                    }
                    // Config..
                    if (Utils.hasProperty(jsonBundle, "config")) {
                        config = jsonBundle.config;
                    }
                    bundles.push({ name: bundleName, fileNames: fileNames, config: config });
                }
            }
            return bundles;
        }
    };
    return BundleParser;
})();
exports.BundleParser = BundleParser;
var DependencyBuilder = (function () {
    function DependencyBuilder(host, program) {
        this.moduleImportsByName = {};
        this.host = host;
        this.program = program;
        this.options = this.program.getCompilerOptions();
    }
    DependencyBuilder.prototype.getSourceFileDependencies = function (sourceFile) {
        var self = this;
        var dependencies = {};
        var importWalked = {};
        function walkModuleImports(importNodes) {
            importNodes.forEach(function (importNode) {
                // Get the import symbol for the import node
                var importSymbol = self.getSymbolFromNode(importNode);
                var importSymbolSourceFile = self.getSourceFileFromSymbol(importSymbol);
                var canonicalFileName = self.host.getCanonicalFileName(importSymbolSourceFile.fileName);
                Logger.info("Import symbol file name: ", canonicalFileName);
                // Don't walk imports that we've already processed
                if (!Utils.hasProperty(importWalked, canonicalFileName)) {
                    importWalked[canonicalFileName] = true;
                    // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    walkModuleImports(self.getImportsOfModule(importSymbolSourceFile));
                }
                if (!Utils.hasProperty(dependencies, canonicalFileName)) {
                    Logger.info("Adding module import dependencies for file: ", canonicalFileName);
                    dependencies[canonicalFileName] = self.getImportsOfModule(importSymbolSourceFile);
                }
            });
        }
        // Get the top level imports
        var sourceFileImports = self.getImportsOfModule(sourceFile);
        // Walk the module import tree
        walkModuleImports(sourceFileImports);
        var canonicalSourceFileName = self.host.getCanonicalFileName(sourceFile.fileName);
        if (!Utils.hasProperty(dependencies, canonicalSourceFileName)) {
            Logger.info("Adding top level import dependencies for file: ", canonicalSourceFileName);
            dependencies[canonicalSourceFileName] = sourceFileImports;
        }
        return dependencies;
    };
    DependencyBuilder.prototype.getImportsOfModule = function (file) {
        var importNodes = [];
        var self = this;
        function getImports(searchNode) {
            ts.forEachChild(searchNode, function (node) {
                if (node.kind === 220 /* ImportDeclaration */ || node.kind === 219 /* ImportEqualsDeclaration */ || node.kind === 226 /* ExportDeclaration */) {
                    Logger.info("Found import declaration");
                    var moduleNameExpr = TsCore.getExternalModuleName(node);
                    if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
                        var moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
                        if (moduleSymbol) {
                            Logger.info("Adding import symbol: ", moduleSymbol.name, file.fileName);
                            importNodes.push(node);
                        }
                        else {
                            Logger.warn("Module symbol not found");
                        }
                    }
                }
                else if (node.kind === 216 /* ModuleDeclaration */ && node.name.kind === 9 /* StringLiteral */ && (node.flags & 2 /* Ambient */ || TsCore.isDeclarationFile(file))) {
                    // An AmbientExternalModuleDeclaration declares an external module.
                    var moduleDeclaration = node;
                    Logger.info("Processing ambient module declaration: ", moduleDeclaration.name.text);
                    getImports(node.body);
                }
            });
        }
        ;
        getImports(file);
        return importNodes;
    };
    DependencyBuilder.prototype.isExternalModuleImportEqualsDeclaration = function (node) {
        return node.kind === 219 /* ImportEqualsDeclaration */ && node.moduleReference.kind === 230 /* ExternalModuleReference */;
    };
    DependencyBuilder.prototype.getExternalModuleImportEqualsDeclarationExpression = function (node) {
        return node.moduleReference.expression;
    };
    DependencyBuilder.prototype.getSymbolFromNode = function (node) {
        var moduleNameExpr = TsCore.getExternalModuleName(node);
        if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
            return this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
        }
    };
    DependencyBuilder.prototype.getSourceFileFromNode = function (importNode) {
        return importNode.getSourceFile();
    };
    DependencyBuilder.prototype.getSourceFileFromSymbol = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        var isCodeModule = declaration.kind === 246 /* SourceFile */ &&
            !(declaration.flags & 8192 /* DeclarationFile */);
        var file = declaration.getSourceFile();
        return file;
    };
    return DependencyBuilder;
})();
exports.DependencyBuilder = DependencyBuilder;
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
        Logger.log(output);
    };
    return DiagnosticsReporter;
})();
exports.DiagnosticsReporter = DiagnosticsReporter;
var _ = require("lodash");
var fileGlob = require("glob");
var Glob = (function () {
    function Glob() {
    }
    Glob.prototype.hasPattern = function (pattern) {
        var g = new fileGlob.Glob(pattern);
        var minimatchSet = g.minimatch.set;
        if (minimatchSet.length > 1)
            return true;
        for (var j = 0; j < minimatchSet[0].length; j++) {
            if (typeof minimatchSet[0][j] !== 'string')
                return true;
        }
        return false;
    };
    Glob.prototype.expand = function (patterns, root) {
        if (patterns.length === 0) {
            return [];
        }
        var matches = this.processPatterns(patterns, function (pattern) {
            return fileGlob.sync(pattern, { root: root });
        });
        return matches;
    };
    Glob.prototype.processPatterns = function (patterns, fn) {
        var result = [];
        _.flatten(patterns).forEach(function (pattern) {
            var exclusion;
            var matches;
            exclusion = _.isString(pattern) && pattern.indexOf("!") === 0;
            if (exclusion) {
                pattern = pattern.slice(1);
            }
            matches = fn(pattern);
            if (exclusion) {
                return result = _.difference(result, matches);
            }
            else {
                return result = _.union(result, matches);
            }
        });
        return result;
    };
    return Glob;
})();
exports.Glob = Glob;
var Compiler = (function () {
    function Compiler(compilerHost, program) {
        this.compilerHost = compilerHost;
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }
    Compiler.prototype.compileFilesToStream = function (compileStream, onError) {
        Logger.log("TypeScript compiler version: ", ts.version);
        Logger.log("Compiling Project Files...");
        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics(this.program);
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics(this.program), preEmitDiagnostics);
        }
        // Compile the source files..
        var emitTime = 0;
        var startTime = new Date().getTime();
        var emitResult = this.program.emit();
        emitTime += new Date().getTime() - startTime;
        // If the emitter didn't emit anything, then pass that value along.
        if (emitResult.emitSkipped) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics(this.program, 0), emitResult.diagnostics);
        }
        var fileOutput = this.compilerHost.output;
        for (var fileName in fileOutput) {
            var fileData = fileOutput[fileName];
            var tsVinylFile = new TsVinylFile({
                path: fileName,
                contents: new Buffer(fileData)
            });
            compileStream.push(tsVinylFile);
        }
        var allDiagnostics = preEmitDiagnostics.concat(emitResult.diagnostics);
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (allDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics(this.program, emitTime), allDiagnostics);
        }
        return new CompilerResult(ts.ExitStatus.Success, new CompilerStatistics(this.program, emitTime));
    };
    return Compiler;
})();
exports.Compiler = Compiler;
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
        Logger.log(this.padRight(name + ":", 12) + chalk.magenta(this.padLeft(value.toString(), 10)));
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
})(DiagnosticsReporter);
exports.CompilerReporter = CompilerReporter;
var BundleCompiler = (function () {
    function BundleCompiler(compilerHost, program) {
        this.outputText = {};
        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleModuleImports = {};
        this.bundleSourceFiles = {};
        this.compilerHost = compilerHost;
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }
    BundleCompiler.prototype.compileBundleToStream = function (outputStream, bundle) {
        var _this = this;
        var dependencyBuilder = new DependencyBuilder(this.compilerHost, this.program);
        // Construct bundle output file name
        var bundleBaseDir = path.dirname(bundle.name);
        if (bundle.config.outDir) {
            bundleBaseDir = path.normalize(path.resolve(bundleBaseDir, bundle.config.outDir));
        }
        var bundleFilePath = path.join(bundleBaseDir, path.basename(bundle.name));
        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleModuleImports = {};
        this.bundleSourceFiles = {};
        // Look for tsx source files in bunle name or bundle dependencies.
        // Output tsx for bundle extension if typescript react files found
        var isBundleTsx = false;
        var allDependencies = {};
        for (var filesKey in bundle.fileNames) {
            var fileName = bundle.fileNames[filesKey];
            Logger.info(">>> Processing bundle file:", fileName);
            if (this.compilerOptions.listFiles) {
                Logger.log(fileName);
            }
            var bundleSourceFileName = this.compilerHost.getCanonicalFileName(TsCore.normalizeSlashes(fileName));
            Logger.info("BundleSourceFileName:", bundleSourceFileName);
            var bundleSourceFile = this.program.getSourceFile(bundleSourceFileName);
            if (!bundleSourceFile) {
                var diagnostic = TsCore.createDiagnostic({ code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle Source File '{0}' not found." }, bundleSourceFileName);
                return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics(this.program, 0), [diagnostic]);
            }
            // Check for TSX
            if (bundleSourceFile.languageVariant == 1 /* JSX */) {
                isBundleTsx = true;
            }
            var sourceDependencies = dependencyBuilder.getSourceFileDependencies(bundleSourceFile);
            // Merge current bundle file dependencies into all dependencies
            for (var mergeKey in sourceDependencies) {
                if (!Utils.hasProperty(allDependencies, mergeKey)) {
                    allDependencies[mergeKey] = sourceDependencies[mergeKey];
                }
            }
            Logger.info("traversing source dependencies for: ", bundleSourceFile.fileName);
            for (var depKey in sourceDependencies) {
                // Add module dependencies first..
                sourceDependencies[depKey].forEach(function (importNode) {
                    var importSymbol = _this.getSymbolFromNode(importNode);
                    if (_this.isCodeModule(importSymbol)) {
                        var declaration = importSymbol.getDeclarations()[0];
                        var importedSource = declaration.getSourceFile();
                        var importedSourceFileName = importedSource.fileName;
                        if (!Utils.hasProperty(_this.bundleImportedFiles, importedSourceFileName)) {
                            _this.addSourceFile(importedSource);
                        }
                    }
                    else {
                        if (importNode.kind === 219 /* ImportEqualsDeclaration */) {
                            // For ImportEqualsDeclarations we emit the import declaration
                            // if it hasn't already been added to the bundle.
                            // Get the import and module names
                            var importName = importNode.name.text;
                            var moduleName = _this.getImportModuleName(importNode);
                            if (_this.addModuleImport(moduleName, importName)) {
                                _this.emitModuleImportDeclaration(importNode.getText());
                            }
                        }
                        else {
                            // ImportDeclaration kind..
                            _this.writeImportDeclaration(importNode);
                        }
                    }
                });
            }
            // Finally, add bundle source file
            this.addSourceFile(bundleSourceFile);
        }
        var bundleExtension = isBundleTsx ? ".tsx" : ".ts";
        Logger.info("Streaming vinyl bundle source: ", bundleFilePath + bundleExtension);
        var tsVinylFile = new TsVinylFile({
            path: bundleFilePath + bundleExtension,
            contents: new Buffer(this.bundleText)
        });
        outputStream.push(tsVinylFile);
        // Compile the bundle to generate javascript and declaration file
        var compileResult = this.compileBundle(path.basename(bundle.name) + bundleExtension, this.bundleText);
        var compileStatus = compileResult.getStatus();
        // Only stream bundle if there is some compiled output
        if (compileStatus !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped) {
            // js should have been generated, but just in case!
            if (Utils.hasProperty(this.outputText, path.basename(bundle.name) + ".js")) {
                Logger.info("Streaming vinyl js: ", bundleFilePath + ".js");
                var bundleJsVinylFile = new TsVinylFile({
                    path: path.join(bundleFilePath + ".js"),
                    contents: new Buffer(this.outputText[path.basename(bundle.name) + ".js"])
                });
                outputStream.push(bundleJsVinylFile);
            }
        }
        // Only stream bundle definition if the compile was successful
        if (compileStatus === ts.ExitStatus.Success) {
            // d.ts should have been generated, but just in case
            if (Utils.hasProperty(this.outputText, path.basename(bundle.name) + ".d.ts")) {
                Logger.info("Streaming vinyl d.ts: ", bundleFilePath + ".d.ts");
                var bundleDtsVinylFile = new TsVinylFile({
                    path: path.join(bundleFilePath + ".d.ts"),
                    contents: new Buffer(this.outputText[path.basename(bundle.name) + ".d.ts"])
                });
                outputStream.push(bundleDtsVinylFile);
            }
        }
        return compileResult;
    };
    BundleCompiler.prototype.getImportModuleName = function (node) {
        if (node.moduleReference.kind === 230 /* ExternalModuleReference */) {
            var moduleReference = node.moduleReference;
            return moduleReference.expression.text;
        }
        else {
            // TJT: This code should never be hit as we currently do not process dependencies of this kind. 
            return node.moduleReference.getText();
        }
    };
    BundleCompiler.prototype.addModuleImport = function (moduleName, importName) {
        if (!Utils.hasProperty(this.bundleModuleImports, moduleName)) {
            this.bundleModuleImports[moduleName] = {};
        }
        var moduleImports = this.bundleModuleImports[moduleName];
        if (!Utils.hasProperty(moduleImports, importName)) {
            moduleImports[importName] = importName;
            return true;
        }
        return false;
    };
    BundleCompiler.prototype.writeImportDeclaration = function (node) {
        var _this = this;
        if (!node.importClause) {
            return;
        }
        var moduleName = node.moduleSpecifier.text;
        var importToWrite = "import ";
        var hasDefaultBinding = false;
        var hasNamedBindings = false;
        if (node.importClause) {
            if (node.importClause.name && this.addModuleImport(moduleName, node.importClause.name.text)) {
                importToWrite += node.importClause.name.text;
                hasDefaultBinding = true;
            }
        }
        if (node.importClause.namedBindings) {
            if (node.importClause.namedBindings.kind === 222 /* NamespaceImport */) {
                if (this.addModuleImport(moduleName, node.importClause.namedBindings.name.text)) {
                    if (hasDefaultBinding) {
                        importToWrite += ", ";
                    }
                    importToWrite += "* as ";
                    importToWrite += node.importClause.namedBindings.name.text;
                    hasNamedBindings = true;
                }
            }
            else {
                if (hasDefaultBinding) {
                    importToWrite += ", ";
                }
                importToWrite += "{ ";
                Utils.forEach(node.importClause.namedBindings.elements, function (element) {
                    if (_this.addModuleImport(moduleName, element.name.text)) {
                        if (!hasNamedBindings) {
                            hasNamedBindings = true;
                        }
                        else {
                            importToWrite += ", ";
                        }
                        var alias = element.propertyName;
                        if (alias) {
                            importToWrite += alias.text + " as " + element.name.text;
                        }
                        else {
                            importToWrite += element.name.text;
                        }
                    }
                });
                importToWrite += " }";
            }
        }
        importToWrite += " from ";
        importToWrite += node.moduleSpecifier.getText();
        importToWrite += ";";
        if (hasDefaultBinding || hasNamedBindings) {
            this.emitModuleImportDeclaration(importToWrite);
        }
    };
    BundleCompiler.prototype.processImportStatements = function (file) {
        var _this = this;
        Logger.info("Processing import statements in file: ", file.fileName);
        var editText = file.text;
        ts.forEachChild(file, function (node) {
            if (node.kind === 220 /* ImportDeclaration */ || node.kind === 219 /* ImportEqualsDeclaration */ || node.kind === 226 /* ExportDeclaration */) {
                Logger.info("processImportStatements() found import");
                var moduleNameExpr = TsCore.getExternalModuleName(node);
                if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
                    var moduleSymbol = _this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
                    if ((moduleSymbol) && (_this.isCodeModule(moduleSymbol) || _this.isAmbientModule)) {
                        Logger.info("processImportStatements() removing code module symbol");
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
    BundleCompiler.prototype.emitModuleImportDeclaration = function (moduleBlockText) {
        Logger.info("Entering emitModuleImportDeclaration()");
        this.bundleText += moduleBlockText + "\n";
    };
    BundleCompiler.prototype.addSourceFile = function (file) {
        Logger.info("Entering addSourceFile() with: ", file.fileName);
        if (this.isCodeSourceFile(file)) {
            // Before adding the source text, we must white out import statement(s)
            var editText = this.processImportStatements(file);
            this.bundleText += editText + "\n";
            this.bundleImportedFiles[file.fileName] = file.fileName;
        }
        else {
            // Add d.ts files to the build source files context
            if (!Utils.hasProperty(this.bundleSourceFiles, file.fileName)) {
                Logger.info("Adding definition file to bundle source context: ", file.fileName);
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
                else if (Utils.hasProperty(_this.bundleSourceFiles, fileName)) {
                    return ts.createSourceFile(fileName, _this.bundleSourceFiles[fileName], languageVersion);
                }
                if (fileName === bundleFileName) {
                    return bundleSourceFile;
                }
                // return undefined for a non-existent fileName
                if (!fs.existsSync(fileName)) {
                    Logger.warn(" getSourceFile(): file not found: ", fileName);
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
                Logger.warn(" getSourceFile(): file not readable: ", fileName);
                return undefined;
            },
            readFile: function (fileName) {
                return "";
            },
            writeFile: function (name, text, writeByteOrderMark) {
                _this.outputText[name] = text;
            },
            fileExists: function (fileName) {
                return true;
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
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics(bundlerProgram), preEmitDiagnostics);
        }
        var emitTime = 0;
        var startTime = new Date().getTime();
        var emitResult = bundlerProgram.emit();
        emitTime += new Date().getTime() - startTime;
        // If the emitter didn't emit anything, then pass that value along.
        if (emitResult.emitSkipped) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics(bundlerProgram, 0), emitResult.diagnostics);
        }
        var allDiagnostics = preEmitDiagnostics.concat(emitResult.diagnostics);
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (allDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics(bundlerProgram, emitTime), allDiagnostics);
        }
        return new CompilerResult(ts.ExitStatus.Success, new CompilerStatistics(bundlerProgram, emitTime));
    };
    BundleCompiler.prototype.isCodeSourceFile = function (file) {
        return (file.kind === 246 /* SourceFile */ &&
            !(file.flags & 8192 /* DeclarationFile */));
    };
    BundleCompiler.prototype.isCodeModule = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return (declaration.kind === 246 /* SourceFile */ &&
            !(declaration.flags & 8192 /* DeclarationFile */));
    };
    BundleCompiler.prototype.isAmbientModule = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return ((declaration.kind === 216 /* ModuleDeclaration */) && ((declaration.flags & 2 /* Ambient */) > 0));
    };
    // TJT: Review duplicate code. Move to TsCore pass program as arg.
    BundleCompiler.prototype.getSymbolFromNode = function (node) {
        var moduleNameExpr = TsCore.getExternalModuleName(node);
        if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
            return this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
        }
    };
    return BundleCompiler;
})();
exports.BundleCompiler = BundleCompiler;
var Project = (function () {
    function Project(configPath, settings) {
        this.configPath = configPath;
        this.settings = settings;
    }
    Project.prototype.parseProjectConfig = function (configPath, settings) {
        var _this = this;
        var configDirPath;
        var configFileName;
        try {
            var isConfigDirectory = fs.lstatSync(configPath).isDirectory();
        }
        catch (e) {
            var diagnostic = TsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot read project path '{0}'." }, this.configPath);
            return { success: false, errors: [diagnostic] };
        }
        if (isConfigDirectory) {
            configDirPath = configPath;
            configFileName = path.join(configPath, "tsconfig.json");
        }
        else {
            configDirPath = path.dirname(configPath);
            configFileName = configPath;
        }
        this.configFileName = configFileName;
        Logger.info("Reading config file:", configFileName);
        var readConfigResult = ts.readConfigFile(configFileName);
        if (readConfigResult.error) {
            return { success: false, errors: [readConfigResult.error] };
        }
        var configObject = readConfigResult.config;
        // Parse standard project configuration objects: compilerOptions, files.
        Logger.info("Parsing config file...");
        var configParseResult = ts.parseConfigFile(configObject, ts.sys, configDirPath);
        if (configParseResult.errors.length > 0) {
            return { success: false, errors: configParseResult.errors };
        }
        // The returned "Files" list may contain file glob patterns. 
        configParseResult.fileNames = this.expandFileNames(configParseResult.fileNames, configDirPath);
        // The glob file patterns in "Files" is an enhancement to the standard Typescript project file (tsconfig.json) spec.
        // To convert the project file to use only a standard filename list, specify the setting: "convertFiles" : "true"
        if (settings.convertFiles === true) {
            this.convertProjectFileNames(configParseResult.fileNames, configDirPath);
        }
        // Parse "bundle" project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser();
        var bundlesParseResult = bundleParser.parseConfigFile(configObject, configDirPath);
        if (bundlesParseResult.errors.length > 0) {
            return { success: false, errors: bundlesParseResult.errors };
        }
        // The returned bundles "Files" list may contain file glob patterns. 
        bundlesParseResult.bundles.forEach(function (bundle) {
            bundle.fileNames = _this.expandFileNames(bundle.fileNames, configDirPath);
        });
        // Parse the command line args to override project file compiler options
        var settingsCompilerOptions = this.getSettingsCompilerOptions(settings, configDirPath);
        // Check for any errors due to command line parsing
        if (settingsCompilerOptions.errors.length > 0) {
            return { success: false, errors: settingsCompilerOptions.errors };
        }
        var compilerOptions = Utils.extend(settingsCompilerOptions.options, configParseResult.options);
        Logger.info("Compiler options: ", compilerOptions);
        return {
            success: true,
            compilerOptions: compilerOptions,
            fileNames: configParseResult.fileNames,
            bundles: bundlesParseResult.bundles
        };
    };
    Project.prototype.build = function (outputStream) {
        var allDiagnostics = [];
        // Get project configuration items for the project build context.
        var config = this.parseProjectConfig(this.configPath, this.settings);
        Logger.log("Building Project with: " + chalk.magenta("" + this.configFileName));
        if (!config.success) {
            var diagReporter = new DiagnosticsReporter(config.errors);
            diagReporter.reportDiagnostics();
            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }
        var compilerOptions = config.compilerOptions;
        var rootFileNames = config.fileNames;
        var bundles = config.bundles;
        // Create host and program.
        var compilerHost = new CompilerHost(compilerOptions);
        var program = ts.createProgram(rootFileNames, compilerOptions, compilerHost);
        var compiler = new Compiler(compilerHost, program);
        var compileResult = compiler.compileFilesToStream(outputStream);
        var compilerReporter = new CompilerReporter(compileResult);
        if (!compileResult.succeeded()) {
            compilerReporter.reportDiagnostics();
            if (compilerOptions.noEmitOnError) {
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }
            allDiagnostics = allDiagnostics.concat(compileResult.getErrors());
        }
        if (compilerOptions.listFiles) {
            Utils.forEach(program.getSourceFiles(), function (file) {
                Logger.log(file.fileName);
            });
        }
        // Don't report statistics if there are no output emits
        if ((compileResult.getStatus() !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped) && compilerOptions.diagnostics) {
            compilerReporter.reportStatistics();
        }
        // Bundles..
        var bundleCompiler = new BundleCompiler(compilerHost, program);
        for (var i = 0, len = bundles.length; i < len; i++) {
            Logger.log("Compiling Project Bundle: ", chalk.cyan(bundles[i].name));
            compileResult = bundleCompiler.compileBundleToStream(outputStream, bundles[i]);
            compilerReporter = new CompilerReporter(compileResult);
            if (!compileResult.succeeded()) {
                compilerReporter.reportDiagnostics();
                if (compilerOptions.noEmitOnError) {
                    return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
                }
                allDiagnostics = allDiagnostics.concat(compileResult.getErrors());
            }
            // Don't report statistics if there are no output emits
            if ((compileResult.getStatus() !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped) && compilerOptions.diagnostics) {
                compilerReporter.reportStatistics();
            }
        }
        if (allDiagnostics.length > 0) {
            return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
        }
        return ts.ExitStatus.Success;
    };
    Project.prototype.getSettingsCompilerOptions = function (jsonSettings, configDirPath) {
        // Parse the json settings from the TsProject src() API
        var parsedResult = ts.parseConfigFile(jsonSettings, ts.sys, configDirPath);
        // Check for compiler options that are not relevent/supported.
        // Not supported: --project, --init
        // Ignored: --help, --version
        if (parsedResult.options.project) {
            var diagnostic = TsCore.createDiagnostic({ code: 5099, category: ts.DiagnosticCategory.Error, key: "The compiler option '{0}' is not supported in this context." }, "--project");
            parsedResult.errors.push(diagnostic);
        }
        if (parsedResult.options.init) {
            var diagnostic = TsCore.createDiagnostic({ code: 5099, category: ts.DiagnosticCategory.Error, key: "The compiler option '{0}' is not supported in this context." }, "--init");
            parsedResult.errors.push(diagnostic);
        }
        return parsedResult;
    };
    Project.prototype.expandFileNames = function (files, configDirPath) {
        // The parameter files may contain a mix of glob patterns and filenames.
        // glob.expand() will only return a list of all expanded "found" files. 
        // For filenames without glob patterns, we add them to the list of files as we will want to know
        // if any filenames are not found during bundle processing.
        var glob = new Glob();
        var nonglobFiles = [];
        Utils.forEach(files, function (file) {
            if (!glob.hasPattern(file)) {
                nonglobFiles.push(path.normalize(file));
            }
        });
        // Get the list of expanded glob files
        var globFiles = glob.expand(files, configDirPath);
        var normalizedGlobFiles = [];
        // Normalize file paths for matching
        Utils.forEach(globFiles, function (file) {
            normalizedGlobFiles.push(path.normalize(file));
        });
        // The overall file list is the union of both non-glob and glob files
        return _.union(normalizedGlobFiles, nonglobFiles);
    };
    // TJT: This method really should be in src()
    Project.prototype.convertProjectFileNames = function (fileNames, configDirPath) {
        Logger.log("Converting project files.");
        var configFileText = "";
        try {
            configFileText = fs.readFileSync(this.configFileName, 'utf8');
            if (configFileText !== undefined) {
                var jsonConfigObject = JSON.parse(configFileText);
                var relativeFileNames = [];
                fileNames.forEach(function (fileName) {
                    relativeFileNames.push(path.relative(configDirPath, fileName).replace(/\\/g, "/"));
                });
                jsonConfigObject["files"] = relativeFileNames;
                fs.writeFileSync(this.configFileName, JSON.stringify(jsonConfigObject, undefined, 4));
            }
        }
        catch (e) {
            Logger.log(chalk.yellow("Converting project files failed."));
        }
    };
    return Project;
})();
exports.Project = Project;
function src(configDirPath, settings) {
    if (configDirPath === undefined && typeof configDirPath !== 'string') {
        throw new Error("Provide a valid directory path to the project tsconfig.json");
    }
    settings = settings || {};
    settings.logLevel = settings.logLevel || 0;
    Logger.setLevel(settings.logLevel);
    Logger.setName("TsProject");
    var outputStream = new CompileStream();
    var project = new Project(configDirPath, settings);
    var buildStatus = project.build(outputStream);
    // EOF the compilation output stream after build.
    outputStream.push(null);
    switch (buildStatus) {
        case ts.ExitStatus.Success:
            Logger.log(chalk.green("Project build completed successfully."));
            break;
        case ts.ExitStatus.DiagnosticsPresent_OutputsSkipped:
            Logger.log(chalk.red("Build completed with errors."));
            break;
        case ts.ExitStatus.DiagnosticsPresent_OutputsGenerated:
            Logger.log(chalk.red("Build completed with errors. " + chalk.italic("Outputs generated.")));
            break;
    }
    return outputStream;
}
var tsproject = {
    src: src
};
module.exports = tsproject;
//# sourceMappingURL=tsproject.js.map