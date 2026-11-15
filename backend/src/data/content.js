/**
 * Siargao Pixel Life — seed content.
 *
 * This file is the single source of truth for the default game content
 * (destinations, NPCs, activities, quizzes, missions, shop items).
 * `npm run db:generate-sql` turns it into database/siargao_pixel_life.sql,
 * which can be imported with MySQL Workbench or `npm run db:init`.
 *
 * Mission objective types (validated by the backend mission service):
 *   collect_trash { count }            -> POST /api/cleanup/collect
 *   talk_npc      { target, count:1 }  -> POST /api/npcs/:key/talk
 *   quiz          { target, count:1 }  -> POST /api/quizzes/:key/submit (pass >= 60%)
 *   activity      { target, count }    -> POST /api/activities/:id/complete
 *   surf          { target, count }    -> POST /api/surfing/submit-score (challenge passed)
 *   visit         { count:1 }          -> POST /api/tourist-spots/:id/visit
 */

export const touristSpots = [
  {
    key: 'cloud9',
    name: 'Cloud 9',
    location_type: 'surf_beach',
    municipality: 'General Luna',
    cleanliness: 65,
    description:
      'The surfing capital of the Philippines. Its famous wooden boardwalk leads to a viewing tower above a thick right-hand reef break.',
    environment: {
      theme: 'cloud9',
      trashCount: 24,
      surf: true,
      mapPos: { x: 63, y: 66 },
      facts: [
        'Cloud 9 is a reef break: waves break over living coral, so surfers must never stand on the reef.',
        'The boardwalk lets visitors reach the lineup without trampling the reef flat.',
        'Plastic left on the beach is carried into the reef by the tide within hours.',
      ],
    },
  },
  {
    key: 'magpupungko',
    name: 'Magpupungko Rock Pools',
    location_type: 'tidal_pools',
    municipality: 'Pilar',
    cleanliness: 72,
    description:
      'Giant rock formations and natural tidal pools that appear at low tide, full of tiny sea creatures.',
    environment: {
      theme: 'magpupungko',
      trashCount: 20,
      surf: false,
      mapPos: { x: 72, y: 40 },
      facts: [
        'The tidal pools are only safe to swim in at low tide; always check the tide schedule.',
        'Sea urchins, small fish and crabs live in the pools — look, but never take them home.',
        'Sunscreen with oxybenzone harms tiny pool organisms. Use reef-safe sunscreen.',
      ],
    },
  },
  {
    key: 'sugba',
    name: 'Sugba Lagoon',
    location_type: 'lagoon',
    municipality: 'Del Carmen',
    cleanliness: 80,
    description:
      'A calm emerald lagoon surrounded by limestone cliffs and the largest mangrove forest in Mindanao.',
    environment: {
      theme: 'sugba',
      trashCount: 18,
      surf: false,
      mapPos: { x: 30, y: 52 },
      facts: [
        'Del Carmen protects one of the largest contiguous mangrove forests in the Philippines.',
        'Mangroves are nurseries for fish and protect villages from storm surges.',
        'Single-use plastic is discouraged at the lagoon — bring a reusable water bottle.',
      ],
    },
  },
  {
    key: 'naked',
    name: 'Naked Island',
    location_type: 'sandbar',
    municipality: 'General Luna',
    cleanliness: 70,
    description:
      'A bare white sandbar with no trees or buildings — just sand, sun and a 360° view of turquoise water.',
    environment: {
      theme: 'naked',
      trashCount: 16,
      surf: false,
      mapPos: { x: 72, y: 76 },
      facts: [
        'Naked Island has no bins: everything you bring, you must bring back.',
        'Sandbars change shape with tides and storms — they are fragile, living landforms.',
        'Floating plastic washes up here from the open sea, so cleanups help the whole coast.',
      ],
    },
  },
  {
    key: 'guyam',
    name: 'Guyam Island',
    location_type: 'islet',
    municipality: 'General Luna',
    cleanliness: 78,
    description: 'A tiny, round islet crowned with coconut trees — the postcard of island hopping in Siargao.',
    environment: {
      theme: 'guyam',
      trashCount: 16,
      surf: false,
      mapPos: { x: 66, y: 80 },
      facts: [
        'Guyam is cared for by caretakers from the local barangay; the small entrance fee funds cleanups.',
        'Never carve names into coconut trees — the wounds let pests and disease in.',
        'Coconut crabs and nesting birds depend on undisturbed islet vegetation.',
      ],
    },
  },
  {
    key: 'daku',
    name: 'Daku Island',
    location_type: 'village_island',
    municipality: 'General Luna',
    cleanliness: 68,
    description:
      'The largest of the three island-hopping islands, home to a fishing community and long white beaches.',
    environment: {
      theme: 'daku',
      trashCount: 22,
      surf: false,
      mapPos: { x: 58, y: 84 },
      facts: [
        'Daku means "big" in Surigaonon. Families here live from fishing and coconut farming.',
        'Buying grilled fish or crafts from locals keeps tourism money inside the community.',
        'Fishers practice sustainable catch sizes so reef fish can keep reproducing.',
      ],
    },
  },
  {
    key: 'pacifico',
    name: 'Pacifico Beach',
    location_type: 'surf_beach',
    municipality: 'San Isidro',
    cleanliness: 75,
    description: 'A long, quiet beach in the north with consistent waves and a relaxed, local vibe.',
    environment: {
      theme: 'pacifico',
      trashCount: 20,
      surf: true,
      mapPos: { x: 80, y: 22 },
      facts: [
        'Pacifico faces the open Pacific, so swells arrive here first.',
        'Sea turtles feed in the seagrass beds offshore; give them at least 3 meters of space.',
        'Fishing lines and nets left on the beach can entangle turtles and seabirds.',
      ],
    },
  },
  {
    key: 'sohoton',
    name: 'Sohoton Cove',
    location_type: 'cove',
    municipality: 'Socorro, Bucas Grande',
    cleanliness: 85,
    description:
      'A hidden cove reached through a low cave entrance, known for its stingless jellyfish and crystal waters.',
    environment: {
      theme: 'sohoton',
      trashCount: 14,
      surf: false,
      mapPos: { x: 20, y: 18 },
      facts: [
        'Sohoton is a protected area: only registered boats and guides may enter.',
        'Stingless jellyfish are delicate — touching or lifting them out of the water can kill them.',
        'Boat engines are switched off inside the cove to protect the calm, clear water.',
      ],
    },
  },
  {
    key: 'taktak',
    name: 'Taktak Falls',
    location_type: 'waterfall',
    municipality: 'Santa Monica',
    cleanliness: 74,
    description: 'A multi-tiered waterfall hidden in the forest, with a cool, refreshing swimming basin.',
    environment: {
      theme: 'taktak',
      trashCount: 18,
      surf: false,
      mapPos: { x: 50, y: 12 },
      facts: [
        'River water from Taktak flows down to the mangroves and reefs — litter here ends up in the sea.',
        'Soap and shampoo pollute fresh water: never bathe with them in natural pools.',
        'Stay on marked trails to avoid erosion of the forest floor.',
      ],
    },
  },
];

