function forEach(array, callback) {
    if (array) {
        for (var i = 0, len = array.length; i < len; i++) {
            var result = callback(array[i], i);
            if (result) {
                return result;
            }
        }
    }
    return undefined;
}
exports.forEach = forEach;
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasProperty(map, key) {
    return hasOwnProperty.call(map, key);
}
exports.hasProperty = hasProperty;
function clone(object) {
    var result = {};
    for (var id in object) {
        result[id] = object[id];
    }
    return result;
}
exports.clone = clone;
function map(array, f) {
    var result;
    if (array) {
        result = [];
        for (var _i = 0; _i < array.length; _i++) {
            var v = array[_i];
            result.push(f(v));
        }
    }
    return result;
}
exports.map = map;
//# sourceMappingURL=Utilities.js.map