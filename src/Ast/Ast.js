var ts = require("typescript");
var Ast;
(function (Ast) {
    function isFunctionLike(node) {
        if (node) {
            switch (node.kind) {
                case 144 /* Constructor */:
                case 173 /* FunctionExpression */:
                case 213 /* FunctionDeclaration */:
                case 174 /* ArrowFunction */:
                case 143 /* MethodDeclaration */:
                case 142 /* MethodSignature */:
                case 145 /* GetAccessor */:
                case 146 /* SetAccessor */:
                case 147 /* CallSignature */:
                case 148 /* ConstructSignature */:
                case 149 /* IndexSignature */:
                case 152 /* FunctionType */:
                case 153 /* ConstructorType */:
                    return true;
            }
        }
        return false;
    }
    Ast.isFunctionLike = isFunctionLike;
    function getContainerFlags(node) {
        switch (node.kind) {
            case 186 /* ClassExpression */:
            case 214 /* ClassDeclaration */:
            case 215 /* InterfaceDeclaration */:
            case 217 /* EnumDeclaration */:
            case 155 /* TypeLiteral */:
            case 165 /* ObjectLiteralExpression */:
                return 1 /* IsContainer */;
            case 147 /* CallSignature */:
            case 148 /* ConstructSignature */:
            case 149 /* IndexSignature */:
            case 143 /* MethodDeclaration */:
            case 142 /* MethodSignature */:
            case 213 /* FunctionDeclaration */:
            case 144 /* Constructor */:
            case 145 /* GetAccessor */:
            case 146 /* SetAccessor */:
            case 152 /* FunctionType */:
            case 153 /* ConstructorType */:
            case 173 /* FunctionExpression */:
            case 174 /* ArrowFunction */:
            case 218 /* ModuleDeclaration */:
            case 248 /* SourceFile */:
            case 216 /* TypeAliasDeclaration */:
                return 5 /* IsContainerWithLocals */;
            case 244 /* CatchClause */:
            case 199 /* ForStatement */:
            case 200 /* ForInStatement */:
            case 201 /* ForOfStatement */:
            case 220 /* CaseBlock */:
                return 2 /* IsBlockScopedContainer */;
            case 192 /* Block */:
                // do not treat blocks directly inside a function as a block-scoped-container.
                // Locals that reside in this block should go to the function locals. Othewise 'x'
                // would not appear to be a redeclaration of a block scoped local in the following
                // example:
                //
                //      function foo() {
                //          var x;
                //          let x;
                //      }
                //
                // If we placed 'var x' into the function locals and 'let x' into the locals of
                // the block, then there would be no collision.
                //
                // By not creating a new block-scoped-container here, we ensure that both 'var x'
                // and 'let x' go into the Function-container's locals, and we do get a collision
                // conflict.
                return isFunctionLike(node.parent) ? 0 /* None */ : 2 /* IsBlockScopedContainer */;
        }
        return 0 /* None */;
    }
    Ast.getContainerFlags = getContainerFlags;
    function isBlockScopedVariable(node) {
        var parentNode = (node.kind === 211 /* VariableDeclaration */)
            ? node.parent
            : node.declarationList;
        return isNodeFlagSet(parentNode, 16384 /* Let */)
            || isNodeFlagSet(parentNode, 32768 /* Const */);
    }
    Ast.isBlockScopedVariable = isBlockScopedVariable;
    function isBlockScopedBindingElement(node) {
        var variableDeclaration = getBindingElementVariableDeclaration(node);
        // if no variable declaration, it must be a function param, which is block scoped
        return (variableDeclaration == null) || isBlockScopedVariable(variableDeclaration);
    }
    Ast.isBlockScopedBindingElement = isBlockScopedBindingElement;
    function getBindingElementVariableDeclaration(node) {
        var currentParent = node.parent;
        while (currentParent.kind !== 211 /* VariableDeclaration */) {
            if (currentParent.parent == null) {
                return null; // function parameter, no variable declaration
            }
            else {
                currentParent = currentParent.parent;
            }
        }
        return currentParent;
    }
    Ast.getBindingElementVariableDeclaration = getBindingElementVariableDeclaration;
    function isNodeFlagSet(node, flagToCheck) {
        return (node.flags & flagToCheck) !== 0;
    }
    Ast.isNodeFlagSet = isNodeFlagSet;
    function isKeyword(token) {
        return 70 /* FirstKeyword */ <= token && token <= 134 /* LastKeyword */;
    }
    Ast.isKeyword = isKeyword;
    function isTrivia(token) {
        return 2 /* FirstTriviaToken */ <= token && token <= 7 /* LastTriviaToken */;
    }
    Ast.isTrivia = isTrivia;
    function displaySymbolFlags(flags) {
        if (flags & 1 /* FunctionScopedVariable */) {
            console.log("Symbol flag: FunctionScopedVariable");
        }
        if (flags & 2 /* BlockScopedVariable */) {
            console.log("Symbol flag: BlockScopedVariable ");
        }
        if (flags & 4 /* Property */) {
            console.log("Symbol flag: Property");
        }
        if (flags & 8 /* EnumMember */) {
            console.log("Symbol flag: EnumMember");
        }
        if (flags & 16 /* Function */) {
            console.log("Symbol flag: Function");
        }
        if (flags & 32 /* Class */) {
            console.log("Symbol flag: Class");
        }
        if (flags & 64 /* Interface */) {
            console.log("Symbol flag: Interface");
        }
        if (flags & 128 /* ConstEnum */) {
            console.log("Symbol flag: ConstEnum");
        }
        if (flags & 256 /* RegularEnum */) {
            console.log("Symbol flag: RegularEnum");
        }
        if (flags & 512 /* ValueModule */) {
            console.log("Symbol flag: ValueModule");
        }
        if (flags & 1024 /* NamespaceModule */) {
            console.log("Symbol flag: NamespaceModule");
        }
        if (flags & 2048 /* TypeLiteral */) {
            console.log("Symbol flag: TypeLiteral");
        }
        if (flags & 4096 /* ObjectLiteral */) {
            console.log("Symbol flag: ObjectLiteral");
        }
        if (flags & 8192 /* Method */) {
            console.log("Symbol flag: Method");
        }
        if (flags & 16384 /* Constructor */) {
            console.log("Symbol flag: Constructor");
        }
        if (flags & 32768 /* GetAccessor */) {
            console.log("Symbol flag: GetAccessor");
        }
        if (flags & 65536 /* SetAccessor */) {
            console.log("Symbol flag: SetAccessor");
        }
        if (flags & 131072 /* Signature */) {
            console.log("Symbol flag: Signature");
        }
        if (flags & 262144 /* TypeParameter */) {
            console.log("Symbol flag: TypeParameter");
        }
        if (flags & 524288 /* TypeAlias */) {
            console.log("Symbol flag: TypeAlias");
        }
        if (flags & 1048576 /* ExportValue */) {
            console.log("Symbol flag: ExportValue");
        }
        if (flags & 2097152 /* ExportType */) {
            console.log("Symbol flag: ExportType");
        }
        if (flags & 4194304 /* ExportNamespace */) {
            console.log("Symbol flag: ExportNamespace");
        }
        if (flags & 8388608 /* Alias */) {
            console.log("Symbol flag: Alias");
        }
        if (flags & 16777216 /* Instantiated */) {
            console.log("Symbol flag: Instantiated");
        }
        if (flags & 33554432 /* Merged */) {
            console.log("Symbol flag: Merged");
        }
        if (flags & 67108864 /* Transient */) {
            console.log("Symbol flag: Transient");
        }
        if (flags & 134217728 /* Prototype */) {
            console.log("Symbol flag: Prototype");
        }
        if (flags & 268435456 /* SyntheticProperty */) {
            console.log("Symbol flag: SyntheticProperty");
        }
        if (flags & 536870912 /* Optional */) {
            console.log("Symbol flag: Optional");
        }
        if (flags & 1073741824 /* ExportStar */) {
            console.log("Symbol flag: ExportStar");
        }
    }
    Ast.displaySymbolFlags = displaySymbolFlags;
    function displayNodeFlags(flags) {
        if (flags & 1 /* Export */) {
            console.log("Node flag: Export");
        }
        if (flags & 2 /* Ambient */) {
            console.log("Node flag: Ambient");
        }
        if (flags & 16 /* Public */) {
            console.log("Node Flag: Public");
        }
        if (flags & 32 /* Private */) {
            console.log("Node Flag: Private");
        }
        if (flags & 128 /* Static */) {
            console.log("Node Flag: Static");
        }
        if (flags & 256 /* Abstract */) {
            console.log("Node Flag: Abstract");
        }
        if (flags & 512 /* Async */) {
            console.log("Node Flag: Async");
        }
        if (flags & 1024 /* Default */) {
            console.log("Node Flag: Default");
        }
        if (flags & 2048 /* MultiLine */) {
            console.log("Node Flag: MultiLine");
        }
        if (flags & 4096 /* Synthetic */) {
            console.log("Node Flag: Synthetic");
        }
        if (flags & 8192 /* DeclarationFile */) {
            console.log("Node Flag: DeclarationFile");
        }
        if (flags & 16384 /* Let */) {
            console.log("Node Flag: Let");
        }
        if (flags & 32768 /* Const */) {
            console.log("Node Flag: Const");
        }
        if (flags & 65536 /* OctalLiteral */) {
            console.log("Node Flag: OctalLiteral");
        }
        if (flags & 131072 /* Namespace */) {
            console.log("Node Flag: Namespace");
        }
        if (flags & 262144 /* ExportContext */) {
            console.log("Node Flag: ExportContext");
        }
        if (flags & 524288 /* ContainsThis */) {
            console.log("Node Flag: ContainsThis");
        }
        if (flags & 2035 /* Modifier */) {
            console.log("Node Flag: Modifier");
        }
        if (flags & 112 /* AccessibilityModifier */) {
            console.log("Node Flag: AccessibilityModifier");
        }
        if (flags & 49152 /* BlockScoped */) {
            console.log("Node Flag: BlockScoped");
        }
    }
    Ast.displayNodeFlags = displayNodeFlags;
})(Ast = exports.Ast || (exports.Ast = {}));
//# sourceMappingURL=Ast.js.map