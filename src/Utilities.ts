import ts = require( "typescript" );

export function forEach<T, U>( array: T[], callback: ( element: T, index: number ) => U ): U {
    if ( array ) {
        for ( let i = 0, len = array.length; i < len; i++ ) {
            let result = callback( array[i], i );
            if ( result ) {
                return result;
            }
        }
    }
    return undefined;
}

let hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasProperty<T>( map: ts.Map<T>, key: string ): boolean {
    return hasOwnProperty.call( map, key );
}

export function clone<T>( object: T ): T {
    let result: any = {};
    for ( let id in object ) {
        result[id] = ( <any>object )[id];
    }
    return <T>result;
}

export function map<T, U>( array: T[], f: ( x: T ) => U ): U[] {
    let result: U[];
    if ( array ) {
        result = [];
        for ( let v of array ) {
            result.push( f( v ) );
        }
    }

    return result;
}

export function extend<T1, T2>( first: ts.Map<T1>, second: ts.Map<T2> ): ts.Map<T1 & T2> {
    let result: ts.Map<T1 & T2> = {};
    for ( let id in first ) {
        ( result as any )[id] = first[id];
    }
    for ( let id in second ) {
        if ( !hasProperty( result, id ) ) {
            ( result as any )[id] = second[id];
        }
    }
    return result;
}
