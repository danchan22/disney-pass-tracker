'use client';

import React, { useState, useEffect, useMemo } from 'react';

// --- SAFE DYNAMIC SUPABASE CLIENT WRAPPER ---
let supabaseInstance: any = null;

const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined' && (window as any).supabase) {
    supabaseInstance = (window as any).supabase.createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  }

  try {
    // @ts-ignore
    const supabaseModule = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    if (supabaseModule && supabaseModule.createClient) {
      supabaseInstance = supabaseModule.createClient(supabaseUrl, supabaseAnonKey);
      return supabaseInstance;
    }
  } catch (e) {
    console.warn("CDN import fallback:", e);
  }

  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'mock-id' }, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ publicUrl: `https://mock.supabase.co/storage/v1/object/public/${path}` })
      })
    }
  };
};

// --- TYPES ---
interface Activity {
  id: string;
  visit_id: string;
  rideName: string;
  waitTimeMinutes: number;
  notes?: string;
  riders?: string | string[];
}

interface Visit {
  id: string;
  parkName: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  visitDate: string;
  startTime: string;
  endTime?: string;
  attendees?: string | string[];
  memberEndTimes?: Record<string, string>;
  notes?: string;
  activities: Activity[];
}

export interface PhotoGridRecord {
  id: string;
  user_name: string;
  park_name: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  color: string;
  image_url: string;
  caption?: string;
  created_at?: string;
}

// --- FIXED CONSTANTS ---
const FIXED_FAMILY_MEMBERS = ['Dan', 'Mandie', 'Elijah', 'Sophia', 'Sam', 'Andrew'];
const UNIVERSAL_ACTIVITIES = ['Character Meeting', 'Parade', 'Fireworks Show', 'Other / Show / Food'];

const PARK_EMOJIS: Record<string, string> = {
  'Magic Kingdom': '🏰',
  'Epcot': '🪩',
  'Hollywood Studios': '🎥',
  'Animal Kingdom': '🌳',
};

const PARK_NAMES: ('Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom')[] = [
  'Magic Kingdom', 'Epcot', 'Hollywood Studios', 'Animal Kingdom'
];

const RAINBOW_COLORS: { name: string; hex: string; textHex: string; borderHex: string; bgTint: string }[] = [
  { name: 'Red', hex: '#E53E3E', textHex: '#C53030', borderHex: '#E53E3E', bgTint: '#FFF5F5' },
  { name: 'Orange', hex: '#DD6B20', textHex: '#C05621', borderHex: '#DD6B20', bgTint: '#FFFAF0' },
  { name: 'Yellow', hex: '#D69E2E', textHex: '#B7791F', borderHex: '#D69E2E', bgTint: '#FFFFF0' },
  { name: 'Green', hex: '#38A169', textHex: '#276749', borderHex: '#38A169', bgTint: '#F0FFF4' },
  { name: 'Blue', hex: '#3182CE', textHex: '#2B6CB0', borderHex: '#3182CE', bgTint: '#EBF8FF' },
  { name: 'Purple', hex: '#805AD5', textHex: '#6B46C1', borderHex: '#805AD5', bgTint: '#FAF5FF' },
  { name: 'White', hex: '#FFFFFF', textHex: '#2D3748', borderHex: '#CBD5E0', bgTint: '#FFFFFF' },
  { name: 'Black', hex: '#1A202C', textHex: '#2D3748', borderHex: '#1A202C', bgTint: '#EDF2F7' },
];

