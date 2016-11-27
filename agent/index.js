var io = require('socket.io-client');
module.exports = function (opts) {
	if (typeof opts === 'string') {
		opts = {
			token: opts
		}
	}
	
	opts.server = opts.server || 'https://cloudlog.me';

	var socket = io(opts.server);
	socket.on('connect', () => {
		socket.emit('auth', {t: opts.token, type: 'server'});
	});
	return {
		log: function () {
			let args = Array.prototype.slice.call(arguments);
			socket.emit('log', {args});
			console.log.apply(console, args);
		}
	}
}