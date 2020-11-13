/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import React = require( "react" );

import { todoActions } from '../actions/todoactions';
import { TodoTextInput } from './TodoTextInput';

export class Header extends React.Component<any, any> {

    render() {
        return (
            <header className="header">
                <h1>todos</h1>
                <TodoTextInput
                    className="new-todo"
                    onSave={this._onSave}
                    placeholder="What needs to be done?" />
            </header>
        );
    }

    /**
     * Event handler called within TodoTextInput.
     * Defining this here allows TodoTextInput to be used in multiple places
     * in different ways.
     * @param {string} text
    */

    private _onSave = ( text: string ) => {
        if ( text.trim() ) {
            todoActions.create( text );
        }
    }
}