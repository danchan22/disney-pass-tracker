import React from 'react';
import { MainTab } from '../../lib/types';
import { MickeyIcon } from './MickeyIcon';

interface HeaderProps {
  mainTab: MainTab;
  setMainTab: (tab: MainTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ mainTab, setMainTab }) => {
  const isFunActive = mainTab === ('rainbow' as MainTab) || mainTab === ('fun' as any);

  return (
    <>
      <header style={{ textAlign: 'center', marginBottom: '14px', padding: '6px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img
          src="/Logo-WDW.webp"
          alt="Disney Pass Tracker"
          style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
        />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '6px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {/* Tracker */}
        <button
          type="button"
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
          type="button"
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
          type="button"
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

        {/* Fun (Mickey Silhouette) */}
        <button
          type="button"
          onClick={() => setMainTab('rainbow' as MainTab)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '8px 2px 6px 2px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: isFunActive ? '3px solid #1A202C' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <MickeyIcon size={22} active={isFunActive} color={isFunActive ? '#1A202C' : '#718096'} />
          <span style={{
            fontSize: '11px',
            fontWeight: isFunActive ? '800' : '600',
            color: isFunActive ? '#1A202C' : '#718096',
            marginTop: '4px'
          }}>
            Fun
          </span>
        </button>
      </div>
    </>
  );
};