const PARK_ATTRACTIONS: Record<string, string[]> = {
  'Magic Kingdom': [
    'Astro Orbiter', 'The Barnstormer', 'Big Thunder Mountain Railroad', 'Buzz Lightyear’s Space Ranger Spin',
    'Carousel of Progress', 'Country Bear Musical Jamboree', 'Dumbo the Flying Elephant', 'Enchanted Tales with Belle',
    'The Hall of Presidents', 'Haunted Mansion', '“it’s a small world”', 'Jungle Cruise', 'Mad Tea Party',
    'The Magic Carpets of Aladdin', 'The Many Adventures of Winnie the Pooh', 'Mickey’s PhilharMagic',
    'Peter Pan’s Flight', 'Pirates of the Caribbean', 'Prince Charming Regal Carrousel', 'Seven Dwarfs Mine Train',
    'Space Mountain', 'Swiss Family Treehouse', 'Tiana’s Bayou Adventure', 'Tomorrowland Speedway',
    'Tomorrowland Transit Authority PeopleMover', 'TRON Lightcycle / Run', 'Under the Sea ~ Journey of The Little Mermaid',
    'Walt Disney Enchanted Tiki Room', 'Walt Disney World Railroad'
  ],
  'Epcot': [
    'Beauty and the Beast Sing-Along', 'Canada Circle-Vision 360', 'Disney and Pixar Short Film Festival',
    'Frozen Ever After', 'Gran Fiesta Tour Starring The Three Caballeros', 'Guardians of the Galaxy: Cosmic Rewind',
    'ImageWorks What If Labs', 'Journey into Imagination with Figment', 'Journey of Water, Inspired by Moana',
    'Living with the Land', 'Mission: SPACE (Green)', 'Mission: SPACE (Orange)', 'Reflections of China',
    'Remy’s Ratatouille Adventure', 'Soarin', 'Spaceship Earth', 'Test Track',
    'The Seas with Nemo & Friends', 'Turtle Talk with Crush'
  ],
  'Hollywood Studios': [
    'Alien Swirling Saucers', 'Beauty and the Beast Live on Stage', 'Disney Junior Play & Dance!',
    'Disney Villains: Unfairly Ever After', 'Fantasmic',
    'For the First Time in Forever: A Frozen Sing-Along Celebration', 'Indiana Jones Epic Stunt Spectacular!',
    'Mickey & Minnie’s Runaway Railway', 'Millennium Falcon: Smugglers Run',
    'Rock ’n’ Roller Coaster', 'Slinky Dog Dash', 'Star Tours – The Adventures Continue',
    'Star Wars: Rise of the Resistance', 'The Twilight Zone Tower of Terror', 'The Little Mermaid: A Musical Adventure',
    'Toy Story Mania!', 'Vacation Fun', 'Walt Disney Presents'
  ],
  'Animal Kingdom': [
    'Avatar Flight of Passage', 'Expedition Everest', 'Feathered Friends in Flight!',
    'Festival of the Lion King', 'Finding Nemo: The Big Blue... and Beyond!', 'Gorilla Falls Exploration Trail',
    'Kali River Rapids', 'Kilimanjaro Safaris', 'Maharajah Jungle Trek',
    'Na’vi River Journey', 'The Animation Experience at Conservation Station', 'Wildlife Express Train',
    'Zootopia: Better Together'
  ]
};

// --- TRIVIA & HIDDEN MICKEY DATABASES ---
const RIDE_TRIVIA_DB: Record<string, string[]> = {
  'Space Mountain': ['Astronaut Gordon Cooper served as a consultant on Space Mountain to make the launch feel like real spaceflight!'],
  'Haunted Mansion': ['The singing busts in the graveyard scene include Thurl Ravenscroft, who was also the voice of Tony the Tiger!'],
  'Big Thunder Mountain Railroad': ['The antique mining equipment scattered throughout the queue line was purchased as real 19th-century gold rush scrap metal.'],
  'Pirates of the Caribbean': ['The chess game between two skeletons in the queue is locked in an eternal stalemate!'],
  'TRON Lightcycle / Run': ['The canopy above TRON spans over 50,000 square feet with over 1,200 light fixtures!'],
  'Seven Dwarfs Mine Train': ['The animatronic figures in the cottage scene were recycled from the classic Snow White’s Scary Adventures attraction.'],
  'Guardians of the Galaxy: Cosmic Rewind': ['Features Disney’s first-ever reverse launch coaster and rotates 360 degrees to direct your eyes toward the story!'],
  'Spaceship Earth': ['The exterior geodesic sphere consists of 11,324 individual triangular tiles made of Alucobond!'],
  'Soarin': ['Each scene includes custom synchronized scents pumped through the seats, including fresh grass over Africa!'],
  'Star Wars: Rise of the Resistance': ['Rise of the Resistance uses three distinct ride system technologies: trackless vehicles, a motion simulator, and a drop tower!'],
};

const getRideTriviaFact = (rideName: string, parkName: string): string => {
  if (RIDE_TRIVIA_DB[rideName] && RIDE_TRIVIA_DB[rideName].length > 0) {
    return RIDE_TRIVIA_DB[rideName][0];
  }
  return `Did you know? Disney Imagineers hide unique details, props, and story clues throughout every line in ${parkName}!`;
};

