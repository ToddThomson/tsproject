define(["require", "exports", "./foo"], function (require, exports, foo_1) {
    var bar = (function () {
        function bar() {
            this.foo2 = new foo_1.foo();
            this.barvalue3 = 45;
        }
        return bar;
    })();
    exports.bar = bar;
});
