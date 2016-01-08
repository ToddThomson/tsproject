import ts = require( "typescript" );

export class IdentifierInfo {

    private identifier: ts.Identifier;
    private symbol: ts.Symbol;

    public refs: ts.Identifier[];
    public shortenedName: string = undefined;

    constructor( identifier: ts.Identifier, symbol: ts.Symbol ) {
        this.identifier = identifier;
        this.symbol = symbol;
        this.refs = [identifier];
    }

    public getName(): string {
        return this.symbol.name;
    }

    public getId(): number {
        return ( <any>this.symbol ).id;
    }

    public getUniqueName(): string {
        return this.getId().toString();
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

    public isPrivateMethod(): boolean {
        if ( ( this.symbol.flags & ts.SymbolFlags.Method ) > 0 ) {
            
            // A method has a value declaration
            let flags = this.symbol.valueDeclaration.flags;

            if ( ( flags & ts.NodeFlags.Private ) > 0 ) {
                return true;
            }
        }

        return false;
    }

    public isPrivateProperty(): boolean {
        if ( ( this.symbol.flags & ts.SymbolFlags.Property ) > 0 ) {
            // A property has a value declaration
            let flags = this.symbol.valueDeclaration.flags;

            if ( ( flags & ts.NodeFlags.Private ) > 0 ) {
                return true;
            }
        }

        return false;
    }

    private getVariableDeclaration(): ts.VariableDeclaration {

        switch ( ( <ts.Node>this.identifier ).parent.kind ) {
            case ts.SyntaxKind.VariableDeclaration:
                return <ts.VariableDeclaration>this.identifier.parent;

                break;

            case ts.SyntaxKind.VariableDeclarationList:
                break;

            case ts.SyntaxKind.VariableStatement:
                break;
        }

        return null;
    }
}