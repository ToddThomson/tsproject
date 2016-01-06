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

    // TJT: Review - do we need excluded symbols and names?
    public namesExcluded: ts.Map<boolean> = {};
    public excludedIdentifiers: ts.Map<IdentifierInfo> = {};
    public symbolTable: ts.Map<IdentifierInfo> = {};

    public shortenedIdentifierCount = 0;

    constructor( node: ts.Node, containerFlags: Ast.ContainerFlags, parentContainer: ContainerContext ) {
        this.containerFlags = containerFlags;

        if ( containerFlags & Ast.ContainerFlags.IsContainer ) {
            this.container = this.blockScopeContainer = node;
            this.isBlockScope = false;

            this.parent = this;

            //Logger.log( "New function scoped container: ", node.kind );
        }
        else if ( containerFlags & Ast.ContainerFlags.IsBlockScopedContainer ) {
            this.blockScopeContainer = node;
            this.isBlockScope = true;

            this.parent = parentContainer.getParent();

            //Logger.log( "New block scoped container: ", node.kind );
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

    // TJT: Rename to getContainer()?
    public getNode(): ts.Node {
        return this.isBlockScope ? this.blockScopeContainer : this.container;
    }

    // TJT: to be removed if not required
    public getLocals(): ts.SymbolTable {
        if ( this.isBlockScope )
            return ( <any>this.blockScopeContainer ).locals;
        else
            return ( <any>this.container ).locals;
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
}