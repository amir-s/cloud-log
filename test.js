var console1 = require('./agent')({
	token: 'Sd41f8ce64e52c0b52160e7de1fea45190bf3d9db',
	server: require('./config').server.url
});
var console2 = require('./agent')({
	token: 'S957b807696cbbb87f403fd493f38676178bafd5a',
	server: require('./config').server.url
});

setInterval(() => {
	console1.log(Math.random(), {ok: true}, ['a','b','c']);
	console2.log(Math.random(), {ok: false}, ['a','b','c']);
}, 1500);