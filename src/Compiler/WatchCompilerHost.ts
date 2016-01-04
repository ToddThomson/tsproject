import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( "path" );
import chokidar = require( "chokidar" );

import { CachingCompilerHost } from "./CachingCompilerHost";
import { Logger } from "../Reporting/Logger";
import { TsCore } from "../Utils/tscore";
import { Utils } from "../Utils/Utilities";

/**
 * @description A typescript compiler host that supports watch incremental builds.
 */
export class WatchCompilerHost extends CachingCompilerHost { //implements ts.CompilerHost {

    private reuseableProgram: ts.Program;
    private onSourceFileChanged;

    constructor( compilerOptions: ts.CompilerOptions, onSourceFileChanged?: ( sourceFile: ts.SourceFile, path: string, stats: any ) => void ) {
        super( compilerOptions );

        this.onSourceFileChanged = onSourceFileChanged;
    }

    public setReuseableProgram( program: ts.Program ) {
        this.reuseableProgram = program;
    }

    public getSourceFile = ( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ): ts.SourceFile => {

        if ( this.reuseableProgram ) {
            // Use program to get source files
            let sourceFile: TsCore.WatchedSourceFile = this.reuseableProgram.getSourceFile( fileName );

            // If the source file has not been modified (it has a fs watcher ) then use it            
            if ( sourceFile && sourceFile.fileWatcher ) {
                //Logger.log( "getSourceFile() watcher hit for: ", fileName );
                return sourceFile;
            }
        }
        
        // Use base class to get the source file
        //Logger.log( "getSourceFile() reading source file from fs: ", fileName );
        let sourceFile: TsCore.WatchedSourceFile = super.getSourceFileImpl( fileName, languageVersion, onError );

        if ( sourceFile && this.compilerOptions.watch ) {
            sourceFile.fileWatcher = chokidar.watch( sourceFile.fileName );
            sourceFile.fileWatcher.on( "change", ( path: string, stats:any ) => this.onSourceFileChanged( sourceFile, path, stats ) );
        }

        return sourceFile;
    }
}