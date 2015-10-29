/// <reference path="./references.d.ts" />

import ts = require( "typescript" );
                                     

export module Utils {

    export function forEach<T, U>( array: T[], callback: ( element: T, index: number ) => U ): U {
        if ( array ) {
            for ( let i = 0, len = array.length; i < len; i++ ) {
                let result = callback( array[i], i );
                if ( result ) {
                    return result;
                }
            }
        }
        return undefined;
    }

    let hasOwnProperty = Object.prototype.hasOwnProperty;

    export function hasProperty<T>( map: ts.Map<T>, key: string ): boolean {
        return hasOwnProperty.call( map, key );
    }

    export function clone<T>( object: T ): T {
        let result: any = {};
        for ( let id in object ) {
            result[id] = ( <any>object )[id];
        }
        return <T>result;
    }

    export function map<T, U>( array: T[], f: ( x: T ) => U ): U[] {
        let result: U[];
        if ( array ) {
            result = [];
            for ( let v of array ) {
                result.push( f( v ) );
            }
        }

        return result;
    }

    export function extend<T1, T2>( first: ts.Map<T1>, second: ts.Map<T2> ): ts.Map<T1 & T2> {
        let result: ts.Map<T1 & T2> = {};
        for ( let id in first ) {
            ( result as any )[id] = first[id];
        }
        for ( let id in second ) {
            if ( !hasProperty( result, id ) ) {
                ( result as any )[id] = second[id];
            }
        }
        return result;
    }
}
                                     

export module TsCore {

    export function getExternalModuleName( node: ts.Node ): ts.Expression {
        if ( node.kind === ts.SyntaxKind.ImportDeclaration ) {
            return ( <ts.ImportDeclaration>node ).moduleSpecifier;
        }
        if ( node.kind === ts.SyntaxKind.ImportEqualsDeclaration ) {
            let reference = ( <ts.ImportEqualsDeclaration>node ).moduleReference;
            if ( reference.kind === ts.SyntaxKind.ExternalModuleReference ) {
                return ( <ts.ExternalModuleReference>reference ).expression;
            }
        }
        if ( node.kind === ts.SyntaxKind.ExportDeclaration ) {
            return ( <ts.ExportDeclaration>node ).moduleSpecifier;
        }
    }

    export function createDiagnostic( message: ts.DiagnosticMessage, ...args: any[] ): ts.Diagnostic {
        let text = message.key;

        if ( arguments.length > 1 ) {
            text = formatStringFromArgs( text, arguments, 1 );
        }

        return {
            file: undefined,
            start: undefined,
            length: undefined,
            messageText: text,
            category: message.category,
            code: message.code
        };
    }

    function formatStringFromArgs( text: string, args: any, baseIndex: number ) {
        baseIndex = baseIndex || 0;
        return text.replace( /{(\d+)}/g, function ( match: any, index: any ) {
            return args[+index + baseIndex];
        });
    }

    export function isDeclarationFile( file: ts.SourceFile ): boolean {
        return ( file.flags & ts.NodeFlags.DeclarationFile ) !== 0;
    }

    // An alias symbol is created by one of the following declarations:
    // import <symbol> = ...
    // import <symbol> from ...
    // import * as <symbol> from ...
    // import { x as <symbol> } from ...
    // export { x as <symbol> } from ...
    // export = ...
    // export default ...
    export function isAliasSymbolDeclaration( node: ts.Node ): boolean {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration ||
            node.kind === ts.SyntaxKind.ImportClause && !!( <ts.ImportClause>node ).name ||
            node.kind === ts.SyntaxKind.NamespaceImport ||
            node.kind === ts.SyntaxKind.ImportSpecifier ||
            node.kind === ts.SyntaxKind.ExportSpecifier ||
            node.kind === ts.SyntaxKind.ExportAssignment && ( <ts.ExportAssignment>node ).expression.kind === ts.SyntaxKind.Identifier;
    }

    export function normalizeSlashes( path: string ): string {
        return path.replace( /\\/g, "/" );
    }

    export function outputExtension( path: string ): string {
        return path.replace( /\.ts/, ".js" );
    }
}
                                                                                                               

export class CompilerStatistics {
    public numberOfFiles: number;
    public numberOfLines: number;
    public compileTime: number;

    constructor( program: ts.Program, compileTime?: number ) {
        this.numberOfFiles = program.getSourceFiles().length;
        this.numberOfLines = this.compiledLines( program );
        this.compileTime = compileTime;
    }

    private compiledLines( program: ts.Program ): number {
        var count = 0;
        Utils.forEach( program.getSourceFiles(), file => {
            if ( !TsCore.isDeclarationFile( file ) ) {
                count += this.getLineStarts( file ).length;
            }
        });

        return count;
    }

