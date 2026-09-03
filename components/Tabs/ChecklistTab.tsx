'use client';

import React, { useState } from 'react';
import { PARK_NAMES, PARK_ATTRACTIONS } from '../../lib/constants';
import { ParkIcon } from '../Shared/ParkIcon';

interface ChecklistTabProps {
  rideCountsMap: Record<string, number>;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({ rideCountsMap }) => {
  const [selectedPark, setSelectedPark] = useState<string>('Magic Kingdom');

  const attractions = PARK_ATTRACTIONS[selectedPark] || [];
  const completedCount = attractions.filter((ride) => (rideCountsMap[ride] || 0) > 0).length;
  const percentComplete = Math.round((completedCount / Math.max(1, attractions.length)) * 100);

  return (
    <div style={{ background: '#FFF', borderRadius: '24px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
      {/* 2x2 Park Selection Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
        {PARK_NAMES.map((park) => {
          const isSelected = selectedPark === park;
          return (
            <button
              key={park}
              onClick={() => setSelectedPark(park)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 8px',
                borderRadius: '14px',
                border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                background: isSelected ? '#EBF8FF' : '#FFF',
                color: isSelected ? '#004487' : '#2D3748',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ParkIcon parkName={park} size={18} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{park}</span>
            </button>
          );
        })}
      </div>

      {/* Checklist Header & Progress Bar */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #EDF2F7', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ParkIcon parkName={selectedPark} size={22} />
            <span>{selectedPark} Checklist</span>
          </h2>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#004487' }}>
            {completedCount} / {attractions.length} ({percentComplete}%)
          </span>
        </div>

        <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${percentComplete}%`, height: '100%', background: 'linear-gradient(to right, #0056b3, #D4AF37)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {/* Rides List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {attractions.map((ride) => {
          const count = rideCountsMap[ride] || 0;
          const isDone = count > 0;

          return (
            <div
              key={ride}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: isDone ? '#F0FFF4' : '#F8FAFC',
                border: isDone ? '1px solid #C6F6D5' : '1px solid #EDF2F7',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isDone ? '#38A169' : '#CBD5E0',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '900',
                    flexShrink: 0
                  }}
                >
                  {isDone ? '✓' : ''}
                </div>
                <span style={{ fontSize: '13px', fontWeight: isDone ? '800' : '600', color: isDone ? '#22543D' : '#4A5568' }}>
                  {ride}
                </span>
              </div>

              {isDone && (
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#276749', background: '#C6F6D5', padding: '3px 8px', borderRadius: '8px' }}>
                  Ridden {count}x
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
