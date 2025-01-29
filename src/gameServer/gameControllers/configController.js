const RoomModel = require('../../models/roomModel');

class ConfigController {
    // Lấy danh sách văn minh có sẵn
    async getCivilizations(req, res) {
        try {
            res.json({ civilizations: RoomModel.CIVILIZATIONS });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách văn minh:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Lấy danh sách màu có sẵn
    async getColors(req, res) {
        try {
            res.json({ colors: RoomModel.COLORS });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách màu:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Cập nhật cấu hình người chơi
    async updateConfig(req, res) {
        try {
            const { roomId } = req.params;
            const { civilization, color } = req.body;
            const userId = req.user._id;

            const updatedRoom = await RoomModel.updatePlayerConfig(roomId, userId, civilization, color);

            // Emit sự kiện cập nhật cấu hình
            req.app.get('io').to(roomId).emit('room:playerConfigUpdated', {
                roomId,
                userId: userId.toString(),
                civilization,
                color
            });

            res.json({ 
                message: 'Đã cập nhật cấu hình',
                room: updatedRoom
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật cấu hình:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Lấy cấu hình hiện tại của người chơi
    async getCurrentConfig(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user._id;

            const room = await RoomModel.getRoomById(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Phòng không tồn tại' });
            }

            const player = room.players.find(p => p.userId.toString() === userId.toString());
            if (!player) {
                return res.status(404).json({ message: 'Không tìm thấy thông tin người chơi' });
            }

            res.json({
                civilization: player.civilization,
                color: player.color,
                configuredAt: player.configuredAt
            });
        } catch (error) {
            console.error('Lỗi khi lấy cấu hình hiện tại:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Lấy cấu hình của tất cả người chơi trong phòng
    async getRoomConfigs(req, res) {
        try {
            const { roomId } = req.params;

            const room = await RoomModel.getRoomById(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Phòng không tồn tại' });
            }

            const configs = room.players.map(player => ({
                userId: player.userId,
                username: player.username,
                civilization: player.civilization,
                color: player.color,
                isReady: player.isReady,
                configuredAt: player.configuredAt
            }));

            res.json({ configs });
        } catch (error) {
            console.error('Lỗi khi lấy cấu hình phòng:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new ConfigController();
