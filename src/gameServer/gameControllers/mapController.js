const MapModel = require('../gameModels/mapModel');
const RoomModel = require('../models/roomModel');

class MapController {
    // Tạo bản đồ mới cho phòng
    async generateMap(req, res) {
        try {
            const { roomId } = req.params;
            
            // Lấy thông tin phòng
            const room = await RoomModel.getRoomById(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Phòng không tồn tại' });
            }

            // Tạo cấu hình cho từng người chơi
            const playerConfigs = room.players.map(player => ({
                playerId: player.userId.toString(),
                civilization: player.civilization,
                isCurrentPlayer: player.userId.toString() === req.user._id.toString()
            }));

            // Tạo bản đồ mới
            const map = await MapModel.generateMap(room.players.length, playerConfigs);
            
            // Lưu bản đồ
            await MapModel.saveMap(roomId, map);

            res.json({ message: 'Đã tạo bản đồ mới', map });
        } catch (error) {
            console.error('Lỗi khi tạo bản đồ:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Lấy bản đồ hiện tại của phòng
    async getMap(req, res) {
        try {
            const { roomId } = req.params;
            const map = await MapModel.getMap(roomId);
            
            if (!map) {
                return res.status(404).json({ message: 'Không tìm thấy bản đồ' });
            }

            res.json({ map });
        } catch (error) {
            console.error('Lỗi khi lấy bản đồ:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Cập nhật một ô trên bản đồ
    async updateMapCell(req, res) {
        try {
            const { roomId } = req.params;
            const { row, col, updates } = req.body;

            // Kiểm tra tính hợp lệ của vị trí
            if (!Number.isInteger(row) || !Number.isInteger(col)) {
                return res.status(400).json({ message: 'Vị trí không hợp lệ' });
            }

            // Cập nhật ô
            await MapModel.updateMapCell(roomId, row, col, updates);

            // Lấy bản đồ mới nhất
            const updatedMap = await MapModel.getMap(roomId);

            // Emit sự kiện cập nhật map
            req.app.get('io').to(roomId).emit('map:updated', {
                map: updatedMap,
                updatedCell: { row, col, ...updates }
            });

            res.json({ message: 'Đã cập nhật ô', map: updatedMap });
        } catch (error) {
            console.error('Lỗi khi cập nhật ô:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Xóa bản đồ của phòng
    async deleteMap(req, res) {
        try {
            const { roomId } = req.params;
            await MapModel.deleteMap(roomId);
            res.json({ message: 'Đã xóa bản đồ' });
        } catch (error) {
            console.error('Lỗi khi xóa bản đồ:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new MapController();
