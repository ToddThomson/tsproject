import * as ts from "typescript";

import { BundleFile } from "../Bundler/BundleResult"
import { BundleConfig } from "../Bundler/BundleParser"
import { NodeWalker } from "../Ast/NodeWalker"
import { Ast } from "../Ast/Ast"
import { AstTransform } from "../Ast/AstTransform"
import { StatisticsReporter } from "../Reporting/StatisticsReporter"
import { Logger } from "../Reporting/Logger"
import { NameGenerator } from "./NameGenerator"
import { Container } from "./ContainerContext"
import { IdentifierInfo } from "./IdentifierInfo"
import { TsCompilerOptions } from "../Compiler/TsCompilerOptions"
import { Debug } from "../Utils/Debug"
import { format } from "../Utils/formatter"
import { Utils } from "../Utils/Utilities"
import { TsCore } from "../Utils/TsCore"

export class BundleMinifier extends NodeWalker implements AstTransform {
    private bundleSourceFile: ts.SourceFile;
    private program: ts.Program;
    private checker: ts.TypeChecker;
    private compilerOptions: TsCompilerOptions;
    private bundleConfig: BundleConfig;

    private containerStack: Container[] = [];
    private classifiableContainers: ts.MapLike<Container> = {};
    private allIdentifierInfos: ts.MapLike<IdentifierInfo> = {};
    private sourceFileContainer: Container;
    private nameGenerator: NameGenerator;

    private whiteSpaceBefore: number;
    private whiteSpaceAfter: number;

    private whiteSpaceTime: number;
    private transformTime: number;

    private identifierCount = 0;
    private shortenedIdentifierCount = 0;

    constructor( program: ts.Program, compilerOptions: ts.CompilerOptions, bundleConfig: BundleConfig ) {
        super();

        this.program = program;
        this.checker = program.getTypeChecker();
        this.compilerOptions = compilerOptions;
        this.bundleConfig = bundleConfig;

        this.containerStack = [];
        this.nameGenerator = new NameGenerator();
    }

    public transform( bundleSourceFile: ts.SourceFile ): ts.SourceFile {

        this.bundleSourceFile = bundleSourceFile;

        return this.minify( bundleSourceFile );
    }

