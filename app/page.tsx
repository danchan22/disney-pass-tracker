'use client';
import { useState, useEffect } from 'react';
import { Visit, Activity } from './types';

const ATTENDEE_OPTIONS = ['Dan', 'Mandie', 'Elijah', 'Sophia', 'Sam', 'Andrew'];
const UNIVERSAL_ACTIVITIES = ['Character Meeting', 'Parade', 'Fireworks Show', 'Other / Show / Food'];

const PARK_ATTRACTIONS = {
  'Magic Kingdom': [
    'Astro Orbiter', 'The Barnstormer', 'Big Thunder Mountain Railroad', 'Buzz Lightyear’s Space Ranger Spin',
    'Carousel of Progress', 'Country Bear Musical Jamboree', 'Dumbo the Flying Elephant', 'Enchanted Tales with Belle',
    'The Hall of Presidents', 'Haunted Mansion', '“it’s a small world”', 'Jungle Cruise', 'Mad Tea Party',
    'The Magic Carpets of Aladdin', 'The Many Adventures of Winnie the Pooh', 'Mickey’s PhilharMagic',
    'Peter Pan’s Flight', 'Pirates of the Caribbean', 'Prince Charming Regal Carrousel', 'Seven Dwarfs Mine Train',
    'Space Mountain', 'Swiss Family Treehouse', 'Tiana’s Bayou Adventure', 'Tomorrowland Speedway',
    'Tomorrowland Transit Authority PeopleMover', 'TRON Lightcycle / Run', 'Under the Sea ~ Journey of The Little Mermaid',
    'Walt Disney Enchanted Tiki Room', 'Walt Disney World Railroad'
  ],
  'Epcot': [
    'Beauty and the Beast Sing-Along', 'Canada Circle-Vision 360', 'Disney and Pixar Short Film Festival',
    'Frozen Ever After', 'Gran Fiesta Tour Starring The Three Caballeros', 'Guardians of the Galaxy: Cosmic Rewind',
    'ImageWorks What If Labs', 'Journey into Imagination with Figment', 'Journey of Water, Inspired by Moana',
    'Living with the Land', 'Mission: SPACE (Green)', 'Mission: SPACE (Orange)', 'Reflections of China',
    'Remy’s Ratatouille Adventure', 'Soarin', 'Soarin’ Around the World', 'Spaceship Earth', 'Test Track',
    'The Seas with Nemo & Friends', 'Turtle Talk with Crush'
  ],
  'Hollywood Studios': [
    'Alien Swirling Saucers', 'Beauty and the Beast Live on Stage', 'Disney Junior Play & Dance!', 'Fantasmic',
    'For the First Time in Forever: A Frozen Sing-Along Celebration', 'Indiana Jones Epic Stunt Spectacular!',
    'Lightning McQueen’s Racing Academy', 'Mickey & Minnie’s Runaway Railway', 'Millennium Falcon: Smugglers Run',
    'Rock ’n’ Roller Coaster Starring Aerosmith', 'Slinky Dog Dash', 'Star Tours – The Adventures Continue',
    'Star Wars: Rise of the Resistance', 'The Twilight Zone Tower of Terror', 'The Little Mermaid: A Musical Adventure', 'Toy Story Mania!', 'Vacation Fun',
    'Walt Disney Presents'
  ],
  'Animal Kingdom': [
    'Avatar Flight of Passage', 'DINOSAUR', 'Expedition Everest', 'Feathered Friends in Flight!',
    'Festival of the Lion King', 'Finding Nemo: The Big Blue... and Beyond!', 'Gorilla Falls Exploration Trail',
    'It’s Tough to be a Bug!', 'Kali River Rapids', 'Kilimanjaro Safaris', 'Maharajah Jungle Trek',
    'Na’vi River Journey', 'The Animation Experience at Conservation Station', 'Wildlife Express Train',
    'Zootopia: Better Together'
  ]
};

