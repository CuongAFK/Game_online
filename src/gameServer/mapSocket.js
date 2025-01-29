const io = require('socket.io');
const mapModel = require('./gameModels/mapModel');

class MapSocket {
    constructor() {
        this.socketServer = null;
    }

    // Khởi tạo WebSocket server
    initialize(server) {
        this.socketServer = io(server);
        
        this.socketServer.on('connection', (socket) => {
            console.log('Client connected to map updates');
            
            // Gửi toàn bộ dữ liệu bản đồ khi client kết nối
            this.sendFullMapData(socket);

            socket.on('disconnect', () => {
                console.log('Client disconnected from map updates');
            });
        });
    }

    // Gửi toàn bộ dữ liệu bản đồ cho client
    sendFullMapData(socket) {
        const mapData = {
            terrain: Object.fromEntries(mapModel.terrainMap),
            objects: Object.fromEntries(mapModel.objectMap),
            houses: Object.fromEntries(mapModel.houseMap),
            size: mapModel.size
        };
        socket.emit('mapInitialData', mapData);
    }

    // Broadcast cập nhật địa hình
    broadcastTerrainUpdate(row, col, newTerrain) {
        if (this.socketServer) {
            this.socketServer.emit('terrainUpdate', { row, col, terrain: newTerrain });
        }
    }

    // Broadcast cập nhật object
    broadcastObjectUpdate(row, col, object) {
        if (this.socketServer) {
            this.socketServer.emit('objectUpdate', { row, col, object });
        }
    }

    // Broadcast cập nhật nhà
    broadcastHouseUpdate(row, col, house) {
        if (this.socketServer) {
            this.socketServer.emit('houseUpdate', { row, col, house });
        }
    }

    // Broadcast toàn bộ cập nhật cho một ô
    broadcastCellUpdate(row, col, updates) {
        if (this.socketServer) {
            this.socketServer.emit('cellUpdate', { row, col, updates });
        }
    }
}

// Export single instance
module.exports = new MapSocket();
