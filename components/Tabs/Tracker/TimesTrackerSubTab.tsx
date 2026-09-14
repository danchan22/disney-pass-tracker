'use client';

import React, { useState, useEffect } from 'react';
import { Visit } from '../../../lib/types';
import { PARK_NAMES } from '../../../lib/constants';
import { LiveWaitTimesWidget } from '../../Shared/LiveWaitTimes/LiveWaitTimesWidget';
import { ParkIcon } from '../../Shared/ParkIcon';

type ParkName = 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';

interface TimesTrackerSubTabProps {
  activeVisit: Visit | null;
}

export const TimesTrackerSubTab: React.FC<TimesTrackerSubTabProps> = ({ activeVisit }) => {
  const [selectedPark, setSelectedPark] = useState<ParkName>(
    (activeVisit?.parkName as ParkName) || 'Magic Kingdom'
  );

  useEffect(() => {
    if (activeVisit?.parkName) {
      setSelectedPark(activeVisit.parkName as ParkName);
    }
  }, [activeVisit?.parkName]);

  const activeVisitRideNames = activeVisit ? activeVisit.activities.map(a => a.rideName) : [];

  return (
    <div>
      {/* 🎡 FILTER BY PARK CARD */}
      <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '14px' }}>
        <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
          🎡 FILTER BY PARK
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {PARK_NAMES.map(park => {
            const isSelected = selectedPark === park;
            return (
              <button
                key={park}
                type="button"
                onClick={() => setSelectedPark(park as ParkName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                  background: isSelected ? '#EBF8FF' : '#FFF',
                  color: isSelected ? '#004487' : '#2D3748',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  minWidth: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <ParkIcon parkName={park} size={16} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{park}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIVE WAIT & SHOW TIMES */}
      <LiveWaitTimesWidget
        parkName={selectedPark}
        riddenRideNamesToday={activeVisitRideNames}
      />
    </div>
  );
};
