var gulp = require('gulp');
var tsproject = require('./src/tsproject.js');

tsproject.src( './src/app/tsconfig.json', {
    logLevel: 3,
    compilerOptions: {
        watch: false,
        listFiles: false
    }
});
