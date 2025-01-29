// Lưu trữ thông tin về các room và clients
const rooms = new Map();
// Lưu trữ phòng hiện tại của mỗi client
const clientRooms = new Map();

// Debug function
function logRoomsState() {
    console.log('\n=== Current Rooms State ===');
    console.log('Total rooms:', rooms.size);
    rooms.forEach((clients, roomId) => {
        console.log(`Room ${roomId}:`, {
            clientCount: clients.size,
            clients: Array.from(clients)
        });
    });
    console.log('=========================\n');
}

// Debug function cho client rooms
function logClientRoomsState() {
    console.log('\n=== Current Client Rooms State ===');
    console.log('Total clients:', clientRooms.size);
    clientRooms.forEach((roomId, clientId) => {
        console.log(`Client ${clientId} is in room: ${roomId}`);
    });
    console.log('=========================\n');
}

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        logRoomsState();
        logClientRoomsState();

        // Join room
        socket.on('join:room', async (roomId) => {
            if (!roomId) {
                console.error('Invalid roomId:', roomId);
                return;
            }

            try {
                // Rời phòng cũ nếu có
                const currentRoom = clientRooms.get(socket.id);
                if (currentRoom) {
                    console.log(`Client ${socket.id} leaving current room:`, currentRoom);
                    await socket.leave(currentRoom);
                    if (rooms.has(currentRoom)) {
                        rooms.get(currentRoom).delete(socket.id);
                        if (rooms.get(currentRoom).size === 0) {
                            rooms.delete(currentRoom);
                        }
                    }
                }

                console.log(`Client ${socket.id} joining room:`, roomId);
                
                // Join phòng mới
                await socket.join(roomId);
                clientRooms.set(socket.id, roomId);
                
                // Lưu thông tin room
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, new Set());
                }
                rooms.get(roomId).add(socket.id);
                
                console.log(`Room ${roomId} now has ${rooms.get(roomId).size} clients`);
                logRoomsState();
                logClientRoomsState();
            } catch (error) {
                console.error('Error joining room:', error);
            }
        });

        // Leave room
        socket.on('leave:room', async (roomId) => {
            if (!roomId) {
                console.error('Invalid roomId:', roomId);
                return;
            }

            try {
                console.log(`Client ${socket.id} leaving room:`, roomId);
                
                // Rời phòng
                await socket.leave(roomId);
                clientRooms.delete(socket.id);
                
                // Cập nhật thông tin room
                if (rooms.has(roomId)) {
                    rooms.get(roomId).delete(socket.id);
                    if (rooms.get(roomId).size === 0) {
                        rooms.delete(roomId);
                    }
                }
                
                logRoomsState();
                logClientRoomsState();
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        });

        // Start game
        socket.on('game:start', async (data, callback) => {
            try {
                const { roomId, roomName, gameConfigId } = data;
                console.log('Received game:start event:', data);
                
                if (!roomId || !gameConfigId) {
                    throw new Error('Invalid roomId or gameConfigId');
                }

                // Broadcast đến tất cả client trong room gốc
                io.in(roomId).emit('room:game_started', {
                    roomId,
                    roomName,
                    gameConfigId
                });
                
                // Log thông tin
                const roomClients = await io.in(roomId).allSockets();
                console.log(`Broadcasting game start to ${roomClients.size} clients in room ${roomId}`);
                logRoomsState();
                logClientRoomsState();
                
                // Trả về kết quả thành công
                callback({ 
                    success: true,
                    clientCount: roomClients.size
                });
                
            } catch (error) {
                console.error('Error in game:start handler:', error);
                callback({ success: false, error: error.message });
            }
        });

        // Cleanup khi client disconnect
        socket.on('disconnect', () => {
            console.log(`Client ${socket.id} disconnected`);
            
            // Xóa socket khỏi phòng hiện tại
            const currentRoom = clientRooms.get(socket.id);
            if (currentRoom && rooms.has(currentRoom)) {
                rooms.get(currentRoom).delete(socket.id);
                if (rooms.get(currentRoom).size === 0) {
                    rooms.delete(currentRoom);
                }
            }
            clientRooms.delete(socket.id);
            
            logRoomsState();
            logClientRoomsState();
        });
    });
}

module.exports = setupSocketHandlers;
