# tsproject
A node module for compiling typescript projects using tsconfig.json. The tsconfig.json project configuration file is used to provide a compilation context for source files and compile options.


# Warning
tsproject is currently in the experimental stage of development. Use at your own risk.

# How to install

```
npm install tsproject
```

# Usage

Sample gulpfile:

```
var tsproject = require( 'tsproject' );
var gulp = require( 'gulp' );
gulp.task( 'build', function() {
    return tsproject( './src/project_a' )
        .pipe(gulp.dest('./built'));
});
```
