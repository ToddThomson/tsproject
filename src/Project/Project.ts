import * as ts from "typescript"
import * as _ from "lodash"
import * as fs from "fs"
import * as path from "path"
import { ProjectConfig } from "./ProjectConfig"
import { ProjectOptions} from "./ProjectOptions"
import { TsCore } from "../../../TsToolsCommon/src/typescript/core"

export class Project
{
    private configFilePath: string;
    private options: ProjectOptions;

    constructor( configFilePath: string, options?: ProjectOptions )
    {
        this.configFilePath = configFilePath;
        this.options = options || this.getDefaultOptions();

        // Add the bundler options to the overall project config
        //this.config.bundlerOptions = this.bundlerOptions;
    }

    public getOptions(): ProjectOptions
    {
        return this.options;
    }

    public getConfig(): ProjectConfig
    {
        var configFileDir: string;
        var configFileName: string;

        try
        {
            var isConfigDirectory = fs.lstatSync( this.configFilePath ).isDirectory();
        }
        catch ( e )
        {
            let diagnostic = TsCore.createDiagnostic(
                {
                    code: 6064,
                    category: ts.DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'."
                }, this.configFilePath );

            return { fileName: this.configFilePath, success: false, errors: [diagnostic] };
        }

        if ( isConfigDirectory )
        {
            configFileDir = this.configFilePath;
            configFileName = path.join( this.configFilePath, "tsconfig.json" );
        }
        else
        {
            configFileDir = path.dirname( this.configFilePath );
            configFileName = this.configFilePath;
        }

        let readConfigResult = ts.readConfigFile( configFileName, ( fileName ) =>
        {
            return ts.sys.readFile( fileName );
        } );

        if ( readConfigResult.error )
        {
            return { fileName: configFileName, success: false, errors: [readConfigResult.error] };
        }

        let configObject = readConfigResult.config;

        // Parse standard project configuration objects: compilerOptions, files.
        var configParseResult = ts.parseJsonConfigFileContent( configObject, ts.sys, configFileDir );

        if ( configParseResult.errors.length > 0 )
        {
            return { fileName: configFileName, success: false, errors: configParseResult.errors };
        }

        return {
            fileName: configFileName,
            success: true,
            compilerOptions: configParseResult.options,
            files: configParseResult.fileNames
        }
    }

    //private parseBundleConfig(): ProjectConfig
    //{
    //    // Parse "bundle" project configuration objects: compilerOptions, files.
    //    var bundleParser = new BundleConfigParser();
    //    var bundlesParseResult = bundleParser.parseConfigFile( configObject, this.configFileDir );

    //    if ( bundlesParseResult.errors.length > 0 )
    //    {
    //        return { success: false, errors: bundlesParseResult.errors };
    //    }

    //    // The returned bundles "Files" list may contain file glob patterns. 
    //    bundlesParseResult.bundles.forEach( bundle =>
    //    {
    //        bundle.fileNames = this.expandFileNames( bundle.fileNames, this.configFileDir );
    //    } );

    //    // Parse the command line args to override project file compiler options
    //    let settingsCompilerOptions = this.getSettingsCompilerOptions( this.settings, this.configFileDir );

    //    // Check for any errors due to command line parsing
    //    if ( settingsCompilerOptions.errors.length > 0 )
    //    {
    //        return { success: false, errors: settingsCompilerOptions.errors };
    //    }

    //    let compilerOptions = Utils.extend( settingsCompilerOptions.options, configParseResult.options );

    //    return {
    //        success: true,
    //        compilerOptions: compilerOptions,
    //        fileNames: configParseResult.fileNames,
    //        bundles: bundlesParseResult.bundles
    //    }
    //}

    private readFile( fileName: string ): string
    {
        return ts.sys.readFile( fileName );
    }

    private getSettingsCompilerOptions( jsonSettings: any, configDirPath: string ): ts.ParsedCommandLine
    {
        // Parse the json settings from the TsProject src() API
        let parsedResult = ts.parseJsonConfigFileContent( jsonSettings, ts.sys, configDirPath );

        // Check for compiler options that are not relevent/supported.

        // Not supported: --project, --init
        // Ignored: --help, --version

        if ( parsedResult.options.project )
        {
            let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--project" );
            parsedResult.errors.push( diagnostic );
        }

        // FIXME: Perhaps no longer needed?

        //if ( parsedResult.options.init ) {
        //    let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--init" );
        //    parsedResult.errors.push( diagnostic );
        //}

        return parsedResult;
    }

    private getDefaultOptions(): ProjectOptions
    {
        return {
            logLevel: 0,
            verbose: false,
            outputToDisk: true
        }
    }
}