import React from 'react';
import GameCell from './GameCell';

const GameMap = ({ map, config }) => {
    return (
        <div 
            className="grid gap-0.5 p-4"
            style={{
                gridTemplateColumns: `repeat(${config.COLS}, ${config.CELL_SIZE}px)`,
                width: 'fit-content',
                margin: '0 auto'
            }}
        >
            {map.map((row, rowIndex) => 
                row.map((cell, colIndex) => (
                    <GameCell
                        key={`${rowIndex}-${colIndex}`}
                        terrain={cell.terrain}
                        object={cell.object}
                        objectCount={cell.objectCount}
                        house={cell.house}
                        size={config.CELL_SIZE}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                    />
                ))
            )}
        </div>
    );
};

export default GameMap;
