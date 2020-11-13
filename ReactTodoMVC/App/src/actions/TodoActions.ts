/*
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * TodoActions
 */

import { TodoItem } from '../models/TodoItem';

import { todoDispatcher } from '../dispatcher/TodoDispatcher';
import { ActionType }  from '../constants/ActionTypes';

class TodoActions {

    /**
     * @param  {string} text
     */
    create( text: string ) {
        todoDispatcher.dispatch( {
            actionType: ActionType.TODO_CREATE,
            text: text
        });
    }

    /**
     * @param  {string} id The ID of the ToDo item
     * @param  {string} text
     */
    updateText( id: string, text: string ) {
        todoDispatcher.dispatch( {
            actionType: ActionType.TODO_UPDATE_TEXT,
            id: id,
            text: text
        });
    }

    /**
     * Toggle whether a single ToDo is complete
     * @param  {object} todo
     */
    toggleComplete( todoItem: TodoItem ) {
        var id = todoItem.id;
        var actionType = todoItem.complete ?
            ActionType.TODO_UNDO_COMPLETE :
            ActionType.TODO_COMPLETE;

        todoDispatcher.dispatch( {
            actionType: actionType,
            id: id
        });
    }

    /**
     * Mark all ToDos as complete
     */
    toggleCompleteAll() {
        todoDispatcher.dispatch( {
            actionType: ActionType.TODO_TOGGLE_COMPLETE_ALL
        });
    }

    /**
     * @param  {string} id
     */
    destroy( id: string ) {
        todoDispatcher.dispatch( {
            actionType: ActionType.TODO_DESTROY,
            id: id
        });
    }

    /**
     * Delete all the completed ToDos
     */
    destroyCompleted() {
        todoDispatcher.dispatch( {
            actionType: ActionType.TODO_DESTROY_COMPLETED
        });
    }
}

export var todoActions = new TodoActions();