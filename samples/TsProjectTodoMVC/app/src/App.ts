/**
 * The main TodoMVC app module.
 *
 * @type {angular.Module}
 */

import angular = require( "angular" );

import { TodoCtrl } from "./controllers/TodoCtrl";
import { todoBlur } from "./directives/todoBlur";
import { todoFocus } from "./directives/todoFocus";
import { TodoStorage } from "./services/TodoStorage";

angular.module( 'todomvc', [] )
    .controller( 'todoCtrl', TodoCtrl )
    .directive( 'todoBlur', todoBlur )
    .directive( 'todoFocus', todoFocus )
    .service( 'todoStorage', TodoStorage );

angular.bootstrap( document, ['todomvc'] );			
