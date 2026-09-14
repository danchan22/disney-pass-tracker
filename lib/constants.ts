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
      'Canada Far and Wide in Circle-Vision 360',
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

// Auto-derive flat PARK_ATTRACTIONS array for backward compatibility
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

export const RIDE_TRIVIA_DB: Record<string, string[]> = {
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

export const HIDDEN_MICKEYS_DB: Record<string, string[]> = {
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
