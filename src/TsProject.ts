import * as stream from "stream"
import { Project } from "./Project/Project"
import { ProjectConfig } from "./Project/ProjectConfig"
import { ProjectBuilder } from "./Project/ProjectBuilder"
import { ProjectOptions } from "./Project/ProjectOptions"
import { BuildResult } from "./Project/ProjectBuildResult"

export { ProjectConfig }
export { ProjectOptions }
export { BuildResult }
export { Project }
export { ProjectBuilder }

export namespace TsProject
{

    export function getProjectConfig( configFilePath: string ): ProjectConfig
    {
        const project = new Project( configFilePath );
            return project.getConfig();
    }

    export function builder( configFilePath: string, options?: ProjectOptions, buildCompleted?: ( result: BuildResult ) => void ): ProjectBuilder
    {
        var projectBuilder = new ProjectBuilder( new Project( configFilePath, options ) );

        if ( buildCompleted )
        {
            projectBuilder.build( buildCompleted );
        }

        return projectBuilder;
    }

    export function src( configFilePath: string, options?: ProjectOptions ): stream.Readable {
        if ( configFilePath === undefined && typeof configFilePath !== 'string' ) {
            throw new Error( "Provide a valid directory or file path to the Typescript project configuration json file." );
        }

        let projectBuilder = new ProjectBuilder( new Project( configFilePath, options ) );

        return projectBuilder.src();
    }
}