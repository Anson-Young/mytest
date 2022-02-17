function MyCo(gen) {
	let ctx = this;
	let args = [].slice.call(arguments, 1);
	
	return new Promise((resolve, reject) => {
		if (typeof gen === "function") gen = gen.call(ctx, args);
		if (!gen || typeof gen.next !== "function") return resolve(gen);
		
		onFulFilled();
		function onFulFilled(res) {
			let ret;
			try {
				ret = gen.next(res);
			} catch(e) {
				return reject(e);
			}
			next(ret);
		}
		
		function onRejected(err) {
			let ret;
			try {
				ret = gen.throw(err);
			} catch(e) {
				return reject(e);
			}
			next(ret);
		}
		
		function next(ret) {
			if (ret.done) return resolve(ret.value);
			let value = toPromise.call(ctx, ret.value);
			if (value && isPromise(value)) return value.then(onFulFilled, onRejected);
			return onRejected(new TypeError("you may only yield a function, promise, generator, array, or object, "
								+ "but the following object was passed: \"" + String(ret.value) + "\""));
		}
	});
}

function toPromise(obj) {
	if (!obj) return obj;
	if (isPromise(obj)) return obj;
	if (isGeneratorFunction(obj)) return MyCo.call(this, obj);
	if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
	if (typeof obj === "function") return trunkToPromise.call(this, obj);
	if (isObject(obj)) return objectToPromise.call(this, obj);
	return obj;
}

function isPromise(obj) {
	return typeof obj.then === "function";
}

function isGeneratorFunction(obj) {
	let constructor = obj.constructor;
	if (!constructor) return false;
	if (constructor.name === "GeneratorFunction") return true;
	return isGeneratorObj(Object.getPrototypeOf(obj));
}

function isGeneratorObj(obj) {
	return typeof obj.next === "function" && typeof obj.throw === "function";
}

function arrayToPromise(obj) {
	return Promise.all(obj.map(toPromise, this));
}

function trunkToPromise(fn) {
	let ctx = this;
	return new Promise((resolve, reject) => {
		fn.call(ctx, (err, ...data) => {
			if (err) return reject(err);
			resolve([...data]);
		});
	});
}

function isObject(obj) {
	return obj.constructor === Object;
}

function objectToPromise(obj) {
	let results = new obj.constructor();
	//let keys = Reflect.ownKeys(obj);
	let promises = [];
	
	for (let [key, value] of Object.entries(obj)) {
		let promise = toPromise.call(this, value);
		if (promise && isPromise(promise)) {
			promises.push(promise.then(result => results[key] = result));
		} else {
			results[key] = value;
		}
	}
	
	return Promise.all(promises).then(() => results);
}