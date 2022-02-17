var $ = function(arg) {
	return new Base(arg);
};

function Base(arg) {
	this.elements = [];
	if (typeof arg === "string") {
		this.getElements(arg);
	} else if (typeof arg === "object")
		if (arg) this.elements.push(arg);	// it is possible that arg is null
}

Base.prototype.find = function(arg) {
	var children = [];
	if (typeof arg !== "string")
		children.push(null);
	else
		for (var i = 0; i < this.elements.length; i++)
			this.getElements(arg, this.elements[i], children);
	return this;
};

Base.prototype.getElements = function(arg, parent, children) {
	parent = parent || document;
	this.elements = children || this.elements;
	switch(arg.charAt(0)) {
		case "#" :
			this.getId(arg.substring(1));
			break;
		case "." :
			this.getClass(arg.substring(1), parent);
			break;
		default :
			this.getTag(arg, parent);
	}
}

Base.prototype.getId = function(id) {
	this.elements.push(document.getElementById(id));
};

Base.prototype.getClass = function(className, parent) {
	var results = parent.getElementsByTagName("*");
	for (var i = 0; i < results.length; i++)
		if (results[i].className === className)
			this.elements.push(results[i]);
};

Base.prototype.getTag  =function(tag, parent) {
	var results = parent.getElementsByTagName(tag);
	for (var i = 0; i < results.length; i++)
		this.elements.push(results[i]);
};

Base.prototype.css = function(attr, value) {
	if (arguments.length === 1)
		return this.elements.style[attr];
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].style[attr] = value;
	}
	return this;
};