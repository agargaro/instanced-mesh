// A generic type that can be used with any type
export class Box {
    constructor(contents) {
        this.contents = contents;
    }
    getContents() {
        return this.contents;
    }
}
// Example usage with different types
const numberBox = new Box(123);
console.log(numberBox.getContents()); // Output: 123
const stringBox = new Box('Hello, world!');
console.log(stringBox.getContents()); // Output: Hello, world!
