/* =========================================================================
   COOLDOWN — app
   Vanilla JS, no build step. Seed data is rebuilt on every load
   (js/data.js); anything a visitor does (likes, follows, posts, goals,
   races, profile) is saved in their browser under one localStorage key.

   Pages scroll vertically like an Apple product page:
   - the home hero is "scrubbed" by scroll (bike draws itself, glow blooms)
   - sections reveal, numbers count up and bars grow as they enter view
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

  function defaultUser() {
    return {
      v: 1,
      me: { id: 'me', name: '', handle: '', sport: 'Cycling', city: '', bio: '', hue: 95, photo: '', socials: {}, openToSponsors: true, pitch: '', contact: '' },
      goals: [], rigs: [], posts: [], races: [], joined: [], likes: {}, follows: [], comments: {}, shortlist: [], compare: [], activity: []
    };
  }
  function loadUser() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.v === 1) return Object.assign(defaultUser(), u, { me: Object.assign(defaultUser().me, u.me || {}) });
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
    lbMode: 'traction', mlMode: 'week', mlSport: 'All', part: 'overview', colorway: 0, sportPick: 'Cycling', cmpA: null, cmpB: null,
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
      sponsors: [], pitch: m.pitch, contact: m.contact, socials: m.socials || {}, goals: U.goals
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
    return `${esc(w.join(' '))} <span class="serif">${esc(last)}</span>`;
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
  let ringN = 0;
  function ring(pct, size) {
    const id = 'rg' + (++ringN);
    const r = (size - 10) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C6FF3D"/><stop offset=".5" stop-color="#00E0A4"/><stop offset="1" stop-color="#3DD6FF"/></linearGradient></defs><circle class="bgc" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="fg" stroke="url(#${id})" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" data-off="${(c * (1 - pct)).toFixed(1)}"/></svg>`;
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
    ['website', 'Website', '#C6FF3D', (v) => safeUrl(v)]
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
    Cycling: { icon: '🚴', art: 'road', hue: 95, copy: 'Road, gravel, track and enduro. Builds, bars and every last gram.' },
    Running: { icon: '🏃', art: 'shoe', hue: 28, copy: 'Shoe rotations, race bibs and the splits that matter.' },
    Skiing: { icon: '⛷️', art: 'ski', hue: 190, copy: 'Quivers, bindings, big lines and bigger days.' },
    Snowboard: { icon: '🏂', art: 'board', hue: 215, copy: 'Splitboards, skins and the backcountry kit that never stays home.' },
    Lifting: { icon: '🏋️', art: 'barbell', hue: 330, copy: 'Belts, bars, platforms and the PRs that make the garage worth it.' },
    Triathlon: { icon: '🏊', art: 'tt', hue: 12, copy: 'Three sports, one transition bag, zero wasted seconds.' },
    Climbing: { icon: '🧗', art: 'climb', hue: 45, copy: 'Racks, ropes and the project list for this season.' }
  };

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
  function activate(el) {
    el.classList.add('in');
    if (el.dataset.count != null) countUp(el);
    if (el.dataset.bar != null) el.style.width = el.dataset.bar + '%';
    if (el.dataset.off != null) el.style.strokeDashoffset = el.dataset.off;
  }
  function enhance(root) {
    const els = $$('.rv,.rv-scale,[data-count],[data-bar],.ring .fg', root).filter((el) => !el.dataset.manual);
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(activate); return; }
    if (!io) io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------- scroll engine */
  const scrubs = [];
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; scrubs.forEach((f) => f()); });
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
  const NAV_OF = { home: 'home', rigs: 'rigs', athletes: 'athletes', athlete: 'athletes', scout: 'scout', journal: 'journal', article: 'journal' };
  const TITLE_OF = { home: 'Show your gear. Chase your season.', rigs: 'Rigs', athletes: 'Athletes', scout: 'Scout', journal: 'Journal' };
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
    main.innerHTML = VIEWS[view](arg) + footer();
    curHash = view === 'home' ? '#/' : view === 'athlete' ? '#/athlete/' + encodeURIComponent(arg) : view === 'article' ? '#/journal/' + encodeURIComponent(arg) : '#/' + view;
    const t = view === 'athlete' ? (athlete(arg) || {}).name : view === 'article' ? (post(arg) || {}).title : TITLE_OF[view];
    document.title = `${t} · ${BRAND}`;
    $$('[data-view]').forEach((l) => { const on = l.dataset.view === NAV_OF[view]; l.classList.toggle('on', on); if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current'); });
    if (AFTER[view]) AFTER[view](arg);
    enhance(main);
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
      <a class="logo" href="#/" aria-label="${BRAND} home"><span class="logo-word">${BRAND}</span><span class="logo-dot" aria-hidden="true"></span></a>
      <nav aria-label="Footer"><a href="#/rigs">Rigs</a><a href="#/athletes">Athletes</a><a href="#/scout">Scout</a><a href="#/journal">Journal</a><button type="button" data-act="about">About</button></nav>
      <p>Early demo. The athletes, races and brands shown here are fictional. Everything you post stays in your browser for now. © 2026 ${BRAND}.</p>
    </div></footer>`;
  }

  /* --------------------------------------------------------------- HOME */
  const LNAV = [['s-viewer', 'Bike of the week'], ['s-liked', 'Most liked'], ['s-lb', 'Leaderboard'], ['s-goals', 'Goals'], ['s-sports', 'Sports'], ['s-races', 'Races'], ['s-feed', 'Feed'], ['s-brands', 'For brands'], ['s-start', 'Get started']];
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

  function viewHome() {
    const b = bikeOfWeek();
    const ba = b ? athlete(b.athleteId) : null;
    return `
    <section class="hero" id="hero" aria-label="Intro">
      <div class="hero-stick" id="heroStick">
        <div class="hero-grid"></div><div class="hero-glow"></div>
        <div class="hero-bike">${BIKE('road', 'hero-svg', 0.6)}</div>
        <div class="hero-copy">
          <div class="hero-line" data-l="0"><span class="eyebrow">For athletes of every sport</span><h1 class="h-hero">Show your <span class="serif">gear.</span></h1></div>
          <div class="hero-line" data-l="1"><h2 class="h-hero">Chase your <span class="serif">season.</span></h2></div>
          <div class="hero-line hero-end" data-l="2">
            <h2 class="h-hero">Then, <span class="glow-text">cool down.</span></h2>
            <p class="lede">The place athletes come after the work. Show off the bike, the quiver, the shoe rotation and the home shop. Post your goals and races. Get seen by the brands watching. Every sport, one place.</p>
            <div class="hero-ctas"><button type="button" class="pill pill-pop" data-act="claimOrProfile">${claimed() ? 'View your profile' : 'Claim your profile'}</button><button type="button" class="pill pill-line on-dark" data-jump="s-liked">See what's hot</button></div>
            <div class="hero-stats"><div><b data-count="${athletes().length}" data-manual="1">0</b><span>Athletes</span></div><div><b data-count="${rigs().length}" data-manual="1">0</b><span>Rigs</span></div><div><b data-count="${races().length}" data-manual="1">0</b><span>Races</span></div></div>
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
      <div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Hall of fame</div><h2 class="h-sec">Most liked. <span class="serif">Right now.</span></h2></div><div class="seg">${segBtns('mlMode', [['week', '72 hours'], ['all', 'All time']])}</div></div>
      <div class="chips rv" style="margin:-20px 0 26px">${sportChips('mlSport')}</div></div>
      ${rail('likedRail', '')}
    </section>

    <section class="sec dark" id="s-lb"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Leaderboard</div><h2 class="h-sec">Who's <span class="serif">moving.</span></h2><p class="lede">Ranked live by traction: fans, engagement, rig likes and growth in one number.</p></div><div class="seg">${segBtns('lbMode', [['traction', 'Traction'], ['followers', 'Fans'], ['rising', 'Rising']])}</div></div>
      <div class="lb" id="lbList"></div>
      <div style="margin-top:28px" class="rv"><a class="link" href="#/athletes">See every athlete</a></div>
    </div></section>

    <section class="sec" id="s-goals"><div class="wrap">
      <div class="sec-head center rv" style="justify-content:center"><div><div class="eyebrow">Season goals</div><h2 class="h-sec">This season, they're <span class="serif">chasing.</span></h2></div></div>
      <div class="stats" id="goalStats"></div>
      <div class="center rv" style="margin-top:56px"><button type="button" class="pill" data-act="compose" data-tab="goal">Set your goal</button></div>
    </div></section>

    <section class="sec snow" id="s-sports"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Every sport</div><h2 class="h-sec">One place for <span class="serif">every sport.</span></h2></div></div>
      <div class="chips sport-picker rv" role="tablist" aria-label="Sport">${SPORTS.map((s) => `<button type="button" role="tab" aria-selected="${ui.sportPick === s}" class="chip ${ui.sportPick === s ? 'on' : ''}" data-sport-pick="${s}">${SPORT_INFO[s].icon} ${s}</button>`).join('')}</div>
      <div class="sports rv"><div class="sport-art" id="sportArt"></div><div class="sport-panel" id="sportPanel"></div></div>
    </div></section>

    <section class="sec dark" id="s-races">
      <div class="wrap"><div class="sec-head rv"><div><div class="eyebrow live">On the calendar</div><h2 class="h-sec">The biggest races <span class="serif">ahead.</span></h2></div><button type="button" class="pill pill-pop pill-sm" data-act="compose" data-tab="race">＋ Add a race</button></div></div>
      ${rail('raceRail', '')}
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track" id="marquee"></div></div>

    <section class="sec" id="s-feed"><div class="wrap two">
      <div class="rv"><div class="eyebrow live">Live</div><h2 class="h-sub" style="margin:10px 0 18px">The feed.</h2><div class="feed" id="feedList"></div><div style="margin-top:20px"><a class="link" href="#/athletes">Find people to follow</a></div></div>
      <div class="rv d1"><div class="eyebrow">From the journal</div><h2 class="h-sub" style="margin:10px 0 18px">Stories from the <span class="serif">season.</span></h2><div id="storyBox"></div><div style="margin-top:20px"><a class="link" href="#/journal">Read the journal</a></div></div>
    </div></section>

    <section class="sec dark" id="s-brands"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">For brands</div><h2 class="h-sec">Scout talent that <span class="glow-text">moves people.</span></h2><p class="lede">Line up any two athletes. See who brings the crowd, who's climbing fastest and who's racing next.</p></div><a class="pill pill-pop" href="#/scout">Open Scout</a></div>
      <div class="cmp-tiles rv" id="cmpTiles"></div>
      <div style="margin-top:56px" class="rv">
        ${acc('How is traction scored?', `<div class="formula"><kbd>Fans</kbd><span>About 9 points every time an audience grows 10× (log scale), so small, loyal crowds still count.</span><kbd>Engagement</kbd><span>2.2 points per 1% engagement, up to 22.</span><kbd>Rig likes</kbd><span>About 4 points every time rig likes grow 10×.</span><kbd>Growth</kbd><span>0.25 points per 1% of 12-week follower growth, up to 12.5.</span></div>`)}
        ${acc('What does an athlete profile include?', '<p>Gear and builds, season goals with live progress, upcoming races, links to Strava, Instagram, Spotify and more, a sponsor pitch and a contact button.</p>')}
        ${acc('Are these numbers verified?', '<p>Not yet. This is an early demo with fictional athletes. In the live version, fans, engagement and activities will come from linked Strava and Instagram accounts instead of being self-reported.</p>')}
        ${acc('How do I reach an athlete?', '<p>Open their profile and use “Contact for sponsorship” on their pitch, or shortlist them in Scout and request media kits.</p>')}
      </div>
    </div></section>

    <section class="sec snow" id="s-start"><div class="wrap">
      <div class="sec-head center rv" style="justify-content:center"><div><div class="eyebrow">Get started</div><h2 class="h-sec">Ways to get <span class="serif">seen.</span></h2></div></div>
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
    const items = lbItems().slice(0, 8);
    const val = (a) => ui.lbMode === 'followers' ? followers(a) : ui.lbMode === 'rising' ? growthPct(a) : traction(a);
    const max = Math.max(...items.map(val), 1);
    const fmt = ui.lbMode === 'followers' ? 'k' : ui.lbMode === 'rising' ? 'plus' : 'int';
    el.innerHTML = items.map((a, i) => `<div class="lb-row rv" data-open-ath="${a.id}" role="button" tabindex="0">
      <span class="lb-rank">${i + 1}</span>${av(a, 44, i === 0 ? 'ring' : '')}
      <div class="lb-main"><div class="lb-name"><b>${esc(a.name)}${a.isMe ? ' <span class="tag pop">You</span>' : ''}</b><span>${esc(a.sport)}${a.city ? ' · ' + esc(a.city) : ''}</span></div><div class="lb-track"><i data-bar="${(Math.max(val(a), 0) / max * 100).toFixed(1)}"></i></div></div>
      <span class="lb-val" data-count="${Math.max(val(a), 0).toFixed(2)}" data-fmt="${fmt}">0</span>
    </div>`).join('');
    if (animate) requestAnimationFrame(() => requestAnimationFrame(() => $$('.rv,[data-bar],[data-count]', el).forEach(activate)));
    else enhance(el);
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

  /* hero scrub */
  function heroScrub() {
    const h = $('#hero'), st = $('#heroStick');
    if (!h || !st) return;
    const vh = st.offsetHeight;
    const total = Math.max(1, h.offsetHeight - vh);
    const p = reduceMotion ? 1 : clamp((navH() - h.getBoundingClientRect().top) / total, 0, 1);
    const draw = clamp(p / 0.4, 0, 1);
    const fill = clamp((p - 0.34) / 0.12, 0, 1);
    const t = clamp((p - 0.58) / 0.3, 0, 1);
    const S = st.style;
    S.setProperty('--draw', (1 - draw).toFixed(4));
    S.setProperty('--po', clamp(draw * 25, 0, 1).toFixed(3));
    S.setProperty('--fill', fill.toFixed(3));
    S.setProperty('--knob', fill.toFixed(3));
    S.setProperty('--spin', (p * 540).toFixed(1) + 'deg');
    S.setProperty('--go', (clamp((p - 0.28) / 0.3, 0, 1) * 0.95).toFixed(3));
    S.setProperty('--gs', (0.3 + 0.9 * clamp((p - 0.28) / 0.5, 0, 1)).toFixed(3));
    S.setProperty('--gr', (0.4 + 0.35 * fill).toFixed(3));
    S.setProperty('--bs', lerp(1.08, 0.62, t).toFixed(4));
    S.setProperty('--by', (t * vh * 0.26).toFixed(1) + 'px');
    S.setProperty('--cue', (1 - clamp(p / 0.06, 0, 1)).toFixed(3));
    const bike = $('.hero-bike', st);
    if (bike) bike.style.opacity = (1 - 0.62 * t).toFixed(3);
    const segs = [[-1, 0.3], [0.3, 0.6], [0.6, 2]];
    $$('.hero-line', st).forEach((el, i) => {
      const [a, b] = segs[i], f = 0.07;
      const vin = clamp((p - a) / f, 0, 1), vout = 1 - clamp((p - (b - f)) / f, 0, 1);
      const v = Math.min(vin, vout);
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translateY(${((p > (a + b) / 2 ? -1 : 1) * (1 - v) * 24).toFixed(1)}px)`;
      el.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
      el.setAttribute('aria-hidden', v < 0.5 ? 'true' : 'false');
      if (i === 2 && v > 0.6 && !el.dataset.counted) { el.dataset.counted = '1'; $$('[data-count]', el).forEach(countUp); }
    });
  }
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
    return `<section class="phead"><div class="wrap rv"><div class="eyebrow">Gear, builds and workstations</div><h1 class="h-sec">Rigs. <span class="serif">Show yours.</span></h1><p class="lede">Bikes, quivers, shoe rotations and the workstations where the magic happens.</p><div style="margin-top:26px"><button type="button" class="pill pill-green" data-act="compose" data-tab="rig">＋ Post your rig</button></div></div></section>
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
    return `<section class="phead"><div class="wrap rv"><div class="eyebrow">Directory</div><h1 class="h-sec">Athletes. <span class="serif">Find your people.</span></h1><p class="lede">Follow the athletes you want to chase. Every sport, every level.</p>${claimed() ? '' : '<div style="margin-top:26px"><button type="button" class="pill pill-green" data-act="editProfile">✦ Claim your profile</button></div>'}</div></section>
    <div class="fbar"><div class="fbar-in">
      <label class="search-field">${searchIcon}<input id="athQ" type="search" placeholder="Name, city or @handle" value="${esc(ui.athQ)}" aria-label="Search athletes"></label>
      <div class="seg">${segBtns('athSort', [['traction', 'Traction'], ['followers', 'Fans'], ['rising', 'Rising']])}</div>
      <label class="switch">Open to sponsors<input type="checkbox" data-toggle="athOpen" ${ui.athOpen ? 'checked' : ''}><span class="knob"></span></label>
      <label class="switch">Following<input type="checkbox" data-toggle="athFollowing" ${ui.athFollowing ? 'checked' : ''}><span class="knob"></span></label>
      <div class="chips">${sportChips('athSport')}</div>
      <span class="count" id="athCount"></span>
    </div></div>
    <div class="wrap"><div class="grid" id="athGrid"></div></div>`;
  }
  function athItems() {
    let list = athletes();
    const q = ui.athQ.trim().toLowerCase().replace(/^@/, '');
    if (q) list = list.filter((a) => (a.name + ' ' + a.handle + ' ' + a.city + ' ' + a.sport).toLowerCase().includes(q));
    if (ui.athSport !== 'All') list = list.filter((a) => a.sport === ui.athSport);
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
      <div class="acard-top">${av(a, 52)}<div class="t"><b>${esc(a.name)}</b><span>@${esc(a.handle)} · ${esc(a.sport)}</span></div>${followBtn(a)}</div>
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
    return `<section class="phead dark"><div class="wrap rv"><div class="eyebrow">For brands</div><h1 class="h-sec">Scout <span class="glow-text">talent.</span></h1><p class="lede">Find athletes who actually move people. Sort by what matters, shortlist the ones you like and line them up side by side.</p>
      <div class="hero-stats" style="justify-content:flex-start;margin-top:36px"><div style="text-align:left"><b data-count="${open}">0</b><span>Open to sponsors</span></div><div style="text-align:left"><b data-count="${athletes().reduce((s, a) => s + followers(a), 0)}" data-fmt="k">0</b><span>Combined fans</span></div><div style="text-align:left"><b data-count="${SPORTS.length}">0</b><span>Sports</span></div></div></div></section>
    <div class="fbar"><div class="fbar-in">
      <div class="chips">${sportChips('scSport')}</div>
      <label class="switch">Open only<input type="checkbox" data-toggle="scOpen" ${ui.scOpen ? 'checked' : ''}><span class="knob"></span></label>
      <label class="switch">Shortlist<input type="checkbox" data-toggle="scShort" ${ui.scShort ? 'checked' : ''}><span class="knob"></span></label>
      <label class="switch" style="gap:8px">Min fans <span class="mono" id="scMinLbl" style="min-width:34px">${fmtK(ui.scMin)}</span><input type="range" id="scMin" min="0" max="80000" step="2000" value="${ui.scMin}" aria-label="Minimum fans" style="position:static;opacity:1;pointer-events:auto;width:120px;accent-color:#00C46A"></label>
      <span class="count" id="scCount"></span>
      <button type="button" class="pill pill-sm cmp-open-m" data-act="compareModal">Compare (<span class="cmpN">${U.compare.length}</span>)</button>
    </div></div>
    <div class="wrap scout-grid"><div class="table-wrap" id="scTable"></div><aside class="cmp-aside" aria-label="Compare"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Compare</h3><button type="button" class="pill pill-line pill-xs" data-act="clearCompare">Clear</button></div><div id="cmpBody"></div></aside></div>`;
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
    return `<section class="phead"><div class="wrap rv"><div class="eyebrow">Stories from the season</div><h1 class="h-sec">Journal. <span class="serif">Write it down.</span></h1><p class="lede">Race reports, build stories, training blocks and what the sport means to the people doing it.</p>
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
    ${more.length ? `<section class="sec snow" style="padding-top:80px"><div class="wrap"><div class="sec-head rv"><h2 class="h-sub">More <span class="serif">stories.</span></h2></div></div>${rail('moreRail', more.map((x) => `<div style="width:clamp(280px,30vw,380px)">${storyCard(x, true)}</div>`).join(''))}</section>` : ''}`;
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
        ${av(a, 120, 'ring')}
        <h1>${esc(a.name)}</h1><div class="handle">@${esc(a.handle)}</div>
        <div class="prof-tags"><span class="tag">${esc(a.sport)}</span>${a.city ? `<span class="tag">${esc(a.city)}</span>` : ''}${a.openToSponsors ? '<span class="tag pop">Open to sponsors</span>' : ''}</div>
        <p class="bio">${esc(a.bio || (isMe ? 'Add a bio so people know what you are about.' : ''))}</p>
        <div class="prof-acts">${isMe ? '<button type="button" class="pill pill-pop pill-sm" data-act="editProfile">Edit profile</button><button type="button" class="pill pill-line on-dark pill-sm" data-act="compose" data-tab="rig">＋ Post</button>' : followBtn(a)}<button type="button" class="pill pill-line on-dark pill-sm" data-act="copyLink" data-link="#/athlete/${esc(a.id)}">Share</button></div>
        <div class="socials">${socialLinks(a)}</div>
        ${a.sponsors && a.sponsors.length ? `<div class="prof-tags"><span class="muted" style="font-size:14px;align-self:center">Backed by</span>${a.sponsors.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="prof-stats">
        <div class="prof-stat rv d1"><b data-count="${followers(a)}" data-fmt="k" data-fol-of="${a.id}">0</b><span>Fans</span></div>
        <div class="prof-stat rv d2"><div class="ring-wrap">${ring(tr / 100, 120)}<b data-count="${tr}">0</b></div><span>Traction · #${rank}</span></div>
        <div class="prof-stat rv d3"><b data-count="${a.engagement || 0}" data-fmt="pct">0</b><span>Engagement</span></div>
        <div class="prof-stat rv d4"><b data-count="${rigLikes(a.id)}" data-fmt="k">0</b><span>Rig likes</span></div>
      </div>
    </div></section>

    <section class="sec snow" id="s-goals"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Season goals</div><h2 class="h-sec">What ${isMe ? "you're" : first + "'s"} <span class="serif">chasing.</span></h2></div>${isMe ? '<button type="button" class="pill" data-act="compose" data-tab="goal">＋ Add a goal</button>' : ''}</div>
      ${goals.length ? `<div class="goals">${goals.map((x, i) => goalHTML(x, isMe, i)).join('')}</div>` : `<div class="empty"><b>${isMe ? 'What are you chasing?' : 'No goals posted'}</b>${isMe ? 'Add a goal like “Deadlift 300 lb” or “Half marathon under 1:30”.' : ''}</div>`}
    </div></section>

    <section class="sec" id="s-races"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Upcoming</div><h2 class="h-sec">On the <span class="serif">calendar.</span></h2></div>${isMe ? '<button type="button" class="pill" data-act="compose" data-tab="race">＋ Add a race</button>' : ''}</div>
      ${myRaces.length ? `<div class="races-list">${myRaces.map((r) => { const d = new Date(r.date); return `<div class="race-line rv" data-open-race="${r.id}" role="button" tabindex="0"><div class="date-box"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div><div style="min-width:0"><b>${esc(r.name)}</b><span>${esc(r.city)} · in ${daysTo(r.date)} days</span></div><span class="tag">${esc(r.sport)}</span></div>`; }).join('')}</div>` : `<div class="empty"><b>No races yet</b>${isMe ? 'Tap “I’m in” on any race, or add your own.' : ''}</div>`}
    </div></section>

    <section class="sec snow" id="s-rigs">
      <div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Gear</div><h2 class="h-sec">The <span class="serif">rigs.</span></h2></div>${isMe ? '<button type="button" class="pill pill-green" data-act="compose" data-tab="rig">＋ Post a rig</button>' : ''}</div></div>
      ${myRigs.length ? rail('profRail', myRigs.map((r) => rcard(r)).join('')) : `<div class="wrap"><div class="empty"><b>No rigs yet</b>${isMe ? 'Post your first one.' : ''}</div></div>`}
    </section>

    ${myPosts.length ? `<section class="sec"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Journal</div><h2 class="h-sec">${isMe ? 'Your' : first + "'s"} <span class="serif">stories.</span></h2></div></div><div class="jgrid" style="padding-bottom:0">${myPosts.map((p) => storyCard(p)).join('')}</div></div></section>` : ''}

    <section class="sec dark" id="s-pitch"><div class="wrap pitch">
      <div class="rv"><div class="eyebrow">${a.openToSponsors ? 'Open to sponsorship' : 'Not looking right now'}</div><h2 class="h-sec">The <span class="glow-text">pitch.</span></h2>
        <p class="pitch-quote">${a.pitch ? '“' + esc(a.pitch) + '”' : esc(isMe ? 'Write a short pitch in Edit profile: who your audience is and what you can offer a brand.' : 'No pitch yet.')}</p>
        ${a.openToSponsors && !a.isMe ? `<button type="button" class="pill pill-pop" data-act="contactAthlete" data-id="${a.id}">Contact for sponsorship</button>` : ''}</div>
      <div class="pitch-chart rv d2"><div class="eyebrow">Audience · last 12 weeks</div>${spark(a.growth && a.growth.length > 2 ? a.growth : [0, 0], 600, 110, '#C6FF3D')}
        <div class="row"><div class="prof-stat" style="text-align:left"><b style="font-size:30px">${fmtK(followers(a))}</b><span>Audience</span></div><div class="prof-stat"><b style="font-size:30px">${g ? '+' + g.toFixed(0) + '%' : '—'}</b><span>Growth</span></div><div class="prof-stat" style="text-align:right"><b style="font-size:30px">${a.engagement ? a.engagement.toFixed(1) + '%' : '—'}</b><span>Engagement</span></div></div></div>
    </div></section>`;
  }
  function goalHTML(g, isMe, i) {
    const pct = goalPct(g), days = Math.ceil((g.due - Date.now()) / DAY);
    return `<div class="goal rv d${(i % 3) + 1}"><div class="goal-top"><b>${pct >= 1 ? '🏆 ' : ''}${esc(g.title)}</b><span class="tag ${pct >= 1 ? 'pop' : ''}">${pct >= 1 ? 'Done' : days >= 0 ? days + 'd left' : 'Past due'}</span></div>
      <div class="goal-big">${esc(fmtGoal(g, g.current))} <small>/ ${esc(fmtGoal(g, g.target))}</small></div>
      <div class="bar"><i data-bar="${(pct * 100).toFixed(1)}"></i></div>
      <div class="goal-nums"><span>Started at ${esc(fmtGoal(g, g.start))}</span><span>${Math.round(pct * 100)}%</span></div>
      ${isMe ? `<form class="goal-edit" data-form="goal" data-id="${esc(g.id)}"><input name="v" type="number" step="any" value="${esc(g.current)}" aria-label="Update progress"><button class="pill pill-sm">Update</button><button type="button" class="icon-btn" data-act="deleteGoal" data-id="${esc(g.id)}" aria-label="Delete goal">${xIcon}</button></form>` : ''}</div>`;
  }

  const VIEWS = { home: viewHome, rigs: viewRigs, athletes: viewAthletes, scout: viewScout, journal: viewJournal, article: viewArticle, athlete: viewAthlete };
  const AFTER = {
    home() {
      setPart(ui.part);
      renderLiked(); renderLb(false); renderGoals(); renderSport(false); renderRaces(); renderFeed(); renderMarquee(); renderCmpTiles();
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
  const ART_FOR = { Running: 'shoe', Skiing: 'ski', Snowboard: 'board', Lifting: 'barbell', Triathlon: 'tt', Climbing: 'climb', Cycling: 'road' };
  function openComposer(tab) {
    if (!claimed()) { openEditor(true, tab || ui.composeTab || 'rig'); return; }
    ui.composeTab = tab || ui.composeTab || 'rig';
    const m = openLayer(`<div class="modal-head"><h2>New post</h2></div><div class="modal-body"><div class="seg">${[['rig', '📸 Rig'], ['post', '✍️ Story'], ['goal', '🎯 Goal'], ['race', '🏁 Race']].map(([k, l]) => `<button type="button" data-act="composeTab" data-tab="${k}" class="${ui.composeTab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="composeBody" style="margin-top:16px">${composeForm(ui.composeTab)}</div></div>`, 'sm', { label: 'New post' });
    wireDrops(m);
  }
  const sportOpts = (sel) => SPORTS.map((s) => `<option ${s === sel ? 'selected' : ''}>${s}</option>`).join('');
  const dropHTML = (label) => `<label class="drop"><input type="file" name="photo" accept="image/*"><span class="hint"><b>${label}</b><span>Drop a photo or tap to choose · JPG / PNG</span></span></label>`;
  function composeForm(t) {
    const sp = U.me.sport || 'Cycling';
    const in30 = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10);
    const foot = (label) => `<div class="form-foot"><button type="button" class="pill pill-line" data-act="close">Cancel</button><button class="pill">${label}</button></div>`;
    if (t === 'post') return `<form class="form" data-form="post">${dropHTML('Cover photo (optional)')}<label class="field"><span>Title</span><input name="title" required maxlength="90" placeholder="What I learned from my first century"></label><label class="field"><span>Sport</span><select name="sport">${sportOpts(sp)}</select></label><label class="field"><span>Story</span><textarea name="body" required rows="8" maxlength="12000" placeholder="Write it like you'd tell a friend. Leave a blank line between paragraphs."></textarea></label>${foot('Publish')}</form>`;
    if (t === 'goal') return `<form class="form" data-form="newgoal"><label class="field"><span>Goal</span><input name="title" required maxlength="80" placeholder="Deadlift 300 lb · Half marathon under 1:30 · Everest Challenge"></label><div class="form-2"><label class="field"><span>Where you are now</span><input name="current" type="number" step="any" required placeholder="245"></label><label class="field"><span>Target</span><input name="target" type="number" step="any" required placeholder="300"></label></div><div class="form-2"><label class="field"><span>Unit</span><select name="unit"><option value="lb">lb</option><option value="kg">kg</option><option value="km">km</option><option value="mi">mi</option><option value="m">m (elevation)</option><option value="min">minutes (time)</option><option value="W">watts</option><option value="place">race place</option><option value="days">days</option><option value="%">percent</option></select></label><label class="field"><span>Deadline</span><input name="due" type="date" required value="${in30}"></label></div><label class="switch">Lower is better (times, race places)<input type="checkbox" name="lower"><span class="knob"></span></label>${foot('Set goal')}</form>`;
    if (t === 'race') return `<form class="form" data-form="race"><label class="field"><span>Race or event</span><input name="name" required maxlength="80" placeholder="Twin Peaks Hill Climb"></label><div class="form-2"><label class="field"><span>Sport</span><select name="sport">${sportOpts(sp)}</select></label><label class="field"><span>Date</span><input name="date" type="date" required value="${in30}"></label></div><div class="form-2"><label class="field"><span>City</span><input name="city" maxlength="60" placeholder="San Francisco, CA"></label><label class="field"><span>Distance / format</span><input name="distance" maxlength="40" placeholder="Half marathon"></label></div>${foot('Add race')}</form>`;
    return `<form class="form" data-form="rig">${dropHTML('Add your photo')}<label class="field"><span>Name it</span><input name="title" required maxlength="60" placeholder="Dirt Road Daily"></label><div class="form-2"><label class="field"><span>Sport</span><select name="sport">${sportOpts(sp)}</select></label><label class="field"><span>Type</span><select name="type"><option value="Bike">Bike</option><option value="Workstation">Workstation</option><option value="Kit">Gear</option></select></label></div><label class="field"><span>Caption</span><input name="caption" maxlength="200" placeholder="What makes it yours?"></label><label class="field"><span>Build sheet</span><textarea name="specs" rows="4" maxlength="2000" placeholder="Frame: Steel, 56 cm&#10;Wheels: Carbon, 45 mm&#10;Tires: 32 mm tubeless"></textarea><small>One part per line, like “Part: details”.</small></label>${foot('Post rig')}</form>`;
  }

  function openEditor(claimFirst, thenTab) {
    const m = U.me, s = m.socials || {};
    const hues = [95, 160, 190, 215, 265, 300, 330, 28, 45];
    const html = `<div class="modal-head"><h2>${claimed() ? 'Edit profile' : '✦ Claim your profile'}</h2></div><div class="modal-body">
      ${claimFirst ? '<p class="muted" style="margin-top:0">Quick setup first, so people know who posted it.</p>' : ''}
      <form class="form" data-form="profile" data-then="${esc(thenTab || '')}">
        <div style="display:flex;gap:16px;align-items:center"><label class="drop" style="width:96px;height:96px;border-radius:50%;flex:none">${safeImg(m.photo) ? `<img src="${safeImg(m.photo)}" alt="">` : '<span class="hint"><b style="font-size:13px">Photo</b></span>'}<input type="file" name="photo" accept="image/*" aria-label="Profile photo"></label>
        <div class="field" style="flex:1"><span>Orb color</span><div class="hues">${hues.map((h) => `<button type="button" data-act="hue" data-hue="${h}" class="${Number(m.hue) === h ? 'on' : ''}" style="background:linear-gradient(145deg,hsl(${h} 90% 80%),hsl(${h - 40} 95% 60%))" aria-label="Color ${h}"></button>`).join('')}</div><input type="hidden" name="hue" value="${esc(m.hue)}"></div></div>
        <div class="form-2"><label class="field"><span>Name</span><input name="name" required maxlength="40" value="${esc(m.name)}" placeholder="Your name"></label><label class="field"><span>Handle</span><input name="handle" required maxlength="31" pattern="@?[A-Za-z0-9._]{2,30}" value="${esc(m.handle)}" placeholder="@yourname"></label></div>
        <div class="form-2"><label class="field"><span>Main sport</span><select name="sport">${sportOpts(m.sport)}</select></label><label class="field"><span>City</span><input name="city" maxlength="50" value="${esc(m.city)}" placeholder="San Francisco, CA"></label></div>
        <label class="field"><span>Bio</span><input name="bio" maxlength="140" value="${esc(m.bio)}" placeholder="One line about you"></label>
        <div class="eyebrow" style="margin-top:6px">Links</div>
        <div class="form-2"><label class="field"><span>Strava profile URL</span><input name="strava" type="url" value="${esc(s.strava || '')}" placeholder="https://www.strava.com/athletes/…"></label><label class="field"><span>Instagram handle</span><input name="instagram" value="${esc(s.instagram || '')}" placeholder="@you"></label></div>
        <div class="form-2"><label class="field"><span>Spotify playlist or profile URL</span><input name="spotify" type="url" value="${esc(s.spotify || '')}" placeholder="https://open.spotify.com/…"></label><label class="field"><span>YouTube URL</span><input name="youtube" type="url" value="${esc(s.youtube || '')}" placeholder="https://youtube.com/@…"></label></div>
        <div class="form-2"><label class="field"><span>TikTok handle</span><input name="tiktok" value="${esc(s.tiktok || '')}" placeholder="@you"></label><label class="field"><span>Website</span><input name="website" type="url" value="${esc(s.website || '')}" placeholder="https://…"></label></div>
        <div class="eyebrow" style="margin-top:6px">Sponsors</div>
        <label class="switch">Open to sponsors<input type="checkbox" name="open" ${m.openToSponsors ? 'checked' : ''}><span class="knob"></span></label>
        <label class="field"><span>Your pitch</span><textarea name="pitch" rows="3" maxlength="400" placeholder="Who follows you, what you post, and what you can offer a brand.">${esc(m.pitch)}</textarea></label>
        <label class="field"><span>Sponsor contact email</span><input name="contact" type="email" value="${esc(m.contact)}" placeholder="you@email.com"><small>Only used for the “Contact for sponsorship” button on your pitch.</small></label>
        <div class="form-foot"><button type="button" class="pill pill-line" data-act="close">Cancel</button><button class="pill">${claimed() ? 'Save' : 'Claim profile'}</button></div>
      </form></div>`;
    const md = openLayer(html, 'sm', { label: 'Edit profile', focus: 'input[name=name]' });
    wireDrops(md);
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
    openLayer(`<div class="modal-body about"><div class="eyebrow">About</div><h3>Show your gear. <span class="serif">Chase your season.</span></h3>
      <p>${BRAND} is a home for athletes of every sport to show off their bikes, gear and workstations, put their season goals and races in public, and get scouted by the brands that want to back them.</p>
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
      const m = U.me;
      const photo = dropData(f);
      Object.assign(m, {
        name: v('name').slice(0, 40), handle, sport: SPORTS.includes(v('sport')) ? v('sport') : 'Cycling', city: v('city').slice(0, 50), bio: v('bio').slice(0, 140),
        hue: clamp(Number(v('hue')) || 95, 0, 360), openToSponsors: !!fd.get('open'), pitch: v('pitch').slice(0, 400), contact: isEmail(v('contact')) ? v('contact') : '',
        socials: { strava: safeUrl(v('strava')), instagram: cleanHandle(v('instagram')), spotify: safeUrl(v('spotify')), youtube: safeUrl(v('youtube')), tiktok: cleanHandle(v('tiktok')), website: safeUrl(v('website')) }
      });
      if (photo) m.photo = photo;
      if (!save()) return;
      paintMe();
      const then = f.dataset.then;
      closeTop();
      if (!stack.length) rerender();
      if (then) setTimeout(() => openComposer(then), 220);
      else toast(v('contact') && !m.contact ? 'Saved. That contact email didn’t look right, so it was skipped.' : 'Profile saved ✦');
      return;
    }
    if (kind === 'rig') {
      const type = ['Bike', 'Workstation', 'Kit'].includes(v('type')) ? v('type') : 'Kit';
      const sport = SPORTS.includes(v('sport')) ? v('sport') : 'Cycling';
      const specs = v('specs').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 20).map((l) => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim().slice(0, 30), l.slice(i + 1).trim().slice(0, 80)] : ['Part', l.slice(0, 80)]; });
      const r = { id: uid('uk'), athleteId: 'me', title: v('title').slice(0, 60) || 'My rig', sport, type, art: type === 'Workstation' ? 'stand' : (type === 'Bike' && sport !== 'Triathlon' ? 'road' : ART_FOR[sport] || 'bags'), hue: U.me.hue, likes: 0, createdAt: Date.now(), caption: v('caption').slice(0, 200), specs, photo: dropData(f) };
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
      const p = { id: uid('up'), athleteId: 'me', sport: SPORTS.includes(v('sport')) ? v('sport') : 'Cycling', title: v('title').slice(0, 90), body: v('body').slice(0, 12000), likes: 0, createdAt: Date.now(), art: ART_FOR[v('sport')] || 'road', hue: U.me.hue, photo: dropData(f) };
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
      const r = { id: uid('ur'), name: v('name').slice(0, 80), sport: SPORTS.includes(v('sport')) ? v('sport') : 'Cycling', city: v('city').slice(0, 60) || '—', date, distance: v('distance').slice(0, 40) || 'Race', athletes: [], interested: 0 };
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

  function paintMe() {
    const b = $('#meBtn');
    b.innerHTML = claimed() ? av(meAthlete(), 32) : `<span class="av" style="--s:32px;--h:95" title="Claim your profile">✦</span>`;
    b.setAttribute('aria-label', claimed() ? 'Your profile' : 'Claim your profile');
  }
  $('#meBtn').addEventListener('click', () => claimed() ? go('#/athlete/me') : openEditor());
  $('#searchBtn').addEventListener('click', openPalette);
  $('#newBtn').addEventListener('click', () => openComposer());
  $('#tabNew').addEventListener('click', () => openComposer());

  window.addEventListener('resize', debounce(() => { onScroll(); $$('.rail').forEach(railUpdate); }, 100));
  window.addEventListener('hashchange', route);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------------------------------------------------------------- boot */
  paintMe();
  route();
  try { if (!localStorage.getItem(SEEN_KEY)) { localStorage.setItem(SEEN_KEY, '1'); setTimeout(() => { if (!stack.length) toast(`Welcome to <b>${BRAND}</b> ✦ scroll to explore`); }, 1200); } } catch (e) { /* ignore */ }
})();
