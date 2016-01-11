import ts = require( "typescript" );

import { BundleFile } from "../Bundler/BundleResult";
import { NodeWalker } from "../Ast/NodeWalker";
import { Ast } from "../Ast/Ast";
import { AstTransform } from "../Ast/AstTransform";
import { StatisticsReporter } from "../Reporting/StatisticsReporter";
import { Logger } from "../Reporting/Logger";
import { NameGenerator } from "./NameGenerator";
import { ContainerContext } from "./ContainerContext";
import { IdentifierInfo } from "./IdentifierSymbolInfo";
import { Debug } from "../Utils/Debug";
import { Utils } from "../Utils/Utilities";
import { TsCore } from "../Utils/TsCore";

export class BundleMinifier extends NodeWalker implements AstTransform {
    private bundleSourceFile: ts.SourceFile;
    private program: ts.Program;
    private checker: ts.TypeChecker;
    private compilerOptions: ts.CompilerOptions;

    private containerStack: ContainerContext[] = [];
    private classifiableContainers: ts.Map<ContainerContext> = {};
    private allIdentifierSymbols: ts.Map<IdentifierInfo> = {};
    private sourceFileContainer: ContainerContext;
    private nameGenerator: NameGenerator;

    private whiteSpaceBefore: number;
    private whiteSpaceAfter: number;

    private whiteSpaceTime: number;
    private transformTime: number;

    private identifierCount = 0;
    private shortenedIdentifierCount = 0;

    constructor( program: ts.Program, compilerOptions: ts.CompilerOptions ) {
        super();

        this.program = program;
        this.checker = program.getTypeChecker();
        this.compilerOptions = compilerOptions;
        this.containerStack = [];
        this.nameGenerator = new NameGenerator();
    }

    public transform( bundleSourceFile: ts.SourceFile ): ts.SourceFile {

        this.bundleSourceFile = bundleSourceFile;

        return this.processBundleIdentifiers( bundleSourceFile );
    }

