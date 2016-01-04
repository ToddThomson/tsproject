var Debug;
(function (Debug) {
    function assert(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message;
        }
    }
})(Debug = exports.Debug || (exports.Debug = {}));
//# sourceMappingURL=Debugger.js.map