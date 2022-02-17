const MyPromise = (function() {
	const PENDING = "PENDING";
	const FULFULLED = "FULFULLED";
	const REJECTED = "REJECTED";
	
	/*
	const statusMap = new WeakMap();
	const valueMap = new WeakMap();
	const onFulfilledFuncsMap = new WeakMap();
	const onRejectedFuncsMap = new WeakMap();
	const resolveFuncMap = new WeakMap();
	const rejectFuncMap = new WeakMap();
	*/
	
	
	const status = Symbol("status");
	const value = Symbol("value");
	const onFulfilledFuncs = Symbol("onFulfilledFuncs");
	const onRejectedFuncs = Symbol("onRejectedFuncs");
	const resolveFunc = Symbol("resolveFunc");
	const rejectFunc = Symbol("rejectFunc");
	
	return class {
		constructor(executor) {
			if (typeof executor !== "function") {
				throw new TypeError(`MyPromise resolver ${executor} is not a function`);
			}
			if (new.target instanceof MyPromise) {
				throw new Error("constructor must be called with new.");
			}
			
			/*
			statusMap.set(this, PENDING);
			valueMap.set(this, undefined);
			onFulfilledFuncsMap.set(this, []);
			onRejectedFuncsMap.set(this, []);
			*/
			
			this[status] = PENDING;
			this[value] = undefined;
			this[onFulfilledFuncs] = [];
			this[onRejectedFuncs] = [];
			
			/*
			resolveFuncMap.set(this, value => {
				if (statusMap.get(this) !== PENDING) return;
				if (value instanceof MyPromise) {
					value.then(resolveFuncMap.get(this).bind(this), rejectFuncMap.get(this).bind(this));
					//value.then(val => this._resolve(val), err => this._reject(err));
				} else {
					valueMap.set(this, value);
					statusMap.set(this, FULFULLED);
					let func;
					while (func = onFulfilledFuncsMap.get(this).shift()) {
						func(value);
					}
				}
			});
			
			rejectFuncMap.set(this, reason => {
				if (statusMap.get(this) !== PENDING) return;
				valueMap.set(this, reason);
				statusMap.set(this, REJECTED);
				let func;
				while (func = onRejectedFuncsMap.get(this).shift()) {
					func(reason);
				}
			});
			*/
			
			try {
				executor(this[resolveFunc].bind(this), this[rejectFunc].bind(this));
			} catch(e) {
				this[rejectFunc](e);
			}
		}
		
		[resolveFunc](val) {
			if (this[status] !== PENDING) return;
			if (val instanceof MyPromise) {
				val.then(this[resolveFunc].bind(this), this[rejectFunc].bind(this));
				//value.then(val => this._resolve(val), err => this._reject(err));
			} else {
				this[value] = val;
				this[status] = FULFULLED;
				//valueMap.set(this, value);
				//statusMap.set(this, FULFULLED);
				let func;
				while (func = this[onFulfilledFuncs].shift()) {
					func(val);
				}
			}
		}
		
		[rejectFunc](reason) {
			if (this[status] !== PENDING) return;
			this[value] = reason;
			this[status] = REJECTED;
			//valueMap.set(this, reason);
			//statusMap.set(this, REJECTED);
			let func;
			while (func = this[onRejectedFuncs].shift()) {
				func(reason);
			}
		}
		
		/*
		_resolve(value) {	// not arrow function, must be bind with this!!
			if (statusMap.get(this) !== PENDING) return;
			if (value instanceof MyPromise) {
				value.then(this._resolve.bind(this), this._reject.bind(this));
				//value.then(val => this._resolve(val), err => this._reject(err));
			} else {
				valueMap.set(this, value);
				statusMap.set(this, FULFULLED);
				let func;
				while (func = onFulfilledFuncsMap.get(this).shift()) {
					func(value);
				}
			}
		}
		
		_reject(reason) {
			if (statusMap.get(this) !== PENDING) return;
			valueMap.set(this, reason);
			statusMap.set(this, REJECTED);
			let func;
			while (func = onRejectedFuncsMap.get(this).shift()) {
				func(reason);
			}
		}
		*/
		
		then(onFulfilled, onRejected) {
			return new this.constructor[Symbol.species]((resolve, reject) => {
				
				/*
				let count = 0;
				// Vue2.5之前用的dom更新中使用了Promise，MutationObserver和setTimeout，我使用的是Vue关于MutationObserver的使用方式
				// MutationObserver可以绑定某个节点，当节点改变时，回调函数callback将放入微任务中
				// 通过装饰者模式，将回调函数包装一下，将执行之后的返回值保存起来
				const observe = new MutationObserver(() => {
					this.resolveParams = callback(this.resolveParams)
				});
				// 为了节约开销，创建一个文本比创建一个dom可划算的多
				const textNode = document.createTextNode(String(count));
				observe.observe(textNode, {
					// 当文本改变时触发回调
					characterData: true
				});
				// 改变文本，回调callback触发
				textNode.data = String(++count);
				*/
				
				const onFulfilledFunc = () => {
					const observer = new MutationObserver(() => {
						try {
							//if (!onFulfilled) return resolve(this._value);
							if (typeof onFulfilled !== "function") return resolve(this[value]);
							
							let result = onFulfilled(this[value]);
							if (result instanceof MyPromise) {
								result.then(value => resolve(value));
							} else {
								resolve(result);
							}
						} catch(e) {
							reject(e);
						}
					});
					const textNode = document.createTextNode("");
					observer.observe(textNode, {
						characterData: true
					});
					textNode.data = 1;
				};
				
				const onRejectedFunc = () => {
					const observer = new MutationObserver(() => {
						try {
							//if (!onRejected) throw this._value;
							if (typeof onRejected !== "function") throw this[value];
							let result = onRejected(this[value]);
							if (result instanceof MyPromise) {
								result.then(value => resolve(value));
							} else {
								resolve(result);
							}
						} catch(e) {
							reject(e);
						}
					});
					const textNode = document.createTextNode("");
					observer.observe(textNode, {
						characterData: true
					});
					textNode.data = 1;
				};
				
				switch (this[status]) {
					case PENDING : 
						this[onFulfilledFuncs].push(onFulfilledFunc);
						this[onRejectedFuncs].push(onRejectedFunc);
						break;
					case FULFULLED :
						onFulfilledFunc();
						break;
					case REJECTED :
						onRejectedFunc();
				}
			});
		}
		
		catch(onRejected) {
			return this.then(null, onRejected);
		}
		
		finally(cb) {
			// .catch() will register one more microtask!!!
			return this.then(value => MyPromise.resolve(cb()).then(() => value), error => MyPromise.resolve(cb()).then(() => { throw error; }))
					   //.catch();
		}
		
		static get [Symbol.species]() {
			return this;
		}
		
		static resolve(p) {
			if (p instanceof MyPromise) {
				Object.setPrototypeOf(p, this[Symbol.species].prototype);
				return p;
			}
			return new this[Symbol.species]((resolve, reject) => {
				if (p && p.then && typeof p.then === "function") {
					p.then(resolve, reject);
				} else {
					resolve(p);
				}
			});
		}
		
		static reject(p) {
			return new this[Symbol.species]((resolve, reject) => {
				reject(p);
			});
		}
		
		static all(promises) {
			return new this[Symbol.species]((resolve, reject) => {
				let results = [];
				let index = 0;
				for (let p of promises) {
					MyPromise.resolve(p).then(value => {
						results.push(value);
						if (++index === promises.length) {
							resolve(results);
						}
					}, reason => reject(reason));
				}
			});
		}
		
		static race(promises) {
			return new this[Symbol.species]((resolve, reject) => {
				for (let p of promises) {
					MyPromise.resolve(p).then(value => resolve(value), reason => reject(reason));
				}
			});
		}
	};
}());

/*

let p1 = new MyPromise((resolve, reject) => {
		
	resolve(123);
});

let p2 = p1.then(value => {
	console.log(value);
	return new MyPromise((resolve, reject) => {
		resolve(456);
	});
});

let p3 = p2.then(value => {
	return new MyPromise((resolve, reject) => {
		resolve(value);
	});
});

let p4 = new MyPromise((resolve, reject) => {
	resolve(p3);
});

p4.then(value => {
	console.log(value);
});

*/