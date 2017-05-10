var path = require( 'path' );

var appRoot = 'src/';
var testRoot = 'tests/'

module.exports = {
    root: appRoot,
    testDir: testRoot,
    sourceTsConfig: appRoot + 'tsconfig.json',
    source: appRoot + '**/*.ts',
    output: 'dist/'
};
