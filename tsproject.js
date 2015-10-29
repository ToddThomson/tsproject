var tsproject = require('./dist/tsproject2');

tsproject.src('./issues/fortyfive/src/tsconfig.json', /*'./src/tsconfig.json' */ {
    logLevel: 0,
    compilerOptions: {
        listFiles: true
    }
});
