/*
    Copyright (c) 2015 Todd Thomson, Achilles Sofware. All rights reserved.
    Licensed under the MIT License (MIT) - http://www.opensource.org/licenses/mit-license.php
    You may not use this software except in compliance with the above mentioned MIT License.  
*/

/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import React = require( 'react' );

import { TodoItem } from "../models/todoitem";
import { TodoTextInput } from "./todotextinput";
import { todoActions } from "../actions/todoactions";

interface TodoProps {
    todoItem: TodoItem;
}

interface TodoState {
    isEditing: boolean;
}

export class Todo extends React.Component<TodoProps, TodoState> {
    constructor( props, context ) {
        super( props, context );

        this.state = {
            isEditing: false
        };
    }

    render() {
        const { todoItem } = this.props;

        let element;

        if ( this.state.isEditing ) {
            element = (
                <TodoTextInput
                    className="edit"
                    value={todoItem.text}
                    onSave={ this._onSave }/>
            );
        } else {
            element = (
                <div className="view">
                    <input className="toggle"
                        type="checkbox"
                        checked={ todoItem.complete }
                        onChange={ this._onToggleComplete } />
                        <label onDoubleClick={ this._onDoubleClick}>
                            {todoItem.text}
                        </label>
                        <button
                            className="destroy"
                            onClick={ this._onDestroyClick} />
                    </div>
            );
        }

        return (
            <li
                className={ classNames( {
                    completed: todoItem.complete,
                    editing: this.state.isEditing
                }) }>
                {element}
            </li>
        );
    }

    private _onToggleComplete = () => {
        todoActions.toggleComplete( this.props.todoItem );
    }

    private _onDoubleClick = () => {
        this.setState( { isEditing: true } );
    }

    /**
     * Event handler called within TodoTextInput.
     * Defining this here allows TodoTextInput to be used in multiple places
     * in different ways.
     * @param  {string} text
     */
    private _onSave = ( text ) => {
        if ( text.length === 0 ) {
            todoActions.destroy( this.props.todoItem.id );
        } else {
            todoActions.updateText( this.props.todoItem.id, text );
        }

        this.setState( { isEditing: false });
    }

    private _onDestroyClick = () => {
        todoActions.destroy( this.props.todoItem.id );
    }
}