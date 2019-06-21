// Compile gulp task
'use strict';

const gulp = require( 'gulp' );
const paths = require( '../paths' );
const tsproject = require( 'tsproject' );

gulp.task( 'bundle', function () {
    return tsproject.src( paths.sourceTsConfig )
        .pipe( gulp.dest( paths.output ) );
} );