export const npcs = [
  // Cloud 9
  { key: 'kuya_jun', spot: 'cloud9', name: 'Kuya Jun', role: 'Surf Instructor',
    dialogue: [
      'Welcome to Cloud 9, the wave that made Siargao famous!',
      'Before you surf: respect the lineup, never drop in on another surfer, and never stand on the reef.',
      'Pick a board at the rental shop and paddle out when you are ready. I will guide you!',
    ],
    info: 'Surf etiquette: the surfer closest to the peak has the right of way. Wait your turn and smile!' },
  { key: 'ate_marites', spot: 'cloud9', name: 'Ate Marites', role: 'Environmental Volunteer',
    dialogue: [
      'Every morning the tide brings plastic back to the beach.',
      'If everyone picks up just a few pieces, Cloud 9 stays beautiful for everyone.',
      'Would you help us? Collect the trash along the shore and put it in the eco bins.',
    ],
    info: 'A plastic bottle can take 450 years to break down — and it never truly disappears, it becomes microplastic.' },
  { key: 'mang_ramon', spot: 'cloud9', name: 'Mang Ramon', role: 'Boardwalk Caretaker',
    dialogue: [
      'This boardwalk takes a beating from the salt and the storms.',
      'Some planks are loose. A safe boardwalk keeps visitors off the fragile reef flat.',
      'Find the marked planks and press E to fix them.',
    ],
    info: 'Boardwalks protect coastal habitats by guiding foot traffic away from reef flats and dunes.' },
  // Magpupungko
  { key: 'lola_pacing', spot: 'magpupungko', name: 'Lola Pacing', role: 'Local Resident',
    dialogue: [
      'I have watched these pools since I was a little girl.',
      'At low tide they fill with clear water and little fish. At high tide the waves crash over the rocks.',
      'Please, do not take shells or creatures home. They belong here.',
    ],
    info: 'Tidal pool creatures survive extreme heat and salt changes, but not being moved or handled.' },
  { key: 'tour_guide_ben', spot: 'magpupungko', name: 'Guide Ben', role: 'Tourist Guide',
    dialogue: [
      'Hello! I am a registered tour guide here in Pilar.',
      'Read the info boards around the rocks to learn how the pools formed.',
      'Then take my quick quiz — I will give you a certificate for responsible visitors!',
    ],
    info: 'Hiring registered local guides supports families and keeps visitors safe from the tide.' },
  // Sugba
  { key: 'kapitan_doming', spot: 'sugba', name: 'Kapitan Doming', role: 'Barangay Community Leader',
    dialogue: [
      'Maayong adlaw! Welcome to Sugba Lagoon in Del Carmen.',
      'Our mangroves feed the fish that feed our families.',
      'Take a kayak, explore quietly, and help us fish out any floating litter.',
    ],
    info: 'Del Carmen replanted thousands of mangrove seedlings after Typhoon Odette in 2021.' },
  { key: 'kayak_nene', spot: 'sugba', name: 'Nene', role: 'Kayak Rental',
    dialogue: [
      'Want to paddle? Kayaks are quiet and do not pollute the water.',
      'Follow the yellow buoys around the lagoon. Use A and D to paddle left and right!',
    ],
    info: 'Paddling instead of motor boats keeps lagoon water clear and quiet for wildlife.' },
  // Naked Island
  { key: 'bangkero_toto', spot: 'naked', name: 'Toto', role: 'Boatman (Bangkero)',
    dialogue: [
      'This is Naked Island — no trees, no shade, just sand and sea!',
      'There are no trash bins here, so whatever we bring, we take back on the boat.',
      'Help me pick up what the waves left on the sandbar.',
    ],
    info: 'Leave No Trace: plan ahead, carry out what you carry in, and leave what you find.' },
  // Guyam
  { key: 'caretaker_lito', spot: 'guyam', name: 'Lito', role: 'Island Caretaker',
    dialogue: [
      'I look after Guyam every day.',
      'Visitors love the coconut trees, but some carve their names into them. It hurts the trees.',
      'Help me keep the shore clean and learn about the reef around the islet.',
    ],
    info: 'Seagrass and coral around Guyam shelter juvenile fish that later grow up on the open reef.' },
  // Daku
  { key: 'mang_tonyo', spot: 'daku', name: 'Mang Tonyo', role: 'Local Fisherman',
    dialogue: [
      'My family has fished these waters for generations.',
      'Plastic nets and bottles end up in my catch more and more.',
      'If you want to help, clean the village shore and buy local — it keeps our community strong.',
    ],
    info: 'Ghost nets — lost fishing nets — keep catching fish and turtles for years after they are lost.' },
  { key: 'aling_nena', spot: 'daku', name: 'Aling Nena', role: 'Local Shop Owner',
    dialogue: [
      'Fresh grilled fish, buko juice, woven bags made by our neighbors!',
      'When you buy here, the money stays with the families of Daku.',
    ],
    info: 'Community-based tourism shares the benefits of tourism directly with local families.' },
  // Pacifico
  { key: 'surfer_aya', spot: 'pacifico', name: 'Aya', role: 'Local Surfer',
    dialogue: [
      'Pacifico is quieter than Cloud 9 — perfect for practice.',
      'Turtles feed just past the break. Never chase or touch them.',
      'Grab a board and try the challenge when you are ready!',
    ],
    info: 'Keep at least 3 meters from sea turtles and never block their path to the surface.' },
  { key: 'volunteer_carlo', spot: 'pacifico', name: 'Carlo', role: 'Marine Volunteer',
    dialogue: [
      'We run beach cleanups here every weekend.',
      'Fishing line and plastic straws are the worst — turtles mistake them for food.',
    ],
    info: 'Sea turtles mistake floating plastic bags for jellyfish, one of their favorite foods.' },
  // Sohoton
  { key: 'ranger_ines', spot: 'sohoton', name: 'Ranger Ines', role: 'Protected Area Ranger',
    dialogue: [
      'Welcome to Sohoton Cove, part of a protected landscape.',
      'You may swim with the stingless jellyfish, but never touch, squeeze or lift them.',
      'Follow the rules on the boards and you can enjoy this place responsibly.',
    ],
    info: 'Protected areas limit the number of visitors per day so the ecosystem can recover.' },
  // Taktak
  { key: 'guide_rico', spot: 'taktak', name: 'Rico', role: 'Trail Guide',
    dialogue: [
      'Taktak means "falling water" — listen to it!',
      'This river feeds the mangroves and the sea, so keep it clean.',
      'Please no soap or shampoo in the pool, and take your snacks wrappers home.',
    ],
    info: 'Freshwater ecosystems connect forests to reefs — pollution travels downstream.' },
];

