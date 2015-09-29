import { Logger } from "./Logger";
import { Glob } from "./Glob";
import * as utils from "./Utilities";
import * as tsCore from "./TsCore";

import _ = require( "lodash" );
import ts = require( "typescript" );
import path = require( "path" );

export interface BundleConfig {
    outDir: string;
}

export interface Bundle {
    name: string;
    files: string[];
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
                    var files: string[] = [];
                    var config: any = {};

                    // Name
                    bundleName = path.join( basePath, id );

                    // Files..
                    if ( utils.hasProperty( jsonBundle, "files" ) ) {
                        if ( jsonBundle["files"] instanceof Array ) {
                            files = utils.map( <string[]>jsonBundle["files"], s => path.join( basePath, s ) );

                            // The bundle files may contain a mix of glob patterns and filenames.
                            // glob.expand() will only return a list of all expanded "found" files. 
                            // For filenames without glob patterns, we add them to the list of files as we will want to know
                            // if any filenames are not found during bundle processing.

                            var glob = new Glob();
                            var nonglobFiles: string[] = [];

                            utils.forEach( files, file => {
                                if ( !glob.hasPattern( file ) ) {
                                    nonglobFiles.push( file );
                                }
                            });
                            
                            // Get the list of expanded glob files
                            var globFiles = glob.expand( files );
                            var normalizedGlobFiles: string[] = [];

                            // Normalize paths of glob files so we can match properly. Glob returns forward slash separators.
                            utils.forEach( globFiles, file => {
                                normalizedGlobFiles.push( path.normalize( file ) );

                            });

                            // The overall file list is the union of both non-glob and glob files
                            files = _.union( normalizedGlobFiles, nonglobFiles );

                            Logger.info( "bundle files: ", files );
                        }
                        else {
                            errors.push( tsCore.createDiagnostic( { code: 6063, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' files is not an array." }, id ) );
                        }
                    }
                    else {
                        errors.push( tsCore.createDiagnostic( { code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' requires an array of files." }, id ) );
                    }

                    // Config..
                    if ( utils.hasProperty( jsonBundle, "config" ) ) {
                        config = jsonBundle.config
                    }

                    bundles.push( { name: bundleName, files: files, config: config });
                }
            }

            return bundles;
        }
    }
}