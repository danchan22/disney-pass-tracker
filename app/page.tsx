'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Visit, Activity, PhotoGridRecord, MainTab, TrackerSubTab, AnalyticsSubTab, RainbowSubTab } from '../lib/types';
import { PARK_ATTRACTIONS } from '../lib/constants';
import { getSupabase } from '../lib/supabase';
import {
  parseAttendees,
  parseMemberEndTimes,
  parseMemberStartTimes,
  getPersonEndTime,
  parseTimeToMinutes,
  isPersonRider,
  getRideTriviaFact,
  getHiddenMickeyFact,
  format12Hour,
  encodeVisitAttendeesPayload,
  fetchGeminiQueueHint
} from '../lib/helpers';

import { Header } from '../components/Shared/Header';
import { Subheader } from '../components/Shared/Subheader';
import { AttendeeFilter } from '../components/Shared/AttendeeFilter';

import { TrackerTab } from '../components/Tabs/TrackerTab';
import { AnalyticsTab } from '../components/Tabs/AnalyticsTab';
import { ChecklistTab } from '../components/Tabs/ChecklistTab';
import { RainbowTab } from '../components/Tabs/RainbowTab';

import { EditVisitModal } from '../components/Modals/EditVisitModal';
import { CheckoutModal } from '../components/Modals/CheckoutModal';

