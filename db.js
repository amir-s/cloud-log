const fs = require('fs-promise');
const co = require('co');
const l = require('prnt');
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