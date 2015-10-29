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
import { TsCore } from "./TsCore";
import { Utils } from "./Utilities";

import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( "path" );
import chalk = require( "chalk" );

interface ProjectConfig {
    success: boolean;
    compilerOptions?: ts.CompilerOptions;
    files?: string[];
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

    public getConfig(): ProjectConfig {
        let configDirPath: string;
        let configFileName: string;

        try {
            var isConfigDirectory = fs.lstatSync(this.configPath).isDirectory();
        }
        catch (e) {
            let diagnostic = TsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot read project path '{0}'." }, this.configPath );
            return { success: false, errors: [diagnostic] };
        }

        if ( isConfigDirectory ) {
            configDirPath = this.configPath;
            configFileName = path.join( this.configPath, "tsconfig.json" );
        }
        else {
            configDirPath = path.dirname( this.configPath );
            configFileName = this.configPath;
        }

        this.configFileName = configFileName;

        Logger.info( "Reading config file:", configFileName );
        let readConfigResult = ts.readConfigFile( configFileName );

        if ( readConfigResult.error ) {
            return { success: false, errors: [readConfigResult.error] };
        }

        let configObject = readConfigResult.config;

        // parse standard project configuration objects: compilerOptions, files.
        Logger.info( "Parsing config file..." );
        var configParseResult = ts.parseConfigFile( configObject, ts.sys, configDirPath );

        if ( configParseResult.errors.length > 0 ) {
            return { success: false, errors: configParseResult.errors };
        }

        Logger.info("Parse Result: ", configParseResult);

        // parse standard project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser();
        var bundleParseResult = bundleParser.parseConfigFile( configObject, configDirPath );

        if ( bundleParseResult.errors.length > 0 ) {
            return { success: false, errors: bundleParseResult.errors };
        }

        // Parse the command line args to override project file compiler options
        let settingsCompilerOptions = this.getSettingsCompilerOptions( this.settings, configDirPath );

        // Check for any errors due to command line parsing
        if ( settingsCompilerOptions.errors.length > 0 ) {
            return { success: false, errors: settingsCompilerOptions.errors };
        }

        let compilerOptions = Utils.extend( settingsCompilerOptions.options, configParseResult.options );

        Logger.info( "Compiler options: ", compilerOptions );

        return {
            success: true,
            compilerOptions: compilerOptions,
            files: configParseResult.fileNames,
            bundles: bundleParseResult.bundles
        }
    }

    public build( outputStream: CompileStream ): ts.ExitStatus {
        let allDiagnostics: ts.Diagnostic[] = [];
        
        // Get project configuration items for the project build context.
        let config = this.getConfig();
        Logger.log( "Building Project with: " + chalk.magenta(`${this.configFileName}`) );

        if ( !config.success ) {
            let diagReporter = new DiagnosticsReporter( config.errors );
            diagReporter.reportDiagnostics();

            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }

        let compilerOptions = config.compilerOptions;
        let rootFileNames = config.files;
        let bundles = config.bundles;

        // Create host and program.
        let compilerHost = new CompilerHost( compilerOptions );
        let program = ts.createProgram( rootFileNames, compilerOptions, compilerHost );

        // Files..
        
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
}  