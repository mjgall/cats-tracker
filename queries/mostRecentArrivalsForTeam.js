const db = require('../config/db/mysql').pool;

module.exports = user_id => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        //need query to get all users and their most recent arrival,
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