export const quizzes = [
  {
    key: 'marine_basics', spot: 'cloud9', title: 'Marine Protection Basics', category: 'marine',
    questions: [
      { q: 'What happens to most plastic left on the beach?',
        options: ['It disappears in a few days', 'The tide carries it into the sea', 'Crabs eat it safely', 'It turns into sand'],
        answer: 1, explain: 'Tides and wind carry beach litter into the ocean, where it harms reefs and animals.' },
      { q: 'Why should surfers never stand on the reef?',
        options: ['It is slippery', 'Coral is a living animal that breaks easily', 'It is against surf rules only', 'There is no reason'],
        answer: 1, explain: 'Coral polyps are living animals. One step can destroy decades of growth.' },
      { q: 'How long can a plastic bottle last in the ocean?',
        options: ['1 year', '10 years', 'About 450 years', '1 month'],
        answer: 2, explain: 'Plastic bottles break into microplastics over hundreds of years but never truly disappear.' },
      { q: 'What is the best way to help marine life as a visitor?',
        options: ['Feed the fish bread', 'Take shells as souvenirs', 'Bring reusable bottles and carry your trash out', 'Touch coral to feel it'],
        answer: 2, explain: 'Reducing and carrying out waste is the simplest, most powerful action.' },
      { q: 'Which sunscreen is better for reefs?',
        options: ['Any spray sunscreen', 'Reef-safe mineral sunscreen', 'Cooking oil', 'No difference'],
        answer: 1, explain: 'Mineral (zinc/titanium) sunscreens without oxybenzone are less harmful to coral.' },
    ],
  },
  {
    key: 'tidal_pools', spot: 'magpupungko', title: 'Tidal Pool Explorer', category: 'marine',
    questions: [
      { q: 'When are the Magpupungko pools safe to swim in?',
        options: ['At high tide', 'At low tide', 'During storms', 'At night'],
        answer: 1, explain: 'At high tide waves crash over the rocks. Always check the tide schedule.' },
      { q: 'You find a beautiful shell with a creature inside. What do you do?',
        options: ['Take it home', 'Leave it where it is', 'Sell it', 'Give it to a friend'],
        answer: 1, explain: 'Shells are homes. Removing them disrupts the tidal pool ecosystem.' },
      { q: 'Why hire a registered local guide?',
        options: ['It is cheaper', 'It supports local families and keeps you safe', 'Guides carry your bags', 'It is not needed'],
        answer: 1, explain: 'Local guides know the tides and share tourism income with the community.' },
      { q: 'Where should your snack wrapper go?',
        options: ['In a rock crack', 'In your bag until you find a bin', 'In the pool', 'Bury it in sand'],
        answer: 1, explain: 'Carry your trash until you find a proper bin — never hide it in nature.' },
    ],
  },
  {
    key: 'water_conservation', spot: 'sugba', title: 'Lagoon & Mangrove Conservation', category: 'marine',
    questions: [
      { q: 'Why are mangroves important?',
        options: ['They block the view', 'They are fish nurseries and protect against storm surge', 'They are only decorative', 'They make water salty'],
        answer: 1, explain: 'Mangrove roots shelter baby fish and absorb wave energy during storms.' },
      { q: 'Which is the most eco-friendly way to explore Sugba Lagoon?',
        options: ['Jet ski', 'Kayak or paddleboard', 'Speedboat laps', 'Swimming with soap'],
        answer: 1, explain: 'Paddle-powered craft create no fuel pollution or noise.' },
      { q: 'What should you bring to reduce plastic waste?',
        options: ['Many plastic bottles', 'A reusable water bottle', 'Styrofoam boxes', 'Plastic straws'],
        answer: 1, explain: 'Reusable bottles avoid dozens of single-use plastics per trip.' },
      { q: 'What should you do if you see floating litter in the lagoon?',
        options: ['Ignore it', 'Push it away', 'Safely collect it and bring it to shore', 'Sink it'],
        answer: 2, explain: 'Collected litter can be recycled or disposed of properly on land.' },
    ],
  },
  {
    key: 'responsible_tourism', spot: 'guyam', title: 'Responsible Tourism Challenge', category: 'tourism',
    questions: [
      { q: 'You want a souvenir from Guyam Island. What is best?',
        options: ['Carve your name in a coconut tree', 'Take sand and coral', 'Take photos and buy local crafts', 'Pick flowers'],
        answer: 2, explain: '"Take only pictures, leave only footprints" — and support local artisans.' },
      { q: 'What does the small environmental fee at islands pay for?',
        options: ['Nothing', 'Cleanups and caretakers', 'Only souvenirs', 'Boat fuel only'],
        answer: 1, explain: 'Environmental fees fund caretakers, cleanups and conservation programs.' },
      { q: 'How should you treat local residents and their culture?',
        options: ['Ignore local rules', 'Respect customs and ask before taking photos', 'Be loud everywhere', 'Bargain aggressively'],
        answer: 1, explain: 'Respect makes tourism welcome and sustainable for everyone.' },
      { q: 'Who is responsible for keeping Siargao clean?',
        options: ['Only residents', 'Only the government', 'Only tourists', 'Everyone'],
        answer: 3, explain: 'Siargao is everyone\'s responsibility — residents and visitors alike.' },
    ],
  },
  {
    key: 'turtle_safety', spot: 'pacifico', title: 'Sea Turtle Safety', category: 'marine',
    questions: [
      { q: 'How close should you get to a sea turtle in the water?',
        options: ['Touch it gently', 'At least 3 meters away', 'Ride on it', 'Hold its shell'],
        answer: 1, explain: 'Keeping distance prevents stress and lets turtles surface to breathe.' },
      { q: 'Why are plastic bags dangerous to turtles?',
        options: ['They are noisy', 'Turtles mistake them for jellyfish', 'They are too heavy', 'They are not dangerous'],
        answer: 1, explain: 'Swallowed plastic blocks a turtle\'s stomach and can kill it.' },
      { q: 'You find old fishing line on the beach. What do you do?',
        options: ['Leave it', 'Throw it into the sea', 'Collect it and dispose of it properly', 'Burn it on the sand'],
        answer: 2, explain: 'Fishing line entangles turtles and birds; collecting it saves lives.' },
    ],
  },
  {
    key: 'protected_cove', spot: 'sohoton', title: 'Protected Area Rules', category: 'marine',
    questions: [
      { q: 'How should you behave around stingless jellyfish?',
        options: ['Squeeze them', 'Lift them for photos', 'Observe without touching', 'Collect them in a bottle'],
        answer: 2, explain: 'Their bodies are fragile; lifting them out of the water can kill them.' },
      { q: 'Why are boat engines turned off inside the cove?',
        options: ['To save money', 'To protect the calm, clean water and wildlife', 'Engines are broken', 'No reason'],
        answer: 1, explain: 'Engines add noise, oil and stir up sediment in a delicate cove.' },
      { q: 'Why do protected areas limit visitor numbers?',
        options: ['To be exclusive', 'So ecosystems can recover', 'To raise prices', 'They do not'],
        answer: 1, explain: 'Carrying capacity limits keep the environment healthy long-term.' },
    ],
  },
  {
    key: 'freshwater', spot: 'taktak', title: 'Rivers to Reefs', category: 'environment',
    questions: [
      { q: 'Where does litter dropped at Taktak Falls eventually go?',
        options: ['It stays in the forest', 'Down the river to the mangroves and sea', 'Into the sky', 'Nowhere'],
        answer: 1, explain: 'Rivers carry litter from mountains to mangroves and coral reefs.' },
      { q: 'Can you use shampoo in the waterfall pool?',
        options: ['Yes, any time', 'Only a little', 'No — soaps pollute freshwater', 'Only biodegradable glitter'],
        answer: 2, explain: 'Soaps and shampoos harm fish and plants in the pool and downstream.' },
      { q: 'Why stay on marked trails?',
        options: ['To avoid erosion and protect plants', 'Trails are faster', 'No reason', 'To find trash'],
        answer: 0, explain: 'Trampling off-trail damages roots and causes erosion into the river.' },
    ],
  },
  {
    key: 'community_care', spot: 'daku', title: 'Community & Local Business', category: 'community',
    questions: [
      { q: 'How does buying from local stores help Daku Island?',
        options: ['It does not', 'Money stays with local families', 'It raises pollution', 'It only helps big hotels'],
        answer: 1, explain: 'Local purchases directly support families and community projects.' },
      { q: 'What is a "ghost net"?',
        options: ['A haunted net', 'A lost fishing net that keeps catching animals', 'A net for catching ghosts', 'A volleyball net'],
        answer: 1, explain: 'Lost nets keep trapping fish, turtles and dolphins for years.' },
      { q: 'What is the best thing to do with plastic at a community cleanup?',
        options: ['Burn it', 'Bury it', 'Sort it for recycling and proper disposal', 'Throw it at sea'],
        answer: 2, explain: 'Burning plastic releases toxic smoke; sorting allows recycling.' },
    ],
  },
];

