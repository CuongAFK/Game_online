import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheck } from 'react-icons/fa';
import socket from '../socket';

const civilizations = [
    { 
        id: 'knight', 
        name: 'Hiệp Sĩ', 
        icon: '⚔️',
        description: 'Phe hiệp sĩ với sức mạnh phòng thủ vững chắc',
        houseImage: '/build/ky-si_lv3.png'
    },
    { 
        id: 'traveler', 
        name: 'Du Hành', 
        icon: '🏹',
        description: 'Phe du hành với khả năng di chuyển linh hoạt',
        houseImage: '/build/linh-muc_lv3.png'
    },
    { 
        id: 'devil', 
        name: 'Ác Quỷ', 
        icon: '👿',
        description: 'Phe ác quỷ với sức mạnh tấn công hủy diệt',
        houseImage: '/build/ac-quy_lv3.png'
    }
];

const colors = [
    { id: 'red', name: 'Đỏ', value: '#FF0000' },
    { id: 'blue', name: 'Xanh dương', value: '#0000FF' },
    { id: 'green', name: 'Xanh lá', value: '#00FF00' },
    { id: 'yellow', name: 'Vàng', value: '#FFFF00' },
    { id: 'pink', name: 'Hồng', value: '#FF69B4' },
    { id: 'white', name: 'Trắng', value: '#FFFFFF' },
    { id: 'black', name: 'Đen', value: '#000000' },
    { id: 'gray', name: 'Xám', value: '#808080' }
];

const getCivilization = (civId) => {
    return civilizations.find(c => c.id === civId) || null;
};

const getColor = (colorId) => {
    return colors.find(c => c.id === colorId) || null;
};

const getUsedOptions = (room, currentUser) => {
    if (!room?.players) return { usedCivs: [], usedColors: [] };

    return {
        usedCivs: room.players
            .filter(p => p.userId.toString() !== currentUser._id.toString())
            .map(p => p.civilization)
            .filter(Boolean),
        usedColors: room.players
            .filter(p => p.userId.toString() !== currentUser._id.toString())
            .map(p => p.color)
            .filter(Boolean)
    };
};



