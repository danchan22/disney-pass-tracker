'use client';

import React from 'react';
import { Visit, Activity, TrackerSubTab } from '../../lib/types';
import { FIXED_FAMILY_MEMBERS, PARK_ATTRACTIONS, UNIVERSAL_ACTIVITIES } from '../../lib/constants';
import { formatDisplayDate, format12Hour, parseAttendees, formatMinutes } from '../../lib/helpers';
import { ParkingSubtab } from './ParkingSubtab';
import { AddPersonModal } from '../Modals/AddPersonModal';
import { LiveWaitTimesWidget } from '../Shared/LiveWaitTimesWidget';
import { ParkIcon } from '../Shared/ParkIcon';

interface TrackerTabProps {
  trackerSubTab: TrackerSubTab;
  activeVisit: Visit | null;
  parkName: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  setParkName: (park: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom') => void;
  selectedAttendees: string[];
  toggleCheckInAttendee: (name: string) => void;
  handleCheckIn: (e: React.FormEvent) => void;
  activePartyList: string[];
  rideName: string;
  setRideName: (name: string) => void;
  waitTime: string;
  setWaitTime: (time: string) => void;
  characterName: string;
  setCharacterName: (name: string) => void;
  selectedRiders: string[];
  toggleRiderSelection: (name: string) => void;
  queueStartTimestamp: number | null;
  setQueueStartTimestamp: (ts: number | null) => void;
  queueStartTimeStr: string | null;
  setQueueStartTimeStr: (str: string | null) => void;
  getElapsedQueueTimeString: () => string;
  rideTrivia: string | null;
  setRideTrivia: (trivia: string | null) => void;
  triviaLoading: boolean;
  hiddenMickey: string | null;
  setHiddenMickey: (mickey: string | null) => void;
  mickeyLoading: boolean;
  handleStartQueueTimer: () => void;
  handleEndQueueTimer: (isWalkOn?: boolean) => void;
  handleCancelQueueTimer: () => void;
  handleAddRideLive: (isWalkOn?: boolean) => void;
  editingActivityId: string | null;
  editingVisitId: string | null;
  editRideName: string;
  setEditRideName: (name: string) => void;
  editWaitTime: string;
  setEditWaitTime: (time: string) => void;
  editNotes: string;
  setEditNotes: (notes: string) => void;
  editRiders: string[];
  toggleEditRiderSelection: (name: string) => void;
  startEditing: (activity: Activity, visitId: string | null) => void;
  cancelEditing: () => void;
  saveEditedActivity: () => void;
  deleteActivity: (id: string) => void;
  setDepartingMembers: (members: string[]) => void;
  setShowCheckoutModal: (show: boolean) => void;
  handleAddMembersToActiveVisit: (newMembers: string[]) => void;
  selectedAttendee: string;
  totalDays: number;
  totalActivities: number;
  totalParkMinutes: number;
  totalWaitMinutes: number;
  topActivity: { name: string; count: number; totalWait?: number; avgWait?: number };
  avgActivitiesPerDay: string;
  avgParkMinutesPerDay: number;
  avgWaitPerActivity: number;
  filteredVisits: Visit[];
  loading: boolean;
  openEditVisit: (v: Visit) => void;
  deleteVisit: (id: string) => void;
  handleReorderActivity: (visitId: string | null, activityId: string, direction: 'up' | 'down') => void;
}

// Coaster Song Playlists
const COASTER_SONGS: Record<string, string[]> = {
  'Guardians of the Galaxy: Cosmic Rewind': [
    '"September" by Earth, Wind & Fire',
    '"Disco Inferno" by The Trammps',
    '"Everybody Wants to Rule the World" by Tears for Fears',
    '"I Ran (So Far Away)" by A Flock of Seagulls',
    '"One Way or Another" by Blondie',
    '"Conga" by Gloria Estefan',
  ],
  'Rock \'n\' Roller Coaster Starring Aerosmith': [
    '"Song 2"',
    '"Born To Be Wild"',
    '"Love Rollercoaster"',
    '"Rock! Rock! (Till You Drop)"',
    '"Walking on Sunshine"',
  ],
};

const PARK_BANNERS: Record<string, string> = {
  'Magic Kingdom': '/park-magic-kingdom.png',
  'Epcot': '/park-epcot.png',
  'Hollywood Studios': '/park-hollywood-studios.png',
  'Animal Kingdom': '/park-animal-kingdom.png'
};

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getCoasterSongs = (ride: string): string[] | null => {
  if (!ride) return null;
  const cleanedRide = cleanStr(ride);
  if (!cleanedRide) return null;

  for (const [key, songs] of Object.entries(COASTER_SONGS)) {
    const cleanedKey = cleanStr(key);
    if (cleanedRide.includes(cleanedKey) || cleanedKey.includes(cleanedRide)) {
      return songs;
    }
  }
  return null;
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

const MONTH_ORDER = [
  { label: 'Jun', monthIndex: 5 },
  { label: 'Jul', monthIndex: 6 },
  { label: 'Aug', monthIndex: 7 },
  { label: 'Sep', monthIndex: 8 },
  { label: 'Oct', monthIndex: 9 },
  { label: 'Nov', monthIndex: 10 },
  { label: 'Dec', monthIndex: 11 },
  { label: 'Jan', monthIndex: 0 },
  { label: 'Feb', monthIndex: 1 },
  { label: 'Mar', monthIndex: 2 },
  { label: 'Apr', monthIndex: 3 },
  { label: 'May', monthIndex: 4 },
];

export const TrackerTab: React.FC<TrackerTabProps> = ({
  trackerSubTab,
  activeVisit,
  parkName,
  setParkName,
  selectedAttendees,
  toggleCheckInAttendee,
  handleCheckIn,
  activePartyList,
  rideName,
  setRideName,
  waitTime,
  setWaitTime,
  characterName,
  setCharacterName,
  selectedRiders,
  toggleRiderSelection,
  queueStartTimestamp,
  queueStartTimeStr,
  getElapsedQueueTimeString,
  rideTrivia,
  triviaLoading,
  hiddenMickey,
  mickeyLoading,
  handleStartQueueTimer,
  handleEndQueueTimer,
  handleCancelQueueTimer,
  handleAddRideLive,
  editingActivityId,
  editingVisitId,
  editRideName,
  setEditRideName,
  editWaitTime,
  setEditWaitTime,
  editNotes,
  setEditNotes,
  editRiders,
  toggleEditRiderSelection,
  startEditing,
  cancelEditing,
  saveEditedActivity,
  deleteActivity,
  setDepartingMembers,
  setShowCheckoutModal,
  handleAddMembersToActiveVisit,
  selectedAttendee,
  totalDays,
  totalActivities,
  totalParkMinutes,
  totalWaitMinutes,
  topActivity,
  avgActivitiesPerDay,
  avgParkMinutesPerDay,
  avgWaitPerActivity,
  filteredVisits,
  loading,
  openEditVisit,
  deleteVisit,
  handleReorderActivity,
}) => {
  const [showAddPersonModal, setShowAddPersonModal] = React.useState<boolean>(false);

  const activeCoasterSongs = getCoasterSongs(rideName);

  const parkVisitsMap: Record<string, number> = {
    'Magic Kingdom': 0,
    'Epcot': 0,
    'Hollywood Studios': 0,
    'Animal Kingdom': 0,
  };
  filteredVisits.forEach(v => {
    if (parkVisitsMap[v.parkName] !== undefined) {
      parkVisitsMap[v.parkName] += 1;
    }
  });

  const allPossibleAttractionsCount = Object.values(PARK_ATTRACTIONS).reduce((sum, list) => sum + list.length, 0);
  const uniqueRidesRidden = new Set<string>();
  filteredVisits.forEach(v => {
    v.activities.forEach(a => {
      if (a.rideName && a.rideName !== 'Character Meeting') {
        uniqueRidesRidden.add(a.rideName);
      }
    });
  });
  const riddenUniqueCount = uniqueRidesRidden.size;
  const totalUniquePercent = Math.round((riddenUniqueCount / Math.max(1, allPossibleAttractionsCount)) * 100);

  const totalParkTime = Math.max(1, totalParkMinutes);
  const lineTime = Math.min(totalWaitMinutes, totalParkTime);
  const linePercent = Math.round((lineTime / totalParkTime) * 100);

  const dayVisitsMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  filteredVisits.forEach(v => {
    if (v.visitDate) {
      const [y, m, d] = v.visitDate.split('-').map(Number);
      const dayIndex = new Date(y, m - 1, d).getDay();
      dayVisitsMap[dayIndex] = (dayVisitsMap[dayIndex] || 0) + 1;
    }
  });
  const maxDayVisits = Math.max(1, ...Object.values(dayVisitsMap));

  const monthVisitsMap: Record<number, number> = {};
  filteredVisits.forEach(v => {
    if (v.visitDate) {
      const [y, m] = v.visitDate.split('-').map(Number);
      const monthIndex = m - 1;
      monthVisitsMap[monthIndex] = (monthVisitsMap[monthIndex] || 0) + 1;
    }
  });
  const maxMonthVisits = Math.max(1, ...Object.values(monthVisitsMap));

  return (
    <div>
      {/* Subtab: Today */}
      {trackerSubTab === 'Today' && (
        <div>
          {activeVisit ? (
            <>
              {/* CURRENTLY AT CARD CONTAINER */}
<div style={{ background: 'linear-gradient(135deg, #0056b3 0%, #003366 100%)', color: '#FFF', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 8px 24px rgba(0, 51, 102, 0.25)', border: '2px solid #D4AF37', overflow: 'hidden' }}>
  
  {/* PARK BANNER HEADER (Edge-to-Edge) */}
  {PARK_BANNERS[activeVisit.parkName] && (
    <img src={PARK_BANNERS[activeVisit.parkName]} alt={activeVisit.parkName} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
  )}

  {/* INNER CONTENT WITH PADDING */}
  <div style={{ padding: '20px' }}>
    <div style={{ marginBottom: '10px' }}>
      <span style={{ background: '#D4AF37', color: '#003366', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
        ✨ CURRENTLY AT
      </span>
    </div>

    <h2 style={{ margin: '0 0 8px 0', fontSize: '25px', fontWeight: '900', letterSpacing: '-0.3px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <ParkIcon parkName={activeVisit.parkName} size={28} />
      <span>{activeVisit.parkName}</span>
    </h2>

                <div style={{ fontSize: '13px', color: '#E2E8F0', marginBottom: '12px', fontWeight: '600' }}>
                  📅 {formatDisplayDate(activeVisit.visitDate)} &nbsp;•&nbsp; ⏰ Arrived: <strong>{format12Hour(activeVisit.startTime)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#F7FAFC' }}>
                    👥 <strong>Active Party:</strong> {activePartyList.join(', ')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddPersonModal(true)}
                    style={{ background: '#D4AF37', color: '#003366', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Add Someone
                  </button>
                </div>

                {/* TRACK ATTRACTION CARD */}
                <div style={{ background: '#FFF', padding: '16px', borderRadius: '18px', marginBottom: '15px', color: '#1A202C' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#004487' }}>Track an Attraction:</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select value={rideName} onChange={(e) => setRideName(e.target.value)} disabled={!!queueStartTimestamp} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E0', background: queueStartTimestamp ? '#EDF2F7' : '#F8FAFC', fontSize: '14px', color: queueStartTimestamp ? '#718096' : '#1A202C' }}>
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

                    {activePartyList.length > 1 && (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '6px' }}>
                          👥 WHO IS RIDING THIS?
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {activePartyList.map((member) => {
                            const isRiding = selectedRiders.includes(member);
                            return (
                              <button
                                key={member}
                                type="button"
                                onClick={() => toggleRiderSelection(member)}
                                disabled={!!queueStartTimestamp}
                                style={{
                                  padding: '6px 12px', borderRadius: '8px',
                                  border: isRiding ? '2px solid #004487' : '1px solid #CBD5E0',
                                  background: isRiding ? '#004487' : '#FFF',
                                  color: isRiding ? '#FFF' : '#718096',
                                  fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                                }}
                              >
                                {isRiding ? `✓ ${member}` : member}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {rideName === 'Character Meeting' && (
                      <div style={{ background: '#FFF5F7', padding: '10px', borderRadius: '10px', border: '1px solid #FF8DA1' }}>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#D61F40', display: 'block', marginBottom: '4px' }}>✨ WHICH CHARACTER?</label>
                        <input type="text" placeholder="Mickey, Cinderella, etc." value={characterName} onChange={(e) => setCharacterName(e.target.value)} disabled={!!queueStartTimestamp} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #FFCBD4', fontSize: '14px', boxSizing: 'border-box' }} />
                      </div>
                    )}

                    {queueStartTimestamp ? (
                      <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', padding: '14px', borderRadius: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#C05621', letterSpacing: '0.5px' }}>⏱️ LIVE QUEUE TIMER RUNNING</div>
                        
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#2D3748', marginTop: '6px' }}>
                          Entered line at: <strong style={{ color: '#004487' }}>{queueStartTimeStr}</strong>
                        </div>
                        
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#C05621', margin: '8px 0' }}>
                          Time in line: {getElapsedQueueTimeString()}
                        </div>

                        <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', padding: '10px', borderRadius: '10px', marginTop: '10px', textAlign: 'left', fontSize: '12px', color: '#22543D' }}>
                          <div style={{ fontWeight: '800', color: '#276749', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ✨ Disney Fun Fact:
                          </div>
                          {triviaLoading ? (
                            <div style={{ fontStyle: 'italic', color: '#718096' }}>Searching Imagineering vault for facts...</div>
                          ) : (
                            <div>{rideTrivia}</div>
                          )}
                        </div>

                        <div style={{ background: '#F0F5FF', border: '1px solid #C3DAFE', padding: '10px', borderRadius: '10px', marginTop: '8px', textAlign: 'left', fontSize: '12px', color: '#1A365D' }}>
                          <div style={{ fontWeight: '800', color: '#2B6CB0', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👀 Hidden Mickeys:
                          </div>
                          {mickeyLoading ? (
                            <div style={{ fontStyle: 'italic', color: '#718096' }}>Scanning queue for Hidden Mickeys...</div>
                          ) : (
                            <div>{hiddenMickey}</div>
                          )}
                        </div>

                        {/* POSSIBLE SONGS CARD (Guardians & Rock 'n' Roller Coaster) */}
                        {activeCoasterSongs && (
                          <div style={{ background: '#F3E8FF', border: '1px solid #E9D5FF', padding: '10px 12px', borderRadius: '10px', marginTop: '8px', textAlign: 'left', fontSize: '12px', color: '#581C87' }}>
                            <div style={{ fontWeight: '800', color: '#6B21A8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🎵 Possible Songs:
                            </div>
                            <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', lineHeight: '1.5' }}>
                              {activeCoasterSongs.map(song => (
                                <li key={song}>{song}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* TIMER BUTTONS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '6px', marginTop: '12px' }}>
                          <button type="button" onClick={handleCancelQueueTimer} style={{ padding: '10px 4px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                            Cancel
                          </button>
                          <button type="button" onClick={() => handleEndQueueTimer(true)} style={{ padding: '10px 4px', background: '#D69E2E', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(214,158,46,0.3)' }}>
                            Walk On
                          </button>
                          <button type="button" onClick={() => handleEndQueueTimer(false)} style={{ padding: '10px 4px', background: '#38A169', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(56,161,105,0.2)' }}>
                            On Ride Now
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: '10px', marginTop: '5px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '12px' }}>
                          <button type="button" onClick={handleStartQueueTimer} style={{ padding: '12px', background: '#004487', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            ⏱️ Start Line Timer
                          </button>
                          <button type="button" onClick={() => handleAddRideLive(true)} style={{ padding: '12px', background: '#D69E2E', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(214,158,46,0.3)' }}>
                            Walk On
                          </button>
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold', marginBottom: '12px', position: 'relative' }}>
                          <span style={{ background: '#FFF', padding: '0 10px', position: 'relative', zIndex: 2 }}>OR LOG MANUALLY</span>
                          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#E2E8F0', zIndex: 1 }}></div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="number" placeholder="Enter wait time (mins)" value={waitTime} onChange={(e) => setWaitTime(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box' }} />
                          <button type="button" onClick={() => handleAddRideLive(false)} style={{ padding: '11px 22px', background: '#EDF2F7', color: '#2D3748', border: '1px solid #CBD5E0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                            Log
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TODAY'S LOG LIST */}
                  {activeVisit.activities.length > 0 && (
                    <div style={{ marginTop: '15px', borderTop: '2px dashed #E2E8F0', paddingTop: '12px' }}>
                      <strong style={{ fontSize: '11px', color: '#718096', display: 'block', marginBottom: '8px' }}>TODAY'S LOG ({activeVisit.activities.length}):</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeVisit.activities.map((act, idx) => {
                          const isEditingThis = editingActivityId === act.id && editingVisitId === null;
                          const actRidersList = parseAttendees(act.riders);
                          const editCoasterSongs = getCoasterSongs(editRideName);

                          return isEditingThis ? (
                            <div key={act.id} style={{ background: '#F7FAFC', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px', boxSizing: 'border-box', width: '100%' }}>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004487', marginBottom: '6px' }}>EDIT ENTRY</div>
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

                              {/* SONG SELECTOR FOR COASTERS */}
                              {editCoasterSongs && (
                                <div style={{ marginBottom: '8px', background: '#F3E8FF', padding: '8px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
                                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#6B21A8', display: 'block', marginBottom: '4px' }}>
                                    🎵 WHICH SONG DID YOU GET?
                                  </label>
                                  <select
                                    value={editCoasterSongs.find(s => editNotes.includes(s)) || ''}
                                    onChange={(e) => {
                                      const chosen = e.target.value;
                                      let cleanNotes = editNotes;
                                      editCoasterSongs.forEach(s => {
                                        cleanNotes = cleanNotes.replace(`🎵 Song: ${s}`, '').replace(`🎵 ${s}`, '').replace(s, '').trim();
                                      });
                                      if (chosen) {
                                        cleanNotes = cleanNotes ? `${cleanNotes} • 🎵 ${chosen}` : `🎵 ${chosen}`;
                                      }
                                      setEditNotes(cleanNotes);
                                    }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D8B4FE', fontSize: '12px', background: '#FFF', color: '#581C87', fontWeight: '700' }}
                                  >
                                    <option value="">-- Select Song --</option>
                                    {editCoasterSongs.map(song => (
                                      <option key={song} value={song}>{song}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>WHO RODE THIS?</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {parseAttendees(activeVisit.attendees).map((m) => {
                                    const checked = editRiders.includes(m);
                                    return (
                                      <button key={m} type="button" onClick={() => toggleEditRiderSelection(m)} style={{ padding: '4px 8px', borderRadius: '6px', border: checked ? '1px solid #004487' : '1px solid #CBD5E0', background: checked ? '#004487' : '#FFF', color: checked ? '#FFF' : '#4A5568', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {m}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                                  <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: '1 1 auto', minWidth: 0, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', boxSizing: 'border-box' }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditWaitTime('0');
                                      if (!editNotes.includes('[Walk On]')) {
                                        setEditNotes(`${editNotes} [Walk On]`.trim());
                                      }
                                    }}
                                    style={{ padding: '8px 10px', background: '#D69E2E', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                                  >
                                    ⚡ Walk On
                                  </button>
                                </div>
                                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', boxSizing: 'border-box' }} />
                              </div>

                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => deleteActivity(act.id)} style={{ background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                                <button onClick={cancelEditing} style={{ background: '#CBD5E0', color: '#2D3748', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={saveEditedActivity} style={{ background: '#38A169', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDF2F7' }}>
                              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1A202C' }}>{act.rideName}</div>
                                <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                  {act.isWalkOn || act.notes?.includes('[Walk On]') ? (
                                    <span style={{ color: '#D69E2E', fontWeight: '800' }}>⚡ Walk On (0m wait)</span>
                                  ) : (
                                    `⏱️ ${act.waitTimeMinutes} mins wait`
                                  )}
                                  {act.notes && !act.notes.includes('[Walk On]') ? ` • ${act.notes}` : ''}
                                </div>
                                <div style={{ fontSize: '11px', color: '#4A5568', fontWeight: '700', marginTop: '3px' }}>
                                  👥 {actRidersList.length > 0 ? actRidersList.join(', ') : 'Everyone'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <button
                                    disabled={idx === 0}
                                    onClick={() => handleReorderActivity(null, act.id, 'up')}
                                    style={{ background: '#E2E8F0', border: 'none', borderRadius: '4px', width: '22px', height: '18px', fontSize: '10px', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Move Up"
                                  >▲</button>
                                  <button
                                    disabled={idx === activeVisit.activities.length - 1}
                                    onClick={() => handleReorderActivity(null, act.id, 'down')}
                                    style={{ background: '#E2E8F0', border: 'none', borderRadius: '4px', width: '22px', height: '18px', fontSize: '10px', cursor: idx === activeVisit.activities.length - 1 ? 'default' : 'pointer', opacity: idx === activeVisit.activities.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Move Down"
                                  >▼</button>
                                </div>
                                <button onClick={() => startEditing(act, null)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px' }}>
                                  Edit
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => { setDepartingMembers(activePartyList); setShowCheckoutModal(true); }} style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #E53E3E, #C53030)', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Leave the Park & Save Day
                </button>
              </div>

              <LiveWaitTimesWidget parkName={activeVisit.parkName} />
            </>
          ) : (
            /* VISIT A PARK FORM */
            <form onSubmit={handleCheckIn} style={{ background: '#FFF', padding: '22px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ marginTop: 0, fontSize: '19px', fontWeight: '800', color: '#004487', marginBottom: '15px', textAlign: 'center' }}>Visit a Park</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>SELECT PARK</label>
                <select value={parkName} onChange={(e) => setParkName(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E0', background: '#F8FAFC', fontSize: '16px', fontWeight: '700', color: '#004487' }}>
                  <option value="Magic Kingdom">Magic Kingdom</option>
                  <option value="Epcot">Epcot</option>
                  <option value="Hollywood Studios">Hollywood Studios</option>
                  <option value="Animal Kingdom">Animal Kingdom</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>WHO'S ATTENDING?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {FIXED_FAMILY_MEMBERS.map((name) => {
                    const isSelected = selectedAttendees.includes(name);
                    return (
                      <button key={name} type="button" onClick={() => toggleCheckInAttendee(name)} style={{ padding: '10px 4px', borderRadius: '10px', border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0', background: isSelected ? '#004487' : '#FFF', color: isSelected ? '#FFF' : '#2D3748', fontSize: '13px', fontWeight: isSelected ? '800' : '500', cursor: 'pointer' }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%', padding: '14px', background: '#38A169', color: '#FFF',
                  border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold',
                  cursor: 'pointer', boxShadow: '0 2px 6px rgba(56,161,105,0.3)'
                }}
              >
                Here we go...🧚✨
              </button>
            </form>
          )}

          {/* GROUP STATS CARD */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>
              GROUP STATS {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
            </h3>

            {/* Group Visits Box + Side-by-Side Park Breakdown Grid */}
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#004487', lineHeight: '1' }}>
                  {totalDays}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '6px', lineHeight: '1.2' }}>
                  GROUP<br />VISITS
                </div>
              </div>

              <div style={{ width: '1px', alignSelf: 'stretch', borderLeft: '2px dotted #CBD5E0' }} />

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                {['Magic Kingdom', 'Epcot', 'Hollywood Studios', 'Animal Kingdom'].map((p) => (
                  <div key={p}>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#004487', lineHeight: '1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ParkIcon parkName={p} size={14} />
                      <span>{parkVisitsMap[p] || 0}</span>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A5568', marginTop: '3px', lineHeight: '1.1' }}>
                      {p}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2x3 Grid Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#38A169' }}>{totalActivities}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>ACTIVITIES</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#9F7AEA' }}>{formatMinutes(totalParkMinutes)}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARK</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#ED8936' }}>{formatMinutes(totalWaitMinutes)}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgActivitiesPerDay}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG ACTIVITIES</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{formatMinutes(avgParkMinutesPerDay)}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG VISIT</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 4px', borderRadius: '12px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#2D3748' }}>{avgWaitPerActivity}m</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>AVG WAIT</div>
              </div>
            </div>

            {/* Time Spent Pie Chart */}
            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', color: '#4A5568', marginBottom: '6px' }}>
                <span>ACTIVITIES LOGGED</span>
                <span style={{ color: '#004487' }}>{riddenUniqueCount} / {allPossibleAttractionsCount} ({totalUniquePercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${totalUniquePercent}%`, height: '100%', background: 'linear-gradient(to right, #0056b3, #D4AF37)', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>

            {/* Top Activity Card */}
            <div style={{ background: '#FFFDF5', padding: '12px 15px', borderRadius: '14px', border: '1px solid #FEEBC8', borderLeft: '5px solid #D4AF37', marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#C05621', marginBottom: '3px', letterSpacing: '0.5px' }}>⭐ TOP ACTIVITY</div>
              <div style={{ fontWeight: '800', color: '#1A202C', fontSize: '15px' }}>{topActivity.name}</div>
              <div style={{ color: '#4A5568', marginTop: '3px', fontSize: '12px' }}>
                Logged <strong>{topActivity.count}x</strong> | Avg Wait: <strong style={{ color: '#C05621' }}>{topActivity.avgWait || 0}m</strong>
              </div>
            </div>

            {/* Days of the Week Bar Chart */}
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '16px', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 10px 0', letterSpacing: '0.8px' }}>DAYS OF THE WEEK</h3>
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

            {/* Months Horizontal Bar Chart */}
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>MONTHS</h3>
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #EDF2F7', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MONTH_ORDER.map((mObj) => {
                  const mCount = monthVisitsMap[mObj.monthIndex] || 0;
                  const barWidthPercent = mCount > 0 ? Math.max(8, Math.round((mCount / maxMonthVisits) * 100)) : 0;

                  return (
                    <div key={mObj.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', fontSize: '11px', fontWeight: '800', color: '#4A5568', flexShrink: 0 }}>
                        {mObj.label}
                      </div>
                      <div style={{ flex: 1, height: '14px', background: '#E2E8F0', borderRadius: '7px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${barWidthPercent}%`,
                            height: '100%',
                            background: mCount > 0 ? 'linear-gradient(to right, #004487, #2B6CB0)' : 'transparent',
                            borderRadius: '7px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                      <div style={{ width: '20px', fontSize: '11px', fontWeight: '900', color: mCount > 0 ? '#004487' : '#A0AEC0', textAlign: 'right', flexShrink: 0 }}>
                        {mCount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Subtab: History */}
      {trackerSubTab === 'History' && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#004487', paddingLeft: '5px' }}>
            Past Visits ({filteredVisits.length})
          </h2>
          {loading ? (
            <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', margin: '20px 0' }}>Syncing with Supabase cloud...</p>
          ) : filteredVisits.length === 0 ? (
            <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', marginTop: '20px', fontStyle: 'italic' }}>No completed trips found for this view.</p>
          ) : (
            filteredVisits.map((v) => {
              const partyList = parseAttendees(v.attendees);

              return (
                <div key={v.id} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: '16px', marginBottom: '12px', background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDF2F7', paddingBottom: '8px', marginBottom: '10px' }}>
                    <strong style={{ color: '#004487', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ParkIcon parkName={v.parkName} size={18} />
                      <span>{v.parkName}</span>
                    </strong>
                    <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>📅 {formatDisplayDate(v.visitDate)}</span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#4A5568', marginBottom: '10px' }}>
                    👥 <strong>Party:</strong> {partyList.join(', ')} <br />
                    ⏱️ <strong>Hours:</strong> {format12Hour(v.startTime)} - {format12Hour(v.endTime)}
                  </div>

                  {v.activities.length > 0 && (
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {v.activities.map((a, idx) => {
                          const isEditingThis = editingActivityId === a.id && editingVisitId === v.id;
                          const actRidersList = parseAttendees(a.riders);
                          const editCoasterSongsHistory = getCoasterSongs(editRideName);

                          return isEditingThis ? (
                            <div key={a.id} style={{ background: '#FFF', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px', boxSizing: 'border-box', width: '100%' }}>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004487', marginBottom: '6px' }}>EDIT ENTRY</div>
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

                              {/* SONG SELECTOR FOR COASTERS (HISTORY) */}
                              {editCoasterSongsHistory && (
                                <div style={{ marginBottom: '8px', background: '#F3E8FF', padding: '8px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
                                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#6B21A8', display: 'block', marginBottom: '4px' }}>
                                    🎵 WHICH SONG DID YOU GET?
                                  </label>
                                  <select
                                    value={editCoasterSongsHistory.find(s => editNotes.includes(s)) || ''}
                                    onChange={(e) => {
                                      const chosen = e.target.value;
                                      let cleanNotes = editNotes;
                                      editCoasterSongsHistory.forEach(s => {
                                        cleanNotes = cleanNotes.replace(`🎵 Song: ${s}`, '').replace(`🎵 ${s}`, '').replace(s, '').trim();
                                      });
                                      if (chosen) {
                                        cleanNotes = cleanNotes ? `${cleanNotes} • 🎵 ${chosen}` : `🎵 ${chosen}`;
                                      }
                                      setEditNotes(cleanNotes);
                                    }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D8B4FE', fontSize: '12px', background: '#FFF', color: '#581C87', fontWeight: '700' }}
                                  >
                                    <option value="">-- Select Song --</option>
                                    {editCoasterSongsHistory.map(song => (
                                      <option key={song} value={song}>{song}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>WHO RODE THIS?</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {partyList.map((m) => {
                                    const checked = editRiders.includes(m);
                                    return (
                                      <button key={m} type="button" onClick={() => toggleEditRiderSelection(m)} style={{ padding: '4px 8px', borderRadius: '6px', border: checked ? '1px solid #004487' : '1px solid #CBD5E0', background: checked ? '#004487' : '#FFF', color: checked ? '#FFF' : '#4A5568', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {m}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                                  <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: '1 1 auto', minWidth: 0, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', boxSizing: 'border-box' }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditWaitTime('0');
                                      if (!editNotes.includes('[Walk On]')) {
                                        setEditNotes(`${editNotes} [Walk On]`.trim());
                                      }
                                    }}
                                    style={{ padding: '8px 10px', background: '#D69E2E', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                                  >
                                    ⚡ Walk On
                                  </button>
                                </div>
                                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', boxSizing: 'border-box' }} />
                              </div>

                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => deleteActivity(a.id)} style={{ background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                                <button onClick={cancelEditing} style={{ background: '#CBD5E0', color: '#2D3748', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={saveEditedActivity} style={{ background: '#38A169', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDF2F7' }}>
                              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1A202C' }}>{a.rideName}</div>
                                <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                  {a.isWalkOn || a.notes?.includes('[Walk On]') ? (
                                    <span style={{ color: '#D69E2E', fontWeight: '800' }}>⚡ Walk On (0m wait)</span>
                                  ) : (
                                    `⏱️ ${a.waitTimeMinutes} mins wait`
                                  )}
                                  {a.notes && !a.notes.includes('[Walk On]') ? ` • ${a.notes}` : ''}
                                </div>
                                <div style={{ fontSize: '11px', color: '#4A5568', fontWeight: '700', marginTop: '3px' }}>
                                  👥 {actRidersList.length > 0 ? actRidersList.join(', ') : 'Everyone'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <button
                                    disabled={idx === 0}
                                    onClick={() => handleReorderActivity(v.id, a.id, 'up')}
                                    style={{ background: '#E2E8F0', border: 'none', borderRadius: '4px', width: '22px', height: '18px', fontSize: '10px', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Move Up"
                                  >▲</button>
                                  <button
                                    disabled={idx === v.activities.length - 1}
                                    onClick={() => handleReorderActivity(v.id, a.id, 'down')}
                                    style={{ background: '#E2E8F0', border: 'none', borderRadius: '4px', width: '22px', height: '18px', fontSize: '10px', cursor: idx === v.activities.length - 1 ? 'default' : 'pointer', opacity: idx === v.activities.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Move Down"
                                  >▼</button>
                                </div>
                                <button onClick={() => startEditing(a, v.id)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px' }}>
                                  Edit
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #EDF2F7' }}>
                    <button onClick={() => openEditVisit(v)} style={{ background: '#EBF8FF', color: '#2B6CB0', border: '1px solid #BEE3F8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}>
                      ✏️ Edit Visit Hours
                    </button>
                    <button onClick={() => deleteVisit(v.id)} style={{ background: 'none', border: 'none', color: '#E53E3E', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: '700' }}>
                      🗑️ Delete Entire Visit Log
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Subtab: Parking */}
      {trackerSubTab === 'Parking' && (
        <ParkingSubtab />
      )}

      {/* ADD PERSON MODAL */}
      <AddPersonModal
        show={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        currentParty={activePartyList}
        onAddMembers={handleAddMembersToActiveVisit}
      />
    </div>
  );
};
