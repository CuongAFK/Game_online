import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCrown } from 'react-icons/fa';

const RoomList = ({ rooms, loading, onJoinRoom, onLeaveRoom }) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const isPlayerInRoom = (room) => {
        return room.players.some(p => p.userId === currentUser._id || p.userId._id === currentUser._id);
    };

    const isHostOfRoom = (room) => {
        return room.hostId === currentUser._id || room.hostId._id === currentUser._id;
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
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tên phòng</th>
                                    <th>Người chơi</th>
                                    <th>Mã phòng</th>
                                    <th>Thành viên</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map(room => {
                                    const inRoom = isPlayerInRoom(room);
                                    const isHost = isHostOfRoom(room);
                                    
                                    return (
                                        <tr key={room._id}>
                                            <td>{room.name}</td>
                                            <td>{room.players.length}/{room.maxPlayers}</td>
                                            <td>{room.inviteCode}</td>
                                            <td>
                                                {room.players.map(player => (
                                                    <div key={player.userId} className="relative group">
                                                        <div className={`relative w-12 h-12 rounded-full overflow-hidden
                                                            ${player.role === 'host' 
                                                                ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-base-100' 
                                                                : ''
                                                            }`}
                                                        >
                                                            <img 
                                                                src={player.avatarUrl} 
                                                                alt={player.username}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {/* Vương miện cho chủ phòng */}
                                                            {player.role === 'host' && (
                                                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-yellow-400">
                                                                    <FaCrown size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Tooltip tên người chơi */}
                                                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                                                            opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                                            bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                                                        >
                                                            {player.username}
                                                        </div>
                                                    </div>
                                                ))}
                                            </td>
                                            <td>
                                                {inRoom ? (
                                                    <button 
                                                        className="btn btn-error btn-sm"
                                                        onClick={() => onLeaveRoom(room._id)}
                                                    >
                                                        {isHost ? 'Xóa phòng' : 'Thoát phòng'}
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => onJoinRoom(room.inviteCode)}
                                                    >
                                                        Tham gia
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
