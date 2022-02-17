function MyCo(gen, ...args) {
	return new MyPromise((resolve, reject) => {
		if (typeof gen === "function") gen = gen.call(this, ...args);
		if (!gen || typeof gen.next !== "function") return resolve(gen);
		
		/*
		onFulfilled();
		
		function onFulfilled(res) {
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
			let value = toPromise.call(this, ret.value);
			if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
			return onRejected("you should only yield a promise, generator, function, array, object, "
							  + "but the following was passed: " + String(value));
		}
		*/
		
		
		function step(nextF) {
			try {
				let ret = nextF();
				if (ret.done) return resolve(ret.value);
				let value = toPromise.call(this, ret.value);
				if (value && isPromise(value)) return value.then(val => step(() => gen.next(val))).catch(error => step(() => gen.throw(error)));
				throw new TypeError(`you should only yield a promise, generator, function, array, object, but the following was passed: ${String(value)}`);
			} catch(e) {
				reject(e);
			}
		}
		step(() => gen.next());
	});
}

function toPromise(obj) {
	if (!obj) return obj;
	if (isPromise(obj)) return obj;
	if (isGeneratorFunction(obj)) return MyCo.call(this, obj);
	if (typeof obj === "function") return trunkToPromise.call(this, obj);
	if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
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

function trunkToPromise(fn) {
	return new MyPromise((resolve, reject) => {
		fn.call(this, (err, ...data) => {
			if (err) return reject(err);
			//resolve([...data]);
			//console.log(...data);
			//console.log(data);
			resolve(data);
		});
	});
}

function arrayToPromise(obj) {
	return MyPromise.all(obj.map(toPromise, this));
}

function objectToPromise(obj) {
	let results = new obj.constructor();
	let promises = [];
	for (let [key, value] of Object.entries(obj)) {
		let promise = toPromise.call(this, value);
		if (promise && isPromise(promise)) {
			promises.push(promise.then(result => results[key] = result));
		} else {
			results[key] = value;
		}
	}
	return MyPromise.all(promises).then(() => results);
}

function isObject(obj) {
	return obj.constructor === Object;
}