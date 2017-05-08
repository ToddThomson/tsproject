var gulp = require('gulp');
var tsproject = require('./src/tsproject.js');
//var tsproject = require('./tsproject.min.js');

tsproject.src( './tests/minifier/tsconfig.json', {
    logLevel: 3,
    compilerOptions: {
        watch: false,
        listFiles: false
    }
});
