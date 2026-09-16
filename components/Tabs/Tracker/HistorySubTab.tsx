'use client';

import React from 'react';
import { Visit, Activity } from '../../../lib/types';
import { PARK_ATTRACTIONS, UNIVERSAL_ACTIVITIES } from '../../../lib/constants';
import { formatDisplayDate, format12Hour, parseAttendees } from '../../../lib/helpers';
import { ParkIcon } from '../../Shared/ParkIcon';

interface HistorySubTabProps {
  filteredVisits: Visit[];
  loading: boolean;
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
  openEditVisit: (v: Visit) => void;
  deleteVisit: (id: string) => void;
  handleReorderActivity: (visitId: string | null, activityId: string, direction: 'up' | 'down') => void;
}

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

export const HistorySubTab: React.FC<HistorySubTabProps> = ({
  filteredVisits,
  loading,
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
  openEditVisit,
  deleteVisit,
  handleReorderActivity,
}) => {
  return (
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

                          {editCoasterSongsHistory && (
                            <div style={{ marginBottom: '8px', background: '#F3E8FF', padding: '8px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
                              <label style={{ fontSize: '10px', fontWeight: '800', color: '#6B21A8', display: 'block', marginBottom: '4px' }}>🎵 WHICH SONG DID YOU GET?</label>
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
                              {a.notes && (
                                (() => {
                                  const displayNotes = a.notes.replace(/\[Walk On\]\s*•?\s*/g, '').trim();
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
  );
};
