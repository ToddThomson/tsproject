var ts = require("typescript");
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
//# sourceMappingURL=tscore.js.map