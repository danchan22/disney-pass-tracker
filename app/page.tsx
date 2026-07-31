'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TYPES ---
interface Activity {
  id: string;
  visit_id: string;
  rideName: string;
  waitTimeMinutes: number;
  timestamp?: string;
}

interface Visit {
  id: string;
  parkName: string;
  visitDate: string;
  startTime: string;
  endTime?: string;
  attendees?: string[];
  activities?: Activity[];
}

// --- MASTER RIDE LISTS ---
const PARK_RIDES: Record<string, string[]> = {
  'Magic Kingdom': [
    'Astro Orbiter', 'Big Thunder Mountain Railroad', 'Buzz Lightyear\'s Space Ranger Spin',
    'Dumbo the Flying Elephant', 'Haunted Mansion', 'it\'s a small world', 'Jungle Cruise',
    'Mad Tea Party', 'Main Street Vehicles', 'Peter Pan\'s Flight', 'Pirates of the Caribbean',
    'Seven Dwarfs Mine Train', 'Space Mountain', 'Swiss Family Treehouse', 'The Barnstormer',
    'The Magic Carpets of Aladdin', 'The Many Adventures of Winnie the Pooh', 'Tomorrowland Speedway',
    'Tomorrowland Transit Authority PeopleMover', 'TRON Lightcycle / Run', 'Under the Sea - Journey of The Little Mermaid'
  ],
  'EPCOT': [
    'Awesome Planet', 'Frozen Ever After', 'Gran Fiesta Tour Starring The Three Caballeros',
    'Guardians of the Galaxy: Cosmic Rewind', 'Journey Into Imagination With Figment',
    'Living with the Land', 'Mission: SPACE', 'Remy\'s Ratatouille Adventure', 'Soarin\' Around the World',
    'Spaceship Earth', 'Test Track', 'The Seas with Nemo & Friends'
  ],
  'Disney\'s Hollywood Studios': [
    'Alien Swirling Saucers', 'Disney Villains: Unfairly Ever After', 'Mickey & Minnie\'s Runaway Railway',
    'Millennium Falcon: Smugglers Run', 'Rock \'n\' Roller Coaster Starring Aerosmith',
    'Slinky Dog Dash', 'Star Tours – The Adventures Continue', 'Star Wars: Rise of the Resistance',
    'The Twilight Zone Tower of Terror', 'Toy Story Mania!'
  ],
  'Disney\'s Animal Kingdom': [
    'Avatar Flight of Passage', 'DINOSAUR', 'Expedition Everest - Legend of the Forbidden Mountain',
    'Gorilla Falls Exploration Trail', 'IT\'s Tough to be a Bug!', 'Kali River Rapids',
    'Kilimanjaro Safaris', 'Maharajah Jungle Trek', 'Na\'vi River Journey', 'TriceraTop Spin'
  ]
};

const PARK_EMOJI: Record<string, string> = {
  'Magic Kingdom': '🏰',
  'EPCOT': '🌐',
  'Disney\'s Hollywood Studios': '🎬',
  'Disney\'s Animal Kingdom': '🦁'
};

