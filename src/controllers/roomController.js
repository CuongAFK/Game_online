const RoomModel = require('../models/roomModel');
const { ObjectId } = require('mongodb');

const createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user._id.toString();

        const room = await RoomModel.createRoom(userId, name);
        
        res.status(201).json({
            message: 'Tạo phòng thành công',
            room: {
                _id: room._id.toString(),
                name: room.name,
                inviteCode: room.inviteCode,
                hostId: room.hostId.toString(),
                players: room.players.map(p => ({
                    ...p,
                    userId: p.userId.toString()
                })),
                status: room.status,
                maxPlayers: room.maxPlayers,
                createdAt: room.createdAt
            }
        });
    } catch (error) {
        console.error('Lỗi tạo phòng:', error);
        res.status(400).json({
            message: error.message || 'Có lỗi xảy ra khi tạo phòng'
        });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.user._id.toString();

        const room = await RoomModel.joinRoom(userId, inviteCode);
        
        res.json({
            message: 'Tham gia phòng thành công',
            room: {
                _id: room._id.toString(),
                name: room.name,
                inviteCode: room.inviteCode,
                hostId: room.hostId.toString(),
                players: room.players.map(p => ({
                    ...p,
                    userId: p.userId.toString()
                })),
                status: room.status,
                maxPlayers: room.maxPlayers,
                createdAt: room.createdAt
            }
        });
    } catch (error) {
        console.error('Lỗi tham gia phòng:', error);
        res.status(400).json({
            message: error.message
        });
    }
};

const leaveRoom = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const result = await RoomModel.leaveRoom(userId);
        
        res.json({
            message: result.message,
            isHost: result.isHost
        });
    } catch (error) {
        console.error('Lỗi rời phòng:', error);
        res.status(400).json({
            message: error.message
        });
    }
};

const getRooms = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await RoomModel.getRooms(page, limit);
        
        res.json({
            message: 'Lấy danh sách phòng thành công',
            rooms: result.rooms.map(room => ({
                _id: room._id.toString(),
                name: room.name,
                inviteCode: room.inviteCode,
                hostId: room.hostId.toString(),
                players: room.players.map(p => ({
                    ...p,
                    userId: p.userId.toString()
                })),
                status: room.status,
                maxPlayers: room.maxPlayers,
                createdAt: room.createdAt
            })),
            pagination: {
                total: result.total,
                currentPage: result.currentPage,
                totalPages: result.totalPages
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách phòng:', error);
        res.status(500).json({
            message: 'Có lỗi xảy ra khi lấy danh sách phòng'
        });
    }
};

const getCurrentRoom = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const room = await RoomModel.getCurrentRoom(userId);

        if (!room) {
            return res.json({
                message: 'Bạn không ở trong phòng nào',
                room: null
            });
        }

        res.json({
            message: 'Lấy thông tin phòng thành công',
            room: {
                _id: room._id.toString(),
                name: room.name,
                inviteCode: room.inviteCode,
                hostId: room.hostId.toString(),
                players: room.players.map(p => ({
                    ...p,
                    userId: p.userId.toString()
                })),
                status: room.status,
                maxPlayers: room.maxPlayers,
                createdAt: room.createdAt
            }
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin phòng:', error);
        res.status(500).json({
            message: 'Có lỗi xảy ra khi lấy thông tin phòng'
        });
    }
};

module.exports = {
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    getCurrentRoom
};
