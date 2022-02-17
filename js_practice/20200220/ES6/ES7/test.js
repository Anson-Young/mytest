/*
var trunkify = require("trunkify");
var fs = require("fs");

var read = thunkify(fs.readFile);
read("package.json")(function(err, str) {
	
	console.log(err);
});

@testable
class MyTestableClass {
	
}

function testable(target) {
	target.isTestable = true
}
//console.log(MyTestableClass.isTestable)

function mixins(...list) {
	return function(target) {
		Object.assign(target.prototype, ...list);
	};
}

const foo = {
	g() {
		console.log("foo");
	}
};

@mixins(foo)
class MyClass {
	
}

new MyClass().g();

function log(target, name, descriptor) {
	let oldValue = descriptor.value;
	console.log(target.add);
	descriptor.value = (...args) => {
		console.log(`Calling ${name} with ${args}`);
		return oldValue.call(null, ...args);
	};
	//return descriptor;
}

class Math {
	
	@log
	add(a, b) {
		return a + b;
	}
}

console.log(new Math().add(4, 5));

function dec(id) {
	console.log("evaluated", id);
	
}
*/

function dec(id) {
	console.log("evaluated", id);
	return (target, name, descriptor) => console.log("executed", id);
}

class Example {
	@dec(1)
	@dec(2)
	method() {}
}

//new Example().method();