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

import { Todo } from './todo';
import { Footer } from './Footer';

import { TodoItem } from '../models/TodoItem';
import { todoActions } from '../actions/TodoActions';

interface MainSectionProps {
    allTodos: { [key: string]: TodoItem },
    areAllComplete: boolean
}

export class MainSection extends React.Component<MainSectionProps, any> {
    constructor( props, context ) {
        super( props, context );
    }

    renderToggleAll( completedCount ) {
        const { allTodos } = this.props;
        var todoCount = Object.keys( allTodos ).length;

        if ( todoCount > 0 ) {
            return (
                <input className="toggle-all"
                    type="checkbox"
                    checked={completedCount === todoCount}
                    onChange={ this._onToggleCompleteAll } />
            );
        }
    }

    renderFooter( completedCount ) {
        const { allTodos } = this.props;
        var todoCount = Object.keys( allTodos ).length;

        if ( todoCount ) {
            return (
                <Footer
                    allTodos={allTodos} />
            );
        }
    }

    render() {
        const { allTodos } = this.props;

        var completedCount = 0;

        for ( var key in allTodos ) {
            if ( allTodos[key].complete ) {
                completedCount++;
            }
        }

        var todos = [];

        for ( var key in allTodos ) {
            todos.push(<Todo todoItem={allTodos[key]} />);
        }

        var todoCount = Object.keys( allTodos ).length;

        return (
            <section className="main">
                {this.renderToggleAll( completedCount ) }
                <ul className="todo-list">
                    {todos}
                </ul>
                {this.renderFooter( completedCount ) }
            </section>
        );
    }

    /**
     * Event handler to mark all TODOs as complete
     */
    _onToggleCompleteAll = () => {
        todoActions.toggleCompleteAll();
    }
}