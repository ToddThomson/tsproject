# ReactTodoMVC App
This sample uses TsProject 2.0 to build TodoMVC using React, Flux, Require using Typescript 2.0

##Description
This sample shows how to bundle a React based Typescript app to a single file.

##TodoMVC
The source code for this sample was derived from the Facebook TodoMVC sample at (https://github.com/facebook/flux/tree/master/examples/flux-todomvc/)

##Build Instructions
To build the TodoMVC app you must have npm and bower installed on your computer. 

1. Download the TsProject zip file from the root directory of the TsProject github repository.

2. Unzip the TsProject archive to a directory on your computer.

3. Navigate to the ReactTodoMVC subdirectory of the directory specified in step 2. This subdirectory contains the package.json and bower.json files.

4. Execute the npm install command to install the development tool dependencies.
```
npm install
```

5. Install the client side components with bower
```
bower install
```

6. Run the gulp build script to build the app.
```
gulp
```

Run the TodoMVC app by browsing to <server>/app/index.html

Run the optimized (single script, single html, single css) build of the TodoMVC app by browsing to <server>/dist/app/index.html
