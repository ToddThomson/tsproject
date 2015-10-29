var gulp = require('gulp');
var paths = require('../paths');
var rm = require('gulp-rimraf');

gulp.task('clean', function(callback) {
  return gulp.src( paths.output ).pipe ( rm() );
});
