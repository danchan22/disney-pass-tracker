'use client';

import React from 'react';
import { Visit } from '../../../lib/types';
import { PARK_NAMES, PARK_ATTRACTIONS, FIXED_FAMILY_MEMBERS } from '../../../lib/constants';
import { formatMinutes, parseAttendees, getPersonEndTime, parseTimeToMinutes } from '../../../lib/helpers';
import { ParkIcon } from '../../Shared/ParkIcon';

interface ParksAnalyticsSubTabProps {
  visits: Visit[];
  selectedAttendee: string;
  selectedPark: string | null;
  parkStats: Record<string, { visits: number; activities: number; timeInPark: number; waitTime: number }>;
  renderAttendeeFilterWidget: () => React.ReactNode;
  renderParkFilterWidget: () => React.ReactNode;
  getRankColor: (rank: number, total: number) => string;
  getRank: (values: number[], targetValue: number, ascending?: boolean) => number;
  parkActivitiesArr: number[];
  parkTimeInParkArr: number[];
  parkWaitTimeArr: number[];
  parkAvgActivitiesArr: number[];
  parkAvgVisitArr: number[];
  parkAvgWaitArr: number[];
  getRideCountsMap: (visitList: Visit[], personFilter: string) => Record<string, number>;
  getRideBreakdown: (visitList: Visit[], personFilter: string) => any[];
}

const PARK_BANNERS: Record<string, string> = {
  'Magic Kingdom': '/park-magic-kingdom.png',
  'Epcot': '/park-epcot.png',
  'Hollywood Studios': '/park-hollywood-studios.png',
  'Animal Kingdom': '/park-animal-kingdom.png'
};

const WEEKDAYS = [
  { label: 'M', dayIndex: 1 },
  { label: 'T', dayIndex: 2 },
  { label: 'W', dayIndex: 3 },
  { label: 'T', dayIndex: 4 },
  { label: 'F', dayIndex: 5 },
  { label: 'S', dayIndex: 6 },
  { label: 'S', dayIndex: 0 },
];

