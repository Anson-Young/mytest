/*
const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";
function MyPromise(executor) {
	let self = this;
	self.status = PENDING;
	self.onFulfilled = [];
	self.onRejected = [];
	
	let resolve = function(value) {
		if (self.status === PENDING) {
			self.status = FULFILLED;
			self.value = value;
			self.onFulfilled.forEach(fn => fn());
		}
	};
	
	let reject = function(reason) {
		if (self.status === "PENDING") {
			self.status = "REJECTED";
			self.reason = reason;
			self.onRejected.forEach(fn => fn());
		}
	};
	
	try {
		executor(resolve, reject);
	} catch(e) {
		reject(e);
	}
}

MyPromise.prototype.then = function(onFulfilled, onRejected) {
	
	onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
	onRejected = typeof onRejected === "function" ? onRejected : reason => { throw reason; };
	let self = this;
	
	let promise2 = new MyPromise(function(resolve, reject) {
		switch(self.status) {
			case FULFILLED : {
				setTimeout(() => {
					try {
						let x = onFulfilled(self.value);
						resolvePromise(promise2, x, resolve, reject);
					} catch(e) {
						reject(e);
					}
				});
				break;
			}
			case REJECTED : {
				setTimeout(() => {
					try {
						let x = onRejected(self.reason);
						resolvePromise(promise2, x, resolve, reject);
					} catch(e) {
						reject(e);
					}
				});
				break;
			}
			case PENDING : {
				self.onFulfilled.push(() => {
					setTimeout(() => {
						try {
							let x = onFulfilled(self.value);
							resolvePromise(promise2, x, resolve, reject);
						} catch(e) {
							reject(e);
						}
					});
				});
				self.onRejected.push(() => {
					setTimeout(() => {
						try {
							let x = onRejected(self.reason);
							resolvePromise(promise2, x, resolve, reject);
						} catch(e) {
							reject(e);
						}
					});
				});
				break;
			}
		}
	});
	
	return promise2;
};

function resolvePromise(promise, x, resolve, reject) {
	if (promise === x) {
		throw Error("Circle execute!");
	}
	
	if (x && typeof x === "object" || typeof x === "function") {
		let used;
		try {
			let then = x.then;
			then.call(x, (y) => {
				if (used) return;
				used = true;
				resolvePromise(promise, y, resolve, reject);
			}, (r) => {
				if (used) return;
				used = true;
				resolvePromise(promise, r, resolve, reject);
			});
		} catch(e) {
			reject(e);
		}
	} else {
		resolve(x);
	}
}

MyPromise.resolve = function(param) {
	if (param instanceof MyPromise) return param;
	
	return new MyPromise((resolve, reject) => {
		if (param && param.then && typeof param.then === "function") {
			param.then(resolve);	// param = {then : function(resolve, reject) {resolve("xxx");}}
		} else {
			resolve(param);
		}
	});
};

MyPromise.reject = function(reason) {
	return new MyPromise((resolve, reject) => {
		reject(reason);
	});
};

MyPromise.prototype.catch = function(reject) {
	return this.then(null, reject);
};

MyPromise.prototype.finally = function(callback) {
	return this.then(value => {
		return MyPromise.resolve(callback()).then(() => value);
	}, reason => {
		return MyPromise.reject(callback()).catch(() => reason);
	});
};

MyPromise.all = function(promises) {
	return new MyPromise((resolve, reject) => {
		let results = [];
		if (promises.length === 0) {
			resolve(results);
			return;
		}
		
		for (let i = 0; i < promises.length; i++) {
			MyPromise.resolve(promises[i]).then(data => {
				results[i] = data;
				if (results.length === promises.length) resolve(results);
			}, reason => {
				reject(reason);
			});
		}
	});
};

MyPromise.race = function(promises) {
	return new MyPromise((resolve, reject) => {
		for (let i = 0; i < promises.length; i++) {
			MyPromise.resolve(promises[i]).then(data => {
				resolve(data);
			}, reason => {
				reject(reason);
			});
		}
	});
};


(function (window) {
	const PENDING = "PENDING";
	const FULFILLED = "FULFILLED";
	const REJECTED = "REJECTED";
	class MyPromise {
		constructor(executor) {
			this.status = PENDING;
			this.onFulfilled = [];
			this.onRejected = [];
			
			let resolve = value => {
				if (this.status === PENDING) {
					this.status = FULFILLED;
					this.value = value;
					this.onFulfilled.forEach(fn => fn());
				}
			};
			
			let reject = reason => {
				if (this.status === PENDING) {
					this.status = REJECTED;
					this.reason = reason;
					this.onRejected.forEach(fn => fn());
				}
			};
			
			try {
				executor(resolve, reject);
			} catch(e) {
				reject(e);
			}
		}
		
		then(onFulfilled, onRejected) {
			onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
			onRejected = typeof onRejected === "function" ? onRejected : reason => {throw reason;};
			
			//let self = this;
			
			let promise2 = new MyPromise((resolve, reject) => {
				switch(this.status) {
					case PENDING : {
						this.onFulfilled.push(() => {
							setTimeout(() => {
								try {
									let x = onFulfilled(this.value);
									resolvePromise(promise2, x, resolve, reject);
								} catch(e) {
									reject(e);
								}
							});
						});
						this.onRejected.push(() => {
							setTimeout(() => {
								try {
									let x = onRejected(this.reason);
									resolvePromise(promise2, x, resolve, reject);
								} catch(e) {
									reject(e);
								}
							});
						});
						break;
					}
					case FULFILLED : {
						setTimeout(() => {
							try {
								//console.log(this === self);
								let x = onFulfilled(this.value);
								resolvePromise(promise2, x, resolve, reject);
							} catch(e) {
								reject(e);
							}
						});
						break;
					}
					case REJECTED : {
						setTimeout(() => {
							try {
								let x = onRejected(this.reason);
								resolvePromise(promise2, x, resolve, reject);
							} catch(e) {
								reject(e);
							}
						});
						break;
					}
				}
			});
			
			return promise2;
		}
		
		catch(onRejected) {
			return this.then(null, onRejected);
		}
		
		finally(callback) {
			return this.then(value => {
				return MyPromise.resolvePromise(callback()).then(() => value);
			}, reason => {
				//resolvePromise must execute resolve, so use "then" in link invocation, not catch!
				return MyPromise.resolvePromise(callback()).then(() => {throw reason;});
			});
		}
		
		static resolvePromise(param) {
			if (param instanceof MyPromise) return param;
			
			return new MyPromise((resolve, reject) => {
				if (param && param.then && typeof param.then === "function") {
					param.then(resolve);	// param = {then : function(resolve, reject) {resolve(xxx);}}
				} else {
					resolve(param);
				}
			});
		}
		
		static all(promises) {
			return new MyPromise((resolve, reject) => {
				let results = [];
				if (promises.length === 0) {
					resolve(results);
					return;
				}
				
				promises.forEach(promise => {
					MyPromise.resolve(promise).then(data => {
						results[results.length++] = data;
						if (results.length === promises.length) resolve(results);
					}, reason => {
						reject(reason);
					});
				});
			});
		}
		
		static race(promises) {
			return new MyPromise((resolve, reject) => {
				promises.forEach(promise => {
					MyPromise.resolvePromise(promise).then(data => {
						resolve(data);
					}, reason => {
						reject(reason);
					});
				});
			});
		}
	}
	
	function resolvePromise(promise, x, resolve, reject) {
		if (promise === x) {
			throw Error("promise circle!");
		}
		
		if (x && typeof x === "object" || typeof x === "function") {
			//let used;
			try {
				let then = x.then;
				if (typeof then === "function") {
					then.call(x, y => {
						//if (used) return;
						//used = true;
						resolvePromise(x, y, resolve, reject);
					}, r => {
						reject(r);
					});
				} else {
					resolve(x);
				}
			} catch(e) {
				reject(e);
			}
		} else {
			resolve(x);
		}
	}
	window.MyPromise = MyPromise;
}(window));
*/

