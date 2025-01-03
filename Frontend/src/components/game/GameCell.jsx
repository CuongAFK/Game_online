import React, { useMemo, useRef, useEffect, useState } from 'react';

const GameCell = ({ terrain, object, objectCount = 1, size, player }) => {
    // Random số 0-2 cho loại cỏ và 0-1 cho loại cây
    const grassType = useMemo(() => Math.floor(Math.random() * 3), []);
    const treeTypes = useMemo(() => {
        return Array(objectCount).fill(0).map(() => Math.floor(Math.random() * 2));
    }, [objectCount]);

    const cellStyle = {
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        overflow: 'visible',
        boxSizing: 'border-box',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        cursor: 'help' // Thêm cursor help để chỉ ra có tooltip
    };

    // Layer 1: Địa hình nền
    const terrainStyle = {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box'
    };

    // Xác định background cho terrain
    switch (terrain) {
        case 'land':
            terrainStyle.backgroundImage = 'url("/map/land.jpg")';
            break;
        case 'grass':
            terrainStyle.backgroundImage = `url("/map/grass-${grassType}.jpg")`;
            break;
        case 'rock':
            terrainStyle.backgroundImage = 'url("/map/rock.jpg")';
            break;
        case 'lake':
            terrainStyle.backgroundImage = 'url("/map/lake.jpg")';
            break;
        default:
            terrainStyle.backgroundColor = '#e9ecef';
    }

    // Style cho cây
    const getTreeStyle = (index) => {
        // Cấu hình cơ bản cho mỗi loại cây
        const treeConfigs = {
            single: { size: 120, top: -35, left: -10, transform: 'none' },
            main: { size: 120, top: -40, left: -10, transform: 'none' },
            leftTree: { size: 100, top: -10, left: -20, transform: 'rotate(-15deg)' },
            rightTree: { size: 80, top: 20, left: 20, transform: 'rotate(15deg)' },
            smallLeft: { size: 100, top: 0, left: -20, transform: 'rotate(-5deg)' }
        };

        // Chọn cấu hình dựa vào số lượng cây và vị trí
        let config;
        if (objectCount === 1) {
            config = treeConfigs.single;
        } else if (objectCount === 2) {
            config = index === 0 ? treeConfigs.main : treeConfigs.smallLeft;
        } else {
            if (index === 0) {
                config = treeConfigs.main;
            } else if (index === 1) {
                config = treeConfigs.leftTree;
            } else {
                config = treeConfigs.rightTree;
            }
        }

        return {
            width: `${config.size}%`,
            height: `${config.size}%`,
            position: 'absolute',
            top: `${config.top}%`,
            left: `${config.left}%`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            transform: config.transform,
            transformOrigin: 'bottom center',
            transition: 'transform 0.3s ease',
            boxSizing: 'border-box'
        };
    };

    // Style cho khoáng sản
    const getResourceStyle = (index) => {
        // Cấu hình cơ bản cho từng vị trí khoáng sản
        const resourceConfigs = {
            single: { size: 80, top: 10, left: 10 },
            main: { size: 90, top: -30, left: 10 },
            leftResource: { size: 70, top: 15, left: 2 },
            rightResource: { size: 55, top: 45, left: 40 }
        };

        // Chọn cấu hình dựa vào số lượng và vị trí
        let config;
        if (objectCount === 1) {
            config = resourceConfigs.single;
        } else if (objectCount === 2) {
            config = index === 0 ? resourceConfigs.main : resourceConfigs.leftResource;
        } else {
            if (index === 0) {
                config = resourceConfigs.main;
            } else if (index === 1) {
                config = resourceConfigs.leftResource;
            } else {
                config = resourceConfigs.rightResource;
            }
        }

        return {
            width: `${config.size}%`,
            height: `${config.size}%`,
            position: 'absolute',
            top: `${config.top}%`,
            left: `${config.left}%`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            transition: 'transform 0.3s ease',
            boxSizing: 'border-box'
        };
    };

    // Render nhiều cây
    const renderTrees = () => {
        return treeTypes.map((treeType, index) => (
            <div 
                key={index}
                style={{
                    ...getTreeStyle(index),
                    backgroundImage: `url("/map/tree-${treeType}.png")`
                }}
            />
        ));
    };

    // Render nhiều khoáng sản
    const renderResources = (resourceType) => {
        return Array(objectCount).fill(0).map((_, index) => (
            <div 
                key={index}
                style={{
                    ...getResourceStyle(index),
                    backgroundImage: `url("/map/${resourceType}.png")`
                }}
            />
        ));
    };

    // Xác định object image và style tương ứng
    const getObjectConfig = () => {
        switch (object) {
            case 'tree':
                return {
                    render: renderTrees,
                    name: 'Cây',
                    description: `${objectCount} cây`
                };
            case 'stone':
                return {
                    render: () => renderResources('stone'),
                    name: 'Đá',
                    description: `${objectCount} mỏ đá`
                };
            case 'gold':
                return {
                    render: () => renderResources('gold'),
                    name: 'Vàng',
                    description: `${objectCount} mỏ vàng`
                };
            default:
                return null;
        }
    };

    // Chuyển đổi tên địa hình sang tiếng Việt
    const getTerrainName = () => {
        switch (terrain) {
            case 'grass': return 'Cỏ';
            case 'land': return 'Đất';
            case 'rock': return 'Đá';
            case 'lake': return 'Hồ';
            default: return terrain;
        }
    };

    const objectConfig = getObjectConfig();

    // Tạo nội dung tooltip
    const tooltipContent = `Địa hình: ${getTerrainName()}${objectConfig ? `\nTài nguyên: ${objectConfig.description}` : ''}`;

    const [tooltipPosition, setTooltipPosition] = useState('bottom'); // 'bottom', 'top', 'left', 'right'
    const cellRef = useRef(null);

    // Kiểm tra vị trí của cell và điều chỉnh tooltip
    useEffect(() => {
        const updateTooltipPosition = () => {
            if (!cellRef.current) return;
            
            const rect = cellRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Khoảng cách tối thiểu từ rìa màn hình
            const minDistance = 50;

            // Kiểm tra các rìa
            const isNearTop = rect.top < minDistance;
            const isNearBottom = viewportHeight - rect.bottom < minDistance;
            const isNearLeft = rect.left < minDistance;
            const isNearRight = viewportWidth - rect.right < minDistance;

            // Xử lý các góc
            if (isNearTop && isNearLeft) {
                setTooltipPosition('bottom-right');
            } else if (isNearTop && isNearRight) {
                setTooltipPosition('bottom-left');
            } else if (isNearBottom && isNearLeft) {
                setTooltipPosition('top-right');
            } else if (isNearBottom && isNearRight) {
                setTooltipPosition('top-left');
            }
            // Xử lý các cạnh
            else if (isNearTop) {
                setTooltipPosition('bottom');
            } else if (isNearBottom) {
                setTooltipPosition('top');
            } else if (isNearLeft) {
                setTooltipPosition('right');
            } else if (isNearRight) {
                setTooltipPosition('left');
            } else {
                setTooltipPosition('top');
            }
        };

        updateTooltipPosition();
        window.addEventListener('scroll', updateTooltipPosition);
        window.addEventListener('resize', updateTooltipPosition);

        return () => {
            window.removeEventListener('scroll', updateTooltipPosition);
            window.removeEventListener('resize', updateTooltipPosition);
        };
    }, []);

    // Tạo class cho tooltip dựa vào vị trí
    const getTooltipClass = () => {
        const baseClass = "absolute px-2 py-1 bg-black/80 text-white text-sm rounded pointer-events-none opacity-0 group-hover:opacity-100 whitespace-pre z-50 transition-all duration-200";
        
        switch (tooltipPosition) {
            case 'bottom':
                return `${baseClass} left-1/2 -translate-x-1/2 top-full mt-2`;
            case 'top':
                return `${baseClass} left-1/2 -translate-x-1/2 bottom-full mb-2`;
            case 'left':
                return `${baseClass} right-full top-1/2 -translate-y-1/2 mr-2`;
            case 'right':
                return `${baseClass} left-full top-1/2 -translate-y-1/2 ml-2`;
            case 'bottom-right':
                return `${baseClass} left-0 top-full mt-2`;
            case 'bottom-left':
                return `${baseClass} right-0 top-full mt-2`;
            case 'top-right':
                return `${baseClass} left-0 bottom-full mb-2`;
            case 'top-left':
                return `${baseClass} right-0 bottom-full mb-2`;
            default:
                return `${baseClass} left-1/2 -translate-x-1/2 bottom-full mb-2`;
        }
    };

    return (
        <div className="group relative" ref={cellRef}>
            {/* Base cell */}
            <div 
                className="hover:brightness-110 hover:outline hover:outline-2 hover:outline-green-500 hover:z-10 hover:scale-110 relative transition-all duration-200 origin-center"
                style={cellStyle}
            >
                {/* Layer 1: Terrain */}
                <div style={terrainStyle} />
                
                {/* Layer 2: Object */}
                {objectConfig && objectConfig.render()}
            </div>

            {/* Tooltip */}
            <div className={getTooltipClass()}>
                {tooltipContent}
            </div>
        </div>
    );
};

export default GameCell;
