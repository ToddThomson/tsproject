"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var fs = require("fs");
var _ = require("lodash");
var path = require("path");
var fileGlob = require("glob");
var chalk_1 = require("chalk");
var ts2js_1 = require("ts2js");
var ts2js_2 = require("ts2js");
var TsBundler_1 = require("TsBundler");
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
    function getSourceFileOfNode(node) {
        while (node && node.kind !== ts.SyntaxKind.SourceFile) {
            node = node.parent;
        }
        return node;
    }
    TsCore.getSourceFileOfNode = getSourceFileOfNode;
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
var level = {
    none: 0,
    error: 1,
    warn: 2,
    trace: 3,
    info: 4
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
            args[_i] = arguments[_i];
        }
        console.log.apply(console, [chalk_1.default.gray("[" + this.logName + "]")].concat(args));
    };
    Logger.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.info) {
            return;
        }
        console.log.apply(console, [chalk_1.default.gray("[" + this.logName + "]" + chalk_1.default.blue(" INFO: "))].concat(args));
    };
    Logger.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.warn) {
            return;
        }
        console.log.apply(console, ["[" + this.logName + "]" + chalk_1.default.yellow(" WARNING: ")].concat(args));
    };
    Logger.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.error) {
            return;
        }
        console.log.apply(console, ["[" + this.logName + "]" + chalk_1.default.red(" ERROR: ")].concat(args));
    };
    Logger.trace = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.logLevel < level.error) {
            return;
        }
        console.log.apply(console, ["[" + this.logName + "]" + chalk_1.default.gray(" TRACE: ")].concat(args));
    };
    return Logger;
}());
Logger.logLevel = level.none;
Logger.logName = "logger";
var ProjectBuildContext = (function () {
    function ProjectBuildContext(config, program) {
        this.config = config;
        this.config = config;
        this.program = program;
    }
    ProjectBuildContext.prototype.getProgram = function () {
        return this.program;
    };
    ProjectBuildContext.prototype.setProgram = function (program) {
        this.program = program;
    };
    return ProjectBuildContext;
}());
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
}());
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
var StatisticsReporter = (function () {
    function StatisticsReporter() {
    }
    StatisticsReporter.prototype.reportTitle = function (name) {
        Logger.log(name);
    };
    StatisticsReporter.prototype.reportValue = function (name, value) {
        Logger.log(this.padRight(name + ":", 25) + chalk_1.default.magenta(this.padLeft(value.toString(), 10)));
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
            output += chalk_1.default.gray(diagnostic.file.fileName + "(" + (loc.line + 1) + "," + (loc.character + 1) + "): ");
        }
        var category;
        switch (diagnostic.category) {
            case ts.DiagnosticCategory.Error:
                category = chalk_1.default.red(ts.DiagnosticCategory[diagnostic.category].toLowerCase());
                break;
            case ts.DiagnosticCategory.Warning:
                category = chalk_1.default.yellow(ts.DiagnosticCategory[diagnostic.category].toLowerCase());
                break;
            default:
                category = chalk_1.default.green(ts.DiagnosticCategory[diagnostic.category].toLowerCase());
        }
        output += category + " TS" + chalk_1.default.white(diagnostic.code + '') + ": " + chalk_1.default.grey(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        Logger.log(output);
    };
    return DiagnosticsReporter;
}());
var Project = (function () {
    function Project() {
    }
    Project.getProjectConfig = function (configFilePath) {
        var configFileDir;
        var configFileName;
        try {
            var isConfigDirectory = fs.lstatSync(configFilePath).isDirectory();
        }
        catch (e) {
            var diagnostic = TsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'." }, configFilePath);
            return { success: false, errors: [diagnostic] };
        }
        if (isConfigDirectory) {
            configFileDir = configFilePath;
            configFileName = path.join(configFilePath, "tsconfig.json");
        }
        else {
            configFileDir = path.dirname(configFilePath);
            configFileName = configFilePath;
        }
        var readConfigResult = ts.readConfigFile(configFileName, function (fileName) {
            return ts.sys.readFile(fileName);
        });
        if (readConfigResult.error) {
            return { success: false, errors: [readConfigResult.error] };
        }
        var configObject = readConfigResult.config;
        // Parse standard project configuration objects: compilerOptions, files.
        var configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, configFileDir);
        if (configParseResult.errors.length > 0) {
            return { success: false, errors: configParseResult.errors };
        }
        return {
            success: true,
            compilerOptions: configParseResult.options,
            fileNames: configParseResult.fileNames
        };
    };
    return Project;
}());
var ProjectBuilder = (function () {
    function ProjectBuilder(configFilePath, settings) {
        this.totalBuildTime = 0;
        this.totalCompileTime = 0;
        this.totalPreBuildTime = 0;
        this.totalBundleTime = 0;
        this.configFilePath = configFilePath;
        this.settings = settings;
    }
    ProjectBuilder.prototype.build = function (outputStream) {
        var config = this.parseProjectConfig();
        if (!config.success) {
            DiagnosticsReporter.reportDiagnostics(config.errors);
            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }
        this.buildContext = this.createBuildContext(config);
        Logger.log("Building Project with: " + chalk_1.default.magenta("" + this.configFileName));
        Logger.log("TypeScript compiler version: ", ts.version);
        this.outputStream = outputStream;
        // Perform the build..
        var buildStatus = this.buildWorker();
        this.reportBuildStatus(buildStatus);
        this.completeProjectBuild();
        return buildStatus;
    };
    ProjectBuilder.prototype.createBuildContext = function (config) {
        return new ProjectBuildContext(config);
    };
    ProjectBuilder.prototype.completeProjectBuild = function () {
        // End the build process by sending EOF to the compilation output stream.
        this.outputStream.push(null);
    };
    ProjectBuilder.prototype.buildWorker = function () {
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
        this.buildProject();
        this.buildBundles();
        this.totalBuildTime = new Date().getTime() - this.totalBuildTime;
        if (compilerOptions.diagnostics) {
            this.reportStatistics();
        }
        if (allDiagnostics.length > 0) {
            return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
        }
        return ts.ExitStatus.Success;
    };
    ProjectBuilder.prototype.buildProject = function () {
        var fileNames = this.buildContext.config.fileNames;
        var compilerOptions = this.buildContext.config.compilerOptions;
        // Create a new program to handle the incremental build. Pass the current build context program ( if it exists )
        // to reuse the current program structure.
        var program = ts.createProgram(fileNames, compilerOptions, this.buildContext.host, this.buildContext.getProgram());
        this.totalPreBuildTime = new Date().getTime() - this.totalPreBuildTime;
        // Save the new program to the build context
        this.buildContext.setProgram(program);
        // Compile the project...
        var compiler = new ts2js_2.Compiler(compilerOptions, this.buildContext.host, program); //, this.outputStream );
        this.totalCompileTime = new Date().getTime();
        var compileResult = compiler.compile(fileNames);
        this.totalCompileTime = new Date().getTime() - this.totalCompileTime;
        if (!compileResult.succeeded()) {
            DiagnosticsReporter.reportDiagnostics(compileResult.getErrors());
            //TJT: FIXME
            //return compileResult.getStatus();
            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }
        if (compilerOptions.listFiles) {
            Utils.forEach(this.buildContext.getProgram().getSourceFiles(), function (file) {
                Logger.log(file.fileName);
            });
        }
        return ts.ExitStatus.Success;
    };
    ProjectBuilder.prototype.buildBundles = function () {
        var bundles = this.buildContext.config.bundles;
        var compilerOptions = this.buildContext.config.compilerOptions;
        this.totalBundleTime = new Date().getTime();
        // Build bundles..
        //var bundleBuilder = new BundleBuilder( this.buildContext.host, this.buildContext.getProgram() );
        var bundleCompiler = new ts2js_2.Compiler(compilerOptions, this.buildContext.host); //, this.outputStream );
        //var bundleResult: BundleResult;
        for (var i = 0, len = bundles.length; i < len; i++) {
            Logger.log("Building bundle: ", chalk_1.default.cyan(bundles[i].name));
            //bundleResult = bundleBuilder.build( bundles[i] );
            //if ( !bundleResult.succeeded() ) {
            //    DiagnosticsReporter.reportDiagnostics( bundleResult.getErrors() );
            //    return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            //}
            //compileResult = bundleCompiler.compile( bundleResult.getBundleSource(), bundles[i].config );
            //if ( !compileResult.succeeded() ) {
            //    DiagnosticsReporter.reportDiagnostics( compileResult.getErrors() );
            //    // TJT: FIXME:
            //    //return compileResult.getStatus();
            //    return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            //}
        }
        this.totalBundleTime = new Date().getTime() - this.totalBundleTime;
    };
    ProjectBuilder.prototype.parseProjectConfig = function () {
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
        var bundleParser = new TsBundler_1.ConfigParser();
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
    ProjectBuilder.prototype.readFile = function (fileName) {
        return ts.sys.readFile(fileName);
    };
    ProjectBuilder.prototype.getSettingsCompilerOptions = function (jsonSettings, configDirPath) {
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
    ProjectBuilder.prototype.expandFileNames = function (files, configDirPath) {
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
    ProjectBuilder.prototype.convertProjectFileNames = function (fileNames, configDirPath) {
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
            Logger.log(chalk_1.default.yellow("Converting project files failed."));
        }
    };
    ProjectBuilder.prototype.reportBuildStatus = function (buildStatus) {
        switch (buildStatus) {
            case ts.ExitStatus.Success:
                Logger.log(chalk_1.default.green("Project build completed successfully."));
                break;
            case ts.ExitStatus.DiagnosticsPresent_OutputsSkipped:
                Logger.log(chalk_1.default.red("Build completed with errors."));
                break;
            case ts.ExitStatus.DiagnosticsPresent_OutputsGenerated:
                Logger.log(chalk_1.default.red("Build completed with errors. " + chalk_1.default.italic("Outputs generated.")));
                break;
        }
    };
    ProjectBuilder.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter();
        statisticsReporter.reportTitle("Total build times...");
        statisticsReporter.reportTime("Pre-build time", this.totalPreBuildTime);
        statisticsReporter.reportTime("Compiling time", this.totalCompileTime);
        statisticsReporter.reportTime("Bundling time", this.totalBundleTime);
        statisticsReporter.reportTime("Build time", this.totalBuildTime);
    };
    return ProjectBuilder;
}());
var TsProject;
(function (TsProject) {
    function getProjectConfig(configFilePath) {
        return Project.getProjectConfig(configFilePath);
    }
    TsProject.getProjectConfig = getProjectConfig;
    function src(configFilePath, settings) {
        if (configFilePath === undefined && typeof configFilePath !== 'string') {
            throw new Error("Provide a valid directory or file path to the Typescript project configuration json file.");
        }
        settings = settings || {};
        settings.logLevel = settings.logLevel || 0;
        Logger.setLevel(settings.logLevel);
        Logger.setName("TsProject");
        var outputStream = new ts2js_1.CompileStream();
        var project = new ProjectBuilder(configFilePath, settings);
        project.build(outputStream);
        return outputStream;
    }
    TsProject.src = src;
})(TsProject = exports.TsProject || (exports.TsProject = {}));
