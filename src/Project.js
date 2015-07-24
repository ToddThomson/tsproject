var Compiler_1 = require("./Compiler");
var CompilerReporter_1 = require("./CompilerReporter");
var DiagnosticsReporter_1 = require("./DiagnosticsReporter");
var CompilerHost_1 = require("./CompilerHost");
var BundleCompiler_1 = require("./BundleCompiler");
var Logger_1 = require("./Logger");
var BundleParser_1 = require("./BundleParser");
var ts = require('typescript');
var fs = require("fs");
var path = require('path');
var chalk = require("chalk");
var tsCore = require("./TsCore");
var utils = require("./Utilities");
var Project = (function () {
    function Project(configPath) {
        this.configPath = configPath;
    }
    Project.prototype.getConfig = function () {
        var configDirPath;
        var configFileName;
        try {
            var isConfigDirectory = fs.lstatSync(this.configPath).isDirectory();
        }
        catch (e) {
            var diagnostic = tsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot read project path '{0}'." }, this.configPath);
            return { success: false, errors: [diagnostic] };
        }
        if (isConfigDirectory) {
            configDirPath = this.configPath;
            configFileName = path.join(this.configPath, "tsconfig.json");
        }
        else {
            configDirPath = path.dirname(this.configPath);
            configFileName = this.configPath;
        }
        this.configFileName = configFileName;
        Logger_1.Logger.info("Reading config file:", configFileName);
        var readConfigResult = ts.readConfigFile(configFileName);
        if (readConfigResult.error) {
            return { success: false, errors: [readConfigResult.error] };
        }
        var configObject = readConfigResult.config;
        // parse standard project configuration objects: compilerOptions, files.
        Logger_1.Logger.info("Parsing config file...");
        var configParseResult = ts.parseConfigFile(configObject, ts.sys, configDirPath);
        if (configParseResult.errors.length > 0) {
            return { success: false, errors: configParseResult.errors };
        }
        Logger_1.Logger.info("Parse Result: ", configParseResult);
        // parse standard project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser_1.BundleParser();
        var bundleParseResult = bundleParser.parseConfigFile(configObject, configDirPath);
        if (bundleParseResult.errors.length > 0) {
            return { success: false, errors: bundleParseResult.errors };
        }
        return {
            success: true,
            compilerOptions: configParseResult.options,
            files: configParseResult.fileNames,
            bundles: bundleParseResult.bundles
        };
    };
    Project.prototype.build = function (outputStream) {
        var allDiagnostics = [];
        // Get project configuration items for the project build context.
        var config = this.getConfig();
        Logger_1.Logger.log("Building Project with: " + chalk.magenta("" + this.configFileName));
        if (!config.success) {
            var diagReporter = new DiagnosticsReporter_1.DiagnosticsReporter(config.errors);
            diagReporter.reportDiagnostics();
            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }
        var compilerOptions = config.compilerOptions;
        var rootFileNames = config.files;
        var bundles = config.bundles;
        // Create host and program.
        var compilerHost = new CompilerHost_1.CompilerHost(compilerOptions);
        var program = ts.createProgram(rootFileNames, compilerOptions, compilerHost);
        // Files..
        var compiler = new Compiler_1.Compiler(compilerHost, program);
        var compileResult = compiler.compileFilesToStream(outputStream);
        var compilerReporter = new CompilerReporter_1.CompilerReporter(compileResult);
        if (!compileResult.succeeded()) {
            compilerReporter.reportDiagnostics();
            if (compilerOptions.noEmitOnError) {
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }
            allDiagnostics = allDiagnostics.concat(compileResult.getErrors());
        }
        if (compilerOptions.listFiles) {
            utils.forEach(program.getSourceFiles(), function (file) {
                Logger_1.Logger.log(file.fileName);
            });
        }
        // Don't report statistics if there are no output emits
        if ((compileResult.getStatus() !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped) && compilerOptions.diagnostics) {
            compilerReporter.reportStatistics();
        }
        // Bundles..
        var bundleCompiler = new BundleCompiler_1.BundleCompiler(compilerHost, program);
        for (var i = 0, len = bundles.length; i < len; i++) {
            Logger_1.Logger.log("Compiling Project Bundle: ", chalk.cyan(bundles[i].name));
            compileResult = bundleCompiler.compileBundleToStream(outputStream, bundles[i]);
            compilerReporter = new CompilerReporter_1.CompilerReporter(compileResult);
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
    return Project;
})();
exports.Project = Project;
//# sourceMappingURL=Project.js.map