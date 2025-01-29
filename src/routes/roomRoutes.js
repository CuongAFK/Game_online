const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RoomModel = require('../models/roomModel');
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
router.post('/', auth, async (req, res) => {
    try {
        const { name, maxPlayers } = req.body;
        const userId = req.user._id;

        const room = await RoomModel.createRoom(userId, name, maxPlayers);
        
        // Emit sự kiện tạo phòng mới
        req.app.get('io').emit('room:created', {
            roomId: room._id.toString(),
            roomName: room.name,
            hostId: userId.toString(),
            hostName: req.user.username
        });

        res.json(room);
    } catch (error) {
        console.error('Lỗi khi tạo phòng:', error);
        res.status(500).json({ message: error.message });
    }
});

// Tham gia phòng
router.post('/join', auth, async (req, res) => {
    try {
        const { inviteCode, roomId } = req.body;
        const userId = req.user._id;
        let room;

        if (inviteCode) {
            // Tham gia bằng mã mời
            room = await RoomModel.joinRoom(userId, inviteCode);
        } else if (roomId) {
            // Tham gia bằng ID phòng
            room = await RoomModel.joinRoomById(userId, roomId);
        } else {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã mời hoặc ID phòng' });
        }
        
        // Emit sự kiện người chơi tham gia
        req.app.get('io').emit('room:player_joined', {
            userId: userId.toString(),
            username: req.user.username,
            roomId: room._id.toString(),
            roomName: room.name
        });

        res.json(room);
    } catch (error) {
        console.error('Lỗi khi tham gia phòng:', error);
        res.status(500).json({ message: error.message });
    }
});

// Rời phòng
router.post('/leave', leaveRoom);

// Kick thành viên
router.post('/kick', auth, async (req, res) => {
    try {
        const { roomId, userId: kickedUserId } = req.body;
        const hostId = req.user._id;

        const room = await RoomModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Phòng không tồn tại' });
        }

        const kickedUser = room.players.find(p => p.userId === kickedUserId);
        if (!kickedUser) {
            return res.status(404).json({ message: 'Không tìm thấy người chơi' });
        }

        await RoomModel.kickMember(roomId, hostId, kickedUserId);
        
        // Emit sự kiện người chơi bị kick
        req.app.get('io').emit('room:player_left', {
            userId: kickedUserId,
            username: kickedUser.username,
            roomId,
            roomName: room.name,
            kicked: true
        });
        // Emit sự kiện cập nhật phòng
        req.app.get('io').emit('room:updated');

        res.json({ message: 'Đã kick thành viên' });
    } catch (error) {
        console.error('Lỗi khi kick thành viên:', error);
        res.status(500).json({ message: error.message });
    }
});

// Thêm bot
router.post('/add-bot', auth, async (req, res) => {
    try {
        const { roomId } = req.body;
        const hostId = req.user._id;

        const room = await RoomModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Phòng không tồn tại' });
        }

        await RoomModel.addBot(roomId, hostId);
        
        // Emit sự kiện thêm bot
        req.app.get('io').emit('room:bot_added', {
            roomId,
            roomName: room.name,
            hostId: hostId.toString(),
            hostName: req.user.username
        });

        res.json({ message: 'Đã thêm bot' });
    } catch (error) {
        console.error('Lỗi khi thêm bot:', error);
        res.status(500).json({ message: error.message });
    }
});

// Lấy thông tin một phòng cụ thể
router.get('/:roomId', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await RoomModel.getRoomById(roomId);
        
        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng' });
        }

        res.json(room);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin phòng:', error);
        res.status(500).json({ message: error.message });
    }
});

// Xóa phòng
router.delete('/:roomId', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await RoomModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Phòng không tồn tại' });
        }

        // Kiểm tra xem người xóa có phải là chủ phòng không
        if (room.hostId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa phòng này' });
        }

        await RoomModel.deleteRoom(roomId);
        
        // Emit sự kiện xóa phòng
        req.app.get('io').emit('room:deleted', {
            roomId,
            roomName: room.name,
            hostId: userId.toString(),
            hostName: req.user.username
        });

        res.json({ message: 'Đã xóa phòng' });
    } catch (error) {
        console.error('Lỗi khi xóa phòng:', error);
        res.status(500).json({ message: error.message });
    }
});

// Bắt đầu game (chuyển sang trang cấu hình)
router.post('/:roomId/start', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const success = await RoomModel.startGame(roomId, userId);
        
        if (success) {
            res.json({ message: 'Đã bắt đầu game' });
        } else {
            res.status(400).json({ message: 'Không thể bắt đầu game' });
        }
    } catch (error) {
        console.error('Lỗi khi bắt đầu game:', error);
        res.status(500).json({ message: error.message });
    }
});

// Cập nhật cấu hình người chơi
router.post('/:roomId/config', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { civilization, color } = req.body;
        const userId = req.user._id;

        const updated = await RoomModel.updatePlayerConfig(roomId, userId, civilization, color);
        if (!updated) {
            return res.status(400).json({ message: 'Không thể cập nhật cấu hình' });
        }

        // Lấy thông tin phòng mới nhất
        const updatedRoom = await RoomModel.getRoomById(roomId);
        
        // Emit sự kiện cập nhật phòng
        req.app.get('io').to(roomId).emit('room:updated', updatedRoom);

        res.json({ message: 'Đã cập nhật cấu hình' });
    } catch (error) {
        console.error('Lỗi khi cập nhật cấu hình:', error);
        res.status(500).json({ message: error.message });
    }
});

