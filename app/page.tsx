'use client';
import { useState, useEffect } from 'react';
import { Visit, Activity } from './types';

const ATTENDEE_OPTIONS = ['Dan', 'Mandie', 'Elijah', 'Sophia', 'Sam', 'Andrew'];
const UNIVERSAL_ACTIVITIES = [
  'Character Meeting',
  'Parade',
  'Fireworks Show',
  'Other / Show / Food',
];

const PARK_ATTRACTIONS = {
  'Magic Kingdom': [
    'Astro Orbiter',
    'The Barnstormer',
    'Big Thunder Mountain Railroad',
    'Buzz Lightyear’s Space Ranger Spin',
    'Carousel of Progress',
    'Country Bear Musical Jamboree',
    'Dumbo the Flying Elephant',
    'Enchanted Tales with Belle',
    'The Hall of Presidents',
    'Haunted Mansion',
    '“it’s a small world”',
    'Jungle Cruise',
    'Mad Tea Party',
    'The Magic Carpets of Aladdin',
    'The Many Adventures of Winnie the Pooh',
    'Mickey’s PhilharMagic',
    'Peter Pan’s Flight',
    'Pirates of the Caribbean',
    'Prince Charming Regal Carrousel',
    'Seven Dwarfs Mine Train',
    'Space Mountain',
    'Swiss Family Treehouse',
    'Tiana’s Bayou Adventure',
    'Tomorrowland Speedway',
    'Tomorrowland Transit Authority PeopleMover',
    'TRON Lightcycle / Run',
    'Under the Sea ~ Journey of The Little Mermaid',
    'Walt Disney Enchanted Tiki Room',
    'Walt Disney World Railroad',
  ],
  Epcot: [
    'Beauty and the Beast Sing-Along',
    'Canada Circle-Vision 360',
    'Disney and Pixar Short Film Festival',
    'Frozen Ever After',
    'Gran Fiesta Tour Starring The Three Caballeros',
    'Guardians of the Galaxy: Cosmic Rewind',
    'ImageWorks What If Labs',
    'Journey into Imagination with Figment',
    'Journey of Water, Inspired by Moana',
    'Living with the Land',
    'Mission: SPACE (Green)',
    'Mission: SPACE (Orange)',
    'Reflections of China',
    'Remy’s Ratatouille Adventure',
    'Soarin',
    'Soarin’ Around the World',
    'Spaceship Earth',
    'Test Track',
    'The Seas with Nemo & Friends',
    'Turtle Talk with Crush',
  ],
  'Hollywood Studios': [
    'Alien Swirling Saucers',
    'Beauty and the Beast Live on Stage',
    'Disney Junior Play & Dance!',
    'Fantasmic',
    'For the First Time in Forever: A Frozen Sing-Along Celebration',
    'Indiana Jones Epic Stunt Spectacular!',
    'Lightning McQueen’s Racing Academy',
    'Mickey & Minnie’s Runaway Railway',
    'Millennium Falcon: Smugglers Run',
    'Rock ’n’ Roller Coaster Starring Aerosmith',
    'Slinky Dog Dash',
    'Star Tours – The Adventures Continue',
    'Star Wars: Rise of the Resistance',
    'The Twilight Zone Tower of Terror',
    'Toy Story Mania!',
    'Vacation Fun',
    'Walt Disney Presents',
  ],
  'Animal Kingdom': [
    'Avatar Flight of Passage',
    'DINOSAUR',
    'Expedition Everest',
    'Feathered Friends in Flight!',
    'Festival of the Lion King',
    'Finding Nemo: The Big Blue... and Beyond!',
    'Gorilla Falls Exploration Trail',
    'It’s Tough to be a Bug!',
    'Kali River Rapids',
    'Kilimanjaro Safaris',
    'Maharajah Jungle Trek',
    'Na’vi River Journey',
    'The Animation Experience at Conservation Station',
    'Wildlife Express Train',
    'Zootopia: Better Together',
  ],
};

