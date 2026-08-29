'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { compressImage } from '@/lib/imageCompressor';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ParkName = 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
export type ChallengeColor = 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Purple' | 'White' | 'Black';

export interface PhotoGridRecord {
  id: string;
  user_name: string;
  park_name: ParkName;
  color: ChallengeColor;
  image_url: string;
  caption?: string;
  created_at: string;
}

const PARKS: ParkName[] = ['Magic Kingdom', 'Epcot', 'Hollywood Studios', 'Animal Kingdom'];

const COLORS: { name: ChallengeColor; hex: string; borderHex: string }[] = [
  { name: 'Red', hex: '#EF4444', borderHex: '#EF4444' },
  { name: 'Orange', hex: '#F97316', borderHex: '#F97316' },
  { name: 'Yellow', hex: '#EAB308', borderHex: '#EAB308' },
  { name: 'Green', hex: '#22C55E', borderHex: '#22C55E' },
  { name: 'Blue', hex: '#3B82F6', borderHex: '#3B82F6' },
  { name: 'Purple', hex: '#A855F7', borderHex: '#A855F7' },
  { name: 'White', hex: '#F8FAFC', borderHex: '#CBD5E1' },
  { name: 'Black', hex: '#1E293B', borderHex: '#64748B' },
];

const DEFAULT_MEMBERS = ['Elijah', 'Mandie', 'Dan', 'Rachel'];

// SVG Landmarks for Badges
const ParkIcon = ({ park, className = "w-6 h-6" }: { park: ParkName; className?: string }) => {
  switch (park) {
    case 'Magic Kingdom':
      // Cinderella Castle Silhouette
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M11 2h2v3h-2V2zm-3 4h2v2H8V6zm8 0h2v2h-2V6zM4 11h3v2H4v-2zm13 0h3v2h-3v-2zm-6-3h2v3h1v10h-1v-4h-2v4h-1V8h1V8zm-6 5h2v8H5v-8zm12 0h2v8h-2v-8z" />
        </svg>
      );
    case 'Epcot':
      // Spaceship Earth Geodesic Sphere
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 016.32 3.1l-2.82 1.63L12 6.54l-3.5 2.19L5.68 7.1A8 8 0 0112 4zm-7.46 4.88l2.84 1.64L4.54 12l2.84 1.48-2.84 1.64A7.95 7.95 0 014.1 12c0-1.12.23-2.19.44-3.12zM12 20a8 8 0 01-6.32-3.1l2.82-1.63L12 17.46l3.5-2.19 2.82 1.63A8 8 0 0112 20zm7.46-4.88l-2.84-1.64L19.46 12l-2.84-1.48 2.84-1.64c.21.93.44 2 .44 3.12 0 1.12-.23 2.19-.44 3.12z" />
        </svg>
      );
    case 'Hollywood Studios':
      // Tower/Earffel Tower Silhouette
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2l2 4h-4l2-4zm-3 5h6v3H9V7zm-2 4h10v2H7v-2zm-1 3h12v8H6v-8zm4 2v4h4v-4h-4z" />
        </svg>
      );
    case 'Animal Kingdom':
      // Tree of Life
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 3a7 7 0 00-6.9 5.8C3.1 9.3 2 11 2 13a5 5 0 005 5h1a4 4 0 003 3.87V22h2v-0.13A4 4 0 0016 18h1a5 5 0 005-5c0-2-1.1-3.7-3.1-4.2A7 7 0 0012 3zm-1 12v3h2v-3h-2z" />
        </svg>
      );
  }
};

