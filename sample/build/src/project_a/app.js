/// <reference path="greeter.ts" />
define(["require", "exports", "./greeter"], function (require, exports, greeter_1) {
    window.onload = function () {
        var el = document.getElementById('content');
        var greeter = new greeter_1.Greeter(el);
        greeter.start();
    };
});
