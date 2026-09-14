export const FIXED_FAMILY_MEMBERS = ['Dan', 'Mandie', 'Elijah', 'Sophia', 'Sam', 'Andrew'];

export const UNIVERSAL_ACTIVITIES = ['Character Meeting', 'Parade', 'Fireworks Show', 'Other / Show / Food'];

export const PARK_EMOJIS: Record<string, string> = {
  'Magic Kingdom': '🏰',
  'Epcot': '🪩',
  'Hollywood Studios': '🎥',
  'Animal Kingdom': '🌳',
};

export const PARK_NAMES: ('Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom')[] = [
  'Magic Kingdom', 'Epcot', 'Hollywood Studios', 'Animal Kingdom'
];

export const RAINBOW_COLORS: { name: string; hex: string; textHex: string; borderHex: string; bgTint: string }[] = [
  { name: 'Red', hex: '#E53E3E', textHex: '#C53030', borderHex: '#E53E3E', bgTint: '#FFF5F5' },
  { name: 'Orange', hex: '#DD6B20', textHex: '#C05621', borderHex: '#DD6B20', bgTint: '#FFFAF0' },
  { name: 'Yellow', hex: '#D69E2E', textHex: '#B7791F', borderHex: '#D69E2E', bgTint: '#FFFFF0' },
  { name: 'Green', hex: '#38A169', textHex: '#276749', borderHex: '#38A169', bgTint: '#F0FFF4' },
  { name: 'Blue', hex: '#3182CE', textHex: '#2B6CB0', borderHex: '#3182CE', bgTint: '#EBF8FF' },
  { name: 'Purple', hex: '#805AD5', textHex: '#6B46C1', borderHex: '#805AD5', bgTint: '#FAF5FF' },
  { name: 'White', hex: '#FFFFFF', textHex: '#2D3748', borderHex: '#A0AEC0', bgTint: '#FFFFFF' },
  { name: 'Black', hex: '#1A202C', textHex: '#2D3748', borderHex: '#1A202C', bgTint: '#EDF2F7' },
];

// SINGLE SOURCE OF TRUTH: Attractions categorized by Park & Land
export const PARK_ATTRACTIONS_BY_LAND: Record<string, Record<string, string[]>> = {
  'Magic Kingdom': {
    'Main Street, U.S.A.': [
      'Walt Disney World Railroad'
    ],
    'Adventureland': [
      'Jungle Cruise',
      'Pirates of the Caribbean',
      'Swiss Family Treehouse',
      'The Magic Carpets of Aladdin',
      'Walt Disney Enchanted Tiki Room'
    ],
    'Frontierland': [
      'Big Thunder Mountain Railroad',
      'Country Bear Musical Jamboree',
      'Tiana’s Bayou Adventure'
    ],
    'Liberty Square': [
      'Haunted Mansion',
      'The Hall of Presidents'
    ],
    'Fantasyland': [
      'Enchanted Tales with Belle',
      '“it’s a small world”',
      'Dumbo the Flying Elephant',
      'Mad Tea Party',
      'Mickey’s PhilharMagic',
      'Peter Pan’s Flight',
      'Prince Charming Regal Carrousel',
      'Seven Dwarfs Mine Train',
      'The Barnstormer',
      'The Many Adventures of Winnie the Pooh',
      'Under the Sea ~ Journey of The Little Mermaid'
    ],
    'Tomorrowland': [
      'Astro Orbiter',
      'Buzz Lightyear’s Space Ranger Spin',
      'Carousel of Progress',
      'Monsters, Inc. Laugh Floor',
      'Space Mountain',
      'Tomorrowland Speedway',
      'Tomorrowland Transit Authority PeopleMover',
      'TRON Lightcycle / Run'
    ]
  },
  'Epcot': {
    'World Celebration': [
      'Disney and Pixar Short Film Festival',
      'ImageWorks What If Labs',
      'Journey into Imagination with Figment',
      'Spaceship Earth'
    ],
    'World Discovery': [
      'Guardians of the Galaxy: Cosmic Rewind',
      'Mission: SPACE (Green)',
      'Mission: SPACE (Orange)',
      'Test Track'
    ],
    'World Nature': [
      'Awesome Planet',
      'Journey of Water, Inspired by Moana',
      'Living with the Land',
      'Soarin',
      'The Seas with Nemo & Friends',
      'Turtle Talk with Crush'
    ],
    'World Showcase': [
      'Beauty and the Beast Sing-Along',
      'Canada Circle-Vision 360',
      'Frozen Ever After',
      'Gran Fiesta Tour Starring The Three Caballeros',
      'Impressions de France',
      'Reflections of China',
      'Remy’s Ratatouille Adventure'
    ]
  },
  'Hollywood Studios': {
    'Hollywood Boulevard': [
      'Mickey & Minnie’s Runaway Railway'
    ],
    'Echo Lake': [
      'For the First Time in Forever: A Frozen Sing-Along Celebration',
      'Indiana Jones Epic Stunt Spectacular!',
      'Star Tours – The Adventures Continue',
      'Vacation Fun'
    ],
    'Sunset Boulevard': [
      'Beauty and the Beast Live on Stage',
      'Fantasmic',
      'Rock ’n’ Roller Coaster',
      'The Twilight Zone Tower of Terror'
    ],
    'Toy Story Land': [
      'Alien Swirling Saucers',
      'Slinky Dog Dash',
      'Toy Story Mania!'
    ],
    'Star Wars: Galaxy’s Edge': [
      'Millennium Falcon: Smugglers Run',
      'Star Wars: Rise of the Resistance'
    ],
    'Animation Courtyard': [
      'Disney Junior Play & Dance!',
      'Disney Villains: Unfairly Ever After',
      'The Little Mermaid: A Musical Adventure',
      'The Magic of Disney Animation',
      'Walt Disney Presents'
    ]
  },
  'Animal Kingdom': {
    'Discovery Island': [
      'Bluey’s Wild World at Conservation Station',
      'Zootopia: Better Together'
    ],
    'Pandora - The World of Avatar': [
      'Avatar Flight of Passage',
      'Na’vi River Journey'
    ],
    'Africa': [
      'Festival of the Lion King',
      'Gorilla Falls Exploration Trail',
      'Kilimanjaro Safaris',
      'Wildlife Express Train'
    ],
    'Asia': [
      'Expedition Everest',
      'Feathered Friends in Flight!',
      'Kali River Rapids',
      'Maharajah Jungle Trek'
    ],
    'DinoLand U.S.A.': [
      'Finding Nemo: The Big Blue... and Beyond!'
    ]
  }
};

