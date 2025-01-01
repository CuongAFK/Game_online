const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Đăng ký
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Cập nhật avatar (yêu cầu đăng nhập)
router.post('/update-avatar', auth, authController.updateAvatar);

module.exports = router;
