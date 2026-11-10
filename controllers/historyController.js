const db = require('../config/db');
const User = require('../models/userModel');
const History = require('../models/historyModel');

// 1. CHECK-IN: UI sends { "car_number": "KA01MG1234" }
exports.checkInVehicle = async (req, res) => {
  try {
    const { car_number } = req.body;

    if (!car_number) {
      return res.status(400).json({ error: 'car_number is required' });
    }

    // Step A: Find the user_id using the car number
    let user = await User.findByCarNumber(car_number);
    let userId;

    if (!user) {
      // If the car has never parked here before, register it automatically
      userId = await User.create(car_number);
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
    const { car_number } = req.body;

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
    const { car_number } = req.params;

    // Step A: Translate car_number to user_id
    const user = await User.findByCarNumber(car_number);
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