export default function DisneyTracker() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics' | 'rides'>('tracker');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Global & Per-Tab Attendee Filter State
  const [selectedAttendee, setSelectedAttendee] = useState<string>('ALL');

  // --- SUPABASE FETCH ---
  const fetchVisits = async () => {
    setLoading(true);
    try {
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*');

      if (visitsError) throw visitsError;

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*');

      if (activitiesError) throw activitiesError;

      // Combine Visits + Activities
      const combined = (visitsData || []).map((v: any) => ({
        ...v,
        attendees: v.attendees || [],
        activities: (activitiesData || []).filter((a: any) => a.visit_id === v.id)
      }));

      // Sort reverse chronological (newest visits first)
      combined.sort((a: Visit, b: Visit) => {
        const dateA = new Date(`${a.visitDate}T${a.startTime || '00:00'}`).getTime();
        const dateB = new Date(`${b.visitDate}T${b.startTime || '00:00'}`).getTime();
        return dateB - dateA;
      });

      setVisits(combined);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // --- EXTRACT ALL UNIQUE ATTENDEES ---
  const allAttendees = useMemo(() => {
    const set = new Set<string>();
    visits.forEach(v => {
      if (Array.isArray(v.attendees)) {
        v.attendees.forEach(a => set.add(a));
      }
    });
    return Array.from(set).sort();
  }, [visits]);

  // --- FILTERED VISITS BY ATTENDEE ---
  const filteredVisits = useMemo(() => {
    if (selectedAttendee === 'ALL') return visits;
    return visits.filter(v => Array.isArray(v.attendees) && v.attendees.includes(selectedAttendee));
  }, [visits, selectedAttendee]);

  // --- STATS CALCULATIONS ---
  const totals = useMemo(() => {
    let totalVisits = filteredVisits.length;
    let totalWaitTime = 0;
    let totalActivities = 0;

    filteredVisits.forEach(v => {
      if (v.activities) {
        totalActivities += v.activities.length;
        v.activities.forEach(a => {
          totalWaitTime += Number(a.waitTimeMinutes || 0);
        });
      }
    });

    return { totalVisits, totalActivities, totalWaitTime };
  }, [filteredVisits]);

  // Park Averages Breakdown
  const parkAverages = useMemo(() => {
    const stats: Record<string, { visits: number; activities: number; totalWait: number; totalDurationHours: number }> = {};

    filteredVisits.forEach(v => {
      const park = v.parkName || 'Other';
      if (!stats[park]) {
        stats[park] = { visits: 0, activities: 0, totalWait: 0, totalDurationHours: 0 };
      }
      stats[park].visits += 1;
      
      if (v.activities) {
        stats[park].activities += v.activities.length;
        v.activities.forEach(a => {
          stats[park].totalWait += Number(a.waitTimeMinutes || 0);
        });
      }

      if (v.startTime && v.endTime) {
        const start = new Date(`${v.visitDate}T${v.startTime}`).getTime();
        const end = new Date(`${v.visitDate}T${v.endTime}`).getTime();
        if (end > start) {
          stats[park].totalDurationHours += (end - start) / (1000 * 60 * 60);
        }
      }
    });

    return Object.entries(stats).map(([park, data]) => ({
      park,
      visits: data.visits,
      avgActivities: data.visits ? (data.activities / data.visits).toFixed(1) : '0',
      avgDuration: data.visits ? (data.totalDurationHours / data.visits).toFixed(1) + 'h' : 'N/A',
      avgWait: data.activities ? Math.round(data.totalWait / data.activities) + ' min' : '0 min'
    }));
  }, [filteredVisits]);

  // Leaderboard Aggregations
  const rideStats = useMemo(() => {
    const map: Record<string, { rideName: string; parkName: string; count: number; totalWait: number }> = {};

    filteredVisits.forEach(v => {
      if (v.activities) {
        v.activities.forEach(a => {
          const key = `${v.parkName} - ${a.rideName}`;
          if (!map[key]) {
            map[key] = { rideName: a.rideName, parkName: v.parkName, count: 0, totalWait: 0 };
          }
          map[key].count += 1;
          map[key].totalWait += Number(a.waitTimeMinutes || 0);
        });
      }
    });

    const ridesList = Object.values(map);

    const mostRidden = [...ridesList]
      .sort((a, b) => b.count - a.count || b.totalWait - a.totalWait)
      .slice(0, 10);

    const longestWait = [...ridesList]
      .sort((a, b) => (b.totalWait / b.count) - (a.totalWait / a.count))
      .slice(0, 10);

    const shortestWait = [...ridesList]
      .sort((a, b) => (a.totalWait / a.count) - (b.totalWait / b.count))
      .slice(0, 10);

    return { mostRidden, longestWait, shortestWait };
  }, [filteredVisits]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1A202C', backgroundColor: '#F7FAFC', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#2B6CB0', margin: '0 0 6px 0' }}>
          🏰 Disney World Trip Tracker
        </h1>
        <p style={{ color: '#718096', margin: 0, fontSize: '14px' }}>
          Real-time cross-device family companion & analytics
        </p>
      </header>

      {/* FILTER BY ATTENDEE BAR */}
      <div style={{ background: '#FFF', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <label htmlFor="attendee-select" style={{ fontWeight: '600', fontSize: '14px', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '6px' }}>
          👤 Filter by Attendee:
        </label>
        <select
          id="attendee-select"
          value={selectedAttendee}
          onChange={(e) => setSelectedAttendee(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E0', backgroundColor: '#EDF2F7', fontWeight: '600', fontSize: '14px', color: '#2D3748', cursor: 'pointer' }}
        >
          <option value="ALL">Everyone (All Data)</option>
          {allAttendees.map(person => (
            <option key={person} value={person}>{person}</option>
          ))}
        </select>
      </div>

      {/* TAB NAVIGATION */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#E2E8F0', padding: '4px', borderRadius: '12px' }}>
        {[
          { id: 'tracker', label: '📍 Live Companion' },
          { id: 'analytics', label: '📊 Analytics' },
          { id: 'rides', label: '🎢 Ride Everything' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? '#FFF' : 'transparent',
              color: activeTab === tab.id ? '#2B6CB0' : '#4A5568',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* TAB 1: LIVE COMPANION */}
      {activeTab === 'tracker' && (
        <div>
          {/* TOTALS SUMMARY */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#FFF', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12px', color: '#718096', fontWeight: '700', textTransform: 'uppercase' }}>Park Visits</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2B6CB0', marginTop: '4px' }}>{totals.totalVisits}</div>
            </div>
            <div style={{ background: '#FFF', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12px', color: '#718096', fontWeight: '700', textTransform: 'uppercase' }}>Activities</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2B6CB0', marginTop: '4px' }}>{totals.totalActivities}</div>
            </div>
            <div style={{ background: '#FFF', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12px', color: '#718096', fontWeight: '700', textTransform: 'uppercase' }}>Total Wait</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2B6CB0', marginTop: '4px' }}>{totals.totalWaitTime}m</div>
            </div>
          </section>

          {/* VISIT HISTORY (REVERSE CHRONOLOGICAL) */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Past Visits History</h2>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#718096' }}>Loading visits...</p>
          ) : filteredVisits.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096' }}>No visits recorded for this selection.</p>
          ) : (
            filteredVisits.map(visit => (
              <div key={visit.id} style={{ background: '#FFF', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#2D3748' }}>
                    {PARK_EMOJI[visit.parkName] || '🎡'} {visit.parkName}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#718096', fontWeight: '600' }}>{visit.visitDate}</span>
                </div>
                {visit.attendees && visit.attendees.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#4A5568', margin: '0 0 12px 0' }}>
                    <strong>Attendees:</strong> {visit.attendees.join(', ')}
                  </p>
                )}
                
                {/* ACTIVITIES LIST */}
                {visit.activities && visit.activities.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4A5568' }}>
                    {visit.activities.map((act, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>
                        <strong>{act.rideName}</strong> ({act.waitTimeMinutes} min wait)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '13px', color: '#A0AEC0', fontStyle: 'italic', margin: 0 }}>No rides logged for this visit.</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div>
          {/* PARK AVERAGES */}
          <section style={{ background: '#FFF', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: '#2B6CB0' }}>
              Park Averages
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EDF2F7', color: '#718096' }}>
                    <th style={{ padding: '8px' }}>PARK</th>
                    <th style={{ padding: '8px' }}>VISITS</th>
                    <th style={{ padding: '8px' }}>ACTIVITIES</th>
                    <th style={{ padding: '8px' }}>DURATION</th>
                    <th style={{ padding: '8px' }}>WAIT TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {parkAverages.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #EDF2F7' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600' }}>{PARK_EMOJI[row.park]} {row.park}</td>
                      <td style={{ padding: '10px 8px' }}>{row.visits}</td>
                      <td style={{ padding: '10px 8px' }}>{row.avgActivities}</td>
                      <td style={{ padding: '10px 8px' }}>{row.avgDuration}</td>
                      <td style={{ padding: '10px 8px' }}>{row.avgWait}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* LEADERBOARDS */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {/* MOST TIMES RIDDEN */}
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2D3748', margin: '0 0 12px 0' }}>🏆 Most Times Ridden</h3>
              {rideStats.mostRidden.map((item, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#2B6CB0' }}>{i + 1}. {item.rideName}</div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                    {PARK_EMOJI[item.parkName]} {item.parkName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4A5568', marginTop: '4px' }}>
                    Ridden: <strong>{item.count}x</strong> | Total Wait Time: <strong>{item.totalWait} min</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* LONGEST WAIT TIMES */}
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#C53030', margin: '0 0 12px 0' }}>⏳ Longest Wait Times</h3>
              {rideStats.longestWait.map((item, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#2D3748' }}>{i + 1}. {item.rideName}</div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                    {PARK_EMOJI[item.parkName]} {item.parkName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4A5568', marginTop: '4px' }}>
                    Avg Wait Time: <strong>{Math.round(item.totalWait / item.count)} min</strong> | Total Wait Time: <strong>{item.totalWait} min</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* SHORTEST WAIT TIMES */}
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2F855A', margin: '0 0 12px 0' }}>⚡ Shortest Wait Times</h3>
              {rideStats.shortestWait.map((item, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#2D3748' }}>{i + 1}. {item.rideName}</div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                    {PARK_EMOJI[item.parkName]} {item.parkName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4A5568', marginTop: '4px' }}>
                    Avg Wait Time: <strong>{Math.round(item.totalWait / item.count)} min</strong> | Total Wait Time: <strong>{item.totalWait} min</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: RIDE EVERYTHING */}
      {activeTab === 'rides' && (
        <div>
          {Object.entries(PARK_RIDES).map(([park, rides]) => {
            // Find rode rides for selected attendee
            const riddenSet = new Set<string>();
            filteredVisits.forEach(v => {
              if (v.parkName === park && v.activities) {
                v.activities.forEach(a => riddenSet.add(a.rideName));
              }
            });

            const completed = rides.filter(r => riddenSet.has(r)).length;
            const percentage = Math.round((completed / rides.length) * 100);

            return (
              <div key={park} style={{ background: '#FFF', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#2B6CB0' }}>{PARK_EMOJI[park]} {park}</h3>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#718096' }}>{completed} / {rides.length} ({percentage}%)</span>
                </div>
                
                {/* PROGRESS BAR */}
                <div style={{ width: '100%', height: '8px', background: '#EDF2F7', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: '#3182CE', borderRadius: '4px' }} />
                </div>

                {/* RIDE LIST */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {rides.map(ride => {
                    const isRidden = riddenSet.has(ride);
                    return (
                      <div key={ride} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: isRidden ? '#2D3748' : '#A0AEC0' }}>
                        <span>{isRidden ? '✅' : '⚪'}</span>
                        <span style={{ textDecoration: isRidden ? 'none' : 'none', fontWeight: isRidden ? '600' : '400' }}>{ride}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
