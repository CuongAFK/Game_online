import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ThemeSwitcher from '../ThemeSwitcher';

const AuthForm = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();

    useEffect(() => {
        // Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/home');
            return;
        }

        // Đọc tab từ URL parameter khi component mount
        const tab = searchParams.get('tab');
        if (tab === 'register') {
            setActiveTab('register');
        }
    }, [searchParams, navigate]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow-lg">
                <div className="flex-1">
                    <Link to="/" className="btn btn-ghost gap-2">
                        <FaArrowLeft />
                        Quay lại
                    </Link>
                </div>
                <div className="flex-none">
                    <ThemeSwitcher />
                </div>
            </div>

            <div className="flex items-center justify-center px-4 py-8">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl font-bold text-center justify-center mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            {activeTab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                        </h2>

                        <div className="tabs tabs-boxed bg-base-200">
                            <button
                                className={`tab flex-1 ${activeTab === 'login' ? 'tab-active bg-primary text-primary-content' : ''}`}
                                onClick={() => handleTabChange('login')}
                            >
                                Đăng nhập
                            </button>
                            <button
                                className={`tab flex-1 ${activeTab === 'register' ? 'tab-active bg-secondary text-secondary-content' : ''}`}
                                onClick={() => handleTabChange('register')}
                            >
                                Đăng ký
                            </button>
                        </div>

                        <div className="mt-6">
                            {activeTab === 'login' ? (
                                <LoginForm />
                            ) : (
                                <RegisterForm onTabChange={handleTabChange} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
