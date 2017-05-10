var gulp = require( 'gulp' );
var runSequence = require( 'run-sequence' );
var paths = require( '../paths' );
var tsproject = require( '../../src/tsproject.js' );
var tsprojectmin = require( '../../src/tsproject.js' );

gulp.task( 'local', function() {
    return tsproject.src( paths.sourceTsConfig )
        .pipe( gulp.dest( paths.output ) );
});

gulp.task( 'local-min', function () {
    return tsprojectmin.src( paths.sourceTsConfig )
        .pipe( gulp.dest( paths.output ) );
});
