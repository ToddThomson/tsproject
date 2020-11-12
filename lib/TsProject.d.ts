/// <reference types="node" />
import * as stream from "stream";
export declare namespace TsProject {
    const version: string;
    function src(configFilePath: string, settings?: any): stream.Readable;
}