export default function ColorChallengeTab() {
  const [grids, setGrids] = useState<PhotoGridRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trophy' | 'stream'>('trophy');
  const [selectedUser, setSelectedUser] = useState<string>('Elijah');

  // Filters for Photo Stream
  const [streamParkFilter, setStreamParkFilter] = useState<string>('All');
  const [streamColorFilter, setStreamColorFilter] = useState<string>('All');
  const [streamUserFilter, setStreamUserFilter] = useState<string>('All');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadPark, setUploadPark] = useState<ParkName>('Magic Kingdom');
  const [uploadColor, setUploadColor] = useState<ChallengeColor>('Red');
  const [uploadUser, setUploadUser] = useState<string>('Elijah');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Lightbox
  const [activeGrid, setActiveGrid] = useState<PhotoGridRecord | null>(null);

  useEffect(() => {
    fetchGrids();
  }, []);

  const fetchGrids = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('photo_grids')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGrids(data as PhotoGridRecord[]);
    }
    setLoading(false);
  };

  const openUploadModal = (park?: ParkName, color?: ChallengeColor, user?: string) => {
    if (park) setUploadPark(park);
    if (color) setUploadColor(color);
    setUploadUser(user || selectedUser);
    setUploadCaption('');
    setSelectedFile(null);
    setUploadModalOpen(true);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // 1. Compress Image on client side
      const compressedFile = await compressImage(selectedFile);

      // 2. Upload to Supabase Storage Bucket
      const fileExt = 'webp';
      const fileName = `${uploadUser.toLowerCase()}_${uploadPark.replace(/\s+/g, '')}_${uploadColor}_${Date.now()}.${fileExt}`;
      const filePath = `grids/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('color-grids')
        .upload(filePath, compressedFile, { contentType: 'image/webp', upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: urlData } = supabase.storage.from('color-grids').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // 4. Save Record in Database
      const { error: dbError } = await supabase.from('photo_grids').insert([
        {
          user_name: uploadUser,
          park_name: uploadPark,
          color: uploadColor,
          image_url: imageUrl,
          caption: uploadCaption,
        },
      ]);

      if (dbError) throw dbError;

      setUploadModalOpen(false);
      await fetchGrids();
    } catch (err: any) {
      alert(`Error uploading grid: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteGrid = async (grid: PhotoGridRecord) => {
    if (!confirm('Are you sure you want to delete this photo grid? This action cannot be undone.')) return;

    try {
      const { error } = await supabase.from('photo_grids').delete().eq('id', grid.id);
      if (error) throw error;

      setActiveGrid(null);
      await fetchGrids();
    } catch (err: any) {
      alert(`Error deleting grid: ${err.message || err}`);
    }
  };

  // Filtered grids for Stream
  const filteredStreamGrids = useMemo(() => {
    return grids.filter((g) => {
      if (streamUserFilter !== 'All' && g.user_name !== streamUserFilter) return false;
      if (streamParkFilter !== 'All' && g.park_name !== streamParkFilter) return false;
      if (streamColorFilter !== 'All' && g.color !== streamColorFilter) return false;
      return true;
    });
  }, [grids, streamUserFilter, streamParkFilter, streamColorFilter]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 text-slate-100">
      {/* Header & Main Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            🎨 Disney Color Challenge
          </h2>
          <p className="text-xs text-slate-400">Collect all 8 color photo grids across all 4 parks!</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('trophy')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'trophy'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏆 Trophy Case
          </button>
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'stream'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🖼️ Photo Stream
          </button>
        </div>
      </div>

      {/* VIEW 1: PARK TROPHY CASE */}
      {activeTab === 'trophy' && (
        <div className="space-y-6">
          {/* Attendee Selector */}
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <span className="text-sm font-medium text-slate-300">View Trophy Case For:</span>
            <div className="flex gap-2">
              {DEFAULT_MEMBERS.map((member) => (
                <button
                  key={member}
                  onClick={() => setSelectedUser(member)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedUser === member
                      ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {member}
                </button>
              ))}
            </div>
          </div>

          {/* Parks & Badge Grids */}
          <div className="grid gap-6">
            {PARKS.map((park) => {
              const userParkGrids = grids.filter((g) => g.user_name === selectedUser && g.park_name === park);
              const completedCount = userParkGrids.length;

              return (
                <div key={park} className="bg-slate-800/90 rounded-xl p-5 border border-slate-700 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <ParkIcon park={park} className="w-6 h-6 text-indigo-400" />
                      <h3 className="text-lg font-bold text-white">{park}</h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700/80 text-purple-300 border border-purple-500/30">
                      {completedCount}/8 Completed
                    </span>
                  </div>

                  {/* 8 Color Badges Row */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {COLORS.map((colorObj) => {
                      const gridMatch = userParkGrids.find((g) => g.color === colorObj.name);
                      const isEarned = !!gridMatch;

                      return (
                        <button
                          key={colorObj.name}
                          onClick={() => {
                            if (isEarned) {
                              setActiveGrid(gridMatch);
                            } else {
                              openUploadModal(park, colorObj.name, selectedUser);
                            }
                          }}
                          className="group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                          style={{
                            backgroundColor: isEarned ? colorObj.hex : 'rgba(30, 41, 59, 0.6)',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: colorObj.borderHex,
                            boxShadow: isEarned ? `0 0 12px ${colorObj.hex}66` : 'none',
                          }}
                        >
                          <ParkIcon
                            park={park}
                            className={`w-7 h-7 transition-colors ${
                              isEarned
                                ? colorObj.name === 'White' || colorObj.name === 'Yellow'
                                  ? 'text-slate-900'
                                  : 'text-white'
                                : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold mt-1 ${
                              isEarned
                                ? colorObj.name === 'White' || colorObj.name === 'Yellow'
                                  ? 'text-slate-900'
                                  : 'text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {colorObj.name}
                          </span>

                          {/* Lock / Add indicator for unearned */}
                          {!isEarned && (
                            <span className="absolute -top-1 -right-1 bg-slate-900 text-slate-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] border border-slate-700">
                              +
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: PHOTO STREAM */}
      {activeTab === 'stream' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Member</label>
              <select
                value={streamUserFilter}
                onChange={(e) => setStreamUserFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="All">All Family Members</option>
                {DEFAULT_MEMBERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Park</label>
              <select
                value={streamParkFilter}
                onChange={(e) => setStreamParkFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="All">All Parks</option>
                {PARKS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Color</label>
              <select
                value={streamColorFilter}
                onChange={(e) => setStreamColorFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="All">All Colors</option>
                {COLORS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feed List */}
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading Photo Stream...</div>
          ) : filteredStreamGrids.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/40 rounded-xl border border-slate-700/50 text-slate-400">
              No photo grids found for these filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStreamGrids.map((grid) => {
                const colorConfig = COLORS.find((c) => c.name === grid.color);
                return (
                  <div
                    key={grid.id}
                    onClick={() => setActiveGrid(grid)}
                    className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg cursor-pointer hover:border-slate-500 transition-all"
                  >
                    <div className="p-3 flex items-center justify-between border-b border-slate-700/50 bg-slate-800/90">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                          {grid.user_name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{grid.user_name}</p>
                          <p className="text-[10px] text-slate-400">{grid.park_name}</p>
                        </div>
                      </div>

                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: colorConfig?.hex,
                          color: grid.color === 'White' || grid.color === 'Yellow' ? '#0f172a' : '#ffffff',
                        }}
                      >
                        {grid.color} Challenge
                      </span>
                    </div>

                    <div className="aspect-square bg-slate-950 relative overflow-hidden">
                      <img src={grid.image_url} alt={`${grid.color} grid`} className="w-full h-full object-cover" />
                    </div>

                    {grid.caption && (
                      <div className="p-3 text-xs text-slate-300 border-t border-slate-700/50">{grid.caption}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">Upload Color Challenge Grid</h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Attendee</label>
                <select
                  value={uploadUser}
                  onChange={(e) => setUploadUser(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                >
                  {DEFAULT_MEMBERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Park</label>
                  <select
                    value={uploadPark}
                    onChange={(e) => setUploadPark(e.target.value as ParkName)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                  >
                    {PARKS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Color</label>
                  <select
                    value={uploadColor}
                    onChange={(e) => setUploadColor(e.target.value as ChallengeColor)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                  >
                    {COLORS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Select Pre-edited Grid Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Caption (Optional)</label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Favorite moment during this color hunt..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg font-bold text-white shadow-lg disabled:opacity-50 transition-all"
              >
                {isUploading ? 'Compressing & Uploading...' : 'Upload Grid'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {activeGrid && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
            <div className="p-4 flex justify-between items-center border-b border-slate-700">
              <div>
                <h4 className="font-bold text-white">
                  {activeGrid.user_name}&apos;s {activeGrid.color} Grid
                </h4>
                <p className="text-xs text-slate-400">{activeGrid.park_name}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteGrid(activeGrid)}
                  className="text-xs text-red-400 hover:text-red-300 bg-red-950/50 px-3 py-1.5 rounded-md border border-red-800"
                >
                  Delete Grid
                </button>
                <button
                  onClick={() => setActiveGrid(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              <img
                src={activeGrid.image_url}
                alt="Color grid full view"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            {activeGrid.caption && (
              <div className="p-4 bg-slate-800 border-t border-slate-700 text-sm text-slate-200">
                {activeGrid.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
