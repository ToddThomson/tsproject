import { Compiler } from "./Compiler";
import { CompilerResult } from "./CompilerResult";
import { CompilerReporter } from "./CompilerReporter";
import { DiagnosticsReporter } from "./DiagnosticsReporter";
import { CompilerHost }  from "./CompilerHost";
import { CompileStream }  from "./CompileStream";
import { BundleCompiler } from "./BundleCompiler";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle } from "./BundleParser";
import { Glob } from "./Glob";
import { TsCore } from "./TsCore";
import { Utils } from "./Utilities";

import ts = require( "typescript" );
import _ = require( "lodash" );
import fs = require( "fs" );
import path = require( "path" );
import chalk = require( "chalk" );

export interface ParsedProjectConfig {
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    fileNames?: string[];
    bundles?: Bundle[];
    errors?: ts.Diagnostic[];
}

export class Project {
    private configPath: string;
    private configFileName: string;
    private settings: any;

    constructor( configPath: string, settings?: any  ) {
        this.configPath = configPath;
        this.settings = settings;
    }

    public parseProjectConfig( configPath: string, settings: any ): ParsedProjectConfig {
        let configDirPath: string;
        let configFileName: string;

        try {
            var isConfigDirectory = fs.lstatSync( configPath ).isDirectory();
        }
        catch ( e ) {
            let diagnostic = TsCore.createDiagnostic( { code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot read project path '{0}'." }, this.configPath );
            return { success: false, errors: [diagnostic] };
        }

        if ( isConfigDirectory ) {
            configDirPath = configPath;
            configFileName = path.join( configPath, "tsconfig.json" );
        }
        else {
            configDirPath = path.dirname( configPath );
            configFileName = configPath;
        }

        this.configFileName = configFileName;

        Logger.info( "Reading config file:", configFileName );
        let readConfigResult = ts.readConfigFile( configFileName );

        if ( readConfigResult.error ) {
            return { success: false, errors: [readConfigResult.error] };
        }

        let configObject = readConfigResult.config;

        // Parse standard project configuration objects: compilerOptions, files.
        Logger.info( "Parsing config file..." );
        var configParseResult = ts.parseConfigFile( configObject, ts.sys, configDirPath );

        if ( configParseResult.errors.length > 0 ) {
            return { success: false, errors: configParseResult.errors };
        }

        // The returned "Files" list may contain file glob patterns. 
        configParseResult.fileNames = this.expandFileNames( configParseResult.fileNames, configDirPath );

        // The glob file patterns in "Files" is an enhancement to the standard Typescript project file (tsconfig.json) spec.
        // To convert the project file to use only a standard filename list, specify the setting: "convertFiles" : "true"
        if ( settings.convertFiles === true ) {
            this.convertProjectFileNames( configParseResult.fileNames, configDirPath );
        }

        // Parse "bundle" project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser();
        var bundlesParseResult = bundleParser.parseConfigFile( configObject, configDirPath );

        if ( bundlesParseResult.errors.length > 0 ) {
            return { success: false, errors: bundlesParseResult.errors };
        }

        // The returned bundles "Files" list may contain file glob patterns. 
        bundlesParseResult.bundles.forEach( bundle => {
            bundle.fileNames = this.expandFileNames( bundle.fileNames, configDirPath );
        });

        // Parse the command line args to override project file compiler options
        let settingsCompilerOptions = this.getSettingsCompilerOptions( settings, configDirPath );

        // Check for any errors due to command line parsing
        if ( settingsCompilerOptions.errors.length > 0 ) {
            return { success: false, errors: settingsCompilerOptions.errors };
        }

        let compilerOptions = Utils.extend( settingsCompilerOptions.options, configParseResult.options );

        Logger.info( "Compiler options: ", compilerOptions );

        return {
            success: true,
            compilerOptions: compilerOptions,
            fileNames: configParseResult.fileNames,
            bundles: bundlesParseResult.bundles
        }
    }

    public build( outputStream: CompileStream ): ts.ExitStatus {
        let allDiagnostics: ts.Diagnostic[] = [];
        
        // Get project configuration items for the project build context.
        let config = this.parseProjectConfig( this.configPath, this.settings );
        Logger.log( "Building Project with: " + chalk.magenta(`${this.configFileName}`) );

        if ( !config.success ) {
            let diagReporter = new DiagnosticsReporter( config.errors );
            diagReporter.reportDiagnostics();

            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }

        let compilerOptions = config.compilerOptions;
        let rootFileNames = config.fileNames;
        let bundles = config.bundles;

        // Create host and program.
        let compilerHost = new CompilerHost( compilerOptions );
        let program = ts.createProgram( rootFileNames, compilerOptions, compilerHost );

        var compiler = new Compiler( compilerHost, program );
        var compileResult = compiler.compileFilesToStream( outputStream );
        let compilerReporter = new CompilerReporter( compileResult );

        if ( !compileResult.succeeded() ) {
            compilerReporter.reportDiagnostics();

            if ( compilerOptions.noEmitOnError ) {
                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }

            allDiagnostics = allDiagnostics.concat( compileResult.getErrors() );
        }

        if ( compilerOptions.listFiles ) {
            Utils.forEach( program.getSourceFiles(), file => {
                Logger.log( file.fileName );
            });
        }

        // Don't report statistics if there are no output emits
        if ( ( compileResult.getStatus() !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped ) && compilerOptions.diagnostics ) {
            compilerReporter.reportStatistics();
        }

        // Bundles..
        var bundleCompiler = new BundleCompiler( compilerHost, program );

        for ( var i = 0, len = bundles.length; i < len; i++ ) {
            Logger.log( "Compiling Project Bundle: ", chalk.cyan( bundles[i].name ) );
            compileResult = bundleCompiler.compileBundleToStream( outputStream, bundles[i] );
            compilerReporter = new CompilerReporter( compileResult );

            if ( !compileResult.succeeded() ) {
                compilerReporter.reportDiagnostics();

                if ( compilerOptions.noEmitOnError ) {
                    return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
                }

                allDiagnostics = allDiagnostics.concat( compileResult.getErrors() );
            }

            // Don't report statistics if there are no output emits
            if ( ( compileResult.getStatus() !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped ) && compilerOptions.diagnostics ) {
                compilerReporter.reportStatistics();
            }
        }

        if ( allDiagnostics.length > 0 ) {
            return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
        }

        return ts.ExitStatus.Success;
    }

    private getSettingsCompilerOptions( jsonSettings: any, configDirPath: string ): ts.ParsedCommandLine {
        // Parse the json settings from the TsProject src() API
        let parsedResult = ts.parseConfigFile( jsonSettings, ts.sys, configDirPath );

        // Check for compiler options that are not relevent/supported.

        // Not supported: --project, --init
        // Ignored: --help, --version

        if ( parsedResult.options.project ) {
            let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The compiler option '{0}' is not supported in this context." }, "--project" );
            parsedResult.errors.push( diagnostic );
        }

        if ( parsedResult.options.init ) {
            let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The compiler option '{0}' is not supported in this context." }, "--init" );
            parsedResult.errors.push( diagnostic );
        }

        return parsedResult;
    }

    private expandFileNames( files: string[], configDirPath: string ): string[] {
        // The parameter files may contain a mix of glob patterns and filenames.
        // glob.expand() will only return a list of all expanded "found" files. 
        // For filenames without glob patterns, we add them to the list of files as we will want to know
        // if any filenames are not found during bundle processing.

        var glob = new Glob();
        var nonglobFiles: string[] = [];

        Utils.forEach( files, file => {
            if ( !glob.hasPattern( file ) ) {
                nonglobFiles.push( path.normalize( file ) );
            }
        });
                            
        // Get the list of expanded glob files
        var globFiles = glob.expand( files, configDirPath );
        var normalizedGlobFiles: string[] = [];

        // Normalize file paths for matching
        Utils.forEach( globFiles, file => {
            normalizedGlobFiles.push( path.normalize( file ) );
        });

        // The overall file list is the union of both non-glob and glob files
        return _.union( normalizedGlobFiles, nonglobFiles );
    }

    // TJT: This method really should be in src()
    private convertProjectFileNames( fileNames: string[], configDirPath: string ) {
        Logger.log( "Converting project files." );
        let configFileText = "";
        try {
            configFileText = fs.readFileSync( this.configFileName, 'utf8' );

            if ( configFileText !== undefined ) {
                let jsonConfigObject = JSON.parse( configFileText );

                let relativeFileNames = [];
                fileNames.forEach( fileName => {
                    relativeFileNames.push ( path.relative( configDirPath, fileName ).replace( /\\/g, "/" ) );
                });

                jsonConfigObject["files"] = relativeFileNames;

                fs.writeFileSync( this.configFileName, JSON.stringify( jsonConfigObject, undefined, 4 ) );
            }
        }
        catch( e ) {
            Logger.log( chalk.yellow( "Converting project files failed." ) );
        }
    }
}