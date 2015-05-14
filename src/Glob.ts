/* Portions of this code are used under MIT license from:
 * Copyright( c ) 2015 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

import _ = require( 'lodash' );
import fileGlob = require( 'glob' );
import fs = require( 'fs' );
import path = require( 'path' );

export class Glob {
    public expand( patterns: string[] ): string[] {

        if ( patterns.length === 0 ) {
            return [];
        }

        var matches = this.processPatterns( patterns, function ( pattern: string ) {
            return fileGlob.sync( pattern );
        });

        return matches;
    }

    private processPatterns( patterns: string[], fn: any ): string[] {
        var result: string[] = [];

        _.flatten( patterns ).forEach( function ( pattern: any ) {
            var exclusion: any;
            var matches: any;

            exclusion = _.isString( pattern ) && pattern.indexOf( "!" ) === 0;

            if ( exclusion ) {
                pattern = pattern.slice( 1 );
            }

            matches = fn( pattern );

            if ( exclusion ) {
                return result = _.difference( result, matches );
            } else {
                return result = _.union( result, matches );
            }
        });

        return result;
    }
}