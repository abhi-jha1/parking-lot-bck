const db = require('../config/db');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const History = require('../models/historyModel');

const PASSWORD_ROUNDS = 12;

// 1. CHECK-IN: UI sends { "car_number": "KA01MG1234" }
exports.checkInVehicle = async (req, res) => {
  try {
    const rawCarNumber = req.body?.car_number;
    const car_number = typeof rawCarNumber === 'string'
      ? rawCarNumber.trim().toUpperCase()
      : '';

    if (!car_number) {
      return res.status(400).json({ error: 'car_number is required' });
    }

    // Step A: Find the user_id using the car number
    let user = await User.findByCarNumber(car_number);
    let userId;

    if (!user) {
      const temporaryPasswordHash = await bcrypt.hash(car_number, PASSWORD_ROUNDS);
      userId = await User.create(car_number, temporaryPasswordHash, true);
    } else {
      userId = user.id;

      // Optional: Safety check to see if they are already parked inside
      const [existingActive] = await db.query(
        'SELECT * FROM history WHERE user_id = ? AND check_out IS NULL', 
        [userId]
      );
      if (existingActive.length > 0) {
        return res.status(400).json({ error: 'Vehicle is already checked in.' });
      }
    }

    // Step B: Pass the translated userId into your History model
    const sessionId = await History.createCheckIn(userId);

    res.status(201).json({
      message: 'Vehicle checked in successfully',
      car_number,
      session_id: sessionId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. CHECK-OUT: UI sends { "car_number": "KA01MG1234" }
exports.checkOutVehicle = async (req, res) => {
  try {
    const { car_number } = req.body ?? {};

    if (!car_number) {
      return res.status(400).json({ error: 'car_number is required' });
    }

    // Step A: Translate car_number to user_id
    const user = await User.findByCarNumber(car_number);
    if (!user) {
      return res.status(404).json({ error: 'Vehicle record not found' });
    }

    // Step B: Pass the user.id to your history update method
    const wasUpdated = await History.processCheckOut(user.id);

    if (!wasUpdated) {
      return res.status(400).json({ error: 'No active parking session found for this vehicle.' });
    }

    res.status(200).json({ message: 'Vehicle checked out successfully', car_number });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. FETCH HISTORY FOR UI: UI requests via URL parameter (e.g., /api/parking/history/KA01MG1234)
exports.getVehicleHistory = async (req, res) => {
  try {
    const car_number = typeof req.params.car_number === 'string'
      ? req.params.car_number.trim().toUpperCase()
      : '';

    if (!car_number) {
      return res.status(400).json({ error: 'car_number is required' });
    }

    let user;
    if (req.user.role === 'admin') {
      user = await User.findByCarNumber(car_number);
    } else {
      user = await User.findById(req.user.sub);
      if (!user) {
        return res.status(401).json({ error: 'Authenticated account no longer exists' });
      }

      if (user.car_number !== car_number) {
        return res.status(403).json({ error: 'You can only view your own parking history' });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'No history found for this vehicle registration.' });
    }

    // Step B: Pass user.id to get the history rows
    const logs = await History.getHistoryByUserId(user.id);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
