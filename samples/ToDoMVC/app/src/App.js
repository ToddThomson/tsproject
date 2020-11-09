"use strict";
/**
 * The main TodoMVC app module.
 *
 * @type {angular.Module}
 */
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
var TodoCtrl_1 = require("./controllers/TodoCtrl");
var todoBlur_1 = require("./directives/todoBlur");
var todoFocus_1 = require("./directives/todoFocus");
var TodoStorage_1 = require("./services/TodoStorage");
angular.module('todomvc', [])
    .controller('todoCtrl', TodoCtrl_1.TodoCtrl)
    .directive('todoBlur', todoBlur_1.todoBlur)
    .directive('todoFocus', todoFocus_1.todoFocus)
    .service('todoStorage', TodoStorage_1.TodoStorage);
angular.bootstrap(document, ['todomvc']);
//# sourceMappingURL=App.js.map