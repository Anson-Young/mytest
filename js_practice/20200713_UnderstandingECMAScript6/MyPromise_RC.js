const MyPromise = (function() {
	const PENDING = "PENDING";
	const FULFULLED = "FULFULLED";
	const REJECTED = "REJECTED";
	
	// 通过Symbol实现不可以被外部访问的私有属性
	const status = Symbol("status");						// 状态
	const value = Symbol("value");							// MyPromise的当前值
	const onFulfilledFuncs = Symbol("onFulfilledFuncs");	// resolve时调用的函数队列
	const onRejectedFuncs = Symbol("onRejectedFuncs");		// reject时调用的函数队列
	const resolveFunc = Symbol("resolveFunc");				// 内部resolve函数
	const rejectFunc = Symbol("rejectFunc");				// 内部reject函数
	
	return class {
		constructor(executor) {
			if (typeof executor !== "function") {
				throw new TypeError(`MyPromise resolver ${executor} is not a function`);
			}
			// MyPromise对象必须通过new构造出来
			// if (new.target instanceof MyPromise) {
			//	throw new Error("constructor must be called with new.");
			// }
			this[status] = PENDING;
			this[value] = undefined;
			this[onFulfilledFuncs] = [];
			this[onRejectedFuncs] = [];
			
			try {
				// 执行传入构造器的执行函数，传入内部resolve和reject函数
				executor(this[resolveFunc].bind(this), this[rejectFunc].bind(this));
			} catch(e) {
				this[rejectFunc](e);
			}
		}
		
		[resolveFunc](val) {
			if (this[status] !== PENDING) return;
			if (val instanceof MyPromise) {
				val.then(this[resolveFunc].bind(this), this[rejectFunc].bind(this));
			} else {
				this[value] = val;
				this[status] = FULFULLED;
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
			let func;
			while (func = this[onRejectedFuncs].shift()) {
				func(reason);
			}
		}
		
		// 通过[Symbol.species]解决继承问题
		// MyPromise的任何实例方法和静态方法返回MyPromise类型对象时，均返回派生类的实例对象
		// 例：
		// class YourPromise extends MyPromise {}
		// let promise = new MyPromise((resolve, reject) => {});
		// console.log(YourPromise.resolve(promise) instanceof YourPromise);	// true
		static get [Symbol.species]() {
			return this;
		}
		
		then(onFulfilled, onRejected) {
			return new this.constructor[Symbol.species]((resolve, reject) => {
				
				const onFulfilledFunc = () => {
					// 通过MutationObserver实现微任务，构造函数的参数即节点发生变化时的回调函数
					const observer = new MutationObserver(() => {
						try {
							if (typeof onFulfilled !== "function") return resolve(this[value]);
							let result = onFulfilled(this[value]);
							// 如果返回值类型继续为MyPromise，则将此MyPromise对象的回调委托给当前MyPromise对象
							if (result instanceof MyPromise) {
								result.then(resolve, reject);
							} else {
								resolve(result);
							}
						} catch(e) {
							reject(e);
						}
					});
					// 为了节约开销，创建一个文本节点
					const textNode = document.createTextNode("");
					observer.observe(textNode, {
						characterData: true		// 监视文本数据
					});
					textNode.data = 1;		// 文本节点数据发生变化，触发observer绑定的回调函数
				};
				
				const onRejectedFunc = () => {
					const observer = new MutationObserver(() => {
						try {
							if (typeof onRejected !== "function") throw this[value];
							let result = onRejected(this[value]);
							if (result instanceof MyPromise) {
								result.then(resolve, reject);
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
			return this.then(value => MyPromise.resolve(cb()).then(() => value),
							 error => MyPromise.resolve(cb()).then(() => { throw error; }));
		}
		
		static resolve(p) {
			if (p instanceof MyPromise) {
				Object.setPrototypeOf(p, this[Symbol.species].prototype);
				return p;
			}
			return new this[Symbol.species]((resolve, reject) => {
				// thenable对象
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
		
		// promises不一定是promise数组，但其必须实现Iterator接口[Symbol.iterator]
		// 通过MyPromise.resolve()确保将每一个元素转化为MyPromise对象
		// 如果传入的是空数组，依然将其设置为当前MyPromise的值
		static all(promises) {
			return new this[Symbol.species]((resolve, reject) => {
				if (promises.length === 0) return resolve([]);
				let results = [];
				let count = 0;
				// 返回的结果数组里元素的位置与传入的promises里元素的位置一一对应
				promises.forEach((p, index) => {
					MyPromise.resolve(p).then(value => {
						results[index] = value;
						if (++count === promises.length) {
							resolve(results);
						}
					}, reason => reject(reason));
				});
				// 注意：传入的参数为非空数组时，不能将判断移到forEach外，会存在异步问题
				//if (count === promises.length) {
				//	resolve(results);
				//}
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