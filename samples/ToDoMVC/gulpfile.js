const chalk = require( 'chalk' );
const gulp = require( 'gulp' );
const del = require( 'del' );
const concat = require( 'gulp-concat' );
const htmlreplace = require( 'gulp-html-replace' );
const replace = require( 'gulp-replace' );
const tsproject = require( 'tsproject' );
const webpack = require( 'webpack-stream' );
const webpackConfig = require( './webpack.config' );

//gulp.task( 'webpack', () =>
//{
//    return gulp.src( webpackFiles )
//        .pipe( named() )
//        .pipe( webpackStream( webpackConfig ) )
//        .pipe( gulp.dest( 'build/' ) );
//} );

gulp.task( 'webpack', function ()
{
    return gulp.src( 'src/app/app.ts' )
        .pipe( webpack( webpackConfig ) )
        .pipe( gulp.dest( 'dist/' ) );
} );

gulp.task( 'ts', function ()
{
    return tsproject.src( './app/src/tsconfig.json', { logLevel: 0 } )
        .pipe( gulp.dest( './' ) );
} );

gulp.task( 'js', gulp.series( 'ts' ), function ( callback )
{
    gulp.src( 'src/entry.js' )
        .pipe( webpack( {
            // Any configuration options...
        } ) )
        .pipe( gulp.dest( 'dist/' ) );

    callback();
} );

gulp.task( 'ts-commonjs', function ()
{
    return tsproject.src('./app/src/tsconfig.json',
        {
            logLevel: 0,
            compilerOptions: {
                "module": "commonjs"
            }
        })
        .pipe( gulp.dest( './commonjs' ) );
});

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
gulp.task( 'clean', function ()
{
    return del( './dist' );
} );

gulp.task( 'build', gulp.series( 'clean', 'html', 'js', 'css' ), function( callback ) {
    console.log( '\nPlaced optimized files in ' + chalk.magenta( 'dist/\n' ) );
    callback();
} );