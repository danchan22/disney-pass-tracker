import React from 'react';
import { PARK_ATTRACTIONS, PARK_EMOJIS } from '../../lib/constants';

interface ChecklistTabProps {
  rideCountsMap: Record<string, number>;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({ rideCountsMap }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {Object.entries(PARK_ATTRACTIONS).map(([park, attractions]) => {
        const sortedAttractions = [...attractions].sort((a, b) => a.localeCompare(b));
        const totalInPark = sortedAttractions.length;
        const completedCount = sortedAttractions.filter(att => (rideCountsMap[att] || 0) > 0).length;
        const percentage = totalInPark > 0 ? Math.round((completedCount / totalInPark) * 100) : 0;

        return (
          <div key={park} style={{ background: '#FFF', borderRadius: '24px', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <div style={{ marginBottom: '14px', borderBottom: '2px solid #F2F2F7', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', margin: 0 }}>
                  {PARK_EMOJIS[park]} {park}
                </h2>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#D4AF37', background: '#FFFDF5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #FEEBC8' }}>
                  {completedCount}/{totalInPark} ({percentage}%)
                </span>
              </div>

              <div style={{ width: '100%', height: '8px', background: '#EDF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percentage}%`, height: '100%', background: percentage === 100 ? '#38A169' : 'linear-gradient(90deg, #0066cc, #D4AF37)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sortedAttractions.map((attraction) => {
                const count = rideCountsMap[attraction] || 0;
                const isCompleted = count > 0;

                return (
                  <div key={attraction} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: isCompleted ? '#F0FFF4' : '#F8FAFC', border: isCompleted ? '1px solid #C6F6D5' : '1px solid #EDF2F7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingRight: '8px' }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>
                        {isCompleted ? '✅' : '⚪'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: isCompleted ? '700' : '500', color: isCompleted ? '#22543D' : '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {attraction}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: isCompleted ? '#276749' : '#A0AEC0', flexShrink: 0 }}>
                      {isCompleted ? `(${count})` : '0'}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}
    </div>
  );
};