export const ParksAnalyticsSubTab: React.FC<ParksAnalyticsSubTabProps> = ({
  visits,
  selectedAttendee,
  selectedPark,
  parkStats,
  renderAttendeeFilterWidget,
  renderParkFilterWidget,
  getRankColor,
  getRank,
  parkActivitiesArr,
  parkTimeInParkArr,
  parkWaitTimeArr,
  parkAvgActivitiesArr,
  parkAvgVisitArr,
  parkAvgWaitArr,
  getRideCountsMap,
  getRideBreakdown,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {renderAttendeeFilterWidget()}
      {renderParkFilterWidget()}

      {PARK_NAMES.filter(p => selectedPark === null || selectedPark === p).map((park) => {
        const stats = parkStats[park] || { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 };
        const avgActivitiesVal = stats.visits > 0 ? stats.activities / stats.visits : 0;
        const avgVisitVal = stats.visits > 0 ? stats.timeInPark / stats.visits : 0;
        const avgWaitVal = stats.activities > 0 ? stats.waitTime / stats.activities : 0;

        const avgActivities = avgActivitiesVal.toFixed(1);
        const avgVisit = avgVisitVal;
        const avgWait = Math.round(avgWaitVal);

        const rActs = getRank(parkActivitiesArr, stats.activities, false);
        const rTimeInPark = getRank(parkTimeInParkArr, stats.timeInPark, false);
        const rWaitTime = getRank(parkWaitTimeArr, stats.waitTime, false);
        const rAvgActs = getRank(parkAvgActivitiesArr, avgActivitiesVal, false);
        const rAvgVisit = getRank(parkAvgVisitArr, avgVisitVal, false);
        const rAvgWait = getRank(parkAvgWaitArr, avgWaitVal, true);

        const totalTime = Math.max(1, stats.timeInPark);
        const lineTime = Math.min(stats.waitTime, totalTime);
        const linePercent = Math.round((lineTime / totalTime) * 100);

        const totalParkRides = PARK_ATTRACTIONS[park]?.length || 1;
        const parkVisits = visits.filter(v => {
          const matchesPark = v.parkName === park;
          const matchesAttendee = selectedAttendee === 'ALL' || parseAttendees(v.attendees).includes(selectedAttendee);
          return matchesPark && matchesAttendee;
        });

        const rideCounts = getRideCountsMap(parkVisits, selectedAttendee);
        const riddenCount = PARK_ATTRACTIONS[park]?.filter(r => (rideCounts[r] || 0) > 0).length || 0;
        const rideEverythingPercent = Math.round((riddenCount / totalParkRides) * 100);

        const parkRides = getRideBreakdown(parkVisits, selectedAttendee).sort((a, b) => b.count - a.count).slice(0, 5);

        const visitorStats: Record<string, { visits: number; timeInPark: number }> = {};
        FIXED_FAMILY_MEMBERS.forEach(m => { visitorStats[m] = { visits: 0, timeInPark: 0 }; });

        parkVisits.forEach(v => {
          const party = parseAttendees(v.attendees);
          party.forEach(m => {
            if (visitorStats[m]) {
              visitorStats[m].visits += 1;
              const pEndTime = getPersonEndTime(v, m);
              if (v.startTime && pEndTime) {
                const start = parseTimeToMinutes(v.startTime);
                const end = parseTimeToMinutes(pEndTime);
                visitorStats[m].timeInPark += end >= start ? (end - start) : ((1440 - start) + end);
              }
            }
          });
        });

        const leaderboard = Object.keys(visitorStats)
          .map(m => ({ name: m, ...visitorStats[m], avgVisit: visitorStats[m].visits > 0 ? visitorStats[m].timeInPark / visitorStats[m].visits : 0 }))
          .filter(item => item.visits > 0)
          .sort((a, b) => b.visits - a.visits);

        const parkDayVisitsMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        parkVisits.forEach(v => {
          if (v.visitDate) {
            const [y, m, d] = v.visitDate.split('-').map(Number);
            const dayIndex = new Date(y, m - 1, d).getDay();
            parkDayVisitsMap[dayIndex] = (parkDayVisitsMap[dayIndex] || 0) + 1;
          }
        });

        const maxParkDayVisits = Math.max(1, ...Object.values(parkDayVisitsMap));

        return (
          <div key={park} style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <img src={PARK_BANNERS[park]} alt={park} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />

            <div style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #EDF2F7', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ParkIcon parkName={park} size={22} />
                  <span>{park}</span>
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#718096', background: '#F8FAFC', padding: '4px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  {stats.visits} {stats.visits === 1 ? 'Group Visit' : 'Group Visits'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#38A169' }}>{stats.activities}</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACTIVITIES</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rActs, 4), marginTop: '3px' }}>#{rActs}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(stats.timeInPark)}</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARK</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rTimeInPark, 4), marginTop: '3px' }}>#{rTimeInPark}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(stats.waitTime)}</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rWaitTime, 4), marginTop: '3px' }}>#{rWaitTime}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgActivities}</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG ACTIVITIES</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAvgActs, 4), marginTop: '3px' }}>#{rAvgActs}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{formatMinutes(avgVisit)}</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG VISIT</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAvgVisit, 4), marginTop: '3px' }}>#{rAvgVisit}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgWait}m</div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG WAIT</div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAvgWait, 4), marginTop: '3px' }}>#{rAvgWait}</div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: `conic-gradient(#ED8936 0% ${linePercent}%, #9F7AEA ${linePercent}% 100%)`, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '4px' }}>TIME SPENT IN LINE VS PARK</div>
                  <div style={{ fontSize: '12px', color: '#2D3748', lineHeight: '1.4' }}>
                    <div><span style={{ color: '#ED8936', fontWeight: '800' }}>{linePercent}%</span> waiting in lines</div>
                    <div><span style={{ color: '#9F7AEA', fontWeight: '800' }}>{100 - linePercent}%</span> not waiting in lines</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '6px' }}>
                  <span>ACTIVITIES LOGGED</span>
                  <span style={{ color: '#004487' }}>{riddenCount} / {totalParkRides} ({rideEverythingPercent}%)</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${rideEverythingPercent}%`, height: '100%', background: 'linear-gradient(to right, #0056b3, #D4AF37)', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              {parkRides.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '8px', letterSpacing: '0.8px' }}>
                    MOST POPULAR RIDES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {parkRides.map((r, idx) => (
                      <div key={r.name} style={{ background: idx === 0 ? '#FFFDF5' : '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: idx === 0 ? '1px solid #D4AF37' : '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#2D3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                          <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                            Avg Wait: <strong>{r.avgWait}m</strong> • Total Wait: <strong>{formatMinutes(r.totalWait)}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#004487', flexShrink: 0 }}>{r.count}x</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leaderboard.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '8px', letterSpacing: '0.8px' }}>
                    WHO VISITS MOST
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {leaderboard.map((item, idx) => (
                      <div key={item.name} style={{ background: idx === 0 ? '#FFFDF5' : '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: idx === 0 ? '1px solid #D4AF37' : '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#2D3748' }}>{item.name}</div>
                          <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                            Total Park Time: <strong>{formatMinutes(item.timeInPark)}</strong> • Avg Visit: <strong>{formatMinutes(item.avgVisit)}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#38A169' }}>
                          {item.visits} {item.visits === 1 ? 'visit' : 'visits'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '12px', letterSpacing: '0.8px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                  DAYS OF THE WEEK {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px 12px 12px 16px', borderRadius: '16px', border: '1px solid #EDF2F7' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', alignItems: 'end', height: '110px' }}>
                    {WEEKDAYS.map((day) => {
                      const count = parkDayVisitsMap[day.dayIndex] || 0;
                      const heightPercent = count > 0 ? Math.max(16, Math.round((count / maxParkDayVisits) * 100)) : 0;

                      return (
                        <div key={day.label + day.dayIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <div style={{ fontSize: '11px', fontWeight: '900', color: count > 0 ? '#004487' : '#A0AEC0', marginBottom: '4px' }}>
                            {count}
                          </div>
                          <div style={{ width: '100%', height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div style={{ width: '18px', height: `${heightPercent}%`, background: count > 0 ? 'linear-gradient(to top, #004487, #2B6CB0)' : '#E2E8F0', borderRadius: '6px 6px 4px 4px', transition: 'height 0.3s ease' }} />
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', marginTop: '6px' }}>
                            {day.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};
