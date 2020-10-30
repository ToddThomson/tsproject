'use strict';

const gulp = require( 'gulp' );
const paths = require( './build/paths' );
const registry = require( 'gulp-hub' );

/* Load our build tasks into the registry */
var hub = new registry( ['./build/tasks/*.js'] );

gulp.registry( hub );

gulp.task( 'build', gulp.series( 'clean', 'bundle', 'release' ), function ()
{
} );