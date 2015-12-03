var Logger_1 = require("./Logger");
var Utilities_1 = require("./Utilities");
var TsCore_1 = require("./TsCore");
var ts = require("typescript");
var path = require("path");
var BundleParser = (function () {
    function BundleParser() {
    }
    BundleParser.prototype.parseConfigFile = function (json, basePath) {
        var errors = [];
        return {
            bundles: getBundles(),
            errors: errors
        };
        function getBundles() {
            var bundles = [];
            var jsonBundles = json["bundles"];
            if (jsonBundles) {
                Logger_1.Logger.info(jsonBundles);
                for (var id in jsonBundles) {
                    Logger_1.Logger.info("Bundle Id: ", id, jsonBundles[id]);
                    var jsonBundle = jsonBundles[id];
                    var bundleName;
                    var fileNames = [];
                    var config = {};
                    // Name
                    bundleName = path.join(basePath, id);
                    // Files..
                    if (Utilities_1.Utils.hasProperty(jsonBundle, "files")) {
                        if (jsonBundle["files"] instanceof Array) {
                            fileNames = Utilities_1.Utils.map(jsonBundle["files"], function (s) { return path.join(basePath, s); });
                            Logger_1.Logger.info("bundle files: ", fileNames);
                        }
                        else {
                            errors.push(TsCore_1.TsCore.createDiagnostic({ code: 6063, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' files is not an array." }, id));
                        }
                    }
                    else {
                        errors.push(TsCore_1.TsCore.createDiagnostic({ code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' requires an array of files." }, id));
                    }
                    // Config..
                    if (Utilities_1.Utils.hasProperty(jsonBundle, "config")) {
                        config = jsonBundle.config;
                    }
                    bundles.push({ name: bundleName, fileNames: fileNames, config: config });
                }
            }
            return bundles;
        }
    };
    return BundleParser;
})();
exports.BundleParser = BundleParser;
//# sourceMappingURL=BundleParser.js.map