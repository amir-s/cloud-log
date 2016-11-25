var console = require('./agent')('agent-bcbe6ce24938bb2141e7e58390acd80a247ffe5e');

setInterval(() => {
	console.log(Math.random(), {ok: true}, ['a','b','c']);
}, 1500);