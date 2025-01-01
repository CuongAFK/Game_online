const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            // Kết nối với MongoDB Atlas
            this.client = new MongoClient(process.env.MONGODB_URI);
            await this.client.connect();
            
            // Kết nối với database gamedb
            this.db = this.client.db('gamedb');
            console.log('✅ Kết nối MongoDB thành công!');
            return this.db;
        } catch (error) {
            console.error('❌ Lỗi kết nối MongoDB:', error);
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('👋 Đã đóng kết nối MongoDB');
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Chưa kết nối với database!');
        }
        return this.db;
    }
}

module.exports = new Database();
