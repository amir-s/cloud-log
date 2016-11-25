const app = require('koa')();
const serve = require('koa-static');
const router = require('koa-router')();
const views = require('co-views');
const path = require('path');
const parse = require('koa-body');
const Promise = require('bluebird');


const server = require('http').Server(app.callback());
const io = require('socket.io')(server);
const render = views(__dirname + '/views', {
  map: { html: 'ejs' }
});



var db = [{
	agent: 'agent-bcbe6ce24938bb2141e7e58390acd80a247ffe5e',
	admin: 'admin-ee09e3dfec3c22123b7c656d9701ddfda7f0217c',
	room: 'room-ce83e5d3644c1f2f87d3d897e431ad224dc4b860'
}];

Object.defineProperty(db, 'find', {
	enumerable: false,
	writable: false,
	value: function (tk) {
		let type = tk.split('-')[0];
		return this.filter(i => i[type] == tk)[0];
	}
})
router.get('/', function *(next) {
	this.body = yield render('index');
});

io.on('connection', (socket) => {
	socket.on('auth', (tk) => {
		var creds = db.find(tk);
		if (!creds) return socket.emit('message', {error: 'Auth failed'});
		socket.creds = creds;
		socket.type = tk.split('-')[0];
		socket.emit('message', {status: 'connected'})
	});

	socket.on('join', () => {
		if (!socket.creds) return;
		socket.join(socket.creds.room);
	})

	socket.on('log', (data) => {
		if (!socket.creds) return;
		io.sockets.in(socket.creds.room).emit('log', data);
	});
	
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(serve(path.join(__dirname, '/public')))

server.listen(process.env.PORT || 3000, () => console.log("Server started on", process.env.PORT || 3000));
