/// <reference path="greeter.ts" />

import { Greeter } from "./greeter";

window.onload = () => {
    var el = document.getElementById( 'content' );
    var greeter = new Greeter( el );

    greeter.start();
};