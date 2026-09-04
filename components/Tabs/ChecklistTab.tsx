'use client';

import React, { useState } from 'react';
import { Visit, Activity } from '../../lib/types';
import { PARK_NAMES, PARK_ATTRACTIONS } from '../../lib/constants';
import { ParkIcon } from '../Shared/ParkIcon';
import { parseAttendees } from '../../lib/helpers';

interface ChecklistTabProps {
  rideCountsMap: Record<string, number>;
  visits?: Visit[];
  activeVisit?: Visit | null;
  selectedAttendee?: string;
}

const PARK_BANNERS: Record<string, string> = {
  'Magic Kingdom': '/park-magic-kingdom.png',
  'Epcot': '/park-epcot.png',
  'Hollywood Studios': '/park-hollywood-studios.png',
  'Animal Kingdom': '/park-animal-kingdom.png'
};

// Coaster Playlist Definitions
const COASTER_SONGS: Record<string, string[]> = {
  'Guardians of the Galaxy: Cosmic Rewind': [
    '"September" by Earth, Wind & Fire',
    '"Disco Inferno" by The Trammps',
    '"Everybody Wants to Rule the World" by Tears for Fears',
    '"I Ran (So Far Away)" by A Flock of Seagulls',
    '"One Way or Another" by Blondie',
    '"Conga" by Gloria Estefan',
  ],
  'Rock \'n\' Roller Coaster': [
    '"Song 2"',
    '"Born To Be Wild"',
    '"Love Rollercoaster"',
    '"Rock! Rock! (Till You Drop)"',
    '"Walking on Sunshine"',
  ],
};

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getCoasterSongsForAttraction = (attraction: string): string[] | null => {
  const cleanAttraction = cleanStr(attraction);
  if (!cleanAttraction) return null;

  for (const [key, songs] of Object.entries(COASTER_SONGS)) {
    const cleanKey = cleanStr(key);
    if (cleanAttraction.includes(cleanKey) || cleanKey.includes(cleanAttraction)) {
      return songs;
    }
  }
  return null;
};

export const ChecklistTab: React.FC<ChecklistTabProps> = ({ 
  rideCountsMap, 
  visits = [], 
  activeVisit = null,
  selectedAttendee = 'ALL' 
}) => {
  const [selectedPark, setSelectedPark] = useState<string>('ALL');
// Helper to check if a specific attendee rode this activity
const isAttendeeRider = (act: Activity, visitAttendees: string[] | string | undefined) => {
  if (selectedAttendee === 'ALL') return true;
  const ridersList = parseAttendees(act.riders);
  if (ridersList.length > 0) {
    return ridersList.includes(selectedAttendee);
  }
  const allParty = parseAttendees(visitAttendees || []);
  return allParty.includes(selectedAttendee);
};

  // Calculate song tally map based on selected park, selected attendee, and active/past visits
  const songCountsMap: Record<string, number> = {};

  const processVisitForSongs = (v: Visit) => {
    if (selectedPark !== 'ALL' && v.parkName !== selectedPark) return;

    v.activities.forEach(act => {
if (act.notes && isAttendeeRider(act, v.attendees || [])) {
        const cleanNote = cleanStr(act.notes);
        Object.values(COASTER_SONGS).flat().forEach(song => {
          const cleanSong = cleanStr(song);
          if (cleanNote.includes(cleanSong)) {
            songCountsMap[song] = (songCountsMap[song] || 0) + 1;
          }
        });
      }
    });
  };

  // Process completed past visits
  visits.forEach(processVisitForSongs);

  // Process currently active visit if one exists
  if (activeVisit) {
    processVisitForSongs(activeVisit);
  }

  const parkEntries = Object.entries(PARK_ATTRACTIONS).filter(([park]) => {
    if (selectedPark === 'ALL') return true;
    return park === selectedPark;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 2x2 PARK FILTER GRID */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: '900', color: '#718096', marginBottom: '6px', letterSpacing: '0.8px' }}>
          PARK
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {PARK_NAMES.map(park => {
            const isSel = selectedPark === park;
            return (
              <button
                key={park}
                type="button"
                onClick={() => setSelectedPark(prev => prev === park ? 'ALL' : park)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '8px',
                  padding: '10px 8px',
                  borderRadius: '14px',
                  border: isSel ? '2px solid #004487' : '1px solid #E2E8F0',
                  background: isSel ? '#EBF8FF' : '#FFF',
                  color: isSel ? '#004487' : '#2D3748',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease'
                }}
              >
                <ParkIcon parkName={park} size={18} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{park}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PARK CARDS */}
      {parkEntries.map(([park, attractions]) => {
        const sortedAttractions = [...attractions].sort((a, b) => a.localeCompare(b));
        const totalInPark = sortedAttractions.length;
        const completedCount = sortedAttractions.filter(att => (rideCountsMap[att] || 0) > 0).length;
        const percentage = totalInPark > 0 ? Math.round((completedCount / totalInPark) * 100) : 0;

        return (
          <div key={park} style={{ background: '#FFF', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            
            {/* Park Banner Header */}
            {PARK_BANNERS[park] && (
              <img src={PARK_BANNERS[park]} alt={park} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
            )}

            <div style={{ padding: '18px' }}>
              <div style={{ marginBottom: '14px', borderBottom: '2px solid #F2F2F7', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ParkIcon parkName={park} size={22} />
                    <span>{park}</span>
                  </h2>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#D4AF37', background: '#FFFDF5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #FEEBC8' }}>
                    {completedCount}/{totalInPark} ({percentage}%)
                  </span>
                </div>

                <div style={{ width: '100%', height: '8px', background: '#EDF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: percentage === 100 ? '#38A169' : 'linear-gradient(90deg, #0066cc, #D4AF37)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>

              {/* ATTRACTIONS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sortedAttractions.map((attraction) => {
                  const count = rideCountsMap[attraction] || 0;
                  const isCompleted = count > 0;
                  const coasterSongs = getCoasterSongsForAttraction(attraction);

                  return (
                    <React.Fragment key={attraction}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: isCompleted ? '#F0FFF4' : '#F8FAFC', border: isCompleted ? '1px solid #C6F6D5' : '1px solid #EDF2F7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingRight: '8px' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0 }}>
                            {isCompleted ? '✅' : '⚪'}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: isCompleted ? '700' : '500', color: isCompleted ? '#22543D' : '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attraction}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: isCompleted ? '#276749' : '#A0AEC0', flexShrink: 0 }}>
                          {isCompleted ? `(${count})` : '0'}
                        </div>
                      </div>

                      {/* INDENTED COASTER SONG SUB-CHECKS */}
                      {coasterSongs && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px', marginTop: '2px', marginBottom: '4px' }}>
                          {coasterSongs.map(song => {
                            const songCount = songCountsMap[song] || 0;
                            const hasGottenSong = songCount > 0;

                            return (
                              <div
                                key={song}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  background: hasGottenSong ? '#F3E8FF' : '#FAF5FF',
                                  border: hasGottenSong ? '1px solid #E9D5FF' : '1px dashed #E9D5FF'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, paddingRight: '6px' }}>
                                  <span style={{ fontSize: '11px', flexShrink: 0 }}>
                                    {hasGottenSong ? '🎵' : '⚪'}
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: hasGottenSong ? '700' : '500', color: hasGottenSong ? '#581C87' : '#7E22CE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {song}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: hasGottenSong ? '#6B21A8' : '#A855F7', flexShrink: 0 }}>
                                  {hasGottenSong ? `(${songCount})` : '0'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};
