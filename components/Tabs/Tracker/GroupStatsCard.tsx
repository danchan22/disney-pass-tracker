'use client';

import React from 'react';
import { Visit } from '../../../lib/types';
import { PARK_ATTRACTIONS } from '../../../lib/constants';
import { formatMinutes } from '../../../lib/helpers';
import { ParkIcon } from '../../Shared/ParkIcon';

interface GroupStatsCardProps {
  selectedAttendee: string;
  totalDays: number;
  totalActivities: number;
  totalParkMinutes: number;
  totalWaitMinutes: number;
  avgActivitiesPerDay: string;
  avgParkMinutesPerDay: number;
  avgWaitPerActivity: number;
  filteredVisits: Visit[];
}

const WEEKDAYS = [
  { label: 'M', dayIndex: 1 },
  { label: 'T', dayIndex: 2 },
  { label: 'W', dayIndex: 3 },
  { label: 'T', dayIndex: 4 },
  { label: 'F', dayIndex: 5 },
  { label: 'S', dayIndex: 6 },
  { label: 'S', dayIndex: 0 },
];

const MONTH_ORDER = [
  { label: 'Jun', monthIndex: 5 },
  { label: 'Jul', monthIndex: 6 },
  { label: 'Aug', monthIndex: 7 },
  { label: 'Sep', monthIndex: 8 },
  { label: 'Oct', monthIndex: 9 },
  { label: 'Nov', monthIndex: 10 },
  { label: 'Dec', monthIndex: 11 },
  { label: 'Jan', monthIndex: 0 },
  { label: 'Feb', monthIndex: 1 },
  { label: 'Mar', monthIndex: 2 },
  { label: 'Apr', monthIndex: 3 },
  { label: 'May', monthIndex: 4 },
];

