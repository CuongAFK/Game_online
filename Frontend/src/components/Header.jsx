import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

// Thêm token vào tất cả request
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Xử lý lỗi token hết hạn
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth';
        }
        return Promise.reject(error);
    }
);

const Header = () => {
    const navigate = useNavigate();
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    const handleUpdateAvatar = async (index) => {
        try {
            const response = await axios.post('/api/auth/update-avatar', { 
                avatarIndex: index 
            });
            
            // Cập nhật user trong localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Đổi avatar thành công!');
            setShowAvatarModal(false);
        } catch (error) {
            console.error('Lỗi đổi avatar:', error);
            toast.error(error.response?.data?.message || 'Không thể đổi avatar');
        }
    };

    return (
        <>
            <div className="navbar bg-base-100 shadow-lg px-4">
                <div className="flex-1">
                    <span className="text-xl font-bold">Game Online</span>
                </div>
                <div className="flex-none gap-2">
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full">
                                <img 
                                    src={user?.avatarUrl || '/avt/avt-0.jpg'} 
                                    alt={user?.username} 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/avt/avt-0.jpg';
                                    }}
                                />
                            </div>
                        </label>
                        <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                            <li className="menu-title">
                                <span>{user?.username}</span>
                            </li>
                            <li>
                                <button onClick={() => setShowAvatarModal(true)}>
                                    Đổi avatar
                                </button>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="text-error">
                                    Đăng xuất
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal chọn avatar */}
            {showAvatarModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Chọn avatar</h3>
                        <div className="grid grid-cols-5 gap-4">
                            {[...Array(20)].map((_, index) => (
                                <button
                                    key={index}
                                    className="avatar"
                                    onClick={() => handleUpdateAvatar(index)}
                                >
                                    <div className="w-16 rounded-full ring hover:ring-primary">
                                        <img 
                                            src={`/avt/avt-${index}.jpg`}
                                            alt={`Avatar ${index}`}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="modal-action">
                            <button 
                                className="btn"
                                onClick={() => setShowAvatarModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
