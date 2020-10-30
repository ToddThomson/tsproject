export namespace Debug {
    export function assert( condition: boolean, message?: string ) {
        if ( !condition ) {
            message = message || "Assertion failed";

            if ( typeof Error !== "undefined" ) {
                throw new Error( message );
            }

            throw message;
        }
    }
}