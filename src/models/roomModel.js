const { ObjectId } = require('mongodb');
const database = require('../config/db');
const crypto = require('crypto');
const BotModel = require('../gameServer/gameModels/botModel');

class RoomModel {
    // Danh sách văn minh có sẵn
    static CIVILIZATIONS = [
        { 
            id: 'knight', 
            name: 'Kỵ Sĩ', 
            icon: '⚔️',
            description: 'Phe hiệp sĩ với sức mạnh phòng thủ vững chắc',
            houseImage: '/build/ky-si_lv3.png'
        },
        { 
            id: 'traveler', 
            name: 'Linh Mục', 
            icon: '🏹',
            description: 'Phe du hành với khả năng di chuyển linh hoạt',
            houseImage: '/build/linh-muc_lv3.png'
        },
        { 
            id: 'devil', 
            name: 'Ác Quỷ', 
            icon: '👿',
            description: 'Phe ác quỷ với sức mạnh tấn công hủy diệt',
            houseImage: '/build/ac-quy_lv3.png'
        }
    ];

    // Danh sách màu có sẵn
    static COLORS = [
        { id: 'red', name: 'Đỏ', value: '#FF0000' },
        { id: 'blue', name: 'Xanh dương', value: '#0000FF' },
        { id: 'green', name: 'Xanh lá', value: '#00FF00' },
        { id: 'yellow', name: 'Vàng', value: '#FFFF00' },
        { id: 'pink', name: 'Hồng', value: '#FF69B4' },
        { id: 'white', name: 'Trắng', value: '#FFFFFF' },
        { id: 'black', name: 'Đen', value: '#000000' },
        { id: 'gray', name: 'Xám', value: '#808080' }
    ];

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

