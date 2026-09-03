'use client';

import React, { useState, useEffect } from 'react';
import { ParkingLog } from '../../lib/types';
import { FIXED_FAMILY_MEMBERS, PARK_NAMES, PARKING_OPTIONS, ParkingSpotDetail } from '../../lib/constants';
import { getSupabase } from '../../lib/supabase';
import { get6AMCutoffISO } from '../../lib/helpers';
import { ParkIcon } from '../Shared/ParkIcon';

export const ParkingSubtab: React.FC = () => {
  const [parkingAttendees, setParkingAttendees] = useState<string[]>([]);
  const [selectedPark, setSelectedPark] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [selectedSection, setSelectedSection] = useState<string>('Heroes');
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpotDetail>(PARKING_OPTIONS['Magic Kingdom'][0].spots[0]);
  const [rowNumber, setRowNumber] = useState<string>('');

  const [parkingLogs, setParkingLogs] = useState<ParkingLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const parkData = PARKING_OPTIONS[selectedPark];
    if (parkData && parkData.length > 0) {
      setSelectedSection(parkData[0].section || '');
      setSelectedSpot(parkData[0].spots[0]);
    }
  }, [selectedPark]);

  useEffect(() => {
    fetchTodayParking();
  }, []);

  const fetchTodayParking = async () => {
    setLoading(true);
    try {
      const supabase = await getSupabase();
      const cutoff = get6AMCutoffISO();

      const { data, error } = await supabase
        .from('parking_logs')
        .select('*')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setParkingLogs(data as ParkingLog[]);
    } catch (err) {
      console.warn('Could not fetch parking logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendee = (name: string) => {
    if (parkingAttendees.includes(name)) {
      setParkingAttendees(parkingAttendees.filter(a => a !== name));
    } else {
      setParkingAttendees([...parkingAttendees, name]);
    }
  };

  const handleSaveParking = async () => {
    if (parkingAttendees.length === 0) {
      alert("Please select who is parking.");
      return;
    }

    if (!rowNumber.trim()) {
      alert('Please enter a row number.');
      return;
    }

    setSaving(true);
    const parkedByStr = parkingAttendees.join(', ');

    try {
      const supabase = await getSupabase();
      const { error } = await supabase.from('parking_logs').insert({
        park_name: selectedPark,
        section_name: selectedSection,
        spot_name: selectedSpot.name,
        row_number: rowNumber.trim(),
        parked_by: parkedByStr,
      });

      if (error) throw error;

      setRowNumber('');
      setParkingAttendees([]);
      await fetchTodayParking();
    } catch (err: any) {
      alert('Error saving parking spot: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const findSpotConfig = (parkName: string, spotName: string): ParkingSpotDetail => {
    const parkGroups = PARKING_OPTIONS[parkName] || [];
    for (const group of parkGroups) {
      const match = group.spots.find(s => s.name === spotName);
      if (match) return match;
    }
    return { name: spotName, image: '', bgColor: '#004487' };
  };

  const currentParkOptions = PARKING_OPTIONS[selectedPark] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#FFF', padding: '18px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '900', color: '#004487', marginBottom: '14px' }}>
          🚗 Log Your Parking
        </h2>

        {/* WHO'S PARKING */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
            WHO'S PARKING?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {FIXED_FAMILY_MEMBERS.map(name => {
              const isSelected = parkingAttendees.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleAttendee(name)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                    background: isSelected ? '#004487' : '#F8FAFC',
                    color: isSelected ? '#FFF' : '#2D3748',
                    fontSize: '13px',
                    fontWeight: isSelected ? '800' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? `✓ ${name}` : name}
                </button>
              );
            })}
          </div>
        </div>

        {/* WHICH PARK */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
            WHICH PARK?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {PARK_NAMES.map(p => {
              const isSelected = selectedPark === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPark(p as any)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                    background: isSelected ? '#004487' : '#FFF',
                    color: isSelected ? '#FFF' : '#4A5568',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ParkIcon parkName={p} size={16} variant={isSelected ? 'line' : 'color'} />
                  <span>{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DYNAMIC SECTIONS & SPOTS */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
            SELECT SECTION / LOT
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentParkOptions.map((group, gIdx) => (
              <div key={gIdx} style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                {group.section && (
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#004487', marginBottom: '6px' }}>
                    {group.section}
                  </div>
                )}
                {/* 2-column full-width grid for Epcot and other sections */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedPark === 'Epcot' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '6px' }}>
                  {group.spots.map(spot => {
                    const isSelected = selectedSpot.name === spot.name;
                    return (
                      <button
                        key={spot.name}
                        type="button"
                        onClick={() => {
                          setSelectedSpot(spot);
                          if (group.section) setSelectedSection(group.section);
                        }}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          border: isSelected ? '2px solid #D4AF37' : '1px solid #CBD5E0',
                          background: isSelected ? '#FFFDF5' : '#FFF',
                          color: isSelected ? '#C05621' : '#4A5568',
                          cursor: 'pointer',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        {spot.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW NUMBER */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
            ROW NUMBER
          </label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 315"
            value={rowNumber}
            onChange={e => setRowNumber(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '15px', fontWeight: 'bold', boxSizing: 'border-box' }}
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          type="button"
          onClick={handleSaveParking}
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px',
            background: '#38A169',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(56,161,105,0.3)',
          }}
        >
          {saving ? 'Saving...' : '💾 Save My Spot'}
        </button>
      </div>

      {/* TODAY'S PARKING SPOTS DISPLAY */}
      <div>
        <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', marginBottom: '10px', letterSpacing: '0.8px' }}>
          TODAY'S PARKING SPOTS ({parkingLogs.length})
        </h3>

        {loading ? (
          <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '13px', fontStyle: 'italic' }}>Loading spots...</p>
        ) : parkingLogs.length === 0 ? (
          <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '13px', fontStyle: 'italic', margin: '20px 0' }}>
            No parking spots logged today.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {parkingLogs.map(log => {
              const spotConfig = findSpotConfig(log.park_name, log.spot_name);
              const textColor = spotConfig.darkText ? '#1A202C' : '#FFFFFF';
              const displayLot = log.section_name ? `${log.section_name} - ${log.spot_name}` : log.spot_name;

              return (
                <div
                  key={log.id}
                  style={{
                    background: spotConfig.bgColor,
                    color: textColor,
                    borderRadius: '20px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: `0 4px 14px ${spotConfig.bgColor}44`,
                    boxSizing: 'border-box',
                  }}
                >
                  {spotConfig.image && (
                    <img
                      src={spotConfig.image}
                      alt={log.spot_name}
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', lineHeight: '1.1' }}>
                      Row {log.row_number}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '3px', opacity: 0.95 }}>
                      {displayLot}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px', opacity: 0.85 }}>
                      {log.parked_by}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
