import * as ts from "typescript";
import * as chokidar from "chokidar";

import { CachingCompilerHost } from "./CachingCompilerHost";
import { TsCore } from "../Utils/TsCore";

/**
 * @description A typescript compiler host that supports watch incremental builds.
 */
export class WatchCompilerHost extends CachingCompilerHost {

    private reuseableProgram: ts.Program;
    private onSourceFileChanged: { (sourceFile: ts.SourceFile, path: string, stats: any): void; (arg0: TsCore.WatchedSourceFile, arg1: string, arg2: any): void; };

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
                return sourceFile;
            }
        }
        
        // Use base class to get the source file
        let sourceFile: TsCore.WatchedSourceFile = super.getSourceFileImpl( fileName, languageVersion, onError );

        if ( sourceFile && this.compilerOptions.watch ) {
            sourceFile.fileWatcher = chokidar.watch( sourceFile.fileName );
            sourceFile.fileWatcher.on( "change", ( path: string, stats:any ) => this.onSourceFileChanged( sourceFile, path, stats ) );
        }

        return sourceFile;
    }
}