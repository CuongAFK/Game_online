const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const mapController = require('../controllers/mapController');

// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth);

// Tạo bản đồ mới cho phòng
router.post('/rooms/:roomId/map', mapController.generateMap);

// Lấy bản đồ hiện tại của phòng
router.get('/rooms/:roomId/map', mapController.getMap);

// Cập nhật một ô trên bản đồ
router.patch('/rooms/:roomId/map', mapController.updateMapCell);

// Xóa bản đồ của phòng
router.delete('/rooms/:roomId/map', mapController.deleteMap);

module.exports = router;
