const db = require('../config/db');

const History = {
  // Create a check-in record (Uses user_id as the relational key link)
  createCheckIn: async (userId) => {
    const [result] = await db.query(
      'INSERT INTO history (user_id, check_in) VALUES (?, NOW())',
      [userId]
    );
    return result.insertId;
  },

  // Update check-out by target user_id link
  processCheckOut: async (userId) => {
    const [result] = await db.query(
      'UPDATE history SET check_out = NOW() WHERE user_id = ? AND check_out IS NULL',
      [userId]
    );
    return result.affectedRows > 0;
  },
  
 // Read operation: Get all history records for a specific user
  getHistoryByUserId: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM history WHERE user_id = ? ORDER BY check_in DESC',
      [userId]
    );
    return rows;
  }
};

module.exports = History;
