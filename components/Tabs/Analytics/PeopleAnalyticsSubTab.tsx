'use client';

import React, { useState } from 'react';
import { Visit, MainTab } from '../../../lib/types';
import { PARK_NAMES, PARK_ATTRACTIONS, FIXED_FAMILY_MEMBERS } from '../../../lib/constants';
import { formatMinutes, parseAttendees, getPersonEndTime, parseTimeToMinutes, isPersonRider, formatDisplayDate } from '../../../lib/helpers';
import { ParkIcon } from '../../Shared/ParkIcon';

type PeopleSubTab = 'Cards' | 'PeopleLeaderboards' | 'Badges';

interface ScoreRecord {
  attendee: string;
  score: number;
  date: string;
  park: string;
}

interface PeopleAnalyticsSubTabProps {
  visits: Visit[];
  filteredVisits: Visit[];
  selectedAttendee: string;
  selectedPark: string | null;
  handleParkSelect: (park: string) => void;
  renderAttendeeFilterWidget: () => React.ReactNode;
  renderParkFilterWidget: () => React.ReactNode;
  getRideBreakdown: (visitList: Visit[], personFilter: string) => any[];
  getRideCountsMap: (visitList: Visit[], personFilter: string) => Record<string, number>;
  getRankColor: (rank: number, total: number) => string;
  getRank: (values: number[], targetValue: number, ascending?: boolean) => number;
  attActivitiesArr: number[];
  attParkMinutesArr: number[];
  attWaitMinutesArr: number[];
  attAvgActsArr: number[];
  attAvgParkArr: number[];
  attAvgWaitArr: number[];
  renderComingSoon: () => React.ReactNode;
  setSelectedAttendee?: (attendee: string) => void;
  setMainTab?: (tab: MainTab) => void;
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

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const PeopleAnalyticsSubTab: React.FC<PeopleAnalyticsSubTabProps> = ({
  visits,
  selectedAttendee,
  selectedPark,
  renderAttendeeFilterWidget,
  renderParkFilterWidget,
  getRideBreakdown,
  getRideCountsMap,
  getRankColor,
  getRank,
  attActivitiesArr,
  attParkMinutesArr,
  attWaitMinutesArr,
  attAvgActsArr,
  attAvgParkArr,
  attAvgWaitArr,
  renderComingSoon,
  setSelectedAttendee,
  setMainTab,
}) => {
  const [peopleSubTab, setPeopleSubTab] = useState<PeopleSubTab>('Cards');

  // SCORE LEADERBOARD PARSER
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
          { id: 'Cards', label: 'Cards' },
          { id: 'PeopleLeaderboards', label: 'Leaderboards' },
          { id: 'Badges', label: 'Badges' }
        ].map(pill => {
          const isSelected = peopleSubTab === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setPeopleSubTab(pill.id as PeopleSubTab)}
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

      {peopleSubTab === 'Cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FIXED_FAMILY_MEMBERS.filter(p => selectedAttendee === 'ALL' || p === selectedAttendee).map(person => {
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
                    {PARK_NAMES.filter(park => selectedPark === null || selectedPark === park).map(park => {
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
                              <ParkIcon parkName={park} size={16} />
                              <span>{park}</span>
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

      {peopleSubTab === 'PeopleLeaderboards' && renderComingSoon()}
      {peopleSubTab === 'Badges' && renderComingSoon()}
    </div>
  );
};
