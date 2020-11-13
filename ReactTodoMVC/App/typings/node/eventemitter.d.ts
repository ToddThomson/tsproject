﻿declare module "eventemitter" {
    class EventEmitter {
        addListener( event: string, listener: Function ): EventEmitter;
        on( event: string, listener: Function ): EventEmitter;
        once( event: string, listener: Function ): EventEmitter;
        removeListener( event: string, listener: Function ): EventEmitter;
        removeAllListeners( event?: string ): EventEmitter;
        setMaxListeners( n: number ): void;
        listeners( event: string ): Function[];
        emit( event: string, ...args: any[] ): boolean;
    }

    export = EventEmitter;
}