    static async joinRoomById(userId, roomId) {
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

        // Tìm phòng theo ID
        const room = await db.collection('rooms').findOne({ 
            _id: new ObjectId(roomId),
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
                        joinedAt: new Date(),
                        isReady: false,
                        isBot: false
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

    static async kickMember(roomId, hostId, memberId) {
        const db = await database.getDb();

        // Kiểm tra xem người kick có phải là chủ phòng không
        const room = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId),
            hostId: new ObjectId(hostId)
        });

        if (!room) {
            throw new Error('Phòng không tồn tại hoặc bạn không phải chủ phòng');
        }

        // Kiểm tra xem thành viên có trong phòng không
        const memberExists = room.players.find(player => 
            (player.isBot && player.userId === memberId) || 
            (!player.isBot && player.userId.toString() === memberId)
        );

        if (!memberExists) {
            throw new Error('Thành viên không tồn tại trong phòng');
        }

        // Xóa thành viên khỏi phòng
        let updateQuery;
        if (memberId.startsWith('bot_')) {
            // Nếu là bot, tìm theo userId string
            updateQuery = { userId: memberId };
        } else {
            // Nếu là người dùng thường, tìm theo ObjectId
            updateQuery = { userId: new ObjectId(memberId) };
        }

        const result = await db.collection('rooms').updateOne(
            { _id: new ObjectId(roomId) },
            { 
                $pull: { players: updateQuery },
                $set: { updatedAt: new Date() }
            }
        );

        if (result.modifiedCount === 0) {
            throw new Error('Không thể kick thành viên');
        }

        const updatedRoom = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId)
        });

        return updatedRoom;
    }

    static async addBot(roomId, hostId) {
        const db = await database.getDb();
        
        const room = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId),
            hostId: new ObjectId(hostId)
        });

        if (!room) {
            throw new Error('Phòng không tồn tại hoặc bạn không phải chủ phòng');
        }

        if (room.players.length >= room.maxPlayers) {
            throw new Error('Phòng đã đầy');
        }

        // Tạo bot mới
        const bot = await BotModel.createBot(roomId);
        
        // Thêm bot vào phòng
        const result = await db.collection('rooms').updateOne(
            { _id: new ObjectId(roomId) },
            { 
                $push: { 
                    players: {
                        userId: bot.userId,
                        username: bot.username,
                        avatarUrl: bot.avatarUrl,
                        role: 'bot',
                        isBot: true,
                        joinedAt: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            }
        );

        return result.modifiedCount > 0;
    }

    static async startGame(roomId, hostId) {
        const db = await database.getDb();

        const room = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId),
            hostId: new ObjectId(hostId)
        });

        if (!room) {
            throw new Error('Phòng không tồn tại hoặc bạn không phải chủ phòng');
        }

        if (room.players.length < room.maxPlayers) {
            throw new Error('Phòng chưa đủ người chơi');
        }

        const result = await db.collection('rooms').updateOne(
            { _id: new ObjectId(roomId) },
            { 
                $set: { 
                    status: 'configuring',
                    updatedAt: new Date()
                }
            }
        );

        return result.modifiedCount > 0;
    }

    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static getAvailableOptions(players) {
        const usedColors = players
            .filter(p => p.color)
            .map(p => p.color);

        return {
            civilizations: this.CIVILIZATIONS, // Không lọc văn minh đã sử dụng
            colors: this.COLORS.filter(c => !usedColors.includes(c.id))
        };
    }

    static validateChoice(civilization, color) {
        // Chỉ kiểm tra xem văn minh và màu có tồn tại trong danh sách không
        return {
            validCiv: !civilization || this.CIVILIZATIONS.some(c => c.id === civilization),
            validColor: !color || this.COLORS.some(c => c.id === color)
        };
    }

    static async updatePlayerConfig(roomId, userId, civilization, color) {
        const db = await database.getDb();

        // Kiểm tra xem văn minh và màu sắc có hợp lệ không
        if (civilization && !this.CIVILIZATIONS.find(c => c.id === civilization)) {
            throw new Error('Văn minh không hợp lệ');
        }
        if (color && !this.COLORS.find(c => c.id === color)) {
            throw new Error('Màu sắc không hợp lệ');
        }

        // Kiểm tra xem màu đã được chọn bởi người chơi khác chưa
        if (color) {
            const existingPlayer = await db.collection('rooms').findOne({
                _id: new ObjectId(roomId),
                'players': {
                    $elemMatch: {
                        'userId': { $ne: new ObjectId(userId) },
                        'color': color
                    }
                }
            });

            if (existingPlayer) {
                throw new Error('Màu sắc đã được chọn bởi người chơi khác');
            }
        }

        // Cập nhật cấu hình cho người chơi
        const result = await db.collection('rooms').updateOne(
            {
                _id: new ObjectId(roomId),
                'players.userId': new ObjectId(userId)
            },
            {
                $set: {
                    'players.$.civilization': civilization,
                    'players.$.color': color,
                    'players.$.configuredAt': new Date(),
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw new Error('Không thể cập nhật cấu hình người chơi');
        }

        // Trả về thông tin phòng đã cập nhật
        return await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });
    }

    static async configureBotsForRoom(roomId) {
        const db = await database.getDb();
        const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });
        
        if (!room) return false;

        console.log('\n=== Room State Before Bot Configuration ===');
        console.log('Room ID:', roomId);
        console.log('Players:', room.players.map(p => ({
            id: p.userId.toString(),
            isBot: p.isBot,
            civilization: p.civilization,
            color: p.color,
            isReady: p.isReady
        })));

        const bots = room.players.filter(p => p.isBot && (!p.civilization || !p.color));
        console.log('\nBots to configure:', bots.length);
        
        if (bots.length === 0) return false;

        const { colors, civilizations } = this.getAvailableOptions(room.players);
        console.log('\nAvailable options:');
        console.log('- Colors:', colors);
        console.log('- Civilizations:', civilizations);
        
        // Cập nhật từng bot
        for (const bot of bots) {
            const randomCiv = this.getRandomElement(civilizations);
            const randomColor = this.getRandomElement(colors);

            console.log(`\nConfiguring bot ${bot.userId}:`);
            console.log('- Selected civilization:', randomCiv);
            console.log('- Selected color:', randomColor);

            // Xóa các lựa chọn đã dùng
            civilizations.splice(civilizations.indexOf(randomCiv), 1);
            colors.splice(colors.indexOf(randomColor), 1);

            await db.collection('rooms').updateOne(
                { 
                    _id: new ObjectId(roomId),
                    'players.userId': bot.userId
                },
                { 
                    $set: {
                        'players.$.civilization': randomCiv.id,
                        'players.$.color': randomColor.id,
                        'players.$.isReady': true,
                        'players.$.updatedAt': new Date()
                    }
                }
            );
        }

        // Log trạng thái cuối cùng
        const finalRoom = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });
        console.log('\n=== Room State After Bot Configuration ===');
        console.log('Players:', finalRoom.players.map(p => ({
            id: p.userId.toString(),
            isBot: p.isBot,
            civilization: p.civilization,
            color: p.color,
            isReady: p.isReady
        })));
        console.log('=========================\n');

        return true;
    }

    static async setPlayerReady(roomId, userId) {
        const db = await database.getDb();

        console.log('\n=== Processing Player Ready ===');
        console.log('Room ID:', roomId);
        console.log('User ID:', userId);

        // Kiểm tra xem người chơi đã chọn đủ cấu hình chưa
        const room = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId)
        });

        if (!room) {
            console.log('Room not found');
            throw new Error('Phòng không tồn tại');
        }

        console.log('\nCurrent room state:');
        console.log('Players:', room.players.map(p => ({
            id: p.userId.toString(),
            isBot: p.isBot,
            civilization: p.civilization,
            color: p.color,
            isReady: p.isReady
        })));

        const player = room.players.find(p => p.userId.toString() === userId.toString());
        if (!player) {
            console.log('Player not found in room');
            throw new Error('Người chơi không trong phòng');
        }

        if (!player.civilization || !player.color) {
            console.log('Player missing configuration:', {
                civilization: player.civilization,
                color: player.color
            });
            throw new Error('Bạn phải chọn văn minh và màu sắc trước');
        }

        // Cập nhật trạng thái sẵn sàng
        const result = await db.collection('rooms').updateOne(
            { 
                _id: new ObjectId(roomId),
                'players.userId': new ObjectId(userId)
            },
            { 
                $set: {
                    'players.$.isReady': true,
                    'players.$.updatedAt': new Date()
                }
            }
        );

        // Kiểm tra xem tất cả người chơi đã sẵn sàng chưa
        const updatedRoom = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId)
        });

        const humanPlayers = updatedRoom.players.filter(p => !p.isBot);
        const allHumansReady = humanPlayers.every(p => p.isReady);

        console.log('\nHuman players status:');
        console.log('Total humans:', humanPlayers.length);
        console.log('All humans ready:', allHumansReady);
        console.log('Human players:', humanPlayers.map(p => ({
            id: p.userId.toString(),
            civilization: p.civilization,
            color: p.color,
            isReady: p.isReady
        })));

        // Nếu tất cả người chơi đã sẵn sàng, cấu hình cho bot
        if (allHumansReady) {
            console.log('\nAll humans ready, configuring bots...');
            await this.configureBotsForRoom(roomId);
        }

        // Kiểm tra lại sau khi cấu hình bot
        const finalRoom = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId)
        });

        const allReady = finalRoom.players.every(p => p.isReady);
        console.log('\nFinal room state:');
        console.log('All players ready:', allReady);
        console.log('Players:', finalRoom.players.map(p => ({
            id: p.userId.toString(),
            isBot: p.isBot,
            civilization: p.civilization,
            color: p.color,
            isReady: p.isReady
        })));

        if (allReady) {
            console.log('\nUpdating room status to ready');
            await db.collection('rooms').updateOne(
                { _id: new ObjectId(roomId) },
                { 
                    $set: { 
                        status: 'ready',
                        updatedAt: new Date()
                    }
                }
            );
        }

        console.log('\nOperation result:', {
            success: result.modifiedCount > 0,
            allReady
        });
        console.log('=========================\n');

        return {
            success: result.modifiedCount > 0,
            allReady
        };
    }

    static async cancelPlayerReady(roomId, userId) {
        const db = await database.getDb();

        console.log('\n=== Processing Cancel Ready ===');
        console.log('Room ID:', roomId);
        console.log('User ID:', userId);

        // Cập nhật trạng thái sẵn sàng của người chơi
        const result = await db.collection('rooms').updateOne(
            {
                _id: new ObjectId(roomId),
                'players.userId': new ObjectId(userId)
            },
            {
                $set: {
                    'players.$.isReady': false,
                    'status': 'configuring', // Đặt lại trạng thái phòng
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw new Error('Không thể hủy trạng thái sẵn sàng');
        }

        // Lấy thông tin phòng sau khi cập nhật
        const updatedRoom = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId)
        });

        return updatedRoom;
    }

    static async getRoomById(roomId) {
        const db = await database.getDb();
        
        const room = await db.collection('rooms').findOne({
            _id: new ObjectId(roomId)
        });

        if (!room) {
            return null;
        }

        // Chuyển đổi các ObjectId thành string để trả về client
        return {
            ...room,
            _id: room._id.toString(),
            hostId: room.hostId.toString(),
            players: room.players.map(player => ({
                ...player,
                userId: player.userId.toString ? player.userId.toString() : player.userId
            }))
        };
    }

    static async deleteRoom(roomId) {
        const db = await database.getDb();
        const result = await db.collection('rooms').deleteOne({
            _id: new ObjectId(roomId)
        });
        return result.deletedCount > 0;
    }

    static async removePlayer(roomId, userId) {
        const db = await database.getDb();
        const result = await db.collection('rooms').updateOne(
            { _id: new ObjectId(roomId) },
            { 
                $pull: { 
                    players: { userId: new ObjectId(userId) }
                },
                $set: { updatedAt: new Date() }
            }
        );
        return result.modifiedCount > 0;
    }

    static async resetRoom(roomId) {
        const db = await database.getDb();

        console.log('\n=== Resetting Room ===');
        console.log('Room ID:', roomId);

        try {
            // Reset trạng thái của tất cả người chơi
            const result = await db.collection('rooms').updateOne(
                { _id: new ObjectId(roomId) },
                { 
                    $set: { 
                        status: 'waiting',
                        updatedAt: new Date(),
                        'players.$[].civilization': null,
                        'players.$[].color': null,
                        'players.$[].isReady': false,
                        'players.$[].updatedAt': new Date()
                    }
                }
            );

            console.log('Reset result:', result.modifiedCount > 0);
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error resetting room:', error);
            return false;
        }
    }
}

module.exports = RoomModel;