// BACKWARDS COMPATIBILITY: Auto-derive flat PARK_ATTRACTIONS array from PARK_ATTRACTIONS_BY_LAND
export const PARK_ATTRACTIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(PARK_ATTRACTIONS_BY_LAND).map(([park, lands]) => [
    park,
    Object.values(lands).flat().sort((a, b) => a.localeCompare(b))
  ])
);

export interface ParkingSpotDetail {
  name: string;
  image: string;
  bgColor: string;
  darkText?: boolean;
}

export interface ParkingSectionGroup {
  section?: string;
  spots: ParkingSpotDetail[];
}

export const PARKING_OPTIONS: Record<string, ParkingSectionGroup[]> = {
  'Magic Kingdom': [
    {
      section: 'Heroes',
      spots: [
        { name: 'Woody', image: '/parking-mk-woody.png', bgColor: '#228ef1' },
        { name: 'Aladdin', image: '/parking-mk-aladdin.png', bgColor: '#228ef1' },
        { name: 'Peter Pan', image: '/parking-mk-peter-pan.png', bgColor: '#228ef1' },
        { name: 'Simba', image: '/parking-mk-simba.png', bgColor: '#228ef1' },
        { name: 'Rapunzel', image: '/parking-mk-rapunzel.png', bgColor: '#228ef1' },
        { name: 'Mulan', image: '/parking-mk-mulan.png', bgColor: '#228ef1' },
      ],
    },
    {
      section: 'Villains',
      spots: [
        { name: 'Jafar', image: '/parking-mk-jafar.png', bgColor: '#ca2931' },
        { name: 'Zurg', image: '/parking-mk-zurg.png', bgColor: '#ca2931' },
        { name: 'Scar', image: '/parking-mk-scar.png', bgColor: '#ca2931' },
        { name: 'Hook', image: '/parking-mk-hook.png', bgColor: '#ca2931' },
        { name: 'Cruella', image: '/parking-mk-cruella.png', bgColor: '#ca2931' },
        { name: 'Ursula', image: '/parking-mk-ursula.png', bgColor: '#ca2931' },
      ],
    },
  ],
  'Epcot': [
    {
      section: 'Space',
      spots: [
        { name: 'Wall-E', image: '/parking-epcot-wall-e.png', bgColor: '#6760ad' },
        { name: 'Eve', image: '/parking-epcot-eve.png', bgColor: '#6760ad' },
        { name: 'Rocket', image: '/parking-epcot-rocket.png', bgColor: '#6760ad' },
        { name: 'Gamora', image: '/parking-epcot-gamora.png', bgColor: '#6760ad' },
      ],
    },
    {
      section: 'Earth',
      spots: [
        { name: 'Moana', image: '/parking-epcot-moana.png', bgColor: '#aec735', darkText: true },
        { name: 'Heihei', image: '/parking-epcot-heihei.png', bgColor: '#aec735', darkText: true },
        { name: 'Crush', image: '/parking-epcot-crush.png', bgColor: '#aec735', darkText: true },
        { name: 'Dory', image: '/parking-epcot-dory.png', bgColor: '#aec735', darkText: true },
      ],
    },
  ],
  'Hollywood Studios': [
    {
      spots: [
        { name: 'Mickey', image: '/parking-studios-mickey.png', bgColor: '#c08713' },
        { name: 'Minnie', image: '/parking-studios-minnie.png', bgColor: '#da0851' },
        { name: 'Jessie', image: '/parking-studios-jesse.png', bgColor: '#29511f' },
        { name: 'Buzz', image: '/parking-studios-buzz.png', bgColor: '#661e82' },
        { name: 'Olaf', image: '/parking-studios-olaf.png', bgColor: '#0274aa' },
        { name: 'BB-8', image: '/parking-studios-bb8.png', bgColor: '#cd6d06' },
      ],
    },
  ],
  'Animal Kingdom': [
    {
      spots: [
        { name: 'Peacock', image: '/parking-ak-peacock.png', bgColor: '#003c1c' },
        { name: 'Butterfly', image: '/parking-ak-butterfly.png', bgColor: '#003c1c' },
        { name: 'Giraffe', image: '/parking-ak-giraffe.png', bgColor: '#003c1c' },
        { name: 'Dinosaur', image: '/parking-ak-dinosaur.png', bgColor: '#003c1c' },
        { name: 'Yeti', image: '/parking-ak-yeti.png', bgColor: '#003c1c' },
        { name: 'Unicorn', image: '/parking-ak-unicorn.png', bgColor: '#003c1c' },
      ],
    },
  ],
};

