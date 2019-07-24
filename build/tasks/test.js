'use strict';

const gulp = require( 'gulp' );
var mocha = require( 'gulp-mocha' );
const paths = require( '../paths' );

gulp.task( 'run-tests', function () {
    return gulp.src( 'tests/**/*.js', { read: false } )
        .pipe( mocha( { reporter: 'spec' } ) );
} );