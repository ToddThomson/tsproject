export class TestClass {

    private gerb1: number = 1;
    private gerb2: number = 2;
    private gerb3: number = 3;
    private gerb4: number = 4;

    public fPublic(): number {
        let result = this.f1();

        return result;
    }

    private f1(): number {
        let result = this.f2( 5, 2 ) + this.f3( 19 );

        return result;
    }

    private f2( parm1: number, parm2: number ): number {
        let result = parm1 + parm2;

        return result;
    }
    private f3( parm1: number ): number {
        return parm1 + this.f2( 1, 2 );
    }
}

var test = new TestClass();
var t1 = test.fPublic();
console.log( t1 );