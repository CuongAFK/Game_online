const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const database = require('../config/db');

const auth = async (req, res, next) => {
    try {
        // Lấy token từ header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lấy thông tin user
        const db = await database.getDb();
        const user = await db.collection('users').findOne({ 
            _id: new ObjectId(decoded._id)
        });

        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        // Thêm thông tin user vào request
        req.user = user;
        
        next();
    } catch (error) {
        console.error('Lỗi xác thực:', error);
        res.status(401).json({ message: 'Vui lòng đăng nhập lại' });
    }
};

module.exports = auth;
