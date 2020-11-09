// require.js looks for the following global when initializing
require.config({
    baseUrl: ".",
    paths: {
        "eventemitter": "bower_modules/eventemitter/src/eventemitter",
        "classnames": "bower_modules/classnames/index",
        "object-assign": "libs/object-assign/index",
        "react": "bower_modules/react/react",
        "flux": "bower_modules/flux/dist/flux"
    },
    shim: {
        "react": { exports: "React" },
        "object-assign": { exports: "object-assign" },
        "eventemitter": { exports: "EventEmitter" }
    },
    deps: ['src/bundles/app']
});