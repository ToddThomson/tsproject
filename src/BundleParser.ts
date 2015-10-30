import { Logger } from "./Logger";
import { Utils } from "./Utilities";
import { TsCore } from "./TsCore";

//import _ = require( "lodash" );
import ts = require( "typescript" );
import path = require( "path" );

export interface BundleConfig {
    outDir: string;
}

export interface Bundle {
    name: string;
    fileNames: string[];
    config: BundleConfig;
}

export interface ParsedBundlesResult {
    bundles: Bundle[];
    errors: ts.Diagnostic[];
}

export class BundleParser {
    
    parseConfigFile( json: any, basePath: string ): ParsedBundlesResult {
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
                    Logger.info( "Bundle Id: ", id, jsonBundles[id] );
                    var jsonBundle: any = jsonBundles[id];
                    var bundleName: string;
                    var fileNames: string[] = [];
                    var config: any = {};

                    // Name
                    bundleName = path.join( basePath, id );

                    // Files..
                    if ( Utils.hasProperty( jsonBundle, "files" ) ) {
                        if ( jsonBundle["files"] instanceof Array ) {
                            fileNames = Utils.map( <string[]>jsonBundle["files"], s => path.join( basePath, s ) );
                            Logger.info( "bundle files: ", fileNames );
                        }
                        else {
                            errors.push( TsCore.createDiagnostic( { code: 6063, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' files is not an array." }, id ) );
                        }
                    }
                    else {
                        errors.push( TsCore.createDiagnostic( { code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' requires an array of files." }, id ) );
                    }

                    // Config..
                    if ( Utils.hasProperty( jsonBundle, "config" ) ) {
                        config = jsonBundle.config
                    }

                    bundles.push( { name: bundleName, fileNames: fileNames, config: config });
                }
            }

            return bundles;
        }
    }
}