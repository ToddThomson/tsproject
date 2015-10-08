/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import React = require( 'react' );

interface TodoTextInputProps {
    className?: string,
    id?: string,
    value?: string,
    placeholder?: string,
    onSave: Function,
}

export class TodoTextInput extends React.Component<TodoTextInputProps, any> {

    static ENTER_KEY_CODE: number = 13;
    static ENTER_ESC_CODE: number = 27;

    constructor( props, context ) {
        super( props, context );
        this.state = {
            value: this.props.value || ''
        };
    }

    /**
     * @return {object}
     */
    render() {
        return (
            <input
                type="text"
                className={this.props.className}
                id={this.props.id}
                placeholder={this.props.placeholder}
                value={this.state.value}
                autoFocus={true}
                onBlur={this._save}
                onChange={this._onChange}
                onKeyDown={this._onKeyDown} />
        );
    }

    // Event handlers..
    
    /**
     * Invokes the callback passed in as onSave, allowing this component to be
     * used in different ways.
     */
    private _save = () => {
        this.props.onSave( this.state.value );
        this.setState( {
            value: ''
        });
    }

    /**
     * @param {object} event
     */
    private _onChange = ( event ) => {
        this.setState( {
            value: event.target.value
        });
    }

    /**
     * @param  {object} event
     */
    private _onKeyDown = ( event ) => {
        if ( event.keyCode === 13 ) {
            this._save();
        }
        else if ( event.keyCode === 27 ) {
            this.props.onSave( this.props.value );
            this.setState( {
                value: this.props.value
            });
        }
    }
}