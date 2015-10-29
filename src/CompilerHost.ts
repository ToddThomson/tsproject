import { Logger } from "./Logger";
import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( "path" );
import os = require( "os" );

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

