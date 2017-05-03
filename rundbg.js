var tsproject = require('./src/tsproject.js');

tsproject.src( './tests/issues/no93/tsconfig.json', {
    logLevel: 4,
    compilerOptions: {
        watch: false,
        listFiles: false
    }
});
