# Game Online

Game Online là một ứng dụng web cho phép người dùng chơi game trực tuyến cùng bạn bè.

## Tính năng

- 🔐 Xác thực người dùng (Đăng ký, Đăng nhập)
- 👤 Quản lý hồ sơ người dùng
- 🎮 Tạo và quản lý phòng chơi
- 👥 Mời bạn bè vào phòng
- 🎨 Giao diện người dùng đẹp mắt với nhiều theme

## Công nghệ sử dụng

### Frontend
- React
- React Router
- Tailwind CSS
- DaisyUI
- React Icons
- React Toastify
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Cài đặt

1. Clone repository:
```bash
git clone https://github.com/CuongAFK/Game_online.git
cd Game_online
```

2. Cài đặt dependencies cho Frontend:
```bash
cd Frontend
npm install
```

3. Cài đặt dependencies cho Backend:
```bash
cd Backend
npm install
```

4. Tạo file .env trong thư mục Backend và thêm các biến môi trường:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3000
```

5. Chạy ứng dụng:

Frontend:
```bash
cd Frontend
npm start
```

Backend:
```bash
cd Backend
npm start
```

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo issue hoặc pull request.

## Giấy phép

[MIT License](LICENSE)
