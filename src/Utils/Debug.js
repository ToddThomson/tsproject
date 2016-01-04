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
    Debug.assert = assert;
})(Debug = exports.Debug || (exports.Debug = {}));
//# sourceMappingURL=Debug.js.map