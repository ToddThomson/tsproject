import { Compiler } from "../Compiler/Compiler";
import { CompilerResult } from "../Compiler/CompilerResult";
import { DiagnosticsReporter } from "../Reporting/DiagnosticsReporter";
import { WatchCompilerHost }  from "../Compiler/WatchCompilerHost";
import { ProjectBuildContext } from "./ProjectBuildContext";
import { CompileStream }  from "../Compiler/CompileStream";
import { BundleBuilder } from "../Bundler/BundleBuilder";
import { BundleFile, BundleResult } from "../Bundler/BundleResult";
import { BundleCompiler } from "../Bundler/BundleCompiler";
import { ProjectConfig } from "./ProjectConfig";
import { StatisticsReporter } from "../Reporting/StatisticsReporter";
import { Logger } from "../Reporting/Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle } from "../Bundler/BundleParser";
import { Glob } from "./Glob";
import { TsCore } from "../Utils/TsCore";
import { Utils } from "../Utils/Utilities";

import * as ts from "typescript";
import * as _ from "lodash";
import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import * as chokidar from "chokidar";

export class Project {

    private configFilePath: string;
    private settings: any;

    private outputStream: CompileStream;

    private configFileDir: string;
    private configFileName: string;

    private totalBuildTime: number = 0;
    private totalCompileTime: number = 0;
    private totalPreBuildTime: number = 0;
    private totalBundleTime: number = 0;

    private buildContext: ProjectBuildContext;

    private configFileWatcher: fs.FSWatcher;

    private rebuildTimer: NodeJS.Timer;

    constructor( configFilePath: string, settings?: any  ) {
        this.configFilePath = configFilePath;
        this.settings = settings;
    }

    public build( outputStream: CompileStream ): ts.ExitStatus {
        let config = this.parseProjectConfig();

        if ( !config.success ) {
            DiagnosticsReporter.reportDiagnostics( config.errors );

            return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }

        this.buildContext = this.createBuildContext( config );

        Logger.log( "Building Project with: " + chalk.magenta( `${this.configFileName}` ) );
        Logger.log( "TypeScript compiler version: ", ts.version );

        this.outputStream = outputStream;

        // Perform the build..
        var buildStatus = this.buildWorker();

        this.reportBuildStatus( buildStatus );

        if ( config.compilerOptions.watch ) {
            Logger.log( "Watching for project changes..." );
        }
        else {
            this.completeProjectBuild();
        }

        return buildStatus;
    }

    private createBuildContext( config: ProjectConfig ) : ProjectBuildContext {

        if ( config.compilerOptions.watch ) {
            if ( !this.watchProject() ) {
                config.compilerOptions.watch = false;
            }
        }

        let compilerHost = new WatchCompilerHost( config.compilerOptions, this.onSourceFileChanged );

        return new ProjectBuildContext( compilerHost, config );
    }

    private watchProject() : boolean {
        if ( !ts.sys.watchFile ) {
            let diagnostic = TsCore.createDiagnostic( { code: 5001, category: ts.DiagnosticCategory.Warning, key: "The_current_node_host_does_not_support_the_0_option_5001", message: "The current node host does not support the '{0}' option." }, "-watch" );
            DiagnosticsReporter.reportDiagnostic( diagnostic );

            return false;
        }

        // Add a watcher to the project config file if we haven't already done so.
        if ( !this.configFileWatcher ) {
            this.configFileWatcher = chokidar.watch( this.configFileName );
            this.configFileWatcher.on( "change", ( path: string, stats: any ) => this.onConfigFileChanged( path, stats ) );
        }

        return true;
    }

    private completeProjectBuild(): void {
        // End the build process by sending EOF to the compilation output stream.
        this.outputStream.push( null );
    }