export const GroupStatsCard: React.FC<GroupStatsCardProps> = ({
  selectedAttendee,
  totalDays,
  totalActivities,
  totalParkMinutes,
  totalWaitMinutes,
  avgActivitiesPerDay,
  avgParkMinutesPerDay,
  avgWaitPerActivity,
  filteredVisits,
}) => {
  const parkVisitsMap: Record<string, number> = {
    'Magic Kingdom': 0,
    'Epcot': 0,
    'Hollywood Studios': 0,
    'Animal Kingdom': 0,
  };
  filteredVisits.forEach(v => {
    if (parkVisitsMap[v.parkName] !== undefined) {
      parkVisitsMap[v.parkName] += 1;
    }
  });

  const allPossibleAttractionsCount = Object.values(PARK_ATTRACTIONS).reduce((sum, list) => sum + list.length, 0);
  const uniqueRidesRidden = new Set<string>();
  filteredVisits.forEach(v => {
    v.activities.forEach(a => {
      if (a.rideName && a.rideName !== 'Character Meeting') {
        uniqueRidesRidden.add(a.rideName);
      }
    });
  });
  const riddenUniqueCount = uniqueRidesRidden.size;
  const totalUniquePercent = Math.round((riddenUniqueCount / Math.max(1, allPossibleAttractionsCount)) * 100);

  const totalParkTime = Math.max(1, totalParkMinutes);
  const lineTime = Math.min(totalWaitMinutes, totalParkTime);
  const linePercent = Math.round((lineTime / totalParkTime) * 100);

  const dayVisitsMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  filteredVisits.forEach(v => {
    if (v.visitDate) {
      const [y, m, d] = v.visitDate.split('-').map(Number);
      const dayIndex = new Date(y, m - 1, d).getDay();
      dayVisitsMap[dayIndex] = (dayVisitsMap[dayIndex] || 0) + 1;
    }
  });
  const maxDayVisits = Math.max(1, ...Object.values(dayVisitsMap));

  const monthVisitsMap: Record<number, number> = {};
  filteredVisits.forEach(v => {
    if (v.visitDate) {
      const [y, m] = v.visitDate.split('-').map(Number);
      const monthIndex = m - 1;
      monthVisitsMap[monthIndex] = (monthVisitsMap[monthIndex] || 0) + 1;
    }
  });
  const maxMonthVisits = Math.max(1, ...Object.values(monthVisitsMap));

  const rideStatsMap: Record<string, { count: number; totalWait: number }> = {};
  filteredVisits.forEach(v => {
    v.activities.forEach(a => {
      if (a.rideName && a.rideName !== 'Character Meeting') {
        if (!rideStatsMap[a.rideName]) {
          rideStatsMap[a.rideName] = { count: 0, totalWait: 0 };
        }
        rideStatsMap[a.rideName].count += 1;
        rideStatsMap[a.rideName].totalWait += a.waitTimeMinutes || 0;
      }
    });
  });

  const top3Rides = Object.entries(rideStatsMap)
    .map(([name, stat]) => ({
      name,
      count: stat.count,
      totalWait: stat.totalWait,
      avgWait: Math.round(stat.totalWait / Math.max(1, stat.count))
    }))
    .sort((a, b) => b.count - a.count || b.totalWait - a.totalWait)
    .slice(0, 3);

  return (
    <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
      <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>
        GROUP STATS {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
      </h3>

      <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#004487', lineHeight: '1' }}>{totalDays}</div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '6px', lineHeight: '1.2' }}>GROUP<br />VISITS</div>
        </div>

        <div style={{ width: '1px', alignSelf: 'stretch', borderLeft: '2px dotted #CBD5E0' }} />

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
          {['Magic Kingdom', 'Epcot', 'Hollywood Studios', 'Animal Kingdom'].map((p) => (
            <div key={p}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#004487', lineHeight: '1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ParkIcon parkName={p} size={14} />
                <span>{parkVisitsMap[p] || 0}</span>
              </div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A5568', marginTop: '3px', lineHeight: '1.1' }}>{p}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
        <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#38A169' }}>{totalActivities}</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACTIVITIES</div>
        </div>
        <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(totalParkMinutes)}</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARK</div>
        </div>
        <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(totalWaitMinutes)}</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
        </div>

        <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgActivitiesPerDay}</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG ACTIVITIES</div>
        </div>
        <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{formatMinutes(avgParkMinutesPerDay)}</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG VISIT</div>
        </div>
        <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgWaitPerActivity}m</div>
          <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG WAIT</div>
        </div>
      </div>

      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: `conic-gradient(#ED8936 0% ${linePercent}%, #9F7AEA ${linePercent}% 100%)`, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '4px' }}>TIME SPENT IN LINE VS PARK</div>
          <div style={{ fontSize: '12px', color: '#2D3748', lineHeight: '1.4' }}>
            <div><span style={{ color: '#ED8936', fontWeight: '800' }}>{linePercent}%</span> waiting in lines</div>
            <div><span style={{ color: '#9F7AEA', fontWeight: '800' }}>{100 - linePercent}%</span> not waiting in lines</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '6px' }}>
          <span>ACTIVITIES LOGGED</span>
          <span style={{ color: '#004487' }}>{riddenUniqueCount} / {allPossibleAttractionsCount} ({totalUniquePercent}%)</span>
        </div>
        <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${totalUniquePercent}%`, height: '100%', background: 'linear-gradient(to right, #0056b3, #D4AF37)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: '900', color: '#718096', marginBottom: '8px', letterSpacing: '0.8px' }}>MOST POPULAR RIDES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {top3Rides.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#A0AEC0', fontStyle: 'italic', padding: '8px 0' }}>No rides logged yet.</div>
          ) : (
            top3Rides.map((ride, idx) => {
              const isFirst = idx === 0;
              return (
                <div key={ride.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '16px', background: isFirst ? '#FFFDF5' : '#F8FAFC', border: isFirst ? '1px solid #D4AF37' : '1px solid #EDF2F7', boxShadow: isFirst ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '14px', color: '#004487' }}>{ride.name}</div>
                    <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                      Avg Wait: <strong style={{ color: '#2D3748' }}>{ride.avgWait}m</strong> • Total Wait: <strong style={{ color: '#2D3748' }}>{formatMinutes(ride.totalWait)}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#004487', flexShrink: 0 }}>{ride.count}x</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '16px', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 10px 0', letterSpacing: '0.8px' }}>DAYS OF THE WEEK</h3>
        <div style={{ background: '#F8FAFC', padding: '16px 12px 12px 16px', borderRadius: '16px', border: '1px solid #EDF2F7' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', alignItems: 'end', height: '110px' }}>
            {WEEKDAYS.map((day) => {
              const count = dayVisitsMap[day.dayIndex] || 0;
              const heightPercent = count > 0 ? Math.max(16, Math.round((count / maxDayVisits) * 100)) : 0;
              return (
                <div key={day.label + day.dayIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: count > 0 ? '#004487' : '#A0AEC0', marginBottom: '4px' }}>{count}</div>
                  <div style={{ width: '100%', height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '18px', height: `${heightPercent}%`, background: count > 0 ? 'linear-gradient(to top, #004487, #2B6CB0)' : '#E2E8F0', borderRadius: '6px 6px 4px 4px', transition: 'height 0.3s ease' }} />
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', marginTop: '6px' }}>{day.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>MONTHS</h3>
        <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MONTH_ORDER.map((mObj) => {
            const mCount = monthVisitsMap[mObj.monthIndex] || 0;
            const barWidthPercent = mCount > 0 ? Math.max(8, Math.round((mCount / maxMonthVisits) * 100)) : 0;
            return (
              <div key={mObj.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', fontSize: '11px', fontWeight: '800', color: '#4A5568', flexShrink: 0 }}>{mObj.label}</div>
                <div style={{ flex: 1, height: '14px', background: '#E2E8F0', borderRadius: '7px', overflow: 'hidden' }}>
                  <div style={{ width: `${barWidthPercent}%`, height: '100%', background: mCount > 0 ? 'linear-gradient(to right, #004487, #2B6CB0)' : 'transparent', borderRadius: '7px', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ width: '20px', fontSize: '11px', fontWeight: '900', color: mCount > 0 ? '#004487' : '#A0AEC0', textAlign: 'right', flexShrink: 0 }}>{mCount}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
