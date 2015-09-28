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

import ts = require( 'typescript' );
import fs = require( "fs" );
import path = require( 'path' );
import chalk = require( "chalk" );
import * as tsCore from "./TsCore";
import * as utils from "./Utilities";

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
    private overrideCompilerOptions: any;

    constructor( configPath: string, overrideCompilerOptions?: any ) {
        this.configPath = configPath;
        this.overrideCompilerOptions = overrideCompilerOptions || {};
    }

    public getConfig(): ProjectConfig {
        let configDirPath: string;
        let configFileName: string;

        try {
            var isConfigDirectory = fs.lstatSync(this.configPath).isDirectory();
        }
        catch (e) {
            let diagnostic = tsCore.createDiagnostic({ code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot read project path '{0}'." }, this.configPath );
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

        let resolvedCompilerOptions =
          this.extend({}, configParseResult.options, this.overrideCompilerOptions);

        Logger.info("Compiler options: ", resolvedCompilerOptions);
        return {
            success: true,
            compilerOptions: resolvedCompilerOptions,
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
            utils.forEach( program.getSourceFiles(), file => {
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

    private extend(obj1: any, obj2: any, ...args: any[]) : any {
        for (var i in obj2) {
            if (obj2.hasOwnProperty(i)) {
                obj1[i] = obj2[i];
            }
        }

        for (let i = 0; i < args.length; i++) {
            this.extend(obj1, args[i]);
        }

        return obj1;
    }

}
