import { Logger } from "./Logger";
import ts = require( 'typescript' );

export interface Bundle {
    name: string;
    modules: string[];
}

export interface ParsedBundlesResult {
    bundles: Bundle[];
    errors: ts.Diagnostic[];
}

export class Parser {
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
                Logger.log( jsonBundles );

                for ( var id in jsonBundles ) {
                    var moduleNames: string[] = jsonBundles[id];
                    var bundleName: string = id;
                    Logger.log( "Bundle: ", id, moduleNames );
                    bundles.push( { name: bundleName, modules: moduleNames } );
                }
            }

            return bundles;
        }
    }
}