    private buildWorker(): ts.ExitStatus {
        this.totalBuildTime = this.totalPreBuildTime = new Date().getTime();

        if ( !this.buildContext ) {
            let config = this.parseProjectConfig();

            if ( !config.success ) {
                DiagnosticsReporter.reportDiagnostics( config.errors );

                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }

            this.buildContext = this.createBuildContext( config );
        }

        let allDiagnostics: ts.Diagnostic[] = [];

        let fileNames = this.buildContext.config.fileNames;
        let bundles = this.buildContext.config.bundles;
        let compilerOptions = this.buildContext.config.compilerOptions;

        // Create a new program to handle the incremental build. Pass the current build context program ( if it exists )
        // to reuse the current program structure.
        let program = ts.createProgram( fileNames, compilerOptions, this.buildContext.host, this.buildContext.getProgram() );

        this.totalPreBuildTime = new Date().getTime() - this.totalPreBuildTime;

        // Save the new program to the build context
        this.buildContext.setProgram( program );

        // Compile the project...
        let compiler = new Compiler( this.buildContext.host, program, this.outputStream );

        this.totalCompileTime = new Date().getTime();

        var compileResult = compiler.compile();

        this.totalCompileTime = new Date().getTime() - this.totalCompileTime;

        if ( !compileResult.succeeded() ) {
            DiagnosticsReporter.reportDiagnostics( compileResult.getErrors() );

            return compileResult.getStatus();
        }

        if ( compilerOptions.listFiles ) {
            Utils.forEach( this.buildContext.getProgram().getSourceFiles(), file => {
                Logger.log( file.fileName );
            });
        }

        this.totalBundleTime = new Date().getTime();

        // Build bundles..
        var bundleBuilder = new BundleBuilder( this.buildContext.host, this.buildContext.getProgram() );
        var bundleCompiler = new BundleCompiler( this.buildContext.host, this.buildContext.getProgram(), this.outputStream );
        var bundleResult: BundleResult;

        for ( var i = 0, len = bundles.length; i < len; i++ ) {
            Logger.log( "Building bundle: ", chalk.cyan( bundles[i].name ) );

            bundleResult = bundleBuilder.build( bundles[i] );

            if ( !bundleResult.succeeded() ) {
                DiagnosticsReporter.reportDiagnostics( bundleResult.getErrors() );

                return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }

            compileResult = bundleCompiler.compile( bundleResult.getBundleSource(), bundles[ i ].config );

            if ( !compileResult.succeeded() ) {
                DiagnosticsReporter.reportDiagnostics( compileResult.getErrors() );

                return compileResult.getStatus();
            }
        }

        this.totalBundleTime = new Date().getTime() - this.totalBundleTime;
        this.totalBuildTime = new Date().getTime() - this.totalBuildTime;

        if ( compilerOptions.diagnostics ) {
            this.reportStatistics();
        }

        if ( allDiagnostics.length > 0 ) {
            return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
        }

        return ts.ExitStatus.Success;
    }

