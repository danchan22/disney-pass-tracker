'use client';

import React, { useState, useEffect } from 'react';
import { Visit, Activity } from '../../../lib/types';
import { FIXED_FAMILY_MEMBERS, PARK_ATTRACTIONS, UNIVERSAL_ACTIVITIES, PARK_NAMES } from '../../../lib/constants';
import { format12Hour, parseAttendees, formatMinutes, parseTimeToMinutes } from '../../../lib/helpers';
import { LiveWaitTimesWidget } from '../../Shared/LiveWaitTimes/LiveWaitTimesWidget';
import { ParkIcon } from '../../Shared/ParkIcon';
import { AddPersonModal } from '../../Modals/AddPersonModal';
import { GroupStatsCard } from './GroupStatsCard';

interface TodaySubTabProps {
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
  queueStartTimeStr: string | null;
  getElapsedQueueTimeString: () => string;
  rideTrivia: string | null;
  triviaLoading: boolean;
  hiddenMickey: string | null;
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
  avgActivitiesPerDay: string;
  avgParkMinutesPerDay: number;
  avgWaitPerActivity: number;
  filteredVisits: Visit[];
  handleReorderActivity: (visitId: string | null, activityId: string, direction: 'up' | 'down') => void;
}

const PARK_BANNERS: Record<string, string> = {
  'Magic Kingdom': '/park-magic-kingdom.png',
  'Epcot': '/park-epcot.png',
  'Hollywood Studios': '/park-hollywood-studios.png',
  'Animal Kingdom': '/park-animal-kingdom.png'
};

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

const SMUGGLERS_ROLES = ['Pilot', 'Gunner', 'Engineer'] as const;

const isSmugglersRun = (name: string): boolean => {
  const clean = cleanStr(name);
  return clean.includes('smugglersrun') || clean.includes('millenniumfalcon');
};

const isShooterRide = (name: string): boolean => {
  const clean = cleanStr(name);
  return clean.includes('toystorymania') || clean.includes('buzzlightyear');
};

