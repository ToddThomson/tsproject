import { Greeter } from "./GreeterModule"

export class Main {
    public Hello() {
        let greeterz = new Greeter();
        console.log( greeterz.SayHello() );
    }
}