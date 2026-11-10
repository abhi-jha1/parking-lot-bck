const db = require('../config/db');

const User = {
   // Read operation: Find a vehicle profile by its car registration number
  findByCarNumber: async (carNumber) => {
    const [rows] = await db.query('SELECT * FROM users WHERE car_number = ?', [carNumber]);
    return rows[0]; // Returns the individual record or undefined
  },

    // Create operation: Add a new vehicle profile
    create: async (car_number) => {
        const [rows] = await db.query('INSERT INTO users (car_number) VALUES (?)', [car_number]);
        return rows.insertId; // Returns the ID of the newly created record
    }
};

module.exports = User;