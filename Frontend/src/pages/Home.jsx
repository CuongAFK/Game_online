import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Header from '../components/Header';
import RoomList from '../components/RoomList';
import JoinRoomForm from '../components/JoinRoomForm';

const Home = () => {
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/rooms');
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
            const name = `Phòng của ${currentUser.username}`;
            await axios.post('/api/rooms', { name });
            toast.success('Tạo phòng thành công!');
            fetchRooms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tạo phòng');
        }
    };

    const handleJoinRoom = async (inviteCode) => {
        try {
            await axios.post('/api/rooms/join', { inviteCode });
            toast.success('Tham gia phòng thành công!');
            fetchRooms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tham gia phòng');
        }
    };

    const handleLeaveRoom = async () => {
        try {
            const response = await axios.post('/api/rooms/leave');
            toast.success(response.data.message);
            fetchRooms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể rời phòng');
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex flex-col">
            <Header />
            
            <div className="flex-1 container mx-auto p-4">
                <div className="flex flex-col items-center gap-8 mt-8">
                    {/* Create Room Button */}
                    <button 
                        className="btn btn-primary btn-lg w-64"
                        onClick={handleCreateRoom}
                    >
                        Tạo phòng mới
                    </button>

                    {/* Join Room Form */}
                    <JoinRoomForm onJoinRoom={handleJoinRoom} />

                    {/* Available Rooms */}
                    <RoomList 
                        rooms={rooms} 
                        loading={loading} 
                        onJoinRoom={handleJoinRoom}
                        onLeaveRoom={handleLeaveRoom}
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
