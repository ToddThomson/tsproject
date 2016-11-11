var gulp = require( 'gulp' );
var paths = require( '../paths' );
var del = require( 'del' );

gulp.task( 'clean', function() {
    return del( paths.output );
});