    private getLineStarts( sourceFile: ts.SourceFile ): number[] {
        return sourceFile.getLineStarts();
    }
} 
import chalk = require( "chalk" );
import * as events from "events";
import * as net from "net";
import * as stream from "stream";
import * as child from "child_process";
import * as tls from "tls";
import * as http from "http";
import * as crypto from "crypto";
                                   

export var level = {
    none: 0,
    info: 1,
    warn: 2,
    error: 3
};

export class Logger {
    private static logLevel: number = level.none;
    private static logName: string = "logger";

    public static setLevel( level: number ) {
        this.logLevel = level;
    }

    public static setName( name: string ) {
        this.logName = name;
    }

    public static log( ...args: any[] ) {
        console.log( chalk.gray( `[${this.logName}]` ), ...args );
    }

    public static info( ...args: any[] ) {
        if ( this.logLevel < level.info ) {
            return;
        }

        console.log( chalk.gray( `[${this.logName}]` + chalk.blue( " INFO: " ) ), ...args );
    }

    public static warn( ...args: any[] ) {
        if ( this.logLevel < level.warn ) {
            return;
        }

        console.log( `[${this.logName}]` + chalk.yellow( " WARNING: " ), ...args );
    }

    public static error( ...args: any[] ) {
        if ( this.logLevel < level.error ) {
            return;
        }

        console.log( `[${this.logName}]` + chalk.red( " ERROR: " ), ...args );
    }
}  
import fs = require( "fs" );
import path = require( "path" );
import os = require( "os" );
import File = require( "vinyl" );
import minimatch = require("minimatch");
import _ = require( "lodash" );
import fileGlob = require( "glob" );
                                                                                                                                                                                                                                                                                                                                                    

export class Glob {

    public hasPattern( pattern: string ) {
        var g = new fileGlob.Glob( pattern );
        var minimatchSet = g.minimatch.set;

        if ( minimatchSet.length > 1 )
            return true;

        for ( var j = 0; j < minimatchSet[0].length; j++ ) {
            if ( typeof minimatchSet[0][j] !== 'string' )
                return true;
        }

        return false;
    }

    public expand( patterns: string[] ): string[]{

        if ( patterns.length === 0 ) {
            return [];
        }

        var matches = this.processPatterns( patterns, function ( pattern: string ) {
            return fileGlob.sync( pattern );
        });

        return matches;
    }

    private processPatterns( patterns: string[], fn: any ): string[] {
        var result: string[] = [];

        _.flatten( patterns ).forEach( function ( pattern: any ) {
            var exclusion: any;
            var matches: any;

            exclusion = _.isString( pattern ) && pattern.indexOf( "!" ) === 0;

            if ( exclusion ) {
                pattern = pattern.slice( 1 );
            }

            matches = fn( pattern );

            if ( exclusion ) {
                return result = _.difference( result, matches );
            } else {
                return result = _.union( result, matches );
            }
        });

        return result;
    }
}
                                                                                                 

export class CompilerResult {

    private status: ts.ExitStatus;
    private errors: ts.Diagnostic[];
    private statistics: CompilerStatistics;

    constructor( status: ts.ExitStatus, statistics?: CompilerStatistics, errors?: ts.Diagnostic[] ) {
        this.status = status;
        this.statistics = statistics,
        this.errors = errors;
    }

    public getErrors(): ts.Diagnostic[] {
        return this.errors;
    }

    public getStatistics(): CompilerStatistics {
        return this.statistics;
    }

    public getStatus(): ts.ExitStatus {
        return this.status;
    }

    public succeeded(): boolean {
        return ( this.status === ts.ExitStatus.Success );
    }
}
                                                                                                                                                                       

export class CompilerHost implements ts.CompilerHost {

    public output: ts.Map<string> = {};

    private compilerOptions: ts.CompilerOptions;
    private currentDirectory: string;
    
    constructor( compilerOptions: ts.CompilerOptions ) {
        this.compilerOptions = compilerOptions;
    }

    fileExists( fileName: string ): boolean {
        let result = ts.sys.fileExists( fileName );
        Logger.info( "CompilerHost:fileExists for: ", fileName, result );
        return result;
    }

    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
        let text: string;

        // return undefined for a non-existent fileName
        if (!fs.existsSync(fileName)) {
            Logger.warn("File not found: ", fileName);
            return undefined;
        }

        try {
            text = fs.readFileSync( fileName ).toString("utf8");
        }
        catch ( e ) {
            if ( onError ) {
                onError( e.message );
            }
        }

        if ( text !== undefined ) {
            return ts.createSourceFile( fileName, text, languageVersion );
        }
        
        Logger.warn("File not readable: ", fileName);

