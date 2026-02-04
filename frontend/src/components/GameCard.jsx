import React from 'react';

const GameCard = ({ id, name, isActive, onClick }) => {
    return (
        <div
            className={`game-card ${isActive ? 'active' : ''}`}
            onClick={() => onClick(id)}
        >
            <h3>{name}</h3>
        </div>
    );
};

export default GameCard;
