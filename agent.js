var io = require('socket.io-client');
module.exports = function (tk) {
	var socket = io('http://localhost:3000');
	socket.on('connect', () => {
		socket.emit('auth', tk);
	});
	return {
		log: function (msg) {
			socket.emit('log', msg);
			console.log(msg);
		}
	}
}