    public removeWhitespace( jsContents: string ): string {
        // ES6 whitespace rules..

        // Special Cases..
        // break, continue, function: space right if next token is [Expression]
        // return, yield: space if next token is not a semicolon
        // else:

        // Space to left and right of keyword..
        // extends, in, instanceof : space left and right
        
        // Space to the right of the keyword..
        // case, class, const, delete, do, export, get, import, let, new, set, static, throw, typeof, var, void
        
        // Space not required..
        // catch, debugger, default, finally, for, if, super, switch, this, try, while, with
        
        // Notes..
        // export: Not supported yet? For now add space
        // default: When used with export?

        this.whiteSpaceTime = new Date().getTime();
        this.whiteSpaceBefore = jsContents.length;

        let output = "";
        let lastNonTriviaToken = ts.SyntaxKind.Unknown;
        let isTrivia = false;
        let token: ts.SyntaxKind;

        const scanner = ts.createScanner( ts.ScriptTarget.ES5, /* skipTrivia */ false, ts.LanguageVariant.Standard, jsContents );

        while ( ( token = scanner.scan() ) !== ts.SyntaxKind.EndOfFileToken ) {
            isTrivia = false;

            if ( Ast.isTrivia( token ) ) {
                // TJT: Uncomment to add new line trivia to output for testing purposes
                //if ( token === ts.SyntaxKind.NewLineTrivia ) {
                //    output += scanner.getTokenText();
                //}
                isTrivia = true;
            }

            if ( !isTrivia ) {
                // Process the last non trivia token
                switch ( lastNonTriviaToken ) {
                    case ts.SyntaxKind.FunctionKeyword:
                        // Space required after function keyword if next token is an identifier
                        if ( token === ts.SyntaxKind.Identifier ) {
                            output += " ";
                        }
                        break;

                    case ts.SyntaxKind.BreakKeyword:
                    case ts.SyntaxKind.ContinueKeyword:
                    case ts.SyntaxKind.ReturnKeyword:
                    case ts.SyntaxKind.YieldKeyword:
                        // Space not required after return keyword if the current token is a semicolon
                        if ( token !== ts.SyntaxKind.SemicolonToken ) {
                            output += " ";
                        }
                        break;

                    case ts.SyntaxKind.ElseKeyword:
                        // Space not required after return keyword if the current token is a punctuation
                        if ( token !== ts.SyntaxKind.OpenBraceToken ) {
                            output += " ";
                        }
                        break;
                }

                // Process the current token..
                switch ( token ) {
                    // Keywords that require a right space
                    case ts.SyntaxKind.CaseKeyword:
                    case ts.SyntaxKind.ClassKeyword:
                    case ts.SyntaxKind.ConstKeyword:
                    case ts.SyntaxKind.DeleteKeyword:
                    case ts.SyntaxKind.DoKeyword:
                    case ts.SyntaxKind.ExportKeyword: // TJT: Add a space just to be sure right now 
                    case ts.SyntaxKind.GetKeyword:
                    case ts.SyntaxKind.ImportKeyword:
                    case ts.SyntaxKind.LetKeyword:
                    case ts.SyntaxKind.NewKeyword:
                    case ts.SyntaxKind.SetKeyword:
                    case ts.SyntaxKind.StaticKeyword:
                    case ts.SyntaxKind.ThrowKeyword:
                    case ts.SyntaxKind.TypeOfKeyword:
                    case ts.SyntaxKind.VarKeyword:
                    case ts.SyntaxKind.VoidKeyword:
                        output += scanner.getTokenText() + " ";
                        break;

                    // Keywords that require space left and right..
                    case ts.SyntaxKind.ExtendsKeyword:
                    case ts.SyntaxKind.InKeyword:
                    case ts.SyntaxKind.InstanceOfKeyword:
                        output += " " + scanner.getTokenText() + " ";
                        break;

                    // Avoid concatenations of ++, + and --, - operators
                    case ts.SyntaxKind.PlusToken:
                    case ts.SyntaxKind.PlusPlusToken:
                        if ( ( lastNonTriviaToken === ts.SyntaxKind.PlusToken ) ||
                            ( lastNonTriviaToken === ts.SyntaxKind.PlusPlusToken ) ) {
                            output += " ";
                        }
                        output += scanner.getTokenText();
                        break;

                    case ts.SyntaxKind.MinusToken:
                    case ts.SyntaxKind.MinusMinusToken:
                        if ( ( lastNonTriviaToken === ts.SyntaxKind.MinusToken ) ||
                            ( lastNonTriviaToken === ts.SyntaxKind.MinusMinusToken ) ) {
                            output += " ";
                        }

                        output += scanner.getTokenText();
                        break;

                    default:
                        // All other tokens can be output. Keywords that do not require whitespace.
                        output += scanner.getTokenText();
                        break;
                }
            }

            if ( !isTrivia ) {
                lastNonTriviaToken = token;
            }
        }

        this.whiteSpaceAfter = output.length;
        this.whiteSpaceTime = new Date().getTime() - this.whiteSpaceTime;

        if ( this.compilerOptions.diagnostics )
            this.reportWhitespaceStatistics();

        return jsContents; // output;
    }

