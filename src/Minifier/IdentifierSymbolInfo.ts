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

    public isVariable(): boolean {
        let variableDeclaration = this.getVariableDeclaration();
        if ( variableDeclaration )
            return true;

        return false;
    }

    public isFunction(): boolean {
        let functionDeclaration = this.getFunctionDeclaration();
        if ( functionDeclaration )
            return true;

        return false;
    }

    public isBlockScopedVariable(): boolean {
        let variableDeclaration = this.getVariableDeclaration();

        if ( variableDeclaration ) {
            return ( ( variableDeclaration.parent.flags & ts.NodeFlags.Let ) !== 0 ) ||
                ( ( variableDeclaration.parent.flags & ts.NodeFlags.Const ) !== 0 );
        }

        return false;
    }

    private getVariableDeclaration(): ts.VariableDeclaration {

        if ( this.symbol.name === "pathLen" ) {
            let logger =1;
        }

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

    private getFunctionDeclaration(): ts.FunctionDeclaration {
        let currentParent = ( <ts.Node>this.identifier ).parent;
        // function parameter, no variable declaration

        while ( currentParent.kind !== ts.SyntaxKind.FunctionDeclaration ) {
            if ( currentParent.parent == null ) {
                return null;
            } else {
                currentParent = currentParent.parent;
            }
        }
        return <ts.FunctionDeclaration>currentParent;
    }

    private isVisible(): boolean {
        return true;
    }

}