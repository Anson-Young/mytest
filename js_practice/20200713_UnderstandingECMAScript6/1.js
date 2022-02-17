function saferHTML(templateData) {
	var s = templateData[0];
	for (var i = 1; i < arguments.length; i++) {
		var arg = String(arguments[i]);
		s += arg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		s += templateData[i];
	}
	return s;
}
console.log(saferHTML`<p>${"<script>alert(123);</script>"} has sent you a message.</p>`);