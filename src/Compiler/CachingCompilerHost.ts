import * as ts from "typescript";
import * as path from "path";
import { Utils } from "../Utils/Utilities";

/**
 * @description A typescript compiler host that supports incremental builds and optimizations for file reads and file exists functions. Emit output is saved to memory.
 */
export class CachingCompilerHost implements ts.CompilerHost {
    private output: ts.MapLike<string> = {};
    private dirExistsCache: ts.MapLike<boolean> = {};
    private fileExistsCache: ts.MapLike<boolean> = {};
    private fileReadCache: ts.MapLike<string> = {};

    protected compilerOptions: ts.CompilerOptions;
    private baseHost: ts.CompilerHost;

    constructor( compilerOptions: ts.CompilerOptions ) {
        this.compilerOptions = compilerOptions;
        this.baseHost = ts.createCompilerHost( this.compilerOptions );
    }

    public getOutput() {
        return this.output;
    }

    public getSourceFileImpl( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ): ts.SourceFile {
        // Use baseHost to get the source file
        return this.baseHost.getSourceFile( fileName, languageVersion, onError );
    }

    public getSourceFile = this.getSourceFileImpl;

    public writeFile( fileName: string, data: string, writeByteOrderMark: boolean, onError?: ( message: string ) => void ) {
        this.output[fileName] = data;
    }

    public fileExists = ( fileName: string ): boolean => {
        fileName = this.getCanonicalFileName( fileName );

        // Prune off searches on directories that don't exist
        if ( !this.directoryExists( path.dirname( fileName ) ) ) {
            return false;
        }

        if ( Utils.hasProperty( this.fileExistsCache, fileName ) ) {
            return this.fileExistsCache[fileName];
        }

        return this.fileExistsCache[fileName] = this.baseHost.fileExists( fileName );
    }

    public readFile( fileName: string ): string {
        if ( Utils.hasProperty( this.fileReadCache, fileName ) ) {
            return this.fileReadCache[fileName];
        }

        return this.fileReadCache[fileName] = this.baseHost.readFile( fileName );
    }

    // Use Typescript CompilerHost "base class" implementation..

    public getDefaultLibFileName( options: ts.CompilerOptions ) {
        return this.baseHost.getDefaultLibFileName( options );
    }

    public getCurrentDirectory() {
        return this.baseHost.getCurrentDirectory();
    }

    public getDirectories( path: string ): string[] {
        return this.baseHost.getDirectories( path );
    }

    public getCanonicalFileName( fileName: string ) {
        return this.baseHost.getCanonicalFileName( fileName );
    }

    public useCaseSensitiveFileNames() {
        return this.baseHost.useCaseSensitiveFileNames();
    }

    public getNewLine() {
        return this.baseHost.getNewLine();
    }

    public directoryExists( directoryPath: string ): boolean {
        if ( Utils.hasProperty( this.dirExistsCache, directoryPath ) ) {
            return this.dirExistsCache[directoryPath];
        }

        return this.dirExistsCache[directoryPath] = ts.sys.directoryExists( directoryPath );
    }
}