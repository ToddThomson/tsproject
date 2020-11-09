/*
 * Services that persists and retrieves TODOs from localStorage.
*/

import { TodoItem } from "../models/TodoItem";
import { ITodoStorage } from "../interfaces/ITodoStorage";

interface Map<T> {
    [index: string]: T;
}
export class TodoStorage implements ITodoStorage {

    STORAGE_ID = 'todos-angularjs-typescript';

    get(): Map<TodoItem> {
        return JSON.parse( localStorage.getItem( this.STORAGE_ID ) || '[]' );
    }

    put( todos: Map<TodoItem> ) {
        localStorage.setItem( this.STORAGE_ID, JSON.stringify( todos ) );
    }
}
