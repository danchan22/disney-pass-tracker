import React, { useState, useEffect, useCallback } from 'react';

interface AttractionLive {
  id: string;
  name: string;
  status: string;
  waitTime: number | null;
}

interface LiveWaitTimesWidgetProps {
  parkName: string;
}

export const LiveWaitTimesWidget: React.FC<LiveWaitTimesWidgetProps> = ({ parkName }) => {
  const [attractions, setAttractions] = useState<AttractionLive[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitTimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/live-wait-times?park=${encodeURIComponent(parkName)}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setAttractions(data.attractions || []);

      // Format updated time explicitly to Eastern Time (America/New_York)
      const nowET = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
        hour: 'numeric',
        minute: '2-digit'
      });
      setLastUpdated(nowET);
    } catch (err: any) {
      setError(err.message || 'Could not load live wait times.');
    } finally {
      setLoading(false);
    }
  }, [parkName]);

  useEffect(() => {
    fetchWaitTimes();
    const interval = setInterval(fetchWaitTimes, 150000);
    return () => clearInterval(interval);
  }, [fetchWaitTimes]);

  return (
    <div style={{ background: '#FFF', borderRadius: '18px', padding: '16px', marginBottom: '15px', color: '#1A202C', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #EDF2F7', paddingBottom: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#004487' }}>
            ⏱️ Live Wait Times
          </h3>
          {lastUpdated && (
            <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
              Updated: {lastUpdated}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={fetchWaitTimes}
          disabled={loading}
          style={{
            background: loading ? '#CBD5E0' : '#EBF8FF',
            color: '#2B6CB0',
            border: '1px solid #BEE3F8',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: '800',
            cursor: loading ? 'not-allowed' : 'pointer',
            flexShrink: 0
          }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Content Display without Scroll Container */}
      {error ? (
        <div style={{ fontSize: '12px', color: '#C53030', background: '#FFF5F5', padding: '10px', borderRadius: '10px', fontStyle: 'italic' }}>
          {error}
        </div>
      ) : attractions.length === 0 && !loading ? (
        <div style={{ fontSize: '12px', color: '#718096', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
          No live wait times available right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {attractions.map((att) => {
            const isOperating = att.status === 'OPERATING';
            const displayWait = isOperating && att.waitTime !== null ? `${att.waitTime}m` : att.status;

            return (
              <div
                key={att.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #EDF2F7',
                  fontSize: '12px'
                }}
              >
                <span style={{ fontWeight: '700', color: '#2D3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingRight: '8px' }}>
                  {att.name}
                </span>
                <span
                  style={{
                    fontWeight: '900',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    flexShrink: 0,
                    background: isOperating ? '#E6FFFA' : '#FFF5F5',
                    color: isOperating ? '#234E52' : '#9B2C2C',
                    border: isOperating ? '1px solid #B2F5EA' : '1px solid #FEB2B2'
                  }}
                >
                  {displayWait}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
