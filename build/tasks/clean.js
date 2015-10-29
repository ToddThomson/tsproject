var gulp = require('gulp');
var paths = require('../paths');
var rm = require('gulp-rimraf');
var vinylPaths = require('vinyl-paths');

gulp.task('clean', function(callback) {
  return gulp.src('dist/*').pipe(rm());
});
