const chalk = require('chalk');
const gulp = require( 'gulp' );
const htmlreplace = require( 'gulp-html-replace' );
const concat = require( 'gulp-concat' );
const rimraf = require( 'gulp-rimraf' );
const replace = require( 'gulp-replace' );
const tsproject = require( "../../src/TsProject" );

gulp.task( 'bundle', function ()
{
    return tsproject.src( './src/app/tsconfig.json' )
        .pipe( gulp.dest( '.' ) );
} );

gulp.task( 'js', function ( callback )
{
    gulp.src( './src/app/bundles/app.min.js' )
        .pipe( gulp.dest( './dist/' ) );

    callback();
} );

gulp.task( 'css', function ()
{
    return gulp.src( './src/css/app.css' )
        .pipe( concat( 'css.css' ) )
        .pipe( gulp.dest( './dist/' ) );
} );

// Copies index.html, replacing <script> and <link> tags to reference production URLs
gulp.task( 'html', function ()
{
    return gulp.src( './src/index.html' )
        .pipe( htmlreplace( {
            'css': 'css.css'
        } ) )
        .pipe( gulp.dest( './dist/' ) );
} );

// Removes all files from ./dist/
gulp.task( 'clean', function ()
{
    return gulp.src( './dist/**/*', { read: false } )
        .pipe( rimraf() );
} );

gulp.task( 'default', gulp.series( 'bundle', 'html', 'js', 'css' ), function ( callback )
{
    console.log( '\nPlaced optimized files in ' + chalk.magenta( 'dist/\n' ) );
    callback();
} );