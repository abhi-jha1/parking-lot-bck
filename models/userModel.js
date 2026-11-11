const db = require('../config/db');

const User = {
  findByCarNumber: async (carNumber) => {
    const [rows] = await db.query(
      'SELECT id, car_number, password_hash, role, must_change_password FROM users WHERE car_number = ?',
      [carNumber]
    );
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT id, car_number, password_hash, role, must_change_password FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  create: async (carNumber, passwordHash = null, mustChangePassword = false) => {
    const [result] = await db.query(
      'INSERT INTO users (car_number, password_hash, must_change_password) VALUES (?, ?, ?)',
      [carNumber, passwordHash, mustChangePassword]
    );
    return result.insertId;
  },

  updatePassword: async (id, passwordHash) => {
    await db.query(
      'UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?',
      [passwordHash, id]
    );
  }
};

module.exports = User;