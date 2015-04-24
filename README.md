[![npm version](https://badge.fury.io/js/tsproject.svg)](http://badge.fury.io/js/tsproject)
# TsProject
TsProject is a Typescript compiler and external module bundler which utilizes the Typescript project configuration file, tsconfig.json, to provide a compilation context for source files, bundles and compile options.

TsProject produces a compiled output stream of vinyl files for further processing in the gulp build pipeline.

# Why TsProject?
TsProject provides 2 new features:

1. **A single Typescript project build context**. TsProject uses the new tsconfig.json Typescript project file introduced in Typescript version 1.5 to configure source files, bundles and compile options.

2. **Single file bundles for packaging of Typescript, javascript and Typescript definition files**. TsProject bundles file dependencies of external Typescript modules at compilation time rather than relying on build tools (AMD Optimizer, r.js for example ) further down in the build pipeline.

# Bundles
TsProject supports a "bundles" property within the tsconfig.json project file. The "bundles" property may contain a list of named bundles. Each bundle must provide a source file and may optionally specify bundle configuration settings.  
The Typescript source file and its dependencies are packaged as a single Typescript file and output with the bundle name. The Typescript bundle is compiled to a single js javascript file and a single d.ts declaration file.

The following is a sample tsconfig.json showing the "bundles" property:

```
{
    "compilerOptions": {
        "module": "amd",
        "target": "es5",
        "noResolve": false,
        "declaration": true,
        "diagnostics": true
    },

    "files": [
        "index.ts",
        "page.ts",
        "common.ts",
    ],
    
    "bundles": {
        "app": {
            "source": "index.ts"
        },
        "components": {
            "source": "page.ts",
            "config": { 
                "basePath": "./bundles"  
            }
        }
    }
}
```

# How to install

```
npm install tsproject
```

# API

    tsproject.src( projectConfigPath: string, settings: any )

Where:

**projectConfigPath** is a relative directory path to the default Typescript project file named "tsconfig.json".
**projectConfigPath** is a relative path to a named Typescript project file.   

# Usage - Gulp Build Pipeline
TsProject on github contains a [sample](https://github.com/ToddThomson/tsproject/tree/master/sample) to help you get started.
Here is the sample gulpfile.js from the sample:

```
var tsproject = require( 'tsproject' );
var gulp = require( 'gulp' );
gulp.task( 'build', function() {

    // path to directory of tsconfig.json provided..
    tsproject.src( './src/project' )
        .pipe(gulp.dest('./build'));
    
    // path to named configuration file provided..
    return tsproject.src( './src/project_a/myconfig.json', { logLevel: 1 } )
        .pipe( gulp.dest( './mybuild' ) );

});
```
