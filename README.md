# tsproject
A node module for compiling typescript projects and bundles. The tsconfig.json project configuration file is used to provide a compilation context for source files, bundles and compile options.

# Bundles
tsproject supports bundles within the tsconfig.json project file.  Each bundle contains a name, a source file and optional bundle options.
The typescript source file and its dependencies are packaged as a single file and output with the bundle name.

```
{
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

# Warning
tsproject is currently in the alpha stage of development.


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
        .pipe(gulp.dest('./built'));
});
```
