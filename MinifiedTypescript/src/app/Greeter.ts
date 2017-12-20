export class Greeter {
    private element: HTMLElement;
    private span: HTMLElement;
    private timerToken: NodeJS.Timer;

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