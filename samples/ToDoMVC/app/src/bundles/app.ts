import * as ng from "angular";
import { IScope, ILocationService } from "angular";
import * as JQuery from "jquery";
import angular = require("angular");
export class TodoItem {
  constructor(public title: string, public completed: boolean) {}
}

export interface ITodoScope extends IScope {
  todos: TodoItem[];
  newTodo: string;
  editedTodo: TodoItem;
  remainingCount: number;
  doneCount: number;
  allChecked: boolean;
  statusFilter: { completed: boolean };
  location: ILocationService;
  vm: TodoCtrl;
}

export interface ITodoStorage {
  get(): TodoItem[];
  put(todos: TodoItem[]);
}

export class TodoCtrl {
  private todos: TodoItem[];

  // $inject annotation.
  // It provides $injector with information about dependencies to be injected into constructor
  // it is better to have it close to the constructor, because the parameters must match in count and type.
  // See http://docs.angularjs.org/guide/di
  public static $inject = [
    "$scope",
    "$location",
    "todoStorage",
    "filterFilter",
  ];

  // dependencies are injected via AngularJS $injector
  // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
  constructor(
    private $scope: ITodoScope,
    private $location: ng.ILocationService,
    private todoStorage: ITodoStorage,
    private filterFilter
  ) {
    this.todos = $scope.todos = todoStorage.get();

    $scope.newTodo = "";
    $scope.editedTodo = null;

    // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
    // for its methods to be accessible from view / HTML
    $scope.vm = this;

    // watching for events/changes in scope, which are caused by view/user input
    // if you subscribe to scope or event with lifetime longer than this controller, make sure you unsubscribe.
    $scope.$watch("todos", () => this.onTodos(), true);
    $scope.$watch("location.path()", (path) => this.onPath(path as any));

    if ($location.path() === "") $location.path("/");
    $scope.location = $location;
  }

  onPath(path: string) {
    this.$scope.statusFilter =
      path === "/active"
        ? { completed: false }
        : path === "/completed"
        ? { completed: true }
        : undefined;
  }

  onTodos() {
    this.$scope.remainingCount = this.filterFilter(this.todos, {
      completed: false,
    }).length;
    this.$scope.doneCount = this.todos.length - this.$scope.remainingCount;
    this.$scope.allChecked = !this.$scope.remainingCount;
    this.todoStorage.put(this.todos);
  }

  addTodo() {
    var newTodo: string = this.$scope.newTodo.trim();
    if (!newTodo.length) {
      return;
    }

    this.todos.push(new TodoItem(newTodo, false));
    this.$scope.newTodo = "";
  }

  editTodo(todoItem: TodoItem) {
    this.$scope.editedTodo = todoItem;
  }

  doneEditing(todoItem: TodoItem) {
    this.$scope.editedTodo = null;
    todoItem.title = todoItem.title.trim();
    if (!todoItem.title) {
      this.removeTodo(todoItem);
    }
  }

  removeTodo(todoItem: TodoItem) {
    this.todos.splice(this.todos.indexOf(todoItem), 1);
  }

  clearDoneTodos() {
    this.$scope.todos = this.todos = this.todos.filter(
      (todoItem) => !todoItem.completed
    );
  }

  markAll(completed: boolean) {
    this.todos.forEach((todoItem) => {
      todoItem.completed = completed;
    });
  }
}

/*
    Directive that executes an expression when the element it is applied to loses focus.
*/
export function todoBlur(): ng.IDirective {
  return {
    link: ($scope: ng.IScope, element: JQuery, attributes: any) => {
      element.bind("blur", () => {
        $scope.$apply(attributes.todoBlur);
      });
      $scope.$on("$destroy", () => {
        element.unbind("blur");
      });
    },
  };
}
/**
 * Directive that places focus on the element it is applied to when the expression it binds to evaluates to true.
 */
export function todoFocus($timeout: ng.ITimeoutService): ng.IDirective {
  return {
    link: ($scope: ng.IScope, element: JQuery, attributes: any) => {
      $scope.$watch(attributes.todoFocus, (newval) => {
        if (newval) {
          $timeout(() => element[0].focus(), 0, false);
        }
      });
    },
  };
}

todoFocus.$inject = ["$timeout"];

export class TodoStorage implements ITodoStorage {
  STORAGE_ID = "todos-angularjs-typescript";

  get(): TodoItem[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_ID) || "[]");
  }

  put(todos: TodoItem[]) {
    localStorage.setItem(this.STORAGE_ID, JSON.stringify(todos));
  }
}

angular
  .module("todomvc", [])
  .controller("todoCtrl", TodoCtrl)
  .directive("todoBlur", todoBlur)
  .directive("todoFocus", todoFocus)
  .service("todoStorage", TodoStorage);

angular.bootstrap(document, ["todomvc"]);
