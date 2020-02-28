const mysql = require('mysql');

const pool = mysql.createPool({
  host: 'in-out-tracker-restore.cm7jm7eozp0m.us-west-2.rds.amazonaws.com',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: 3306,
  database: 'tracker',
  acquireTimeout: 30000
});

exports.pool = pool;
