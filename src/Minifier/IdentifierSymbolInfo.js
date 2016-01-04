var ts = require("typescript");
var IdentifierInfo = (function () {
    function IdentifierInfo(identifier, symbol) {
        this.shortenedName = undefined;
        this.identifier = identifier;
        this.symbol = symbol;
        this.refs = [identifier];
    }
    IdentifierInfo.prototype.getName = function () {
        return this.symbol.name;
    };
    IdentifierInfo.prototype.getId = function () {
        return this.symbol.id;
    };
    IdentifierInfo.prototype.getUniqueName = function () {
        return this.getId().toString();
    };
    IdentifierInfo.prototype.isVariable = function () {
        var variableDeclaration = this.getVariableDeclaration();
        if (variableDeclaration)
            return true;
        return false;
    };
    IdentifierInfo.prototype.isFunction = function () {
        var functionDeclaration = this.getFunctionDeclaration();
        if (functionDeclaration)
            return true;
        return false;
    };
    IdentifierInfo.prototype.isBlockScopedVariable = function () {
        var variableDeclaration = this.getVariableDeclaration();
        if (variableDeclaration) {
            return ((variableDeclaration.parent.flags & 16384 /* Let */) !== 0) ||
                ((variableDeclaration.parent.flags & 32768 /* Const */) !== 0);
        }
        return false;
    };
    IdentifierInfo.prototype.getVariableDeclaration = function () {
        if (this.symbol.name === "pathLen") {
            var logger = 1;
        }
        switch (this.identifier.parent.kind) {
            case 211 /* VariableDeclaration */:
                return this.identifier.parent;
                break;
            case 212 /* VariableDeclarationList */:
                break;
            case 193 /* VariableStatement */:
                break;
        }
        return null;
    };
    IdentifierInfo.prototype.getFunctionDeclaration = function () {
        var currentParent = this.identifier.parent;
        // function parameter, no variable declaration
        while (currentParent.kind !== 213 /* FunctionDeclaration */) {
            if (currentParent.parent == null) {
                return null;
            }
            else {
                currentParent = currentParent.parent;
            }
        }
        return currentParent;
    };
    IdentifierInfo.prototype.isVisible = function () {
        return true;
    };
    return IdentifierInfo;
})();
exports.IdentifierInfo = IdentifierInfo;
//# sourceMappingURL=IdentifierSymbolInfo.js.map