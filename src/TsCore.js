var ts = require("typescript");
function getExternalModuleName(node) {
    if (node.kind === 210 /* ImportDeclaration */) {
        return node.moduleSpecifier;
    }
    if (node.kind === 209 /* ImportEqualsDeclaration */) {
        var reference = node.moduleReference;
        if (reference.kind === 220 /* ExternalModuleReference */) {
            return reference.expression;
        }
    }
    if (node.kind === 216 /* ExportDeclaration */) {
        return node.moduleSpecifier;
    }
}
exports.getExternalModuleName = getExternalModuleName;
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
exports.createDiagnostic = createDiagnostic;
function formatStringFromArgs(text, args, baseIndex) {
    baseIndex = baseIndex || 0;
    return text.replace(/{(\d+)}/g, function (match, index) {
        return args[+index + baseIndex];
    });
}
function isDeclarationFile(file) {
    return (file.flags & 2048 /* DeclarationFile */) !== 0;
}
exports.isDeclarationFile = isDeclarationFile;
function normalizeSlashes(path) {
    return path.replace(/\\/g, "/");
}
exports.normalizeSlashes = normalizeSlashes;
function outputExtension(path) {
    return path.replace(/\.ts/, ".js");
}
exports.outputExtension = outputExtension;
//# sourceMappingURL=TsCore.js.map