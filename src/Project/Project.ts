import * as ts from "typescript"
import * as _ from "lodash"
import * as fs from "fs"
import * as path from "path"
import { ProjectConfig } from "./ProjectConfig"
import { TsCore } from "@TsToolsCommon/Utils/TsCore"

export class Project {
    public static getProjectConfig( configFilePath: string ): ProjectConfig {
        var configFileDir: string;
        var configFileName: string;

        try {
            var isConfigDirectory = fs.lstatSync( configFilePath ).isDirectory();
        }
        catch ( e ) {
            let diagnostic = TsCore.createDiagnostic( { code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'." }, configFilePath );

            return { success: false, errors: [diagnostic] };
        }

        if ( isConfigDirectory ) {
            configFileDir = configFilePath;
            configFileName = path.join( configFilePath, "tsconfig.json" );
        }
        else {
            configFileDir = path.dirname( configFilePath );
            configFileName = configFilePath;
        }

        let readConfigResult = ts.readConfigFile( configFileName, ( fileName ) => {
            return ts.sys.readFile( fileName );
        } );

        if ( readConfigResult.error ) {
            return { success: false, errors: [readConfigResult.error] };
        }

        let configObject = readConfigResult.config;

        // Parse standard project configuration objects: compilerOptions, files.
        var configParseResult = ts.parseJsonConfigFileContent( configObject, ts.sys, configFileDir );

        if ( configParseResult.errors.length > 0 ) {
            return { success: false, errors: configParseResult.errors };
        }

        return {
            success: true,
            compilerOptions: configParseResult.options,
            fileNames: configParseResult.fileNames
        }
    }
}