        return undefined;            
    }

    readFile( fileName: string ): string {
        Logger.info( "CompilerHost in readFile() with: ", fileName );

        let result = ts.sys.readFile( fileName );

        return result;
    }

    writeFile = ( fileName: string, data: string, writeByteOrderMark: boolean, onError?: ( message: string ) => void ) => {
        this.output[fileName] = data;
    }

    getDefaultLibFileName( options: ts.CompilerOptions ): string {
        return ts.getDefaultLibFilePath( this.compilerOptions );
    }

    useCaseSensitiveFileNames(): boolean {
        // var platform: string = os.platform();
        // win32\win64 are case insensitive platforms, MacOS (darwin) by default is also case insensitive
        return false; // ( platform !== "win32" && platform !== "win64" && platform !== "darwin" );
    }

    getCanonicalFileName( fileName: string ): string {
        // if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
        // otherwise use toLowerCase as a canonical form.
        return fileName.toLowerCase();
    }

    getCurrentDirectory() {
        return this.currentDirectory || ( this.currentDirectory = process.cwd() );
    }

    getNewLine() : string {
        return "\n";
    }
}


                                     

export class CompileStream extends stream.Readable {

    constructor(opts?: stream.ReadableOptions) {
        super( { objectMode: true });
    }

    _read() {
        // Safely do nothing
    }
}
                                                                        

export class TsVinylFile extends File {

    constructor( options: any ) {
        super( options );
    }

    public sourceFile: ts.SourceFile;
} 
                                                                                                                                                                                                                                                        

export interface BundleConfig {
    outDir: string;
}

export interface Bundle {
    name: string;
    files: string[];
    config: BundleConfig;
}

export interface ParsedBundlesResult {
    bundles: Bundle[];
    errors: ts.Diagnostic[];
}

export class BundleParser {
    
    parseConfigFile( json: any, basePath: string ): ParsedBundlesResult {
        var errors: ts.Diagnostic[] = [];

        return {
            bundles: getBundles(),
            errors: errors
        };

        function getBundles(): Bundle[] {
            var bundles: Bundle[] = [];
            var jsonBundles = json["bundles"];

            if ( jsonBundles ) {
                Logger.info( jsonBundles );

                for ( var id in jsonBundles ) {
                    Logger.info( "Bundle Id: ", id, jsonBundles[id] );
                    var jsonBundle: any = jsonBundles[id];
                    var bundleName: string;
                    var files: string[] = [];
                    var config: any = {};

                    // Name
                    bundleName = path.join( basePath, id );

                    // Files..
                    if ( Utils.hasProperty( jsonBundle, "files" ) ) {
                        if ( jsonBundle["files"] instanceof Array ) {
                            files = Utils.map( <string[]>jsonBundle["files"], s => path.join( basePath, s ) );

                            // The bundle files may contain a mix of glob patterns and filenames.
                            // glob.expand() will only return a list of all expanded "found" files. 
                            // For filenames without glob patterns, we add them to the list of files as we will want to know
                            // if any filenames are not found during bundle processing.

                            var glob = new Glob();
                            var nonglobFiles: string[] = [];

                            Utils.forEach( files, file => {
                                if ( !glob.hasPattern( file ) ) {
                                    nonglobFiles.push( file );
                                }
                            });
                            
                            // Get the list of expanded glob files
                            var globFiles = glob.expand( files );
                            var normalizedGlobFiles: string[] = [];

                            // Normalize paths of glob files so we can match properly. Glob returns forward slash separators.
                            Utils.forEach( globFiles, file => {
                                normalizedGlobFiles.push( path.normalize( file ) );

                            });

                            // The overall file list is the union of both non-glob and glob files
                            files = _.union( normalizedGlobFiles, nonglobFiles );

                            Logger.info( "bundle files: ", files );
                        }
                        else {
                            errors.push( TsCore.createDiagnostic( { code: 6063, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' files is not an array." }, id ) );
                        }
                    }
                    else {
                        errors.push( TsCore.createDiagnostic( { code: 6062, category: ts.DiagnosticCategory.Error, key: "Bundle '{0}' requires an array of files." }, id ) );
                    }

                    // Config..
                    if ( Utils.hasProperty( jsonBundle, "config" ) ) {
                        config = jsonBundle.config
                    }

                    bundles.push( { name: bundleName, files: files, config: config });
                }
            }

            return bundles;
        }
    }
}
                                                                                                                                                                                                                     

export class DependencyBuilder {
    private host: ts.CompilerHost;
    private program: ts.Program;
    private options: ts.CompilerOptions;
    private moduleImportsByName: ts.Map<ts.Symbol[]> = {};

    constructor( host: ts.CompilerHost, program: ts.Program ) {
        this.host = host;
        this.program = program;
        this.options = this.program.getCompilerOptions();
    }

    public getSourceFileDependencies( sourceFile: ts.SourceFile ): ts.Map<ts.Node[]> {
        var self = this;
        var dependencies: ts.Map<ts.Node[]> = {};
        var importWalked: ts.Map<boolean> = {};

        function walkModuleImports( importNodes: ts.Node[] ) {
            importNodes.forEach( importNode => {
                // Get the import symbol for the import node
                let importSymbol = self.getSymbolFromNode( importNode );
                let importSymbolSourceFile = self.getSourceFileFromSymbol( importSymbol );
                let canonicalFileName = self.host.getCanonicalFileName( importSymbolSourceFile.fileName );
                Logger.info( "Import symbol file name: ", canonicalFileName );

                // Don't walk imports that we've already processed
                if ( !Utils.hasProperty( importWalked, canonicalFileName ) ) {
                    importWalked[canonicalFileName] = true;

                    // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    walkModuleImports( self.getImportsOfModule( importSymbolSourceFile ) );
                }

                if ( !Utils.hasProperty( dependencies, canonicalFileName ) ) {
                    Logger.info( "Adding module import dependencies for file: ", canonicalFileName );
                    dependencies[canonicalFileName] = self.getImportsOfModule( importSymbolSourceFile );
                }
            });
        }

        // Get the top level imports
        var sourceFileImports = self.getImportsOfModule(sourceFile);

        // Walk the module import tree
        walkModuleImports(sourceFileImports);

        let canonicalSourceFileName = self.host.getCanonicalFileName( sourceFile.fileName );

        if (!Utils.hasProperty(dependencies, canonicalSourceFileName)) {
            Logger.info("Adding top level import dependencies for file: ", canonicalSourceFileName);
            dependencies[canonicalSourceFileName] = sourceFileImports;
        }

        return dependencies;
    }

    public getImportsOfModule( file: ts.SourceFile ): ts.Node[] {
        var importNodes: ts.Node[] = [];
        var self = this;
        
        function getImports(searchNode: ts.Node) {
            ts.forEachChild(searchNode, node => {
                if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
                    Logger.info("Found import declaration");
                    let moduleNameExpr = TsCore.getExternalModuleName(node);

                    if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
                        let moduleSymbol = self.program.getTypeChecker().getSymbolAtLocation(moduleNameExpr);

                        if (moduleSymbol) {
                            Logger.info("Adding import symbol: ", moduleSymbol.name, file.fileName);
                            importNodes.push(node);
                        }
                        else {
                            Logger.warn("Module symbol not found");
                        }
                    }
                }
                else if (node.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.ModuleDeclaration>node).name.kind === ts.SyntaxKind.StringLiteral && (node.flags & ts.NodeFlags.Ambient || TsCore.isDeclarationFile(file))) {
                    // An AmbientExternalModuleDeclaration declares an external module.
                    var moduleDeclaration = <ts.ModuleDeclaration>node;
                    Logger.info("Processing ambient module declaration: ", moduleDeclaration.name.text);
                    getImports((<ts.ModuleDeclaration>node).body);
                }
            });
        };

        getImports( file );

        return importNodes;
    }

