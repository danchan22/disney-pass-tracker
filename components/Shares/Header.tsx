import React from 'react';
import { MainTab } from '../../lib/types';

interface HeaderProps {
  mainTab: MainTab;
  setMainTab: (tab: MainTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ mainTab, setMainTab }) => {
  return (
    <>
      <header style={{ textAlign: 'center', marginBottom: '14px', padding: '6px 0' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#004487', letterSpacing: '-0.5px', margin: '0' }}>🏰 Disney Pass Tracker</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '6px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {/* Tracker */}
        <button
          onClick={() => setMainTab('tracker')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '8px 2px 6px 2px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: mainTab === 'tracker' ? '3px solid #004487' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'tracker' ? '#004487' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: mainTab === 'tracker' ? '800' : '600', color: mainTab === 'tracker' ? '#004487' : '#718096', marginTop: '4px' }}>Tracker</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => setMainTab('analytics')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '8px 2px 6px 2px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: mainTab === 'analytics' ? '3px solid #E53E3E' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'analytics' ? '#E53E3E' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: mainTab === 'analytics' ? '800' : '600', color: mainTab === 'analytics' ? '#E53E3E' : '#718096', marginTop: '4px' }}>Analytics</span>
        </button>

        {/* Checklist */}
        <button
          onClick={() => setMainTab('checklist')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '8px 2px 6px 2px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: mainTab === 'checklist' ? '3px solid #38A169' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'checklist' ? '#38A169' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: mainTab === 'checklist' ? '800' : '600', color: mainTab === 'checklist' ? '#38A169' : '#718096', marginTop: '4px' }}>Checklist</span>
        </button>

        {/* Rainbow */}
        <button
          onClick={() => setMainTab('rainbow')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '8px 2px 6px 2px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: mainTab === 'rainbow' ? '3px solid transparent' : '3px solid transparent',
            borderImage: mainTab === 'rainbow' ? 'linear-gradient(to right, #E53E3E, #DD6B20, #D69E2E, #38A169, #3182CE, #805AD5) 1' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'rainbow' ? '#805AD5' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.72 1.7-1.61 0-.43-.17-.83-.44-1.13-.27-.3-.43-.7-.43-1.13 0-.89.78-1.61 1.7-1.61h2.47c2.76 0 5-2.24 5-5 0-5.52-4.48-10-10-10z"></path>
          </svg>
          <span style={{
            fontSize: '11px',
            fontWeight: mainTab === 'rainbow' ? '800' : '600',
            color: mainTab === 'rainbow' ? 'transparent' : '#718096',
            background: mainTab === 'rainbow' ? 'linear-gradient(90deg, #E53E3E, #DD6B20, #D69E2E, #38A169, #3182CE, #805AD5)' : 'none',
            WebkitBackgroundClip: mainTab === 'rainbow' ? 'text' : 'unset',
            WebkitTextFillColor: mainTab === 'rainbow' ? 'transparent' : 'unset',
            marginTop: '4px'
          }}>Rainbow</span>
        </button>
      </div>
    </>
  );
};
