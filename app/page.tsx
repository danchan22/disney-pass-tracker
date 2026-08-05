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

// --- CONSTANTS & DATA ---
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
  { name: 'White', hex: '#FFFFFF', textHex: '#2D3748', borderHex: '#A0AEC0', bgTint: '#FFFFFF' },
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

// --- IMAGINEERING RIDE TRIVIA DATABASE ---
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
  'Soarin': [
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
    'Look at Andy’s coaster blueprint drawing near the queue entrance: check the red crayon doodles.',
    'Check the Jenga block tower support pillars near Rex.'
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
  'The Barnstormer': [
    'The Barnstormer is themed around Goofy’s stunt plane show, featuring a giant wooden billboard that Goofy’s plane crashed straight through!',
    'The ride track was originally part of The Great Goofini’s Wiseacre Farm in Toontown Fair.'
  ]
};

// --- HIDDEN MICKEYS LOCATION DATABASE ---
const HIDDEN_MICKEYS_DB: Record<string, string[]> = {
  'Space Mountain': [
    'Look closely at the giant star map in the exit corridor: three circular asteroids form a classic Mickey head!',
    'In the post-show moving walkway, look at the constellation projections on the far wall.'
  ],
  'Haunted Mansion': [
    'In the grand ballroom banquet hall scene, look down at the long dining table: three plates are arranged to form a classic Mickey!',
    'On the exterior queue graveyard, look at the guitar held by the carved bust.'
  ],
  'Big Thunder Mountain Railroad': [
    'Near the end of the coaster track, look at three rusted gears lying on the ground on the right side.',
    'Inside the cavern lift hill, look at the arrangement of rock formations near the ceiling.'
  ],
  'Pirates of the Caribbean': [
    'In the treasure room scene, look at the iron lock mechanism on the dungeon door.',
    'Check the shadow cast by the hanging lantern on the wall in the jail cell scene.'
  ],
  'TRON Lightcycle / Run': [
    'Watch the color-shifting LED canopy overhead during night launch sequences for subtle light clusters.',
    'In the digitizer pre-show room, look at the circuit board patterns on the side walls.'
  ],
  'Seven Dwarfs Mine Train': [
    'Inside the glistening jewel mine, look for carved jewels in the rock wall directly above Dopey.',
    'Near the vultures at the top of the second lift hill, check the arrangement of wooden beam rivets.'
  ],
  'Guardians of the Galaxy: Cosmic Rewind': [
    'In the Wonders of Xandar Galaxarium pre-show, watch the celestial star maps closely as earth constellations transition.',
    'Look at the light fixtures in the Treasures of Xandar exit shop.'
  ],
  'Spaceship Earth': [
    'In the Renaissance painting scene, look at the paint splatters on the artist’s wooden palette.',
    'In the sleeping child’s bedroom scene, look at the alarm clock and decorative items on the desk.'
  ],
  'Soarin': [
    'During the Fiji island scene, watch the golf ball launched toward the camera—a shadow of Mickey appears on it!',
    'During the fireworks finale over Epcot, look at the burst pattern over Spaceship Earth.'
  ],
  'Frozen Ever After': [
    'In Wandering Oaken’s Trading Post queue, look at the sauna window steam outline.',
    'In the troll valley scene, look at the arrangement of mossy rocks on the bank.'
  ],
  'Star Wars: Rise of the Resistance': [
    'In the Star Destroyer hangar bay, look at the ventilation grates on the lower walkway walls.',
    'In the AT-AT room, check the laser burn marks on the metal support pillars.'
  ],
  'Millennium Falcon: Smugglers Run': [
    'In the main hold room, look at the ventilation grates above the Dejarik holochess table.',
    'In the engine room queue, check the arrangement of pipe valves on the right wall.'
  ],
  'The Twilight Zone Tower of Terror': [
    'In the boiler room queue, look at water stain shapes on the brick walls near the elevator doors.',
    'In the library pre-show video, look at the sheet music held by the musician in the film.'
  ],
  'Slinky Dog Dash': [
    'Look at Andy’s coaster blueprint drawing near the queue entrance: check the red crayon doodles.',
    'Check the Jenga block tower support pillars near Rex.'
  ],
  'Mickey & Minnie’s Runaway Railway': [
    'Look at the cloud shapes in the opening park scene: there are dozens of Hidden Mickeys throughout this ride!',
    'In the carnival scene, look at the arrangement of balloons on the game booths.'
  ],
  'Avatar Flight of Passage': [
    'In the bioluminescent forest queue, look at the moss pattern on the large tree trunk near the cave entrance.',
    'In the RDA lab tank room, check the handprints on the glass.'
  ],
  'Expedition Everest': [
    'Look at the shadow cast on the mountain rock wall during the Yeti silhouette scene.',
    'In the shrine queue, check the arrangement of stone carvings near the prayer flags.'
  ],
  'Kilimanjaro Safaris': [
    'Look at the island in the flamingo pond from above—the island itself is shaped like a giant Mickey head!',
    'Check the rock formations around the lion kopje.'
  ]
};

