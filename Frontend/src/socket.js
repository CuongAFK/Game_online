import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// Tạo kết nối socket đến server
const socket = io('http://localhost:3000', {
    autoConnect: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Xử lý sự kiện kết nối
socket.on('connect', () => {
    console.log('Connected to server');
    toast.success('Đã kết nối lại với server', {
        toastId: 'socket-connected'
    });
});

// Xử lý sự kiện mất kết nối
socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    let message = 'Mất kết nối với server';
    
    switch (reason) {
        case 'io server disconnect':
            message = 'Server đã ngắt kết nối';
            break;
        case 'transport close':
            message = 'Mất kết nối mạng';
            break;
        case 'ping timeout':
            message = 'Kết nối không ổn định';
            break;
    }
    
    toast.error(message, {
        toastId: 'socket-disconnected'
    });
});

// Xử lý lỗi kết nối
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    toast.error('Không thể kết nối đến server', {
        toastId: 'socket-error'
    });
});

// Xử lý khi đang thử kết nối lại
socket.on('reconnecting', (attemptNumber) => {
    console.log('Reconnecting...', attemptNumber);
    toast.info(`Đang thử kết nối lại... (${attemptNumber}/5)`, {
        toastId: 'socket-reconnecting'
    });
});

// Xử lý khi không thể kết nối lại
socket.on('reconnect_failed', () => {
    console.log('Reconnection failed');
    toast.error('Không thể kết nối lại với server. Vui lòng tải lại trang.', {
        toastId: 'socket-reconnect-failed'
    });
});

export default socket;
