const db = require('../config/db/mysql').pool;

module.exports = (id) => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        `SELECT * FROM users WHERE google_id = '${id}'`,
        (err, users, fields) => {
          if (err) {
            reject(err);
          };
          resolve(users[0])
        }
      );
      connection.release();
    });
  }) 
  
}