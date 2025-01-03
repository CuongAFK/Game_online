import React from 'react';
import { FaCrown, FaTrash, FaDoorOpen, FaUsers, FaCopy, FaUserTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const RoomList = ({ rooms, loading, onJoinRoom, onLeaveRoom, onRefresh }) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser._id;

    const handleCopyInviteCode = async (inviteCode) => {
        try {
            await navigator.clipboard.writeText(inviteCode);
            toast.success('Đã sao chép mã phòng!', {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error) {
            console.error('Lỗi sao chép:', error);
            toast.error('Không thể sao chép mã phòng', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleKickMember = async (roomId, userId) => {
        try {
            console.log('Kicking member:', { roomId, userId }); // Debug log
            await axios.post('/api/rooms/kick', { 
                roomId: roomId.toString(), 
                userId: userId.toString() 
            });
            toast.success('Đã kick thành viên ra khỏi phòng', {
                position: "top-right",
                autoClose: 2000,
            });
            // Refresh danh sách phòng sau khi kick
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error('Lỗi kick thành viên:', error.response?.data || error);
            toast.error(error.response?.data?.message || 'Không thể kick thành viên', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const renderMembers = (members, hostId, maxPlayers, roomId) => {
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
                                    onClick={() => handleKickMember(roomId, member.userId)}
                                    className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Kick thành viên"
                                >
                                    <FaUserTimes />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderRoom = (room) => {
        const isHost = room.hostId === currentUserId;
        const isMember = room.players.some(member => member.userId === currentUserId);

        return (
            <div key={room._id} className="bg-base-100 shadow-xl ring-2 ring-primary/50 w-full max-w-4xl">
                <div className="card-body">
                    <div className="flex justify-between items-start">

                        <div>
                            <h2 className="card-title flex items-center gap-2">
                                {room.name}
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
                                <button
                                    onClick={() => onLeaveRoom(room._id)}
                                    className="btn btn-error btn-sm gap-2"
                                    title="Xóa phòng"
                                >
                                    <FaTrash />
                                    <span className="hidden sm:inline">Xóa phòng</span>
                                </button>
                            ) : isMember ? (
                                <button
                                    onClick={() => onLeaveRoom(room._id)}
                                    className="btn btn-warning btn-sm gap-2"
                                    title="Rời phòng"
                                >
                                    <FaDoorOpen />
                                    <span className="hidden sm:inline">Rời phòng</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => onJoinRoom(room.inviteCode)}
                                    className="btn btn-primary btn-sm gap-2"
                                >
                                    <FaUsers />
                                    <span className="hidden sm:inline">Tham gia</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Danh sách thành viên */}
                    {renderMembers(room.players, room.hostId, room.maxPlayers, room._id)}
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
