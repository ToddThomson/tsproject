import { Logger } from "./Logger";
import * as utils from "./Utilities";
import ts = require( "typescript" );
import path = require( "path" );

export interface Bundle {
    name: string;
    source: string;
    options: any;
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
                    var options: any = {};

                    if ( utils.hasProperty( jsonBundles[id], "source" ) ) {
                        source = path.join( basePath, jsonBundles[id].source );
                        Logger.info( "bundle source: ", source );
                    }
                    else {
                        errors.push( utils.createDiagnostic( { key: "Bundle('{0}') requires module source.", id } ) );
                    }

                    if ( utils.hasProperty( jsonBundles[id], "options" ) ) {
                        options = jsonBundles[id].options
                    }

                    bundles.push( { name: bundleName, source: source, options: options });
                }
            }

            return bundles;
        }
    }
}