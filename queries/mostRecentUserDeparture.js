const db = require('../config/db/mysql').pool;

module.exports = user_id => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        `SELECT users.first_name, users.last_name, users.id as user_id, departures.timestamp as most_recent_departure FROM users INNER JOIN departures ON users.id = departures.user_id WHERE users.id = ${user_id};`,
        (err, departures, fields) => {
          if (err) {
            reject(err);
          }
          resolve(departures[0]);
        }
      );
      connection.release();
    });
  });
};
