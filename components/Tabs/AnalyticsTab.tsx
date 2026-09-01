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
      {/* Subtab: Parks (Formerly Averages) */}
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

            // Ride Everything Progress
            const totalParkRides = PARK_ATTRACTIONS[park]?.length || 1;
            const parkVisits = visits.filter(v => v.parkName === park);
            const rideCounts = getRideCountsMap(parkVisits, selectedAttendee);
            const riddenCount = PARK_ATTRACTIONS[park]?.filter(r => (rideCounts[r] || 0) > 0).length || 0;
            const rideEverythingPercent = Math.round((riddenCount / totalParkRides) * 100);

            // Top 5 Popular Rides for this Park
            const parkRides = getRideBreakdown(parkVisits, selectedAttendee)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            // Who Visits Most Leaderboard (Ascending)
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
              <div key={park} style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                
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

                {/* Pie Chart Component */}
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <svg width="60" height="60" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                    <circle r="16" cx="16" cy="16" fill="#9F7AEA" />
                    <circle r="8" cx="16" cy="16" fill="transparent" stroke="#ED8936" strokeWidth="16" strokeDasharray={`${linePercent} 100`} />
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '4px' }}>TIME SPENT IN LINE VS PARK</div>
                    <div style={{ fontSize: '12px', color: '#2D3748' }}>
                      <span style={{ color: '#ED8936', fontWeight: '800' }}>{linePercent}%</span> waiting in lines • <span style={{ color: '#9F7AEA', fontWeight: '800' }}>{100 - linePercent}%</span> enjoying park
                    </div>
                  </div>
                </div>

                {/* Ride Everything Progress */}
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '6px' }}>
                    <span>RIDE EVERYTHING PROGRESS</span>
                    <span style={{ color: '#004487' }}>{riddenCount} / {totalParkRides} ({rideEverythingPercent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${rideEverythingPercent}%`, height: '100%', background: '#38A169', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>

                {/* Most Popular Rides */}
                {parkRides.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '8px', letterSpacing: '0.8px' }}>
                      MOST POPULAR RIDES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {parkRides.map(r => (
                        <div key={r.name} style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#2D3748' }}>{r.name}</div>
                            <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                              Avg Wait: <strong>{r.avgWait}m</strong> • Total Wait: <strong>{formatMinutes(r.totalWait)}</strong>
                            </div>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#004487' }}>{r.count}x</div>
                        </div>
                      ))}
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
                      {leaderboard.map(item => (
                        <div key={item.name} style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#2D3748' }}>👤 {item.name}</div>
                            <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                              Total Park Time: <strong>{formatMinutes(item.timeInPark)}</strong> • Avg Visit: <strong>{formatMinutes(item.avgVisit)}</strong>
                            </div>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#38A169' }}>{item.visits} visits</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Subtab: Attendees (Formerly Attendee Cards) */}
      {analyticsSubTab === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            const topPersonRide = personRides[0] || { name: 'None Yet', count: 0 };

            return (
              <div key={person} style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #EDF2F7', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487' }}>
                    👤 {person}
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#718096', background: '#F8FAFC', padding: '4px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    {pDays} Trips
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#38A169' }}>{pActivities}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACTIVITIES</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(pParkMinutes)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>PARK TIME</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(pWaitMinutes)}</div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>LINE TIME</div>
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

                <div style={{ background: '#FFFDF5', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FEEBC8' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#C05621' }}>⭐ TOP ATTRACTION: </span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#2D3748' }}>{topPersonRide.name} ({topPersonRide.count}x)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab: Top 10s */}
      {analyticsSubTab === 'top10' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: '#FFF', borderRadius: '20px', padding: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '900', color: '#004487' }}>🏆 MOST RIDDEN ATTRACTIONS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mostTimesRidden.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '12px' }}>
                  <span style={{ fontWeight: '700', color: '#2D3748' }}>{idx + 1}. {item.name}</span>
                  <span style={{ fontWeight: '900', color: '#004487' }}>{item.count}x</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#FFF', borderRadius: '20px', padding: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '900', color: '#C05621' }}>⏳ LONGEST AVERAGE WAITS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {longestWaitTimes.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FFF5F5', borderRadius: '8px', fontSize: '12px' }}>
                  <span style={{ fontWeight: '700', color: '#C53030' }}>{idx + 1}. {item.name}</span>
                  <span style={{ fontWeight: '900', color: '#C53030' }}>{item.avgWait}m avg</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#FFF', borderRadius: '20px', padding: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '900', color: '#276749' }}>⚡ SHORTEST AVERAGE WAITS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {shortestWaitTimes.map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#F0FFF4', borderRadius: '8px', fontSize: '12px' }}>
                  <span style={{ fontWeight: '700', color: '#276749' }}>{idx + 1}. {item.name}</span>
                  <span style={{ fontWeight: '900', color: '#276749' }}>{item.avgWait}m avg</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
