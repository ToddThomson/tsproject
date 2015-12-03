var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ts = require("typescript");
var stream = require("stream");
var fs = require("fs");
var chalk = require("chalk");
var path = require("path");
var chokidar = require("chokidar");
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
var TsCore;
(function (TsCore) {
    function fileExtensionIs(path, extension) {
        var pathLen = path.length;
        var extLen = extension.length;
        return pathLen > extLen && path.substr(pathLen - extLen, extLen) === extension;
    }
    TsCore.fileExtensionIs = fileExtensionIs;
    TsCore.supportedExtensions = [".ts", ".tsx", ".d.ts"];
    TsCore.moduleFileExtensions = TsCore.supportedExtensions;
    function isSupportedSourceFileName(fileName) {
        if (!fileName) {
            return false;
        }
        for (var _i = 0; _i < TsCore.supportedExtensions.length; _i++) {
            var extension = TsCore.supportedExtensions[_i];
            if (fileExtensionIs(fileName, extension)) {
                return true;
            }
        }
        return false;
    }
    TsCore.isSupportedSourceFileName = isSupportedSourceFileName;
    function getExternalModuleName(node) {
        if (node.kind === 222 /* ImportDeclaration */) {
            return node.moduleSpecifier;
        }
        if (node.kind === 221 /* ImportEqualsDeclaration */) {
            var reference = node.moduleReference;
            if (reference.kind === 232 /* ExternalModuleReference */) {
                return reference.expression;
            }
        }
        if (node.kind === 228 /* ExportDeclaration */) {
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
        return node.kind === 221 /* ImportEqualsDeclaration */ ||
            node.kind === 223 /* ImportClause */ && !!node.name ||
            node.kind === 224 /* NamespaceImport */ ||
            node.kind === 226 /* ImportSpecifier */ ||
            node.kind === 230 /* ExportSpecifier */ ||
            node.kind === 227 /* ExportAssignment */ && node.expression.kind === 69 /* Identifier */;
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
    function contains(array, value) {
        if (array) {
            for (var _i = 0; _i < array.length; _i++) {
                var v = array[_i];
                if (v === value) {
                    return true;
                }
            }
        }
        return false;
    }
    Utils.contains = contains;
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
var File = require("vinyl");
var CompilerResult = (function () {
    function CompilerResult(status, errors) {
        this.status = status;
        this.errors = errors;
    }
    CompilerResult.prototype.getErrors = function () {
        return this.errors;
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
/**
 * @description A typescript compiler host that supports incremental builds and optimizations for file reads and file exists functions. Emit output is saved to memory.
 */
var CachingCompilerHost = (function () {
    function CachingCompilerHost(compilerOptions) {
        var _this = this;
        this.output = {};
        this.dirExistsCache = {};
        this.dirExistsCacheSize = 0;
        this.fileExistsCache = {};
        this.fileExistsCacheSize = 0;
        this.fileReadCache = {};
        this.getSourceFile = this.getSourceFileImpl;
        this.fileExists = function (fileName) {
            fileName = _this.getCanonicalFileName(fileName);
            // Prune off searches on directories that don't exist
            if (!_this.dirExists(path.dirname(fileName))) {
                return false;
            }
            if (Utils.hasProperty(_this.fileExistsCache, fileName)) {
                //Logger.log( "fileExists() Cache hit: ", fileName, this.fileExistsCache[ fileName ] );
                return _this.fileExistsCache[fileName];
            }
            _this.fileExistsCacheSize++;
            //Logger.log( "fileExists() Adding to cache: ", fileName, this.baseHost.fileExists( fileName ), this.fileExistsCacheSize );
            return _this.fileExistsCache[fileName] = _this.baseHost.fileExists(fileName);
        };
        this.compilerOptions = compilerOptions;
        this.baseHost = ts.createCompilerHost(this.compilerOptions);
    }
    CachingCompilerHost.prototype.getOutput = function () {
        return this.output;
    };
    CachingCompilerHost.prototype.getSourceFileImpl = function (fileName, languageVersion, onError) {
        // Use baseHost to get the source file
        //Logger.log( "getSourceFile() reading source file from fs: ", fileName );
        return this.baseHost.getSourceFile(fileName, languageVersion, onError);
    };
    CachingCompilerHost.prototype.writeFile = function (fileName, data, writeByteOrderMark, onError) {
        this.output[fileName] = data;
    };
    CachingCompilerHost.prototype.readFile = function (fileName) {
        if (Utils.hasProperty(this.fileReadCache, fileName)) {
            //Logger.log( "readFile() cache hit: ", fileName );
            return this.fileReadCache[fileName];
        }
        //Logger.log( "readFile() Adding to cache: ", fileName );
        return this.fileReadCache[fileName] = this.baseHost.readFile(fileName);
    };
    // Use Typescript CompilerHost "base class" implementation..
    CachingCompilerHost.prototype.getDefaultLibFileName = function (options) {
        return this.baseHost.getDefaultLibFileName(options);
    };
    CachingCompilerHost.prototype.getCurrentDirectory = function () {
        return this.baseHost.getCurrentDirectory();
    };
    CachingCompilerHost.prototype.getCanonicalFileName = function (fileName) {
        return this.baseHost.getCanonicalFileName(fileName);
    };
    CachingCompilerHost.prototype.useCaseSensitiveFileNames = function () {
        return this.baseHost.useCaseSensitiveFileNames();
    };
    CachingCompilerHost.prototype.getNewLine = function () {
        return this.baseHost.getNewLine();
    };
    CachingCompilerHost.prototype.dirExists = function (directoryPath) {
        if (Utils.hasProperty(this.dirExistsCache, directoryPath)) {
            //Logger.log( "dirExists() hit", directoryPath, this.dirExistsCache[ directoryPath ] );
            return this.dirExistsCache[directoryPath];
        }
        this.dirExistsCacheSize++;
        //Logger.log( "dirExists Adding: ", directoryPath, ts.sys.directoryExists( directoryPath ), this.dirExistsCacheSize );
        return this.dirExistsCache[directoryPath] = ts.sys.directoryExists(directoryPath);
    };
    return CachingCompilerHost;
})();
exports.CachingCompilerHost = CachingCompilerHost;
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
var StatisticsReporter = (function () {
    function StatisticsReporter() {
    }
    StatisticsReporter.prototype.reportTitle = function (name) {
        Logger.log(name);
    };
    StatisticsReporter.prototype.reportValue = function (name, value) {
        Logger.log(this.padRight(name + ":", 18) + chalk.magenta(this.padLeft(value.toString(), 10)));
    };
    StatisticsReporter.prototype.reportCount = function (name, count) {
        this.reportValue(name, "" + count);
    };
    StatisticsReporter.prototype.reportTime = function (name, time) {
        this.reportValue(name, (time / 1000).toFixed(2) + "s");
    };
    StatisticsReporter.prototype.padLeft = function (s, length) {
        while (s.length < length) {
            s = " " + s;
        }
        return s;
    };
    StatisticsReporter.prototype.padRight = function (s, length) {
        while (s.length < length) {
            s = s + " ";
        }
        return s;
    };
    return StatisticsReporter;
})();
exports.StatisticsReporter = StatisticsReporter;
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
        Logger.log("Compiling project files...");
        // Check for preEmit diagnostics
        var diagnostics = ts.getPreEmitDiagnostics(this.program);
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && diagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics);
        }
        this.preEmitTime = new Date().getTime() - this.preEmitTime;
        if (!this.compilerOptions.noEmit) {
            // Compile the source files..
            var startTime = new Date().getTime();
            if (this.compilerOptions.noEmit)
                var emitResult = this.program.emit();
            this.emitTime = new Date().getTime() - startTime;
            diagnostics = diagnostics.concat(emitResult.diagnostics);
            // If the emitter didn't emit anything, then we're done
            if (emitResult.emitSkipped) {
                return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics);
            }
            // Stream the compilation output...
            var fileOutput = this.compilerHost.getOutput();
            for (var fileName in fileOutput) {
                var fileData = fileOutput[fileName];
                var tsVinylFile = new TsVinylFile({
                    path: fileName,
                    contents: new Buffer(fileData)
                });
                this.compileStream.push(tsVinylFile);
            }
        }
        this.compileTime = new Date().getTime() - this.compileTime;
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (diagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, diagnostics);
        }
        if (this.compilerOptions.diagnostics) {
            this.reportStatistics();
        }
        return new CompilerResult(ts.ExitStatus.Success);
    };
    Compiler.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportCount("Files", this.program.getSourceFiles().length);
        statisticsReporter.reportCount("Lines", this.compiledLines());
        statisticsReporter.reportTime("Pre-emit time", this.preEmitTime);
        statisticsReporter.reportTime("Emit time", this.emitTime);
        statisticsReporter.reportTime("Compile time", this.compileTime);
    };
    Compiler.prototype.compiledLines = function () {
        var _this = this;
        var count = 0;
        Utils.forEach(this.program.getSourceFiles(), function (file) {
            if (!TsCore.isDeclarationFile(file)) {
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
/**
 * @description A typescript compiler host that supports watch incremental builds.
 */
var WatchCompilerHost = (function (_super) {
    __extends(WatchCompilerHost, _super);
    function WatchCompilerHost(compilerOptions, onSourceFileChanged) {
        var _this = this;
        _super.call(this, compilerOptions);
        this.getSourceFile = function (fileName, languageVersion, onError) {
            if (_this.reuseableProgram) {
                // Use program to get source files
                var sourceFile_1 = _this.reuseableProgram.getSourceFile(fileName);
                // If the source file has not been modified (it has a fs watcher ) then use it            
                if (sourceFile_1 && sourceFile_1.fileWatcher) {
                    //Logger.log( "getSourceFile() watcher hit for: ", fileName );
                    return sourceFile_1;
                }
            }
            // Use base class to get the source file
            //Logger.log( "getSourceFile() reading source file from fs: ", fileName );
            var sourceFile = _super.prototype.getSourceFileImpl.call(_this, fileName, languageVersion, onError);
            if (sourceFile && _this.compilerOptions.watch) {
                sourceFile.fileWatcher = chokidar.watch(sourceFile.fileName);
                sourceFile.fileWatcher.on("change", function (path, stats) { return _this.onSourceFileChanged(sourceFile, path, stats); });
            }
            return sourceFile;
        };
        this.onSourceFileChanged = onSourceFileChanged;
    }
    WatchCompilerHost.prototype.setReuseableProgram = function (program) {
        this.reuseableProgram = program;
    };
    return WatchCompilerHost;
})(CachingCompilerHost);
exports.WatchCompilerHost = WatchCompilerHost;
var _ = require("lodash");
var fileGlob = require("glob");
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
                if (node.kind === 222 /* ImportDeclaration */ || node.kind === 221 /* ImportEqualsDeclaration */ || node.kind === 228 /* ExportDeclaration */) {
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
                else if (node.kind === 218 /* ModuleDeclaration */ && node.name.kind === 9 /* StringLiteral */ && (node.flags & 2 /* Ambient */ || TsCore.isDeclarationFile(file))) {
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
        return node.kind === 221 /* ImportEqualsDeclaration */ && node.moduleReference.kind === 232 /* ExternalModuleReference */;
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
        var isCodeModule = declaration.kind === 248 /* SourceFile */ &&
            !(declaration.flags & 8192 /* DeclarationFile */);
        var file = declaration.getSourceFile();
        return file;
    };
    return DependencyBuilder;
})();
exports.DependencyBuilder = DependencyBuilder;
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
        Logger.log(output);
    };
    return DiagnosticsReporter;
})();
exports.DiagnosticsReporter = DiagnosticsReporter;
var ProjectBuildContext = (function () {
    function ProjectBuildContext(host, config, program) {
        this.host = host;
        this.setProgram(program);
        this.config = config;
    }
    ProjectBuildContext.prototype.isWatchMode = function () {
        this.config.compilerOptions.watch || false;
    };
    ProjectBuildContext.prototype.getProgram = function () {
        return this.program;
    };
    ProjectBuildContext.prototype.setProgram = function (program) {
        if (this.program) {
            var newSourceFiles = program ? program.getSourceFiles() : undefined;
            Utils.forEach(this.program.getSourceFiles(), function (sourceFile) {
                // Remove fileWatcher from the outgoing program source files if they are not in the 
                // new program source file set
                if (!(newSourceFiles && Utils.contains(newSourceFiles, sourceFile))) {
                    var watchedSourceFile = sourceFile;
                    if (watchedSourceFile.fileWatcher) {
                        watchedSourceFile.fileWatcher.unwatch(watchedSourceFile.fileName);
                    }
                }
            });
        }
        // Update the host with the new program
        this.host.setReuseableProgram(program);
        this.program = program;
    };
    return ProjectBuildContext;
})();
exports.ProjectBuildContext = ProjectBuildContext;
var BundleBuilder = (function () {
    function BundleBuilder(compilerHost, program) {
        this.dependencyTime = 0;
        this.dependencyWalkTime = 0;
        this.emitTime = 0;
        this.buildTime = 0;
        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleModuleImports = {};
        this.bundleSourceFiles = {};
        this.compilerHost = compilerHost;
        this.program = program;
    }
    BundleBuilder.prototype.build = function (bundle) {
        var _this = this;
        this.buildTime = new Date().getTime();
        var dependencyBuilder = new DependencyBuilder(this.compilerHost, this.program);
        // Construct bundle output file name
        var bundleBaseDir = path.dirname(bundle.name);
        if (bundle.config.outDir) {
            bundleBaseDir = path.join(bundleBaseDir, bundle.config.outDir);
        }
        var bundleFilePath = path.join(bundleBaseDir, path.basename(bundle.name));
        bundleFilePath = TsCore.normalizeSlashes(bundleFilePath);
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
            var bundleSourceFileName = this.compilerHost.getCanonicalFileName(TsCore.normalizeSlashes(fileName));
            Logger.info("BundleSourceFileName:", bundleSourceFileName);
            var bundleSourceFile_1 = this.program.getSourceFile(bundleSourceFileName);
            if (!bundleSourceFile_1) {
                var diagnostic = TsCore.createDiagnostic({ code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle Source File '{0}' not found." }, bundleSourceFileName);
                return new BundleResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, [diagnostic]);
            }
            // Check for TSX
            if (bundleSourceFile_1.languageVariant == 1 /* JSX */) {
                isBundleTsx = true;
            }
            // Get bundle source file dependencies...
            var startTime = new Date().getTime();
            var sourceDependencies = dependencyBuilder.getSourceFileDependencies(bundleSourceFile_1);
            this.dependencyTime += new Date().getTime() - startTime;
            // Merge current bundle file dependencies into all dependencies
            for (var mergeKey in sourceDependencies) {
                if (!Utils.hasProperty(allDependencies, mergeKey)) {
                    allDependencies[mergeKey] = sourceDependencies[mergeKey];
                }
            }
            startTime = new Date().getTime();
            Logger.info("traversing source dependencies for: ", bundleSourceFile_1.fileName);
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
                        if (importNode.kind === 221 /* ImportEqualsDeclaration */) {
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
            this.addSourceFile(bundleSourceFile_1);
            this.dependencyWalkTime += new Date().getTime() - startTime;
        }
        var bundleExtension = isBundleTsx ? ".tsx" : ".ts";
        var bundleSourceFile = { path: bundleFilePath + bundleExtension, extension: bundleExtension, text: this.bundleText };
        this.buildTime = new Date().getTime() - this.buildTime;
        if (this.program.getCompilerOptions().diagnostics) {
            this.reportStatistics();
        }
        return new BundleResult(ts.ExitStatus.Success, undefined, bundleSourceFile);
    };
    BundleBuilder.prototype.getImportModuleName = function (node) {
        if (node.moduleReference.kind === 232 /* ExternalModuleReference */) {
            var moduleReference = node.moduleReference;
            return moduleReference.expression.text;
        }
        else {
            // TJT: This code should never be hit as we currently do not process dependencies of this kind. 
            return node.moduleReference.getText();
        }
    };
    BundleBuilder.prototype.addModuleImport = function (moduleName, importName) {
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
    BundleBuilder.prototype.writeImportDeclaration = function (node) {
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
            if (node.importClause.namedBindings.kind === 224 /* NamespaceImport */) {
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
    BundleBuilder.prototype.processImportStatements = function (file) {
        var _this = this;
        Logger.info("Processing import statements in file: ", file.fileName);
        var editText = file.text;
        ts.forEachChild(file, function (node) {
            if (node.kind === 222 /* ImportDeclaration */ || node.kind === 221 /* ImportEqualsDeclaration */ || node.kind === 228 /* ExportDeclaration */) {
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
    BundleBuilder.prototype.emitModuleImportDeclaration = function (moduleBlockText) {
        Logger.info("Entering emitModuleImportDeclaration()");
        this.bundleText += moduleBlockText + "\n";
    };
    BundleBuilder.prototype.addSourceFile = function (file) {
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
    BundleBuilder.prototype.isCodeSourceFile = function (file) {
        return (file.kind === 248 /* SourceFile */ &&
            !(file.flags & 8192 /* DeclarationFile */));
    };
    BundleBuilder.prototype.isCodeModule = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return (declaration.kind === 248 /* SourceFile */ &&
            !(declaration.flags & 8192 /* DeclarationFile */));
    };
    BundleBuilder.prototype.isAmbientModule = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return ((declaration.kind === 218 /* ModuleDeclaration */) && ((declaration.flags & 2 /* Ambient */) > 0));
    };
    // TJT: Review duplicate code. Move to TsCore pass program as arg.
    BundleBuilder.prototype.getSymbolFromNode = function (node) {
        var moduleNameExpr = TsCore.getExternalModuleName(node);
        if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
            return this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
        }
    };
    BundleBuilder.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTime("Deps gen time", this.dependencyTime);
        statisticsReporter.reportTime("Deps walk time", this.dependencyWalkTime);
        statisticsReporter.reportTime("Source gen time", this.buildTime);
    };
    return BundleBuilder;
})();
exports.BundleBuilder = BundleBuilder;
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
        Logger.log("Compiling bundle files...");
        this.compileTime = this.preEmitTime = new Date().getTime();
        var outputText = {};
        var defaultGetSourceFile;
        var bundleFileName = bundleFile.path;
        var bundleFileText = bundleFile.text;
        var bundleSourceFile = ts.createSourceFile(bundleFile.path, bundleFile.text, this.compilerOptions.target);
        this.bundleSourceFiles[bundleFileName] = bundleFileText;
        // Reuse the project program source files
        Utils.forEach(this.program.getSourceFiles(), function (file) {
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
        // Get the list of bundle files to pass to program 
        var bundleFiles = [];
        bundleFiles.push(bundleFileName);
        Utils.forEach(this.program.getSourceFiles(), function (file) {
            bundleFiles.push(file.fileName);
        });
        // Allow bundle config to extent the project compilerOptions for declaration and source map emitted output
        var compilerOptions = this.compilerOptions;
        compilerOptions.declaration = bundleConfig.declaration || this.compilerOptions.declaration;
        compilerOptions.sourceMap = bundleConfig.sourceMap || this.compilerOptions.sourceMap;
        compilerOptions.noEmit = false; // Always emit bundle output
        // Pass the current project build program to reuse program structure
        var bundlerProgram = ts.createProgram(bundleFiles, compilerOptions, this.compilerHost); //CompilerHost, this.program );
        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics(bundlerProgram);
        this.preEmitTime = new Date().getTime() - this.preEmitTime;
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, preEmitDiagnostics);
        }
        this.emitTime = new Date().getTime();
        var emitResult = bundlerProgram.emit(bundleSourceFile);
        this.emitTime = new Date().getTime() - this.emitTime;
        // If the emitter didn't emit anything, then pass that value along.
        if (emitResult.emitSkipped) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped); //, emitResult.diagnostics );
        }
        var allDiagnostics = preEmitDiagnostics.concat(emitResult.diagnostics);
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (allDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics);
        }
        // Stream the bundle source file ts, and emitted files...
        Logger.info("Streaming vinyl bundle source: ", bundleFile.path);
        var tsVinylFile = new TsVinylFile({
            path: bundleFile.path,
            contents: new Buffer(bundleFile.text)
        });
        this.outputStream.push(tsVinylFile);
        var bundleDir = path.dirname(bundleFile.path);
        var bundleName = path.basename(bundleFile.path, bundleFile.extension);
        var jsBundlePath = TsCore.normalizeSlashes(path.join(bundleDir, bundleName + ".js"));
        // js should have been generated, but just in case!
        if (Utils.hasProperty(outputText, jsBundlePath)) {
            Logger.info("Streaming vinyl js: ", bundleName);
            var bundleJsVinylFile = new TsVinylFile({
                path: jsBundlePath,
                contents: new Buffer(outputText[jsBundlePath])
            });
            this.outputStream.push(bundleJsVinylFile);
        }
        var dtsBundlePath = TsCore.normalizeSlashes(path.join(bundleDir, bundleName + ".d.ts"));
        // d.ts is generated, if compiler option declaration is true
        if (Utils.hasProperty(outputText, dtsBundlePath)) {
            Logger.info("Streaming vinyl d.ts: ", dtsBundlePath);
            var bundleDtsVinylFile = new TsVinylFile({
                path: dtsBundlePath,
                contents: new Buffer(outputText[dtsBundlePath])
            });
            this.outputStream.push(bundleDtsVinylFile);
        }
        var mapBundlePath = TsCore.normalizeSlashes(path.join(bundleDir, bundleName + ".js.map"));
        // js.map is generated, if compiler option sourceMap is true
        if (Utils.hasProperty(outputText, mapBundlePath)) {
            Logger.info("Streaming vinyl js.map: ", mapBundlePath);
            var bundleMapVinylFile = new TsVinylFile({
                path: mapBundlePath,
                contents: new Buffer(outputText[mapBundlePath])
            });
            this.outputStream.push(bundleMapVinylFile);
        }
        this.compileTime = new Date().getTime() - this.compileTime;
        if (this.compilerOptions.diagnostics)
            this.reportStatistics();
        return new CompilerResult(ts.ExitStatus.Success);
    };
    BundleCompiler.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTime("Pre-emit time", this.preEmitTime);
        statisticsReporter.reportTime("Emit time", this.emitTime);
        statisticsReporter.reportTime("Compile time", this.compileTime);
    };
    return BundleCompiler;
})();
exports.BundleCompiler = BundleCompiler;
var Project = (function () {
    function Project(configFilePath, settings) {
        var _this = this;
        this.totalBuildTime = 0;
        this.totalCompileTime = 0;
        this.totalPreBuildTime = 0;
        this.totalBundleTime = 0;
        this.onConfigFileChanged = function (path, stats) {
            // Throw away the build context and start a fresh rebuild
            _this.buildContext = undefined;
            _this.startRebuildTimer();
        };
        this.onSourceFileChanged = function (sourceFile, path, stats) {
            sourceFile.fileWatcher.unwatch(sourceFile.fileName);
            sourceFile.fileWatcher = undefined;
            _this.startRebuildTimer();
        };
        this.onRebuildTimeout = function () {
            _this.rebuildTimer = undefined;
            var buildStatus = _this.buildWorker();
            _this.reportBuildStatus(buildStatus);
            if (_this.buildContext.config.compilerOptions.watch) {
                Logger.log("Watching for project changes...");
            }
        };
        this.configFilePath = configFilePath;
        this.settings = settings;
    }
    Project.prototype.build = function (outputStream) {
        var config = this.parseProjectConfig();
        if (!config.success) {
            DiagnosticsReporter.reportDiagnostics(config.errors);
            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }
        this.buildContext = this.createBuildContext(config);
        Logger.log("Building Project with: " + chalk.magenta("" + this.configFileName));
        Logger.log("TypeScript compiler version: ", ts.version);
        this.outputStream = outputStream;
        // Perform the build..
        var buildStatus = this.buildWorker();
        this.reportBuildStatus(buildStatus);
        if (config.compilerOptions.watch) {
            Logger.log("Watching for project changes...");
        }
        else {
            this.completeProjectBuild();
        }
        return buildStatus;
    };
    Project.prototype.createBuildContext = function (config) {
        if (config.compilerOptions.watch) {
            if (!this.watchProject()) {
                config.compilerOptions.watch = false;
            }
        }
        var compilerHost = new WatchCompilerHost(config.compilerOptions, this.onSourceFileChanged);
        return new ProjectBuildContext(compilerHost, config);
    };
    Project.prototype.watchProject = function () {
        var _this = this;
        if (!ts.sys.watchFile) {
            var diagnostic = TsCore.createDiagnostic({ code: 5001, category: ts.DiagnosticCategory.Warning, key: "The current node host does not support the '{0}' option." }, "-watch");
            DiagnosticsReporter.reportDiagnostic(diagnostic);
            return false;
        }
        // Add a watcher to the project config file if we haven't already done so.
        if (!this.configFileWatcher) {
            this.configFileWatcher = chokidar.watch(this.configFileName);
            this.configFileWatcher.on("change", function (path, stats) { return _this.onConfigFileChanged(path, stats); });
        }
        return true;
    };
    Project.prototype.completeProjectBuild = function () {
        // End the build process by sending EOF to the compilation output stream.
        this.outputStream.push(null);
    };
    Project.prototype.buildWorker = function () {
        this.totalBuildTime = this.totalPreBuildTime = new Date().getTime();
        if (!this.buildContext) {
            var config = this.parseProjectConfig();
            if (!config.success) {
                DiagnosticsReporter.reportDiagnostics(config.errors);
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }
            this.buildContext = this.createBuildContext(config);
        }
        var allDiagnostics = [];
        var fileNames = this.buildContext.config.fileNames;
        var bundles = this.buildContext.config.bundles;
        var compilerOptions = this.buildContext.config.compilerOptions;
        // Create a new program to handle the incremental build. Pass the current build context program ( if it exists )
        // to reuse the current program structure.
        var program = ts.createProgram(fileNames, compilerOptions, this.buildContext.host, this.buildContext.getProgram());
        this.totalPreBuildTime = new Date().getTime() - this.totalPreBuildTime;
        // Save the new program to the build context
        this.buildContext.setProgram(program);
        // Compile the project...
        var compiler = new Compiler(this.buildContext.host, program, this.outputStream);
        this.totalCompileTime = new Date().getTime();
        var compileResult = compiler.compile();
        this.totalCompileTime = new Date().getTime() - this.totalCompileTime;
        if (!compileResult.succeeded()) {
            DiagnosticsReporter.reportDiagnostics(compileResult.getErrors());
            return compileResult.getStatus();
        }
        if (compilerOptions.listFiles) {
            Utils.forEach(this.buildContext.getProgram().getSourceFiles(), function (file) {
                Logger.log(file.fileName);
            });
        }
        this.totalBundleTime = new Date().getTime();
        // Build bundles..
        var bundleBuilder = new BundleBuilder(this.buildContext.host, this.buildContext.getProgram());
        var bundleCompiler = new BundleCompiler(this.buildContext.host, this.buildContext.getProgram(), this.outputStream);
        var bundleResult;
        for (var i = 0, len = bundles.length; i < len; i++) {
            Logger.log("Building bundle: ", chalk.cyan(bundles[i].name));
            bundleResult = bundleBuilder.build(bundles[i]);
            if (!bundleResult.succeeded()) {
                DiagnosticsReporter.reportDiagnostics(bundleResult.getErrors());
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }
            compileResult = bundleCompiler.compile(bundleResult.getBundleSource(), bundles[i].config);
            if (!compileResult.succeeded()) {
                DiagnosticsReporter.reportDiagnostics(compileResult.getErrors());
                return compileResult.getStatus();
            }
        }
        this.totalBundleTime = new Date().getTime() - this.totalBundleTime;
        this.totalBuildTime = new Date().getTime() - this.totalBuildTime;
        if (compilerOptions.diagnostics) {
            this.reportStatistics();
        }
        if (allDiagnostics.length > 0) {
            return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
        }
        return ts.ExitStatus.Success;
    };
    Project.prototype.parseProjectConfig = function () {
        var _this = this;
        try {
            var isConfigDirectory = fs.lstatSync(this.configFilePath).isDirectory();
        }
        catch (e) {
            var diagnostic = TsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot read project path '{0}'." }, this.configFilePath);
            return { success: false, errors: [diagnostic] };
        }
        if (isConfigDirectory) {
            this.configFileDir = this.configFilePath;
            this.configFileName = path.join(this.configFilePath, "tsconfig.json");
        }
        else {
            this.configFileDir = path.dirname(this.configFilePath);
            this.configFileName = this.configFilePath;
        }
        Logger.info("Reading config file:", this.configFileName);
        var readConfigResult = ts.readConfigFile(this.configFileName, this.readFile);
        if (readConfigResult.error) {
            return { success: false, errors: [readConfigResult.error] };
        }
        var configObject = readConfigResult.config;
        // Parse standard project configuration objects: compilerOptions, files.
        Logger.info("Parsing config file...");
        var configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, this.configFileDir);
        if (configParseResult.errors.length > 0) {
            return { success: false, errors: configParseResult.errors };
        }
        // The returned "Files" list may contain file glob patterns. 
        configParseResult.fileNames = this.expandFileNames(configParseResult.fileNames, this.configFileDir);
        // The glob file patterns in "Files" is an enhancement to the standard Typescript project file (tsconfig.json) spec.
        // To convert the project file to use only a standard filename list, specify the setting: "convertFiles" : "true"
        if (this.settings.convertFiles === true) {
            this.convertProjectFileNames(configParseResult.fileNames, this.configFileDir);
        }
        // Parse "bundle" project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser();
        var bundlesParseResult = bundleParser.parseConfigFile(configObject, this.configFileDir);
        if (bundlesParseResult.errors.length > 0) {
            return { success: false, errors: bundlesParseResult.errors };
        }
        // The returned bundles "Files" list may contain file glob patterns. 
        bundlesParseResult.bundles.forEach(function (bundle) {
            bundle.fileNames = _this.expandFileNames(bundle.fileNames, _this.configFileDir);
        });
        // Parse the command line args to override project file compiler options
        var settingsCompilerOptions = this.getSettingsCompilerOptions(this.settings, this.configFileDir);
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
    Project.prototype.startRebuildTimer = function () {
        if (this.rebuildTimer) {
            clearTimeout(this.rebuildTimer);
        }
        this.rebuildTimer = setTimeout(this.onRebuildTimeout, 250);
    };
    Project.prototype.readFile = function (fileName) {
        return ts.sys.readFile(fileName);
    };
    Project.prototype.getSettingsCompilerOptions = function (jsonSettings, configDirPath) {
        // Parse the json settings from the TsProject src() API
        var parsedResult = ts.parseJsonConfigFileContent(jsonSettings, ts.sys, configDirPath);
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
    Project.prototype.convertProjectFileNames = function (fileNames, configDirPath) {
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
    Project.prototype.reportBuildStatus = function (buildStatus) {
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
    };
    Project.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTitle("Total build times...");
        statisticsReporter.reportTime("Pre-build time", this.totalPreBuildTime);
        statisticsReporter.reportTime("Compiling time", this.totalCompileTime);
        statisticsReporter.reportTime("Bundling time", this.totalBundleTime);
        statisticsReporter.reportTime("Build time", this.totalBuildTime);
    };
    return Project;
})();
exports.Project = Project;
function src(configFilePath, settings) {
    if (configFilePath === undefined && typeof configFilePath !== 'string') {
        throw new Error("Provide a valid directory or file path to the Typescript project configuration json file.");
    }
    settings = settings || {};
    settings.logLevel = settings.logLevel || 0;
    Logger.setLevel(settings.logLevel);
    Logger.setName("TsProject");
    var outputStream = new CompileStream();
    var project = new Project(configFilePath, settings);
    project.build(outputStream);
    return outputStream;
}
var tsproject = {
    src: src
};
module.exports = tsproject;
//# sourceMappingURL=tsproject.js.map