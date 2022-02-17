const MyCo = (function() {
	return function(gen, ...args) {
		return new MyPromise((resolve, reject) => {
			if (typeof gen === "function") gen = gen.call(this, ...args);
			if (!gen || typeof gen.next !== "function") return resolve(gen);
			
			(function step(nextF) {
				let result;
				try {
					result = nextF();
				} catch (e) {
					//console.log("---" + e);
					// 此处不能写成throw e;因为执行error => step(() => gen.throw(error))函数注册了一个微任务，在执行() => gen.throw(error)函数时原上下文已经结束，此时throw e会成为为捕获错误
					//throw e;
					reject(e);
				}
				
				if (result.done) return resolve(result.value);
				let p = toPromise.call(this, result.value);
				if (p && isPromise(p)) return p.then(value => step(() => gen.next(value)), error => step(() => gen.throw(error)));
				throw new TypeError(`you should only yield a generator, promise, function, array, object, but the following was passed: ${String(result.value)}`);
			}(() => gen.next()));
		});
	}

	function toPromise(obj) {
		if (!obj || isPromise(obj)) return obj;
		if (isGeneratorFunc(obj)) return MyCo.call(this, obj);
		if (typeof obj === "function") return trunkToPromise.call(this, obj);
		if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
		if (isObject(obj)) return objectToPromise.call(this, obj);
		return MyPromise.resolve(obj);
	}

	function isPromise(obj) {
		return typeof obj.then === "function";
	}
	
	function isGeneratorFunc(obj) {
		let constructor = obj.constructor;
		if (!constructor) return false;
		if (constructor.name === "GeneratorFunction") return true;
		return isGeneratorObj(obj);
	}
	
	function isGeneratorObj(obj) {
		return typeof obj.next === "function" && typeof obj.throw === "function";
	}
	
	function trunkToPromise(obj) {
		return new MyPromise((resolve, reject) => {
			obj.call(this, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}
	
	function arrayToPromise(obj) {
		return MyPromise.all(obj.map(toPromise, this));
	}
	
	function isObject(obj) {
		return Object.prototype.toString.call(obj).slice(8, -1) === "Object";
	}
	
	function objectToPromise(obj) {
		let result = new obj.constructor();
		let promises = [];
		for (let [key, value] of Object.entries(obj)) {
			let p = toPromise.call(this, value);
			if (p && isPromise(p)) {
				promises.push(p.then(value => result[key] = value, error => { throw error; }));
			} else {
				result[key] = value;
			}
		}
		return MyPromise.all(promises).then(() => result, error => { throw error; });
	}
}());


/*

	generator, promise, function, array, object
	
	// 例：
	function* gen(initialValue) {
		let value1 = yield function* () {
			return yield [initialValue];
		};
		let value2 = yield new MyPromise((resolve, reject) => {
			resolve(value1);
		});
		let value3 = yield (function(fn) {
			return callback => fn.call(this, value2, callback);
		}(function(a, callback) {
			callback(null, a * a);
		}));
		let value4 = yield [value3, "abc"];
		let value5 = yield { x : value4 };
		let value6;
		try {
			value6 = y / 1;
		} catch (e) {
			console.log(e);
			value6 = value5;
		}
		return value6;
	}
	
	// trunk函数
	let trunk = fn => (...args) => callback => fn.call(this, ...args, callback);
	
*/