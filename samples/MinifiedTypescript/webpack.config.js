'use strict';

const path = require( 'path' );

module.exports = {
    entry: './src/app/app.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts' ]
    },
    optimization: {
        // We no not want to minimize our code.
        minimize: false
    },
    output: {
        filename: 'main.js',
        path: path.resolve( __dirname, 'dist' )
    }
};

// TJT: Old requirejs config to be replaced...

// Require Optimizer Config
//var requireJsOptimizerConfig = {
//    out: 'scripts.js',
//    baseUrl: './src',
//    name: 'app/bundles/app.min',
//    paths: {
//        requireLib: 'bower_modules/requirejs/require'
//    },
//    include: ['requireLib'],
//    insertRequire: ['app/bundles/app.min']
//};
