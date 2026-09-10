'use client';

import React, { useState } from 'react';
import { Visit } from '../../../lib/types';
import { formatDisplayDate } from '../../../lib/helpers';
import { ParkIcon } from '../../Shared/ParkIcon';

type RidesSubTab = 'Big Chart' | 'RidesLeaderboards';
type SortField = 'park' | 'name' | 'ridden' | 'avgWait' | 'totalWait' | 'maxWait' | 'minWait' | 'walkOns';

interface ScoreRecord {
  attendee: string;
  score: number;
  date: string;
  park: string;
}

interface RidesAnalyticsSubTabProps {
  visits: Visit[];
  selectedAttendee: string;
  selectedPark: string | null;
  renderAttendeeFilterWidget: () => React.ReactNode;
  renderParkFilterWidget: () => React.ReactNode;
  sortedRides: any[];
  handleSort: (field: SortField) => void;
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
}

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const RidesAnalyticsSubTab: React.FC<RidesAnalyticsSubTabProps> = ({
  visits,
  selectedAttendee,
  selectedPark,
  renderAttendeeFilterWidget,
  renderParkFilterWidget,
  sortedRides,
  handleSort,
  sortField,
  sortOrder,
}) => {
  const [ridesSubTab, setRidesSubTab] = useState<RidesSubTab>('Big Chart');

  const getShooterScores = (rideMatchStr: string): ScoreRecord[] => {
    const results: ScoreRecord[] = [];

    visits.forEach(v => {
      if (selectedPark && v.parkName !== selectedPark) return;

      v.activities.forEach(act => {
        const cleanRide = cleanStr(act.rideName || '');
        if (!cleanRide.includes(rideMatchStr)) return;

        if (act.notes) {
          const matches = Array.from(act.notes.matchAll(/🎯\s*([^:]+):\s*(\d+)/g));
          matches.forEach(match => {
            const attendee = match[1].trim();
            const score = parseInt(match[2], 10);

            if (selectedAttendee !== 'ALL' && attendee !== selectedAttendee) return;

            if (attendee && !isNaN(score)) {
              results.push({
                attendee,
                score,
                date: v.visitDate,
                park: v.parkName
              });
            }
          });
        }
      });
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  };

  const buzzScores = getShooterScores('buzzlightyear');
  const toyStoryScores = getShooterScores('toystorymania');

  const renderScoreLeaderboardCard = (title: string, icon: string, scores: ScoreRecord[]) => (
    <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span> {title} {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
      </h3>

      {scores.length === 0 ? (
        <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
          No scores logged yet for this filter selection.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scores.map((s, idx) => {
            const isTop = idx === 0;

            return (
              <div
                key={`${s.attendee}-${s.score}-${idx}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: isTop ? '#FFFDF5' : '#F8FAFC',
                  border: isTop ? '2px solid #D4AF37' : '1px solid #EDF2F7',
                  boxShadow: isTop ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isTop ? '#D4AF37' : '#004487',
                    color: '#FFF',
                    fontWeight: '900',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1A202C', lineHeight: '1.2' }}>
                      {s.attendee}
                    </h1>
                    <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📅 {formatDisplayDate(s.date)}</span>
                      <span>•</span>
                      <ParkIcon parkName={s.park} size={14} />
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: isTop ? '#FEFCBF' : '#EBF8FF',
                  color: isTop ? '#744210' : '#004487',
                  border: isTop ? '1px solid #F6E05E' : '1px solid #BEE3F8',
                  fontSize: '15px',
                  fontWeight: '900',
                  flexShrink: 0
                }}>
                  {s.score.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* LEVEL 3 MENU */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
        {[
          { id: 'Big Chart', label: 'Big Chart' },
          { id: 'RidesLeaderboards', label: 'Leaderboards' }
        ].map(pill => {
          const isSelected = ridesSubTab === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setRidesSubTab(pill.id as RidesSubTab)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                background: isSelected ? '#004487' : 'transparent',
                color: isSelected ? '#FFF' : '#718096',
                fontSize: '13px',
                fontWeight: isSelected ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {renderAttendeeFilterWidget()}
      {renderParkFilterWidget()}

      {ridesSubTab === 'Big Chart' && (
        sortedRides.length === 0 ? (
          <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#718096', border: '1px solid #E2E8F0', fontStyle: 'italic' }}>
            No rides logged matching your filter selection.
          </div>
        ) : (
          <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#4A5568', fontSize: '11px', fontWeight: '900' }}>
                    <th onClick={() => handleSort('park')} style={{ padding: '12px 8px', cursor: 'pointer', width: '46px', textAlign: 'center', borderRight: '1px solid #EDF2F7' }}>
                      Park {sortField === 'park' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('name')} style={{ padding: '12px 12px', cursor: 'pointer', position: 'sticky', left: 0, background: '#F8FAFC', zIndex: 2, boxShadow: '2px 0 5px rgba(0,0,0,0.04)', minWidth: '150px' }}>
                      Ride {sortField === 'name' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('ridden')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                      Ridden {sortField === 'ridden' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('avgWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                      Avg Wait {sortField === 'avgWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('totalWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                      Tot Wait {sortField === 'totalWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('maxWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                      Max {sortField === 'maxWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('minWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                      Min {sortField === 'minWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th onClick={() => handleSort('walkOns')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                      Walk-Ons {sortField === 'walkOns' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRides.map((r, idx) => {
                    const rowBg = idx % 2 === 0 ? '#FFF' : '#F8FAFC';
                    return (
                      <tr key={`${r.park}-${r.name}`} style={{ borderBottom: '1px solid #EDF2F7' }}>
                        <td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #EDF2F7', background: rowBg }}>
                          <ParkIcon parkName={r.park} size={20} />
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '800', color: '#1A202C', position: 'sticky', left: 0, background: rowBg, zIndex: 1, boxShadow: '2px 0 5px rgba(0,0,0,0.04)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                          {r.name}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '900', color: '#004487', background: rowBg }}>
                          {r.ridden}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#2D3748', background: rowBg }}>
                          {r.avgWait}m
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#ED8936', background: rowBg }}>
                          {r.totalWait}m
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#C53030', background: rowBg }}>
                          {r.maxWait}m
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#276749', background: rowBg }}>
                          {r.minWait}m
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '900', color: '#D69E2E', background: rowBg }}>
                          {r.walkOns}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {ridesSubTab === 'RidesLeaderboards' && (
        <div>
          {renderScoreLeaderboardCard('Buzz Lightyear Scores', '🚀', buzzScores)}
          {renderScoreLeaderboardCard('Toy Story Mania Scores', '🎯', toyStoryScores)}
        </div>
      )}
    </div>
  );
};
