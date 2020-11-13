"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsProject = void 0;
var ts = require("typescript");
var path = require("path");
var stream = require("stream");
var chalk = require("chalk");
var VinylFile = require("vinyl");
var _ = require("lodash");
var fileGlob = require("glob");
var fs = require("fs");
var prettify = require("prettier");
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
        for (var _i = 0, supportedExtensions_1 = TsCore.supportedExtensions; _i < supportedExtensions_1.length; _i++) {
            var extension = supportedExtensions_1[_i];
            if (fileExtensionIs(fileName, extension)) {
                return true;
            }
        }
        return false;
    }
    TsCore.isSupportedSourceFileName = isSupportedSourceFileName;
    function getSourceFileFromSymbol(symbol) {
        var declarations = symbol.getDeclarations();
        if (declarations && declarations.length > 0) {
            if (declarations[0].kind === ts.SyntaxKind.SourceFile) {
                return declarations[0].getSourceFile();
            }
        }
        return undefined;
    }
    TsCore.getSourceFileFromSymbol = getSourceFileFromSymbol;
    function getExternalModuleName(node) {
        if (node.kind === ts.SyntaxKind.ImportDeclaration) {
            return node.moduleSpecifier;
        }
        if (node.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
            var reference = node.moduleReference;
            if (reference.kind === ts.SyntaxKind.ExternalModuleReference) {
                return reference.expression;
            }
        }
        if (node.kind === ts.SyntaxKind.ExportDeclaration) {
            return node.moduleSpecifier;
        }
        return undefined;
    }
    TsCore.getExternalModuleName = getExternalModuleName;
    function createDiagnostic(message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        // FUTURE: Typescript 1.8.x supports localized diagnostic messages.
        var textUnique123 = message.message;
        if (arguments.length > 1) {
            textUnique123 = formatStringFromArgs(textUnique123, arguments, 1);
        }
        return {
            file: undefined,
            start: undefined,
            length: undefined,
            messageText: textUnique123,
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
    // An alias symbol is created by one of the following declarations:
    // import <symbol> = ...
    // import <symbol> from ...
    // import * as <symbol> from ...
    // import { x as <symbol> } from ...
    // export { x as <symbol> } from ...
    // export = ...
    // export default ...
    function isAliasSymbolDeclaration(node) {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration ||
            node.kind === ts.SyntaxKind.ImportClause && !!node.name ||
            node.kind === ts.SyntaxKind.NamespaceImport ||
            node.kind === ts.SyntaxKind.ImportSpecifier ||
            node.kind === ts.SyntaxKind.ExportSpecifier ||
            node.kind === ts.SyntaxKind.ExportAssignment && node.expression.kind === ts.SyntaxKind.Identifier;
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
})(TsCore || (TsCore = {}));
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
            for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
                var v = array_1[_i];
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
            for (var _i = 0, array_2 = array; _i < array_2.length; _i++) {
                var v = array_2[_i];
                result.push(f(v));
            }
        }
        return result;
    }
    Utils.map = map;
    function extend(first, second) {
        var sentinal = 1;
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
    function replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length);
    }
    Utils.replaceAt = replaceAt;
})(Utils || (Utils = {}));
var level = {
    none: 0,
    error: 1,
    warn: 2,
    trace: 3,
    info: 4
};
var Logger = /** @class */ (function () {
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
            args[_i] = arguments[_i];
        }
        console.log.apply(console, __spreadArrays([chalk.gray("[" + this.logName + "]")], args));
    };
    Logger.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.info) {
            return;
        }
        console.log.apply(console, __spreadArrays([chalk.gray("[" + this.logName + "]" + chalk.blue(" INFO: "))], args));
    };
    Logger.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.warn) {
            return;
        }
        console.log.apply(console, __spreadArrays(["[" + this.logName + "]" + chalk.yellow(" WARNING: ")], args));
    };
    Logger.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.error) {
            return;
        }
        console.log.apply(console, __spreadArrays(["[" + this.logName + "]" + chalk.red(" ERROR: ")], args));
    };
    Logger.trace = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.error) {
            return;
        }
        console.log.apply(console, __spreadArrays(["[" + this.logName + "]" + chalk.gray(" TRACE: ")], args));
    };
    Logger.logLevel = level.none;
    Logger.logName = "logger";
    return Logger;
}());
var CompilerResult = /** @class */ (function () {
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
}());
var CachingCompilerHost = /** @class */ (function () {
    function CachingCompilerHost(compilerOptions) {
        var _this = this;
        this.system = ts.sys;
        this.output = {};
        this.dirExistsCache = {};
        this.fileExistsCache = {};
        this.fileReadCache = {};
        this.getOutput = function () {
            return _this.output;
        };
        this.readFile = function (fileName) {
            if (_this.isBuildInfoFile(fileName)) {
                return _this.baseHost.readFile(fileName);
            }
            if (Utils.hasProperty(_this.fileReadCache, fileName)) {
                return _this.fileReadCache[fileName];
            }
            return _this.fileReadCache[fileName] = _this.baseHost.readFile(fileName);
        };
        this.writeFile = function (fileName, data, writeByteOrderMark, onError) {
            if (_this.isBuildInfoFile(fileName)) {
                return _this.baseHost.writeFile(fileName, data, writeByteOrderMark);
            }
            _this.baseHost.writeFile(fileName, data, writeByteOrderMark);
            _this.output[fileName] = data;
        };
        this.directoryExists = function (directoryPath) {
            if (Utils.hasProperty(_this.dirExistsCache, directoryPath)) {
                return _this.dirExistsCache[directoryPath];
            }
            return _this.dirExistsCache[directoryPath] = ts.sys.directoryExists(directoryPath);
        };
        this.fileExists = function (fileName) {
            fileName = _this.getCanonicalFileName(fileName);
            // Prune off searches on directories that don't exist
            if (!_this.directoryExists(path.dirname(fileName))) {
                return false;
            }
            if (Utils.hasProperty(_this.fileExistsCache, fileName)) {
                return _this.fileExistsCache[fileName];
            }
            return _this.fileExistsCache[fileName] = _this.baseHost.fileExists(fileName);
        };
        // Use Typescript CompilerHost "base class" implementation..
        this.getSourceFile = function (fileName, languageVersion, onError) {
            return _this.baseHost.getSourceFile(fileName, languageVersion, onError);
        };
        this.getDefaultLibFileName = function (options) {
            return _this.baseHost.getDefaultLibFileName(options);
        };
        this.getCurrentDirectory = function () {
            return _this.baseHost.getCurrentDirectory();
        };
        this.getDirectories = function (path) {
            return _this.baseHost.getDirectories(path);
        };
        this.getCanonicalFileName = function (fileName) {
            return _this.baseHost.getCanonicalFileName(fileName);
        };
        this.useCaseSensitiveFileNames = function () {
            return _this.baseHost.useCaseSensitiveFileNames();
        };
        this.getNewLine = function () {
            return _this.baseHost.getNewLine();
        };
        this.compilerOptions = compilerOptions;
        this.baseHost = ts.createIncrementalCompilerHost(this.compilerOptions, this.system);
    }
    CachingCompilerHost.prototype.readDirectory = function (rootDir, extensions, exclude, include, depth) {
        return this.baseHost.readDirectory(rootDir, extensions, exclude, include, depth);
    };
    CachingCompilerHost.prototype.trace = function (s) {
        console.log(s);
    };
    CachingCompilerHost.prototype.isBuildInfoFile = function (file) {
        return TsCore.fileExtensionIs(file, ts.Extension.TsBuildInfo.toString());
    };
    return CachingCompilerHost;
}());
var CompileStream = /** @class */ (function (_super) {
    __extends(CompileStream, _super);
    function CompileStream(opts) {
        return _super.call(this, { objectMode: true }) || this;
    }
    CompileStream.prototype._read = function () {
        // Safely do nothing
    };
    return CompileStream;
}(stream.Readable));
var StatisticsReporter = /** @class */ (function () {
    function StatisticsReporter() {
    }
    StatisticsReporter.prototype.reportTitle = function (name) {
        Logger.log(name);
    };
    StatisticsReporter.prototype.reportValue = function (name, value) {
        Logger.log(this.padRight(name + ":", 25) + chalk.magenta(this.padLeft(value.toString(), 10)));
    };
    StatisticsReporter.prototype.reportCount = function (name, count) {
        this.reportValue(name, "" + count);
    };
    StatisticsReporter.prototype.reportTime = function (name, time) {
        this.reportValue(name, (time / 1000).toFixed(2) + "s");
    };
    StatisticsReporter.prototype.reportPercentage = function (name, percentage) {
        this.reportValue(name, percentage.toFixed(2) + "%");
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
}());
var BundlePackageType;
(function (BundlePackageType) {
    BundlePackageType[BundlePackageType["None"] = 0] = "None";
    BundlePackageType[BundlePackageType["Library"] = 1] = "Library";
    BundlePackageType[BundlePackageType["Component"] = 2] = "Component";
})(BundlePackageType || (BundlePackageType = {}));
var BundlePackage = /** @class */ (function () {
    function BundlePackage(packageType, packageNamespace) {
        this.packageNamespace = undefined;
        this.packageType = packageType;
        this.packageNamespace = packageNamespace;
    }
    BundlePackage.prototype.getPackageType = function () {
        return this.packageType;
    };
    BundlePackage.prototype.getPackageNamespace = function () {
        return this.packageNamespace;
    };
    return BundlePackage;
}());
var BundleParser = /** @class */ (function () {
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
                            errors.push(TsCore.createDiagnostic({ code: 6063, category: ts.DiagnosticCategory.Error, key: "Bundle_0_files_is_not_an_array_6063", message: "Bundle '{0}' files is not an array." }, id));
                        }
                    }
                    else {
                        errors.push(TsCore.createDiagnostic({ code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle_0_requires_an_array_of_files_6062", message: "Bundle '{0}' requires an array of files." }, id));
                    }
                    // Config..
                    if (Utils.hasProperty(jsonBundle, "config")) {
                        config = jsonBundle.config;
                    }
                    config.package = parsePackageConfig(config);
                    bundles.push({ name: bundleName, fileNames: fileNames, config: config });
                }
            }
            return bundles;
        }
        function parsePackageConfig(config) {
            // TODO: Add diagnostics for input errors..
            var bundlePackageType = 0 /* None */;
            var bundlePackageNamespace = undefined;
            var packageTypeMap = {
                "none": 0 /* None */,
                "library": 1 /* Library */,
                "component": 2 /* Component */
            };
            if (Utils.hasProperty(config, "package")) {
                var packageType = config["package"];
                if (typeof (packageType) === "string") {
                    if (Utils.hasProperty(packageTypeMap, packageType.toLowerCase())) {
                        bundlePackageType = packageTypeMap[packageType.toLowerCase()];
                    }
                }
            }
            if (Utils.hasProperty(config, "packageNamespace")) {
                var packageNamespace = config["packageNamespace"];
                if (typeof (packageNamespace) === "string") {
                    bundlePackageNamespace = packageNamespace;
                }
            }
            return new BundlePackage(bundlePackageType, bundlePackageNamespace);
        }
    };
    return BundleParser;
}());
var Compiler = /** @class */ (function () {
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
                var tsVinylFile = new VinylFile({
                    path: fileName,
                    contents: Buffer.from(fileData)
                });
                this.compileStream.push(tsVinylFile);
            }
        }
        this.compileTime = new Date().getTime() - this.compileTime;
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (diagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, diagnostics);
        }
        // TODO: diagnostics is now internal
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
            if (!file.isDeclarationFile) {
                count += _this.getLineStarts(file).length;
            }
        });
        return count;
    };
    Compiler.prototype.getLineStarts = function (sourceFile) {
        return sourceFile.getLineStarts();
    };
    return Compiler;
}());
var Ast;
(function (Ast) {
    function modifiersToFlags(modifiers) {
        var flags = ts.ModifierFlags.None;
        if (modifiers) {
            for (var _i = 0, modifiers_1 = modifiers; _i < modifiers_1.length; _i++) {
                var modifier = modifiers_1[_i];
                flags |= modifierToFlag(modifier.kind);
            }
        }
        return flags;
    }
    Ast.modifiersToFlags = modifiersToFlags;
    function modifierToFlag(token) {
        switch (token) {
            case ts.SyntaxKind.StaticKeyword: return ts.ModifierFlags.Static;
            case ts.SyntaxKind.PublicKeyword: return ts.ModifierFlags.Public;
            case ts.SyntaxKind.ProtectedKeyword: return ts.ModifierFlags.Protected;
            case ts.SyntaxKind.PrivateKeyword: return ts.ModifierFlags.Private;
            case ts.SyntaxKind.AbstractKeyword: return ts.ModifierFlags.Abstract;
            case ts.SyntaxKind.ExportKeyword: return ts.ModifierFlags.Export;
            case ts.SyntaxKind.DeclareKeyword: return ts.ModifierFlags.Ambient;
            case ts.SyntaxKind.ConstKeyword: return ts.ModifierFlags.Const;
            case ts.SyntaxKind.DefaultKeyword: return ts.ModifierFlags.Default;
            case ts.SyntaxKind.AsyncKeyword: return ts.ModifierFlags.Async;
            case ts.SyntaxKind.ReadonlyKeyword: return ts.ModifierFlags.Readonly;
        }
        return ts.ModifierFlags.None;
    }
    Ast.modifierToFlag = modifierToFlag;
    /**
     * Gets the ModifierFlags for syntactic modifiers on the provided node. The modifier flags cache on the node is ignored.
     *
     * NOTE: This function does not use `parent` pointers and will not include modifiers from JSDoc.
     */
    function getSyntacticModifierFlagsNoCache(node) {
        var flags = modifiersToFlags(node.modifiers);
        if (node.flags & ts.NodeFlags.NestedNamespace || (node.kind === ts.SyntaxKind.Identifier && node.isInJSDocNamespace)) {
            flags |= ts.ModifierFlags.Export;
        }
        return flags;
    }
    Ast.getSyntacticModifierFlagsNoCache = getSyntacticModifierFlagsNoCache;
    var ContainerFlags;
    (function (ContainerFlags) {
        // The current node is not a container, and no container manipulation should happen before
        // recursing into it.
        ContainerFlags[ContainerFlags["None"] = 0] = "None";
        // The current node is a container.  It should be set as the current container (and block-
        // container) before recursing into it.  The current node does not have locals.  Examples:
        //
        //      Classes, ObjectLiterals, TypeLiterals, Interfaces...
        ContainerFlags[ContainerFlags["IsContainer"] = 1] = "IsContainer";
        // The current node is a block-scoped-container.  It should be set as the current block-
        // container before recursing into it.  Examples:
        //
        //      Blocks (when not parented by functions), Catch clauses, For/For-in/For-of statements...
        ContainerFlags[ContainerFlags["IsBlockScopedContainer"] = 2] = "IsBlockScopedContainer";
        // The current node is the container of a control flow path. The current control flow should
        // be saved and restored, and a new control flow initialized within the container.
        ContainerFlags[ContainerFlags["IsControlFlowContainer"] = 4] = "IsControlFlowContainer";
        ContainerFlags[ContainerFlags["IsFunctionLike"] = 8] = "IsFunctionLike";
        ContainerFlags[ContainerFlags["IsFunctionExpression"] = 16] = "IsFunctionExpression";
        ContainerFlags[ContainerFlags["HasLocals"] = 32] = "HasLocals";
        ContainerFlags[ContainerFlags["IsInterface"] = 64] = "IsInterface";
        ContainerFlags[ContainerFlags["IsObjectLiteralOrClassExpressionMethod"] = 128] = "IsObjectLiteralOrClassExpressionMethod";
        // If the current node is a container that also contains locals.  Examples:
        //
        //      Functions, Methods, Modules, Source-files.
        ContainerFlags[ContainerFlags["IsContainerWithLocals"] = 33] = "IsContainerWithLocals";
    })(ContainerFlags = Ast.ContainerFlags || (Ast.ContainerFlags = {}));
    function isPrototypeAccessAssignment(expression) {
        if (expression.kind !== ts.SyntaxKind.BinaryExpression) {
            return false;
        }
        var expr = expression;
        if (expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken || expr.left.kind !== ts.SyntaxKind.PropertyAccessExpression) {
            return false;
        }
        var lhs = expr.left;
        if (lhs.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            // chained dot, e.g. x.y.z = expr; this var is the 'x.y' part
            var innerPropertyAccess = lhs.expression;
            if (innerPropertyAccess.expression.kind === ts.SyntaxKind.Identifier && innerPropertyAccess.name.text === "prototype") {
                return true;
            }
        }
        return false;
    }
    Ast.isPrototypeAccessAssignment = isPrototypeAccessAssignment;
    function isFunctionLike(node) {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.Constructor:
                case ts.SyntaxKind.FunctionExpression:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.ArrowFunction:
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                case ts.SyntaxKind.CallSignature:
                case ts.SyntaxKind.ConstructSignature:
                case ts.SyntaxKind.IndexSignature:
                case ts.SyntaxKind.FunctionType:
                case ts.SyntaxKind.ConstructorType:
                    return true;
            }
        }
        return false;
    }
    Ast.isFunctionLike = isFunctionLike;
    function isObjectLiteralOrClassExpressionMethod(node) {
        return node.kind === ts.SyntaxKind.MethodDeclaration &&
            (node.parent.kind === ts.SyntaxKind.ObjectLiteralExpression || node.parent.kind === ts.SyntaxKind.ClassExpression);
    }
    Ast.isObjectLiteralOrClassExpressionMethod = isObjectLiteralOrClassExpressionMethod;
    function isInterfaceInternal(symbol) {
        //if ( symbol && ( symbol.flags & ts.SymbolFlags.Interface ) ) {
        //    if ( symbol.valueDeclaration ) {
        //        let flags = getModifierFlags( symbol.valueDeclaration );
        //        //if ( !( flags & ts.ModifierFlags.Export ) ) {
        //        //    return true;
        //        //}
        //        // FUTURE: How to make interfaces internal by convention?
        //        return false;
        //    }
        //}
        return false;
    }
    Ast.isInterfaceInternal = isInterfaceInternal;
    function isClassInternal(symbol) {
        if (symbol && (symbol.flags & ts.SymbolFlags.Class)) {
            // If the class is from an extern API or ambient then it cannot be considered internal.
            if (Ast.isExportContext(symbol) || Ast.isAmbientContext(symbol)) {
                return false;
            }
            // A class always has a value declaration
            var flags = getSyntacticModifierFlagsNoCache(symbol.valueDeclaration);
            // By convention, "Internal" classes are ones that are not exported.
            if (!(flags & ts.ModifierFlags.Export)) {
                return true;
            }
        }
        return false;
    }
    Ast.isClassInternal = isClassInternal;
    function isClassAbstract(classSymbol) {
        if (classSymbol && classSymbol.valueDeclaration) {
            if (getSyntacticModifierFlagsNoCache(classSymbol.valueDeclaration) & ts.ModifierFlags.Abstract) {
                return true;
            }
        }
        return false;
    }
    Ast.isClassAbstract = isClassAbstract;
    function getClassHeritageProperties(classNode, checker) {
        var classExportProperties = [];
        function getHeritageExportProperties(heritageClause, checker) {
            var inheritedTypeNodes = heritageClause.types;
            if (inheritedTypeNodes) {
                for (var _i = 0, inheritedTypeNodes_1 = inheritedTypeNodes; _i < inheritedTypeNodes_1.length; _i++) {
                    var typeRefNode = inheritedTypeNodes_1[_i];
                    // The "properties" of inheritedType includes all the base class/interface properties
                    var inheritedType = checker.getTypeAtLocation(typeRefNode);
                    var inheritedTypeDeclaration = inheritedType.symbol.valueDeclaration;
                    if (inheritedTypeDeclaration) {
                        var inheritedTypeHeritageClauses = inheritedTypeDeclaration.heritageClauses;
                        if (inheritedTypeHeritageClauses) {
                            for (var _a = 0, inheritedTypeHeritageClauses_1 = inheritedTypeHeritageClauses; _a < inheritedTypeHeritageClauses_1.length; _a++) {
                                var inheritedTypeHeritageClause = inheritedTypeHeritageClauses_1[_a];
                                getHeritageExportProperties(inheritedTypeHeritageClause, checker);
                            }
                        }
                    }
                    var inheritedTypeProperties = inheritedType.getProperties();
                    for (var _b = 0, inheritedTypeProperties_1 = inheritedTypeProperties; _b < inheritedTypeProperties_1.length; _b++) {
                        var propertySymbol = inheritedTypeProperties_1[_b];
                        if (Ast.isExportContext(propertySymbol)) {
                            classExportProperties.push(propertySymbol);
                        }
                    }
                }
            }
        }
        var heritageClauses = classNode.heritageClauses;
        if (heritageClauses) {
            for (var _i = 0, heritageClauses_1 = heritageClauses; _i < heritageClauses_1.length; _i++) {
                var heritageClause = heritageClauses_1[_i];
                getHeritageExportProperties(heritageClause, checker);
            }
        }
        return classExportProperties;
    }
    Ast.getClassHeritageProperties = getClassHeritageProperties;
    function getClassAbstractProperties(extendsClause, checker) {
        var abstractProperties = [];
        var abstractTypeNodes = extendsClause.types;
        for (var _i = 0, abstractTypeNodes_1 = abstractTypeNodes; _i < abstractTypeNodes_1.length; _i++) {
            var abstractTypeNode = abstractTypeNodes_1[_i];
            var abstractType = checker.getTypeAtLocation(abstractTypeNode);
            var abstractTypeSymbol = abstractType.getSymbol();
            if (abstractTypeSymbol.valueDeclaration) {
                if (getSyntacticModifierFlagsNoCache(abstractTypeSymbol.valueDeclaration) & ts.ModifierFlags.Abstract) {
                    var props = abstractType.getProperties();
                    for (var _a = 0, props_1 = props; _a < props_1.length; _a++) {
                        var prop = props_1[_a];
                        abstractProperties.push(prop);
                    }
                }
            }
        }
        return abstractProperties;
    }
    Ast.getClassAbstractProperties = getClassAbstractProperties;
    function getImplementsProperties(implementsClause, checker) {
        var implementsProperties = [];
        var typeNodes = implementsClause.types;
        for (var _i = 0, typeNodes_1 = typeNodes; _i < typeNodes_1.length; _i++) {
            var typeNode = typeNodes_1[_i];
            var type = checker.getTypeAtLocation(typeNode);
            var props = type.getProperties();
            for (var _a = 0, props_2 = props; _a < props_2.length; _a++) {
                var prop = props_2[_a];
                implementsProperties.push(prop);
            }
        }
        return implementsProperties;
    }
    Ast.getImplementsProperties = getImplementsProperties;
    function getIdentifierUID(symbol) {
        if (!symbol) {
            return undefined;
        }
        var id = symbol.id;
        // Try to get the symbol id from the identifier value declaration
        if (id === undefined && symbol.valueDeclaration) {
            id = symbol.valueDeclaration.symbol.id;
        }
        return id ? id.toString() : undefined;
    }
    Ast.getIdentifierUID = getIdentifierUID;
    function getContainerFlags(node) {
        switch (node.kind) {
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
            case ts.SyntaxKind.ObjectLiteralExpression:
            case ts.SyntaxKind.TypeLiteral:
            case ts.SyntaxKind.JSDocTypeLiteral:
            case ts.SyntaxKind.JsxAttributes:
                return 1 /* IsContainer */;
            case ts.SyntaxKind.InterfaceDeclaration:
                return 1 /* IsContainer */ | 64 /* IsInterface */;
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.TypeAliasDeclaration:
            case ts.SyntaxKind.MappedType:
                return 1 /* IsContainer */ | 32 /* HasLocals */;
            case ts.SyntaxKind.SourceFile:
                return 1 /* IsContainer */ | 4 /* IsControlFlowContainer */ | 32 /* HasLocals */;
            case ts.SyntaxKind.MethodDeclaration:
                if (isObjectLiteralOrClassExpressionMethod(node)) {
                    return 1 /* IsContainer */ | 4 /* IsControlFlowContainer */ | 32 /* HasLocals */ | 8 /* IsFunctionLike */ | 128 /* IsObjectLiteralOrClassExpressionMethod */;
                }
            // falls through
            case ts.SyntaxKind.Constructor:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.CallSignature:
            case ts.SyntaxKind.JSDocFunctionType:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructSignature:
            case ts.SyntaxKind.IndexSignature:
            case ts.SyntaxKind.ConstructorType:
                return 1 /* IsContainer */ | 4 /* IsControlFlowContainer */ | 32 /* HasLocals */ | 8 /* IsFunctionLike */;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return 1 /* IsContainer */ | 4 /* IsControlFlowContainer */ | 32 /* HasLocals */ | 8 /* IsFunctionLike */ | 16 /* IsFunctionExpression */;
            case ts.SyntaxKind.ModuleBlock:
                return 4 /* IsControlFlowContainer */;
            case ts.SyntaxKind.PropertyDeclaration:
                return node.initializer ? 4 /* IsControlFlowContainer */ : 0;
            case ts.SyntaxKind.CatchClause:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.CaseBlock:
                return 2 /* IsBlockScopedContainer */;
            case ts.SyntaxKind.Block:
                // do not treat blocks directly inside a function as a block-scoped-container.
                // Locals that reside in this block should go to the function locals. Otherwise 'x'
                // would not appear to be a redeclaration of a block scoped local in the following
                // example:
                //
                //      function foo() {
                //          var x;
                //          let x;
                //      }
                //
                // If we placed 'var x' into the function locals and 'let x' into the locals of
                // the block, then there would be no collision.
                //
                // By not creating a new block-scoped-container here, we ensure that both 'var x'
                // and 'let x' go into the Function-container's locals, and we do get a collision
                // conflict.
                return isFunctionLike(node.parent) ? 0 /* None */ : 2 /* IsBlockScopedContainer */;
        }
        return 0 /* None */;
    }
    Ast.getContainerFlags = getContainerFlags;
    function getImplementsClause(node) {
        if (node) {
            var heritageClauses = node.heritageClauses;
            if (heritageClauses) {
                for (var _i = 0, heritageClauses_2 = heritageClauses; _i < heritageClauses_2.length; _i++) {
                    var clause = heritageClauses_2[_i];
                    if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
                        return clause;
                    }
                }
            }
        }
        return undefined;
    }
    Ast.getImplementsClause = getImplementsClause;
    function getExtendsClause(node) {
        if (node) {
            var heritageClauses = node.heritageClauses;
            if (heritageClauses) {
                for (var _i = 0, heritageClauses_3 = heritageClauses; _i < heritageClauses_3.length; _i++) {
                    var clause = heritageClauses_3[_i];
                    if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                        return clause;
                    }
                }
            }
        }
        return undefined;
    }
    Ast.getExtendsClause = getExtendsClause;
    function isKeyword(token) {
        return ts.SyntaxKind.FirstKeyword <= token && token <= ts.SyntaxKind.LastKeyword;
    }
    Ast.isKeyword = isKeyword;
    function isPuncuation(token) {
        return ts.SyntaxKind.FirstPunctuation <= token && token <= ts.SyntaxKind.LastPunctuation;
    }
    Ast.isPuncuation = isPuncuation;
    function isTrivia(token) {
        return ts.SyntaxKind.FirstTriviaToken <= token && token <= ts.SyntaxKind.LastTriviaToken;
    }
    Ast.isTrivia = isTrivia;
    function isExportContext(propertySymbol) {
        var node = propertySymbol.valueDeclaration;
        //while ( node ) {
        //    if ( getModifierFlags( node ) & ts.ModifierFlags.Export ) {
        //        return true;
        //    }
        //    node = node.parent;
        //}
        while (node) {
            if (node.flags & ts.NodeFlags.ExportContext) {
                return true;
            }
            node = node.parent;
        }
        return false;
    }
    Ast.isExportContext = isExportContext;
    function isAmbientContext(propertySymbol) {
        var node = propertySymbol.valueDeclaration;
        while (node) {
            if (getSyntacticModifierFlagsNoCache(node) & ts.ModifierFlags.Ambient) {
                return true;
            }
            node = node.parent;
        }
        return false;
    }
    Ast.isAmbientContext = isAmbientContext;
    function isSourceCodeFile(file) {
        return (file.kind === ts.SyntaxKind.SourceFile && !file.isDeclarationFile);
    }
    Ast.isSourceCodeFile = isSourceCodeFile;
})(Ast || (Ast = {}));
var Glob = /** @class */ (function () {
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
}());
var BundleResult = /** @class */ (function () {
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
}());
var DependencyBuilder = /** @class */ (function () {
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
                var importSourceFile = self.getSourceFileFromSymbol(importSymbol);
                var canonicalFileName = self.host.getCanonicalFileName(importSourceFile.fileName);
                // Don't walk imports that we've already processed
                if (!Utils.hasProperty(importWalked, canonicalFileName)) {
                    importWalked[canonicalFileName] = true;
                    // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    if (!importSourceFile.isDeclarationFile) {
                        Logger.info("Walking Import module: ", canonicalFileName);
                        walkModuleImports(self.getImportsOfModule(importSourceFile));
                    }
                }
                if (!Utils.hasProperty(dependencies, canonicalFileName)) {
                    Logger.info("Getting and adding imports of module file: ", canonicalFileName);
                    dependencies[canonicalFileName] = self.getImportsOfModule(importSourceFile);
                }
            });
        }
        // Get the top level source file imports
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
        if (!Ast.isSourceCodeFile(file)) {
            return [];
        }
        var importNodes = [];
        var self = this;
        function getImports(searchNode) {
            ts.forEachChild(searchNode, function (node) {
                if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
                    var moduleNameExpr = TsCore.getExternalModuleName(node);
                    if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
                        var moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
                        if (moduleSymbol) {
                            Logger.info("Adding import node: ", moduleSymbol.name);
                            importNodes.push(node);
                        }
                        else {
                            Logger.warn("Module symbol not found");
                        }
                    }
                }
                else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
                    // For a namespace ( or module ), traverse the body to locate ES6 module dependencies.
                    // TJT: This section needs to be reviewed. Should namespace/module syntax kinds be scanned or
                    //      Do we only support ES6 import/export syntax, where dependencies must be declared top level?
                    var moduleDeclaration = node;
                    if ((moduleDeclaration.name.kind === ts.SyntaxKind.StringLiteral) &&
                        (Ast.getSyntacticModifierFlagsNoCache(moduleDeclaration) & ts.ModifierFlags.Ambient || file.isDeclarationFile)) {
                        // An AmbientExternalModuleDeclaration declares an external module.
                        Logger.info("Scanning for dependencies within ambient module declaration: ", moduleDeclaration.name.text);
                        getImports(moduleDeclaration.body);
                    }
                }
            });
        }
        ;
        Logger.info("Getting imports for source file: ", file.fileName);
        getImports(file);
        return importNodes;
    };
    DependencyBuilder.prototype.isExternalModuleImportEqualsDeclaration = function (node) {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration && node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference;
    };
    DependencyBuilder.prototype.getExternalModuleImportEqualsDeclarationExpression = function (node) {
        return node.moduleReference.expression;
    };
    DependencyBuilder.prototype.getSymbolFromNode = function (node) {
        var moduleNameExpr = TsCore.getExternalModuleName(node);
        if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
            return this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
        }
        return undefined;
    };
    DependencyBuilder.prototype.getSourceFileFromSymbol = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return declaration.getSourceFile();
    };
    return DependencyBuilder;
}());
var IdentifierInfo = /** @class */ (function () {
    function IdentifierInfo(identifier, symbol, container) {
        this.containers = {};
        this.identifiers = [];
        this.shortenedName = undefined;
        this.isMinified = false;
        this.identifier = identifier;
        this.symbol = symbol;
        this.identifiers = [identifier];
        this.containers[container.getId().toString()] = container;
    }
    IdentifierInfo.prototype.getSymbol = function () {
        return this.symbol;
    };
    IdentifierInfo.prototype.getName = function () {
        return this.symbol.name;
    };
    IdentifierInfo.prototype.getId = function () {
        var id = this.symbol.id;
        if (id === undefined && this.symbol.valueDeclaration) {
            id = this.symbol.valueDeclaration.symbol.id;
        }
        return id ? id.toString() : undefined;
    };
    IdentifierInfo.prototype.getContainers = function () {
        return this.containers;
    };
    IdentifierInfo.prototype.getIdentifiers = function () {
        return this.identifiers;
    };
    IdentifierInfo.prototype.addRef = function (identifier, container) {
        // Add the identifier (node) reference
        this.identifiers.push(identifier);
        // We only need to keep track of a single reference in a container
        if (!Utils.hasProperty(this.containers, container.getId().toString())) {
            this.containers[container.getId().toString()] = container;
        }
    };
    IdentifierInfo.prototype.isNamespaceImportAlias = function () {
        if ((this.symbol.flags & ts.SymbolFlags.Alias) > 0) {
            if (this.symbol.declarations[0].kind === ts.SyntaxKind.NamespaceImport) {
                return true;
            }
        }
        return false;
    };
    IdentifierInfo.prototype.isFunctionScopedVariable = function () {
        if ((this.symbol.flags & ts.SymbolFlags.FunctionScopedVariable) > 0) {
            var variableDeclaration = this.getVariableDeclaration();
            if (variableDeclaration) {
                // Determine if the declaration is exported
                var flags = Ast.getSyntacticModifierFlagsNoCache(variableDeclaration.parent.parent);
                if (flags & ts.ModifierFlags.Export) {
                    return false;
                }
                // The var declaration is not exported.
                return true;
            }
        }
        return false;
    };
    IdentifierInfo.prototype.isBlockScopedVariable = function () {
        if ((this.symbol.flags & ts.SymbolFlags.BlockScopedVariable) > 0) {
            var variableDeclaration = this.getVariableDeclaration();
            if (variableDeclaration) {
                return ((variableDeclaration.parent.flags & ts.NodeFlags.Let) !== 0) ||
                    ((variableDeclaration.parent.flags & ts.NodeFlags.Const) !== 0);
            }
        }
        return false;
    };
    IdentifierInfo.prototype.isParameter = function () {
        // Note: FunctionScopedVariable also indicates a parameter
        if ((this.symbol.flags & ts.SymbolFlags.FunctionScopedVariable) > 0) {
            // A parameter has a value declaration
            if (this.symbol.valueDeclaration.kind === ts.SyntaxKind.Parameter) {
                return true;
            }
        }
        return false;
    };
    IdentifierInfo.prototype.isInternalClass = function () {
        // TJT: Review - should use the same export "override" logic as in isInternalFunction
        return Ast.isClassInternal(this.symbol);
    };
    IdentifierInfo.prototype.isInternalInterface = function () {
        return Ast.isInterfaceInternal(this.symbol);
    };
    IdentifierInfo.prototype.isInternalFunction = function (packageNamespace) {
        if (this.symbol.flags & ts.SymbolFlags.Function) {
            // A function has a value declaration
            if (this.symbol.valueDeclaration.kind === ts.SyntaxKind.FunctionDeclaration) {
                var flags = Ast.getSyntacticModifierFlagsNoCache(this.symbol.valueDeclaration);
                // If the function is from an extern API or ambient then it cannot be considered internal.
                if (Ast.isExportContext(this.symbol) || Ast.isAmbientContext(this.symbol)) {
                    return false;
                }
                if (!(flags & ts.ModifierFlags.Export)) {
                    return true;
                }
                // Override export flag if function is not in our special package namespace.
                if (packageNamespace) {
                    var node = this.symbol.valueDeclaration;
                    while (node) {
                        if (node.flags & ts.NodeFlags.Namespace) {
                            var nodeNamespaceName = node.name.text;
                            if (nodeNamespaceName !== packageNamespace) {
                                return true;
                            }
                        }
                        node = node.parent;
                    }
                }
            }
        }
        return false;
    };
    IdentifierInfo.prototype.isPrivateMethod = function () {
        if ((this.symbol.flags & ts.SymbolFlags.Method) > 0) {
            // We explicitly check that a method has a value declaration.
            if (this.symbol.valueDeclaration === undefined) {
                return false;
            }
            var flags = Ast.getSyntacticModifierFlagsNoCache(this.symbol.valueDeclaration);
            if ((flags & ts.ModifierFlags.Private) > 0) {
                return true;
            }
            // Check if the method parent class or interface is "internal" ( non-private methods may be shortened too )
            var parent_1 = this.symbol.parent;
            if (parent_1 && Ast.isClassInternal(parent_1)) {
                // TJT: Review - public methods of abstract classes are not shortened.
                if (!Ast.isClassAbstract(parent_1)) {
                    return true;
                }
            }
            if (parent_1 && Ast.isInterfaceInternal(parent_1)) {
                // TODO: Interfaces methods are always external for now.
                return false;
            }
        }
        return false;
    };
    IdentifierInfo.prototype.isPrivateProperty = function () {
        if ((this.symbol.flags & ts.SymbolFlags.Property) > 0) {
            // A property has a value declaration except when it is the "prototype" property.
            if (this.symbol.valueDeclaration === undefined) {
                return false;
            }
            var flags = Ast.getSyntacticModifierFlagsNoCache(this.symbol.valueDeclaration);
            if ((flags & ts.ModifierFlags.Private) > 0) {
                return true;
            }
            // Check if the property parent class is "internal" ( non-private properties may be shortened too )
            var parent_2 = this.symbol.parent;
            if (parent_2 && Ast.isClassInternal(parent_2)) {
                // TJT: Review - public properties of abstact classes are not shortened.
                if (!Ast.isClassAbstract(parent_2)) {
                    return true;
                }
            }
        }
        return false;
    };
    IdentifierInfo.prototype.getVariableDeclaration = function () {
        switch (this.identifier.parent.kind) {
            case ts.SyntaxKind.VariableDeclaration:
                return this.identifier.parent;
            case ts.SyntaxKind.VariableDeclarationList:
                Logger.warn("VariableDeclaratioList in getVariableDeclaration() - returning null");
                break;
            case ts.SyntaxKind.VariableStatement:
                Logger.warn("VariableStatement in getVariableDeclaration() - returning null");
                break;
        }
        return null;
    };
    return IdentifierInfo;
}());
var ContainerIdGenerator = /** @class */ (function () {
    function ContainerIdGenerator() {
    }
    ContainerIdGenerator.getNextId = function () {
        return this.nextId++;
    };
    ContainerIdGenerator.nextId = 1;
    return ContainerIdGenerator;
}());
var Container = /** @class */ (function () {
    function Container(node, containerFlags, parentContainer) {
        this.childContainers = [];
        // The base class cannot be determined by the checker if the base class name has been shortened
        // so we use get and set for the baseClass property
        this.baseClass = undefined;
        this.namesExcluded = {};
        this.localIdentifiers = {};
        this.classifiableSymbols = {};
        this.excludedIdentifiers = {};
        this.excludedProperties = [];
        this.shortenedIdentifierCount = 0;
        this.id = ContainerIdGenerator.getNextId();
        this.containerFlags = containerFlags;
        if (containerFlags & 2 /* IsBlockScopedContainer */) {
            this.blockScopeContainer = node;
            this.isBlockScope = true;
            // A block scoped container's parent is the parent function scope container.
            this.parent = parentContainer.getParent();
        }
        else {
            // Function scoped container...
            this.container = this.blockScopeContainer = node;
            this.isBlockScope = false;
            // A function scoped container is it's own parent
            this.parent = this;
        }
        // The name generator index starts at 0 for containers 
        this.nameIndex = 0;
    }
    Container.prototype.getId = function () {
        return this.id;
    };
    Container.prototype.addChildContainer = function (container) {
        this.childContainers.push(container);
    };
    Container.prototype.getChildren = function () {
        return this.childContainers;
    };
    Container.prototype.getParent = function () {
        return this.parent;
    };
    Container.prototype.getNameIndex = function () {
        // TJT: This logic needs to be reviewed for applicability to ES6 block scopes
        if (this.isBlockScope) {
            // The name generator index for block scoped containers is obtained from the parent container
            return this.parent.getNameIndex();
        }
        return this.nameIndex++;
    };
    Container.prototype.getNode = function () {
        return this.isBlockScope ? this.blockScopeContainer : this.container;
    };
    Container.prototype.getMembers = function () {
        if (this.container) {
            switch (this.container.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                    return this.container.members;
                case ts.SyntaxKind.EnumDeclaration:
                    return this.container.members;
                default:
                    Logger.trace("Container::getMembers() unprocessed container kind: ", this.container.kind, this.getId());
            }
        }
        return undefined;
    };
    Container.prototype.getLocals = function () {
        if (this.container && this.containerFlags & 32 /* HasLocals */) {
            switch (this.container.kind) {
                case ts.SyntaxKind.ModuleDeclaration:
                    return this.container.locals;
                default:
                    Logger.warn("Container::getLocals() unprocessed container kind: ", this.container.kind, this.getId());
            }
        }
        return undefined;
    };
    Container.prototype.isBlockScoped = function () {
        return this.isBlockScope;
    };
    Container.prototype.isFunctionScoped = function () {
        if (this.containerFlags & (1 /* IsContainer */ | 33 /* IsContainerWithLocals */)) {
            return true;
        }
        return false;
    };
    Container.prototype.setBaseClass = function (baseClass) {
        if (baseClass.flags & ts.SymbolFlags.Class) {
            this.baseClass = baseClass;
        }
    };
    Container.prototype.getBaseClass = function () {
        return this.baseClass;
    };
    Container.prototype.hasChild = function (container) {
        for (var i = 0; i < this.childContainers.length; i++) {
            if (container.getId() === this.childContainers[i].getId())
                return true;
        }
        return false;
    };
    return Container;
}());
var NodeWalker = /** @class */ (function () {
    function NodeWalker() {
    }
    NodeWalker.prototype.walk = function (node) {
        this.visitNode(node);
    };
    NodeWalker.prototype.visitNode = function (node) {
        this.walkChildren(node);
    };
    NodeWalker.prototype.walkChildren = function (node) {
        var _this = this;
        ts.forEachChild(node, function (child) { return _this.visitNode(child); });
    };
    return NodeWalker;
}());
var NameGenerator = /** @class */ (function () {
    function NameGenerator() {
        // Base64 char set: 26 lowercase letters + 26 uppercase letters + '$' + '_' + 10 digits                                          
        this.base64Chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789";
    }
    NameGenerator.prototype.getName = function (index) {
        // 2 and 3 letter reserved words that cannot be used in identifier names
        var RESERVED_KEYWORDS = ["do", "if", "in", "for", "int", "let", "new", "try", "var"];
        var name;
        while (true) {
            name = this.generateName(index++);
            if (RESERVED_KEYWORDS.indexOf(name) > 0) {
                continue;
            }
            else {
                return name;
            }
        }
    };
    NameGenerator.prototype.generateName = function (index) {
        var id = index;
        // The first 54 chars of the base64 char set are used for the first char of the identifier
        var name = this.base64Chars[id % 54];
        id = Math.floor(id / 54);
        while (id > 0) {
            // The full base64 char set is used after the first char of the identifier
            name += this.base64Chars[id % 64];
            id = Math.floor(id / 64);
        }
        return name;
    };
    return NameGenerator;
}());
var Debug;
(function (Debug) {
    function assert(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message;
        }
    }
    Debug.assert = assert;
})(Debug || (Debug = {}));
function format(input) {
    var sourceFile = ts.createSourceFile("file.js", input, ts.ScriptTarget.Latest);
    return prettify.format(sourceFile.getText(), { parser: "typescript" });
}
var BundleMinifier = /** @class */ (function (_super) {
    __extends(BundleMinifier, _super);
    function BundleMinifier(program, compilerOptions, bundleConfig) {
        var _this = _super.call(this) || this;
        _this.containerStack = [];
        _this.classifiableContainers = {};
        _this.allIdentifierInfos = {};
        _this.identifierCount = 0;
        _this.shortenedIdentifierCount = 0;
        _this.program = program;
        _this.checker = program.getTypeChecker();
        _this.compilerOptions = compilerOptions;
        _this.bundleConfig = bundleConfig;
        _this.containerStack = [];
        _this.nameGenerator = new NameGenerator();
        return _this;
    }
    BundleMinifier.prototype.transform = function (bundleSourceFile) {
        this.bundleSourceFile = bundleSourceFile;
        return this.minify(bundleSourceFile);
    };
    BundleMinifier.prototype.removeWhitespace = function (jsContents) {
        // ES6 whitespace rules..
        // Special Cases..
        // break, continue, function: space right if next token is [Expression]
        // return, yield: space if next token is not a semicolon
        // else:
        // Space to left and right of keyword..
        // extends, in, instanceof : space left and right
        // Space to the right of the keyword..
        // case, class, const, delete, do, export, get, import, let, new, set, static, throw, typeof, var, void
        // Space not required..
        // catch, debugger, default, finally, for, if, super, switch, this, try, while, with
        // Notes..
        // export: Not supported yet? For now add space
        // default: When used with export?
        this.whiteSpaceTime = new Date().getTime();
        this.whiteSpaceBefore = jsContents.length;
        var output = "";
        var lastNonTriviaToken = ts.SyntaxKind.Unknown;
        var isTrivia = false;
        var token;
        var scanner = ts.createScanner(ts.ScriptTarget.ES5, /* skipTrivia */ false, ts.LanguageVariant.Standard, jsContents);
        while ((token = scanner.scan()) !== ts.SyntaxKind.EndOfFileToken) {
            isTrivia = false;
            if (Ast.isTrivia(token)) {
                // TJT: Uncomment to add new line trivia to output for testing purposes
                //if ( token === ts.SyntaxKind.NewLineTrivia ) {
                //    output += scanner.getTokenText();
                //}
                isTrivia = true;
            }
            if (!isTrivia) {
                // Process the last non trivia token
                switch (lastNonTriviaToken) {
                    case ts.SyntaxKind.FunctionKeyword:
                        // Space required after function keyword if next token is an identifier
                        if (token === ts.SyntaxKind.Identifier) {
                            output += " ";
                        }
                        break;
                    case ts.SyntaxKind.BreakKeyword:
                    case ts.SyntaxKind.ContinueKeyword:
                    case ts.SyntaxKind.ReturnKeyword:
                    case ts.SyntaxKind.YieldKeyword:
                        // Space not required after return keyword if the current token is a semicolon
                        if (token !== ts.SyntaxKind.SemicolonToken) {
                            output += " ";
                        }
                        break;
                    case ts.SyntaxKind.ElseKeyword:
                        // Space not required after return keyword if the current token is a punctuation
                        if (token !== ts.SyntaxKind.OpenBraceToken) {
                            output += " ";
                        }
                        break;
                }
                // Process the current token..
                switch (token) {
                    // Keywords that require a right space
                    case ts.SyntaxKind.CaseKeyword:
                    case ts.SyntaxKind.ClassKeyword:
                    case ts.SyntaxKind.ConstKeyword:
                    case ts.SyntaxKind.DeleteKeyword:
                    case ts.SyntaxKind.DoKeyword:
                    case ts.SyntaxKind.ExportKeyword: // TJT: Add a space just to be sure right now 
                    case ts.SyntaxKind.GetKeyword:
                    case ts.SyntaxKind.ImportKeyword:
                    case ts.SyntaxKind.LetKeyword:
                    case ts.SyntaxKind.NewKeyword:
                    case ts.SyntaxKind.SetKeyword:
                    case ts.SyntaxKind.StaticKeyword:
                    case ts.SyntaxKind.ThrowKeyword:
                    case ts.SyntaxKind.TypeOfKeyword:
                    case ts.SyntaxKind.VarKeyword:
                    case ts.SyntaxKind.VoidKeyword:
                        output += scanner.getTokenText() + " ";
                        break;
                    // Keywords that require space left and right..
                    case ts.SyntaxKind.ExtendsKeyword:
                    case ts.SyntaxKind.InKeyword:
                    case ts.SyntaxKind.InstanceOfKeyword:
                        output += " " + scanner.getTokenText() + " ";
                        break;
                    // Avoid concatenations of ++, + and --, - operators
                    case ts.SyntaxKind.PlusToken:
                    case ts.SyntaxKind.PlusPlusToken:
                        if ((lastNonTriviaToken === ts.SyntaxKind.PlusToken) ||
                            (lastNonTriviaToken === ts.SyntaxKind.PlusPlusToken)) {
                            output += " ";
                        }
                        output += scanner.getTokenText();
                        break;
                    case ts.SyntaxKind.MinusToken:
                    case ts.SyntaxKind.MinusMinusToken:
                        if ((lastNonTriviaToken === ts.SyntaxKind.MinusToken) ||
                            (lastNonTriviaToken === ts.SyntaxKind.MinusMinusToken)) {
                            output += " ";
                        }
                        output += scanner.getTokenText();
                        break;
                    default:
                        // All other tokens can be output. Keywords that do not require whitespace.
                        output += scanner.getTokenText();
                        break;
                }
            }
            if (!isTrivia) {
                lastNonTriviaToken = token;
            }
        }
        this.whiteSpaceAfter = output.length;
        this.whiteSpaceTime = new Date().getTime() - this.whiteSpaceTime;
        if (this.compilerOptions.diagnostics)
            this.reportWhitespaceStatistics();
        return output;
    };
    BundleMinifier.prototype.visitNode = function (node) {
        // Traverse nodes to build containers and process all identifiers nodes.
        if (this.isNextContainer(node)) {
            _super.prototype.visitNode.call(this, node);
            this.restoreContainer();
        }
        else {
            switch (node.kind) {
                case ts.SyntaxKind.Identifier:
                    Logger.info("Identifier node walked in container id: ", this.currentContainer().getId());
                    var tmpContainer = this.currentContainer();
                    var identifier = node;
                    var identifierSymbol = this.checker.getSymbolAtLocation(identifier);
                    // The identifierSymbol may be null when an identifier is accessed within a function that
                    // has been assigned to the prototype property of an object. We check for this here.
                    if (!identifierSymbol) {
                        identifierSymbol = this.getSymbolFromPrototypeFunction(identifier);
                    }
                    if (identifierSymbol) {
                        var identifierUID = Ast.getIdentifierUID(identifierSymbol);
                        if (identifierUID === undefined) {
                            if (identifierSymbol.flags & ts.SymbolFlags.Transient) {
                                // TJT: Can we ignore all transient symbols?
                                Logger.trace("Ignoring transient symbol: ", identifierSymbol.name);
                                break;
                            }
                            else {
                                identifierUID = ts.getSymbolId(identifierSymbol).toString();
                                Logger.trace("Generated symbol id for: ", identifierSymbol.name, identifierUID);
                            }
                        }
                        // Check to see if we've seen this identifer symbol before
                        if (Utils.hasProperty(this.allIdentifierInfos, identifierUID)) {
                            Logger.info("Identifier already added: ", identifierSymbol.name, identifierUID);
                            // If we have, then add it to the identifier info references 
                            var prevAddedIdentifier = this.allIdentifierInfos[identifierUID];
                            this.allIdentifierInfos[identifierUID].addRef(identifier, this.currentContainer());
                            // If the previously added identifier is not in the current container's local identifier table then
                            // it must be excluded so that it's shortened name will not be used in this container.
                            if (!Utils.hasProperty(this.currentContainer().localIdentifiers, identifierUID)) {
                                this.currentContainer().excludedIdentifiers[identifierUID] = prevAddedIdentifier;
                            }
                        }
                        else {
                            var identifierInfo = new IdentifierInfo(identifier, identifierSymbol, this.currentContainer());
                            Logger.info("Adding new identifier: ", identifierInfo.getName(), identifierInfo.getId());
                            // Add the new identifier info to both the container and the all list
                            this.currentContainer().localIdentifiers[identifierUID] = identifierInfo;
                            this.allIdentifierInfos[identifierUID] = identifierInfo;
                            // We can't shorten identifier names that are 1 character in length AND
                            // we can't risk the chance that an identifier name will be replaced with a 2 char
                            // shortened name due to the constraint that the names are changed in place
                            var identifierName = identifierSymbol.getName();
                            if (identifierName.length === 1) {
                                identifierInfo.shortenedName = identifierName;
                                this.currentContainer().excludedIdentifiers[identifierUID] = identifierInfo;
                            }
                            this.identifierCount++;
                        }
                    }
                    else {
                        Logger.warn("Identifier does not have a symbol: ", identifier.text);
                    }
                    break;
            }
            _super.prototype.visitNode.call(this, node);
        }
    };
    BundleMinifier.prototype.getSymbolFromPrototypeFunction = function (identifier) {
        var containerNode = this.currentContainer().getNode();
        if (containerNode.kind === ts.SyntaxKind.FunctionExpression) {
            if (Ast.isPrototypeAccessAssignment(containerNode.parent)) {
                // Get the 'x' of 'x.prototype.y = f' (here, 'f' is 'container')
                var className = containerNode.parent // x.prototype.y = f
                    .left // x.prototype.y
                    .expression // x.prototype
                    .expression; // x
                var classSymbol = this.checker.getSymbolAtLocation(className);
                if (classSymbol && classSymbol.members) {
                    if (classSymbol.members.has(identifier.escapedText)) {
                        Logger.info("Symbol obtained from prototype function: ", identifier.text);
                        return classSymbol.members.get(identifier.escapedText);
                    }
                }
                return undefined;
            }
        }
        return undefined;
    };
    BundleMinifier.prototype.minify = function (sourceFile) {
        this.transformTime = new Date().getTime();
        // Walk the sourceFile to build containers and the identifiers within. 
        this.walk(sourceFile);
        this.shortenIdentifiers();
        var minifiedSourceFile = ts.createSourceFile(sourceFile.fileName, sourceFile.text, this.compilerOptions.target);
        this.transformTime = new Date().getTime() - this.transformTime;
        if (this.compilerOptions.diagnostics)
            this.reportMinifyStatistics();
        return minifiedSourceFile;
    };
    BundleMinifier.prototype.shortenIdentifiers = function () {
        // NOTE: Once identifier names are shortened, the typescript checker cannot be used. 
        // We first need to process all the class containers to determine which properties cannot be shortened 
        // ( public, abstract, implements, extends ).
        for (var classContainerKey in this.classifiableContainers) {
            var classContainer = this.classifiableContainers[classContainerKey];
            var abstractProperties = [];
            var heritageProperties = [];
            var implementsProperties = [];
            var extendsClause = Ast.getExtendsClause(classContainer.getNode());
            if (extendsClause) {
                // Check for abstract properties...
                // TODO: Abstract properties are currently not shortened, but they could possibly be.
                //       The child class that implements a parent class property would need to have the same shortened name.
                abstractProperties = Ast.getClassAbstractProperties(extendsClause, this.checker);
            }
            var implementsClause = Ast.getImplementsClause(classContainer.getNode());
            if (implementsClause) {
                implementsProperties = Ast.getImplementsProperties(implementsClause, this.checker);
            }
            heritageProperties = Ast.getClassHeritageProperties(classContainer.getNode(), this.checker);
            // Join the abstract and implements properties
            var excludedProperties = heritageProperties.concat(abstractProperties, implementsProperties);
            Logger.trace("Class excluded properties for: ", classContainer.getNode().name.text, excludedProperties.length, classContainer.getId());
            classContainer.excludedProperties = excludedProperties;
        }
        // Recursively process the container identifiers starting at the source file container...
        this.shortenContainerIdentifiers(this.sourceFileContainer);
    };
    BundleMinifier.prototype.shortenContainerIdentifiers = function (container) {
        // If this container extends a base/parent class then we must make sure we have processed the base/parent class members
        var baseClass = container.getBaseClass();
        if (baseClass) {
            // We need to get the container for the parent/base class
            var baseClassContainer = this.classifiableContainers[baseClass.name];
            if (baseClassContainer) {
                var baseClassMembers = baseClassContainer.getMembers();
                if (baseClassMembers) {
                    this.processClassMembers(baseClassMembers, baseClassContainer);
                    // The base class container excludedProperties array must also be excluded in the current derived class
                    container.excludedProperties = container.excludedProperties.concat(baseClassContainer.excludedProperties);
                }
            }
        }
        // Determine the names which cannot be used as shortened names in this container.
        this.excludeNames(container);
        // Process container members..
        var containerClassMembers = container.getMembers();
        if (containerClassMembers) {
            this.processClassMembers(containerClassMembers, container);
        }
        // Process container locals..
        var containerLocals = container.getLocals();
        if (containerLocals) {
            this.processContainerLocals(containerLocals, container);
        }
        // Process the containers identifiers...
        for (var identifierTableKey in container.localIdentifiers) {
            var identifierInfo = container.localIdentifiers[identifierTableKey];
            this.processIdentifierInfo(identifierInfo, container);
        }
        // Process the containers classifiables...
        // TJT: Review..
        for (var classifiableKey in container.classifiableSymbols) {
            var classSymbol = container.classifiableSymbols[classifiableKey];
            var classSymbolUId = Ast.getIdentifierUID(classSymbol);
            var classIdentifierInfo = this.allIdentifierInfos[classSymbolUId];
            this.processIdentifierInfo(classIdentifierInfo, container);
        }
        // Recursively go through container children in order added
        var containerChildren = container.getChildren();
        for (var j = 0; j < containerChildren.length; j++) {
            this.shortenContainerIdentifiers(containerChildren[j]);
        }
    };
    BundleMinifier.prototype.processIdentifierInfo = function (identifierInfo, container) {
        var _this = this;
        if (this.canShortenIdentifier(identifierInfo)) {
            var shortenedName_1 = this.getShortenedIdentifierName(container, identifierInfo);
            Logger.trace("Identifier shortened: ", identifierInfo.getName(), shortenedName_1);
            // Add the shortened name to the excluded names in each container that this identifier was found in.
            var containerRefs = identifierInfo.getContainers();
            for (var containerKey in containerRefs) {
                var containerRef = containerRefs[containerKey];
                containerRef.namesExcluded[shortenedName_1] = true;
            }
            if (!identifierInfo.isMinified) {
                // Change all referenced identifier nodes to the shortened name
                Utils.forEach(identifierInfo.getIdentifiers(), function (identifier) {
                    _this.setIdentifierText(identifier, shortenedName_1);
                });
                identifierInfo.isMinified = true;
            }
            return;
        }
    };
    BundleMinifier.prototype.canShortenIdentifier = function (identifierInfo) {
        if (identifierInfo.isBlockScopedVariable() ||
            identifierInfo.isFunctionScopedVariable() ||
            identifierInfo.isInternalClass() ||
            identifierInfo.isInternalInterface() ||
            identifierInfo.isPrivateMethod() ||
            identifierInfo.isPrivateProperty() ||
            identifierInfo.isInternalFunction(this.bundleConfig.package.getPackageNamespace()) ||
            identifierInfo.isParameter() ||
            identifierInfo.isNamespaceImportAlias()) {
            Logger.trace("Identifier CAN be shortened: ", identifierInfo.getName());
            return true;
        }
        Logger.trace("Identifier CANNOT be shortened: ", identifierInfo.getName());
        return false;
    };
    BundleMinifier.prototype.getShortenedIdentifierName = function (container, identifierInfo) {
        // Identifier names are shortened in place. They must be the same length or smaller than the original name.
        if (!identifierInfo.shortenedName) {
            var identifierName = identifierInfo.getName();
            if (identifierName.length === 1) {
                // Just reuse the original name for 1 char names
                identifierInfo.shortenedName = identifierName;
            }
            else {
                // Loop until we have a valid shortened name
                // The shortened name MUST be the same length or less
                while (true) {
                    var shortenedName = this.nameGenerator.getName(container.getNameIndex());
                    Debug.assert(shortenedName.length <= identifierName.length);
                    if (!Utils.hasProperty(container.namesExcluded, shortenedName)) {
                        identifierInfo.shortenedName = shortenedName;
                        break;
                    }
                    else {
                        Logger.trace("Generated name was excluded: ", shortenedName, identifierName);
                    }
                }
                this.shortenedIdentifierCount++;
            }
        }
        else {
            Logger.trace("Identifier already has shortened name: ", identifierInfo.getName(), identifierInfo.shortenedName);
        }
        Logger.info("Identifier shortened name: ", identifierInfo.getName(), identifierInfo.shortenedName);
        return identifierInfo.shortenedName;
    };
    BundleMinifier.prototype.setIdentifierText = function (identifier, text) {
        var identifierLength = identifier.text.length;
        var bufferLength = (identifier.end - identifier.pos);
        // Check to see if there is leading trivia
        var triviaOffset = identifier.getLeadingTriviaWidth();
        // Find the start of the identifier text within the identifier character array
        for (var identifierStart = identifier.pos + triviaOffset; identifierStart < identifier.pos + bufferLength; identifierStart++) {
            if (this.bundleSourceFile.text[identifierStart] === identifier.text[0])
                break;
        }
        // Replace the identifier text within the bundle source file
        identifier.end = identifierStart + text.length;
        for (var i = 0; i < identifierLength; i++) {
            var replaceChar = " ";
            if (i < text.length) {
                replaceChar = text[i];
            }
            this.bundleSourceFile.text = Utils.replaceAt(this.bundleSourceFile.text, identifierStart + i, replaceChar);
        }
    };
    BundleMinifier.prototype.processContainerLocals = function (locals, container) {
        var _this = this;
        locals.forEach(function (local) {
            var localSymbolUId = Ast.getIdentifierUID(local.declarations[0].symbol);
            if (localSymbolUId) {
                var localIdentifierInfo = _this.allIdentifierInfos[localSymbolUId];
                _this.processIdentifierInfo(localIdentifierInfo, container);
            }
            else {
                Logger.warn("Container local does not have a UId");
            }
        });
    };
    BundleMinifier.prototype.processClassMembers = function (members, container) {
        for (var memberKey in members) {
            var member = members[memberKey];
            var memberSymbol = member.symbol;
            if (memberSymbol) {
                var memberSymbolUId = Ast.getIdentifierUID(memberSymbol);
                if (memberSymbolUId) {
                    var memberIdentifierInfo = this.allIdentifierInfos[memberSymbolUId];
                    var isExcludedProperty = false;
                    for (var excludedPropertyKey in container.excludedProperties) {
                        var memberIdentifierSymbol = memberIdentifierInfo.getSymbol();
                        var excludedPropertySymbol = container.excludedProperties[excludedPropertyKey];
                        // TJT: Review - How to determine equality here. For now just use name which seems pretty naive.
                        if (memberIdentifierSymbol.name === excludedPropertySymbol.name) {
                            isExcludedProperty = true;
                            memberIdentifierInfo.shortenedName = memberIdentifierInfo.getName();
                            break;
                        }
                    }
                    if (!isExcludedProperty) {
                        this.processIdentifierInfo(memberIdentifierInfo, container);
                    }
                }
                else {
                    Logger.warn("Container member does not have a UId");
                }
            }
            else {
                Logger.warn("Container member does not have a symbol.");
            }
        }
    };
    BundleMinifier.prototype.excludeNames = function (container) {
        // Determine identifier names which cannot be used in this container.
        // If this container extends a base/parent class then we exclude the base class member names.
        var baseClass = container.getBaseClass();
        if (baseClass) {
            // We need to get the container for the parent/base class
            var baseClassContainer = this.classifiableContainers[baseClass.name];
            if (baseClassContainer) {
                var baseClassMembers = baseClassContainer.getMembers();
                if (baseClassMembers) {
                    // The base class members shortened names must be excluded from this child class
                    for (var memberKey in baseClassMembers) {
                        var member = baseClassMembers[memberKey];
                        var memberSymbol = member.symbol;
                        var memberSymbolUId = Ast.getIdentifierUID(memberSymbol);
                        var excludedIdentifier = this.allIdentifierInfos[memberSymbolUId];
                        if (excludedIdentifier && excludedIdentifier.shortenedName) {
                            container.namesExcluded[excludedIdentifier.shortenedName] = true;
                        }
                    }
                }
            }
        }
        for (var identifierInfoKey in container.localIdentifiers) {
            var identifierInfo = container.localIdentifiers[identifierInfoKey];
            this.excludeNamesForIdentifier(identifierInfo, container);
        }
        for (var classifiableKey in container.classifiableSymbols) {
            var classSymbol = container.classifiableSymbols[classifiableKey];
            var classSymbolUId = Ast.getIdentifierUID(classSymbol);
            var classIdentifierInfo = this.allIdentifierInfos[classSymbolUId];
            Debug.assert(classIdentifierInfo !== undefined, "Container classifiable identifier symbol not found.");
            this.excludeNamesForIdentifier(classIdentifierInfo, container);
        }
    };
    BundleMinifier.prototype.getContainerExcludedIdentifiers = function (container) {
        // Recursively walk the container chain to find shortened identifier names that we cannot use in this container.
        var target = this.compilerOptions.target;
        var excludes = {};
        function getContainerExcludes(container) {
            // Recursively process the container block scoped children..
            var containerChildren = container.getChildren();
            for (var i = 0; i < containerChildren.length; i++) {
                var childContainer = containerChildren[i];
                //if ( childContainer.isBlockScoped() ) {
                getContainerExcludes(childContainer);
                //}
            }
            // Get the excluded identifiers in this block scoped container..
            for (var excludedIdentifierKey in container.excludedIdentifiers) {
                var excludedIdentifier = container.excludedIdentifiers[excludedIdentifierKey];
                // For function scoped identifiers we must exclude the identifier from the current container parent.
                // Note that for ES5, which doesn't have block scoped variables, we must also exclude the identifier.
                if ((!excludedIdentifier.isBlockScopedVariable) || (target === ts.ScriptTarget.ES5)) {
                    if (!Utils.hasProperty(excludes, excludedIdentifier.getId())) {
                        excludes[excludedIdentifier.getId()] = excludedIdentifier;
                    }
                }
            }
        }
        // Start the search for excluded identifiers from the container's parent - the parent function scope container.
        getContainerExcludes(container.getParent());
        return excludes;
    };
    BundleMinifier.prototype.excludeNamesForIdentifier = function (identifierInfo, container) {
        // Exclude all shortened names that have already been used in child containers that this identifer is contained in.
        var identifierContainers = identifierInfo.getContainers();
        // For each container that the identifier is contained in..
        for (var containerKey in identifierContainers) {
            var identifierContainer = identifierContainers[containerKey];
            var containerExcludes = this.getContainerExcludedIdentifiers(identifierContainer);
            // We can't use any names that have already been used in this referenced container
            for (var excludedIdentifierKey in containerExcludes) {
                var excludedIdentifier = containerExcludes[excludedIdentifierKey];
                if (excludedIdentifier.shortenedName) {
                    container.namesExcluded[excludedIdentifier.shortenedName] = true;
                }
            }
        }
    };
    BundleMinifier.prototype.currentContainer = function () {
        return this.containerStack[this.containerStack.length - 1];
    };
    BundleMinifier.prototype.restoreContainer = function () {
        return this.containerStack.pop();
    };
    BundleMinifier.prototype.isNextContainer = function (node) {
        var containerFlags = Ast.getContainerFlags(node);
        if (containerFlags & (1 /* IsContainer */ | 2 /* IsBlockScopedContainer */)) {
            var nextContainer = new Container(node, containerFlags, this.currentContainer());
            // Check if the container symbol is classifiable. If so save it for inheritance processing.
            var containerSymbol = node.symbol;
            if (containerSymbol && (containerSymbol.flags & ts.SymbolFlags.Class)) {
                var containerSymbolUId = Ast.getIdentifierUID(containerSymbol);
                // Save the class symbol into the current container ( its parent )
                if (!Utils.hasProperty(this.currentContainer().classifiableSymbols, containerSymbolUId)) {
                    this.currentContainer().classifiableSymbols[containerSymbolUId] = containerSymbol;
                }
                // Save to the all classifiable containers table. See NOTE Inheritance below.
                if (!Utils.hasProperty(this.classifiableContainers, containerSymbol.name)) {
                    this.classifiableContainers[containerSymbol.name] = nextContainer;
                }
                // Check for inheritance. We need to do this now because the checker cannot be used once names are shortened.
                var extendsClause = Ast.getExtendsClause(node);
                if (extendsClause) {
                    var baseClassSymbol = this.checker.getSymbolAtLocation(extendsClause.types[0].expression);
                    // NOTE Inheritance:
                    // If this child class is declared before the parent base class then the base class symbol will have symbolFlags.Merged.
                    // When the base class is declared it will have a different symbol id from the symbol id determined here.
                    // We should be able to use the symbol name for lookups in the classifiable containers table.
                    // let baseClassAlias = this.checker.getAliasedSymbol(baseClassSymbol);
                    nextContainer.setBaseClass(baseClassSymbol);
                }
            }
            // Before changing the current container we must first add the new container to the children of the current container.
            var currentContainer = this.currentContainer();
            // If we don't have a container yet then it is the source file container ( the first ).
            if (!currentContainer) {
                this.sourceFileContainer = nextContainer;
            }
            else {
                // Add new container context to the exising current container
                currentContainer.addChildContainer(nextContainer);
            }
            this.containerStack.push(nextContainer);
            Logger.info("Next container id: ", nextContainer.getId(), nextContainer.getParent().getId());
            return true;
        }
        return false;
    };
    BundleMinifier.prototype.reportWhitespaceStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTime("Whitespace time", this.whiteSpaceTime);
        statisticsReporter.reportPercentage("Whitespace reduction", ((this.whiteSpaceBefore - this.whiteSpaceAfter) / this.whiteSpaceBefore) * 100.00);
    };
    BundleMinifier.prototype.reportMinifyStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTime("Minify time", this.transformTime);
        statisticsReporter.reportCount("Total identifiers", this.identifierCount);
        statisticsReporter.reportCount("Identifiers shortened", this.shortenedIdentifierCount);
    };
    BundleMinifier.prototype.prettify = function (input) {
        return format(input);
    };
    return BundleMinifier;
}(NodeWalker));
var DiagnosticsReporter = /** @class */ (function () {
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
}());
var ProjectBuildContext = /** @class */ (function () {
    function ProjectBuildContext(host, config, program) {
        this.host = host;
        this.setProgram(program);
        this.config = config;
    }
    ProjectBuildContext.prototype.getProgram = function () {
        return this.program;
    };
    ProjectBuildContext.prototype.setProgram = function (program) {
        // Update the host with the new program
        //this.host.setReuseableProgram( program );
        this.program = program;
    };
    return ProjectBuildContext;
}());
var BundleBuilder = /** @class */ (function () {
    function BundleBuilder(compilerHost, program) {
        this.dependencyTime = 0;
        this.dependencyWalkTime = 0;
        this.emitTime = 0;
        this.buildTime = 0;
        this.bundleCodeText = "";
        this.bundleImportText = "";
        //private tets: Map<string,ts.Node[]>;
        this.bundleImportedFiles = {};
        this.bundleModuleImports = {};
        this.bundleSourceFiles = {};
        this.compilerHost = compilerHost;
        this.program = program;
    }
    BundleBuilder.prototype.build = function (bundle) {
        var _this = this;
        this.bundle = bundle;
        this.buildTime = new Date().getTime();
        var dependencyBuilder = new DependencyBuilder(this.compilerHost, this.program);
        // Construct bundle output file name
        var bundleBaseDir = path.dirname(bundle.name);
        if (bundle.config.outDir) {
            bundleBaseDir = path.join(bundleBaseDir, bundle.config.outDir);
        }
        var bundleFilePath = path.join(bundleBaseDir, path.basename(bundle.name));
        bundleFilePath = TsCore.normalizeSlashes(bundleFilePath);
        this.bundleCodeText = "";
        this.bundleImportText = "";
        this.bundleImportedFiles = {};
        this.bundleModuleImports = {};
        this.bundleSourceFiles = {};
        // Look for tsx source files in bundle name or bundle dependencies.
        // Output tsx for bundle extension if typescript react files found.
        var isBundleTsx = false;
        var allDependencies = {};
        var _loop_1 = function () {
            var fileName = bundle.fileNames[filesKey];
            Logger.info(">>> Processing bundle file:", fileName);
            var bundleSourceFileName = this_1.compilerHost.getCanonicalFileName(TsCore.normalizeSlashes(fileName));
            Logger.info("BundleSourceFileName:", bundleSourceFileName);
            var bundleSourceFile = this_1.program.getSourceFile(bundleSourceFileName);
            if (!bundleSourceFile) {
                var diagnostic = TsCore.createDiagnostic({ code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle_source_file_0_not_found_6060", message: "Bundle source file '{0}' not found." }, bundleSourceFileName);
                return { value: new BundleResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, [diagnostic]) };
            }
            // Check for TSX
            if (bundleSourceFile.languageVariant == ts.LanguageVariant.JSX) {
                isBundleTsx = true;
            }
            var startTime = new Date().getTime();
            // Get bundle source file module dependencies...
            var moduleDependencies = dependencyBuilder.getSourceFileDependencies(bundleSourceFile);
            this_1.dependencyTime += new Date().getTime() - startTime;
            // Merge current bundle file dependencies into all dependencies
            for (var mergeKey in moduleDependencies) {
                if (!Utils.hasProperty(allDependencies, mergeKey)) {
                    allDependencies[mergeKey] = moduleDependencies[mergeKey];
                }
            }
            startTime = new Date().getTime();
            Logger.info("Traversing module dependencies for bundle: ", bundleSourceFile.fileName);
            for (var moduleFileName in moduleDependencies) {
                Logger.info("Walking dependency nodes for module: ", moduleFileName);
                moduleDependencyNodes = moduleDependencies[moduleFileName];
                moduleDependencyNodes.forEach(function (moduleDependencyNode) {
                    // Obtain the source file from the dependency node ( usually an import statement )
                    // REVIEW: Combine these.
                    var dependencySymbol = _this.getSymbolFromNode(moduleDependencyNode);
                    var dependencyFile = TsCore.getSourceFileFromSymbol(dependencySymbol);
                    if (dependencyFile && !dependencyFile.isDeclarationFile) {
                        var dependencyFileName = _this.compilerHost.getCanonicalFileName(dependencyFile.fileName);
                        var dependencyNodes = moduleDependencies[dependencyFileName];
                        if (dependencyNodes) {
                            _this.processModuleDependencies(moduleDependencyNode, dependencyNodes);
                        }
                        if (!Utils.hasProperty(_this.bundleImportedFiles, dependencyFileName)) {
                            _this.addSourceFile(dependencyFile);
                        }
                    }
                    else {
                        if (moduleDependencyNode.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
                            // For ImportEqualsDeclarations we emit the import declaration
                            // if it hasn't already been added to the bundle.
                            // Get the import and module names
                            var importName = moduleDependencyNode.name.text;
                            var moduleName = _this.getImportModuleName(moduleDependencyNode);
                            if (_this.addModuleImport(moduleName, importName)) {
                                _this.emitModuleImportDeclaration(moduleDependencyNode.getText());
                            }
                        }
                        else {
                            // ImportDeclaration kind..
                            if (moduleDependencyNode.kind === ts.SyntaxKind.ImportDeclaration) {
                                _this.writeImportDeclaration(moduleDependencyNode);
                            }
                        }
                    }
                });
            }
            // Finally, add bundle source file
            this_1.addSourceFile(bundleSourceFile);
            this_1.dependencyWalkTime += new Date().getTime() - startTime;
        };
        var this_1 = this, moduleDependencyNodes;
        for (var filesKey in bundle.fileNames) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object")
                return state_1.value;
        }
        // The text for our bundle is the concatenation of import statements and source code
        var bundleText = this.bundleImportText;
        if (bundle.config.package.getPackageType() === 1 /* Library */) {
            // Wrap the bundle in an exported namespace with the bundle name
            bundleText += "export namespace " + bundle.config.package.getPackageNamespace() + " {\r\n";
            bundleText += this.bundleCodeText;
            bundleText += " \r\n}";
        }
        else {
            bundleText += this.bundleCodeText;
        }
        var bundleExtension = isBundleTsx ? ".tsx" : ".ts";
        var bundleFile = { path: bundleFilePath + bundleExtension, extension: bundleExtension, text: bundleText };
        this.buildTime = new Date().getTime() - this.buildTime;
        if (this.program.getCompilerOptions().diagnostics) {
            this.reportStatistics();
        }
        return new BundleResult(ts.ExitStatus.Success, undefined, bundleFile);
    };
    BundleBuilder.prototype.processModuleDependencies = function (moduleDependencyNode, dependencyNodes) {
        for (var _i = 0, dependencyNodes_1 = dependencyNodes; _i < dependencyNodes_1.length; _i++) {
            var dependencyNode = dependencyNodes_1[_i];
            var dependencySymbol = this.getSymbolFromNode(dependencyNode);
            var dependencyFile = TsCore.getSourceFileFromSymbol(dependencySymbol);
            if (dependencyFile && !dependencyFile.isDeclarationFile) {
                var dependencyFileName = this.compilerHost.getCanonicalFileName(dependencyFile.fileName);
                if (dependencyNode.kind === ts.SyntaxKind.ImportDeclaration) {
                    var dependencyBindings = this.getNamedBindingsFromImport(dependencyNode);
                    if (dependencyBindings && this.isInheritedBinding(moduleDependencyNode, dependencyBindings)) {
                        // Add the dependency file to the bundle now if it is required for inheritance. 
                        if (!Utils.hasProperty(this.bundleImportedFiles, dependencyFileName)) {
                            this.addSourceFile(dependencyFile);
                        }
                    }
                }
            }
        }
    };
    BundleBuilder.prototype.isInheritedBinding = function (dependencyNode, namedBindings) {
        var dependencySymbol = this.getSymbolFromNode(dependencyNode);
        var intrinsicTypes = (ts.TypeFlags.Any | ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral | ts.TypeFlags.ESSymbol | ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Never | ts.TypeFlags.NonPrimitive);
        var checker = this.program.getTypeChecker();
        var exports = checker.getExportsOfModule(dependencySymbol);
        for (var _i = 0, exports_1 = exports; _i < exports_1.length; _i++) {
            var exportedSymbol = exports_1[_i];
            // We need to check for intrinsic types as Typescript checker.getBaseTypes() chokes on intrinsics            
            var exportType = checker.getDeclaredTypeOfSymbol(exportedSymbol);
            if (exportType.flags & intrinsicTypes) {
                continue;
            }
            var baseTypes = checker.getBaseTypes(exportType);
            for (var _a = 0, baseTypes_1 = baseTypes; _a < baseTypes_1.length; _a++) {
                var baseType = baseTypes_1[_a];
                var baseTypeName = baseType.symbol.getName();
                if (namedBindings.indexOf(baseTypeName) >= 0) {
                    Logger.info("Base class inheritance found", baseTypeName);
                    return true;
                }
            }
        }
        return false;
    };
    BundleBuilder.prototype.getImportModuleName = function (node) {
        if (node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference) {
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
            if (node.importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
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
    BundleBuilder.prototype.processImportExports = function (file) {
        var _this = this;
        Logger.info("Processing import statements and export declarations in file: ", file.fileName);
        var editText = file.text;
        ts.forEachChild(file, function (node) {
            if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
                Logger.info("processImportStatements() found import");
                var moduleNameExpression = TsCore.getExternalModuleName(node);
                if (moduleNameExpression && moduleNameExpression.kind === ts.SyntaxKind.StringLiteral) {
                    var moduleSymbol = _this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpression);
                    if ((moduleSymbol) && (_this.isSourceCodeModule(moduleSymbol) || _this.isAmbientModule)) {
                        Logger.info("processImportStatements() removing code module symbol.");
                        editText = _this.whiteOut(node.pos, node.end, editText);
                    }
                }
            }
            else {
                // TJT - Review this...
                if (_this.bundle.config.package.getPackageType() === 2 /* Component */) {
                    if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
                        var module_1 = node;
                        if (module_1.name.getText() !== _this.bundle.config.package.getPackageNamespace()) {
                            if (Ast.getSyntacticModifierFlagsNoCache(module_1) & ts.ModifierFlags.Export) {
                                Logger.info("Component namespace not package namespace. Removing export modifier.");
                                var nodeModifier = module_1.modifiers[0];
                                editText = _this.whiteOut(nodeModifier.pos, nodeModifier.end, editText);
                            }
                        }
                    }
                    else {
                        if (Ast.getSyntacticModifierFlagsNoCache(node) & ts.ModifierFlags.Export) {
                            var exportModifier = node.modifiers[0];
                            editText = _this.whiteOut(exportModifier.pos, exportModifier.end, editText);
                        }
                    }
                }
            }
        });
        return editText;
    };
    BundleBuilder.prototype.whiteOut = function (pos, end, text) {
        var length = end - pos;
        var whiteSpace = "";
        for (var i = 0; i < length; i++) {
            whiteSpace += " ";
        }
        var prefix = text.substring(0, pos);
        var suffix = text.substring(end);
        return prefix + whiteSpace + suffix;
    };
    BundleBuilder.prototype.emitModuleImportDeclaration = function (moduleBlockText) {
        Logger.info("Entering emitModuleImportDeclaration()");
        this.bundleImportText += moduleBlockText + "\n";
    };
    BundleBuilder.prototype.addSourceFile = function (file) {
        Logger.info("Entering addSourceFile() with: ", file.fileName);
        if (this.isSourceCodeFile(file)) {
            // Before adding the source text, we must white out non-external import statements and
            // white out export modifiers where applicable
            var editText = this.processImportExports(file);
            this.bundleCodeText += editText + "\n";
            var sourceFileName = this.compilerHost.getCanonicalFileName(file.fileName);
            this.bundleImportedFiles[sourceFileName] = sourceFileName;
        }
        else {
            // Add typescript definition files to the build source files context
            if (!Utils.hasProperty(this.bundleSourceFiles, file.fileName)) {
                Logger.info("Adding definition file to bundle source context: ", file.fileName);
                this.bundleSourceFiles[file.fileName] = file.text;
            }
        }
    };
    BundleBuilder.prototype.isSourceCodeFile = function (file) {
        return (file.kind === ts.SyntaxKind.SourceFile && !file.isDeclarationFile);
    };
    BundleBuilder.prototype.isSourceCodeModule = function (importSymbol) {
        var declaration = importSymbol.getDeclarations()[0];
        return ((declaration.kind === ts.SyntaxKind.SourceFile) && !(declaration.isDeclarationFile));
    };
    BundleBuilder.prototype.isAmbientModule = function (symbol) {
        var declarations = symbol.getDeclarations();
        if (declarations && declarations.length > 0) {
            var declaration = symbol.getDeclarations()[0];
            if (declaration.kind === ts.SyntaxKind.ModuleDeclaration) {
                if (declaration.modifiers) {
                    for (var _i = 0, _a = declaration.modifiers; _i < _a.length; _i++) {
                        var modifier = _a[_i];
                        if (modifier.kind === ts.SyntaxKind.DeclareKeyword) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };
    // TJT: Review duplicate code. Move to TsCore pass program as arg.
    BundleBuilder.prototype.getSymbolFromNode = function (node) {
        var moduleNameExpr = TsCore.getExternalModuleName(node);
        if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
            return this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
        }
        // TJT: Throw?
        return undefined;
    };
    BundleBuilder.prototype.getNamedBindingsFromImport = function (node) {
        var bindingNames = [];
        if ((node.kind === ts.SyntaxKind.ImportDeclaration) && node.importClause.namedBindings) {
            var namedBindings = node.importClause.namedBindings;
            switch (namedBindings.kind) {
                case ts.SyntaxKind.NamespaceImport:
                    break;
                case ts.SyntaxKind.NamedImports:
                    for (var _i = 0, _a = namedBindings.elements; _i < _a.length; _i++) {
                        var importBinding = _a[_i];
                        bindingNames.push(importBinding.getText());
                    }
                    break;
            }
        }
        return bindingNames;
    };
    BundleBuilder.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTime("Deps gen time", this.dependencyTime);
        statisticsReporter.reportTime("Deps walk time", this.dependencyWalkTime);
        statisticsReporter.reportTime("Source gen time", this.buildTime);
    };
    return BundleBuilder;
}());
var BundleCompiler = /** @class */ (function () {
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
        Logger.log("Compiling bundle...");
        this.compileTime = this.preEmitTime = new Date().getTime();
        // Bundle data
        var bundleFileName;
        var bundleFileText;
        var bundleSourceFile;
        // The list of bundle files to pass to program 
        // TJT: Shouldn't there only be 1 module after bundling!
        var bundleFiles = [];
        var outputText = {};
        var defaultGetSourceFile;
        var minifyBundle = bundleConfig.minify || false;
        if (minifyBundle) {
            // Create the minified bundle fileName
            var bundleDir_1 = path.dirname(bundleFile.path);
            var bundleName_1 = path.basename(bundleFile.path, bundleFile.extension);
            bundleFileName = TsCore.normalizeSlashes(path.join(bundleDir_1, bundleName_1 + ".min.ts"));
        }
        else {
            bundleFileName = bundleFile.path;
        }
        bundleFiles.push(bundleFileName);
        bundleFileText = bundleFile.text;
        this.bundleSourceFiles[bundleFileName] = bundleFileText;
        bundleSourceFile = ts.createSourceFile(bundleFileName, bundleFile.text, this.compilerOptions.target);
        function writeFile(fileName, data, writeByteOrderMark, onError) {
            outputText[fileName] = data;
        }
        function getSourceFile(fileName, languageVersion, onError) {
            if (fileName === bundleFileName) {
                return bundleSourceFile;
            }
            // Use base class to get the all source files other than the bundle
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
            // TJT: Temporary workaround. If declaration is true when minifying an emit error occurs.
            compilerOptions.declaration = false;
            compilerOptions.removeComments = true;
        }
        this.program = ts.createProgram(bundleFiles, compilerOptions, this.compilerHost);
        if (minifyBundle) {
            Logger.log("Minifying bundle...");
            var minifier = new BundleMinifier(this.program, compilerOptions, bundleConfig);
            bundleSourceFile = minifier.transform(bundleSourceFile);
            this.program = ts.createProgram(bundleFiles, compilerOptions, this.compilerHost);
        }
        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics(this.program);
        this.preEmitTime = new Date().getTime() - this.preEmitTime;
        // Return if noEmitOnError flag is set, and we have errors
        if (this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, preEmitDiagnostics);
        }
        this.emitTime = new Date().getTime();
        var emitResult = this.program.emit(bundleSourceFile);
        this.emitTime = new Date().getTime() - this.emitTime;
        // Always stream the bundle source file ts - even if emit errors.
        Logger.info("Streaming vinyl bundle source: ", bundleFileName);
        var tsVinylFile = new VinylFile({
            path: bundleFileName,
            contents: Buffer.from(format(bundleSourceFile.text))
        });
        this.outputStream.push(tsVinylFile);
        // Concat any emit errors
        var allDiagnostics = preEmitDiagnostics.concat(emitResult.diagnostics);
        // If the emitter didn't emit anything, then pass that value along.
        if (emitResult.emitSkipped) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, allDiagnostics);
        }
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if (this.compilerOptions.noEmitOnError && allDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics);
        }
        // Emit the output files even if errors ( noEmitOnError is false ).
        // Stream the emitted files...
        var bundleDir = path.dirname(bundleFile.path);
        var bundleName = path.basename(bundleFile.path, bundleFile.extension);
        var bundlePrefixExt = minifyBundle ? ".min" : "";
        var jsBundlePath = TsCore.normalizeSlashes(path.join(bundleDir, bundleName + bundlePrefixExt + ".js"));
        // js should have been generated, but just in case!
        if (Utils.hasProperty(outputText, jsBundlePath)) {
            var jsContents = outputText[jsBundlePath];
            if (minifyBundle) {
                // Whitespace removal cannot be performed in the AST minification transform, so we do it here for now
                var minifier = new BundleMinifier(this.program, compilerOptions, bundleConfig);
                jsContents = minifier.removeWhitespace(jsContents);
            }
            Logger.info("Streaming vinyl js: ", bundleName);
            var bundleJsVinylFile = new VinylFile({
                path: jsBundlePath,
                contents: Buffer.from(jsContents)
            });
            this.outputStream.push(bundleJsVinylFile);
        }
        var dtsBundlePath = TsCore.normalizeSlashes(path.join(bundleDir, bundleName + bundlePrefixExt + ".d.ts"));
        // d.ts is generated, if compiler option declaration is true
        if (Utils.hasProperty(outputText, dtsBundlePath)) {
            Logger.info("Streaming vinyl d.ts: ", dtsBundlePath);
            var bundleDtsVinylFile = new VinylFile({
                path: dtsBundlePath,
                contents: Buffer.from(outputText[dtsBundlePath])
            });
            this.outputStream.push(bundleDtsVinylFile);
        }
        var mapBundlePath = TsCore.normalizeSlashes(path.join(bundleDir, bundleName + bundlePrefixExt + ".js.map"));
        // js.map is generated, if compiler option sourceMap is true
        if (Utils.hasProperty(outputText, mapBundlePath)) {
            Logger.info("Streaming vinyl js.map: ", mapBundlePath);
            var bundleMapVinylFile = new VinylFile({
                path: mapBundlePath,
                contents: Buffer.from(outputText[mapBundlePath])
            });
            this.outputStream.push(bundleMapVinylFile);
        }
        this.compileTime = new Date().getTime() - this.compileTime;
        if (this.compilerOptions.diagnostics)
            this.reportStatistics();
        if (allDiagnostics.length > 0) {
            return new CompilerResult(ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, allDiagnostics);
        }
        else {
            return new CompilerResult(ts.ExitStatus.Success);
        }
    };
    BundleCompiler.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTime("Pre-emit time", this.preEmitTime);
        statisticsReporter.reportTime("Emit time", this.emitTime);
        statisticsReporter.reportTime("Compile time", this.compileTime);
    };
    return BundleCompiler;
}());
var Project = /** @class */ (function () {
    function Project(configFilePath, settings) {
        this.totalBuildTime = 0;
        this.totalCompileTime = 0;
        this.totalPreBuildTime = 0;
        this.totalBundleTime = 0;
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
        Logger.log("TsProject version: ", Project.version);
        Logger.log("TypeScript version: ", ts.version);
        this.outputStream = outputStream;
        // Perform the build..
        var buildStatus = this.buildWorker();
        this.reportBuildStatus(buildStatus);
        this.completeProjectBuild();
        return buildStatus;
    };
    Project.prototype.createBuildContext = function (config) {
        var compilerHost = new CachingCompilerHost(config.compilerOptions);
        return new ProjectBuildContext(compilerHost, config);
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
            var diagnostic = TsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'." }, this.configFilePath);
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
            var diagnostic = TsCore.createDiagnostic({ code: 5099, category: ts.DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--project");
            parsedResult.errors.push(diagnostic);
        }
        // FIXME: Perhaps no longer needed?
        //if ( parsedResult.options.init ) {
        //    let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--init" );
        //    parsedResult.errors.push( diagnostic );
        //}
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
                var relativeFileNames_1 = [];
                fileNames.forEach(function (fileName) {
                    relativeFileNames_1.push(path.relative(configDirPath, fileName).replace(/\\/g, "/"));
                });
                jsonConfigObject["files"] = relativeFileNames_1;
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
    Project.version = "4.0.0";
    return Project;
}());
var TsProject;
(function (TsProject) {
    TsProject.version = Project.version;
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
    TsProject.src = src;
})(TsProject = exports.TsProject || (exports.TsProject = {}));
// Nodejs module exports
module.exports = TsProject;
//# sourceMappingURL=tsproject.js.map