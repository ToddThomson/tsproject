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

    constructor( configPath: string ) {
        this.configPath = configPath;
    }

    public getConfig(): ProjectConfig {
        Logger.log( "---> Entering getConfig()" );
        let configDirPath: string;
        let configFileName: string;
        let configJson: any;
        let isConfigDirectory = fs.lstatSync( this.configPath ).isDirectory();

        if ( isConfigDirectory ) {
            configDirPath = this.configPath;
            configFileName = path.join( this.configPath, "tsconfig.json" );
        }
        else {
            configDirPath = path.dirname( this.configPath );
            configFileName = this.configPath;
        }

        Logger.log( "configFileName: ", configFileName );

        configJson = ts.readConfigFile( configFileName );

        if ( !configJson ) {
            Logger.log( "Error reading configJson" );
            let error = utils.createDiagnostic( "Provide a valid path to the project configuration directory or file" );
            return { success: false, errors: [error] };
        }

        // parse standard project configuration objects: compilerOptions, files.
        var configParseResult = ts.parseConfigFile( configJson, configDirPath );

        if ( configParseResult.errors.length > 0 ) {
            Logger.log( "standard parseConfigFile errors" );
            return { success: false, errors: configParseResult.errors };
        }

        Logger.log( configParseResult );

        // parse standard project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser();
        var bundleParseResult = bundleParser.parseConfigFile( configJson, configDirPath );

        if ( bundleParseResult.errors.length > 0 ) {
            Logger.log( "bundle parseConfigFile errors" );
            return { success: false, errors: bundleParseResult.errors };
        }

        return {
            success: true,
            compilerOptions: configParseResult.options,
            files: configParseResult.fileNames,
            bundles: bundleParseResult.bundles
        }
    }

    public build( outputStream: CompileStream ): boolean {
        Logger.log( "Entering build()" );

        // Get project configuration items for the project build context.
        let config = this.getConfig();

        if ( !config.success ) {
            Logger.log( "getConfig() failed" );
            let diagReporter = new DiagnosticsReporter( config.errors );
            diagReporter.reportDiagnostics();

            return false;
        }

        let compilerOptions = config.compilerOptions;
        let rootFileNames = config.files;
        let bundles = config.bundles;

        Logger.log( "Project getConfig() was successful" );
        Logger.log( compilerOptions, rootFileNames, bundles );

        // Create host and program.
        let compilerHost = new CompilerHost( compilerOptions );
        let program = ts.createProgram( rootFileNames, compilerOptions, compilerHost );

        // Files..
        console.log( "Compiling Project Files..." );
        var compiler = new Compiler( compilerHost, program );
        var compileResult = compiler.compileFilesToStream( outputStream );
        Logger.log( compileResult );
        let compilerReporter = new CompilerReporter( compileResult );

        if ( !compileResult.succeeded() ) {
            compilerReporter.reportDiagnostics();

            if ( compilerOptions.noEmitOnError ) {
                return false;
            }
        }

        if ( compilerOptions.diagnostics ) {
            compilerReporter.reportStatistics();
        }

        // Bundles..
        var bundleCompiler = new BundleCompiler( compilerHost, program );

        console.log( "Compiling Project Bundles..." );
        for ( var i = 0, len = bundles.length; i < len; i++ ) {
            console.log( "Bundle: ", bundles[i].name );
            compileResult = bundleCompiler.compileBundleToStream( outputStream, bundles[i] );
            compilerReporter = new CompilerReporter( compileResult );

            if ( !compileResult.succeeded() ) {
                compilerReporter.reportDiagnostics();

                if ( compilerOptions.noEmitOnError ) {
                    return false;
                }
            }

            if ( compilerOptions.diagnostics ) {
                compilerReporter.reportStatistics();
            }
        }

        return true;
    }
}  