/* COOLDOWN tab icon: a chrome water drop with glitter, drawn live.
   Every ~1.2 seconds:
   - a bright sheen sweeps across the drop and a sparkle pops
   - a droplet swells at the tip, lets go and drips off the bottom,
     and the drop wobbles as it lets go
   Glitter twinkles all the time, the reflection slides as you scroll,
   and hovering or tapping the logo (or coming back to the tab) makes it
   drip faster for a moment.
   Browsers that don't redraw tab icons (Safari) keep the static
   assets/favicon.svg, which is the same chrome drop. */
(function () {
  'use strict';
  const link = document.getElementById('tabIcon');
  if (!link) return;
  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext && cv.getContext('2d');
  if (!g || typeof Path2D !== 'function') return;
  let drop;
  try { drop = new Path2D('M32 3C32 3 11 30 11 44.5a21 21 0 0 0 42 0C53 30 32 3 32 3Z'); } catch (_) { return; }
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the drop sits in the top ~3/4 of the icon so the drip has room to fall
  const K = 0.74, TX = 32 - 32 * K, TY = 1 - 3 * K; // scale + offset
  const TIP_Y = TY + 65.5 * K; // bottom of the drop, about 49

  // glitter specks inside the drop, in the drop's own coordinates (fixed seed)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const specks = [];
  while (specks.length < 24) {
    const x = 13 + rnd() * 38, y = 12 + rnd() * 50;
    if (g.isPointInPath(drop, x, y)) specks.push({ x, y, r: 1 + rnd() * 1.4, ph: rnd() * Math.PI * 2 });
  }

  function chrome(x0, y0, x1, y1) {
    const c = g.createLinearGradient(x0, y0, x1, y1);
    c.addColorStop(0, '#ffffff');
    c.addColorStop(0.2, '#dfe7f2');
    c.addColorStop(0.4, '#93a3ba');
    c.addColorStop(0.5, '#1c2a44');
    c.addColorStop(0.56, '#3d5f96');
    c.addColorStop(0.66, '#d6e3f5');
    c.addColorStop(0.78, '#ffffff');
    c.addColorStop(0.9, '#a9bbd4');
    c.addColorStop(1, '#55657e');
    return c;
  }
  function star(x, y, r, a) {
    if (a <= 0.02) return;
    g.save();
    g.globalAlpha = Math.min(1, a);
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
    g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r);
    g.fill();
    g.restore();
  }
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* k: 0..1 position in the drip cycle. shift: scroll-driven reflection. t: ms */
  function draw(k, shift, t) {
    g.clearRect(0, 0, S, S);
    // phases: swell 0-.42, let go at .42, fall .42-.8, rest after
    const swell = Math.min(1, k / 0.42);
    const fall = k < 0.42 ? -1 : Math.min(1, (k - 0.42) / 0.38);
    // wobble when the droplet lets go (squash, then settle)
    const wob = fall >= 0 && fall < 1 ? Math.sin(fall * Math.PI * 3) * (1 - fall) * 0.06 : 0;
    const sx = 1 + wob, sy = 1 - wob;

    // ---- main drop
    g.save();
    g.translate(32, TIP_Y); g.scale(sx, sy); g.translate(-32, -TIP_Y);
    g.translate(TX, TY); g.scale(K, K);
    const o = (shift || 0) * 10;
    g.fillStyle = chrome(14 - o, 4, 50 + o, 64);
    g.fill(drop);
    g.save();
    g.clip(drop);
    const rim = g.createRadialGradient(30, 42, 10, 32, 42, 26);
    rim.addColorStop(0.6, 'rgba(46,123,255,0)');
    rim.addColorStop(1, 'rgba(46,123,255,.55)');
    g.fillStyle = rim;
    g.fillRect(0, 0, S, S);
    // sheen sweeps across in the first half of each cycle
    const sweep = k < 0.55 ? k / 0.55 : -1;
    if (sweep >= 0) {
      const x = -30 + sweep * 110;
      const sh = g.createLinearGradient(x - 14, 0, x + 14, 18);
      sh.addColorStop(0, 'rgba(255,255,255,0)');
      sh.addColorStop(0.5, 'rgba(255,255,255,.95)');
      sh.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = sh;
      g.fillRect(0, 0, S, S);
    }
    for (const p of specks) {
      const tw = 0.5 + 0.5 * Math.sin(t / 110 + p.ph * 3);
      const near = sweep >= 0 ? Math.max(0, 1 - Math.abs((p.x + p.y * 0.4) - (-30 + sweep * 110 + 14)) / 18) : 0;
      g.globalAlpha = 0.2 + tw * 0.35 + near * 0.6;
      g.fillStyle = '#fff';
      g.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    }
    g.globalAlpha = 1;
    g.restore();
    g.globalAlpha = 0.85;
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(22.5, 42, 3.6, 7.2, -0.32, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    g.lineWidth = 2.6;
    g.strokeStyle = '#13213a';
    g.stroke(drop);
    g.restore();

    // ---- the drip
    if (fall < 0) {
      // bead swelling at the tip
      const r = 1 + ease(swell) * 4.2;
      const cy = TIP_Y - 1 + r * 0.85;
      g.fillStyle = chrome(32 - r, cy - r, 32 + r, cy + r);
      g.beginPath(); g.ellipse(32, cy, r * 0.92, r, 0, 0, Math.PI * 2); g.fill();
      g.lineWidth = 1.6; g.strokeStyle = '#13213a'; g.stroke();
      if (r > 2.5) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(30.6, cy - r * 0.25, r * 0.3, 0, Math.PI * 2); g.fill(); }
    } else if (fall < 1) {
      // falling droplet, stretched by speed, leaving the bottom of the icon
      const y = TIP_Y + 3 + fall * fall * 22;
      const rx = 3.6, ry = 4.4 + fall * 2.2;
      g.fillStyle = chrome(32 - rx, y - ry, 32 + rx, y + ry);
      g.beginPath();
      g.moveTo(32, y - ry * 1.5);
      g.bezierCurveTo(32 + rx * 0.4, y - ry * 0.6, 32 + rx, y - ry * 0.2, 32 + rx, y + ry * 0.25);
      g.arc(32, y + ry * 0.25, rx, 0, Math.PI);
      g.bezierCurveTo(32 - rx, y - ry * 0.2, 32 - rx * 0.4, y - ry * 0.6, 32, y - ry * 1.5);
      g.fill();
      g.lineWidth = 1.6; g.strokeStyle = '#13213a'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.beginPath(); g.arc(30.8, y, 1.1, 0, Math.PI * 2); g.fill();
    }

    // sparkles pop as the sheen passes
    if (sweep >= 0) {
      star(TX + 22 * K, TY + 30 * K, 7, 1 - Math.abs(sweep - 0.25) / 0.22);
      star(TX + 42 * K, TY + 50 * K, 6, 1 - Math.abs(sweep - 0.6) / 0.22);
    }
  }

  let last = '';
  function push() {
    let url;
    try { url = cv.toDataURL('image/png'); } catch (_) { return; }
    if (url === last) return;
    last = url;
    link.type = 'image/png';
    link.href = url;
  }

  let shift = 0;
  if (reduce) { draw(0.3, 0, 0); push(); return; } // Reduce Motion: a still chrome drop

  const CYCLE = 1200; // one glisten + drip about every second
  const FAST = 650;   // quicker drips right after you hover or tap the logo
  let phase = 0, prev = performance.now(), fastUntil = 0;
  function tick() {
    const now = performance.now();
    const cycle = now < fastUntil ? FAST : CYCLE;
    phase = (phase + Math.min(250, now - prev) / cycle) % 1;
    prev = now;
    draw(phase, shift, now);
    push();
  }
  // ~16 frames a second; browsers slow this down in background tabs, which is fine
  setInterval(tick, 60);
  tick();

  window.addEventListener('scroll', () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    shift = Math.sin((scrollY / max) * Math.PI * 4);
  }, { passive: true });

  function burst() { fastUntil = performance.now() + 2600; phase = 0; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) burst(); });
  window.cdTabIcon = { shine: burst };
})();
