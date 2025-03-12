// A generic type that can be used with any type
export class Box<T> {
    contents: T;

    constructor(contents: T) {
        this.contents = contents;
    }

    getContents(): T {
        return this.contents;
    }
}

// Example usage with different types
const numberBox = new Box<number>(123);
console.log(numberBox.getContents()); // Output: 123

const stringBox = new Box<string>('Hello, world!');
console.log(stringBox.getContents()); // Output: Hello, world!