var gulp = require('gulp');
var runSequence = require('run-sequence');
var paths = require('../paths');
var tsproject = require('../../src/tsproject.js');
//var tsproject = require('../../tsproject.min.js');

gulp.task('ts', function () {
    return tsproject.src( paths.testDir + "minifier/tsconfig.json", { logLevel: 0 })
        .pipe( gulp.dest( "./" ));
});

gulp.task('test', function (callback) {
    return runSequence(
        'clean',
        ['ts'],
        callback
    );
});
