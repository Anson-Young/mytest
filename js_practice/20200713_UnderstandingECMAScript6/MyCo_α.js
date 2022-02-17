function MyCo(gen, ...args) {
	return new MyPromise((resolve, reject) => {
		if (typeof gen === "function") gen = gen.call(this, ...args);
		if (!gen || typeof gen.next !== "function") return resolve(gen);
		
		// Promise.then registers a microtask, so you should handle exception inside the step function.
		// if you handle outside, when the then method is executed, the context it belongs to has been over,
		// so the exception it throws will not be caught.
		(function step(nextF) {
			let result;
			try {
				result = nextF();
			} catch (e) {
				reject(e);
			}
			if (result.done) {
				return resolve(result.value);
			}
			let p = toPromise.call(this, result.value);
			if (p && isPromise(p)) {
				return p.then(value => step(() => gen.next(value)), error => step(() => gen.throw(error)));
			}
			throw new TypeError(`you should only yield a promise, generator, function, array, object, but the following was passed: ${String(p)}`);
		}(() => gen.next()));
		
	});
}

function toPromise(obj) {
	if (!obj || isPromise(obj)) return obj;
	if (isGeneratorFunc(obj)) return MyCo.call(this, obj);
	if (typeof obj === "function") return trunkToPromise.call(this, obj);
	if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
	if (isObject(obj)) return objectToPromise(obj);
	return MyPromise.resolve(obj);
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
			if (err) reject(err);
			else resolve(data);
		});
	});
}

function arrayToPromise(obj) {
	return MyPromise.all(obj.map(toPromise, this));
}

function objectToPromise(obj) {
	let result = new obj.constructor();
	let promises = [];
	for (let [key, value] of Object.entries(obj)) {
		let p = toPromise.call(this, value);
		if (p && isPromise(p)) {
			promises.push(p.then(val => result[key] = val));
		} else {
			result[key] = value;
		}
	}
	return MyPromise.all(promises).then(() => result);
}

function isPromise(obj) {
	return typeof obj.then === "function";
}

function isObject(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1) === "Object";
}