export const TodaySubTab: React.FC<TodaySubTabProps> = ({
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
  avgActivitiesPerDay,
  avgParkMinutesPerDay,
  avgWaitPerActivity,
  filteredVisits,
  handleReorderActivity,
}) => {
  const [showAddPersonModal, setShowAddPersonModal] = useState<boolean>(false);
  const [isLogExpanded, setIsLogExpanded] = useState<boolean>(true);
  const [elapsedParkTime, setElapsedParkTime] = useState<string>('');

  const activeCoasterSongs = getCoasterSongs(rideName);

  // REAL-TIME PARK DURATION TIMER
  useEffect(() => {
    if (!activeVisit?.startTime) return;

    const updateDuration = () => {
      const startMins = parseTimeToMinutes(activeVisit.startTime);
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      let diff = currentMins - startMins;
      if (diff < 0) diff += 1440;
      setElapsedParkTime(formatMinutes(diff));
    };

    updateDuration();
    const timer = setInterval(updateDuration, 30000); // Updates automatically every 30 seconds

    return () => clearInterval(timer);
  }, [activeVisit?.startTime]);

  return (
    <div>
      {/* DISNEY GATEWAY BUTTON ANIMATIONS */}
      <style>{`
        @keyframes disneyGlowPulse {
          0% {
            box-shadow: 0 4px 14px rgba(56, 161, 105, 0.4), 0 0 0 0 rgba(212, 175, 55, 0.3);
          }
          50% {
            box-shadow: 0 6px 20px rgba(56, 161, 105, 0.5), 0 0 14px 3px rgba(212, 175, 55, 0.5);
          }
          100% {
            box-shadow: 0 4px 14px rgba(56, 161, 105, 0.4), 0 0 0 0 rgba(212, 175, 55, 0.3);
          }
        }
        @keyframes subtleGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .disney-gateway-btn {
          width: 100%;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 14px;
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
          cursor: pointer;
          background: linear-gradient(135deg, #276749 0%, #38A169 50%, #2F855A 100%);
          background-size: 200% 200%;
          animation: disneyGlowPulse 3.5s infinite ease-in-out, subtleGradientShift 6s ease infinite;
          transition: transform 0.15s ease, filter 0.15s ease;
          letter-spacing: 0.3px;
        }
        .disney-gateway-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }
        .disney-gateway-btn:active {
          transform: translateY(1px);
        }
      `}</style>

      {activeVisit ? (
        <>
          <div style={{ background: 'linear-gradient(135deg, #0056b3 0%, #003366 100%)', color: '#FFF', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 8px 24px rgba(0, 51, 102, 0.25)', border: '2px solid #D4AF37', overflow: 'hidden' }}>
            {PARK_BANNERS[activeVisit.parkName] && (
              <img
                src={PARK_BANNERS[activeVisit.parkName]}
                alt={activeVisit.parkName}
                style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block', borderBottom: '2px solid #D4AF37' }}
              />
            )}

            <div style={{ padding: '20px' }}>
              {/* ARRIVED AT PILL + REAL-TIME ELAPSED PARK TIME */}
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'transparent', color: '#FFFFFF', border: '1px solid #FFFFFF', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', letterSpacing: '0.3px' }}>
                  Arrived at: {format12Hour(activeVisit.startTime)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#D4AF37' }}>
                  Here for {elapsedParkTime}
                </span>
              </div>

              {/* PARK NAME HEADER */}
              <h2 style={{ margin: '0 0 12px 0', fontSize: '25px', fontWeight: '900', letterSpacing: '-0.3px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ParkIcon parkName={activeVisit.parkName} size={28} />
                <span>{activeVisit.parkName}</span>
              </h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#F7FAFC' }}>
                  <strong>Active Party:</strong> {activePartyList.join(', ')}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPersonModal(true)}
                  style={{ background: 'none', color: '#FFFFFF', border: 'none', padding: 0, fontSize: '13px', fontWeight: '800', cursor: 'pointer', flexShrink: 0, textDecoration: 'underline' }}
                >
                  + Add Someone
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
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '6px' }}>👥 WHO IS RIDING THIS?</label>
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

                      {(triviaLoading || rideTrivia) && (
                        <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', padding: '10px', borderRadius: '10px', marginTop: '10px', textAlign: 'left', fontSize: '12px', color: '#22543D' }}>
                          <div style={{ fontWeight: '800', color: '#276749', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>✨ Disney Fun Fact:</div>
                          {triviaLoading ? <div style={{ fontStyle: 'italic', color: '#718096' }}>Searching Disney vault...</div> : <div>{rideTrivia}</div>}
                        </div>
                      )}

                      {(mickeyLoading || hiddenMickey) && (
                        <div style={{ background: '#F0F5FF', border: '1px solid #C3DAFE', padding: '10px', borderRadius: '10px', marginTop: '8px', textAlign: 'left', fontSize: '12px', color: '#1A365D' }}>
                          <div style={{ fontWeight: '800', color: '#2B6CB0', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>👀 Hidden Mickeys:</div>
                          {mickeyLoading ? <div style={{ fontStyle: 'italic', color: '#718096' }}>Scanning queue for Hidden Mickeys...</div> : <div>{hiddenMickey}</div>}
                        </div>
                      )}

                      {activeCoasterSongs && (
                        <div style={{ background: '#F3E8FF', border: '1px solid #E9D5FF', padding: '10px 12px', borderRadius: '10px', marginTop: '8px', textAlign: 'left', fontSize: '12px', color: '#581C87' }}>
                          <div style={{ fontWeight: '800', color: '#6B21A8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>🎵 Possible Songs:</div>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', lineHeight: '1.5' }}>
                            {activeCoasterSongs.map(song => <li key={song}>{song}</li>)}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '6px', marginTop: '12px' }}>
                        <button type="button" onClick={handleCancelQueueTimer} style={{ padding: '10px 4px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                        <button type="button" onClick={() => handleEndQueueTimer(true)} style={{ padding: '10px 4px', background: '#D69E2E', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(214,158,46,0.3)' }}>Walk On</button>
                        <button type="button" onClick={() => handleEndQueueTimer(false)} style={{ padding: '10px 4px', background: '#38A169', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(56,161,105,0.2)' }}>On Ride Now</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: '10px', marginTop: '5px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <button type="button" onClick={handleStartQueueTimer} style={{ padding: '12px', background: '#004487', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>⏱️ Start Line Timer</button>
                        <button type="button" onClick={() => handleAddRideLive(true)} style={{ padding: '12px', background: '#D69E2E', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(214,158,46,0.3)' }}>Walk On</button>
                      </div>

                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold', marginBottom: '12px', position: 'relative' }}>
                        <span style={{ background: '#FFF', padding: '0 10px', position: 'relative', zIndex: 2 }}>OR LOG MANUALLY</span>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#E2E8F0', zIndex: 1 }}></div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" placeholder="Enter wait time (mins)" value={waitTime} onChange={(e) => setWaitTime(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px', boxSizing: 'border-box' }} />
                        <button type="button" onClick={() => handleAddRideLive(false)} style={{ padding: '11px 22px', background: '#EDF2F7', color: '#2D3748', border: '1px solid #CBD5E0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Log</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* COLLAPSIBLE TODAY'S LOG LIST */}
                {activeVisit.activities.length > 0 && (
                  <div style={{ marginTop: '15px', borderTop: '2px dashed #E2E8F0', paddingTop: '12px' }}>
                    <div 
                      onClick={() => setIsLogExpanded(!isLogExpanded)} 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <strong style={{ fontSize: '11px', color: '#718096' }}>
                        TODAY'S LOG ({activeVisit.activities.length})
                      </strong>
                      <span style={{ fontSize: '12px', color: '#004487', fontWeight: '800' }}>
                        {isLogExpanded ? '▲ Hide' : '▼ Expand'}
                      </span>
                    </div>

                    {isLogExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
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

                              {editCoasterSongs && (
                                <div style={{ marginBottom: '8px', background: '#F3E8FF', padding: '8px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
                                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#6B21A8', display: 'block', marginBottom: '4px' }}>🎵 WHICH SONG DID YOU GET?</label>
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
                                    {editCoasterSongs.map(song => <option key={song} value={song}>{song}</option>)}
                                  </select>
                                </div>
                              )}

                              {isSmugglersRun(editRideName) && (
                                <div style={{ marginBottom: '8px', background: '#EBF8FF', padding: '8px', borderRadius: '8px', border: '1px solid #BEE3F8' }}>
                                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#2B6CB0', display: 'block', marginBottom: '6px' }}>🚀 SELECT ROLES PER RIDER:</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {editRiders.map(rider => {
                                      const currentRole = editNotes.match(new RegExp(`${rider}:\\s*(Pilot|Gunner|Engineer)`))?.[1] || '';
                                      return (
                                        <div key={rider} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E0' }}>
                                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#2D3748' }}>{rider}</span>
                                          <div style={{ display: 'flex', gap: '4px' }}>
                                            {SMUGGLERS_ROLES.map(role => {
                                              const isSelected = currentRole === role;
                                              return (
                                                <button
                                                  key={role}
                                                  type="button"
                                                  onClick={() => {
                                                    let updatedNotes = editNotes;
                                                    SMUGGLERS_ROLES.forEach(r => {
                                                      updatedNotes = updatedNotes.replace(new RegExp(`\\s*•?\\s*🚀\\s*${rider}:\\s*${r}`), '').trim();
                                                    });
                                                    if (!isSelected) {
                                                      updatedNotes = updatedNotes ? `${updatedNotes} • 🚀 ${rider}: ${role}` : `🚀 ${rider}: ${role}`;
                                                    }
                                                    setEditNotes(updatedNotes);
                                                  }}
                                                  style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    border: isSelected ? '1px solid #004487' : '1px solid #E2E8F0',
                                                    background: isSelected ? '#004487' : '#F7FAFC',
                                                    color: isSelected ? '#FFF' : '#4A5568',
                                                    fontSize: '10px',
                                                    fontWeight: '800',
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  {role}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {isShooterRide(editRideName) && (
                                <div style={{ marginBottom: '8px', background: '#FFF5F7', padding: '8px', borderRadius: '8px', border: '1px solid #FED7E2' }}>
                                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#9B2C2C', display: 'block', marginBottom: '6px' }}>🎯 ENTER SCORES PER RIDER:</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {editRiders.map(rider => {
                                      const currentScore = editNotes.match(new RegExp(`${rider}:\\s*(\\d+)`))?.[1] || '';
                                      return (
                                        <div key={rider} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E0' }}>
                                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#2D3748' }}>{rider}</span>
                                          <input
                                            type="number"
                                            placeholder="Score"
                                            value={currentScore}
                                            onChange={(e) => {
                                              const newScore = e.target.value;
                                              let updatedNotes = editNotes.replace(new RegExp(`\\s*•?\\s*🎯\\s*${rider}:\\s*\\d+`), '').trim();
                                              if (newScore) {
                                                updatedNotes = updatedNotes ? `${updatedNotes} • 🎯 ${rider}: ${newScore}` : `🎯 ${rider}: ${newScore}`;
                                              }
                                              setEditNotes(updatedNotes);
                                            }}
                                            style={{ width: '90px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #CBD5E0', fontSize: '12px', fontWeight: '700', textAlign: 'right' }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
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
                                  {act.notes && (
                                    (() => {
                                      const displayNotes = act.notes.replace(/\[Walk On\]\s*•?\s*/g, '').trim();
                                      return displayNotes ? ` • ${displayNotes}` : '';
                                    })()
                                  )}
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
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setDepartingMembers(activePartyList); setShowCheckoutModal(true); }}
                style={{ width: '100%', padding: '14px', background: 'transparent', color: '#FFFFFF', border: '2px solid #E53E3E', borderRadius: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                Leave the Park & Save Day
              </button>
            </div>
          </div>

          <LiveWaitTimesWidget parkName={activeVisit.parkName} />
        </>
      ) : (
        /* VISIT A PARK FORM */
        <form onSubmit={handleCheckIn} style={{ background: '#FFF', padding: '22px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
          <h2 style={{ marginTop: 0, fontSize: '19px', fontWeight: '800', color: '#004487', marginBottom: '15px', textAlign: 'center' }}>Visit a Park</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '8px' }}>PARK</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PARK_NAMES.map(p => {
                const isSel = parkName === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setParkName(p as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 8px',
                      borderRadius: '14px',
                      border: isSel ? '2px solid #004487' : '1px solid #E2E8F0',
                      background: isSel ? '#EBF8FF' : '#FFF',
                      color: isSel ? '#004487' : '#2D3748',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ParkIcon parkName={p} size={18} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '8px' }}>WHO'S ATTENDING?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {FIXED_FAMILY_MEMBERS.map((name) => {
                const isSelected = selectedAttendees.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleCheckInAttendee(name)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                      background: isSelected ? '#EBF8FF' : '#FFF',
                      color: isSelected ? '#004487' : '#2D3748',
                      fontSize: '13px',
                      fontWeight: isSelected ? '800' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DISNEY GATEWAY BUTTON WITH MAGICAL AMBIENT PULSE */}
          <button type="submit" className="disney-gateway-btn">
            Here we go...🧚✨
          </button>
        </form>
      )}

      {/* GROUP STATS CARD */}
      <GroupStatsCard
        selectedAttendee={selectedAttendee}
        totalDays={totalDays}
        totalActivities={totalActivities}
        totalParkMinutes={totalParkMinutes}
        totalWaitMinutes={totalWaitMinutes}
        avgActivitiesPerDay={avgActivitiesPerDay}
        avgParkMinutesPerDay={avgParkMinutesPerDay}
        avgWaitPerActivity={avgWaitPerActivity}
        filteredVisits={filteredVisits}
      />

      <AddPersonModal
        show={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        currentParty={activePartyList}
        onAddMembers={handleAddMembersToActiveVisit}
      />
    </div>
  );
};
