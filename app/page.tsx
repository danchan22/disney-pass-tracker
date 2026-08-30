'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Visit, Activity, PhotoGridRecord, MainTab, TrackerSubTab, AnalyticsSubTab, RainbowSubTab } from '../lib/types';
import { PARK_ATTRACTIONS } from '../lib/constants';
import { getSupabase } from '../lib/supabase';
import { parseAttendees, parseMemberEndTimes, parseMemberStartTimes, compressImageToWebP, getPersonEndTime, parseTimeToMinutes, isPersonRider, getRideTriviaFact, getHiddenMickeyFact, format12Hour } from '../lib/helpers';

import { Header } from '../components/Shared/Header';
import { Subheader } from '../components/Shared/Subheader';
import { AttendeeFilter } from '../components/Shared/AttendeeFilter';

import { TrackerTab } from '../components/Tabs/TrackerTab';
import { AnalyticsTab } from '../components/Tabs/AnalyticsTab';
import { ChecklistTab } from '../components/Tabs/ChecklistTab';
import { RainbowTab } from '../components/Tabs/RainbowTab';

import { UploadPhotoModal } from '../components/Modals/UploadPhotoModal';
import { LightboxModal } from '../components/Modals/LightboxModal';
import { EditVisitModal } from '../components/Modals/EditVisitModal';
import { CheckoutModal } from '../components/Modals/CheckoutModal';

export default function DisneyTracker() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);

  // Main Nav State
  const [mainTab, setMainTab] = useState<MainTab>('tracker');
  const [trackerSubTab, setTrackerSubTab] = useState<TrackerSubTab>('Today');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<AnalyticsSubTab>('averages');
  const [rainbowSubTab, setRainbowSubTab] = useState<RainbowSubTab>('stream');

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Attendee Filter State
  const [selectedAttendee, setSelectedAttendee] = useState<string>('ALL');

  // Check-In Form States
  const [parkName, setParkName] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  // Track Attraction States
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

  // Editing Activity State
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editRideName, setEditRideName] = useState('');
  const [editWaitTime, setEditWaitTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRiders, setEditRiders] = useState<string[]>([]);

  // Editing Visit State
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
  const [filterPhotographer, setFilterPhotographer] = useState<string>('ALL');
  const [filterPark, setFilterPark] = useState<string>('ALL');
  const [filterColor, setFilterColor] = useState<string>('ALL');
  const [badgePhotographer, setBadgePhotographer] = useState<string>('Dan');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadUser, setUploadUser] = useState<string>('Dan');
  const [uploadPark, setUploadPark] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [uploadColor, setUploadColor] = useState<string>('Red');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [selectedGridFile, setSelectedGridFile] = useState<File | null>(null);
  const [uploadingGrid, setUploadingGrid] = useState<boolean>(false);

  const [lightboxGrid, setLightboxGrid] = useState<PhotoGridRecord | null>(null);

  const activePartyList = useMemo(() => {
    if (!activeVisit) return [];
    const allParty = parseAttendees(activeVisit.attendees);
    const endTimes = activeVisit.memberEndTimes || {};
    return allParty.filter(member => !endTimes[member]);
  }, [activeVisit]);

// 1. Sync rider selections when visit ID or party length changes
useEffect(() => {
  if (activeVisit) {
    setSelectedRiders(activePartyList);
    setDepartingMembers(activePartyList);
  }
}, [activeVisit?.id, activePartyList.length]);

