'use client';

import React, { useState } from 'react';
import ColorChallengeTab from '@/components/ColorChallengeTab';

// Attending Family Members List
const FAMILY_MEMBERS = ['Dan', 'Mandie', 'Elijah', 'Sophia', 'Sam', 'Andrew'];

// Interfaces
export interface VisitLog {
  id: string;
  parkName: string;
  visitDate: string;
  arrivalTime: string;
  departureTime: string;
  memberEndTimes?: Record<string, string>;
  notes?: string;
  party: string[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'live' | 'analytics' | 'ride-everything' | 'rainbow'>('live');
  const [selectedAttendee, setSelectedAttendee] = useState<string>('Everyone');

  // Check-In State
  const [selectedParty, setSelectedParty] = useState<string[]>(FAMILY_MEMBERS);

  // Visit Logs Mock Data matching exact stats in screenshots
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([
    {
      id: '1',
      parkName: 'Epcot',
      visitDate: '2026-08-04',
      arrivalTime: '09:06',
      departureTime: '15:19',
      party: ['Elijah', 'Mandie', 'Sam', 'Andrew'],
    },
    {
      id: '2',
      parkName: 'Magic Kingdom',
      visitDate: '2026-08-02',
      arrivalTime: '08:30',
      departureTime: '18:00',
      party: ['Dan', 'Mandie', 'Sophia'],
    },
  ]);

  const togglePartyMember = (member: string) => {
    if (selectedParty.includes(member)) {
      setSelectedParty(selectedParty.filter((m) => m !== member));
    } else {
      setSelectedParty([...selectedParty, member]);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F7FA] text-slate-800 pb-16 font-sans">
      {/* 1. Header Section */}
      <header className="pt-6 pb-2 text-center px-4">
        <h1 className="text-2xl font-black text-[#002B5C] flex items-center justify-center gap-2 tracking-tight">
          <span>🏰</span> My Annual Pass Tracker
        </h1>
        <p className="text-xs font-semibold text-amber-500 mt-1 flex items-center justify-center gap-1">
          Shared Cloud Sync Active ☁️
        </p>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-4 mt-2">
        {/* 2. Filter by Attendee Box */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span className="text-blue-600">👤</span> Filter by Attendee:
          </span>
          <select
            value={selectedAttendee}
            onChange={(e) => setSelectedAttendee(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-[#003366] rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Everyone">Everyone (All Data)</option>
            {FAMILY_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Segmented Tab Bar */}
        <div className="bg-[#E2E8F0] p-1.5 rounded-2xl grid grid-cols-4 gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-2.5 rounded-xl text-[11px] font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'live'
                ? 'bg-[#004487] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⏱️ Live</span>
            <span className="hidden sm:inline">Companion</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2.5 rounded-xl text-[11px] font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'analytics'
                ? 'bg-[#004487] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📊 Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('ride-everything')}
            className={`py-2.5 rounded-xl text-[11px] font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'ride-everything'
                ? 'bg-[#004487] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎡 Ride</span>
            <span className="hidden sm:inline">Everything</span>
          </button>
          <button
            onClick={() => setActiveTab('rainbow')}
            className={`py-2.5 rounded-xl text-[11px] font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'rainbow'
                ? 'bg-[#004487] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎨 Rainbow</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: LIVE COMPANION                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Who's Attending Check-in Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
                Who's Attending?
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {FAMILY_MEMBERS.map((member) => {
                  const isSelected = selectedParty.includes(member);
                  return (
                    <button
                      key={member}
                      onClick={() => togglePartyMember(member)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-slate-100 text-slate-800 border-slate-300 shadow-inner'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      {member}
                    </button>
                  );
                })}
              </div>

              <button className="w-full py-3.5 bg-[#004487] hover:bg-[#003366] text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2">
                🚀 Check In to Park
              </button>
            </div>

            {/* Totals Summary Box */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
                Totals
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F4F7FA] p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-2xl font-black text-[#003366] block">7</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Park Visits
                  </span>
                </div>
                <div className="bg-[#F4F7FA] p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-2xl font-black text-emerald-600 block">48</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Total Activities
                  </span>
                </div>
                <div className="bg-[#F4F7FA] p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-2xl font-black text-purple-600 block">37h 35m</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Time in Parks
                  </span>
                </div>
                <div className="bg-[#F4F7FA] p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-2xl font-black text-amber-600 block">15h 50m</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Time in Lines
                  </span>
                </div>
              </div>

              {/* Top Activity Banner */}
              <div className="bg-amber-50/70 border-l-4 border-amber-400 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-black text-amber-700 tracking-wider uppercase flex items-center gap-1">
                  ⭐ Top Activity
                </span>
                <p className="text-xs font-black text-slate-800">
                  Gran Fiesta Tour Starring The Three Caballeros
                </p>
                <p className="text-[11px] font-semibold text-amber-800">
                  Logged <span className="font-extrabold">3x</span> | Total Wait:{' '}
                  <span className="font-extrabold">7m</span>
                </p>
              </div>

              {/* Averages Row */}
              <h3 className="text-[11px] font-black text-slate-400 tracking-wider uppercase pt-2">
                Averages
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#F4F7FA] p-3 rounded-2xl text-center border border-slate-100">
                  <span className="text-base font-black text-slate-800 block">6.9</span>
                  <span className="text-[9px] font-bold text-slate-400">Activities</span>
                </div>
                <div className="bg-[#F4F7FA] p-3 rounded-2xl text-center border border-slate-100">
                  <span className="text-base font-black text-slate-800 block">5h 22m</span>
                  <span className="text-[9px] font-bold text-slate-400">Duration</span>
                </div>
                <div className="bg-[#F4F7FA] p-3 rounded-2xl text-center border border-slate-100">
                  <span className="text-base font-black text-slate-800 block">20m</span>
                  <span className="text-[9px] font-bold text-slate-400">Wait Time</span>
                </div>
              </div>
            </div>

            {/* Past Visits Header */}
            <div className="space-y-3 pt-2">
              <h2 className="text-base font-black text-[#002B5C]">Past Visits (7)</h2>

              {visitLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {log.parkName === 'Epcot'
                          ? '🌐'
                          : log.parkName === 'Magic Kingdom'
                          ? '🏰'
                          : log.parkName === 'Hollywood Studios'
                          ? '🎥'
                          : '🌳'}
                      </span>
                      <span className="text-sm font-black text-[#003366]">{log.parkName}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">📅 {log.visitDate}</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    <p>👥 <span className="font-bold">Party:</span> {log.party.join(', ')}</p>
                    <p>⏰ <span className="font-bold">Hours:</span> {log.arrivalTime} - {log.departureTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANALYTICS                                                          */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* Park Averages Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-base font-black text-[#002B5C] flex items-center gap-2 border-b border-slate-100 pb-2">
                <span>🏟️</span> Park Averages
              </h2>

              {/* Park Item: Magic Kingdom */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    🏰 Magic Kingdom
                  </span>
                  <span className="text-xs font-black text-[#004487]">2 visits</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">5.5</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">ACTIVITIES</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">4h 45m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">DURATION</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">18m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">WAIT TIME</span>
                  </div>
                </div>
              </div>

              {/* Park Item: Epcot */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    🌐 Epcot
                  </span>
                  <span className="text-xs font-black text-[#004487]">2 visits</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">7.5</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">ACTIVITIES</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">5h 16m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">DURATION</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">16m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">WAIT TIME</span>
                  </div>
                </div>
              </div>

              {/* Park Item: Hollywood Studios */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    🎥 Hollywood Studios
                  </span>
                  <span className="text-xs font-black text-[#004487]">2 visits</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">9.5</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">ACTIVITIES</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">8h 49m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">DURATION</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">20m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">WAIT TIME</span>
                  </div>
                </div>
              </div>

              {/* Park Item: Animal Kingdom */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    🌳 Animal Kingdom
                  </span>
                  <span className="text-xs font-black text-[#004487]">1 visit</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">3.0</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">ACTIVITIES</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">3h 53m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">DURATION</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-xl text-center">
                    <span className="text-xs font-black text-slate-700 block">43m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">WAIT TIME</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Times Ridden Card (Top 10) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <h2 className="text-base font-black text-[#002B5C] flex items-center gap-2 border-b border-slate-100 pb-2">
                <span>🎢</span> Most Times Ridden (Top 10)
              </h2>

              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Gran Fiesta Tour Starring The...', park: '🌐 Epcot', count: '3x', wait: '7m', avg: '2m' },
                  { rank: 2, name: 'Guardians of the Galaxy: Cosm...', park: '🌐 Epcot', count: '2x', wait: '2h 13m', avg: '67m' },
                  { rank: 3, name: "Mickey & Minnie's Runaway Ra...", park: '🎥 Hollywood Studios', count: '2x', wait: '1h 3m', avg: '32m' },
                  { rank: 4, name: 'Test Track', park: '🌐 Epcot', count: '2x', wait: '30m', avg: '15m' },
                  { rank: 5, name: 'Pirates of the Caribbean', park: '🏰 Magic Kingdom', count: '2x', wait: '25m', avg: '13m' },
                  { rank: 6, name: 'The Little Mermaid: A Musical...', park: '🎥 Hollywood Studios', count: '2x', wait: '16m', avg: '8m' },
                  { rank: 7, name: 'Carousel of Progress', park: '🏰 Magic Kingdom', count: '2x', wait: '10m', avg: '5m' },
                  { rank: 8, name: 'Vacation Fun', park: '🎥 Hollywood Studios', count: '2x', wait: '4m', avg: '2m' },
                ].map((item) => (
                  <div key={item.rank} className="bg-[#F4F7FA] p-3 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#004487] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {item.rank}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] font-bold text-[#004487]">{item.park}</p>
                        <p className="text-[9px] font-bold text-slate-400">Total Wait Time: {item.wait} | Avg Wait: {item.avg}</p>
                      </div>
                    </div>
                    <span className="bg-sky-100 text-[#004487] text-xs font-black px-2.5 py-1 rounded-xl shrink-0">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Longest Average Waits Card (Top 10) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <h2 className="text-base font-black text-[#8C3B00] flex items-center gap-2 border-b border-slate-100 pb-2">
                <span>⌛</span> Longest Average Waits (Top 10)
              </h2>

              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Avatar Flight of Passage', park: '🌳 Animal Kingdom', wait: '1h 15m', avg: '75m avg' },
                  { rank: 2, name: 'Guardians of the Galaxy: ...', park: '🌐 Epcot', wait: '2h 13m', avg: '67m avg' },
                  { rank: 3, name: 'TRON Lightcycle / Run', park: '🏰 Magic Kingdom', wait: '1h', avg: '60m avg' },
                  { rank: 4, name: "Rock 'n' Roller Coaster", park: '🎥 Hollywood Studios', wait: '54m', avg: '54m avg' },
                  { rank: 5, name: 'Star Wars: Rise of the Res...', park: '🎥 Hollywood Studios', wait: '45m', avg: '45m avg' },
                  { rank: 6, name: 'Alien Swirling Saucers', park: '🎥 Hollywood Studios', wait: '42m', avg: '42m avg' },
                  { rank: 7, name: "Na'vi River Journey", park: '🌳 Animal Kingdom', wait: '35m', avg: '35m avg' },
                ].map((item) => (
                  <div key={item.rank} className="bg-amber-50/60 p-3 rounded-2xl flex items-center justify-between border border-amber-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#D97706] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {item.rank}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] font-bold text-amber-700">{item.park}</p>
                        <p className="text-[9px] font-bold text-slate-400">Total Wait Time: {item.wait} | Avg Wait Time: {item.wait}</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-xl shrink-0">
                      {item.avg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shortest Average Waits Card (Top 10) */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <h2 className="text-base font-black text-[#047857] flex items-center gap-2 border-b border-slate-100 pb-2">
                <span>⚡</span> Shortest Average Waits (Top 10)
              </h2>

              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Gran Fiesta Tour Starring T...', park: '🌐 Epcot', wait: '7m', avg: '2m avg' },
                  { rank: 2, name: 'Vacation Fun', park: '🎥 Hollywood Studios', wait: '4m', avg: '2m avg' },
                  { rank: 3, name: 'Walt Disney Presents', park: '🎥 Hollywood Studios', wait: '2m', avg: '2m avg' },
                  { rank: 4, name: 'Spaceship Earth', park: '🌐 Epcot', wait: '4m', avg: '4m avg' },
                  { rank: 5, name: 'Meet Sully', park: '🎥 Hollywood Studios', wait: '4m', avg: '4m avg' },
                  { rank: 6, name: 'The Seas with Nemo & Frie...', park: '🌐 Epcot', wait: '4m', avg: '4m avg' },
                  { rank: 7, name: "Remy's Ratatouille Advent...", park: '🌐 Epcot', wait: '4m', avg: '4m avg' },
                ].map((item) => (
                  <div key={item.rank} className="bg-emerald-50/60 p-3 rounded-2xl flex items-center justify-between border border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#059669] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {item.rank}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] font-bold text-emerald-700">{item.park}</p>
                        <p className="text-[9px] font-bold text-slate-400">Total Wait Time: {item.wait} | Avg Wait Time: {item.avg}</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-xl shrink-0">
                      {item.avg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendee Cards Section */}
            <div className="space-y-3 pt-2">
              <h2 className="text-base font-black text-[#002B5C] flex items-center gap-2">
                <span>👥</span> Attendee Cards
              </h2>

              {/* Dan Card */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-base font-black text-[#003366] flex items-center gap-2">
                    👤 Dan
                  </span>
                  <span className="bg-sky-50 text-[#004487] text-xs font-black px-3 py-1 rounded-xl">
                    3 Park Visits
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#F4F7FA] p-2.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-base font-black text-slate-800 block">19</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Activities</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-base font-black text-purple-600 block">13h 39m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">TIME IN PARKS</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-base font-black text-amber-600 block">4h 11m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">TIME IN LINES</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-2xl text-center">
                    <span className="text-xs font-black text-slate-700 block">6.3</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Avg Activities</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-2xl text-center">
                    <span className="text-xs font-black text-slate-700 block">4h 33m</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">AVG DURATION</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2 rounded-2xl text-center">
                    <span className="text-xs font-black text-slate-700 block">13m</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">AVG WAIT</span>
                  </div>
                </div>

                <div className="bg-amber-50/70 border-l-4 border-amber-400 rounded-2xl p-3 space-y-1">
                  <span className="text-[9px] font-black text-amber-700 tracking-wider uppercase">
                    ⭐ FAVORITE RIDE
                  </span>
                  <p className="text-xs font-black text-slate-800">
                    Guardians of the Galaxy: Cosmic Rewind
                  </p>
                  <p className="text-[10px] font-semibold text-amber-800">
                    Ridden 1x • Total Wait: 48m
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase flex items-center gap-1">
                    🎪 RIDE EVERYTHING PROGRESS:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="bg-[#F4F7FA] p-2 rounded-xl">🏰 Magic Kingdom <p className="text-[#004487]">6/29 (21%)</p></div>
                    <div className="bg-[#F4F7FA] p-2 rounded-xl">🌐 Epcot <p className="text-[#004487]">7/19 (37%)</p></div>
                    <div className="bg-[#F4F7FA] p-2 rounded-xl">🎥 Hollywood Studios <p className="text-[#004487]">6/18 (33%)</p></div>
                    <div className="bg-[#F4F7FA] p-2 rounded-xl">🌳 Animal Kingdom <p className="text-[#004487]">0/13 (0%)</p></div>
                  </div>
                </div>
              </div>

              {/* Mandie Card */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-base font-black text-[#003366] flex items-center gap-2">
                    👤 Mandie
                  </span>
                  <span className="bg-sky-50 text-[#004487] text-xs font-black px-3 py-1 rounded-xl">
                    5 Park Visits
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#F4F7FA] p-2.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-base font-black text-slate-800 block">39</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Activities</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-base font-black text-purple-600 block">32h 43m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">TIME IN PARKS</span>
                  </div>
                  <div className="bg-[#F4F7FA] p-2.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-base font-black text-amber-600 block">11h 48m</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">TIME IN LINES</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RIDE EVERYTHING                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'ride-everything' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
              {/* Magic Kingdom Card Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-black text-[#003366] flex items-center gap-2">
                  <span>🏰</span> Magic Kingdom
                </h2>
                <span className="bg-amber-50 text-amber-700 text-xs font-black px-3 py-1 rounded-full border border-amber-200">
                  9/29 (31%)
                </span>
              </div>

              {/* Multi-color Gradient Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: '31%',
                    background: 'linear-gradient(90deg, #004487 0%, #3182CE 50%, #D4AF37 100%)',
                  }}
                />
              </div>

              {/* Ride Checklist Items matching Screenshot */}
              <div className="space-y-2 pt-2">
                {[
                  { name: '"it\'s a small world"', count: 0, checked: false },
                  { name: 'Astro Orbiter', count: 0, checked: false },
                  { name: 'Big Thunder Mountain Railroad', count: 1, checked: true },
                  { name: 'Buzz Lightyear\'s Space Ranger Spin', count: 0, checked: false },
                  { name: 'Carousel of Progress', count: 2, checked: true },
                  { name: 'Country Bear Musical Jamboree', count: 0, checked: false },
                  { name: 'Dumbo the Flying Elephant', count: 0, checked: false },
                  { name: 'Enchanted Tales with Belle', count: 0, checked: false },
                  { name: 'Haunted Mansion', count: 1, checked: true },
                  { name: 'Jungle Cruise', count: 1, checked: true },
                  { name: 'Mad Tea Party', count: 0, checked: false },
                  { name: 'Mickey\'s PhilharMagic', count: 0, checked: false },
                ].map((ride) => (
                  <div
                    key={ride.name}
                    className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                      ride.checked
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-bold'
                        : 'bg-[#F4F7FA] border-slate-100 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                          ride.checked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-xs font-black">{ride.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-400">({ride.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RAINBOW CHALLENGE (Color Challenge)                                */}
        {/* ========================================================================= */}
        {activeTab === 'rainbow' && <ColorChallengeTab />}
      </div>
    </main>
  );
}
