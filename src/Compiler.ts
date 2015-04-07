/// <reference path="references.d.ts" />
/// <reference path="parser.ts" />

import { CompilerResult } from "./CompilerResult";
import { CompilerHost }  from "./CompilerHost";
import { CompileStream }  from "./CompileStream";
import { Logger } from "./Logger";
import { TsVinylFile } from "./TsVinylFile";
import { Parser, Bundle } from "./Parser";

import ts = require( 'typescript' );
import path = require( 'path' );

export class Compiler {

    public configFileName: string;
    private configDirPath: string;
    public errors: ts.Diagnostic[] = [];
    private rootFileNames: string[];
    private bundles: Bundle[];

    private compilerHost: CompilerHost;
    private compilerOptions: ts.CompilerOptions = { charset: "utf-8" };

    constructor( configDirPath: string ) {
        this.configDirPath = configDirPath;
        this.configFileName = path.join( configDirPath, "tsconfig.json" );
    }

    public compileToStream( compileStream: CompileStream,
                            onComplete?: ( result: CompilerResult, program: ts.Program ) => void,
                            onError?: ( message: string ) => void ) {
        var configObject = ts.readConfigFile( this.configFileName );
        Logger.log( configObject );

        if ( !configObject ) {
            return;
        }

        // Extended tsconfig.json support for bundles
        var bundleParser = new Parser();
        var bundleResult = bundleParser.parseConfigFile( configObject, this.configDirPath );

        this.bundles = bundleResult.bundles;

        // Standard tsconfig.json support
        var configParseResult = ts.parseConfigFile( configObject, this.configDirPath );

        if ( configParseResult.errors.length > 0 ) {
            return;
        }

        this.rootFileNames = configParseResult.fileNames;
        this.compilerOptions = configParseResult.options;

        // Create host and program
        this.compilerHost = new CompilerHost( this.compilerOptions );
        var program = ts.createProgram( this.rootFileNames, this.compilerOptions, this.compilerHost );

        // Compile the source files..
        var emitResult = program.emit();

        var allDiagnostics = ts.getPreEmitDiagnostics( program ).concat( emitResult.diagnostics );

        var fileOutput = this.compilerHost.output;

        for ( var fileName in fileOutput ) {
            var fileData = fileOutput[fileName];

            var tsVinylFile = new TsVinylFile( {
                path: fileName,
                contents: new Buffer( fileData )
            });

            compileStream.push( tsVinylFile );
        } 

        // var result = new CompilerResult( fileOutput, allDiagnostics );

        // onComplete( result, program );
    }

    public watch() {
        // Placeholder - not yet implemented
    }
} 