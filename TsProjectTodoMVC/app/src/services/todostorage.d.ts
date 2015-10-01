import { TodoItem } from "../models/TodoItem";
import { ITodoStorage } from "../interfaces/ITodoStorage";
export declare class TodoStorage implements ITodoStorage {
    STORAGE_ID: string;
    get(): TodoItem[];
    put(todos: TodoItem[]): void;
}
