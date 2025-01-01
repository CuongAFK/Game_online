const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

class User {
    constructor(username, password, email, avatarUrl) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.createdAt = new Date();
        this.lastLogin = null;
    }

    static async findByUsername(username) {
        const usersCollection = db.getDb().collection('users');
        return await usersCollection.findOne({ username });
    }

    static async findByEmail(email) {
        const usersCollection = db.getDb().collection('users');
        return await usersCollection.findOne({ email });
    }

    async save() {
        // Hash mật khẩu trước khi lưu
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);

        const usersCollection = db.getDb().collection('users');
        const result = await usersCollection.insertOne(this);
        return result;
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateAvatar(userId, avatarUrl) {
        const db = db.getDb();
        
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { avatarUrl } }
        );

        return await this.findByUsername(userId);
    }
}

module.exports = User;
