'use client';

import React, { useState, useEffect, useMemo } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: any = null;

const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  if (typeof window !== 'undefined') {
    if ((window as any).supabase?.createClient) {
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
    } catch (err) {
      console.warn('CDN ESM import fallback:', err);
    }
  }
  return null;
};

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
  activities: Activity[];
}

const FIXED_FAMILY_MEMBERS = ['Dan', 'Mandie', 'Elijah', 'Sophia', 'Sam', 'Andrew'];
const UNIVERSAL_ACTIVITIES = ['Character Meeting', 'Parade', 'Fireworks Show', 'Other / Show / Food'];

const PARK_EMOJIS: Record<string, string> = {
  'Magic Kingdom': '🏰',
  'Epcot': '🪩',
  'Hollywood Studios': '🎥',
  'Animal Kingdom': '🌳',
};

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
    'Remy’s Ratatouille Adventure', 'Soarin', 'Soarin’ Around the World', 'Spaceship Earth', 'Test Track',
    'The Seas with Nemo & Friends', 'Turtle Talk with Crush'
  ],
  'Hollywood Studios': [
    'Alien Swirling Saucers', 'Beauty and the Beast Live on Stage', 'Disney Junior Play & Dance!',
    'Disney Villains: Unfairly Ever After', 'Fantasmic',
    'For the First Time in Forever: A Frozen Sing-Along Celebration', 'Indiana Jones Epic Stunt Spectacular!',
    'Lightning McQueen’s Racing Academy', 'Mickey & Minnie’s Runaway Railway', 'Millennium Falcon: Smugglers Run',
    'Rock ’n’ Roller Coaster Starring Aerosmith', 'Slinky Dog Dash', 'Star Tours – The Adventures Continue',
    'Star Wars: Rise of the Resistance', 'The Twilight Zone Tower of Terror', 'The Little Mermaid: A Musical Adventure',
    'Toy Story Mania!', 'Vacation Fun', 'Walt Disney Presents'
  ],
  'Animal Kingdom': [
    'Avatar Flight of Passage', 'DINOSAUR', 'Expedition Everest', 'Feathered Friends in Flight!',
    'Festival of the Lion King', 'Finding Nemo: The Big Blue... and Beyond!', 'Gorilla Falls Exploration Trail',
    'It’s Tough to be a Bug!', 'Kali River Rapids', 'Kilimanjaro Safaris', 'Maharajah Jungle Trek',
    'Na’vi River Journey', 'The Animation Experience at Conservation Station', 'Wildlife Express Train',
    'Zootopia: Better Together'
  ]
};

const RIDE_TRIVIA_DB: Record<string, string[]> = {
  'Space Mountain': [
    'Did you know? Astronaut Gordon Cooper served as a consultant on Space Mountain to make the launch feel like real spaceflight!',
    'Look closely in the queue star maps: you can find references to "Disney Skyway" and classic extinct Disney attractions disguised as star constellations.'
  ],
  'Haunted Mansion': [
    'The singing busts in the graveyard scene include Thurl Ravenscroft, who was also the iconic voice of Tony the Tiger ("They\'re Grrreat!")!',
    'The queue features interactive tombstones with musical instruments that play tunes when touched.'
  ],
  'Big Thunder Mountain Railroad': [
    'The antique mining equipment scattered throughout the queue line was purchased as real 19th-century gold rush scrap metal from auctions across the US!',
    'The town in the ride backstory is named Tumbleweed, and the runaway train company is Barnabas T. Bullion!'
  ],
  'Pirates of the Caribbean': [
    'The chess game between two skeletons in the queue is locked in an eternal stalemate—neither player can ever win!',
    'Paul Frees, who voiced the Ghost Host in Haunted Mansion, also voices several iconic pirates on this ride.'
  ],
  'TRON Lightcycle / Run': [
    'The canopy above TRON is called the "Shifting Seat" or "Color-Changing Canopy" and spans over 50,000 square feet with over 1,200 light fixtures!',
    'TRON is one of the fastest roller coasters in any Disney park worldwide, reaching speeds up to 50+ mph.'
  ],
  'Seven Dwarfs Mine Train': [
    'The interactive jewels game in the queue uses real projection-mapped water that reacts when you drag your hands through it!',
    'The animatronic figures of Grumpy, Doc, Happy, Sleepy, and Bashful in the final cottage scene were recycled from the classic Snow White’s Scary Adventures attraction.'
  ],
  'Guardians of the Galaxy: Cosmic Rewind': [
    'Cosmic Rewind features Disney’s first-ever reverse launch coaster and rotates 360 degrees to direct your eyes toward the story action!',
    'The Wonders of Xandar pavilion queue features authentic props and video cameos filmed specifically by the original Guardians of the Galaxy movie cast.'
  ],
  'Spaceship Earth': [
    'The exterior geodesic sphere consists of 11,324 individual triangular tiles made of Alucobond, designed so rainwater drains down hidden channels into World Showcase lagoon!',
    'The papyrus-making scene in the queue uses authentic scents engineered by Imagineers to smell like real drying ink and ancient parchment.'
  ],
  'Soarin’ Around the World': [
    'Each scene in Soarin\' includes custom synchronized scents pumped through the seats, including fresh grass over Africa and sea breeze over Fiji!',
    'The flight motion simulator technology was originally invented by Imagineer Mark Sumner using an old Erector toy set.'
  ],
  'Frozen Ever After': [
    'The animatronics in Frozen Ever After were among the first in Walt Disney World to use rear-projection facial animation for hyper-expressive characters!',
    'The queue winds through Wandering Oaken’s Trading Post, where Oaken himself appears in the sauna window drawing hearts in the steam.'
  ],
  'Star Wars: Rise of the Resistance': [
    'Rise of the Resistance uses three distinct ride system technologies: trackless vehicles, a motion simulator, and a drop tower!',
    'There are over 50 Stormtroopers lined up in the Star Destroyer hangar bay, creating one of the most stunning scale reveals in theme park history.'
  ],
  'Millennium Falcon: Smugglers Run': [
    'The cockpit controls are fully functional—every button pushed or lever pulled during your flight directly affects your spaceship’s flight!',
    'While waiting in the main hold, you can sit at the actual Dejarik (holochess) table recreated down to the smallest paint scratch.'
  ],
  'The Twilight Zone Tower of Terror': [
    'The hotel lobby queue is filled with authentic 1930s antiques, including genuine sculptures and unread newspapers dated October 31, 1939.',
    'The elevator drops are completely randomized by a central computer—you never get the exact same drop pattern twice!'
  ],
  'Slinky Dog Dash': [
    'Look at the giant box in the queue: it\'s Andy\'s "Dash & Dodge Coaster Kit" which Andy assembled in his backyard using household toys!',
    'Rex stands atop towers of Jenga blocks held together with giant plastic Elmer’s glue bottles.'
  ],
  'Mickey & Minnie’s Runaway Railway': [
    'This was the first ride-through attraction in Disney history starring Mickey Mouse himself!',
    'The whistle sound effect used for the train is the exact original 1928 steam whistle recording used in Steamboat Willie.'
  ],
  'Avatar Flight of Passage': [
    'In the RDA lab queue scene, the full-scale Na’vi avatar floating inside the water tank actually breathes in real-time!',
    'The banshees you ride incorporate breathing bladders beneath your legs so you can feel the creature breathing beneath you during flight.'
  ],
  'Expedition Everest': [
    'At 199.5 feet tall, Expedition Everest is the tallest mountain peak in Walt Disney World—just 6 inches under the 200-foot FAA red beacon light requirement!',
    'The Yeti animatronic inside the mountain stands 25 feet tall and was built with the force of a 747 airliner engine.'
  ],
  'Kilimanjaro Safaris': [
    'The 110-acre safari reserve is so large that the entire Magic Kingdom park could easily fit inside it!',
    'Imagineers installed hidden climate-controlled rocks (heated in winter, cooled in summer) near truck pathways so animals relax near guests.'
  ],
  'DINOSAUR': [
    'The three pipes in the queue area are labeled with chemical formulas for Red, Yellow, and White mustard, ketchup, and mayonnaise—a nod to the ride’s sponsor, McDonald’s!',
    'The Carnotaurus animatronic in the climax was one of the largest and fastest-moving prehistoric animatronics ever constructed by Disney.'
  ],
  'The Barnstormer': [
    'The Barnstormer is themed around Goofy’s stunt plane show, featuring a giant wooden billboard that Goofy’s plane crashed straight through!',
    'The ride track was originally part of The Great Goofini’s Wiseacre Farm in Toontown Fair.'
  ]
};

