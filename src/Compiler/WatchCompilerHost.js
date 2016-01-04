var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var chokidar = require("chokidar");
var CachingCompilerHost_1 = require("./CachingCompilerHost");
/**
 * @description A typescript compiler host that supports watch incremental builds.
 */
var WatchCompilerHost = (function (_super) {
    __extends(WatchCompilerHost, _super);
    function WatchCompilerHost(compilerOptions, onSourceFileChanged) {
        var _this = this;
        _super.call(this, compilerOptions);
        this.getSourceFile = function (fileName, languageVersion, onError) {
            if (_this.reuseableProgram) {
                // Use program to get source files
                var sourceFile_1 = _this.reuseableProgram.getSourceFile(fileName);
                // If the source file has not been modified (it has a fs watcher ) then use it            
                if (sourceFile_1 && sourceFile_1.fileWatcher) {
                    //Logger.log( "getSourceFile() watcher hit for: ", fileName );
                    return sourceFile_1;
                }
            }
            // Use base class to get the source file
            //Logger.log( "getSourceFile() reading source file from fs: ", fileName );
            var sourceFile = _super.prototype.getSourceFileImpl.call(_this, fileName, languageVersion, onError);
            if (sourceFile && _this.compilerOptions.watch) {
                sourceFile.fileWatcher = chokidar.watch(sourceFile.fileName);
                sourceFile.fileWatcher.on("change", function (path, stats) { return _this.onSourceFileChanged(sourceFile, path, stats); });
            }
            return sourceFile;
        };
        this.onSourceFileChanged = onSourceFileChanged;
    }
    WatchCompilerHost.prototype.setReuseableProgram = function (program) {
        this.reuseableProgram = program;
    };
    return WatchCompilerHost;
})(CachingCompilerHost_1.CachingCompilerHost);
exports.WatchCompilerHost = WatchCompilerHost;
//# sourceMappingURL=WatchCompilerHost.js.map