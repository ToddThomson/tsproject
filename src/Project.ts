import { Compiler } from "./Compiler";
import { CompilerResult } from "./CompilerResult";
import { CompilerHost }  from "./CompilerHost";
import { CompileStream }  from "./CompileStream";
import { Bundler } from "./Bundler";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { BundleParser, Bundle } from "./BundleParser";

import ts = require( 'typescript' );
import path = require( 'path' );

export class Project {

    private configDirPath: string;
    private configFileName: string;
    private configJson;

    private errors: ts.Diagnostic[] = [];

    constructor( configDirPath: string ) {
        this.configDirPath = configDirPath;
        this.configFileName = path.join( configDirPath, "tsconfig.json" );
        this.configJson = ts.readConfigFile( this.configFileName );

        if ( !this.configJson ) {
            throw new Error( "Provide a valid directory path to the project tsconfig.json" );
        }
    }

    public getBundles(): Bundle[] {
        Logger.log( "Entering getBundles()" );
        // Extended tsconfig.json support for bundles
        var bundleParser = new BundleParser();
        var bundleResult = bundleParser.parseConfigFile( this.configJson, this.configDirPath );

        Logger.log( ".. bundles: ", bundleResult.bundles );
        return bundleResult.bundles;
    }

    public getFiles(): string[] {

        var configParseResult = ts.parseConfigFile( this.configJson, this.configDirPath );

        if ( configParseResult.errors.length > 0 ) {
            return;
        }

        Logger.log( "getFiles(): ", configParseResult.fileNames );

        return configParseResult.fileNames;
    }

    public getOptions(): ts.CompilerOptions {

        var configParseResult = ts.parseConfigFile( this.configJson, this.configDirPath );

        if ( configParseResult.errors.length > 0 ) {
            return;
        }

        return configParseResult.options;
    }

    public build( outputStream: CompileStream ) {
        Logger.log( "Entering build()" );
        // Get project config...
        let compilerOptions = this.getOptions();
        let rootFileNames = this.getFiles();
        let bundles = this.getBundles();

        // Create host and program
        let compilerHost = new CompilerHost( compilerOptions );
        let program = ts.createProgram( rootFileNames, compilerOptions, compilerHost );

        // Files..
        var compiler = new Compiler( compilerHost, program );
        compiler.compileFilesToStream( outputStream );

        // Bundles..
        var bundler = new Bundler( compilerHost, program );

        for ( var i = 0, len = bundles.length; i < len; i++ ) {
            bundler.bundle( outputStream, bundles[i] );
        }
    }

}  