    protected visitNode( node: ts.Node ): void {
        // Traverse nodes to build containers and process all identifiers nodes.
        if ( this.isNextContainer( node ) ) {
            super.visitNode( node );

            this.restoreContainer();
        }
        else {
            switch ( node.kind ) {
                case ts.SyntaxKind.Identifier:
                    Logger.info( "Identifier node walked in container id: ", this.currentContainer().getId() );

                    let tmpContainer = this.currentContainer();

                    let identifier: ts.Identifier = <ts.Identifier>node;
                    let identifierSymbol: ts.Symbol = this.checker.getSymbolAtLocation( identifier );

                    // The identifierSymbol may be null when an identifier is accessed within a function that
                    // has been assigned to the prototype property of an object. We check for this here.
                    if ( !identifierSymbol ) {
                        identifierSymbol = this.getSymbolFromPrototypeFunction( identifier );    
                    }
                   
                    if ( identifierSymbol ) {
                        let identifierUID = Ast.getIdentifierUID( identifierSymbol );

                        if ( identifierUID === undefined ) {
                            if ( identifierSymbol.flags & ts.SymbolFlags.Transient ) {
                                // TJT: Can we ignore all transient symbols?
                                Logger.trace( "Ignoring transient symbol: ", identifierSymbol.name );
                                break;
                            }
                            else {
                                identifierUID = ( <any>ts).getSymbolId( identifierSymbol ).toString();
                                Logger.trace( "Generated symbol id for: ", identifierSymbol.name, identifierUID );
                            }
                        }

                        // Check to see if we've seen this identifer symbol before
                        if ( Utils.hasProperty( this.allIdentifierInfos, identifierUID ) ) {
                            Logger.info( "Identifier already added: ", identifierSymbol.name, identifierUID );

                            // If we have, then add it to the identifier info references 
                            let prevAddedIdentifier = this.allIdentifierInfos[ identifierUID ];
                            this.allIdentifierInfos[ identifierUID ].addRef( identifier, this.currentContainer() );

                            // If the previously added identifier is not in the current container's local identifier table then
                            // it must be excluded so that it's shortened name will not be used in this container.
                            if ( !Utils.hasProperty( this.currentContainer().localIdentifiers, identifierUID ) ) {
                                this.currentContainer().excludedIdentifiers[ identifierUID ] = prevAddedIdentifier; 
                            }
                        }
                        else {
                            let identifierInfo = new IdentifierInfo( identifier, identifierSymbol, this.currentContainer() );
                            Logger.info( "Adding new identifier: ", identifierInfo.getName(), identifierInfo.getId() );

                            // Add the new identifier info to both the container and the all list
                            this.currentContainer().localIdentifiers[ identifierUID ] = identifierInfo;
                            this.allIdentifierInfos[ identifierUID ] = identifierInfo;

                            // We can't shorten identifier names that are 1 character in length AND
                            // we can't risk the chance that an identifier name will be replaced with a 2 char
                            // shortened name due to the constraint that the names are changed in place
                            let identifierName = identifierSymbol.getName();

                            if ( identifierName.length === 1 ) {
                                identifierInfo.shortenedName = identifierName;
                                this.currentContainer().excludedIdentifiers[ identifierUID ] = identifierInfo;
                            }

                            this.identifierCount++;
                        }
                    }
                    else {
                        Logger.warn( "Identifier does not have a symbol: ", identifier.text );
                    }

                    break;
            }

            super.visitNode( node );
        }
    }

    private getSymbolFromPrototypeFunction( identifier: ts.Identifier ): ts.Symbol {

        let containerNode = this.currentContainer().getNode();

        if ( containerNode.kind === ts.SyntaxKind.FunctionExpression ) {
            if ( Ast.isPrototypeAccessAssignment( containerNode.parent ) ) {
                // Get the 'x' of 'x.prototype.y = f' (here, 'f' is 'container')
                const className = (((containerNode.parent as ts.BinaryExpression)   // x.prototype.y = f
                    .left as ts.PropertyAccessExpression)       // x.prototype.y
                    .expression as ts.PropertyAccessExpression) // x.prototype
                    .expression;                                // x
                        
                const classSymbol = this.checker.getSymbolAtLocation( className );

                if ( classSymbol && classSymbol.members ) {
                    if ( classSymbol.members.has( identifier.escapedText ) ) {
                        Logger.info( "Symbol obtained from prototype function: ", identifier.text );
                        return classSymbol.members.get( identifier.escapedText );
                    }
                }

                return undefined;
            }                            
        }
        
        return undefined;        
    }

