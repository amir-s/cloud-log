const app = require('koa')();
const serve = require('koa-static');
const router = require('koa-router')();
const views = require('co-views');
const path = require('path');
const parse = require('koa-body');
const Promise = require('bluebird');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const SQLite3Store = require('koa-sqlite3-session');
const passport = require('koa-passport')
const session = require('koa-generic-session')
const db = require('./db.js');
const l = require('prnt');
const config = require('./config');
const co = require('co');
const nameGen = require('./name-gen');

const server = require('http').Server(app.callback());
const io = require('socket.io')(server);
const render = views(__dirname + '/views', {
  map: { html: 'ejs' }
});

function* requireLogin(next) {
	if (this.req.user === undefined) {
		this.redirect('/auth');
	}else {
		this.user = this.req.user;
		delete this.user._raw;
		yield next;
	}
}

passport.use(new GoogleStrategy({
    clientID:     config.google.oauth2.clientID,
    clientSecret: config.google.oauth2.clientSecret,
    callbackURL: `${config.server.url}/auth/cb/google`,
    passReqToCallback: true
  },
  co.wrap(function*(request, accessToken, refreshToken, profile, done) {
  	l(profile);
  	let user = yield db.findOrCreateUser(profile);
	return done(null, user);
  })
));
// var db = [{
// 	agent: 'agent-bcbe6ce24938bb2141e7e58390acd80a247ffe5e',
// 	admin: 'admin-ee09e3dfec3c22123b7c656d9701ddfda7f0217c',
// 	room: 'room-ce83e5d3644c1f2f87d3d897e431ad224dc4b860'
// }];

Object.defineProperty(db, 'find', {
	enumerable: false,
	writable: false,
	value: function (tk) {
		let type = tk.split('-')[0];
		return this.filter(i => i[type] == tk)[0];
	}
})
router.get('/', function *(next) {
	if (this.req.user) return this.redirect('/app');
	this.body = yield render('index');
});
router.get('/app', requireLogin, function*(next) {
	this.body = yield render('app');
})
router.get('/api/getTokens', requireLogin, function*(next) {
	this.body = yield db.getTokens({user_id: this.user.id});
})
router.get('/api/generateToken', requireLogin, function*(next) {
	let t = {
		user_id: this.user.id,
		name: nameGen(),
		server: 'S'+db.randomToken(),
		admin: 'A'+db.randomToken(),
		room: 'R'+db.randomToken()
	}
	yield db.addToken(t);
	this.body = t;
})
router.post('/api/deleteToken', requireLogin, function*(next) {
	this.request.body.admin = this.request.body.admin || '';
	yield db.deleteToken(this.user.id, this.request.body.admin);
	this.body = {ok: true};
})
router.post('/api/renameToken', requireLogin, function*(next) {
	this.request.body.id = this.request.body.id || -1;
	this.request.body.name = this.request.body.name || '';

	let name = this.request.body.name.trim().substr(0, 32);
	if (name == '') name = 'i-can-not-be-empty';

	yield db.renameToken(this.user.id, this.request.body.id, name);
	this.body = {ok: true};
})
router.get('/auth', function* (next) {
	yield passport.authenticate('google', {
		scope: [ 'https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read']
	}).call(this, next);
});
router.get('/auth/cb/google', function*(next) {

	yield passport.authenticate('google', {
		failureRedirect: '/auth'
	}).call(this, next);

	this.redirect('/app');
});
router.get('/logout', function*(next) {
	this.session = null;
	this.redirect('/')
})
io.on('connection', (socket) => {
	socket.on('auth', co.wrap(function*(data) {
		var creds = yield db.findToken(data.t, data.type);
		if (!creds) return socket.emit('message', {error: 'Auth failed'});
		socket.creds = creds;
		socket.emit('message', {status: 'connected'})
	}));

	socket.on('join', () => {
		if (!socket.creds) return;
		socket.join(socket.creds.room);
	})

	socket.on('log', (data) => {
		if (!socket.creds) return;
		io.sockets.in(socket.creds.room).emit('log', data);
	});
	
})

passport.serializeUser(function(user, done) {
    done(false, user.id); 
});

passport.deserializeUser(co.wrap(function*(id, done) {
	done(false, yield db.getUser({id}));
}));

app.keys = [config.session.secret];

app
	.use(parse())
	.use(session({
		maxAge: 0,
		store: new SQLite3Store('./db/sessions.sqlite', {
			// Options specified here
		})
	}))
	.use(passport.initialize())
	.use(passport.session())
	.use(router.routes())
	.use(router.allowedMethods())
	.use(serve(path.join(__dirname, '/public')))

server.listen(process.env.PORT || 4000, () => console.log("Server started on", process.env.PORT || 4000));