const GameConfig = () => {
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCiv, setSelectedCiv] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [isReady, setIsReady] = useState(false);
    const { roomId } = useParams();
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const originalRoomId = roomId.split('_')[0];

    useEffect(() => {
        let isComponentMounted = true;

        const fetchRoomData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/rooms/${originalRoomId}`);
                
                if (!isComponentMounted) return;

                if (!response.data) {
                    toast.error('Phòng không tồn tại hoặc đã bị xóa');
                    navigate('/');
                    return;
                }

                setRoom(response.data);
                setLoading(false);
            } catch (error) {
                if (!isComponentMounted) return;
                console.error('Lỗi khi lấy thông tin phòng:', error);
                
                if (error.response?.status === 404) {
                    toast.error('Phòng không tồn tại hoặc đã bị xóa');
                } else {
                    toast.error('Không thể lấy thông tin phòng. Vui lòng thử lại.');
                }
                navigate('/');
            }
        };

        fetchRoomData();

        // Xử lý khi người chơi thoát trang
        const handleBeforeUnload = async (e) => {
            if (room) {  // Chỉ thực hiện nếu room tồn tại
                try {
                    await axios.post(`/api/rooms/leave`, {
                        roomId: originalRoomId
                    });
                } catch (error) {
                    console.error('Lỗi khi rời phòng:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            isComponentMounted = false;
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (room) {  // Chỉ thực hiện nếu room tồn tại
                socket.emit('leave:room', originalRoomId);
            }
        };
    }, [roomId, navigate]);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/rooms/${originalRoomId}`);
                setRoom(response.data);
                
                // Join socket room với roomId gốc
                socket.emit('join:room', originalRoomId);
                console.log('Joined room:', originalRoomId);
            } catch (error) {
                console.error('Error fetching room:', error);
                toast.error('Không thể tải thông tin phòng');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();

        // Cleanup: leave room khi rời trang
        return () => {
            socket.emit('leave:room', originalRoomId);
            console.log('Left room:', originalRoomId);
        };
    }, [originalRoomId, navigate]);

    useEffect(() => {
        console.log('Setting up socket listeners');

        // Lắng nghe sự kiện game bắt đầu
        socket.on('room:game_started', (data) => {
            console.log('Game started event received:', data);
            const { gameConfigId, roomName } = data;
            
            toast.success(`Game "${roomName}" đã bắt đầu!`);
            navigate(`/game-config/${gameConfigId}`);
        });

        // Cleanup
        return () => {
            console.log('Cleaning up socket listeners');
            socket.off('room:game_started');
        };
    }, [navigate]);

    useEffect(() => {
        console.log('Setting up socket listeners');

        // Lắng nghe sự kiện game bắt đầu
        socket.on('room:game_started', (data) => {
            console.log('Game started event received:', data);
            const { gameConfigId, roomName } = data;
            
            toast.success(`Game "${roomName}" đã bắt đầu!`);
            navigate(`/game-config/${gameConfigId}`);
        });

        // Cleanup
        return () => {
            console.log('Cleaning up socket listeners');
            socket.off('room:game_started');
        };
    }, [navigate]);

    useEffect(() => {
        // Lắng nghe sự kiện cập nhật phòng
        socket.on('room:updated', (updatedRoom) => {
            console.log('Received room update:', updatedRoom);
            setRoom(updatedRoom);
            
            // Cập nhật lựa chọn của người chơi hiện tại
            const currentPlayer = updatedRoom.players.find(
                p => p.userId.toString() === currentUser._id.toString()
            );
            
            if (currentPlayer) {
                if (currentPlayer.civilization) setSelectedCiv(currentPlayer.civilization);
                if (currentPlayer.color) setSelectedColor(currentPlayer.color);
                if (currentPlayer.isReady) setIsReady(true);
            } else {
                // Người chơi không còn trong phòng
                toast.error('Bạn đã bị kick khỏi phòng');
                navigate('/');
            }
        });

        // Lắng nghe sự kiện tất cả đã sẵn sàng
        socket.on('room:all_ready', (data) => {
            console.log('All players ready:', data);
            toast.success('Tất cả người chơi đã sẵn sàng!');
            // Chuyển sang màn hình game sau 2 giây
            setTimeout(() => {
                navigate(`/game/${data.roomId}`);
            }, 2000);
        });

        // Lắng nghe sự kiện game bị dừng
        socket.on('room:game_stopped', (data) => {
            toast.info('Chủ phòng đã dừng game');
            // Không cần navigate vì đã nhận room:updated
        });

        // Lắng nghe sự kiện phòng bị xóa
        socket.on('room:deleted', () => {
            toast.info('Phòng đã bị xóa bởi chủ phòng');
            navigate('/');
        });

        return () => {
            socket.off('room:updated');
            socket.off('room:all_ready');
            socket.off('room:game_stopped');
            socket.off('room:deleted');
        };
    }, [socket, navigate, currentUser._id]);

    useEffect(() => {
        let intervalId;
        
        const fetchRoomData = async () => {
            try {
                const response = await axios.get(`/api/rooms/${originalRoomId}`);
                setRoom(response.data);
                
                // Cập nhật lựa chọn của người chơi hiện tại
                const currentPlayer = response.data.players.find(
                    p => p.userId.toString() === currentUser._id.toString()
                );
                
                if (currentPlayer) {
                    if (currentPlayer.civilization) setSelectedCiv(currentPlayer.civilization);
                    if (currentPlayer.color) setSelectedColor(currentPlayer.color);
                    if (currentPlayer.isReady) setIsReady(true);
                }
            } catch (error) {
                console.error('Error fetching room:', error);
                if (error.response?.status === 404) {
                    toast.error('Phòng không tồn tại');
                    navigate('/');
                }
            }
        };

        // Fetch ngay lập tức khi component mount
        fetchRoomData();
        
        // Sau đó fetch mỗi 5 giây
        intervalId = setInterval(fetchRoomData, 5000);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [originalRoomId, currentUser._id, navigate]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [civRes, colorRes] = await Promise.all([
                    axios.get('/api/rooms/civilizations'),
                    axios.get('/api/rooms/colors')
                ]);
                const civData = civRes.data;
                const colorData = colorRes.data;

                // Cập nhật state với dữ liệu từ API
                if (civData.civilizations) {
                    civilizations.splice(0, civilizations.length, ...civData.civilizations);
                }
                if (colorData.colors) {
                    colors.splice(0, colors.length, ...colorData.colors);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách văn minh và màu:', error);
                toast.error('Không thể lấy danh sách văn minh và màu');
            }
        };

        fetchOptions();
    }, []);



    // Tự động chọn cho bot
    const autoSelectForBot = async () => {
        if (!room) return;

        try {
            // Lấy danh sách màu và văn minh đã được chọn
            const usedColors = room.players.map(p => p.color).filter(Boolean);
            const availableColors = colors.filter(c => !usedColors.includes(c.id));
            
            // Chọn ngẫu nhiên từ những màu còn lại
            const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
            
            // Chọn ngẫu nhiên văn minh
            const randomCiv = civilizations[Math.floor(Math.random() * civilizations.length)];
            
            // Cập nhật cấu hình qua API
            await axios.patch(`/api/rooms/${originalRoomId}/config`, {
                civilization: randomCiv.id,
                color: randomColor.id
            });
            
            // Cập nhật state
            setSelectedColor(randomColor.id);
            setSelectedCiv(randomCiv.id);
            
            // Tự động sẵn sàng sau 1 giây
            setTimeout(() => {
                handleReadyClick();
            }, 1000);
        } catch (error) {
            console.error('Lỗi khi cấu hình bot:', error);
            toast.error('Không thể cấu hình bot');
        }
    };

    const fetchRoom = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/rooms/${roomId}`);
            setRoom(response.data);
            
            // Nếu là bot, tự động chọn sau 1 giây
            const currentPlayer = response.data.players.find(p => p.userId === currentUser._id);
            if (currentPlayer?.isBot) {
                setTimeout(autoSelectForBot, 1000);
            }

            // Cập nhật lựa chọn đã lưu
            if (currentPlayer) {
                if (currentPlayer.civilization) setSelectedCiv(currentPlayer.civilization);
                if (currentPlayer.color) setSelectedColor(currentPlayer.color);
                if (currentPlayer.isReady) setIsReady(true);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin phòng:', error);
            toast.error('Không thể lấy thông tin phòng');
            navigate('/home');
        } finally {
            setLoading(false);
        }
    };

    const handleCivChange = async (civId) => {
        try {
            // Gửi cả civilization và color hiện tại
            await axios.patch(`/api/rooms/${originalRoomId}/config`, {
                civilization: civId,
                color: selectedColor || null // Đảm bảo gửi null nếu chưa chọn màu
            });
            setSelectedCiv(civId);
            toast.success('Đã chọn văn minh!');
        } catch (error) {
            console.error('Lỗi khi chọn văn minh:', error);
            toast.error(error.response?.data?.message || 'Không thể chọn văn minh');
        }
    };

    const handleColorChange = async (colorId) => {
        // Kiểm tra xem màu đã được chọn chưa
        const isColorTaken = room?.players.some(p => 
            p.color === colorId && p.userId !== currentUser._id
        );

        if (isColorTaken) {
            toast.error('Màu này đã được chọn');
            return;
        }

        try {
            // Gửi cả civilization và color
            await axios.patch(`/api/rooms/${originalRoomId}/config`, {
                civilization: selectedCiv || null, // Đảm bảo gửi null nếu chưa chọn văn minh
                color: colorId
            });
            setSelectedColor(colorId);
            toast.success('Đã chọn màu!');
        } catch (error) {
            console.error('Lỗi khi chọn màu:', error);
            toast.error(error.response?.data?.message || 'Không thể chọn màu');
        }
    };

    const handleReadyClick = async () => {
        try {
            // Kiểm tra đã chọn đủ cấu hình chưa
            if (!selectedCiv || !selectedColor) {
                toast.error('Vui lòng chọn văn minh và màu trước khi sẵn sàng');
                return;
            }

            await axios.post(`/api/rooms/${originalRoomId}/ready`);
            setIsReady(true);
            toast.success('Đã sẵn sàng!');
        } catch (error) {
            console.error('Lỗi khi đánh dấu sẵn sàng:', error);
            toast.error(error.response?.data?.message || 'Không thể đánh dấu sẵn sàng');
        }
    };

    const handleCancelReady = async () => {
        try {
            await axios.post(`/api/rooms/${originalRoomId}/cancel-ready`);
            setIsReady(false);
            toast.success('Đã hủy sẵn sàng!');
        } catch (error) {
            console.error('Lỗi khi hủy sẵn sàng:', error);
            toast.error(error.response?.data?.message || 'Không thể hủy sẵn sàng');
        }
    };

    const handleStopGame = async () => {
        try {
            await axios.post(`/api/rooms/${originalRoomId}/stop-game`);
            toast.success('Đã dừng game');
        } catch (error) {
            console.error('Lỗi khi dừng game:', error);
            toast.error(error.response?.data?.message || 'Không thể dừng game');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-8 text-center">Cấu hình game</h1>

            {loading ? (
                <div className="text-center">Đang tải...</div>
            ) : !room ? (
                <div className="text-center">Không tìm thấy phòng</div>
            ) : (
                <>
                    {/* Danh sách người chơi */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Người chơi</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {room.players.map((player, index) => (
                                <div 
                                    key={player.userId} 
                                    className={`p-4 border rounded-lg ${
                                        player.isReady ? 'bg-green-50 border-green-500' : ''
                                    }`}
                                >
                                    <div className="font-bold mb-2">{player.username}</div>
                                    {player.civilization && (
                                        <div className="mb-2">
                                            Văn minh: {getCivilization(player.civilization)?.name}
                                        </div>
                                    )}
                                    {player.color && (
                                        <div className="flex items-center">
                                            <div>Màu:</div>
                                            <div 
                                                className="w-6 h-6 rounded-full ml-2"
                                                style={{ backgroundColor: getColor(player.color)?.value }}
                                            />
                                        </div>
                                    )}
                                    {player.isReady && (
                                        <div className="text-green-500 flex items-center mt-2">
                                            <FaCheck className="mr-1" /> Sẵn sàng
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Chọn văn minh</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {civilizations.map((civ) => {
                                const isSelected = selectedCiv === civ.id;
                               
                                return (
                                    <button
                                        key={civ.id}
                                        onClick={() => handleCivChange(civ.id)}
                                        disabled={isReady}
                                        className={`
                                            p-4 rounded-lg border-2 transition-all duration-200
                                            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                            ${isReady ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
                                        `}
                                    >
                                        <div className="text-4xl mb-2">{civ.icon}</div>
                                        <div className="font-semibold mb-2">{civ.name}</div>
                                        <div className="text-sm text-gray-600 mb-4">{civ.description}</div>
                                        <div className="w-32 h-32 mx-auto">
                                            {/* Hình vẽ phe phái */}
                                            <img
                                                src={civ.houseImage}
                                                alt={civ.name}
                                                className="w-full h-full"
                                            />
                                        </div>
                                        {isSelected && (
                                            <div className="mt-2 text-blue-500 font-semibold">
                                                Đã chọn
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Chọn màu sắc</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {colors.map((color) => {
                                const isSelected = selectedColor === color.id;
                                const isUsed = getUsedOptions(room, currentUser).usedColors.includes(color.id);
                                const isDisabled = isUsed && !isSelected;

                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => handleColorChange(color.id)}
                                        disabled={isDisabled || isReady}
                                        className={`
                                            p-4 rounded-lg border-2 transition-all duration-200
                                            ${isSelected ? 'border-blue-500' : 'border-gray-200'}
                                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
                                            ${isReady ? 'cursor-not-allowed' : ''}
                                        `}
                                        style={{
                                            backgroundColor: color.value,
                                            color: ['white', 'yellow'].includes(color.id) ? '#000' : '#fff'
                                        }}
                                    >
                                        {color.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-center mt-8">
                        {!isReady ? (
                            <button
                                onClick={handleReadyClick}
                                disabled={!selectedCiv || !selectedColor}
                                className={`
                                    px-6 py-3 rounded-lg font-semibold text-white
                                    ${!selectedCiv || !selectedColor 
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600'}
                                `}
                            >
                                Sẵn sàng
                            </button>
                        ) : (
                            <button
                                onClick={handleCancelReady}
                                className="px-6 py-3 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600"
                            >
                                Hủy sẵn sàng
                            </button>
                        )}
                    </div>

                    {/* Nút dừng game */}
                    {room?.hostId === currentUser._id && (
                        <div className="text-center mt-4">
                            <button 
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={handleStopGame}
                            >
                                Dừng game
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GameConfig;
