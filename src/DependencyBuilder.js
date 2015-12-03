var Logger_1 = require("./Logger");
var Utilities_1 = require("./Utilities");
var TsCore_1 = require("./TsCore");
var ts = require("typescript");
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
                Logger_1.Logger.info("Import symbol file name: ", canonicalFileName);
                // Don't walk imports that we've already processed
                if (!Utilities_1.Utils.hasProperty(importWalked, canonicalFileName)) {
                    importWalked[canonicalFileName] = true;
                    // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    walkModuleImports(self.getImportsOfModule(importSymbolSourceFile));
                }
                if (!Utilities_1.Utils.hasProperty(dependencies, canonicalFileName)) {
                    Logger_1.Logger.info("Adding module import dependencies for file: ", canonicalFileName);
                    dependencies[canonicalFileName] = self.getImportsOfModule(importSymbolSourceFile);
                }
            });
        }
        // Get the top level imports
        var sourceFileImports = self.getImportsOfModule(sourceFile);
        // Walk the module import tree
        walkModuleImports(sourceFileImports);
        var canonicalSourceFileName = self.host.getCanonicalFileName(sourceFile.fileName);
        if (!Utilities_1.Utils.hasProperty(dependencies, canonicalSourceFileName)) {
            Logger_1.Logger.info("Adding top level import dependencies for file: ", canonicalSourceFileName);
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
                    Logger_1.Logger.info("Found import declaration");
                    var moduleNameExpr = TsCore_1.TsCore.getExternalModuleName(node);
                    if (moduleNameExpr && moduleNameExpr.kind === 9 /* StringLiteral */) {
                        var moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);
                        if (moduleSymbol) {
                            Logger_1.Logger.info("Adding import symbol: ", moduleSymbol.name, file.fileName);
                            importNodes.push(node);
                        }
                        else {
                            Logger_1.Logger.warn("Module symbol not found");
                        }
                    }
                }
                else if (node.kind === 218 /* ModuleDeclaration */ && node.name.kind === 9 /* StringLiteral */ && (node.flags & 2 /* Ambient */ || TsCore_1.TsCore.isDeclarationFile(file))) {
                    // An AmbientExternalModuleDeclaration declares an external module.
                    var moduleDeclaration = node;
                    Logger_1.Logger.info("Processing ambient module declaration: ", moduleDeclaration.name.text);
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
        var moduleNameExpr = TsCore_1.TsCore.getExternalModuleName(node);
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
//# sourceMappingURL=DependencyBuilder.js.map