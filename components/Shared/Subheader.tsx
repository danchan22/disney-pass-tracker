import React from 'react';
import { MainTab, TrackerSubTab, AnalyticsSubTab } from '../../lib/types';

export type FunSubTab = 'rainbow' | 'trivia';

interface SubheaderProps {
  mainTab: MainTab;
  trackerSubTab: TrackerSubTab;
  setTrackerSubTab: (sub: TrackerSubTab) => void;
  analyticsSubTab: AnalyticsSubTab;
  setAnalyticsSubTab: (sub: AnalyticsSubTab) => void;
  funSubTab: FunSubTab;
  setFunSubTab: (sub: FunSubTab) => void;
}

export const Subheader: React.FC<SubheaderProps> = ({
  mainTab,
  trackerSubTab,
  setTrackerSubTab,
  analyticsSubTab,
  setAnalyticsSubTab,
  funSubTab,
  setFunSubTab
}) => {
  // Common container style for centered, spread text subtabs
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
    borderBottom: '2px solid #E2E8F0',
    marginBottom: '16px',
    paddingBottom: '2px',
    width: '100%',
    boxSizing: 'border-box'
  };

  // Helper renderer for text buttons with blue underlines
  const renderTextTab = (label: string, isActive: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: '8px 10px 10px 10px',
        fontSize: '14px',
        fontWeight: isActive ? '900' : '600',
        color: isActive ? '#004487' : '#718096',
        cursor: 'pointer',
        position: 'relative',
        transition: 'color 0.15s ease'
      }}
    >
      {label}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '3px',
            background: '#004487',
            borderRadius: '3px 3px 0 0'
          }}
        />
      )}
    </button>
  );

  if (mainTab === 'tracker') {
    const tabs: { label: string; value: TrackerSubTab }[] = [
      { label: 'Today', value: 'Today' },
      { label: 'History', value: 'History' },
      { label: 'Parking', value: 'Parking' }
    ];

    return (
      <div style={containerStyle}>
        {tabs.map(tab =>
          renderTextTab(tab.label, trackerSubTab === tab.value, () => setTrackerSubTab(tab.value))
        )}
      </div>
    );
  }

  if (mainTab === 'analytics') {
    const tabs: { label: string; value: AnalyticsSubTab }[] = [
      { label: 'Parks', value: 'averages' },
      { label: 'People', value: 'cards' },
      { label: 'Rides', value: 'top10' },
      { label: 'Visits', value: 'visits' as any }
    ];

    return (
      <div style={containerStyle}>
        {tabs.map(tab =>
          renderTextTab(tab.label, analyticsSubTab === tab.value, () => setAnalyticsSubTab(tab.value))
        )}
      </div>
    );
  }

  if (mainTab === 'rainbow' || (mainTab as any) === 'fun') {
    const tabs: { label: string; value: FunSubTab }[] = [
      { label: 'Rainbow', value: 'rainbow' },
      { label: 'Trivia', value: 'trivia' }
    ];

    return (
      <div style={containerStyle}>
        {tabs.map(tab =>
          renderTextTab(tab.label, funSubTab === tab.value, () => setFunSubTab(tab.value))
        )}
      </div>
    );
  }

  return null;
};
