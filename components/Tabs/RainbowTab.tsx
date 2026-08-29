import React from 'react';
import { PhotoGridRecord, RainbowSubTab } from '../../lib/types';
import { FIXED_FAMILY_MEMBERS, PARK_NAMES, PARK_EMOJIS, RAINBOW_COLORS } from '../../lib/constants';

interface RainbowTabProps {
  rainbowSubTab: RainbowSubTab;
  filterPhotographer: string;
  setFilterPhotographer: React.Dispatch<React.SetStateAction<string>>;
  filterPark: string;
  setFilterPark: React.Dispatch<React.SetStateAction<string>>;
  filterColor: string;
  setFilterColor: React.Dispatch<React.SetStateAction<string>>;
  badgePhotographer: string;
  setBadgePhotographer: (name: string) => void;
  filteredPhotos: PhotoGridRecord[];
  photoLoading: boolean;
  photoGrids: PhotoGridRecord[];
  setLightboxGrid: (grid: PhotoGridRecord | null) => void;
  setUploadUser: (user: string) => void;
  setUploadPark: (park: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom') => void;
  setUploadColor: (color: string) => void;
  setUploadModalOpen: (open: boolean) => void;
}

export const RainbowTab: React.FC<RainbowTabProps> = ({
  rainbowSubTab,
  filterPhotographer,
  setFilterPhotographer,
  filterPark,
  setFilterPark,
  filterColor,
  setFilterColor,
  badgePhotographer,
  setBadgePhotographer,
  filteredPhotos,
  photoLoading,
  photoGrids,
  setLightboxGrid,
  setUploadUser,
  setUploadPark,
  setUploadColor,
  setUploadModalOpen,
}) => {
  return (
    <div>
      {/* Header Subtitle Box */}
      <div style={{ textAlign: 'center', marginBottom: '14px', background: '#FFF', padding: '14px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', margin: '0 0 4px 0' }}>Rainbow Challenge</h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#718096', fontWeight: '600' }}>
          Upload a picture or photo grid for each color in every park.
        </p>
      </div>

      {/* Subtab: Photo Stream */}
      {rainbowSubTab === 'stream' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* TOGGLE FILTERS */}
          <div style={{ background: '#FFF', padding: '14px', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Photographer */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>PHOTOGRAPHER</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {FIXED_FAMILY_MEMBERS.map(m => {
                  const isSel = filterPhotographer === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setFilterPhotographer(prev => prev === m ? 'ALL' : m)}
                      style={{
                        padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                        border: isSel ? '2px solid #004487' : '1px solid #CBD5E0',
                        background: isSel ? '#004487' : '#FFF', color: isSel ? '#FFF' : '#4A5568', cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Park */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>PARK</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {PARK_NAMES.map(p => {
                  const isSel = filterPark === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setFilterPark(prev => prev === p ? 'ALL' : p)}
                      style={{
                        padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                        border: isSel ? '2px solid #004487' : '1px solid #CBD5E0',
                        background: isSel ? '#004487' : '#FFF', color: isSel ? '#FFF' : '#4A5568', cursor: 'pointer'
                      }}
                    >
                      {PARK_EMOJIS[p]} {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>COLOR</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {RAINBOW_COLORS.map(c => {
                  const isSel = filterColor === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setFilterColor(prev => prev === c.name ? 'ALL' : c.name)}
                      style={{
                        padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                        border: isSel ? `2px solid ${c.name === 'White' ? '#A0AEC0' : c.hex}` : '1px solid #CBD5E0',
                        background: isSel ? c.hex : c.bgTint,
                        color: isSel ? (c.name === 'White' ? '#1A202C' : '#FFF') : c.textHex,
                        cursor: 'pointer'
                      }}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* PHOTO STREAM CARDS */}
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
                      <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                        {PARK_EMOJIS[photo.park_name]} {photo.park_name}
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
      {rainbowSubTab === 'badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>PHOTOGRAPHER</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {FIXED_FAMILY_MEMBERS.map(m => (
                <button key={m} onClick={() => setBadgePhotographer(m)} style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', border: badgePhotographer === m ? '2px solid #004487' : '1px solid #CBD5E0', background: badgePhotographer === m ? '#004487' : '#FFF', color: badgePhotographer === m ? '#FFF' : '#4A5568', cursor: 'pointer' }}>{m}</button>
              ))}
            </div>
          </div>

          {PARK_NAMES.map(pName => {
            const userGridsForPark = photoGrids.filter(g => g.user_name === badgePhotographer && g.park_name === pName);
            const completedCount = userGridsForPark.length;

            return (
              <div key={pName} style={{ background: '#FFF', borderRadius: '20px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '900', fontSize: '16px', color: '#004487' }}>{PARK_EMOJIS[pName]} {pName}</span>
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
    </div>
  );
};
