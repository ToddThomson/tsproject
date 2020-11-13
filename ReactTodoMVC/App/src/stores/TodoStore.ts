/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * TodoStore
 */

import { todoDispatcher } from '../dispatcher/TodoDispatcher';
import { ActionType } from '../constants/ActionTypes';
import { TodoItem } from '../models/todoitem';

import EventEmitter = require( 'eventemitter' );
import assign = require( 'object-assign' );

class TodoStore extends EventEmitter {
    constructor() {
        super();
    }

    CHANGE_EVENT: string = 'change';

    _todos: { [key: string]: TodoItem } = {};
    
    /**
     * Create a TODO item.
     * @param  {string} text The content of the TODO
     */
    create( text: string ) {
        // Hand waving here -- not showing how this interacts with XHR or persistent
        // server-side storage.
        // Using the current timestamp + random number in place of a real id.
        var id = ( +new Date() + Math.floor( Math.random() * 999999 ) ).toString( 36 );
        this._todos[id] = {
            id: id,
            complete: false,
            text: text
        };
    }

    /**
     * Update a TODO item.
     * @param  {string} id
     * @param {object} updates An object literal containing only the data to be
     *     updated.
     */
    update( id, updates ) {
        this._todos[id] = assign( {}, this._todos[id], updates );
    }

    /**
     * Update all of the TODO items with the same object.
     * @param  {object} updates An object literal containing only the data to be
     *     updated.
     */
    updateAll( updates ) {
        for ( var id in this._todos ) {
            this.update( id, updates );
        }
    }

    /**
     * Delete a TODO item.
     * @param  {string} id
     */
    destroy( id ) {
        delete this._todos[id];
    }

    /**
     * Delete all the completed TODO items.
     */
    destroyCompleted() {
        for ( var id in this._todos ) {
            if ( this._todos[id].complete ) {
                this.destroy( id );
            }
        }
    }

    /**
     * Tests whether all the remaining TODO items are marked as completed.
     * @return {boolean}
     */
    areAllComplete() : boolean {
        for ( var id in this._todos ) {
            if ( !this._todos[id].complete ) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get the entire collection of TODOs.
     * @return {object}
     */
    getAll() {
        return this._todos;
    }

    emitChange() {
        this.emit( this.CHANGE_EVENT );
    }

    /**
     * @param {function} callback
     */
    addChangeListener( callback ) {
        this.on( this.CHANGE_EVENT, callback );
    }

    /**
     * @param {function} callback
     */
    removeChangeListener( callback ) {
        this.removeListener( this.CHANGE_EVENT, callback );
    }
}

export var todoStore = new TodoStore();

// Register callback to handle all updates
todoDispatcher.register( function ( action: any ) {
    var text;

    switch ( action.actionType ) {

        case ActionType.TODO_CREATE:
            text = action.text.trim();

            if ( text !== '' ) {
                todoStore.create( text );
                todoStore.emitChange();
            }

            break;

        case ActionType.TODO_TOGGLE_COMPLETE_ALL:
            if ( todoStore.areAllComplete() ) {
                todoStore.updateAll( { complete: false });
            } else {
                todoStore.updateAll( { complete: true });
            }

            todoStore.emitChange();
            break;

        case ActionType.TODO_UNDO_COMPLETE:
            todoStore.update( action.id, { complete: false });
            todoStore.emitChange();
            break;

        case ActionType.TODO_COMPLETE:
            todoStore.update( action.id, { complete: true });
            todoStore.emitChange();
            break;

        case ActionType.TODO_UPDATE_TEXT:
            text = action.text.trim();
            if ( text !== '' ) {
                todoStore.update( action.id, { text: text });
                todoStore.emitChange();
            }
            break;

        case ActionType.TODO_DESTROY:
            todoStore.destroy( action.id );
            todoStore.emitChange();
            break;

        case ActionType.TODO_DESTROY_COMPLETED:
            todoStore.destroyCompleted();
            todoStore.emitChange();
            break;

        default:
        // no op
    }
});