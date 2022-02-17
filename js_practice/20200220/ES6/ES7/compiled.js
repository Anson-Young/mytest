"use strict";

var _class;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MyTestableClass = testable(_class = function MyTestableClass() {
	_classCallCheck(this, MyTestableClass);
}) || _class;

function testable(target) {
	target.isTestable = true;
}
console.log(MyTestableClass.isTestable);

var trunkify = require("trunkify");
var fs = require("fs");

var read = thunkify(fs.readFile);
read("package.json")(function (err, str) {

	console.log(err);
});
