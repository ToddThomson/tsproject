// Node related
var chalk = require('chalk');

// Gulp related
var gulp = require( 'gulp' ),
    rimraf = require( 'gulp-rimraf' ),
    uglify = require( 'gulp-uglify' ),
    tsproject = require( './src/tsproject' );

gulp.task( 'ts', function() {
    return tsproject.src( './src/tsconfig.json', { logLevel: 4 } )
        .pipe( gulp.dest( './dist' ) );
} );

// Removes all files from ./dist/
gulp.task( 'clean', function() {
    return gulp.src( './dist/**/*', { read: false } )
      .pipe( rimraf() );
} );

gulp.task( 'default', [ 'ts'], function( callback ) {
    console.log( '\nPlaced optimized files in ' + chalk.magenta( 'dist/\n' ) );
    callback();
} );