var gulp = require('gulp');
var tsproject = require('./../src/TsProject');
tsproject.src('./Tests/projects/greeter/app/tsconfig.json', {
    logLevel: 3,
    compilerOptions: {
        watch: false,
        listFiles: false
    }
});
//# sourceMappingURL=rundbg.js.map