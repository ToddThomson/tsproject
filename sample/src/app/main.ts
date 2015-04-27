/// <reference path="greeter.ts" />

import { Greeter } from "./greeter";

var el = document.getElementById( 'content' );
var greeter = new Greeter( el );

greeter.start();
