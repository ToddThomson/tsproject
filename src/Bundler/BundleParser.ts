import { Logger } from "../Reporting/Logger";
import { Utils } from "../Utils/Utilities";
import { TsCore } from "../Utils/TsCore";

import ts = require( "typescript" );
import path = require( "path" );

export interface BundleConfig {
    sourceMap: boolean;
    declaration: boolean;
    outDir: string;
    minify: boolean;
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
    
    public parseConfigFile( json: any, basePath: string ): ParsedBundlesResult {
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

                    bundles.push( { name: bundleName, fileNames: fileNames, config: config } );
                }
            }

            return bundles;
        }
    }
}