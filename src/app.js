// Import các thư viện cần thiết
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

console.log('🔍 Đang khởi động server...');
console.log('📁 Đường dẫn hiện tại:', __dirname);
console.log('🔑 MONGODB_URI:', process.env.MONGODB_URI ? '✅ Đã cấu hình' : '❌ Chưa cấu hình');

const database = require('./config/db');
const gameModel = require('./models/gameModel');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

// Import các routes
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// Cấu hình middleware
app.use(cors()); // Cho phép truy cập từ các domain khác
app.use(morgan('dev')); // Logger để ghi lại các request
app.use(express.json()); // Xử lý dữ liệu JSON
app.use(express.urlencoded({ extended: true })); // Xử lý dữ liệu từ form

// Kết nối MongoDB và khởi tạo app
async function initializeApp() {
    console.log('🚀 Bắt đầu khởi tạo ứng dụng...');
    
    try {
        // Kết nối database
        console.log('🔌 Đang kết nối với MongoDB...');
        const db = await database.connect();
        console.log('✨ Kết nối database thành công!');
        
        // Khởi tạo models
        gameModel.initialize(db);
        console.log('📦 Đã khởi tạo models');
        
        // Cấu hình thư mục chứa file tĩnh (css, js, images,...)
        app.use(express.static(path.join(__dirname, 'public')));
        console.log('📂 Đã cấu hình thư mục tĩnh');

        // Cấu hình routes cho game
        app.use('/api/game', gameRoutes);
        console.log('🛣️ Đã cấu hình routes');

        // Cấu hình routes xác thực
        app.use('/api/auth', authRoutes);
        console.log('🔒 Đã cấu hình routes xác thực');

        // Cấu hình routes phòng game
        app.use('/api/rooms', roomRoutes);
        console.log('🛣️ Đã cấu hình routes phòng game');

        // Middleware xử lý lỗi
        app.use((err, req, res, next) => {
            console.error('❌ Lỗi:', err.stack);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi!'
            });
        });

        // Khởi động server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`
🎮 Game Server đã sẵn sàng!
🌐 Server: http://localhost:${PORT}
⚡ API: http://localhost:${PORT}/api/game
            `);
        });

    } catch (error) {
        console.error('❌ Lỗi khởi động ứng dụng:', error);
        process.exit(1);
    }
}

// Xử lý đóng kết nối khi tắt server
process.on('SIGINT', async () => {
    console.log('👋 Đang đóng ứng dụng...');
    await database.close();
    process.exit(0);
});

// Khởi động ứng dụng
console.log('🎯 Bắt đầu khởi động ứng dụng...');
initializeApp();
