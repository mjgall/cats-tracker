const db = require('../config/db/mysql').pool;

module.exports = arrival => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        reject(err);
      }
      connection.query(
        `INSERT INTO departures (user_id, timestamp) VALUES (${arrival.user_id}, ${arrival.timestamp + 28800});`,
        (err, results, fields) => {
          if (err) {
            reject(err);
          } else {
            db.getConnection((err, connection) => {
              connection.query(
                `SELECT * FROM departures WHERE id = ${results.insertId}`,
                (err, departures, fields) => {
                  if (err) {
                    reject(err);
                  }
                  resolve(departures[0]);
                }
              );
            });
          }
        }
      );
      connection.release();
    });
  });
};
