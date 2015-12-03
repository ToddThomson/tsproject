var StatisticsReporter_1 = require("./StatisticsReporter");
var Logger_1 = require("./Logger");
var BundleResult_1 = require("./BundleResult");
var DependencyBuilder_1 = require("./DependencyBuilder");
var Utilities_1 = require("./Utilities");
var TsCore_1 = require("./TsCore");
var ts = require("typescript");
var path = require('path');
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
        var dependencyBuilder = new DependencyBuilder_1.DependencyBuilder(this.compilerHost, this.program);
        // Construct bundle output file name
        var bundleBaseDir = path.dirname(bundle.name);
        if (bundle.config.outDir) {
            bundleBaseDir = path.join(bundleBaseDir, bundle.config.outDir);
        }
        var bundleFilePath = path.join(bundleBaseDir, path.basename(bundle.name));
        bundleFilePath = TsCore_1.TsCore.normalizeSlashes(bundleFilePath);
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
            Logger_1.Logger.info(">>> Processing bundle file:", fileName);
            var bundleSourceFileName = this.compilerHost.getCanonicalFileName(TsCore_1.TsCore.normalizeSlashes(fileName));
            Logger_1.Logger.info("BundleSourceFileName:", bundleSourceFileName);
            var bundleSourceFile_1 = this.program.getSourceFile(bundleSourceFileName);
            if (!bundleSourceFile_1) {
                var diagnostic = TsCore_1.TsCore.createDiagnostic({ code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle Source File '{0}' not found." }, bundleSourceFileName);
                return new BundleResult_1.BundleResult(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, [diagnostic]);
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
                if (!Utilities_1.Utils.hasProperty(allDependencies, mergeKey)) {
                    allDependencies[mergeKey] = sourceDependencies[mergeKey];
                }
            }
            startTime = new Date().getTime();
            Logger_1.Logger.info("traversing source dependencies for: ", bundleSourceFile_1.fileName);
            for (var depKey in sourceDependencies) {
                // Add module dependencies first..
                sourceDependencies[depKey].forEach(function (importNode) {
                    var importSymbol = _this.getSymbolFromNode(importNode);
                    if (_this.isCodeModule(importSymbol)) {
                        var declaration = importSymbol.getDeclarations()[0];
                        var importedSource = declaration.getSourceFile();
                        var importedSourceFileName = importedSource.fileName;
                        if (!Utilities_1.Utils.hasProperty(_this.bundleImportedFiles, importedSourceFileName)) {
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
        return new BundleResult_1.BundleResult(ts.ExitStatus.Success, undefined, bundleSourceFile);
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
        if (!Utilities_1.Utils.hasProperty(this.bundleModuleImports, moduleName)) {
            this.bundleModuleImports[moduleName] = {};
        }
        var moduleImports = this.bundleModuleImports[moduleName];
        if (!Utilities_1.Utils.hasProperty(moduleImports, importName)) {
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
                Utilities_1.Utils.forEach(node.importClause.namedBindings.elements, function (element) {
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
        Logger_1.Logger.info("Processing import statements in file: ", file.fileName);
        var editText = file.text;
        ts.forEachChild(file, function (node) {
            if (node.kind === 222 /* ImportDeclaration */ || node.kind === 221 /* ImportEqualsDeclaration */ || node.kind === 228 /* ExportDeclaration */) {
                Logger_1.Logger.info("processImportStatements() found import");
                var moduleNameExpr = TsCore_1.TsCore.getExternalModuleName(node);
                if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
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
    BundleBuilder.prototype.emitModuleImportDeclaration = function (moduleBlockText) {
        Logger_1.Logger.info("Entering emitModuleImportDeclaration()");
        this.bundleText += moduleBlockText + "\n";
    };
    BundleBuilder.prototype.addSourceFile = function (file) {
        Logger_1.Logger.info("Entering addSourceFile() with: ", file.fileName);
        if (this.isCodeSourceFile(file)) {
            // Before adding the source text, we must white out import statement(s)
            var editText = this.processImportStatements(file);
            this.bundleText += editText + "\n";
            this.bundleImportedFiles[file.fileName] = file.fileName;
        }
        else {
            // Add d.ts files to the build source files context
            if (!Utilities_1.Utils.hasProperty(this.bundleSourceFiles, file.fileName)) {
                Logger_1.Logger.info("Adding definition file to bundle source context: ", file.fileName);
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
        var moduleNameExpr = TsCore_1.TsCore.getExternalModuleName(node);
        if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
            return this.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
        }
    };
    BundleBuilder.prototype.reportStatistics = function () {
        var statisticsReporter = new StatisticsReporter_1.StatisticsReporter();
        statisticsReporter.reportTime("Deps gen time", this.dependencyTime);
        statisticsReporter.reportTime("Deps walk time", this.dependencyWalkTime);
        statisticsReporter.reportTime("Source gen time", this.buildTime);
    };
    return BundleBuilder;
})();
exports.BundleBuilder = BundleBuilder;
//# sourceMappingURL=BundleBuilder.js.map