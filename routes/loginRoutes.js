const express = require('express');
const loginController = require('../controllers/loginController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginController.loginUser);
router.post('/change-password', authMiddleware, loginController.changePassword);
router.post('/logout', loginController.logoutUser);

module.exports = router;