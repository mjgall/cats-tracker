const db = require('../config/db/mysql').pool;

module.exports = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        `SELECT * FROM users`,
        (err, users, fields) => {
          if (err) {
            reject(err);
          };
          resolve(users)
        }
      );
      connection.release();
    });
  }) 
  
}