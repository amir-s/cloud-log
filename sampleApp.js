var console = require('./agent')('server-6b52873d122a0596a5233887cd46b6f3c1eef5d6');

setInterval(() => {
	console.log(Math.random(), {ok: true}, ['a','b','c']);
}, 1500);