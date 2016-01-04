var gulp = require( 'gulp' );
var runSequence = require( 'run-sequence' );
var paths = require('../paths');
//var tsproject = require('tsproject');
//var tsproject = require('../../src/tsproject.js');
var tsproject = require('../../tsproject.min.js');
var tsd = require( 'gulp-tsd' );

gulp.task( 'tsd', function( callback ) {
  return gulp.src('./gulp_tsd.json').pipe( tsd() );
});

gulp.task( 'watch', function( cb ) {
    tsproject.src( paths.sourceTsConfig, {
        logLevel: 0,
        compilerOptions: {
            watch: true,
            listFiles: false
        }
    }).pipe( gulp.dest( paths.output ) )
});

gulp.task( 'compile', ['tsd'], function() {
  return tsproject.src( paths.sourceTsConfig )
    .pipe( gulp.dest( paths.output ) );
});

gulp.task( 'build', function( callback ) {
  return runSequence(
    //'clean',
    'tsd',
    'compile',
    callback
  );
});