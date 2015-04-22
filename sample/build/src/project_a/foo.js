define(["require", "exports"], function (require, exports) {
    var foo = (function () {
        function foo() {
        }
        return foo;
    })();
    exports.foo = foo;
});
