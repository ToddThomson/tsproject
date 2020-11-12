System.register([], function (exports_1, context_1) {
    "use strict";
    var Greeter;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            Greeter = /** @class */ (function () {
                function Greeter(element) {
                    this.element = element;
                    this.element.innerHTML += "The time is: ";
                    this.span = document.createElement('span');
                    this.element.appendChild(this.span);
                    this.span.innerText = new Date().toUTCString();
                }
                Greeter.prototype.start = function () {
                    var _this = this;
                    this.timerToken = window.setInterval(function () { return _this.span.innerHTML = new Date().toUTCString(); }, 500);
                };
                Greeter.prototype.stop = function () {
                    clearTimeout(this.timerToken);
                };
                return Greeter;
            }());
            exports_1("Greeter", Greeter);
        }
    };
});
