import { foo } from "./foo";
import { foo2 } from "foo";

import chalk = require( 'chalk' );

export class plugin {
    public plugFoo = new foo();
    public run( context: any ): any {
        return chalk.black( "somestring" );
    }
}