const isFunction = func => typeof func === "function";
const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

class MyPromise {
	constructor(handler) {
		if (!isFunction(handler)) {
			throw new Error("The parameter of constructor must be a function");
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
		if (this._status !== PENDING) return;	// resolve("xxx");resolve("xxx");resolve("xxx");
		const runFulfilled = value => {
			this._value = value;
			this._status = FULFILLED;
			let fn;
			while (fn = this.onFulfilledQueue.shift()) {
				fn(this._value);
			}
		};
		const runRejected = reason => {
			this._value = reason;
			this._status = REJECTED;
			let fn;
			while (fn = this.onRejectedQueue.shift()) {
				fn(this._value);
			}
		};
		//const run = () => {
		if (value instanceof MyPromise) {
			value.then(val => {
				runFulfilled(val);
			}, reason => {
				runRejected(reason);
			});
		} else {
			runFulfilled(value);
		}
			
		//}
		//setTimeout(run, 0);
	}
	
	_reject(reason) {
		if (this._status !== PENDING) return;	// reject("yyy");reject("yyy");reject("yyy");
		//const run = () => {
			//if (reason instanceof MyPromise) {
			//	reason.catch(reason => {
			//		this._value = reason;
			//		this._status = REJECTED;
			//	});
			//} else {
			//	this._status = REJECTED;
			//	this._value = reason;
			//}
		this._status = REJECTED;
		this._value = reason;
		let fn;
		while (fn = this.onRejectedQueue.shift()) {
			fn(reason);
		}
		//}
		//setTimeout(run, 0);
	}
	
	then(onFulfilled, onRejected) {
		let {_value, _status} = this;
		return new MyPromise((resolve, reject) => {
			
			const fulfilledFunc = value => {
				try {
					if (!isFunction(onFulfilled)) {	// then("xxxxx")
						resolve(value);
					} else {
						let x = onFulfilled(value);
						if (x instanceof MyPromise) {
							x.then(resolve, reject);
						} else {
							resolve(x);
						}
					}
				} catch(e) {
					reject(e);
				}
			};
			
			const rejectedFunc = reason => {
				try {
					if (!isFunction(onRejected)) {	// then("xxxxx")
						reject(reason);
					} else {					
						let x = onRejected(reason);
						if (x instanceof MyPromise) {
							x.then(resolve, reject);
						} else {
							resolve(x);
						}
					}
				} catch(e) {
					reject(e);
				}
			};
			
			//if (!isFunction(onFulfilled)) {	// then("xxxxx")
			//	return resolve(_value);
			//}
			switch(_status) {
				case FULFILLED :
					setTimeout(() => {
						//let x = onFulfilled(_value);
						//if (x instanceof MyPromise) {
						//	x.then(resolve, reject);
						//} else {
						//	resolve(x);
						//}
						fulfilledFunc(_value);
					}, 0);
					break;
				case REJECTED :
					setTimeout(() => {
						rejectedFunc(_value);
					}, 0);
					break;
				case PENDING :
					this.onFulfilledQueue.push(fulfilledFunc);
					this.onRejectedQueue.push(rejectedFunc);
					//this.onRejectedQueue.push(reason => {
					//	let x = onRejected(reason);
					//	if (x instanceof MyPromise) {
					//		x.then(resolve, reject);
					//	} else {
					//		reject(x);
					//	}
						//if (x instanceof MyPromise) {
						//	return MyPromise.resolve(x).then(val => {
						//		return resolve(val);
						//	}, reason => reject(reason));
						//}
						//return reject(x);
					//});
			}
		});
	}
	
	catch(onRejected) {
		return this.then(undefined, onRejected);
	}
	
	finally(cb) {
		//cb();
		//return MyPromise.resolve(this._value);
		return this.then(
			val => MyPromise.resolve(cb()).then(() => val), 
			reason => MyPromise.resolve(cb()).then(() => {
			throw reason;
		}));
	}
	
	static resolve(param) {
		if (param instanceof MyPromise) return param;
		//if (param.then && typeof param.then === "function") {
		//	return new MyPromise(param.then);
		//}
		//return new MyPromise(resolve => resolve(param));
		return new MyPromise(resolve => {
			if (param && param.then && typeof param.then === "function") {
				param.then(resolve);
			} else {
				resolve(param);
			}
		});
	}
	
	static reject(param) {
		return new MyPromise((resolve, reject) => {
			reject(param);
		});
	}
	
	static all(list) {
		return new MyPromise((resolve, reject) => {
			const values = [];
			let count = 0;
			for (let [i, p] of list.entries()) {
				MyPromise.resolve(p).then(value => {
					values.push(value);
					count++;
					if (count === list.length) resolve(values);
				}, reason => {
					reject(reason);
				});
			}
		});
	}
	static race(list) {
		return new MyPromise((resolve, reject) => {
			for (let p of list) {
				MyPromise.resolve(p).then(value => {
					resolve(value);
				}, reason => {
					reject(reason);
				})
			}
		});
	}
}