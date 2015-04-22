import { foo } from "./foo";
import { Greeter } from "./Greeter";

export class ProjectA {
    constructor() { }
    
    public pA: string = "ProjectA";
}

export class ProjectB {
    public pB: number = 47;
}

import { bar } from "./bar";

export var test = new foo().valuea;
export var who2: foo = new foo();
