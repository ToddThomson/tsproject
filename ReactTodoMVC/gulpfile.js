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
        eventemitter: "bower_modules/eventemitter/src/eventemitter",
        classnames: "bower_modules/classnames/index",
        "object-assign": "libs/object-assign/index",
        react: 'bower_modules/react/react',
        flux: 'bower_modules/flux/dist/flux'
    },
    shim: {
        "react": { exports: "react" },
        "object-assign": { exports: "object-assign" },
        "eventemitter": { exports: "EventEmitter" }
    },
    include: ['requireLib'],
    insertRequire: ['src/bundles/app']
};

gulp.task( 'ts-common', function() {
    return tsproject.src('./app/src/tsconfig.json',
        {
            logLevel: 0,
            compilerOptions: {
                "module": "commonjs"
            }
        })
        .pipe( gulp.dest( './commonjs' ) );
});

gulp.task('ts', function () {
    return tsproject.src('./app/src/tsconfig.json', { logLevel: 0 })
        .pipe(gulp.dest('./'));
});

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