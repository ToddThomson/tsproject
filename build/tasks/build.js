var gulp = require( 'gulp' );
var runSequence = require( 'run-sequence' );
var paths = require('../paths');
var tsproject = require( 'tsproject' );

gulp.task( 'compile', function() {
    return tsproject.src( paths.sourceTsConfig )
        .pipe( gulp.dest( paths.output ) );
});

gulp.task( 'build', function( callback ) {
    return runSequence(
        'clean',
        ['compile'],
        callback
    );
});
