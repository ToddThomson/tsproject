// Node related
var fs = require( 'fs' ),
    vm = require( 'vm' ),
    merge = require( 'deeply' ),
    chalk = require( 'chalk' ),
    es = require( 'event-stream' );

// Gulp related
var gulp = require( 'gulp' ),
    concat = require( 'gulp-concat' ),
    rimraf = require( 'gulp-rimraf' ),
    replace = require( 'gulp-replace' ),
    uglify = require( 'gulp-uglify' ),
    htmlreplace = require( 'gulp-html-replace' ),
    rjs = require( 'gulp-requirejs' ),
    tsproject = require( 'tsproject' );

// Require Optimizer Config
var requireJsOptimizerConfig = {
    out: 'scripts.js',
    baseUrl: './app',
    name: 'src/bundles/app',
    paths: {
        requireLib: 'bower_modules/requirejs/require',
        angular: 'bower_modules/angular/angular'
    },
    shim: {
        "angular": { exports: "angular" }
    },
    include: ['requireLib'],
    insertRequire: ['src/bundles/app']
};

gulp.task( 'ts', function() {
    return tsproject.src( './app/src/tsconfig.json', { logLevel: 0 } )
        .pipe( gulp.dest( './' ) );
} );

gulp.task( 'js', ['ts'], function( callback ) {
    rjs( requireJsOptimizerConfig )
        //.pipe(uglify({ preserveComments: 'some' }))
        .pipe( gulp.dest( './dist/' ) );

    callback();
} );

// Concatenates CSS files, rewrites relative paths to Bootstrap fonts, copies Bootstrap fonts
gulp.task( 'css', function() {
    var todoCss = gulp.src('app/bower_modules/todomvc-app-css/index.css'),
        appCss = gulp.src('app/css/*.css');

    return s = es.concat(todoCss, appCss).pipe(concat('css.css'))
        .pipe(gulp.dest('./dist/'));
} );

// Copies index.html, replacing <script> and <link> tags to reference production URLs
gulp.task( 'html', function() {
    return gulp.src( './app/index.html' )
        .pipe( htmlreplace( {
            'css': 'css.css',
            'js': 'scripts.js'
        } ) )
        .pipe( gulp.dest( './dist/' ) );
} );

// Removes all files from ./dist/
gulp.task( 'clean', function() {
    return gulp.src( './dist/**/*', { read: false } )
      .pipe( rimraf() );
} );

gulp.task( 'default', ['html', 'js', 'css'], function( callback ) {
    console.log( '\nPlaced optimized files in ' + chalk.magenta( 'dist/\n' ) );
    callback();
} );