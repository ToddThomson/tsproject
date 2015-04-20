# TsProject
TsProject is a Typescript compiler and external module bundler which utilizes the Typescript project configuration file, tsconfig.json, to provide a compilation context for source files, bundles and compile options.

TsProject produces a compiled output stream of vinyl files for further processing in the gulp build pipeline.

# Why TsProject?
TsProject provides 2 new features:

1. **A single Typescript project build context**. TsProject uses the new tsconfig.json Typescript project file introduced in Typescript version 1.5 to configure source files, bundles and compile options.

2. **Single file bundles for packaging of Typescript, javascript and Typescript definition files**. TsProject bundles file dependencies of external Typescript modules at compilation time rather than relying on build tools (AMD Optimizer, r.js for example ) further down in the build pipeline.

# Bundles
TsProject supports bundles within the tsconfig.json project file.  Each bundle contains a name, a source file and optional bundle options.
The Typescript source file and its dependencies are packaged as a single Typescript file and output with the bundle name. The Typescript bundle is compiled to a single js javascript file and a single d.ts declaration file.

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
            "source": "page.ts",
            "options": { 
                "some-bundle-option": "value"  
            }
        },
        "main": {
            "source": "index.ts"
        }
    }
}
```

# How to install

```
npm install tsproject
```

# Usage
Pass a string representing the relative directory path to the Typescript tsconfig.json project file.

Sample gulpfile:

```
var tsproject = require( 'tsproject' );
var gulp = require( 'gulp' );
gulp.task( 'build', function() {
    return tsproject.src( './src/project' )
        .pipe(gulp.dest('./build'));
});
```
