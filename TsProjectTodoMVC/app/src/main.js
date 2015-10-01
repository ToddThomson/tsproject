// require.js looks for the following global when initializing
require.config({
    baseUrl: ".",
    paths: {
        "angular": "bower_modules/angular/angular"
    },
    shim: {
        "angular": { exports: "angular" }
    },
    deps: ['src/bundles/app']
});

//require(['src/bundles/app'],
//  function () {
//      angular.bootstrap(document, ['todomvc']);
//  }
//);