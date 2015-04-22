export class foo {
    valuea: string;
}

                             
export class bar {
    public foo2 = new foo();
    public barvalue3: number = 45
}
                           

export class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;
    private bar: bar;

    constructor( element: HTMLElement ) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement( 'span' );
        this.element.appendChild( this.span );
        this.span.innerText = new Date().toUTCString();
        this.bar = new bar();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500 );
    }

    stop() {
        clearTimeout( this.timerToken );
    }

}

window.onload = () => {
    var el = document.getElementById( 'content' );
    var greeter = new Greeter( el );
    greeter.start();
};

                                                                   

export class ProjectA {
    constructor() { }
    
    public pA: string = "ProjectA";
}

export class ProjectB {
    public pB: number = 47;
}                                

export var test = new foo().valuea;
export var who2: foo = new foo();

