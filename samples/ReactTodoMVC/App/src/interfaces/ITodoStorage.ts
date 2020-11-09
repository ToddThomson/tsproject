import { TodoItem } from "../models/TodoItem";

interface Map<T> {
    [index: string]: T;
}

export interface ITodoStorage {
    get(): Map<TodoItem>;
    put( todos: Map<TodoItem> );
}
