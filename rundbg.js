var gulp = require('gulp');
var tsproject = require('./src/tsproject.js');
//var tsproject = require('./tsproject.min.js');

tsproject.src( './tests/issues/no104/src/tsconfig.test.json', {
    logLevel: 0,
    compilerOptions: {
        watch: false,
        listFiles: false
    }
});
