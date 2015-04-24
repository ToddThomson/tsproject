import { Logger } from "./Logger";
import * as utils from "./Utilities";
import ts = require( "typescript" );
import path = require( "path" );

export interface BundleConfig {
    basePath: string;
}

export interface Bundle {
    name: string;
    source: string;
    config: BundleConfig;
}

export interface ParsedBundlesResult {
    bundles: Bundle[];
    errors: ts.Diagnostic[];
}

export class BundleParser {
    constructor() {
    }

    parseConfigFile( json: any, basePath?: string ): ParsedBundlesResult {
        var errors: ts.Diagnostic[] = [];

        return {
            bundles: getBundles(),
            errors: errors
        };

        function getBundles(): Bundle[] {
            var bundles: Bundle[] = [];
            var jsonBundles = json["bundles"];

            if ( jsonBundles ) {
                Logger.info( jsonBundles );

                for ( var id in jsonBundles ) {
                    Logger.info( "Bundle Id: ", id, jsonBundles[id]);
                    var bundleName: string = id;
                    var source: string;
                    var config: any = {};

                    if ( utils.hasProperty( jsonBundles[id], "source" ) ) {
                        source = path.join( basePath, jsonBundles[id].source );
                        Logger.info( "bundle source: ", source );
                    }
                    else {
                        errors.push( utils.createDiagnostic( { code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' requires module source." }, id ) );
                    }

                    if ( utils.hasProperty( jsonBundles[id], "config" ) ) {
                        config = jsonBundles[id].config
                    }

                    bundles.push( { name: bundleName, source: source, config: config });
                }
            }

            return bundles;
        }
    }
}