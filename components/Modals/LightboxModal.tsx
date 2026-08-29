import React from 'react';
import { PhotoGridRecord } from '../../lib/types';
import { PARK_EMOJIS } from '../../lib/constants';

interface LightboxModalProps {
  lightboxGrid: PhotoGridRecord | null;
  setLightboxGrid: (grid: PhotoGridRecord | null) => void;
  handleDeleteGridPhoto: (id: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  lightboxGrid,
  setLightboxGrid,
  handleDeleteGridPhoto
}) => {
  if (!lightboxGrid) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#FFF', borderRadius: '20px', padding: '16px', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <strong style={{ fontSize: '16px', color: '#004487' }}>{lightboxGrid.user_name}&apos;s {lightboxGrid.color} Grid</strong>
            <div style={{ fontSize: '12px', color: '#718096' }}>{PARK_EMOJIS[lightboxGrid.park_name]} {lightboxGrid.park_name}</div>
          </div>
          <button onClick={() => setLightboxGrid(null)} style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
        </div>

        <img src={lightboxGrid.image_url} alt="Grid" style={{ width: '100%', borderRadius: '12px', display: 'block', marginBottom: '12px' }} />

        {lightboxGrid.caption && (
          <p style={{ fontSize: '13px', color: '#4A5568', margin: '0 0 12px 0' }}>{lightboxGrid.caption}</p>
        )}

        <button onClick={() => handleDeleteGridPhoto(lightboxGrid.id)} style={{ width: '100%', padding: '10px', background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FEB2B2', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          🗑️ Delete Grid
        </button>
      </div>
    </div>
  );
};
