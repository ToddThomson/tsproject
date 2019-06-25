import { BundlePackage } from "./BundlePackage";

export interface BundleConfig {
    sourceMap?: boolean;
    declaration?: boolean;
    outDir?: string;
    minify?: boolean;
    package?: BundlePackage;
}