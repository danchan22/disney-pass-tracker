import React from 'react';
import { FIXED_FAMILY_MEMBERS, PARK_NAMES, RAINBOW_COLORS } from '../../lib/constants';

interface UploadPhotoModalProps {
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  uploadUser: string;
  setUploadUser: (user: string) => void;
  uploadPark: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  setUploadPark: (park: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom') => void;
  uploadColor: string;
  setUploadColor: (color: string) => void;
  uploadCaption: string;
  setUploadCaption: (caption: string) => void;
  selectedGridFile: File | null;
  setSelectedGridFile: (file: File | null) => void;
  uploadingGrid: boolean;
  handleGridUploadSubmit: (e: React.FormEvent) => void;
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  uploadModalOpen,
  setUploadModalOpen,
  uploadUser,
  setUploadUser,
  uploadPark,
  setUploadPark,
  uploadColor,
  setUploadColor,
  uploadCaption,
  setUploadCaption,
  selectedGridFile,
  setSelectedGridFile,
  uploadingGrid,
  handleGridUploadSubmit,
}) => {
  if (!uploadModalOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '900', color: '#004487' }}>
          Upload {uploadColor} Grid
        </h3>

        <form onSubmit={handleGridUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>PHOTOGRAPHER</label>
            <select value={uploadUser} onChange={(e) => setUploadUser(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px' }}>
              {FIXED_FAMILY_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>PARK</label>
            <select value={uploadPark} onChange={(e) => setUploadPark(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px' }}>
              {PARK_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>COLOR</label>
            <select value={uploadColor} onChange={(e) => setUploadColor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px' }}>
              {RAINBOW_COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>PHOTO OR GRID IMAGE</label>
            <input type="file" accept="image/*" onChange={(e) => setSelectedGridFile(e.target.files?.[0] || null)} required style={{ width: '100%', fontSize: '12px' }} />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>CAPTION (OPTIONAL)</label>
            <input type="text" placeholder="Short note..." value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button type="button" onClick={() => setUploadModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#EDF2F7', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={uploadingGrid || !selectedGridFile} style={{ flex: 2, padding: '12px', background: '#004487', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', opacity: uploadingGrid ? 0.6 : 1 }}>
              {uploadingGrid ? 'Compressing & Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
