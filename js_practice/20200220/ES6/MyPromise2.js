"use strict";
const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";
class MyPromise2 {
	constructor(handler) {
		if (typeof handler !== "function") {
			throw new Error("The parameter of constructor must be a function.");
		}
		this._status = PENDING;
		this._value = undefined;
		this.onFulfilledQueue = [];
		this.onRejectedQueue = [];
		
		try {
			handler(this._resolve.bind(this), this._reject.bind(this));
		} catch(e) {
			this._reject(e);
		}
	}
	
	_resolve(value) {
		if (this._status !== PENDING) return;	// only the arrow function's "this" refer to the class which defined the function
		if (value instanceof MyPromise2) {
			return value.then(this._resolve.bind(this), this._reject.bind(this));
		}
		this._value = value;
		this._status = FULFILLED;
		let fn;
		while (fn = this.onFulfilledQueue.shift()) {
			fn(value);
		}
	}
	
	_reject(error) {
		if (this._status !== PENDING) return;
		//	even if reject a promise, execute as a normal value!!
		// if (error instanceof MyPromise2) return error.then(this._resolve, this._reject);
		this._value = error;
		this._status = REJECTED;
		let fn;
		while (fn = this.onRejectedQueue.shift()) {
			fn(error);
		}
	}
	
	then(onFulFilled, onRejected) {
		return new MyPromise2((resolve, reject) => {
			let {_status, _value} = this;
			let onFulFilledFunc = value => {
				if (typeof onFulFilled !== "function") return resolve(value);
				try {
					let ret = onFulFilled(value);
					if (ret instanceof MyPromise2) {
						ret.then(resolve, reject);
					} else {
						resolve(value);
					}
				} catch(e) {
					reject(e);
				}
			};
			
			let onRejectedFunc = error => {
				if (typeof onRejected !== "function") return reject(error);
				try {
					let ret = onRejected(error);
					if (ret instanceof MyPromise2) {
						ret.then(resolve, reject);
					} else {
						resolve(ret);
					}
				} catch(e) {
					reject(e);
				}
			};
			
			switch(_status) {
				case PENDING :
					this.onFulfilledQueue.push(onFulFilledFunc);
					this.onRejectedQueue.push(onRejectedFunc);
					break;
				case FULFILLED :
					setTimeout(() => {
						onFulFilledFunc(_value);
					});
					break;
				case REJECTED :
					setTimeout(() => {
						onRejectedFunc(_value);
					});
					break;
			}
		});
	}
	
	catch(onRejected) {
		return this.then(undefined, onRejected);
	}
	
	finally(callback) {
		return this.then(value => MyPromise2.resolve(callback()).then(() => value)).catch(error => MyPromise2.resolve(callback()).
		then(() => {throw error;}));
		// if then() returns a promise, the function of the promise which will be executed is "resolve()"!!!
	}
	
	static resolve(p) {
		if (p instanceof MyPromise2) return p;
		return new MyPromise2(resolve => {
			if (p && p.then && typeof p.then === "function") {
				p.then(resolve);
			} else {
				resolve(p);
			}
		});
	}
	
	static reject(param) {
		return new MyPromise2((resolve, reject) => {
			reject(param);
		});
	}
	
	static all(promises) {
		let results = [];
		let count = 0;
		return new MyPromise2((resolve, reject) => {
			for (let p of promises) {
				MyPromise2.resolve(p).then(value => {
					results.push(value);
					if (++count === promises.length) resolve(results);
				}).catch(error => reject(error));
			}
		});
	}
	
	static race(promises) {
		return new MyPromise2((resolve, reject) => {
			for (let p of promises) {
				MyPromise2.resolve(p).then(value => resolve(value)).catch(error => reject(error));
			}
		});
	}
	
	toString() {
		return "[object MyPromise2]";
	}
}

/*
let p1 = new Promise((resolve, reject) => {
	resolve("OK");
});

let p2 = new Promise((resolve, reject) => {
	resolve(p1);
});

p2.then(value => console.log(value)).finally(function() {
	console.log("finally");
}).then(() => console.log("xxx"));
*/