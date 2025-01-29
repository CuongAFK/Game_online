import React, { useEffect } from 'react';
import { FaCrown, FaTrash, FaDoorOpen, FaUsers, FaCopy, FaUserTimes, FaRobot } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

const RoomList = ({ rooms, loading, onJoinRoom, onLeaveRoom, onRefresh }) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser._id;
    const navigate = useNavigate();

    useEffect(() => {
        console.log('RoomList mounted, setting up socket listeners');

        // Tránh join duplicate bằng cách lưu trữ đã join rooms
        const joinedRooms = new Set();

        if (rooms && rooms.length > 0) {
            console.log('Joining rooms:', rooms.map(r => r._id));
            rooms.forEach(room => {
                if (!joinedRooms.has(room._id)) {
                    socket.emit('join:room', room._id);
                    joinedRooms.add(room._id);
                }
            });
        }

        // Lắng nghe các sự kiện thay đổi phòng
        socket.on('room:created', (data) => {
            console.log('Room created event received:', data);
            onRefresh();
            if (data.hostId !== currentUserId) {
                toast.info(`${data.hostName} vừa tạo "${data.roomName}"`, {
                    toastId: `room-created-${data.roomId}`
                });
            }
        });

        socket.on('room:deleted', (data) => {
            console.log('Room deleted event received:', data);
            onRefresh();
            if (data.hostId !== currentUserId) {
                toast.info(`Phòng "${data.roomName}" đã bị xóa bởi chủ phòng`, {
                    toastId: `room-deleted-${data.roomId}`
                });
            }
        });

        socket.on('room:updated', (data) => {
            console.log('Room updated event received:', data);
            onRefresh();
        });

        socket.on('room:player_joined', (data) => {
            console.log('Player joined event received:', data);
            onRefresh();
            if (data.userId !== currentUserId) {
                toast.success(`${data.username} đã tham gia "${data.roomName}"`, {
                    toastId: `player-joined-${data.userId}-${data.roomId}`
                });
            }
        });

        socket.on('room:player_left', (data) => {
            console.log('Player left event received:', data);
            onRefresh();
            if (data.userId !== currentUserId) {
                const message = data.kicked 
                    ? `${data.username} đã bị kick khỏi "${data.roomName}"`
                    : `${data.username} đã rời khỏi "${data.roomName}"`;
                toast.info(message, {
                    toastId: `player-left-${data.userId}-${data.roomId}`
                });
            }
        });

        socket.on('room:bot_added', (data) => {
            console.log('Bot added event received:', data);
            onRefresh();
            if (data.hostId !== currentUserId) {
                toast.info(`${data.hostName} đã thêm bot vào "${data.roomName}"`, {
                    toastId: `bot-added-${data.roomId}`
                });
            }
        });

        // Lắng nghe sự kiện game start
        const handleGameStart = (data) => {
            console.log('Game started event received:', data);
            const { gameConfigId, roomName } = data;
            
            toast.success(`Game "${roomName}" đã bắt đầu!`);
            // Sử dụng gameConfigId từ server thay vì tạo mới
            navigate(`/game-config/${gameConfigId}`);
        };

        socket.on('room:game_started', handleGameStart);

        // Cleanup khi unmount
        return () => {
            console.log('RoomList unmounting, cleaning up socket listeners');
            // Chỉ leave những room đã join
            Array.from(joinedRooms).forEach(roomId => {
                console.log('Leaving room:', roomId);
                socket.emit('leave:room', roomId);
            });
            socket.off('room:created');
            socket.off('room:deleted');
            socket.off('room:updated');
            socket.off('room:player_joined');
            socket.off('room:player_left');
            socket.off('room:bot_added');
            socket.off('room:game_started', handleGameStart);
        };
    }, [rooms, navigate]);

    const handleCopyInviteCode = async (inviteCode) => {
        try {
            await navigator.clipboard.writeText(inviteCode);
            toast.success('Đã sao chép mã phòng vào clipboard!', {
                toastId: 'copy-code'
            });
        } catch (error) {
            console.error('Lỗi sao chép:', error);
            toast.error('Không thể sao chép mã phòng. Vui lòng thử lại.', {
                toastId: 'copy-code-error'
            });
        }
    };

    const handleLeaveRoom = async (roomId, roomName) => {
        try {
            await axios.post(`/api/rooms/leave`, {
                roomId: roomId.toString()
            });
            onRefresh();
            toast.success(`Đã rời khỏi phòng "${roomName}"`, {
                toastId: `leave-room-${roomId}`
            });
        } catch (error) {
            console.error('Lỗi khi rời phòng:', error);
            toast.error(`Không thể rời phòng "${roomName}". ${error.response?.data?.message || 'Vui lòng thử lại.'}`, {
                toastId: `leave-room-error-${roomId}`
            });
        }
    };

    const handleDeleteRoom = async (roomId, roomName) => {
        try {
            // Sử dụng DELETE method và endpoint mới
            const response = await axios.delete(`/api/rooms/${roomId}`);
            if (response.data.success) {
                toast.success('Đã xóa phòng thành công!');
                onRefresh();
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            toast.error(error.response?.data?.message || 'Không thể xóa phòng');
        }
    };

    const handleKickMember = async (roomId, userId, username, roomName) => {
        try {
            await axios.post('/api/rooms/kick', { 
                roomId: roomId.toString(), 
                userId: userId.toString() 
            });
            
            onRefresh();
            toast.success(`Đã kick "${username}" khỏi phòng`, {
                toastId: `kick-member-${userId}-${roomId}`
            });
        } catch (error) {
            console.error('Lỗi kick thành viên:', error);
            toast.error(`Không thể kick "${username}". ${error.response?.data?.message || 'Vui lòng thử lại.'}`, {
                toastId: `kick-member-error-${userId}-${roomId}`
            });
        }
    };

    const handleAddBot = async (roomId, roomName) => {
        try {
            await axios.post('/api/rooms/add-bot', { roomId });
            onRefresh();
            toast.success(`Đã thêm bot vào phòng "${roomName}"`, {
                toastId: `add-bot-${roomId}`
            });
        } catch (error) {
            console.error('Lỗi thêm bot:', error);
            toast.error(`Không thể thêm bot vào phòng "${roomName}". ${error.response?.data?.message || 'Vui lòng thử lại.'}`, {
                toastId: `add-bot-error-${roomId}`
            });
        }
    };

    const handleJoinRoom = async (roomId) => {
        try {
            const response = await axios.post(`/api/rooms/join`, { roomId });
            if (response.data.success) {
                // Join socket room ngay khi vào phòng
                socket.emit('join:room', roomId);
                
                toast.success('Đã tham gia phòng thành công!');
                navigate(`/game-config/${roomId}`);
            }
        } catch (error) {
            console.error('Error joining room:', error);
            toast.error(error.response?.data?.message || 'Không thể tham gia phòng');
        }
    };

    const handleStartGame = async (roomId, roomName) => {
        try {
            console.log('Starting game for room:', roomId);
            const gameConfigId = `${roomId}_${Date.now()}`;
            
            // Emit start game event và đợi server xác nhận
            console.log('Emitting start_game event');
            socket.emit('game:start', { 
                roomId: roomId.toString(), // roomId gốc để fetch từ DB
                roomName,
                gameConfigId // ID đầy đủ để join socket room
            }, (response) => {
                if (response.success) {
                    console.log('Game start confirmed by server, client count:', response.clientCount);
                    // Đợi một chút để đảm bảo broadcast đã được gửi
                    setTimeout(() => {
                        navigate(`/game-config/${gameConfigId}`);
                    }, 100);
                } else {
                    console.error('Failed to start game:', response.error);
                    toast.error('Không thể bắt đầu game. Vui lòng thử lại.');
                }
            });
        } catch (error) {
            console.error('Error starting game:', error);
            toast.error('Không thể bắt đầu game. Vui lòng thử lại.');
        }
    };

    const renderMembers = (members, hostId, maxPlayers, roomId, roomName) => {
        const isHost = hostId === currentUserId;

        return (
            <div className="mt-2">
                <div className="font-medium text-sm mb-2 flex items-center gap-2">
                    <FaUsers />
                    <span>Thành viên
                        <div className="badge badge-primary mx-2">
                            {members.length}/{maxPlayers}
                        </div>
                        {members.length === maxPlayers && (
                            <div className="badge badge-error">
                                Full
                            </div>
                        )}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {members.map((member) => (
                        <div key={member.userId} 
                            className="flex items-center gap-2 bg-base-200 rounded-lg p-2 hover:bg-base-300 transition-colors group"
                        >
                            <div className="relative">
                                <img
                                    src={member.avatarUrl || '/default-avatar.png'}
                                    alt={member.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                {member.userId === hostId && (
                                    <FaCrown 
                                        className="absolute -top-1 -right-1 text-yellow-500 w-3 h-3"
                                        title="Chủ phòng"
                                    />
                                )}
                            </div>
                            <span className="font-medium truncate flex-1">{member.username}</span>
                            {isHost && member.userId !== hostId && (
                                <button
                                    onClick={() => handleKickMember(roomId, member.userId, member.username, roomName)}
                                    className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Kick thành viên"
                                >
                                    <FaUserTimes />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {isHost && members.length === maxPlayers && (
                    <div className="mt-4">
                        <button
                            onClick={() => handleStartGame(roomId, roomName)}
                            className="btn btn-primary w-full"
                        >
                            Bắt đầu game
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderRoom = (room) => {
        const isHost = room.hostId === currentUserId;
        const isMember = room.players.some(member => member.userId === currentUserId);
        const canStart = isHost && room.players.length === room.maxPlayers;

        return (
            <div key={room._id} className="bg-base-100 shadow-xl ring-2 ring-primary/50 w-full max-w-4xl">
                <div className="card-body">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="card-title flex items-center gap-2">
                                {room.name}
                                {room.status === 'waiting' && (
                                    <span className="badge badge-success badge-sm">Đang chờ</span>
                                )}
                                {room.status === 'playing' && (
                                    <span className="badge badge-warning badge-sm">Đang chơi</span>
                                )}
                            </h2>

                            <p className="text-sm text-base-content/70">
                                Mã phòng:
                                <span
                                    onClick={() => handleCopyInviteCode(room.inviteCode)}
                                    className="ml-2 font-mono bg-base-200 px-2 py-1 rounded cursor-pointer hover:bg-base-300 active:bg-base-300/70"
                                    title="Click để sao chép"
                                >
                                    {room.inviteCode}
                                    <FaCopy className="inline-block ml-2 w-3 h-3" />
                                </span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {isHost ? (
                                <>
                                    <button
                                        onClick={() => handleDeleteRoom(room._id, room.name)}
                                        className="btn btn-error btn-sm gap-2"
                                        title="Xóa phòng"
                                    >
                                        <FaTrash />
                                        <span className="hidden sm:inline">Xóa phòng</span>
                                    </button>
                                    <button
                                        className="btn btn-circle btn-sm btn-ghost"
                                        onClick={() => handleAddBot(room._id, room.name)}
                                        title="Thêm bot"
                                    >
                                        <FaRobot />
                                    </button>
                                </>
                            ) : isMember ? (
                                <button
                                    onClick={() => handleLeaveRoom(room._id, room.name)}
                                    className="btn btn-warning btn-sm gap-2"
                                    title="Rời phòng"
                                >
                                    <FaDoorOpen />
                                    <span className="hidden sm:inline">Rời phòng</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleJoinRoom(room._id)}
                                    className="btn btn-primary btn-sm gap-2"
                                    disabled={room.players.length >= room.maxPlayers}
                                >
                                    <FaUsers />
                                    <span className="hidden sm:inline">
                                        {room.players.length >= room.maxPlayers ? 'Phòng đầy' : 'Tham gia'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Hiển thị danh sách thành viên */}
                    <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Thành viên ({room.players.length}/{room.maxPlayers})</h3>
                        {renderMembers(room.players, room.hostId, room.maxPlayers, room._id, room.name)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card bg-base-100 shadow-xl w-full max-w-4xl">
            <div className="card-body">
                <h2 className="card-title mb-4">Phòng có sẵn</h2>
                {loading ? (
                    <div className="flex justify-center">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : rooms.length > 0 ? (
                    <div className="overflow-x-auto">
                        {rooms.map(room => renderRoom(room))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        Chưa có phòng nào. Hãy tạo phòng mới!
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomList;
