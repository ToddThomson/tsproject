var foo_1 = require("./foo");
var ProjectA = (function () {
    function ProjectA() {
        this.pA = "ProjectA";
    }
    return ProjectA;
})();
exports.ProjectA = ProjectA;
var ProjectB = (function () {
    function ProjectB() {
        this.pB = 47;
    }
    return ProjectB;
})();
exports.ProjectB = ProjectB;
exports.test = new foo_1.foo().valuea;
exports.who2 = new foo_1.foo();