    private minify( sourceFile: ts.SourceFile ): ts.SourceFile {
        this.transformTime = new Date().getTime();

        // Walk the sourceFile to build containers and the identifiers within. 
        this.walk( sourceFile );

        this.shortenIdentifiers();

        this.transformTime = new Date().getTime() - this.transformTime;

        if ( this.compilerOptions.diagnostics )
            this.reportMinifyStatistics();

        return sourceFile;
    }

    private shortenIdentifiers(): void {
        // NOTE: Once identifier names are shortened, the typescript checker cannot be used. 

        // We first need to process all the class containers to determine which properties cannot be shortened 
        // ( public, abstract, implements, extends ).

        for ( let classContainerKey in this.classifiableContainers ) {
            let classContainer = this.classifiableContainers[ classContainerKey ];

            let abstractProperties: ts.Symbol[] = [];
            let heritageProperties: ts.Symbol[] = [];
            let implementsProperties: ts.Symbol[] = [];

            let extendsClause = Ast.getExtendsClause( classContainer.getNode() );

            if ( extendsClause ) {
                // Check for abstract properties...
            
                // TODO: Abstract properties are currently not shortened, but they could possibly be.
                //       The child class that implements a parent class property would need to have the same shortened name.
                
                abstractProperties = Ast.getClassAbstractProperties( extendsClause, this.checker );
            }

            let implementsClause = Ast.getImplementsClause( classContainer.getNode() );

            if ( implementsClause ) {
                implementsProperties = Ast.getImplementsProperties( implementsClause, this.checker );
            }

            heritageProperties = Ast.getClassHeritageProperties( classContainer.getNode(), this.checker );

            // Join the abstract and implements properties
            let excludedProperties = heritageProperties.concat( abstractProperties, implementsProperties );

            Logger.trace( "Class excluded properties for: ", (<any>classContainer.getNode()).name.text, excludedProperties.length, classContainer.getId() );

            classContainer.excludedProperties = excludedProperties;
        }

        // Recursively process the container identifiers starting at the source file container...
        this.shortenContainerIdentifiers( this.sourceFileContainer );
    }

    private shortenContainerIdentifiers( container: Container ): void {
        // If this container extends a base/parent class then we must make sure we have processed the base/parent class members
        let baseClass = container.getBaseClass();

        if ( baseClass ) {
            // We need to get the container for the parent/base class
            let baseClassContainer = this.classifiableContainers[ baseClass.name ];

            if ( baseClassContainer ) {
                let baseClassMembers = baseClassContainer.getMembers();
                
                if ( baseClassMembers ) {
                    this.processClassMembers( baseClassMembers, baseClassContainer );

                    // The base class container excludedProperties array must also be excluded in the current derived class
                    container.excludedProperties = container.excludedProperties.concat( baseClassContainer.excludedProperties );
                }
            }
        }

        // Determine the names which cannot be used as shortened names in this container.
        this.excludeNames( container );

        // Process container members..
        let containerClassMembers = container.getMembers();
        
        if ( containerClassMembers ) {
            this.processClassMembers( containerClassMembers, container );
        }

        // Process container locals..
        let containerLocals = container.getLocals();
        if ( containerLocals ) {
            this.processContainerLocals( containerLocals, container );
        }

        // Process the containers identifiers...
        for ( let identifierTableKey in container.localIdentifiers ) {
            let identifierInfo = container.localIdentifiers[ identifierTableKey ];

            this.processIdentifierInfo( identifierInfo, container );
        }

        // Process the containers classifiables...
        
        // TJT: Review..

        for ( let classifiableKey in container.classifiableSymbols ) {
            let classSymbol = container.classifiableSymbols[ classifiableKey ];

            let classSymbolUId: string = Ast.getIdentifierUID( classSymbol );
            let classIdentifierInfo = this.allIdentifierInfos[ classSymbolUId ];
            
            this.processIdentifierInfo( classIdentifierInfo, container );
        }

        // Recursively go through container children in order added
        let containerChildren = container.getChildren();

        for ( let j = 0; j < containerChildren.length; j++ ) {
            this.shortenContainerIdentifiers( containerChildren[j] );
        }
    }