export const activities = [
  { key: 'cleanup_cloud9', spot: 'cloud9', name: 'Cloud 9 Beach Cleanup', type: 'cleanup', description: 'Pick up litter along the Cloud 9 shoreline.', config: {} },
  { key: 'boardwalk_repair', spot: 'cloud9', name: 'Boardwalk Maintenance', type: 'maintenance', description: 'Repair loose planks on the Cloud 9 boardwalk.', config: { points: 4, holdMs: 1500 } },
  { key: 'surf_cloud9', spot: 'cloud9', name: 'Surf Cloud 9', type: 'surf', description: 'Paddle out, catch a wave and ride it.', config: {} },
  { key: 'explore_cloud9', spot: 'cloud9', name: 'Cloud 9 Info Trail', type: 'explore', description: 'Read the educational boards around Cloud 9.', config: { points: 3 } },
  { key: 'explore_magpupungko', spot: 'magpupungko', name: 'Rock Formation Trail', type: 'explore', description: 'Explore the rocks and read the tidal pool info boards.', config: { points: 3 } },
  { key: 'cleanup_magpupungko', spot: 'magpupungko', name: 'Rock Pool Cleanup', type: 'cleanup', description: 'Collect litter in the designated cleanup area.', config: {} },
  { key: 'kayak_sugba', spot: 'sugba', name: 'Sugba Kayak Loop', type: 'kayak', description: 'Paddle through all buoys around the lagoon.', config: { checkpoints: 6, minTimeMs: 15000 } },
  { key: 'explore_sugba', spot: 'sugba', name: 'Mangrove Boardwalk', type: 'explore', description: 'Learn about the mangroves and the lagoon.', config: { points: 3 } },
  { key: 'cleanup_sugba', spot: 'sugba', name: 'Lagoon Water Cleanup', type: 'cleanup', description: 'Collect floating and shore litter.', config: {} },
  { key: 'cleanup_naked', spot: 'naked', name: 'Sandbar Cleanup', type: 'cleanup', description: 'Collect washed-up waste on the sandbar.', config: {} },
  { key: 'explore_naked', spot: 'naked', name: 'Sandbar Walk', type: 'explore', description: 'Walk the sandbar and learn Leave No Trace.', config: { points: 2 } },
  { key: 'cleanup_guyam', spot: 'guyam', name: 'Islet Cleanup', type: 'cleanup', description: 'Keep Guyam\'s shore clean.', config: {} },
  { key: 'explore_guyam', spot: 'guyam', name: 'Guyam Reef Watch', type: 'explore', description: 'Learn about the islet and its reef.', config: { points: 2 } },
  { key: 'cleanup_daku', spot: 'daku', name: 'Village Shore Cleanup', type: 'cleanup', description: 'Clean the community shoreline.', config: {} },
  { key: 'support_local_daku', spot: 'daku', name: 'Support Local Business', type: 'community', description: 'Buy a local product from Aling Nena\'s store.', config: {} },
  { key: 'help_fisherman', spot: 'daku', name: 'Net Sorting', type: 'maintenance', description: 'Help Mang Tonyo sort and stack fishing nets so none are lost at sea.', config: { points: 3, holdMs: 1200 } },
  { key: 'surf_pacifico', spot: 'pacifico', name: 'Surf Pacifico', type: 'surf', description: 'Catch the Pacific swell.', config: {} },
  { key: 'cleanup_pacifico', spot: 'pacifico', name: 'Turtle-Safe Beach Cleanup', type: 'cleanup', description: 'Remove fishing line and plastics from the beach.', config: {} },
  { key: 'explore_sohoton', spot: 'sohoton', name: 'Cove Explorer', type: 'explore', description: 'Explore the cove and read the protected-area rules.', config: { points: 3 } },
  { key: 'cleanup_sohoton', spot: 'sohoton', name: 'Cove Shoreline Care', type: 'cleanup', description: 'Collect litter from the cove shore.', config: {} },
  { key: 'explore_taktak', spot: 'taktak', name: 'Waterfall Trail', type: 'explore', description: 'Follow the trail and learn about freshwater ecosystems.', config: { points: 3 } },
  { key: 'cleanup_taktak', spot: 'taktak', name: 'Falls Cleanup', type: 'cleanup', description: 'Collect waste around the waterfall basin.', config: {} },
];

