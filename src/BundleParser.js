var Logger_1 = require("./Logger");
var Glob_1 = require("./Glob");
var utils = require("./Utilities");
var tsCore = require("./TsCore");
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
                    var files = [];
                    var config = {};
                    // Name
                    bundleName = path.join(basePath, id);
                    // Files..
                    if (utils.hasProperty(jsonBundle, "files")) {
                        if (jsonBundle["files"] instanceof Array) {
                            files = utils.map(jsonBundle["files"], function (s) { return path.join(basePath, s); });
                            files = new Glob_1.Glob().expand(files);
                            Logger_1.Logger.info("bundle files: ", files);
                        }
                        else {
                            errors.push(tsCore.createDiagnostic({ code: 6063, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' files is not an array." }, id));
                        }
                    }
                    else {
                        errors.push(tsCore.createDiagnostic({ code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' requires an array of files." }, id));
                    }
                    // Config..
                    if (utils.hasProperty(jsonBundle, "config")) {
                        config = jsonBundle.config;
                    }
                    bundles.push({ name: bundleName, files: files, config: config });
                }
            }
            return bundles;
        }
    };
    return BundleParser;
})();
exports.BundleParser = BundleParser;
//# sourceMappingURL=BundleParser.js.map