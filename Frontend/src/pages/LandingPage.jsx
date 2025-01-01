import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGamepad, FaUsers, FaTrophy, FaSignInAlt, FaUserPlus, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ThemeSwitcher from '../components/ThemeSwitcher';

const LandingPage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && user) {
            setIsLoggedIn(true);
            setUsername(user.username || '');
            toast.success(`Chào mừng ${user.username || 'bạn'} quay trở lại! 👋`, {
                position: "top-right",
                autoClose: 2000,
            });
        }
    }, []);

    const renderAuthButtons = () => {
        if (isLoggedIn) {
            return (
                <Link to="/home" className="btn btn-primary btn-lg gap-2">
                    <FaPlay />
                    Vào Game Ngay
                </Link>
            );
        }

        return (
            <div className="flex justify-center gap-4">
                <Link to="/auth" className="btn btn-primary btn-lg gap-2">
                    <FaSignInAlt />
                    Đăng nhập
                </Link>
                <Link to="/auth?tab=register" className="btn btn-secondary btn-lg gap-2">
                    <FaUserPlus />
                    Đăng ký
                </Link>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow-lg">
                <div className="flex-1">
                    <Link to="/" className="btn btn-ghost text-xl gap-2">
                        <FaGamepad className="text-primary" />
                        <span className="font-bold">Game Online</span>
                    </Link>
                </div>
                <div className="flex-none gap-2">
                    {isLoggedIn && (
                        <Link to="/home" className="btn btn-ghost gap-2">
                            <FaPlay className="text-primary" />
                            <span className="hidden md:inline">Vào Game</span>
                        </Link>
                    )}
                    <ThemeSwitcher />
                </div>
            </div>

            {/* Hero Section */}
            <div className="hero min-h-[60vh] bg-base-100">
                <div className="hero-content text-center">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Game Online
                        </h1>
                        <p className="text-xl mb-8 text-base-content/80">
                            {isLoggedIn 
                                ? `Chào mừng ${username}! Bạn đã sẵn sàng để chơi game chưa?`
                                : 'Chơi game trực tuyến cùng bạn bè! Tạo phòng, mời bạn bè và bắt đầu cuộc vui.'
                            }
                        </p>
                        {renderAuthButtons()}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-base-200">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-base-content">Tính năng nổi bật</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Tính năng 1 */}
                        <div className="card bg-primary text-primary-content shadow-xl hover:scale-105 transition-transform">
                            <div className="card-body items-center text-center">
                                <FaGamepad className="mb-4" size={48} />
                                <h3 className="card-title">Trải nghiệm Game</h3>
                                <p>Thư giãn với các trò chơi hấp dẫn và thú vị</p>
                            </div>
                        </div>

                        {/* Tính năng 2 */}
                        <div className="card bg-secondary text-secondary-content shadow-xl hover:scale-105 transition-transform">
                            <div className="card-body items-center text-center">
                                <FaUsers className="mb-4" size={48} />
                                <h3 className="card-title">Chơi cùng bạn bè</h3>
                                <p>Tạo phòng và mời bạn bè tham gia dễ dàng</p>
                            </div>
                        </div>

                        {/* Tính năng 3 */}
                        <div className="card bg-accent text-accent-content shadow-xl hover:scale-105 transition-transform">
                            <div className="card-body items-center text-center">
                                <FaTrophy className="mb-4" size={48} />
                                <h3 className="card-title">Bảng xếp hạng</h3>
                                <p>Thi đấu và leo hạng với người chơi khác</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-base-100 py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-2xl mx-auto bg-gradient-to-r from-primary to-secondary p-8 rounded-box text-white">
                        <h2 className="text-3xl font-bold mb-8">
                            {isLoggedIn ? 'Sẵn sàng chơi game?' : 'Sẵn sàng tham gia?'}
                        </h2>
                        <p className="text-xl mb-8">
                            {isLoggedIn 
                                ? 'Bắt đầu trải nghiệm game ngay nào!'
                                : 'Đăng ký ngay để trải nghiệm game cùng cộng đồng!'
                            }
                        </p>
                        {isLoggedIn ? (
                            <Link to="/home" className="btn btn-accent btn-lg gap-2">
                                <FaPlay />
                                Vào Game
                            </Link>
                        ) : (
                            <Link to="/auth?tab=register" className="btn btn-accent btn-lg gap-2">
                                <FaUserPlus />
                                Bắt đầu ngay
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer footer-center p-10 bg-neutral text-neutral-content">
                <div>
                    <FaGamepad size={32} />
                    <p className="font-bold text-xl">
                        Game Online
                    </p>
                    <p>Nơi kết nối và giải trí</p>
                    <p>Copyright 2024 - All rights reserved</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
