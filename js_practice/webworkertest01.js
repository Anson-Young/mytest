addEventListener("message", function(event) {
	//postMessage(event.data[0]);
	//event.data[1].xxx;
	//console.log(this === self);	// true
	let date = new Date();
	let currentDate = null;
	do {
		currentDate = new Date();
	} while(currentDate - date < event.data);
	
	postMessage(currentDate);
}, false);
