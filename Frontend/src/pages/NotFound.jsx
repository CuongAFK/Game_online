import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="text-center p-8">
                <div className="flex justify-center mb-4">
                    <FaExclamationTriangle className="text-warning" size={64} />
                </div>
                <h1 className="text-5xl font-bold mb-4">404</h1>
                <p className="text-2xl mb-8">Trang không tồn tại</p>
                <Link 
                    to="/" 
                    className="btn btn-primary gap-2"
                >
                    <FaHome size={20} />
                    Về trang chủ
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
