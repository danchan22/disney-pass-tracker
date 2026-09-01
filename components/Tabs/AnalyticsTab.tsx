import React from 'react';
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

            visits.filter(v => v.parkName === park).forEach(v => {
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

            return (
              <div key={park} style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                
                {/* Full Width Banner Image */}
                <img src={PARK_BANNERS[park]} alt={park} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />

                <div style={{ padding: '18px' }}>
                  {/* Park Title Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #EDF2F7', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487' }}>
                      {PARK_EMOJIS[park]} {park}
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#718096', background: '#F8FAFC', padding: '4px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      {stats.visits} Visits
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

                  {/* Mathematically Exact Conic Pie Chart Component */}
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
                      <div style={{ fontSize: '12px', color: '#2D3748' }}>
                        <span style={{ color: '#ED8936', fontWeight: '800' }}>{linePercent}% waiting in lines</span> • <span style={{ color: '#9F7AEA', fontWeight: '800' }}>{100 - linePercent}% not waiting in lines</span>
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
                    <div>
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
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#38A169' }}>{item.visits} visits</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab: Attendees (Original UI Design) */}
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

            const personRides = getRideBreakdown(personVisits, person).sort((a, b) => b.count - a.count);
            const topPersonRide = personRides[0] || { name: 'None Yet', count: 0, totalWait: 0 };

            return (
              <div key={person} style={{ background: '#FFF', borderRadius: '24px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                
                {/* Header: Name and Visit Count Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDF2F7', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px', color: '#2B6CB0' }}>👤</span>
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#003366' }}>{person}</h3>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#2B6CB0', background: '#EBF8FF', padding: '6px 14px', borderRadius: '20px' }}>
                    {pDays} Park Visits
                  </div>
                </div>

                {/* 2x3 White Grid with Gray Borders */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#FFF', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#1A202C' }}>{pActivities}</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#A0AEC0', marginTop: '2px', textTransform: 'uppercase' }}>ACTIVITIES</div>
                  </div>
                  <div style={{ background: '#FFF', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(pParkMinutes)}</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#A0AEC0', marginTop: '2px', textTransform: 'uppercase' }}>TIME IN PARKS</div>
                  </div>
                  <div style={{ background: '#FFF', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(pWaitMinutes)}</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#A0AEC0', marginTop: '2px', textTransform: 'uppercase' }}>TIME IN LINES</div>
                  </div>

                  <div style={{ background: '#FFF', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#4A5568' }}>{pAvgActs}</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#CBD5E0', marginTop: '2px', textTransform: 'uppercase' }}>AVG ACTIVITIES</div>
                  </div>
                  <div style={{ background: '#FFF', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#4A5568' }}>{formatMinutes(pAvgPark)}</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#CBD5E0', marginTop: '2px', textTransform: 'uppercase' }}>AVG DURATION</div>
                  </div>
                  <div style={{ background: '#FFF', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#4A5568' }}>{pAvgWait}m</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#CBD5E0', marginTop: '2px', textTransform: 'uppercase' }}>AVG WAIT</div>
                  </div>
                </div>

                {/* Favorite Ride Block */}
                <div style={{ background: '#FFFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #FEEBC8', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#DD6B20', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span>⭐</span> FAVORITE RIDE
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#1A202C' }}>{topPersonRide.name}</div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                    Ridden {topPersonRide.count}x • Total Wait: {formatMinutes(topPersonRide.totalWait || 0)}
                  </div>
                </div>

                {/* Ride Everything Progress Layout */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#2D3748', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
                    <span>🎡</span> RIDE EVERYTHING PROGRESS:
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {PARK_NAMES.map(park => {
                      const parkCounts = getRideCountsMap(personVisits, person);
                      const totalParkRides = PARK_ATTRACTIONS[park]?.length || 1;
                      const riddenInPark = PARK_ATTRACTIONS[park]?.filter(r => (parkCounts[r] || 0) > 0).length || 0;
                      const percentComplete = Math.round((riddenInPark / totalParkRides) * 100);

                      return (
                        <div key={park} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#1A202C', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {PARK_EMOJIS[park]} {park}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#004487' }}>
                            {riddenInPark}/{totalParkRides} ({percentComplete}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Subtab: Top 10s (Original UI Design) */}
      {analyticsSubTab === 'top10' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Most Ridden */}
          <div>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🏆</span> Most Ridden Attractions
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mostTimesRidden.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#EBF8FF', borderRadius: '12px', border: '1px solid #BEE3F8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', background: '#2B6CB0', color: '#FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1A202C' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#4A5568', fontWeight: '800', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {PARK_EMOJIS[item.park]} <span style={{ color: '#2B6CB0' }}>{item.park}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
                        Avg Wait: {item.avgWait}m<br/>
                        Total Wait: {formatMinutes(item.totalWait)}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#C3DAFE', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '900', color: '#2B6CB0' }}>
                    {item.count}x
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Longest Waits */}
          <div>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '900', color: '#C53030', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>⏳</span> Longest Average Waits
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {longestWaitTimes.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FFF5F5', borderRadius: '12px', border: '1px solid #FED7D7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', background: '#C53030', color: '#FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1A202C' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#4A5568', fontWeight: '800', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {PARK_EMOJIS[item.park]} <span style={{ color: '#C53030' }}>{item.park}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
                        Total Times Ridden: {item.count}x<br/>
                        Total Wait Time: {formatMinutes(item.totalWait)}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#FEB2B2', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '900', color: '#9B2C2C' }}>
                    {item.avgWait}m
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shortest Waits */}
          <div>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px' }}>
              <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '900', color: '#276749', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>⚡</span> Shortest Average Waits
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shortestWaitTimes.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F0FFF4', borderRadius: '12px', border: '1px solid #C6F6D5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', background: '#2F855A', color: '#FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1A202C' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#4A5568', fontWeight: '800', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {PARK_EMOJIS[item.park]} <span style={{ color: '#276749' }}>{item.park}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
                        Total Times Ridden: {item.count}x<br/>
                        Total Wait Time: {formatMinutes(item.totalWait)}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#9AE6B4', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '900', color: '#22543D' }}>
                    {item.avgWait}m
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