    private isExternalModuleImportEqualsDeclaration( node: ts.Node ) {
        return node.kind === ts.SyntaxKind.ImportEqualsDeclaration && ( <ts.ImportEqualsDeclaration>node ).moduleReference.kind === ts.SyntaxKind.ExternalModuleReference;
    }

    private getExternalModuleImportEqualsDeclarationExpression( node: ts.Node ) {
        return ( <ts.ExternalModuleReference>( <ts.ImportEqualsDeclaration>node ).moduleReference ).expression;
    }

    private getSymbolFromNode( node: ts.Node ): ts.Symbol {
        let moduleNameExpr = TsCore.getExternalModuleName( node );

        if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
            return this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );
        }
    }

    private getSourceFileFromNode( importNode: ts.Node ): ts.SourceFile {
        return importNode.getSourceFile();
    }

    private getSourceFileFromSymbol( importSymbol: ts.Symbol ): ts.SourceFile {
        let declaration = importSymbol.getDeclarations()[0];
        let isCodeModule = declaration.kind === ts.SyntaxKind.SourceFile &&
            !( declaration.flags & ts.NodeFlags.DeclarationFile );
        let file = declaration.getSourceFile();

        return file;
    }
}
                                                                                                               

export class DiagnosticsReporter {
    private errors: ts.Diagnostic[];

    constructor( errors: ts.Diagnostic[] ) {
        this.errors = errors;
    }

    public reportDiagnostics() {
        var diagnostics = this.errors;

        for ( var i = 0; i < diagnostics.length; i++ ) {
            this.reportDiagnostic( diagnostics[i] );
        }
    }

    private reportDiagnostic( diagnostic: ts.Diagnostic ) {
        var output = "";

        if ( diagnostic.file ) {
            var loc = ts.getLineAndCharacterOfPosition( diagnostic.file, diagnostic.start );

            output += chalk.gray( `${ diagnostic.file.fileName }(${ loc.line + 1 },${ loc.character + 1 }): ` );
        }

        var category = chalk.red( ts.DiagnosticCategory[diagnostic.category].toLowerCase() );
        output += `${ category } TS${ chalk.red( diagnostic.code + '' ) }: ${ chalk.grey( ts.flattenDiagnosticMessageText( diagnostic.messageText, "\n" ) ) }`;

        Logger.log( output );
    }
} 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

