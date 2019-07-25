import { expect } from "chai"
import { TsProject, BuildResult } from "../../../src/TsProject"
import { TsCompiler, CompileTransformers, CompileResult, CompileStatus } from "Ts2Js"

describe( "Build Project", () =>
{
    function buildWithBuilder( name: string, projectConfigPath: string, transformers?: CompileTransformers )
    {
        describe( name, () =>
        {
            var buildResult: BuildResult;

            var projectBuilder = TsProject.builder( projectConfigPath );

            projectBuilder.build( ( result ) =>
            {
                buildResult = result;

                if ( !result.succeeded )
                {
                    console.log( "build failed" );
                } else
                {
                    console.log( "build succeeded" );
                }
            } );

            it( "Project build status is successful", () =>
            {
                expect( buildResult.succeeded ).to.equal( CompileStatus.Success );
            } );
        } );
    }

    buildWithBuilder( "Compiles project", "./tests/projects/simple" );
} );