    private processIdentifierInfo( identifierInfo: IdentifierInfo, container: Container ): void {

        if ( this.canShortenIdentifier( identifierInfo ) ) {
            let shortenedName = this.getShortenedIdentifierName( container, identifierInfo );

            Logger.trace( "Identifier shortened: ", identifierInfo.getName(), shortenedName );

            // Add the shortened name to the excluded names in each container that this identifier was found in.
            let containerRefs = identifierInfo.getContainers();
            
            for ( let containerKey in containerRefs ) {
                let containerRef = containerRefs[ containerKey ];
                containerRef.namesExcluded[ shortenedName ] = true;
            }

            if ( !identifierInfo.isMinified ) {
                // Change all referenced identifier nodes to the shortened name
                Utils.forEach( identifierInfo.getIdentifiers(), identifier => {
                    this.setIdentifierText( identifier, shortenedName );
                } );

                identifierInfo.isMinified = true;
            }

            return;
        }
    }

    private canShortenIdentifier( identifierInfo: IdentifierInfo ): boolean {
        if ( identifierInfo.isBlockScopedVariable() ||
            identifierInfo.isFunctionScopedVariable() ||
            identifierInfo.isInternalClass() ||
            identifierInfo.isInternalInterface() ||
            identifierInfo.isPrivateMethod() ||
            identifierInfo.isPrivateProperty() ||
            identifierInfo.isInternalFunction( this.bundleConfig.package.getPackageNamespace() ) ||
            identifierInfo.isParameter() ||
            identifierInfo.isNamespaceImportAlias() ) {

            Logger.trace( "Identifier CAN be shortened: ", identifierInfo.getName() );
            return true;
        }

        Logger.trace( "Identifier CANNOT be shortened: ", identifierInfo.getName() );
        return false;
    }

