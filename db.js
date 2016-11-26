const fs = require('fs-promise');
const co = require('co');
const l = require('prnt');
const sha1 = require('sha1');

const knex = require('knex')({
	client: 'sqlite3',
	connection: {
		filename: "./db/db.sqlite"
	},
	useNullAsDefault: true
});

co(function*() {
	let init = yield fs.exists('./db/init');
	if (!init){
		yield knex.schema.createTable('users', function (table) {
			table.string('id').primary();
			table.string('first_name');
			table.string('last_name');
			table.string('email');
			table.string('raw');
		});
		yield knex.schema.createTable('tokens', function (table) {
			table.increments('id').primary();
			table.string('user_id');
			table.string('server').unique();
			table.string('admin').unique();
			table.string('room').unique();
		});
		yield fs.writeFile('./db/init', '1');
	}
}).catch(console.log);


module.exports = {
	findOrCreateUser: function*(user) {
		let rows = yield knex('users').where('id', user.id);
		if (rows.length == 1) return rows[0];
		let obj = {
			id: user.id,
			first_name: user.name.givenName,
			last_name: user.name.familyName,
			email: user.emails[0].value,
			raw: user._raw
		}
		yield knex('users').insert(obj);
		return obj;
	},
	getUser: function*(user) {
		let rows = yield knex('users').where('id', user.id);
		if (rows.length == 1) return rows[0];
		return null;
	},
	randomToken: function() {
		return sha1('cloud.log-' + (Math.random()*10000+Math.random()*200) + '@' + Math.random()*10000 + ' ' + new Date().getTime());
	},
	addToken: function*(t) {
		yield knex('tokens').insert(t);
	},
	getTokens: function*(props) {
		let rows = yield knex('tokens').where(props);
		return rows;
	},
	deleteToken: function*(user_id, admin) {
		yield knex('tokens').delete().where({
			user_id,
			admin
		});
	},
	findToken: function*(t, type) {
		if (['admin', 'server'].indexOf(type) == -1) return;
		let creds = yield knex('tokens').where({
			[type]: t
		});
		return creds[0];
	}
}