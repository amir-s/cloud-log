var io = require('socket.io-client');
module.exports = function (t) {
	var socket = io('http://localhost:4000');
	socket.on('connect', () => {
		socket.emit('auth', {t: t, type: 'server'});
	});
	return {
		log: function () {
			let args = Array.prototype.slice.call(arguments);
			socket.emit('log', {args});
			console.log.apply(console, args);
		}
	}
}