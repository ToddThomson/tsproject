"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
var GreeterModule_1 = require("./GreeterModule");
var Main = /** @class */ (function () {
    function Main() {
    }
    Main.prototype.Hello = function () {
        var greeterz = new GreeterModule_1.Greeter();
        console.log(greeterz.SayHello());
    };
    return Main;
}());
exports.Main = Main;
//# sourceMappingURL=main.js.map