const getRideTriviaFact = (rideName: string, parkName: string): string => {
  if (RIDE_TRIVIA_DB[rideName] && RIDE_TRIVIA_DB[rideName].length > 0) {
    const facts = RIDE_TRIVIA_DB[rideName];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  const parkTrivia: Record<string, string[]> = {
    'Magic Kingdom': [
      'Imagineers built Cinderella Castle with forced perspective: upper bricks get smaller near top to make it look taller!',
      'Underneath Magic Kingdom lies a 9-acre network of utility tunnels called "utilidors" so cast members move unseen.'
    ],
    'Epcot': [
      'The World Showcase promenade is 1.2 miles around the lagoon, featuring 11 country pavilions celebrating global culture!',
      'Spaceship Earth weighs approximately 16 million pounds—more than three times the weight of a fully loaded Space Shuttle!'
    ],
    'Hollywood Studios': [
      'Galaxy’s Edge is set on the remote planet Batuu, designed with custom weathered architecture down to creature footprints.',
      'Echo Lake is shaped like a giant footprint of Dinosaur Gertie, who sits beside the water offering ice cream!'
    ],
    'Animal Kingdom': [
      'The Tree of Life stands 145 feet tall and features over 300 intricately hand-carved animal figures woven into its trunk.',
      'Disney’s Animal Kingdom was built with over 4 million trees, shrubs, and vines planted across 500 acres.'
    ]
  };

  const list = parkTrivia[parkName] || [
    'Did you know? Disney Imagineers hide unique details, props, and story clues throughout every line in the park!'
  ];
  return list[Math.floor(Math.random() * list.length)];
};

const parseAttendees = (raw: string | string[] | undefined): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s => s.trim()).filter(Boolean);
  return raw.split(',').map(s => s.trim()).filter(Boolean);
};