export class Compiler {

    public configFileName: string;
    private configDirPath: string;
    private rootFileNames: string[];

    private compilerHost: CompilerHost;
    private program: ts.Program;
    private compilerOptions: ts.CompilerOptions;

    constructor( compilerHost: CompilerHost, program: ts.Program ) {
        this.compilerHost = compilerHost
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }

    public compileFilesToStream(
        compileStream: CompileStream,
        onError?: ( message: string ) => void ): CompilerResult {

        Logger.log( "TypeScript compiler version: ", ts.version );
        Logger.log( "Compiling Project Files..." );

        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics( this.program );

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( this.program ), preEmitDiagnostics );
        }

        // Compile the source files..
        let emitTime = 0;
        let startTime = new Date().getTime();

        var emitResult = this.program.emit();

        emitTime += new Date().getTime() - startTime;

        // If the emitter didn't emit anything, then pass that value along.
        if ( emitResult.emitSkipped ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( this.program, 0 ), emitResult.diagnostics );
        }

        var fileOutput = this.compilerHost.output;

        for ( var fileName in fileOutput ) {
            var fileData = fileOutput[fileName];

            var tsVinylFile = new TsVinylFile( {
                path: fileName,
                contents: new Buffer( fileData )
            });

            compileStream.push( tsVinylFile );
        }

        let allDiagnostics = preEmitDiagnostics.concat( emitResult.diagnostics );
        
        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics( this.program, emitTime ), allDiagnostics );
        }

        return new CompilerResult( ts.ExitStatus.Success, new CompilerStatistics( this.program, emitTime ) );
    }
} 
                                                                                                                                                                                                                                                                        

export class CompilerReporter extends DiagnosticsReporter{
    private result: CompilerResult;

    constructor( result: CompilerResult ) {
        super( result.getErrors() );
        this.result = result;
    }

    public reportStatistics() {
        var statistics = this.result.getStatistics();

        this.reportCountStatistic( "Files", statistics.numberOfFiles );
        this.reportCountStatistic( "Lines", statistics.numberOfLines );
        this.reportTimeStatistic( "Compile time", statistics.compileTime );
    }

    private reportStatisticalValue( name: string, value: string ) {
        Logger.log( this.padRight( name + ":", 12 ) + chalk.magenta( this.padLeft( value.toString(), 10 ) ) );
    }

    private reportCountStatistic( name: string, count: number ) {
        this.reportStatisticalValue( name, "" + count );
    }

    private reportTimeStatistic( name: string, time: number ) {
        this.reportStatisticalValue( name, ( time / 1000 ).toFixed( 2 ) + "s" );
    }

    private padLeft( s: string, length: number ) {
        while ( s.length < length ) {
            s = " " + s;
        }
        return s;
    }

    private padRight( s: string, length: number ) {
        while ( s.length < length ) {
            s = s + " ";
        }

        return s;
    }
}
 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

export class BundleCompiler {

    private compilerHost: CompilerHost;
    private program: ts.Program;
    private compilerOptions: ts.CompilerOptions;

    private outputText: ts.Map<string> = {};
    private bundleText: string = "";
    private bundleImportedFiles: ts.Map<string> = {};
    private bundleModuleImports: ts.Map<ts.Map<string>> = {};
    private bundleSourceFiles: ts.Map<string> = {};

    constructor( compilerHost: CompilerHost, program: ts.Program ) {
        this.compilerHost = compilerHost
        this.program = program;
        this.compilerOptions = this.program.getCompilerOptions();
    }

