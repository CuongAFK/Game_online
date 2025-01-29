// Cấu hình và quy tắc cho map game
const MAP_CONFIG = {
    // Xác suất xuất hiện của các loại địa hình
    TERRAIN_WEIGHTS: {
        grass: 0.4,  // 40% là cỏ
        land: 0.2,   // 20% là đất
        rock: 0.3,   // 30% là đá
        lake: 0.05,  // 5% là biển
        lava: 0.05   // 5% là lava 
    },

    // Xác suất xuất hiện của các loại object trên từng loại địa hình
    OBJECT_SPAWN_RATES: {
        tree: {
            grass: 0.5,    // 50% cơ hội xuất hiện cây trên cỏ
            treeCount: {   // Tỷ lệ số lượng cây khi xuất hiện
                1: 0.4,    // 40% ra 1 cây
                2: 0.35,   // 35% ra 2 cây
                3: 0.25    // 25% ra 3 cây
            }
        },
        stone: {
            rock: 0.3,     // 30% đá trên núi đá
            resourceCount: {
                1: 0.4,    // 40% ra 1 cục
                2: 0.35,   // 35% ra 2 cục
                3: 0.25    // 25% ra 3 cục
            }
        },
        gold: {
            rock: 0.2,     // 20% vàng trên núi đá
            resourceCount: {
                1: 0.5,    // 50% ra 1 cục
                2: 0.3,    // 30% ra 2 cục
                3: 0.1     // 10% ra 3 cục
            }
        }
    },

    // Quy tắc địa hình
    TERRAIN_RULES: {
        lake: ['lake', 'grass'],  // Biển chỉ có thể kề với biển hoặc cỏ
        rock: ['rock', 'mountain', 'land', 'lava'],  // Đá có thể kề với đá, núi
        grass: ['grass', 'lake', 'land'],  // Cỏ có thể kề với nhiều loại
        land: ['land', 'grass', 'rock'],  // Đất chỉ có thể kề với đất hoặc cỏ
        lava: ['rock']  // Lava chỉ có thể kề với đá
    },

    // Quy tắc đặt object
    OBJECT_RULES: {
        tree: ['grass'],            // Cây chỉ mọc trên cỏ
        stone: ['rock'],            // Đá chỉ xuất hiện trên núi đá
        gold: ['rock']              // Vàng chỉ xuất hiện trên núi đá
    },

    // Config cho spawn nhà
    HOUSE_SPAWN_STRATEGY: {
        MIN_DISTANCE: 8,
        VALID_TERRAINS: ['grass', 'land'],
        HOUSE_TYPES: ['ky-si', 'ac-quy', 'linh-muc']
    }
};

const mapSocket = require('../mapSocket');

class MapModel {
    constructor() {
        this.terrainMap = new Map(); // Lưu địa hình
        this.objectMap = new Map();  // Lưu objects
        this.houseMap = new Map();   // Lưu nhà
        this.size = { ROWS: 0, COLS: 0 };
    }

    // Tạo key duy nhất cho mỗi ô
    _createKey(row, col) {
        return `${row},${col}`;
    }

    // Phân tích key thành tọa độ
    _parseKey(key) {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
    }

    // Tính toán kích thước map dựa trên số người chơi
    calculateMapSize(numPlayers) {
        const baseSize = 20; // Kích thước cơ bản cho 2 người chơi
        const additionalRows = Math.max(0, numPlayers - 2) * 5; // Thêm 5 hàng cho mỗi người chơi thêm
        return {
            ROWS: baseSize + additionalRows,
            COLS: 30 // Chiều X cố định
        };
    }

    // Chọn ngẫu nhiên địa hình dựa trên trọng số
    getRandomTerrain() {
        const random = Math.random();
        let sum = 0;

        for (const [terrain, weight] of Object.entries(MAP_CONFIG.TERRAIN_WEIGHTS)) {
            sum += weight;
            if (random < sum) {
                return terrain;
            }
        }

        return 'grass'; // Mặc định là cỏ
    }

