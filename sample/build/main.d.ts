export declare class foo {
    valuea: string;
}
export declare class bar {
    foo2: foo;
    barvalue3: number;
}
export declare class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;
    private bar;
    constructor(element: HTMLElement);
    start(): void;
    stop(): void;
}
