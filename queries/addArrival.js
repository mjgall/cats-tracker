const db = require('../config/db/mysql').pool;

module.exports = user => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        reject(err);
      }
      connection.query(
        `INSERT INTO arrivals (user_id, timestamp) VALUES (${user.id}, UNIX_TIMESTAMP());`,
        (err, results, fields) => {
          if (err) {
            reject(err);
          } else {
            db.getConnection((err, connection) => {
              connection.query(
                `SELECT * FROM arrivals WHERE id = ${results.insertId}`,
                (err, arrivals, fields) => {
                  if (err) {
                    console.log(err);
                    reject(err);
                  }
                  resolve(arrivals[0]);
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
