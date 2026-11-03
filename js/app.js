/* =========================================================================
   COOLDOWN — app
   Vanilla JS, no build step. Seed data is rebuilt on every load
   (js/data.js); anything a visitor does (likes, follows, posts, goals,
   races, profile) is saved in their browser under one localStorage key.

   Pages scroll vertically like an Apple product page:
   - the home hero is "scrubbed" by scroll (athlete montage, a falling
     drop, COOLDOWN spinning 360; drag the word to spin it again)
   - sections reveal, numbers count up and bars grow as they enter view,
     and run back to zero when you scroll back up
   - a few galleries swipe sideways inside their own lane
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- utils */
  const BRAND = 'COOLDOWN';
  const STORE_KEY = 'cooldown:v1';
  const SEEN_KEY = 'cooldown:seen';
  const HOUR = 36e5, DAY = 864e5;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const fmtK = (n) => {
    n = Math.round(n);
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e4) return Math.round(n / 1e3) + 'K';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  };
  const fmtLikes = (n) => n < 10000 ? Math.round(n).toLocaleString('en-US') : fmtK(n);
  const fmtNum = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const fmtDate = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const ago = (t) => {
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    if (s < 86400 * 30) return Math.floor(s / 86400) + 'd';
    return fmtDate(t);
  };
  const daysTo = (t) => Math.max(0, Math.ceil((t - Date.now()) / DAY));
  const safeUrl = (u) => {
    if (!u) return '';
    try { const x = new URL(String(u).trim()); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; } catch (e) { return ''; }
  };
  const safeImg = (u) => (typeof u === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u)) ? u : '';
  const cleanHandle = (h) => String(h || '').trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
  const isEmail = (e) => /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(String(e || '').trim());
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------------------------------------------------------- state */
  const seed = window.KR_SEED(Date.now());
  const art = window.KR_ART;
  const BIKE = window.KR_BIKE;
  const SPORTS = seed.SPORTS;
  // every demo athlete gets an avatar (hand-made ones in data.js, the rest generated from their id)
  const AV = window.CD_AVATAR || null;
  if (AV) seed.athletes.forEach((a) => { a.avatar = AV.clean(a.avatar || AV.random(a.sport, a.id)); });
  // 3D avatars (js/avatar3d.js) when the browser can draw them, the flat 2D ones otherwise
  const A3 = () => (window.CD_AVATAR3D && window.CD_AVATAR3D.ok ? window.CD_AVATAR3D : null);
  function headPic(cfg, px, label) {
    const a3 = A3(), u = a3 ? a3.headURL(cfg, px) : '';
    return u ? `<img class="av3d" src="${u}" alt="${esc(label || '')}">` : AV.svg(cfg, { head: true, label });
  }
  const avatarHead = (cfg, px) => (AV && cfg ? `<span class="avh" style="width:${px}px;height:${px}px">${headPic(cfg, px)}</span>` : '');
  // a full-body figure; wireStages() turns it into a live 3D one you can spin
  const stageInner = (cfg, label) => AV.svg(cfg, { label });
  const stageAttr = (cfg) => `data-av-cfg="${esc(JSON.stringify(AV.clean(cfg)))}"`;
  // everyone starts with this: a blue, gender-neutral rider
  const DEFAULT_AV = { sport: 'Road', skin: '#d29a6c', hair: 'short', hairColor: '#3b2416', face: 'smile', facial: 'none', head: 'road', headColor: '#2e6ff2', eyes: 'wrap', lens: 'ocean', top: 'jersey', topColor: '#2e6ff2', topColor2: '#7fc8ff', pattern: 'solid', bottom: 'bibs', bottomColor: '#15161a', shoes: '#f4f5f7', socks: '#f4f5f7', extras: [], prop: 'none', pose: 'thumbs' };
  const teams = () => (seed.teams || []).concat(Array.isArray(U.teams) ? U.teams : []);
  const team = (id) => teams().find((t) => t.id === id);
  const teamIdOf = (a) => (a ? (a.isMe ? U.me.team : a.team) : '');
  const teamMembers = (t) => athletes().filter((a) => teamIdOf(a) === t.id);
  const discOf = (a) => (Array.isArray(a.disciplines) && a.disciplines.length ? a.disciplines : [a.sport]).filter((d) => SPORTS.includes(d));
  const safeArt = (u) => (typeof u === 'string' && /^https:\/\/is\d+-ssl\.mzstatic\.com\/[\w./%-]+$/.test(u) ? u : '');
  // songs are stored as {t, a, art, kind}; older saves used [title, artist]
  const normSong = (x) => (Array.isArray(x) ? { t: x[0], a: x[1] || '', art: '', kind: 'song' } : x && x.t ? { t: String(x.t), a: String(x.a || ''), art: safeArt(x.art), kind: x.kind === 'album' ? 'album' : 'song' } : null);

  function defaultUser() {
    return {
      v: 1,
      me: { id: 'me', name: '', handle: '', sport: 'Road', city: '', bio: '', hue: 95, photo: '', socials: {}, openToSponsors: true, pitch: '', contact: '', role: 'rider', shop: '', specialties: [], disciplines: [], team: '', avatar: null, songs: [], topRaces: [], results: [], pinned: [], sponsors: [] },
      goals: [], rigs: [], posts: [], races: [], joined: [], teams: [], likes: {}, follows: [], comments: {}, shortlist: [], compare: [], activity: []
    };
  }
  function loadUser() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.v === 1) {
          const out = Object.assign(defaultUser(), u, { me: Object.assign(defaultUser().me, u.me || {}) });
          if (!seed.SPORTS.includes(out.me.sport)) out.me.sport = 'Road';
          if (!['rider', 'mechanic', 'both'].includes(out.me.role)) out.me.role = 'rider';
          return out;
        }
      }
    } catch (e) { /* private mode or corrupt data: start fresh */ }
    return defaultUser();
  }
  let U = loadUser();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(U)); return true; }
    catch (e) { toast('Browser storage is full. Try a smaller photo.'); return false; }
  }

  const ui = {
    lbMode: 'traction', mlMode: 'week', mlSport: 'All', part: 'overview', colorway: 0, sportPick: 'Road', cmpA: null, cmpB: null,
    rigSport: 'All', rigType: 'All', rigSort: 'top', rigFollowing: false,
    athSport: 'All', athSort: 'traction', athOpen: false, athFollowing: false, athQ: '',
    scSport: 'All', scOpen: true, scMin: 0, scShort: false, scSort: 'traction', scDir: -1,
    jFilter: 'all', composeTab: 'rig', pendingScroll: null
  };

  /* -------------------------------------------------------- derived data */
  const claimed = () => !!(U.me.name && U.me.handle);
  function meAthlete() {
    const m = U.me;
    return {
      id: 'me', isMe: true, name: m.name || 'You', handle: m.handle || 'you', sport: m.sport, city: m.city, bio: m.bio, hue: m.hue,
      photo: safeImg(m.photo), followers: 0, engagement: 0, growth: [0, 0], openToSponsors: !!m.openToSponsors,
      sponsors: Array.isArray(m.sponsors) ? m.sponsors : [], pitch: m.pitch, contact: m.contact, socials: m.socials || {}, goals: U.goals,
      avatar: AV ? AV.clean(m.avatar || DEFAULT_AV) : null, disciplines: Array.isArray(m.disciplines) && m.disciplines.length ? m.disciplines : [m.sport], team: m.team || '', role: ['rider', 'mechanic', 'both'].includes(m.role) ? m.role : 'rider',
      mech: m.role === 'mechanic' || m.role === 'both' ? { shop: m.shop || '', specialties: Array.isArray(m.specialties) ? m.specialties : [] } : null,
      songs: Array.isArray(m.songs) ? m.songs : [], topRaces: Array.isArray(m.topRaces) ? m.topRaces : [],
      results: Array.isArray(m.results) ? m.results : [], pinned: (Array.isArray(m.pinned) ? m.pinned : []).filter((x) => safeImg(x.src))
    };
  }
  const athletes = () => claimed() ? seed.athletes.concat([meAthlete()]) : seed.athletes.slice();
  const athlete = (id) => id === 'me' ? meAthlete() : seed.athletes.find((a) => a.id === id);
  const isFollowing = (id) => U.follows.includes(id);
  const followers = (a) => a.followers + (a.isMe ? 0 : (isFollowing(a.id) ? 1 : 0));
  const withLikes = (x) => Object.assign({}, x, { likes: (x.likes || 0) + (U.likes[x.id] ? 1 : 0), liked: !!U.likes[x.id] });
  const rigs = () => seed.rigs.concat(U.rigs).map(withLikes);
  const rig = (id) => rigs().find((r) => r.id === id);
  const posts = () => seed.posts.concat(U.posts).map(withLikes);
  const post = (id) => posts().find((p) => p.id === id);
  const races = () => seed.races.concat(U.races).filter((r) => r.date > Date.now() - DAY).sort((a, b) => a.date - b.date);
  const race = (id) => seed.races.concat(U.races).find((r) => r.id === id);
  const going = (r) => r.athletes.concat(U.joined.includes(r.id) && claimed() ? ['me'] : []).filter((id, i, arr) => arr.indexOf(id) === i);
  const raceSize = (r) => r.interested + going(r).length * 120;
  const commentsOf = (id) => (seed.comments[id] || []).concat(U.comments[id] || []);
  const activity = () => U.activity.concat(seed.activity).sort((a, b) => b.at - a.at);
  const rigsBy = (id) => rigs().filter((r) => r.athleteId === id);
  const postsBy = (id) => posts().filter((p) => p.athleteId === id);
  const racesBy = (id) => races().filter((r) => going(r).includes(id));
  const rigLikes = (id) => rigsBy(id).reduce((s, r) => s + r.likes, 0);
  const growthPct = (a) => { const g = a.growth || []; return g.length > 1 && g[0] > 0 ? ((g[g.length - 1] - g[0]) / g[0]) * 100 : 0; };

  /** Traction (0–100). Log scales keep big accounts from drowning out small, engaged ones. */
  function traction(a) {
    const s = Math.log10(followers(a) + 1) * 9 + Math.min(a.engagement * 2.2, 22) + Math.log10(rigLikes(a.id) + 1) * 4 + clamp(growthPct(a), -20, 50) * 0.25;
    return clamp(Math.round(s), 0, 100);
  }
  const rankOf = (id) => athletes().map((a) => [a.id, traction(a)]).sort((x, y) => y[1] - x[1]).findIndex((x) => x[0] === id) + 1;
  const hotScore = (r) => r.likes / Math.pow((Date.now() - r.createdAt) / HOUR + 2, 0.8);
  function goalPct(g) {
    const span = g.lowerIsBetter ? (g.start - g.target) : (g.target - g.start);
    if (!span) return g.current === g.target ? 1 : 0;
    const done = g.lowerIsBetter ? (g.start - g.current) : (g.current - g.start);
    return clamp(done / span, 0, 1);
  }
  function fmtGoal(g, v) {
    v = Number(v);
    if (g.unit === 'place') return '#' + Math.round(v);
    if (g.unit === 'min') { const h = Math.floor(v / 60), m = Math.round(v % 60); return h ? `${h}:${String(m).padStart(2, '0')}` : `${m} min`; }
    if (g.unit === '%') return fmtNum(v) + '%';
    return fmtNum(v) + (g.unit ? ' ' + g.unit : '');
  }
  const nextGoal = (a) => (a.goals || []).filter((g) => goalPct(g) < 1).sort((x, y) => x.due - y.due)[0] || (a.goals || [])[0];
  const allGoals = () => athletes().flatMap((a) => (a.goals || []).map((g) => Object.assign({ who: a.id }, g)));

  /* ---------------------------------------------------------- fragments */
  const initials = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  function av(a, size, cls) {
    if (!a.photo && a.avatar && AV) return `<span class="av has-cav ${cls || ''}" style="--s:${size || 36}px;--h:${Number(a.hue) || 140}">${headPic(a.avatar, size || 36, a.name)}</span>`;
    const img = a.photo ? `<img src="${a.photo}" alt="">` : esc(initials(a.name));
    return `<span class="av ${cls || ''}" style="--s:${size || 36}px;--h:${Number(a.hue) || 140}">${img}</span>`;
  }
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.8 6.4 4.5c2-.2 3.6.9 4.6 2.5 1-1.6 2.6-2.7 4.6-2.5 3.4.3 5.2 3.7 3.6 6.9C19 15.6 12 20 12 20z"/></svg>';
  const likeBtn = (x) => `<button type="button" class="like-btn ${x.liked ? 'on' : ''}" data-like="${esc(x.id)}" aria-pressed="${x.liked}" aria-label="Like">${heart}<span>${fmtLikes(x.likes)}</span></button>`;
  function followBtn(a) {
    if (a.isMe) return '<button type="button" class="follow-btn me" tabindex="-1" aria-hidden="true">You</button>';
    const on = isFollowing(a.id);
    return `<button type="button" class="follow-btn ${on ? 'on' : ''}" data-follow="${esc(a.id)}" aria-pressed="${on}">${on ? 'Following' : 'Follow'}</button>`;
  }
  function rigArt(r, key) {
    const p = safeImg(r.photo);
    return p ? `<img src="${p}" alt="${esc(r.title)}" loading="lazy">` : art(r.art, r.hue, (key || '') + r.id);
  }
  function serifLast(t) {
    const w = String(t).trim().split(/\s+/);
    if (w.length < 2) return esc(t);
    const last = w.pop();
    return esc(w.concat([last]).join(' '));
  }
  function spark(arr, w, h, stroke) {
    w = w || 84; h = h || 28;
    if (!arr || arr.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}"></svg>`;
    const mn = Math.min(...arr), mx = Math.max(...arr), rg = mx - mn || 1;
    const pts = arr.map((v, i) => [(i / (arr.length - 1)) * (w - 6) + 3, h - 4 - ((v - mn) / rg) * (h - 8)]);
    const d = pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
    const last = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${d}" fill="none" stroke="${stroke || '#00C46A'}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3" fill="${stroke || '#00C46A'}"/></svg>`;
  }
  function ring(pct, size) {
    const r = (size - 10) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="bgc" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="fg" stroke="#7FB5FF" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" data-off="${(c * (1 - pct)).toFixed(1)}"/></svg>`;
  }
  function cdInner(t) {
    let s = Math.max(0, Math.floor((t - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const p = (n) => String(n).padStart(2, '0');
    return `<span><b>${d}</b><small>DAYS</small></span><span><b>${p(h)}</b><small>HRS</small></span><span><b>${p(m)}</b><small>MIN</small></span><span><b>${p(s)}</b><small>SEC</small></span>`;
  }
  const countdown = (t) => `<div class="cd" data-cd="${t}" aria-label="Countdown">${cdInner(t)}</div>`;
  const chev = (dir) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
  const xIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const starIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/></svg>';
  const cmpIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M17 4v16M3 8h8M13 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
  const SOCIALS = [
    ['strava', 'Strava', '#FC4C02', (v) => safeUrl(v)],
    ['instagram', 'Instagram', '#E1306C', (v) => v ? 'https://www.instagram.com/' + encodeURIComponent(cleanHandle(v)) + '/' : ''],
    ['spotify', 'Spotify', '#1DB954', (v) => safeUrl(v)],
    ['youtube', 'YouTube', '#FF0000', (v) => safeUrl(v)],
    ['tiktok', 'TikTok', '#ffffff', (v) => v ? 'https://www.tiktok.com/@' + encodeURIComponent(cleanHandle(v)) : ''],
    ['website', 'Website', '#2E7BFF', (v) => safeUrl(v)]
  ];
  function socialLinks(a) {
    const s = a.socials || {};
    const out = SOCIALS.map(([k, label, color, fn]) => { const href = fn(s[k]); return href ? `<a class="social" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><i style="background:${color}"></i>${label}</a>` : ''; }).join('');
    return out || (a.isMe ? '<span class="muted">Add your Strava, Instagram and Spotify in Edit profile.</span>' : '');
  }
  const sportChips = (key) => ['All'].concat(SPORTS).map((s) => `<button type="button" class="chip ${ui[key] === s ? 'on' : ''}" data-set="${key}" data-val="${s}">${s}</button>`).join('');
  const segBtns = (key, opts) => opts.map(([k, l]) => `<button type="button" data-set="${key}" data-val="${k}" class="${ui[key] === k ? 'on' : ''}">${l}</button>`).join('');
  const rail = (id, inner) => `<div class="rail-wrap"><div class="rail" id="${id}" tabindex="0">${inner}</div><div class="rail-ctrl"><button type="button" class="icon-btn" data-rail="${id}" data-dir="-1" aria-label="Previous">${chev(-1)}</button><button type="button" class="icon-btn" data-rail="${id}" data-dir="1" aria-label="Next">${chev(1)}</button></div></div>`;

  const SPORT_INFO = {
    Road: { icon: '🚴', art: 'road', hue: 140, copy: 'Climbs, crits and time trials. Builds, bars and every last gram.' },
    Gravel: { icon: '🌄', art: 'gravel', hue: 200, copy: 'Dirt roads, bikepacking and the long way home.' },
    MTB: { icon: '🚵', art: 'mtb', hue: 160, copy: 'Enduro, downhill and trail. Suspension setups and race runs.' },
    Track: { icon: '🏟️', art: 'track', hue: 330, copy: 'Sprints, pursuits and the boards. Gear ratios and standing starts.' },
    Cyclocross: { icon: '🌧️', art: 'gravel', hue: 28, copy: 'Mud, barriers, tire pressure and cowbells.' },
    BMX: { icon: '🤸', art: 'bmx', hue: 215, copy: 'Park, street and race. Pegs, edits and new tricks.' },
    Fixed: { icon: '⚙️', art: 'track', hue: 95, copy: 'Fixed crits, alleycats and night laps. No brakes, no problem.' }
  };
  const ROLE_LABEL = { rider: 'Rider', mechanic: 'Mechanic', both: 'Rider + Mechanic' };
  const isMech = (a) => a && (a.role === 'mechanic' || a.role === 'both');


  /* ------------------------------------------------------------- reveal */
  let io = null;
  function countFmt(kind, v) {
    if (kind === 'k') return fmtK(v);
    if (kind === 'pct') return v.toFixed(1) + '%';
    if (kind === 'plus') return '+' + Math.round(v) + '%';
    if (kind === 'time') { const h = Math.floor(v / 60), m = Math.round(v % 60); return h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`; }
    return Math.round(v).toLocaleString('en-US');
  }
  function countUp(el) {
    const end = Number(el.dataset.count), kind = el.dataset.fmt || 'int';
    if (!isFinite(end)) return;
    if (reduceMotion || end === 0) { el.textContent = countFmt(kind, end); return; }
    const t0 = performance.now(), dur = Number(el.dataset.dur) || 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = countFmt(kind, end * e); if (k < 1) requestAnimationFrame(step); else el.textContent = countFmt(kind, end); };
    requestAnimationFrame(step);
  }
  /* Metrics follow the scroll both ways: numbers count up, bars grow and
     rings fill as they move up the screen, and go back to zero as you
     scroll back up past them. Reveals (.rv) also fade back out below the fold. */
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  function setMetric(el, e) {
    if (el.dataset.count != null) { const end = Number(el.dataset.count); if (isFinite(end)) el.textContent = countFmt(el.dataset.fmt || 'int', end * e); }
    if (el.dataset.bar != null) el.style.width = (Number(el.dataset.bar) * e).toFixed(2) + '%';
    if (el.dataset.off != null) { const c = Number(el.getAttribute('stroke-dasharray')), off = Number(el.dataset.off); el.style.strokeDashoffset = (c - (c - off) * e).toFixed(1); }
  }
  function activate(el) {
    el.classList.add('in');
    if (el.dataset.count != null && !reduceMotion) countUp(el);
    else setMetric(el, 1);
  }
  const tracked = new Set();
  function metricScrub() {
    if (!tracked.size) return;
    const vh = window.innerHeight;
    tracked.forEach((el) => {
      if (!el.isConnected) { tracked.delete(el); return; }
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      if (el.classList.contains('rv') || el.classList.contains('rv-scale')) {
        if (r.top < vh * 0.9) el.classList.add('in');
        else if (r.top > vh * 1.02) el.classList.remove('in');
      }
      if (el.dataset.count != null || el.dataset.bar != null || el.dataset.off != null) {
        const k = clamp((vh * 1.0 - r.top) / (vh * 0.28), 0, 1);
        const e = k > 0.995 ? 1 : easeOut(k);
        if (el._e !== e) { el._e = e; setMetric(el, e); }
      }
    });
  }
  // reveals slide while they fade, so keep measuring briefly after scrolling stops
  let settleEnd = 0, settleRaf = 0;
  function settleMetrics() {
    settleEnd = performance.now() + 1000;
    if (settleRaf) return;
    const loop = (t) => { metricScrub(); settleRaf = t < settleEnd ? requestAnimationFrame(loop) : 0; };
    settleRaf = requestAnimationFrame(loop);
  }
  function enhance(root) {
    const els = $$('.rv,.rv-scale,[data-count],[data-bar],.ring .fg', root).filter((el) => !el.dataset.manual);
    if (reduceMotion) { els.forEach((el) => { el.classList.add('in'); setMetric(el, 1); }); return; }
    const inLayer = root.closest && root.closest('#layer');
    if (inLayer || !('IntersectionObserver' in window)) {
      // pop-ups don't scroll with the page, so they animate once when opened
      if (!('IntersectionObserver' in window)) { els.forEach((el) => { el.classList.add('in'); setMetric(el, 1); }); return; }
      if (!io) io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      els.forEach((el) => io.observe(el));
      return;
    }
    els.forEach((el) => { el.classList.add('scrubbed'); tracked.add(el); });
    settleMetrics();
  }

  /* ------------------------------------------------------- scroll engine */
  const scrubs = [];
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; scrubs.forEach((f) => f()); metricScrub(); settleMetrics(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  const navH = () => ($('#gnav') ? $('#gnav').offsetHeight : 52);
  function jumpTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function instantScroll(y) {
    const h = document.documentElement, prev = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    h.style.scrollBehavior = prev;
  }

  /* -------------------------------------------------------------- rails */
  function railUpdate(r) {
    const max = r.scrollWidth - r.clientWidth - 2;
    $$(`[data-rail="${r.id}"]`).forEach((b) => { b.disabled = (b.dataset.dir === '-1' && r.scrollLeft <= 2) || (b.dataset.dir === '1' && r.scrollLeft >= max); });
  }
  function wireRails(root) {
    $$('.rail', root).forEach((r) => {
      if (r.dataset.wired) return;
      r.dataset.wired = '1';
      r.addEventListener('scroll', debounce(() => railUpdate(r), 60), { passive: true });
      requestAnimationFrame(() => railUpdate(r));
      if (!finePointer) return;
      let down = null, moved = false;
      r.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = { x: e.clientX, s: r.scrollLeft }; moved = false; });
      r.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - down.x;
        if (!moved && Math.abs(dx) > 6) { moved = true; r.classList.add('dragging'); }
        if (moved) r.scrollLeft = down.s - dx;
      });
      const end = () => {
        if (!down) return;
        down = null;
        if (moved) { r.classList.remove('dragging'); r.dataset.justDragged = '1'; setTimeout(() => { delete r.dataset.justDragged; }, 60); railUpdate(r); }
      };
      r.addEventListener('pointerup', end);
      r.addEventListener('pointerleave', end);
      r.addEventListener('click', (e) => { if (r.dataset.justDragged) { e.stopPropagation(); e.preventDefault(); } }, true);
    });
  }

  /* ------------------------------------------------------------- router */
  const NAV_OF = { home: 'home', rigs: 'rigs', athletes: 'athletes', athlete: 'athletes', team: 'athletes', scout: 'scout', journal: 'journal', article: 'journal' };
  const main = $('#main');
  let curView = null, curArg = null, curHash = '#/';

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    let a = '', b = '';
    try { a = decodeURIComponent(parts[0] || ''); b = decodeURIComponent(parts[1] || ''); } catch (e) { /* bad URL encoding */ }
    if (a === 'rig' && b) { if (!curView) render('home'); if (rig(b)) openRig(b); return; }
    if (a === 'race' && b) { if (!curView) render('home'); if (race(b)) openRace(b); return; }
    if (a === 'athlete' && b) {
      if (b === 'me' && !claimed()) { if (!curView) render('home'); openEditor(); return; }
      return athlete(b) ? render('athlete', b) : render('athletes');
    }
    if (a === 'journal' && b) return post(b) ? render('article', b) : render('journal');
    if (a === 'team' && b) return team(b) ? render('team', b) : render('athletes');
    const v = { '': 'home', home: 'home', board: 'home', rigs: 'rigs', athletes: 'athletes', scout: 'scout', journal: 'journal' }[a];
    render(v || 'home');
  }
  function go(hash) {
    const cur = location.hash || '#/';
    if (cur === hash || (hash === '#/' && (cur === '#' || cur === '#/'))) route();
    else location.hash = hash;
  }

  function render(view, arg, opts) {
    opts = opts || {};
    closeAll();
    const y = window.scrollY;
    curView = view; curArg = arg || null;
    scrubs.length = 0;
    if (io) { io.disconnect(); io = null; }
    tracked.clear();
    main.innerHTML = VIEWS[view](arg) + footer();
    curHash = view === 'home' ? '#/' : view === 'athlete' ? '#/athlete/' + encodeURIComponent(arg) : view === 'article' ? '#/journal/' + encodeURIComponent(arg) : view === 'team' ? '#/team/' + encodeURIComponent(arg) : '#/' + view;
    document.title = BRAND; // the tab is just the drop and COOLDOWN
    $$('[data-view]').forEach((l) => { const on = l.dataset.view === NAV_OF[view]; l.classList.toggle('on', on); if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
    if (view === 'athlete' && arg === 'me') $$('.tabbar [data-view], .gnav-links [data-view]').forEach((l) => { l.classList.remove('on'); l.removeAttribute('aria-current'); });
    paintMe();
    if (AFTER[view]) AFTER[view](arg);
    enhance(main);
    wireStages(main);
    wireRails(main);
    if (opts.keepScroll) instantScroll(y);
    else if (ui.pendingScroll) {
      const id = ui.pendingScroll; ui.pendingScroll = null;
      instantScroll(0);
      const el = document.getElementById(id);
      if (el) instantScroll(el.getBoundingClientRect().top + window.scrollY - navH());
    } else instantScroll(0);
    onScroll();
  }
  const rerender = () => render(curView, curArg, { keepScroll: true });

  function footer() {
    return `<footer class="foot"><div class="wrap foot-in">
      <a class="logo" href="#/" aria-label="${BRAND} home">${logoHTML()}</a>
      <nav aria-label="Footer"><a href="#/rigs">Rigs</a><a href="#/athletes">Athletes</a><a href="#/scout">Scout</a><a href="#/journal">Journal</a><button type="button" data-act="about">About</button></nav>
      <p>Early demo. The athletes, races and brands shown here are fictional. Everything you post stays in your browser for now. © 2026 ${BRAND}.</p>
    </div></footer>`;
  }

  /* --------------------------------------------------------------- HOME */
  const LNAV = [['s-viewer', 'Bike of the week'], ['s-liked', 'Most liked'], ['s-station', 'Station of the week'], ['s-lb', 'Leaderboard'], ['s-goals', 'Goals'], ['s-races', 'Races'], ['s-brands', 'For brands'], ['s-start', 'Get started']];
  const PARTS = [
    { id: 'overview', label: 'Overview', z: [140, 97, 1] },
    { id: 'frame', label: 'Frame', z: [150, 92, 1.55], spot: [152, 88], re: /frame/i },
    { id: 'wheels', label: 'Wheels', z: [141, 122, 1.25], spot: [204, 150], re: /wheel|tire|tyre/i },
    { id: 'drive', label: 'Drivetrain', z: [128, 122, 2.3], spot: [134, 124], re: /drive|group|gear|cassette|crank|chain/i },
    { id: 'cockpit', label: 'Cockpit', z: [196, 62, 2.3], spot: [200, 58], re: /bar|cockpit|stem|saddle|pedal/i }
  ];
  const PART_COPY = { frame: 'The backbone. Geometry, material and size decide how it rides.', wheels: 'Where speed is won. Rims, hubs and rubber, all in one spin.', drive: 'Every watt goes through here. Gearing tells you what it was built for.', cockpit: 'Where the rider meets the machine. Bars, stem and contact points.' };
  const COLORWAYS = [{ name: 'Stealth', hex: '#1d1d1f' }, { name: 'Volt', hex: '#00C46A' }, { name: 'Ice', hex: '#1BB8E8' }, { name: 'Flare', hex: '#FF5A36' }, { name: 'Ultra', hex: '#8B5CF6' }];
  const vbX = (x) => ((x - 40) / 200) * 100, vbY = (y) => ((y - 24) / 146) * 100;
  const bikeOfWeek = () => rigs().filter((r) => r.type === 'Bike' && !r.photo && ['road', 'gravel', 'track', 'tt', 'mtb', 'bags'].includes(r.art)).sort((a, b) => b.likes - a.likes)[0];
  const acc = (q, a) => `<div class="acc"><button type="button" data-acc aria-expanded="false">${esc(q)}</button><div class="acc-body"><div>${a}</div></div></div>`;
  const gcard = (icon, title, text, act, tab, cta) => `<button type="button" class="gcard rv" data-act="${act}" ${tab ? `data-tab="${tab}"` : ''}><span class="gi">${icon}</span><b>${title}</b><p>${text}</p><span class="link">${cta}</span></button>`;

  const DROP = (cls) => `<svg class="${cls}" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1.5C12 1.5 3 13.2 3 20.3a9 9 0 0 0 18 0C21 13.2 12 1.5 12 1.5Z"/><path class="sheen" d="M12 1.5C12 1.5 3 13.2 3 20.3a9 9 0 0 0 18 0C21 13.2 12 1.5 12 1.5Z"/><ellipse class="hl" cx="8.3" cy="20.6" rx="2.1" ry="3.4" transform="rotate(-18 8.3 20.6)"/></svg>`;
  const logoHTML = () => `<span class="logo-word">${[...BRAND].map((c, i) => `<i style="--i:${i}">${c}</i>`).join('')}</span>${DROP('logo-drop')}`;
  const CD3D_DEPTH = 14;
  function cd3dLayers() {
    let h = `<span class="cd3d-l front" style="--z:0">${BRAND}</span>`;
    for (let z = 1; z <= CD3D_DEPTH; z++) h += `<span class="cd3d-l${z === CD3D_DEPTH ? ' back' : ''}" style="--z:${z}" aria-hidden="true">${BRAND}</span>`;
    return h;
  }

  function viewHome() {
    const b = bikeOfWeek();
    const ba = b ? athlete(b.athleteId) : null;
    return `
    <section class="hero" id="hero" aria-label="Intro">
      <div class="hero-stick" id="heroStick">
        <div class="hero-media" aria-hidden="true">
          <div class="hero-reel" id="heroReel"><video class="hero-video on" poster="assets/video/poster.jpg" muted playsinline preload="auto"></video><video class="hero-video" muted playsinline preload="auto"></video></div>
          <div class="hero-shade"></div>
        </div>
        <div class="hero-copy">
          <div class="hero-line" data-l="0"><div class="hero-kicker">For the <span class="kick-hl">cycling community</span></div><h1 class="h-hero">Show your gear.</h1></div>
          <div class="hero-line" data-l="1"><h2 class="h-hero">Chase your season.</h2></div>
          <div class="hero-line hero-end" data-l="2">
            <div class="hero-drop" aria-hidden="true">${DROP('drop-svg')}<i class="hero-ripple"></i><i class="hero-ripple r2"></i></div>
            <h2 class="cd3d" id="cd3d" tabindex="0" aria-label="${BRAND}"><span class="cd3d-rot" id="cd3dRot">${cd3dLayers()}</span></h2>
            <div class="cd3d-hint" aria-hidden="true">Drag to spin</div>
            <div class="hero-rest">
              <p class="lede">Your bikes, your station, your goals and races in one profile, where brands come to find riders.</p>
              <div class="hero-ctas"><button type="button" class="pill pill-pop" data-act="claimOrProfile">${claimed() ? 'View your profile' : 'Claim your profile'}</button><button type="button" class="pill pill-line on-dark" data-jump="s-liked">See what's hot</button></div>
              <div class="hero-stats"><div><b data-count="${athletes().length}" data-manual="1">0</b><span>Athletes</span></div><div><b data-count="${rigs().length}" data-manual="1">0</b><span>Rigs</span></div><div><b data-count="${races().length}" data-manual="1">0</b><span>Races</span></div></div>
            </div>
          </div>
        </div>
        <div class="scroll-cue" aria-hidden="true"><i></i>SCROLL</div>
      </div>
    </section>

    <nav class="lnav" id="lnav" aria-label="On this page"><div class="lnav-in"><span class="lnav-title">This week</span><div class="lnav-links">${LNAV.filter(([id]) => b || id !== 's-viewer').map(([id, l]) => `<button type="button" data-jump="${id}">${l}</button>`).join('')}</div><button type="button" class="pill pill-green pill-xs" data-act="compose" data-tab="rig">Post your rig</button></div></nav>

    ${b ? `<section class="sec snow" id="s-viewer"><div class="wrap">
      <div class="viewer-head rv"><div><div class="eyebrow">Bike of the week</div><h2 class="h-sec">${serifLast(b.title)}</h2><p class="lede">by <button type="button" class="link" data-open-ath="${ba.id}">${esc(ba.name)}</button> · ${esc(ba.city || '')}</p></div>
      <div style="display:flex;gap:10px;align-items:center">${likeBtn(b)}<button type="button" class="pill pill-sm" data-open-rig="${b.id}">Full build</button></div></div>
      <div class="viewer rv-scale" id="viewer" data-part="${ui.part}" style="--frame-c:${COLORWAYS[ui.colorway].hex}" data-rig="${b.id}">
        <div class="viewer-stage">
          <div class="viewer-zoom" id="vzoom">${BIKE(b.art, 'v-svg', 0.7)}</div>
          <div class="viewer-spots">${PARTS.filter((p) => p.spot).map((p) => `<button type="button" class="hotspot" style="left:${vbX(p.spot[0]).toFixed(1)}%;top:${vbY(p.spot[1]).toFixed(1)}%" data-part-go="${p.id}" aria-label="Show ${p.label}"></button>`).join('')}</div>
        </div>
        <div class="viewer-card" id="vcard" aria-live="polite"></div>
        <div class="viewer-bar">
          <div class="viewer-tabs" role="tablist" aria-label="Parts">${PARTS.map((p) => `<button type="button" role="tab" data-part-go="${p.id}" aria-selected="${ui.part === p.id}" class="${ui.part === p.id ? 'on' : ''}">${p.label}</button>`).join('')}</div>
          <div class="swatches" role="radiogroup" aria-label="Colorway">${COLORWAYS.map((c, i) => `<button type="button" role="radio" aria-checked="${i === ui.colorway}" data-colorway="${i}" class="${i === ui.colorway ? 'on' : ''}" style="background:${c.hex}" aria-label="${c.name}"></button>`).join('')}<span class="swatch-name" id="swName">${COLORWAYS[ui.colorway].name}</span></div>
        </div>
      </div>
    </div></section>` : ''}

    <section class="sec" id="s-liked">
      <div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Hall of fame</div><h2 class="h-sec">Most liked right now</h2></div><div class="seg">${segBtns('mlMode', [['week', '72 hours'], ['all', 'All time']])}</div></div>
      <div class="chips rv" style="margin:-20px 0 26px">${sportChips('mlSport')}</div></div>
      ${rail('likedRail', '')}
    </section>

    ${stationOfWeekHTML()}

    <section class="sec dark" id="s-lb"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Leaderboard</div><h2 class="h-sec">Who's moving up</h2><p class="lede">Ranked live by traction: fans, engagement, rig likes and growth in one number.</p></div><div class="seg">${segBtns('lbMode', [['traction', 'Traction'], ['followers', 'Fans'], ['rising', 'Rising']])}</div></div>
      <div class="lb" id="lbList"></div>
      <div style="margin-top:28px" class="rv"><a class="link" href="#/athletes">See every athlete</a></div>
    </div></section>

    <section class="sec" id="s-goals"><div class="wrap">
      <div class="sec-head center rv" style="justify-content:center"><div><div class="eyebrow">Season goals</div><h2 class="h-sec">What riders are chasing this season</h2></div></div>
      <div class="stats" id="goalStats"></div>
      <div class="center rv" style="margin-top:36px"><button type="button" class="pill" data-act="compose" data-tab="goal">Set your goal</button></div>
    </div></section>

    <section class="sec dark" id="s-races">
      <div class="wrap"><div class="sec-head rv"><div><div class="eyebrow live">On the calendar</div><h2 class="h-sec">Big races coming up</h2></div><button type="button" class="pill pill-pop pill-sm" data-act="compose" data-tab="race">＋ Add a race</button></div></div>
      ${rail('raceRail', '')}
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track" id="marquee"></div></div>

    <section class="sec dark" id="s-brands"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">For brands</div><h2 class="h-sec">Find riders who move people</h2><p class="lede">Line up any two athletes. See who brings the crowd, who's climbing fastest and who's racing next.</p></div><a class="pill pill-pop" href="#/scout">Open Scout</a></div>
      <div class="cmp-tiles rv" id="cmpTiles"></div>
    </div></section>

    <section class="sec snow" id="s-start"><div class="wrap">
      <div class="sec-head center rv" style="justify-content:center"><div><div class="eyebrow">Get started</div><h2 class="h-sec">Get seen by brands</h2></div></div>
      <div class="cards-6">
        ${gcard('✦', 'Claim your profile', 'Name, sport, city and a one-line bio. Thirty seconds, tops.', 'claimOrProfile', '', claimed() ? 'View profile' : 'Claim it')}
        ${gcard('📸', 'Post your rig', 'Your bike, your quiver, your bench. Add a photo and the build sheet.', 'compose', 'rig', 'Post a rig')}
        ${gcard('🎯', 'Set a season goal', 'Everest in one ride, a 300 lb pull, a sub-1:30 half. Make it public.', 'compose', 'goal', 'Set a goal')}
        ${gcard('🏁', 'Add your next race', 'Put it on the calendar and see who else is lining up.', 'compose', 'race', 'Add a race')}
        ${gcard('🔗', 'Link your accounts', 'Strava, Instagram, Spotify, YouTube and TikTok, all on one profile.', 'editProfile', '', 'Add links')}
        ${gcard('✍️', 'Write in the journal', 'Race reports, build stories, what the sport means to you.', 'compose', 'post', 'Start writing')}
      </div>
    </div></section>`;
  }

  function stationOfWeekHTML() {
    const st = rigs().filter((r) => r.type === 'Workstation').sort((a, b) => hotScore(b) - hotScore(a))[0];
    if (!st) return '';
    const who = athlete(st.athleteId) || {};
    const specs = (st.specs || []).slice(0, 4);
    return `<section class="sec snow" id="s-station"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">🔧 For mechanics</div><h2 class="h-sec">Station of the week</h2><p class="lede">Where the bikes get fixed. Mechanics show off their benches, stands and wheel walls here.</p></div><button type="button" class="pill pill-green" data-act="compose" data-tab="rig">＋ Show off your station</button></div>
      <div class="station rv" data-open-rig="${esc(st.id)}" role="button" tabindex="0">
        <div class="station-art">${rigArt(st, 'sw')}</div>
        <div class="station-info"><div class="tag">Workstation</div><h3>${esc(st.title)}</h3><p>${esc(st.caption || '')}</p>
          ${specs.length ? `<dl>${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
          <div class="station-by" data-open-ath="${esc(who.id || '')}">${who.name ? av(who, 36) : ''}<span><b>${esc(who.name || '')}</b>${isMech(who) && who.mech && who.mech.shop ? esc(who.mech.shop) : '@' + esc(who.handle || '')}</span>${likeBtn(st)}</div>
        </div>
      </div>
    </div></section>`;
  }
  function rcard(r, rank, extra) {
    const a = athlete(r.athleteId) || { name: '?', hue: 140 };
    return `<article class="rcard ${extra || ''}" data-open-rig="${r.id}" role="button" tabindex="0" aria-label="${esc(r.title)} by ${esc(a.name)}">
      <div class="art-wrap">${rigArt(r, 'c')}</div>
      <div class="over"><span class="tag">${esc(r.sport)}</span><span class="tag ${r.type === 'Workstation' ? 'dark' : ''}">${r.type === 'Workstation' ? 'Station' : r.type === 'Kit' ? 'Gear' : esc(r.type)}</span></div>
      ${rank ? `<span class="rank-badge">${rank}</span>` : ''}
      <div class="rcard-meta">${av(a, 32)}<div class="t"><b>${esc(r.title)}</b><span>${esc(a.name)} · ${ago(r.createdAt)}</span></div>${likeBtn(r)}</div>
      <div class="glare"></div>
    </article>`;
  }
  function raceCard(r, big) {
    const g = going(r), joined = U.joined.includes(r.id);
    return `<article class="race-card ${big ? 'big' : ''}" data-open-race="${r.id}" role="button" tabindex="0">
      <div class="race-top"><span class="tag ${big ? 'pop' : ''}">${esc(r.sport)}</span><span class="mono muted" style="font-size:12px">${fmtDate(r.date)}</span></div>
      <div><h4>${esc(r.name)}</h4><div class="meta">${esc(r.city)} · ${esc(r.distance)}</div></div>
      ${countdown(r.date)}
      <div class="going"><div style="display:flex;align-items:center;gap:8px;min-width:0"><div class="stack">${g.slice(0, 3).map((id) => av(athlete(id) || { name: '?', hue: 140 }, 26)).join('')}</div><span class="mono" style="font-size:12px" data-going-of="${r.id}">${fmtK(r.interested + g.length)}</span></div>
      <button type="button" class="join-btn ${joined ? 'on' : ''}" data-join="${r.id}" aria-pressed="${joined}">${joined ? "I'm in ✓" : "I'm in"}</button></div>
    </article>`;
  }
  function feedItem(x) {
    const a = athlete(x.who);
    const icon = { rig: '📸', goal: '🎯', post: '✍️', race: '🏁' }[x.type] || '✦';
    const attr = x.type === 'rig' ? `data-open-rig="${esc(x.ref)}"` : x.type === 'post' ? `data-open-post="${esc(x.ref)}"` : x.type === 'race' ? `data-open-race="${esc(x.ref)}"` : `data-open-ath="${esc(x.who)}"`;
    return `<div class="feed-item" ${attr} role="button" tabindex="0"><span class="feed-av">${av(a, 40)}<span class="ficon">${icon}</span></span><p><b>${esc(a.name)}</b> ${esc(x.what)}</p><time>${ago(x.at)}</time></div>`;
  }
  function storyCard(p, small, extra) {
    const a = athlete(p.athleteId) || { name: '?', hue: 140 };
    const ex = p.body.split(/\n/)[0].slice(0, 180);
    return `<a class="story ${extra || ''}" href="#/journal/${encodeURIComponent(p.id)}" data-open-post="${esc(p.id)}"><div class="art-wrap">${rigArt(p, small ? 'sm' : 'sb')}</div><div class="story-b"><div class="eyebrow">${esc(p.sport)} · ${ago(p.createdAt)}</div><h3>${esc(p.title)}</h3><p>${esc(ex)}</p><div class="story-by">${av(a, 24)}${esc(a.name)} · ♥ ${fmtK(p.likes)}</div></div></a>`;
  }

  function likedItems() {
    return rigs().filter((r) => (ui.mlMode === 'all' || Date.now() - r.createdAt < 72 * HOUR) && (ui.mlSport === 'All' || r.sport === ui.mlSport)).sort((a, b) => b.likes - a.likes).slice(0, 12);
  }
  function renderLiked() {
    const el = $('#likedRail'); if (!el) return;
    const items = likedItems();
    el.innerHTML = items.length ? items.map((r, i) => rcard(r, i + 1)).join('') : `<div class="empty" style="width:100%"><b>Nothing here yet</b>Try All time or another sport.</div>`;
    el.scrollLeft = 0;
    railUpdate(el);
  }
  function lbItems() {
    const list = athletes();
    if (ui.lbMode === 'followers') return list.sort((a, b) => followers(b) - followers(a));
    if (ui.lbMode === 'rising') return list.sort((a, b) => growthPct(b) - growthPct(a));
    return list.sort((a, b) => traction(b) - traction(a));
  }
  function renderLb(animate) {
    const el = $('#lbList'); if (!el) return;
    const items = lbItems().slice(0, 5);
    const val = (a) => ui.lbMode === 'followers' ? followers(a) : ui.lbMode === 'rising' ? growthPct(a) : traction(a);
    const max = Math.max(...items.map(val), 1);
    const fmt = ui.lbMode === 'followers' ? 'k' : ui.lbMode === 'rising' ? 'plus' : 'int';
    el.innerHTML = items.map((a, i) => `<div class="lb-row rv" data-open-ath="${a.id}" role="button" tabindex="0">
      <span class="lb-rank">${i + 1}</span>${av(a, 44, i === 0 ? 'ring' : '')}
      <div class="lb-main"><div class="lb-name"><b>${esc(a.name)}${a.isMe ? ' <span class="tag pop">You</span>' : ''}</b><span>${esc(a.sport)}${a.city ? ' · ' + esc(a.city) : ''}</span></div><div class="lb-track"><i data-bar="${(Math.max(val(a), 0) / max * 100).toFixed(1)}"></i></div></div>
      <span class="lb-val" data-count="${Math.max(val(a), 0).toFixed(2)}" data-fmt="${fmt}">0</span>
    </div>`).join('');
    enhance(el);
  }
  function featuredGoals() {
    const mine = U.goals.filter((g) => goalPct(g) < 1).map((g) => Object.assign({ who: 'me' }, g));
    const picks = ['g19', 'g5', 'g11'].map((id) => allGoals().find((g) => g.id === id)).filter(Boolean);
    const pool = mine.concat(picks, allGoals().filter((g) => goalPct(g) < 1).sort((a, b) => goalPct(b) - goalPct(a)));
    const out = [], seen = new Set();
    pool.forEach((g) => { if (out.length < 3 && !seen.has(g.id) && !out.some((x) => x.who === g.who)) { seen.add(g.id); out.push(g); } });
    return out;
  }
  function renderGoals() {
    const el = $('#goalStats'); if (!el) return;
    el.innerHTML = featuredGoals().map((g, i) => {
      const a = athlete(g.who) || { name: '?', hue: 140, id: '' };
      const pct = goalPct(g);
      const unit = g.unit === '%' ? '%' : (g.unit && !['place', 'min'].includes(g.unit) ? g.unit : '');
      const big = g.unit === 'place' ? `<span>#${Math.round(g.target)}</span>` : g.unit === 'min' ? `<span data-count="${g.target}" data-fmt="time">0</span>` : `<span data-count="${g.target}">0</span>${unit ? `<span class="unit">${esc(unit)}</span>` : ''}`;
      return `<div class="stat-big rv d${i + 1}"><div class="num">${big}</div>
        <p><b>${esc(g.title)}.</b> ${esc(a.name.split(' ')[0])} is at ${esc(fmtGoal(g, g.current))}, ${Math.round(pct * 100)}% of the way there.</p>
        <div class="who" data-open-ath="${a.id}" role="button" tabindex="0">${av(a, 32)}${esc(a.name)} <span class="muted">· ${daysTo(g.due)} days left</span></div>
        <div class="bar"><i data-bar="${(pct * 100).toFixed(1)}"></i></div></div>`;
    }).join('') || '<div class="empty"><b>No goals yet</b>Be the first to set one.</div>';
  }
  function renderSport(swap) {
    const s = ui.sportPick, info = SPORT_INFO[s];
    const artBox = $('#sportArt'), panel = $('#sportPanel');
    if (!artBox || !panel) return;
    const wrap = document.createElement('div');
    wrap.className = 'art-wrap' + (swap ? ' out' : '');
    wrap.innerHTML = art(info.art, info.hue, 'sp' + s);
    const old = $$('.art-wrap', artBox);
    artBox.appendChild(wrap);
    if (swap && !reduceMotion) {
      requestAnimationFrame(() => requestAnimationFrame(() => { wrap.classList.remove('out'); old.forEach((o) => o.classList.add('out')); }));
      setTimeout(() => old.forEach((o) => o.remove()), 800);
    } else { wrap.classList.remove('out'); old.forEach((o) => o.remove()); }
    const top = athletes().filter((a) => a.sport === s).sort((a, b) => traction(b) - traction(a))[0];
    const goal = allGoals().filter((g) => (athlete(g.who) || {}).sport === s && goalPct(g) < 1).sort((a, b) => a.due - b.due)[0];
    const nextRace = races().filter((r) => r.sport === s)[0];
    const n = rigs().filter((r) => r.sport === s).length;
    panel.innerHTML = `<div><h3 class="h-sub">${info.icon} ${esc(s)}</h3><p class="lede" style="font-size:19px">${esc(info.copy)}</p></div>
      ${top ? `<div class="sp-row" data-open-ath="${top.id}" role="button" tabindex="0">${av(top, 44)}<div class="t"><b>${esc(top.name)}</b><span>Top ${esc(s.toLowerCase())} athlete · traction ${traction(top)}</span></div></div>` : `<div class="sp-row" data-act="claimOrProfile" role="button" tabindex="0"><span class="sp-ico">✦</span><div class="t"><b>No one yet</b><span>Be the first ${esc(s.toLowerCase())} athlete here</span></div></div>`}
      ${goal ? `<div class="sp-row" data-open-ath="${goal.who}" role="button" tabindex="0"><span class="sp-ico">🎯</span><div class="t"><b>${esc(goal.title)}</b><span>${Math.round(goalPct(goal) * 100)}% done · ${daysTo(goal.due)} days left</span></div></div>` : ''}
      ${nextRace ? `<div class="sp-row" data-open-race="${nextRace.id}" role="button" tabindex="0"><span class="sp-ico">🏁</span><div class="t"><b>${esc(nextRace.name)}</b><span>${esc(nextRace.city)} · in ${daysTo(nextRace.date)} days</span></div></div>` : ''}
      <div><button type="button" class="pill" data-go-rigs="${esc(s)}">See ${n} ${esc(s.toLowerCase())} rig${n === 1 ? '' : 's'}</button></div>`;
  }
  function renderRaces() {
    const el = $('#raceRail'); if (!el) return;
    const list = races().slice().sort((a, b) => raceSize(b) - raceSize(a));
    el.innerHTML = list.map((r, i) => raceCard(r, i === 0)).join('') + `<button type="button" class="race-card add-card" data-act="compose" data-tab="race"><div><span class="plus">＋</span><b>Add your race</b>Put it on the calendar and see who's lining up.</div></button>`;
  }
  function renderFeed() {
    const el = $('#feedList'); if (el) el.innerHTML = activity().filter((x) => athlete(x.who)).slice(0, 7).map(feedItem).join('');
    const sb = $('#storyBox');
    if (sb) {
      const ps = posts().sort((a, b) => b.createdAt - a.createdAt);
      sb.innerHTML = ps.length ? storyCard(ps[0]) + `<div class="stories-mini">${ps.slice(1, 3).map((p) => storyCard(p, true)).join('')}</div>` : '';
    }
  }
  function renderMarquee() {
    const el = $('#marquee'); if (!el) return;
    const items = activity().slice(0, 10).map((x) => { const a = athlete(x.who); return a ? `<span>${esc(a.name)} ${esc(x.what)}</span>` : ''; }).join('');
    el.innerHTML = items + items;
  }
  const cmpCandidates = () => athletes().filter((a) => a.openToSponsors || a.isMe).sort((a, b) => traction(b) - traction(a));
  function renderCmpTiles() {
    const el = $('#cmpTiles'); if (!el) return;
    const list = cmpCandidates();
    if (list.length < 2) { el.innerHTML = ''; return; }
    if (!list.some((a) => a.id === ui.cmpA)) ui.cmpA = list[0].id;
    if (!list.some((a) => a.id === ui.cmpB) || ui.cmpB === ui.cmpA) ui.cmpB = list.find((a) => a.id !== ui.cmpA).id;
    const A = athlete(ui.cmpA), B = athlete(ui.cmpB);
    const nextR = (a) => racesBy(a.id)[0];
    const rows = [
      ['Traction', (a) => traction(a), (v) => v],
      ['Fans', (a) => followers(a), fmtK],
      ['Engagement', (a) => a.engagement, (v) => v ? v.toFixed(1) + '%' : '—'],
      ['12-week growth', (a) => growthPct(a), (v) => v ? '+' + v.toFixed(0) + '%' : '—'],
      ['Rig likes', (a) => rigLikes(a.id), fmtK],
      ['Next race', (a) => { const r = nextR(a); return r ? -daysTo(r.date) : -9999; }, (v, a) => { const r = nextR(a); return r ? `${esc(r.name)} · ${daysTo(r.date)}d` : '—'; }]
    ];
    const tile = (X, Y, key) => `<div class="cmp-tile">
      <select data-cmp-sel="${key}" aria-label="Choose athlete ${key}">${list.map((a) => `<option value="${a.id}" ${a.id === X.id ? 'selected' : ''} ${a.id === Y.id ? 'disabled' : ''}>${esc(a.name)} · ${esc(a.sport)}</option>`).join('')}</select>
      <div class="cmp-id" data-open-ath="${X.id}" role="button" tabindex="0" style="cursor:pointer">${av(X, 64)}<div><b>${esc(X.name)}</b><span>${esc(X.sport)} · ${esc(X.city || '')}</span></div></div>
      <dl class="cmp-list">${rows.map(([l, f, fm]) => { const a = f(X), b = f(Y); return `<div><dt>${l}</dt><dd class="${a > b ? 'win' : ''}">${fm(a, X)}</dd></div>`; }).join('')}</dl>
      ${X.openToSponsors && !X.isMe ? `<button type="button" class="pill pill-line on-dark pill-sm" data-act="contactAthlete" data-id="${X.id}">Contact for sponsorship</button>` : ''}
    </div>`;
    el.innerHTML = tile(A, B, 'A') + tile(B, A, 'B');
  }

  /* hero scrub: montage -> "Show your gear." -> "Chase your season." ->
     a drop falls, splashes, and COOLDOWN turns a full 360 into place. */
  const spin = { user: 0, vel: 0, drag: null, raf: 0, tilt: 0 };
  function heroScrub() {
    const h = $('#hero'), st = $('#heroStick');
    if (!h || !st) return;
    const vh = st.offsetHeight;
    const total = Math.max(1, h.offsetHeight - vh);
    const p = reduceMotion ? 1 : clamp((navH() - h.getBoundingClientRect().top) / total, 0, 1);
    const S = st.style;
    const end = clamp((p - 0.5) / 0.3, 0, 1);
    S.setProperty('--vs', lerp(1, 0.92, end).toFixed(4));
    S.setProperty('--vr', (end * 28).toFixed(1) + 'px');
    S.setProperty('--shade', lerp(0.38, 0.66, end).toFixed(3));
    S.setProperty('--cue', (1 - clamp(p / 0.06, 0, 1)).toFixed(3));
    // drop falls (0.52 -> 0.62), splashes (0.62 -> 0.72)
    const fall = clamp((p - 0.52) / 0.1, 0, 1);
    const splash = clamp((p - 0.62) / 0.1, 0, 1);
    S.setProperty('--dy', (-(1 - fall * fall) * (vh * 0.5 + 40)).toFixed(1) + 'px');
    S.setProperty('--do', (fall > 0 && fall < 1 ? Math.min(1, fall * 6) : 0).toFixed(3));
    S.setProperty('--rs', (0.2 + splash * 3.2).toFixed(3));
    S.setProperty('--ro', (splash > 0 && splash < 1 ? 1 - splash : 0).toFixed(3));
    // COOLDOWN turns 360 as it arrives (0.62 -> 0.8), then you can drag it
    const turn = clamp((p - 0.62) / 0.18, 0, 1);
    spin.scroll = (1 - easeOut(turn)) * 360;
    S.setProperty('--wo', clamp((p - 0.61) / 0.04, 0, 1).toFixed(3));
    S.setProperty('--hint', clamp((p - 0.82) / 0.05, 0, 1).toFixed(3));
    const rest = clamp((p - 0.76) / 0.08, 0, 1);
    S.setProperty('--ro2', rest.toFixed(3));
    applySpin();
    const segs = [[-1, 0.27], [0.27, 0.52], [0.52, 2]];
    $$('.hero-line', st).forEach((el, i) => {
      const [a, b] = segs[i], f = 0.07;
      const vin = i === 2 ? (p >= a ? 1 : 0) : clamp((p - a) / f, 0, 1), vout = 1 - clamp((p - (b - f)) / f, 0, 1);
      const v = Math.min(vin, vout);
      el.style.opacity = v.toFixed(3);
      if (i < 2) el.style.transform = `translateY(calc(-50% + ${((p > (a + b) / 2 ? -1 : 1) * (1 - v) * 24).toFixed(1)}px))`;
      const live = i === 2 ? rest > 0.5 || turn > 0.5 : v > 0.5;
      el.classList.toggle('live', live);
      el.setAttribute('aria-hidden', (i === 2 ? turn < 0.5 : v < 0.5) ? 'true' : 'false');
    });
    $$('.hero-stats [data-count]', st).forEach((el) => setMetric(el, easeOut(rest)));
    heroVideo(p < 0.999);
  }
  function applySpin() {
    const r = $('#cd3dRot'); if (!r) return;
    r.style.setProperty('--rot', ((spin.scroll || 0) + spin.user).toFixed(2) + 'deg');
    r.style.setProperty('--tilt', spin.tilt.toFixed(2) + 'deg');
  }
  // after a drag (or a tap) it coasts on and settles facing front on a full turn
  function spinTo(target) {
    const from = spin.user, dist = target - from;
    if (!dist) return;
    const t0 = performance.now(), dur = clamp(Math.abs(dist) * 3.2, 500, 1500);
    cancelAnimationFrame(spin.raf);
    const step = (t) => {
      if (spin.drag) { spin.raf = 0; return; }
      const k = Math.min(1, (t - t0) / dur);
      spin.user = from + dist * easeOut(k);
      spin.tilt *= 0.9;
      applySpin();
      spin.raf = k < 1 ? requestAnimationFrame(step) : 0;
      if (k >= 1) { spin.user = target % 360; spin.tilt = 0; applySpin(); }
    };
    spin.raf = requestAnimationFrame(step);
  }
  const tabShine = () => { if (window.cdTabIcon) window.cdTabIcon.shine(); };
  const settleSpin = (extra) => { tabShine(); spinTo((Math.round((spin.user + spin.vel * 14) / 360) + (extra || 0)) * 360); };
  function wireCd3d() {
    const w = $('#cd3d'); if (!w) return;
    cancelAnimationFrame(spin.raf); spin.raf = 0; spin.user = 0; spin.vel = 0; spin.drag = null; spin.tilt = 0;
    w.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      spin.drag = { x: e.clientX, y: e.clientY, last: e.clientX, t: performance.now(), moved: false, id: e.pointerId };
      spin.vel = 0;
    });
    w.addEventListener('pointermove', (e) => {
      const d = spin.drag;
      if (!d || d.id !== e.pointerId) {
        if (e.pointerType === 'mouse' && !reduceMotion) { const r = w.getBoundingClientRect(); spin.tilt = clamp(((e.clientY - r.top) / r.height - 0.5) * -14, -8, 8); applySpin(); }
        return;
      }
      const dx = e.clientX - d.last;
      if (!d.moved && Math.abs(e.clientX - d.x) > 4 && Math.abs(e.clientX - d.x) > Math.abs(e.clientY - d.y)) { d.moved = true; try { w.setPointerCapture(e.pointerId); } catch (_) {} }
      if (!d.moved) return;
      spin.user += dx * 0.6;
      spin.vel = spin.vel * 0.5 + dx * 0.3;
      d.last = e.clientX;
      applySpin();
    });
    const up = (e) => {
      const d = spin.drag; if (!d || d.id !== e.pointerId) return;
      spin.drag = null;
      if (!d.moved && e.type === 'pointerup') { spin.vel = 0; settleSpin(1); } // a tap gives it a full turn
      else settleSpin(0);
    };
    w.addEventListener('pointerup', up);
    w.addEventListener('pointercancel', up);
    w.addEventListener('pointerleave', () => { if (!spin.drag && !spin.raf && spin.tilt) { spin.tilt = 0; applySpin(); } });
    w.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spin.vel = 0; settleSpin(1); } });
  }
  /* hero reel: plays the clips listed in js/clips.js one after another,
     using two stacked videos so the next clip is loaded before its cut. */
  const CLIPS = (Array.isArray(window.COOLDOWN_CLIPS) ? window.COOLDOWN_CLIPS : [])
    .map((c) => (typeof c === 'string' ? { file: c } : c))
    .filter((c) => c && typeof c.file === 'string' && c.file.trim())
    .map((c) => ({ file: c.file.trim(), start: Math.max(0, Number(c.start) || 0), seconds: Math.max(0, Number(c.seconds) || 0) }));
  const reel = { vids: [], cur: 0, next: 0, bad: new Set(), want: false };
  const clipURL = (c) => 'assets/video/clips/' + c.file.split('/').map(encodeURIComponent).join('/');
  function reelLoad(v, idx) {
    const c = CLIPS[idx];
    v.dataset.idx = idx;
    v.dataset.start = c.start;
    v.dataset.end = c.seconds ? c.start + c.seconds : 0;
    v.src = clipURL(c);
    if (c.start) v.addEventListener('loadedmetadata', () => { try { v.currentTime = c.start; } catch (_) {} }, { once: true });
    v.load();
  }
  function reelNextIdx(from) {
    for (let k = 1; k <= CLIPS.length; k++) { const j = (from + k) % CLIPS.length; if (!reel.bad.has(j)) return j; }
    return -1;
  }
  function reelAdvance() {
    const a = reel.vids[reel.cur], b = reel.vids[1 - reel.cur];
    if (!a || !b) return;
    if (CLIPS.length - reel.bad.size <= 1) { // one clip: just loop it
      try { a.currentTime = Number(a.dataset.start) || 0; } catch (_) {}
      if (reel.want) a.play().catch(() => {});
      return;
    }
    try { b.currentTime = Number(b.dataset.start) || 0; } catch (_) {}
    b.classList.add('on'); a.classList.remove('on');
    a.pause();
    reel.cur = 1 - reel.cur;
    if (reel.want) b.play().catch(() => {});
    const n = reelNextIdx(Number(b.dataset.idx));
    if (n >= 0) reelLoad(a, n);
  }
  function wireReel() {
    reel.vids = $$('#heroReel video'); reel.cur = 0; reel.bad.clear(); reel.want = false;
    const box = $('#heroReel');
    if (!box) return;
    if (!CLIPS.length) { box.classList.add('empty'); return; }
    reel.vids.forEach((v) => {
      v.muted = true; // required for autoplay on phones
      v.addEventListener('ended', () => { if (v === reel.vids[reel.cur]) reelAdvance(); });
      v.addEventListener('timeupdate', () => { const e = Number(v.dataset.end); if (e && v === reel.vids[reel.cur] && v.currentTime >= e) reelAdvance(); });
      v.addEventListener('error', () => {
        const idx = Number(v.dataset.idx);
        if (!v.getAttribute('src')) return;
        reel.bad.add(idx);
        console.warn('COOLDOWN: could not play hero clip "' + (CLIPS[idx] || {}).file + '". Check the name in js/clips.js matches the file in assets/video/clips/.');
        if (reel.bad.size >= CLIPS.length) { box.classList.add('empty'); return; }
        if (v === reel.vids[reel.cur]) reelAdvance();
        else { const n = reelNextIdx(idx); if (n >= 0 && n !== Number(reel.vids[reel.cur].dataset.idx)) reelLoad(v, n); }
      });
    });
    reelLoad(reel.vids[0], 0);
    if (CLIPS.length > 1) reelLoad(reel.vids[1], 1);
  }
  let videoOn = null;
  function heroVideo(on) {
    const v = reel.vids[reel.cur];
    if (!v || !v.isConnected || reduceMotion || !CLIPS.length) return;
    if (document.hidden) on = false;
    if (on === videoOn && !v.paused === on) return;
    videoOn = on; reel.want = on;
    if (on) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } else reel.vids.forEach((x) => x.pause());
  }
  document.addEventListener('visibilitychange', () => { videoOn = null; if ($('#heroReel')) heroScrub(); });
  function lnavScrub() {
    const nav = $('#lnav'); if (!nav) return;
    const off = navH() + nav.offsetHeight + 40;
    let cur = null;
    LNAV.forEach(([id]) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= off) cur = id; });
    $$('[data-jump]', nav).forEach((b) => b.classList.toggle('on', b.dataset.jump === cur));
    if (cur && cur !== nav.dataset.cur) {
      nav.dataset.cur = cur;
      const on = $(`[data-jump="${cur}"]`, nav), links = $('.lnav-links', nav);
      if (on && links && links.scrollWidth > links.clientWidth) {
        const l = on.offsetLeft - links.offsetLeft, r = l + on.offsetWidth;
        if (l < links.scrollLeft || r > links.scrollLeft + links.clientWidth) links.scrollTo({ left: Math.max(0, l - 20), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
  }
  function setPart(id) {
    const v = $('#viewer'); if (!v) return;
    const p = PARTS.find((x) => x.id === id) || PARTS[0];
    ui.part = p.id;
    v.dataset.part = p.id;
    $$('[role="tab"][data-part-go]', v).forEach((b) => { const on = b.dataset.partGo === p.id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    const z = $('#vzoom');
    const [cx, cy, s] = p.z;
    if (z) z.style.transform = s === 1 ? '' : `translate(-50%, -50%) scale(${s}) translate(${(50 - vbX(cx)).toFixed(2)}%, ${(50 - vbY(cy)).toFixed(2)}%)`;
    const card = $('#vcard');
    const r = rig(v.dataset.rig);
    if (!card || !r) return;
    const specs = r.specs || [];
    let html;
    if (p.id === 'overview') {
      const w = specs.find((x) => /weight/i.test(x[0]));
      html = `<b>${esc(r.title)}</b><p>${esc(r.caption || '')}</p>${w ? `<div class="spec">Weight · ${esc(w[1])}</div>` : ''}<p style="margin-top:8px">Tap a <span class="plus-i">+</span> or a part below to zoom in.</p>`;
    } else {
      const hits = specs.filter((x) => p.re.test(x[0]));
      html = `<b>${p.label}</b><p>${PART_COPY[p.id]}</p>${hits.length ? hits.map((x) => `<div class="spec">${esc(x[0])} · ${esc(x[1])}</div>`).join('') : '<div class="spec">Details coming soon from the builder.</div>'}`;
    }
    if (!card.innerHTML || reduceMotion) { card.innerHTML = html; return; }
    card.classList.add('swap');
    clearTimeout(setPart._t);
    setPart._t = setTimeout(() => { card.innerHTML = html; card.classList.remove('swap'); }, 180);
  }

  /* ---------------------------------------------------------------- RIGS */
  function viewRigs() {
    return `<section class="phead"><div class="wrap rv"><div class="eyebrow">Gear, builds and workstations</div><h1 class="h-sec">Rigs</h1><p class="lede">Road, gravel, MTB, track and BMX builds, plus the mechanic stations where the magic happens.</p><div style="margin-top:26px"><button type="button" class="pill pill-green" data-act="compose" data-tab="rig">＋ Post your rig</button></div></div></section>
    <div class="fbar"><div class="fbar-in">
      <div class="chips">${sportChips('rigSport')}</div>
      <div class="seg">${segBtns('rigType', [['All', 'All'], ['Bike', 'Bikes'], ['Workstation', 'Stations'], ['Kit', 'Gear']])}</div>
      <div class="seg">${segBtns('rigSort', [['top', 'Most liked'], ['hot', 'Trending'], ['new', 'Newest']])}</div>
      <label class="switch">Following<input type="checkbox" data-toggle="rigFollowing" ${ui.rigFollowing ? 'checked' : ''}><span class="knob"></span></label>
      <span class="count" id="rigCount"></span>
    </div></div>
    <div class="wrap"><div class="grid" id="rigGrid"></div></div>`;
  }
  function rigItems() {
    let list = rigs();
    if (ui.rigSport !== 'All') list = list.filter((r) => r.sport === ui.rigSport);
    if (ui.rigType !== 'All') list = list.filter((r) => r.type === ui.rigType);
    if (ui.rigFollowing) list = list.filter((r) => isFollowing(r.athleteId) || r.athleteId === 'me');
    if (ui.rigSort === 'new') list.sort((a, b) => b.createdAt - a.createdAt);
    else if (ui.rigSort === 'hot') list.sort((a, b) => hotScore(b) - hotScore(a));
    else list.sort((a, b) => b.likes - a.likes);
    return list;
  }
  function renderRigGrid() {
    const el = $('#rigGrid'); if (!el) return;
    const items = rigItems();
    $('#rigCount').textContent = items.length + ' rig' + (items.length === 1 ? '' : 's');
    el.innerHTML = items.length ? items.map((r, i) => rcard(r, 0, `rv d${(i % 4) + 1}`)).join('') : `<div class="empty" style="grid-column:1/-1"><b>No rigs match</b>Change a filter, or be the first to post one.<div style="margin-top:18px"><button type="button" class="pill pill-green" data-act="compose" data-tab="rig">＋ Post your rig</button></div></div>`;
    enhance(el);
  }

  /* ------------------------------------------------------------ ATHLETES */
  function viewAthletes() {
    return `<section class="phead"><div class="wrap rv"><div class="eyebrow">Directory</div><h1 class="h-sec">Riders and mechanics</h1><p class="lede">Riders, mechanics and the teams they ride for. Every discipline, every level.</p>${claimed() ? '' : '<div style="margin-top:26px"><button type="button" class="pill pill-green" data-act="editProfile">✦ Set up your profile</button></div>'}</div></section>
    ${teamsRailHTML()}
    <div class="fbar"><div class="fbar-in">
      <label class="search-field">${searchIcon}<input id="athQ" type="search" placeholder="Name, city or @handle" value="${esc(ui.athQ)}" aria-label="Search athletes"></label>
      <div class="seg">${segBtns('athSort', [['traction', 'Traction'], ['followers', 'Fans'], ['rising', 'Rising']])}</div>
      <label class="switch">Open to sponsors<input type="checkbox" data-toggle="athOpen" ${ui.athOpen ? 'checked' : ''}><span class="knob"></span></label>
      <label class="switch">Following<input type="checkbox" data-toggle="athFollowing" ${ui.athFollowing ? 'checked' : ''}><span class="knob"></span></label>
      <div class="chips">${sportChips('athSport')}<button type="button" class="chip chip-mech ${ui.athSport === 'Mechanics' ? 'on' : ''}" data-set="athSport" data-val="Mechanics">🔧 Mechanics</button></div>
      <span class="count" id="athCount"></span>
    </div></div>
    <div class="wrap"><div class="grid" id="athGrid"></div></div>`;
  }
  /* ---------------------------------------------------------------- TEAMS */
  const teamCrest = (t, px) => `<span class="crest" style="--c1:${esc(t.colors[0])};--c2:${esc(t.colors[1] || '#15161a')};width:${px}px;height:${px}px" aria-hidden="true">${esc(t.name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase())}</span>`;
  function teamCard(t) {
    const mem = teamMembers(t);
    return `<a class="team-card" href="#/team/${esc(t.id)}" style="--c1:${esc(t.colors[0])}">${teamCrest(t, 52)}<div class="tc-t"><b>${esc(t.name)}</b><span>${esc(t.city || '')}${t.disciplines && t.disciplines.length ? ' · ' + t.disciplines.map(esc).join(', ') : ''}</span></div><div class="tc-faces">${mem.slice(0, 5).map((a) => av(a, 30)).join('')}<span class="tc-n">${mem.length} rider${mem.length === 1 ? '' : 's'}</span></div></a>`;
  }
  function teamsRailHTML() {
    return `<section class="sec teams-sec" id="s-teams"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Teams</div><h2 class="h-sub">Ride with a crew</h2></div><button type="button" class="pill pill-sm" data-act="startTeam">＋ Start a team</button></div></div>${rail('teamRail', teams().map(teamCard).join(''))}</section>`;
  }
  function viewTeam(id) {
    const t = team(id);
    const mem = teamMembers(t), inIt = claimed() && U.me.team === t.id;
    const ups = races().filter((r) => going(r).some((x) => mem.some((a) => a.id === x))).slice(0, 6);
    const fans = mem.reduce((n, a) => n + followers(a), 0);
    return `<section class="team-hero dark" style="--c1:${esc(t.colors[0])};--c2:${esc(t.colors[1] || '#15161a')}"><div class="wrap rv">
      <div class="team-id">${teamCrest(t, 96)}<div><div class="eyebrow">Team${t.founded ? ' · since ' + esc(t.founded) : ''}</div><h1 class="h-sec">${esc(t.name)}</h1><p class="lede">${esc(t.bio || 'A new crew on COOLDOWN.')}</p>
        <div class="prof-tags" style="justify-content:flex-start">${t.city ? `<span class="tag">${esc(t.city)}</span>` : ''}${(t.disciplines || []).map((d) => `<span class="tag">${esc(d)}</span>`).join('')}</div>
        <div class="prof-acts" style="justify-content:flex-start;margin-top:18px"><button type="button" class="pill ${inIt ? 'pill-line on-dark' : 'pill-pop'}" data-act="${inIt ? 'leaveTeam' : 'joinTeam'}" data-id="${esc(t.id)}">${inIt ? 'Leave team' : 'Join this team'}</button><button type="button" class="pill pill-line on-dark" data-act="copyLink" data-link="#/team/${esc(t.id)}">Share</button></div></div></div>
      <div class="hero-stats" style="justify-content:flex-start;margin-top:34px"><div style="text-align:left"><b>${mem.length}</b><span>Riders</span></div><div style="text-align:left"><b>${fmtK(fans)}</b><span>Combined fans</span></div><div style="text-align:left"><b>${ups.length}</b><span>Races ahead</span></div></div>
      ${(t.sponsors || []).length ? `<div class="sponsors"><div class="eyebrow">Team sponsors</div><div class="sp-cards">${t.sponsors.map((x) => `<div class="sp-card"><span class="sp-logo" aria-hidden="true">${esc(String(x)[0])}</span><div><b>${esc(x)}</b><span>Team sponsor</span></div></div>`).join('')}</div></div>` : ''}
    </div></section>
    <section class="sec"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Roster</div><h2 class="h-sec">The riders</h2></div></div>
      ${mem.length ? `<div class="grid">${mem.map(acard).join('')}</div>` : '<div class="empty"><b>No riders yet</b>Be the first to join.</div>'}</div></section>
    ${ups.length ? `<section class="sec snow"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Calendar</div><h2 class="h-sec">Where they're racing</h2></div></div><div class="races-list">${ups.map((r) => { const d = new Date(r.date); return `<div class="race-line rv" data-open-race="${r.id}" role="button" tabindex="0"><div class="date-box"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div><div style="min-width:0"><b>${esc(r.name)}</b><span>${esc(r.city)} · in ${daysTo(r.date)} days</span></div><span class="tag">${esc(r.sport)}</span></div>`; }).join('')}</div></div></section>` : ''}`;
  }
  function athItems() {
    let list = athletes();
    const q = ui.athQ.trim().toLowerCase().replace(/^@/, '');
    if (q) list = list.filter((a) => (a.name + ' ' + a.handle + ' ' + a.city + ' ' + a.sport).toLowerCase().includes(q));
    if (ui.athSport === 'Mechanics') list = list.filter(isMech);
    else if (ui.athSport !== 'All') list = list.filter((a) => discOf(a).includes(ui.athSport));
    if (ui.athOpen) list = list.filter((a) => a.openToSponsors);
    if (ui.athFollowing) list = list.filter((a) => isFollowing(a.id));
    if (ui.athSort === 'followers') list.sort((a, b) => followers(b) - followers(a));
    else if (ui.athSort === 'rising') list.sort((a, b) => growthPct(b) - growthPct(a));
    else list.sort((a, b) => traction(b) - traction(a));
    return list;
  }
  function acard(a, i) {
    const g = nextGoal(a);
    return `<article class="acard rv d${(i % 4) + 1}" data-open-ath="${a.id}" role="button" tabindex="0">
      <div class="acard-top">${av(a, 52)}<div class="t"><b>${esc(a.name)}</b><span>@${esc(a.handle)} · ${isMech(a) ? '🔧 ' + (a.role === 'both' ? esc(a.sport) + ' + Mechanic' : 'Mechanic') : esc(a.sport)}</span></div>${followBtn(a)}</div>
      <p class="bio">${esc(a.bio || 'No bio yet.')}</p>
      ${g ? `<div class="next-goal"><div class="lbl"><span>🎯 ${esc(g.title)}</span><span class="mono">${Math.round(goalPct(g) * 100)}%</span></div><div class="bar"><i data-bar="${(goalPct(g) * 100).toFixed(1)}"></i></div></div>` : ''}
      <div class="mini-stats"><div><b data-fol-of="${a.id}">${fmtK(followers(a))}</b><span>Fans</span></div><div><b>${traction(a)}</b><span>Traction</span></div><div><b>${a.openToSponsors ? '<span style="color:var(--green)">Open</span>' : '—'}</b><span>Sponsors</span></div></div>
    </article>`;
  }
  function renderAthGrid() {
    const el = $('#athGrid'); if (!el) return;
    const items = athItems();
    $('#athCount').textContent = items.length + ' athlete' + (items.length === 1 ? '' : 's');
    el.innerHTML = items.length ? items.map(acard).join('') : '<div class="empty" style="grid-column:1/-1"><b>No athletes match</b>Try a different search.</div>';
    enhance(el);
  }

  /* --------------------------------------------------------------- SCOUT */
  function viewScout() {
    const open = athletes().filter((a) => a.openToSponsors).length;
    return `<section class="phead dark"><div class="wrap rv"><div class="eyebrow">For brands</div><h1 class="h-sec">Scout</h1><p class="lede">Find athletes who actually move people. Sort by what matters, shortlist the ones you like and line them up side by side.</p>
      <div class="hero-stats" style="justify-content:flex-start;margin-top:36px"><div style="text-align:left"><b data-count="${open}">0</b><span>Open to sponsors</span></div><div style="text-align:left"><b data-count="${athletes().reduce((s, a) => s + followers(a), 0)}" data-fmt="k">0</b><span>Combined fans</span></div><div style="text-align:left"><b data-count="${SPORTS.length}">0</b><span>Disciplines</span></div></div></div></section>
    <div class="fbar"><div class="fbar-in">
      <div class="chips">${sportChips('scSport')}</div>
      <label class="switch">Open only<input type="checkbox" data-toggle="scOpen" ${ui.scOpen ? 'checked' : ''}><span class="knob"></span></label>
      <label class="switch">Shortlist<input type="checkbox" data-toggle="scShort" ${ui.scShort ? 'checked' : ''}><span class="knob"></span></label>
      <label class="switch" style="gap:8px">Min fans <span class="mono" id="scMinLbl" style="min-width:34px">${fmtK(ui.scMin)}</span><input type="range" id="scMin" min="0" max="80000" step="2000" value="${ui.scMin}" aria-label="Minimum fans" style="position:static;opacity:1;pointer-events:auto;width:120px;accent-color:#00C46A"></label>
      <span class="count" id="scCount"></span>
      <button type="button" class="pill pill-sm cmp-open-m" data-act="compareModal">Compare (<span class="cmpN">${U.compare.length}</span>)</button>
    </div></div>
    <div class="wrap scout-grid"><div class="table-wrap" id="scTable"></div><aside class="cmp-aside" aria-label="Compare"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Compare</h3><button type="button" class="pill pill-line pill-xs" data-act="clearCompare">Clear</button></div><div id="cmpBody"></div></aside></div>
    <section class="sec dark" id="s-faq"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Questions</div><h2 class="h-sec">How Scout works</h2></div></div>
      <div class="rv">
        ${acc('How is traction scored?', `<div class="formula"><kbd>Fans</kbd><span>About 9 points every time an audience grows 10× (log scale), so small, loyal crowds still count.</span><kbd>Engagement</kbd><span>2.2 points per 1% engagement, up to 22.</span><kbd>Rig likes</kbd><span>About 4 points every time rig likes grow 10×.</span><kbd>Growth</kbd><span>0.25 points per 1% of 12-week follower growth, up to 12.5.</span></div>`)}
        ${acc('What does an athlete profile include?', '<p>Gear and builds, season goals with live progress, upcoming races, links to Strava, Instagram, Spotify and more, a sponsor pitch and a contact button.</p>')}
        ${acc('Are these numbers verified?', '<p>Not yet. This is an early demo with fictional athletes. In the live version, fans, engagement and activities will come from linked Strava and Instagram accounts instead of being self-reported.</p>')}
        ${acc('How do I reach an athlete?', '<p>Open their profile and use “Contact for sponsorship” on their pitch, or shortlist them in Scout and request media kits.</p>')}
      </div>
    </div></section>`;
  }
  const scVal = (a, k) => ({ followers: followers(a), engagement: a.engagement, likes: rigLikes(a.id), growth: growthPct(a), traction: traction(a) })[k];
  function scItems() {
    let list = athletes();
    if (ui.scSport !== 'All') list = list.filter((a) => a.sport === ui.scSport);
    if (ui.scOpen) list = list.filter((a) => a.openToSponsors);
    if (ui.scShort) list = list.filter((a) => U.shortlist.includes(a.id));
    list = list.filter((a) => followers(a) >= ui.scMin);
    return list.sort((a, b) => (scVal(a, ui.scSort) - scVal(b, ui.scSort)) * ui.scDir);
  }
  function renderScout() {
    const el = $('#scTable'); if (!el) return;
    const items = scItems();
    $('#scCount').textContent = items.length + ' athlete' + (items.length === 1 ? '' : 's');
    const cols = [['followers', 'Fans'], ['engagement', 'Engagement'], ['likes', 'Rig likes'], ['growth', '12-week'], ['traction', 'Traction']];
    const head = `<tr><th>#</th><th>Athlete</th>${cols.map(([k, l]) => `<th><button type="button" data-sort="${k}" class="${ui.scSort === k ? 'on' : ''}" aria-label="Sort by ${l}">${l}${ui.scSort === k ? (ui.scDir < 0 ? ' ↓' : ' ↑') : ''}</button></th>`).join('')}<th>Save</th></tr>`;
    const rows = items.map((a, i) => {
      const st = U.shortlist.includes(a.id), cm = U.compare.includes(a.id);
      return `<tr class="${cm ? 'cmp' : ''}" data-open-ath="${a.id}" tabindex="0" role="button">
        <td class="rank">${i + 1}</td>
        <td><span class="who">${av(a, 36)}<span><b>${esc(a.name)}</b><span>${esc(a.sport)} · ${esc((a.city || '').split(',')[0])}</span></span></span></td>
        <td>${fmtK(followers(a))}</td><td>${a.engagement.toFixed(1)}%</td><td>${fmtK(rigLikes(a.id))}</td>
        <td title="+${growthPct(a).toFixed(0)}% in 12 weeks">${spark(a.growth)}</td>
        <td><span class="score-pill">${traction(a)}</span></td>
        <td><button type="button" class="star-btn ${st ? 'on' : ''}" data-star="${a.id}" aria-pressed="${st}" aria-label="Shortlist">${starIcon}</button><button type="button" class="cmp-btn ${cm ? 'on' : ''}" data-cmp="${a.id}" aria-pressed="${cm}" aria-label="Compare">${cmpIcon}</button></td>
      </tr>`;
    }).join('');
    el.innerHTML = items.length ? `<table class="stable"><thead>${head}</thead><tbody>${rows}</tbody></table>` : '<div class="empty"><b>No one matches</b>Loosen a filter.</div>';
    refreshCompare();
  }
  function cmpHTML() {
    const sel = U.compare.map(athlete).filter(Boolean);
    if (!sel.length) return `<p class="muted" style="margin:6px 0 0">Tap ${cmpIcon.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} on up to three athletes to line them up here.</p>`;
    const metrics = [['traction', 'Traction', (v) => v], ['followers', 'Fans', fmtK], ['engagement', 'Engagement', (v) => v.toFixed(1) + '%'], ['growth', '12-week growth', (v) => '+' + v.toFixed(0) + '%'], ['likes', 'Rig likes', fmtK]];
    const legend = `<div class="legend">${sel.map((a) => `<span class="tag" data-open-ath="${a.id}">${av(a, 16)}${esc(a.name.split(' ')[0])}</span>`).join('')}</div>`;
    const rows = metrics.map(([k, l, f]) => {
      const vals = sel.map((a) => scVal(a, k)); const mx = Math.max(...vals, 0.0001);
      return `<div class="cmp-metric"><span class="lbl">${l}</span>${sel.map((a, i) => `<div class="cmp-bar ${vals[i] === mx && sel.length > 1 ? 'win' : ''}">${av(a, 22)}<div class="bar"><i style="width:${(Math.max(vals[i], 0) / mx * 100).toFixed(1)}%"></i></div><span class="num">${f(vals[i])}</span></div>`).join('')}</div>`;
    }).join('');
    return `${legend}${rows}<button type="button" class="pill" style="width:100%;margin-top:12px" data-act="mediaKit">Request media kits</button>`;
  }
  function refreshCompare() {
    const cb = $('#cmpBody'); if (cb) cb.innerHTML = cmpHTML();
    $$('.cmpN').forEach((n) => { n.textContent = U.compare.length; });
    const m = $('.modal [data-cmp-modal]'); if (m) m.innerHTML = cmpHTML();
  }

  /* ------------------------------------------------------------- JOURNAL */
  function jItems() {
    let list = posts().sort((a, b) => b.createdAt - a.createdAt);
    if (ui.jFilter === 'following') list = list.filter((p) => isFollowing(p.athleteId));
    if (ui.jFilter === 'mine') list = list.filter((p) => p.athleteId === 'me');
    return list;
  }
  function viewJournal() {
    return `<section class="phead"><div class="wrap rv"><div class="eyebrow">Stories from the season</div><h1 class="h-sec">Journal</h1><p class="lede">Race reports, build stories, training blocks and what the sport means to the people doing it.</p>
      <div style="margin-top:26px;display:flex;gap:12px;flex-wrap:wrap;align-items:center"><button type="button" class="pill pill-green" data-act="compose" data-tab="post">✍︎ Write a story</button><div class="seg">${segBtns('jFilter', [['all', 'All'], ['following', 'Following'], ['mine', 'Mine']])}</div></div></div></section>
    <div class="wrap" id="jBox"></div>`;
  }
  function renderJournal() {
    const el = $('#jBox'); if (!el) return;
    const list = jItems();
    if (!list.length) { el.innerHTML = `<div class="empty">${ui.jFilter === 'mine' ? '<b>Nothing written yet</b>Your first story is one tap away.' : '<b>Nothing here yet</b>Follow more athletes.'}</div>`; return; }
    const f = list[0], fa = athlete(f.athleteId) || { name: '?', hue: 140 };
    el.innerHTML = `<a class="feature-story rv" href="#/journal/${encodeURIComponent(f.id)}" data-open-post="${esc(f.id)}"><div class="art-wrap">${rigArt(f, 'jf')}</div><div class="story-b"><div class="eyebrow">Featured · ${esc(f.sport)}</div><h3>${esc(f.title)}</h3><p>${esc(f.body.split(/\n/)[0].slice(0, 220))}</p><div class="story-by">${av(fa, 28)}${esc(fa.name)} · ${ago(f.createdAt)} · ♥ ${fmtK(f.likes)}</div></div></a>
      <div class="jgrid">${list.slice(1).map((p, i) => storyCard(p, false, `rv d${(i % 3) + 1}`)).join('')}</div>`;
    enhance(el);
  }
  function viewArticle(id) {
    const p = post(id);
    const a = athlete(p.athleteId) || { name: '?', hue: 140, id: '' };
    const words = p.body.split(/\s+/).length;
    const paras = p.body.split(/\n{2,}/).map((t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('');
    const more = posts().filter((x) => x.id !== p.id).sort((x, y) => y.createdAt - x.createdAt).slice(0, 6);
    return `<div class="progress" id="readProg" aria-hidden="true"></div>
    <article class="article">
      <header class="article-head rv"><div class="eyebrow">${esc(p.sport)} · ${fmtDate(p.createdAt)} · ${Math.max(1, Math.round(words / 220))} min read</div><h1>${serifLast(p.title)}</h1>
        <div class="article-by">${av(a, 36)}<button type="button" data-open-ath="${a.id}" style="font-weight:700">${esc(a.name)}</button>${a.id ? followBtn(a) : ''}${likeBtn(p)}</div></header>
      <div class="article-cover rv-scale"><div class="art-wrap">${rigArt(p, 'ac')}</div></div>
      <div class="article-body">${paras}</div>
      <div class="article-foot"><button type="button" class="pill pill-line pill-sm" data-act="copyLink" data-link="#/journal/${esc(p.id)}">Copy link</button><a class="pill pill-line pill-sm" href="#/journal">All stories</a>${p.athleteId === 'me' ? `<button type="button" class="pill pill-line pill-sm" data-act="deletePost" data-id="${esc(p.id)}" style="color:var(--red)">Delete</button>` : ''}</div>
    </article>
    ${more.length ? `<section class="sec snow" style="padding-top:80px"><div class="wrap"><div class="sec-head rv"><h2 class="h-sub">More stories</h2></div></div>${rail('moreRail', more.map((x) => `<div style="width:clamp(280px,30vw,380px)">${storyCard(x, true)}</div>`).join(''))}</section>` : ''}`;
  }

  /* ------------------------------------------------------------- PROFILE */
  function viewAthlete(id) {
    const a = athlete(id);
    const isMe = a.isMe;
    const first = esc(a.name.split(' ')[0]);
    const tr = traction(a), rank = rankOf(a.id);
    const myRigs = rigsBy(a.id).sort((x, y) => y.likes - x.likes), myPosts = postsBy(a.id), myRaces = racesBy(a.id);
    const goals = (a.goals || []).slice().sort((x, y) => x.due - y.due);
    const g = growthPct(a);
    return `<section class="prof-hero dark" style="--h:${Number(a.hue) || 140}"><div class="wrap">
      <div class="prof-id rv">
        ${a.avatar && !a.photo && AV ? `<div class="av-stage" data-av-stage ${stageAttr(a.avatar)} tabindex="0" role="img" aria-label="${esc(a.name)}'s avatar. Drag to spin it, tap to make it wave.">${stageInner(a.avatar, a.name + "'s avatar")}</div><div class="av-hint">Drag to spin · tap to wave</div>${isMe ? '<button type="button" class="pill pill-line on-dark pill-sm" data-act="avatarMaker">Edit avatar</button>' : ''}` : av(a, 120, 'ring') + (isMe && AV ? '<button type="button" class="pill pill-pop pill-sm" data-act="avatarMaker">✦ Make your avatar</button>' : '')}
        <h1>${esc(a.name)}</h1><div class="handle">@${esc(a.handle)}</div>
        <div class="prof-tags">${isMech(a) ? `<span class="tag mech-tag">${a.role === 'both' ? '🚴🔧 Rider + Mechanic' : '🔧 Mechanic'}</span>` : ''}${a.role !== 'mechanic' ? discOf(a).map((d) => `<span class="tag">${esc(d)}</span>`).join('') : ''}${team(teamIdOf(a)) ? `<a class="tag team-tag" href="#/team/${esc(teamIdOf(a))}" style="--tc:${esc(team(teamIdOf(a)).colors[0])}">🛡 ${esc(team(teamIdOf(a)).name)}</a>` : ''}${a.city ? `<span class="tag">${esc(a.city)}</span>` : ''}${a.openToSponsors ? '<span class="tag pop">Open to sponsors</span>' : ''}</div>
        <p class="bio">${esc(a.bio || (isMe ? 'Add a bio so people know what you are about.' : ''))}</p>
        <div class="prof-acts">${isMe ? '<button type="button" class="pill pill-pop pill-sm" data-act="editProfile">Edit profile</button><button type="button" class="pill pill-line on-dark pill-sm" data-act="compose" data-tab="rig">＋ Post</button>' : followBtn(a)}<button type="button" class="pill pill-line on-dark pill-sm" data-act="copyLink" data-link="#/athlete/${esc(a.id)}">Share</button></div>
        <div class="socials">${socialLinks(a)}</div>
        ${a.sponsors && a.sponsors.length ? `<div class="prof-tags"><span class="muted" style="font-size:14px;align-self:center">Backed by</span>${a.sponsors.map((s) => `<span class="tag sponsor-tag">${esc(s)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="prof-stats">
        <div class="prof-stat rv d1"><b data-count="${followers(a)}" data-fmt="k" data-fol-of="${a.id}">0</b><span>Fans</span></div>
        <div class="prof-stat rv d2"><div class="ring-wrap">${ring(tr / 100, 120)}<b data-count="${tr}">0</b></div><span>Traction · #${rank}</span></div>
        <div class="prof-stat rv d3"><b data-count="${a.engagement || 0}" data-fmt="pct">0</b><span>Engagement</span></div>
        <div class="prof-stat rv d4"><b data-count="${rigLikes(a.id)}" data-fmt="k">0</b><span>Rig likes</span></div>
      </div>
    </div></section>

    ${shopHTML(a, isMe)}
    ${pinnedHTML(a, isMe)}
    ${resultsHTML(a, isMe, first)}
    ${seasonHTML(a, isMe)}

    <section class="sec snow" id="s-goals"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Season goals</div><h2 class="h-sec">What ${isMe ? "you're" : first + "'s"} chasing</h2></div>${isMe ? '<button type="button" class="pill" data-act="compose" data-tab="goal">＋ Add a goal</button>' : ''}</div>
      ${goals.length ? `<div class="goals">${goals.map((x, i) => goalHTML(x, isMe, i)).join('')}</div>` : `<div class="empty"><b>${isMe ? 'What are you chasing?' : 'No goals posted'}</b>${isMe ? 'Add a goal like “Everest Challenge” or “Top 10 at Headlands Hundred”.' : ''}</div>`}
    </div></section>

    <section class="sec" id="s-races"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Upcoming</div><h2 class="h-sec">Upcoming races</h2></div>${isMe ? '<button type="button" class="pill" data-act="compose" data-tab="race">＋ Add a race</button>' : ''}</div>
      ${myRaces.length ? `<div class="races-list">${myRaces.map((r) => { const d = new Date(r.date); return `<div class="race-line rv" data-open-race="${r.id}" role="button" tabindex="0"><div class="date-box"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div><div style="min-width:0"><b>${esc(r.name)}</b><span>${esc(r.city)} · in ${daysTo(r.date)} days</span></div><span class="tag">${esc(r.sport)}</span></div>`; }).join('')}</div>` : `<div class="empty"><b>No races yet</b>${isMe ? 'Tap “I’m in” on any race, or add your own.' : ''}</div>`}
    </div></section>

    <section class="sec snow" id="s-rigs">
      <div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Gear</div><h2 class="h-sec">Bikes and stations</h2></div>${isMe ? '<button type="button" class="pill pill-green" data-act="compose" data-tab="rig">＋ Post a rig</button>' : ''}</div></div>
      ${myRigs.length ? rail('profRail', myRigs.map((r) => rcard(r)).join('')) : `<div class="wrap"><div class="empty"><b>No rigs yet</b>${isMe ? 'Post your first one.' : ''}</div></div>`}
    </section>

    ${topFivesHTML(a, isMe, first)}

    ${myPosts.length ? `<section class="sec"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Journal</div><h2 class="h-sec">${isMe ? 'Your' : first + "'s"} stories</h2></div></div><div class="jgrid" style="padding-bottom:0">${myPosts.map((p) => storyCard(p)).join('')}</div></div></section>` : ''}

    <section class="sec dark" id="s-pitch"><div class="wrap pitch">
      <div class="rv"><div class="eyebrow">${a.openToSponsors ? 'Open to sponsorship' : 'Not looking right now'}</div><h2 class="h-sec">The pitch</h2>
        <p class="pitch-quote">${a.pitch ? '“' + esc(a.pitch) + '”' : esc(isMe ? 'Write a short pitch in Edit profile: who your audience is and what you can offer a brand.' : 'No pitch yet.')}</p>
        ${a.openToSponsors && !a.isMe ? `<button type="button" class="pill pill-pop" data-act="contactAthlete" data-id="${a.id}">Contact for sponsorship</button>` : ''}
        ${sponsorsHTML(a)}</div>
      <div class="pitch-chart rv d2"><div class="eyebrow">Audience · last 12 weeks</div>${spark(a.growth && a.growth.length > 2 ? a.growth : [0, 0], 600, 110, '#7FB5FF')}
        <div class="row"><div class="prof-stat" style="text-align:left"><b style="font-size:30px">${fmtK(followers(a))}</b><span>Audience</span></div><div class="prof-stat"><b style="font-size:30px">${g ? '+' + g.toFixed(0) + '%' : '—'}</b><span>Growth</span></div><div class="prof-stat" style="text-align:right"><b style="font-size:30px">${a.engagement ? a.engagement.toFixed(1) + '%' : '—'}</b><span>Engagement</span></div></div></div>
    </div></section>`;
  }
  /* ---------- profile: pins, results, season, top 5s, sponsors ---------- */
  const placeTxt = (n) => { n = Math.round(n); const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const placeCls = (n) => (n === 1 ? 'p1' : n === 2 ? 'p2' : n === 3 ? 'p3' : n <= 10 ? 'p10' : '');
  function pinnedHTML(a, isMe) {
    const pins = (a.pinned || []).slice(0, 6);
    if (!pins.length && !isMe) return '';
    const tile = (p, i) => {
      const src = p.kind === 'video' ? String(p.src).replace(/[^\w./-]/g, '') : (safeImg(p.src) || String(p.src).replace(/[^\w./-]/g, ''));
      const media = p.kind === 'video'
        ? `<video src="${src}" muted loop playsinline preload="metadata" ${reduceMotion ? '' : 'autoplay'} aria-label="${esc(p.title || 'Pinned video')}"></video><span class="pin-kind">▶ Video</span>`
        : `<img src="${src}" alt="${esc(p.title || 'Pinned photo')}" loading="lazy">`;
      return `<figure class="pin ${i === 0 ? 'big' : ''} rv d${(i % 3) + 1}">${media}<figcaption><span class="pin-pin" aria-hidden="true">📌</span>${esc(p.title || '')}</figcaption>${isMe ? `<button type="button" class="icon-btn pin-del" data-act="delPin" data-i="${i}" aria-label="Unpin">${xIcon}</button>` : ''}</figure>`;
    };
    return `<section class="sec" id="s-pinned"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Pinned</div><h2 class="h-sec">Best of the season</h2></div>${isMe ? '<button type="button" class="pill" data-act="pinPhoto">＋ Pin a photo</button>' : ''}</div>
      ${pins.length ? `<div class="pins">${pins.map(tile).join('')}</div>` : `<div class="empty"><b>Pin your best moments</b>Race photos, your bike, the view from the top. They show first on your profile.</div>`}
    </div></section>`;
  }
  function shopHTML(a, isMe) {
    if (!isMech(a)) return '';
    const m = a.mech || {};
    const stations = rigsBy(a.id).filter((r) => r.type === 'Workstation');
    const specs = (m.specialties || []).filter(Boolean);
    return `<section class="sec dark shop-sec" id="s-shop"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">🔧 The shop</div><h2 class="h-sec">${m.shop ? esc(m.shop) : 'Shop and skills'}</h2></div>${isMe ? '<button type="button" class="pill pill-line on-dark" data-act="editProfile">Edit shop info</button>' : ''}</div>
      <div class="shop-grid rv">
        <div class="shop-stats">
          ${m.built ? `<div><b data-count="${Number(m.built) || 0}">0</b><span>Bikes built this year</span></div>` : ''}
          ${m.turnaround ? `<div><b class="txt">${esc(m.turnaround)}</b><span>Typical turnaround</span></div>` : ''}
          ${m.since ? `<div><b>${esc(new Date().getFullYear() - Number(m.since))}</b><span>Years wrenching</span></div>` : ''}
          <div><b data-count="${stations.length}">0</b><span>Station${stations.length === 1 ? '' : 's'} posted</span></div>
        </div>
        <div class="shop-skills">
          ${specs.length ? `<div class="eyebrow">Specialties</div><div class="skill-chips">${specs.map((x) => `<span class="skill">${esc(x)}</span>`).join('')}</div>` : (isMe ? '<p class="muted">Add your specialties in Edit profile: wheel builds, suspension, fits…</p>' : '')}
          ${(m.certs || []).length ? `<div class="eyebrow" style="margin-top:18px">Certifications</div><div class="skill-chips">${m.certs.map((x) => `<span class="skill cert">✓ ${esc(x)}</span>`).join('')}</div>` : ''}
        </div>
      </div>
      ${stations.length ? `<div class="eyebrow" style="margin:34px 0 14px">The stations</div><div class="station-row">${stations.map((r) => rcard(r)).join('')}</div>` : (isMe ? `<div class="empty" style="padding:30px 0"><b style="color:var(--d-text)">Show off your station</b><button type="button" class="pill pill-pop" style="margin-top:12px" data-act="compose" data-tab="rig">＋ Post your station</button></div>` : '')}
    </div></section>`;
  }
  function seasonEvents(a) {
    const now = Date.now(), end = now + 366 * DAY;
    const ev = (a.plan || []).map((p) => ({ name: p.name, date: p.date, pri: ['A', 'B', 'C'].includes(p.priority) ? p.priority : 'B', kind: p.kind === 'camp' ? 'camp' : 'race' }));
    racesBy(a.id).forEach((r) => { if (!ev.some((x) => x.name === r.name)) ev.push({ name: r.name, date: r.date, pri: 'A', kind: 'race', race: r.id }); });
    (a.goals || []).forEach((g) => { if (goalPct(g) < 1) ev.push({ name: g.title, date: g.due, pri: 'G', kind: 'goal' }); });
    return ev.filter((x) => x.date >= now - DAY && x.date <= end).sort((x, y) => x.date - y.date);
  }
  function resultsHTML(a, isMe, first) {
    const res = (a.results || []).slice().sort((x, y) => y.date - x.date).slice(0, 6);
    const next = seasonEvents(a).filter((x) => x.kind !== 'goal').slice(0, 4);
    if (!res.length && !next.length && !isMe) return '';
    const podiums = res.filter((r) => r.place <= 3).length;
    return `<section class="sec snow" id="s-results"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Race résumé</div><h2 class="h-sec">Results and what's next</h2>${res.length ? `<p class="lede">${res.length} recent result${res.length === 1 ? '' : 's'}${podiums ? `, ${podiums} podium${podiums === 1 ? '' : 's'}` : ''}.</p>` : ''}</div>${isMe ? '<button type="button" class="pill" data-act="addResult">＋ Add a result</button>' : ''}</div>
      <div class="two res-two">
        <div class="rv"><div class="eyebrow" style="margin-bottom:12px">Recent results</div>
          ${res.length ? `<div class="results">${res.map((r, i) => `<div class="result"><span class="place ${placeCls(r.place)}"><b>${placeTxt(r.place)}</b>${r.field ? `<small>of ${esc(r.field)}</small>` : ''}</span><div class="r-main"><b>${esc(r.event)}</b><span>${esc(fmtDate(r.date))}${r.cat ? ' · ' + esc(r.cat) : ''}${r.time ? ' · ' + esc(r.time) : ''}</span></div>${isMe ? `<button type="button" class="icon-btn" data-act="delResult" data-i="${i}" data-id="${esc(r.id || '')}" aria-label="Remove result">${xIcon}</button>` : ''}</div>`).join('')}</div>` : `<div class="empty"><b>${isMe ? 'Add your first result' : 'No results posted'}</b>${isMe ? 'Event, place and field size. Brands look here first.' : ''}</div>`}
        </div>
        <div class="rv d1"><div class="eyebrow" style="margin-bottom:12px">Next up</div>
          ${next.length ? `<div class="nextup">${next.map((x) => { const d = new Date(x.date); return `<div class="nx ${x.race ? 'clickable' : ''}" ${x.race ? `data-open-race="${esc(x.race)}" role="button" tabindex="0"` : ''}><div class="date-box"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div><div class="r-main"><b>${esc(x.name)}</b><span>${x.kind === 'camp' ? 'Training camp' : 'Race'} · in ${daysTo(x.date)} days</span></div><span class="pri pri-${x.pri}">${x.kind === 'camp' ? 'Camp' : x.pri + ' race'}</span></div>`; }).join('')}</div>` : `<div class="empty"><b>Nothing on the calendar</b>${isMe ? 'Tap “I’m in” on a race to add it.' : ''}</div>`}
        </div>
      </div>
    </div></section>`;
  }
  function seasonHTML(a, isMe) {
    const ev = seasonEvents(a);
    if (!ev.length && !isMe) return '';
    const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), 1);
    const months = Array.from({ length: 12 }, (_, i) => new Date(start.getFullYear(), start.getMonth() + i, 1));
    const col = (m, i) => {
      const nx = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const items = ev.filter((x) => x.date >= m.getTime() && x.date < nx.getTime());
      const nowPct = i === 0 ? ((now.getDate() - 1) / new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()) * 100 : -1;
      return `<div class="mo ${i === 0 ? 'cur' : ''}"><div class="mo-h">${MONTHS[m.getMonth()]}${m.getMonth() === 0 || i === 0 ? `<small>${m.getFullYear()}</small>` : ''}</div>
        <div class="mo-b">${nowPct >= 0 ? `<i class="today" style="left:${nowPct.toFixed(1)}%" title="Today"></i>` : ''}${items.map((x) => `<div class="ev pri-${x.pri}" title="${esc(x.name)} · ${esc(fmtDate(x.date))}"><b>${new Date(x.date).getDate()}</b><span>${esc(x.name)}</span></div>`).join('')}</div></div>`;
    };
    const aCount = ev.filter((x) => x.pri === 'A').length;
    return `<section class="sec dark" id="s-season"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">The next 12 months</div><h2 class="h-sec">Season calendar</h2><p class="lede">${ev.length ? `${ev.length} date${ev.length === 1 ? '' : 's'} planned${aCount ? `, ${aCount} A race${aCount === 1 ? '' : 's'}` : ''}. A races are the big targets.` : 'Join races and set goals to fill your year.'}</p></div>
        <div class="legend"><span class="pri pri-A">A race</span><span class="pri pri-B">B race</span><span class="pri pri-C">C race</span><span class="pri pri-G">Goal deadline</span></div></div>
    </div>
    <div class="season-scroll rv"><div class="season">${months.map(col).join('')}</div></div></section>`;
  }
  const songArt = (t) => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 360; return `linear-gradient(135deg, hsl(${h} 90% 62%), hsl(${(h + 70) % 360} 85% 45%))`; };
  function topFivesHTML(a, isMe, first) {
    const songs = (a.songs || []).map(normSong).filter(Boolean).slice(0, 5);
    const tr = (a.topRaces || []).filter((x) => x && x.name).slice(0, 5);
    if (!songs.length && !tr.length && !isMe) return '';
    return `<section class="sec" id="s-top5"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Get to know ${isMe ? 'you' : first}</div><h2 class="h-sec">Top 5s</h2></div>${isMe ? '<button type="button" class="pill" data-act="editProfile">Edit your top 5s</button>' : ''}</div>
      <div class="two top5">
        <div class="rv"><div class="eyebrow" style="margin-bottom:12px">On repeat</div>
          ${songs.length ? `<ol class="t5">${songs.map((x, i) => `<li><span class="n">${i + 1}</span>${x.art ? `<img class="art" src="${x.art}" alt="" loading="lazy">` : `<span class="art" style="background:${songArt(x.t + x.a)}" aria-hidden="true">♪</span>`}<div class="r-main"><b>${esc(x.t)}</b><span>${x.kind === 'album' ? 'Album · ' : ''}${esc(x.a)}</span></div><a class="t5-go" href="https://open.spotify.com/search/${encodeURIComponent(x.t + ' ' + x.a)}" target="_blank" rel="noopener noreferrer" aria-label="Play ${esc(x.t)} on Spotify">▶</a></li>`).join('')}</ol>` : `<div class="empty"><b>Add your top 5 songs</b>What's in your ears on the hard days.</div>`}
        </div>
        <div class="rv d1"><div class="eyebrow" style="margin-bottom:12px">Top 5 races</div>
          ${tr.length ? `<ol class="t5">${tr.map((r, i) => `<li><span class="n">${i + 1}</span><div class="r-main"><b>${esc(r.name)}</b><span>${esc(r.why || '')}</span></div><span class="pri ${r.status === 'done' ? 'pri-done' : 'pri-bucket'}">${r.status === 'done' ? 'Raced' + (r.year ? ' ' + esc(r.year) : '') : 'Bucket list'}</span></li>`).join('')}</ol>` : `<div class="empty"><b>Add your top 5 races</b>The ones you've done and the ones you're dreaming about.</div>`}
        </div>
      </div>
    </div></section>`;
  }
  function sponsorsHTML(a) {
    const list = (a.sponsorsDetail && a.sponsorsDetail.length) ? a.sponsorsDetail : (a.sponsors || []).map((n) => ({ name: n }));
    if (!list.length) return '';
    return `<div class="sponsors"><div class="eyebrow">Current sponsors</div><div class="sp-cards">${list.map((s) => `<div class="sp-card"><span class="sp-logo" aria-hidden="true">${esc(String(s.name).trim()[0] || '✦')}</span><div><b>${esc(s.name)}</b><span>${esc(s.kind || 'Sponsor')}${s.since ? ' · since ' + esc(s.since) : ''}</span></div></div>`).join('')}</div></div>`;
  }

  function goalHTML(g, isMe, i) {
    const pct = goalPct(g), days = Math.ceil((g.due - Date.now()) / DAY);
    return `<div class="goal rv d${(i % 3) + 1}"><div class="goal-top"><b>${pct >= 1 ? '🏆 ' : ''}${esc(g.title)}</b><span class="tag ${pct >= 1 ? 'pop' : ''}">${pct >= 1 ? 'Done' : days >= 0 ? days + 'd left' : 'Past due'}</span></div>
      <div class="goal-big">${esc(fmtGoal(g, g.current))} <small>/ ${esc(fmtGoal(g, g.target))}</small></div>
      <div class="bar"><i data-bar="${(pct * 100).toFixed(1)}"></i></div>
      <div class="goal-nums"><span>Started at ${esc(fmtGoal(g, g.start))}</span><span>${Math.round(pct * 100)}%</span></div>
      ${isMe ? `<form class="goal-edit" data-form="goal" data-id="${esc(g.id)}"><input name="v" type="number" step="any" value="${esc(g.current)}" aria-label="Update progress"><button class="pill pill-sm">Update</button><button type="button" class="icon-btn" data-act="deleteGoal" data-id="${esc(g.id)}" aria-label="Delete goal">${xIcon}</button></form>` : ''}</div>`;
  }

  const VIEWS = { home: viewHome, rigs: viewRigs, athletes: viewAthletes, scout: viewScout, journal: viewJournal, article: viewArticle, athlete: viewAthlete, team: viewTeam };
  const AFTER = {
    home() {
      setPart(ui.part);
      renderLiked(); renderLb(false); renderGoals(); renderRaces(); renderMarquee(); renderCmpTiles();
      videoOn = null;
      wireReel();
      wireCd3d();
      scrubs.push(heroScrub, lnavScrub);
    },
    rigs: renderRigGrid,
    athletes() {
      renderAthGrid();
      const q = $('#athQ');
      if (q) q.addEventListener('input', debounce(() => { ui.athQ = q.value; renderAthGrid(); }, 120));
    },
    scout() {
      renderScout();
      const r = $('#scMin');
      if (r) r.addEventListener('input', () => { ui.scMin = Number(r.value); $('#scMinLbl').textContent = fmtK(ui.scMin); renderScout(); });
    },
    journal: renderJournal,
    article() {
      scrubs.push(() => {
        const bar = $('#readProg'); if (!bar) return;
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.setProperty('--p', max > 0 ? clamp(window.scrollY / max, 0, 1).toFixed(4) : 0);
      });
    }
  };

  /* ----------------------------------------------------------- overlays */
  const stack = [];
  function openLayer(html, cls, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'layer-item';
    wrap.innerHTML = `<div class="scrim" data-act="close"></div><div class="modal ${cls || ''}" role="dialog" aria-modal="true" ${opts.label ? `aria-label="${esc(opts.label)}"` : ''} tabindex="-1">${opts.noX ? '' : `<button type="button" class="icon-btn modal-x" data-act="close" aria-label="Close">${xIcon}</button>`}${html}</div>`;
    $('#layer').appendChild(wrap);
    stack.push({ el: wrap, focus: document.activeElement });
    document.documentElement.style.overflow = 'hidden';
    const m = $('.modal', wrap);
    const f = opts.focus ? $(opts.focus, m) : m;
    (f || m).focus({ preventScroll: true });
    return m;
  }
  function closeTop() {
    const it = stack.pop();
    if (!it) return false;
    it.el.classList.add('closing');
    setTimeout(() => it.el.remove(), reduceMotion ? 0 : 200);
    if (!stack.length) document.documentElement.style.overflow = '';
    if (it.focus && it.focus.isConnected) it.focus.focus({ preventScroll: true });
    if (!stack.length && /^#\/(rig|race)\//.test(location.hash)) history.replaceState(null, '', curHash);
    return true;
  }
  function closeAll() {
    while (stack.length) stack.pop().el.remove();
    $('#layer').innerHTML = '';
    document.documentElement.style.overflow = '';
  }
  const topModal = () => stack.length ? $('.modal', stack[stack.length - 1].el) : null;

  function rigDetailHTML(r) {
    const a = athlete(r.athleteId) || { name: '?', id: '', hue: 140 };
    const cm = commentsOf(r.id);
    const specs = (r.specs || []).filter((s) => s && (s[0] || s[1]));
    return `<div class="rig-detail">
      <div class="art-wrap">${rigArt(r, 'd')}</div>
      <div class="rig-side">
        <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="tag">${esc(r.sport)}</span><span class="tag dark">${r.type === 'Kit' ? 'Gear' : esc(r.type)}</span><span class="tag">${ago(r.createdAt) === 'now' ? 'just now' : ago(r.createdAt) + ' ago'}</span></div>
        <h2>${serifLast(r.title)}</h2>
        <div class="rig-by">${av(a, 38)}<div class="t"><b><button type="button" data-open-ath="${a.id}">${esc(a.name)}</button></b><span>@${esc(a.handle || '')} · ${esc(a.city || '')}</span></div>${a.id ? followBtn(a) : ''}</div>
        ${r.caption ? `<p class="cap">${esc(r.caption)}</p>` : ''}
        ${specs.length ? `<dl class="specs">${specs.map((s) => `<dt>${esc(s[0])}</dt><dd>${esc(s[1])}</dd>`).join('')}</dl>` : ''}
        <div class="eyebrow" id="cmCount">${cm.length} comment${cm.length === 1 ? '' : 's'}</div>
        <div class="comments" id="cmList">${cm.map(commentHTML).join('') || '<span class="muted">Be the first to say something nice.</span>'}</div>
        <form class="comment-form" data-form="comment" data-id="${r.id}"><input name="t" maxlength="240" placeholder="${claimed() ? 'Add a comment…' : 'Claim your profile to comment'}" aria-label="Comment" autocomplete="off">${likeBtn(r)}</form>
        <div style="display:flex;gap:8px"><button type="button" class="pill pill-line pill-xs" data-act="copyLink" data-link="#/rig/${esc(r.id)}">Copy link</button>${r.athleteId === 'me' ? `<button type="button" class="pill pill-line pill-xs" data-act="deleteRig" data-id="${esc(r.id)}" style="color:var(--red)">Delete</button>` : ''}</div>
      </div></div>`;
  }
  function commentHTML(c) {
    const a = athlete(c.by) || { name: 'Someone', hue: 140 };
    return `<div class="comment">${av(a, 26)}<p><b>${esc(a.name.split(' ')[0])}</b>${esc(c.text)}</p></div>`;
  }
  function openRig(id) { const r = rig(id); if (r) openLayer(rigDetailHTML(r), '', { label: r.title }); }
  function openRace(id) {
    const r = race(id); if (!r) return;
    const g = going(r);
    openLayer(`<div class="modal-head"><div><div class="eyebrow">${esc(r.sport)} · ${new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</div><h2>${esc(r.name)}</h2></div></div>
      <div class="modal-body race-modal"><div class="form">
        <div class="muted">${esc(r.city)} · ${esc(r.distance)}</div>
        <div class="dark" style="border-radius:22px">${raceCard(r, true).replace(' data-open-race="' + r.id + '" role="button" tabindex="0"', '')}</div>
        <div class="eyebrow">Racing it · ${g.length} on ${BRAND}</div>
        <div class="ppl">${g.map((aid) => { const a = athlete(aid); return a ? `<div class="ppl-row" data-open-ath="${a.id}" role="button" tabindex="0">${av(a, 34)}<span><b>${esc(a.name)}</b><span>${esc(a.sport)} · ${esc(a.city || '')}</span></span>${followBtn(a)}</div>` : ''; }).join('') || '<span class="muted">Nobody yet. Be first.</span>'}</div>
        <div><button type="button" class="pill pill-line pill-xs" data-act="copyLink" data-link="#/race/${esc(r.id)}">Copy link</button></div>
      </div></div>`, 'sm', { label: r.name });
  }

  /* composer */
  const ART_FOR = { Road: 'road', Gravel: 'gravel', MTB: 'mtb', Track: 'track', Cyclocross: 'gravel', BMX: 'bmx', Fixed: 'track' };
  function openComposer(tab) {
    if (!claimed()) { openEditor(true, tab || ui.composeTab || 'rig'); return; }
    ui.composeTab = tab || ui.composeTab || 'rig';
    const m = openLayer(`<div class="modal-head"><h2>New post</h2></div><div class="modal-body"><div class="seg">${[['rig', '📸 Rig'], ['post', '✍️ Story'], ['goal', '🎯 Goal'], ['race', '🏁 Race']].map(([k, l]) => `<button type="button" data-act="composeTab" data-tab="${k}" class="${ui.composeTab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="composeBody" style="margin-top:16px">${composeForm(ui.composeTab)}</div></div>`, 'sm', { label: 'New post' });
    wireDrops(m);
  }
  const sportOpts = (sel) => SPORTS.map((s) => `<option ${s === sel ? 'selected' : ''}>${s}</option>`).join('');
  const dropHTML = (label) => `<label class="drop"><input type="file" name="photo" accept="image/*"><span class="hint"><b>${label}</b><span>Drop a photo or tap to choose · JPG / PNG</span></span></label>`;
  function composeForm(t) {
    const sp = U.me.sport || 'Road';
    const in30 = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10);
    const foot = (label) => `<div class="form-foot"><button type="button" class="pill pill-line" data-act="close">Cancel</button><button class="pill">${label}</button></div>`;
    if (t === 'post') return `<form class="form" data-form="post">${dropHTML('Cover photo (optional)')}<label class="field"><span>Title</span><input name="title" required maxlength="90" placeholder="What I learned from my first century"></label><label class="field"><span>Sport</span><select name="sport">${sportOpts(sp)}</select></label><label class="field"><span>Story</span><textarea name="body" required rows="8" maxlength="12000" placeholder="Write it like you'd tell a friend. Leave a blank line between paragraphs."></textarea></label>${foot('Publish')}</form>`;
    if (t === 'goal') return `<form class="form" data-form="newgoal"><label class="field"><span>Goal</span><input name="title" required maxlength="80" placeholder="Everest Challenge · 40 km TT under 55 min · Top 10 at a crit"></label><div class="form-2"><label class="field"><span>Where you are now</span><input name="current" type="number" step="any" required placeholder="245"></label><label class="field"><span>Target</span><input name="target" type="number" step="any" required placeholder="300"></label></div><div class="form-2"><label class="field"><span>Unit</span><select name="unit"><option value="lb">lb</option><option value="kg">kg</option><option value="km">km</option><option value="mi">mi</option><option value="m">m (elevation)</option><option value="min">minutes (time)</option><option value="W">watts</option><option value="place">race place</option><option value="days">days</option><option value="%">percent</option></select></label><label class="field"><span>Deadline</span><input name="due" type="date" required value="${in30}"></label></div><label class="switch">Lower is better (times, race places)<input type="checkbox" name="lower"><span class="knob"></span></label>${foot('Set goal')}</form>`;
    if (t === 'race') return `<form class="form" data-form="race"><label class="field"><span>Race or event</span><input name="name" required maxlength="80" placeholder="Twin Peaks Hill Climb"></label><div class="form-2"><label class="field"><span>Sport</span><select name="sport">${sportOpts(sp)}</select></label><label class="field"><span>Date</span><input name="date" type="date" required value="${in30}"></label></div><div class="form-2"><label class="field"><span>City</span><input name="city" maxlength="60" placeholder="San Francisco, CA"></label><label class="field"><span>Distance / format</span><input name="distance" maxlength="40" placeholder="Half marathon"></label></div>${foot('Add race')}</form>`;
    return `<form class="form" data-form="rig">${dropHTML('Add your photo')}<label class="field"><span>Name it</span><input name="title" required maxlength="60" placeholder="Dirt Road Daily"></label><div class="form-2"><label class="field"><span>Sport</span><select name="sport">${sportOpts(sp)}</select></label><label class="field"><span>Type</span><select name="type"><option value="Bike">Bike</option><option value="Workstation">Workstation</option><option value="Kit">Gear</option></select></label></div><label class="field"><span>Caption</span><input name="caption" maxlength="200" placeholder="What makes it yours?"></label><label class="field"><span>Build sheet</span><textarea name="specs" rows="4" maxlength="2000" placeholder="Frame: Steel, 56 cm&#10;Wheels: Carbon, 45 mm&#10;Tires: 32 mm tubeless"></textarea><small>One part per line, like “Part: details”.</small></label>${foot('Post rig')}</form>`;
  }

  function openEditor(claimFirst, thenTab) {
    const m = U.me, s = m.socials || {};
    const isNew = !claimed();
    const disc = Array.isArray(m.disciplines) && m.disciplines.length ? m.disciplines : (claimed() ? [m.sport] : []);
    const songs = (m.songs || []).map(normSong).filter(Boolean).slice(0, 5);
    const ROLES = [['rider', '🚴', 'Rider', 'I race, ride and chase goals'], ['mechanic', '🔧', 'Mechanic', 'I wrench, build and keep bikes rolling'], ['both', '🚴🔧', 'Rider + Mechanic', 'Both, depending on the day']];
    const photo = safeImg(m.photo);
    const preview = photo ? `<img src="${photo}" alt="">` : (AV ? stageInner(m.avatar || DEFAULT_AV, 'Your avatar') : '');
    const step = (n, title, sub, body, opt) => `<section class="ed-step"><div class="ed-step-h"><span class="ed-n">${n}</span><div><h3>${title}${opt ? ' <em>optional</em>' : ''}</h3>${sub ? `<p>${sub}</p>` : ''}</div></div>${body}</section>`;
    let n = 0;
    const html = `<div class="ed-hero">
        <div class="ed-hero-av ${photo ? 'is-photo' : ''}" id="edAv">${preview}</div>
        <div class="ed-hero-t"><div class="eyebrow">${isNew ? 'Welcome to COOLDOWN' : 'Your profile'}</div><h2>${isNew ? 'Make it yours' : 'Edit your profile'}</h2>
          <p>${isNew ? 'Two minutes. Brands, teams and riders will see this first.' : 'Keep it fresh. Brands look here first.'}</p>
          <div class="ed-hero-btns">
            <label class="pill pill-sm ed-photo-btn">📷 ${photo ? 'Change photo' : 'Upload a photo'}<input type="file" accept="image/*" id="edPhoto" aria-label="Upload a profile photo"></label>
            ${AV ? '<button type="button" class="pill pill-sm pill-line on-dark" data-act="avatarMaker">✦ Customize avatar</button>' : ''}
            ${AV ? `<button type="button" class="pill pill-sm pill-line on-dark" id="edUseAv"${photo ? '' : ' hidden'}>Use avatar instead</button>` : ''}
          </div></div>
      </div>
      <div class="modal-body ed-body">
      <form class="form" data-form="profile" data-then="${esc(thenTab || '')}">
        <input type="hidden" name="photoAction" value="">
        ${step(++n, 'You', '', `<div class="form-2"><label class="field"><span>Name</span><input name="name" required maxlength="40" value="${esc(m.name)}" placeholder="Your name"></label><label class="field"><span>Handle</span><input name="handle" required maxlength="31" pattern="@?[A-Za-z0-9._]{2,30}" value="${esc(m.handle)}" placeholder="@yourname"></label></div>
          <div class="form-2"><label class="field"><span>City</span><input name="city" maxlength="50" value="${esc(m.city)}" placeholder="San Francisco, CA"></label><label class="field"><span>One-line bio</span><input name="bio" maxlength="140" value="${esc(m.bio)}" placeholder="Gravel racer, coffee snob…"></label></div>`)}
        ${step(++n, 'What you do', '', `<div class="role-cards">${ROLES.map(([k, ic, l, sub]) => `<label class="role-card"><input type="radio" name="role" value="${k}" ${(m.role || 'rider') === k ? 'checked' : ''}><span class="rc-in"><span class="rc-ic" aria-hidden="true">${ic}</span><b>${l}</b><small>${sub}</small></span></label>`).join('')}</div>`)}
        ${step(++n, 'Disciplines', 'Pick every one you ride.', `<div class="disc-pick">${SPORTS.map((d) => `<label class="disc-opt"><input type="checkbox" name="disc" value="${d}" ${disc.includes(d) ? 'checked' : ''}><span>${(SPORT_INFO[d] || {}).icon || ''} ${d}</span></label>`).join('')}</div>`)}
        ${step(++n, 'Team and sponsors', 'Already riding for someone? Show it.', `<label class="field"><span>Your team</span><select name="team" id="edTeam"><option value="">No team (yet)</option>${teams().map((t) => `<option value="${esc(t.id)}" ${m.team === t.id ? 'selected' : ''}>${esc(t.name)} · ${esc(t.city || '')}</option>`).join('')}<option value="__new">＋ Start a new team</option></select></label>
          <div class="new-team" id="edNewTeam" hidden><div class="form-2"><label class="field"><span>Team name</span><input name="newTeam" maxlength="40" placeholder="Mission Street Wheelers"></label><label class="field"><span>Team color</span><select name="newTeamColor">${[['#2e6ff2', 'Cobalt'], ['#d7ff3a', 'Neon'], ['#ff4fa3', 'Hot pink'], ['#ff7a1a', 'Orange'], ['#3fe0a5', 'Mint'], ['#e5332a', 'Red'], ['#15161a', 'Black']].map(([c, l]) => `<option value="${c}">${l}</option>`).join('')}</select></label></div></div>
          <label class="field"><span>Sponsors</span><input name="sponsors" maxlength="160" value="${esc((m.sponsors || []).join(', '))}" placeholder="Fogline Coffee, Local Bike Shop"><small>Separate with commas. Leave empty if you're not sponsored yet.</small></label>`)}
        ${step(++n, 'Your shop', 'Where you work, or the shop you ride out of.', `<div class="form-2"><label class="field"><span>Shop name</span><input name="shop" maxlength="50" value="${esc(m.shop || '')}" placeholder="Fruitvale Cycle Works"></label><label class="field"><span>Specialties (mechanics)</span><input name="specialties" maxlength="160" value="${esc((m.specialties || []).join(', '))}" placeholder="Wheel builds, suspension, fits"></label></div>`, true)}
        ${step(++n, 'On repeat', 'Search and tap to add up to 5 songs or albums.', `<div class="music">
          <div class="music-bar"><input type="search" id="musicQ" placeholder="Search songs or albums" autocomplete="off" aria-label="Search music"><div class="seg music-kind"><button type="button" class="on" data-mk="song">Songs</button><button type="button" data-mk="album">Albums</button></div></div>
          <div class="music-res" id="musicRes" aria-live="polite"></div>
          <ol class="music-picked" id="musicPicked"></ol>
          <input type="hidden" name="music" id="musicVal" value="${esc(JSON.stringify(songs))}">
        </div>`, true)}
        ${claimed() ? step(++n, 'Top 5 races', 'The ones you’ve done and the ones you dream about.', [0, 1, 2, 3, 4].map((i) => { const x = (m.topRaces || [])[i] || {}; return `<div class="form-2 t5-row"><label class="field"><span>${i + 1}. Race</span><input name="race${i}" maxlength="60" value="${esc(x.name || '')}" placeholder="${['Unbound Gravel 200', 'Leadville 100', 'Paris–Roubaix Challenge', 'Grinduro', 'Your local crit'][i]}"></label><label class="field"><span>Raced it or bucket list?</span><select name="rstat${i}"><option value="bucket" ${x.status !== 'done' ? 'selected' : ''}>Bucket list</option><option value="done" ${x.status === 'done' ? 'selected' : ''}>Raced it</option></select></label></div>`; }).join(''), true) : ''}
        ${claimed() ? step(++n, 'Links', '', `<div class="form-2"><label class="field"><span>Strava profile URL</span><input name="strava" type="url" value="${esc(s.strava || '')}" placeholder="https://www.strava.com/athletes/…"></label><label class="field"><span>Instagram handle</span><input name="instagram" value="${esc(s.instagram || '')}" placeholder="@you"></label></div>
          <div class="form-2"><label class="field"><span>YouTube URL</span><input name="youtube" type="url" value="${esc(s.youtube || '')}" placeholder="https://youtube.com/@…"></label><label class="field"><span>TikTok handle</span><input name="tiktok" value="${esc(s.tiktok || '')}" placeholder="@you"></label></div>
          <div class="form-2"><label class="field"><span>Spotify profile URL</span><input name="spotify" type="url" value="${esc(s.spotify || '')}" placeholder="https://open.spotify.com/user/…"></label><label class="field"><span>Website</span><input name="website" type="url" value="${esc(s.website || '')}" placeholder="https://…"></label></div>`, true) : ''}
        ${claimed() ? step(++n, 'Sponsorship', '', `<label class="switch">Open to sponsors<input type="checkbox" name="open" ${m.openToSponsors ? 'checked' : ''}><span class="knob"></span></label>
          <label class="field"><span>Your pitch</span><textarea name="pitch" rows="3" maxlength="400" placeholder="Who follows you, what you post, and what you can offer a brand.">${esc(m.pitch)}</textarea></label>
          <label class="field"><span>Sponsor contact email</span><input name="contact" type="email" value="${esc(m.contact)}" placeholder="you@email.com"><small>Only used for the “Contact for sponsorship” button on your pitch.</small></label>`) : '<input type="hidden" name="open" value="on">'}
        <div class="form-foot ed-foot"><button type="button" class="pill pill-line" data-act="close">Cancel</button><button class="pill pill-pop ed-go">${isNew ? '✦ Create my profile' : 'Save changes'}</button></div>
      </form></div>`;
    const md = openLayer(html, 'ed-modal', { label: isNew ? 'Set up your profile' : 'Edit profile', focus: 'input[name=name]' });
    wireEditor(md);
  }
  function wireEditor(md) {
    // photo upload / back to avatar
    const f = $('form[data-form=profile]', md), avBox = $('#edAv', md);
    const showAv = (cfg) => { avBox.classList.remove('is-photo'); setFigure(avBox, cfg || U.me.avatar || DEFAULT_AV, 'Your avatar'); };
    if (!avBox.classList.contains('is-photo')) showAv();
    const pa = $('input[name=photoAction]', f), useAv = $('#edUseAv', md);
    $('#edPhoto', md).addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      try { const data = await readImage(file); f.dataset.photo = data; pa.value = 'set'; dropFigure(avBox); avBox.innerHTML = `<img src="${data}" alt="">`; avBox.classList.add('is-photo'); if (useAv) useAv.hidden = false; }
      catch (err) { toast(esc(err.message)); }
      e.target.value = ''; // so picking the same picture again still works
    });
    if (useAv) useAv.addEventListener('click', () => { pa.value = 'clear'; delete f.dataset.photo; showAv(); useAv.hidden = true; });
    // team: start a new one
    const tSel = $('#edTeam', md), nt = $('#edNewTeam', md);
    tSel.addEventListener('change', () => { nt.hidden = tSel.value !== '__new'; if (!nt.hidden) $('input[name=newTeam]', nt).focus(); });
    // music search (Apple's public catalog search; each pick opens in Spotify)
    const q = $('#musicQ', md), res = $('#musicRes', md), picked = $('#musicPicked', md), val = $('#musicVal', md);
    let kind = 'song', list = [];
    try { list = JSON.parse(val.value || '[]').map(normSong).filter(Boolean); } catch (_) { list = []; }
    const paint = () => {
      val.value = JSON.stringify(list);
      picked.innerHTML = list.map((x, i) => `<li><span class="mp-n">${i + 1}</span>${x.art ? `<img src="${x.art}" alt="">` : `<span class="mp-art" style="background:${songArt(x.t + x.a)}">♪</span>`}<div class="r-main"><b>${esc(x.t)}</b><span>${x.kind === 'album' ? 'Album · ' : ''}${esc(x.a)}</span></div><button type="button" class="icon-btn" data-mp-del="${i}" aria-label="Remove ${esc(x.t)}">${xIcon}</button></li>`).join('');
      if (list.length >= 5) res.innerHTML = '<p class="muted mp-full">That’s your top 5. Remove one to add another.</p>'
      else if (res.querySelector('.mp-full')) res.innerHTML = '';
    };
    picked.addEventListener('click', (e) => { const b = e.target.closest('[data-mp-del]'); if (b) { list.splice(Number(b.dataset.mpDel), 1); paint(); } });
    let found = [], timer = 0, seq = 0;
    const showRes = (msg) => {
      if (list.length >= 5) return;
      res.innerHTML = msg || (found.length ? found.map((x, i) => `<button type="button" class="mr" data-mr="${i}">${x.art ? `<img src="${x.art}" alt="">` : `<span class="mp-art" style="background:${songArt(x.t + x.a)}">♪</span>`}<span class="r-main"><b>${esc(x.t)}</b><span>${esc(x.a)}</span></span><span class="mr-add">＋</span></button>`).join('') : '');
    };
    async function search() {
      const term = q.value.trim(); const my = ++seq;
      if (term.length < 2) { found = []; showRes(''); return; }
      showRes('<p class="muted">Searching…</p>');
      try {
        const r = await fetch(`https://itunes.apple.com/search?media=music&limit=6&entity=${kind === 'album' ? 'album' : 'song'}&term=${encodeURIComponent(term)}`);
        const j = await r.json(); if (my !== seq) return;
        found = (j.results || []).map((x) => ({ t: kind === 'album' ? x.collectionName : x.trackName, a: x.artistName || '', art: safeArt(String(x.artworkUrl100 || '')), kind })).filter((x) => x.t);
        showRes(found.length ? '' : `<p class="muted">No matches. <button type="button" class="link" data-mr-manual>Add “${esc(term)}” anyway</button></p>`);
      } catch (_) {
        if (my !== seq) return;
        found = [];
        showRes(`<p class="muted">Search isn’t reachable right now. <button type="button" class="link" data-mr-manual>Add “${esc(term)}” as typed</button></p>`);
      }
    }
    q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 280); });
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); search(); } });
    res.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mr]'), m = e.target.closest('[data-mr-manual]');
      if (list.length >= 5) return;
      if (b) { const x = found[Number(b.dataset.mr)]; if (x && !list.some((y) => y.t === x.t && y.a === x.a)) list.push(x); }
      else if (m) { const parts = q.value.split(/\s+[-–—]\s+/); list.push({ t: parts[0].trim().slice(0, 60), a: (parts[1] || '').trim().slice(0, 60), art: '', kind }); }
      else return;
      q.value = ''; found = []; showRes(''); paint(); q.focus();
    });
    $$('[data-mk]', md).forEach((b) => b.addEventListener('click', () => { kind = b.dataset.mk; $$('[data-mk]', md).forEach((x) => x.classList.toggle('on', x === b)); q.placeholder = kind === 'album' ? 'Search albums' : 'Search songs'; search(); }));
    paint();
  }

  /* ---------------------------------------------------------- avatar maker */
  function openAvatarMaker() {
    if (!AV) return;
    let cfg = AV.clean(U.me.avatar || DEFAULT_AV);
    const L = AV.LABEL;
    const sw = (key, cols, cur) => `<div class="sw-row">${cols.map((c) => `<button type="button" class="sw ${cur === c ? 'on' : ''}" data-am="${key}" data-v="${c}" style="background:${c}" aria-label="${key} color ${c}" aria-pressed="${cur === c}"></button>`).join('')}</div>`;
    const chips = (key, list, cur) => `<div class="am-chips">${list.map((x) => `<button type="button" class="chip ${cur === x ? 'on' : ''}" data-am="${key}" data-v="${x}" aria-pressed="${cur === x}">${esc(L[x] || x)}</button>`).join('')}</div>`;
    const grp = (title, body) => `<div class="am-grp"><div class="am-t">${title}</div>${body}</div>`;
    const controls = () => {
      const k = AV.kit(cfg.sport);
      const patOK = ['jersey', 'singlet', 'tee', 'trisuit'].includes(cfg.top);
      return grp('Discipline', `<div class="am-chips">${Object.keys(AV.KITS).map((x) => `<button type="button" class="chip ${cfg.sport === x ? 'on' : ''}" data-am="sport" data-v="${x}" aria-pressed="${cfg.sport === x}">${x === 'Shop' ? '🔧 ' : ''}${esc(AV.SPORT_LABEL[x] || x)}</button>`).join('')}</div>`)
        + grp('Skin tone', sw('skin', AV.SKIN, cfg.skin))
        + grp('Hair', chips('hair', AV.HAIRS, cfg.hair) + (cfg.hair !== 'bald' || cfg.facial !== 'none' ? sw('hairColor', AV.HAIR, cfg.hairColor) : ''))
        + grp('Face', chips('face', AV.FACES, cfg.face) + chips('facial', AV.FACIAL, cfg.facial))
        + grp('Pose', chips('pose', AV.POSES, cfg.pose))
        + grp('On your head', chips('head', k.head, cfg.head) + (cfg.head !== 'none' ? sw('headColor', AV.KIT, cfg.headColor) : ''))
        + grp('Eyewear', chips('eyes', k.eyes, cfg.eyes) + (cfg.eyes !== 'none' ? `<div class="sw-row">${AV.LENS.map((l) => `<button type="button" class="sw lens ${cfg.lens === l ? 'on' : ''}" data-am="lens" data-v="${l}" style="background:linear-gradient(135deg,${AV.LENS_COLORS[l][0]},${AV.LENS_COLORS[l][1]})" aria-label="${l} lenses" aria-pressed="${cfg.lens === l}"></button>`).join('')}</div>` : ''))
        + grp(L[cfg.top] || 'Top', (k.top.length > 1 ? chips('top', k.top, cfg.top) : '') + '<div class="am-sub">Main color</div>' + sw('topColor', AV.KIT, cfg.topColor) + (patOK || cfg.top === 'hoodie' || cfg.top === 'jacket' ? '<div class="am-sub">Second color</div>' + sw('topColor2', AV.KIT, cfg.topColor2) : '') + (patOK ? chips('pattern', AV.PATTERNS, cfg.pattern) : ''))
        + (cfg.bottom !== 'trisuit' ? grp(L[cfg.bottom] || 'Bottoms', (k.bottom.length > 1 ? chips('bottom', k.bottom, cfg.bottom) : '') + sw('bottomColor', AV.KIT, cfg.bottomColor)) : '')
        + grp('Shoes and socks', '<div class="am-sub">Shoes</div>' + sw('shoes', ['#f4f5f7', '#15161a', '#d7ff3a', '#ff4fa3', '#2e6ff2', '#ff7a1a', '#3fe0a5'], cfg.shoes) + (['Skiing', 'Snowboard'].includes(cfg.sport) ? '' : '<div class="am-sub">Socks</div>' + sw('socks', ['#f4f5f7', '#15161a', '#d7ff3a', '#ff4fa3', '#2e6ff2', '#ff7a1a', '#7a4dff'], cfg.socks)))
        + grp('Extras', `<div class="am-chips">${k.extras.map((x) => `<button type="button" class="chip ${cfg.extras.includes(x) ? 'on' : ''}" data-am-toggle="${x}" aria-pressed="${cfg.extras.includes(x)}">${cfg.extras.includes(x) ? '✓ ' : '＋ '}${esc(L[x] || x)}</button>`).join('')}</div>${cfg.extras.includes('bib') ? `<label class="field am-num"><span>Race number</span><input data-am-num inputmode="numeric" maxlength="3" value="${esc(cfg.number)}"></label>` : ''}`)
        + grp('Holding', chips('prop', k.prop, cfg.prop));
    };
    const md = openLayer(`<div class="modal-head"><h2>Build your avatar</h2></div>
      <div class="modal-body am"><div class="am-left"><div class="av-stage am-stage" data-av-stage tabindex="0" role="img" aria-label="Your avatar preview. Drag to spin it, tap to make it wave."></div><div class="av-hint dark-hint">Drag to spin · tap to wave</div><button type="button" class="pill pill-line pill-sm" data-am-rand>🎲 Surprise me</button></div><div class="am-ctrl" id="amCtrl"></div></div>
      <div class="am-foot"><button type="button" class="pill pill-line" data-act="close">Cancel</button><button type="button" class="pill pill-pop" data-am-save>Save avatar</button></div>`, 'am-modal', { label: 'Build your avatar' });
    const stage = $('.am-stage', md), ctrl = $('#amCtrl', md);
    const draw = (all) => {
      setFigure(stage, cfg, 'Your avatar');
      if (all) { const y = ctrl.scrollTop; ctrl.innerHTML = controls(); ctrl.scrollTop = y; }
    };
    draw(true);
    wireStages(md);
    md.addEventListener('click', (e) => {
      const b = e.target.closest('[data-am],[data-am-toggle],[data-am-rand],[data-am-save]');
      if (!b) return;
      if (b.hasAttribute('data-am-save')) {
        U.me.avatar = cfg;
        if (!save()) return;
        paintMe(); closeTop();
        const ed = topModal(); if (ed) { const box = $('#edAv', ed); if (box && !box.classList.contains('is-photo')) setFigure(box, cfg, 'Your avatar'); }
        if (!stack.length) rerender();
        return toast('Avatar saved ✦');
      }
      if (b.hasAttribute('data-am-rand')) { cfg = AV.random(cfg.sport, Math.random()); draw(true); return pop(); }
      if (b.dataset.amToggle) { const x = b.dataset.amToggle; cfg.extras = cfg.extras.includes(x) ? cfg.extras.filter((y) => y !== x) : cfg.extras.concat([x]); }
      else {
        const key = b.dataset.am, val = b.dataset.v;
        cfg[key] = val;
        if (key === 'sport') { const k = AV.kit(val); cfg.head = k.head[0]; cfg.eyes = k.eyes[0]; cfg.top = k.top[0]; cfg.bottom = k.bottom[0]; cfg.extras = []; cfg.prop = k.prop[0]; }
      }
      cfg = AV.clean(cfg);
      draw(true);
      pop();
    });
    md.addEventListener('input', (e) => { if (e.target.matches('[data-am-num]')) { cfg.number = e.target.value; cfg = AV.clean(cfg); draw(false); } });
    function pop() { if (stage._fig) return stage._fig.wave(); if (reduceMotion) return; stage.classList.remove('wave'); void stage.offsetWidth; stage.classList.add('wave'); clearTimeout(pop.t); pop.t = setTimeout(() => stage.classList.remove('wave'), 1300); }
  }
  function dropFigure(el) { if (el._fig) { el._fig.dispose(); el._fig = null; el.classList.remove('is3d'); } }
  // put a live 3D figure in el (or update the one already there); flat 2D if 3D isn't possible
  function setFigure(el, cfg, label) {
    if (el._fig) { el._fig.update(cfg); return; }
    const a3 = A3();
    if (a3) {
      el.dataset.avCfg = JSON.stringify(AV.clean(cfg));
      const fig = a3.mount(el, AV.clean(cfg));
      if (fig) { el._fig = fig; el.classList.add('is3d'); return; }
    }
    el.innerHTML = stageInner(cfg, label);
  }
  // avatars you can grab: drag to spin, tap to wave and hop
  function wireStages(root) {
    $$('[data-av-stage]', root).forEach((st) => {
      if (st.dataset.wired) return;
      if (st.dataset.avCfg && A3() && !st._fig) {
        try { setFigure(st, JSON.parse(st.dataset.avCfg)); } catch (_) {}
      }
      if (st._fig) {
        st.dataset.wired = '1';
        st.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); st._fig.wave(); } });
        return;
      }
      st.dataset.wired = '1';
      let drag = null, rot = 0;
      const set = () => { st.style.setProperty('--ry', rot.toFixed(1) + 'deg'); };
      const wave = () => { if (reduceMotion) return; st.classList.remove('wave'); void st.offsetWidth; st.classList.add('wave'); clearTimeout(st._t); st._t = setTimeout(() => st.classList.remove('wave'), 1300); };
      st.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; drag = { x: e.clientX, r: rot, moved: false, id: e.pointerId }; st.classList.add('grab'); });
      st.addEventListener('pointermove', (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.x;
        if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; try { st.setPointerCapture(e.pointerId); } catch (_) {} }
        if (drag.moved) { rot = clamp(drag.r + dx * 0.7, -70, 70); set(); }
      });
      const up = (e) => { if (!drag || drag.id !== e.pointerId) return; const moved = drag.moved; drag = null; st.classList.remove('grab'); rot = 0; set(); if (!moved && e.type === 'pointerup') wave(); };
      st.addEventListener('pointerup', up);
      st.addEventListener('pointercancel', up);
      st.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wave(); } });
      if (finePointer) st.addEventListener('mouseenter', wave);
    });
  }

  function openPalette() {
    if (stack.some((s) => s.el.querySelector('.palette'))) return;
    const m = openLayer(`<div class="pal-input">${searchIcon}<input id="palQ" placeholder="Search athletes, rigs, races, stories…" aria-label="Search" autocomplete="off"><kbd>esc</kbd></div><div class="pal-list" id="palList" role="listbox"></div>`, 'palette', { label: 'Search', focus: '#palQ', noX: true });
    const q = $('#palQ', m);
    let sel = 0, results = [];
    const draw = () => {
      const t = q.value.trim().toLowerCase().replace(/^@/, '');
      const hit = (s) => !t || s.toLowerCase().includes(t);
      const cap = t ? 6 : 4;
      const groups = [];
      const pagesG = [['Home', '#/'], ['Rigs', '#/rigs'], ['Athletes', '#/athletes'], ['Scout', '#/scout'], ['Journal', '#/journal']].map(([l, h]) => ({ label: l, sub: 'Go to', icon: '↗', run: () => go(h) })).filter((x) => hit(x.label));
      const acts = [['Post a rig', 'rig', '📸'], ['Write a story', 'post', '✍️'], ['Set a season goal', 'goal', '🎯'], ['Add a race', 'race', '🏁']].map(([l, tab, i]) => ({ label: l, sub: 'Action', icon: i, run: () => openComposer(tab) }))
        .concat([{ label: claimed() ? 'Edit profile' : 'Claim your profile', sub: 'Action', icon: '✦', run: () => openEditor() }]).filter((x) => hit(x.label));
      const ath = athletes().filter((a) => hit(a.name + ' ' + a.handle + ' ' + a.sport + ' ' + a.city)).slice(0, cap).map((a) => ({ label: a.name, sub: '@' + a.handle, av: a, run: () => go('#/athlete/' + a.id) }));
      const rg = t ? rigs().filter((r) => hit(r.title + ' ' + r.sport + ' ' + r.type)).slice(0, cap).map((r) => ({ label: r.title, sub: r.sport + ' · ' + (r.type === 'Kit' ? 'Gear' : r.type), icon: '📸', run: () => openRig(r.id) })) : [];
      const rc = t ? races().filter((r) => hit(r.name + ' ' + r.city + ' ' + r.sport)).slice(0, cap).map((r) => ({ label: r.name, sub: fmtDate(r.date), icon: '🏁', run: () => openRace(r.id) })) : [];
      const ps = t ? posts().filter((p) => hit(p.title + ' ' + p.body)).slice(0, cap).map((p) => ({ label: p.title, sub: 'Journal', icon: '✍️', run: () => go('#/journal/' + p.id) })) : [];
      [['Pages', pagesG], ['Actions', acts], ['Athletes', ath], ['Rigs', rg], ['Races', rc], ['Journal', ps]].forEach((g) => { if (g[1].length) groups.push(g); });
      results = groups.flatMap((g) => g[1]);
      sel = clamp(sel, 0, Math.max(0, results.length - 1));
      let i = 0;
      $('#palList', m).innerHTML = groups.length ? groups.map(([g, items]) => `<div class="pal-group">${g}</div>${items.map((x) => { const k = i++; return `<button type="button" class="pal-item ${k === sel ? 'on' : ''}" data-pal="${k}" role="option" aria-selected="${k === sel}">${x.av ? av(x.av, 28) : `<span class="pi">${x.icon}</span>`}<span>${esc(x.label)}</span><span class="muted">${esc(x.sub)}</span></button>`; }).join('')}`).join('') : '<div class="empty" style="padding:30px"><b>No results</b>Try a name, sport or city.</div>';
      const on = $('.pal-item.on', m); if (on) on.scrollIntoView({ block: 'nearest' });
    };
    const run = (k) => { const x = results[k]; if (!x) return; closeTop(); setTimeout(x.run, 10); };
    q.addEventListener('input', () => { sel = 0; draw(); });
    q.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    });
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-pal]'); if (b) run(Number(b.dataset.pal)); });
    draw();
  }
  function openAbout() {
    openLayer(`<div class="modal-body about"><div class="eyebrow">About</div><h3>Show your gear. Chase your season.</h3>
      <p>${BRAND} is a home for cyclists and bike mechanics to show off their bikes, builds and workstations, put their season goals and races in public, and get scouted by the brands that want to back them.</p>
      <p>This is an early version. Everything you post stays in this browser for now, so it's safe to play around.</p>
      <div class="eyebrow" style="margin-top:16px">Shortcuts</div>
      <div class="kbd-list"><kbd>1–5</kbd><span>Home, Rigs, Athletes, Scout, Journal</span><kbd>⌘K</kbd><span>Search anything (or press /)</span><kbd>N</kbd><span>New post</span><kbd>Esc</kbd><span>Close</span></div>
      <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap"><button type="button" class="pill" data-act="close">Let's go</button><button type="button" class="pill pill-line" data-act="resetDemo" style="color:var(--red)">Reset my data</button></div></div>`, 'sm', { label: 'About' });
  }

  /* ------------------------------------------------------------- actions */
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function burst(el) {
    if (reduceMotion || !el) return;
    const r = el.getBoundingClientRect();
    const b = document.createElement('div');
    b.className = 'burst';
    b.style.left = (r.left + 16) + 'px';
    b.style.top = (r.top + r.height / 2) + 'px';
    let h = '';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + Math.random() * .4, d = 22 + Math.random() * 22; h += `<i style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d).toFixed(0)}px"></i>`; }
    b.innerHTML = h;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 900);
  }
  function logActivity(type, what, ref) {
    U.activity.unshift({ type, who: 'me', what, ref, at: Date.now() });
    U.activity = U.activity.slice(0, 40);
  }
  function toggleLike(id, el) {
    U.likes[id] = !U.likes[id];
    if (!U.likes[id]) delete U.likes[id];
    save();
    const x = rig(id) || post(id);
    if (!x) return;
    $$(`[data-like="${CSS.escape(id)}"]`).forEach((b) => { b.classList.toggle('on', x.liked); b.setAttribute('aria-pressed', x.liked); const s = $('span', b); if (s) s.textContent = fmtLikes(x.likes); });
    if (x.liked) burst(el);
  }
  function toggleFollow(id) {
    const a = athlete(id); if (!a || a.isMe) return;
    const i = U.follows.indexOf(id);
    if (i >= 0) U.follows.splice(i, 1); else U.follows.push(id);
    save();
    const on = isFollowing(id);
    $$(`[data-follow="${CSS.escape(id)}"]`).forEach((b) => { b.classList.toggle('on', on); b.textContent = on ? 'Following' : 'Follow'; b.setAttribute('aria-pressed', on); });
    $$(`[data-fol-of="${CSS.escape(id)}"]`).forEach((n) => { n.textContent = fmtK(followers(athlete(id))); });
    toast(on ? `Following <b>${esc(a.name)}</b>` : `Unfollowed ${esc(a.name)}`);
  }
  function toggleJoin(id) {
    if (!claimed()) { openEditor(true); toast('Claim your profile to join races'); return; }
    const r = race(id); if (!r) return;
    const i = U.joined.indexOf(id);
    if (i >= 0) U.joined.splice(i, 1); else { U.joined.push(id); logActivity('race', 'is in for ' + r.name, id); }
    save();
    const on = U.joined.includes(id);
    $$(`[data-join="${CSS.escape(id)}"]`).forEach((b) => { b.classList.toggle('on', on); b.textContent = on ? "I'm in ✓" : "I'm in"; b.setAttribute('aria-pressed', on); });
    $$(`[data-going-of="${CSS.escape(id)}"]`).forEach((n) => { n.textContent = fmtK(r.interested + going(r).length); });
    toast(on ? `You're in for <b>${esc(r.name)}</b>. Good luck!` : `Left ${esc(r.name)}`);
  }

  async function readImage(file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('Please choose an image file.');
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read that image.')); i.src = url; });
      const max = 1200, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      let q = .82, out = c.toDataURL('image/jpeg', q);
      while (out.length > 700000 && q > .4) { q -= .12; out = c.toDataURL('image/jpeg', q); }
      return out;
    } finally { URL.revokeObjectURL(url); }
  }
  function wireDrops(root) {
    $$('.drop', root).forEach((d) => {
      const input = $('input[type=file]', d);
      const show = async (file) => {
        try {
          const data = await readImage(file);
          d.dataset.img = data;
          let im = $('img', d); if (!im) { im = document.createElement('img'); im.alt = ''; d.prepend(im); }
          im.src = data;
          const hint = $('.hint', d); if (hint) hint.style.display = 'none';
        } catch (e) { toast(esc(e.message)); }
      };
      input.addEventListener('change', () => input.files[0] && show(input.files[0]));
      ['dragenter', 'dragover'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.add('over'); }));
      ['dragleave', 'drop'].forEach((ev) => d.addEventListener(ev, (e) => { e.preventDefault(); d.classList.remove('over'); }));
      d.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) show(f); });
    });
  }
  const dropData = (form) => { const d = $('.drop', form); return d && d.dataset.img ? d.dataset.img : ''; };

  function onSubmit(e) {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    const fd = new FormData(f);
    const v = (k) => String(fd.get(k) || '').trim();
    const kind = f.dataset.form;

    if (kind === 'comment') {
      if (!claimed()) { openEditor(true); return; }
      const t = v('t'); if (!t) return;
      const id = f.dataset.id;
      (U.comments[id] = U.comments[id] || []).push({ by: 'me', text: t.slice(0, 240), at: Date.now() });
      if (!save()) return;
      const all = commentsOf(id);
      const list = $('#cmList'); if (list) list.innerHTML = all.map(commentHTML).join('');
      const cc = $('#cmCount'); if (cc) cc.textContent = all.length + ' comment' + (all.length === 1 ? '' : 's');
      f.reset();
      return;
    }
    if (kind === 'result') {
      const place = Math.round(Number(v('place'))), field = Math.round(Number(v('field'))) || 0;
      const date = new Date(v('date') + 'T12:00:00').getTime();
      if (!v('event') || !(place >= 1) || !isFinite(date)) { toast('Add the event, your place and the date.'); return; }
      U.me.results = (U.me.results || []).concat([{ id: uid('res'), event: v('event').slice(0, 70), date, place: Math.min(place, 99999), field: field > 0 ? Math.min(field, 99999) : '', cat: v('cat').slice(0, 40), time: v('time').slice(0, 20) }]);
      logActivity('goal', `finished ${placeTxt(place)} at ${v('event').slice(0, 50)}`, 'me');
      if (!save()) { U.me.results.pop(); return; }
      closeTop(); rerender(); toast(place <= 3 ? 'Podium! Result added 🏆' : 'Result added');
      return;
    }
    if (kind === 'pin') {
      const img = dropData(f);
      if (!img) { toast('Add a photo to pin.'); return; }
      U.me.pinned = [{ kind: 'photo', src: img, title: v('title').slice(0, 60) }].concat(U.me.pinned || []).slice(0, 6);
      if (!save()) { U.me.pinned.shift(); return; }
      closeTop(); rerender(); toast('Pinned 📌');
      return;
    }
    if (kind === 'goal') {
      const g = U.goals.find((x) => x.id === f.dataset.id); if (!g) return;
      const n = Number(fd.get('v')); if (!isFinite(n)) return;
      const before = goalPct(g);
      g.current = n;
      logActivity('goal', `hit ${fmtGoal(g, n)} toward ${g.title}`, 'me');
      save();
      rerender();
      toast(goalPct(g) >= 1 && before < 1 ? `🏆 Goal crushed: <b>${esc(g.title)}</b>` : 'Progress updated');
      return;
    }
    if (kind === 'profile') {
      const handle = cleanHandle(v('handle'));
      if (!v('name') || handle.length < 2) { toast('Add your name and a handle (2+ letters).'); return; }
      const m = U.me, wasNew = !claimed();
      const disc = fd.getAll('disc').map(String).filter((d) => SPORTS.includes(d));
      let teamId = v('team');
      if (teamId === '__new') {
        const tn = v('newTeam').slice(0, 40);
        if (!tn) { toast('Give your new team a name.'); return; }
        const col = /^#[0-9a-f]{6}$/i.test(v('newTeamColor')) ? v('newTeamColor') : '#2e6ff2';
        const t = { id: uid('ut'), name: tn, city: v('city').slice(0, 50), disciplines: disc.length ? disc : ['Road'], colors: [col, '#15161a'], founded: new Date().getFullYear(), bio: '', sponsors: [], members: [], own: true };
        U.teams = (U.teams || []).concat([t]);
        teamId = t.id;
      } else if (teamId && !team(teamId)) teamId = '';
      let music = [];
      try { music = JSON.parse(v('music') || '[]').map(normSong).filter(Boolean).slice(0, 5).map((x) => ({ t: x.t.slice(0, 80), a: x.a.slice(0, 80), art: x.art, kind: x.kind })); } catch (_) { music = []; }
      Object.assign(m, {
        name: v('name').slice(0, 40), handle, city: v('city').slice(0, 50), bio: v('bio').slice(0, 140),
        role: ['rider', 'mechanic', 'both'].includes(v('role')) ? v('role') : 'rider',
        disciplines: disc, sport: disc[0] || m.sport || 'Road', team: teamId,
        sponsors: v('sponsors').split(',').map((x) => x.trim().slice(0, 40)).filter(Boolean).slice(0, 6),
        shop: v('shop').slice(0, 50), specialties: v('specialties').split(',').map((x) => x.trim().slice(0, 30)).filter(Boolean).slice(0, 8),
        songs: music
      });
      if (fd.has('race0')) m.topRaces = [0, 1, 2, 3, 4].map((i) => ({ name: v('race' + i).slice(0, 60), status: v('rstat' + i) === 'done' ? 'done' : 'bucket' })).filter((x) => x.name);
      if (fd.has('strava')) m.socials = { strava: safeUrl(v('strava')), instagram: cleanHandle(v('instagram')), spotify: safeUrl(v('spotify')), youtube: safeUrl(v('youtube')), tiktok: cleanHandle(v('tiktok')), website: safeUrl(v('website')) };
      if (fd.has('pitch')) Object.assign(m, { openToSponsors: !!fd.get('open'), pitch: v('pitch').slice(0, 400), contact: isEmail(v('contact')) ? v('contact') : '' });
      else if (!claimed()) m.openToSponsors = true;
      if (v('photoAction') === 'set' && safeImg(f.dataset.photo)) m.photo = f.dataset.photo;
      if (v('photoAction') === 'clear') m.photo = '';
      if (!save()) return;
      paintMe();
      const then = f.dataset.then;
      closeTop();
      if (!stack.length) rerender();
      if (then) setTimeout(() => openComposer(then), 220);
      else if (wasNew) { go('#/athlete/me'); toast('Welcome to COOLDOWN ✦ This is your profile'); }
      else toast(fd.has('contact') && v('contact') && !m.contact ? 'Saved. That contact email didn’t look right, so it was skipped.' : 'Profile saved ✦');
      return;
    }
    if (kind === 'rig') {
      const type = ['Bike', 'Workstation', 'Kit'].includes(v('type')) ? v('type') : 'Kit';
      const sport = SPORTS.includes(v('sport')) ? v('sport') : 'Road';
      const specs = v('specs').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 20).map((l) => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim().slice(0, 30), l.slice(i + 1).trim().slice(0, 80)] : ['Part', l.slice(0, 80)]; });
      const r = { id: uid('uk'), athleteId: 'me', title: v('title').slice(0, 60) || 'My rig', sport, type, art: type === 'Workstation' ? 'stand' : type === 'Bike' ? (ART_FOR[sport] || 'road') : 'bags', hue: U.me.hue, likes: 0, createdAt: Date.now(), caption: v('caption').slice(0, 200), specs, photo: dropData(f) };
      U.rigs.unshift(r);
      logActivity('rig', type === 'Workstation' ? 'shared a workstation' : 'posted a new rig', r.id);
      if (!save()) { U.rigs.shift(); U.activity.shift(); return; }
      closeTop();
      Object.assign(ui, { rigSort: 'new', rigSport: 'All', rigType: 'All', rigFollowing: false });
      go('#/rigs');
      toast('Your rig is live ✦');
      return;
    }
    if (kind === 'post') {
      const p = { id: uid('up'), athleteId: 'me', sport: SPORTS.includes(v('sport')) ? v('sport') : 'Road', title: v('title').slice(0, 90), body: v('body').slice(0, 12000), likes: 0, createdAt: Date.now(), art: ART_FOR[v('sport')] || 'road', hue: U.me.hue, photo: dropData(f) };
      if (!p.title || !p.body) return;
      U.posts.unshift(p);
      logActivity('post', 'wrote in the journal', p.id);
      if (!save()) { U.posts.shift(); U.activity.shift(); return; }
      closeTop();
      go('#/journal/' + encodeURIComponent(p.id));
      toast('Published ✦');
      return;
    }
    if (kind === 'newgoal') {
      const cur = Number(fd.get('current')), tgt = Number(fd.get('target'));
      if (!isFinite(cur) || !isFinite(tgt)) return;
      const due = new Date(v('due') + 'T12:00:00').getTime();
      U.goals.push({ id: uid('ug'), title: v('title').slice(0, 80), unit: v('unit'), start: cur, current: cur, target: tgt, lowerIsBetter: !!fd.get('lower'), due: isFinite(due) ? due : Date.now() + 30 * DAY });
      logActivity('goal', 'set a new goal: ' + v('title').slice(0, 60), 'me');
      save();
      closeTop();
      ui.pendingScroll = 's-goals';
      go('#/athlete/me');
      toast('Goal set. Go get it 🎯');
      return;
    }
    if (kind === 'race') {
      const date = new Date(v('date') + 'T09:00:00').getTime();
      if (!isFinite(date) || date < Date.now() - DAY) { toast('Pick a date in the future.'); return; }
      const r = { id: uid('ur'), name: v('name').slice(0, 80), sport: SPORTS.includes(v('sport')) ? v('sport') : 'Road', city: v('city').slice(0, 60) || '—', date, distance: v('distance').slice(0, 40) || 'Race', athletes: [], interested: 0 };
      U.races.push(r);
      U.joined.push(r.id);
      logActivity('race', 'is in for ' + r.name, r.id);
      save();
      closeTop();
      ui.pendingScroll = 's-races';
      go('#/');
      toast(`<b>${esc(r.name)}</b> is on the calendar 🏁`);
    }
  }

  function copyLink(hash) {
    const url = location.origin + location.pathname + hash;
    const done = () => toast('Link copied');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, () => toast(esc(url)));
    else toast(esc(url));
  }

  /* ---------------------------------------------------------- delegation */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-like],[data-follow],[data-join],[data-star],[data-cmp],[data-act],[data-set],[data-sort],[data-jump],[data-rail],[data-part-go],[data-colorway],[data-sport-pick],[data-go-rigs],[data-acc],[data-open-rig],[data-open-ath],[data-open-post],[data-open-race]');
    if (!t || t.disabled) return;
    const d = t.dataset;

    if (d.like) { e.preventDefault(); return toggleLike(d.like, t); }
    if (d.follow) { e.preventDefault(); return toggleFollow(d.follow); }
    if (d.join) { e.preventDefault(); return toggleJoin(d.join); }
    if (d.star) {
      e.preventDefault();
      const i = U.shortlist.indexOf(d.star); if (i >= 0) U.shortlist.splice(i, 1); else U.shortlist.push(d.star); save();
      const on = U.shortlist.includes(d.star); t.classList.toggle('on', on); t.setAttribute('aria-pressed', on);
      toast(on ? 'Added to shortlist ★' : 'Removed from shortlist');
      if (ui.scShort) renderScout();
      return;
    }
    if (d.cmp) {
      e.preventDefault();
      const i = U.compare.indexOf(d.cmp);
      if (i >= 0) U.compare.splice(i, 1); else { if (U.compare.length >= 3) U.compare.shift(); U.compare.push(d.cmp); }
      save(); renderScout();
      return;
    }
    if (d.sort) { if (ui.scSort === d.sort) ui.scDir *= -1; else { ui.scSort = d.sort; ui.scDir = -1; } renderScout(); return; }
    if (d.jump) { e.preventDefault(); return jumpTo(d.jump); }
    if (d.rail) { const r = document.getElementById(d.rail); if (r) r.scrollBy({ left: Number(d.dir) * r.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
    if (d.partGo) return setPart(d.partGo);
    if (d.colorway != null) {
      ui.colorway = Number(d.colorway);
      const v = $('#viewer'); if (v) v.style.setProperty('--frame-c', COLORWAYS[ui.colorway].hex);
      $$('[data-colorway]').forEach((b) => { const on = Number(b.dataset.colorway) === ui.colorway; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      const n = $('#swName'); if (n) n.textContent = COLORWAYS[ui.colorway].name;
      return;
    }
    if (d.sportPick) {
      if (ui.sportPick === d.sportPick) return;
      ui.sportPick = d.sportPick;
      $$('[data-sport-pick]').forEach((b) => { const on = b.dataset.sportPick === ui.sportPick; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      return renderSport(true);
    }
    if (d.goRigs) { Object.assign(ui, { rigSport: d.goRigs, rigType: 'All', rigFollowing: false }); return go('#/rigs'); }
    if (d.acc != null) { const a = t.closest('.acc'); const open = !a.classList.contains('open'); a.classList.toggle('open', open); t.setAttribute('aria-expanded', open); return; }
    if (d.set) {
      const key = d.set, val = d.val;
      if (ui[key] === val) return;
      ui[key] = val;
      $$(`[data-set="${key}"]`).forEach((b) => b.classList.toggle('on', b.dataset.val === val));
      const fns = { mlMode: renderLiked, mlSport: renderLiked, lbMode: () => renderLb(true), rigSport: renderRigGrid, rigType: renderRigGrid, rigSort: renderRigGrid, athSport: renderAthGrid, athSort: renderAthGrid, scSport: renderScout, jFilter: renderJournal };
      if (fns[key]) fns[key]();
      return;
    }
    if (d.act) {
      const a = d.act;
      if (a === 'close') return closeTop();
      if (a === 'compose') { const tm = topModal(); if (tm && tm.querySelector('[data-form]')) closeTop(); return openComposer(d.tab); }
      if (a === 'composeTab') { ui.composeTab = d.tab; $$('[data-act="composeTab"]').forEach((b) => b.classList.toggle('on', b.dataset.tab === d.tab)); const cb = $('#composeBody'); cb.innerHTML = composeForm(d.tab); wireDrops(cb); const first = $('input:not([type=file]),textarea', cb); if (first) first.focus(); return; }
      if (a === 'editProfile') return openEditor();
      if (a === 'avatarMaker') return openAvatarMaker();
      if (a === 'joinTeam') { if (!claimed()) return openEditor(true); U.me.team = d.id; save(); rerender(); return toast(`You joined <b>${esc((team(d.id) || {}).name || 'the team')}</b> 🛡`); }
      if (a === 'leaveTeam') { U.me.team = ''; save(); rerender(); return toast('You left the team'); }
      if (a === 'startTeam') { openEditor(); const sel = $('#edTeam'); if (sel) { sel.value = '__new'; sel.dispatchEvent(new Event('change')); sel.scrollIntoView({ block: 'center' }); } return; }
      if (a === 'addResult') {
        if (!claimed()) return openEditor(true);
        const today = new Date().toISOString().slice(0, 10);
        const md = openLayer(`<div class="modal-head"><h2>Add a result</h2></div><div class="modal-body"><form class="form" data-form="result"><label class="field"><span>Event</span><input name="event" required maxlength="70" placeholder="Marin Gravel Fondo"></label><div class="form-2"><label class="field"><span>Your place</span><input name="place" type="number" min="1" required placeholder="3"></label><label class="field"><span>Out of (riders in your category)</span><input name="field" type="number" min="1" placeholder="212"></label></div><div class="form-2"><label class="field"><span>Date</span><input name="date" type="date" required value="${today}" max="${today}"></label><label class="field"><span>Category</span><input name="cat" maxlength="40" placeholder="Women Open"></label></div><label class="field"><span>Time or score</span><input name="time" maxlength="20" placeholder="4:12:33"></label><div class="form-foot"><button type="button" class="pill pill-line" data-act="close">Cancel</button><button class="pill">Add result</button></div></form></div>`, 'sm', { label: 'Add a result', focus: 'input[name=event]' });
        return md;
      }
      if (a === 'pinPhoto') {
        if (!claimed()) return openEditor(true);
        const md = openLayer(`<div class="modal-head"><h2>Pin a photo</h2></div><div class="modal-body"><form class="form" data-form="pin"><label class="drop" style="height:200px"><span class="hint"><b>Add a photo</b><span>Race day, your bike, the view from the top</span></span><input type="file" name="photo" accept="image/*" aria-label="Photo to pin"></label><label class="field"><span>Caption</span><input name="title" maxlength="60" placeholder="Podium at Marin Gravel Fondo"></label><p class="muted" style="margin:0;font-size:13px">Pinned videos come with real accounts. For now this demo saves photos in your browser.</p><div class="form-foot"><button type="button" class="pill pill-line" data-act="close">Cancel</button><button class="pill">Pin it</button></div></form></div>`, 'sm', { label: 'Pin a photo' });
        wireDrops(md);
        return md;
      }
      if (a === 'delPin') { U.me.pinned = (U.me.pinned || []).filter((_, i) => i !== Number(d.i)); save(); rerender(); return toast('Unpinned'); }
      if (a === 'delResult') { U.me.results = (U.me.results || []).filter((r) => r.id !== d.id); save(); rerender(); return toast('Result removed'); }
      if (a === 'claimOrProfile') return claimed() ? go('#/athlete/me') : openEditor();
      if (a === 'about') return openAbout();
      if (a === 'hue') { const f = t.closest('form'); $('input[name=hue]', f).value = d.hue; $$('[data-act="hue"]', f).forEach((b) => b.classList.toggle('on', b === t)); return; }
      if (a === 'copyLink') return copyLink(d.link);
      if (a === 'clearCompare') { U.compare = []; save(); renderScout(); return; }
      if (a === 'compareModal') { openLayer(`<div class="modal-head"><h2>Compare</h2></div><div class="modal-body"><div data-cmp-modal>${cmpHTML()}</div></div>`, 'sm', { label: 'Compare' }); return; }
      if (a === 'mediaKit') return toast(`Media kit requests sent to <b>${U.compare.length}</b> athlete${U.compare.length === 1 ? '' : 's'} (demo)`);
      if (a === 'contactAthlete') {
        const at = athlete(d.id);
        if (at && at.contact && isEmail(at.contact)) { location.href = 'mailto:' + encodeURIComponent(at.contact).replace('%40', '@') + '?subject=' + encodeURIComponent('Sponsorship via ' + BRAND); return; }
        return toast(`Request sent to <b>${esc(at ? at.name : 'athlete')}</b> (demo)`);
      }
      if (a === 'deleteGoal') { U.goals = U.goals.filter((g) => g.id !== d.id); save(); rerender(); return toast('Goal removed'); }
      if (a === 'deleteRig') {
        if (!confirm('Delete this rig?')) return;
        U.rigs = U.rigs.filter((r) => r.id !== d.id); U.activity = U.activity.filter((x) => x.ref !== d.id); save(); closeTop(); rerender(); return toast('Rig deleted');
      }
      if (a === 'deletePost') {
        if (!confirm('Delete this story?')) return;
        U.posts = U.posts.filter((p) => p.id !== d.id); U.activity = U.activity.filter((x) => x.ref !== d.id); save(); go('#/journal'); return toast('Story deleted');
      }
      if (a === 'resetDemo') {
        if (!confirm('Reset everything you have done here (profile, posts, likes, follows)?')) return;
        try { localStorage.removeItem(STORE_KEY); } catch (err) { /* ignore */ }
        U = defaultUser(); closeAll(); paintMe(); go('#/'); return toast('Fresh start ✦');
      }
      return;
    }
    if (d.openRig) { e.preventDefault(); return openRig(d.openRig); }
    if (d.openAth) { e.preventDefault(); if (d.openAth === 'me' && !claimed()) return openEditor(); closeAll(); return go('#/athlete/' + encodeURIComponent(d.openAth)); }
    if (d.openRace) { e.preventDefault(); return openRace(d.openRace); }
    if (d.openPost) { e.preventDefault(); closeAll(); return go('#/journal/' + encodeURIComponent(d.openPost)); }
  });

  document.addEventListener('submit', onSubmit);
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.toggle) {
      ui[t.dataset.toggle] = t.checked;
      ({ rigFollowing: renderRigGrid, athOpen: renderAthGrid, athFollowing: renderAthGrid, scOpen: renderScout, scShort: renderScout }[t.dataset.toggle] || (() => {}))();
    }
    if (t.dataset.cmpSel) { ui['cmp' + t.dataset.cmpSel] = t.value; renderCmpTiles(); }
  });

  document.addEventListener('keydown', (e) => {
    const ae0 = document.activeElement;
    const typing = !!ae0 && ((ae0.tagName === 'INPUT' && !/^(checkbox|radio|range|button|submit)$/.test(ae0.type)) || /^(TEXTAREA|SELECT)$/.test(ae0.tagName) || ae0.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (e.key === 'Escape') { if (closeTop()) e.preventDefault(); return; }
    if (typing) return;
    const ae = document.activeElement;
    if ((e.key === 'Enter' || e.key === ' ') && ae && ae.getAttribute('role') === 'button' && ae.tagName !== 'BUTTON') { e.preventDefault(); ae.click(); return; }
    if (stack.length) { if (e.key === 'Tab') trapFocus(e); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-5]$/.test(e.key)) { go(['#/', '#/rigs', '#/athletes', '#/scout', '#/journal'][Number(e.key) - 1]); return; }
    if (e.key === '/') { e.preventDefault(); openPalette(); return; }
    if (e.key.toLowerCase() === 'n') { e.preventDefault(); openComposer(); }
  });
  function trapFocus(e) {
    const m = topModal(); if (!m) return;
    const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', m).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // 3D tilt + glare on rig cards (mouse only)
  let tiltCard = null;
  if (!reduceMotion && finePointer) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.rcard');
      if (tiltCard && tiltCard !== card) { tiltCard.style.transform = ''; tiltCard = null; }
      if (!card || card.closest('.dragging')) return;
      tiltCard = card;
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.transform = `perspective(1000px) rotateX(${((.5 - py) * 6).toFixed(2)}deg) rotateY(${((px - .5) * 8).toFixed(2)}deg) translateY(-4px)`;
      card.style.setProperty('--gx', (px * 100).toFixed(0) + '%'); card.style.setProperty('--gy', (py * 100).toFixed(0) + '%');
    }, { passive: true });
  }

  setInterval(() => { $$('[data-cd]').forEach((el) => { el.innerHTML = cdInner(Number(el.dataset.cd)); }); }, 1000);

  // the Profile button (top bar) and Profile tab (phones): your avatar + "Profile", always one tap away
  const personIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>';
  function meBubble(px) {
    if (!claimed()) return `<span class="me-bubble is-empty" style="width:${px}px;height:${px}px">${personIcon}</span>`;
    return U.me.avatar ? avatarHead(U.me.avatar, px) : av(meAthlete(), px);
  }
  function paintMe() {
    const b = $('#meBtn');
    b.className = 'me-btn prof';
    b.innerHTML = meBubble(28) + '<span class="me-lbl">Profile</span>';
    b.setAttribute('aria-label', claimed() ? 'Your profile' : 'Set up your profile');
    b.title = claimed() ? 'Your profile' : 'Set up your profile';
    const t = $('#tabMeAv'); if (t) t.innerHTML = meBubble(24);
    const tb = $('#tabMe'); if (tb) tb.classList.toggle('on', curView === 'athlete' && curArg === 'me');
  }
  $('#meBtn').addEventListener('click', () => claimed() ? go('#/athlete/me') : openEditor());
  $('#searchBtn').addEventListener('click', openPalette);
  $('#tabMe').addEventListener('click', () => claimed() ? go('#/athlete/me') : openEditor());

  window.addEventListener('resize', debounce(() => { onScroll(); $$('.rail').forEach(railUpdate); }, 100));
  window.addEventListener('hashchange', route);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------------------------------------------------------------- boot */
  paintMe();
  route();
  // the wordmark flips once on load, then again whenever you hover it
  setTimeout(() => { const l = $('#logo'); if (l) l.classList.remove('spin'); }, 1700);
  { const l = $('#logo'); if (l) { l.addEventListener('mouseenter', tabShine); l.addEventListener('click', tabShine); } }
  try { if (!localStorage.getItem(SEEN_KEY)) { localStorage.setItem(SEEN_KEY, '1'); setTimeout(() => { if (!stack.length) toast(`Welcome to <b>${BRAND}</b> ✦ scroll to explore`); }, 1200); } } catch (e) { /* ignore */ }
})();
