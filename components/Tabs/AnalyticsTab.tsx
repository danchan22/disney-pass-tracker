'use client';

import React, { useState } from 'react';
import { Visit, AnalyticsSubTab, MainTab } from '../../lib/types';
import { PARK_NAMES, PARK_EMOJIS, PARK_ATTRACTIONS, FIXED_FAMILY_MEMBERS } from '../../lib/constants';
import { formatMinutes, parseAttendees, getPersonEndTime, parseTimeToMinutes, isPersonRider, formatDisplayDate, format12Hour } from '../../lib/helpers';

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
  setSelectedAttendee?: (attendee: string) => void;
  setMainTab?: (tab: MainTab) => void;
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

type SortField = 'park' | 'name' | 'ridden' | 'avgWait' | 'totalWait' | 'maxWait' | 'minWait' | 'walkOns';

const getRankColor = (rank: number, total: number) => {
  if (rank === 1) return '#D4AF37';
  if (rank === total) return '#E53E3E';
  return '#A0AEC0';
};

const getRank = (values: number[], targetValue: number, ascending: boolean = false): number => {
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  return sorted.indexOf(targetValue) + 1;
};

// Calculate visit duration in minutes
const getVisitDuration = (v: Visit, personFilter: string): number => {
  const pEndTime = personFilter === 'ALL' ? v.endTime : getPersonEndTime(v, personFilter);
  if (v.startTime && pEndTime) {
    const start = parseTimeToMinutes(v.startTime);
    const end = parseTimeToMinutes(pEndTime);
    return end >= start ? (end - start) : ((1440 - start) + end);
  }
  return 0;
};

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
  setSelectedAttendee,
  setMainTab,
}) => {
  const [selectedPark, setSelectedPark] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('ridden');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleParkSelect = (park: string) => {
    setSelectedPark(prev => (prev === park ? null : park));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Pre-calculate Park Metrics
  const allParkMetrics = PARK_NAMES.map(park => {
    const stats = parkStats[park] || { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 };
    const avgActivities = stats.visits > 0 ? stats.activities / stats.visits : 0;
    const avgVisit = stats.visits > 0 ? stats.timeInPark / stats.visits : 0;
    const avgWait = stats.activities > 0 ? stats.waitTime / stats.activities : 0;
    return { park, activities: stats.activities, timeInPark: stats.timeInPark, waitTime: stats.waitTime, avgActivities, avgVisit, avgWait };
  });

  const parkActivitiesArr = allParkMetrics.map(p => p.activities);
  const parkTimeInParkArr = allParkMetrics.map(p => p.timeInPark);
  const parkWaitTimeArr = allParkMetrics.map(p => p.waitTime);
  const parkAvgActivitiesArr = allParkMetrics.map(p => p.avgActivities);
  const parkAvgVisitArr = allParkMetrics.map(p => p.avgVisit);
  const parkAvgWaitArr = allParkMetrics.map(p => p.avgWait);

  // Pre-calculate Attendee Metrics
  const allAttendeeMetrics = FIXED_FAMILY_MEMBERS.map(person => {
    const personVisits = visits.filter(v => parseAttendees(v.attendees).includes(person));
    const pDays = personVisits.length;
    const pActivities = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).length, 0);
    const pWaitMinutes = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).reduce((aSum, act) => aSum + act.waitTimeMinutes, 0), 0);
    const pParkMinutes = personVisits.reduce((sum, v) => {
      const pEndTime = getPersonEndTime(v, person);
      if (v.startTime && pEndTime) {
        const start = parseTimeToMinutes(v.startTime);
        const end = parseTimeToMinutes(pEndTime);
        return sum + (end >= start ? (end - start) : ((1440 - start) + end));
      }
      return sum;
    }, 0);

    const pAvgActs = pDays > 0 ? pActivities / pDays : 0;
    const pAvgPark = pDays > 0 ? pParkMinutes / pDays : 0;
    const pAvgWait = pActivities > 0 ? pWaitMinutes / pActivities : 0;

    return { person, pActivities, pParkMinutes, pWaitMinutes, pAvgActs, pAvgPark, pAvgWait };
  });

  const attActivitiesArr = allAttendeeMetrics.map(a => a.pActivities);
  const attParkMinutesArr = allAttendeeMetrics.map(a => a.pParkMinutes);
  const attWaitMinutesArr = allAttendeeMetrics.map(a => a.pWaitMinutes);
  const attAvgActsArr = allAttendeeMetrics.map(a => a.pAvgActs);
  const attAvgParkArr = allAttendeeMetrics.map(a => a.pAvgPark);
  const attAvgWaitArr = allAttendeeMetrics.map(a => a.pAvgWait);

  // Ride Breakdown
  const rideStatsMap: Record<string, { name: string; park: string; ridden: number; totalWait: number; waitTimes: number[]; walkOns: number; }> = {};
  visits.forEach(v => {
    if (selectedPark && v.parkName !== selectedPark) return;
    const party = parseAttendees(v.attendees);
    if (selectedAttendee !== 'ALL' && !party.includes(selectedAttendee)) return;

    v.activities.forEach(act => {
      if (selectedAttendee !== 'ALL' && !isPersonRider(act, v, selectedAttendee)) return;
      const rideKey = `${v.parkName}___${act.rideName}`;
      if (!rideStatsMap[rideKey]) {
        rideStatsMap[rideKey] = { name: act.rideName, park: v.parkName, ridden: 0, totalWait: 0, waitTimes: [], walkOns: 0 };
      }
      const wait = act.waitTimeMinutes || 0;
      const isWalkOn = act.isWalkOn || wait === 0 || act.notes?.includes('[Walk On]');
      rideStatsMap[rideKey].ridden += 1;
      rideStatsMap[rideKey].totalWait += wait;
      rideStatsMap[rideKey].waitTimes.push(wait);
      if (isWalkOn) rideStatsMap[rideKey].walkOns += 1;
    });
  });

  const rideList = Object.values(rideStatsMap).map(r => ({
    name: r.name,
    park: r.park,
    ridden: r.ridden,
    totalWait: r.totalWait,
    avgWait: r.ridden > 0 ? Math.round(r.totalWait / r.ridden) : 0,
    maxWait: r.waitTimes.length > 0 ? Math.max(...r.waitTimes) : 0,
    minWait: r.waitTimes.length > 0 ? Math.min(...r.waitTimes) : 0,
    walkOns: r.walkOns
  }));

  const sortedRides = [...rideList].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  // VISITS TAB CALCULATIONS
  const mappedVisits = filteredVisits.map(v => {
    const duration = getVisitDuration(v, selectedAttendee);
    const party = parseAttendees(v.attendees);
    const validActs = selectedAttendee === 'ALL' ? v.activities : v.activities.filter(a => isPersonRider(a, v, selectedAttendee));
    
    // Split day calculation
    const endTimes = v.memberEndTimes || {};
    const fullDayMembers: string[] = [];
    const earlyMembers: string[] = [];
    party.forEach(m => {
      const mEnd = endTimes[m] || v.endTime;
      if (mEnd === v.endTime) fullDayMembers.push(m);
      else earlyMembers.push(m);
    });

    const hasEarlyDepartures = earlyMembers.length > 0 && fullDayMembers.length > 0;
    const ridesListStr = validActs.map(a => a.rideName).join(' • ');

    return { 
      ...v, 
      duration, 
      party, 
      rideCount: validActs.length,
      ridesListStr,
      hasEarlyDepartures,
      fullDayMembers,
      earlyMembers
    };
  });

  const longestDays = [...mappedVisits].sort((a, b) => b.duration - a.duration).slice(0, 10);
  const shortestDays = [...mappedVisits].filter(v => v.duration > 0).sort((a, b) => a.duration - b.duration).slice(0, 10);
  const busiestDays = [...mappedVisits].sort((a, b) => b.rideCount - a.rideCount).slice(0, 10);

  return (
    <div>
      {/* Subtab: Parks */}
      {analyticsSubTab === 'averages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PARK_NAMES.map((park) => {
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
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487' }}>
                      {PARK_EMOJIS[park]} {park}
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
      )}

      {/* Subtab: People */}
      {analyticsSubTab === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FIXED_FAMILY_MEMBERS.map(person => {
            const personVisits = visits.filter(v => parseAttendees(v.attendees).includes(person));
            const pDays = personVisits.length;
            const pActivities = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).length, 0);
            const pWaitMinutes = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).reduce((aSum, act) => aSum + act.waitTimeMinutes, 0), 0);
            const pParkMinutes = personVisits.reduce((sum, v) => {
              const pEndTime = getPersonEndTime(v, person);
              if (v.startTime && pEndTime) {
                const start = parseTimeToMinutes(v.startTime);
                const end = parseTimeToMinutes(pEndTime);
                return sum + (end >= start ? (end - start) : ((1440 - start) + end));
              }
              return sum;
            }, 0);

            const pAvgActsVal = pDays > 0 ? pActivities / pDays : 0;
            const pAvgParkVal = pDays > 0 ? pParkMinutes / pDays : 0;
            const pAvgWaitVal = pActivities > 0 ? pWaitMinutes / pActivities : 0;

            const pAvgActs = pAvgActsVal.toFixed(1);
            const pAvgPark = pAvgParkVal;
            const pAvgWait = Math.round(pAvgWaitVal);

            const totalAtt = FIXED_FAMILY_MEMBERS.length;
            const rAttActs = getRank(attActivitiesArr, pActivities, false);
            const rAttParkMin = getRank(attParkMinutesArr, pParkMinutes, false);
            const rAttWaitMin = getRank(attWaitMinutesArr, pWaitMinutes, false);
            const rAttAvgActs = getRank(attAvgActsArr, pAvgActsVal, false);
            const rAttAvgPark = getRank(attAvgParkArr, pAvgParkVal, false);
            const rAttAvgWait = getRank(attAvgWaitArr, pAvgWaitVal, true);

            const pTotalTime = Math.max(1, pParkMinutes);
            const pLineTime = Math.min(pWaitMinutes, pTotalTime);
            const pLinePercent = Math.round((pLineTime / pTotalTime) * 100);

            const personRides = getRideBreakdown(personVisits, person).sort((a, b) => b.count - a.count);
            const topPersonRide = personRides[0] || { name: 'None Yet', count: 0, totalWait: 0, avgWait: 0 };

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDF2F7', paddingBottom: '14px', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#003366' }}>{person}</h3>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#2B6CB0', background: '#EBF8FF', padding: '6px 14px', borderRadius: '20px' }}>
                    {pDays} {pDays === 1 ? 'Park Visit' : 'Park Visits'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#38A169' }}>{pActivities}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACTIVITIES</div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAttActs, totalAtt), marginTop: '3px' }}>#{rAttActs}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(pParkMinutes)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARK</div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAttParkMin, totalAtt), marginTop: '3px' }}>#{rAttParkMin}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(pWaitMinutes)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAttWaitMin, totalAtt), marginTop: '3px' }}>#{rAttWaitMin}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{pAvgActs}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG ACTIVITIES</div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAttAvgActs, totalAtt), marginTop: '3px' }}>#{rAttAvgActs}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{formatMinutes(pAvgPark)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG VISIT</div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAttAvgPark, totalAtt), marginTop: '3px' }}>#{rAttAvgPark}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{pAvgWait}m</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG WAIT</div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: getRankColor(rAttAvgWait, totalAtt), marginTop: '3px' }}>#{rAttAvgWait}</div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: `conic-gradient(#ED8936 0% ${pLinePercent}%, #9F7AEA ${pLinePercent}% 100%)`, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '4px' }}>TIME SPENT IN LINE VS PARK</div>
                    <div style={{ fontSize: '12px', color: '#2D3748', lineHeight: '1.4' }}>
                      <div><span style={{ color: '#ED8936', fontWeight: '800' }}>{pLinePercent}%</span> waiting in lines</div>
                      <div><span style={{ color: '#9F7AEA', fontWeight: '800' }}>{100 - pLinePercent}%</span> not waiting in lines</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#FFFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #FEEBC8', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#DD6B20', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span>⭐</span> FAVORITE RIDE
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#1A202C' }}>{topPersonRide.name}</div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                    Ridden {topPersonRide.count}x • Avg Wait: {topPersonRide.avgWait || 0}m • Total Wait: {formatMinutes(topPersonRide.totalWait || 0)}
                  </div>
                </div>

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
                        <div
                          key={park}
                          onClick={() => {
                            if (setSelectedAttendee) setSelectedAttendee(person);
                            if (setMainTab) setMainTab('checklist');
                          }}
                          style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '14px', border: '1px solid #EDF2F7', cursor: 'pointer' }}
                          title={`Click to view ${person}'s checklist`}
                        >
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
            );
          })}
        </div>
      )}

      {/* Subtab: Rides */}
      {analyticsSubTab === 'top10' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '900', color: '#718096', marginBottom: '6px', letterSpacing: '0.8px' }}>
              PARK
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PARK_NAMES.map(park => {
                const isSelected = selectedPark === park;
                return (
                  <button
                    key={park}
                    onClick={() => handleParkSelect(park)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 6px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                      background: isSelected ? '#EBF8FF' : '#FFF',
                      color: isSelected ? '#004487' : '#2D3748',
                      fontSize: '11px',
                      fontWeight: '800',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      overflow: 'hidden'
                    }}
                  >
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{PARK_EMOJIS[park]}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{park}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {sortedRides.length === 0 ? (
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
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', borderRight: '1px solid #EDF2F7', background: rowBg }}>
                            {PARK_EMOJIS[r.park] || '🏰'}
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
          )}
        </div>
      )}

      {/* Subtab: Visits */}
      {analyticsSubTab === ('visits' as AnalyticsSubTab) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* LONGEST DAYS */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⏱️</span> Longest Days {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
            </h3>
            {longestDays.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#718096', fontStyle: 'italic' }}>No completed visits found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {longestDays.map((v, idx) => {
                  const isTop = idx === 0;

                  return (
                    <div
                      key={v.id}
                      style={{
                        background: isTop ? '#FFFDF5' : '#F8FAFC',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        border: isTop ? '2px solid #D4AF37' : '1px solid #EDF2F7',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: isTop ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none'
                      }}
                    >
                      {/* Content Area */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {/* Line 1: Attendees (Spills naturally without ellipsis) */}
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A202C', lineHeight: '1.4' }}>
                          {v.party.join(', ')}
                        </div>

                        {/* Line 2: Park */}
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#004487', marginTop: '4px' }}>
                          {PARK_EMOJIS[v.parkName] || ''} {v.parkName}
                        </div>

                        {/* Line 3: Date */}
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#718096', marginTop: '2px' }}>
                          📅 {formatDisplayDate(v.visitDate)}
                        </div>

                        {/* Line 4: Start & End Time */}
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A5568', marginTop: '2px' }}>
                          ⏰ {format12Hour(v.startTime)} - {format12Hour(v.endTime)}
                        </div>

                        {/* Simplified Split Day Note */}
                        {selectedAttendee === 'ALL' && v.hasEarlyDepartures && (
                          <div style={{ fontSize: '10px', color: '#DD6B20', fontWeight: '700', marginTop: '3px' }}>
                            ⚡ {v.fullDayMembers.join(', ')} stayed full day
                          </div>
                        )}
                      </div>

                      {/* Right Callout Badge */}
                      <div
                        style={{
                          background: isTop ? '#FEFCBF' : '#EBF8FF',
                          color: isTop ? '#744210' : '#2B6CB0',
                          border: isTop ? '1px solid #F6E05E' : '1px solid #BEE3F8',
                          padding: '6px 10px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '900',
                          flexShrink: 0
                        }}
                      >
                        {formatMinutes(v.duration)}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shortestDays.map((v, idx) => {
                  const isTop = idx === 0;

                  return (
                    <div
                      key={v.id}
                      style={{
                        background: isTop ? '#FFFDF5' : '#F8FAFC',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        border: isTop ? '2px solid #D4AF37' : '1px solid #EDF2F7',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: isTop ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none'
                      }}
                    >
                      {/* Content Area */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {/* Line 1: Attendees */}
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A202C', lineHeight: '1.4' }}>
                          {v.party.join(', ')}
                        </div>

                        {/* Line 2: Park */}
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#004487', marginTop: '4px' }}>
                          {PARK_EMOJIS[v.parkName] || ''} {v.parkName}
                        </div>

                        {/* Line 3: Date */}
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#718096', marginTop: '2px' }}>
                          📅 {formatDisplayDate(v.visitDate)}
                        </div>

                        {/* Line 4: Start & End Time */}
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A5568', marginTop: '2px' }}>
                          ⏰ {format12Hour(v.startTime)} - {format12Hour(v.endTime)}
                        </div>

                        {/* Simplified Split Day Note */}
                        {selectedAttendee === 'ALL' && v.hasEarlyDepartures && (
                          <div style={{ fontSize: '10px', color: '#DD6B20', fontWeight: '700', marginTop: '3px' }}>
                            ⚡ {v.fullDayMembers.join(', ')} stayed full day
                          </div>
                        )}
                      </div>

                      {/* Right Callout Badge */}
                      <div
                        style={{
                          background: isTop ? '#FEFCBF' : '#F0FFF4',
                          color: isTop ? '#744210' : '#276749',
                          border: isTop ? '1px solid #F6E05E' : '1px solid #C6F6D5',
                          padding: '6px 10px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '900',
                          flexShrink: 0
                        }}
                      >
                        {formatMinutes(v.duration)}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {busiestDays.map((v, idx) => {
                  const isTop = idx === 0;

                  return (
                    <div
                      key={v.id}
                      style={{
                        background: isTop ? '#FFFDF5' : '#F8FAFC',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        border: isTop ? '2px solid #D4AF37' : '1px solid #EDF2F7',
                        boxShadow: isTop ? '0 2px 8px rgba(212, 175, 55, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        {/* Header Content Area */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {/* Line 1: Attendees */}
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A202C', lineHeight: '1.4' }}>
                            {v.party.join(', ')}
                          </div>

                          {/* Line 2: Park */}
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#004487', marginTop: '4px' }}>
                            {PARK_EMOJIS[v.parkName] || ''} {v.parkName}
                          </div>

                          {/* Line 3: Date */}
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#718096', marginTop: '2px' }}>
                            📅 {formatDisplayDate(v.visitDate)}
                          </div>

                          {/* Simplified Split Day Note */}
                          {selectedAttendee === 'ALL' && v.hasEarlyDepartures && (
                            <div style={{ fontSize: '10px', color: '#DD6B20', fontWeight: '700', marginTop: '3px' }}>
                              ⚡ {v.fullDayMembers.join(', ')} stayed full day
                            </div>
                          )}
                        </div>

                        {/* Right Callout Badge */}
                        <div
                          style={{
                            background: isTop ? '#FEFCBF' : '#EBF8FF',
                            color: isTop ? '#744210' : '#2B6CB0',
                            border: isTop ? '1px solid #F6E05E' : '1px solid #BEE3F8',
                            padding: '6px 10px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '900',
                            flexShrink: 0
                          }}
                        >
                          {v.rideCount} {v.rideCount === 1 ? 'ride' : 'rides'}
                        </div>
                      </div>

                      {/* Expanded Rides List Below Card Header (Wraps Naturally) */}
                      {v.ridesListStr && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0', fontSize: '11px', color: '#4A5568', fontWeight: '600', lineHeight: '1.5' }}>
                          🎠 {v.ridesListStr}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
