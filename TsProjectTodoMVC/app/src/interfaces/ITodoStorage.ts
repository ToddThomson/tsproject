import { TodoItem } from "../models/TodoItem";

export interface ITodoStorage {
    get(): TodoItem[];
    put( todos: TodoItem[] );
}
