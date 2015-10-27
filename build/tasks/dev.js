var gulp = require("gulp"); 
var tsConfig = require("tsconfig-glob");  

gulp.task("tsconfig-glob", function () {  
    return tsConfig({
        configPath: "src",
        cwd: process.cwd(),
        indent: 2
    });
});