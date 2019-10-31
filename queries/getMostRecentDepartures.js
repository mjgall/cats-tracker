const db = require('../config/db/mysql').pool;

module.exports = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(
        `SELECT users.id AS id, users.first_name, users.last_name, users.email, users.photo_url, departures.id as departure_id, departures.timestamp FROM users INNER JOIN departures ON users.id = departures.user_id WHERE (departures.id = (SELECT MAX(id) FROM departures AS status_temp WHERE (user_id = users.id)));`,
        (err, departures, fields) => {
          if (err) {
            reject(err);
          }
          resolve(departures);
        }
      );
      connection.release();
    });
  });
};
