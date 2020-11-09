# TsProjectTodoMVC App
This sample uses TsProject 4.0 to build an Angular/Require TodoMVC app.

##TodoMVC
The source code for this sample was derived from the Angular-Require TodoMVC sample at (http://todomvc.com)
MIT © Addy Osmani, Sindre Sorhus, Pascal Hartig, Stephen Sawchuk. 


##Build Instructions
To build the TodoMVC app you must have npm and bower installed on your computer. 

1. Download the TsProject zip file from the root directory of the TsProject github repository.

2. Unzip the TsProject archive to a directory on your computer.

3. Navigate to the TsProjectTodoMVC subdirectory of the directory specified in step 2. This subdirectory contains the package.json and bower.json files.

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





