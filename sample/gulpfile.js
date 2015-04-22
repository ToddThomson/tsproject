var tsproject = require( 'tsproject' );
var gulp = require('gulp');

gulp.task( 'build', function() {

    return tsproject.src( './src/project_a', { logLevel: 0 } )
        .pipe(gulp.dest('./build'));

});