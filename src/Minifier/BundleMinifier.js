var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ts = require("typescript");
var NodeWalker_1 = require("../Ast/NodeWalker");
var Ast_1 = require("../Ast/Ast");
var StatisticsReporter_1 = require("../Reporting/StatisticsReporter");
var Logger_1 = require("../Reporting/Logger");
var NameGenerator_1 = require("./NameGenerator");
var ContainerContext_1 = require("./ContainerContext");
var IdentifierSymbolInfo_1 = require("./IdentifierSymbolInfo");
var Debug_1 = require("../Utils/Debug");
var Utilities_1 = require("../Utils/Utilities");
var BundleMinifier = (function (_super) {
    __extends(BundleMinifier, _super);
    function BundleMinifier(program, compilerOptions) {
        _super.call(this);
        this.allIdentifierSymbols = {};
        this.identifierCount = 0;
        this.shortenedIdentifierCount = 0;
        this.program = program;
        this.checker = program.getTypeChecker();
        this.compilerOptions = compilerOptions;
        this.containerStack = [];
        this.nameGenerator = new NameGenerator_1.NameGenerator();
    }
    BundleMinifier.prototype.transform = function (bundleSourceFile) {
        this.bundleSourceFile = bundleSourceFile;
        return this.processBundleIdentifiers(bundleSourceFile);
    };
    BundleMinifier.prototype.removeWhitespace = function (jsContents) {
        this.whiteSpaceTime = new Date().getTime();
        this.whiteSpaceBefore = jsContents.length;
        var output = "";
        var prevToken = 0 /* Unknown */;
        var token;
        var scanner = ts.createScanner(1 /* ES5 */, /* skipTrivia */ false, 0 /* Standard */, jsContents);
        while ((token = scanner.scan()) !== 1 /* EndOfFileToken */) {
            switch (token) {
                case 5 /* WhitespaceTrivia */:
                    // Remove whitespace when appropriate
                    if (Ast_1.Ast.isKeyword(prevToken)) {
                        var tokenText = scanner.getTokenText();
                        output += tokenText;
                    }
                    break;
                case 4 /* NewLineTrivia */:
                    // Remove newline ( don't output )
                    break;
                default:
                    if (Ast_1.Ast.isKeyword(token) && (prevToken === 5 /* WhitespaceTrivia */)) {
                        // A keyword must have a leading space
                        output += " ";
                    }
                    output += scanner.getTokenText();
                    break;
            }
            prevToken = token;
        }
        this.whiteSpaceAfter = output.length;
        this.whiteSpaceTime = new Date().getTime() - this.whiteSpaceTime;
        if (this.compilerOptions.diagnostics)
            this.reportWhitespaceStatistics();
        return output;
    };
    BundleMinifier.prototype.visitNode = function (node) {
        if (this.isNextContainer(node)) {
            // Recursively vist container nodes to build identifier tree
            _super.prototype.visitNode.call(this, node);
            this.restoreContainer();
        }
        else {
            switch (node.kind) {
                case 69 /* Identifier */:
                    var identifier = node;
                    var nodeFlags = identifier.flags;
                    var identifierSymbol = this.checker.getSymbolAtLocation(identifier);
                    if (identifierSymbol) {
                        var symbolId = identifierSymbol.id;
                        if (symbolId !== undefined) {
                            var uniqueIdentifierName = symbolId.toString();
                            // Check to see if we've seen this identifer symbol before
                            if (Utilities_1.Utils.hasProperty(this.allIdentifierSymbols, uniqueIdentifierName)) {
                                // then add it to the symbol's identifier list 
                                var prevAddedIdentifier = this.allIdentifierSymbols[uniqueIdentifierName];
                                //Logger.log( "Identifier has already been added to the current or previous container: ", uniqueSymbolName, identifierSymbol.name );
                                this.allIdentifierSymbols[uniqueIdentifierName].refs.push(identifier);
                                // If the previously added identifier has not been seen in the current container then it has already
                                // been added to a parent/different container. It therefore must be excluded in the current container.
                                if (!Utilities_1.Utils.hasProperty(this.currentContainer().symbolTable, uniqueIdentifierName)) {
                                    // Add this identifier to the list of excluded names in the current container
                                    this.currentContainer().excludedIdentifiers[uniqueIdentifierName] = prevAddedIdentifier;
                                    if ((!prevAddedIdentifier.isBlockScopedVariable) || (this.compilerOptions.target === 1 /* ES5 */)) {
                                        // For function scoped identifiers we must exclude the identifier from the current container parent 
                                        // or the top of the container chain. Note that for ES5, which doesn't have block scoped variables, we also
                                        // exclude the identifier from the parent container.
                                        this.currentContainer().getParent().excludedIdentifiers[uniqueIdentifierName] = prevAddedIdentifier;
                                    }
                                }
                            }
                            else {
                                //Logger.log( "New symbol name identifier: ", identifierSymbol.name );
                                var identifierInfo = new IdentifierSymbolInfo_1.IdentifierInfo(identifier, identifierSymbol);
                                // Add the new identifier to both the container symbols and the overall list
                                this.currentContainer().symbolTable[uniqueIdentifierName] = identifierInfo;
                                this.allIdentifierSymbols[uniqueIdentifierName] = identifierInfo;
                                // We can't shorten identifier names that are 1 character in length AND
                                // we can't risk the chance that an identifier name will be replaced with a 2 char
                                // shortened name due to the constraint that the names are changed in place
                                var identifierName = identifierSymbol.getName();
                                if (identifierName.length === 1) {
                                    identifierInfo.shortenedName = identifierName;
                                    this.currentContainer().namesExcluded[identifierSymbol.getName()] = true;
                                }
                                this.identifierCount++;
                            }
                        }
                        else {
                        }
                    }
                    else {
                    }
                    break;
                default:
            }
            _super.prototype.visitNode.call(this, node);
        }
    };
    BundleMinifier.prototype.processBundleIdentifiers = function (sourceFile) {
        this.transformTime = new Date().getTime();
        // Walk the sourceFile to build the source file identifier tree
        this.walk(sourceFile);
        this.shortenContainerIdentifiers(this.sourceFileContainer);
        this.transformTime = new Date().getTime() - this.transformTime;
        if (this.compilerOptions.diagnostics)
            this.reportMinifyStatistics();
        return sourceFile;
    };
    BundleMinifier.prototype.shortenContainerIdentifiers = function (container) {
        // For ES5 generated javascript we must guard against using block scoped variable as they cannot
        // be handled by the Typescript compiler at this stage.
        if (this.compilerOptions.target === 1 /* ES5 */) {
            if (container.isFunctionScoped()) {
                this.nameGenerator.reset();
            }
        }
        else {
            // ES6 additionally supports block scoped identifiers - reset name generator per container
            this.nameGenerator.reset();
        }
        // Determine identifier names which cannot be used..
        var excludedSymbol;
        // Exclude all identifier names that were seen in parent containers or were 1 char in length
        for (var excludedSymbolKey in container.excludedIdentifiers) {
            excludedSymbol = container.excludedIdentifiers[excludedSymbolKey];
            if (excludedSymbol.shortenedName) {
                //Logger.log( "Excluding identifier name for: ", excludedSymbol.getName(), excludedSymbol.shortenedName );
                container.namesExcluded[excludedSymbol.shortenedName] = true;
            }
            else {
            }
        }
        // Exclude all identifier names that have been seen in the parent/function scoped container...
        var parentContainer = container.getParent();
        if (parentContainer) {
            for (var excludedInParentKey in parentContainer.excludedIdentifiers) {
                excludedSymbol = parentContainer.excludedIdentifiers[excludedInParentKey];
                if (excludedSymbol.shortenedName) {
                    //Logger.log( "Excluding identifier name for: ", excludedSymbol.getName(), excludedSymbol.shortenedName );
                    container.namesExcluded[excludedSymbol.shortenedName] = true;
                }
                else {
                }
            }
        }
        // TJT: This block is prob. not needed? Remove after determining.
        //for ( let i = 0; i < containerChildren.length; i++ ) {
        //    let childContainer = containerChildren[i];
        //    for ( let excludedSymbolKey in childContainer.excludedIdentifiers ) {
        //        let excludedSymbol = childContainer.excludedIdentifiers[excludedSymbolKey];
        //        if ( excludedSymbol.getName() === "editText" ) {
        //            Logger.log( "break" );
        //        }
        //        if ( excludedSymbol.shortenedName ) {
        //            container.namesExcluded[excludedSymbol.shortenedName] = true;
        //        }
        //        else {
        //            Logger.log( "Excluding symbol does not have a shortened name: ", excludedSymbol.getName() );
        //        }
        //    }
        //}
        // First process local container identifiers
        for (var symbolKey in container.symbolTable) {
            var identifierSymbol = container.symbolTable[symbolKey];
            this.processIdentifierSymbolInfo(container, identifierSymbol);
        }
        // Recursively go through container children in order added
        var containerChildren = container.getChildren();
        for (var j = 0; j < containerChildren.length; j++) {
            this.shortenContainerIdentifiers(containerChildren[j]);
        }
    };
    BundleMinifier.prototype.processIdentifierSymbolInfo = function (container, identifierInfo) {
        // Case 1: BlockScopedVariables
        var _this = this;
        if (identifierInfo.isBlockScopedVariable()) {
            var shortenedName = this.getShortenedIdentifierName(container, identifierInfo);
            Logger_1.Logger.info("Block scoped var renamed: ", identifierInfo.getName(), shortenedName);
            Utilities_1.Utils.forEach(identifierInfo.refs, function (identifier) {
                _this.setIdentifierText(identifier, shortenedName);
            });
            return;
        }
        // TODO: ...
        // Case 2: FunctionScopedVariables )
    };
    BundleMinifier.prototype.getShortenedIdentifierName = function (container, identifierInfo) {
        // Identifier names are shortened in place. They must be the same length or smaller than the original name.
        if (!identifierInfo.shortenedName) {
            var identifierName = identifierInfo.getName();
            if (identifierName.length === 1) {
                // Just reuse the original name for 1 char names
                identifierInfo.shortenedName = identifierName;
            }
            else {
                // Loop until we have a valid shortened name
                // The shortened name MUST be the same length or less
                while (true) {
                    var shortenedName = this.nameGenerator.getName();
                    Debug_1.Debug.assert(shortenedName.length <= identifierName.length);
                    if (!Utilities_1.Utils.hasProperty(container.namesExcluded, shortenedName)) {
                        identifierInfo.shortenedName = shortenedName;
                        break;
                    }
                    else {
                        Logger_1.Logger.info("Generated name was excluded: ", shortenedName, identifierName);
                    }
                }
                this.shortenedIdentifierCount++;
            }
        }
        return identifierInfo.shortenedName;
    };
    BundleMinifier.prototype.setIdentifierText = function (identifier, text) {
        identifier.text = text;
        // The identifier text to write to the file has a starting and ending space
        text = " " + text + " ";
        identifier.end = identifier.pos + text.length - 1;
        for (var i = 0; i < text.length; i++) {
            this.bundleSourceFile.text = Utilities_1.Utils.replaceAt(this.bundleSourceFile.text, identifier.pos + i, text[i]);
        }
    };
    BundleMinifier.prototype.analyzeContainerIdentifiers = function () {
        var _this = this;
        // Sort the symbolMap
        var symbolTableKeys = Object.keys(this.currentContainer().symbolTable);
        var identifierCount = symbolTableKeys.length;
        Logger_1.Logger.log("Identifier count: ", identifierCount);
        // There can be up to 54 single character identifier names
        // There can be up to 64 * 54 = 3456 double char identifier names
        var singleLetterNames = identifierCount % 54;
        var doubleLetterNames = identifierCount - singleLetterNames;
        var averageRatio = ((2 * doubleLetterNames) + singleLetterNames) / identifierCount;
        Logger_1.Logger.log("Compression ratio: ", averageRatio);
        var symbolTable = this.currentContainer().symbolTable;
        symbolTableKeys.sort(function (a, b) {
            var bSpace = symbolTable[b].refs.length * (symbolTable[b].getName().length - averageRatio);
            var aSpace = symbolTable[a].refs.length * (symbolTable[a].getName().length - averageRatio);
            return (bSpace - aSpace);
        });
        var totalOriginalSpace = 0;
        var totalCompressedSpace = 0;
        var symbolIndex = 0;
        symbolTableKeys.forEach(function (key) {
            var symbolInfo = _this.currentContainer().symbolTable[key];
            symbolInfo.shortenedName = _this.nameGenerator.getName();
            var originalSpace = (symbolInfo.getName().length * symbolInfo.refs.length);
            var compressedSpace = (symbolInfo.shortenedName.length * symbolInfo.refs.length);
            Logger_1.Logger.log("Compression of symbol: ", symbolInfo.getName(), originalSpace, compressedSpace, originalSpace - compressedSpace);
            totalOriginalSpace += originalSpace;
            totalCompressedSpace += compressedSpace;
        });
        Logger_1.Logger.log("Total Compression: ", totalOriginalSpace, totalCompressedSpace);
    };
    BundleMinifier.prototype.currentContainer = function () {
        return this.containerStack[this.containerStack.length - 1];
    };
    BundleMinifier.prototype.restoreContainer = function () {
        //Logger.log( "Restoring container" );
        return this.containerStack.pop();
    };
    BundleMinifier.prototype.isNextContainer = function (node) {
        var containerFlags = Ast_1.Ast.getContainerFlags(node);
        if (containerFlags & (1 /* IsContainer */ | 2 /* IsBlockScopedContainer */)) {
            //Logger.log( "Next Container" );
            var nextContainer = new ContainerContext_1.ContainerContext(node, containerFlags, this.currentContainer());
            // Before changing the current container we must first add the new container to the children of the current container.
            var currentContainer = this.currentContainer();
            // If we don't have a container yet then it is the source file container ( the first )
            if (!currentContainer) {
                this.sourceFileContainer = nextContainer;
            }
            else {
                // Add new container context to the exising current container
                currentContainer.addChildContainer(nextContainer);
            }
            this.containerStack.push(nextContainer);
            return true;
        }
        //Logger.log( "Not a container node: ", node.kind );
        return false;
    };
    BundleMinifier.prototype.reportWhitespaceStatistics = function () {
        var statisticsReporter = new StatisticsReporter_1.StatisticsReporter();
        statisticsReporter.reportTime("Whitespace time", this.whiteSpaceTime);
        statisticsReporter.reportPercentage("Whitespace reduction", ((this.whiteSpaceBefore - this.whiteSpaceAfter) / this.whiteSpaceBefore) * 100.00);
    };
    BundleMinifier.prototype.reportMinifyStatistics = function () {
        var statisticsReporter = new StatisticsReporter_1.StatisticsReporter();
        statisticsReporter.reportTime("Minify time", this.transformTime);
        statisticsReporter.reportCount("Total identifiers", this.identifierCount);
        statisticsReporter.reportCount("Identifiers shortened", this.shortenedIdentifierCount);
        //statisticsReporter.reportPercentage( "shortened", ( ( this.IdentifierSpaceBefore - this.whiteSpaceAfter ) / this.whiteSpaceBefore ) * 100.00 );
    };
    return BundleMinifier;
})(NodeWalker_1.NodeWalker);
exports.BundleMinifier = BundleMinifier;
//# sourceMappingURL=BundleMinifier.js.map