const getRideTriviaFact = (rideName: string, parkName: string): string => {
  if (RIDE_TRIVIA_DB[rideName] && RIDE_TRIVIA_DB[rideName].length > 0) {
    const facts = RIDE_TRIVIA_DB[rideName];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  const parkTrivia: Record<string, string[]> = {
    'Magic Kingdom': [
      'Imagineers built Cinderella Castle with forced perspective: the upper bricks and windows get smaller near the top to make it look taller!',
      'Underneath Magic Kingdom lies a 9-acre network of utility tunnels called "utilidors" so cast members and supplies move unseen.'
    ],
    'Epcot': [
      'The World Showcase promenade is 1.2 miles around the lagoon, featuring 11 country pavilions celebrating global culture!',
      'Spaceship Earth weighs approximately 16 million pounds—more than three times the weight of a fully loaded Space Shuttle!'
    ],
    'Hollywood Studios': [
      'The land of Galaxy’s Edge is set on the remote planet Batuu, designed with custom weathered architecture down to creature footprints in the concrete.',
      'Echo Lake is shaped like a giant footprint of Dinosaur Gertie, who sits beside the water offering ice cream!'
    ],
    'Animal Kingdom': [
      'The Tree of Life stands 145 feet tall and features over 300 intricately hand-carved animal figures woven into its trunk and branches.',
      'Disney’s Animal Kingdom was built with over 4 million trees, shrubs, and vines planted across 500 acres.'
    ]
  };

  const list = parkTrivia[parkName] || [
    'Did you know? Disney Imagineers hide unique details, props, and story clues throughout every line in the park!'
  ];
  return list[Math.floor(Math.random() * list.length)];
};

const getHiddenMickeyFact = (rideName: string, parkName: string): string => {
  if (HIDDEN_MICKEYS_DB[rideName] && HIDDEN_MICKEYS_DB[rideName].length > 0) {
    const list = HIDDEN_MICKEYS_DB[rideName];
    return list[Math.floor(Math.random() * list.length)];
  }
  return `Keep an eye on queue walls, rusty gears, and floor tile patterns near the loading area for three circles forming a Mickey head!`;
};

// Helper: Parse attendees/riders string or array safely
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
      try {
        const jsonStr = raw.split('|ENDTIMES:')[1];
        return JSON.parse(jsonStr);
      } catch (e) {}
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

// Helper: Client-Side WebP Compression
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

  // Main Header Nav State: 'tracker' | 'analytics' | 'checklist' | 'rainbow'
  const [mainTab, setMainTab] = useState<'tracker' | 'analytics' | 'checklist' | 'rainbow'>('tracker');

  // Subheader Nav States
  const [trackerSubTab, setTrackerSubTab] = useState<'Visit a Park' | 'Past Visits'>('Visit a Park');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'averages' | 'top10' | 'cards'>('averages');
  const [rainbowSubTab, setRainbowSubTab] = useState<'stream' | 'badges'>('stream');

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Global Attendee Filter State (Only for Analytics and Checklist)
  const [selectedAttendee, setSelectedAttendee] = useState<string>('ALL');

  // Check-In Form States
  const [parkName, setParkName] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  
  // Track Attraction States
  const [rideName, setRideName] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);

  // ⏱️ LIVE QUEUE TIMER STATE
  const [queueStartTimestamp, setQueueStartTimestamp] = useState<number | null>(null);
  const [queueStartTimeStr, setQueueStartTimeStr] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [rideTrivia, setRideTrivia] = useState<string | null>(null);
  const [triviaLoading, setTriviaLoading] = useState<boolean>(false);

  // 👀 HIDDEN MICKEY STATE
  const [hiddenMickey, setHiddenMickey] = useState<string | null>(null);
  const [mickeyLoading, setMickeyLoading] = useState<boolean>(false);

  // ✏️ EDITING RIDE STATE
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editRideName, setEditRideName] = useState('');
  const [editWaitTime, setEditWaitTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRiders, setEditRiders] = useState<string[]>([]);

  // ✏️ EDITING ENTIRE VISIT LOG STATE
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [editVisitStartTime, setEditVisitStartTime] = useState('');
  const [editVisitEndTime, setEditVisitEndTime] = useState('');
  const [editVisitMemberEndTimes, setEditVisitMemberEndTimes] = useState<Record<string, string>>({});

  // 👋 STAGGERED CHECK-OUT MODAL STATE
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [departingMembers, setDepartingMembers] = useState<string[]>([]);

  // 🌈 RAINBOW CHALLENGE STATE
  const [photoGrids, setPhotoGrids] = useState<PhotoGridRecord[]>([]);
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);

  // Rainbow Toggle Filters
  const [filterPhotographer, setFilterPhotographer] = useState<string>('ALL');
  const [filterPark, setFilterPark] = useState<string>('ALL');
  const [filterColor, setFilterColor] = useState<string>('ALL');
  const [badgePhotographer, setBadgePhotographer] = useState<string>('Dan');

  // Upload Grid Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadUser, setUploadUser] = useState<string>('Dan');
  const [uploadPark, setUploadPark] = useState<'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom'>('Magic Kingdom');
  const [uploadColor, setUploadColor] = useState<string>('Red');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [selectedGridFile, setSelectedGridFile] = useState<File | null>(null);
  const [uploadingGrid, setUploadingGrid] = useState<boolean>(false);

  // Lightbox State
  const [lightboxGrid, setLightboxGrid] = useState<PhotoGridRecord | null>(null);

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

  // --- STATS CALCULATIONS ---
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
    const localTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

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
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
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
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
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
    setEditVisitStartTime(v.startTime || '');
    setEditVisitEndTime(v.endTime || '');
    setEditVisitMemberEndTimes({ ...(v.memberEndTimes || {}) });
  };

  const handleSaveVisitEdit = async () => {
    if (!editingVisit) return;
    const rawAttendeesStr = parseAttendees(editingVisit.attendees).join(', ');
    const jsonEndTimesStr = JSON.stringify(editVisitMemberEndTimes);
    const attendeesWithEndTimes = `${rawAttendeesStr}|ENDTIMES:${jsonEndTimesStr}`;

    const supabase = await getSupabase();
    const { error } = await supabase
      .from('visits')
      .update({
        startTime: editVisitStartTime,
        endTime: editVisitEndTime,
        attendees: attendeesWithEndTimes,
        notes: jsonEndTimesStr
      })
      .eq('id', editingVisit.id);

    if (error) {
      setErrorMessage("Error updating visit log: " + error.message);
      return;
    }

    setEditingVisit(null);
    await fetchCloudVisits();
  };

  const processCheckout = async (checkoutType: 'selected' | 'everyone') => {
    if (!activeVisit) return;
    const now = new Date();
    const endTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

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
    const jsonEndTimesStr = JSON.stringify(updatedEndTimes);
    const attendeesWithEndTimes = `${rawAttendeesStr}|ENDTIMES:${jsonEndTimesStr}`;

    const supabase = await getSupabase();

    const { error } = await supabase
      .from('visits')
      .update({
        endTime: finalEndTime,
        attendees: attendeesWithEndTimes
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
      
      {/* 🏰 APP HEADER (Clean Disney Pass Tracker) */}
      <header style={{ textAlign: 'center', marginBottom: '14px', padding: '6px 0' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#004487', letterSpacing: '-0.5px', margin: '0' }}>🏰 Disney Pass Tracker</h1>
      </header>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', padding: '10px 14px', borderRadius: '12px', color: '#C53030', fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', color: '#C53030', fontWeight: '900', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 1. HEADER MENU (Top Navigation Bar with Icons & Labels) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '6px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {/* Tracker */}
        <button
          onClick={() => setMainTab('tracker')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 2px 6px 2px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: mainTab === 'tracker' ? '3px solid #004487' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'tracker' ? '#004487' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: mainTab === 'tracker' ? '800' : '600', color: mainTab === 'tracker' ? '#004487' : '#718096', marginTop: '4px' }}>Tracker</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => setMainTab('analytics')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 2px 6px 2px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: mainTab === 'analytics' ? '3px solid #E53E3E' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'analytics' ? '#E53E3E' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: mainTab === 'analytics' ? '800' : '600', color: mainTab === 'analytics' ? '#E53E3E' : '#718096', marginTop: '4px' }}>Analytics</span>
        </button>

        {/* Checklist */}
        <button
          onClick={() => setMainTab('checklist')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 2px 6px 2px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: mainTab === 'checklist' ? '3px solid #38A169' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'checklist' ? '#38A169' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: mainTab === 'checklist' ? '800' : '600', color: mainTab === 'checklist' ? '#38A169' : '#718096', marginTop: '4px' }}>Checklist</span>
        </button>

        {/* Rainbow */}
        <button
          onClick={() => setMainTab('rainbow')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 2px 6px 2px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: mainTab === 'rainbow' ? '3px solid transparent' : '3px solid transparent',
            borderImage: mainTab === 'rainbow' ? 'linear-gradient(to right, #E53E3E, #DD6B20, #D69E2E, #38A169, #3182CE, #805AD5) 1' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mainTab === 'rainbow' ? '#805AD5' : '#718096'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.72 1.7-1.61 0-.43-.17-.83-.44-1.13-.27-.3-.43-.7-.43-1.13 0-.89.78-1.61 1.7-1.61h2.47c2.76 0 5-2.24 5-5 0-5.52-4.48-10-10-10z"></path>
          </svg>
          <span style={{
            fontSize: '11px',
            fontWeight: mainTab === 'rainbow' ? '800' : '600',
            color: mainTab === 'rainbow' ? 'transparent' : '#718096',
            background: mainTab === 'rainbow' ? 'linear-gradient(90deg, #E53E3E, #DD6B20, #D69E2E, #38A169, #3182CE, #805AD5)' : 'none',
            WebkitBackgroundClip: mainTab === 'rainbow' ? 'text' : 'unset',
            WebkitTextFillColor: mainTab === 'rainbow' ? 'transparent' : 'unset',
            marginTop: '4px'
          }}>Rainbow</span>
        </button>
      </div>

      {/* 2. SUBHEADER MENU (when applicable) */}
      {mainTab === 'tracker' && (
        <div style={{ display: 'flex', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3px', marginBottom: '12px' }}>
          <button onClick={() => setTrackerSubTab('Visit a Park')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: trackerSubTab === 'Visit a Park' ? '#004487' : 'transparent', color: trackerSubTab === 'Visit a Park' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
            Visit a Park
          </button>
          <button onClick={() => setTrackerSubTab('Past Visits')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: trackerSubTab === 'Past Visits' ? '#004487' : 'transparent', color: trackerSubTab === 'Past Visits' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
            Past Visits
          </button>
        </div>
      )}

      {mainTab === 'analytics' && (
        <div style={{ display: 'flex', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3px', marginBottom: '10px' }}>
          <button onClick={() => setAnalyticsSubTab('averages')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'averages' ? '#004487' : 'transparent', color: analyticsSubTab === 'averages' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
            Averages
          </button>
          <button onClick={() => setAnalyticsSubTab('top10')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'top10' ? '#004487' : 'transparent', color: analyticsSubTab === 'top10' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
            Top 10s
          </button>
          <button onClick={() => setAnalyticsSubTab('cards')} style={{ flex: 1, padding: '9px 2px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: analyticsSubTab === 'cards' ? '#004487' : 'transparent', color: analyticsSubTab === 'cards' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
            Attendee Cards
          </button>
        </div>
      )}

      {mainTab === 'rainbow' && (
        <div style={{ display: 'flex', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3px', marginBottom: '14px' }}>
          <button onClick={() => setRainbowSubTab('stream')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: rainbowSubTab === 'stream' ? '#004487' : 'transparent', color: rainbowSubTab === 'stream' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
            Photo Stream
          </button>
          <button onClick={() => setRainbowSubTab('badges')} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', background: rainbowSubTab === 'badges' ? '#004487' : 'transparent', color: rainbowSubTab === 'badges' ? '#FFF' : '#4A5568', transition: 'all 0.2s ease' }}>
            Badges
          </button>
        </div>
      )}

      {/* 3. FILTER BY ATTENDEE (Shown on Checklist, and Analytics except Attendee Cards) */}
      {(mainTab === 'checklist' || (mainTab === 'analytics' && analyticsSubTab !== 'cards')) && (
        <div style={{ background: '#FFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '14px' }}>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>👤 FILTER BY ATTENDEE</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FIXED_FAMILY_MEMBERS.map(m => {
              const isSelected = selectedAttendee === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedAttendee(prev => prev === m ? 'ALL' : m)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: isSelected ? '2px solid #004487' : '1px solid #CBD5E0',
                    background: isSelected ? '#004487' : '#FFF',
                    color: isSelected ? '#FFF' : '#4A5568',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? `✓ ${m}` : m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PAGE WIDGETS */}

      {/* ==================== PAGE 1: TRACKER ==================== */}
      {mainTab === 'tracker' && (
        <div>
          {/* Subtab: Visit a Park */}
          {trackerSubTab === 'Visit a Park' && (
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
                    👥 <strong>Active Party:</strong> {activePartyList.join(', ')}
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

                      {activePartyList.length > 1 && (
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '10px' }}>
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
                              ✨ Disney Fun Fact:
                            </div>
                            {triviaLoading ? (
                              <div style={{ fontStyle: 'italic', color: '#718096' }}>Searching Imagineering vault for facts...</div>
                            ) : (
                              <div>{rideTrivia}</div>
                            )}
                          </div>

                          <div style={{ background: '#F0F5FF', border: '1px solid #C3DAFE', padding: '10px', borderRadius: '10px', marginTop: '8px', textAlign: 'left', fontSize: '12px', color: '#1A365D' }}>
                            <div style={{ fontWeight: '800', color: '#2B6CB0', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              👀 Hidden Mickeys:
                            </div>
                            {mickeyLoading ? (
                              <div style={{ fontStyle: 'italic', color: '#718096' }}>Scanning queue for Hidden Mickeys...</div>
                            ) : (
                              <div>{hiddenMickey}</div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button type="button" onClick={() => { setQueueStartTimestamp(null); setQueueStartTimeStr(null); setRideTrivia(null); setHiddenMickey(null); }} style={{ flex: 1, padding: '10px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
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
                                    {parseAttendees(activeVisit.attendees).map((m) => {
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

                  <button onClick={() => { setDepartingMembers(activePartyList); setShowCheckoutModal(true); }} style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #E53E3E, #C53030)', color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    👋 Leave the Park & Save Day
                  </button>
                </div>
              ) : (
                /* VISIT A PARK FORM (Replaces "✨ Enter the Magic") */
                <form onSubmit={handleCheckIn} style={{ background: '#FFF', padding: '22px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
                  <h2 style={{ marginTop: 0, fontSize: '19px', fontWeight: '800', color: '#004487', marginBottom: '15px', textAlign: 'center' }}>Visit a Park</h2>
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

              {/* TOTALS WIDGET */}
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
            </div>
          )}

          {/* Subtab: Past Visits */}
          {trackerSubTab === 'Past Visits' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#004487', paddingLeft: '5px' }}>
                Past Visits ({filteredVisits.length})
              </h2>
              {loading ? (
                <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', margin: '20px 0' }}>Syncing with Supabase cloud...</p>
              ) : filteredVisits.length === 0 ? (
                <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '14px', marginTop: '20px', fontStyle: 'italic' }}>No completed trips found for this view.</p>
              ) : (
                filteredVisits.map((v) => {
                  const partyList = parseAttendees(v.attendees);
                  const departureGroups: Record<string, string[]> = {};
                  partyList.forEach(m => {
                    const pTime = getPersonEndTime(v, m);
                    if (!departureGroups[pTime]) departureGroups[pTime] = [];
                    departureGroups[pTime].push(m);
                  });

                  const uniqueDepTimes = Object.keys(departureGroups);
                  const hasStaggeredCheckout = uniqueDepTimes.length > 1;

                  return (
                    <div key={v.id} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: '16px', marginBottom: '12px', background: '#FFF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #EDF2F7', paddingBottom: '8px', marginBottom: '10px' }}>
                        <strong style={{ color: '#004487', fontSize: '16px', fontWeight: '800' }}>
                          {PARK_EMOJIS[v.parkName] || ''} {v.parkName}
                        </strong>
                        <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>📅 {formatDisplayDate(v.visitDate)}</span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#4A5568', marginBottom: '10px' }}>
                        👥 <strong>Party:</strong> {partyList.join(', ')} <br />
                        
                        {!hasStaggeredCheckout ? (
                          <div style={{ marginTop: '2px' }}>
                            ⏱️ <strong>Hours:</strong> {format12Hour(v.startTime)} - {format12Hour(v.endTime)} <span style={{ color: '#2B6CB0', fontWeight: 'bold' }}>{calculateVisitDuration(v.startTime, v.endTime)}</span>
                          </div>
                        ) : (
                          <div style={{ marginTop: '6px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #EDF2F7' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#004487', marginBottom: '4px' }}>⏱️ HOURS:</div>
                            {uniqueDepTimes.map(depTime => (
                              <div key={depTime} style={{ fontSize: '12px', color: '#2D3748', marginTop: '2px' }}>
                                • <strong>{departureGroups[depTime].join(', ')}:</strong> {format12Hour(v.startTime)} - {format12Hour(depTime)} <span style={{ color: '#2B6CB0', fontWeight: '600' }}>{calculateVisitDuration(v.startTime, depTime)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {v.activities.length > 0 && (
                        <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #EDF2F7' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {v.activities.map((a) => {
                              const isEditingThis = editingActivityId === a.id && editingVisitId === v.id;
                              const actRidersList = parseAttendees(a.riders);

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
                                      {partyList.map((m) => {
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #EDF2F7' }}>
                        <button onClick={() => openEditVisit(v)} style={{ background: '#EBF8FF', color: '#2B6CB0', border: '1px solid #BEE3F8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}>
                          ✏️ Edit Visit Hours
                        </button>
                        <button onClick={() => deleteVisit(v.id)} style={{ background: 'none', border: 'none', color: '#E53E3E', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: '700' }}>
                          🗑️ Delete Entire Visit Log
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== PAGE 2: ANALYTICS ==================== */}
      {mainTab === 'analytics' && (
        <div>
          {/* Subtab: Averages */}
          {analyticsSubTab === 'averages' && (
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
          )}

          {/* Subtab: Top 10s */}
          {analyticsSubTab === 'top10' && (
            <div>
              {/* MOST TIMES RIDDEN */}
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

              {/* LONGEST WAIT TIMES */}
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

              {/* SHORTEST WAIT TIMES */}
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
            </div>
          )}

          {/* Subtab: Attendee Cards */}
          {analyticsSubTab === 'cards' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#004487', marginBottom: '16px', paddingLeft: '4px' }}>
                👥 Attendee Cards
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {FIXED_FAMILY_MEMBERS.map((person) => {
                  const personVisits = visits.filter(v => parseAttendees(v.attendees).includes(person));
                  const personActs = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).length, 0);
                  const personWaitMins = personVisits.reduce((sum, v) => sum + v.activities.filter(a => isPersonRider(a, v, person)).reduce((aSum, act) => aSum + act.waitTimeMinutes, 0), 0);
                  const personParkMins = personVisits.reduce((sum, v) => {
                    const pEndTime = getPersonEndTime(v, person);
                    if (!v.startTime || !pEndTime) return sum;
                    const start = parseTimeToMinutes(v.startTime);
                    const end = parseTimeToMinutes(pEndTime);
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
          )}
        </div>
      )}

      {/* ==================== PAGE 3: CHECKLIST ==================== */}
      {mainTab === 'checklist' && (
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
                            {isCompleted ? '✅' : '⚪'}
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

      {/* ==================== PAGE 4: RAINBOW ==================== */}
      {mainTab === 'rainbow' && (
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
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: isSel ? '2px solid #004487' : '1px solid #CBD5E0',
                            background: isSel ? '#004487' : '#FFF',
                            color: isSel ? '#FFF' : '#4A5568',
                            cursor: 'pointer'
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
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: isSel ? '2px solid #004487' : '1px solid #CBD5E0',
                            background: isSel ? '#004487' : '#FFF',
                            color: isSel ? '#FFF' : '#4A5568',
                            cursor: 'pointer'
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
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
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

      {/* ✏️ EDIT VISIT LOG MODAL */}
      {editingVisit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '22px', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: '#004487' }}>
              ✏️ Edit Visit Hours
            </h3>
            <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 16px 0' }}>
              {editingVisit.parkName} • {formatDisplayDate(editingVisit.visitDate)}
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>
                ⏰ ARRIVAL TIME (HH:MM / e.g. 08:59 or 14:30)
              </label>
              <input
                type="text"
                placeholder="e.g. 08:59"
                value={editVisitStartTime}
                onChange={(e) => setEditVisitStartTime(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>
                🚪 MAIN DEPARTURE TIME (e.g. 21:50)
              </label>
              <input
                type="text"
                placeholder="e.g. 21:50"
                value={editVisitEndTime}
                onChange={(e) => setEditVisitEndTime(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '6px' }}>
                👥 MEMBER DEPARTURE TIMES
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {parseAttendees(editingVisit.attendees).map(member => (
                  <div key={member} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D3748' }}>👤 {member}</span>
                    <input
                      type="text"
                      placeholder={editVisitEndTime || "HH:MM"}
                      value={editVisitMemberEndTimes[member] || ''}
                      onChange={(e) => {
                        setEditVisitMemberEndTimes({
                          ...editVisitMemberEndTimes,
                          [member]: e.target.value
                        });
                      }}
                      style={{ width: '110px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E0', fontSize: '13px', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditingVisit(null)}
                style={{ flex: 1, padding: '12px', background: '#EDF2F7', color: '#4A5568', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVisitEdit}
                style={{ flex: 2, padding: '12px', background: '#38A169', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👋 STAGGERED CHECK-OUT MODAL */}
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
