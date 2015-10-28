var gulp = require('gulp');
var runSequence = require('run-sequence');
var paths = require('../paths');
var tsproject = require( 'tsproject' );
var debug = require('gulp-debug');
var ignore = require('gulp-ignore');
var rename = require('gulp-rename');
var tsd = require('gulp-tsd');
var chalk = require('chalk');

gulp.task('tsd', function (callback) {
  console.log('\nRunning tsd\n');
  return gulp.src('./gulp_tsd.json').pipe(tsd());
});

gulp.task('build', ['tsd'], function () {
  
  console.log( '\nPlaced optimized files in ' + chalk.magenta( paths.output + '\n' ) );
  // path to named configuration file provided..
  return tsproject.src( paths.sourceTsConfig, {
      logLevel: 2,
      "compilerOptions": {
        "module": "commonjs",
        "target": "es5"
      }
    })
    .pipe(rename({dirname: "",}))
    .pipe(gulp.dest(paths.output));
});

gulp.task('default', function(callback) {
  return runSequence(
    'clean',
    ['build'],
    callback
  );
});
