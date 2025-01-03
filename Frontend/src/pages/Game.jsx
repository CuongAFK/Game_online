import React, { useState, useEffect, useRef } from 'react';
import GameMap from '../components/game/GameMap';

const Game = () => {
    const containerRef = useRef(null);
    const numPlayers = 4; // Số người chơi (có thể lấy từ props hoặc context)

    // Tính kích thước bản đồ dựa trên số người chơi
    const [mapSize] = useState(() => {
        const baseSize = 20; // Kích thước cơ bản cho 2 người chơi
        const additionalRows = Math.max(0, numPlayers - 2) * 10; // Thêm 10 hàng cho mỗi người chơi thêm
        return {
            ROWS: baseSize + additionalRows, // Chiều Y tăng theo số người chơi
            COLS: 30 // Chiều X cố định
        };
    });

    const [cellSize, setCellSize] = useState(0);
    const [gameMap, setGameMap] = useState([]);

    // Xác suất xuất hiện của các loại địa hình
    const TERRAIN_WEIGHTS = {
        grass: 0.4,  // 40% là cỏ
        land: 0.2,   // 20% là đất
        rock: 0.3,   // 30% là đá
        lake: 0.1     // 10% là biển
    };

    // Xác suất xuất hiện của các loại object trên từng loại địa hình
    const OBJECT_SPAWN_RATES = {
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
    };

    // Quy tắc địa hình
    const TERRAIN_RULES = {
        lake: ['lake', 'grass'],  // Biển chỉ có thể kề với biển hoặc cỏ
        rock: ['rock', 'mountain', 'land'],  // Đá có thể kề với đá, núi
        grass: ['grass', 'lake', 'land'],  // Cỏ có thể kề với nhiều loại
        land: ['land', 'grass', 'rock']  // Đất chỉ có thể kề với đất hoặc cỏ
    };

    // Quy tắc đặt object
    const OBJECT_RULES = {
        tree: ['grass'],            // Cây chỉ mọc trên cỏ
        stone: ['rock'],            // Đá chỉ xuất hiện trên núi đá
        gold: ['rock']              // Vàng chỉ xuất hiện trên núi đá
    };

    // Chọn ngẫu nhiên địa hình dựa trên trọng số
    const getRandomTerrain = () => {
        const random = Math.random();
        let sum = 0;

        for (const [terrain, weight] of Object.entries(TERRAIN_WEIGHTS)) {
            sum += weight;
            if (random < sum) {
                return terrain;
            }
        }

        return 'grass'; // Mặc định là cỏ
    };

    // Kiểm tra và chọn object cho ô dựa trên tỷ lệ xuất hiện
    const getRandomObject = (terrain) => {
        // Lọc các object có thể xuất hiện trên địa hình này
        const possibleObjects = Object.entries(OBJECT_RULES)
            .filter(([_, validTerrains]) => validTerrains.includes(terrain))
            .map(([obj]) => obj);

        // Nếu không có object nào có thể xuất hiện
        if (possibleObjects.length === 0) return null;

        // Chọn ngẫu nhiên một object từ danh sách có thể
        for (const objType of possibleObjects) {
            const spawnRate = OBJECT_SPAWN_RATES[objType][terrain];
            if (spawnRate && Math.random() < spawnRate) {
                // Xác định số lượng dựa vào loại object
                const countRates = objType === 'tree' ?
                    OBJECT_SPAWN_RATES.tree.treeCount :
                    OBJECT_SPAWN_RATES[objType].resourceCount;

                let sum = 0;
                const random = Math.random();

                for (const [count, rate] of Object.entries(countRates)) {
                    sum += rate;
                    if (random < sum) {
                        return { type: objType, count: parseInt(count) };
                    }
                }
            }
        }

        return null;
    };

    // Kiểm tra địa hình xung quanh có hợp lệ không
    const isValidTerrain = (map, row, col, type) => {
        const adjacentCells = [
            [row - 1, col], // trên
            [row + 1, col], // dưới
            [row, col - 1], // trái
            [row, col + 1]  // phải
        ];

        for (const [r, c] of adjacentCells) {
            if (r >= 0 && r < map.length && c >= 0 && c < map[0].length) {
                const adjacentType = map[r][c]?.terrain;
                if (adjacentType && !TERRAIN_RULES[type].includes(adjacentType)) {
                    return false;
                }
            }
        }
        return true;
    };

    // Tạo map với 2 layer
    const generateMap = () => {
        const terrainMap = Array(mapSize.ROWS).fill().map(() => Array(mapSize.COLS).fill(null));

        // Layer 1: Địa hình
        for (let row = 0; row < mapSize.ROWS; row++) {
            for (let col = 0; col < mapSize.COLS; col++) {
                if (!terrainMap[row][col]) {
                    let attempts = 0;
                    let selectedTerrain;

                    // Thử tối đa 20 lần để tìm địa hình phù hợp
                    do {
                        selectedTerrain = getRandomTerrain();
                        attempts++;
                    } while (!isValidTerrain(terrainMap, row, col, selectedTerrain) && attempts < 20);

                    // Nếu không tìm được địa hình phù hợp, mặc định là cỏ
                    terrainMap[row][col] = {
                        terrain: isValidTerrain(terrainMap, row, col, selectedTerrain) ? selectedTerrain : 'grass'
                    };
                }
            }
        }

        // Layer 2: Object
        for (let row = 0; row < mapSize.ROWS; row++) {
            for (let col = 0; col < mapSize.COLS; col++) {
                const cell = terrainMap[row][col];
                const object = getRandomObject(cell.terrain);
                if (object) {
                    cell.object = object.type;
                    cell.objectCount = object.count;
                }
            }
        }

        return terrainMap;
    };

    // Tính toán kích thước ô để map vừa với chiều rộng màn hình
    const calculateCellSize = () => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const containerWidth = container.clientWidth;

        // Tính cellSize dựa trên chiều rộng container và số cột
        console.log("containerWidth:" + containerWidth);
        const cellSize = Math.floor(((containerWidth) / mapSize.COLS) - 1);
        console.log("cellSize:" + cellSize);
        setCellSize(cellSize);
    };

    useEffect(() => {
        setGameMap(generateMap());
        calculateCellSize();

        const handleResize = () => calculateCellSize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="w-screen h-screen flex flex-col">
            <div
                ref={containerRef}
                className="flex-1 overflow-y-scroll overflow-x-hidden hide-scrollbar"
            >
                <GameMap
                    map={gameMap}
                    config={{ ...mapSize, CELL_SIZE: cellSize }}
                />
            </div>
        </div>
    );
};

export default Game;