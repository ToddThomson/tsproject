       class a       {
    private b      : HTMLElement;
    private c   : HTMLElement;
    private d         : NodeJS.Timer;

    constructor( d      : HTMLElement ) {
        this.b       = d      ;
        this.b      .innerHTML += "The time is: ";
        this.c    = document.createElement( 'span' );
        this.b      .appendChild( this.c    );
        this.c   .innerText = new Date().toUTCString();
    }

    e    () {
        this.d          = setInterval(() => this.c   .innerHTML = new Date().toUTCString(), 500 );
    }

    f   () {
        clearTimeout( this.d          );
    }
}
                                    

export namespace MyApp {

    var f  = document.getElementById( 'content' );
    export var g       = new a      ( f  );
}

MyApp.g      .e    ();