const both = 'both';
const local = 'local_resident';
const tourist = 'tourist';

export const missions = [
  // ---------------- Cloud 9 ----------------
  { key: 'maintain_cloud9', spot: 'cloud9', title: 'Maintain Cloud 9', category: 'beach_cleanup', difficulty: 'easy',
    role: local, xp: 150, coins: 500, badge: 'Cloud 9 Keeper', repeatable: false,
    description: 'Help Ate Marites and Mang Ramon keep Cloud 9 clean and safe for everyone.',
    objectives: [
      { id: 'trash', type: 'collect_trash', count: 15, label: 'Collect 15 pieces of trash' },
      { id: 'npc', type: 'talk_npc', target: 'kuya_jun', count: 1, label: 'Talk to the Surf Instructor' },
      { id: 'repair', type: 'activity', target: 'boardwalk_repair', count: 4, label: 'Maintain the boardwalk (4 planks)' },
      { id: 'quiz', type: 'quiz', target: 'marine_basics', count: 1, label: 'Pass the marine protection quiz' },
    ] },
  { key: 'first_wave', spot: 'cloud9', title: 'Catch Your First Wave', category: 'surfing', difficulty: 'easy',
    role: both, xp: 120, coins: 200, badge: 'Grommet', repeatable: false,
    description: 'Learn surf etiquette from Kuya Jun and complete the beginner surf challenge.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'kuya_jun', count: 1, label: 'Talk to Kuya Jun' },
      { id: 'surf', type: 'surf', target: 'beginner', count: 1, label: 'Complete the beginner surf challenge' },
    ] },
  { key: 'cloud9_pro', spot: 'cloud9', title: 'Cloud 9 Challenger', category: 'surfing', difficulty: 'medium',
    role: both, xp: 250, coins: 400, badge: 'Cloud 9 Charger', repeatable: false,
    description: 'Ride longer and carve harder: complete the intermediate surf challenge at Cloud 9.',
    objectives: [
      { id: 'surf', type: 'surf', target: 'intermediate', count: 1, label: 'Complete the intermediate surf challenge' },
    ] },
  { key: 'cloud9_tourist', spot: 'cloud9', title: 'Responsible Surf Tourist', category: 'responsible_tourism', difficulty: 'easy',
    role: tourist, xp: 120, coins: 250, badge: 'Reef Respecter', repeatable: false,
    description: 'Visit Cloud 9, read the info trail and learn why the reef matters.',
    objectives: [
      { id: 'visit', type: 'visit', count: 1, label: 'Visit Cloud 9' },
      { id: 'explore', type: 'activity', target: 'explore_cloud9', count: 3, label: 'Read 3 info boards' },
      { id: 'quiz', type: 'quiz', target: 'marine_basics', count: 1, label: 'Pass the marine protection quiz' },
    ] },
  { key: 'cloud9_daily_cleanup', spot: 'cloud9', title: 'Daily Shore Sweep: Cloud 9', category: 'beach_cleanup', difficulty: 'easy',
    role: both, xp: 60, coins: 100, badge: null, repeatable: true,
    description: 'A quick repeatable cleanup. Every sweep raises Cloud 9\'s community cleanliness.',
    objectives: [ { id: 'trash', type: 'collect_trash', count: 8, label: 'Collect 8 pieces of trash' } ] },

  // ---------------- Magpupungko ----------------
  { key: 'magpupungko_explorer', spot: 'magpupungko', title: 'Rock Pool Explorer', category: 'exploration', difficulty: 'easy',
    role: tourist, xp: 140, coins: 250, badge: 'Tide Pool Explorer', repeatable: false,
    description: 'Explore the rock formations, learn about the pools and pass Guide Ben\'s quiz.',
    objectives: [
      { id: 'visit', type: 'visit', count: 1, label: 'Visit Magpupungko' },
      { id: 'npc', type: 'talk_npc', target: 'tour_guide_ben', count: 1, label: 'Talk to Guide Ben' },
      { id: 'explore', type: 'activity', target: 'explore_magpupungko', count: 3, label: 'Read 3 info boards' },
      { id: 'quiz', type: 'quiz', target: 'tidal_pools', count: 1, label: 'Pass the tidal pool quiz' },
    ] },
  { key: 'magpupungko_cleanup', spot: 'magpupungko', title: 'Protect the Pools', category: 'environmental_protection', difficulty: 'medium',
    role: local, xp: 160, coins: 300, badge: 'Pool Protector', repeatable: false,
    description: 'Lola Pacing needs help collecting litter in the designated cleanup area.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'lola_pacing', count: 1, label: 'Talk to Lola Pacing' },
      { id: 'trash', type: 'collect_trash', count: 12, label: 'Collect 12 pieces of litter' },
    ] },

  // ---------------- Sugba ----------------
  { key: 'sugba_responsible', spot: 'sugba', title: 'Responsible Tourist at Sugba Lagoon', category: 'responsible_tourism', difficulty: 'medium',
    role: tourist, xp: 220, coins: 400, badge: 'Responsible Tourist Certificate', repeatable: false,
    description: 'Explore the lagoon, learn about mangroves, pass the water conservation quiz and clean up.',
    objectives: [
      { id: 'explore', type: 'activity', target: 'explore_sugba', count: 3, label: 'Explore the lagoon (3 info points)' },
      { id: 'npc', type: 'talk_npc', target: 'kapitan_doming', count: 1, label: 'Learn from Kapitan Doming' },
      { id: 'quiz', type: 'quiz', target: 'water_conservation', count: 1, label: 'Complete the water conservation quiz' },
      { id: 'trash', type: 'collect_trash', count: 10, label: 'Collect 10 pieces of litter' },
      { id: 'kayak', type: 'activity', target: 'kayak_sugba', count: 1, label: 'Complete the kayak loop' },
    ] },
  { key: 'sugba_water', spot: 'sugba', title: 'Clear Waters of Sugba', category: 'marine_conservation', difficulty: 'medium',
    role: local, xp: 180, coins: 300, badge: 'Mangrove Guardian', repeatable: false,
    description: 'Kayak the lagoon loop and remove litter to keep the water clean.',
    objectives: [
      { id: 'kayak', type: 'activity', target: 'kayak_sugba', count: 1, label: 'Complete the kayak loop' },
      { id: 'trash', type: 'collect_trash', count: 10, label: 'Collect 10 pieces of litter' },
      { id: 'quiz', type: 'quiz', target: 'water_conservation', count: 1, label: 'Pass the conservation quiz' },
    ] },

  // ---------------- Naked Island ----------------
  { key: 'naked_cleanup', spot: 'naked', title: 'Leave No Trace on the Sandbar', category: 'beach_cleanup', difficulty: 'easy',
    role: both, xp: 130, coins: 250, badge: 'Sandbar Saver', repeatable: false,
    description: 'Naked Island has no bins. Help Toto carry out all the waste.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'bangkero_toto', count: 1, label: 'Talk to Toto the boatman' },
      { id: 'explore', type: 'activity', target: 'explore_naked', count: 2, label: 'Read 2 Leave No Trace signs' },
      { id: 'trash', type: 'collect_trash', count: 12, label: 'Collect 12 pieces of waste' },
    ] },
  { key: 'naked_daily', spot: 'naked', title: 'Daily Sweep: Naked Island', category: 'beach_cleanup', difficulty: 'easy',
    role: both, xp: 50, coins: 90, badge: null, repeatable: true,
    description: 'Repeatable cleanup that raises Naked Island\'s community cleanliness.',
    objectives: [ { id: 'trash', type: 'collect_trash', count: 8, label: 'Collect 8 pieces of waste' } ] },

  // ---------------- Guyam ----------------
  { key: 'guyam_conservation', spot: 'guyam', title: 'Guardians of Guyam', category: 'environmental_protection', difficulty: 'easy',
    role: both, xp: 150, coins: 250, badge: 'Islet Guardian', repeatable: false,
    description: 'Help Lito clean the islet and learn how to be a responsible island-hopper.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'caretaker_lito', count: 1, label: 'Talk to Lito' },
      { id: 'trash', type: 'collect_trash', count: 10, label: 'Collect 10 pieces of trash' },
      { id: 'explore', type: 'activity', target: 'explore_guyam', count: 2, label: 'Read 2 reef info boards' },
      { id: 'quiz', type: 'quiz', target: 'responsible_tourism', count: 1, label: 'Pass the responsible tourism challenge' },
    ] },

  // ---------------- Daku ----------------
  { key: 'daku_community', spot: 'daku', title: 'Bayanihan on Daku', category: 'community_service', difficulty: 'medium',
    role: local, xp: 200, coins: 350, badge: 'Bayanihan Hero', repeatable: false,
    description: 'Help the fishing community: clean the shore and sort the nets.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'mang_tonyo', count: 1, label: 'Talk to Mang Tonyo' },
      { id: 'trash', type: 'collect_trash', count: 12, label: 'Clean the village shore (12 pieces)' },
      { id: 'nets', type: 'activity', target: 'help_fisherman', count: 3, label: 'Sort 3 fishing nets' },
    ] },
  { key: 'daku_local', spot: 'daku', title: 'Support Local Daku', category: 'local_culture', difficulty: 'easy',
    role: tourist, xp: 120, coins: 150, badge: 'Local Supporter', repeatable: false,
    description: 'Visit Daku, buy from a local shop and learn how community tourism works.',
    objectives: [
      { id: 'visit', type: 'visit', count: 1, label: 'Visit Daku Island' },
      { id: 'npc', type: 'talk_npc', target: 'aling_nena', count: 1, label: 'Talk to Aling Nena' },
      { id: 'buy', type: 'activity', target: 'support_local_daku', count: 1, label: 'Buy a local product' },
      { id: 'quiz', type: 'quiz', target: 'community_care', count: 1, label: 'Pass the community quiz' },
    ] },

  // ---------------- Pacifico ----------------
  { key: 'pacifico_turtles', spot: 'pacifico', title: 'Turtle-Safe Pacifico', category: 'marine_conservation', difficulty: 'medium',
    role: both, xp: 190, coins: 300, badge: 'Turtle Friend', repeatable: false,
    description: 'Remove the plastic and fishing line that endanger Pacifico\'s sea turtles.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'volunteer_carlo', count: 1, label: 'Talk to Carlo' },
      { id: 'trash', type: 'collect_trash', count: 12, label: 'Collect 12 pieces of litter' },
      { id: 'quiz', type: 'quiz', target: 'turtle_safety', count: 1, label: 'Pass the sea turtle safety quiz' },
    ] },
  { key: 'pacifico_surf', spot: 'pacifico', title: 'Pacific Swell Session', category: 'surfing', difficulty: 'medium',
    role: both, xp: 200, coins: 300, badge: 'Pacific Rider', repeatable: false,
    description: 'Surf with Aya at Pacifico and complete the intermediate challenge.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'surfer_aya', count: 1, label: 'Talk to Aya' },
      { id: 'surf', type: 'surf', target: 'intermediate', count: 1, label: 'Complete the intermediate surf challenge' },
    ] },

  // ---------------- Sohoton ----------------
  { key: 'sohoton_rules', spot: 'sohoton', title: 'Respect the Protected Cove', category: 'responsible_tourism', difficulty: 'easy',
    role: both, xp: 160, coins: 250, badge: 'Cove Respecter', repeatable: false,
    description: 'Learn the protected-area rules from Ranger Ines and explore responsibly.',
    objectives: [
      { id: 'visit', type: 'visit', count: 1, label: 'Visit Sohoton Cove' },
      { id: 'npc', type: 'talk_npc', target: 'ranger_ines', count: 1, label: 'Talk to Ranger Ines' },
      { id: 'explore', type: 'activity', target: 'explore_sohoton', count: 3, label: 'Read 3 protected-area boards' },
      { id: 'quiz', type: 'quiz', target: 'protected_cove', count: 1, label: 'Pass the marine protection quiz' },
    ] },

  // ---------------- Taktak ----------------
  { key: 'taktak_clean', spot: 'taktak', title: 'Clean Rivers, Clean Reefs', category: 'environmental_protection', difficulty: 'easy',
    role: both, xp: 160, coins: 250, badge: 'River Keeper', repeatable: false,
    description: 'Follow the trail, collect waste around the basin and learn how rivers connect to reefs.',
    objectives: [
      { id: 'npc', type: 'talk_npc', target: 'guide_rico', count: 1, label: 'Talk to Rico' },
      { id: 'explore', type: 'activity', target: 'explore_taktak', count: 3, label: 'Follow the trail (3 boards)' },
      { id: 'trash', type: 'collect_trash', count: 10, label: 'Collect 10 pieces of waste' },
      { id: 'quiz', type: 'quiz', target: 'freshwater', count: 1, label: 'Pass the Rivers to Reefs quiz' },
    ] },
];

