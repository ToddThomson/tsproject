var ts = require("typescript");
var CompilerServices;
(function (CompilerServices) {
    function createWatchedSourceFile(fileName, text, scriptTarget, string, setNodeParents) {
        var sourceFile = ts.createSourceFile(fileName, text, scriptTarget, setNodeParents);
        return sourceFile;
    }
    CompilerServices.createWatchedSourceFile = createWatchedSourceFile;
})(CompilerServices = exports.CompilerServices || (exports.CompilerServices = {}));
//# sourceMappingURL=CompilerServices.js.map