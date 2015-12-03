var tsproject = require('./src/tsproject.js');

tsproject.src( './src/tsconfig.json', {
    logLevel: 0,
    compilerOptions: {
        watch: true,
        listFiles: false
    }
});