// 2. ONLY reset default rideName when checking into a NEW visit or park
useEffect(() => {
  if (activeVisit?.parkName) {
    setRideName(PARK_ATTRACTIONS[activeVisit.parkName]?.[0] || '');
  }
}, [activeVisit?.id, activeVisit?.parkName]);

  useEffect(() => {
    let interval: any;
    if (queueStartTimestamp) {
      interval = setInterval(() => {
        setNowTimestamp(Date.now());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [queueStartTimestamp]);

  useEffect(() => {
    fetchCloudVisits();
    fetchPhotoGrids();
  }, []);

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

        const ongoing = formattedVisits.find(v => !v.endTime);
        const completed = formattedVisits.filter(v => v.endTime);

        setActiveVisit(ongoing || null);
        setVisits(completed);
      }
    } catch (err: any) {
      console.error("Error fetching Supabase data:", err);
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
    return visits.filter(v => {
      const attList = parseAttendees(v.attendees);
      return attList.includes(selectedAttendee);
    });
  }, [visits, selectedAttendee]);

  const totalDays = filteredVisits.length;

  const totalActivities = useMemo(() => {
    if (selectedAttendee === 'ALL') {
      return filteredVisits.reduce((sum, v) => sum + v.activities.length, 0);
    }
    return filteredVisits.reduce((sum, v) => {
      return sum + v.activities.filter(a => isPersonRider(a, v, selectedAttendee)).length;
    }, 0);
  }, [filteredVisits, selectedAttendee]);

  const totalWaitMinutes = useMemo(() => {
    if (selectedAttendee === 'ALL') {
      return filteredVisits.reduce((sum, v) => sum + v.activities.reduce((aSum, act) => aSum + act.waitTimeMinutes, 0), 0);
    }
    return filteredVisits.reduce((sum, v) => {
      return sum + v.activities
        .filter(a => isPersonRider(a, v, selectedAttendee))
        .reduce((aSum, act) => aSum + act.waitTimeMinutes, 0);
    }, 0);
  }, [filteredVisits, selectedAttendee]);

  const totalParkMinutes = useMemo(() => {
    return filteredVisits.reduce((sum, v) => {
      const attendeesToCount = selectedAttendee === 'ALL'
        ? parseAttendees(v.attendees)
        : [selectedAttendee];

      let visitTime = 0;
      attendeesToCount.forEach(person => {
        const pEndTime = getPersonEndTime(v, person);
        if (v.startTime && pEndTime) {
          const start = parseTimeToMinutes(v.startTime);
          const end = parseTimeToMinutes(pEndTime);
          visitTime += end >= start ? (end - start) : ((1440 - start) + end);
        }
      });

      const avgTimeForVisit = attendeesToCount.length > 0 ? visitTime / attendeesToCount.length : 0;
      return sum + avgTimeForVisit;
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
        const validActs = personFilter === 'ALL'
          ? v.activities
          : v.activities.filter(a => isPersonRider(a, v, personFilter));

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
      const validActs = personFilter === 'ALL'
        ? v.activities
        : v.activities.filter(a => isPersonRider(a, v, personFilter));

      validActs.forEach(act => {
        const key = act.rideName === 'Character Meeting' && act.notes ? `Meet ${act.notes}` : act.rideName;
        if (!rideMap[key]) rideMap[key] = { count: 0, totalWait: 0, park: v.parkName };
        rideMap[key].count += 1;
        rideMap[key].totalWait += act.waitTimeMinutes;
      });
    });
    return Object.keys(rideMap)
      .map(name => ({ name, ...rideMap[name], avgWait: Math.round(rideMap[name].totalWait / rideMap[name].count) }));
  };

  const parkStats = getParkBreakdown(filteredVisits, selectedAttendee);
  const rideStats = getRideBreakdown(filteredVisits, selectedAttendee);

  const mostTimesRidden = [...rideStats]
    .sort((a, b) => b.count !== a.count ? b.count - a.count : b.totalWait - a.totalWait)
    .slice(0, 10);

  const longestWaitTimes = [...rideStats]
    .sort((a, b) => b.avgWait !== a.avgWait ? b.avgWait - a.avgWait : b.count - a.count)
    .slice(0, 10);

  const shortestWaitTimes = [...rideStats]
    .sort((a, b) => a.avgWait !== b.avgWait ? a.avgWait - b.avgWait : b.count - a.count)
    .slice(0, 10);

  const topActivity = mostTimesRidden[0] || { name: 'None Yet ✨', count: 0, totalWait: 0 };

  const getRideCountsMap = (visitList: Visit[], personFilter: string) => {
    const counts: Record<string, number> = {};
    visitList.forEach(v => {
      const validActs = personFilter === 'ALL'
        ? v.activities
        : v.activities.filter(a => isPersonRider(a, v, personFilter));

      validActs.forEach(act => {
        counts[act.rideName] = (counts[act.rideName] || 0) + 1;
      });
    });

    if (activeVisit) {
      const isUserInActive = personFilter === 'ALL' || parseAttendees(activeVisit.attendees).includes(personFilter);
      if (isUserInActive) {
        const validActiveActs = personFilter === 'ALL'
          ? activeVisit.activities
          : activeVisit.activities.filter(a => isPersonRider(a, activeVisit, personFilter));

        validActiveActs.forEach(act => {
          counts[act.rideName] = (counts[act.rideName] || 0) + 1;
        });
      }
    }
    return counts;
  };

  const rideCountsMap = getRideCountsMap(filteredVisits, selectedAttendee);

  const filteredPhotos = useMemo(() => {
    return photoGrids.filter(p => {
      if (filterPhotographer !== 'ALL' && p.user_name !== filterPhotographer) return false;
      if (filterPark !== 'ALL' && p.park_name !== filterPark) return false;
      if (filterColor !== 'ALL' && p.color !== filterColor) return false;
      return true;
    });
  }, [photoGrids, filterPhotographer, filterPark, filterColor]);

  const toggleCheckInAttendee = (name: string) => {
    if (selectedAttendees.includes(name)) {
      setSelectedAttendees(selectedAttendees.filter(a => a !== name));
    } else {
      setSelectedAttendees([...selectedAttendees, name]);
    }
  };

  const toggleRiderSelection = (name: string) => {
    if (selectedRiders.includes(name)) {
      if (selectedRiders.length === 1) return;
      setSelectedRiders(selectedRiders.filter(r => r !== name));
    } else {
      setSelectedRiders([...selectedRiders, name]);
    }
  };

  const toggleEditRiderSelection = (name: string) => {
    if (editRiders.includes(name)) {
      if (editRiders.length === 1) return;
      setEditRiders(editRiders.filter(r => r !== name));
    } else {
      setEditRiders([...editRiders, name]);
    }
  };

  const toggleDepartingMember = (name: string) => {
    if (departingMembers.includes(name)) {
      if (departingMembers.length === 1) return;
      setDepartingMembers(departingMembers.filter(m => m !== name));
    } else {
      setDepartingMembers([...departingMembers, name]);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA');
    const localTime = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });

    const newAttendeesList = selectedAttendees.length > 0 ? selectedAttendees : ['Just Me'];
    const attendeesDbStr = newAttendeesList.join(', ');

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('visits')
      .insert({
        visitDate: localDate,
        startTime: localTime,
        endTime: '',
        parkName,
        attendees: attendeesDbStr
      })
      .select()
      .single();

    if (error) {
      setErrorMessage("Error checking in to park: " + error.message);
      return;
    }

    const newVisit: Visit = {
      id: data.id,
      visitDate: localDate,
      startTime: localTime,
      endTime: '',
      parkName,
      attendees: newAttendeesList,
      memberEndTimes: {},
      activities: []
    };

    setActiveVisit(newVisit);
    setSelectedRiders(newAttendeesList);
    setDepartingMembers(newAttendeesList);
    setSelectedAttendees([]);
  };

  const handleAddMembersToActiveVisit = async (joiningMembers: string[]) => {
    if (!activeVisit) return;

    const currentAttendees = parseAttendees(activeVisit.attendees);
    const updatedAttendees = Array.from(new Set([...currentAttendees, ...joiningMembers]));
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });

    const updatedStartTimes: Record<string, string> = {
      ...(activeVisit.memberStartTimes || {})
    };
    joiningMembers.forEach(m => {
      updatedStartTimes[m] = nowTimeStr;
    });

    const rawAttendeesStr = updatedAttendees.join(', ');
    const endTimesJson = JSON.stringify(activeVisit.memberEndTimes || {});
    const startTimesJson = JSON.stringify(updatedStartTimes);
    const dbAttendeesPayload = `${rawAttendeesStr}|ENDTIMES:${endTimesJson}|STARTTIMES:${startTimesJson}`;

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('visits')
        .update({ attendees: dbAttendeesPayload })
        .eq('id', activeVisit.id);

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
    const ridersStr = selectedRiders.join(', ');

    const supabase = await getSupabase();
    let { data, error } = await supabase
      .from('activities')
      .insert({
        visit_id: activeVisit.id,
        rideName,
        waitTimeMinutes: waitMins,
        notes: notesVal,
        riders: ridersStr
      })
      .select()
      .single();

    if (error && error.message.includes('riders')) {
      const fallbackRes = await supabase
        .from('activities')
        .insert({
          visit_id: activeVisit.id,
          rideName,
          waitTimeMinutes: waitMins,
          notes: notesVal
        })
        .select()
        .single();

      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      setErrorMessage("Error adding attraction: " + error.message);
      return;
    }

    const newActivity: Activity = {
      id: data.id,
      visit_id: activeVisit.id,
      rideName,
      waitTimeMinutes: waitMins,
      notes: notesVal,
      riders: selectedRiders
    };

    setActiveVisit({ ...activeVisit, activities: [...activeVisit.activities, newActivity] });
    setWaitTime('');
    setCharacterName('');
  };

  const fetchRideTrivia = async (attractionName: string, park: string) => {
    setTriviaLoading(true);
    const localFact = getRideTriviaFact(attractionName, park);
    setRideTrivia(localFact);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!apiKey) {
      setTriviaLoading(false);
      return;
    }

    try {
      const promptText = `Provide 1 short, fun, surprising Disney Imagineering secret fact or hidden detail for waiting in line at "${attractionName}" in ${park}. Keep it cheerful and under 50 words.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) setRideTrivia(text);
      }
    } catch (err) {
    } finally {
      setTriviaLoading(false);
    }
  };

  const fetchHiddenMickey = async (attractionName: string, park: string) => {
    setMickeyLoading(true);
    const localMickey = getHiddenMickeyFact(attractionName, park);
    setHiddenMickey(localMickey);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!apiKey) {
      setMickeyLoading(false);
      return;
    }

    try {
      const promptText = `Where is a specific Hidden Mickey in "${attractionName}" at ${park} in Walt Disney World? Provide 1 specific, concise, fun location hint under 40 words.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) setHiddenMickey(text);
      }
    } catch (err) {
    } finally {
      setMickeyLoading(false);
    }
  };

  const handleStartQueueTimer = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
    setQueueStartTimestamp(now.getTime());
    setQueueStartTimeStr(timeString);
    if (activeVisit) {
      fetchRideTrivia(rideName, activeVisit.parkName);
      fetchHiddenMickey(rideName, activeVisit.parkName);
    }
  };

  const handleEndQueueTimer = async () => {
    if (!activeVisit || !queueStartTimestamp) return;
    const nowMs = Date.now();
    const diffMs = nowMs - queueStartTimestamp;
    let calculatedWait = Math.round(diffMs / 60000);
    if (calculatedWait <= 0) calculatedWait = 1;

    const notesVal = rideName === 'Character Meeting' && characterName ? characterName : undefined;
    const ridersStr = selectedRiders.join(', ');

    const supabase = await getSupabase();
    let { data, error } = await supabase
      .from('activities')
      .insert({
        visit_id: activeVisit.id,
        rideName,
        waitTimeMinutes: calculatedWait,
        notes: notesVal,
        riders: ridersStr
      })
      .select()
      .single();

    if (error && error.message.includes('riders')) {
      const fallbackRes = await supabase
        .from('activities')
        .insert({
          visit_id: activeVisit.id,
          rideName,
          waitTimeMinutes: calculatedWait,
          notes: notesVal
        })
        .select()
        .single();

      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      alert("Error logging timer activity: " + error.message);
      return;
    }

    const newActivity: Activity = {
      id: data.id,
      visit_id: activeVisit.id,
      rideName,
      waitTimeMinutes: calculatedWait,
      notes: notesVal,
      riders: selectedRiders
    };

    setActiveVisit({ ...activeVisit, activities: [...activeVisit.activities, newActivity] });
    setQueueStartTimestamp(null);
    setQueueStartTimeStr(null);
    setCharacterName('');
    setWaitTime('');
    setRideTrivia(null);
    setHiddenMickey(null);
  };

  const startEditing = (activity: Activity, visitId: string | null) => {
    setEditingActivityId(activity.id);
    setEditingVisitId(visitId);
    setEditRideName(activity.rideName);
    setEditWaitTime(activity.waitTimeMinutes.toString());
    setEditNotes(activity.notes || '');

    let currentParty: string[] = [];
    if (visitId === null && activeVisit) {
      currentParty = parseAttendees(activeVisit.attendees);
    } else {
      const foundV = visits.find(v => v.id === visitId);
      if (foundV) currentParty = parseAttendees(foundV.attendees);
    }

    const existingRiders = parseAttendees(activity.riders);
    setEditRiders(existingRiders.length > 0 ? existingRiders : currentParty);
  };

  const cancelEditing = () => {
    setEditingActivityId(null);
    setEditingVisitId(null);
  };

  const saveEditedActivity = async () => {
    if (!editingActivityId) return;

    const waitMins = parseInt(editWaitTime) || 0;
    const notesVal = editNotes.trim() ? editNotes : null;
    const ridersStr = editRiders.join(', ');

    const supabase = await getSupabase();
    let { error } = await supabase
      .from('activities')
      .update({
        rideName: editRideName,
        waitTimeMinutes: waitMins,
        notes: notesVal,
        riders: ridersStr
      })
      .eq('id', editingActivityId);

    if (error && error.message.includes('riders')) {
      const fallbackRes = await supabase
        .from('activities')
        .update({
          rideName: editRideName,
          waitTimeMinutes: waitMins,
          notes: notesVal
        })
        .eq('id', editingActivityId);

      error = fallbackRes.error;
    }

    if (error) {
      setErrorMessage("Error saving edits: " + error.message);
      return;
    }

    await fetchCloudVisits();
    cancelEditing();
  };

  const deleteActivity = async (activityId: string) => {
    const supabase = await getSupabase();
    const { error } = await supabase.from('activities').delete().eq('id', activityId);
    if (error) {
      setErrorMessage("Error deleting entry: " + error.message);
      return;
    }

    await fetchCloudVisits();
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

    const rawAttendeesStr = parseAttendees(editingVisit.attendees).join(', ');
    const endTimesJson = JSON.stringify(editVisitMemberEndTimes);
    const startTimesJson = JSON.stringify(editVisitMemberStartTimes);
    const dbAttendeesPayload = `${rawAttendeesStr}|ENDTIMES:${endTimesJson}|STARTTIMES:${startTimesJson}`;

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('visits')
        .update({
          startTime: editVisitStartTime,
          endTime: editVisitEndTime,
          attendees: dbAttendeesPayload
        })
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
    const now = new Date();
    const endTime = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });

    const currentActive = activePartyList;
    const leavingParty = checkoutType === 'everyone' ? currentActive : departingMembers;
    const remainingActive = currentActive.filter(m => !leavingParty.includes(m));

    const updatedEndTimes: Record<string, string> = {
      ...(activeVisit.memberEndTimes || {})
    };
    leavingParty.forEach(m => {
      updatedEndTimes[m] = endTime;
    });

    const isVisitComplete = remainingActive.length === 0;
    const finalEndTime = isVisitComplete ? endTime : '';

    const rawAttendeesStr = parseAttendees(activeVisit.attendees).join(', ');
    const endTimesJson = JSON.stringify(updatedEndTimes);
    const startTimesJson = JSON.stringify(activeVisit.memberStartTimes || {});
    const dbAttendeesPayload = `${rawAttendeesStr}|ENDTIMES:${endTimesJson}|STARTTIMES:${startTimesJson}`;

    const supabase = await getSupabase();

    const { error } = await supabase
      .from('visits')
      .update({
        endTime: finalEndTime,
        attendees: dbAttendeesPayload
      })
      .eq('id', activeVisit.id);

    if (error) {
      setErrorMessage("Error saving departure time: " + error.message);
      return;
    }

    setShowCheckoutModal(false);
    await fetchCloudVisits();
    setQueueStartTimestamp(null);
    setQueueStartTimeStr(null);
    setRideTrivia(null);
    setHiddenMickey(null);
  };

  const deleteVisit = async (id: string) => {
    const confirmDelete = window.confirm("⚠️ Are you sure you want to delete this entire visit log? This action cannot be undone!");
    if (!confirmDelete) return;

    const supabase = await getSupabase();
    const { error } = await supabase.from('visits').delete().eq('id', id);
    if (error) {
      setErrorMessage("Error deleting visit: " + error.message);
      return;
    }
    await fetchCloudVisits();
  };

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
    const confirmDel = window.confirm("Are you sure you want to delete this photo grid?");
    if (!confirmDel) return;

    try {
      const supabase = await getSupabase();
      await supabase.from('photo_grids').delete().eq('id', id);
      setLightboxGrid(null);
      await fetchPhotoGrids();
    } catch (err: any) {
      alert("Error deleting image: " + err.message);
    }
  };

  const getElapsedQueueTimeString = () => {
    if (!queueStartTimestamp) return '';
    const diffSeconds = Math.max(0, Math.floor((nowTimestamp - queueStartTimestamp) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins} mins ${secs > 0 ? `${secs}s` : ''}`;
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '15px 15px 30px 15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1A202C', background: '#FAFAFA', minHeight: '100vh' }}>

      {/* HEADER */}
      <Header mainTab={mainTab} setMainTab={setMainTab} />

      {/* ERROR BANNER */}
      {errorMessage && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', padding: '10px 14px', borderRadius: '12px', color: '#C53030', fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', color: '#C53030', fontWeight: '900', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* SUBHEADER MENU */}
      <Subheader
        mainTab={mainTab}
        trackerSubTab={trackerSubTab}
        setTrackerSubTab={setTrackerSubTab}
        analyticsSubTab={analyticsSubTab}
        setAnalyticsSubTab={setAnalyticsSubTab}
        rainbowSubTab={rainbowSubTab}
        setRainbowSubTab={setRainbowSubTab}
      />

      {/* ATTENDEE FILTER WIDGET */}
      {(mainTab === 'checklist' || (mainTab === 'analytics' && analyticsSubTab !== 'cards')) && (
        <AttendeeFilter selectedAttendee={selectedAttendee} setSelectedAttendee={setSelectedAttendee} />
      )}

      {/* TAB VIEWS */}
      {mainTab === 'tracker' && (
        <TrackerTab
          trackerSubTab={trackerSubTab}
          activeVisit={activeVisit}
          parkName={parkName}
          setParkName={setParkName}
          selectedAttendees={selectedAttendees}
          toggleCheckInAttendee={toggleCheckInAttendee}
          handleCheckIn={handleCheckIn}
          activePartyList={activePartyList}
          rideName={rideName}
          setRideName={setRideName}
          waitTime={waitTime}
          setWaitTime={setWaitTime}
          characterName={characterName}
          setCharacterName={setCharacterName}
          selectedRiders={selectedRiders}
          toggleRiderSelection={toggleRiderSelection}
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
          toggleEditRiderSelection={toggleEditRiderSelection}
          startEditing={startEditing}
          cancelEditing={cancelEditing}
          saveEditedActivity={saveEditedActivity}
          deleteActivity={deleteActivity}
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

      {mainTab === 'checklist' && (
        <ChecklistTab rideCountsMap={rideCountsMap} />
      )}

      {mainTab === 'rainbow' && (
        <RainbowTab
          rainbowSubTab={rainbowSubTab}
          filterPhotographer={filterPhotographer}
          setFilterPhotographer={setFilterPhotographer}
          filterPark={filterPark}
          setFilterPark={setFilterPark}
          filterColor={filterColor}
          setFilterColor={setFilterColor}
          badgePhotographer={badgePhotographer}
          setBadgePhotographer={setBadgePhotographer}
          filteredPhotos={filteredPhotos}
          photoLoading={photoLoading}
          photoGrids={photoGrids}
          setLightboxGrid={setLightboxGrid}
          setUploadUser={setUploadUser}
          setUploadPark={setUploadPark}
          setUploadColor={setUploadColor}
          setUploadModalOpen={setUploadModalOpen}
        />
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
