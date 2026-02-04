import React from 'react';

const Ball = ({ number, type, highlight }) => {
    // Determine class based on type if needed, e.g. for Max 3D squares
    const className = `ball ${type === 'digit' ? 'max3d' : ''}`;

    // Format number to always be 2 digits for matrix games if < 10? 
    // Vietlott usually shows 01, 02. Max 3D shows 1, 2, 3 (0-9).
    // Let's format: if type is 'digit', keep valid 0-9. If 'matrix', padStart(2, '0').
    const displayNum = type === 'digit' ? number : number.toString().padStart(2, '0');

    const style = highlight ? {
        border: '2px solid #FFD700',
        boxShadow: '0 0 10px #FFD700',
        backgroundColor: '#fffbe6'
    } : {};

    return (
        <div className={className} style={style}>
            {displayNum}
        </div>
    );
};

export default Ball;
