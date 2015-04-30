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

enum BuildResult {
}

export class Project {
    private configPath: string;
    private configFileName: string;

    constructor( configPath: string ) {
        this.configPath = configPath;
    }

    public getConfig(): ProjectConfig {
        let configDirPath: string;
        let configFileName: string;
        let configJson: any;

        Logger.info( "Project config file path:", this.configPath );
        let isConfigDirectory = fs.lstatSync( this.configPath ).isDirectory();

        if ( isConfigDirectory ) {
            configDirPath = this.configPath;
            configFileName = path.join( this.configPath, "tsconfig.json" );
        }
        else {
            configDirPath = path.dirname( this.configPath );
            configFileName = this.configPath;
        }

        this.configFileName = configFileName;

        configJson = ts.readConfigFile( configFileName );

        if ( !configJson ) {
            let error = tsCore.createDiagnostic( { code: 6061, category: ts.DiagnosticCategory.Error, key: "Provide a valid path to the project configuration directory or file" } );
            return { success: false, errors: [error] };
        }

        // parse standard project configuration objects: compilerOptions, files.
        var configParseResult = ts.parseConfigFile( configJson, configDirPath );

        if ( configParseResult.errors.length > 0 ) {
            return { success: false, errors: configParseResult.errors };
        }

        // parse standard project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser();
        var bundleParseResult = bundleParser.parseConfigFile( configJson, configDirPath );

        if ( bundleParseResult.errors.length > 0 ) {
            return { success: false, errors: bundleParseResult.errors };
        }

        return {
            success: true,
            compilerOptions: configParseResult.options,
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
        Logger.log( "Compiling Project Files..." );
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
}  