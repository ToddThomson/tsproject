var TestClass_1 = require("./TestClass");
var consumerOfTest = (function () {
    function consumerOfTest() {
    }
    consumerOfTest.prototype.constuctor = function () {
        this.testClass = new TestClass_1.TestClass();
    };
    consumerOfTest.prototype.anotherMethod = function () {
        return this.testClass.someMethod();
    };
    return consumerOfTest;
})();
//# sourceMappingURL=Tsimporttest.js.map