// Import thư viện và controller
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Định nghĩa các routes cho game
// Lấy trạng thái hiện tại của game
router.get('/status', gameController.getGameStatus);
// Bắt đầu game mới
router.post('/start', gameController.startGame);
// Thực hiện nước đi trong game
router.post('/move', gameController.makeMove);

module.exports = router;