    private parseProjectConfig(): ProjectConfig {
        try {
            var isConfigDirectory = fs.lstatSync( this.configFilePath ).isDirectory();
        }
        catch ( e ) {
            let diagnostic = TsCore.createDiagnostic( { code: 6064, category: ts.DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'." }, this.configFilePath );
            return { success: false, errors: [diagnostic] };
        }

        if ( isConfigDirectory ) {
            this.configFileDir = this.configFilePath;
            this.configFileName = path.join( this.configFilePath, "tsconfig.json" );
        }
        else {
            this.configFileDir = path.dirname( this.configFilePath );
            this.configFileName = this.configFilePath;
        }

        Logger.info( "Reading config file:", this.configFileName );
        let readConfigResult = ts.readConfigFile( this.configFileName, this.readFile );

        if ( readConfigResult.error ) {
            return { success: false, errors: [readConfigResult.error] };
        }

        let configObject = readConfigResult.config;

        // Parse standard project configuration objects: compilerOptions, files.
        Logger.info( "Parsing config file..." );
        var configParseResult = ts.parseJsonConfigFileContent( configObject, ts.sys, this.configFileDir );

        if ( configParseResult.errors.length > 0 ) {
            return { success: false, errors: configParseResult.errors };
        }

        // The returned "Files" list may contain file glob patterns. 
        configParseResult.fileNames = this.expandFileNames( configParseResult.fileNames, this.configFileDir );

        // The glob file patterns in "Files" is an enhancement to the standard Typescript project file (tsconfig.json) spec.
        // To convert the project file to use only a standard filename list, specify the setting: "convertFiles" : "true"
        if ( this.settings.convertFiles === true ) {
            this.convertProjectFileNames( configParseResult.fileNames, this.configFileDir );
        }

        // Parse "bundle" project configuration objects: compilerOptions, files.
        var bundleParser = new BundleParser();
        var bundlesParseResult = bundleParser.parseConfigFile( configObject, this.configFileDir );

        if ( bundlesParseResult.errors.length > 0 ) {
            return { success: false, errors: bundlesParseResult.errors };
        }

        // The returned bundles "Files" list may contain file glob patterns. 
        bundlesParseResult.bundles.forEach( bundle => {
            bundle.fileNames = this.expandFileNames( bundle.fileNames, this.configFileDir );
        });

        // Parse the command line args to override project file compiler options
        let settingsCompilerOptions = this.getSettingsCompilerOptions( this.settings, this.configFileDir );

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
    
    private onConfigFileChanged = ( path: string, stats: any ) => {
        // Throw away the build context and start a fresh rebuild
        this.buildContext = undefined;

        this.startRebuildTimer();
    }

    private onSourceFileChanged = ( sourceFile: TsCore.WatchedSourceFile, path: string, stats: any ) => {
        sourceFile.fileWatcher.unwatch( sourceFile.fileName );
        sourceFile.fileWatcher = undefined;

        this.startRebuildTimer();
    }

    private startRebuildTimer() {
        if ( this.rebuildTimer ) {
            clearTimeout( this.rebuildTimer );
        }

        this.rebuildTimer = setTimeout( this.onRebuildTimeout, 250 );
    }

    private onRebuildTimeout = () => {
        this.rebuildTimer = undefined;

        let buildStatus = this.buildWorker();

        this.reportBuildStatus( buildStatus );

        if ( this.buildContext.config.compilerOptions.watch ) {
            Logger.log( "Watching for project changes..." );
        }
    }

    private readFile( fileName: string ): string {
        return ts.sys.readFile( fileName );
    }

    private getSettingsCompilerOptions( jsonSettings: any, configDirPath: string ): ts.ParsedCommandLine {
        // Parse the json settings from the TsProject src() API
        let parsedResult = ts.parseJsonConfigFileContent( jsonSettings, ts.sys, configDirPath );

        // Check for compiler options that are not relevent/supported.

        // Not supported: --project, --init
        // Ignored: --help, --version

        if ( parsedResult.options.project ) {
            let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--project" );
            parsedResult.errors.push( diagnostic );
        }

        if ( parsedResult.options.init ) {
            let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--init" );
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

    private convertProjectFileNames( fileNames: string[], configDirPath: string ) {
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

    private reportBuildStatus( buildStatus: ts.ExitStatus ) {
        switch ( buildStatus ) {
            case ts.ExitStatus.Success:
                Logger.log( chalk.green( "Project build completed successfully." ) );
                break;
            case ts.ExitStatus.DiagnosticsPresent_OutputsSkipped:
                Logger.log( chalk.red( "Build completed with errors." ) );
                break;
            case ts.ExitStatus.DiagnosticsPresent_OutputsGenerated:
                Logger.log( chalk.red( "Build completed with errors. " + chalk.italic( "Outputs generated." ) ) );
                break;
        }
    }

    private reportStatistics() {
        let statisticsReporter = new StatisticsReporter();

        statisticsReporter.reportTitle( "Total build times..." );
        statisticsReporter.reportTime( "Pre-build time", this.totalPreBuildTime );
        statisticsReporter.reportTime( "Compiling time", this.totalCompileTime );
        statisticsReporter.reportTime( "Bundling time", this.totalBundleTime );
        statisticsReporter.reportTime( "Build time", this.totalBuildTime );
    }
}