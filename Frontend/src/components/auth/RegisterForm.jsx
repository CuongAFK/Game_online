import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';

const RegisterForm = ({ onTabChange }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
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
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('❌ Mật khẩu xác nhận không khớp', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        try {
            setLoading(true);
            const toastId = toast.loading("Đang tạo tài khoản...");

            const response = await axios.post('/api/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            
            toast.update(toastId, {
                render: "Đăng ký thành công! 🎉 Vui lòng đăng nhập để tiếp tục.",
                type: "success",
                isLoading: false,
                autoClose: 2000,
                closeOnClick: true,
                draggable: true,
            });

            // Tự động chuyển sang tab đăng nhập sau 1 giây
            setTimeout(() => {
                onTabChange('login');
            }, 1000);
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký';
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
                    <span className="label-text">Email</span>
                </label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaEnvelope className="text-gray-400" />
                    </span>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        placeholder="Nhập email"
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

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Xác nhận mật khẩu</span>
                </label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <FaLock className="text-gray-400" />
                    </span>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input input-bordered w-full pl-10"
                        placeholder="Nhập lại mật khẩu"
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
            >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

            <p className="text-center mt-4">
                Đã có tài khoản?{' '}
                <button
                    type="button"
                    onClick={() => onTabChange('login')}
                    className="text-primary hover:underline"
                >
                    Đăng nhập ngay
                </button>
            </p>
        </form>
    );
};

export default RegisterForm;
