const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/db');

// Tạo JWT token
const generateToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const register = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const db = await database.getDb();

        // Chọn avatar ngẫu nhiên từ 0-19
        const avatarIndex = Math.floor(Math.random() * 20);
        const avatarUrl = `/avt/avt-${avatarIndex}.jpg`;

        // Kiểm tra username và email đã tồn tại chưa
        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Tên người dùng đã tồn tại' });
        }

        const existingEmail = await db.collection('users').findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const result = await db.collection('users').insertOne({
            username,
            password: hashedPassword,
            email,
            avatarUrl,
            createdAt: new Date()
        });

        // Tạo token
        const token = generateToken(result.insertedId.toString());

        res.status(201).json({
            message: 'Đăng ký thành công',
            token,
            user: {
                _id: result.insertedId,
                username,
                email,
                avatarUrl
            }
        });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await database.getDb();

        // Tìm user
        const user = await db.collection('users').findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Kiểm tra password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Tạo token
        const token = generateToken(user._id.toString());

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const updateAvatar = async (req, res) => {
    try {
        const { avatarIndex } = req.body;
        if (avatarIndex < 0 || avatarIndex > 19) {
            return res.status(400).json({ message: 'Avatar không hợp lệ' });
        }

        const avatarUrl = `/avt/avt-${avatarIndex}.jpg`;
        const db = await database.getDb();

        await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: { avatarUrl } }
        );

        const updatedUser = await db.collection('users').findOne({ _id: req.user._id });

        res.json({
            message: 'Cập nhật avatar thành công',
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatarUrl: updatedUser.avatarUrl
            }
        });
    } catch (error) {
        console.error('Lỗi cập nhật avatar:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = {
    register,
    login,
    updateAvatar
};
