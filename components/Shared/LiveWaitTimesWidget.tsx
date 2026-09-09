'use client';

import React, { useEffect, useState } from 'react';
import { ParkIcon } from './ParkIcon';

interface AttractionWaitData {
  id: string;
  name: string;
  is_open: boolean;
  wait_time: number | null;
  type: 'RIDE' | 'SHOW' | 'EVENT';
  showtimes?: string[];
}

interface LiveWaitTimesWidgetProps {
  parkName: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
}

// Helper: Filter out showtimes that have already passed today
const isShowInFuture = (timeStr: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Parse time strings like "2:30 PM", "10:15 AM", or "14:30"
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return true; // Fallback to display if format isn't standard

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3]?.toUpperCase();

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const showMinutes = hours * 60 + minutes;
  return showMinutes >= currentMinutes;
};

export const LiveWaitTimesWidget: React.FC<LiveWaitTimesWidgetProps> = ({ parkName }) => {
  const [attractions, setAttractions] = useState<AttractionWaitData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLiveWaitTimes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wait-times?park=${encodeURIComponent(parkName)}`);
      if (!res.ok) throw new Error('Failed to fetch live wait times');
      const data: AttractionWaitData[] = await res.json();
      setAttractions(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load wait times');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWaitTimes();
    // Refresh wait times automatically every 3 minutes
    const interval = setInterval(fetchLiveWaitTimes, 180000);
    return () => clearInterval(interval);
  }, [parkName]);

  const filteredAttractions = attractions.filter(att => 
    att.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        background: '#FFF',
        borderRadius: '24px',
        padding: '18px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #E2E8F0',
        marginBottom: '25px',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ParkIcon parkName={parkName} size={20} />
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '900',
              color: '#004487',
              margin: 0,
            }}
          >
            Live Wait & Show Times
          </h3>
        </div>
        <button
          type="button"
          onClick={fetchLiveWaitTimes}
          disabled={loading}
          style={{
            background: '#EBF8FF',
            color: '#004487',
            border: '1px solid #BEE3F8',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
          }}
        >
          {loading ? '↻ Syncing...' : '↻ Refresh'}
        </button>
      </div>

      {/* SEARCH INPUT */}
      <input
        type="text"
        placeholder="Filter attractions or shows..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: '10px',
          border: '1px solid #CBD5E0',
          fontSize: '13px',
          marginBottom: '12px',
          boxSizing: 'border-box',
          background: '#F8FAFC',
        }}
      />

      {/* CONTENT LIST */}
      {loading && attractions.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '16px 0', fontSize: '13px', fontStyle: 'italic' }}>
          Fetching current Disney park data...
        </div>
      ) : error ? (
        <div style={{ color: '#E53E3E', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>
          {error}
        </div>
      ) : filteredAttractions.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '12px 0', fontSize: '12px', fontStyle: 'italic' }}>
          No attractions found matching "{searchQuery}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '2px' }}>
          {filteredAttractions.map((att) => {
            // Filter showtimes to show only future showtimes today
            const futureShowtimes = (att.showtimes || []).filter(isShowInFuture);
            const isShow = att.type === 'SHOW' || (att.showtimes && att.showtimes.length > 0);

            return (
              <div
                key={att.id || att.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #EDF2F7',
                }}
              >
                <div style={{ minWidth: 0, flex: 1, paddingRight: '10px' }}>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C' }}>
                    {att.name}
                  </div>

                  {/* SHOWTIMES RENDERING */}
                  {isShow && (
                    <div style={{ fontSize: '11px', color: '#4A5568', marginTop: '4px' }}>
                      {futureShowtimes.length > 0 ? (
                        <div>
                          <strong style={{ color: '#2B6CB0' }}>Next Shows:</strong>{' '}
                          {futureShowtimes.slice(0, 4).join(', ')}
                          {futureShowtimes.length > 4 && ` (+${futureShowtimes.length - 4} more)`}
                        </div>
                      ) : (
                        <span style={{ color: '#A0AEC0', fontStyle: 'italic' }}>
                          No remaining showtimes scheduled for today
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* WAIT TIME / STATUS BADGE */}
                {!isShow && (
                  <div style={{ flexShrink: 0 }}>
                    {!att.is_open ? (
                      <span
                        style={{
                          background: '#FED7D7',
                          color: '#C53030',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                        }}
                      >
                        Closed
                      </span>
                    ) : att.wait_time === 0 ? (
                      <span
                        style={{
                          background: '#FEFCBF',
                          color: '#B7791F',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                        }}
                      >
                        ⚡ Walk On
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#EBF8FF',
                          color: '#2B6CB0',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '900',
                          border: '1px solid #BEE3F8',
                        }}
                      >
                        {att.wait_time}m
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
