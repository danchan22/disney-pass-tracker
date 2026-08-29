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

export const PARK_ATTRACTIONS: Record<string, string[]> = {
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
