const { ObjectId } = require('mongodb');
const database = require('../config/db');
const crypto = require('crypto');

class RoomModel {
    static async createRoom(hostId, roomName, maxPlayers = 4) {
        const db = await database.getDb();
        
        // Kiểm tra xem người chơi đã có phòng chưa
        const existingRoom = await db.collection('rooms').findOne({
            $or: [
                { hostId: new ObjectId(hostId) },
                { 'players.userId': new ObjectId(hostId) }
            ]
        });

        if (existingRoom) {
            throw new Error('Bạn đã có phòng hoặc đang trong một phòng khác');
        }

        // Lấy thông tin người tạo phòng
        const host = await db.collection('users').findOne({ 
            _id: new ObjectId(hostId) 
        });

        const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        
        const room = {
            hostId: new ObjectId(hostId),
            name: roomName,
            inviteCode,
            players: [{ 
                userId: new ObjectId(hostId),
                username: host.username,
                avatarUrl: host.avatarUrl,
                role: 'host',
                joinedAt: new Date()
            }],
            status: 'waiting',
            createdAt: new Date(),
            updatedAt: new Date(),
            maxPlayers: parseInt(maxPlayers)
        };

        const result = await db.collection('rooms').insertOne(room);
        return { ...room, _id: result.insertedId };
    }

    static async joinRoom(userId, inviteCode) {
        const db = await database.getDb();
        
        // Kiểm tra xem người chơi đã có phòng chưa
        const existingRoom = await db.collection('rooms').findOne({
            $or: [
                { hostId: new ObjectId(userId) },
                { 'players.userId': new ObjectId(userId) }
            ]
        });

        if (existingRoom) {
            throw new Error('Bạn đã có phòng hoặc đang trong một phòng khác');
        }

        // Tìm phòng theo mã mời
        const room = await db.collection('rooms').findOne({ 
            inviteCode: inviteCode.toUpperCase(),
            status: 'waiting'
        });

        if (!room) {
            throw new Error('Phòng không tồn tại hoặc đã đầy');
        }

        if (room.players.length >= room.maxPlayers) {
            throw new Error('Phòng đã đầy');
        }

        // Lấy thông tin người tham gia
        const user = await db.collection('users').findOne({ 
            _id: new ObjectId(userId) 
        });

        // Thêm người chơi vào phòng
        await db.collection('rooms').updateOne(
            { _id: room._id },
            { 
                $push: { 
                    players: {
                        userId: new ObjectId(userId),
                        username: user.username,
                        avatarUrl: user.avatarUrl,
                        role: 'player',
                        joinedAt: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            }
        );

        // Trả về thông tin phòng đã cập nhật
        return await db.collection('rooms').findOne({ _id: room._id });
    }

    static async leaveRoom(userId) {
        const db = await database.getDb();
        
        // Tìm phòng của người chơi
        const room = await db.collection('rooms').findOne({
            $or: [
                { hostId: new ObjectId(userId) },
                { 'players.userId': new ObjectId(userId) }
            ]
        });

        if (!room) {
            throw new Error('Bạn không ở trong phòng nào');
        }

        // Kiểm tra xem người chơi có phải là host không
        const isHost = room.hostId.toString() === userId.toString();
        
        if (isHost) {
            // Nếu là host, xóa phòng
            const result = await db.collection('rooms').deleteOne({ 
                _id: room._id 
            });

            if (result.deletedCount === 0) {
                throw new Error('Không thể xóa phòng');
            }

            return { message: 'Đã xóa phòng', isHost: true };
        } else {
            // Nếu là player, chỉ rời khỏi phòng
            const result = await db.collection('rooms').updateOne(
                { _id: room._id },
                { 
                    $pull: { 
                        players: { userId: new ObjectId(userId) }
                    },
                    $set: { updatedAt: new Date() }
                }
            );

            if (result.modifiedCount === 0) {
                throw new Error('Không thể rời khỏi phòng');
            }

            return { message: 'Đã rời phòng', isHost: false };
        }
    }

    static async getRooms(page = 1, limit = 10) {
        const db = await database.getDb();
        
        const rooms = await db.collection('rooms')
            .find({ status: 'waiting' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        const total = await db.collection('rooms').countDocuments({ 
            status: 'waiting'
        });

        return {
            rooms,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        };
    }

    static async getCurrentRoom(userId) {
        const db = await database.getDb();
        return await db.collection('rooms').findOne({
            $or: [
                { hostId: new ObjectId(userId) },
                { 'players.userId': new ObjectId(userId) }
            ]
        });
    }

    static async kickMember(hostId, roomId, userId) {
        const db = await database.getDb();
        
        console.log('Kicking member with data:', { hostId, roomId, userId });
        
        // Kiểm tra xem phòng có tồn tại không và người kick có phải là chủ phòng không
        const room = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId),
            hostId: new ObjectId(hostId)
        });

        console.log('Found room:', room);

        if (!room) {
            throw new Error('Không tìm thấy phòng hoặc bạn không phải chủ phòng');
        }

        // Kiểm tra xem người bị kick có trong phòng không
        const memberExists = room.players.some(p => p.userId.toString() === userId);
        console.log('Member exists:', memberExists);

        if (!memberExists) {
            throw new Error('Thành viên không có trong phòng');
        }

        // Không cho phép chủ phòng tự kick mình
        if (userId === hostId) {
            throw new Error('Không thể kick chủ phòng');
        }

        // Kick thành viên
        const result = await db.collection('rooms').findOneAndUpdate(
            { _id: new ObjectId(roomId) },
            { 
                $pull: { 
                    players: { userId: new ObjectId(userId) }
                }
            },
            { 
                returnDocument: 'after'  // MongoDB 4.2+
            }
        );

        console.log('Update result:', result);
        
        // Nếu không có result.value, thử lấy result
        const updatedRoom = result.value || result;
        if (!updatedRoom) {
            throw new Error('Không thể cập nhật phòng');
        }

        return updatedRoom;
    }
}

module.exports = RoomModel;
