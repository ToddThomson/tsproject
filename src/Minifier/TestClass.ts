// SourcFile Container: 248

class BaseClass {
    private baseProp1: string = "Property 1";
    private baseProp2: number = 2;
}

class MetaClass extends BaseClass {
    private propA: string = "Meta Property A";
    private propB: number = 4;
}

export class TestClass {

    private gerb1: number = 1;
    private gerb2: number = 2;
    private gerb3: number = 3;
    private gerb4: number = 4;
    public gerb5: number = 5;

    // Method container
    public fPublic(): number {
        let bundle: any = { name: "gerb", fileNames: ["string"], config: undefined };
        let result = this.f1();
        
        // Node: kind = 211 forInStatement;
        for ( var filesKey in bundle.fileNames ) {
            let fileName = bundle.fileNames[filesKey];
        }

        return result;
    }

    private f1(): number {
        let result = this.f2( this.gerb1, this.gerb2 ) + this.f3( this.gerb3 );

        return result;
    }

    private f2( parm1: number, parm2: number ): number {
        var result = parm1 + parm2;

        return result;
    }
    private f3( parm1: number ): number {
        return parm1 + this.f2( this.gerb4, this.gerb5 );
    }
}

var test = new TestClass();
var t1 = test.fPublic();
console.log( t1 );
