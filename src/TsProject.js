/// <reference path="references.d.ts" />
var Project_1 = require("./Project");
var CompileStream_1 = require("./CompileStream");
var Logger_1 = require("./Logger");
var ts = require('typescript');
var chalk = require("chalk");
function src(configDirPath, settings) {
    if (configDirPath === undefined && typeof configDirPath !== 'string') {
        throw new Error("Provide a valid directory path to the project tsconfig.json");
    }
    settings = settings || {};
    settings.logLevel = settings.logLevel || 0;
    Logger_1.Logger.setLevel(settings.logLevel);
    Logger_1.Logger.setName("TsProject");
    var outputStream = new CompileStream_1.CompileStream();
    var project = new Project_1.Project(configDirPath);
    var buildStatus = project.build(outputStream);
    // EOF the compilation output stream after build.
    outputStream.push(null);
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
    return outputStream;
}
var tsproject = {
    src: src
};
module.exports = tsproject;
//# sourceMappingURL=TsProject.js.map