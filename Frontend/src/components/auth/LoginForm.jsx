import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import axios from 'axios';

const LoginForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const toastId = toast.loading("Đang đăng nhập...");
            const response = await axios.post('/api/auth/login', formData);
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            toast.update(toastId, {
                render: `Chào mừng ${response.data.user.username} đến với Game Online! 🎮`,
                type: "success",
                isLoading: false,
                autoClose: 2000,
                closeOnClick: true,
                draggable: true,
            });

            navigate('/home');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập';
            toast.error(`❌ ${errorMessage}`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Tên người dùng</span>
                </label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaUser className="text-gray-400" />
                    </span>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        placeholder="Nhập tên người dùng"
                        required
                    />
                </div>
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Mật khẩu</span>
                </label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaLock className="text-gray-400" />
                    </span>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        placeholder="Nhập mật khẩu"
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                className={`btn btn-primary w-full gap-2 ${loading ? 'loading' : ''}`}
                disabled={loading}
            >
                {!loading && <FaSignInAlt />}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
        </form>
    );
};

export default LoginForm;
