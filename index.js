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

const server = require('http').Server(app.callback());
const io = require('socket.io')(server);
const render = views(__dirname + '/views', {
  map: { html: 'ejs' }
});

function* requireLogin(next) {
	if (this.req.user === undefined) {
		this.redirect('/auth');
	}else {
		yield next;
	}
}
passport.use(new GoogleStrategy({
    clientID:     config.google.oauth2.clientID,
    clientSecret: config.google.oauth2.clientSecret,
    callbackURL: "http://localhost:4000/auth/cb/google",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
  	l(profile);
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(null, profile);
    // });
  }
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
	// this.redirect('/auth')
	this.body = yield render('index');
});
router.get('/s', requireLogin, function*(next) {
	this.body = 'hi';
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

	this.redirect('/');
});
router.get('/logout', function*(next) {
	this.session = null;
	this.redirect('/')
})
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

let mem = {};
passport.serializeUser(function(user, done) {
	l('here', user.id)
	mem[user.id] = user;
    done(false, user.id); 
});

passport.deserializeUser(function(id, done) {
	l(id);
    done(false, mem[id]);
});

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
	.use(passport.session({
		maxAge: 0
	}))
	.use(router.routes())
	.use(router.allowedMethods())
	.use(serve(path.join(__dirname, '/public')))

server.listen(process.env.PORT || 4000, () => console.log("Server started on", process.env.PORT || 4000));
