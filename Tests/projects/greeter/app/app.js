System.register(["./Greeter"], function (exports_1, context_1) {
    "use strict";
    var Greeter_1, MyApp;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (Greeter_1_1) {
                Greeter_1 = Greeter_1_1;
            }
        ],
        execute: function () {
            (function (MyApp) {
                var el = document.getElementById('content');
                MyApp.greeter = new Greeter_1.Greeter(el);
            })(MyApp || (MyApp = {}));
            exports_1("MyApp", MyApp);
            MyApp.greeter.start();
        }
    };
});