/** Shop items. Prices are enforced server-side. */
export const shopItems = [
  { key: 'board_foamie', name: 'Foamie Board', type: 'surfboard', price: 0, spot: null,
    description: 'Soft-top beginner board. Very stable, slow turns.', data: { stability: 1.0, turn: 0.8, speed: 0.9, color: '#ffd166' } },
  { key: 'board_fun', name: 'Funboard', type: 'surfboard', price: 600, spot: null,
    description: 'Balanced all-rounder for progressing surfers.', data: { stability: 0.8, turn: 1.0, speed: 1.0, color: '#00b4d8' } },
  { key: 'board_short', name: 'Siargao Shortboard', type: 'surfboard', price: 1500, spot: null,
    description: 'Fast and agile. Harder to balance, bigger scores.', data: { stability: 0.6, turn: 1.3, speed: 1.15, color: '#ff6b6b' } },
  { key: 'shirt_ocean', name: 'Ocean Tee', type: 'cosmetic', price: 150, spot: null,
    description: 'Ocean-blue shirt.', data: { slot: 'shirt', color: '#00b4d8' } },
  { key: 'shirt_sunset', name: 'Sunset Tee', type: 'cosmetic', price: 150, spot: null,
    description: 'Sunset-orange shirt.', data: { slot: 'shirt', color: '#ff9f43' } },
  { key: 'shirt_eco', name: 'Eco Volunteer Shirt', type: 'cosmetic', price: 250, spot: null,
    description: 'Green volunteer shirt.', data: { slot: 'shirt', color: '#2e8b57' } },
  { key: 'hat_salakot', name: 'Salakot Hat', type: 'cosmetic', price: 300, spot: null,
    description: 'Traditional Filipino woven hat.', data: { slot: 'hat', style: 'salakot', color: '#c8a165' } },
  { key: 'hat_cap', name: 'Surf Cap', type: 'cosmetic', price: 120, spot: null,
    description: 'A sporty cap.', data: { slot: 'hat', style: 'cap', color: '#102a43' } },
  { key: 'local_grilled_fish', name: 'Grilled Fish (Daku)', type: 'local_product', price: 80, spot: 'daku',
    description: 'Freshly grilled by Aling Nena. Supports the Daku community.', data: { activity: 'support_local_daku' } },
  { key: 'local_woven_bag', name: 'Woven Pandan Bag', type: 'local_product', price: 200, spot: 'daku',
    description: 'Handwoven by Daku artisans. A reusable bag that replaces plastic!', data: { activity: 'support_local_daku' } },
];
