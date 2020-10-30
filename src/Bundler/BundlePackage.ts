export const enum BundlePackageType {
    None = 0,
    Library = 1,
    Component = 2
}

export class BundlePackage {
    private packageType: BundlePackageType;
    private packageNamespace: string = undefined;
    
    constructor( packageType: BundlePackageType, packageNamespace: string ) {
        this.packageType = packageType;
        this.packageNamespace = packageNamespace;
    }

    public getPackageType(): BundlePackageType {
        return this.packageType;
    }

    public getPackageNamespace(): string {
        return this.packageNamespace;
    }
}