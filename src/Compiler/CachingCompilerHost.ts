import * as ts from "typescript"
import * as path from "path"
import { TsCore } from "../Utils/TsCore"
import { Utils } from "../Utils/Utilities"

export class CachingCompilerHost implements ts.CompilerHost
{
    protected system: ts.System = ts.sys;
    private output: ts.MapLike<string> = {};

    private dirExistsCache: ts.MapLike<boolean> = {};
    private fileExistsCache: ts.MapLike<boolean> = {};
    private fileReadCache: ts.MapLike<string> = {};

    protected compilerOptions: ts.CompilerOptions;
    protected baseHost: ts.CompilerHost;

    constructor( compilerOptions: ts.CompilerOptions )
    {
        this.compilerOptions = compilerOptions;
        this.baseHost = ts.createIncrementalCompilerHost( this.compilerOptions, this.system );
    }

    public getOutput = () =>
    {
        return this.output;
    }

    public readFile = ( fileName: string ): string =>
    {
        if ( this.isBuildInfoFile( fileName ) )
        {
            return this.baseHost.readFile( fileName );
        }

        if ( Utils.hasProperty( this.fileReadCache, fileName ) )
        {
            return this.fileReadCache[fileName];
        }

        return this.fileReadCache[fileName] = this.baseHost.readFile( fileName );
    }

    public writeFile = ( fileName: string, data: string, writeByteOrderMark: boolean, onError?: ( message: string ) => void ) =>
    {
        if ( this.isBuildInfoFile( fileName ) )
        {
            return this.baseHost.writeFile( fileName, data, writeByteOrderMark );
        }
        this.baseHost.writeFile( fileName, data, writeByteOrderMark );
        this.output[fileName] = data;
    }

    public directoryExists = ( directoryPath: string ): boolean =>
    {
        if ( Utils.hasProperty( this.dirExistsCache, directoryPath ) )
        {
            return this.dirExistsCache[directoryPath];
        }

        return this.dirExistsCache[directoryPath] = ts.sys.directoryExists( directoryPath );
    }

    public fileExists = ( fileName: string ): boolean =>
    {
        fileName = this.getCanonicalFileName( fileName );

        // Prune off searches on directories that don't exist
        if ( !this.directoryExists( path.dirname( fileName ) ) )
        {
            return false;
        }

        if ( Utils.hasProperty( this.fileExistsCache, fileName ) )
        {
            return this.fileExistsCache[fileName];
        }

        return this.fileExistsCache[fileName] = this.baseHost.fileExists( fileName );
    }

    // Use Typescript CompilerHost "base class" implementation..
    public getSourceFile = ( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ): ts.SourceFile =>
    {
        return this.baseHost.getSourceFile( fileName, languageVersion, onError );
    }

    public getDefaultLibFileName = ( options: ts.CompilerOptions ) =>
    {
        return this.baseHost.getDefaultLibFileName( options );
    }

    public getCurrentDirectory = () =>
    {
        return this.baseHost.getCurrentDirectory();
    }

    public getDirectories = ( path: string ): string[] =>
    {
        return this.baseHost.getDirectories( path );
    }

    public getCanonicalFileName = ( fileName: string ) =>
    {
        return this.baseHost.getCanonicalFileName( fileName );
    }

    public useCaseSensitiveFileNames = () =>
    {
        return this.baseHost.useCaseSensitiveFileNames();
    }

    public getNewLine = () =>
    {
        return this.baseHost.getNewLine();
    }

    public readDirectory( rootDir: string, extensions?: ReadonlyArray<string>, exclude?: ReadonlyArray<string>, include?: ReadonlyArray<string>, depth?: number ): string[]
    {
        return this.baseHost.readDirectory( rootDir, extensions, exclude, include, depth );
    }

    protected isBuildInfoFile( file: string )
    {
        return TsCore.fileExtensionIs( file, ts.Extension.TsBuildInfo.toString() );
    }
}