export default function DisneyTracker() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics' | 'ride-everything'>('tracker');
  const [loading, setLoading] = useState(true);

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

  // Live Queue Timer State
  const [queueStartTimestamp, setQueueStartTimestamp] = useState<number | null>(null);
  const [queueStartTimeStr, setQueueStartTimeStr] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [rideTrivia, setRideTrivia] = useState<string | null>(null);
  const [triviaLoading, setTriviaLoading] = useState<boolean>(false);

  // Editing Ride State
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editRideName, setEditRideName] = useState('');
  const [editWaitTime, setEditWaitTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRiders, setEditRiders] = useState<string[]>([]);

  // Staggered Check-out Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [departingMembers, setDepartingMembers] = useState<string[]>([]);

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
    if (activeVisit) {
      const currentParty = parseAttendees(activeVisit.attendees);
      setSelectedRiders(currentParty);
      setRideName(PARK_ATTRACTIONS[activeVisit.parkName]?.[0] || '');
    }
  }, [activeVisit]);

  useEffect(() => {
    fetchCloudVisits();
  }, []);

  const fetchCloudVisits = async () => {
    setLoading(true);
    try {
      const client = await getSupabase();
      if (!client) {
        setLoading(false);
        return;
      }

      const { data: visitsData, error: visitsError } = await client
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
        if (ongoing) {
          setDepartingMembers(parseAttendees(ongoing.attendees));
        }
        setVisits(completed);
      }
    } catch (err) {
      console.error("Error fetching Supabase data:", err);
    } finally {
      setLoading(false);
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

  const filteredVisits = useMemo(() => {
    if (selectedAttendee === 'ALL') return visits;
    return visits.filter(v => {
      const attList = parseAttendees(v.attendees);
      return attList.includes(selectedAttendee);
    });
  }, [visits, selectedAttendee]);

  const isPersonRider = (activity: Activity, visit: Visit, person: string) => {
    const activityRiders = parseAttendees(activity.riders);
    if (activityRiders.length > 0) {
      return activityRiders.includes(person);
    }
    return parseAttendees(visit.attendees).includes(person);
  };

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

  const totalParkMinutes = filteredVisits.reduce((sum, v) => {
    if (!v.startTime || !v.endTime) return sum;
    const start = parseTimeToMinutes(v.startTime);
    const end = parseTimeToMinutes(v.endTime);
    return sum + (end >= start ? (end - start) : ((1440 - start) + end));
  }, 0);

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
        if (v.startTime && v.endTime) {
          const start = parseTimeToMinutes(v.startTime);
          const end = parseTimeToMinutes(v.endTime);
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
    const client = await getSupabase();
    if (!client) return;

    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA');
    const localTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const newAttendeesList = selectedAttendees.length > 0 ? selectedAttendees : ['Just Me'];
    const attendeesDbStr = newAttendeesList.join(', ');

    const { data, error } = await client
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
      alert("Error checking in to park: " + error.message);
      return;
    }

    const newVisit: Visit = {
      id: data.id,
      visitDate: localDate,
      startTime: localTime,
      endTime: '',
      parkName,
      attendees: newAttendeesList,
      activities: []
    };

    setActiveVisit(newVisit);
    setSelectedRiders(newAttendeesList);
    setDepartingMembers(newAttendeesList);
    setSelectedAttendees([]);
  };

  const handleAddRideLive = async () => {
    if (!activeVisit || !rideName) return;
    const client = await getSupabase();
    if (!client) return;

    const waitMins = parseInt(waitTime) || 0;
    const notesVal = rideName === 'Character Meeting' && characterName ? characterName : undefined;
    const ridersStr = selectedRiders.join(', ');

    let { data, error } = await client
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
      const fallbackRes = await client
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
      alert("Error adding attraction: " + error.message);
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
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setRideTrivia(text);
        }
      }
    } catch (err) {
      // Keeps localFact on API failure
    } finally {
      setTriviaLoading(false);
    }
  };

  const handleStartQueueTimer = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
    setQueueStartTimestamp(now.getTime());
    setQueueStartTimeStr(timeString);
    if (activeVisit) {
      fetchRideTrivia(rideName, activeVisit.parkName);
    }
  };

  const handleEndQueueTimer = async () => {
    if (!activeVisit || !queueStartTimestamp) return;
    const client = await getSupabase();
    if (!client) return;

    const nowMs = Date.now();
    const diffMs = nowMs - queueStartTimestamp;
    let calculatedWait = Math.round(diffMs / 60000);
    if (calculatedWait <= 0) calculatedWait = 1;

    const notesVal = rideName === 'Character Meeting' && characterName ? characterName : undefined;
    const ridersStr = selectedRiders.join(', ');

    let { data, error } = await client
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
      const fallbackRes = await client
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
    const client = await getSupabase();
    if (!client) return;

    const waitMins = parseInt(editWaitTime) || 0;
    const notesVal = editNotes.trim() ? editNotes : null;
    const ridersStr = editRiders.join(', ');

    let { error } = await client
      .from('activities')
      .update({
        rideName: editRideName,
        waitTimeMinutes: waitMins,
        notes: notesVal,
        riders: ridersStr
      })
      .eq('id', editingActivityId);

    if (error && error.message.includes('riders')) {
      const fallbackRes = await client
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
      alert("Error saving edits: " + error.message);
      return;
    }

    await fetchCloudVisits();
    cancelEditing();
  };

  const deleteActivity = async (activityId: string) => {
    if (!confirm("Delete this ride entry?")) return;
    const client = await getSupabase();
    if (!client) return;

    const { error } = await client.from('activities').delete().eq('id', activityId);
    if (error) {
      alert("Error deleting entry: " + error.message);
      return;
    }

    await fetchCloudVisits();
  };

  const processCheckout = async (checkoutType: 'selected' | 'everyone') => {
    if (!activeVisit) return;
    const client = await getSupabase();
    if (!client) return;

    const now = new Date();
    const endTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const currentParty = parseAttendees(activeVisit.attendees);
    const leavingParty = checkoutType === 'everyone' ? currentParty : departingMembers;
    const remainingParty = currentParty.filter(m => !leavingParty.includes(m));

    if (remainingParty.length === 0 || checkoutType === 'everyone') {
      const { error } = await client
        .from('visits')
        .update({ endTime, attendees: leavingParty.join(', ') })
        .eq('id', activeVisit.id);

      if (error) {
        alert("Error checking out: " + error.message);
        return;
      }
    } else {
      const { data: newV, error: vErr } = await client
        .from('visits')
        .insert({
          visitDate: activeVisit.visitDate,
          startTime: activeVisit.startTime,
          endTime,
          parkName: activeVisit.parkName,
          attendees: leavingParty.join(', ')
        })
        .select()
        .single();

      if (vErr) {
        alert("Error creating departure log: " + vErr.message);
        return;
      }

      // STRICT "NO RIDE, NO RECORD": Only copy rides where departing member(s) were actual riders!
      if (activeVisit.activities.length > 0) {
        const actsToDuplicate = activeVisit.activities
          .map(a => {
            const aRiders = parseAttendees(a.riders);
            const actualDepartingRiders = aRiders.filter(r => leavingParty.includes(r));
            if (actualDepartingRiders.length === 0) return null;

            return {
              visit_id: newV.id,
              rideName: a.rideName,
              waitTimeMinutes: a.waitTimeMinutes,
              notes: a.notes,
              riders: actualDepartingRiders.join(', ')
            };
          })
          .filter(Boolean) as any[];

        if (actsToDuplicate.length > 0) {
          await client.from('activities').insert(actsToDuplicate);
        }
      }

      const { error: updateErr } = await client
        .from('visits')
        .update({ attendees: remainingParty.join(', ') })
        .eq('id', activeVisit.id);

      if (updateErr) {
        alert("Error updating active party: " + updateErr.message);
        return;
      }
    }

    setShowCheckoutModal(false);
    await fetchCloudVisits();
    setQueueStartTimestamp(null);
    setQueueStartTimeStr(null);
    setRideTrivia(null);
  };

  const deleteVisit = async (id: string) => {
    if (confirm("Delete this visit history permanently?")) {
      const client = await getSupabase();
      if (!client) return;

      const { error } = await client.from('visits').delete().eq('id', id);
      if (error) {
        alert("Error deleting visit: " + error.message);
        return;
      }
      await fetchCloudVisits();
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

  const activePartyList = activeVisit ? parseAttendees(activeVisit.attendees) : [];

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1A202C', background: '#FAFAFA', minHeight: '100vh' }}>
      
      {/* HERO HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '15px', padding: '10px 0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#004487', letterSpacing: '-0.5px', margin: '0 0 4px 0' }}>🏰 My Annual Pass Tracker</h1>
        <p style={{ color: '#D4AF37', margin: 0, fontSize: '15px', fontWeight: '600', fontStyle: 'italic' }}>Shared Cloud Sync Active ☁️</p>
      </header>

      {/* GLOBAL ATTENDEE FILTER BAR */}
      <div style={{ background: '#FFF', padding: '10px 14px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <label style={{ fontSize: '12px', fontWeight: '800', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '6px' }}>
          👤 Filter by Attendee:
        </label>
        <select
          value={selectedAttendee}
          onChange={(e) => setSelectedAttendee(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E0', background: '#F8FAFC', fontWeight: '700', fontSize: '13px', color: '#004487', cursor: 'pointer' }}
        >
          <option value="ALL">Everyone (All Data)</option>
          {FIXED_FAMILY_MEMBERS.map(member => (
            <option key={member} value={member}>{member}</option>
          ))}
        </select>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', background: '#E2E8F0', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('tracker')} style={{ flex: 1, padding: '10px 4px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', background: activeTab === 'tracker' ? '#004487' : 'transparent', color: activeTab === 'tracker' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>⏱️ Live Companion</button>
        <button onClick={() => setActiveTab('analytics')} style={{ flex: 1, padding: '10px 4px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', background: activeTab === 'analytics' ? '#004487' : 'transparent', color: activeTab === 'analytics' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>📊 Analytics</button>
        <button onClick={() => setActiveTab('ride-everything')} style={{ flex: 1, padding: '10px 4px', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', background: activeTab === 'ride-everything' ? '#004487' : 'transparent', color: activeTab === 'ride-everything' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>🎡 Ride Everything</button>
      </div>

      {/* TAB 1: LIVE COMPANION */}
      {activeTab === 'tracker' && (
        <div>
          {activeVisit ? (
            <div style={{ background: 'linear-gradient(135deg, #0056b3 0%, #003366 100%)', color: '#FFF', padding: '20px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 8px 24px rgba(0, 51, 102, 0.25)', border: '2px solid #D4AF37' }}>
              
              <div style={{ marginBottom: '10px' }}>
                <span style={{ background: '#D4AF37', color: '#003366', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
                  ✨ CURRENTLY AT
                </span>
              </div>

              <h2 style={{ margin: '0 0 8px 0', fontSize: '25px', fontWeight: '900', letterSpacing: '-0.3px', width: '100%' }}>
                {PARK_EMOJIS[activeVisit.parkName] || ''} {activeVisit.parkName}
              </h2>

              <div style={{ fontSize: '13px', color: '#E2E8F0', marginBottom: '8px', fontWeight: '600' }}>
                📅 {formatDisplayDate(activeVisit.visitDate)} &nbsp;•&nbsp; ⏰ Arrived: <strong>{format12Hour(activeVisit.startTime)}</strong>
              </div>

              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#F7FAFC' }}>
                👥 <strong>Party:</strong> {activePartyList.join(', ')}
              </p>

              {/* TRACK ATTRACTION CARD */}
              <div style={{ background: '#FFF', padding: '16px', borderRadius: '18px', marginBottom: '15px', color: '#1A202C' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#004487' }}>Track an Attraction:</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select value={rideName} onChange={(e) => setRideName(e.target.value)} disabled={!!queueStartTimestamp} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E0', background: queueStartTimestamp ? '#EDF2F7' : '#F8FAFC', fontSize: '14px', color: queueStartTimestamp ? '#718096' : '#1A202C' }}>
                    <optgroup label="Park Rides & Shows">
                      {PARK_ATTRACTIONS[activeVisit.parkName].map((attraction) => (
                        <option key={attraction} value={attraction}>{attraction}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Events & Activities">
                      {UNIVERSAL_ACTIVITIES.map((action) => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </optgroup>
                  </select>

                  {/* PER-RIDE ATTENDEE SELECTOR ("WHO RODE THIS?") */}
                  {activePartyList.length > 1 && (
                    <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '6px' }}>
                        👥 WHO IS RIDING THIS?
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {activePartyList.map((member) => {
                          const isRiding = selectedRiders.includes(member);
                          return (
                            <button
                              key={member}
                              type="button"
                              onClick={() => toggleRiderSelection(member)}
                              disabled={!!queueStartTimestamp}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: isRiding ? '2px solid #004487' : '1px solid #CBD5E0',
                                background: isRiding ? '#004487' : '#FFF',
                                color: isRiding ? '#FFF' : '#718096',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {isRiding ? `✓ ${member}` : member}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {rideName === 'Character Meeting' && (
                    <div style={{ background: '#FFF5F7', padding: '10px', borderRadius: '10px', border: '1px solid #FF8DA1' }}>
                      <label style={{ fontSize: '11px', fontWeight: '800', color: '#D61F40', display: 'block', marginBottom: '4px' }}>✨ WHICH CHARACTER?</label>
                      <input type="text" placeholder="Mickey, Cinderella, etc." value={characterName} onChange={(e) => setCharacterName(e.target.value)} disabled={!!queueStartTimestamp} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #FFCBD4', fontSize: '14px' }} />
                    </div>
                  )}

                  {queueStartTimestamp ? (
                    <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', padding: '14px', borderRadius: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#C05621', letterSpacing: '0.5px' }}>⏱️ LIVE QUEUE TIMER RUNNING</div>
                      
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#2D3748', marginTop: '6px' }}>
                        Entered line at: <strong style={{ color: '#004487' }}>{queueStartTimeStr}</strong>
                      </div>
                      
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#C05621', margin: '8px 0' }}>
                        Time in line: {getElapsedQueueTimeString()}
                      </div>

                      <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', padding: '10px', borderRadius: '10px', marginTop: '10px', textAlign: 'left', fontSize: '12px', color: '#22543D' }}>
                        <div style={{ fontWeight: '800', color: '#276749', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✨ Queue Imagineering Secret:
                        </div>
                        {triviaLoading ? (
                          <div style={{ fontStyle: 'italic', color: '#718096' }}>Searching Imagineering vault for facts...</div>
                        ) : (
                          <div>{rideTrivia}</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="button" onClick={() => { setQueueStartTimestamp(null); setQueueStartTimeStr(null); setRideTrivia(null); }} style={{ flex: 1, padding: '10px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={handleEndQueueTimer} style={{ flex: 2, padding: '10px', background: '#38A169', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(56,161,105,0.2)' }}>
                          ✅ On Ride Now!
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: '10px', marginTop: '5px' }}>
                      <button type="button" onClick={handleStartQueueTimer} style={{ width: '100%', padding: '12px', background: '#004487', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        ⏱️ Start Line Timer
                      </button>

                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#A0AEC0', fontWeight: 'bold', marginBottom: '12px', position: 'relative' }}>
                        <span style={{ background: '#FFF', padding: '0 10px', position: 'relative', zIndex: 2 }}>OR LOG MANUALLY</span>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#E2E8F0', zIndex: 1 }}></div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" placeholder="Enter wait time (mins)" value={waitTime} onChange={(e) => setWaitTime(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }} />
                        <button type="button" onClick={handleAddRideLive} style={{ padding: '11px 22px', background: '#EDF2F7', color: '#2D3748', border: '1px solid #CBD5E0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                          Log
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {activeVisit.activities.length > 0 && (
                  <div style={{ marginTop: '15px', borderTop: '2px dashed #E2E8F0', paddingTop: '12px' }}>
                    <strong style={{ fontSize: '11px', color: '#718096', display: 'block', marginBottom: '8px' }}>TODAY'S LOG ({activeVisit.activities.length}):</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeVisit.activities.map((act) => {
                        const isEditingThis = editingActivityId === act.id && editingVisitId === null;
                        const actRidersList = parseAttendees(act.riders);

                        return isEditingThis ? (
                          <div key={act.id} style={{ background: '#F7FAFC', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004487', marginBottom: '6px' }}>EDIT ENTRY</div>
                            <select value={editRideName} onChange={(e) => setEditRideName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', marginBottom: '6px' }}>
                              <optgroup label="Park Rides & Shows">
                                {PARK_ATTRACTIONS[activeVisit.parkName].map((attraction) => (
                                  <option key={attraction} value={attraction}>{attraction}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Events & Activities">
                                {UNIVERSAL_ACTIVITIES.map((action) => (
                                  <option key={action} value={action}>{action}</option>
                                ))}
                              </optgroup>
                            </select>

                            <div style={{ marginBottom: '6px' }}>
                              <label style={{ fontSize: '10px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>WHO RODE THIS?</label>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {activePartyList.map((m) => {
                                  const checked = editRiders.includes(m);
                                  return (
                                    <button key={m} type="button" onClick={() => toggleEditRiderSelection(m)} style={{ padding: '4px 8px', borderRadius: '6px', border: checked ? '1px solid #004487' : '1px solid #CBD5E0', background: checked ? '#004487' : '#FFF', color: checked ? '#FFF' : '#4A5568', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                      {m}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                              <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                              <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button onClick={() => deleteActivity(act.id)} style={{ background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                              <button onClick={cancelEditing} style={{ background: '#CBD5E0', color: '#2D3748', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                              <button onClick={saveEditedActivity} style={{ background: '#38A169', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDF2F7' }}>
                            <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.rideName}</div>
                              <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                ⏱️ {act.waitTimeMinutes} mins wait {actRidersList.length > 0 ? `• 👥 ${actRidersList.join(', ')}` : ''} {act.notes ? `• ${act.notes}` : ''}
                              </div>
                            </div>
                            <button onClick={() => startEditing(act, null)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px', flexShrink: 0 }}>
                              Edit
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* LEAVE PARK TRIGGER */}
              <button onClick={() => { setDepartingMembers(activePartyList); setShowCheckoutModal(true); }} style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #E53E3E, #C53030)', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                👋 Leave the Park & Save Day
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} style={{ background: '#FFF', padding: '22px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ marginTop: 0, fontSize: '19px', fontWeight: '800', color: '#004487', marginBottom: '15px', textAlign: 'center' }}>✨ Enter the Magic</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>SELECT PARK</label>
                <select value={parkName} onChange={(e) => setParkName(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E0', background: '#F8FAFC', fontSize: '16px', fontWeight: '700', color: '#004487' }}>
                  <option value="Magic Kingdom">🏰 Magic Kingdom</option>
                  <option value="Epcot">🪩 Epcot</option>
                  <option value="Hollywood Studios">🎥 Hollywood Studios</option>
                  <option value="Animal Kingdom">🌳 Animal Kingdom</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>WHO'S ATTENDING?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {FIXED_FAMILY_MEMBERS.map((name) => {
                    const isSelected = selectedAttendees.includes(name);
                    return (
                      <button key={name} type="button" onClick={() => toggleCheckInAttendee(name)} style={{ padding: '10px 4px', borderRadius: '10px', border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0', background: isSelected ? '#004487' : '#FFF', color: isSelected ? '#FFF' : '#2D3748', fontSize: '13px', fontWeight: isSelected ? '800' : '500', cursor: 'pointer' }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0066cc 0%, #004487 100%)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                🚀 Check In to Park
              </button>
            </form>
          )}

          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 12px 0', letterSpacing: '0.8px' }}>
              TOTALS {selectedAttendee !== 'ALL' ? `(${selectedAttendee})` : ''}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#004487' }}>{totalDays}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>PARK VISITS</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#38A169' }}>{totalActivities}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TOTAL ACTIVITIES</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#9F7AEA' }}>{formatMinutes(totalParkMinutes)}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN PARKS</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '12px', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ED8936' }}>{formatMinutes(totalWaitMinutes)}</div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>TIME IN LINES</div>
              </div>
            </div>

            <div style={{ background: '#FFFDF5', padding: '12px 15px', borderRadius: '14px', border: '1px solid #FEEBC8', borderLeft: '5px solid #D4AF37', marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#C05621', marginBottom: '3px', letterSpacing: '0.5px' }}>⭐ TOP ACTIVITY</div>
              <div style={{ fontWeight: '800', color: '#1A202C', fontSize: '15px' }}>{topActivity.name}</div>
              <div style={{ color: '#4A5568', marginTop: '3px', fontSize: '12px' }}>
                Logged <strong>{topActivity.count}x</strong> | Total Wait: <strong style={{ color: '#C05621' }}>{formatMinutes(topActivity.totalWait || 0)}</strong>
              </div>
            </div>

            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#A0AEC0', margin: '0 0 10px 0', letterSpacing: '0.8px' }}>AVERAGES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{avgActivitiesPerDay}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>Activities</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{formatMinutes(avgParkMinutesPerDay)}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>Duration</div>
              </div>
              <div style={{ background: '#F7FAFC', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#2D3748' }}>{avgWaitPerActivity}m</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096', marginTop: '2px' }}>Wait Time</div>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#004487', paddingLeft: '5px' }}>
              Past Visits ({filteredVisits.length})
            </h2>
            {loading ? (
              <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', margin: '20px 0' }}>Syncing with Supabase cloud...</p>
            ) : filteredVisits.length === 0 ? (
              <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', marginTop: '20px', fontStyle: 'italic' }}>No completed trips found for this view.</p>
            ) : (
              filteredVisits.map((v) => (
                <div key={v.id} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: '16px', marginBottom: '12px', background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EDF2F7', paddingBottom: '8px', marginBottom: '10px' }}>
                    <strong style={{ color: '#004487', fontSize: '16px', fontWeight: '800' }}>
                      {PARK_EMOJIS[v.parkName] || ''} {v.parkName}
                    </strong>
                    <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>📅 {formatDisplayDate(v.visitDate)}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#4A5568', marginBottom: '10px' }}>
                    ⏱️ <strong>Hours:</strong> {format12Hour(v.startTime)} - {format12Hour(v.endTime)} <span style={{ color: '#2B6CB0', fontWeight: 'bold' }}>{calculateVisitDuration(v.startTime, v.endTime)}</span> <br />
                    👥 <strong>Party:</strong> {parseAttendees(v.attendees).join(', ')}
                  </div>
                  {v.activities.length > 0 && (
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {v.activities.map((a) => {
                          const isEditingThis = editingActivityId === a.id && editingVisitId === v.id;
                          const actRidersList = parseAttendees(a.riders);
                          const visitPartyList = parseAttendees(v.attendees);

                          return isEditingThis ? (
                            <div key={a.id} style={{ background: '#FFF', border: '1px solid #CBD5E0', padding: '10px', borderRadius: '10px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#004487', marginBottom: '6px' }}>EDIT ENTRY</div>
                              <select value={editRideName} onChange={(e) => setEditRideName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px', marginBottom: '6px' }}>
                                <optgroup label="Park Rides & Shows">
                                  {PARK_ATTRACTIONS[v.parkName].map((attraction) => (
                                    <option key={attraction} value={attraction}>{attraction}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Events & Activities">
                                  {UNIVERSAL_ACTIVITIES.map((action) => (
                                    <option key={action} value={action}>{action}</option>
                                  ))}
                                </optgroup>
                              </select>

                              <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>WHO RODE THIS?</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {visitPartyList.map((m) => {
                                    const checked = editRiders.includes(m);
                                    return (
                                      <button key={m} type="button" onClick={() => toggleEditRiderSelection(m)} style={{ padding: '4px 8px', borderRadius: '6px', border: checked ? '1px solid #004487' : '1px solid #CBD5E0', background: checked ? '#004487' : '#FFF', color: checked ? '#FFF' : '#4A5568', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {m}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                <input type="number" value={editWaitTime} onChange={(e) => setEditWaitTime(e.target.value)} placeholder="Wait (mins)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                                <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '13px' }} />
                              </div>

                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button onClick={() => deleteActivity(a.id)} style={{ background: '#E53E3E', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                                <button onClick={cancelEditing} style={{ background: '#CBD5E0', color: '#2D3748', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={saveEditedActivity} style={{ background: '#38A169', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.rideName}</div>
                                <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                  ⏱️ {a.waitTimeMinutes} mins wait {actRidersList.length > 0 ? `• 👥 ${actRidersList.join(', ')}` : ''} {a.notes ? `• ${a.notes}` : ''}
                                </div>
                              </div>
                              <button onClick={() => startEditing(a, v.id)} style={{ background: 'none', border: 'none', color: '#2B6CB0', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px', flexShrink: 0 }}>
                                Edit
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button onClick={() => deleteVisit(v.id)} style={{ background: 'none', border: 'none', color: '#E53E3E', fontSize: '11px', marginTop: '12px', cursor: 'pointer', padding: 0, fontWeight: '700' }}>
                    🗑️ Delete Entire Visit Log
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div>
          {/* PARK AVERAGES */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#004487', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>
              🏟️ Park Averages
            </h2>
            {Object.keys(parkStats).map((parkKey) => {
              const park = parkKey as keyof typeof parkStats;
              const stats = parkStats[park];
              const avgAct = stats.visits > 0 ? (stats.activities / stats.visits).toFixed(1) : '0';
              const avgTime = stats.visits > 0 ? formatMinutes(stats.timeInPark / stats.visits) : '0m';
              const avgWait = stats.activities > 0 ? Math.round(stats.waitTime / stats.activities) : 0;
              return (
                <div key={park} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #EDF2F7' }}>
                  <div style={{ fontWeight: '800', color: '#1A202C', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{PARK_EMOJIS[park]} {park}</span>
                    <span style={{ color: '#004487' }}>{stats.visits} {stats.visits === 1 ? 'visit' : 'visits'}</span>
                  </div>
                  {stats.visits > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginTop: '8px', fontSize: '11px', textAlign: 'center' }}>
                      <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgAct}</div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px', fontWeight: '800' }}>ACTIVITIES</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgTime}</div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px', fontWeight: '800' }}>DURATION</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '6px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4A5568' }}>{avgWait}m</div>
                        <div style={{ color: '#A0AEC0', fontSize: '9px', fontWeight: '800' }}>WAIT TIME</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#A0AEC0', fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>No entries recorded for this park yet.</div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#004487', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>🎢 Most Times Ridden (Top 10)</h2>
            {mostTimesRidden.length === 0 ? (
              <p style={{ color: '#A0AEC0', fontSize: '14px', textAlign: 'center', fontStyle: 'italic', margin: '20px 0' }}>Log some attractions to build your charts!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mostTimesRidden.map((ride, index) => (
                  <div key={ride.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                    <div style={{ background: index === 0 ? '#D4AF37' : '#004487', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.name}</div>
                      <div style={{ fontSize: '11px', color: '#004487', fontWeight: '700', marginTop: '1px' }}>
                        {PARK_EMOJIS[ride.park]} {ride.park}
                      </div>
                      <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                        Total Wait Time: <strong>{formatMinutes(ride.totalWait)}</strong> | Avg Wait Time: <strong>{ride.avgWait}m</strong>
                      </div>
                    </div>
                    <div style={{ background: '#EBF8FF', color: '#2B6CB0', border: '1px solid #BEE3F8', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', fontSize: '13px', flexShrink: 0 }}>
                      {ride.count}x
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#C05621', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>⏳ Longest Average Waits (Top 10)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {longestWaitTimes.map((ride, index) => (
                <div key={ride.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFAF0', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FEEBC8' }}>
                  <div style={{ background: '#DD6B20', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.name}</div>
                    <div style={{ fontSize: '11px', color: '#DD6B20', fontWeight: '700', marginTop: '1px' }}>
                      {PARK_EMOJIS[ride.park]} {ride.park}
                    </div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                      Total Wait Time: <strong>{formatMinutes(ride.totalWait)}</strong> | Avg Wait Time: <strong>{ride.avgWait}m</strong>
                    </div>
                  </div>
                  <div style={{ background: '#FEEBC8', color: '#C05621', padding: '4px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                    {ride.avgWait}m avg
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#276749', margin: '0 0 15px 0', borderBottom: '2px solid #F2F2F7', paddingBottom: '6px' }}>⚡ Shortest Average Waits (Top 10)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shortestWaitTimes.map((ride, index) => (
                <div key={ride.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F0FFF4', padding: '10px 12px', borderRadius: '12px', border: '1px solid #C6F6D5' }}>
                  <div style={{ background: '#38A169', color: '#FFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.name}</div>
                    <div style={{ fontSize: '11px', color: '#276749', fontWeight: '700', marginTop: '1px' }}>
                      {PARK_EMOJIS[ride.park]} {ride.park}
                    </div>
                    <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>
                      Total Wait Time: <strong>{formatMinutes(ride.totalWait)}</strong> | Avg Wait Time: <strong>{ride.avgWait}m</strong>
                    </div>
                  </div>
                  <div style={{ background: '#C6F6D5', color: '#22543D', padding: '4px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                    {ride.avgWait}m avg
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', marginBottom: '16px', paddingLeft: '4px' }}>
              👥 Attendee Cards
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {FIXED_FAMILY_MEMBERS.map((person) => {
                const personVisits = visits.filter(v => parseAttendees(v.attendees).includes(person));
                
                const personActs = personVisits.reduce((sum, v) => {
                  return sum + v.activities.filter(a => isPersonRider(a, v, person)).length;
                }, 0);

                const personWaitMins = personVisits.reduce((sum, v) => {
                  return sum + v.activities
                    .filter(a => isPersonRider(a, v, person))
                    .reduce((aSum, act) => aSum + act.waitTimeMinutes, 0);
                }, 0);
                
                const personParkMins = personVisits.reduce((sum, v) => {
                  if (!v.startTime || !v.endTime) return sum;
                  const start = parseTimeToMinutes(v.startTime);
                  const end = parseTimeToMinutes(v.endTime);
                  return sum + (end >= start ? (end - start) : ((1440 - start) + end));
                }, 0);

                const personAvgActs = personVisits.length > 0 ? (personActs / personVisits.length).toFixed(1) : '0';
                const personAvgDuration = personVisits.length > 0 ? personParkMins / personVisits.length : 0;
                const personAvgWait = personActs > 0 ? Math.round(personWaitMins / personActs) : 0;

                const personRidesMap = getRideBreakdown(personVisits, person);
                const personFavorite = personRidesMap.sort((a, b) => b.count - a.count || b.totalWait - a.totalWait)[0] || null;

                const personCountsMap = getRideCountsMap(personVisits, person);

                return (
                  <div key={person} style={{ background: '#FFF', borderRadius: '20px', padding: '18px', border: '1px solid #CBD5E0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #EDF2F7', paddingBottom: '10px', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487' }}>👤 {person}</h3>
                      <span style={{ fontSize: '12px', fontWeight: '800', background: '#EBF8FF', color: '#2B6CB0', padding: '4px 10px', borderRadius: '12px' }}>
                        {personVisits.length} Park {personVisits.length === 1 ? 'Visit' : 'Visits'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center', marginBottom: '12px' }}>
                      <div style={{ background: '#F8FAFC', padding: '8px 4px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#2D3748' }}>{personActs}</div>
                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096' }}>Activities</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '8px 4px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#9F7AEA' }}>{formatMinutes(personParkMins)}</div>
                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096' }}>TIME IN PARKS</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '8px 4px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#ED8936' }}>{formatMinutes(personWaitMins)}</div>
                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#718096' }}>TIME IN LINES</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center', marginBottom: '12px' }}>
                      <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#4A5568' }}>{personAvgActs}</div>
                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#A0AEC0' }}>Avg Activities</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#4A5568' }}>{formatMinutes(personAvgDuration)}</div>
                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#A0AEC0' }}>AVG DURATION</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#4A5568' }}>{personAvgWait}m</div>
                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#A0AEC0' }}>AVG WAIT</div>
                      </div>
                    </div>

                    <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '900', color: '#C05621' }}>⭐ FAVORITE RIDE</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A202C', marginTop: '2px' }}>
                        {personFavorite ? personFavorite.name : 'None Logged Yet'}
                      </div>
                      {personFavorite && (
                        <div style={{ fontSize: '10px', color: '#718096', marginTop: '1px' }}>
                          Ridden {personFavorite.count}x • Total Wait: {formatMinutes(personFavorite.totalWait)}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', marginBottom: '6px' }}>🎡 RIDE EVERYTHING PROGRESS:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {Object.entries(PARK_ATTRACTIONS).map(([park, attractions]) => {
                          const doneCount = attractions.filter(att => (personCountsMap[att] || 0) > 0).length;
                          const pct = attractions.length > 0 ? Math.round((doneCount / attractions.length) * 100) : 0;
                          return (
                            <div key={park} style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '8px', fontSize: '11px', border: '1px solid #EDF2F7' }}>
                              <div style={{ fontWeight: '700', color: '#2D3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {PARK_EMOJIS[park]} {park}
                              </div>
                              <div style={{ fontWeight: '800', color: '#004487', marginTop: '2px' }}>
                                {doneCount}/{attractions.length} ({pct}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIDE EVERYTHING */}
      {activeTab === 'ride-everything' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(PARK_ATTRACTIONS).map(([park, attractions]) => {
            const sortedAttractions = [...attractions].sort((a, b) => a.localeCompare(b));
            const totalInPark = sortedAttractions.length;
            const completedCount = sortedAttractions.filter(att => (rideCountsMap[att] || 0) > 0).length;
            const percentage = totalInPark > 0 ? Math.round((completedCount / totalInPark) * 100) : 0;

            return (
              <div key={park} style={{ background: '#FFF', borderRadius: '24px', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <div style={{ marginBottom: '14px', borderBottom: '2px solid #F2F2F7', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', margin: 0 }}>
                      {PARK_EMOJIS[park]} {park}
                    </h2>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#D4AF37', background: '#FFFDF5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #FEEBC8' }}>
                      {completedCount}/{totalInPark} ({percentage}%)
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: '#EDF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: percentage === 100 ? '#38A169' : 'linear-gradient(90deg, #0066cc, #D4AF37)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sortedAttractions.map((attraction) => {
                    const count = rideCountsMap[attraction] || 0;
                    const isCompleted = count > 0;

                    return (
                      <div key={attraction} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: isCompleted ? '#F0FFF4' : '#F8FAFC', border: isCompleted ? '1px solid #C6F6D5' : '1px solid #EDF2F7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingRight: '8px' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0 }}>
                            {isCompleted ? '✅' : '⬜'}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: isCompleted ? '700' : '500', color: isCompleted ? '#22543D' : '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attraction}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: isCompleted ? '#276749' : '#A0AEC0', flexShrink: 0 }}>
                          {isCompleted ? `(${count})` : '0'}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && activeVisit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '22px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#004487' }}>
              👋 Leaving the Park
            </h3>
            <p style={{ fontSize: '13px', color: '#4A5568', margin: '0 0 16px 0' }}>
              Who is departing the park right now?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {activePartyList.map((member) => {
                const isSelected = departingMembers.includes(member);
                return (
                  <button
                    key={member}
                    type="button"
                    onClick={() => toggleDepartingMember(member)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #E53E3E' : '1px solid #CBD5E0',
                      background: isSelected ? '#FFF5F5' : '#F8FAFC',
                      color: isSelected ? '#C53030' : '#4A5568',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>👤 {member}</span>
                    <span>{isSelected ? '🚪 Leaving' : '🏰 Staying'}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => processCheckout('selected')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#E53E3E',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Check Out Selected ({departingMembers.length})
              </button>

              <button
                type="button"
                onClick={() => processCheckout('everyone')}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#EDF2F7',
                  color: '#2D3748',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Check Out Everyone
              </button>

              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'none',
                  color: '#718096',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
