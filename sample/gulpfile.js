var tsproject = require( 'tsproject' );
var gulp = require('gulp');

gulp.task( 'build', function() {

    tsproject.src( './src/project_a', { logLevel: 0 } )
        .pipe( gulp.dest( './build' ) );

    return tsproject.src( './src/project_a/myconfig.json', { logLevel: 0 } )
        .pipe( gulp.dest( './mybuild' ) );

} );