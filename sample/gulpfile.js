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
    out: 'sample.js',
    baseUrl: './src',
    name: 'app/app',
    paths: {
        requireLib: 'bower_modules/requirejs/require'
    },
    include: [
        'requireLib',
    ],
    insertRequire: ['app/app']
};

gulp.task( 'ts', function() {
    return tsproject.src( './src/app', { logLevel: 0 } )
        .pipe( gulp.dest( './dist' ) );
} );

gulp.task( 'js', function() {
    return rjs( requireJsOptimizerConfig )
        //.pipe(uglify({ preserveComments: 'some' }))
        .pipe( gulp.dest( './dist/' ) );
} );

// Concatenates CSS files, rewrites relative paths to Bootstrap fonts, copies Bootstrap fonts
gulp.task( 'css', function() {
    var bowerCss = gulp.src( 'src/bower_modules/components-bootstrap/css/bootstrap.min.css' )
            .pipe( replace( /url\((')?\.\.\/fonts\//g, 'url($1fonts/' ) ),
        appCss = gulp.src( 'src/css/*.css' ),
        combinedCss = es.concat( bowerCss, appCss ).pipe( concat( 'css.css' ) ),
        fontFiles = gulp.src( './src/bower_modules/components-bootstrap/fonts/*', { base: './src/bower_modules/components-bootstrap/' } );
    return es.concat( combinedCss, fontFiles )
        .pipe( gulp.dest( './dist/' ) );
} );

// Copies index.html, replacing <script> and <link> tags to reference production URLs
gulp.task( 'html', function() {
    return gulp.src( './src/index.html' )
        .pipe( htmlreplace( {
            'css': 'css.css',
            'js': 'sample.js'
        } ) )
        .pipe( gulp.dest( './dist/' ) );
} );

// Removes all files from ./dist/
gulp.task( 'clean', function() {
    return gulp.src( './dist/**/*', { read: false } )
      .pipe( rimraf() );
} );

gulp.task( 'default', ['html', 'js', 'css'], function( callback ) {
    callback();
    console.log( '\nPlaced optimized files in ' + chalk.magenta( 'dist/\n' ) );
} );