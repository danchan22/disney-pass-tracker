import React from 'react';
import { Visit, Activity, TrackerSubTab } from '../../lib/types';
import { FIXED_FAMILY_MEMBERS, PARK_EMOJIS, PARK_ATTRACTIONS, UNIVERSAL_ACTIVITIES } from '../../lib/constants';
import { formatDisplayDate, format12Hour, calculateVisitDuration, parseAttendees, getPersonEndTime, formatMinutes } from '../../lib/helpers';
import { ParkingSubtab } from './ParkingSubtab';

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
  handleEndQueueTimer: () => void;
  handleAddRideLive: () => void;
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
  selectedAttendee: string;
  totalDays: number;
  totalActivities: number;
  totalParkMinutes: number;
  totalWaitMinutes: number;
  topActivity: { name: string; count: number; totalWait?: number };
  avgActivitiesPerDay: string;
  avgParkMinutesPerDay: number;
  avgWaitPerActivity: number;
  filteredVisits: Visit[];
  loading: boolean;
  openEditVisit: (v: Visit) => void;
  deleteVisit: (id: string) => void;
}

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
  setQueueStartTimestamp,
  queueStartTimeStr,
  setQueueStartTimeStr,
  getElapsedQueueTimeString,
  rideTrivia,
  setRideTrivia,
  triviaLoading,
  hiddenMickey,
  setHiddenMickey,
  mickeyLoading,
  handleStartQueueTimer,
  handleEndQueueTimer,
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
}) => {
  return (
    <div>
      {/* Subtab: Today */}
      {trackerSubTab === 'Today' && (
        <div>
          {activeVisit ? (
            <div style={{ background: 'linear-gradient(135deg, #0056b3 0%, #003366 100%)', color: '#FFF', padding: '20px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 8px 24px rgba(0, 51, 102, 0.25)', border: '2px solid #D4AF37' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ background: '#D4AF37', color: '#003366', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
                  ✨ CURRENTLY AT
                </span>
              </div>

              <h2 style={{ margin: '0 0 8px 0', fontSize: '25px', fontWeight: '900', letterSpacing: '-0.3px', width: '100%' }}>
                {PARK_EMOJIS[activeVisit.parkName] || ''} {activeVisit.parkName}
              </h2>

              <div style={{ fontSize: '13px', color: '#E2E8F0', marginBottom: '8px', fontWeight: '600' }}>
                📅 {formatDisplayDate(activeVisit.visitDate)} &nbsp;•&nbsp; ⏰ Arrived: <strong>{format12Hour(activeVisit.startTime)}</strong>
              </div>

              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#F7FAFC' }}>
                👥 <strong>Active Party:</strong> {activePartyList.join(', ')}
              </p>

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
                      <input type="text" placeholder="Mickey, Cinderella, etc." value={characterName} onChange={(e) => setCharacterName(e.target.value)} disabled={!!queueStartTimestamp} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #FFCBD4', fontSize: '14px' }} />
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

                      {/* 🎵 POSSIBLE SONGS INFO BOX */}
                      {(() => {
                        const lower = rideName.toLowerCase();
                        const isMuppets = lower.includes('muppet') || lower.includes('rock') || lower.includes('roller');
                        const isGuardians = lower.includes('guardians') || lower.includes('cosmic');

                        if (!isMuppets && !isGuardians) return null;

                        const muppetsSongs = [
                          '"Song 2"',
                          '"Born to Be Wild" (featuring Camilla the Chicken)',
                          '"Love Rollercoaster"'
                        ];

                        const guardiansSongs = [
                          '“September” by Earth, Wind & Fire',
                          '“Disco Inferno” by The Trammps',
                          '“Everybody Wants to Rule the World” by Tears for Fears',
                          '“I Ran (So Far Away)” by A Flock of Seagulls',
                          '“One Way or Another” by Blondie',
                          '“Conga” by Gloria Estefan'
                        ];

                        const songs = isMuppets ? muppetsSongs : guardiansSongs;

                        return (
                          <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '10px', borderRadius: '10px', marginTop: '8px', textAlign: 'left', fontSize: '12px', color: '#581C87' }}>
                            <div style={{ fontWeight: '800', color: '#7E22CE', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🎵 Possible Songs:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
                              {songs.map((song, i) => (
                                <li key={i} style={{ marginBottom: i === songs.length - 1 ? 0 : '3px' }}>
                                  {song}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="button" onClick={() => { setQueueStartTimestamp(null); setQueueStartTimeStr(null); setRideTrivia(null); setHiddenMickey(null); }} style={{ flex: 1, padding: '10px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
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
                        ⏱️ Start Line Timer
                      </button>

                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold', marginBottom: '12px', position: 'relative' }}>
                        <span style={{ background: '#FFF', padding: '0 10px', position: 'relative', zIndex: 2 }}>OR LOG MANUALLY</span>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#E2E8F0', zIndex: 1 }}></div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" placeholder="Enter wait time (mins)" value={waitTime} onChange={(e) => setWaitTime(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }} />
                        <button type="button" onClick={handleAddRideLive} style={{ padding: '11px 22px', background: '#EDF2F7', color: '#2D3748', border: '1px solid #CBD5E0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                          Log
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
                        const actRidersList = parseAttendees(act.riders);

                        return isEditingThis ? (
                          <div key={act.id} style={{ background: '#F7FAFC', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px' }}>
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
                            
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                              <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                              <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
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
                              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.rideName}</div>
                              <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                ⏱️ {act.waitTimeMinutes} mins wait {actRidersList.length > 0 ? `• 👥 ${actRidersList.join(', ')}` : ''} {act.notes ? `• ${act.notes}` : ''}
                              </div>
                            </div>
                            <button onClick={() => startEditing(act, null)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px', flexShrink: 0 }}>
                              Edit
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => { setDepartingMembers(activePartyList); setShowCheckoutModal(true); }} style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #E53E3E, #C53030)', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                👋 Leave the Park & Save Day
              </button>
            </div>
          ) : (
            /* VISIT A PARK FORM */
            <form onSubmit={handleCheckIn} style={{ background: '#FFF', padding: '22px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ marginTop: 0, fontSize: '19px', fontWeight: '800', color: '#004487', marginBottom: '15px', textAlign: 'center' }}>Visit a Park</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>SELECT PARK</label>
                <select value={parkName} onChange={(e) => setParkName(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E0', background: '#F8FAFC', fontSize: '16px', fontWeight: '700', color: '#004487' }}>
                  <option value="Magic Kingdom">🏰 Magic Kingdom</option>
                  <option value="Epcot">🪩 Epcot</option>
                  <option value="Hollywood Studios">🎥 Hollywood Studios</option>
                  <option value="Animal Kingdom">🌳 Animal Kingdom</option>
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

          {/* TOTALS WIDGET */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>
              TOTALS {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
            </h3>
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
                Logged <strong>{topActivity.count}x</strong> | Total Wait: <strong style={{ color: '#C05621' }}>{formatMinutes(topActivity.totalWait || 0)}</strong>
              </div>
            </div>

            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 10px 0', letterSpacing: '0.8px' }}>AVERAGES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{avgActivitiesPerDay}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>Activities</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{formatMinutes(avgParkMinutesPerDay)}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>Duration</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{avgWaitPerActivity}m</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>Wait Time</div>
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
              const departureGroups: Record<string, string[]> = {};
              partyList.forEach(m => {
                const pTime = getPersonEndTime(v, m);
                if (!departureGroups[pTime]) departureGroups[pTime] = [];
                departureGroups[pTime].push(m);
              });

              const uniqueDepTimes = Object.keys(departureGroups);
              const hasStaggeredCheckout = uniqueDepTimes.length > 1;

              return (
                <div key={v.id} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: '16px', marginBottom: '12px', background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EDF2F7', paddingBottom: '8px', marginBottom: '10px' }}>
                    <strong style={{ color: '#004487', fontSize: '16px', fontWeight: '800' }}>
                      {PARK_EMOJIS[v.parkName] || ''} {v.parkName}
                    </strong>
                    <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>📅 {formatDisplayDate(v.visitDate)}</span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#4A5568', marginBottom: '10px' }}>
                    👥 <strong>Party:</strong> {partyList.join(', ')} <br />
                    
                    {!hasStaggeredCheckout ? (
                      <div style={{ marginTop: '2px' }}>
                        ⏱️ <strong>Hours:</strong> {format12Hour(v.startTime)} - {format12Hour(v.endTime)} <span style={{ color: '#2B6CB0', fontWeight: 'bold' }}>{calculateVisitDuration(v.startTime, v.endTime)}</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: '6px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#004487', marginBottom: '4px' }}>⏱️ HOURS:</div>
                        {uniqueDepTimes.map(depTime => (
                          <div key={depTime} style={{ fontSize: '12px', color: '#2D3748', marginTop: '2px' }}>
                            • <strong>{departureGroups[depTime].join(', ')}:</strong> {format12Hour(v.startTime)} - {format12Hour(depTime)} <span style={{ color: '#2B6CB0', fontWeight: '600' }}>{calculateVisitDuration(v.startTime, depTime)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {v.activities.length > 0 && (
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {v.activities.map((a) => {
                          const isEditingThis = editingActivityId === a.id && editingVisitId === v.id;
                          const actRidersList = parseAttendees(a.riders);

                          return isEditingThis ? (
                            <div key={a.id} style={{ background: '#FFF', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px' }}>
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
                              
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                              </div>

                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => deleteActivity(a.id)} style={{ background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                                <button onClick={cancelEditing} style={{ background: '#CBD5E0', color: '#2D3748', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={saveEditedActivity} style={{ background: '#38A169', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.rideName}</div>
                                <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                  ⏱️ {a.waitTimeMinutes} mins wait {actRidersList.length > 0 ? `• 👥 ${actRidersList.join(', ')}` : ''} {a.notes ? `• ${a.notes}` : ''}
                                </div>
                              </div>
                              <button onClick={() => startEditing(a, v.id)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px', flexShrink: 0 }}>
                                Edit
                              </button>
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
    </div>
  );
};