export default function DisneyTracker() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  // 🗺️ TAB NAVIGATION STATE ('tracker' or 'analytics')
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics'>(
    'tracker'
  );

  // Form States
  const [parkName, setParkName] = useState<
    'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'
  >('Magic Kingdom');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [rideName, setRideName] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [characterName, setCharacterName] = useState('');

  useEffect(() => {
    if (activeVisit) {
      setRideName(PARK_ATTRACTIONS[activeVisit.parkName][0] || '');
    }
  }, [activeVisit]);

  useEffect(() => {
    const savedVisits = localStorage.getItem('disney_visits');
    if (savedVisits) setVisits(JSON.parse(savedVisits));

    const savedActive = localStorage.getItem('disney_active_visit');
    if (savedActive) setActiveVisit(JSON.parse(savedActive));
  }, []);

  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const formatMinutes = (totalMins: number) => {
    if (totalMins <= 0) return '0m';
    const hrs = Math.floor(totalMins / 60);
    const remMins = Math.round(totalMins % 60);
    if (hrs === 0) return `${remMins}m`;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  };

  // 📈 OVERALL STATS
  const totalDays = visits.length;
  const totalActivities = visits.reduce(
    (sum, v) => sum + v.activities.length,
    0
  );
  const totalWaitMinutes = visits.reduce(
    (sum, v) =>
      sum + v.activities.reduce((aSum, act) => aSum + act.waitTimeMinutes, 0),
    0
  );

  const totalParkMinutes = visits.reduce((sum, v) => {
    if (!v.startTime || !v.endTime) return sum;
    const start = parseTimeToMinutes(v.startTime);
    const end = parseTimeToMinutes(v.endTime);
    const diff = end >= start ? end - start : 1440 - start + end;
    return sum + diff;
  }, 0);

  const avgActivitiesPerDay =
    totalDays > 0 ? (totalActivities / totalDays).toFixed(1) : '0';
  const avgParkMinutesPerDay = totalDays > 0 ? totalParkMinutes / totalDays : 0;
  const avgWaitPerActivity =
    totalActivities > 0 ? Math.round(totalWaitMinutes / totalActivities) : 0;

  // 🏛️ PARK BREAKDOWN CALCULATIONS
  const getParkBreakdown = () => {
    const initialParks = {
      'Magic Kingdom': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      Epcot: { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      'Hollywood Studios': {
        visits: 0,
        activities: 0,
        timeInPark: 0,
        waitTime: 0,
      },
      'Animal Kingdom': {
        visits: 0,
        activities: 0,
        timeInPark: 0,
        waitTime: 0,
      },
    };

    visits.forEach((v) => {
      const park = v.parkName;
      if (initialParks[park]) {
        initialParks[park].visits += 1;
        initialParks[park].activities += v.activities.length;
        initialParks[park].waitTime += v.activities.reduce(
          (sum, act) => sum + act.waitTimeMinutes,
          0
        );

        if (v.startTime && v.endTime) {
          const start = parseTimeToMinutes(v.startTime);
          const end = parseTimeToMinutes(v.endTime);
          initialParks[park].timeInPark +=
            end >= start ? end - start : 1440 - start + end;
        }
      }
    });

    return initialParks;
  };

  // 🎢 COMPREHENSIVE RIDE BREAKDOWN CALCULATIONS
  const getRideBreakdown = () => {
    const rideMap: Record<
      string,
      { count: number; totalWait: number; park: string }
    > = {};

    visits.forEach((v) => {
      v.activities.forEach((act) => {
        const key =
          act.rideName === 'Character Meeting' && act.notes
            ? `Meet ${act.notes}`
            : act.rideName;
        if (!rideMap[key]) {
          rideMap[key] = { count: 0, totalWait: 0, park: v.parkName };
        }
        rideMap[key].count += 1;
        rideMap[key].totalWait += act.waitTimeMinutes;
      });
    });

    // Convert to array and sort by most ridden
    return Object.keys(rideMap)
      .map((name) => ({
        name,
        ...rideMap[name],
        avgWait: Math.round(rideMap[name].totalWait / rideMap[name].count),
      }))
      .sort((a, b) => b.count - a.count);
  };

  const parkStats = getParkBreakdown();
  const rideStats = getRideBreakdown();

  const topActivity = rideStats[0] || {
    name: 'None Yet ✨',
    count: 0,
    totalWait: 0,
  };

  const saveHistory = (updated: Visit[]) => {
    setVisits(updated);
    localStorage.setItem('disney_visits', JSON.stringify(updated));
  };

  const saveActive = (visit: Visit | null) => {
    setActiveVisit(visit);
    if (visit) {
      localStorage.setItem('disney_active_visit', JSON.stringify(visit));
    } else {
      localStorage.removeItem('disney_active_visit');
    }
  };

  const toggleAttendee = (name: string) => {
    if (selectedAttendees.includes(name)) {
      setSelectedAttendees(selectedAttendees.filter((a) => a !== name));
    } else {
      setSelectedAttendees([...selectedAttendees, name]);
    }
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA');
    const localTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const newSession: Visit = {
      id: crypto.randomUUID(),
      visitDate: localDate,
      startTime: localTime,
      endTime: '',
      parkName,
      attendees:
        selectedAttendees.length > 0 ? selectedAttendees.join(', ') : 'Just Me',
      activities: [],
    };

    saveActive(newSession);
    setSelectedAttendees([]);
  };

  const handleAddRideLive = () => {
    if (!activeVisit || !rideName) return;
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      rideName,
      waitTimeMinutes: parseInt(waitTime) || 0,
      notes:
        rideName === 'Character Meeting' && characterName
          ? characterName
          : undefined,
    };
    const updatedSession = {
      ...activeVisit,
      activities: [...activeVisit.activities, newActivity],
    };
    saveActive(updatedSession);
    setWaitTime('');
    setCharacterName('');
  };

  const handleCheckOut = () => {
    if (!activeVisit) return;
    if (!confirm('Ready to wrap up your park day and save to history?')) return;
    const now = new Date();
    const endTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const completedVisit: Visit = { ...activeVisit, endTime };
    saveHistory([completedVisit, ...visits]);
    saveActive(null);
  };

  const deleteVisit = (id: string) => {
    if (confirm('Delete this visit history permanently?')) {
      saveHistory(visits.filter((v) => v.id !== id));
    }
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '15px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1A202C',
        background: '#FAFAFA',
        minHeight: '100vh',
      }}
    >
      {/* 🏰 HERO HEADER */}
      <header
        style={{ textAlign: 'center', marginBottom: '15px', padding: '10px 0' }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '900',
            color: '#004487',
            letterSpacing: '-0.5px',
            margin: '0 0 4px 0',
          }}
        >
          🏰 My Annual Pass Tracker
        </h1>
        <p
          style={{
            color: '#D4AF37',
            margin: 0,
            fontSize: '15px',
            fontWeight: '600',
            fontStyle: 'italic',
          }}
        >
          The happiest dashboard on earth.
        </p>
      </header>

      {/* 🗂️ TAB NAVIGATION BUTTONS */}
      <div
        style={{
          display: 'flex',
          background: '#E2E8F0',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => setActiveTab('tracker')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '9px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            background: activeTab === 'tracker' ? '#004487' : 'transparent',
            color: activeTab === 'tracker' ? '#FFF' : '#4A5568',
            transition: 'all 0.2s ease',
          }}
        >
          ⏱️ Live Companion
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            borderRadius: '9px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            background: activeTab === 'analytics' ? '#004487' : 'transparent',
            color: activeTab === 'analytics' ? '#FFF' : '#4A5568',
            transition: 'all 0.2s ease',
          }}
        >
          📊 Deep Analytics
        </button>
      </div>

      {/* 🟢 TAB 1: LIVE TRACKER & SUMMARY WORKSPACE */}
      {activeTab === 'tracker' && (
        <div>
          {/* LIVE ENTRY/LOGGER PANEL */}
          {activeVisit ? (
            <div
              style={{
                background: 'linear-gradient(135deg, #0056b3 0%, #003366 100%)',
                color: '#FFF',
                padding: '20px',
                borderRadius: '24px',
                marginBottom: '25px',
                boxShadow: '0 8px 24px rgba(0, 51, 102, 0.25)',
                border: '2px solid #D4AF37',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <div>
                  <span
                    style={{
                      background: '#D4AF37',
                      color: '#003366',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      marginBottom: '6px',
                    }}
                  >
                    ✨ CURRENTLY AT
                  </span>
                  <h2
                    style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}
                  >
                    {activeVisit.parkName}
                  </h2>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    color: '#E2E8F0',
                  }}
                >
                  <div>📅 {activeVisit.visitDate}</div>
                  <div style={{ marginTop: '2px' }}>
                    ⏰ Entered: <strong>{activeVisit.startTime}</strong>
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: '0 0 15px 0',
                  fontSize: '14px',
                  color: '#F7FAFC',
                }}
              >
                👥 <strong>With:</strong> {activeVisit.attendees}
              </p>

              <div
                style={{
                  background: '#FFF',
                  padding: '15px',
                  borderRadius: '18px',
                  marginBottom: '15px',
                  color: '#1A202C',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#004487',
                  }}
                >
                  Log an Activity:
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <select
                    value={rideName}
                    onChange={(e) => setRideName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E0',
                      background: '#F8FAFC',
                      fontSize: '14px',
                    }}
                  >
                    <optgroup label="Park Rides & Shows">
                      {PARK_ATTRACTIONS[activeVisit.parkName].map(
                        (attraction) => (
                          <option key={attraction} value={attraction}>
                            {attraction}
                          </option>
                        )
                      )}
                    </optgroup>
                    <optgroup label="Events & Activities">
                      {UNIVERSAL_ACTIVITIES.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {rideName === 'Character Meeting' && (
                    <div
                      style={{
                        background: '#FFF5F7',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid #FF8DA1',
                      }}
                    >
                      <label
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#D61F40',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        ✨ WHICH CHARACTER?
                      </label>
                      <input
                        type="text"
                        placeholder="Mickey, Cinderella, etc."
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #FFCBD4',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Wait time (mins)"
                      value={waitTime}
                      onChange={(e) => setWaitTime(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E0',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRideLive}
                      style={{
                        padding: '11px 22px',
                        background: '#2B6CB0',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      + Log
                    </button>
                  </div>
                </div>

                {activeVisit.activities.length > 0 && (
                  <div
                    style={{
                      marginTop: '15px',
                      borderTop: '2px dashed #E2E8F0',
                      paddingTop: '12px',
                    }}
                  >
                    <strong
                      style={{
                        fontSize: '11px',
                        color: '#718096',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      TODAY'S LOG ({activeVisit.activities.length}):
                    </strong>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '15px',
                        fontSize: '14px',
                      }}
                    >
                      {activeVisit.activities.map((act) => (
                        <li key={act.id} style={{ marginBottom: '4px' }}>
                          <strong>{act.rideName}</strong>
                          {act.notes ? ` (${act.notes})` : ''} —{' '}
                          {act.waitTimeMinutes}m wait
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckOut}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(to right, #E53E3E, #C53030)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                👋 Leave the Park & Save Day
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCheckIn}
              style={{
                background: '#FFF',
                padding: '22px',
                borderRadius: '24px',
                marginBottom: '25px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: '19px',
                  fontWeight: '800',
                  color: '#004487',
                  marginBottom: '15px',
                  textAlign: 'center',
                }}
              >
                ✨ Enter the Magic
              </h2>
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#718096',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  SELECT PARK
                </label>
                <select
                  value={parkName}
                  onChange={(e) => setParkName(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E0',
                    background: '#F8FAFC',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#004487',
                  }}
                >
                  <option>Magic Kingdom</option>
                  <option>Epcot</option>
                  <option>Hollywood Studios</option>
                  <option>Animal Kingdom</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#718096',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  WHO'S ATTENDING?
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                  }}
                >
                  {ATTENDEE_OPTIONS.map((name) => {
                    const isSelected = selectedAttendees.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleAttendee(name)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid #004487'
                            : '1px solid #E2E8F0',
                          background: isSelected ? '#004487' : '#FFF',
                          color: isSelected ? '#FFF' : '#2D3748',
                          fontSize: '13px',
                          fontWeight: isSelected ? '800' : '500',
                          cursor: 'pointer',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  background:
                    'linear-gradient(135deg, #0066cc 0%, #004487 100%)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                🚀 Check In to Park
              </button>
            </form>
          )}

          {/* STANDARD MAIN SUMMARY DASHBOARD COMPONENT */}
          <div
            style={{
              background: '#FFF',
              borderRadius: '24px',
              padding: '18px',
              marginBottom: '25px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
            }}
          >
            <h3
              style={{
                fontSize: '11px',
                fontWeight: '900',
                color: '#A0AEC0',
                margin: '0 0 12px 0',
                letterSpacing: '0.8px',
              }}
            >
              TOTALS
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '15px',
              }}
            >
              <div
                style={{
                  background: '#F7FAFC',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#004487',
                  }}
                >
                  {totalDays}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#718096',
                    marginTop: '2px',
                  }}
                >
                  PARK VISITS
                </div>
              </div>
              <div
                style={{
                  background: '#F7FAFC',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#38A169',
                  }}
                >
                  {totalActivities}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#718096',
                    marginTop: '2px',
                  }}
                >
                  TOTAL ACTIVITIES
                </div>
              </div>
              <div
                style={{
                  background: '#F7FAFC',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#9F7AEA',
                  }}
                >
                  {formatMinutes(totalParkMinutes)}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#718096',
                    marginTop: '2px',
                  }}
                >
                  TIME IN PARKS
                </div>
              </div>
              <div
                style={{
                  background: '#F7FAFC',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#ED8936',
                  }}
                >
                  {formatMinutes(totalWaitMinutes)}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#718096',
                    marginTop: '2px',
                  }}
                >
                  TIME IN LINES
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#FFFDF5',
                padding: '12px 15px',
                borderRadius: '14px',
                border: '1px solid #FEEBC8',
                borderLeft: '5px solid #D4AF37',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '900',
                  color: '#C05621',
                  marginBottom: '3px',
                  letterSpacing: '0.5px',
                }}
              >
                ⭐ TOP ACTIVITY
              </div>
              <div
                style={{
                  fontWeight: '800',
                  color: '#1A202C',
                  fontSize: '15px',
                }}
              >
                {topActivity.name}
              </div>
              <div
                style={{ color: '#4A5568', marginTop: '3px', fontSize: '12px' }}
              >
                Logged <strong>{topActivity.count}x</strong> | Total Wait:{' '}
                <strong style={{ color: '#C05621' }}>
                  {formatMinutes(topActivity.totalWait || 0)}
                </strong>
              </div>
            </div>

            <h3
              style={{
                fontSize: '11px',
                fontWeight: '900',
                color: '#A0AEC0',
                margin: '0 0 10px 0',
                letterSpacing: '0.8px',
              }}
            >
              AVERAGES
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
              }}
            >
              <div
                style={{
                  background: '#F7FAFC',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#2D3748',
                  }}
                >
                  {avgActivitiesPerDay}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: '#718096',
                    marginTop: '2px',
                  }}
                >
                  ACT / VISIT
                </div>
              </div>
              <div
                style={{
                  background: '#F7FAFC',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#2D3748',
                  }}
                >
                  {formatMinutes(avgParkMinutesPerDay)}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: '#718096',
                    marginTop: '2px',
                  }}
                >
                  TIME / VISIT
                </div>
              </div>
              <div
                style={{
                  background: '#F7FAFC',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#2D3748',
                  }}
                >
                  {avgWaitPerActivity}m
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: '#718096',
                    marginTop: '2px',
                  }}
                >
                  WAIT / ACT
                </div>
              </div>
            </div>
          </div>

          {/* HISTORICAL LOG */}
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '800',
                marginBottom: '12px',
                color: '#004487',
                paddingLeft: '5px',
              }}
            >
              Past Visits ({visits.length})
            </h2>
            {visits.length === 0 ? (
              <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', marginTop: '20px', fontStyle: 'italic' }}>
              Your completed trips will appear here.
            </p>
            ) : (
              visits.map((v) => (
                <div
                  key={v.id}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '20px',
                    padding: '16px',
                    marginBottom: '12px',
                    background: '#FFF',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #EDF2F7',
                      paddingBottom: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <strong
                      style={{
                        color: '#004487',
                        fontSize: '16px',
                        fontWeight: '800',
                      }}
                    >
                      {v.parkName}
                    </strong>
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#718096',
                        fontWeight: '600',
                      }}
                    >
                      📅 {v.visitDate}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4A5568',
                      marginBottom: '10px',
                    }}
                  >
                    ⏱️ <strong>Hours:</strong> {v.startTime} - {v.endTime}{' '}
                    <br />
                    👥 <strong>Party:</strong> {v.attendees}
                  </div>
                  {v.activities.length > 0 && (
                    <div
                      style={{
                        background: '#F8FAFC',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #EDF2F7',
                      }}
                    >
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '15px',
                          fontSize: '13px',
                        }}
                      >
                        {v.activities.map((a) => (
                          <li key={a.id} style={{ marginBottom: '4px' }}>
                            <strong>{a.rideName}</strong>
                            {a.notes ? ` (${a.notes})` : ''} —{' '}
                            <span style={{ color: '#718096' }}>
                              {a.waitTimeMinutes} mins
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => deleteVisit(v.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E53E3E',
                      fontSize: '11px',
                      marginTop: '12px',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: '700',
                    }}
                  >
                    🗑️ Delete Visit Log
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 📊 TAB 2: DEEP ANALYTICS METRICS */}
      {activeTab === 'analytics' && (
        <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
          {/* 🏛️ PARK BY PARK COMPARISON MATRIX */}
          <div
            style={{
              background: '#FFF',
              borderRadius: '24px',
              padding: '18px',
              marginBottom: '25px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '900',
                color: '#004487',
                margin: '0 0 15px 0',
                borderBottom: '2px solid #F2F2F7',
                paddingBottom: '6px',
              }}
            >
              🏟️ Breakdown By Park
            </h2>

            {Object.keys(parkStats).map((parkKey) => {
  const park = parkKey as keyof typeof parkStats;
  const stats = parkStats[park];
              const avgAct =
                stats.visits > 0
                  ? (stats.activities / stats.visits).toFixed(1)
                  : '0';
              const avgTime =
                stats.visits > 0
                  ? formatMinutes(stats.timeInPark / stats.visits)
                  : '0m';
              const avgWait =
                stats.activities > 0
                  ? Math.round(stats.waitTime / stats.activities)
                  : 0;

              return (
                <div
                  key={park}
                  style={{
                    marginBottom: '15px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #EDF2F7',
                  }}
                >
                  <div
                    style={{
                      fontWeight: '800',
                      color: '#1A202C',
                      fontSize: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>📍 {park}</span>
                    <span style={{ color: '#004487' }}>
                      {stats.visits} {stats.visits === 1 ? 'visit' : 'visits'}
                    </span>
                  </div>

                  {stats.visits > 0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '5px',
                        marginTop: '8px',
                        fontSize: '11px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          background: '#F8FAFC',
                          padding: '6px',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>
                          {avgAct}
                        </div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px' }}>
                          AVG ACTS
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#F8FAFC',
                          padding: '6px',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>
                          {avgTime}
                        </div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px' }}>
                          AVG DURATION
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#F8FAFC',
                          padding: '6px',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>
                          {avgWait}m
                        </div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px' }}>
                          AVG WAIT
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: '#A0AEC0',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        marginTop: '4px',
                      }}
                    >
                      No entries recorded for this park yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 🎢 RIDE BY RIDE LEADERBOARD */}
          <div
            style={{
              background: '#FFF',
              borderRadius: '24px',
              padding: '18px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '900',
                color: '#004487',
                margin: '0 0 15px 0',
                borderBottom: '2px solid #F2F2F7',
                paddingBottom: '6px',
              }}
            >
              🎢 Attraction Leaderboard
            </h2>

            {rideStats.length === 0 ? (
              <p
                style={{
                  color: '#A0AEC0',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  margin: '20px 0',
                }}
              >
                Log some attractions to construct your performance charts!
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {rideStats.map((ride, index) => (
                  <div
                    key={ride.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#F8FAFC',
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1px solid #EDF2F7',
                    }}
                  >
                    {/* Rank Badge */}
                    <div
                      style={{
                        background: index === 0 ? '#D4AF37' : '#004487',
                        color: '#FFF',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* Ride Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: '800',
                          fontSize: '13px',
                          color: '#1A202C',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ride.name}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#718096',
                          marginTop: '1px',
                        }}
                      >
                        🎬 {ride.park}
                      </div>
                    </div>

                    {/* Metric Breakouts */}
                    <div style={{ textAlign: 'right', shrink: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: '#004487',
                        }}
                      >
                        {ride.count}x ridden
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#4A5568',
                          marginTop: '1px',
                        }}
                      >
                        ⏱️ Total:{' '}
                        <strong>{formatMinutes(ride.totalWait)}</strong> | Avg:{' '}
                        <strong>{ride.avgWait}m</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
