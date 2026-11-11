const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const requirePasswordChanged = require('../middleware/requirePasswordChanged');
const parkingController = require('../controllers/parkingController');

router.use(authMiddleware, requirePasswordChanged);

// Route for checking in a vehicle (POST /api/parking/checkin)
router.post('/checkin', requireAdmin, parkingController.checkInVehicle);

// Route for checking out a vehicle (POST /api/parking/checkout)
router.post('/checkout', requireAdmin, parkingController.checkOutVehicle);

// Route for getting history by car number (GET /api/parking/history/:car_number)
router.get('/history/:car_number', parkingController.getVehicleHistory);

module.exports = router;
