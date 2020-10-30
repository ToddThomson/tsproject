var path = require( 'path' );

var sourceRoot = 'src/';
var buildRoot = './built/';
var releaseRoot = './lib/';
var testRoot = './tests/spec/';
var bundleRoot = 'bundle/';

module.exports = {
    root: sourceRoot,
    tests: testRoot + '**/*.js',
    sourceTsConfig: sourceRoot + 'tsconfig.json',
    source: sourceRoot + '**/*.ts',
    output: buildRoot,
    main: buildRoot + sourceRoot + bundleRoot + 'TsProject.js',
    typings: buildRoot + sourceRoot + bundleRoot + 'TsProject.d.ts',
    release: releaseRoot
};
