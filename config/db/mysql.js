const mysql = require('mysql');

const pool = mysql.createPool({
  host: 'in-out-tracker.cm7jm7eozp0m.us-west-2.rds.amazonaws.com',
  user: 'admin',
  password: '12345678',
  port: 3306,
  database: 'tracker',
  acquireTimeout: 30000
});

exports.pool = pool;
