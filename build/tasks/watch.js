var gulp = require('gulp');
var runSequence = require('run-sequence');
var paths = require('../paths');
var tsproject = require( '../../src/tsproject.js');

gulp.task('watch', function (cb) {
    tsproject.src(paths.sourceTsConfig, {
        logLevel: 0,
        compilerOptions: {
            watch: true,
            listFiles: false
        }
    }).pipe(gulp.dest(paths.output))
});