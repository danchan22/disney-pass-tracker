import React, { useState } from 'react';
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
  handleDeleteGridPhoto,
}) => {
  const [zoomScale, setZoomScale] = useState<number>(1);

  if (!lightboxGrid) return null;

  const toggleZoom = () => {
    setZoomScale(prev => (prev === 1 ? 2.2 : 1));
  };

  const handleClose = () => {
    setZoomScale(1);
    setLightboxGrid(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10000,
        padding: '16px 16px 24px 16px',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Controls */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '900' }}>{lightboxGrid.user_name}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {PARK_EMOJIS[lightboxGrid.park_name]} {lightboxGrid.park_name} • {lightboxGrid.color}
          </div>
        </div>
        <button
          onClick={handleClose}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Image Container with Zoom */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflow: 'auto',
          margin: '12px 0'
        }}
      >
        <img
          src={lightboxGrid.image_url}
          alt="Expanded Grid"
          onClick={toggleZoom}
          style={{
            maxWidth: '100%',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: '12px',
            transform: `scale(${zoomScale})`,
            transition: 'transform 0.25s ease',
            cursor: zoomScale === 1 ? 'zoom-in' : 'zoom-out'
          }}
        />
      </div>

      {/* Bottom Info & Actions */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '11px', color: '#A0AEC0', fontStyle: 'italic' }}>
          {zoomScale === 1 ? '🔍 Tap photo to zoom in' : '🔍 Tap photo to reset zoom'}
        </div>

        {lightboxGrid.caption && (
          <div style={{ color: '#FFF', fontSize: '13px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}>
            {lightboxGrid.caption}
          </div>
        )}

        <button
          onClick={() => handleDeleteGridPhoto(lightboxGrid.id)}
          style={{ background: '#E53E3E', color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🗑️ Delete Photo
        </button>
      </div>
    </div>
  );
};
