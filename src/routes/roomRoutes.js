const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    getCurrentRoom,
    kickMember
} = require('../controllers/roomController');

// Áp dụng middleware xác thực cho tất cả các routes
router.use(auth);

// Lấy danh sách phòng
router.get('/', getRooms);

// Lấy thông tin phòng hiện tại
router.get('/current', getCurrentRoom);

// Tạo phòng mới
router.post('/', createRoom);

// Tham gia phòng bằng mã mời
router.post('/join', joinRoom);

// Rời khỏi phòng
router.post('/leave', leaveRoom);

// Kick thành viên
router.post('/kick', kickMember);

module.exports = router;
