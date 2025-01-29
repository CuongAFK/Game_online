const { ObjectId } = require('mongodb');
const database = require('../../config/db');

class BotModel {
    static async createBot(roomId) {
        const db = await database.getDb();
        
        // Lấy danh sách avatar ngẫu nhiên từ users
        const users = await db.collection('users').find({}).toArray();
        const randomAvatar = users[Math.floor(Math.random() * users.length)].avatarUrl;
        
        // Tạo ID ngẫu nhiên cho bot
        const botId = Math.floor(Math.random() * 1000);
        
        const bot = {
            _id: new ObjectId(),
            userId: `bot_${botId}`,
            username: `Bot ${botId}`,
            avatarUrl: randomAvatar,
            isBot: true,
            createdAt: new Date()
        };
        
        return bot;
    }
}

module.exports = BotModel;
