'use client';

import React, { useState } from 'react';
import ColorChallengeTab from '@/components/ColorChallengeTab';

// Mock/Existing Visit Data Type
export interface VisitLog {
  id: string;
  parkName: string;
  visitDate: string;
  arrivalTime: string;
  departureTime: string;
  memberEndTimes?: Record<string, string>;
  notes?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'stats' | 'color-challenge'>('tracker');

  // Existing Visit Logs State
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([
    {
      id: '1',
      parkName: 'Hollywood Studios',
      visitDate: '2026-07-24',
      arrivalTime: '08:30',
      departureTime: '21:00',
      memberEndTimes: { Elijah: '18:00', Mandie: '21:00' },
      notes: 'Fun day! Staggered departures worked great.',
    },
  ]);

  // Edit Modal State
  const [editingLog, setEditingLog] = useState<VisitLog | null>(null);
  const [editArrivalTime, setEditArrivalTime] = useState('');
  const [editDepartureTime, setEditDepartureTime] = useState('');
  const [editMemberEndTimes, setEditMemberEndTimes] = useState<Record<string, string>>({});

  // Handlers for Visit Logs
  const handleDeleteVisit = (id: string) => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete this entire visit log? This action cannot be undone!'
    );
    if (confirmed) {
      setVisitLogs((prev) => prev.filter((log) => log.id !== id));
    }
  };

  const handleOpenEditModal = (log: VisitLog) => {
    setEditingLog(log);
    setEditArrivalTime(log.arrivalTime);
    setEditDepartureTime(log.departureTime);
    setEditMemberEndTimes(log.memberEndTimes || { Elijah: log.departureTime, Mandie: log.departureTime });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    setVisitLogs((prev) =>
      prev.map((log) =>
        log.id === editingLog.id
          ? {
              ...log,
              arrivalTime: editArrivalTime,
              departureTime: editDepartureTime,
              memberEndTimes: editMemberEndTimes,
            }
          : log
      )
    );
    setEditingLog(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* App Header & Tab Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏰</span>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Disney Family Tracker
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tracker'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Visit Tracker
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📈 Live Stats
            </button>
            <button
              onClick={() => setActiveTab('color-challenge')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'color-challenge'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎨 Color Challenge
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* TAB 1: VISIT TRACKER */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Park Visits Log</h2>
                <p className="text-xs text-slate-400">Track check-ins, departure times, and member durations.</p>
              </div>
            </div>

            <div className="grid gap-4">
              {visitLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4 shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-indigo-400">{log.parkName}</h3>
                      <p className="text-xs text-slate-400">{log.visitDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(log)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                      >
                        ✏️ Edit Visit Hours
                      </button>
                      <button
                        onClick={() => handleDeleteVisit(log.id)}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-lg border border-red-800/60 transition-all"
                      >
                        🗑️ Delete Log
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800/60">
                    <div>
                      <span className="text-slate-500 block">Arrival Time</span>
                      <span className="font-semibold text-slate-200">{log.arrivalTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Main Departure</span>
                      <span className="font-semibold text-slate-200">{log.departureTime}</span>
                    </div>
                    {log.memberEndTimes && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-500 block">Member End Times</span>
                        <div className="flex gap-2 mt-0.5">
                          {Object.entries(log.memberEndTimes).map(([member, time]) => (
                            <span key={member} className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                              {member}: {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE STATS */}
        {activeTab === 'stats' && (
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center space-y-3">
            <h2 className="text-xl font-bold text-white">📈 Live Ride & Park Statistics</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Real-time wait time averages, park hours spent, and trip analytics dashboard.
            </p>
          </div>
        )}

        {/* TAB 3: DISNEY COLOR CHALLENGE & PHOTO STREAM */}
        {activeTab === 'color-challenge' && <ColorChallengeTab />}
      </div>

      {/* EDIT VISIT MODAL */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white">Edit Visit Hours - {editingLog.parkName}</h3>
              <button onClick={() => setEditingLog(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Check-in / Arrival Time</label>
                <input
                  type="time"
                  value={editArrivalTime}
                  onChange={(e) => setEditArrivalTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Main Departure Time</label>
                <input
                  type="time"
                  value={editDepartureTime}
                  onChange={(e) => setEditDepartureTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-slate-400 font-semibold">Individual Member Departures</label>
                {Object.keys(editMemberEndTimes).map((member) => (
                  <div key={member} className="flex items-center justify-between gap-3">
                    <span className="text-slate-300 font-medium">{member}</span>
                    <input
                      type="time"
                      value={editMemberEndTimes[member]}
                      onChange={(e) =>
                        setEditMemberEndTimes({ ...editMemberEndTimes, [member]: e.target.value })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="w-1/2 py-2.5 bg-slate-800 rounded-lg text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
