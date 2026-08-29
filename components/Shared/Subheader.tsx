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
        <button onClick={() => setTrackerSubTab('Visit a Park')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: trackerSubTab === 'Visit a Park' ? '#004487' : 'transparent', color: trackerSubTab === 'Visit a Park' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Visit a Park
        </button>
        <button onClick={() => setTrackerSubTab('Past Visits')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: trackerSubTab === 'Past Visits' ? '#004487' : 'transparent', color: trackerSubTab === 'Past Visits' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Past Visits
        </button>
      </div>
    );
  }

  if (mainTab === 'analytics') {
    return (
      <div style={{ display: 'flex', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3px', marginBottom: '10px' }}>
        <button onClick={() => setAnalyticsSubTab('averages')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'averages' ? '#004487' : 'transparent', color: analyticsSubTab === 'averages' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Averages
        </button>
        <button onClick={() => setAnalyticsSubTab('top10')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'top10' ? '#004487' : 'transparent', color: analyticsSubTab === 'top10' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Top 10s
        </button>
        <button onClick={() => setAnalyticsSubTab('cards')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'cards' ? '#004487' : 'transparent', color: analyticsSubTab === 'cards' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
          Attendee Cards
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
