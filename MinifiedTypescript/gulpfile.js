// Node related
var chalk = require('chalk');

// Gulp related
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rimraf = require('gulp-rimraf'),
    replace = require('gulp-replace'),
    htmlreplace = require('gulp-html-replace'),
    rjs = require('gulp-requirejs'),
    tsproject = require('tsproject');

// Require Optimizer Config
var requireJsOptimizerConfig = {
    out: 'scripts.js',
    baseUrl: './src',
    name: 'app/bundles/app.min',
    paths: {
        requireLib: 'bower_modules/requirejs/require'
    },
    include: ['requireLib'],
    insertRequire: ['app/bundles/app.min']
};

gulp.task( 'ts', function() {
    return tsproject.src('./src/app/tsconfig.json')
        .pipe(gulp.dest('./'));
});

gulp.task('js', ['ts'], function(callback) {
    rjs(requireJsOptimizerConfig)
        .pipe(gulp.dest('./dist/'));

    callback();
});

gulp.task('css', function() {
    return gulp.src('./src/css/app.css')
        .pipe(concat('css.css'))
        .pipe(gulp.dest( './dist/' ));
});

// Copies index.html, replacing <script> and <link> tags to reference production URLs
gulp.task('html', function() {
    return gulp.src('./src/index.html')
        .pipe(htmlreplace({
            'css': 'css.css',
            'js': 'scripts.js'
        }))
        .pipe(gulp.dest('./dist/'));
});

// Removes all files from ./dist/
gulp.task( 'clean', function() {
    return gulp.src( './dist/**/*', { read: false } )
      .pipe( rimraf() );
} );

gulp.task( 'default', [ 'html', 'js', 'css'], function( callback ) {
    console.log( '\nPlaced optimized files in ' + chalk.magenta( 'dist/\n' ) );
    callback();
});