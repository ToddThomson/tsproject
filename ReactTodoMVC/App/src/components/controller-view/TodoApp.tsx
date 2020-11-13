/// <reference path="../../stores/todostore.ts" />
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * This component operates as a "Controller-View".  It listens for changes in
 * the TodoStore and passes the new data to its children.
 */

import React = require( "react" );

import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { MainSection } from '../../components/MainSection';
import { todoStore } from '../../stores/TodoStore';

export class TodoApp extends React.Component<any, any> {

    constructor( props, context ) {
        super( props, context );

        this.state = {
            allTodos: todoStore.getAll(),
            areAllComplete: todoStore.areAllComplete()
        };
    }

    public componentDidMount: () => void = (): void => {
        todoStore.addChangeListener( this._onChange );
    }

    public componentWillUnmount: () => void = (): void => {
        todoStore.removeChangeListener( this._onChange );
    }

    /**
     * @return {object}
     */
    render() {
        return (
            <section className="todoapp">
                <Header />
                <MainSection
                    allTodos={this.state.allTodos}
                    areAllComplete={this.state.areAllComplete} />
            </section>
        );
    }

    /**
     * Event handler for 'change' events coming from the TodoStore
     */
    private _onChange = () => {
        this.setState( {
            allTodos: todoStore.getAll(),
            areAllComplete: todoStore.areAllComplete()
        } );
    }
}
