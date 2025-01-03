import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import RoomList from '../components/RoomList';
import JoinRoomForm from '../components/JoinRoomForm';
import { Link } from 'react-router-dom';
import { 
    FaPlus, 
    FaUsers, 
    FaChevronLeft, 
    FaChevronRight, 
    FaBars,
    FaGamepad 
} from 'react-icons/fa';

const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [maxPlayers, setMaxPlayers] = useState(4);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Chỉ tự động đóng/mở sidebar khi thay đổi breakpoint
            if (mobile !== isMobile) {
                setShowSidebar(!mobile);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    // Tự động ẩn sidebar khi vào phòng trên mobile
    useEffect(() => {
        if (currentRoom && isMobile) {
            setShowSidebar(false);
        }
    }, [currentRoom, isMobile]);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/rooms');
            // console.log('Fetched rooms:', response.data); // Log fetched rooms
            setRooms(response.data.rooms);
        } catch (error) {
            console.error('Lỗi lấy danh sách phòng:', error);
            toast.error('Không thể lấy danh sách phòng');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        try {
            // console.log('Creating room with maxPlayers:', maxPlayers); // Debug log
            const roomName = `Phòng của ${currentUser.username}`;
            const data = {
                name: roomName,
                maxPlayers: parseInt(maxPlayers)
            };
            // console.log('Sending request with data:', data); // Log request data

            const response = await axios.post('/api/rooms', data);
            // console.log('Response from server:', response.data); // Log server response

            fetchRooms(); // Refresh room list
            toast.success('Đã tạo phòng thành công!', {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error) {
            console.error('Error creating room:', error.response?.data || error); // Enhanced error log
            toast.error(error.response?.data?.message || 'Không thể tạo phòng', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleJoinRoom = async (inviteCode) => {
        try {
            const response = await axios.post('/api/rooms/join', { inviteCode });
            fetchRooms(); // Refresh room list
            toast.success('Đã tham gia phòng thành công!', {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tham gia phòng', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleLeaveRoom = async (roomId) => {
        try {
            await axios.post(`/api/rooms/leave`, { roomId });
            fetchRooms(); // Refresh room list
            toast.info('Đã rời phòng', {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể rời phòng', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header with ThemeSwitcher */}
            <div className="navbar bg-base-100 shadow-lg">
                <div className="flex-1">
                    <button 
                        className="btn btn-ghost btn-circle lg:hidden"
                        onClick={() => setShowSidebar(!showSidebar)}
                    >
                        <FaBars />
                    </button>
                    <Link to="/" className="btn btn-ghost text-xl gap-2">
                        <FaGamepad className="text-primary" />
                        <span className="font-bold">Game Online</span>
                    </Link>
                </div>
                <div className="flex-none gap-2">
                    <Header />
                    {/* User dropdown */}
                </div>
            </div>
            
            <div className="flex relative min-h-[calc(100vh-4rem)]">
                {/* Overlay for mobile */}
                {showSidebar && isMobile && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-20"
                        onClick={() => setShowSidebar(false)}
                    />
                )}

                {/* Container for sidebar and toggle button */}
                <div className={`${!showSidebar ? 'w-0' : 'w-80'} transition-all duration-300 relative flex`}>
                    {/* Sidebar */}
                    <div 
                        className={`
                            transition-transform duration-300 ease-in-out
                            absolute
                            w-80 bg-base-100 min-h-[calc(100vh-4rem)]
                            shadow-lg z-30 lg:z-0
                            ${isMobile ? 'fixed' : 'relative'}
                            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
                        `}
                    >
                        <div className="p-4 space-y-4 h-full overflow-y-auto">
                            {/* Tạo phòng mới */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h2 className="card-title flex items-center gap-2">
                                        <FaPlus />
                                        Tạo phòng mới
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Tên phòng</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={`Phòng của ${currentUser.username}`}
                                                disabled
                                                className="input input-bordered opacity-70"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Số lượng người chơi tối đa</span>
                                                <span className="label-text-alt">{maxPlayers} người</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="2"
                                                max="8"
                                                value={maxPlayers}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    console.log('Setting maxPlayers to:', value); // Debug log
                                                    setMaxPlayers(value);
                                                }}
                                                className="range range-primary"
                                                step="1"
                                            />
                                            <div className="w-full flex justify-between text-xs px-2 mt-1">
                                                <span>2</span>
                                                <span>3</span>
                                                <span>4</span>
                                                <span>5</span>
                                                <span>6</span>
                                                <span>7</span>
                                                <span>8</span>
                                            </div>
                                        </div>
                                        <button 
                                            className="btn btn-primary w-full"
                                            onClick={() => {
                                                handleCreateRoom();
                                                if (isMobile) setShowSidebar(false);
                                            }}
                                        >
                                            Tạo phòng
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tham gia bằng mã */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h2 className="card-title flex items-center gap-2">
                                        <FaUsers />
                                        Tham gia phòng
                                    </h2>
                                    <JoinRoomForm 
                                        onJoinRoom={(code) => {
                                            handleJoinRoom(code);
                                            if (isMobile) setShowSidebar(false);
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toggle button - chỉ hiển thị trên desktop */}
                    {!isMobile && (
                        <button
                            className={`
                                absolute top-4 
                                ${showSidebar ? 'right-[-20px]' : 'left-0'}
                                btn btn-circle btn-sm
                                hidden lg:flex
                                bg-base-100 shadow-md
                                z-40
                            `}
                            onClick={() => setShowSidebar(!showSidebar)}
                        >
                            {showSidebar ? <FaChevronLeft /> : <FaChevronRight />}
                        </button>
                    )}
                </div>

                {/* Main content */}
                <div className="flex-1 flex items-center justify-center p-4">
                    {currentRoom ? (
                        <div className="card bg-base-100 shadow-xl max-w-md w-full">
                            <div className="card-body">
                                <h2 className="card-title">Phòng: {currentRoom.name}</h2>
                                {/* Game content here */}
                            </div>
                        </div>
                    ) : (
                        <RoomList
                            rooms={rooms}
                            loading={loading}
                            onJoinRoom={handleJoinRoom}
                            onLeaveRoom={handleLeaveRoom}
                            onRefresh={fetchRooms}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