    public compileBundleToStream( outputStream: CompileStream, bundle: Bundle ): CompilerResult {
        let dependencyBuilder = new DependencyBuilder( this.compilerHost, this.program );

        // Construct bundle output file name
        let bundleBaseDir = path.dirname( bundle.name );

        if ( bundle.config.outDir ) {
            bundleBaseDir = path.normalize( path.resolve( bundleBaseDir, bundle.config.outDir) );
        }

        let bundleFilePath = path.join( bundleBaseDir, path.basename( bundle.name ) );

        this.bundleText = "";
        this.bundleImportedFiles = {};
        this.bundleModuleImports = {};
        this.bundleSourceFiles = {};

        // Look for tsx source files in bunle name or bundle dependencies.
        // Output tsx for bundle extension if typescript react files found

        var isBundleTsx = false;

        let allDependencies: ts.Map<ts.Node[]> = {};

        for ( var filesKey in bundle.files ) {
            let fileName = bundle.files[filesKey];
            Logger.info( ">>> Processing bundle file:", fileName );

            if ( this.compilerOptions.listFiles ) {
                Logger.log( fileName );
            }

            let bundleSourceFileName = this.compilerHost.getCanonicalFileName( TsCore.normalizeSlashes( fileName ) );
            Logger.info( "BundleSourceFileName:", bundleSourceFileName );

            let bundleSourceFile = this.program.getSourceFile( bundleSourceFileName );

            if ( !bundleSourceFile ) {
                let diagnostic = TsCore.createDiagnostic( { code: 6060, category: ts.DiagnosticCategory.Error, key: "Bundle Source File '{0}' not found." }, bundleSourceFileName );
                return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( this.program, 0 ), [diagnostic] );
            }

            // Check for TSX
            if ( bundleSourceFile.languageVariant == ts.LanguageVariant.JSX ) {
                isBundleTsx = true;
            }

            let sourceDependencies = dependencyBuilder.getSourceFileDependencies( bundleSourceFile );

            // Merge current bundle file dependencies into all dependencies
            for (var mergeKey in sourceDependencies) {
                if ( !Utils.hasProperty( allDependencies, mergeKey ) ) {
                    allDependencies[mergeKey] = sourceDependencies[mergeKey];
                }
            }

            Logger.info("traversing source dependencies for: ", bundleSourceFile.fileName );
            for (var depKey in sourceDependencies) {
                // Add module dependencies first..
                sourceDependencies[depKey].forEach( importNode => {
                    var importSymbol = this.getSymbolFromNode( importNode );

                    if ( this.isCodeModule( importSymbol ) ) {
                        let declaration = importSymbol.getDeclarations()[0];
                        let importedSource = declaration.getSourceFile();
                        let importedSourceFileName = importedSource.fileName;

                        if (!Utils.hasProperty(this.bundleImportedFiles, importedSourceFileName)) {
                            this.addSourceFile(importedSource);
                        }
                    }
                    else {
                        if ( importNode.kind === ts.SyntaxKind.ImportEqualsDeclaration ) {
                            // For ImportEqualsDeclarations we emit the import declaration
                            // if it hasn't already been added to the bundle.

                             // Get the import and module names
                            let importName = ( <ts.ImportEqualsDeclaration>importNode ).name.text;
                            var moduleName = this.getImportModuleName( <ts.ImportEqualsDeclaration>importNode );

                            if ( this.addModuleImport( moduleName, importName ) ) {
                                this.emitModuleImportDeclaration( importNode.getText() );
                            }
                        }
                        else {
                            // ImportDeclaration kind..
                            this.writeImportDeclaration( <ts.ImportDeclaration>importNode );
                        }
                    }
                });
            }

            // Finally, add bundle source file
            this.addSourceFile( bundleSourceFile );
        }

        var bundleExtension = isBundleTsx ? ".tsx" : ".ts";

        Logger.info( "Streaming vinyl bundle source: ", bundleFilePath + bundleExtension );
        var tsVinylFile = new TsVinylFile( {
            path: bundleFilePath + bundleExtension,
            contents: new Buffer( this.bundleText )
        });

        outputStream.push( tsVinylFile );

        // Compile the bundle to generate javascript and declaration file
        let compileResult = this.compileBundle( path.basename(bundle.name ) + bundleExtension, this.bundleText );
        let compileStatus = compileResult.getStatus();

        // Only stream bundle if there is some compiled output
        if ( compileStatus !== ts.ExitStatus.DiagnosticsPresent_OutputsSkipped ) {
            
            // js should have been generated, but just in case!
            if ( Utils.hasProperty( this.outputText, path.basename( bundle.name ) + ".js" ) ) {
                Logger.info( "Streaming vinyl js: ", bundleFilePath + ".js" );
                var bundleJsVinylFile = new TsVinylFile( {
                    path: path.join( bundleFilePath + ".js" ),
                    contents: new Buffer( this.outputText[path.basename( bundle.name ) + ".js"] )
                });

                outputStream.push( bundleJsVinylFile );
            }
        }

        // Only stream bundle definition if the compile was successful
        if ( compileStatus === ts.ExitStatus.Success ) {
            
            // d.ts should have been generated, but just in case
            if ( Utils.hasProperty( this.outputText, path.basename( bundle.name ) + ".d.ts" ) ) {
                Logger.info( "Streaming vinyl d.ts: ", bundleFilePath + ".d.ts" );
                var bundleDtsVinylFile = new TsVinylFile( {
                    path: path.join( bundleFilePath + ".d.ts" ),
                    contents: new Buffer( this.outputText[ path.basename( bundle.name ) + ".d.ts"] )
                });

                outputStream.push( bundleDtsVinylFile );
            }
        }

