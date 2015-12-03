var path = require( 'path' );

var appRoot = 'src/';

module.exports = {
  root: appRoot,
  sourceTsConfig: appRoot + 'tsconfig.json',
  source: appRoot + '**/*.ts',
  output: 'dist/'
};
