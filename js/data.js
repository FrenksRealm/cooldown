/* =========================================================================
   COOLDOWN — demo seed data
   Everything here is invented for the prototype: people, events and brands
   are fictional. Dates are generated relative to "now" every time the page
   loads, so countdowns and "posted 3h ago" always look fresh.
   ========================================================================= */
(function () {
  'use strict';

  const DAY = 864e5;
  const HOUR = 36e5;

  function buildSeed(now) {
    const inDays = (d, h = 9) => {
      const t = new Date(now + d * DAY);
      t.setHours(h, 0, 0, 0);
      return t.getTime();
    };
    const ago = (hours) => now - hours * HOUR;

    const SPORTS = ['Cycling', 'Running', 'Skiing', 'Snowboard', 'Lifting', 'Triathlon', 'Climbing'];
    const TYPES = ['Bike', 'Workstation', 'Kit'];

    const athletes = [
      {
        id: 'a1', name: 'Mara Quintero', handle: 'maraq', sport: 'Cycling', city: 'Oakland, CA', hue: 200,
        bio: 'Gravel racer, coffee snob, chasing every dirt road in the East Bay.',
        followers: 48200, engagement: 6.1, growth: [41, 42, 42, 43, 44, 44, 45, 46, 46, 47, 48, 48.2],
        openToSponsors: true, sponsors: ['Fogline Coffee'],
        pitch: 'Weekly gravel content, race reports and route guides. Strong Bay Area audience, 70% riders aged 22–38.',
        socials: { strava: 'https://www.strava.com', instagram: 'maraq.rides', spotify: 'https://open.spotify.com' },
        goals: [
          { id: 'g1', title: 'Top 10 at Headlands Hundred', unit: 'place', start: 40, current: 14, target: 10, lowerIsBetter: true, due: inDays(12) },
          { id: 'g2', title: 'Ride 12,000 km this year', unit: 'km', start: 0, current: 10450, target: 12000, due: inDays(60) }
        ]
      },
      {
        id: 'a2', name: 'Theo Nakamura', handle: 'theo.runs', sport: 'Running', city: 'Portland, OR', hue: 28,
        bio: 'Trail and ultra. If it has switchbacks, I am there.',
        followers: 21500, engagement: 7.4, growth: [15, 15.6, 16, 16.8, 17.2, 17.9, 18.4, 19, 19.8, 20.4, 21, 21.5],
        openToSponsors: true, sponsors: [],
        pitch: 'Fastest-growing trail account in the PNW. Gear reviews that people actually trust.',
        socials: { strava: 'https://www.strava.com', instagram: 'theo.runs', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g3', title: 'Sub-5h at Rose City Trail 50K', unit: 'min', start: 345, current: 312, target: 300, lowerIsBetter: true, due: inDays(40) },
          { id: 'g4', title: '100 km weeks, 6 in a row', unit: 'weeks', start: 0, current: 4, target: 6, due: inDays(30) }
        ]
      },
      {
        id: 'a3', name: 'Ines Okafor', handle: 'ines.lifts', sport: 'Lifting', city: 'Atlanta, GA', hue: 330,
        bio: 'Powerlifter. 67.5 kg class. Loud music, louder PRs.',
        followers: 63800, engagement: 8.3, growth: [52, 53, 54, 55.5, 56, 57.4, 58.8, 60, 61, 62.2, 63, 63.8],
        openToSponsors: true, sponsors: ['Iron Orchard Gym'],
        pitch: 'Strength content with a community that shows up: 8%+ engagement, consistent comments, real conversions.',
        socials: { instagram: 'ines.lifts', tiktok: 'ineslifts', spotify: 'https://open.spotify.com' },
        goals: [
          { id: 'g5', title: 'Deadlift 300 lb', unit: 'lb', start: 245, current: 285, target: 300, due: inDays(33) },
          { id: 'g6', title: 'Squat 2x bodyweight', unit: 'lb', start: 230, current: 270, target: 298, due: inDays(90) }
        ]
      },
      {
        id: 'a4', name: 'Jules Varga', handle: 'julesvarga', sport: 'Skiing', city: 'Salt Lake City, UT', hue: 190,
        bio: 'Freeride skier. Big lines, small talk.',
        followers: 87100, engagement: 4.2, growth: [80, 80.5, 81, 81.8, 82.4, 83, 83.6, 84.5, 85.2, 86, 86.6, 87.1],
        openToSponsors: false, sponsors: ['Northface Wax Co.', 'Summit Goggle Lab'],
        pitch: '',
        socials: { instagram: 'julesvarga', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g7', title: 'Podium at Wasatch Pow Classic', unit: 'place', start: 12, current: 5, target: 3, lowerIsBetter: true, due: inDays(55) },
          { id: 'g8', title: '100 ski days this season', unit: 'days', start: 0, current: 18, target: 100, due: inDays(150) }
        ]
      },
      {
        id: 'a5', name: 'Dez Holloway', handle: 'dezfixed', sport: 'Cycling', city: 'Brooklyn, NY', hue: 95,
        bio: 'Track and crit. Fixed gear forever. Night races only.',
        followers: 33900, engagement: 9.1, growth: [22, 23, 24.1, 25, 26.2, 27, 28.1, 29.4, 30.5, 31.8, 32.9, 33.9],
        openToSponsors: true, sponsors: [],
        pitch: 'NYC fixed-gear scene. Highest engagement on the board. Race clips with millions of views.',
        socials: { strava: 'https://www.strava.com', instagram: 'dezfixed', tiktok: 'dezfixed', spotify: 'https://open.spotify.com' },
        goals: [
          { id: 'g9', title: 'Win Brooklyn Night Crit', unit: 'place', start: 9, current: 3, target: 1, lowerIsBetter: true, due: inDays(19) },
          { id: 'g10', title: '1,400 W peak sprint', unit: 'W', start: 1150, current: 1310, target: 1400, due: inDays(45) }
        ]
      },
      {
        id: 'a6', name: 'Priya Raman', handle: 'priya.k2', sport: 'Running', city: 'Austin, TX', hue: 265,
        bio: 'Road marathoner. Engineer by day, tempo runs by dawn.',
        followers: 12400, engagement: 6.8, growth: [9, 9.3, 9.6, 10, 10.2, 10.6, 11, 11.3, 11.6, 11.9, 12.1, 12.4],
        openToSponsors: true, sponsors: [],
        pitch: 'Data-nerd marathon content: splits, fueling and shoe rotations.',
        socials: { strava: 'https://www.strava.com', instagram: 'priya.k2' },
        goals: [
          { id: 'g11', title: 'Half marathon under 1:30', unit: 'min', start: 101, current: 92, target: 90, lowerIsBetter: true, due: inDays(25) },
          { id: 'g12', title: 'Boston qualifier at Capitol 26.2', unit: 'min', start: 222, current: 206, target: 200, lowerIsBetter: true, due: inDays(90) }
        ]
      },
      {
        id: 'a7', name: 'Kai Laurent', handle: 'kai.sends', sport: 'Cycling', city: 'Bend, OR', hue: 160,
        bio: 'Enduro MTB. Fixes his own suspension, mostly.',
        followers: 29300, engagement: 5.6, growth: [26, 26.4, 26.9, 27.1, 27.4, 27.8, 28, 28.3, 28.6, 28.9, 29.1, 29.3],
        openToSponsors: true, sponsors: ['Ridgeback Tire Co.'],
        pitch: 'POV enduro runs and honest long-term gear reviews.',
        socials: { strava: 'https://www.strava.com', instagram: 'kai.sends', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g13', title: 'Top 20 overall, Cascade Enduro R1', unit: 'place', start: 55, current: 31, target: 20, lowerIsBetter: true, due: inDays(120) }
        ]
      },
      {
        id: 'a8', name: 'Sol Ibarra', handle: 'sol.wrench', sport: 'Cycling', city: 'Los Angeles, CA', hue: 45,
        bio: 'Bike mechanic and wheel builder. My stand is my studio.',
        followers: 18700, engagement: 7.9, growth: [12, 12.6, 13.1, 13.8, 14.4, 15, 15.6, 16.3, 17, 17.6, 18.2, 18.7],
        openToSponsors: true, sponsors: [],
        pitch: 'Workshop tours, wheel builds and tool reviews. Audience of shop owners and home mechanics.',
        socials: { instagram: 'sol.wrench', youtube: 'https://www.youtube.com', spotify: 'https://open.spotify.com' },
        goals: [
          { id: 'g14', title: 'Build 50 wheelsets this season', unit: 'sets', start: 0, current: 37, target: 50, due: inDays(45) },
          { id: 'g15', title: 'Open a community repair night', unit: '%', start: 0, current: 60, target: 100, due: inDays(70) }
        ]
      },
      {
        id: 'a9', name: 'Nora Lindqvist', handle: 'nora.split', sport: 'Snowboard', city: 'Denver, CO', hue: 215,
        bio: 'Splitboarder. Earn your turns, then take a nap.',
        followers: 15800, engagement: 5.9, growth: [13, 13.3, 13.6, 13.9, 14.2, 14.5, 14.7, 15, 15.2, 15.4, 15.6, 15.8],
        openToSponsors: true, sponsors: [],
        pitch: 'Backcountry safety + gear content for new splitboarders.',
        socials: { instagram: 'nora.split', strava: 'https://www.strava.com' },
        goals: [
          { id: 'g16', title: '30,000 m vertical this winter', unit: 'm', start: 0, current: 6200, target: 30000, due: inDays(150) }
        ]
      },
      {
        id: 'a10', name: 'Rafa Mendes', handle: 'rafa.tri', sport: 'Triathlon', city: 'San Diego, CA', hue: 12,
        bio: 'Swim, bike, run, repeat. Age-group grinder.',
        followers: 9800, engagement: 6.4, growth: [7.2, 7.4, 7.7, 8, 8.2, 8.5, 8.7, 9, 9.2, 9.4, 9.6, 9.8],
        openToSponsors: true, sponsors: [],
        pitch: 'Triathlon training logs and transition-area gear setups.',
        socials: { strava: 'https://www.strava.com', instagram: 'rafa.tri' },
        goals: [
          { id: 'g17', title: 'Sub-2:20 at Mission Bay Tri', unit: 'min', start: 158, current: 146, target: 140, lowerIsBetter: true, due: inDays(70) }
        ]
      },
      {
        id: 'a11', name: 'Ava Brooks', handle: 'ava.snatch', sport: 'Lifting', city: 'Chicago, IL', hue: 300,
        bio: 'Olympic weightlifting. Coach. Chalk everywhere.',
        followers: 41200, engagement: 6.6, growth: [37, 37.4, 37.9, 38.3, 38.8, 39.2, 39.6, 40, 40.4, 40.7, 41, 41.2],
        openToSponsors: false, sponsors: ['Chalkline Apparel'],
        pitch: '',
        socials: { instagram: 'ava.snatch', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g18', title: 'Clean & jerk 120 kg', unit: 'kg', start: 100, current: 113, target: 120, due: inDays(60) }
        ]
      },
      {
        id: 'a12', name: 'Wren Castillo', handle: 'wren.climbs', sport: 'Cycling', city: 'San Francisco, CA', hue: 140,
        bio: 'Road climber. Twin Peaks is my therapist.',
        followers: 24600, engagement: 7.2, growth: [18, 18.6, 19.2, 19.9, 20.5, 21.1, 21.7, 22.4, 23, 23.6, 24.1, 24.6],
        openToSponsors: true, sponsors: [],
        pitch: 'Climbing-focused road content and Everesting attempts, filmed start to finish.',
        socials: { strava: 'https://www.strava.com', instagram: 'wren.climbs', spotify: 'https://open.spotify.com' },
        goals: [
          { id: 'g19', title: 'Everest Challenge: 8,848 m in one ride', unit: 'm', start: 0, current: 5600, target: 8848, due: inDays(85) },
          { id: 'g20', title: 'KOM on Twin Peaks Hill Climb', unit: 'place', start: 18, current: 4, target: 1, lowerIsBetter: true, due: inDays(26) }
        ]
      }
    ];
    // followers stored in thousands for growth arrays -> keep growth as relative trend only

    const races = [
      { id: 'r1', name: 'Headlands Hundred', sport: 'Cycling', city: 'Marin, CA', date: inDays(12, 7), distance: '100 mi gravel', athletes: ['a1', 'a12', 'a7', 'a8'], interested: 1840 },
      { id: 'r2', name: 'Twin Peaks Hill Climb', sport: 'Cycling', city: 'San Francisco, CA', date: inDays(26, 8), distance: '3.2 mi · 900 ft', athletes: ['a12', 'a1'], interested: 960 },
      { id: 'r3', name: 'Rose City Trail 50K', sport: 'Running', city: 'Portland, OR', date: inDays(40, 6), distance: '50 km trail', athletes: ['a2'], interested: 1320 },
      { id: 'r4', name: 'Wasatch Pow Classic', sport: 'Skiing', city: 'Salt Lake City, UT', date: inDays(55, 10), distance: 'Freeride comp', athletes: ['a4', 'a9'], interested: 2210 },
      { id: 'r5', name: 'Peach State Open', sport: 'Lifting', city: 'Atlanta, GA', date: inDays(33, 9), distance: 'Full power meet', athletes: ['a3', 'a11'], interested: 740 },
      { id: 'r6', name: 'Mission Bay Tri', sport: 'Triathlon', city: 'San Diego, CA', date: inDays(70, 6), distance: 'Olympic distance', athletes: ['a10'], interested: 1150 },
      { id: 'r7', name: 'Brooklyn Night Crit', sport: 'Cycling', city: 'Brooklyn, NY', date: inDays(19, 20), distance: '40 laps fixed gear', athletes: ['a5'], interested: 2980 },
      { id: 'r8', name: 'Capitol 26.2', sport: 'Running', city: 'Austin, TX', date: inDays(90, 7), distance: 'Marathon', athletes: ['a6'], interested: 3400 },
      { id: 'r9', name: 'Cascade Enduro R1', sport: 'Cycling', city: 'Bend, OR', date: inDays(120, 8), distance: '5 stages', athletes: ['a7'], interested: 890 },
      { id: 'r10', name: 'Front Range Splitfest', sport: 'Snowboard', city: 'Denver, CO', date: inDays(75, 8), distance: 'Backcountry festival', athletes: ['a9'], interested: 610 }
    ];

    const rigs = [
      { id: 'k1', athleteId: 'a1', title: 'Dirt Road Daily', sport: 'Cycling', type: 'Bike', art: 'gravel', hue: 200, likes: 3120, createdAt: ago(20),
        caption: 'Built for long days and bad decisions. Mixed terrain, mixed feelings, all smiles.',
        specs: [['Frame', 'Steel gravel, 54 cm'], ['Drivetrain', '1x12 wide range'], ['Wheels', 'Carbon, 25 mm inner'], ['Tires', '45 mm knobby, tubeless'], ['Bags', 'Frame bag + top tube'], ['Weight', '9.4 kg']] },
      { id: 'k2', athleteId: 'a5', title: 'Night Shift', sport: 'Cycling', type: 'Bike', art: 'track', hue: 95, likes: 4410, createdAt: ago(30),
        caption: 'Aluminum track frame. 49x15. No brakes on the track, two on the street.',
        specs: [['Frame', 'Aluminum track, 53 cm'], ['Gearing', '49 x 15'], ['Wheels', 'Deep aero front, disc rear'], ['Bars', 'Track drops, 38 cm'], ['Pedals', 'Double-sided clipless']] },
      { id: 'k3', athleteId: 'a8', title: 'The Bench', sport: 'Cycling', type: 'Workstation', art: 'stand', hue: 45, likes: 2870, createdAt: ago(8),
        caption: 'Home shop finally done. Every tool has a shadow on the pegboard.',
        specs: [['Stand', 'Pro clamp stand'], ['Truing', 'Wheel truing stand + dish tool'], ['Torque', '2–24 Nm + 20–100 Nm wrenches'], ['Bench', 'Butcher block, 6 ft'], ['Lighting', '5000K LED strip']] },
      { id: 'k4', athleteId: 'a3', title: 'Meet Day Kit', sport: 'Lifting', type: 'Kit', art: 'barbell', hue: 330, likes: 3650, createdAt: ago(44),
        caption: 'Everything in the bag for meet day. Belt broke in. Chalk ready. Headphones loud.',
        specs: [['Belt', '10 mm lever belt'], ['Shoes', 'Flat deadlift slippers'], ['Sleeves', '7 mm knee sleeves'], ['Wraps', 'Stiff wrist wraps'], ['Fuel', 'Rice cakes + honey']] },
      { id: 'k5', athleteId: 'a4', title: 'Big Mountain Quiver', sport: 'Skiing', type: 'Kit', art: 'ski', hue: 190, likes: 5020, createdAt: ago(70),
        caption: 'Two skis, one goal: get to the top of the comp board this season.',
        specs: [['Skis', '112 mm underfoot, 186 cm'], ['Bindings', 'Hybrid tech/alpine'], ['Boots', '130 flex freeride'], ['Pack', '30 L airbag pack'], ['Beacon', '3-antenna']] },
      { id: 'k6', athleteId: 'a2', title: 'Shoe Rotation, Fall', sport: 'Running', type: 'Kit', art: 'shoe', hue: 28, likes: 1980, createdAt: ago(14),
        caption: 'Four pairs, four jobs. Rotation keeps the legs fresh.',
        specs: [['Daily', 'Max-cushion trainer'], ['Tempo', 'Plated trainer'], ['Trail', '5 mm lug trail shoe'], ['Race', 'Carbon racer'], ['Miles this month', '412 km']] },
      { id: 'k7', athleteId: 'a7', title: 'Long Travel Sender', sport: 'Cycling', type: 'Bike', art: 'mtb', hue: 160, likes: 2760, createdAt: ago(52),
        caption: '170 front, 160 rear. Set up for the steep and loose stuff in the Cascades.',
        specs: [['Frame', 'Carbon enduro, size L'], ['Fork', '170 mm coil'], ['Shock', '160 mm air'], ['Brakes', '4-piston, 220/203 rotors'], ['Tires', '2.5 front / 2.4 rear']] },
      { id: 'k8', athleteId: 'a12', title: 'Climbing Machine', sport: 'Cycling', type: 'Bike', art: 'road', hue: 140, likes: 3380, createdAt: ago(5),
        caption: '6.9 kg with pedals. Built for the Everesting attempt.',
        specs: [['Frame', 'Lightweight carbon, 52 cm'], ['Groupset', '2x12 electronic'], ['Cassette', '11–34'], ['Wheels', 'Shallow carbon climbing wheels'], ['Weight', '6.9 kg']] },
      { id: 'k9', athleteId: 'a9', title: 'Split Setup', sport: 'Snowboard', type: 'Kit', art: 'board', hue: 215, likes: 1460, createdAt: ago(26),
        caption: 'Splitboard, skins and the avalanche kit that never stays home.',
        specs: [['Board', '158 cm splitboard'], ['Bindings', 'Hardboot tech setup'], ['Skins', 'Mohair mix'], ['Safety', 'Beacon, probe, shovel']] },
      { id: 'k10', athleteId: 'a6', title: 'Marathon Block Desk', sport: 'Running', type: 'Workstation', art: 'desk', hue: 265, likes: 1240, createdAt: ago(36),
        caption: 'Where the training plans happen. Spreadsheet on the left, foam roller on the right.',
        specs: [['Desk', 'Standing desk'], ['Screens', '27 in + laptop'], ['Recovery', 'Foam roller, massage gun'], ['Planner', 'Paper training log']] },
      { id: 'k11', athleteId: 'a10', title: 'T2 Ready', sport: 'Triathlon', type: 'Bike', art: 'tt', hue: 12, likes: 1720, createdAt: ago(60),
        caption: 'Time trial bike, aero bottle, and a transition towel I refuse to replace.',
        specs: [['Frame', 'Aluminum TT, size M'], ['Bars', 'Aero extensions'], ['Wheels', '60 mm front / disc rear'], ['Hydration', 'Between-arms bottle']] },
      { id: 'k12', athleteId: 'a11', title: 'Platform Corner', sport: 'Lifting', type: 'Workstation', art: 'rack', hue: 300, likes: 2190, createdAt: ago(18),
        caption: 'Garage platform, half rack and too many plates.',
        specs: [['Rack', 'Half rack with spotter arms'], ['Platform', '8 x 8 ft rubber'], ['Bar', '20 kg weightlifting bar'], ['Plates', 'Bumper set, 200 kg']] },
      { id: 'k13', athleteId: 'a8', title: 'Shop Hack: Wheel Wall', sport: 'Cycling', type: 'Workstation', art: 'wheelwall', hue: 45, likes: 1610, createdAt: ago(80),
        caption: 'Hung every wheel waiting for a rebuild. Customers love it, my landlord less so.',
        specs: [['Hooks', '24 wall hooks'], ['Labels', 'Tag per customer'], ['Turnaround', '3–5 days']] },
      { id: 'k14', athleteId: 'a1', title: 'Bikepacking Overnighter', sport: 'Cycling', type: 'Kit', art: 'bags', hue: 175, likes: 1390, createdAt: ago(100),
        caption: 'Everything for one night out under 8 kg.',
        specs: [['Shelter', '1-person tent'], ['Sleep', 'Quilt + pad'], ['Cook', 'Stove + mug'], ['Bags', 'Seat, frame, bar roll']] }
    ];

    const comments = {
      k2: [{ by: 'a1', text: 'That gearing is unhinged. Respect.', at: ago(26) }, { by: 'a12', text: 'Clean build!', at: ago(22) }],
      k3: [{ by: 'a7', text: 'Pegboard shadows are elite.', at: ago(6) }],
      k5: [{ by: 'a9', text: 'See you at the Classic.', at: ago(50) }],
      k8: [{ by: 'a5', text: 'Going full Everest on that? Let\'s go.', at: ago(3) }]
    };

    const posts = [
      { id: 'p1', athleteId: 'a12', sport: 'Cycling', title: 'Why I am trying to Everest Twin Peaks', likes: 812, createdAt: ago(10), art: 'road', hue: 140,
        body: 'Everesting is simple to explain and brutal to do: pick one hill and ride it up and down until you have climbed 8,848 meters, the height of Mount Everest.\n\nI picked Twin Peaks because it is the hill that taught me how to climb. The first time I rode it I stopped three times. Now it is my favorite place in the city.\n\nThe plan is a long build. Twelve weeks of steady volume, two long climbing days per week, and one rule: never go into the red before hour six.\n\nNutrition is the part that scares me most. Every 20 minutes I eat something. Every hour I drink a full bottle. If I forget, the ride ends early.\n\nI will post every training week here, with the numbers. If you want to ride a lap with me on the day, the start is at sunrise. Bring snacks.' },
      { id: 'p2', athleteId: 'a3', sport: 'Lifting', title: '285 to 300: the last 15 pounds', likes: 1240, createdAt: ago(28), art: 'barbell', hue: 330,
        body: 'The last 15 pounds are never about strength alone. They are about patience.\n\nMy coach and I changed three things this block: more paused deadlifts, more sleep, and less ego on the warm-up sets.\n\nThe paused pulls fixed my position off the floor. The sleep fixed everything else.\n\nThe meet is a month out. I will hit 300 on the platform or I will learn exactly why I did not. Either way, you will see the video.' },
      { id: 'p3', athleteId: 'a8', sport: 'Cycling', title: 'Setting up a home shop under $500', likes: 1530, createdAt: ago(55), art: 'stand', hue: 45,
        body: 'You do not need a pro shop to work on your bike at home. You need a stand, good light and a few tools you trust.\n\nStart with a clamp stand. Working on the ground is how bolts get stripped.\n\nBuy a torque wrench before you buy anything fancy. Carbon parts do not forgive guessing.\n\nAdd a set of hex keys, a chain checker, tire levers and a floor pump. That covers most of what riders need week to week.\n\nLast tip: put a shadow board on your wall. When every tool has a home, you stop losing the 5 mm.' },
      { id: 'p4', athleteId: 'a2', sport: 'Running', title: 'What 100 km weeks actually feel like', likes: 690, createdAt: ago(75), art: 'shoe', hue: 28,
        body: 'Week one felt heroic. Week three felt like a part-time job. Week four I started to enjoy it again.\n\nMost of the miles are easy. That is the secret. If every run is hard, you will not make it to week six.\n\nTwo more weeks to hit the goal. Then a taper, then 50 km of trail in Portland.' },
      { id: 'p5', athleteId: 'a5', sport: 'Cycling', title: 'Fixed gear crits are back', likes: 980, createdAt: ago(120), art: 'track', hue: 95,
        body: 'Night races, no brakes, closed streets. The fixed crit scene is the most fun you can have on two wheels.\n\nIf you have never raced one: practice your cornering, check your gearing, and stay off the front for the first ten laps.\n\nSee you at the Brooklyn Night Crit.' }
    ];

    const activity = [
      { type: 'rig', who: 'a12', what: 'posted a new rig', ref: 'k8', at: ago(5) },
      { type: 'goal', who: 'a3', what: 'hit 285 lb toward Deadlift 300 lb', ref: 'a3', at: ago(7) },
      { type: 'rig', who: 'a8', what: 'shared a workstation', ref: 'k3', at: ago(8) },
      { type: 'post', who: 'a12', what: 'wrote in the journal', ref: 'p1', at: ago(10) },
      { type: 'race', who: 'a7', what: 'is in for Headlands Hundred', ref: 'r1', at: ago(12) },
      { type: 'rig', who: 'a2', what: 'posted a new rig', ref: 'k6', at: ago(14) },
      { type: 'goal', who: 'a5', what: 'hit 1,310 W toward 1,400 W peak sprint', ref: 'a5', at: ago(16) },
      { type: 'rig', who: 'a11', what: 'shared a workstation', ref: 'k12', at: ago(18) },
      { type: 'rig', who: 'a1', what: 'posted a new rig', ref: 'k1', at: ago(20) },
      { type: 'race', who: 'a9', what: 'is in for Wasatch Pow Classic', ref: 'r4', at: ago(24) },
      { type: 'post', who: 'a3', what: 'wrote in the journal', ref: 'p2', at: ago(28) }
    ];

    return { now, SPORTS, TYPES, athletes, races, rigs, comments, posts, activity };
  }

  window.KR_SEED = buildSeed;
})();
