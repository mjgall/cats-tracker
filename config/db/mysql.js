const mysql = require('mysql');

const pool = mysql.createPool({
  host: 'in-out-tracker-restore.cm7jm7eozp0m.us-west-2.rds.amazonaws.com',
  user: 'admin',
  password: 'inouttracker',
  port: 3306,
  database: 'tracker',
  acquireTimeout: 30000
});

exports.pool = pool;
