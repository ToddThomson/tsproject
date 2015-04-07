interface IEventEmitter<T> {
    on( handler: { ( data?: T ): void });
    off( handler: { ( data?: T ): void });
}

class EventEmitter<T> implements IEventEmitter<T> {
    private handlers: { ( data?: T ): void; }[] = [];

    public on( handler: { ( data?: T ): void }) {
        this.handlers.push( handler );
    }

    public off( handler: { ( data?: T ): void }) {
        this.handlers = this.handlers.filter( h => h !== handler );
    }

    public trigger( data?: T ) {
        if ( this.handlers ) {
            this.handlers.slice( 0 ).forEach( h => h( data ) );
        }
    }
} 