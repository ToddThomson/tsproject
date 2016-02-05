import * as ts from "typescript";
import { Ast } from "../Ast/Ast";
import { IdentifierInfo } from "./IdentifierSymbolInfo";
import { Logger } from "../Reporting/Logger";
import { Utils } from "../Utils/Utilities";

class ContainerIdGenerator {
    static nextId = 1;

    static getNextId(): number {
        return this.nextId++;
    }
}

export class Container {

    private id: number;
    private container: ts.Node;
    private blockScopeContainer: ts.Node;
    private containerFlags: Ast.ContainerFlags;

    private parent: Container;
    private childContainers: Container[] = [];

    private isBlockScope: boolean;

    // The base class cannot be determined by the checker if the base class name has been shortened
    // so we use get and set for the baseClass property
    private baseClass: ts.Symbol = undefined;
    
    private nameIndex: number;
    public namesExcluded: ts.Map<boolean> = {};

    public localIdentifiers: ts.Map<IdentifierInfo> = {};
    public classifiableSymbols: ts.Map<ts.Symbol> = {};

    public excludedIdentifiers: ts.Map<IdentifierInfo> = {};
    public excludedProperties: ts.Symbol[] = [];

    public shortenedIdentifierCount = 0;

    constructor( node: ts.Node, containerFlags: Ast.ContainerFlags, parentContainer: Container ) {
        this.id = ContainerIdGenerator.getNextId();
        this.containerFlags = containerFlags;

        if ( containerFlags & Ast.ContainerFlags.IsBlockScopedContainer ) {
            this.blockScopeContainer = node;
            this.isBlockScope = true;

            // A block scoped container's parent is the parent function scope container.
            this.parent = parentContainer.getParent();
        }
        else {
            this.container = this.blockScopeContainer = node;
            this.isBlockScope = false;

            // A function scoped container is it's own parent
            this.parent = this;

            // The name generator index starts at 0 for containers 
            this.nameIndex = 0;
        }
    }

    public getId(): number {
        return this.id;
    }

    public addChildContainer( container: Container ): void {
        this.childContainers.push( container );
    }

    public getChildren(): Container[] {
        return this.childContainers;
    }

    public getParent(): Container {
        return this.parent;
    }

    public getNameIndex(): number {
        // TJT: This logic needs to be reviewed for applicability to ES6 block scopes
        if ( this.isBlockScope ) {
            // The name generator index for block scoped containers is obtained from the parent container
            return this.parent.getNameIndex();
        }

        return this.nameIndex++;
    }

    public getNode(): ts.Node {
        return this.isBlockScope ? this.blockScopeContainer : this.container;
    }

    public getMembers(): ts.NodeArray<ts.Declaration> {
        if ( this.container ) {
            switch ( this.container.kind ) {
                case ts.SyntaxKind.ClassDeclaration:
                    return (<ts.ClassDeclaration>this.container).members;

                case ts.SyntaxKind.EnumDeclaration:
                    return (<ts.EnumDeclaration>this.container).members;

                default:
                    Logger.trace( "Container::getMembers() unprocessed container kind: ", this.container.kind );
            }
        }

        return undefined;
    }

    public getLocals(): ts.SymbolTable {
         if ( this.container && this.containerFlags & Ast.ContainerFlags.HasLocals ) {
            switch ( this.container.kind ) {
                case ts.SyntaxKind.ModuleDeclaration:
                    return (<any>this.container).locals;
                default:
                    Logger.warn( "Container::getLocals() unprocessed container kind: ", this.container.kind );
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

    public setBaseClass( baseClass: ts.Symbol ): void {
        if ( baseClass.flags & ts.SymbolFlags.Class ) {
            this.baseClass = baseClass;
        }
    }

    public getBaseClass(): ts.Symbol {
        return this.baseClass;
    }

    public hasChild( container: Container ): boolean {
        for ( let i = 0; i < this.childContainers.length; i++ ) {
            if ( container.getId() === this.childContainers[ i ].getId() )
                return true;
        }

        return false;
    }
}