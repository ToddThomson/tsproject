var ts = require("typescript");
var path = require("path");
var Utilities_1 = require("./Utilities");
/**
 * @description A typescript compiler host that supports incremental builds and optimizations for file reads and file exists functions. Emit output is saved to memory.
 */
var CachingCompilerHost = (function () {
    function CachingCompilerHost(compilerOptions) {
        var _this = this;
        this.output = {};
        this.dirExistsCache = {};
        this.dirExistsCacheSize = 0;
        this.fileExistsCache = {};
        this.fileExistsCacheSize = 0;
        this.fileReadCache = {};
        this.getSourceFile = this.getSourceFileImpl;
        this.fileExists = function (fileName) {
            fileName = _this.getCanonicalFileName(fileName);
            // Prune off searches on directories that don't exist
            if (!_this.dirExists(path.dirname(fileName))) {
                return false;
            }
            if (Utilities_1.Utils.hasProperty(_this.fileExistsCache, fileName)) {
                //Logger.log( "fileExists() Cache hit: ", fileName, this.fileExistsCache[ fileName ] );
                return _this.fileExistsCache[fileName];
            }
            _this.fileExistsCacheSize++;
            //Logger.log( "fileExists() Adding to cache: ", fileName, this.baseHost.fileExists( fileName ), this.fileExistsCacheSize );
            return _this.fileExistsCache[fileName] = _this.baseHost.fileExists(fileName);
        };
        this.compilerOptions = compilerOptions;
        this.baseHost = ts.createCompilerHost(this.compilerOptions);
    }
    CachingCompilerHost.prototype.getOutput = function () {
        return this.output;
    };
    CachingCompilerHost.prototype.getSourceFileImpl = function (fileName, languageVersion, onError) {
        // Use baseHost to get the source file
        //Logger.log( "getSourceFile() reading source file from fs: ", fileName );
        return this.baseHost.getSourceFile(fileName, languageVersion, onError);
    };
    CachingCompilerHost.prototype.writeFile = function (fileName, data, writeByteOrderMark, onError) {
        this.output[fileName] = data;
    };
    CachingCompilerHost.prototype.readFile = function (fileName) {
        if (Utilities_1.Utils.hasProperty(this.fileReadCache, fileName)) {
            //Logger.log( "readFile() cache hit: ", fileName );
            return this.fileReadCache[fileName];
        }
        //Logger.log( "readFile() Adding to cache: ", fileName );
        return this.fileReadCache[fileName] = this.baseHost.readFile(fileName);
    };
    // Use Typescript CompilerHost "base class" implementation..
    CachingCompilerHost.prototype.getDefaultLibFileName = function (options) {
        return this.baseHost.getDefaultLibFileName(options);
    };
    CachingCompilerHost.prototype.getCurrentDirectory = function () {
        return this.baseHost.getCurrentDirectory();
    };
    CachingCompilerHost.prototype.getCanonicalFileName = function (fileName) {
        return this.baseHost.getCanonicalFileName(fileName);
    };
    CachingCompilerHost.prototype.useCaseSensitiveFileNames = function () {
        return this.baseHost.useCaseSensitiveFileNames();
    };
    CachingCompilerHost.prototype.getNewLine = function () {
        return this.baseHost.getNewLine();
    };
    CachingCompilerHost.prototype.dirExists = function (directoryPath) {
        if (Utilities_1.Utils.hasProperty(this.dirExistsCache, directoryPath)) {
            //Logger.log( "dirExists() hit", directoryPath, this.dirExistsCache[ directoryPath ] );
            return this.dirExistsCache[directoryPath];
        }
        this.dirExistsCacheSize++;
        //Logger.log( "dirExists Adding: ", directoryPath, ts.sys.directoryExists( directoryPath ), this.dirExistsCacheSize );
        return this.dirExistsCache[directoryPath] = ts.sys.directoryExists(directoryPath);
    };
    return CachingCompilerHost;
})();
exports.CachingCompilerHost = CachingCompilerHost;
//# sourceMappingURL=CachingCompilerHost.js.map