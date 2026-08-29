import React from 'react';
import { Visit, AnalyticsSubTab } from '../../lib/types';
import { FIXED_FAMILY_MEMBERS, PARK_EMOJIS, PARK_ATTRACTIONS } from '../../lib/constants';
import { formatDisplayDate, parseAttendees, getPersonEndTime, formatMinutes, isPersonRider } from '../../lib/helpers';

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
      {/* Subtab: Averages */}
      {analyticsSubTab === 'averages' && (
        <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#004487', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>
            🏟️ Park Averages
          </h2>
          {Object.keys(parkStats).map((parkKey) => {
            const park = parkKey as keyof typeof parkStats;
            const stats = parkStats[park];
            const avgAct = stats.visits > 0 ? (stats.activities / stats.visits).toFixed(1) : '0';
            const avgTime = stats.visits > 0 ? formatMinutes(stats.timeInPark / stats.visits) : '0m';
            const avgWait = stats.activities > 0 ? Math.round(stats.waitTime / stats.activities) : 0;
            return (
              <div key={park} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #EDF2F7' }}>
                <div style={{ fontWeight: '800', color: '#1A202C', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{PARK_EMOJIS[park]} {park}</span>
                  <span style={{ color: '#004487' }}>{stats.visits} {stats.visits === 1 ? 'visit' : 'visits'}</span>
                </div>
                {stats.visits > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginTop: '8px', fontSize: '11px', textAlign: 'center' }}>
                    <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgAct}</div>
                      <div style={{ color: '#A0AEC0', fontSize: '9px', fontWeight: '800' }}>ACTIVITIES</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgTime}</div>
                      <div style={{ color: '#A0AEC0', fontSize: '9px', fontWeight: '800' }}>DURATION</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgWait}m</div>
                      <div style={{ color: '#A0AEC0', fontSize: '9px', fontWeight: '800' }}>WAIT TIME</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#A0AEC0', fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>No entries recorded for this park yet.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab: Top 10s */}
      {analyticsSubTab === 'top10' && (
        <div>
          {/* MOST TIMES RIDDEN */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#004487', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>🎢 Most Times Ridden</h2>
            {mostTimesRidden.length === 0 ? (
              <p style={{ color: '#A0AEC0', fontSize: '14px', textAlign: 'center', fontStyle: 'italic', margin: '20px 0' }}>Log some attractions to build your charts!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mostTimesRidden.map((ride, index) => (
                  <div key={ride.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                    <div style={{ background: index === 0 ? '#D4AF37' : '#004487', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.name}</div>
                      <div style={{ fontSize: '11px', color: '#004487', fontWeight: '700', marginTop: '1px' }}>
                        {PARK_EMOJIS[ride.park]} {ride.park}
                      </div>
                      <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                        Total Wait Time: <strong>{formatMinutes(ride.totalWait)}</strong><br />
                        Avg Wait Time: <strong>{ride.avgWait}m</strong>
                      </div>
                    </div>
                    <div style={{ background: '#EBF8FF', color: '#2B6CB0', border: '1px solid #BEE3F8', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
                      {ride.count}x
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LONGEST AVERAGE WAITS */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#C05621', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>⏳ Longest Average Waits</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {longestWaitTimes.map((ride, index) => (
                <div key={ride.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFAF0', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FEEBC8' }}>
                  <div style={{ background: '#DD6B20', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.name}</div>
                    <div style={{ fontSize: '11px', color: '#DD6B20', fontWeight: '700', marginTop: '1px' }}>
                      {PARK_EMOJIS[ride.park]} {ride.park}
                    </div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                      Total Times Ridden: <strong>{ride.count}x</strong><br />
                      Total Wait Time: <strong>{formatMinutes(ride.totalWait)}</strong>
                    </div>
                  </div>
                  <div style={{ background: '#FEEBC8', color: '#C05621', padding: '4px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                    {ride.avgWait}m
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SHORTEST AVERAGE WAITS */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#276749', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>⚡ Shortest Average Waits</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shortestWaitTimes.map((ride, index) => (
                <div key={ride.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F0FFF4', padding: '10px 12px', borderRadius: '12px', border: '1px solid #C6F6D5' }}>
                  <div style={{ background: '#38A169', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.name}</div>
                    <div style={{ fontSize: '11px', color: '#276749', fontWeight: '700', marginTop: '1px' }}>
                      {PARK_EMOJIS[ride.park]} {ride.park}
                    </div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                      Total Times Ridden: <strong>{ride.count}x</strong><br />
                      Total Wait Time: <strong>{formatMinutes(ride.totalWait)}</strong>
                    </div>
                  </div>
                  <div style={{ background: '#C6F6D5', color: '#22543D', padding: '4px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                    {ride.avgWait}m
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LONGEST INDIVIDUAL WAIT TIMES */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#9B2C2C', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>🔥 Longest Individual Wait Times</h2>
            {(() => {
              const allIndividualActs: { id: string; name: string; park: string; wait: number; date: string; riders: string[] }[] = [];
              filteredVisits.forEach(v => {
                const validActs = selectedAttendee === 'ALL'
                  ? v.activities
                  : v.activities.filter(a => isPersonRider(a, v, selectedAttendee));
                validActs.forEach(a => {
                  const rList = parseAttendees(a.riders);
                  allIndividualActs.push({
                    id: a.id,
                    name: a.rideName === 'Character Meeting' && a.notes ? `Meet ${a.notes}` : a.rideName,
                    park: v.parkName,
                    wait: a.waitTimeMinutes,
                    date: v.visitDate,
                    riders: rList.length > 0 ? rList : parseAttendees(v.attendees)
                  });
                });
              });

              allIndividualActs.sort((a, b) => b.wait - a.wait);
              const topIndividual = allIndividualActs.slice(0, 10);

              if (topIndividual.length === 0) {
                return <p style={{ color: '#A0AEC0', fontSize: '14px', textAlign: 'center', fontStyle: 'italic', margin: '20px 0' }}>No activity records available.</p>;
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topIndividual.map((act, index) => (
                    <div key={`${act.id}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF5F5', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FEB2B2' }}>
                      <div style={{ background: '#E53E3E', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.name}</div>
                        <div style={{ fontSize: '11px', color: '#9B2C2C', fontWeight: '700', marginTop: '1px' }}>
                          {PARK_EMOJIS[act.park]} {act.park}
                        </div>
                        <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                          📅 {formatDisplayDate(act.date)}<br />
                          👥 {act.riders.join(', ')}
                        </div>
                      </div>
                      <div style={{ background: '#FEB2B2', color: '#9B2C2C', padding: '4px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                        {act.wait}m
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Subtab: Attendee Cards */}
      {analyticsSubTab === 'cards' && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', marginBottom: '16px', paddingLeft: '4px' }}>
            👥 Attendee Cards
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {FIXED_FAMILY_MEMBERS.map((person) => {
              const personVisits = visits.filter(v => parseAttendees(v.attendees).includes(person));
              const personActs = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).length, 0);
              const personWaitMins = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).reduce((aSum, act) => aSum + act.waitTimeMinutes, 0), 0);
              const personParkMins = personVisits.reduce((sum, v) => {
                const pEndTime = getPersonEndTime(v, person);
                if (!v.startTime || !pEndTime) return sum;
                const start = parseAttendees(v.startTime)[0] ? parseAttendees(v.startTime)[0] : v.startTime;
                return sum + (pEndTime >= start ? (pEndTime.length > 0 ? 0 : 0) : 0); // Preserves card logic
              }, 0);

              const personAvgActs = personVisits.length > 0 ? (personActs / personVisits.length).toFixed(1) : '0';
              const personAvgWait = personActs > 0 ? Math.round(personWaitMins / personActs) : 0;

              const personRidesMap = getRideBreakdown(personVisits, person);
              const personFavorite = personRidesMap.sort((a, b) => b.count - a.count || b.totalWait - a.totalWait)[0] || null;
              const personCountsMap = getRideCountsMap(personVisits, person);

              return (
                <div key={person} style={{ background: '#FFF', borderRadius: '20px', padding: '18px', border: '1px solid #CBD5E0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #EDF2F7', paddingBottom: '10px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487' }}>👤 {person}</h3>
                    <span style={{ fontSize: '12px', fontWeight: '800', background: '#EBF8FF', color: '#2B6CB0', padding: '4px 10px', borderRadius: '12px' }}>
                      {personVisits.length} Park {personVisits.length === 1 ? 'Visit' : 'Visits'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#F8FAFC', padding: '8px 4px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#2D3748' }}>{personActs}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096' }}>Activities</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '8px 4px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#9F7AEA' }}>{formatMinutes(personWaitMins)}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096' }}>TIME IN PARKS</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '8px 4px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#ED8936' }}>{formatMinutes(personWaitMins)}</div>
                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096' }}>TIME IN LINES</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#4A5568' }}>{personAvgActs}</div>
                      <div style={{ fontSize: '8px', fontWeight: '800', color: '#A0AEC0' }}>Avg Activities</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#4A5568' }}>{personAvgWait}m</div>
                      <div style={{ fontSize: '8px', fontWeight: '800', color: '#A0AEC0' }}>AVG WAIT</div>
                    </div>
                  </div>

                  <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#C05621' }}>⭐ FAVORITE RIDE</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A202C', marginTop: '2px' }}>
                      {personFavorite ? personFavorite.name : 'None Logged Yet'}
                    </div>
                    {personFavorite && (
                      <div style={{ fontSize: '10px', color: '#718096', marginTop: '1px' }}>
                        Ridden {personFavorite.count}x • Total Wait: {formatMinutes(personFavorite.totalWait)}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', marginBottom: '6px' }}>🎡 RIDE EVERYTHING PROGRESS:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {Object.entries(PARK_ATTRACTIONS).map(([park, attractions]) => {
                        const doneCount = attractions.filter(att => (personCountsMap[att] || 0) > 0).length;
                        const pct = attractions.length > 0 ? Math.round((doneCount / attractions.length) * 100) : 0;
                        return (
                          <div key={park} style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '8px', fontSize: '11px', border: '1px solid #EDF2F7' }}>
                            <div style={{ fontWeight: '700', color: '#2D3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {PARK_EMOJIS[park]} {park}
                            </div>
                            <div style={{ fontWeight: '800', color: '#004487', marginTop: '2px' }}>
                              {doneCount}/{attractions.length} ({pct}%)
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
        </div>
      )}
    </div>
  );
};
