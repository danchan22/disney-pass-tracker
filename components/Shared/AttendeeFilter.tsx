import React from 'react';
import { FIXED_FAMILY_MEMBERS } from '../../lib/constants';

interface AttendeeFilterProps {
  selectedAttendee: string;
  setSelectedAttendee: React.Dispatch<React.SetStateAction<string>>;
}

export const AttendeeFilter: React.FC<AttendeeFilterProps> = ({ selectedAttendee, setSelectedAttendee }) => {
  return (
    <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '14px' }}>
      <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>👤 FILTER BY ATTENDEE</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {FIXED_FAMILY_MEMBERS.map(m => {
          const isSelected = selectedAttendee === m;
          return (
            <button
              key={m}
              onClick={() => setSelectedAttendee(prev => prev === m ? 'ALL' : m)}
              style={{
                padding: '10px 4px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isSelected ? '800' : '500',
                border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                background: isSelected ? '#004487' : '#FFF',
                color: isSelected ? '#FFF' : '#2D3748',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isSelected ? `✓ ${m}` : m}
            </button>
          );
        })}
      </div>
    </div>
  );
};
