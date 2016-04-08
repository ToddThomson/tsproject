import * as ts from "typescript";
import { Container } from "./ContainerContext";
import { Ast } from "../Ast/Ast";
import { Utils } from "../Utils/Utilities";
import { Logger } from "../Reporting/Logger";

export class IdentifierInfo {

    private identifier: ts.Identifier;
    private symbol: ts.Symbol;

    private containers: ts.Map<Container> = {};
    private identifiers: ts.Identifier[] = [];

    public shortenedName: string = undefined;

    constructor( identifier: ts.Identifier, symbol: ts.Symbol, container: Container ) {
        this.identifier = identifier;
        this.symbol = symbol;
        this.identifiers = [identifier];
        this.containers[container.getId().toString()] = container;
    }

    public getSymbol(): ts.Symbol {
        return this.symbol;
    }

    public getName(): string {
        return this.symbol.name;
    }

    public getId(): string {
        let id = ( <any>this.symbol ).id;

        if ( id === undefined && this.symbol.valueDeclaration ) {
            id = ( <any>this.symbol.valueDeclaration ).symbol.id;
        }

        return id ? id.toString() : undefined;
    }

    public getContainers(): ts.Map<Container> {
        return this.containers;
    }

    public getIdentifiers(): ts.Identifier[] {
        return this.identifiers;
    }

    public addRef( identifier: ts.Identifier, container: Container ): void {
        // Add the identifier (node) reference
        this.identifiers.push( identifier );

        // We only need to keep track of a single reference in a container
        if ( !Utils.hasProperty( this.containers, container.getId().toString() ) ) {
            this.containers[ container.getId().toString() ] = container;
        }
    }

    public isNamespaceImportAlias(): boolean {
        if ( ( this.symbol.flags & ts.SymbolFlags.Alias ) > 0 ) {
            if ( this.symbol.declarations[0].kind === ts.SyntaxKind.NamespaceImport ) {
                return true;
            }
        }

        return false;
    }

    public isFunctionScopedVariable(): boolean {
        if ( ( this.symbol.flags & ts.SymbolFlags.FunctionScopedVariable ) > 0 ) {
            let variableDeclaration = this.getVariableDeclaration();

            if ( variableDeclaration ) {
                return true;
            }
        }

        return false;
    }

    public isBlockScopedVariable(): boolean {
        if ( ( this.symbol.flags & ts.SymbolFlags.BlockScopedVariable ) > 0 ) {
            let variableDeclaration = this.getVariableDeclaration();

            if ( variableDeclaration ) {
                return ( ( variableDeclaration.parent.flags & ts.NodeFlags.Let ) !== 0 ) ||
                    ( ( variableDeclaration.parent.flags & ts.NodeFlags.Const ) !== 0 );
            }
        }

        return false;
    }

    public isInternalFunction( packageNamespace: string ): boolean {
        if ( this.symbol.flags & ts.SymbolFlags.Function ) {

            // A function has a value declaration
            if ( this.symbol.valueDeclaration.kind === ts.SyntaxKind.FunctionDeclaration ) {
                let flags = this.symbol.valueDeclaration.flags;

                // If The function is from an extern API or ambient then it cannot be considered internal.
                if ( Ast.isExportProperty( this.symbol ) || Ast.isAmbientProperty( this.symbol ) ) {
                    return false;
                }

                if ( !( flags & ts.NodeFlags.Export ) ) {
                    return true;
                }

                // Override export flag if function is not in our special package namespace.
                if ( packageNamespace ) {
                    let node: ts.Node = this.symbol.valueDeclaration;
                    while ( node ) {
                        if ( node.flags & ts.NodeFlags.Namespace ) {
                            let nodeNamespaceName: string = (<any>node).name.text;

                            if ( nodeNamespaceName !== packageNamespace ) {
                                return true;
                            }
                        }
                        node = node.parent;
                    }
                }
            }
        }

        return false;
    }

    public isParameter(): boolean {
        // Note: FunctionScopedVariable also indicates a parameter
        if ( ( this.symbol.flags & ts.SymbolFlags.FunctionScopedVariable ) > 0 ) {

            // A parameter has a value declaration
            if ( this.symbol.valueDeclaration.kind === ts.SyntaxKind.Parameter ) {
                return true;
            }
        }

        return false;
    }

    public isInternalClass(): boolean {

        // TJT: Review - should use the same export "override" logic as in isInternalFunction

        return Ast.isClassInternal( this.symbol );
    }

    public isPrivateMethod(): boolean {
        if ( ( this.symbol.flags & ts.SymbolFlags.Method ) > 0 ) {

            // A method has a value declaration
            let flags = this.symbol.valueDeclaration && this.symbol.valueDeclaration.flags;

            if ( ( flags & ts.NodeFlags.Private ) > 0 ) {
                return true;
            }

            // Check if the method parent class is "internal" ( non-private methods may be shortened too )
            let parent: ts.Symbol = ( <any>this.symbol ).parent;

            if ( parent && Ast.isClassInternal( parent ) ) {

                // TJT: Review - public methods of abstact classes are not shortened.
                if ( !Ast.isClassAbstract( parent ) ) {
                    return true;
                }
            }
        }

        return false;
    }

    public isPrivateProperty(): boolean {
        if ( ( this.symbol.flags & ts.SymbolFlags.Property ) > 0 ) {
            // A property has a value declaration
            let flags = this.symbol.valueDeclaration && this.symbol.valueDeclaration.flags;

            if ( ( flags & ts.NodeFlags.Private ) > 0 ) {
                return true;
            }

            // Check if the property parent class is "internal" ( non-private properties may be shortened too )
            let parent: ts.Symbol = ( <any>this.symbol ).parent;

            if ( parent && Ast.isClassInternal( parent ) ) {

                // TJT: Review - public properties of abstact classes are not shortened.
                if ( !Ast.isClassAbstract( parent ) ) {
                    return true;
                }
            }
        }

        return false;
    }

    private getVariableDeclaration(): ts.VariableDeclaration {

        switch ( ( <ts.Node>this.identifier ).parent.kind ) {
            case ts.SyntaxKind.VariableDeclaration:
                return <ts.VariableDeclaration>this.identifier.parent;

            case ts.SyntaxKind.VariableDeclarationList:
                Logger.warn( "VariableDeclaratioList in getVariableDeclaration() - returning null" );
                break;

            case ts.SyntaxKind.VariableStatement:
                Logger.warn( "VariableStatement in getVariableDeclaration() - returning null" );
                break;
        }

        return null;
    }
}
