const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const configController = require('../gameControllers/configController');

// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth);

// Lấy danh sách văn minh có sẵn
router.get('/civilizations', configController.getCivilizations);

// Lấy danh sách màu có sẵn
router.get('/colors', configController.getColors);

// Lấy cấu hình hiện tại của người chơi
router.get('/:roomId/config', configController.getCurrentConfig);

// Lấy cấu hình của tất cả người chơi trong phòng
router.get('/:roomId/configs', configController.getRoomConfigs);

// Cập nhật cấu hình người chơi
router.patch('/:roomId/config', configController.updateConfig);

module.exports = router;
