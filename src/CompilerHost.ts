/// <reference path="references.d.ts" />

import { TsVinylFile } from "./TsVinylFile";
import { Logger } from "./Logger";
import ts = require( 'typescript' );
import fs = require( 'fs' );
import path = require( 'path' );

export class CompilerHost implements ts.CompilerHost {

    public output: ts.Map<string> = {};
    private compilerOptions: ts.CompilerOptions;
    private setParentNodes: boolean = false;
    private currentDirectory: string;
    private sourceFiles: ts.Map<ts.SourceFile> = {};
    
    constructor( compilerOptions: ts.CompilerOptions, setParentNodes?: boolean ) {
        this.compilerOptions = compilerOptions;
    }

    getSourceFile( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ): ts.SourceFile {
        Logger.log( "getSourceFile: ", fileName );
        let text: string;

        try {
            text = fs.readFileSync( fileName ).toString("utf8");
        }
        catch ( e ) {
            if ( onError ) {
                onError( e.message );
            }
        }

        if ( text !== undefined ) {
            var sourceFile = ts.createSourceFile( fileName, text, languageVersion );

            this.sourceFiles[fileName] = sourceFile;

            return sourceFile;
        }
        
        return undefined;            
    }

    writeFile = ( fileName: string, data: string, writeByteOrderMark: boolean, onError?: ( message: string ) => void ) => {
        Logger.log( "Entering writeFile with: ", fileName );

        this.output[fileName] = data;
    }

    getDefaultLibFileName() {
        return ts.getDefaultLibFilePath( this.compilerOptions );
    }

    useCaseSensitiveFileNames() {
        return false;
    }

    getCanonicalFileName( fileName ) {
        return fileName;
    }

    getCurrentDirectory() {
        return this.currentDirectory || ( this.currentDirectory = process.cwd() );
    }

    getNewLine() {
        return "\n";
    }
}