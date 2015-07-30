import { bar } from "./bar";
import { foo } from "./foo";
import { baz } from "./baz";
import { Greeter } from "./Greeter";

export class ProjectA {
    constructor() { }
    
    public pA: string = "ProjectA";
}

export class ProjectB {
    public pB: number = 47;
}

export var test = new foo().valuea;
export var who2: foo = new foo();