// Đánh dấu người chơi đã sẵn sàng
router.post('/:roomId/ready', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        console.log('\n========== PLAYER READY REQUEST ==========');
        console.log('Room ID:', roomId);
        console.log('User ID:', userId);

        // Lấy thông tin phòng trước khi cập nhật
        const beforeRoom = await RoomModel.getRoomById(roomId);
        console.log('\nRoom state before update:');
        console.log('Players:', beforeRoom.players.map(p => ({
            name: p.name,
            isBot: p.isBot,
            civilization: p.civilization,
            color: p.color,
            isReady: p.isReady
        })));

        const result = await RoomModel.setPlayerReady(roomId, userId);
        console.log('\nSet player ready result:', result);

        if (!result.success) {
            console.log('Failed to set player ready');
            return res.status(400).json({ message: 'Không thể đánh dấu sẵn sàng' });
        }

        // Lấy thông tin phòng mới nhất
        const updatedRoom = await RoomModel.getRoomById(roomId);
        console.log('\nRoom state after update:');
        console.log('Players:', updatedRoom.players.map(p => ({
            name: p.name,
            isBot: p.isBot,
            civilization: p.civilization,
            color: p.color,
            isReady: p.isReady
        })));
        
        // Emit sự kiện cập nhật phòng
        console.log('\nEmitting room:updated event');
        req.app.get('io').to(roomId).emit('room:updated', updatedRoom);

        // Nếu tất cả đã sẵn sàng, emit thêm sự kiện all_ready
        if (result.allReady) {
            console.log('\nAll players ready, emitting room:all_ready event');
            req.app.get('io').to(roomId).emit('room:all_ready', {
                roomId,
                roomName: updatedRoom.name
            });
        }

        console.log('\nSending response:', { 
            message: 'Đã đánh dấu sẵn sàng',
            allReady: result.allReady
        });
        console.log('=========================================\n');

        res.json({ 
            message: 'Đã đánh dấu sẵn sàng',
            allReady: result.allReady
        });
    } catch (error) {
        console.error('\nError in player ready route:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: error.message });
    }
});

// Hủy sẵn sàng
router.post('/:roomId/cancel-ready', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const updatedRoom = await RoomModel.cancelPlayerReady(roomId, userId);
        
        // Emit sự kiện cập nhật phòng
        req.app.get('io').to(roomId).emit('room:updated', updatedRoom);

        res.json({ message: 'Đã hủy sẵn sàng', room: updatedRoom });
    } catch (error) {
        console.error('Lỗi khi hủy sẵn sàng:', error);
        res.status(500).json({ message: error.message });
    }
});

// Rời phòng
router.post('/:roomId/leave', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await RoomModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Phòng không tồn tại' });
        }

        // Nếu là host, xóa phòng
        if (room.hostId === userId.toString()) {
            await RoomModel.deleteRoom(roomId);
            // Emit sự kiện phòng bị xóa
            req.app.get('io').emit('room:deleted', {
                roomId,
                roomName: room.name,
                hostId: userId.toString(),
                hostName: req.user.username
            });
        } else {
            // Nếu là người chơi thường, xóa khỏi mảng players
            await RoomModel.removePlayer(roomId, userId);
            // Emit sự kiện người chơi rời phòng
            req.app.get('io').emit('room:player_left', {
                userId: userId.toString(),
                username: req.user.username,
                roomId,
                roomName: room.name,
                kicked: false
            });
            // Emit sự kiện cập nhật phòng
            req.app.get('io').emit('room:updated');
        }

        res.json({ message: 'Đã rời phòng' });
    } catch (error) {
        console.error('Lỗi khi rời phòng:', error);
        res.status(500).json({ message: error.message });
    }
});

// Dừng game và quay về phòng chờ
router.post('/:roomId/stop-game', auth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        console.log('\n========== STOP GAME REQUEST ==========');
        console.log('Room ID:', roomId);
        console.log('User ID:', userId);

        // Kiểm tra người dùng có phải chủ phòng không
        const room = await RoomModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Phòng không tồn tại' });
        }

        if (room.hostId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Chỉ chủ phòng mới có thể dừng game' });
        }

        // Reset trạng thái phòng
        const result = await RoomModel.resetRoom(roomId);
        if (!result) {
            return res.status(400).json({ message: 'Không thể dừng game' });
        }

        // Lấy thông tin phòng mới
        const updatedRoom = await RoomModel.getRoomById(roomId);
        
        // Thông báo cho tất cả người chơi
        req.app.get('io').to(roomId).emit('room:game_stopped', {
            roomId,
            roomName: updatedRoom.name
        });

        // Gửi thông tin phòng mới
        req.app.get('io').to(roomId).emit('room:updated', updatedRoom);

        console.log('Game stopped successfully');
        console.log('=======================================\n');

        res.json({ message: 'Đã dừng game' });
    } catch (error) {
        console.error('Error stopping game:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
