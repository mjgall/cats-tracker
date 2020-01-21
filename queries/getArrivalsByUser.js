const db = require('../config/db/mysql').pool;

module.exports = userId => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        `SELECT timestamp FROM tracker.arrivals WHERE user_id = ${userId};`,
        (err, arrivals, fields) => {
          if (err) {
            reject(err);
          }
          resolve(arrivals);
        }
      );
      connection.release();
    });
  });
};
