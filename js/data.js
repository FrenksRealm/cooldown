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

    // COOLDOWN is cycling only for now: "sport" holds the riding discipline
    const SPORTS = ['Road', 'Gravel', 'MTB', 'Track', 'Cyclocross', 'BMX', 'Fixed'];
    const TYPES = ['Bike', 'Workstation', 'Kit'];

    const athletes = [
      {
        id: 'a1', name: 'Mara Quintero', handle: 'maraq', sport: 'Gravel', city: 'Oakland, CA', hue: 200,
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
        id: 'a2', name: 'Theo Nakamura', handle: 'theo.cx', sport: 'Cyclocross', city: 'Portland, OR', hue: 28,
        bio: 'Cross racer. Mud, barriers and a cowbell in every corner.',
        followers: 21500, engagement: 7.4, growth: [15, 15.6, 16, 16.8, 17.2, 17.9, 18.4, 19, 19.8, 20.4, 21, 21.5],
        openToSponsors: true, sponsors: [],
        pitch: 'Fastest-growing cross account in the PNW. Helmet-cam race laps and tire-pressure nerdery people actually use.',
        socials: { strava: 'https://www.strava.com', instagram: 'theo.cx', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g3', title: 'Top 5 at Cross Crusade Finals', unit: 'place', start: 22, current: 9, target: 5, lowerIsBetter: true, due: inDays(40) },
          { id: 'g4', title: 'Race every Cross Crusade round', unit: 'races', start: 0, current: 5, target: 8, due: inDays(40) }
        ]
      },
      {
        id: 'a3', name: 'Ines Okafor', handle: 'ines.sprints', sport: 'Track', city: 'Atlanta, GA', hue: 330,
        bio: 'Track sprinter. Flying 200s, loud music, louder starts.',
        followers: 63800, engagement: 8.3, growth: [52, 53, 54, 55.5, 56, 57.4, 58.8, 60, 61, 62.2, 63, 63.8],
        openToSponsors: true, sponsors: ['Iron Orchard Training'],
        pitch: 'Sprint and strength content with a community that shows up: 8%+ engagement, consistent comments, real conversions.',
        socials: { instagram: 'ines.sprints', tiktok: 'inessprints', spotify: 'https://open.spotify.com' },
        goals: [
          { id: 'g5', title: 'Flying 200 m under 11.0 s', unit: 's', start: 11.9, current: 11.3, target: 11.0, lowerIsBetter: true, due: inDays(33) },
          { id: 'g6', title: '1,600 W peak power', unit: 'W', start: 1380, current: 1520, target: 1600, due: inDays(90) }
        ]
      },
      {
        id: 'a4', name: 'Jules Varga', handle: 'julesvarga', sport: 'MTB', city: 'Salt Lake City, UT', hue: 190,
        bio: 'Downhill racer. Big lines, small talk.',
        followers: 87100, engagement: 4.2, growth: [80, 80.5, 81, 81.8, 82.4, 83, 83.6, 84.5, 85.2, 86, 86.6, 87.1],
        openToSponsors: false, sponsors: ['Wasatch Suspension Co.', 'Summit Goggle Lab'],
        pitch: '',
        socials: { instagram: 'julesvarga', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g7', title: 'Podium at Wasatch Gravity Classic', unit: 'place', start: 12, current: 5, target: 3, lowerIsBetter: true, due: inDays(55) },
          { id: 'g8', title: '100 bike-park days this season', unit: 'days', start: 0, current: 64, target: 100, due: inDays(150) }
        ]
      },
      {
        id: 'a5', name: 'Dez Holloway', handle: 'dezfixed', sport: 'Fixed', city: 'Brooklyn, NY', hue: 95,
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
        id: 'a6', name: 'Priya Raman', handle: 'priya.rides', sport: 'Road', city: 'Austin, TX', hue: 265,
        bio: 'Road racer. Engineer by day, intervals by dawn.',
        followers: 12400, engagement: 6.8, growth: [9, 9.3, 9.6, 10, 10.2, 10.6, 11, 11.3, 11.6, 11.9, 12.1, 12.4],
        openToSponsors: true, sponsors: [],
        pitch: 'Data-nerd road racing content: power files, fueling and race tactics explained simply.',
        socials: { strava: 'https://www.strava.com', instagram: 'priya.rides' },
        goals: [
          { id: 'g11', title: 'Cat 2 upgrade points', unit: 'pts', start: 0, current: 22, target: 30, due: inDays(25) },
          { id: 'g12', title: '40 km TT under 55 minutes', unit: 'min', start: 61, current: 56.5, target: 55, lowerIsBetter: true, due: inDays(70) }
        ]
      },
      {
        id: 'a7', name: 'Kai Laurent', handle: 'kai.sends', sport: 'MTB', city: 'Bend, OR', hue: 160,
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
        id: 'a8', name: 'Sol Ibarra', handle: 'sol.wrench', sport: 'Road', role: 'mechanic', city: 'Los Angeles, CA', hue: 45,
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
        id: 'a9', name: 'Nora Lindqvist', handle: 'nora.bmx', sport: 'BMX', city: 'Denver, CO', hue: 215,
        bio: 'BMX park rider. Concrete is my canvas.',
        followers: 15800, engagement: 5.9, growth: [13, 13.3, 13.6, 13.9, 14.2, 14.5, 14.7, 15, 15.2, 15.4, 15.6, 15.8],
        openToSponsors: true, sponsors: [],
        pitch: 'Park edits and trick tips for riders getting into BMX. Big with teens and their parents.',
        socials: { instagram: 'nora.bmx', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g16', title: 'Land a backflip tailwhip', unit: '%', start: 0, current: 60, target: 100, due: inDays(75) }
        ]
      },
      {
        id: 'a10', name: 'Rafa Mendes', handle: 'rafa.tt', sport: 'Road', city: 'San Diego, CA', hue: 12,
        bio: 'Time trial nerd. Aero is everything, and so is a good taco after.',
        followers: 9800, engagement: 6.4, growth: [7.2, 7.4, 7.7, 8, 8.2, 8.5, 8.7, 9, 9.2, 9.4, 9.6, 9.8],
        openToSponsors: true, sponsors: [],
        pitch: 'Time trial training logs and aero testing on a budget.',
        socials: { strava: 'https://www.strava.com', instagram: 'rafa.tt' },
        goals: [
          { id: 'g17', title: 'Sub-52 at Mission Bay TT', unit: 'min', start: 58, current: 54, target: 52, lowerIsBetter: true, due: inDays(70) }
        ]
      },
      {
        id: 'a11', name: 'Ava Brooks', handle: 'ava.velo', sport: 'Track', city: 'Chicago, IL', hue: 300,
        bio: 'Track endurance racer and coach. Lives at the velodrome.',
        followers: 41200, engagement: 6.6, growth: [37, 37.4, 37.9, 38.3, 38.8, 39.2, 39.6, 40, 40.4, 40.7, 41, 41.2],
        openToSponsors: false, sponsors: ['Chainline Apparel'],
        pitch: '',
        socials: { instagram: 'ava.velo', youtube: 'https://www.youtube.com' },
        goals: [
          { id: 'g18', title: '3 km pursuit under 3:40', unit: 's', start: 236, current: 226, target: 220, lowerIsBetter: true, due: inDays(60) }
        ]
      },
      {
        id: 'a12', name: 'Wren Castillo', handle: 'wren.climbs', sport: 'Road', city: 'San Francisco, CA', hue: 140,
        bio: 'Road climber. Twin Peaks is my therapist.',
        followers: 24600, engagement: 7.2, growth: [18, 18.6, 19.2, 19.9, 20.5, 21.1, 21.7, 22.4, 23, 23.6, 24.1, 24.6],
        openToSponsors: true, sponsors: [],
        pitch: 'Climbing-focused road content and Everesting attempts, filmed start to finish.',
        socials: { strava: 'https://www.strava.com', instagram: 'wren.climbs', spotify: 'https://open.spotify.com' },
        goals: [
          { id: 'g19', title: 'Everest Challenge: 8,848 m in one ride', unit: 'm', start: 0, current: 5600, target: 8848, due: inDays(85) },
          { id: 'g20', title: 'KOM on Twin Peaks Hill Climb', unit: 'place', start: 18, current: 4, target: 1, lowerIsBetter: true, due: inDays(26) }
        ]
      },
      {
        id: 'a13', name: 'Tomás Reyes', handle: 'tomas.trues', sport: 'Road', role: 'both', city: 'Oakland, CA', hue: 25,
        bio: 'Shop lead by day, crit racer by night. The truing stand is my happy place.',
        followers: 11200, engagement: 8.8, growth: [7, 7.4, 7.9, 8.3, 8.7, 9.1, 9.5, 9.9, 10.3, 10.6, 10.9, 11.2],
        openToSponsors: true, sponsors: [],
        pitch: 'Shop-floor content that mechanics and riders both share: fast fixes, tool reviews and before/after restorations.',
        socials: { instagram: 'tomas.trues', youtube: 'https://www.youtube.com', tiktok: 'tomastrues' },
        goals: [
          { id: 'g21', title: 'Service 1,000 bikes this year', unit: 'bikes', start: 0, current: 812, target: 1000, due: inDays(58) }
        ]
      }
    ];

    const races = [
      { id: 'r1', name: 'Headlands Hundred', sport: 'Gravel', city: 'Marin, CA', date: inDays(12, 7), distance: '100 mi gravel', athletes: ['a1', 'a12', 'a7', 'a8'], interested: 1840 },
      { id: 'r2', name: 'Twin Peaks Hill Climb', sport: 'Road', city: 'San Francisco, CA', date: inDays(26, 8), distance: '3.2 mi · 900 ft', athletes: ['a12', 'a1'], interested: 960 },
      { id: 'r3', name: 'Cross Crusade Finals', sport: 'Cyclocross', city: 'Portland, OR', date: inDays(40, 10), distance: '60 min cross', athletes: ['a2'], interested: 1320 },
      { id: 'r4', name: 'Wasatch Gravity Classic', sport: 'MTB', city: 'Salt Lake City, UT', date: inDays(55, 10), distance: 'Downhill · 2 runs', athletes: ['a4', 'a7'], interested: 2210 },
      { id: 'r5', name: 'Peach State Sprint GP', sport: 'Track', city: 'Atlanta, GA', date: inDays(33, 18), distance: 'Sprint omnium', athletes: ['a3', 'a11'], interested: 740 },
      { id: 'r6', name: 'Mission Bay TT', sport: 'Road', city: 'San Diego, CA', date: inDays(70, 7), distance: '40 km time trial', athletes: ['a10', 'a6'], interested: 1150 },
      { id: 'r7', name: 'Brooklyn Night Crit', sport: 'Fixed', city: 'Brooklyn, NY', date: inDays(19, 20), distance: '40 laps fixed gear', athletes: ['a5'], interested: 2980 },
      { id: 'r8', name: 'Capitol Criterium', sport: 'Road', city: 'Austin, TX', date: inDays(90, 17), distance: 'P/1/2 crit · 60 min', athletes: ['a6'], interested: 3400 },
      { id: 'r9', name: 'Cascade Enduro R1', sport: 'MTB', city: 'Bend, OR', date: inDays(120, 8), distance: '5 stages', athletes: ['a7'], interested: 890 },
      { id: 'r10', name: 'Mile High BMX Jam', sport: 'BMX', city: 'Denver, CO', date: inDays(75, 12), distance: 'Park jam', athletes: ['a9'], interested: 610 }
    ];

    const rigs = [
      { id: 'k1', athleteId: 'a1', title: 'Dirt Road Daily', sport: 'Gravel', type: 'Bike', art: 'gravel', hue: 200, likes: 3120, createdAt: ago(20),
        caption: 'Built for long days and bad decisions. Mixed terrain, mixed feelings, all smiles.',
        specs: [['Frame', 'Steel gravel, 54 cm'], ['Drivetrain', '1x12 wide range'], ['Wheels', 'Carbon, 25 mm inner'], ['Tires', '45 mm knobby, tubeless'], ['Bags', 'Frame bag + top tube'], ['Weight', '9.4 kg']] },
      { id: 'k2', athleteId: 'a5', title: 'Night Shift', sport: 'Fixed', type: 'Bike', art: 'track', hue: 95, likes: 4410, createdAt: ago(30),
        caption: 'Aluminum track frame. 49x15. No brakes on the track, two on the street.',
        specs: [['Frame', 'Aluminum track, 53 cm'], ['Gearing', '49 x 15'], ['Wheels', 'Deep aero front, disc rear'], ['Bars', 'Track drops, 38 cm'], ['Pedals', 'Double-sided clipless']] },
      { id: 'k3', athleteId: 'a8', title: 'The Bench', sport: 'Road', type: 'Workstation', art: 'stand', hue: 45, likes: 2870, createdAt: ago(8),
        caption: 'Home shop finally done. Every tool has a shadow on the pegboard.',
        specs: [['Stand', 'Pro clamp stand'], ['Truing', 'Wheel truing stand + dish tool'], ['Torque', '2–24 Nm + 20–100 Nm wrenches'], ['Bench', 'Butcher block, 6 ft'], ['Lighting', '5000K LED strip']] },
      { id: 'k4', athleteId: 'a3', title: 'Sprint Machine', sport: 'Track', type: 'Bike', art: 'track', hue: 330, likes: 3650, createdAt: ago(44),
        caption: 'Stiffest thing I own. Built for 200 meters of chaos.',
        specs: [['Frame', 'Carbon track, size S'], ['Gearing', '58 x 15'], ['Wheels', 'Disc front and rear'], ['Bars', 'Sprint drops, 36 cm'], ['Cranks', '165 mm']] },
      { id: 'k5', athleteId: 'a4', title: 'Downhill Sled', sport: 'MTB', type: 'Bike', art: 'mtb', hue: 190, likes: 5020, createdAt: ago(70),
        caption: '200 mm of travel and one goal: top of the podium at the Gravity Classic.',
        specs: [['Frame', 'Aluminum DH, size M'], ['Fork', '200 mm dual crown'], ['Shock', 'Coil, 450 lb spring'], ['Brakes', '4-piston, 220 mm rotors'], ['Tires', '2.5 DH casing']] },
      { id: 'k6', athleteId: 'a2', title: 'Mud Season', sport: 'Cyclocross', type: 'Bike', art: 'gravel', hue: 28, likes: 1980, createdAt: ago(14),
        caption: 'Pit bike and race bike, same setup. Mud tires on, pressure low.',
        specs: [['Frame', 'Aluminum cross, 54 cm'], ['Drivetrain', '1x11, 40t ring'], ['Tires', '33 mm mud, tubular'], ['Pressure', '21 psi front / 22 rear'], ['Pit wash', 'Bucket + brush, always']] },
      { id: 'k7', athleteId: 'a7', title: 'Long Travel Sender', sport: 'MTB', type: 'Bike', art: 'mtb', hue: 160, likes: 2760, createdAt: ago(52),
        caption: '170 front, 160 rear. Set up for the steep and loose stuff in the Cascades.',
        specs: [['Frame', 'Carbon enduro, size L'], ['Fork', '170 mm coil'], ['Shock', '160 mm air'], ['Brakes', '4-piston, 220/203 rotors'], ['Tires', '2.5 front / 2.4 rear']] },
      { id: 'k8', athleteId: 'a12', title: 'Climbing Machine', sport: 'Road', type: 'Bike', art: 'road', hue: 140, likes: 3380, createdAt: ago(5),
        caption: '6.9 kg with pedals. Built for the Everesting attempt.',
        specs: [['Frame', 'Lightweight carbon, 52 cm'], ['Groupset', '2x12 electronic'], ['Cassette', '11–34'], ['Wheels', 'Shallow carbon climbing wheels'], ['Weight', '6.9 kg']] },
      { id: 'k9', athleteId: 'a9', title: 'Park Rat', sport: 'BMX', type: 'Bike', art: 'bmx', hue: 215, likes: 1460, createdAt: ago(26),
        caption: '20.75 in top tube, pegs on both sides, brakeless.',
        specs: [['Frame', 'Chromoly, 20.75 in TT'], ['Gearing', '25 x 9'], ['Bars', '9.25 in rise'], ['Tires', '2.4 park tires'], ['Pegs', 'Nylon sleeve, 4']] },
      { id: 'k10', athleteId: 'a6', title: 'The Pain Cave', sport: 'Road', type: 'Workstation', art: 'desk', hue: 265, likes: 1240, createdAt: ago(36),
        caption: 'Where the intervals happen. Spreadsheet on the left, fan on full on the right.',
        specs: [['Trainer', 'Direct-drive smart trainer'], ['Screens', '27 in + laptop'], ['Fan', 'Industrial, 3 speeds'], ['Planner', 'Paper training log']] },
      { id: 'k11', athleteId: 'a10', title: 'Aero Everything', sport: 'Road', type: 'Bike', art: 'tt', hue: 12, likes: 1720, createdAt: ago(60),
        caption: 'Time trial bike, aero bottle and a skinsuit I refuse to replace.',
        specs: [['Frame', 'Aluminum TT, size M'], ['Bars', 'Aero extensions'], ['Wheels', '60 mm front / disc rear'], ['Hydration', 'Between-arms bottle']] },
      { id: 'k12', athleteId: 'a11', title: 'Infield Pit', sport: 'Track', type: 'Workstation', art: 'stand', hue: 300, likes: 2190, createdAt: ago(18),
        caption: 'Everything I bring to the velodrome infield. Rollers, gears, snacks.',
        specs: [['Warm-up', 'Rollers + mat'], ['Gears', 'Chainrings 48–56, cogs 13–16'], ['Tools', 'Track wrench, chain whip'], ['Fuel', 'Rice cakes + espresso']] },
      { id: 'k13', athleteId: 'a8', title: 'Shop Hack: Wheel Wall', sport: 'Road', type: 'Workstation', art: 'wheelwall', hue: 45, likes: 1610, createdAt: ago(80),
        caption: 'Hung every wheel waiting for a rebuild. Customers love it, my landlord less so.',
        specs: [['Hooks', '24 wall hooks'], ['Labels', 'Tag per customer'], ['Turnaround', '3–5 days']] },
      { id: 'k15', athleteId: 'a13', title: 'Service Corner', sport: 'Road', type: 'Workstation', art: 'stand', hue: 25, likes: 2440, createdAt: ago(9),
        caption: 'Two stands, one bench, zero excuses. Every tool back on the wall before close.',
        specs: [['Stands', '2 x pro clamp stands'], ['Bench', 'Steel, 8 ft with vise'], ['Bleed kits', 'Mineral oil + DOT, labeled'], ['Truing', 'Pro truing stand + tension meter'], ['Air', 'Shop compressor + tubeless booster'], ['Music', 'Always on, always loud']] },
      { id: 'k14', athleteId: 'a1', title: 'Bikepacking Overnighter', sport: 'Gravel', type: 'Kit', art: 'bags', hue: 175, likes: 1390, createdAt: ago(100),
        caption: 'Everything for one night out under 8 kg.',
        specs: [['Shelter', '1-person tent'], ['Sleep', 'Quilt + pad'], ['Cook', 'Stove + mug'], ['Bags', 'Seat, frame, bar roll']] }
    ];

    const comments = {
      k2: [{ by: 'a1', text: 'That gearing is unhinged. Respect.', at: ago(26) }, { by: 'a12', text: 'Clean build!', at: ago(22) }],
      k3: [{ by: 'a7', text: 'Pegboard shadows are elite.', at: ago(6) }],
      k5: [{ by: 'a7', text: 'See you at the Classic.', at: ago(50) }],
      k8: [{ by: 'a5', text: 'Going full Everest on that? Let\'s go.', at: ago(3) }]
    };

    const posts = [
      { id: 'p1', athleteId: 'a12', sport: 'Road', title: 'Why I am trying to Everest Twin Peaks', likes: 812, createdAt: ago(10), art: 'road', hue: 140,
        body: 'Everesting is simple to explain and brutal to do: pick one hill and ride it up and down until you have climbed 8,848 meters, the height of Mount Everest.\n\nI picked Twin Peaks because it is the hill that taught me how to climb. The first time I rode it I stopped three times. Now it is my favorite place in the city.\n\nThe plan is a long build. Twelve weeks of steady volume, two long climbing days per week, and one rule: never go into the red before hour six.\n\nNutrition is the part that scares me most. Every 20 minutes I eat something. Every hour I drink a full bottle. If I forget, the ride ends early.\n\nI will post every training week here, with the numbers. If you want to ride a lap with me on the day, the start is at sunrise. Bring snacks.' },
      { id: 'p2', athleteId: 'a3', sport: 'Track', title: '11.3 to 11.0: the last three tenths', likes: 1240, createdAt: ago(28), art: 'track', hue: 330,
        body: 'The last three tenths are never about power alone. They are about patience.\n\nMy coach and I changed three things this block: more standing starts, more sleep, and less ego in the gym.\n\nThe starts fixed my first lap. The sleep fixed everything else.\n\nThe Sprint GP is a month out. I will go under 11 on the boards or I will learn exactly why I did not. Either way, you will see the video.' },
      { id: 'p3', athleteId: 'a8', sport: 'Road', title: 'Setting up a home shop under $500', likes: 1530, createdAt: ago(55), art: 'stand', hue: 45,
        body: 'You do not need a pro shop to work on your bike at home. You need a stand, good light and a few tools you trust.\n\nStart with a clamp stand. Working on the ground is how bolts get stripped.\n\nBuy a torque wrench before you buy anything fancy. Carbon parts do not forgive guessing.\n\nAdd a set of hex keys, a chain checker, tire levers and a floor pump. That covers most of what riders need week to week.\n\nLast tip: put a shadow board on your wall. When every tool has a home, you stop losing the 5 mm.' },
      { id: 'p4', athleteId: 'a2', sport: 'Cyclocross', title: 'What a cross season actually feels like', likes: 690, createdAt: ago(75), art: 'gravel', hue: 28,
        body: 'Week one felt heroic. Week three felt like a part-time job. Week five I started to enjoy the mud again.\n\nMost of cross is the stuff between the races: washing the bike, gluing tubulars, practicing remounts in a park while people stare.\n\nThree rounds left. Then the Finals in Portland, and a very long nap.' },
      { id: 'p5', athleteId: 'a5', sport: 'Fixed', title: 'Fixed gear crits are back', likes: 980, createdAt: ago(120), art: 'track', hue: 95,
        body: 'Night races, no brakes, closed streets. The fixed crit scene is the most fun you can have on two wheels.\n\nIf you have never raced one: practice your cornering, check your gearing, and stay off the front for the first ten laps.\n\nSee you at the Brooklyn Night Crit.' }
    ];

    const activity = [
      { type: 'rig', who: 'a12', what: 'posted a new rig', ref: 'k8', at: ago(5) },
      { type: 'rig', who: 'a13', what: 'shared a workstation', ref: 'k15', at: ago(9) },
      { type: 'goal', who: 'a3', what: 'hit 11.3 s toward a flying 200 m under 11.0 s', ref: 'a3', at: ago(7) },
      { type: 'rig', who: 'a8', what: 'shared a workstation', ref: 'k3', at: ago(8) },
      { type: 'post', who: 'a12', what: 'wrote in the journal', ref: 'p1', at: ago(10) },
      { type: 'race', who: 'a7', what: 'is in for Headlands Hundred', ref: 'r1', at: ago(12) },
      { type: 'rig', who: 'a2', what: 'posted a new rig', ref: 'k6', at: ago(14) },
      { type: 'goal', who: 'a5', what: 'hit 1,310 W toward 1,400 W peak sprint', ref: 'a5', at: ago(16) },
      { type: 'rig', who: 'a11', what: 'shared a workstation', ref: 'k12', at: ago(18) },
      { type: 'rig', who: 'a1', what: 'posted a new rig', ref: 'k1', at: ago(20) },
      { type: 'race', who: 'a9', what: 'is in for Mile High BMX Jam', ref: 'r10', at: ago(24) },
      { type: 'post', who: 'a3', what: 'wrote in the journal', ref: 'p2', at: ago(28) }
    ];

    /* ---- profile extras: pins, results, season plan, top 5s, sponsor details.
       Results and plans use made-up local events; "top races" can name famous
       real races, since those are bucket-list picks, not results. */
    const V = 'assets/video/clips/', P = 'assets/demo/';
    const extras = {
      a1: {
        avatar: { sport: 'Gravel', skin: '#b97c4f', hair: 'ponytail', hairColor: '#14110f', face: 'smile', head: 'road', headColor: '#f4f5f7', eyes: 'wrap', lens: 'violet', top: 'jersey', topColor: '#d7ff3a', topColor2: '#15161a', pattern: 'sash', bottom: 'bibs', bottomColor: '#15161a', shoes: '#f4f5f7', socks: '#f4f5f7', extras: ['gloves', 'watch'], prop: 'bottle', pose: 'thumbs' },
        pinned: [
          { kind: 'video', src: V + 'cycling-drone-singletrack.mp4', title: 'Mt. Tam fire roads from above' },
          { kind: 'photo', src: P + 'wheel-leaves.jpg', title: 'First wet ride of the fall' },
          { kind: 'photo', src: P + 'clip-in.jpg', title: 'New pedals, same legs' },
          { kind: 'video', src: V + 'cycling-peloton-rome.mp4', title: 'Watching the pros in Rome' },
          { kind: 'photo', src: P + 'sunset.jpg', title: 'Golden hour on the levee' }
        ],
        results: [
          { event: 'Marin Gravel Fondo', date: inDays(-19), place: 3, field: 212, cat: 'Women Open', time: '4:12:33' },
          { event: 'Diablo Dirt Classic', date: inDays(-47), place: 7, field: 168, cat: 'Women Open', time: '3:41:08' },
          { event: 'Sonoma Coast Gravel', date: inDays(-82), place: 1, field: 64, cat: 'Women 30–39', time: '2:58:47' },
          { event: 'Ohlone Wilderness Crit', date: inDays(-120), place: 12, field: 41, cat: 'Women Cat 2', time: '58:12' }
        ],
        plan: [
          { name: 'Santa Cruz CX Series #3', date: inDays(34), priority: 'C' },
          { name: 'Winter base camp, Gila', date: inDays(78), priority: 'B', kind: 'camp' },
          { name: 'Paso Robles Gravel', date: inDays(150), priority: 'B' },
          { name: 'Big Sur Dirt Hundred', date: inDays(215), priority: 'A' },
          { name: 'Sierra Gravel Stage Race', date: inDays(290), priority: 'A' }
        ],
        songs: [['Tití Me Preguntó', 'Bad Bunny'], ['Midnight City', 'M83'], ['Electric Feel', 'MGMT'], ['Feel It Still', 'Portugal. The Man'], ['Dog Days Are Over', 'Florence + The Machine']],
        topRaces: [
          { name: 'Unbound Gravel 200', why: 'The one. 200 miles of Kansas flint.', status: 'bucket' },
          { name: 'Belgian Waffle Ride', why: 'Dirt, road and a waffle at the end.', status: 'done', year: 2025 },
          { name: 'Grinduro California', why: 'Timed segments, party everywhere else.', status: 'done', year: 2024 },
          { name: 'Leadville 100 MTB', why: 'Altitude is the real opponent.', status: 'bucket' },
          { name: 'Marin Gravel Fondo', why: 'Home roads. Podium this year.', status: 'done', year: 2026 }
        ],
        sponsorsDetail: [{ name: 'Fogline Coffee', kind: 'Coffee partner', since: 2025 }, { name: 'Switchback Bars', kind: 'Nutrition', since: 2026 }]
      },
      a5: {
        avatar: { sport: 'Fixed', skin: '#5a341d', hair: 'buzz', hairColor: '#14110f', face: 'grin', facial: 'beard', head: 'cap', headColor: '#ff4fa3', eyes: 'round', lens: 'gold', top: 'jersey', topColor: '#15161a', topColor2: '#ff4fa3', pattern: 'stripes', bottom: 'bibs', bottomColor: '#15161a', shoes: '#15161a', socks: '#ff4fa3', extras: ['gloves'], prop: 'bottle', pose: 'flex' },
        pinned: [
          { kind: 'video', src: V + 'cycling-track-pack.mp4', title: 'Thursday night track league' },
          { kind: 'photo', src: P + 'street.jpg', title: 'Downtown loop, no brakes' },
          { kind: 'video', src: V + 'cycling-race-city.mp4', title: 'Downtown crit, full gas' }
        ],
        results: [
          { event: 'Brooklyn Night Crit', date: inDays(-12), place: 2, field: 88, cat: 'Fixed Men', time: '41:05' },
          { event: 'Kissena Track Omnium', date: inDays(-40), place: 1, field: 22, cat: 'Cat 2 Men', time: '—' },
          { event: 'Red Hook Alleycat', date: inDays(-95), place: 5, field: 140, cat: 'Open', time: '1:02:44' }
        ],
        plan: [{ name: 'Winter rollers league', date: inDays(45), priority: 'C' }, { name: 'Philly Fixed Crit', date: inDays(160), priority: 'A' }, { name: 'Track Nationals', date: inDays(260), priority: 'A' }],
        songs: [['HUMBLE.', 'Kendrick Lamar'], ['DÁKITI', 'Bad Bunny & Jhayco'], ["Can't Hold Us", 'Macklemore & Ryan Lewis'], ['Blinding Lights', 'The Weeknd'], ['SICKO MODE', 'Travis Scott']],
        topRaces: [
          { name: 'Red Hook Crit Brooklyn', why: 'Where fixed crits got loud.', status: 'done', year: 2023 },
          { name: 'Six Days of Ghent', why: 'Track racing with a whole city screaming.', status: 'bucket' },
          { name: 'Kissena Track Omnium', why: 'Our velodrome, our rules.', status: 'done', year: 2026 },
          { name: 'Mission Crit', why: 'SF hills on a fixed gear. Pain.', status: 'bucket' },
          { name: 'Brooklyn Night Crit', why: 'Second by a wheel. Next year.', status: 'done', year: 2026 }
        ]
      },
      a3: {
        avatar: { sport: 'Track', skin: '#7a4a2a', hair: 'bun', hairColor: '#14110f', face: 'focus', head: 'aero', headColor: '#15161a', eyes: 'wrap', lens: 'violet', top: 'trisuit', topColor: '#ff4fa3', topColor2: '#15161a', pattern: 'split', bottom: 'trisuit', shoes: '#f4f5f7', socks: '#f4f5f7', extras: ['gloves'], prop: 'medal', pose: 'flex' },
        pinned: [{ kind: 'video', src: V + 'cycling-track-start.mp4', title: 'Standing start practice' }, { kind: 'photo', src: P + 'track-pack.jpg', title: 'Tuesday night track league' }, { kind: 'video', src: V + 'cycling-race-velodrome.mp4', title: 'Velodrome night' }],
        results: [
          { event: 'Georgia Track Championships', date: inDays(-60), place: 1, field: 18, cat: 'Women Sprint', time: '11.42 s flying 200' },
          { event: 'Southeast Sprint Omnium', date: inDays(-150), place: 2, field: 24, cat: 'Women Elite', time: '—' }
        ],
        plan: [{ name: 'Winter keirin series', date: inDays(48), priority: 'C' }, { name: 'Track Nationals', date: inDays(200), priority: 'A' }],
        songs: [['Till I Collapse', 'Eminem'], ['Run the World (Girls)', 'Beyoncé'], ['Eye of the Tiger', 'Survivor'], ["X Gon' Give It to Ya", 'DMX'], ['Gasolina', 'Daddy Yankee']],
        topRaces: [
          { name: 'Track Nationals, Women Sprint', why: 'Under 11 on the big stage.', status: 'bucket' },
          { name: 'UCI Track Nations Cup', why: 'Wear the national skinsuit once.', status: 'bucket' },
          { name: 'Georgia Track Championships', why: 'First state title.', status: 'done', year: 2026 },
          { name: 'Southeast Sprint Omnium', why: 'Where 11-flat started to feel close.', status: 'done', year: 2026 },
          { name: 'Six Days of Ghent', why: 'One day, as a fan with a beer.', status: 'bucket' }
        ],
        sponsorsDetail: [{ name: 'Iron Orchard Training', kind: 'Strength partner', since: 2024 }]
      },
      a4: {
        avatar: { sport: 'MTB', skin: '#f6c9a3', hair: 'long', hairColor: '#e3c27a', face: 'grin', head: 'mtbhelmet', headColor: '#ff7a1a', eyes: 'goggles', lens: 'gold', top: 'longsleeve', topColor: '#2e6ff2', topColor2: '#ff7a1a', pattern: 'hoops', bottom: 'mtbshorts', bottomColor: '#15161a', shoes: '#15161a', socks: '#ff7a1a', extras: ['gloves', 'kneepads'], prop: 'none', pose: 'thumbs' },
        pinned: [{ kind: 'video', src: V + 'cycling-mtb-descent.mp4', title: 'Race run, Deer Valley' }, { kind: 'photo', src: P + 'mtb-stunt.jpg', title: 'Practice day air time' }, { kind: 'photo', src: P + 'drone-singletrack.jpg', title: 'Scouting lines from above' }],
        results: [
          { event: 'Snowbird Gravity Open', date: inDays(-45), place: 4, field: 36, cat: 'Women Pro DH', time: '3:12.84' },
          { event: 'Deer Valley Downhill', date: inDays(-80), place: 2, field: 28, cat: 'Women Pro DH', time: '2:58.10' }
        ],
        plan: [{ name: 'Winter dirt camp, St. George', date: inDays(25), priority: 'C', kind: 'camp' }, { name: 'Sea Otter Classic DH', date: inDays(160), priority: 'A' }],
        songs: [['Mr. Brightside', 'The Killers'], ['Kids', 'MGMT'], ['Little Talks', 'Of Monsters and Men'], ['Sweet Disposition', 'The Temper Trap'], ['Pumped Up Kicks', 'Foster the People']],
        topRaces: [
          { name: 'Red Bull Rampage', why: 'The cliffs. Just once.', status: 'bucket' },
          { name: 'Crankworx Whistler', why: 'A week of nothing but bikes.', status: 'bucket' },
          { name: 'Sea Otter Classic DH', why: 'Season opener, every year.', status: 'done', year: 2025 },
          { name: 'Deer Valley Downhill', why: 'Second place, first pro podium.', status: 'done', year: 2026 },
          { name: 'UCI DH World Cup, Mont-Sainte-Anne', why: 'The roots everyone talks about.', status: 'bucket' }
        ],
        sponsorsDetail: [{ name: 'Wasatch Suspension Co.', kind: 'Suspension tuning', since: 2024 }, { name: 'Summit Goggle Lab', kind: 'Optics', since: 2025 }]
      },
      a8: {
        avatar: { sport: 'Shop', skin: '#b97c4f', hair: 'curly', hairColor: '#14110f', face: 'grin', facial: 'stubble', head: 'backcap', headColor: '#15161a', eyes: 'round', lens: 'clear', top: 'apron', topColor: '#f4f5f7', topColor2: '#3b2416', bottom: 'jeans', bottomColor: '#2e4a7a', shoes: '#15161a', extras: ['gloves', 'watch'], prop: 'wrench', pose: 'thumbs' },
        mech: { shop: 'Ibarra Wheelworks', specialties: ['Wheel builds', 'Hydraulic brakes', 'Electronic shifting', 'Restorations'], certs: ['UBI Professional Repair', 'Wheel building, advanced'], built: 186, turnaround: '3–5 days', since: 2014 },
        pinned: [{ kind: 'video', src: V + 'cycling-mechanic-wheel.mp4', title: 'Fresh wheel build, ready for pickup' }, { kind: 'photo', src: P + 'clip-in.jpg', title: 'Drivetrain deep clean' }, { kind: 'video', src: V + 'cycling-mechanic-gloves.mp4', title: 'Dialed. Zero hop, zero wobble.' }],
        songs: [['Oye Como Va', 'Santana'], ['Superstition', 'Stevie Wonder'], ['Gasolina', 'Daddy Yankee'], ['Electric Feel', 'MGMT'], ['September', 'Earth, Wind & Fire']],
        topRaces: [{ name: 'Mechanic for a pro team at the Tour of California', why: 'The neutral support car dream.', status: 'bucket' }, { name: 'Wrenching at Unbound Gravel', why: '200 miles of flats and smiles.', status: 'done', year: 2025 }]
      },
      a13: {
        avatar: { sport: 'Shop', skin: '#9a6238', hair: 'short', hairColor: '#14110f', face: 'smile', facial: 'mustache', head: 'cap', headColor: '#ff7a1a', eyes: 'none', top: 'apron', topColor: '#15161a', topColor2: '#ff7a1a', bottom: 'jeans', bottomColor: '#15161a', shoes: '#f4f5f7', extras: ['gloves'], prop: 'wrench', pose: 'flex' },
        mech: { shop: 'Fruitvale Cycle Works', specialties: ['Bike fits', 'Suspension service', 'Tubeless setups', 'Race-day support'], certs: ['UBI Professional Repair', 'Suspension service, level 2'], built: 240, turnaround: 'Same week', since: 2017 },
        pinned: [{ kind: 'photo', src: P + 'street.jpg', title: 'Test ride after a full overhaul' }, { kind: 'video', src: V + 'cycling-clip-in.mp4', title: 'Customer pickup day' }],
        results: [{ event: 'Oakland Twilight Crit', date: inDays(-33), place: 6, field: 58, cat: 'Men Cat 3', time: '45:10' }],
        songs: [['DÁKITI', 'Bad Bunny & Jhayco'], ['Feel Good Inc.', 'Gorillaz'], ['Can\'t Hold Us', 'Macklemore & Ryan Lewis'], ['Titi Me Preguntó', 'Bad Bunny'], ['Redbone', 'Childish Gambino']]
      },
      a7: {
        pinned: [{ kind: 'video', src: V + 'cycling-mtb-stunt.mp4', title: 'Shred session, Bend' }, { kind: 'photo', src: P + 'mtb-stunt.jpg', title: 'Sending the step-down' }],
        results: [{ event: 'Cascade Enduro #4', date: inDays(-30), place: 6, field: 90, cat: 'Pro Men', time: '18:22.4' }],
        songs: [['Seven Nation Army', 'The White Stripes'], ['Bones', 'Imagine Dragons'], ['Believer', 'Imagine Dragons'], ['Feel Good Inc.', 'Gorillaz'], ['Sabotage', 'Beastie Boys']],
        topRaces: [{ name: 'Enduro World Cup, Whistler', why: 'Crankworx week.', status: 'bucket' }, { name: 'Cascade Enduro', why: 'Local series, always deep.', status: 'done', year: 2026 }]
      },
      a12: {
        pinned: [{ kind: 'photo', src: P + 'trail.jpg', title: 'Presidio loop' }, { kind: 'video', src: V + 'cycling-street-zigzag.mp4', title: 'Commute, but make it fun' }],
        results: [{ event: 'Twin Peaks TT', date: inDays(-25), place: 2, field: 54, cat: 'Women Open', time: '14:08' }],
        songs: [['Ocean Eyes', 'Billie Eilish'], ['Pink + White', 'Frank Ocean'], ['Redbone', 'Childish Gambino'], ['Electric Love', 'BØRNS'], ['Kill Bill', 'SZA']]
      }
    };
    athletes.forEach((a) => { if (extras[a.id]) Object.assign(a, extras[a.id]); });

    /* ---- teams (all fictional). Riders join one team; brands can scout a whole squad. */
    const teams = [
      { id: 't1', name: 'Fogline Gravel Collective', city: 'Oakland, CA', disciplines: ['Gravel', 'Road'], colors: ['#d7ff3a', '#15161a'], founded: 2022,
        bio: 'East Bay dirt-road crew. Saturday long rides, Sunday coffee, race weekends all year.', sponsors: ['Fogline Coffee', 'Switchback Bars'], members: ['a1', 'a13'] },
      { id: 't2', name: 'Night Shift Crit Squad', city: 'Brooklyn, NY', disciplines: ['Fixed', 'Track'], colors: ['#ff4fa3', '#15161a'], founded: 2021,
        bio: 'Fixed crits, alleycats and Thursday track league. Lights on, brakes off.', sponsors: [], members: ['a5', 'a11'] },
      { id: 't3', name: 'Twin Peaks Climbing Club', city: 'San Francisco, CA', disciplines: ['Road'], colors: ['#7fc8ff', '#f4f5f7'], founded: 2019,
        bio: 'If it goes up, we ride it. Hill climbs, Everesting attempts and the occasional crit.', sponsors: [], members: ['a12', 'a8', 'a6'] },
      { id: 't4', name: 'Cascade Gravity', city: 'Bend, OR', disciplines: ['MTB'], colors: ['#ff7a1a', '#1f6b4a'], founded: 2020,
        bio: 'Enduro and downhill racers from the Cascades to the Wasatch.', sponsors: ['Ridgeback Tire Co.', 'Wasatch Suspension Co.'], members: ['a7', 'a4'] },
      { id: 't5', name: 'Velo Atlanta', city: 'Atlanta, GA', disciplines: ['Track', 'Road'], colors: ['#e5332a', '#f4f5f7'], founded: 2018,
        bio: 'Sprinters, pursuiters and a very loud infield.', sponsors: ['Iron Orchard Training'], members: ['a3'] }
    ];
    teams.forEach((t) => t.members.forEach((id) => { const a = athletes.find((x) => x.id === id); if (a) a.team = t.id; }));
    // riders can ride more than one discipline; the first is their main one
    const extraDisc = { a1: ['Gravel', 'Road'], a2: ['Cyclocross', 'Gravel'], a3: ['Track'], a4: ['MTB'], a5: ['Fixed', 'Track'], a6: ['Road'], a7: ['MTB', 'Gravel'], a8: ['Road', 'Gravel'], a9: ['BMX'], a10: ['Road'], a11: ['Track', 'Road'], a12: ['Road'], a13: ['Road', 'Fixed'] };
    athletes.forEach((a) => { a.disciplines = extraDisc[a.id] || [a.sport]; });

    return { now, SPORTS, TYPES, athletes, races, rigs, comments, posts, activity, teams };
  }

  window.KR_SEED = buildSeed;
})();
