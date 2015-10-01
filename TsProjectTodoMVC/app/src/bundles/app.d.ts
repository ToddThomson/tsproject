export declare class TodoItem {
    title: string;
    completed: boolean;
    constructor(title: string, completed: boolean);
}
export interface ITodoScope extends ng.IScope {
    todos: TodoItem[];
    newTodo: string;
    editedTodo: TodoItem;
    remainingCount: number;
    doneCount: number;
    allChecked: boolean;
    statusFilter: {
        completed: boolean;
    };
    location: ng.ILocationService;
    vm: TodoCtrl;
}
export interface ITodoStorage {
    get(): TodoItem[];
    put(todos: TodoItem[]): any;
}
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
export declare function todoBlur(): ng.IDirective;
/**
 * Directive that places focus on the element it is applied to when the expression it binds to evaluates to true.
*/
export declare function todoFocus($timeout: ng.ITimeoutService): ng.IDirective;
export declare class TodoStorage implements ITodoStorage {
    STORAGE_ID: string;
    get(): TodoItem[];
    put(todos: TodoItem[]): void;
}
