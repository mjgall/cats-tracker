const db = require('../config/db/mysql').pool;

module.exports = user_id => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        `SELECT user_id, MAX(timestamp) AS most_recent_departure FROM departures WHERE user_id = ${user_id};`,
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



