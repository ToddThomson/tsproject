<<<<<<< HEAD
﻿// SourcFile Container: 248

//import ts = require( "typescript" );
//import { Bundle } from "../Bundler/BundleParser";

// Class Container 
export class TestClass {

    private gerb1: number = 1;  //gerb1 -> a
    private gerb2: number = 2;  //gerb1 -> b
    private gerb3: number = 3;  //gerb1 -> c
    private gerb4: number = 4;  //gerb1 -> d
    public gerb5: number = 5;   // public

    // Method container
    public fPublic(): number {
        let bundle: any = { name: "gerb", fileNames: ["string"], config: undefined };
        let result = this.f1();
        
        let bugMarker = 4;

        // Node: kind = 211 forInStatement;
        for ( var filesKey in bundle.fileNames ) {
            let fileName = bundle.fileNames[filesKey];
        }
=======
﻿export class TestClass {

    private gerb1: number = 1;
    private gerb2: number = 2;
    private gerb3: number = 3;
    private gerb4: number = 4;

    public fPublic(): number {
        let result = this.f1();
>>>>>>> origin/master

        return result;
    }

<<<<<<< HEAD
    private f1(): number { // f1 -> e
        let result = this.f2( this.gerb1, this.gerb2 ) + this.f3( this.gerb3 );
=======
    private f1(): number {
        let result = this.f2( 5, 2 ) + this.f3( 19 );
>>>>>>> origin/master

        return result;
    }

<<<<<<< HEAD
    private f2( parm1: number, parm2: number ): number { // f2 -> f
        var result = parm1 + parm2;

        return result;
    }
    private f3( parm1: number ): number { // f3 -> g
        return parm1 + this.f2( this.gerb4, this.gerb5 );
    }
}

var test = new TestClass(); // test -> a
var t1 = test.fPublic(); // t1 -> b
=======
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
>>>>>>> origin/master
console.log( t1 );