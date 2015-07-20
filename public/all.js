
function ajax(method, url, data, responseType, callback) {
	if (arguments.length < 3)
		throw new Error('Arguments count error: ' + arguments.length + '.');

	if (arguments.length == 3) {
		callback = data;
		data = undefined;
	} else if (arguments.length == 4) {
		callback = responseType;
		responseType = undefined;
	}

	var http = new XMLHttpRequest();

	http.open(method, url, true);

	http.onload = function () {
		callback(undefined, http.response);
	}

	http.onerror = function (error) {
		callback(error);
	}

	if (responseType)
		http.responseType = responseType;

	http.send(data);
}

ajax.get = function(url, responseType, callback) {
	ajax.bind(this, 'get').apply(this, arguments); 
}

ajax.post = function(url, data, responseType, callback) {
	ajax.bind(this, 'post').apply(this, arguments); 
}

function refresh() {
	window.location.reload();
}

function here(fn) {
	return fn.toString().split('\n').slice(1, -1).join('\n');
}
