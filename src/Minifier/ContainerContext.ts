import ts = require( "typescript" );
import { Ast } from "../Ast/Ast";
import { IdentifierInfo } from "./IdentifierSymbolInfo";

import { Logger } from "../Reporting/Logger";

// TJT: Rename to Container?
export class ContainerContext {

    private container: ts.Node;
    private blockScopeContainer: ts.Node;

    private parent: ContainerContext;
    private childContainers: ContainerContext[] = [];

    private containerFlags: Ast.ContainerFlags;
    
    private isBlockScope: boolean;

    private hasExtendsClause: boolean;

    private nameIndex: number;

    //private id: number;

    // TJT: Review - do we need excluded symbols and names?
    public namesExcluded: ts.Map<boolean> = {};
    public excludedIdentifiers: ts.Map<IdentifierInfo> = {};
    public symbolTable: ts.Map<IdentifierInfo> = {};

    public shortenedIdentifierCount = 0;

    constructor( node: ts.Node, containerFlags: Ast.ContainerFlags, parentContainer: ContainerContext ) {
        //Logger.log( "Container creation: ", node.kind );
        this.containerFlags = containerFlags;

        //this.id = ( <any>node ).id;
        //if ( !this.id ) {
        //    Logger.log( "Container does not have an id" );
        //}


        this.hasExtendsClause = false;

        if ( containerFlags & Ast.ContainerFlags.IsContainer ) {
            this.container = this.blockScopeContainer = node;
            this.isBlockScope = false;

            this.parent = this;

            // if this is a class like container then we must check to see if it extends a base class
            let extendsClause = this.getExtendsHeritageClause();
            if ( extendsClause ) {
                Logger.log( "Container extends base class" );
                // TJT: What happens if a child extends an existing method or property of the parent? Do they have the same symbol?
                // TJT: The name index for both the parent and child properties and methods must not collide

                this.hasExtendsClause = true;
            }
            
            // The name generator index starts at 0 for containers 
            this.nameIndex = 0;
        }
        else {
            if ( containerFlags & Ast.ContainerFlags.IsBlockScopedContainer ) {
                this.blockScopeContainer = node;
                this.isBlockScope = true;

                this.parent = parentContainer.getParent();
            }
            else {
                Logger.log( ">>>>> Not a container bug" );
            }
        }
    }

    public addChildContainer( container: ContainerContext ): void {
        this.childContainers.push( container );
    }

    public getChildren(): ContainerContext[] {
        return this.childContainers;
    }

    public getParent(): ContainerContext {
        return this.parent;
    }

    // TJT: This logic needs to be reviewed for applicability to ES6 block scopes
    public getNameIndex(): number {
        if ( this.isBlockScope ) {
            // The name generator index for block scoped containers is obtained from the parent container
            return this.parent.getNameIndex();
        }

        return this.nameIndex++;
    }

    // TJT: Rename to getContainerNode()?
    public getNode(): ts.Node {
        return this.isBlockScope ? this.blockScopeContainer : this.container;
    }

    public isExtends(): boolean {
        return this.hasExtendsClause;
    }

    public hasMembers(): boolean {
        if ( this.container ) {
            let containerSymbol: ts.Symbol = ( <any>this.container ).symbol;

            if ( containerSymbol && ( containerSymbol.flags & ts.SymbolFlags.HasMembers ) ) {
                return true;
            }
        }

        return false;
    }

    public getMembers(): ts.SymbolTable {
        if ( this.container ) {
            let containerSymbol: ts.Symbol = ( <any>this.container ).symbol;

            if ( containerSymbol && ( containerSymbol.flags & ts.SymbolFlags.HasMembers ) ) {
                return containerSymbol.members;
            }
        }

        return undefined;
    }

    public isBlockScoped(): boolean {
        return this.isBlockScope;
    }

    public isFunctionScoped(): boolean {
        if ( this.containerFlags & ( Ast.ContainerFlags.IsContainer | Ast.ContainerFlags.IsContainerWithLocals ) ) {
            return true;
        }

        return false;
    }

    public getExtendsHeritageClause(): ts.HeritageClause {
        if ( this.container ) {
            let heritageClauses = ( <ts.ClassLikeDeclaration>this.container ).heritageClauses;
            if ( heritageClauses ) {
                for ( const clause of heritageClauses ) {
                    if ( clause.token === ts.SyntaxKind.ExtendsKeyword ) {
                        return clause;
                    }
                }
            }
        }

        return undefined;
    }
}