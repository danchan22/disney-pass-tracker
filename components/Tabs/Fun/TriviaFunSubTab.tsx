'use client';

import React from 'react';

export const TriviaFunSubTab: React.FC = () => {
  return (
    <div
      style={{
        background: '#FFF',
        borderRadius: '20px',
        padding: '40px 20px',
        textAlign: 'center',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        marginTop: '10px'
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧩</div>
      <div style={{ fontSize: '16px', fontWeight: '800', color: '#004487', marginBottom: '4px' }}>
        Trivia Coming Soon!
      </div>
      <div style={{ fontSize: '12px', color: '#718096' }}>
        Test your Imagineering and Disney Parks knowledge here shortly.
      </div>
    </div>
  );
};
