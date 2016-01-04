var Compiler_1 = require("../Compiler/Compiler");
var DiagnosticsReporter_1 = require("../Reporting/DiagnosticsReporter");
var WatchCompilerHost_1 = require("../Compiler/WatchCompilerHost");
var ProjectBuildContext_1 = require("./ProjectBuildContext");
var BundleBuilder_1 = require("../Bundler/BundleBuilder");
var BundleCompiler_1 = require("../Bundler/BundleCompiler");
var StatisticsReporter_1 = require("../Reporting/StatisticsReporter");
var Logger_1 = require("../Reporting/Logger");
var BundleParser_1 = require("../Bundler/BundleParser");
var Glob_1 = require("./Glob");
var TsCore_1 = require("../Utils/TsCore");
var Utilities_1 = require("../Utils/Utilities");
var ts = require("typescript");
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var chalk = require("chalk");
var chokidar = require("chokidar");
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
                Logger_1.Logger.log("Watching for project changes...");
            }
        };
        this.configFilePath = configFilePath;
        this.settings = settings;
    }
    Project.prototype.build = function (outputStream) {
        var config = this.parseProjectConfig();
        if (!config.success) {
            DiagnosticsReporter_1.DiagnosticsReporter.reportDiagnostics(config.errors);
            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }
        this.buildContext = this.createBuildContext(config);
        Logger_1.Logger.log("Building Project with: " + chalk.magenta("" + this.configFileName));
        Logger_1.Logger.log("TypeScript compiler version: ", ts.version);
        this.outputStream = outputStream;
        // Perform the build..
        var buildStatus = this.buildWorker();
        this.reportBuildStatus(buildStatus);
        if (config.compilerOptions.watch) {
            Logger_1.Logger.log("Watching for project changes...");
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
        var compilerHost = new WatchCompilerHost_1.WatchCompilerHost(config.compilerOptions, this.onSourceFileChanged);
        return new ProjectBuildContext_1.ProjectBuildContext(compilerHost, config);
    };
    Project.prototype.watchProject = function () {
        var _this = this;
        if (!ts.sys.watchFile) {
            var diagnostic = TsCore_1.TsCore.createDiagnostic({ code: 5001, category: ts.DiagnosticCategory.Warning, key: "The current node host does not support the '{0}' option." }, "-watch");
            DiagnosticsReporter_1.DiagnosticsReporter.reportDiagnostic(diagnostic);
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
                DiagnosticsReporter_1.DiagnosticsReporter.reportDiagnostics(config.errors);
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
        var compiler = new Compiler_1.Compiler(this.buildContext.host, program, this.outputStream);
        this.totalCompileTime = new Date().getTime();
        var compileResult = compiler.compile();
        this.totalCompileTime = new Date().getTime() - this.totalCompileTime;
        if (!compileResult.succeeded()) {
            DiagnosticsReporter_1.DiagnosticsReporter.reportDiagnostics(compileResult.getErrors());
            return compileResult.getStatus();
        }
        if (compilerOptions.listFiles) {
            Utilities_1.Utils.forEach(this.buildContext.getProgram().getSourceFiles(), function (file) {
                Logger_1.Logger.log(file.fileName);
            });
        }
        this.totalBundleTime = new Date().getTime();
        // Build bundles..
        var bundleBuilder = new BundleBuilder_1.BundleBuilder(this.buildContext.host, this.buildContext.getProgram());
        var bundleCompiler = new BundleCompiler_1.BundleCompiler(this.buildContext.host, this.buildContext.getProgram(), this.outputStream);
        var bundleResult;
        for (var i = 0, len = bundles.length; i < len; i++) {
            Logger_1.Logger.log("Building bundle: ", chalk.cyan(bundles[i].name));
            bundleResult = bundleBuilder.build(bundles[i]);
            if (!bundleResult.succeeded()) {
                DiagnosticsReporter_1.DiagnosticsReporter.reportDiagnostics(bundleResult.getErrors());
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }
            //if ( .minify ) {
            //    let minifier = new BundleMinifier( this.compilerOptions );
            //    let minifiedBundleSourceFile = minifier.minify( bundleFile );
            //    this.bundleSourceFiles[bundleFileName] = bundleFileText;
            //}
            compileResult = bundleCompiler.compile(bundleResult.getBundleSource(), bundles[i].config);
            if (!compileResult.succeeded()) {
                DiagnosticsReporter_1.DiagnosticsReporter.reportDiagnostics(compileResult.getErrors());
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
            var diagnostic = TsCore_1.TsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot read project path '{0}'." }, this.configFilePath);
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
        Logger_1.Logger.info("Reading config file:", this.configFileName);
        var readConfigResult = ts.readConfigFile(this.configFileName, this.readFile);
        if (readConfigResult.error) {
            return { success: false, errors: [readConfigResult.error] };
        }
        var configObject = readConfigResult.config;
        // Parse standard project configuration objects: compilerOptions, files.
        Logger_1.Logger.info("Parsing config file...");
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
        var bundleParser = new BundleParser_1.BundleParser();
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
        var compilerOptions = Utilities_1.Utils.extend(settingsCompilerOptions.options, configParseResult.options);
        Logger_1.Logger.info("Compiler options: ", compilerOptions);
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
            var diagnostic = TsCore_1.TsCore.createDiagnostic({ code: 5099, category: ts.DiagnosticCategory.Error, key: "The compiler option '{0}' is not supported in this context." }, "--project");
            parsedResult.errors.push(diagnostic);
        }
        if (parsedResult.options.init) {
            var diagnostic = TsCore_1.TsCore.createDiagnostic({ code: 5099, category: ts.DiagnosticCategory.Error, key: "The compiler option '{0}' is not supported in this context." }, "--init");
            parsedResult.errors.push(diagnostic);
        }
        return parsedResult;
    };
    Project.prototype.expandFileNames = function (files, configDirPath) {
        // The parameter files may contain a mix of glob patterns and filenames.
        // glob.expand() will only return a list of all expanded "found" files. 
        // For filenames without glob patterns, we add them to the list of files as we will want to know
        // if any filenames are not found during bundle processing.
        var glob = new Glob_1.Glob();
        var nonglobFiles = [];
        Utilities_1.Utils.forEach(files, function (file) {
            if (!glob.hasPattern(file)) {
                nonglobFiles.push(path.normalize(file));
            }
        });
        // Get the list of expanded glob files
        var globFiles = glob.expand(files, configDirPath);
        var normalizedGlobFiles = [];
        // Normalize file paths for matching
        Utilities_1.Utils.forEach(globFiles, function (file) {
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
            Logger_1.Logger.log(chalk.yellow("Converting project files failed."));
        }
    };
    Project.prototype.reportBuildStatus = function (buildStatus) {
        switch (buildStatus) {
            case ts.ExitStatus.Success:
                Logger_1.Logger.log(chalk.green("Project build completed successfully."));
                break;
            case ts.ExitStatus.DiagnosticsPresent_OutputsSkipped:
                Logger_1.Logger.log(chalk.red("Build completed with errors."));
                break;
            case ts.ExitStatus.DiagnosticsPresent_OutputsGenerated:
                Logger_1.Logger.log(chalk.red("Build completed with errors. " + chalk.italic("Outputs generated.")));
                break;
        }
    };
    Project.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter_1.StatisticsReporter();
        statisticsReporter.reportTitle("Total build times...");
        statisticsReporter.reportTime("Pre-build time", this.totalPreBuildTime);
        statisticsReporter.reportTime("Compiling time", this.totalCompileTime);
        statisticsReporter.reportTime("Bundling time", this.totalBundleTime);
        statisticsReporter.reportTime("Build time", this.totalBuildTime);
    };
    return Project;
})();
exports.Project = Project;
//# sourceMappingURL=Project.js.map