        return compileResult;
    }

    private getImportModuleName( node: ts.ImportEqualsDeclaration ): string {

        if ( node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference ) {
            let moduleReference = (<ts.ExternalModuleReference>node.moduleReference);
            return ( <ts.LiteralExpression>moduleReference.expression ).text;
        }
        else {
            // TJT: This code should never be hit as we currently do not process dependencies of this kind. 
            return (<ts.EntityName>node.moduleReference).getText();
        }
    }

    private addModuleImport( moduleName: string, importName: string ): boolean {

        if ( !Utils.hasProperty( this.bundleModuleImports, moduleName ) ) {
            this.bundleModuleImports[ moduleName ] = {};
        }

        var moduleImports = this.bundleModuleImports[ moduleName ];

        if ( !Utils.hasProperty( moduleImports, importName ) ) {
            moduleImports[importName] = importName;
            
            return true;
        }

        return false;
    }

    private writeImportDeclaration( node: ts.ImportDeclaration ) {

        if ( !node.importClause ) {
            return;
        }

        let moduleName = (<ts.LiteralExpression>node.moduleSpecifier).text;

        var importToWrite = "import ";
        var hasDefaultBinding = false;
        var hasNamedBindings = false;

        if ( node.importClause ) {
            if ( node.importClause.name && this.addModuleImport( moduleName, node.importClause.name.text ) ) {
                importToWrite += node.importClause.name.text;
                hasDefaultBinding = true;
            }
        }

        if ( node.importClause.namedBindings ) {
            if ( node.importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport ) {
                if ( this.addModuleImport( moduleName, ( <ts.NamespaceImport>node.importClause.namedBindings ).name.text ) ) {
                    if ( hasDefaultBinding ) {
                        importToWrite += ", ";
                    }

                    importToWrite += "* as ";
                    importToWrite += ( <ts.NamespaceImport>node.importClause.namedBindings ).name.text;

                    hasNamedBindings = true;
                }
            }
            else {
                if ( hasDefaultBinding ) {
                    importToWrite += ", ";
                }

                importToWrite += "{ ";

                Utils.forEach(( <ts.NamedImports>node.importClause.namedBindings ).elements, element => {
                    if ( this.addModuleImport( moduleName, element.name.text ) ) {
                        if ( !hasNamedBindings ) {
                            hasNamedBindings = true;                            
                        }
                        else {
                            importToWrite += ", ";
                        }

                        let alias = element.propertyName;

                        if ( alias ) {
                            importToWrite += alias.text + " as " + element.name.text;
                        }
                        else {
                            importToWrite += element.name.text;
                        }
                    }
                });

                importToWrite += " }";
            }
        }

        importToWrite += " from ";
        importToWrite += node.moduleSpecifier.getText();
        importToWrite += ";";

        if ( hasDefaultBinding || hasNamedBindings ) {
            this.emitModuleImportDeclaration( importToWrite );
        }
    }

    private processImportStatements( file: ts.SourceFile ): string {
        Logger.info( "Processing import statements in file: ", file.fileName );
        let editText = file.text;

        ts.forEachChild( file, node => {
            if ( node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration ) {
                Logger.info( "processImportStatements() found import" );
                let moduleNameExpr = TsCore.getExternalModuleName( node );

                if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
                    
                    let moduleSymbol = this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );
                   
                    if ((moduleSymbol) && (this.isCodeModule(moduleSymbol) || this.isAmbientModule )) {
                        Logger.info("processImportStatements() removing code module symbol");
                        let pos = node.pos;
                        let end = node.end;

                        // White out import statement. 
                        // NOTE: Length needs to stay the same as original import statement
                        let length = end - pos;
                        let middle = "";

                        for (var i = 0; i < length; i++) {
                            middle += " ";
                        }

                        var prefix = editText.substring(0, pos);
                        var suffix = editText.substring(end);

                        editText = prefix + middle + suffix;
                    }
                }
            }
        });

        return editText;
    }

    private emitModuleImportDeclaration( moduleBlockText: string ) {
        Logger.info("Entering emitModuleImportDeclaration()" );

        this.bundleText += moduleBlockText + "\n";
    }

    private addSourceFile( file: ts.SourceFile ) {
        Logger.info( "Entering addSourceFile() with: ", file.fileName );

        if ( this.isCodeSourceFile( file ) ) {
            // Before adding the source text, we must white out import statement(s)
            let editText = this.processImportStatements( file );

            this.bundleText += editText + "\n";
            this.bundleImportedFiles[file.fileName] = file.fileName;
        }
        else {
            // Add d.ts files to the build source files context
            if ( !Utils.hasProperty( this.bundleSourceFiles, file.fileName ) ) {
                Logger.info( "Adding definition file to bundle source context: ", file.fileName );
                this.bundleSourceFiles[file.fileName] = file.text;
            }
        }
    }

    private compileBundle(bundleFileName: string, bundleText: string): CompilerResult {
        // Create bundle source file
        var bundleSourceFile = ts.createSourceFile( bundleFileName, bundleText, this.compilerOptions.target );
        this.bundleSourceFiles[bundleFileName] = bundleText;

        // Clear bundle output text
        this.outputText = {};

        // Create a compilerHost object to allow the compiler to read and write files
        var bundlerCompilerHost: ts.CompilerHost = {
            getSourceFile: (fileName, languageVersion) => {
                if (path.normalize(fileName) === path.normalize(ts.getDefaultLibFilePath(this.compilerOptions))) {
                    let libSourceText = fs.readFileSync( fileName ).toString( "utf8" );
                    var libSourceFile = ts.createSourceFile( fileName, libSourceText, languageVersion );

                    return libSourceFile;
                }
                else if ( Utils.hasProperty( this.bundleSourceFiles, fileName ) ) {
                    return ts.createSourceFile( fileName, this.bundleSourceFiles[ fileName ], languageVersion );
                }
                 
                if ( fileName === bundleFileName ) {
                    return bundleSourceFile;
                }

                // return undefined for a non-existent fileName
                if (!fs.existsSync(fileName)) {
                    Logger.warn(" getSourceFile(): file not found: ", fileName);
                    return undefined;
                }

                let text: string;
                try {
                    text = fs.readFileSync(fileName).toString("utf8");
                }
                catch (e) { }

                if (text !== undefined) {
                    return ts.createSourceFile(fileName, text, languageVersion);
                }

                Logger.warn( " getSourceFile(): file not readable: ", fileName );

                return undefined;
            },

            readFile: ( fileName ): string => {
                return "";
            },

            writeFile: ( name, text, writeByteOrderMark ) => {
                this.outputText[name] = text;
            },

            fileExists: ( fileName ): boolean => {
                return true;
            },

            getDefaultLibFileName: () => ts.getDefaultLibFilePath( this.compilerOptions ),
            useCaseSensitiveFileNames: () => false,
            getCanonicalFileName: fileName => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n"
        };

        // Get the list of bundle files to pass to program 
        let bundleFiles: string[] = [];

        for ( let key in this.bundleSourceFiles ) {
            bundleFiles.push(key);
        }

        var bundlerProgram = ts.createProgram( bundleFiles, this.compilerOptions, bundlerCompilerHost );

        // Check for preEmit diagnostics
        var preEmitDiagnostics = ts.getPreEmitDiagnostics( bundlerProgram );

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.compilerOptions.noEmitOnError && preEmitDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( bundlerProgram ), preEmitDiagnostics );
        }

        let emitTime = 0;
        let startTime = new Date().getTime();

        var emitResult = bundlerProgram.emit();

        emitTime += new Date().getTime() - startTime;

        // If the emitter didn't emit anything, then pass that value along.
        if ( emitResult.emitSkipped ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, new CompilerStatistics( bundlerProgram, 0 ), emitResult.diagnostics );
        }

        let allDiagnostics = preEmitDiagnostics.concat( emitResult.diagnostics );

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( allDiagnostics.length > 0 ) {
            return new CompilerResult( ts.ExitStatus.DiagnosticsPresent_OutputsGenerated, new CompilerStatistics( bundlerProgram, emitTime ), allDiagnostics );
        }

        return new CompilerResult( ts.ExitStatus.Success, new CompilerStatistics( bundlerProgram, emitTime ) );
    }

    private isCodeSourceFile( file: ts.SourceFile ): boolean {
        return ( file.kind === ts.SyntaxKind.SourceFile &&
            !( file.flags & ts.NodeFlags.DeclarationFile ) );
    }

    private isCodeModule( importSymbol: ts.Symbol ): boolean {
        let declaration = importSymbol.getDeclarations()[0];

        return ( declaration.kind === ts.SyntaxKind.SourceFile &&
            !( declaration.flags & ts.NodeFlags.DeclarationFile ) );
    }

    private isAmbientModule(importSymbol: ts.Symbol): boolean {
        let declaration = importSymbol.getDeclarations()[0];

        return ( ( declaration.kind === ts.SyntaxKind.ModuleDeclaration ) && ( ( declaration.flags & ts.NodeFlags.Ambient ) > 0 ) );
    }

    // TJT: Review duplicate code. Move to TsCore pass program as arg.
    private getSymbolFromNode( node: ts.Node ): ts.Symbol {
        let moduleNameExpr = TsCore.getExternalModuleName( node );

        if ( moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral ) {
            return this.program.getTypeChecker().getSymbolAtLocation( moduleNameExpr );
        }
    }
} 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

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
                                                                                                                                                                                                       

function src( configDirPath: string, settings?: any ) {

    if ( configDirPath === undefined && typeof configDirPath !== 'string' ) {
        throw new Error( "Provide a valid directory path to the project tsconfig.json" );
    }

    settings = settings || {};
    settings.logLevel = settings.logLevel || 0;

    Logger.setLevel( settings.logLevel );
    Logger.setName( "TsProject" );

    var outputStream = new CompileStream();

    var project = new Project( configDirPath, settings );
    var buildStatus = project.build( outputStream );

    // EOF the compilation output stream after build.
    outputStream.push( null );

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

    return outputStream;
}

export var tsproject = {
    src: src
    // FUTURE: to meet full vinyl adapter requirements
    // dest: dest,
    // watch: watch
}

//export = tsproject;
