import React from 'react';
import GameCell from './GameCell';

const GameMap = ({ map, config }) => {
    const mapStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${config.COLS}, ${config.CELL_SIZE}px)`,
        width: 'fit-content',
        margin: '20px auto',
    };

    return (
        <div style={mapStyle}>
            {map.map((row, rowIndex) => 
                row.map((cell, colIndex) => (
                    <GameCell
                        key={`${rowIndex}-${colIndex}`}
                        terrain={cell.terrain}
                        object={cell.object}
                        objectCount={cell.objectCount}
                        size={config.CELL_SIZE}
                    />
                ))
            )}
        </div>
    );
};

export default GameMap;
