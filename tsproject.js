var tsproject = require('./src/tsproject');

tsproject.src('./src/tsconfig.json', {
    logLevel: 0,
    compilerOptions: {
        listFiles: true
    }       
});
