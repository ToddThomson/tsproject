import { TestClass } from "./TestClass";

class consumerOfTest {
    public testClass: TestClass;

    constuctor() {
        this.testClass = new TestClass();
    }

    public anotherMethod(): string {
        return this.testClass.someMethod();
    }
}
