import flux = require( 'flux' );
﻿export type TodoItem = {
    id?: string;
    text: string;
    complete: boolean;
};
                                                                                                                                                                                                                                                                                                                                                                                                                                                                

export var todoDispatcher = new flux.Dispatcher();
﻿export enum ActionType {
    TODO_CREATE,
    TODO_COMPLETE,
    TODO_DESTROY,
    TODO_DESTROY_COMPLETED,
    TODO_TOGGLE_COMPLETE_ALL,
    TODO_UNDO_COMPLETE,
    TODO_UPDATE_TEXT
}
import React = require( "react" );
import classNames = require( "classnames" );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

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
import EventEmitter = require( 'eventemitter' );
import assign = require( 'object-assign' );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

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

                                                                                                                                                                                                                                                                                                                                                                                                                           

React.render(
    <TodoApp />,
     document.getElementById( 'todoapp' )
);
