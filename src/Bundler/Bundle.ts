import { BundleConfig } from "./BundleConfig";

export interface Bundle {
    name: string;
    fileNames: string[];
    config: BundleConfig;
}