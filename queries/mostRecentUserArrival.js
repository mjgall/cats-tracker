const db = require('../config/db/mysql').pool;

module.exports = user_id => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        `SELECT users.first_name, users.last_name, users.id as user_id, MAX(arrivals.timestamp) as most_recent_arrival FROM users INNER JOIN arrivals ON users.id = arrivals.user_id WHERE users.id = ${user_id};`,
        (err, logins, fields) => {
          if (err) {
            reject(err);
          }
          resolve(logins[0]);
        }
      );
      connection.release();
    });
  });
};
