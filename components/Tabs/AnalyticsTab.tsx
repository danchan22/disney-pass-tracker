'use client';

import React, { useState } from 'react';
import { Visit, AnalyticsSubTab, MainTab } from '../../lib/types';
import { PARK_NAMES, FIXED_FAMILY_MEMBERS } from '../../lib/constants';
import { parseAttendees, getPersonEndTime, parseTimeToMinutes, isPersonRider } from '../../lib/helpers';
import { ParkIcon } from '../Shared/ParkIcon';

import { ParksAnalyticsSubTab } from './Analytics/ParksAnalyticsSubTab';
import { PeopleAnalyticsSubTab } from './Analytics/PeopleAnalyticsSubTab';
import { RidesAnalyticsSubTab } from './Analytics/RidesAnalyticsSubTab';
import { VisitsAnalyticsSubTab } from './Analytics/VisitsAnalyticsSubTab';

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

type SortField = 'park' | 'name' | 'ridden' | 'avgWait' | 'totalWait' | 'maxWait' | 'minWait' | 'walkOns';

const getRankColor = (rank: number, total: number) => {
  if (rank === 1) return '#D4AF37';
  if (rank === total) return '#E53E3E';
  return '#A0AEC0';
};

const getRank = (values: number[], targetValue: number, ascending: boolean = false): number => {
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  const idx = sorted.indexOf(targetValue);
  return idx >= 0 ? idx + 1 : 1;
};

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
    const personVisits = visits.filter(v => {
      const hasPerson = parseAttendees(v.attendees).includes(person);
      const matchesPark = selectedPark === null || v.parkName === selectedPark;
      return hasPerson && matchesPark;
    });

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
  const visitsMatchingPark = filteredVisits.filter(v => selectedPark === null || v.parkName === selectedPark);

  const mappedVisits = visitsMatchingPark.map(v => {
    const duration = getVisitDuration(v, selectedAttendee);
    const party = parseAttendees(v.attendees);
    const validActs = selectedAttendee === 'ALL' ? v.activities : v.activities.filter(a => isPersonRider(a, v, selectedAttendee));
    
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

  // Shared Filter Widgets
  const renderAttendeeFilterWidget = () => (
    <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
        👤 FILTER BY ATTENDEE
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {FIXED_FAMILY_MEMBERS.map(m => {
          const isSelected = selectedAttendee === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedAttendee && setSelectedAttendee(isSelected ? 'ALL' : m)}
              style={{
                padding: '10px 4px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isSelected ? '800' : '500',
                border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                background: isSelected ? '#EBF8FF' : '#FFF',
                color: isSelected ? '#004487' : '#2D3748',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderParkFilterWidget = () => (
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
              onClick={() => handleParkSelect(park)}
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
                minWidth: 0
              }}
            >
              <ParkIcon parkName={park} size={16} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{park}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderComingSoon = () => (
    <div style={{
      background: '#FFF',
      borderRadius: '20px',
      padding: '40px 20px',
      textAlign: 'center',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      marginTop: '10px'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
      <div style={{ fontSize: '16px', fontWeight: '800', color: '#004487', marginBottom: '4px' }}>Coming soon!</div>
      <div style={{ fontSize: '12px', color: '#718096' }}>We're building something magical for this view.</div>
    </div>
  );

  return (
    <div>
      {/* Parks Subtab */}
      {analyticsSubTab === 'averages' && (
        <ParksAnalyticsSubTab
          visits={visits}
          selectedAttendee={selectedAttendee}
          selectedPark={selectedPark}
          parkStats={parkStats}
          renderAttendeeFilterWidget={renderAttendeeFilterWidget}
          renderParkFilterWidget={renderParkFilterWidget}
          getRankColor={getRankColor}
          getRank={getRank}
          parkActivitiesArr={parkActivitiesArr}
          parkTimeInParkArr={parkTimeInParkArr}
          parkWaitTimeArr={parkWaitTimeArr}
          parkAvgActivitiesArr={parkAvgActivitiesArr}
          parkAvgVisitArr={parkAvgVisitArr}
          parkAvgWaitArr={parkAvgWaitArr}
          getRideCountsMap={getRideCountsMap}
          getRideBreakdown={getRideBreakdown}
        />
      )}

      {/* People Subtab */}
      {analyticsSubTab === 'cards' && (
        <PeopleAnalyticsSubTab
          visits={visits}
          filteredVisits={filteredVisits}
          selectedAttendee={selectedAttendee}
          selectedPark={selectedPark}
          handleParkSelect={handleParkSelect}
          renderAttendeeFilterWidget={renderAttendeeFilterWidget}
          renderParkFilterWidget={renderParkFilterWidget}
          getRideBreakdown={getRideBreakdown}
          getRideCountsMap={getRideCountsMap}
          getRankColor={getRankColor}
          getRank={getRank}
          attActivitiesArr={attActivitiesArr}
          attParkMinutesArr={attParkMinutesArr}
          attWaitMinutesArr={attWaitMinutesArr}
          attAvgActsArr={attAvgActsArr}
          attAvgParkArr={attAvgParkArr}
          attAvgWaitArr={attAvgWaitArr}
          renderComingSoon={renderComingSoon}
          setSelectedAttendee={setSelectedAttendee}
          setMainTab={setMainTab}
        />
      )}

      {/* Rides Subtab */}
      {analyticsSubTab === 'top10' && (
        <RidesAnalyticsSubTab
          visits={visits}
          selectedAttendee={selectedAttendee}
          selectedPark={selectedPark}
          renderAttendeeFilterWidget={renderAttendeeFilterWidget}
          renderParkFilterWidget={renderParkFilterWidget}
          sortedRides={sortedRides}
          handleSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder}
        />
      )}

      {/* Visits Subtab */}
      {analyticsSubTab === ('visits' as AnalyticsSubTab) && (
        <VisitsAnalyticsSubTab
          selectedAttendee={selectedAttendee}
          renderAttendeeFilterWidget={renderAttendeeFilterWidget}
          renderParkFilterWidget={renderParkFilterWidget}
          longestDays={longestDays}
          shortestDays={shortestDays}
          busiestDays={busiestDays}
        />
      )}
    </div>
  );
};
