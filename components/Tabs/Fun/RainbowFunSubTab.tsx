'use client';

import React, { useState, useMemo } from 'react';
import { PhotoGridRecord } from '../../../lib/types';
import { FIXED_FAMILY_MEMBERS, PARK_NAMES, RAINBOW_COLORS } from '../../../lib/constants';
import { getSupabase } from '../../../lib/supabase';
import { compressImageToWebP } from '../../../lib/helpers';
import { UploadPhotoModal } from '../../Modals/UploadPhotoModal';
import { LightboxModal } from '../../Modals/LightboxModal';
import { ParkIcon } from '../../Shared/ParkIcon';

type RainbowLevel3Tab = 'Photo Stream' | 'Badges';

interface RainbowFunSubTabProps {
  photoGrids: PhotoGridRecord[];
  photoLoading: boolean;
  fetchPhotoGrids: () => Promise<void>;
}

export const RainbowFunSubTab: React.FC<RainbowFunSubTabProps> = ({
  photoGrids,
  photoLoading,
  fetchPhotoGrids,
}) => {
  const [rainbowLevel3, setRainbowLevel3] = useState<RainbowLevel3Tab>('Photo Stream');
  const [filterPhotographer, setFilterPhotographer] = useState<string>('ALL');
  const [filterPark, setFilterPark] = useState<string>('ALL');
  const [filterColor, setFilterColor] = useState<string>('ALL');
  const [badgePhotographer, setBadgePhotographer] = useState<string>('Dan');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadUser, setUploadUser] = useState<string>('Dan');
  const [uploadPark, setUploadPark] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [uploadColor, setUploadColor] = useState<string>('Red');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [selectedGridFile, setSelectedGridFile] = useState<File | null>(null);
  const [uploadingGrid, setUploadingGrid] = useState<boolean>(false);

  const [lightboxGrid, setLightboxGrid] = useState<PhotoGridRecord | null>(null);

  const filteredPhotos = useMemo(() => {
    return photoGrids.filter(p => {
      if (filterPhotographer !== 'ALL' && p.user_name !== filterPhotographer) return false;
      if (filterPark !== 'ALL' && p.park_name !== filterPark) return false;
      if (filterColor !== 'ALL' && p.color !== filterColor) return false;
      return true;
    });
  }, [photoGrids, filterPhotographer, filterPark, filterColor]);

  const handleGridUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGridFile) return;

    setUploadingGrid(true);
    try {
      const compressedBlob = await compressImageToWebP(selectedGridFile);
      const fileName = `${uploadUser.toLowerCase()}_${uploadPark.replace(/\s+/g, '')}_${uploadColor}_${Date.now()}.webp`;
      const filePath = `grids/${fileName}`;

      const supabase = await getSupabase();
      const { error: storageError } = await supabase.storage
        .from('color-grids')
        .upload(filePath, compressedBlob, { contentType: 'image/webp', upsert: true });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('color-grids').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('photo_grids').insert({
        user_name: uploadUser,
        park_name: uploadPark,
        color: uploadColor,
        image_url: imageUrl,
        caption: uploadCaption || undefined
      });

      if (dbError) throw dbError;

      setUploadModalOpen(false);
      setSelectedGridFile(null);
      setUploadCaption('');
      await fetchPhotoGrids();
    } catch (err: any) {
      alert("Upload failed: " + (err.message || err));
    } finally {
      setUploadingGrid(false);
    }
  };

  const handleDeleteGridPhoto = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this photo grid?")) return;

    try {
      const supabase = await getSupabase();
      await supabase.from('photo_grids').delete().eq('id', id);
      setLightboxGrid(null);
      await fetchPhotoGrids();
    } catch (err: any) {
      alert("Error deleting image: " + err.message);
    }
  };

  return (
    <div>
      {/* LEVEL 3 MENU: PHOTO STREAM | BADGES */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
        {(['Photo Stream', 'Badges'] as RainbowLevel3Tab[]).map(pill => {
          const isSelected = rainbowLevel3 === pill;
          return (
            <button
              key={pill}
              type="button"
              onClick={() => setRainbowLevel3(pill)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                background: isSelected ? '#004487' : 'transparent',
                color: isSelected ? '#FFF' : '#718096',
                fontSize: '13px',
                fontWeight: isSelected ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {pill}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '14px', background: '#FFF', padding: '14px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', margin: '0 0 4px 0' }}>Rainbow Challenge</h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#718096', fontWeight: '600' }}>
          Upload a picture or photo grid for each color in every park.
        </p>
      </div>

      {/* Subtab: Photo Stream */}
      {rainbowLevel3 === 'Photo Stream' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <button
            type="button"
            onClick={() => {
              setUploadUser('Dan');
              setUploadPark('Magic Kingdom');
              setUploadColor('Red');
              setUploadModalOpen(true);
            }}
            style={{
              width: '100%',
              padding: '14px',
              background: '#004487',
              color: '#FFF',
              border: 'none',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 68, 135, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📸 Upload Photo Grid
          </button>

          {/* FILTER BY PHOTOGRAPHER CARD */}
          <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
              👤 FILTER BY PHOTOGRAPHER
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {FIXED_FAMILY_MEMBERS.map(m => {
                const isSelected = filterPhotographer === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFilterPhotographer(prev => prev === m ? 'ALL' : m)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: isSelected ? '800' : '500',
                      border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                      background: isSelected ? '#EBF8FF' : '#FFF',
                      color: isSelected ? '#004487' : '#2D3748',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FILTER BY PARK CARD */}
          <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
              🎡 FILTER BY PARK
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PARK_NAMES.map(p => {
                const isSelected = filterPark === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFilterPark(prev => prev === p ? 'ALL' : p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                      background: isSelected ? '#EBF8FF' : '#FFF',
                      color: isSelected ? '#004487' : '#2D3748',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      minWidth: 0
                    }}
                  >
                    <ParkIcon parkName={p} size={16} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FILTER BY COLOR GRID */}
          <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
              🎨 FILTER BY COLOR
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {RAINBOW_COLORS.map(c => {
                const isSel = filterColor === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFilterColor(prev => prev === c.name ? 'ALL' : c.name)}
                    style={{
                      padding: '10px 2px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '800',
                      border: isSel ? `2px solid ${c.name === 'White' ? '#A0AEC0' : c.hex}` : '1px solid #CBD5E0',
                      background: isSel ? c.hex : c.bgTint,
                      color: isSel ? (c.name === 'White' ? '#1A202C' : '#FFF') : c.textHex,
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                      width: '100%'
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STREAM CARDS */}
          {photoLoading ? (
            <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '20px' }}>Loading photos...</div>
          ) : filteredPhotos.length === 0 ? (
            <div style={{ background: '#FFF', padding: '24px', borderRadius: '20px', textAlign: 'center', color: '#A0AEC0', fontStyle: 'italic', border: '1px solid #E2E8F0' }}>
              No photo grids found for this filter.
            </div>
          ) : (
            filteredPhotos.map(photo => {
              const colorConfig = RAINBOW_COLORS.find(c => c.name === photo.color) || RAINBOW_COLORS[0];
              return (
                <div key={photo.id} style={{ background: '#FFF', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDF2F7' }}>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '15px', color: '#1A202C' }}>{photo.user_name}</div>
                      <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ParkIcon parkName={photo.park_name} size={14} />
                        <span>{photo.park_name}</span>
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '12px', background: colorConfig.hex, color: photo.color === 'White' ? '#1A202C' : '#FFF', border: photo.color === 'White' ? '1px solid #CBD5E0' : 'none' }}>
                      {photo.color}
                    </span>
                  </div>

                  <div style={{ cursor: 'pointer' }} onClick={() => setLightboxGrid(photo)}>
                    <img src={photo.image_url} alt={`${photo.color} grid by ${photo.user_name}`} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
                  </div>

                  {photo.caption && (
                    <div style={{ padding: '10px 14px', fontSize: '12px', color: '#4A5568', background: '#F8FAFC', borderTop: '1px solid #EDF2F7' }}>
                      {photo.caption}
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>
      )}

      {/* Subtab: Badges */}
      {rainbowLevel3 === 'Badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* BADGES PHOTOGRAPHER FILTER CARD */}
          <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
              👤 PHOTOGRAPHER
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {FIXED_FAMILY_MEMBERS.map(m => {
                const isSelected = badgePhotographer === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBadgePhotographer(m)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: isSelected ? '800' : '500',
                      border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                      background: isSelected ? '#EBF8FF' : '#FFF',
                      color: isSelected ? '#004487' : '#2D3748',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {PARK_NAMES.map(pName => {
            const userGridsForPark = photoGrids.filter(g => g.user_name === badgePhotographer && g.park_name === pName);
            const completedCount = userGridsForPark.length;

            return (
              <div key={pName} style={{ background: '#FFF', borderRadius: '20px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '900', fontSize: '16px', color: '#004487', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ParkIcon parkName={pName} size={20} />
                    <span>{pName}</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#D4AF37', background: '#FFFDF5', padding: '3px 10px', borderRadius: '10px', border: '1px solid #FEEBC8' }}>
                    {completedCount}/{RAINBOW_COLORS.length} completed
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {RAINBOW_COLORS.map(cObj => {
                    const matchGrid = userGridsForPark.find(g => g.color === cObj.name);
                    const isUploaded = !!matchGrid;

                    return (
                      <div
                        key={cObj.name}
                        onClick={() => {
                          if (isUploaded) {
                            setLightboxGrid(matchGrid);
                          } else {
                            setUploadUser(badgePhotographer);
                            setUploadPark(pName);
                            setUploadColor(cObj.name);
                            setUploadModalOpen(true);
                          }
                        }}
                        style={{
                          aspectRatio: '1 / 1',
                          borderRadius: '12px',
                          border: `2px solid ${cObj.borderHex}`,
                          background: isUploaded ? '#000' : cObj.bgTint,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          boxShadow: isUploaded ? `0 2px 8px ${cObj.hex}44` : 'none'
                        }}
                      >
                        {isUploaded ? (
                          <img src={matchGrid.image_url} alt={cObj.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: cObj.textHex, textAlign: 'center' }}>{cObj.name}</span>
                            <span style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '12px', fontWeight: '900', color: cObj.textHex }}>+</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* MODALS */}
      <UploadPhotoModal
        uploadModalOpen={uploadModalOpen}
        setUploadModalOpen={setUploadModalOpen}
        uploadUser={uploadUser}
        setUploadUser={setUploadUser}
        uploadPark={uploadPark}
        setUploadPark={setUploadPark}
        uploadColor={uploadColor}
        setUploadColor={setUploadColor}
        uploadCaption={uploadCaption}
        setUploadCaption={setUploadCaption}
        selectedGridFile={selectedGridFile}
        setSelectedGridFile={setSelectedGridFile}
        uploadingGrid={uploadingGrid}
        handleGridUploadSubmit={handleGridUploadSubmit}
      />

      <LightboxModal
        lightboxGrid={lightboxGrid}
        setLightboxGrid={setLightboxGrid}
        handleDeleteGridPhoto={handleDeleteGridPhoto}
      />

    </div>
  );
};