export default function DisneyTracker() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  // Nav States
  const [mainTab, setMainTab] = useState<MainTab>('tracker');
  const [trackerSubTab, setTrackerSubTab] = useState<TrackerSubTab>('Today');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<AnalyticsSubTab>('averages');
  const [rainbowSubTab, setRainbowSubTab] = useState<RainbowSubTab>('stream');

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<string>('ALL');

  // Check-In & Attraction Form States
  const [parkName, setParkName] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [rideName, setRideName] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);

  // Live Queue Timer State
  const [queueStartTimestamp, setQueueStartTimestamp] = useState<number | null>(null);
  const [queueStartTimeStr, setQueueStartTimeStr] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [rideTrivia, setRideTrivia] = useState<string | null>(null);
  const [triviaLoading, setTriviaLoading] = useState<boolean>(false);
  const [hiddenMickey, setHiddenMickey] = useState<string | null>(null);
  const [mickeyLoading, setMickeyLoading] = useState<boolean>(false);

  // Editing States
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editRideName, setEditRideName] = useState('');
  const [editWaitTime, setEditWaitTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRiders, setEditRiders] = useState<string[]>([]);

  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [editVisitStartTime, setEditVisitStartTime] = useState('');
  const [editVisitEndTime, setEditVisitEndTime] = useState('');
  const [editVisitMemberStartTimes, setEditVisitMemberStartTimes] = useState<Record<string, string>>({});
  const [editVisitMemberEndTimes, setEditVisitMemberEndTimes] = useState<Record<string, string>>({});

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [departingMembers, setDepartingMembers] = useState<string[]>([]);

  // Rainbow State
  const [photoGrids, setPhotoGrids] = useState<PhotoGridRecord[]>([]);
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);

  const activePartyList = useMemo(() => {
    if (!activeVisit) return [];
    const allParty = parseAttendees(activeVisit.attendees);
    const endTimes = activeVisit.memberEndTimes || {};
    return allParty.filter(member => !endTimes[member]);
  }, [activeVisit]);

  // Sync rider selections when visit ID or party length changes
  useEffect(() => {
    if (activeVisit) {
      setSelectedRiders(activePartyList);
      setDepartingMembers(activePartyList);
    }
  }, [activeVisit?.id, activePartyList.length]);

  // Reset default rideName ONLY when checking into a NEW visit or park
  useEffect(() => {
    if (activeVisit?.parkName && !queueStartTimestamp) {
      setRideName(PARK_ATTRACTIONS[activeVisit.parkName]?.[0] || '');
    }
  }, [activeVisit?.id, activeVisit?.parkName]);

  // Persistent Queue Timer Mount Restoration
  useEffect(() => {
    const savedStart = localStorage.getItem('disney_queue_start_ts');
    const savedStr = localStorage.getItem('disney_queue_start_str');
    const savedRide = localStorage.getItem('disney_queue_ride_name');

    if (savedStart && savedStr) {
      setQueueStartTimestamp(Number(savedStart));
      setQueueStartTimeStr(savedStr);
      if (savedRide) setRideName(savedRide);
    }
  }, []);

  // Re-fetch AI Trivia if queue timer restored on page refresh
  useEffect(() => {
    if (queueStartTimestamp && activeVisit && rideName && !rideTrivia) {
      fetchRideTrivia(rideName, activeVisit.parkName);
      fetchHiddenMickey(rideName, activeVisit.parkName);
    }
  }, [queueStartTimestamp, activeVisit?.parkName, rideName]);

  useEffect(() => {
    let interval: any;
    if (queueStartTimestamp) {
      interval = setInterval(() => setNowTimestamp(Date.now()), 1000);
    }
    return () => clearInterval(interval);
  }, [queueStartTimestamp]);

  useEffect(() => {
    fetchCloudVisits();
    fetchPhotoGrids();
  }, []);

  const clearQueueTimerStorage = () => {
    localStorage.removeItem('disney_queue_start_ts');
    localStorage.removeItem('disney_queue_start_str');
    localStorage.removeItem('disney_queue_ride_name');
  };

  const fetchCloudVisits = async () => {
    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*, activities(*)');

      if (visitsError) throw visitsError;

      if (visitsData) {
        const formattedVisits: Visit[] = visitsData.map((v: any) => ({
          id: v.id,
          visitDate: v.visitDate || v.visitdate,
          startTime: v.startTime || v.starttime,
          endTime: v.endTime || v.endtime || '',
          parkName: v.parkName || v.parkname,
          attendees: parseAttendees(v.attendees),
          memberEndTimes: parseMemberEndTimes(v.memberEndTimes || v.member_end_times || v.attendees, v.notes),
          memberStartTimes: parseMemberStartTimes(v.memberStartTimes || v.member_start_times || v.attendees, v.notes),
          notes: v.notes,
          activities: (v.activities || []).map((a: any) => ({
            id: a.id,
            visit_id: a.visit_id,
            rideName: a.rideName || a.ridename,
            waitTimeMinutes: Number(a.waitTimeMinutes || a.waittimeminutes || 0),
            notes: a.notes,
            riders: a.riders ? parseAttendees(a.riders) : parseAttendees(v.attendees)
          }))
        }));

        formattedVisits.sort((a, b) => {
          const dateA = new Date(`${a.visitDate}T${a.startTime || '00:00'}`).getTime();
          const dateB = new Date(`${b.visitDate}T${b.startTime || '00:00'}`).getTime();
          return dateB - dateA;
        });

        setActiveVisit(formattedVisits.find(v => !v.endTime) || null);
        setVisits(formattedVisits.filter(v => v.endTime));
      }
    } catch (err: any) {
      setErrorMessage("Could not load cloud visits. " + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoGrids = async () => {
    setPhotoLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('photo_grids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPhotoGrids(data as PhotoGridRecord[]);
    } catch (err) {
      console.warn("Could not fetch photo grids:", err);
    } finally {
      setPhotoLoading(false);
    }
  };

  const filteredVisits = useMemo(() => {
    if (selectedAttendee === 'ALL') return visits;
    return visits.filter(v => parseAttendees(v.attendees).includes(selectedAttendee));
  }, [visits, selectedAttendee]);

  const totalDays = filteredVisits.length;

  const totalActivities = useMemo(() => {
    if (selectedAttendee === 'ALL') {
      return filteredVisits.reduce((sum, v) => sum + v.activities.length, 0);
    }
    return filteredVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, selectedAttendee)).length, 0);
  }, [filteredVisits, selectedAttendee]);

  const totalWaitMinutes = useMemo(() => {
    if (selectedAttendee === 'ALL') {
      return filteredVisits.reduce((sum, v) => sum + v.activities.reduce((aSum, act) => aSum + act.waitTimeMinutes, 0), 0);
    }
    return filteredVisits.reduce((sum, v) => {
      return sum + v.activities.filter(a => isPersonRider(a, v, selectedAttendee)).reduce((aSum, act) => aSum + act.waitTimeMinutes, 0);
    }, 0);
  }, [filteredVisits, selectedAttendee]);

  const totalParkMinutes = useMemo(() => {
    return filteredVisits.reduce((sum, v) => {
      const attendeesToCount = selectedAttendee === 'ALL' ? parseAttendees(v.attendees) : [selectedAttendee];
      let visitTime = 0;
      attendeesToCount.forEach(person => {
        const pEndTime = getPersonEndTime(v, person);
        if (v.startTime && pEndTime) {
          const start = parseTimeToMinutes(v.startTime);
          const end = parseTimeToMinutes(pEndTime);
          visitTime += end >= start ? (end - start) : ((1440 - start) + end);
        }
      });
      return sum + (attendeesToCount.length > 0 ? visitTime / attendeesToCount.length : 0);
    }, 0);
  }, [filteredVisits, selectedAttendee]);

  const avgActivitiesPerDay = totalDays > 0 ? (totalActivities / totalDays).toFixed(1) : '0';
  const avgParkMinutesPerDay = totalDays > 0 ? totalParkMinutes / totalDays : 0;
  const avgWaitPerActivity = totalActivities > 0 ? Math.round(totalWaitMinutes / totalActivities) : 0;

  const getParkBreakdown = (visitList: Visit[], personFilter: string) => {
    const initialParks: Record<string, { visits: number; activities: number; timeInPark: number; waitTime: number }> = {
      'Magic Kingdom': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      'Epcot': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      'Hollywood Studios': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
      'Animal Kingdom': { visits: 0, activities: 0, timeInPark: 0, waitTime: 0 },
    };
    visitList.forEach(v => {
      const park = v.parkName;
      if (initialParks[park]) {
        initialParks[park].visits += 1;
        const validActs = personFilter === 'ALL' ? v.activities : v.activities.filter(a => isPersonRider(a, v, personFilter));
        initialParks[park].activities += validActs.length;
        initialParks[park].waitTime += validActs.reduce((sum, act) => sum + act.waitTimeMinutes, 0);

        const pEndTime = personFilter === 'ALL' ? v.endTime : getPersonEndTime(v, personFilter);
        if (v.startTime && pEndTime) {
          const start = parseTimeToMinutes(v.startTime);
          const end = parseTimeToMinutes(pEndTime);
          initialParks[park].timeInPark += end >= start ? (end - start) : ((1440 - start) + end);
        }
      }
    });
    return initialParks;
  };

  const getRideBreakdown = (visitList: Visit[], personFilter: string) => {
    const rideMap: Record<string, { count: number; totalWait: number; park: string }> = {};
    visitList.forEach(v => {
      const validActs = personFilter === 'ALL' ? v.activities : v.activities.filter(a => isPersonRider(a, v, personFilter));
      validActs.forEach(act => {
        const key = act.rideName === 'Character Meeting' && act.notes ? `Meet ${act.notes}` : act.rideName;
        if (!rideMap[key]) rideMap[key] = { count: 0, totalWait: 0, park: v.parkName };
        rideMap[key].count += 1;
        rideMap[key].totalWait += act.waitTimeMinutes;
      });
    });
    return Object.keys(rideMap).map(name => ({ name, ...rideMap[name], avgWait: Math.round(rideMap[name].totalWait / rideMap[name].count) }));
  };

  const parkStats = getParkBreakdown(filteredVisits, selectedAttendee);
  const rideStats = getRideBreakdown(filteredVisits, selectedAttendee);

  const mostTimesRidden = [...rideStats].sort((a, b) => b.count !== a.count ? b.count - a.count : b.totalWait - a.totalWait).slice(0, 10);
  const longestWaitTimes = [...rideStats].sort((a, b) => b.avgWait !== a.avgWait ? b.avgWait - a.avgWait : b.count - a.count).slice(0, 10);
  const shortestWaitTimes = [...rideStats].sort((a, b) => a.avgWait !== b.avgWait ? a.avgWait - b.avgWait : b.count - a.count).slice(0, 10);
  const topActivity = mostTimesRidden[0] || { name: 'None Yet ✨', count: 0, totalWait: 0 };

  const getRideCountsMap = (visitList: Visit[], personFilter: string) => {
    const counts: Record<string, number> = {};
    visitList.forEach(v => {
      const validActs = personFilter === 'ALL' ? v.activities : v.activities.filter(a => isPersonRider(a, v, personFilter));
      validActs.forEach(act => { counts[act.rideName] = (counts[act.rideName] || 0) + 1; });
    });

    if (activeVisit) {
      const isUserInActive = personFilter === 'ALL' || parseAttendees(activeVisit.attendees).includes(personFilter);
      if (isUserInActive) {
        const validActiveActs = personFilter === 'ALL' ? activeVisit.activities : activeVisit.activities.filter(a => isPersonRider(a, activeVisit, personFilter));
        validActiveActs.forEach(act => { counts[act.rideName] = (counts[act.rideName] || 0) + 1; });
      }
    }
    return counts;
  };

  const rideCountsMap = getRideCountsMap(filteredVisits, selectedAttendee);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA');
    const localTime = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });

    const newAttendeesList = selectedAttendees.length > 0 ? selectedAttendees : ['Just Me'];
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('visits')
      .insert({ visitDate: localDate, startTime: localTime, endTime: '', parkName, attendees: newAttendeesList.join(', ') })
      .select()
      .single();

    if (error) {
      setErrorMessage("Error checking in to park: " + error.message);
      return;
    }

    setActiveVisit({ id: data.id, visitDate: localDate, startTime: localTime, endTime: '', parkName, attendees: newAttendeesList, memberEndTimes: {}, activities: [] });
    setSelectedRiders(newAttendeesList);
    setDepartingMembers(newAttendeesList);
    setSelectedAttendees([]);
  };

  const handleAddMembersToActiveVisit = async (joiningMembers: string[]) => {
    if (!activeVisit) return;

    const currentAttendees = parseAttendees(activeVisit.attendees);
    const updatedAttendees = Array.from(new Set([...currentAttendees, ...joiningMembers]));
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });

    const updatedStartTimes = { ...(activeVisit.memberStartTimes || {}) };
    joiningMembers.forEach(m => { updatedStartTimes[m] = nowTimeStr; });

    const dbPayload = encodeVisitAttendeesPayload(updatedAttendees, updatedStartTimes, activeVisit.memberEndTimes || {});

    try {
      const supabase = await getSupabase();
      const { error } = await supabase.from('visits').update({ attendees: dbPayload }).eq('id', activeVisit.id);
      if (error) throw error;
      await fetchCloudVisits();
    } catch (err: any) {
      alert("Error adding members to active visit: " + (err.message || err));
    }
  };

  const handleAddRideLive = async () => {
    if (!activeVisit || !rideName) return;
    const waitMins = parseInt(waitTime) || 0;
    const notesVal = rideName === 'Character Meeting' && characterName ? characterName : undefined;

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('activities')
      .insert({ visit_id: activeVisit.id, rideName, waitTimeMinutes: waitMins, notes: notesVal, riders: selectedRiders.join(', ') })
      .select()
      .single();

    if (error) {
      setErrorMessage("Error adding attraction: " + error.message);
      return;
    }

    setActiveVisit({ ...activeVisit, activities: [...activeVisit.activities, { id: data.id, visit_id: activeVisit.id, rideName, waitTimeMinutes: waitMins, notes: notesVal, riders: selectedRiders }] });
    setWaitTime('');
    setCharacterName('');
  };

  const fetchRideTrivia = async (attractionName: string, park: string) => {
    setTriviaLoading(true);
    setRideTrivia(getRideTriviaFact(attractionName, park));
    const prompt = `Provide 1 short, fun, surprising Disney Imagineering secret fact or hidden detail for waiting in line at "${attractionName}" in ${park}. Keep it cheerful and under 50 words.`;
    const result = await fetchGeminiQueueHint(prompt);
    if (result) setRideTrivia(result);
    setTriviaLoading(false);
  };

  const fetchHiddenMickey = async (attractionName: string, park: string) => {
    setMickeyLoading(true);
    setHiddenMickey(getHiddenMickeyFact(attractionName, park));
    const prompt = `Where is a specific Hidden Mickey in "${attractionName}" at ${park} in Walt Disney World? Provide 1 specific, concise, fun location hint under 40 words.`;
    const result = await fetchGeminiQueueHint(prompt);
    if (result) setHiddenMickey(result);
    setMickeyLoading(false);
  };

  const handleStartQueueTimer = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
    const ts = now.getTime();

    setQueueStartTimestamp(ts);
    setQueueStartTimeStr(timeString);

    localStorage.setItem('disney_queue_start_ts', ts.toString());
    localStorage.setItem('disney_queue_start_str', timeString);
    localStorage.setItem('disney_queue_ride_name', rideName);

    if (activeVisit) {
      fetchRideTrivia(rideName, activeVisit.parkName);
      fetchHiddenMickey(rideName, activeVisit.parkName);
    }
  };

  const handleCancelQueueTimer = () => {
    clearQueueTimerStorage();
    setQueueStartTimestamp(null);
    setQueueStartTimeStr(null);
    setRideTrivia(null);
    setHiddenMickey(null);
  };

  const handleEndQueueTimer = async () => {
    if (!activeVisit || !queueStartTimestamp) return;
    const diffMs = Date.now() - queueStartTimestamp;
    let calculatedWait = Math.max(1, Math.round(diffMs / 60000));
    const notesVal = rideName === 'Character Meeting' && characterName ? characterName : undefined;

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('activities')
      .insert({ visit_id: activeVisit.id, rideName, waitTimeMinutes: calculatedWait, notes: notesVal, riders: selectedRiders.join(', ') })
      .select()
      .single();

    if (error) {
      alert("Error logging timer activity: " + error.message);
      return;
    }

    setActiveVisit({ ...activeVisit, activities: [...activeVisit.activities, { id: data.id, visit_id: activeVisit.id, rideName, waitTimeMinutes: calculatedWait, notes: notesVal, riders: selectedRiders }] });
    clearQueueTimerStorage();
    setQueueStartTimestamp(null);
    setQueueStartTimeStr(null);
    setCharacterName('');
    setWaitTime('');
    setRideTrivia(null);
    setHiddenMickey(null);
  };

  const openEditVisit = (v: Visit) => {
    setEditingVisit(v);
    setEditVisitStartTime(format12Hour(v.startTime));
    setEditVisitEndTime(format12Hour(v.endTime || ''));

    const existingStarts = v.memberStartTimes || {};
    const existingEnds = v.memberEndTimes || {};
    const formattedStarts: Record<string, string> = {};
    const formattedEnds: Record<string, string> = {};

    parseAttendees(v.attendees).forEach(m => {
      formattedStarts[m] = format12Hour(existingStarts[m] || v.startTime);
      formattedEnds[m] = format12Hour(existingEnds[m] || v.endTime || '');
    });

    setEditVisitMemberStartTimes(formattedStarts);
    setEditVisitMemberEndTimes(formattedEnds);
  };

  const handleSaveVisitEdit = async () => {
    if (!editingVisit) return;
    const rawAttendees = parseAttendees(editingVisit.attendees);
    const dbPayload = encodeVisitAttendeesPayload(rawAttendees, editVisitMemberStartTimes, editVisitMemberEndTimes);

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('visits')
        .update({ startTime: editVisitStartTime, endTime: editVisitEndTime, attendees: dbPayload })
        .eq('id', editingVisit.id);

      if (error) throw error;
      setEditingVisit(null);
      await fetchCloudVisits();
    } catch (err: any) {
      setErrorMessage("Error updating visit log: " + (err.message || err));
    }
  };

  const processCheckout = async (checkoutType: 'selected' | 'everyone') => {
    if (!activeVisit) return;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });

    const leavingParty = checkoutType === 'everyone' ? activePartyList : departingMembers;
    const remainingActive = activePartyList.filter(m => !leavingParty.includes(m));

    const updatedEndTimes = { ...(activeVisit.memberEndTimes || {}) };
    leavingParty.forEach(m => { updatedEndTimes[m] = nowTime; });

    const isVisitComplete = remainingActive.length === 0;
    const finalEndTime = isVisitComplete ? nowTime : '';

    const dbPayload = encodeVisitAttendeesPayload(parseAttendees(activeVisit.attendees), activeVisit.memberStartTimes || {}, updatedEndTimes);

    const supabase = await getSupabase();
    const { error } = await supabase.from('visits').update({ endTime: finalEndTime, attendees: dbPayload }).eq('id', activeVisit.id);

    if (error) {
      setErrorMessage("Error saving departure time: " + error.message);
      return;
    }

    setShowCheckoutModal(false);
    await fetchCloudVisits();
    clearQueueTimerStorage();
    setQueueStartTimestamp(null);
    setQueueStartTimeStr(null);
    setRideTrivia(null);
    setHiddenMickey(null);
  };

  const deleteVisit = async (id: string) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this entire visit log?")) return;
    const supabase = await getSupabase();
    const { error } = await supabase.from('visits').delete().eq('id', id);
    if (error) {
      setErrorMessage("Error deleting visit: " + error.message);
      return;
    }
    await fetchCloudVisits();
  };

  const getElapsedQueueTimeString = () => {
    if (!queueStartTimestamp) return '';
    const diffSeconds = Math.max(0, Math.floor((nowTimestamp - queueStartTimestamp) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return mins === 0 ? `${secs}s` : `${mins} mins ${secs > 0 ? `${secs}s` : ''}`;
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '15px 15px 30px 15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1A202C', background: '#FAFAFA', minHeight: '100vh' }}>

      <Header mainTab={mainTab} setMainTab={setMainTab} />

      {errorMessage && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', padding: '10px 14px', borderRadius: '12px', color: '#C53030', fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', color: '#C53030', fontWeight: '900', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <Subheader
        mainTab={mainTab}
        trackerSubTab={trackerSubTab}
        setTrackerSubTab={setTrackerSubTab}
        analyticsSubTab={analyticsSubTab}
        setAnalyticsSubTab={setAnalyticsSubTab}
        rainbowSubTab={rainbowSubTab}
        setRainbowSubTab={setRainbowSubTab}
      />

      {(mainTab === 'checklist' || (mainTab === 'analytics' && analyticsSubTab !== 'cards')) && (
        <AttendeeFilter selectedAttendee={selectedAttendee} setSelectedAttendee={setSelectedAttendee} />
      )}

      {mainTab === 'tracker' && (
        <TrackerTab
          trackerSubTab={trackerSubTab}
          activeVisit={activeVisit}
          parkName={parkName}
          setParkName={setParkName}
          selectedAttendees={selectedAttendees}
          toggleCheckInAttendee={(name) => setSelectedAttendees(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name])}
          handleCheckIn={handleCheckIn}
          activePartyList={activePartyList}
          rideName={rideName}
          setRideName={setRideName}
          waitTime={waitTime}
          setWaitTime={setWaitTime}
          characterName={characterName}
          setCharacterName={setCharacterName}
          selectedRiders={selectedRiders}
          toggleRiderSelection={(name) => setSelectedRiders(prev => prev.includes(name) ? (prev.length === 1 ? prev : prev.filter(r => r !== name)) : [...prev, name])}
          queueStartTimestamp={queueStartTimestamp}
          setQueueStartTimestamp={setQueueStartTimestamp}
          queueStartTimeStr={queueStartTimeStr}
          setQueueStartTimeStr={setQueueStartTimeStr}
          getElapsedQueueTimeString={getElapsedQueueTimeString}
          rideTrivia={rideTrivia}
          setRideTrivia={setRideTrivia}
          triviaLoading={triviaLoading}
          hiddenMickey={hiddenMickey}
          setHiddenMickey={setHiddenMickey}
          mickeyLoading={mickeyLoading}
          handleStartQueueTimer={handleStartQueueTimer}
          handleEndQueueTimer={handleEndQueueTimer}
          handleCancelQueueTimer={handleCancelQueueTimer}
          handleAddRideLive={handleAddRideLive}
          editingActivityId={editingActivityId}
          editingVisitId={editingVisitId}
          editRideName={editRideName}
          setEditRideName={setEditRideName}
          editWaitTime={editWaitTime}
          setEditWaitTime={setEditWaitTime}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          editRiders={editRiders}
          toggleEditRiderSelection={(name) => setEditRiders(prev => prev.includes(name) ? (prev.length === 1 ? prev : prev.filter(r => r !== name)) : [...prev, name])}
          startEditing={(act, vId) => {
            setEditingActivityId(act.id);
            setEditingVisitId(vId);
            setEditRideName(act.rideName);
            setEditWaitTime(act.waitTimeMinutes.toString());
            setEditNotes(act.notes || '');
            setEditRiders(parseAttendees(act.riders));
          }}
          cancelEditing={() => { setEditingActivityId(null); setEditingVisitId(null); }}
          saveEditedActivity={async () => {
            const supabase = await getSupabase();
            await supabase.from('activities').update({ rideName: editRideName, waitTimeMinutes: parseInt(editWaitTime) || 0, notes: editNotes, riders: editRiders.join(', ') }).eq('id', editingActivityId);
            setEditingActivityId(null);
            await fetchCloudVisits();
          }}
          deleteActivity={async (id) => {
            const supabase = await getSupabase();
            await supabase.from('activities').delete().eq('id', id);
            await fetchCloudVisits();
          }}
          setDepartingMembers={setDepartingMembers}
          setShowCheckoutModal={setShowCheckoutModal}
          handleAddMembersToActiveVisit={handleAddMembersToActiveVisit}
          selectedAttendee={selectedAttendee}
          totalDays={totalDays}
          totalActivities={totalActivities}
          totalParkMinutes={totalParkMinutes}
          totalWaitMinutes={totalWaitMinutes}
          topActivity={topActivity}
          avgActivitiesPerDay={avgActivitiesPerDay}
          avgParkMinutesPerDay={avgParkMinutesPerDay}
          avgWaitPerActivity={avgWaitPerActivity}
          filteredVisits={filteredVisits}
          loading={loading}
          openEditVisit={openEditVisit}
          deleteVisit={deleteVisit}
        />
      )}

      {mainTab === 'analytics' && (
        <AnalyticsTab
          analyticsSubTab={analyticsSubTab}
          parkStats={parkStats}
          mostTimesRidden={mostTimesRidden}
          longestWaitTimes={longestWaitTimes}
          shortestWaitTimes={shortestWaitTimes}
          filteredVisits={filteredVisits}
          selectedAttendee={selectedAttendee}
          visits={visits}
          getRideBreakdown={getRideBreakdown}
          getRideCountsMap={getRideCountsMap}
        />
      )}

      {mainTab === 'checklist' && <ChecklistTab rideCountsMap={rideCountsMap} />}

      {mainTab === 'rainbow' && (
        <RainbowTab
          rainbowSubTab={rainbowSubTab}
          photoGrids={photoGrids}
          photoLoading={photoLoading}
          fetchPhotoGrids={fetchPhotoGrids}
        />
      )}

      <EditVisitModal
        editingVisit={editingVisit}
        setEditingVisit={setEditingVisit}
        editVisitStartTime={editVisitStartTime}
        setEditVisitStartTime={setEditVisitStartTime}
        editVisitEndTime={editVisitEndTime}
        setEditVisitEndTime={setEditVisitEndTime}
        editVisitMemberStartTimes={editVisitMemberStartTimes}
        setEditVisitMemberStartTimes={setEditVisitMemberStartTimes}
        editVisitMemberEndTimes={editVisitMemberEndTimes}
        setEditVisitMemberEndTimes={setEditVisitMemberEndTimes}
        handleSaveVisitEdit={handleSaveVisitEdit}
      />

      <CheckoutModal
        showCheckoutModal={showCheckoutModal}
        setShowCheckoutModal={setShowCheckoutModal}
        activePartyList={activePartyList}
        departingMembers={departingMembers}
        toggleDepartingMember={toggleDepartingMember}
        processCheckout={processCheckout}
      />

    </div>
  );
}
