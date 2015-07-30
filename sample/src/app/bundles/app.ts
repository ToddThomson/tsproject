                             
export class baz {
    public foo2 = new foo();
    public bazValue3: number = 45
}
                             

export class foo {
    public bazValue = new baz().bazValue3;
    valuea: string;
}

export class foo2 {
    public fooVal: string = "foo2you";
}
                             
export class bar {
    public foo2 = new foo();
    public barvalue3: number = 45;
}
                           

export class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;

    constructor( element: HTMLElement ) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement( 'span' );
        this.element.appendChild( this.span );
        this.span.innerText = new Date().toUTCString();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500 );
    }

    stop() {
        clearTimeout( this.timerToken );
    }

}
                                     

var el = document.getElementById( 'content' );
var greeter = new Greeter( el );

greeter.start();