export default function DisneyTracker() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics' | 'ride-everything'>('tracker');

  // Form States
  const [parkName, setParkName] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [rideName, setRideName] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [characterName, setCharacterName] = useState('');

  // ⏱️ LIVE QUEUE TIMER STATE
  const [queueStartTime, setQueueStartTime] = useState<string | null>(null);

  // ✏️ EDITING RIDE STATE
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editRideName, setEditRideName] = useState('');
  const [editWaitTime, setEditWaitTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

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

    const savedQueueTimer = localStorage.getItem('disney_queue_timer');
    if (savedQueueTimer) setQueueStartTime(savedQueueTimer);
  }, []);

  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hrs, mins] = timeStr.split(':').map(Number);
    return (hrs * 60) + mins;
  };

  const formatMinutes = (totalMins: number) => {
    if (totalMins <= 0) return '0m';
    const hrs = Math.floor(totalMins / 60);
    const remMins = Math.round(totalMins % 60);
    if (hrs === 0) return `${remMins}m`;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  };

  // 📈 STATS CALCULATIONS
  const totalDays = visits.length;
  const totalActivities = visits.reduce((sum, v) => sum + v.activities.length, 0);
  const totalWaitMinutes = visits.reduce((sum, v) => sum + v.activities.reduce((aSum, act) => aSum + act.waitTimeMinutes, 0), 0);

  const totalParkMinutes = visits.reduce((sum, v) => {
    if (!v.startTime || !v.endTime) return sum;
    const start = parseTimeToMinutes(v.startTime);
    const end = parseTimeToMinutes(v.endTime);
    const diff = end >= start ? (end - start) : ((1440 - start) + end);
    return sum + diff;
  }, 0);

  const avgActivitiesPerDay = totalDays > 0 ? (totalActivities / totalDays).toFixed(1) : '0';
  const avgParkMinutesPerDay = totalDays > 0 ? totalParkMinutes / totalDays : 0;
  const avgWaitPerActivity = totalActivities > 0 ? Math.round(totalWaitMinutes / totalActivities) : 0;

  const getParkBreakdown = () => {
    const initialParks = {
      'Magic Kingdom': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      'Epcot': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      'Hollywood Studios': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      'Animal Kingdom': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
    };
    visits.forEach(v => {
      const park = v.parkName;
      if (initialParks[park]) {
        initialParks[park].visits += 1;
        initialParks[park].activities += v.activities.length;
        initialParks[park].waitTime += v.activities.reduce((sum, act) => sum + act.waitTimeMinutes, 0);
        if (v.startTime && v.endTime) {
          const start = parseTimeToMinutes(v.startTime);
          const end = parseTimeToMinutes(v.endTime);
          initialParks[park].timeInPark += end >= start ? (end - start) : ((1440 - start) + end);
        }
      }
    });
    return initialParks;
  };

  const getRideBreakdown = () => {
    const rideMap: Record<string, { count: number; totalWait: number; park: string }> = {};
    visits.forEach(v => {
      v.activities.forEach(act => {
        const key = act.rideName === 'Character Meeting' && act.notes ? `Meet ${act.notes}` : act.rideName;
        if (!rideMap[key]) rideMap[key] = { count: 0, totalWait: 0, park: v.parkName };
        rideMap[key].count += 1;
        rideMap[key].totalWait += act.waitTimeMinutes;
      });
    });
    return Object.keys(rideMap)
      .map(name => ({ name, ...rideMap[name], avgWait: Math.round(rideMap[name].totalWait / rideMap[name].count) }))
      .sort((a, b) => b.count - a.count);
  };

  const getRideCountsMap = () => {
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      v.activities.forEach(act => {
        counts[act.rideName] = (counts[act.rideName] || 0) + 1;
      });
    });
    if (activeVisit) {
      activeVisit.activities.forEach(act => {
        counts[act.rideName] = (counts[act.rideName] || 0) + 1;
      });
    }
    return counts;
  };

  const parkStats = getParkBreakdown();
  const rideStats = getRideBreakdown();
  const topActivity = rideStats[0] || { name: 'None Yet ✨', count: 0, totalWait: 0 };
  const rideCountsMap = getRideCountsMap();

  const saveHistory = (updated: Visit[]) => {
    setVisits(updated);
    localStorage.setItem('disney_visits', JSON.stringify(updated));
  };

  const saveActive = (visit: Visit | null) => {
    setActiveVisit(visit);
    if (visit) localStorage.setItem('disney_active_visit', JSON.stringify(visit));
    else localStorage.removeItem('disney_active_visit');
  };

  const saveQueueTimer = (timestamp: string | null) => {
    setQueueStartTime(timestamp);
    if (timestamp) localStorage.setItem('disney_queue_timer', timestamp);
    else localStorage.removeItem('disney_queue_timer');
  };

  // 💾 DATA EXPORT FUNCTION FOR MIGRATION
  const exportLocalData = () => {
    const exportPayload = {
      activeVisit,
      visits
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `disney_tracker_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const toggleAttendee = (name: string) => {
    if (selectedAttendees.includes(name)) {
      setSelectedAttendees(selectedAttendees.filter(a => a !== name));
    } else {
      setSelectedAttendees([...selectedAttendees, name]);
    }
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA'); 
    const localTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newSession: Visit = {
      id: crypto.randomUUID(),
      visitDate: localDate,
      startTime: localTime,
      endTime: '',
      parkName,
      attendees: selectedAttendees.length > 0 ? selectedAttendees.join(', ') : 'Just Me',
      activities: []
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
      notes: rideName === 'Character Meeting' && characterName ? characterName : undefined
    };
    const updatedSession = { ...activeVisit, activities: [...activeVisit.activities, newActivity] };
    saveActive(updatedSession);
    setWaitTime(''); 
    setCharacterName('');
  };

  const handleStartQueueTimer = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    saveQueueTimer(timeString);
  };

  const handleEndQueueTimer = () => {
    if (!activeVisit || !queueStartTime) return;
    const now = new Date();
    const endTimeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const startMins = parseTimeToMinutes(queueStartTime);
    const endMins = parseTimeToMinutes(endTimeString);
    let calculatedWait = endMins >= startMins ? (endMins - startMins) : ((1440 - startMins) + endMins);

    if (calculatedWait <= 0) calculatedWait = 1;

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      rideName,
      waitTimeMinutes: calculatedWait,
      notes: rideName === 'Character Meeting' && characterName ? characterName : undefined
    };

    const updatedSession = { ...activeVisit, activities: [...activeVisit.activities, newActivity] };
    saveActive(updatedSession);
    
    saveQueueTimer(null);
    setCharacterName('');
    setWaitTime('');
  };

  const handleCancelQueueTimer = () => {
    if (confirm("Cancel current active waiting timer?")) {
      saveQueueTimer(null);
    }
  };

  const startEditing = (activity: Activity, visitId: string | null) => {
    setEditingActivityId(activity.id);
    setEditingVisitId(visitId);
    setEditRideName(activity.rideName);
    setEditWaitTime(activity.waitTimeMinutes.toString());
    setEditNotes(activity.notes || '');
  };

  const cancelEditing = () => {
    setEditingActivityId(null);
    setEditingVisitId(null);
  };

  const saveEditedActivity = (parkNameForList: keyof typeof PARK_ATTRACTIONS) => {
    if (!editingActivityId) return;

    const updatedActivity: Activity = {
      id: editingActivityId,
      rideName: editRideName,
      waitTimeMinutes: parseInt(editWaitTime) || 0,
      notes: editNotes.trim() ? editNotes : undefined
    };

    if (editingVisitId === null) {
      if (!activeVisit) return;
      const updatedActivities = activeVisit.activities.map(act => 
        act.id === editingActivityId ? updatedActivity : act
      );
      saveActive({ ...activeVisit, activities: updatedActivities });
    } else {
      const updatedVisits = visits.map(v => {
        if (v.id === editingVisitId) {
          const updatedActivities = v.activities.map(act => 
            act.id === editingActivityId ? updatedActivity : act
          );
          return { ...v, activities: updatedActivities };
        }
        return v;
      });
      saveHistory(updatedVisits);
    }

    cancelEditing();
  };

  const deleteActivity = (activityId: string, visitId: string | null) => {
    if (!confirm("Delete this ride entry?")) return;

    if (visitId === null) {
      if (!activeVisit) return;
      const updatedActivities = activeVisit.activities.filter(act => act.id !== activityId);
      saveActive({ ...activeVisit, activities: updatedActivities });
    } else {
      const updatedVisits = visits.map(v => {
        if (v.id === visitId) {
          return { ...v, activities: v.activities.filter(act => act.id !== activityId) };
        }
        return v;
      });
      saveHistory(updatedVisits);
    }
  };

  const handleCheckOut = () => {
    if (!activeVisit) return;
    if (!confirm("Ready to wrap up your park day and save to history?")) return;
    const now = new Date();
    const endTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const completedVisit: Visit = { ...activeVisit, endTime };
    saveHistory([completedVisit, ...visits]);
    saveActive(null); 
    saveQueueTimer(null);
  };

  const deleteVisit = (id: string) => {
    if (confirm("Delete this visit history permanently?")) {
      saveHistory(visits.filter(v => v.id !== id));
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1A202C', background: '#FAFAFA', minHeight: '100vh' }}>
      
      {/* 🏰 HERO HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '15px', padding: '10px 0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#004487', letterSpacing: '-0.5px', margin: '0 0 4px 0' }}>🏰 My Annual Pass Tracker</h1>
        <p style={{ color: '#D4AF37', margin: 0, fontSize: '15px', fontWeight: '600', fontStyle: 'italic' }}>The happiest dashboard on earth.</p>
      </header>

      {/* 🗂️ TAB NAVIGATION */}
      <div style={{ display: 'flex', background: '#E2E8F0', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('tracker')} style={{ flex: 1, padding: '10px 4px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', background: activeTab === 'tracker' ? '#004487' : 'transparent', color: activeTab === 'tracker' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>⏱️ Live Companion</button>
        <button onClick={() => setActiveTab('analytics')} style={{ flex: 1, padding: '10px 4px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', background: activeTab === 'analytics' ? '#004487' : 'transparent', color: activeTab === 'analytics' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>📊 Analytics</button>
        <button onClick={() => setActiveTab('ride-everything')} style={{ flex: 1, padding: '10px 4px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', background: activeTab === 'ride-everything' ? '#004487' : 'transparent', color: activeTab === 'ride-everything' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>🎡 Ride Everything</button>
      </div>

      {/* 🟢 TAB 1: LIVE WORKSPACE */}
      {activeTab === 'tracker' && (
        <div>
          {/* 📦 DATA EXPORT TOOLKIT (TEMPORARY FOR CLOUD MIGRATION) */}
          <div style={{ background: '#EBF8FF', border: '1px solid #90CDF4', padding: '14px', borderRadius: '16px', marginBottom: '20px' }}>
            <div style={{ fontWeight: '800', color: '#2B6CB0', fontSize: '13px', marginBottom: '4px' }}>💾 EXPORT MY DEVICE DATA</div>
            <p style={{ fontSize: '12px', color: '#4A5568', margin: '0 0 10px 0' }}>Tap below to save a backup of this phone's visit history before we merge with the rest of the group into the cloud.</p>
            <button onClick={exportLocalData} style={{ width: '100%', padding: '10px', background: '#3182CE', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
              📥 Download My Data (JSON)
            </button>
          </div>

          {activeVisit ? (
            <div style={{ background: 'linear-gradient(135deg, #0056b3 0%, #003366 100%)', color: '#FFF', padding: '20px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 8px 24px rgba(0, 51, 102, 0.25)', border: '2px solid #D4AF37' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <span style={{ background: '#D4AF37', color: '#003366', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', marginBottom: '6px' }}>✨ CURRENTLY AT</span>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>{activeVisit.parkName}</h2>
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px', color: '#E2E8F0' }}>
                  <div>📅 {activeVisit.visitDate}</div>
                  <div style={{ marginTop: '2px' }}>⏰ Entered: <strong>{activeVisit.startTime}</strong></div>
                </div>
              </div>

              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#F7FAFC' }}>👥 <strong>With:</strong> {activeVisit.attendees}</p>

              <div style={{ background: '#FFF', padding: '15px', borderRadius: '18px', marginBottom: '15px', color: '#1A202C' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#004487' }}>Track an Attraction:</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select value={rideName} onChange={(e) => setRideName(e.target.value)} disabled={!!queueStartTime} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E0', background: queueStartTime ? '#EDF2F7' : '#F8FAFC', fontSize: '14px', color: queueStartTime ? '#718096' : '#1A202C' }}>
                    <optgroup label="Park Rides & Shows">
                      {PARK_ATTRACTIONS[activeVisit.parkName].map((attraction) => (
                        <option key={attraction} value={attraction}>{attraction}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Events & Activities">
                      {UNIVERSAL_ACTIVITIES.map((action) => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </optgroup>
                  </select>

                  {rideName === 'Character Meeting' && (
                    <div style={{ background: '#FFF5F7', padding: '10px', borderRadius: '10px', border: '1px solid #FF8DA1' }}>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#D61F40', display: 'block', marginBottom: '4px' }}>✨ WHICH CHARACTER?</label>
                      <input type="text" placeholder="Mickey, Cinderella, etc." value={characterName} onChange={(e) => setCharacterName(e.target.value)} disabled={!!queueStartTime} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #FFCBD4', fontSize: '14px' }} />
                    </div>
                  )}

                  {queueStartTime ? (
                    <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#C05621', letterSpacing: '0.5px' }}>⏱️ LIVE QUEUE TIMER RUNNING</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#2D3748', margin: '4px 0' }}>Entered line at: <strong style={{color:'#004487'}}>{queueStartTime}</strong></div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button type="button" onClick={handleCancelQueueTimer} style={{ flex: 1, padding: '10px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={handleEndQueueTimer} style={{ flex: 2, padding: '10px', background: '#38A169', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(56,161,105,0.2)' }}>
                          ✅ On Ride Now!
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: '10px', marginTop: '5px' }}>
                      <button type="button" onClick={handleStartQueueTimer} style={{ width: '100%', padding: '12px', background: '#004487', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        ⏱️ Start Line Timer (Just Entered Line)
                      </button>

                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold', marginBottom: '12px', position: 'relative' }}>
                        <span style={{ background: '#FFF', padding: '0 10px', position: 'relative', zIndex: 2 }}>OR LOG MANUALLY</span>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#E2E8F0', zIndex: 1 }}></div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" placeholder="Enter wait time (mins)" value={waitTime} onChange={(e) => setWaitTime(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }} />
                        <button type="button" onClick={handleAddRideLive} style={{ padding: '11px 22px', background: '#2B6CB0', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                          + Log
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {activeVisit.activities.length > 0 && (
                  <div style={{ marginTop: '15px', borderTop: '2px dashed #E2E8F0', paddingTop: '12px' }}>
                    <strong style={{ fontSize: '11px', color: '#718096', display: 'block', marginBottom: '8px' }}>TODAY'S LOG ({activeVisit.activities.length}):</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeVisit.activities.map((act) => {
                        const isEditingThis = editingActivityId === act.id && editingVisitId === null;
                        
                        return isEditingThis ? (
                          <div key={act.id} style={{ background: '#F7FAFC', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004487', marginBottom: '6px' }}>✏️ EDIT LOGGED ENTRY</div>
                            <select value={editRideName} onChange={(e) => setEditRideName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', marginBottom: '6px' }}>
                              <optgroup label="Park Rides & Shows">
                                {PARK_ATTRACTIONS[activeVisit.parkName].map((attraction) => (
                                  <option key={attraction} value={attraction}>{attraction}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Events & Activities">
                                {UNIVERSAL_ACTIVITIES.map((action) => (
                                  <option key={action} value={action}>{action}</option>
                                ))}
                              </optgroup>
                            </select>
                            
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                              <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                              <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button onClick={() => deleteActivity(act.id, null)} style={{ background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                              <button onClick={cancelEditing} style={{ background: '#CBD5E0', color: '#2D3748', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                              <button onClick={() => saveEditedActivity(activeVisit.parkName)} style={{ background: '#38A169', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDF2F7', fontSize: '13px' }}>
                            <div>
                              <strong>{act.rideName}</strong>{act.notes ? ` (${act.notes})` : ''} — <span style={{ color: '#718096' }}>{act.waitTimeMinutes}m wait</span>
                            </div>
                            <button onClick={() => startEditing(act, null)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px' }}>
                              ✏️ Edit
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleCheckOut} style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #E53E3E, #C53030)', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                👋 Leave the Park & Save Day
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} style={{ background: '#FFF', padding: '22px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ marginTop: 0, fontSize: '19px', fontWeight: '800', color: '#004487', marginBottom: '15px', textAlign: 'center' }}>✨ Enter the Magic</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>SELECT PARK</label>
                <select value={parkName} onChange={(e) => setParkName(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E0', background: '#F8FAFC', fontSize: '16px', fontWeight: '700', color: '#004487' }}>
                  <option>Magic Kingdom</option>
                  <option>Epcot</option>
                  <option>Hollywood Studios</option>
                  <option>Animal Kingdom</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>WHO'S ATTENDING?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {ATTENDEE_OPTIONS.map((name) => {
                    const isSelected = selectedAttendees.includes(name);
                    return (
                      <button key={name} type="button" onClick={() => toggleAttendee(name)} style={{ padding: '10px 4px', borderRadius: '10px', border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0', background: isSelected ? '#004487' : '#FFF', color: isSelected ? '#FFF' : '#2D3748', fontSize: '13px', fontWeight: isSelected ? '800' : '500', cursor: 'pointer' }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0066cc 0%, #004487 100%)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                🚀 Check In to Park
              </button>
            </form>
          )}

          {/* MAIN CORE SUMMARY MODULE */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>TOTALS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#004487' }}>{totalDays}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>PARK VISITS</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#38A169' }}>{totalActivities}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TOTAL ACTIVITIES</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#9F7AEA' }}>{formatMinutes(totalParkMinutes)}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARKS</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ED8936' }}>{formatMinutes(totalWaitMinutes)}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
              </div>
            </div>

            <div style={{ background: '#FFFDF5', padding: '12px 15px', borderRadius: '14px', border: '1px solid #FEEBC8', borderLeft: '5px solid #D4AF37', marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#C05621', marginBottom: '3px', letterSpacing: '0.5px' }}>⭐ TOP ACTIVITY</div>
              <div style={{ fontWeight: '800', color: '#1A202C', fontSize: '15px' }}>{topActivity.name}</div>
              <div style={{ color: '#4A5568', marginTop: '3px', fontSize: '12px' }}>
                Logged <strong>{topActivity.count}x</strong> | Total Wait: <strong style={{color:'#C05621'}}>{formatMinutes(topActivity.totalWait || 0)}</strong>
              </div>
            </div>

            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 10px 0', letterSpacing: '0.8px' }}>AVERAGES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{avgActivitiesPerDay}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACT / VISIT</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{formatMinutes(avgParkMinutesPerDay)}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME / VISIT</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{avgWaitPerActivity}m</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>WAIT / ACT</div>
              </div>
            </div>
          </div>

          {/* PAST LOG ENTRIES WITH EDIT CONTROLS */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#004487', paddingLeft: '5px' }}>Past Visits ({visits.length})</h2>
            {visits.length === 0 ? (
              <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', marginTop: '20px', fontStyle: 'italic' }}>Your completed trips will appear here.</p>
            ) : (
              visits.map((v) => (
                <div key={v.id} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: '16px', marginBottom: '12px', background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EDF2F7', paddingBottom: '8px', marginBottom: '10px' }}>
                    <strong style={{ color: '#004487', fontSize: '16px', fontWeight: '800' }}>{v.parkName}</strong>
                    <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>📅 {v.visitDate}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#4A5568', marginBottom: '10px' }}>
                    ⏱️ <strong>Hours:</strong> {v.startTime} - {v.endTime} <br />
                    👥 <strong>Party:</strong> {v.attendees}
                  </div>
                  {v.activities.length > 0 && (
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {v.activities.map((a) => {
                          const isEditingThis = editingActivityId === a.id && editingVisitId === v.id;

                          return isEditingThis ? (
                            <div key={a.id} style={{ background: '#FFF', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004487', marginBottom: '6px' }}>✏️ EDIT LOGGED ENTRY</div>
                              <select value={editRideName} onChange={(e) => setEditRideName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', marginBottom: '6px' }}>
                                <optgroup label="Park Rides & Shows">
                                  {PARK_ATTRACTIONS[v.parkName].map((attraction) => (
                                    <option key={attraction} value={attraction}>{attraction}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Events & Activities">
                                  {UNIVERSAL_ACTIVITIES.map((action) => (
                                    <option key={action} value={action}>{action}</option>
                                  ))}
                                </optgroup>
                              </select>
                              
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                              </div>

                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => deleteActivity(a.id, v.id)} style={{ background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                                <button onClick={cancelEditing} style={{ background: '#CBD5E0', color: '#2D3748', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={() => saveEditedActivity(v.parkName)} style={{ background: '#38A169', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                              <div>
                                <strong>{a.rideName}</strong>{a.notes ? ` (${a.notes})` : ''} — <span style={{ color: '#718096' }}>{a.waitTimeMinutes} mins</span>
                              </div>
                              <button onClick={() => startEditing(a, v.id)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                ✏️ Edit
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button onClick={() => deleteVisit(v.id)} style={{ background: 'none', border: 'none', color: '#E53E3E', fontSize: '11px', marginTop: '12px', cursor: 'pointer', padding: 0, fontWeight: '700' }}>
                    🗑️ Delete Entire Visit Log
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 📊 TAB 2: DEEP ANALYTICS */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#004487', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>🏟️ Breakdown By Park</h2>
            {Object.keys(parkStats).map((parkKey) => {
              const park = parkKey as keyof typeof parkStats;
              const stats = parkStats[park];
              const avgAct = stats.visits > 0 ? (stats.activities / stats.visits).toFixed(1) : '0';
              const avgTime = stats.visits > 0 ? formatMinutes(stats.timeInPark / stats.visits) : '0m';
              const avgWait = stats.activities > 0 ? Math.round(stats.waitTime / stats.activities) : 0;
              return (
                <div key={park} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #EDF2F7' }}>
                  <div style={{ fontWeight: '800', color: '#1A202C', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📍 {park}</span>
                    <span style={{ color: '#004487' }}>{stats.visits} {stats.visits === 1 ? 'visit' : 'visits'}</span>
                  </div>
                  {stats.visits > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginTop: '8px', fontSize: '11px', textAlign: 'center' }}>
                      <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgAct}</div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px' }}>AVG ACTS</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgTime}</div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px' }}>AVG DURATION</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgWait}m</div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px' }}>AVG WAIT</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#A0AEC0', fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>No entries recorded for this park yet.</div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#004487', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>🎢 Attraction Leaderboard</h2>
            {rideStats.length === 0 ? (
              <p style={{ color: '#A0AEC0', fontSize: '14px', textAlign: 'center', fontStyle: 'italic', margin: '20px 0' }}>Log some attractions to construct your performance charts!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rideStats.map((ride, index) => (
                  <div key={ride.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                    <div style={{ background: index === 0 ? '#D4AF37' : '#004487', color: '#FFF', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>{index + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.name}</div>
                      <div style={{ fontSize: '10px', color: '#718096', marginTop: '1px' }}>🎬 {ride.park}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#004487' }}>{ride.count}x ridden</div>
                      <div style={{ fontSize: '10px', color: '#4A5568', marginTop: '1px' }}>⏱️ Total: <strong>{formatMinutes(ride.totalWait)}</strong> | Avg: <strong>{ride.avgWait}m</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎡 TAB 3: RIDE EVERYTHING CHECKLIST */}
      {activeTab === 'ride-everything' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(PARK_ATTRACTIONS).map(([park, attractions]) => {
            const sortedAttractions = [...attractions].sort((a, b) => a.localeCompare(b));
            const totalInPark = sortedAttractions.length;
            const completedCount = sortedAttractions.filter(att => (rideCountsMap[att] || 0) > 0).length;
            const percentage = totalInPark > 0 ? Math.round((completedCount / totalInPark) * 100) : 0;

            return (
              <div key={park} style={{ background: '#FFF', borderRadius: '24px', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <div style={{ marginBottom: '14px', borderBottom: '2px solid #F2F2F7', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', margin: 0 }}>📍 {park}</h2>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#D4AF37', background: '#FFFDF5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #FEEBC8' }}>
                      {completedCount}/{totalInPark} ({percentage}%)
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: '#EDF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: percentage === 100 ? '#38A169' : 'linear-gradient(90deg, #0066cc, #D4AF37)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sortedAttractions.map((attraction) => {
                    const count = rideCountsMap[attraction] || 0;
                    const isCompleted = count > 0;

                    return (
                      <div key={attraction} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: isCompleted ? '#F0FFF4' : '#F8FAFC', border: isCompleted ? '1px solid #C6F6D5' : '1px solid #EDF2F7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingRight: '8px' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0 }}>
                            {isCompleted ? '✅' : '⬜'}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: isCompleted ? '700' : '500', color: isCompleted ? '#22543D' : '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attraction}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: isCompleted ? '#276749' : '#A0AEC0', flexShrink: 0 }}>
                          {isCompleted ? `(${count})` : '0'}
                        </div>
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