    private getShortenedIdentifierName( container: Container, identifierInfo: IdentifierInfo ): string {
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
                        Logger.trace( "Generated name was excluded: ", shortenedName, identifierName );
                    }
                }

                this.shortenedIdentifierCount++
            }
        }
        else {
            Logger.trace( "Identifier already has shortened name: ", identifierInfo.getName(), identifierInfo.shortenedName ); 
        }

        Logger.info( "Identifier shortened name: ", identifierInfo.getName(), identifierInfo.shortenedName ); 
        
        return identifierInfo.shortenedName;
    }

    private setIdentifierText( identifier: ts.Identifier, text: string ): void {
        
        let identifierLength = identifier.text.length;
        let bufferLength = ( identifier.end - identifier.pos );

        // Check to see if there is leading trivia
        var triviaOffset = identifier.getLeadingTriviaWidth();

        // Find the start of the identifier text within the identifier character array
        for ( var identifierStart = identifier.pos + triviaOffset; identifierStart < identifier.pos + bufferLength; identifierStart++ ) {
            if ( this.bundleSourceFile.text[ identifierStart ] === identifier.text[ 0 ] )
                break;
        }

        // Replace the identifier text within the bundle source file
        identifier.end = identifierStart + text.length;

        for ( var i = 0; i < identifierLength; i++ ) {
            let replaceChar = " ";
            
            if ( i < text.length ) {
                replaceChar = text[i];
            }

            this.bundleSourceFile.text = Utils.replaceAt( this.bundleSourceFile.text, identifierStart + i, replaceChar );
        }
    }

    private processContainerLocals( locals: ts.SymbolTable, container: Container ): void {
        locals.forEach( local => {
            let localSymbolUId: string = Ast.getIdentifierUID(( <any>local.declarations[0] ).symbol );

            if ( localSymbolUId ) {
                let localIdentifierInfo = this.allIdentifierInfos[localSymbolUId];
                this.processIdentifierInfo( localIdentifierInfo, container );
            }
            else {
                Logger.warn( "Container local does not have a UId" );
            }
        });
    }

    private processClassMembers( members: ts.NodeArray<ts.Declaration>, container: Container ): void {
        for ( let memberKey in members ) {
            let member = members[ memberKey ];
            let memberSymbol: ts.Symbol = (<any>member).symbol;
            
            if ( memberSymbol ) {
                let memberSymbolUId: string = Ast.getIdentifierUID( memberSymbol );

                if ( memberSymbolUId ) {
                    let memberIdentifierInfo = this.allIdentifierInfos[ memberSymbolUId ];
                    let isExcludedProperty = false;

                    for ( const excludedPropertyKey in container.excludedProperties ) {
                        let memberIdentifierSymbol = memberIdentifierInfo.getSymbol();
                        let excludedPropertySymbol = container.excludedProperties[ excludedPropertyKey ];
                       
                        // TJT: Review - How to determine equality here. For now just use name which seems pretty naive.
                        if ( memberIdentifierSymbol.name === excludedPropertySymbol.name ) {
                            isExcludedProperty = true;
                            
                            memberIdentifierInfo.shortenedName = memberIdentifierInfo.getName();
                            break;
                        }
                    }

                    if ( !isExcludedProperty ) {
                        this.processIdentifierInfo( memberIdentifierInfo, container );
                    }
                }
                else {
                    Logger.warn( "Container member does not have a UId" );
                }
            }
            else {
                Logger.warn( "Container member does not have a symbol." );
            }
        }
    }
    
    public excludeNames( container: Container ): void {
        // Determine identifier names which cannot be used in this container.

        // If this container extends a base/parent class then we exclude the base class member names.
        let baseClass = container.getBaseClass();

        if ( baseClass ) {

            // We need to get the container for the parent/base class
            let baseClassContainer = this.classifiableContainers[ baseClass.name ];

            if ( baseClassContainer ) {
                let baseClassMembers = baseClassContainer.getMembers();

                if ( baseClassMembers ) {

                    // The base class members shortened names must be excluded from this child class
                    for ( let memberKey in baseClassMembers ) {
                        let member = baseClassMembers[ memberKey ];
                        let memberSymbol = (<any>member).symbol;
                        let memberSymbolUId: string = Ast.getIdentifierUID( memberSymbol );

                        let excludedIdentifier = this.allIdentifierInfos[ memberSymbolUId ] ;

                        if ( excludedIdentifier && excludedIdentifier.shortenedName ) {
                            container.namesExcluded[ excludedIdentifier.shortenedName ] = true;
                        }
                    }
                }
            }
        }

        for ( let identifierInfoKey in container.localIdentifiers ) {
            let identifierInfo = container.localIdentifiers[ identifierInfoKey ];
            
            this.excludeNamesForIdentifier( identifierInfo, container );
        }

        for ( let classifiableKey in container.classifiableSymbols ) {
            let classSymbol = container.classifiableSymbols[ classifiableKey ];

            let classSymbolUId: string = Ast.getIdentifierUID( classSymbol );
            let classIdentifierInfo = this.allIdentifierInfos[ classSymbolUId ];
            
            Debug.assert( classIdentifierInfo !== undefined, "Container classifiable identifier symbol not found." );

            this.excludeNamesForIdentifier( classIdentifierInfo, container );
        }
    }

    private getContainerExcludedIdentifiers( container: Container ): ts.MapLike<IdentifierInfo> {

        // Recursively walk the container chain to find shortened identifier names that we cannot use in this container.
        let target = this.compilerOptions.target;
        let excludes: ts.MapLike<IdentifierInfo> = {};
        
        function getContainerExcludes( container: Container ) {
            // Recursively process the container block scoped children..
            let containerChildren = container.getChildren();
           
             for ( let i = 0; i < containerChildren.length; i++ ) {
                let childContainer = containerChildren[ i ];
                
                //if ( childContainer.isBlockScoped() ) {
                    getContainerExcludes( childContainer );
                //}
            }

            // Get the excluded identifiers in this block scoped container..

            for ( let excludedIdentifierKey in container.excludedIdentifiers ) {
                let excludedIdentifier = container.excludedIdentifiers[ excludedIdentifierKey ];

                // For function scoped identifiers we must exclude the identifier from the current container parent.
                // Note that for ES5, which doesn't have block scoped variables, we must also exclude the identifier.
                if ( ( !excludedIdentifier.isBlockScopedVariable ) || ( target === ts.ScriptTarget.ES5 ) ) {
                    if ( !Utils.hasProperty( excludes, excludedIdentifier.getId() ) ) {
                        excludes[ excludedIdentifier.getId() ] = excludedIdentifier;
                    }
                }
            }
        }

        // Start the search for excluded identifiers from the container's parent - the parent function scope container.
        getContainerExcludes( container.getParent() );
        
        return excludes;
    }

    private excludeNamesForIdentifier( identifierInfo: IdentifierInfo, container: Container ): void {
        // Exclude all shortened names that have already been used in child containers that this identifer is contained in.
        let identifierContainers = identifierInfo.getContainers();

        // For each container that the identifier is contained in..
        for ( let containerKey in identifierContainers ) {
            let identifierContainer = identifierContainers[ containerKey ];

            let containerExcludes = this.getContainerExcludedIdentifiers( identifierContainer );
                
            // We can't use any names that have already been used in this referenced container
            for( let excludedIdentifierKey in containerExcludes ) {
                let excludedIdentifier = containerExcludes[ excludedIdentifierKey ];

                if ( excludedIdentifier.shortenedName ) {
                    container.namesExcluded[ excludedIdentifier.shortenedName ] = true;
                }
            }
        }
    }
    
    private currentContainer(): Container {
        return this.containerStack[ this.containerStack.length - 1 ];
    }

    private restoreContainer(): Container {
        return this.containerStack.pop();
    }

    private isNextContainer( node: ts.Node ): boolean {
        let containerFlags: Ast.ContainerFlags = Ast.getContainerFlags( node );

        if ( containerFlags & ( Ast.ContainerFlags.IsContainer | Ast.ContainerFlags.IsBlockScopedContainer ) ) {
            let nextContainer = new Container( node, containerFlags, this.currentContainer() )
            
            // Check if the container symbol is classifiable. If so save it for inheritance processing.
            let containerSymbol: ts.Symbol = (<any>node).symbol;

            if ( containerSymbol && ( containerSymbol.flags & ts.SymbolFlags.Class ) ) {
                let containerSymbolUId: string = Ast.getIdentifierUID( containerSymbol );

                // Save the class symbol into the current container ( its parent )
                if ( !Utils.hasProperty( this.currentContainer().classifiableSymbols, containerSymbolUId ) ) {
                    this.currentContainer().classifiableSymbols[ containerSymbolUId ] = containerSymbol;
                }

                // Save to the all classifiable containers table. See NOTE Inheritance below.
                if ( !Utils.hasProperty( this.classifiableContainers, containerSymbol.name ) ) {
                    this.classifiableContainers[ containerSymbol.name ] = nextContainer;
                }

                // Check for inheritance. We need to do this now because the checker cannot be used once names are shortened.
                let extendsClause = Ast.getExtendsClause( node )
            
                if ( extendsClause ) {
                    let baseClassSymbol = this.checker.getSymbolAtLocation( <ts.Identifier>extendsClause.types[0].expression );
                     
                    // NOTE Inheritance:
                    // If this child class is declared before the parent base class then the base class symbol will have symbolFlags.Merged.
                    // When the base class is declared it will have a different symbol id from the symbol id determined here.
                    // We should be able to use the symbol name for lookups in the classifiable containers table.
                    // let baseClassAlias = this.checker.getAliasedSymbol(baseClassSymbol);

                    nextContainer.setBaseClass( baseClassSymbol );
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

            Logger.info( "Next container id: ", nextContainer.getId(), nextContainer.getParent().getId() );

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
    }

    private prettify( input: string ): string {
        return format( input );
    }
}