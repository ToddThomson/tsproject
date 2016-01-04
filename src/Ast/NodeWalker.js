var ts = require("typescript");
var NodeWalker = (function () {
    function NodeWalker() {
    }
    NodeWalker.prototype.walk = function (node) {
        this.visitNode(node);
    };
    NodeWalker.prototype.visitNode = function (node) {
        this.walkChildren(node);
    };
    NodeWalker.prototype.walkChildren = function (node) {
        var _this = this;
        ts.forEachChild(node, function (child) { return _this.visitNode(child); });
    };
    return NodeWalker;
})();
exports.NodeWalker = NodeWalker;
//# sourceMappingURL=NodeWalker.js.map