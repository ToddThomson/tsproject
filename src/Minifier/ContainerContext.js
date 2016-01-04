var Ast_1 = require("../Ast/Ast");
// TJT: Rename to Container?
var ContainerContext = (function () {
    function ContainerContext(node, containerFlags, parentContainer) {
        this.childContainers = [];
        // TJT: Review - do we need excluded symbols and names?
        this.namesExcluded = {};
        this.excludedIdentifiers = {};
        this.symbolTable = {};
        this.shortenedIdentifierCount = 0;
        this.containerFlags = containerFlags;
        if (containerFlags & 1 /* IsContainer */) {
            this.container = this.blockScopeContainer = node;
            this.isBlockScope = false;
            this.parent = this;
        }
        else if (containerFlags & 2 /* IsBlockScopedContainer */) {
            this.blockScopeContainer = node;
            this.isBlockScope = true;
            this.parent = parentContainer.getParent();
        }
    }
    ContainerContext.prototype.addChildContainer = function (container) {
        this.childContainers.push(container);
    };
    ContainerContext.prototype.getChildren = function () {
        return this.childContainers;
    };
    ContainerContext.prototype.getParent = function () {
        return this.parent;
    };
    // TJT: Rename to getContainer()?
    ContainerContext.prototype.getNode = function () {
        return this.isBlockScope ? this.blockScopeContainer : this.container;
    };
    // TJT: to be removed if not required
    ContainerContext.prototype.getLocals = function () {
        if (this.isBlockScope)
            return this.blockScopeContainer.locals;
        else
            return this.container.locals;
    };
    ContainerContext.prototype.isFunctionScoped = function () {
        if (this.containerFlags & (1 /* IsContainer */ | 5 /* IsContainerWithLocals */)) {
            return true;
        }
        return false;
    };
    return ContainerContext;
})();
exports.ContainerContext = ContainerContext;
//# sourceMappingURL=ContainerContext.js.map