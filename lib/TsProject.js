"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var fs = require("fs");
var path = require("path");
var ts2js = require("ts2js");
var stream = require("stream");
var chalk_1 = require("chalk");
var File = require("vinyl");
var PluginError = require("plugin-error");
var TsCore;
(function (TsCore) {
    /** Does nothing. */
    function noop(_) { } // tslint:disable-line no-empty
    TsCore.noop = noop;
    /** Do nothing and return false */
    function returnFalse() { return false; }
    TsCore.returnFalse = returnFalse;
    /** Do nothing and return true */
    function returnTrue() { return true; }
    TsCore.returnTrue = returnTrue;
    /** Do nothing and return undefined */
    function returnUndefined() { return undefined; }
    TsCore.returnUndefined = returnUndefined;
    /** Returns its argument. */
    function identity(x) { return x; }
    TsCore.identity = identity;
    /** Returns lower case string */
    function toLowerCase(x) { return x.toLowerCase(); }
    TsCore.toLowerCase = toLowerCase;
    /** Throws an error because a function is not implemented. */
    function notImplemented() {
        throw new Error("Not implemented");
    }
    TsCore.notImplemented = notImplemented;
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
    function createDiagnostic(message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var text = message.message;
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
    function normalizeSlashes(path) {
        return path.replace(/\\/g, "/");
    }
    TsCore.normalizeSlashes = normalizeSlashes;
    function outputExtension(path) {
        return path.replace(/\.ts/, ".js");
    }
    TsCore.outputExtension = outputExtension;
    /**
     * Parse standard project configuration objects: compilerOptions, files.
     * @param configFilePath
     */
    function getProjectConfig(configFilePath) {
        var configFileDir;
        var configFileName;
        try {
            var isConfigDirectory = fs.lstatSync(configFilePath).isDirectory();
        }
        catch (e) {
            var diagnostic = TsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'." }, configFilePath);
            return {
                options: undefined,
                fileNames: [],
                errors: [diagnostic]
            };
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
            return {
                options: undefined,
                fileNames: [],
                errors: [readConfigResult.error]
            };
        }
        var configObject = readConfigResult.config;
        return ts.parseJsonConfigFileContent(configObject, ts.sys, configFileDir);
    }
    TsCore.getProjectConfig = getProjectConfig;
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
var Project = (function () {
    function Project(configFilePath, options) {
        this.configFilePath = configFilePath;
        this.options = options || this.getDefaultOptions();
        // Add the bundler options to the overall project config
        //this.config.bundlerOptions = this.bundlerOptions;
    }
    Project.prototype.getOptions = function () {
        return this.options;
    };
    Project.prototype.getConfig = function () {
        var configFileDir;
        var configFileName;
        try {
            var isConfigDirectory = fs.lstatSync(this.configFilePath).isDirectory();
        }
        catch (e) {
            var diagnostic = TsCore.createDiagnostic({
                code: 6064,
                category: ts.DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'."
            }, this.configFilePath);
            return { fileName: this.configFilePath, success: false, errors: [diagnostic] };
        }
        if (isConfigDirectory) {
            configFileDir = this.configFilePath;
            configFileName = path.join(this.configFilePath, "tsconfig.json");
        }
        else {
            configFileDir = path.dirname(this.configFilePath);
            configFileName = this.configFilePath;
        }
        var readConfigResult = ts.readConfigFile(configFileName, function (fileName) {
            return ts.sys.readFile(fileName);
        });
        if (readConfigResult.error) {
            return { fileName: configFileName, success: false, errors: [readConfigResult.error] };
        }
        var configObject = readConfigResult.config;
        // Parse standard project configuration objects: compilerOptions, files.
        var configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, configFileDir);
        if (configParseResult.errors.length > 0) {
            return { fileName: configFileName, success: false, errors: configParseResult.errors };
        }
        return {
            fileName: configFileName,
            success: true,
            compilerOptions: configParseResult.options,
            files: configParseResult.fileNames
        };
    };
    //private parseBundleConfig(): ProjectConfig
    //{
    //    // Parse "bundle" project configuration objects: compilerOptions, files.
    //    var bundleParser = new BundleConfigParser();
    //    var bundlesParseResult = bundleParser.parseConfigFile( configObject, this.configFileDir );
    //    if ( bundlesParseResult.errors.length > 0 )
    //    {
    //        return { success: false, errors: bundlesParseResult.errors };
    //    }
    //    // The returned bundles "Files" list may contain file glob patterns. 
    //    bundlesParseResult.bundles.forEach( bundle =>
    //    {
    //        bundle.fileNames = this.expandFileNames( bundle.fileNames, this.configFileDir );
    //    } );
    //    // Parse the command line args to override project file compiler options
    //    let settingsCompilerOptions = this.getSettingsCompilerOptions( this.settings, this.configFileDir );
    //    // Check for any errors due to command line parsing
    //    if ( settingsCompilerOptions.errors.length > 0 )
    //    {
    //        return { success: false, errors: settingsCompilerOptions.errors };
    //    }
    //    let compilerOptions = Utils.extend( settingsCompilerOptions.options, configParseResult.options );
    //    return {
    //        success: true,
    //        compilerOptions: compilerOptions,
    //        fileNames: configParseResult.fileNames,
    //        bundles: bundlesParseResult.bundles
    //    }
    //}
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
    Project.prototype.getDefaultOptions = function () {
        return {
            logLevel: 0,
            verbose: false,
            outputToDisk: true
        };
    };
    return Project;
}());
exports.Project = Project;
;
var ProjectBuildResult = (function () {
    function ProjectBuildResult(errors, compileResults) {
        this.errors = errors;
        //this.bundleBuilderResults = bundleBuilderResults;
        this.compileResults = compileResults;
    }
    ProjectBuildResult.prototype.succeeded = function () {
        return (this.errors.length == 0);
    };
    return ProjectBuildResult;
}());
var BuildStream = (function (_super) {
    __extends(BuildStream, _super);
    function BuildStream(opts) {
        return _super.call(this, { objectMode: true }) || this;
    }
    BuildStream.prototype._read = function () {
        // Safely do nothing
    };
    return BuildStream;
}(stream.Readable));
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
var ProjectBuilder = (function () {
    function ProjectBuilder(project) {
        this.totalBuildTime = 0;
        this.totalCompileTime = 0;
        this.totalPreBuildTime = 0;
        this.totalBundleTime = 0;
        this.project = project;
        this.config = project.getConfig();
        this.options = project.getOptions();
    }
    ProjectBuilder.prototype.build = function (buildCompleted) {
        var _this = this;
        // Configuration errors?
        if (!this.config.success) {
            if (this.options.verbose) {
                DiagnosticsReporter.reportDiagnostics(this.config.errors);
            }
            return buildCompleted(new ProjectBuildResult(this.config.errors));
        }
        // Perform the build..
        this.buildWorker(function (buildResult) {
            // onBuildCompleted...
            if (_this.options.outputToDisk) {
                if (buildResult.succeeded()) {
                    buildResult.compileResults.forEach(function (compileResult) {
                        if (compileResult.getStatus() !== ts2js.CompileStatus.DiagnosticsPresent_OutputsSkipped) {
                            compileResult.getOutput().forEach(function (emit) {
                                if (!emit.emitSkipped) {
                                    if (emit.codeFile) {
                                        fs.writeFileSync(emit.codeFile.fileName, emit.codeFile.data);
                                    }
                                    if (emit.dtsFile) {
                                        fs.writeFileSync(emit.dtsFile.fileName, emit.dtsFile.data);
                                    }
                                    if (emit.mapFile) {
                                        fs.writeFileSync(emit.mapFile.fileName, emit.mapFile.data);
                                    }
                                }
                            });
                        }
                    });
                }
            }
            _this.reportBuildStatus(buildResult);
            return buildCompleted(buildResult);
        });
    };
    ProjectBuilder.prototype.src = function () {
        var _this = this;
        if (!this.config.success) {
            if (this.options.verbose) {
                DiagnosticsReporter.reportDiagnostics(this.config.errors);
            }
            throw new PluginError({
                plugin: "TsBundler",
                message: "Invalid typescript configuration file " + this.config.fileName
            });
        }
        var outputStream = new BuildStream();
        var vinylFile;
        // Perform the build..
        this.buildWorker(function (buildResult) {
            // onBuildCompleted...
            //if ( buildResult.compileResults )
            //{
            //    buildResult.compileResults.forEach( ( bundleBuildResult ) =>
            //    {
            //        var bundleSource = bundleBuildResult.getBundleSource();
            //        vinylFile = new File( { path: bundleSource.path, contents: new Buffer( bundleSource.text ) } )
            //        outputStream.push( vinylFile );
            //    } );
            //}
            // Emit bundle compilation results...
            if (buildResult.succeeded()) {
                buildResult.compileResults.forEach(function (compileResult) {
                    if (compileResult.getStatus() !== ts2js.CompileStatus.DiagnosticsPresent_OutputsSkipped) {
                        compileResult.getOutput().forEach(function (emit) {
                            if (!emit.emitSkipped) {
                                if (emit.codeFile) {
                                    vinylFile = new File({ path: emit.codeFile.fileName, contents: new Buffer(emit.codeFile.data) });
                                    outputStream.push(vinylFile);
                                }
                                if (emit.dtsFile) {
                                    vinylFile = new File({ path: emit.dtsFile.fileName, contents: new Buffer(emit.dtsFile.data) });
                                    outputStream.push(vinylFile);
                                }
                                if (emit.mapFile) {
                                    vinylFile = new File({ path: emit.mapFile.fileName, contents: new Buffer(emit.mapFile.data) });
                                    outputStream.push(vinylFile);
                                }
                            }
                        });
                    }
                });
            }
            _this.reportBuildStatus(buildResult);
            outputStream.push(null);
        });
        return outputStream;
    };
    ProjectBuilder.prototype.buildWorker = function (buildCompleted) {
        if (this.options.verbose) {
            Logger.log("Building project with: " + chalk_1.default.magenta("" + this.config.fileName));
            Logger.log("TypeScript compiler version: ", ts.version);
        }
        var fileNames = this.config.files;
        var bundles = this.config.bundles;
        var compilerOptions = this.config.compilerOptions;
        // Compile the project...
        var compiler = new ts2js.Compiler(compilerOptions);
        if (this.options.verbose) {
            Logger.log("Compiling project files...");
        }
        this.totalBuildTime = new Date().getTime();
        this.totalCompileTime = new Date().getTime();
        var projectCompileResult = compiler.compile(fileNames);
        this.totalCompileTime = new Date().getTime() - this.totalCompileTime;
        var compileErrors = projectCompileResult.getErrors();
        if (compileErrors.length > 0) {
            DiagnosticsReporter.reportDiagnostics(compileErrors);
            return buildCompleted(new ProjectBuildResult(compileErrors));
        }
        var allDiagnostics = [];
        var compileResults = [];
        //var bundleBuildResults: Bundler.BundleBuildResult[] = [];
        this.totalBundleTime = new Date().getTime();
        // Create a bundle builder to build bundles..
        //var bundleBuilder = new Bundler.BundleBuilder( compiler.getHost(), compiler.getProgram(), this.config.bundlerOptions );
        if (this.options.verbose && (bundles.length == 0)) {
            Logger.log(chalk_1.default.yellow("No bundles found to build."));
        }
        for (var i = 0, len = bundles.length; i < len; i++) {
            if (this.options.verbose) {
                Logger.log("Building bundle: ", chalk_1.default.cyan(bundles[i].name));
            }
            //var bundleResult = bundleBuilder.build( bundles[i] );
            //bundleBuildResults.push( bundleResult );
            //if ( !bundleResult.succeeded() )
            //{
            //    DiagnosticsReporter.reportDiagnostics( bundleResult.getErrors() );
            //    allDiagnostics.concat( bundleResult.getErrors() );
            //    continue;
            //}
            //var bundleSource = bundleResult.getBundleSource();
            //var compileResult: ts2js.CompileResult;
            //if ( bundles[i].config.minify )
            //{
            //    //compileResult = tsMinifier.minifyModule( bundleSource.text, bundleSource.path, compilerOptions, { mangleIdentifiers: true, removeWhitespace: true } );
            //} else
            //{
            //    compileResult = ts2js.TsCompiler.compileModule( bundleSource.text, bundleSource.path, compilerOptions );
            //}
            //bundleCompileResults.push( compileResult );
            //if ( this.options.verbose && ( compileResult.getErrors().length > 0 ) )
            //{
            //    DiagnosticsReporter.reportDiagnostics( compileResult.getErrors() );
            //    allDiagnostics.concat( compileResult.getErrors() );
            //}
        }
        this.totalBundleTime = new Date().getTime() - this.totalBundleTime;
        this.totalBuildTime = new Date().getTime() - this.totalBuildTime;
        if (this.options.verbose) {
            this.reportStatistics();
        }
        return buildCompleted(new ProjectBuildResult(allDiagnostics, compileResults));
    };
    ProjectBuilder.prototype.reportBuildStatus = function (buildResult) {
        if (this.options.verbose) {
            if (buildResult.succeeded()) {
                Logger.log(chalk_1.default.green("Build completed successfully."));
            }
            else {
                Logger.log(chalk_1.default.red("Build completed with errors."));
            }
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
exports.ProjectBuilder = ProjectBuilder;
var TsProject;
(function (TsProject) {
    function getProjectConfig(configFilePath) {
        var project = new Project(configFilePath);
        return project.getConfig();
    }
    TsProject.getProjectConfig = getProjectConfig;
    function builder(configFilePath, options, buildCompleted) {
        var projectBuilder = new ProjectBuilder(new Project(configFilePath, options));
        if (buildCompleted) {
            projectBuilder.build(buildCompleted);
        }
        return projectBuilder;
    }
    TsProject.builder = builder;
    function src(configFilePath, options) {
        if (configFilePath === undefined && typeof configFilePath !== 'string') {
            throw new Error("Provide a valid directory or file path to the Typescript project configuration json file.");
        }
        var projectBuilder = new ProjectBuilder(new Project(configFilePath, options));
        return projectBuilder.src();
    }
    TsProject.src = src;
})(TsProject = exports.TsProject || (exports.TsProject = {}));
