'use client';

import React, { useState } from 'react';
import { LiveWaitTimesWidget } from '../../Shared/LiveWaitTimesWidget';
import { ParkIcon } from '../../Shared/ParkIcon';

type ParkName = 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';

const PARKS: ParkName[] = [
  'Magic Kingdom',
  'Epcot',
  'Hollywood Studios',
  'Animal Kingdom'
];

export const TimesTrackerSubTab: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<ParkName>('Magic Kingdom');

  return (
    <div>
      {/* LEVEL 3 ICON PILL NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
        {PARKS.map((park) => {
          const isSelected = selectedPark === park;
          return (
            <button
              key={park}
              type="button"
              onClick={() => setSelectedPark(park)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 14px',
                borderRadius: '20px',
                border: 'none',
                background: isSelected ? '#004487' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={park}
            >
              <ParkIcon parkName={park} size={22} />
            </button>
          );
        })}
      </div>

      {/* LIVE WAIT & SHOW TIMES FOR SELECTED PARK */}
      <LiveWaitTimesWidget parkName={selectedPark} />
    </div>
  );
};