const getHiddenMickeyFact = (rideName: string, parkName: string): string => {
  return `Keep an eye on queue walls, rusty gears, and floor tile patterns in ${rideName} for three circles forming a Mickey head!`;
};

// Helper: Parse attendees safely
const parseAttendees = (raw: string | string[] | undefined): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s => s.trim()).filter(Boolean);
  const attendeesPart = raw.split('|ENDTIMES:')[0];
  return attendeesPart.split(',').map(s => s.trim()).filter(Boolean);
};

// Helper: Parse memberEndTimes dictionary safely
const parseMemberEndTimes = (raw: any, notes?: string): Record<string, string> => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    if (raw.includes('|ENDTIMES:')) {
      try { return JSON.parse(raw.split('|ENDTIMES:')[1]); } catch (e) {}
    }
    if (raw.trim().startsWith('{')) {
      try { return JSON.parse(raw); } catch (e) {}
    }
  }
  if (notes && typeof notes === 'string' && notes.trim().startsWith('{')) {
    try { return JSON.parse(notes); } catch (e) {}
  }
  return {};
};

// --- CLIENT-SIDE IMAGE COMPRESSION HELPER ---
const compressImageToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Image compression failed'));
        },
        'image/webp',
        0.8
      );
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function DisneyTracker() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics' | 'ride-everything' | 'rainbow-challenge'>('tracker');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Global Attendee Filter State
  const [selectedAttendee, setSelectedAttendee] = useState<string>('ALL');

  // Check-In Form States
  const [parkName, setParkName] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  
  // Track Attraction States
  const [rideName, setRideName] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);

  // Live Queue Timer
  const [queueStartTimestamp, setQueueStartTimestamp] = useState<number | null>(null);
  const [queueStartTimeStr, setQueueStartTimeStr] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [rideTrivia, setRideTrivia] = useState<string | null>(null);
  const [hiddenMickey, setHiddenMickey] = useState<string | null>(null);

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
  const [editVisitMemberEndTimes, setEditVisitMemberEndTimes] = useState<Record<string, string>>({});

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [departingMembers, setDepartingMembers] = useState<string[]>([]);

  // 🌈 RAINBOW CHALLENGE STATE
  const [rainbowSubTab, setRainbowSubTab] = useState<'photos' | 'badges'>('photos');
  const [photoGrids, setPhotoGrids] = useState<PhotoGridRecord[]>([]);
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);

  // Rainbow Filters
  const [filterPhotographer, setFilterPhotographer] = useState<string>('ALL');
  const [filterPark, setFilterPark] = useState<string>('ALL');
  const [filterColor, setFilterColor] = useState<string>('ALL');
  const [badgePhotographer, setBadgePhotographer] = useState<string>('Dan');

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadUser, setUploadUser] = useState<string>('Dan');
  const [uploadPark, setUploadPark] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [uploadColor, setUploadColor] = useState<string>('Red');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [selectedGridFile, setSelectedGridFile] = useState<File | null>(null);
  const [uploadingGrid, setUploadingGrid] = useState<boolean>(false);

  // Lightbox State
  const [lightboxGrid, setLightboxGrid] = useState<PhotoGridRecord | null>(null);

  // Active party list
  const activePartyList = useMemo(() => {
    if (!activeVisit) return [];
    const allParty = parseAttendees(activeVisit.attendees);
    const endTimes = activeVisit.memberEndTimes || {};
    return allParty.filter(member => !endTimes[member]);
  }, [activeVisit]);

  useEffect(() => {
    if (activeVisit) {
      setSelectedRiders(activePartyList);
      setRideName(PARK_ATTRACTIONS[activeVisit.parkName]?.[0] || '');
      setDepartingMembers(activePartyList);
    }
  }, [activeVisit, activePartyList.length]);

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
      setErrorMessage("Could not load cloud visits.");
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
      console.warn("Could not fetch photo grids (table may need setup):", err);
    } finally {
      setPhotoLoading(false);
    }
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

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('color-grids')
        .upload(filePath, compressedBlob, { contentType: 'image/webp', upsert: true });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('color-grids').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // Insert record to photo_grids table
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

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const d = new Date(year, month - 1, day);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]} ${month}/${day}/${year.toString().slice(-2)}`;
  };

  const format12Hour = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const parseTimeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const [hrs, mins] = timeStr.split(':').map(Number);
    return (hrs * 60) + mins;
  };

  const calculateVisitDuration = (startTime: string, endTime?: string) => {
    if (!startTime || !endTime) return '';
    const startMins = parseTimeToMinutes(startTime);
    const endMins = parseTimeToMinutes(endTime);
    const diff = endMins >= startMins ? (endMins - startMins) : ((1440 - startMins) + endMins);
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs === 0) return `(${mins} min)`;
    return mins > 0 ? `(${hrs} hrs ${mins} min)` : `(${hrs} hrs)`;
  };

  const formatMinutes = (totalMins: number) => {
    if (totalMins <= 0) return '0m';
    const hrs = Math.floor(totalMins / 60);
    const remMins = Math.round(totalMins % 60);
    if (hrs === 0) return `${remMins}m`;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  };

  const getPersonEndTime = (v: Visit, person: string) => {
    if (v.memberEndTimes && v.memberEndTimes[person]) {
      return v.memberEndTimes[person];
    }
    return v.endTime || '';
  };

  const filteredVisits = useMemo(() => {
    if (selectedAttendee === 'ALL') return visits;
    return visits.filter(v => parseAttendees(v.attendees).includes(selectedAttendee));
  }, [visits, selectedAttendee]);

  const isPersonRider = (activity: Activity, visit: Visit, person: string) => {
    const activityRiders = parseAttendees(activity.riders);
    if (activityRiders.length > 0) return activityRiders.includes(person);
    return parseAttendees(visit.attendees).includes(person);
  };

  // Stats Calculations
  const totalDays = filteredVisits.length;
  
  const totalActivities = useMemo(() => {
    if (selectedAttendee === 'ALL') return filteredVisits.reduce((sum, v) => sum + v.activities.length, 0);
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
    return counts;
  };

  const rideCountsMap = getRideCountsMap(filteredVisits, selectedAttendee);

  // Filtered Photos for Rainbow Challenge
  const filteredPhotos = useMemo(() => {
    return photoGrids.filter(p => {
      if (filterPhotographer !== 'ALL' && p.user_name !== filterPhotographer) return false;
      if (filterPark !== 'ALL' && p.park_name !== filterPark) return false;
      if (filterColor !== 'ALL' && p.color !== filterColor) return false;
      return true;
    });
  }, [photoGrids, filterPhotographer, filterPark, filterColor]);

  // Handlers
  const toggleCheckInAttendee = (name: string) => {
    setSelectedAttendees(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  };

  const toggleRiderSelection = (name: string) => {
    if (selectedRiders.includes(name)) {
      if (selectedRiders.length === 1) return;
      setSelectedRiders(selectedRiders.filter(r => r !== name));
    } else {
      setSelectedRiders([...selectedRiders, name]);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA');
    const localTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newAttendeesList = selectedAttendees.length > 0 ? selectedAttendees : ['Just Me'];

    const supabase = await getSupabase();
    const { data, error } = await supabase.from('visits').insert({
      visitDate: localDate, startTime: localTime, endTime: '', parkName, attendees: newAttendeesList.join(', ')
    }).select().single();

    if (error) { setErrorMessage("Error checking in: " + error.message); return; }

    setActiveVisit({
      id: data.id, visitDate: localDate, startTime: localTime, endTime: '', parkName, attendees: newAttendeesList, memberEndTimes: {}, activities: []
    });
    setSelectedRiders(newAttendeesList);
    setDepartingMembers(newAttendeesList);
    setSelectedAttendees([]);
  };

  const handleAddRideLive = async () => {
    if (!activeVisit || !rideName) return;
    const waitMins = parseInt(waitTime) || 0;
    const notesVal = rideName === 'Character Meeting' && characterName ? characterName : undefined;
    const ridersStr = selectedRiders.join(', ');

    const supabase = await getSupabase();
    const { data, error } = await supabase.from('activities').insert({
      visit_id: activeVisit.id, rideName, waitTimeMinutes: waitMins, notes: notesVal, riders: ridersStr
    }).select().single();

    if (error) { setErrorMessage("Error adding attraction: " + error.message); return; }

    setActiveVisit({ ...activeVisit, activities: [...activeVisit.activities, { id: data.id, visit_id: activeVisit.id, rideName, waitTimeMinutes: waitMins, notes: notesVal, riders: selectedRiders }] });
    setWaitTime(''); setCharacterName('');
  };

  const handleStartQueueTimer = () => {
    const now = new Date();
    setQueueStartTimestamp(now.getTime());
    setQueueStartTimeStr(now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }));
    if (activeVisit) {
      setRideTrivia(getRideTriviaFact(rideName, activeVisit.parkName));
      setHiddenMickey(getHiddenMickeyFact(rideName, activeVisit.parkName));
    }
  };

  const handleEndQueueTimer = async () => {
    if (!activeVisit || !queueStartTimestamp) return;
    const diffMs = Date.now() - queueStartTimestamp;
    let calculatedWait = Math.max(1, Math.round(diffMs / 60000));
    const notesVal = rideName === 'Character Meeting' && characterName ? characterName : undefined;

    const supabase = await getSupabase();
    const { data, error } = await supabase.from('activities').insert({
      visit_id: activeVisit.id, rideName, waitTimeMinutes: calculatedWait, notes: notesVal, riders: selectedRiders.join(', ')
    }).select().single();

    if (error) { alert("Error saving timer: " + error.message); return; }

    setActiveVisit({ ...activeVisit, activities: [...activeVisit.activities, { id: data.id, visit_id: activeVisit.id, rideName, waitTimeMinutes: calculatedWait, notes: notesVal, riders: selectedRiders }] });
    setQueueStartTimestamp(null); setQueueStartTimeStr(null); setCharacterName(''); setWaitTime(''); setRideTrivia(null); setHiddenMickey(null);
  };

  const processCheckout = async (checkoutType: 'selected' | 'everyone') => {
    if (!activeVisit) return;
    const endTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const currentActive = activePartyList;
    const leavingParty = checkoutType === 'everyone' ? currentActive : departingMembers;
    const remainingActive = currentActive.filter(m => !leavingParty.includes(m));

    const updatedEndTimes = { ...(activeVisit.memberEndTimes || {}) };
    leavingParty.forEach(m => { updatedEndTimes[m] = endTime; });

    const finalEndTime = remainingActive.length === 0 ? endTime : '';
    const rawAttendeesStr = parseAttendees(activeVisit.attendees).join(', ');
    const attendeesWithEndTimes = `${rawAttendeesStr}|ENDTIMES:${JSON.stringify(updatedEndTimes)}`;

    const supabase = await getSupabase();
    const { error } = await supabase.from('visits').update({ endTime: finalEndTime, attendees: attendeesWithEndTimes }).eq('id', activeVisit.id);

    if (error) { setErrorMessage("Error saving departure time: " + error.message); return; }

    setShowCheckoutModal(false);
    await fetchCloudVisits();
  };

  const getElapsedQueueTimeString = () => {
    if (!queueStartTimestamp) return '';
    const diffSecs = Math.max(0, Math.floor((nowTimestamp - queueStartTimestamp) / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return mins === 0 ? `${secs}s` : `${mins}m ${secs}s`;
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1A202C', background: '#FAFAFA', minHeight: '100vh' }}>
      
      {/* 🏰 HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '15px', padding: '10px 0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#004487', letterSpacing: '-0.5px', margin: '0 0 4px 0' }}>🏰 My Annual Pass Tracker</h1>
        <p style={{ color: '#D4AF37', margin: 0, fontSize: '15px', fontWeight: '600', fontStyle: 'italic' }}>Shared Cloud Sync Active ☁️</p>
      </header>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', padding: '12px', borderRadius: '12px', color: '#C53030', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', color: '#C53030', fontWeight: '900', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 👤 GLOBAL ATTENDEE FILTER BAR */}
      {activeTab !== 'rainbow-challenge' && (
        <div style={{ background: '#FFF', padding: '10px 14px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <label style={{ fontSize: '12px', fontWeight: '800', color: '#4A5568' }}>👤 Filter by Attendee:</label>
          <select value={selectedAttendee} onChange={(e) => setSelectedAttendee(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E0', background: '#F8FAFC', fontWeight: '700', fontSize: '13px', color: '#004487', cursor: 'pointer' }}>
            <option value="ALL">Everyone (All Data)</option>
            {FIXED_FAMILY_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* 🗂️ MAIN TABS */}
      <div style={{ display: 'flex', background: '#E2E8F0', padding: '4px', borderRadius: '12px', marginBottom: '20px', gap: '2px' }}>
        <button onClick={() => setActiveTab('tracker')} style={{ flex: 1, padding: '10px 2px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', background: activeTab === 'tracker' ? '#004487' : 'transparent', color: activeTab === 'tracker' ? '#FFF' : '#4A5568' }}>Live Companion</button>
        <button onClick={() => setActiveTab('analytics')} style={{ flex: 1, padding: '10px 2px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', background: activeTab === 'analytics' ? '#004487' : 'transparent', color: activeTab === 'analytics' ? '#FFF' : '#4A5568' }}>Analytics</button>
        <button onClick={() => setActiveTab('ride-everything')} style={{ flex: 1, padding: '10px 2px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', background: activeTab === 'ride-everything' ? '#004487' : 'transparent', color: activeTab === 'ride-everything' ? '#FFF' : '#4A5568' }}>Ride Everything</button>
        <button onClick={() => setActiveTab('rainbow-challenge')} style={{ flex: 1, padding: '10px 2px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', background: activeTab === 'rainbow-challenge' ? '#004487' : 'transparent', color: activeTab === 'rainbow-challenge' ? '#FFF' : '#4A5568' }}>Rainbow Challenge</button>
      </div>

      {/* 🟢 TAB 1: LIVE COMPANION */}
      {activeTab === 'tracker' && (
        <div>
          {activeVisit ? (
            <div style={{ background: 'linear-gradient(135deg, #0056b3 0%, #003366 100%)', color: '#FFF', padding: '20px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 8px 24px rgba(0, 51, 102, 0.25)', border: '2px solid #D4AF37' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ background: '#D4AF37', color: '#003366', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>✨ CURRENTLY AT</span>
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '25px', fontWeight: '900' }}>{PARK_EMOJIS[activeVisit.parkName]} {activeVisit.parkName}</h2>
              <div style={{ fontSize: '13px', color: '#E2E8F0', marginBottom: '8px', fontWeight: '600' }}>
                📅 {formatDisplayDate(activeVisit.visitDate)} &nbsp;•&nbsp; ⏰ Arrived: <strong>{format12Hour(activeVisit.startTime)}</strong>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>👥 <strong>Active Party:</strong> {activePartyList.join(', ')}</p>

              {/* TRACK ATTRACTION */}
              <div style={{ background: '#FFF', padding: '16px', borderRadius: '18px', marginBottom: '15px', color: '#1A202C' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#004487' }}>Track an Attraction:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select value={rideName} onChange={(e) => setRideName(e.target.value)} disabled={!!queueStartTimestamp} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }}>
                    <optgroup label="Park Rides & Shows">
                      {PARK_ATTRACTIONS[activeVisit.parkName].map((att) => <option key={att} value={att}>{att}</option>)}
                    </optgroup>
                    <optgroup label="Events & Activities">
                      {UNIVERSAL_ACTIVITIES.map((act) => <option key={act} value={act}>{act}</option>)}
                    </optgroup>
                  </select>

                  {queueStartTimestamp ? (
                    <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', padding: '14px', borderRadius: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#C05621' }}>⏱️ LIVE QUEUE TIMER RUNNING</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '6px' }}>Entered line at: <strong style={{ color: '#004487' }}>{queueStartTimeStr}</strong></div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#C05621', margin: '8px 0' }}>Time in line: {getElapsedQueueTimeString()}</div>
                      
                      <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', padding: '10px', borderRadius: '10px', textAlign: 'left', fontSize: '12px', color: '#22543D', marginTop: '10px' }}>
                        <strong>✨ Disney Fun Fact:</strong>
                        <div>{rideTrivia}</div>
                      </div>

                      <div style={{ background: '#F0F5FF', border: '1px solid #C3DAFE', padding: '10px', borderRadius: '10px', textAlign: 'left', fontSize: '12px', color: '#1A365D', marginTop: '8px' }}>
                        <strong>👀 Hidden Mickeys:</strong>
                        <div>{hiddenMickey}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="button" onClick={() => { setQueueStartTimestamp(null); setQueueStartTimeStr(null); }} style={{ flex: 1, padding: '10px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Cancel</button>
                        <button type="button" onClick={handleEndQueueTimer} style={{ flex: 2, padding: '10px', background: '#38A169', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>✅ On Ride Now!</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button type="button" onClick={handleStartQueueTimer} style={{ width: '100%', padding: '12px', background: '#004487', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>⏱️ Start Line Timer</button>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" placeholder="Enter wait time (mins)" value={waitTime} onChange={(e) => setWaitTime(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E0' }} />
                        <button type="button" onClick={handleAddRideLive} style={{ padding: '11px 22px', background: '#EDF2F7', color: '#2D3748', border: '1px solid #CBD5E0', borderRadius: '10px', fontWeight: 'bold' }}>Log</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={() => { setDepartingMembers(activePartyList); setShowCheckoutModal(true); }} style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #E53E3E, #C53030)', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                👋 Leave Park
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} style={{ background: '#FFF', padding: '22px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ marginTop: 0, fontSize: '19px', fontWeight: '800', color: '#004487', marginBottom: '15px', textAlign: 'center' }}>✨ Enter the Magic</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>SELECT PARK</label>
                <select value={parkName} onChange={(e) => setParkName(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E0', fontSize: '16px', fontWeight: '700', color: '#004487' }}>
                  {PARK_NAMES.map(p => <option key={p} value={p}>{PARK_EMOJIS[p]} {p}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>WHO'S ATTENDING?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {FIXED_FAMILY_MEMBERS.map(name => {
                    const isSelected = selectedAttendees.includes(name);
                    return (
                      <button key={name} type="button" onClick={() => toggleCheckInAttendee(name)} style={{ padding: '10px 4px', borderRadius: '10px', border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0', background: isSelected ? '#004487' : '#FFF', color: isSelected ? '#FFF' : '#2D3748', fontSize: '13px', fontWeight: isSelected ? '800' : '500' }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0066cc 0%, #004487 100%)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                🚀 Check In to Park
              </button>
            </form>
          )}

          {/* TOTALS SUMMARY */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0' }}>TOTALS {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#004487' }}>{totalDays}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096' }}>PARK VISITS</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#38A169' }}>{totalActivities}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096' }}>TOTAL ACTIVITIES</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📊 TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#004487', margin: '0 0 15px 0' }}>🎢 Top Ridden Attractions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mostTimesRidden.map((ride, idx) => (
              <div key={ride.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '13px' }}>{idx + 1}. {ride.name}</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>{PARK_EMOJIS[ride.park]} {ride.park}</div>
                </div>
                <div style={{ background: '#EBF8FF', color: '#2B6CB0', padding: '4px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>
                  {ride.count}x
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🎡 TAB 3: RIDE EVERYTHING */}
      {activeTab === 'ride-everything' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PARK_NAMES.map(park => {
            const attractions = PARK_ATTRACTIONS[park];
            const doneCount = attractions.filter(att => (rideCountsMap[att] || 0) > 0).length;
            const pct = Math.round((doneCount / attractions.length) * 100);

            return (
              <div key={park} style={{ background: '#FFF', borderRadius: '20px', padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: '#004487', fontSize: '15px' }}>{PARK_EMOJIS[park]} {park}</strong>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#D4AF37' }}>{doneCount}/{attractions.length} ({pct}%)</span>
                </div>
                <div style={{ height: '6px', background: '#EDF2F7', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#004487' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🌈 TAB 4: RAINBOW CHALLENGE */}
      {activeTab === 'rainbow-challenge' && (
        <div>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px', background: '#FFF', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#004487', margin: '0 0 4px 0' }}>Rainbow Challenge</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#718096', fontWeight: '500' }}>Create a 3x3 photo grid of each color</p>

            {/* Sub-Tabs (Photos / Badges - No Icons) */}
            <div style={{ display: 'flex', background: '#EDF2F7', padding: '3px', borderRadius: '10px', marginTop: '14px' }}>
              <button onClick={() => setRainbowSubTab('photos')} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', background: rainbowSubTab === 'photos' ? '#004487' : 'transparent', color: rainbowSubTab === 'photos' ? '#FFF' : '#4A5568' }}>Photos</button>
              <button onClick={() => setRainbowSubTab('badges')} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', background: rainbowSubTab === 'badges' ? '#004487' : 'transparent', color: rainbowSubTab === 'badges' ? '#FFF' : '#4A5568' }}>Badges</button>
            </div>
          </div>

          {/* SUB-TAB 1: PHOTOS STREAM */}
          {rainbowSubTab === 'photos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* FILTERS */}
              <div style={{ background: '#FFF', padding: '14px', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Photographer Filter */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>PHOTOGRAPHER</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {FIXED_FAMILY_MEMBERS.map(m => (
                      <button key={m} onClick={() => setFilterPhotographer(prev => prev === m ? 'ALL' : m)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: filterPhotographer === m ? '2px solid #004487' : '1px solid #CBD5E0', background: filterPhotographer === m ? '#004487' : '#FFF', color: filterPhotographer === m ? '#FFF' : '#4A5568', cursor: 'pointer' }}>{m}</button>
                    ))}
                  </div>
                </div>

                {/* Park Filter */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>PARK</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {PARK_NAMES.map(p => (
                      <button key={p} onClick={() => setFilterPark(prev => prev === p ? 'ALL' : p)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: filterPark === p ? '2px solid #004487' : '1px solid #CBD5E0', background: filterPark === p ? '#004487' : '#FFF', color: filterPark === p ? '#FFF' : '#4A5568', cursor: 'pointer' }}>{PARK_EMOJIS[p]} {p}</button>
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>COLOR</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {RAINBOW_COLORS.map(c => {
                      const isSel = filterColor === c.name;
                      return (
                        <button key={c.name} onClick={() => setFilterColor(prev => prev === c.name ? 'ALL' : c.name)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: isSel ? `2px solid ${c.name === 'White' ? '#A0AEC0' : c.hex}` : '1px solid #CBD5E0', background: isSel ? c.hex : c.bgTint, color: isSel ? (c.name === 'White' ? '#1A202C' : '#FFF') : c.textHex, cursor: 'pointer' }}>{c.name}</button>
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
                        <span style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '12px', background: colorConfig.hex, color: '#FFF' }}>
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

          {/* SUB-TAB 2: BADGES GRID */}
          {rainbowSubTab === 'badges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* PHOTOGRAPHER SELECTOR */}
              <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>PHOTOGRAPHER</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {FIXED_FAMILY_MEMBERS.map(m => (
                    <button key={m} onClick={() => setBadgePhotographer(m)} style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', border: badgePhotographer === m ? '2px solid #004487' : '1px solid #CBD5E0', background: badgePhotographer === m ? '#004487' : '#FFF', color: badgePhotographer === m ? '#FFF' : '#4A5568', cursor: 'pointer' }}>{m}</button>
                  ))}
                </div>
              </div>

              {/* 4 PARK BADGE BOXES */}
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

                    {/* SQUARES GRID */}
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
      )}

      {/* UPLOAD GRID MODAL */}
      {uploadModalOpen && (
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
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>3x3 GRID IMAGE</label>
                <input type="file" accept="image/*" onChange={(e) => setSelectedGridFile(e.target.files?.[0] || null)} required style={{ width: '100%', fontSize: '12px' }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '4px' }}>CAPTION (OPTIONAL)</label>
                <input type="text" placeholder="Short note..." value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setUploadModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#EDF2F7', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" disabled={uploadingGrid || !selectedGridFile} style={{ flex: 2, padding: '12px', background: '#004487', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', opacity: uploadingGrid ? 0.6 : 1 }}>
                  {uploadingGrid ? 'Compressing & Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxGrid && (
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
      )}

      {/* 👋 STAGGERED CHECK-OUT MODAL */}
      {showCheckoutModal && activeVisit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '22px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#004487' }}>👋 Leaving the Park</h3>
            <p style={{ fontSize: '13px', color: '#4A5568', margin: '0 0 16px 0' }}>Who is departing right now?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {activePartyList.map(member => {
                const isSelected = departingMembers.includes(member);
                return (
                  <button key={member} type="button" onClick={() => setDepartingMembers(prev => prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member])} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', border: isSelected ? '2px solid #E53E3E' : '1px solid #CBD5E0', background: isSelected ? '#FFF5F5' : '#F8FAFC', color: isSelected ? '#C53030' : '#4A5568', fontWeight: '700', cursor: 'pointer' }}>
                    <span>👤 {member}</span>
                    <span>{isSelected ? '🚪 Leaving' : '🏰 Staying'}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button type="button" onClick={() => processCheckout('selected')} style={{ padding: '12px', background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Check Out Selected ({departingMembers.length})</button>
              <button type="button" onClick={() => processCheckout('everyone')} style={{ padding: '10px', background: '#EDF2F7', color: '#2D3748', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Check Out Everyone</button>
              <button type="button" onClick={() => setShowCheckoutModal(false)} style={{ padding: '8px', background: 'none', border: 'none', color: '#718096', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
