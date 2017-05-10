/* Portions of this code are used under MIT license from:
 * Copyright( c ) 2015 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

import * as _ from "lodash";
import * as fileGlob from "glob";
import * as fs from "fs";
import * as path from "path";

export class Glob {

    public hasPattern( pattern: string ) {
        var g = new fileGlob.Glob( pattern );
        var minimatchSet = g.minimatch.set;

        if ( minimatchSet.length > 1 )
            return true;

        for ( var j = 0; j < minimatchSet[0].length; j++ ) {
            if ( typeof minimatchSet[0][j] !== 'string' )
                return true;
        }

        return false;
    }

    public expand( patterns: string[], root: string ): string[]{

        if ( patterns.length === 0 ) {
            return [];
        }

        var matches = this.processPatterns( patterns, function ( pattern: string ) {
            return fileGlob.sync( pattern, { root: root } );
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