import { TodoItem } from "../models/TodoItem";
import { TodoCtrl } from "../controllers/TodoCtrl";
import { IScope, ILocationService } from "angular";

export interface ITodoScope extends IScope {
    todos: TodoItem[];
    newTodo: string;
    editedTodo: TodoItem;
    remainingCount: number;
    doneCount: number;
    allChecked: boolean;
    statusFilter: { completed: boolean; };
    location: ILocationService;
    vm: TodoCtrl;
}