    // Chọn ngẫu nhiên số lượng tài nguyên
    getRandomResourceCount(resourceType) {
        const random = Math.random();
        let sum = 0;
        const countRates = MAP_CONFIG.OBJECT_SPAWN_RATES[resourceType].resourceCount ||
                          MAP_CONFIG.OBJECT_SPAWN_RATES[resourceType].treeCount;

        for (const [count, rate] of Object.entries(countRates)) {
            sum += rate;
            if (random < sum) {
                return parseInt(count);
            }
        }

        return 1; // Mặc định là 1
    }

    // Kiểm tra và chọn object cho ô dựa trên tỷ lệ xuất hiện
    getRandomObject(terrain) {
        const possibleObjects = Object.entries(MAP_CONFIG.OBJECT_RULES)
            .filter(([_, validTerrains]) => validTerrains.includes(terrain))
            .map(([obj]) => obj);

        if (possibleObjects.length === 0) return undefined;

        const selectedObject = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
        const spawnRate = MAP_CONFIG.OBJECT_SPAWN_RATES[selectedObject][terrain];
        
        if (Math.random() < spawnRate) {
            return {
                type: selectedObject,
                count: this.getRandomResourceCount(selectedObject)
            };
        }

        return undefined;
    }

    // Kiểm tra vị trí spawn nhà hợp lệ
    isValidHousePosition(row, col, playerId) {
        const key = this._createKey(row, col);
        const terrain = this.terrainMap.get(key);

        if (!MAP_CONFIG.HOUSE_SPAWN_STRATEGY.VALID_TERRAINS.includes(terrain)) {
            return false;
        }

        // Kiểm tra khoảng cách với nhà khác
        for (const [houseKey, house] of this.houseMap) {
            if (house.playerId !== playerId) {
                const pos = this._parseKey(houseKey);
                const distance = Math.sqrt(Math.pow(row - pos.row, 2) + Math.pow(col - pos.col, 2));
                if (distance < MAP_CONFIG.HOUSE_SPAWN_STRATEGY.MIN_DISTANCE) {
                    return false;
                }
            }
        }

        return true;
    }

    // Tạo vùng spawn cho các người chơi
    getSpawnZones(numPlayers) {
        const zones = {};
        if (numPlayers <= 4) {
            // 4 góc
            zones.player1 = { startRow: 0, endRow: Math.floor(this.size.ROWS * 0.25), 
                            startCol: 0, endCol: Math.floor(this.size.COLS * 0.25) };
            zones.player2 = { startRow: 0, endRow: Math.floor(this.size.ROWS * 0.25), 
                            startCol: Math.floor(this.size.COLS * 0.75), endCol: this.size.COLS };
            zones.player3 = { startRow: Math.floor(this.size.ROWS * 0.75), endRow: this.size.ROWS, 
                            startCol: 0, endCol: Math.floor(this.size.COLS * 0.25) };
            zones.player4 = { startRow: Math.floor(this.size.ROWS * 0.75), endRow: this.size.ROWS, 
                            startCol: Math.floor(this.size.COLS * 0.75), endCol: this.size.COLS };
        } else {
            // Chia đều theo chiều dọc
            const heightPerPlayer = Math.floor(this.size.ROWS / numPlayers);
            for (let i = 0; i < numPlayers; i++) {
                const isLeft = i % 2 === 0;
                zones[`player${i + 1}`] = {
                    startRow: heightPerPlayer * i,
                    endRow: heightPerPlayer * (i + 1),
                    startCol: isLeft ? 0 : Math.floor(this.size.COLS * 0.75),
                    endCol: isLeft ? Math.floor(this.size.COLS * 0.25) : this.size.COLS
                };
            }
        }
        return zones;
    }

