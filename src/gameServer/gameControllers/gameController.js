// Import model để xử lý dữ liệu game
const GameModel = require('../gameModels/gameModel');

class GameController {
    // Lấy trạng thái hiện tại của game
    async getGameStatus(req, res) {
        try {
            const status = await GameModel.getStatus();
            res.json({ success: true, data: status });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Khởi tạo một game mới
    async startGame(req, res) {
        try {
            const newGame = await GameModel.startNew();
            res.json({ success: true, data: newGame });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Xử lý nước đi của người chơi
    async makeMove(req, res) {
        try {
            const { playerId, move } = req.body;
            const result = await GameModel.makeMove(playerId, move);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new GameController();
