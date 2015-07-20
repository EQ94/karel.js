
// multipart/form-data
exports.parseMultipart = function (str) {
		var sp = str.split("\r\n")[0];
		
		var kvs = str.split(sp).slice(1, -1);

		var data = {};

		var g = /name="(.*)"/;

		for (var i = 0; i < kvs.length; i++) {
			var kv = kvs[i];
			var r = g.exec(kv);
			if (!r) continue;

			var s = kv.search('\r\n\r\n') + 4;
			var l = kv.length - s - 2;

			data[r[1]] = kv.substr(s, l);
		}

		//console.log(str);
		//console.log(data);
		
		return data;
}

// application/x-www-form-urlencoded
exports.parseUrlencoded = function (str) {
	throw new Error('To be implemented!');
}