/**
  * The main controller for the app. The controller:
  * - retrieves and persists the model via the todoStorage service
  * - exposes the model to the template and provides event handlers
*/
import { TodoItem } from "../models/TodoItem";
import { ITodoScope } from "./../interfaces/ITodoScope";
import { ITodoStorage } from "./../interfaces/ITodoStorage";
export declare class TodoCtrl {
    private $scope;
    private $location;
    private todoStorage;
    private filterFilter;
    private todos;
    static $inject: string[];
    constructor($scope: ITodoScope, $location: ng.ILocationService, todoStorage: ITodoStorage, filterFilter: any);
    onPath(path: string): void;
    onTodos(): void;
    addTodo(): void;
    editTodo(todoItem: TodoItem): void;
    doneEditing(todoItem: TodoItem): void;
    removeTodo(todoItem: TodoItem): void;
    clearDoneTodos(): void;
    markAll(completed: boolean): void;
}
