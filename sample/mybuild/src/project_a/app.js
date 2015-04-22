/// <reference path="greeter.ts" />
var greeter_1 = require("./greeter");
window.onload = function () {
    var el = document.getElementById('content');
    var greeter = new greeter_1.Greeter(el);
    greeter.start();
};
