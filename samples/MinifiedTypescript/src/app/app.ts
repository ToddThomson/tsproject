import { Greeter } from "./Greeter";

export namespace MyApp {

    var el = document.getElementById( 'content' );
    export var greeter = new Greeter( el );
}

MyApp.greeter.start();