    public removeWhitespace( jsContents: string ): string {

        this.whiteSpaceTime = new Date().getTime();
        this.whiteSpaceBefore = jsContents.length;

        let output = "";
        let prevToken = ts.SyntaxKind.Unknown;
        let token: ts.SyntaxKind;

        const scanner = ts.createScanner( ts.ScriptTarget.ES5, /* skipTrivia */ false, ts.LanguageVariant.Standard, jsContents );

        while ( ( token = scanner.scan() ) !== ts.SyntaxKind.EndOfFileToken ) {
            switch ( token ) {
                case ts.SyntaxKind.WhitespaceTrivia:
                    // Remove whitespace when appropriate
                    if ( Ast.isKeyword( prevToken ) ) {
                        let tokenText = scanner.getTokenText();
                        output += tokenText;
                    }

                    break;

                case ts.SyntaxKind.NewLineTrivia:
                    // Remove newline ( don't output )
                    break;

                default:
                    if ( Ast.isKeyword( token ) && ( prevToken === ts.SyntaxKind.WhitespaceTrivia ) ) {
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

        if ( this.compilerOptions.diagnostics )
            this.reportWhitespaceStatistics();

        // TJT: Fixme - leave whitespace elimination out for testing in rc releases.
        return jsContents; //output;
    }

    protected visitNode( node: ts.Node ): void {
        if ( this.isNextContainer( node ) ) {
            // Recursively vist container nodes to build identifier info tree
            super.visitNode( node );

            this.restoreContainer();
        }
        else {
            switch ( node.kind ) {
                case ts.SyntaxKind.Identifier:
                    let identifier: ts.Identifier = <ts.Identifier>node;
                    let identifierSymbol: ts.Symbol = this.checker.getSymbolAtLocation( identifier );

                    if ( identifierSymbol ) {

                        if ( identifierSymbol.getName() === "BaseClass" ) {
                            Logger.log( "break BaseClass" );
                        }

                        let symbolId: number = ( <any>identifierSymbol ).id;

                        if ( symbolId !== undefined ) {
                            // Logger.log( "Identifier found: ", identifierSymbol.name, symbolId );
                            let uniqueIdentifierName = symbolId.toString();

                            // Check to see if we've seen this identifer symbol before
                            if ( Utils.hasProperty( this.allIdentifierSymbols, uniqueIdentifierName ) ) {
                                // then add it to the symbol's identifier list 
                                let prevAddedIdentifier = this.allIdentifierSymbols[uniqueIdentifierName];
                                //Logger.log( "Identifier has already been added to the current or previous container: ", uniqueSymbolName, identifierSymbol.name );
                                this.allIdentifierSymbols[uniqueIdentifierName].refs.push( identifier );
                                
                                // If the previously added identifier has not been seen in the current container then it has already
                                // been added to a parent/different container. It therefore must be excluded in the current container.
                                if ( !Utils.hasProperty( this.currentContainer().symbolTable, uniqueIdentifierName ) ) {
                                    // Add this identifier to the list of excluded names in the current container
                                    this.currentContainer().excludedIdentifiers[uniqueIdentifierName] = prevAddedIdentifier;

                                    if ( ( !prevAddedIdentifier.isBlockScopedVariable ) || ( this.compilerOptions.target === ts.ScriptTarget.ES5 ) ) {
                                        // For function scoped identifiers we must exclude the identifier from the current container parent 
                                        // or the top of the container chain. Note that for ES5, which doesn't have block scoped variables, we also
                                        // exclude the identifier from the parent container.
                                        this.currentContainer().getParent().excludedIdentifiers[uniqueIdentifierName] = prevAddedIdentifier;
                                    }
                                }
                            }
                            else {
                                //Logger.log( "New symbol name identifier: ", identifierSymbol.name );
                                let identifierInfo = new IdentifierInfo( identifier, identifierSymbol );

                                // Add the new identifier to both the container symbols and the overall list
                                this.currentContainer().symbolTable[uniqueIdentifierName] = identifierInfo;
                                this.allIdentifierSymbols[uniqueIdentifierName] = identifierInfo;

                                // We can't shorten identifier names that are 1 character in length AND
                                // we can't risk the chance that an identifier name will be replaced with a 2 char
                                // shortened name due to the constraint that the names are changed in place
                                let identifierName = identifierSymbol.getName();
                                if ( identifierName.length === 1 ) {
                                    identifierInfo.shortenedName = identifierName;
                                    this.currentContainer().namesExcluded[identifierSymbol.getName()] = true;
                                }

                                this.identifierCount++;
                            }
                        }
                        else {
                            // TJT: TODO..
                            // If an identifier symbol does not have an id then it has no references or is a transient.
                            // We can ignore transient, but unreferenced symbols may possibly be optimized.
                            //if ( identifierSymbol.flags & ts.SymbolFlags.Transient ) {
                            //}
                            //else {
                                //Logger.log( "Symbol does not have an id: ", identifierSymbol.name );
                                //Ast.displaySymbolFlags( identifierSymbol.flags );
                            //}
                        }
                    }
                    else {
                        //Logger.log( "Identifier does not have symbol", identifier.text );
                    }

                    break;

                default:
                    //Logger.log( "Non identifier node: ", node.kind );
            }

            super.visitNode( node );
        }
    }

    private processBundleIdentifiers( sourceFile: ts.SourceFile ): ts.SourceFile {
        this.transformTime = new Date().getTime();

        // Walk the sourceFile to build the source file identifier tree
        this.walk( sourceFile );

        this.shortenContainerIdentifiers( this.sourceFileContainer );

        this.transformTime = new Date().getTime() - this.transformTime;

        if ( this.compilerOptions.diagnostics )
            this.reportMinifyStatistics();

        return sourceFile;
    }

    private shortenContainerIdentifiers( container: ContainerContext ): void {
        //Logger.log( "Shortening container identifiers.." );

        // Determine identifier names which cannot be used..
        let excludedSymbol: IdentifierInfo;

        // Exclude all identifier names that were seen in parent containers or were 1 char in length
        for ( let excludedSymbolKey in container.excludedIdentifiers ) {
            excludedSymbol = container.excludedIdentifiers[excludedSymbolKey];

            if ( excludedSymbol.shortenedName ) {
                //Logger.log( "Excluding identifier name for: ", excludedSymbol.getName(), excludedSymbol.shortenedName );
                container.namesExcluded[excludedSymbol.shortenedName] = true;
            }
            else {
                //Logger.log( "Excluding symbol does not have a shortened name: ", excludedSymbol.getName() );
            }
        }

        // Exclude all identifier names that have been seen in the parent/function scoped container...
        let parentContainer = container.getParent();

        if ( parentContainer ) {
            for ( let excludedInParentKey in parentContainer.excludedIdentifiers ) {
                excludedSymbol = parentContainer.excludedIdentifiers[excludedInParentKey];

                if ( excludedSymbol.shortenedName ) {
                    //Logger.log( "Excluding identifier name for: ", excludedSymbol.getName(), excludedSymbol.shortenedName );
                    container.namesExcluded[excludedSymbol.shortenedName] = true;
                }
                else {
                    //Logger.log( "Excluding symbol does not have a shortened name: ", excludedSymbol.getName() );
                }
            }
        }

        // If this container extends a base/parent class then we must make sure we have processed the base/parent class members
        if ( container.isExtends() ) {
            Logger.log( "Class like container is extending a base class" );
            let extendsClause = container.getExtendsHeritageClause();
            let node = extendsClause.types[0].expression;
            const symbol = this.checker.getSymbolAtLocation( node );
            let symbolUId: string = ( <any>symbol ).id.toString();

            // We need to get the container context for the base class
            let baseClassContainer = this.classifiableContainers[symbolUId];

            this.processClassMembers( symbol.members, baseClassContainer );

            // The base class members must be excluded from this subclass
            for ( let memberKey in symbol.members ) {
                let memberSymbol = symbol.members[memberKey];

                if ( memberSymbol && ( <any>memberSymbol ).id ) {
                    let memberSymbolUId: string = ( <any>memberSymbol ).id.toString();

                    let excludedSymbol = this.allIdentifierSymbols[memberSymbolUId];

                    if ( excludedSymbol && excludedSymbol.shortenedName ) {
                        //Logger.log( "Excluding identifier name for: ", excludedSymbol.getName(), excludedSymbol.shortenedName );
                        container.namesExcluded[excludedSymbol.shortenedName] = true;
                    }
                }
            }
        }

        // If this container has members ( is a Class | Interface | TypeLiteral | ObjectLiteral ), then we must process these next
        if ( container.hasMembers() ) {
            let containerMembers = container.getMembers();

            for ( let memberKey in containerMembers ) {
                let memberSymbol = containerMembers[memberKey];

                if ( memberSymbol && ( <any>memberSymbol ).id ) {
                    let memberSymbolUId: string = ( <any>memberSymbol ).id.toString();

                    if ( Utils.hasProperty( this.allIdentifierSymbols, memberSymbolUId ) ) {
                        let memberIdentifierInfo = this.allIdentifierSymbols[memberSymbolUId];

                        this.processIdentifierSymbolInfo( container, memberIdentifierInfo );
                    }
                    else {
                        Debug.assert( true, "Member not found" );
                    }
                }
                else {
                    //Logger.log( "Container member does not have a symbol" );
                }
            }
        } 

        // Now process the containers local identifiers...
        for ( let symbolKey in container.symbolTable ) {
            let identifierSymbol = container.symbolTable[symbolKey];

            this.processIdentifierSymbolInfo( container, identifierSymbol );
        }

        // Recursively go through container children in order added
        let containerChildren = container.getChildren();

        for ( let j = 0; j < containerChildren.length; j++ ) {
            this.shortenContainerIdentifiers( containerChildren[j] );
        }
    }

    private processIdentifierSymbolInfo( container: ContainerContext, identifierInfo: IdentifierInfo ): void {
        if ( this.canShortenIdentifier( identifierInfo ) ) {
            let shortenedName = this.getShortenedIdentifierName( container, identifierInfo );

            Utils.forEach( identifierInfo.refs, identifier => {
                this.setIdentifierText( identifier, shortenedName );
            });

            return;
        }

        //Logger.log( "Identifier cannot be shortened: ", identifierInfo.getName() );
    }

    private canShortenIdentifier( identifierInfo: IdentifierInfo ): boolean {
        if ( identifierInfo.isBlockScopedVariable() ||
            identifierInfo.isFunctionScopedVariable() ||
            identifierInfo.isPrivateMethod() ||
            identifierInfo.isPrivateProperty() ||
            identifierInfo.isParameter() ) {

            return true;
        }

        return false;
    }

    private getShortenedIdentifierName( container: ContainerContext, identifierInfo: IdentifierInfo ): string {
        // Identifier names are shortened in place. They must be the same length or smaller than the original name.
        if ( !identifierInfo.shortenedName ) {
            let identifierName = identifierInfo.getName();

            if ( identifierName.length === 1 ) {
                // Just reuse the original name for 1 char names
                identifierInfo.shortenedName = identifierName;
            }
            else {
                // Loop until we have a valid shortened name
                // The shortened name MUST be the same length or less
                while ( true ) {
                    let shortenedName = this.nameGenerator.getName( container.getNameIndex() );

                    Debug.assert( shortenedName.length <= identifierName.length );

                    if ( !Utils.hasProperty( container.namesExcluded, shortenedName ) ) {
                        identifierInfo.shortenedName = shortenedName
                        break;
                    }
                    else {
                        //Logger.log( "Generated name was excluded: ", shortenedName, identifierName );
                    }
                }

                this.shortenedIdentifierCount++
            }
        }
        else {
            //Logger.log( "Identifier already has shortened name: ", identifierInfo.getName(), identifierInfo.shortenedName ); 
        }

        //Logger.log( "Identifier shortened name: ", identifierInfo.getName(), identifierInfo.shortenedName ); 
        
        return identifierInfo.shortenedName;
    }

    private setIdentifierText( identifier: ts.Identifier, text: string ): void {

        identifier.text = text;

        // The identifier text to write to the file has a starting and ending space
        text = " " + text + " ";
        identifier.end = identifier.pos + text.length - 1;

        for ( var i = 0; i < text.length; i++ ) {
            this.bundleSourceFile.text = Utils.replaceAt( this.bundleSourceFile.text, identifier.pos + i, text[i] );
        }
    }

    private processClassMembers( members: ts.SymbolTable, container: ContainerContext ): void {
        for ( let memberKey in members ) {
            let memberSymbol = members[memberKey];

            if ( memberSymbol && ( <any>memberSymbol ).id ) {
                let memberSymbolUId: string = ( <any>memberSymbol ).id.toString();

                if ( Utils.hasProperty( this.allIdentifierSymbols, memberSymbolUId ) ) {
                    let memberIdentifierInfo = this.allIdentifierSymbols[memberSymbolUId];

                    this.processIdentifierSymbolInfo( container, memberIdentifierInfo );
                }
                else {
                    Debug.assert( true, "Member not found" );
                }
            }
            else {
                //Logger.log( "Container member does not have a symbol" );
            }
        }
    }

    private currentContainer(): ContainerContext {
        return this.containerStack[ this.containerStack.length - 1 ];
    }

    private restoreContainer(): ContainerContext {
        //Logger.log( "Restoring container" );
        return this.containerStack.pop();
    }


    private isNextContainer( node: ts.Node ): boolean {
        let containerFlags: Ast.ContainerFlags = Ast.getContainerFlags( node );

        if ( containerFlags & ( Ast.ContainerFlags.IsContainer | Ast.ContainerFlags.IsBlockScopedContainer ) ) {
            let nextContainer = new ContainerContext( node, containerFlags, this.currentContainer() )

            // Check if the container symbol is Classifiable. If so save it to speed up inheritance processing.
            let containerSymbol: ts.Symbol = this.checker.getSymbolAtLocation( node );
            if ( containerSymbol ) {
                let containerSymbolUId: string = ( <any>containerSymbol ).id.toString();

                if ( !Utils.hasProperty( this.classifiableContainers, containerSymbolUId ) ) {
                    this.classifiableContainers[containerSymbolUId];
                }
            }

            // Before changing the current container we must first add the new container to the children of the current container.
            let currentContainer = this.currentContainer();
                        
            // If we don't have a container yet then it is the source file container ( the first ).
            if ( !currentContainer ) {
                this.sourceFileContainer = nextContainer;
            }
            else {
                // Add new container context to the exising current container
                currentContainer.addChildContainer( nextContainer );
            }

            this.containerStack.push( nextContainer );


            return true;
        }

        return false;
    }

    private reportWhitespaceStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportTime( "Whitespace time", this.whiteSpaceTime );
        statisticsReporter.reportPercentage( "Whitespace reduction", (( this.whiteSpaceBefore - this.whiteSpaceAfter )/this.whiteSpaceBefore) * 100.00 );
    }

    private reportMinifyStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportTime( "Minify time", this.transformTime );
        statisticsReporter.reportCount( "Total identifiers", this.identifierCount );
        statisticsReporter.reportCount( "Identifiers shortened", this.shortenedIdentifierCount );
        //statisticsReporter.reportPercentage( "shortened", ( ( this.IdentifierSpaceBefore - this.whiteSpaceAfter ) / this.whiteSpaceBefore ) * 100.00 );
    }
}