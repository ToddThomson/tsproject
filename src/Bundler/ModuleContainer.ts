import * as ts from "typescript";
import { ModuleDescriptor } from "./ModuleDescriptor"
import { Utils } from "../Utils/Utilities"
import { Logger } from "../Reporting/Logger"

class IdGenerator {
    static nextId = 1;

    static getNextId(): number {
        return this.nextId++;
    }
}

/**
 * A bundle container for module descriptors. A bundle may be the global, top-level source file module
 * or an "internal" bundle module defined through the @bundlemodule( moduleName: string ) annotation in an ambient source file.
 */
export class BundleContainer {
    private sourceFile: ts.SourceFile;

    private parent: BundleContainer = undefined;
    private children: BundleContainer[] = [];

    private modules: ModuleDescriptor[] = [];
    private modulesAdded: ts.MapLike<boolean> = {};

    private id: number;
    private name: string;

    private isBundleModule: boolean;

    constructor( name: string, sourceFile: ts.SourceFile, isBundleModule: boolean, parent?: BundleContainer ) {
        this.name = name;
        this.sourceFile = sourceFile;
        this.isBundleModule = isBundleModule;
        this.parent = parent;

        this.id = IdGenerator.getNextId();
    }

    public addModule( module: ModuleDescriptor, fileName: string ) {
        if ( !Utils.hasProperty( this.modulesAdded, fileName ) ) {
            this.modules.push( module );

            // TJT: This should be module.fileName
            this.modulesAdded[ fileName ] = true;
        }
    }

    public isBundle(): boolean {
        return this.isBundleModule;
    }

    public getModules(): ModuleDescriptor[] {
        return this.modules;
    }

    // API: should be calle add()
    public addChild( container: BundleContainer ): void {
        this.children.push( container );
    }

    public getChildren(): BundleContainer[] {
        return this.children;
    }

    public getParent(): BundleContainer {
        return this.parent;
    }

    // TJT: Why Name and FileName?
    public getName(): string {
        return this.name;
    }

    public getFileName(): string {
        return this.sourceFile.fileName;
    }

    public getId(): number {
        return this.id;
    }
}