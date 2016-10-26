var gulp = require( 'gulp' );
var paths = require( '../paths' );
var del = require( 'del' );

gulp.task( 'clean', function( callback ) {
    return del( paths.output );
});
