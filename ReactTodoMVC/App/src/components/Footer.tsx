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

import React = require( "react" );
import classNames = require( "classnames" );

import { TodoItem } from '../models/todoitem';
import { todoActions } from '../actions/todoactions';

interface Map<T> {
    [index: string]: T;
}

interface FooterProps {
    allTodos: Map<TodoItem>,
}

export class Footer extends React.Component<FooterProps, any> {

    renderTodoCount() {
        const { allTodos } = this.props;
        var activeCount = Object.keys( allTodos ).length;
        const itemWord = activeCount === 1 ? 'item' : 'items';

        return (
            <span className="todo-count">
                <strong>{activeCount || 'No'}</strong> {itemWord} left
            </span>
        );
    }

    renderClearButton() {
        const { allTodos } = this.props;

        var completedCount = 0;

        for ( var key in allTodos ) {
            if ( allTodos[key].complete ) {
                completedCount++;
            }
        }

        if ( completedCount > 0 ) {
            return (
                <button className="clear-completed"
                    onClick={ this._onClearCompletedClick } >
                    Clear completed
                    </button>
            );
        }
    }

    render() {
        return (
            <footer className="footer">
                {this.renderTodoCount() }
                {this.renderClearButton() }
            </footer>
        );
    }

    /**
     * Event handler to delete all completed TODOs
     */
    _onClearCompletedClick = () => {
        todoActions.destroyCompleted();
    }
}