'use strict';

const gulp = require( 'gulp' );
const paths = require( '../paths' );

gulp.task( 'release', function () {
    return gulp.src( [paths.main, paths.typings] )
        .pipe( gulp.dest( paths.release ) );
} );