'use strict';

var gulp = require( 'gulp' );
var registry = require( 'gulp-hub' );

/* Load our build tasks into the registry */
var hub = new registry( ['./build/tasks/*.js'] );

gulp.registry( hub );

gulp.task( 'build', gulp.series( 'clean', 'bundle' ), function ( cb ) {
    cb();
} );