    // Spawn nhà cho players
    spawnHouses(numPlayers) {
        const zones = this.getSpawnZones(numPlayers);
        
        for (let i = 0; i < numPlayers; i++) {
            const playerId = `player${i + 1}`;
            const zone = zones[playerId];
            const houseType = MAP_CONFIG.HOUSE_SPAWN_STRATEGY.HOUSE_TYPES[i % MAP_CONFIG.HOUSE_SPAWN_STRATEGY.HOUSE_TYPES.length];
            
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * (zone.endRow - zone.startRow)) + zone.startRow;
                const col = Math.floor(Math.random() * (zone.endCol - zone.startCol)) + zone.startCol;
                
                if (this.isValidHousePosition(row, col, playerId)) {
                    const key = this._createKey(row, col);
                    this.houseMap.set(key, {
                        type: houseType,
                        level: 0,
                        playerId: playerId,
                        isCurrentPlayer: playerId === 'player1'
                    });
                    
                    // Xóa object ở vị trí đặt nhà nếu có
                    this.objectMap.delete(key);
                    placed = true;
                }
                attempts++;
            }
        }
    }

    // Tạo map mới
    generateMap(numPlayers) {
        this.size = this.calculateMapSize(numPlayers);
        
        // Khởi tạo địa hình
        for (let row = 0; row < this.size.ROWS; row++) {
            for (let col = 0; col < this.size.COLS; col++) {
                const key = this._createKey(row, col);
                const terrain = this.getRandomTerrain();
                this.terrainMap.set(key, terrain);

                // Thêm object nếu có
                const object = this.getRandomObject(terrain);
                if (object) {
                    this.objectMap.set(key, object);
                }
            }
        }

        // Spawn nhà cho players
        this.spawnHouses(numPlayers);

        // Chuyển đổi sang định dạng phù hợp với client
        return this.getMapState();
    }

    // Lấy trạng thái map hiện tại
    getMapState() {
        const mapState = Array(this.size.ROWS).fill().map(() => 
            Array(this.size.COLS).fill().map(() => ({
                terrain: 'grass',  // Mặc định là cỏ
                object: undefined,
                objectCount: 0,
                house: undefined
            }))
        );

        // Điền thông tin từ các Map
        for (let row = 0; row < this.size.ROWS; row++) {
            for (let col = 0; col < this.size.COLS; col++) {
                const key = this._createKey(row, col);
                
                // Địa hình
                const terrain = this.terrainMap.get(key);
                if (terrain) {
                    mapState[row][col].terrain = terrain;
                }

                // Object
                const object = this.objectMap.get(key);
                if (object) {
                    mapState[row][col].object = object.type;
                    mapState[row][col].objectCount = object.count;
                }

                // Nhà
                const house = this.houseMap.get(key);
                if (house) {
                    mapState[row][col].house = house;
                }
            }
        }

        return mapState;
    }

    // Lấy thông tin của một ô cụ thể
    getTile(row, col) {
        const key = this._createKey(row, col);
        return {
            terrain: this.terrainMap.get(key) || 'grass',
            object: this.objectMap.get(key),
            house: this.houseMap.get(key)
        };
    }

    // Cập nhật thông tin của một ô
    updateCell(row, col, updates) {
        const key = this._createKey(row, col);
        
        if (updates.terrain) {
            this.terrainMap.set(key, updates.terrain);
            mapSocket.broadcastTerrainUpdate(row, col, updates.terrain);
        }
        
        if (updates.object) {
            this.objectMap.set(key, updates.object);
            mapSocket.broadcastObjectUpdate(row, col, updates.object);
        } else if (updates.object === null) {
            this.objectMap.delete(key);
        }
        
        if (updates.house) {
            this.houseMap.set(key, updates.house);
            mapSocket.broadcastHouseUpdate(row, col, updates.house);
        } else if (updates.house === null) {
            this.houseMap.delete(key);
        }

        // Broadcast toàn bộ thay đổi
        mapSocket.broadcastCellUpdate(row, col, updates);
    }

    // Lấy trạng thái map hiện tại
    getMapState() {
        const mapState = Array(this.size.ROWS).fill().map(() => 
            Array(this.size.COLS).fill().map(() => ({
                terrain: 'grass',  // Mặc định là cỏ
                object: undefined,
                objectCount: 0,
                house: undefined
            }))
        );

        // Điền thông tin từ các Map
        for (let row = 0; row < this.size.ROWS; row++) {
            for (let col = 0; col < this.size.COLS; col++) {
                const key = this._createKey(row, col);
                
                // Địa hình
                const terrain = this.terrainMap.get(key);
                if (terrain) {
                    mapState[row][col].terrain = terrain;
                }

                // Object
                const object = this.objectMap.get(key);
                if (object) {
                    mapState[row][col].object = object.type;
                    mapState[row][col].objectCount = object.count;
                }

                // Nhà
                const house = this.houseMap.get(key);
                if (house) {
                    mapState[row][col].house = house;
                }
            }
        }

        return mapState;
    }
}

module.exports = new MapModel();