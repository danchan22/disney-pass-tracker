'use client';

import React from 'react';
import { formatMinutes, formatDisplayDate, format12Hour } from '../../../lib/helpers';
import { ParkIcon } from '../../Shared/ParkIcon';

interface VisitsAnalyticsSubTabProps {
  selectedAttendee: string;
  renderAttendeeFilterWidget: () => React.ReactNode;
  renderParkFilterWidget: () => React.ReactNode;
  longestDays: any[];
  shortestDays: any[];
  busiestDays: any[];
}

export const VisitsAnalyticsSubTab: React.FC<VisitsAnalyticsSubTabProps> = ({
  selectedAttendee,
  renderAttendeeFilterWidget,
  renderParkFilterWidget,
  longestDays,
  shortestDays,
  busiestDays,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {renderAttendeeFilterWidget()}
      {renderParkFilterWidget()}

      {/* LONGEST DAYS */}
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⏱️</span> Longest Days {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
        </h3>
        {longestDays.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>No completed visits found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {longestDays.map((v, idx) => {
              const isTop = idx === 0;

              return (
                <div
                  key={v.id}
                  style={{
                    background: isTop ? '#FFFDF5' : '#F8FAFC',
                    borderRadius: '16px',
                    border: isTop ? '2px solid #D4AF37' : '1px solid #EDF2F7',
                    overflow: 'hidden',
                    boxShadow: isTop ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none'
                  }}
                >
                  <div
                    style={{
                      background: isTop ? '#FEFCBF' : '#EBF8FF',
                      color: isTop ? '#744210' : '#004487',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: '900',
                      textAlign: 'center',
                      borderBottom: isTop ? '1px solid #F6E05E' : '1px solid #BEE3F8'
                    }}
                  >
                    {formatMinutes(v.duration)}
                  </div>

                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1A202C', lineHeight: '1.4' }}>
                      {v.party.join(', ')}
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#004487', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ParkIcon parkName={v.parkName} size={16} />
                      <span>{v.parkName}</span>
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#718096', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <span>📅 {formatDisplayDate(v.visitDate)}</span>
                      <span>⏰ {format12Hour(v.startTime)} - {format12Hour(v.endTime)}</span>
                    </div>

                    {selectedAttendee === 'ALL' && v.hasEarlyDepartures && (
                      <div style={{ fontSize: '11px', color: '#DD6B20', fontWeight: '700', marginTop: '6px' }}>
                        ⚡ Split Day: {v.fullDayMembers.join(', ')} stayed full day
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SHORTEST DAYS */}
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚡</span> Shortest Days {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
        </h3>
        {shortestDays.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>No completed visits found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {shortestDays.map((v, idx) => {
              const isTop = idx === 0;

              return (
                <div
                  key={v.id}
                  style={{
                    background: isTop ? '#FFFDF5' : '#F8FAFC',
                    borderRadius: '16px',
                    border: isTop ? '2px solid #D4AF37' : '1px solid #EDF2F7',
                    overflow: 'hidden',
                    boxShadow: isTop ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none'
                  }}
                >
                  <div
                    style={{
                      background: isTop ? '#FEFCBF' : '#F0FFF4',
                      color: isTop ? '#744210' : '#276749',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: '900',
                      textAlign: 'center',
                      borderBottom: isTop ? '1px solid #F6E05E' : '1px solid #C6F6D5'
                    }}
                  >
                    {formatMinutes(v.duration)}
                  </div>

                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1A202C', lineHeight: '1.4' }}>
                      {v.party.join(', ')}
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#004487', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ParkIcon parkName={v.parkName} size={16} />
                      <span>{v.parkName}</span>
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#718096', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <span>📅 {formatDisplayDate(v.visitDate)}</span>
                      <span>⏰ {format12Hour(v.startTime)} - {format12Hour(v.endTime)}</span>
                    </div>

                    {selectedAttendee === 'ALL' && v.hasEarlyDepartures && (
                      <div style={{ fontSize: '11px', color: '#DD6B20', fontWeight: '700', marginTop: '6px' }}>
                        ⚡ Split Day: {v.fullDayMembers.join(', ')} stayed full day
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BUSIEST DAYS */}
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🎢</span> Busiest Days (Most Rides Logged) {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
        </h3>
        {busiestDays.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>No completed visits found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {busiestDays.map((v, idx) => {
              const isTop = idx === 0;

              return (
                <div
                  key={v.id}
                  style={{
                    background: isTop ? '#FFFDF5' : '#F8FAFC',
                    borderRadius: '16px',
                    border: isTop ? '2px solid #D4AF37' : '1px solid #EDF2F7',
                    overflow: 'hidden',
                    boxShadow: isTop ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none'
                  }}
                >
                  <div
                    style={{
                      background: isTop ? '#FEFCBF' : '#EBF8FF',
                      color: isTop ? '#744210' : '#004487',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: '900',
                      textAlign: 'center',
                      borderBottom: isTop ? '1px solid #F6E05E' : '1px solid #BEE3F8'
                    }}
                  >
                    {v.rideCount} {v.rideCount === 1 ? 'ride' : 'rides'}
                  </div>

                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1A202C', lineHeight: '1.4' }}>
                      {v.party.join(', ')}
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#004487', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ParkIcon parkName={v.parkName} size={16} />
                      <span>{v.parkName}</span>
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#718096', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <span>📅 {formatDisplayDate(v.visitDate)}</span>
                      <span>⏰ {format12Hour(v.startTime)} - {format12Hour(v.endTime)}</span>
                    </div>

                    {selectedAttendee === 'ALL' && v.hasEarlyDepartures && (
                      <div style={{ fontSize: '11px', color: '#DD6B20', fontWeight: '700', marginTop: '6px' }}>
                        ⚡ Split Day: {v.fullDayMembers.join(', ')} stayed full day
                      </div>
                    )}

                    {v.ridesListStr && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0', fontSize: '11px', color: '#4A5568', fontWeight: '600', lineHeight: '1.5' }}>
                        {v.ridesListStr}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
