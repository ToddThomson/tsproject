import * as stream from "stream";
declare namespace TsProject {
    function src(configFilePath: string, settings?: any): stream.Readable;
}
export = TsProject;