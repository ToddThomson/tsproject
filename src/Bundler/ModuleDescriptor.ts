import { BundleContainer } from "./ModuleContainer"
import { Utils } from "../Utils/Utilities";
import * as ts from "typescript";

export class ModuleDescriptor {
    private node: ts.Node;
    private sourceFile: ts.SourceFile;
    private symbol: ts.Symbol;

    private isBundleModule: boolean;

    // Map of container ids that this module has been referenced in
    private containers: ts.MapLike<BundleContainer> = {};

    // TJT: Why isn't this an array of ModuleModuleDescriptors? Array of external dependencies
    private dependencies: ts.Node[] = [];

    constructor( node: ts.Node, dependencies: ts.Node[], sourceFile: ts.SourceFile, symbol: ts.Symbol, isBundleModule: boolean, container: BundleContainer ) {
        this.node = node;
        this.dependencies = dependencies;
        this.sourceFile = sourceFile;
        this.symbol = symbol;
        this.isBundleModule = isBundleModule;

        // TJT: Add the container that this module has been found in?
        this.containers[ container.getId().toString() ] = container;
    }

    public getNode(): ts.Node {
        return this.node;
    }

    public getDependencies(): ts.Node[] {
        return this.dependencies;
    }

    public getContainers(): ts.MapLike<BundleContainer> {
        return this.containers;
    }

    public getFileName(): string {
        return this.sourceFile.fileName;
    }

    public getSourceFile(): ts.SourceFile {
        return this.sourceFile;
    }

    public isContainer(): boolean {
        return this.isBundleModule;
    }

    public isExternalModule(): boolean {
        return ( (<any>this.sourceFile).externalModuleIndicator != undefined );
    }
}