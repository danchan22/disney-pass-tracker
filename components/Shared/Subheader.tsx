import React from 'react';
import { MainTab, TrackerSubTab, AnalyticsSubTab, RainbowSubTab } from '../../lib/types';

interface SubheaderProps {
  mainTab: MainTab;
  trackerSubTab: TrackerSubTab;
  setTrackerSubTab: (sub: TrackerSubTab) => void;
  analyticsSubTab: AnalyticsSubTab;
  setAnalyticsSubTab: (sub: AnalyticsSubTab) => void;
  rainbowSubTab: RainbowSubTab;
  setRainbowSubTab: (sub: RainbowSubTab) => void;
}

export const Subheader: React.FC<SubheaderProps> = ({
  mainTab,
  trackerSubTab,
  setTrackerSubTab,
  analyticsSubTab,
  setAnalyticsSubTab,
  rainbowSubTab,
  setRainbowSubTab
}) => {
  if (mainTab === 'tracker') {
    return (
      <div style={{ display: 'flex', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3px', marginBottom: '12px' }}>
        {(['Today', 'History', 'Parking'] as TrackerSubTab[]).map((sub) => (
          <button
            key={sub}
            onClick={() => setTrackerSubTab(sub)}
            style={{
              flex: 1,
              padding: '9px 2px',
              border: 'none',
              borderRadius: '9px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              background: trackerSubTab === sub ? '#004487' : 'transparent',
              color: trackerSubTab === sub ? '#FFF' : '#4A5568',
              transition: 'all 0.2s ease'
            }}
          >
            {sub}
          </button>
        ))}
      </div>
    );
  }

if (mainTab === 'analytics') {
    return (
      <div style={{ display: 'flex', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3px', marginBottom: '10px' }}>
        <button onClick={() => setAnalyticsSubTab('averages')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'averages' ? '#004487' : 'transparent', color: analyticsSubTab === 'averages' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Parks
        </button>
        <button onClick={() => setAnalyticsSubTab('cards')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'cards' ? '#004487' : 'transparent', color: analyticsSubTab === 'cards' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          People
        </button>
        <button onClick={() => setAnalyticsSubTab('top10')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'top10' ? '#004487' : 'transparent', color: analyticsSubTab === 'top10' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Rides
        </button>
        <button onClick={() => setAnalyticsSubTab('visits' as any)} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === ('visits' as any) ? '#004487' : 'transparent', color: analyticsSubTab === ('visits' as any) ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Visits
        </button>
      </div>
    );
  }

  if (mainTab === 'rainbow') {
    return (
      <div style={{ display: 'flex', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3px', marginBottom: '14px' }}>
        <button onClick={() => setRainbowSubTab('stream')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: rainbowSubTab === 'stream' ? '#004487' : 'transparent', color: rainbowSubTab === 'stream' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Photo Stream
        </button>
        <button onClick={() => setRainbowSubTab('badges')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: rainbowSubTab === 'badges' ? '#004487' : 'transparent', color: rainbowSubTab === 'badges' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Badges
        </button>
      </div>
    );
  }

  return null;
};
