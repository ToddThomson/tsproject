var chalk = require("chalk");
exports.level = {
    none: 0,
    info: 1,
    warn: 2,
    error: 3
};
var Logger = (function () {
    function Logger() {
    }
    Logger.setLevel = function (level) {
        this.logLevel = level;
    };
    Logger.setName = function (name) {
        this.logName = name;
    };
    Logger.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        console.log.apply(console, [chalk.gray("[" + this.logName + "]")].concat(args));
    };
    Logger.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (this.logLevel < exports.level.info) {
            return;
        }
        console.log.apply(console, [chalk.gray(("[" + this.logName + "]") + chalk.blue(" INFO: "))].concat(args));
    };
    Logger.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (this.logLevel < exports.level.warn) {
            return;
        }
        console.log.apply(console, [("[" + this.logName + "]") + chalk.yellow(" WARNING: ")].concat(args));
    };
    Logger.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (this.logLevel < exports.level.error) {
            return;
        }
        console.log.apply(console, [("[" + this.logName + "]") + chalk.red(" ERROR: ")].concat(args));
    };
    Logger.logLevel = exports.level.none;
    Logger.logName = "logger";
    return Logger;
})();
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map