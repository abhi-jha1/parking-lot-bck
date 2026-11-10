const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/historyController');

// Route for checking in a vehicle (POST /api/parking/checkin)
router.post('/checkin', parkingController.checkInVehicle);

// Route for checking out a vehicle (POST /api/parking/checkout)
router.post('/checkout', parkingController.checkOutVehicle);

// Route for getting history by car number (GET /api/parking/history/:car_number)
router.get('/history/:car_number', parkingController.getVehicleHistory);

module.exports = router;
