/**
 * 手动实现promise的功能， 只能保证功能相同。用于来更加深刻的理解promise
 * 为什么这里要用一个立即执行函数，因为这里没有用模块化，所以用立即执行函数，防止定义的名字相同，导致全局污染
 * @type {{new(): MyPromise, prototype: MyPromise}}
 */
const MyPromise = (() => {
    // 定义一些常量
    const PENDING = "pending", // 等待状态（未决状态）
        RESOLVE = "resolved", // 成功状态 （已决状态）
        REJECT = "rejected", // 失败状态 （已决状态）
        thenables = Symbol("用于保存成功状态的队列"), //
        catchables = Symbol("用来保存失败状态的队列"), //
        promiseStatus = Symbol("PromiseStatus"), // 用符号来保存promise的状态，防止外部访问
        promiseValue = Symbol("PromiseValue"),  // promise的值
        changeStatus = Symbol("改变状态的函数"),
        execSettledCommon = Symbol("执行已决状态的公共方法"),
        createPromise = Symbol("用于创建一个新的promise，用于then或者catch方法后的链式调用");
    return class MyPromise {
        /**
         * 一进来创建promise实例是传入两个方法，一个是resolve, 一个是reject
         * @param executor
         */
        constructor(executor) {
            // 创建promise实例后的状态是pending,值是undefined
            this[promiseStatus] = PENDING;
            this[promiseValue] = undefined;
            this[thenables] = []; //后续处理函数的数组 -> resolved
            this[catchables] = []; //后续处理函数的数组 -> rejected

            // 成功的状态 已决
            const resolve = (data) => {
                this[changeStatus](RESOLVE, data, this[thenables]);
            };
            // 失败的状态 已决
            const reject = (err) => {
                this[changeStatus](REJECT, err, this[catchables]);
            };

            // 这里的try catch 用于捕捉 promise里面抛出的错误，抛到上一层
            try {
                executor(resolve, reject)
            } catch (err) {
                reject(err);
            }
        }

        /**
         * 改变promise状态的方法
         * @param status 修改成对应的状态
         * @param value 修改的值
         * @param queue 修改状态的时候执行放入thenables 或者 catchables队列里面的函数
         */
        [changeStatus](status, value, queue) {
            // 因为promise的状态是单向传递的，不可逆转的，所以当只有状态为pending的时候才可以往往下走
            if (this[promiseStatus] === PENDING) {
                this[promiseStatus] = status;
                this[promiseValue] = value;
                // 当状态改变的时候，执行then/catch队列里面的对应函数
                queue.forEach(handler => handler(value));
            }
        }

        /**
         * 执行已决状态的后续函数的公共方法
         * @param handler 后续处理函数
         * @param status 当前状态
         * @param queue 如果当前状态是resolve或者reject, 放入对应的thenables 和 catchables的消息队列中
         */
        [execSettledCommon](handler, status, queue) {
            // 只有当传入的函数是一个函数的时候，才会去执行该函数
            if (typeof handler !== "function") {
                return;
            }
            if (this[promiseStatus] === status) {
                // 用于模拟promise 是异步的，promise会放到微队列中执行
                setTimeout(() => {
                    handler(this[promiseValue]);
                }, 0);
            } else {
                // 否则放入消息队列
                queue.push(handler);
            }
        }

        /**
         * 用于创建返回的promise的方法
         * @param thenHandler then 后续函数
         * @param catchHandler catch 后续函数
         * @returns {MyPromise}
         */
        [createPromise](thenHandler, catchHandler) {
            /**
             * 用于内部调用 执行then/catch 的后续函数的操作， 使得外部不能访问，只给内部使用
             * @param data 调用传入的数据
             * @param handler 传入的then 或者catch 函数
             * @param resolve 成功的毁掉
             * @param reject 失败的毁掉
             */
            function exec(data, handler, resolve, reject) {
                try {
                    // 执行通过then函数来改变状态
                    const result = handler(data);
                    // 这里需要判断result 返回的是不是一个promise对象，如果是promise对象，直接直接调用then(成功状态下),或者调用catch
                    if (result instanceof MyPromise) {
                        result.then(res => {
                            resolve(res);
                        }, err => {
                            reject(err);
                        })
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(e)
                }
            }

            return new MyPromise((resolve, reject) => {
                // 使用then一直链式调用
                this[execSettledCommon](data => {
                    exec(data, thenHandler, resolve, reject);
                }, RESOLVE, this[thenables]);
                // 使用catch一直链式调用
                this[execSettledCommon](err => {
                    exec(err, catchHandler, resolve, reject);
                }, REJECT, this[catchables]);
            })
        }

        /**
         * 用于接收promise的状态， 也就是resolved状态，或者失败的rejected状态
         * @param thenHandler 成功的处理函数
         * @param catchHandler 失败的处理函数
         */
        then(thenHandler, catchHandler) {
            // 因为我们的then 函数或者catch函数放入createPromise 这里面处理了
            // this[execSettledCommon](thenHandler, RESOLVE, this[thenables]);
            // // 如果在then里面传了catchHandler的函数，执行下面这个代码
            // this.catch(catchHandler);

            return this[createPromise](thenHandler, catchHandler)
        };

        /**
         * 用于接收promise失败的状态
         * @param catchHandler 失败的处理函数
         */
        catch(catchHandler) {
            // this[execSettledCommon](catchHandler, REJECT, this[catchables]);
            return this[createPromise](undefined, catchHandler)
        };

        /**
         * 当所有的promise代码全部完成， 就返回成功的集合，失败一个着返回全部失败
         * @param proms promise 数组
         * @returns {MyPromise}
         */
        static all(proms) {
            return new MyPromise((resolve, reject) => {
                const promsArrs = proms.map(p => {
                    const obj = {
                        hasDone: false,
                        resultData: undefined,
                    };
                    p.then(res => {
                        obj.hasDone = true;
                        obj.resultData = res;
                        // 判断promise数组里面的promise对象是否全部完全
                        const hasFinishArr = promsArrs.filter(item => !item.hasDone);
                        if (hasFinishArr.length === 0) {
                            // 代表所有的promise都已经完成
                            resolve(promsArrs);
                        }
                    }, err => {
                        reject(err);
                    });
                    return obj;
                })
            })
        }

        /**
         * 当所有的promise数组只要有一个成功 就返回成功，失败就返回失败
         * @param proms promise 数组
         * @returns {MyPromise}
         */
        static race(proms) {
            return new MyPromise((resolve, reject) => {
                proms.forEach(p => {
                    p.then(res => {
                        resolve(res);
                    }, err => {
                        reject(err);
                    })
                })
            })
        }

        /**
         * promise成功的直接调用
         * @param data 结果
         * @returns {MyPromise}
         */
        static resolve(data) {
            // 判断结果是不是一个promise对象
            if (data instanceof MyPromise) { // 如果是promise对象，直接返回就好
                return data;
            } else { // 不是promise对象，直接返回一个promise对象
                return new MyPromise((resolve, reject) => {
                    resolve(data);
                })
            }
        }

        /**
         * promise的失败的直接调用
         * @param err 错误的原因 错误原因直接返回一个promise对象，不会阻塞代码的执行
         * @returns {MyPromise}
         */
        static reject(err) {
            return new MyPromise((resolve, reject) => {
                reject(err)
            })
        }
    }
})();
