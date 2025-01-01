import React from 'react';

const PlayerInfo = ({ player }) => {
  return (
    <div className="player-info">
      <h3 className="text-xl font-bold">{player.name}</h3>
      <div className="stats shadow mt-2">
        <div className="stat">
          <div className="stat-title">Điểm số</div>
          <div className="stat-value">{player.score}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Trạng thái</div>
          <div className="stat-value text-primary">{player.status}</div>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;
