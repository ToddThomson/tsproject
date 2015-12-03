var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream = require("stream");
var CompileStream = (function (_super) {
    __extends(CompileStream, _super);
    function CompileStream(opts) {
        _super.call(this, { objectMode: true });
    }
    CompileStream.prototype._read = function () {
        // Safely do nothing
    };
    return CompileStream;
})(stream.Readable);
exports.CompileStream = CompileStream;
//# sourceMappingURL=CompileStream.js.map