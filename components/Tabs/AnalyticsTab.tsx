import React, { useState } from 'react';
import { Visit, AnalyticsSubTab } from '../../lib/types';
import { PARK_NAMES, PARK_EMOJIS, PARK_ATTRACTIONS, FIXED_FAMILY_MEMBERS } from '../../lib/constants';
import { formatMinutes, parseAttendees, getPersonEndTime, parseTimeToMinutes, isPersonRider } from '../../lib/helpers';

interface AnalyticsTabProps {
  analyticsSubTab: AnalyticsSubTab;
  parkStats: Record<string, { visits: number; activities: number; timeInPark: number; waitTime: number }>;
  mostTimesRidden: any[];
  longestWaitTimes: any[];
  shortestWaitTimes: any[];
  filteredVisits: Visit[];
  selectedAttendee: string;
  visits: Visit[];
  getRideBreakdown: (visitList: Visit[], personFilter: string) => any[];
  getRideCountsMap: (visitList: Visit[], personFilter: string) => Record<string, number>;
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

const PARK_FILTERS = ['ALL', 'Magic Kingdom', 'Epcot', 'Hollywood Studios', 'Animal Kingdom'];

type SortField = 'park' | 'name' | 'ridden' | 'avgWait' | 'totalWait' | 'maxWait' | 'minWait' | 'walkOns';

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  analyticsSubTab,
  parkStats,
  mostTimesRidden,
  longestWaitTimes,
  shortestWaitTimes,
  filteredVisits,
  selectedAttendee,
  visits,
  getRideBreakdown,
  getRideCountsMap,
}) => {
  // State for Park Filter in Rides Tab
  const [selectedPark, setSelectedPark] = useState<string>('ALL');

  // State for Table Sorting (Default: Ridden Descending)
  const [sortField, setSortField] = useState<SortField>('ridden');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc'); // First click sorts descending
    }
  };

  // Build Aggregated Ride Data
  const rideStatsMap: Record<string, {
    name: string;
    park: string;
    ridden: number;
    totalWait: number;
    waitTimes: number[];
    walkOns: number;
  }> = {};

  visits.forEach(v => {
    // Filter by Selected Park
    if (selectedPark !== 'ALL' && v.parkName !== selectedPark) return;

    // Filter by Selected Attendee
    const party = parseAttendees(v.attendees);
    if (selectedAttendee !== 'ALL' && !party.includes(selectedAttendee)) return;

    v.activities.forEach(act => {
      // Check rider filter if person is selected
      if (selectedAttendee !== 'ALL' && !isPersonRider(act, v, selectedAttendee)) return;

      const rideKey = `${v.parkName}___${act.rideName}`;
      if (!rideStatsMap[rideKey]) {
        rideStatsMap[rideKey] = {
          name: act.rideName,
          park: v.parkName,
          ridden: 0,
          totalWait: 0,
          waitTimes: [],
          walkOns: 0
        };
      }

      const wait = act.waitTimeMinutes || 0;
      const isWalkOn = act.isWalkOn || wait === 0 || act.notes?.includes('[Walk On]');

      rideStatsMap[rideKey].ridden += 1;
      rideStatsMap[rideKey].totalWait += wait;
      rideStatsMap[rideKey].waitTimes.push(wait);
      if (isWalkOn) {
        rideStatsMap[rideKey].walkOns += 1;
      }
    });
  });

  const rideList = Object.values(rideStatsMap).map(r => {
    const avgWait = r.ridden > 0 ? Math.round(r.totalWait / r.ridden) : 0;
    const maxWait = r.waitTimes.length > 0 ? Math.max(...r.waitTimes) : 0;
    const minWait = r.waitTimes.length > 0 ? Math.min(...r.waitTimes) : 0;

    return {
      name: r.name,
      park: r.park,
      ridden: r.ridden,
      totalWait: r.totalWait,
      avgWait,
      maxWait,
      minWait,
      walkOns: r.walkOns
    };
  });

  // Sort Ride Data
  const sortedRides = [...rideList].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.localeCompare(valB);
      return sortOrder === 'asc' ? cmp : -cmp;
    }

    const numA = valA as number;
    const numB = valB as number;
    return sortOrder === 'asc' ? numA - numB : numB - numA;
  });

  return (
    <div>
      {/* Subtab: Parks */}
      {analyticsSubTab === 'averages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PARK_NAMES.map((park) => {
            const stats = parkStats[park] || { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 };
            const avgActivities = stats.visits > 0 ? (stats.activities / stats.visits).toFixed(1) : '0';
            const avgVisit = stats.visits > 0 ? stats.timeInPark / stats.visits : 0;
            const avgWait = stats.activities > 0 ? Math.round(stats.waitTime / stats.activities) : 0;

            // Pie Chart calculations
            const totalTime = Math.max(1, stats.timeInPark);
            const lineTime = Math.min(stats.waitTime, totalTime);
            const linePercent = Math.round((lineTime / totalTime) * 100);

            // Activities Logged Progress
            const totalParkRides = PARK_ATTRACTIONS[park]?.length || 1;
            const parkVisits = visits.filter(v => v.parkName === park);
            const rideCounts = getRideCountsMap(parkVisits, selectedAttendee);
            const riddenCount = PARK_ATTRACTIONS[park]?.filter(r => (rideCounts[r] || 0) > 0).length || 0;
            const rideEverythingPercent = Math.round((riddenCount / totalParkRides) * 100);

            // Top 5 Popular Rides
            const parkRides = getRideBreakdown(parkVisits, selectedAttendee)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            // Who Visits Most Leaderboard
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

            // Days of the Week Group Visits Calculation for Park
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
                
                {/* Full Width Banner Image */}
                <img src={PARK_BANNERS[park]} alt={park} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />

                <div style={{ padding: '18px' }}>
                  {/* Park Title Header with Group Visits */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #EDF2F7', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487' }}>
                      {PARK_EMOJIS[park]} {park}
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#718096', background: '#F8FAFC', padding: '4px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      {stats.visits} {stats.visits === 1 ? 'Group Visit' : 'Group Visits'}
                    </span>
                  </div>

                  {/* 2x3 Grid Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#38A169' }}>{stats.activities}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACTIVITIES</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(stats.timeInPark)}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARK</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(stats.waitTime)}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgActivities}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG ACTIVITIES</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{formatMinutes(avgVisit)}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG VISIT</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgWait}m</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG WAIT</div>
                    </div>
                  </div>

                  {/* Conic Pie Chart */}
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: `conic-gradient(#ED8936 0% ${linePercent}%, #9F7AEA ${linePercent}% 100%)`,
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '4px' }}>TIME SPENT IN LINE VS PARK</div>
                      <div style={{ fontSize: '12px', color: '#2D3748', lineHeight: '1.4' }}>
                        <div><span style={{ color: '#ED8936', fontWeight: '800' }}>{linePercent}%</span> waiting in lines</div>
                        <div><span style={{ color: '#9F7AEA', fontWeight: '800' }}>{100 - linePercent}%</span> not waiting in lines</div>
                      </div>
                    </div>
                  </div>

                  {/* Activities Logged Progress Bar */}
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '6px' }}>
                      <span>ACTIVITIES LOGGED</span>
                      <span style={{ color: '#004487' }}>{riddenCount} / {totalParkRides} ({rideEverythingPercent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${rideEverythingPercent}%`, height: '100%', background: 'linear-gradient(to right, #0056b3, #D4AF37)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>

                  {/* Most Popular Rides */}
                  {parkRides.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '8px', letterSpacing: '0.8px' }}>
                        MOST POPULAR RIDES
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {parkRides.map((r, idx) => {
                          const isTop = idx === 0;
                          return (
                            <div key={r.name} style={{ background: isTop ? '#FFFDF5' : '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: isTop ? '1px solid #D4AF37' : '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#2D3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                                <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                                  Avg Wait: <strong>{r.avgWait}m</strong> • Total Wait: <strong>{formatMinutes(r.totalWait)}</strong>
                                </div>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#004487', flexShrink: 0 }}>{r.count}x</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Who Visits Most Leaderboard */}
                  {leaderboard.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '8px', letterSpacing: '0.8px' }}>
                        WHO VISITS MOST
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {leaderboard.map((item, idx) => {
                          const isTop = idx === 0;
                          return (
                            <div key={item.name} style={{ background: isTop ? '#FFFDF5' : '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: isTop ? '1px solid #D4AF37' : '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Days of the Week Vertical Bar Chart Widget */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '12px', letterSpacing: '0.8px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                      DAYS OF THE WEEK
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
                                <div
                                  style={{
                                    width: '18px',
                                    height: `${heightPercent}%`,
                                    background: count > 0 ? 'linear-gradient(to top, #004487, #2B6CB0)' : '#E2E8F0',
                                    borderRadius: '6px 6px 4px 4px',
                                    transition: 'height 0.3s ease'
                                  }}
                                />
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
      )}

      {/* Subtab: Attendees */}
      {analyticsSubTab === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '900', color: '#003366', margin: '0 0 4px 4px' }}>
            <span style={{ fontSize: '24px' }}>👥</span> Attendee Cards
          </h2>
          
          {FIXED_FAMILY_MEMBERS.map(person => {
            const personVisits = visits.filter(v => parseAttendees(v.attendees).includes(person));
            const pDays = personVisits.length;

            const pActivities = personVisits.reduce((sum, v) => {
              return sum + v.activities.filter(a => isPersonRider(a, v, person)).length;
            }, 0);

            const pWaitMinutes = personVisits.reduce((sum, v) => {
              return sum + v.activities.filter(a => isPersonRider(a, v, person)).reduce((aSum, act) => aSum + act.waitTimeMinutes, 0);
            }, 0);

            const pParkMinutes = personVisits.reduce((sum, v) => {
              const pEndTime = getPersonEndTime(v, person);
              if (v.startTime && pEndTime) {
                const start = parseTimeToMinutes(v.startTime);
                const end = parseTimeToMinutes(pEndTime);
                return sum + (end >= start ? (end - start) : ((1440 - start) + end));
              }
              return sum;
            }, 0);

            const pAvgActs = pDays > 0 ? (pActivities / pDays).toFixed(1) : '0';
            const pAvgPark = pDays > 0 ? pParkMinutes / pDays : 0;
            const pAvgWait = pActivities > 0 ? Math.round(pWaitMinutes / pActivities) : 0;

            // Personal Pie Chart Calculations
            const pTotalTime = Math.max(1, pParkMinutes);
            const pLineTime = Math.min(pWaitMinutes, pTotalTime);
            const pLinePercent = Math.round((pLineTime / pTotalTime) * 100);

            const personRides = getRideBreakdown(personVisits, person).sort((a, b) => b.count - a.count);
            const topPersonRide = personRides[0] || { name: 'None Yet', count: 0, totalWait: 0, avgWait: 0 };

            // Days of the Week Visits Calculation
            const dayVisitsMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            personVisits.forEach(v => {
              if (v.visitDate) {
                const [y, m, d] = v.visitDate.split('-').map(Number);
                const dayIndex = new Date(y, m - 1, d).getDay();
                dayVisitsMap[dayIndex] = (dayVisitsMap[dayIndex] || 0) + 1;
              }
            });

            const maxDayVisits = Math.max(1, ...Object.values(dayVisitsMap));

            return (
              <div key={person} style={{ background: '#FFF', borderRadius: '24px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                
                {/* Header: Name and Visit Count Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDF2F7', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px', color: '#2B6CB0' }}>👤</span>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#003366' }}>{person}</h3>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#2B6CB0', background: '#EBF8FF', padding: '6px 14px', borderRadius: '20px' }}>
                    {pDays} {pDays === 1 ? 'Park Visit' : 'Park Visits'}
                  </div>
                </div>

                {/* 2x3 Grid Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#38A169' }}>{pActivities}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACTIVITIES</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(pParkMinutes)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARK</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(pWaitMinutes)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{pAvgActs}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG ACTIVITIES</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{formatMinutes(pAvgPark)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG VISIT</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{pAvgWait}m</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG WAIT</div>
                  </div>
                </div>

                {/* Personalized Conic Pie Chart */}
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: `conic-gradient(#ED8936 0% ${pLinePercent}%, #9F7AEA ${pLinePercent}% 100%)`,
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '4px' }}>TIME SPENT IN LINE VS PARK</div>
                    <div style={{ fontSize: '12px', color: '#2D3748', lineHeight: '1.4' }}>
                      <div><span style={{ color: '#ED8936', fontWeight: '800' }}>{pLinePercent}%</span> waiting in lines</div>
                      <div><span style={{ color: '#9F7AEA', fontWeight: '800' }}>{100 - pLinePercent}%</span> not waiting in lines</div>
                    </div>
                  </div>
                </div>

                {/* Favorite Ride Block */}
                <div style={{ background: '#FFFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #FEEBC8', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#DD6B20', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span>⭐</span> FAVORITE RIDE
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#1A202C' }}>{topPersonRide.name}</div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                    Ridden {topPersonRide.count}x • Avg Wait: {topPersonRide.avgWait || 0}m • Total Wait: {formatMinutes(topPersonRide.totalWait || 0)}
                  </div>
                </div>

                {/* Activities Logged Bar Charts Per Park */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '10px', letterSpacing: '0.8px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                    ACTIVITIES LOGGED
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PARK_NAMES.map(park => {
                      const parkCounts = getRideCountsMap(personVisits, person);
                      const totalParkRides = PARK_ATTRACTIONS[park]?.length || 1;
                      const riddenInPark = PARK_ATTRACTIONS[park]?.filter(r => (parkCounts[r] || 0) > 0).length || 0;
                      const percentComplete = Math.round((riddenInPark / totalParkRides) * 100);

                      return (
                        <div key={park} style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '800', color: '#2D3748', marginBottom: '6px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {PARK_EMOJIS[park]} {park}
                            </span>
                            <span style={{ color: '#004487', fontWeight: '900' }}>
                              {riddenInPark} / {totalParkRides} ({percentComplete}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentComplete}%`, height: '100%', background: 'linear-gradient(to right, #0056b3, #D4AF37)', transition: 'width 0.3s ease' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Days of the Week Vertical Bar Chart Widget */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '12px', letterSpacing: '0.8px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                    DAYS OF THE WEEK
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '16px 12px 12px 16px', borderRadius: '16px', border: '1px solid #EDF2F7' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', alignItems: 'end', height: '110px' }}>
                      {WEEKDAYS.map((day) => {
                        const count = dayVisitsMap[day.dayIndex] || 0;
                        const heightPercent = count > 0 ? Math.max(16, Math.round((count / maxDayVisits) * 100)) : 0;

                        return (
                          <div key={day.label + day.dayIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: '11px', fontWeight: '900', color: count > 0 ? '#004487' : '#A0AEC0', marginBottom: '4px' }}>
                              {count}
                            </div>
                            <div style={{ width: '100%', height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                              <div
                                style={{
                                  width: '18px',
                                  height: `${heightPercent}%`,
                                  background: count > 0 ? 'linear-gradient(to top, #004487, #2B6CB0)' : '#E2E8F0',
                                  borderRadius: '6px 6px 4px 4px',
                                  transition: 'height 0.3s ease'
                                }}
                              />
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
            );
          })}
        </div>
      )}

      {/* Subtab: Rides (Replaced Top 10s) */}
      {analyticsSubTab === 'top10' && (
        <div>
          {/* Header */}
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '10px', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>🎢</span> Ride Breakdown
            </h2>
          </div>

          {/* Park Filter Bar (Rainbow Style) */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
            {PARK_FILTERS.map(p => {
              const isSelected = selectedPark === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPark(p)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: isSelected ? '1px solid #004487' : '1px solid #E2E8F0',
                    background: isSelected ? '#004487' : '#FFF',
                    color: isSelected ? '#FFF' : '#4A5568',
                    fontSize: '12px',
                    fontWeight: '800',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 6px rgba(0,68,135,0.2)' : 'none',
                    flexShrink: 0
                  }}
                >
                  {p === 'ALL' ? '🌈 All Parks' : `${PARK_EMOJIS[p]} ${p}`}
                </button>
              );
            })}
          </div>

          {/* Rides Sortable Table Container */}
          {sortedRides.length === 0 ? (
            <div style={{ background: '#FFF', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#718096', border: '1px solid #E2E8F0', fontStyle: 'italic' }}>
              No rides logged matching your filter selection.
            </div>
          ) : (
            <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
              
              {/* Scrollable Container with Sticky First Column */}
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#4A5568', fontSize: '11px', fontWeight: '900' }}>
                      
                      {/* Park Emoji Header */}
                      <th
                        onClick={() => handleSort('park')}
                        style={{ padding: '12px 8px', cursor: 'pointer', width: '46px', textAlign: 'center', borderRight: '1px solid #EDF2F7' }}
                      >
                        Park {sortField === 'park' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                      {/* Ride Name Header (Sticky Left) */}
                      <th
                        onClick={() => handleSort('name')}
                        style={{
                          padding: '12px 12px',
                          cursor: 'pointer',
                          position: 'sticky',
                          left: 0,
                          background: '#F8FAFC',
                          zIndex: 2,
                          boxShadow: '2px 0 5px rgba(0,0,0,0.04)',
                          minWidth: '150px'
                        }}
                      >
                        Ride {sortField === 'name' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                      {/* Ridden */}
                      <th onClick={() => handleSort('ridden')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                        Ridden {sortField === 'ridden' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                      {/* Avg Wait */}
                      <th onClick={() => handleSort('avgWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                        Avg Wait {sortField === 'avgWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                      {/* Total Wait */}
                      <th onClick={() => handleSort('totalWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                        Tot Wait {sortField === 'totalWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                      {/* Max Wait */}
                      <th onClick={() => handleSort('maxWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                        Max {sortField === 'maxWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                      {/* Min Wait */}
                      <th onClick={() => handleSort('minWait')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                        Min {sortField === 'minWait' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                      {/* Walk-Ons */}
                      <th onClick={() => handleSort('walkOns')} style={{ padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                        Walk-Ons {sortField === 'walkOns' && (sortOrder === 'desc' ? '▼' : '▲')}
                      </th>

                    </tr>
                  </thead>
                  <tbody>
                    {sortedRides.map((r, idx) => {
                      const isEven = idx % 2 === 0;
                      const rowBg = isEven ? '#FFF' : '#F8FAFC';

                      return (
                        <tr key={`${r.park}-${r.name}`} style={{ borderBottom: '1px solid #EDF2F7' }}>
                          {/* Park Emoji Cell */}
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', borderRight: '1px solid #EDF2F7', background: rowBg }}>
                            {PARK_EMOJIS[r.park] || '🏰'}
                          </td>

                          {/* Ride Name Sticky Cell */}
                          <td
                            style={{
                              padding: '10px 12px',
                              fontWeight: '800',
                              color: '#1A202C',
                              position: 'sticky',
                              left: 0,
                              background: rowBg,
                              zIndex: 1,
                              boxShadow: '2px 0 5px rgba(0,0,0,0.04)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px'
                            }}
                          >
                            {r.name}
                          </td>

                          {/* Ridden */}
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '900', color: '#004487', background: rowBg }}>
                            {r.ridden}x
                          </td>

                          {/* Avg Wait */}
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#2D3748', background: rowBg }}>
                            {r.avgWait}m
                          </td>

                          {/* Tot Wait */}
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#ED8936', background: rowBg }}>
                            {r.totalWait}m
                          </td>

                          {/* Max Wait */}
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#C53030', background: rowBg }}>
                            {r.maxWait}m
                          </td>

                          {/* Min Wait */}
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '800', color: '#276749', background: rowBg }}>
                            {r.minWait}m
                          </td>

                          {/* Walk-Ons */}
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
          )}
        </div>
      )}
    </div>
  );
};
