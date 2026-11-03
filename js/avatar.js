/* =========================================================================
   COOLDOWN avatars: a build-your-own vinyl-toy rider for every cycling discipline.

   CD_AVATAR.svg(cfg)        full body, as an SVG string
   CD_AVATAR.head(cfg, px)   just the head, for small round avatars
   CD_AVATAR.kit(sport)      which options a sport offers (for the builder)
   CD_AVATAR.random(sport, seed) / CD_AVATAR.clean(cfg)

   Everything is drawn with plain SVG shapes, so it scales from a 34px nav
   bubble to a full profile hero and stays sharp.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- palettes */
  const SKIN = ['#ffe0c7', '#f6c9a3', '#e8b08a', '#d29a6c', '#b97c4f', '#9a6238', '#7a4a2a', '#5a341d'];
  const HAIR = ['#14110f', '#3b2416', '#6b4423', '#a8743f', '#e3c27a', '#c4471d', '#ece9e4', '#ff4fa3', '#2e6ff2'];
  const KIT = ['#d7ff3a', '#ff4fa3', '#2e6ff2', '#15161a', '#f4f5f7', '#e5332a', '#ff7a1a', '#3fe0a5', '#7a4dff', '#7fc8ff', '#1f6b4a', '#d9c7a4'];
  const LENS = { violet: ['#ff4fd8', '#5b2bff'], ocean: ['#7fe0ff', '#1a4dff'], gold: ['#ffe27a', '#ff7a1a'], smoke: ['#5d6474', '#0d0f14'], clear: ['#e9f4ff', '#a9c4e6'] };

  const LABEL = {
    none: 'None', road: 'Road helmet', aero: 'Aero helmet', cap: 'Cycling cap', visor: 'Visor', headband: 'Headband',
    beanie: 'Beanie', backcap: 'Backwards cap',
    wrap: 'Wraparound shades', round: 'Round shades', goggles: 'Goggles',
    jersey: 'Jersey', singlet: 'Singlet', tank: 'Tank', tee: 'Tee', jacket: 'Jacket', hoodie: 'Hoodie', trisuit: 'Skinsuit', longsleeve: 'Long-sleeve jersey', apron: 'Shop apron',
    bibs: 'Bib shorts', shorts: 'Shorts', tights: 'Tights', pants: 'Riding pants', baggy: 'Baggy pants', jeans: 'Jeans', mtbshorts: 'Baggy shorts',
    mtbhelmet: 'Trail helmet', kneepads: 'Knee pads', mud: 'Mud splatter', wrench: 'Wrench',
    solid: 'Solid', stripes: 'Stripes', sash: 'Sash', hoops: 'Hoops', dots: 'Dots', split: 'Split',
    buzz: 'Buzz', short: 'Short', curly: 'Curly', bun: 'Bun', ponytail: 'Ponytail', long: 'Long', bald: 'Bald',
    smile: 'Smile', grin: 'Grin', focus: 'Locked in',
    stubble: 'Stubble', beard: 'Beard', mustache: 'Mustache',
    down: 'Relaxed', thumbs: 'Thumbs up', flex: 'Flex',
    bottle: 'Bidon', medal: 'Finisher medal',
    gloves: 'Gloves', bib: 'Race number', watch: 'Sport watch'
  };

  // what each riding discipline can wear and hold ("Shop" is the mechanic's outfit)
  const KITS = {
    Road: { head: ['road', 'aero', 'cap', 'none'], eyes: ['wrap', 'round', 'none'], top: ['jersey', 'trisuit'], bottom: ['bibs'], extras: ['gloves', 'watch', 'bib'], prop: ['bottle', 'medal', 'none'] },
    Gravel: { head: ['road', 'cap', 'none'], eyes: ['wrap', 'round', 'none'], top: ['jersey', 'tee'], bottom: ['bibs', 'shorts'], extras: ['gloves', 'watch', 'mud'], prop: ['bottle', 'none'] },
    MTB: { head: ['mtbhelmet', 'road', 'none'], eyes: ['goggles', 'wrap', 'none'], top: ['longsleeve', 'tee'], bottom: ['mtbshorts', 'pants'], extras: ['gloves', 'kneepads', 'mud'], prop: ['none', 'bottle'] },
    Track: { head: ['aero', 'road'], eyes: ['wrap', 'none'], top: ['trisuit'], bottom: ['trisuit'], extras: ['gloves', 'bib'], prop: ['none', 'medal'] },
    Cyclocross: { head: ['road', 'cap', 'beanie'], eyes: ['wrap', 'none'], top: ['trisuit', 'longsleeve'], bottom: ['trisuit', 'bibs'], extras: ['mud', 'gloves', 'bib'], prop: ['none', 'bottle'] },
    BMX: { head: ['mtbhelmet', 'backcap', 'none'], eyes: ['none', 'round'], top: ['tee', 'hoodie'], bottom: ['jeans', 'mtbshorts'], extras: ['gloves', 'kneepads'], prop: ['none'] },
    Fixed: { head: ['cap', 'road', 'backcap', 'none'], eyes: ['round', 'wrap', 'none'], top: ['tee', 'jersey'], bottom: ['shorts', 'bibs', 'jeans'], extras: ['watch', 'gloves'], prop: ['bottle', 'none'] },
    Shop: { head: ['cap', 'backcap', 'beanie', 'none'], eyes: ['none', 'round'], top: ['apron'], bottom: ['jeans', 'shorts'], extras: ['gloves', 'watch'], prop: ['wrench', 'none'] }
  };
  const SPORT_LABEL = { Road: 'Road', Gravel: 'Gravel', MTB: 'MTB', Track: 'Track', Cyclocross: 'Cyclocross', BMX: 'BMX', Fixed: 'Fixed', Shop: 'Mechanic' };
  const PATTERNS = ['solid', 'stripes', 'sash', 'hoops', 'dots', 'split'];
  const HAIRS = ['short', 'buzz', 'curly', 'bun', 'ponytail', 'long', 'bald'];
  const FACES = ['smile', 'grin', 'focus'];
  const FACIAL = ['none', 'stubble', 'beard', 'mustache'];
  const POSES = ['thumbs', 'down', 'flex'];

  /* ---------------------------------------------------------------- helpers */
  const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  function shade(hex, amt) { // amt -1..1
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const ink = (hex) => (lum(hex) > 0.6 ? '#13213a' : '#ffffff');
  const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];
  // small seeded random (mulberry32 over a string hash), so the same seed always gives the same avatar
  function rng(seed) {
    let h = 1779033703 ^ String(seed).length;
    for (const ch of String(seed)) { h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  let uidN = 0;

  /* ---------------------------------------------------------------- config */
  function kit(sport) { return KITS[sport] || KITS.Road; }
  function random(sport, seed) {
    const r = rng(seed == null ? Math.random() : seed);
    const k = kit(sport);
    const c1 = pick(KIT, r);
    let c2 = pick(KIT, r); if (c2 === c1) c2 = KIT[(KIT.indexOf(c1) + 3) % KIT.length];
    return clean({
      sport, skin: pick(SKIN, r), hair: pick(HAIRS, r), hairColor: pick(HAIR.slice(0, 7), r), face: pick(FACES, r), facial: r() < 0.7 ? 'none' : pick(FACIAL, r),
      head: k.head[0] === 'none' && r() < 0.5 ? 'none' : pick(k.head, r), headColor: pick(KIT, r),
      eyes: pick(k.eyes, r), lens: pick(Object.keys(LENS), r),
      top: pick(k.top, r), topColor: c1, topColor2: c2, pattern: pick(PATTERNS, r),
      bottom: pick(k.bottom, r), bottomColor: r() < 0.6 ? '#15161a' : pick(KIT, r),
      shoes: pick(['#f4f5f7', '#15161a', '#d7ff3a', '#ff4fa3', '#2e6ff2'], r), socks: pick(['#f4f5f7', '#15161a', c1], r),
      extras: k.extras.filter(() => r() < 0.6), prop: k.prop[0], pose: pick(POSES, r), number: String(10 + Math.floor(r() * 890))
    });
  }
  // make any stored config safe and complete for its sport
  function clean(c) {
    c = Object.assign({}, c || {});
    const sport = KITS[c.sport] ? c.sport : 'Road', k = kit(sport);
    const one = (v, list, d) => (list.includes(v) ? v : d);
    const col = (v, d) => (isHex(v) ? v.toLowerCase() : d);
    return {
      sport,
      skin: col(c.skin, SKIN[2]), hair: one(c.hair, HAIRS, 'short'), hairColor: col(c.hairColor, HAIR[1]),
      face: one(c.face, FACES, 'smile'), facial: one(c.facial, FACIAL, 'none'),
      head: one(c.head, k.head, k.head[0]), headColor: col(c.headColor, '#f4f5f7'),
      eyes: one(c.eyes, k.eyes, k.eyes[0]), lens: LENS[c.lens] ? c.lens : 'violet',
      top: one(c.top, k.top, k.top[0]), topColor: col(c.topColor, '#d7ff3a'), topColor2: col(c.topColor2, '#15161a'), pattern: one(c.pattern, PATTERNS, 'solid'),
      bottom: one(c.bottom, k.bottom, k.bottom[0]), bottomColor: col(c.bottomColor, '#15161a'),
      shoes: col(c.shoes, '#f4f5f7'), socks: col(c.socks, '#f4f5f7'),
      extras: (Array.isArray(c.extras) ? c.extras : []).filter((x) => k.extras.includes(x)),
      prop: one(c.prop, k.prop, k.prop[0]), pose: one(c.pose, POSES, 'thumbs'),
      number: String(c.number || '').replace(/\D/g, '').slice(0, 3) || '27'
    };
  }

  /* ---------------------------------------------------------------- drawing */
  // arm: drawn hanging down from the shoulder, then rotated into a pose
  function arm(side, a, P, sleeve, sleeveLen, glove) {
    const skin = a.skin, sk2 = shade(skin, -0.25);
    const down = side === 'L' ? 14 : -14;
    const rot = a.pose === 'flex' ? (side === 'L' ? 128 : -128) : a.pose === 'thumbs' && side === 'R' ? -112 : down;
    const sx = side === 'L' ? 70 : 130;
    const hand = glove || skin, hand2 = shade(hand, -0.28);
    const thumb = (a.pose === 'thumbs' && side === 'R') || a.pose === 'flex';
    // outer group places + poses the arm; the inner group is what CSS waves
    let s = `<g transform="translate(${sx} 147) rotate(${rot})"><g class="av-arm av-arm-${side}">`;
    // upper arm (skin), sleeve over it
    s += `<line x1="0" y1="0" x2="0" y2="44" stroke="${sk2}" stroke-width="16.5" stroke-linecap="round"/><line x1="0" y1="0" x2="0" y2="44" stroke="${skin}" stroke-width="13.5" stroke-linecap="round"/>`;
    if (sleeve) s += `<line x1="0" y1="0" x2="0" y2="${sleeveLen}" stroke="${shade(sleeve, -0.25)}" stroke-width="20" stroke-linecap="round"/><line x1="0" y1="0" x2="0" y2="${sleeveLen}" stroke="${sleeve}" stroke-width="17" stroke-linecap="round"/>`;
    if (a.extras.includes('watch') && side === 'L') s += `<rect x="-8.5" y="36" width="17" height="6" rx="2.5" fill="#15161a"/><rect x="-4" y="36.6" width="8" height="4.8" rx="1.5" fill="#7fc8ff"/>`;
    // hand (fist), with a thumb when posing
    s += `<circle cx="0" cy="50" r="9.5" fill="${hand}" stroke="${hand2}" stroke-width="1.6"/>`;
    // thumb always points straight up on screen, whatever the arm angle
    if (thumb) s += `<g transform="translate(0 50) rotate(${-rot})"><rect x="-3" y="-19" width="7" height="13" rx="3.5" fill="${hand}" stroke="${hand2}" stroke-width="1.4"/></g>`;
    s += `<ellipse cx="-3" cy="46.5" rx="3.2" ry="2.2" fill="#fff" opacity=".35"/>`;
    // props held in the left hand
    if (side === 'L' && a.pose !== 'flex') {
      if (a.prop === 'bottle') s += `<g transform="translate(-1 50)"><rect x="-7" y="-26" width="14" height="30" rx="5" fill="${a.topColor2}" stroke="${shade(a.topColor2, -0.35)}" stroke-width="1.5"/><rect x="-3.5" y="-31" width="7" height="6" rx="2" fill="#15161a"/><rect x="-4" y="-20" width="2.5" height="18" rx="1.2" fill="#fff" opacity=".45"/></g>`;
      if (a.prop === 'wrench') s += `<g transform="translate(0 50) rotate(20)"><rect x="-3" y="-4" width="6" height="34" rx="3" fill="#c9ced8" stroke="#7d8594" stroke-width="1.4"/><path d="M-8 30 a8 8 0 1 0 16 0 l-4 0 l0 5 l-8 0 l0 -5 Z" fill="#c9ced8" stroke="#7d8594" stroke-width="1.4"/><rect x="-1" y="0" width="2" height="22" fill="#fff" opacity=".6"/></g>`;
      if (a.prop === 'medal') s += `<g transform="translate(0 50)"><path d="M-5 0 L-2 16 M5 0 L2 16" stroke="${a.topColor}" stroke-width="3"/><circle cx="0" cy="22" r="8" fill="#ffd84d" stroke="#c99a1c" stroke-width="1.6"/><circle cx="-2.5" cy="19.5" r="2.2" fill="#fff" opacity=".6"/></g>`;
    }
    return s + '</g></g>';
  }

  function hairBack(a) {
    const h = a.hairColor, h2 = shade(h, -0.3);
    if (a.hair === 'long') return `<path d="M52 92 C48 140 58 168 72 172 L128 172 C142 168 152 140 148 92 Z" fill="${h}" stroke="${h2}" stroke-width="1.6"/>`;
    if (a.hair === 'ponytail') return `<path d="M136 66 C168 70 172 110 158 132 C152 140 146 132 150 122 C156 104 150 86 132 80 Z" fill="${h}" stroke="${h2}" stroke-width="1.6"/>`;
    return '';
  }
  function hairFront(a) {
    const h = a.hairColor, h2 = shade(h, -0.3);
    switch (a.hair) {
      case 'bald': return '';
      case 'buzz': return `<path d="M54 80 C56 46 80 32 100 32 C120 32 144 46 146 80 C134 64 118 58 100 58 C82 58 66 64 54 80 Z" fill="${h}" opacity=".85"/>`;
      case 'curly': return `<g fill="${h}" stroke="${h2}" stroke-width="1.4">${[[60, 66], [72, 50], [90, 40], [110, 40], [128, 50], [140, 66], [66, 56], [134, 56], [100, 46], [82, 46], [118, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13"/>`).join('')}</g>`;
      case 'bun': return `<circle cx="100" cy="30" r="15" fill="${h}" stroke="${h2}" stroke-width="1.6"/><path d="M52 86 C50 50 76 34 100 34 C124 34 150 50 148 86 C138 66 122 60 108 62 C96 70 74 70 52 86 Z" fill="${h}" stroke="${h2}" stroke-width="1.6"/>`;
      case 'long':
      case 'ponytail': return `<path d="M52 92 C48 50 76 32 100 32 C124 32 152 50 148 92 C140 70 124 62 104 62 C90 72 70 74 52 92 Z" fill="${h}" stroke="${h2}" stroke-width="1.6"/>`;
      default: return `<path d="M52 84 C50 48 76 32 100 32 C126 32 150 48 148 84 C142 70 132 62 120 60 C112 66 96 68 80 64 C68 66 58 72 52 84 Z" fill="${h}" stroke="${h2}" stroke-width="1.6"/>`;
    }
  }
  function facialHair(a) {
    const h = a.hairColor;
    if (a.facial === 'stubble') return `<path d="M66 108 C70 126 84 134 100 134 C116 134 130 126 134 108 C126 120 114 124 100 124 C86 124 74 120 66 108 Z" fill="${h}" opacity=".28"/>`;
    if (a.facial === 'beard') return `<path d="M62 100 C62 124 80 138 100 138 C120 138 138 124 138 100 C132 116 120 122 112 120 C106 118 94 118 88 120 C80 122 68 116 62 100 Z" fill="${h}" stroke="${shade(h, -0.3)}" stroke-width="1.4"/>`;
    if (a.facial === 'mustache') return `<path d="M86 112 C92 106 98 108 100 110 C102 108 108 106 114 112 C108 112 104 114 100 114 C96 114 92 112 86 112 Z" fill="${h}"/>`;
    return '';
  }
  function face(a) {
    const dark = '#1b1410';
    let s = '';
    const eyesHidden = a.eyes === 'wrap' || a.eyes === 'goggles';
    if (!eyesHidden) {
      s += `<g class="av-eyes"><ellipse cx="82" cy="96" rx="4.6" ry="6.2" fill="${dark}"/><ellipse cx="118" cy="96" rx="4.6" ry="6.2" fill="${dark}"/><circle cx="83.6" cy="93.6" r="1.7" fill="#fff"/><circle cx="119.6" cy="93.6" r="1.7" fill="#fff"/></g>`;
      const by = a.face === 'focus' ? 84 : 82;
      s += `<path d="M74 ${by} Q82 ${by - 4} 90 ${by + (a.face === 'focus' ? 2 : 0)}" stroke="${shade(a.hairColor, a.hair === 'bald' ? 0 : -0.1)}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M110 ${by + (a.face === 'focus' ? 2 : 0)} Q118 ${by - 4} 126 ${by}" stroke="${shade(a.hairColor, -0.1)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    }
    s += `<ellipse cx="70" cy="110" rx="7" ry="4" fill="#ff7a8a" opacity=".28"/><ellipse cx="130" cy="110" rx="7" ry="4" fill="#ff7a8a" opacity=".28"/>`;
    if (a.face === 'grin') s += `<path d="M86 112 Q100 128 114 112 Z" fill="${dark}"/><path d="M89 113 Q100 117 111 113 L110 115 Q100 118 90 115 Z" fill="#fff"/>`;
    else if (a.face === 'focus') s += `<path d="M91 117 Q100 115 109 117" stroke="${dark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    else s += `<path d="M88 113 Q100 124 112 113" stroke="${dark}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    return s;
  }
  function eyewear(a, id) {
    const [l1, l2] = LENS[a.lens];
    const g = `<defs><linearGradient id="${id}ln" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l1}"/><stop offset="1" stop-color="${l2}"/></linearGradient></defs>`;
    if (a.eyes === 'wrap') return g + `<path d="M58 90 C60 82 74 80 100 80 C126 80 140 82 142 90 L140 104 C138 110 124 112 114 108 C108 106 104 102 100 102 C96 102 92 106 86 108 C76 112 62 110 60 104 Z" fill="url(#${id}ln)" stroke="#15161a" stroke-width="3.2"/><path d="M70 86 L84 86" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M58 91 L50 92 M142 91 L150 92" stroke="#15161a" stroke-width="3.5"/>`;
    if (a.eyes === 'round') return g + `<circle cx="82" cy="96" r="11" fill="url(#${id}ln)" stroke="#15161a" stroke-width="2.6" opacity=".95"/><circle cx="118" cy="96" r="11" fill="url(#${id}ln)" stroke="#15161a" stroke-width="2.6" opacity=".95"/><path d="M93 95 Q100 91 107 95" stroke="#15161a" stroke-width="2.4" fill="none"/><path d="M76 91 l5 -2 M112 91 l5 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    if (a.eyes === 'goggles') return g + `<path d="M50 84 L150 84" stroke="${a.headColor}" stroke-width="9"/><rect x="58" y="78" width="84" height="34" rx="16" fill="url(#${id}ln)" stroke="${shade(a.headColor, -0.4)}" stroke-width="4"/><path d="M68 86 Q84 82 96 86" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".75"/>`;
    return '';
  }
  function headwear(a, id) {
    const c = a.headColor, c2 = shade(c, -0.3), c3 = shade(c, 0.35);
    switch (a.head) {
      case 'road': return `<path d="M46 86 C44 46 72 26 100 26 C128 26 156 46 154 86 C150 78 140 74 128 72 L72 72 C60 74 50 78 46 86 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><g fill="#15161a" opacity=".85"><path d="M78 36 L72 58 L80 58 L86 34 Z"/><path d="M96 31 L95 56 L105 56 L104 31 Z"/><path d="M122 36 L128 58 L120 58 L114 34 Z"/><path d="M58 52 L56 66 L64 64 L68 48 Z"/><path d="M142 52 L144 66 L136 64 L132 48 Z"/></g><path d="M66 40 Q84 30 100 30" stroke="${c3}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/><path d="M52 86 L60 120 M148 86 L140 120" stroke="#15161a" stroke-width="2.4"/>`;
      case 'mtbhelmet': return `<path d="M46 88 C44 46 72 26 100 26 C128 26 156 46 154 88 C150 80 140 76 128 74 L72 74 C60 76 50 80 46 88 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><g fill="#15161a" opacity=".8"><path d="M86 34 L82 54 L90 54 L93 32 Z"/><path d="M114 34 L118 54 L110 54 L107 32 Z"/></g><path d="M56 70 Q100 54 144 70 L150 80 Q100 66 50 80 Z" fill="${c2}" stroke="${shade(c, -0.45)}" stroke-width="1.6"/><path d="M66 40 Q84 30 100 30" stroke="${c3}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/><path d="M52 88 L60 120 M148 88 L140 120" stroke="#15161a" stroke-width="2.4"/>`;
      case 'aero': return `<path d="M44 88 C40 48 70 26 104 26 C140 26 170 56 176 84 C150 80 124 76 96 74 C76 74 56 78 44 88 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><path d="M64 44 Q90 30 116 32" stroke="${c3}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/><path d="M52 88 L60 120 M148 86 L140 120" stroke="#15161a" stroke-width="2.4"/>`;
      case 'cap': return `<path d="M52 74 C54 46 76 34 100 34 C124 34 146 46 148 74 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><path d="M52 72 Q100 66 148 72 L148 76 Q100 70 52 76 Z" fill="${a.topColor2}"/><path d="M70 74 Q100 64 130 74 L128 84 Q100 76 72 84 Z" fill="${c2}"/><path d="M96 34 L104 34 L104 72 L96 72 Z" fill="${a.topColor2}" opacity=".9"/>`;
      case 'backcap': return `<path d="M50 74 C52 44 76 32 100 32 C124 32 148 44 150 74 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><path d="M128 52 Q160 50 168 60 Q160 66 140 64 Z" fill="${c2}"/><rect x="86" y="62" width="28" height="9" rx="4" fill="${c2}"/>`;
      case 'visor': return `<path d="M50 76 Q100 62 150 76 L150 84 Q100 70 50 84 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><path d="M62 82 Q100 70 138 82 Q144 92 130 92 Q100 84 70 92 Q56 92 62 82 Z" fill="${c2}"/>`;
      case 'headband': return `<path d="M50 74 Q100 58 150 74 L150 86 Q100 70 50 86 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><path d="M60 76 Q100 64 140 76" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>`;
      case 'beanie': return `<path d="M50 82 C48 44 74 28 100 28 C126 28 152 44 150 82 Z" fill="${c}" stroke="${c2}" stroke-width="2"/><rect x="48" y="70" width="104" height="16" rx="8" fill="${c2}"/><g stroke="${c2}" stroke-width="2" opacity=".5">${[66, 80, 94, 108, 122, 136].map((x) => `<path d="M${x} 40 L${x} 70"/>`).join('')}</g><circle cx="100" cy="24" r="10" fill="${a.topColor2}" stroke="${shade(a.topColor2, -0.3)}" stroke-width="1.6"/>`;
      default: return '';
    }
  }
  function torso(a, id) {
    const t = a.top === 'trisuit' ? 'trisuit' : a.top;
    const c = a.topColor, c2 = a.topColor2, cd = shade(c, -0.28);
    const body = t === 'jacket' || t === 'hoodie'
      ? 'M62 150 Q62 136 76 134 L124 134 Q138 136 138 150 L140 206 Q100 212 60 206 Z'
      : 'M68 148 Q68 137 79 136 L121 136 Q132 137 132 148 L134 204 L66 204 Z';
    let s = `<defs><clipPath id="${id}tc"><path d="${body}"/></clipPath><linearGradient id="${id}tg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>`;
    if (t === 'hoodie') s += `<path d="M74 136 C70 120 84 118 100 120 C116 118 130 120 126 136 Z" fill="${cd}"/>`;
    s += `<path d="${body}" fill="${c}" stroke="${cd}" stroke-width="2"/>`;
    s += `<g clip-path="url(#${id}tc)">`;
    const pat = (t === 'jersey' || t === 'singlet' || t === 'tee' || t === 'trisuit' || t === 'longsleeve') ? a.pattern : 'solid';
    if (pat === 'stripes') s += [72, 88, 104, 120].map((x) => `<rect x="${x}" y="130" width="7" height="80" fill="${c2}"/>`).join('');
    if (pat === 'sash') s += `<path d="M60 128 L82 128 L142 206 L120 206 Z" fill="${c2}"/>`;
    if (pat === 'hoops') s += [152, 172, 192].map((y) => `<rect x="60" y="${y}" width="80" height="9" fill="${c2}"/>`).join('');
    if (pat === 'dots') s += [[78, 150], [100, 146], [122, 152], [86, 170], [112, 172], [76, 192], [100, 190], [124, 194]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c2}"/>`).join('');
    if (pat === 'split') s += `<rect x="100" y="130" width="40" height="80" fill="${c2}"/>`;
    if (t === 'trisuit') s += `<path d="M60 170 L72 170 L72 210 L60 210 Z M128 170 L140 170 L140 210 L128 210 Z" fill="${c2}"/>`;
    if (t === 'jacket') s += [156, 172, 188].map((y) => `<path d="M60 ${y} Q100 ${y + 5} 140 ${y}" stroke="${cd}" stroke-width="2" fill="none"/>`).join('') + `<path d="M100 136 L100 210" stroke="${shade(c, -0.45)}" stroke-width="2.5"/>`;
    if (t === 'hoodie') s += `<path d="M78 180 L122 180 L126 202 L74 202 Z" fill="${cd}" opacity=".7"/><path d="M92 136 L90 158 M108 136 L110 158" stroke="#fff" stroke-width="2" opacity=".8"/>`;
    s += `<rect x="58" y="130" width="84" height="80" fill="url(#${id}tg)"/></g>`;
    // collars and zips
    if (t === 'jersey') s += `<path d="M86 136 Q100 146 114 136" stroke="${shade(c2, -0.1)}" stroke-width="4" fill="none"/><path d="M100 142 L100 202" stroke="${ink(c)}" stroke-width="1.6" opacity=".55"/><rect x="97" y="140" width="6" height="7" rx="1.5" fill="${ink(c)}" opacity=".7"/><text x="114" y="166" font-family="'Bricolage', sans-serif" font-weight="900" font-size="11" fill="${ink(pat === 'split' ? c2 : c)}" opacity=".8">CD</text>`;
    if (t === 'tee' || t === 'longsleeve') s += `<path d="M86 136 Q100 146 114 136" stroke="${cd}" stroke-width="4" fill="none"/>`;
    if (t === 'apron') s += `<path d="M86 136 Q100 146 114 136" stroke="${cd}" stroke-width="4" fill="none"/><path d="M78 150 L122 150 L126 210 L74 210 Z" fill="${c2}" stroke="${shade(c2, -0.35)}" stroke-width="2"/><path d="M80 150 L74 138 M120 150 L126 138" stroke="${shade(c2, -0.35)}" stroke-width="3"/><rect x="86" y="168" width="28" height="16" rx="2" fill="none" stroke="${shade(c2, -0.3)}" stroke-width="2"/><path d="M93 168 L93 160 M100 168 L100 158 M107 168 L107 161" stroke="#9aa1b2" stroke-width="3" stroke-linecap="round"/><text x="100" y="200" text-anchor="middle" font-family="'Bricolage', sans-serif" font-weight="900" font-size="9" fill="${ink(c2)}" opacity=".8">SHOP</text>`;
    if (t === 'singlet' || t === 'tank') s += `<path d="M84 136 Q100 154 116 136" fill="${a.skin}" stroke="${cd}" stroke-width="2"/>`;
    return s;
  }
  function bottoms(a) {
    const c = a.bottom === 'trisuit' ? a.topColor : a.bottomColor, cd = shade(c, -0.3);
    if (a.bottom === 'mtbshorts') return `<path d="M64 198 L136 198 L134 236 L104 236 L100 216 L96 236 L66 236 Z" fill="${c}" stroke="${cd}" stroke-width="2"/><path d="M70 226 L94 226 M106 226 L130 226" stroke="${cd}" stroke-width="2"/>`;
    if (a.bottom === 'pants' || a.bottom === 'baggy' || a.bottom === 'tights' || a.bottom === 'jeans') {
      const w = a.bottom === 'baggy' ? 6 : a.bottom === 'pants' ? 3 : a.bottom === 'tights' ? -1 : 1;
      const end = a.bottom === 'tights' ? 244 : 248;
      return `<path d="M${66 - w} 198 L${134 + w} 198 L${130 + w} ${end} L${104 - w * 0.2} ${end} L100 216 L${96 + w * 0.2} ${end} L${70 - w} ${end} Z" fill="${c}" stroke="${cd}" stroke-width="2"/>${a.bottom === 'pants' || a.bottom === 'baggy' ? `<path d="M${74 - w} 222 L${92} 222 M108 222 L${126 + w} 222" stroke="${cd}" stroke-width="2"/>` : ''}`;
    }
    const len = a.bottom === 'bibs' || a.bottom === 'trisuit' ? 230 : 226;
    return `<path d="M68 198 L132 198 L132 ${len} L104 ${len} L100 214 L96 ${len} L68 ${len} Z" fill="${c}" stroke="${cd}" stroke-width="2"/>${a.bottom === 'bibs' ? `<rect x="68" y="${len - 5}" width="28" height="5" fill="${a.topColor}" opacity=".9"/><rect x="104" y="${len - 5}" width="28" height="5" fill="${a.topColor}" opacity=".9"/>` : ''}`;
  }
  function legs(a) {
    const sk = a.skin, sk2 = shade(sk, -0.25);
    const sock = a.socks, sh = a.shoes, shd = shade(sh, -0.35);
    let s = `<rect x="75" y="214" width="18" height="38" rx="7" fill="${sk}" stroke="${sk2}" stroke-width="1.6"/><rect x="107" y="214" width="18" height="38" rx="7" fill="${sk}" stroke="${sk2}" stroke-width="1.6"/>`;
    s += `<rect x="75" y="234" width="18" height="16" rx="3" fill="${sock}" stroke="${shade(sock, -0.25)}" stroke-width="1.4"/><rect x="107" y="234" width="18" height="16" rx="3" fill="${sock}" stroke="${shade(sock, -0.25)}" stroke-width="1.4"/>`;
    s += `<path d="M66 252 Q66 244 78 244 L92 244 Q98 244 98 252 L98 258 Q82 262 66 258 Z" fill="${sh}" stroke="${shd}" stroke-width="2"/><path d="M102 252 Q102 244 108 244 L122 244 Q134 244 134 252 L134 258 Q118 262 102 258 Z" fill="${sh}" stroke="${shd}" stroke-width="2"/>`;
    s += `<path d="M70 250 L94 250 M106 250 L130 250" stroke="#fff" stroke-width="2" opacity=".5"/>`;
    return s;
  }
  function extrasFront(a) {
    let s = '';
    if (a.extras.includes('kneepads')) s += `<rect x="73" y="232" width="22" height="13" rx="5" fill="#15161a" stroke="#000" stroke-width="1"/><rect x="105" y="232" width="22" height="13" rx="5" fill="#15161a" stroke="#000" stroke-width="1"/><path d="M77 236 h14 M109 236 h14" stroke="${a.topColor}" stroke-width="2"/>`;
    if (a.extras.includes('mud')) s += `<g fill="#6b4a2b" opacity=".85">${[[80, 244, 3], [88, 250, 2.4], [112, 247, 3.2], [120, 240, 2], [72, 254, 3.6], [126, 255, 3], [96, 254, 2], [108, 230, 2.2], [84, 226, 2.6], [70, 205, 2.4], [128, 212, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
    if (a.extras.includes('bib')) s += `<rect x="84" y="160" width="32" height="24" rx="3" fill="#fff" stroke="#c9ced8" stroke-width="1.4"/><text x="100" y="178" text-anchor="middle" font-family="'Bricolage', sans-serif" font-weight="900" font-size="15" fill="#15161a">${a.number}</text><circle cx="87" cy="163" r="1.4" fill="#9aa1b2"/><circle cx="113" cy="163" r="1.4" fill="#9aa1b2"/>`;
    return s;
  }
  function propBack(a) {
    return '';
  }

  function svg(input, opts) {
    const a = clean(input);
    opts = opts || {};
    const id = 'cav' + (++uidN);
    const sk = a.skin, sk2 = shade(sk, -0.22);
    const longSleeve = a.top === 'jacket' || a.top === 'hoodie' || a.top === 'longsleeve' ? 46 : a.top === 'tank' || a.top === 'singlet' ? 0 : 16;
    const sleeveCol = longSleeve ? a.topColor : null;
    const glove = a.extras.includes('gloves') ? (a.sport === 'Shop' ? '#3b5bdb' : '#15161a') : null;
    const vb = opts.head ? '40 18 120 120' : '0 0 200 270';
    let s = `<svg class="cav${opts.cls ? ' ' + opts.cls : ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label ? String(opts.label).replace(/[<>&"]/g, '') : 'Athlete avatar'}">`;
    s += `<defs><radialGradient id="${id}hg" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></radialGradient></defs>`;
    if (!opts.head) {
      s += `<ellipse class="av-shadow" cx="100" cy="262" rx="46" ry="6" fill="#000" opacity=".18"/>`;
      s += `<g class="av-body">` + propBack(a) + hairBack(a);
      s += legs(a) + bottoms(a) + torso(a, id) + extrasFront(a);
      s += arm('L', a, null, sleeveCol, longSleeve, glove) + arm('R', a, null, sleeveCol, longSleeve, glove);
      s += `<rect x="91" y="126" width="18" height="14" rx="5" fill="${sk2}"/>`;
    } else {
      s += `<g class="av-body">`;
      s += `<path d="M58 160 Q60 136 80 134 L120 134 Q140 136 142 160 Z" fill="${a.topColor}"/><rect x="91" y="124" width="18" height="16" rx="5" fill="${sk2}"/>`;
    }
    // head group (bobs separately)
    s += `<g class="av-head">` + (opts.head ? hairBack(a) : '');
    s += `<circle cx="52" cy="96" r="9" fill="${sk}" stroke="${sk2}" stroke-width="1.6"/><circle cx="148" cy="96" r="9" fill="${sk}" stroke="${sk2}" stroke-width="1.6"/>`;
    s += `<circle cx="100" cy="86" r="50" fill="${sk}" stroke="${sk2}" stroke-width="2"/><circle cx="100" cy="86" r="50" fill="url(#${id}hg)"/>`;
    s += facialHair(a) + face(a);
    const hides = ['road', 'aero', 'mtbhelmet', 'beanie'].includes(a.head);
    if (!hides) s += hairFront(a);
    s += eyewear(a, id) + headwear(a, id);
    s += `</g></g></svg>`;
    return s;
  }
  function head(cfg, px, label) {
    return `<span class="avh" style="width:${px}px;height:${px}px">${svg(cfg, { head: true, label })}</span>`;
  }

  window.CD_AVATAR = { svg, head, kit, random, clean, KITS, SPORT_LABEL, SKIN, HAIR, KIT, LENS: Object.keys(LENS), LENS_COLORS: LENS, PATTERNS, HAIRS, FACES, FACIAL, POSES, LABEL };
})();
