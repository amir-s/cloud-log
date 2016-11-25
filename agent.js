var io = require('socket.io-client');
module.exports = function (tk) {
	var socket = io('http://localhost:3000');
	socket.on('connect', () => {
		socket.emit('auth', tk);
	});
	return {
		log: function () {
			let args = Array.prototype.slice.call(arguments);
			socket.emit('log', {args});
			console.log.apply(console, args);
		}
	}
}