/* =========================================================================
   Line-art illustrations
   - KR_ART(kind, hue, uid): card illustrations for demo rigs and stories.
   - KR_BIKE(opts): a bike split into named parts (frame, wheels, drive,
     cockpit). Every stroke is a <path> with pathLength="1", so CSS can
     "draw" it on scroll by animating stroke-dashoffset from 1 to 0.
   Real photo uploads replace the card illustrations.
   ========================================================================= */
(function () {
  'use strict';

  const INK = '#111114';
  const POP = '#2E7BFF';

  /* ---------- shared bike geometry ---------- */
  const R = [78, 122], F = [204, 122], BB = [134, 124], S = [121, 68], H = [186, 64], HB = [190, 82];

  const n = (v) => +v.toFixed(1);
  const lineD = (a, b) => `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
  const circD = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${n(r * 2)} 0a${r} ${r} 0 1 0 ${n(-r * 2)} 0`;
  const P = (d, w, extra) => `<path pathLength="1" d="${d}" stroke-width="${w}" ${extra || ''}/>`;

  function wheelParts(cx, cy, o) {
    const r = o.r || 40;
    let s = o.knobs
      ? `<path class="nodraw" d="${circD(cx, cy, r)}" stroke-width="${o.tire || 4}" stroke-dasharray="3 3"/>`
      : P(circD(cx, cy, r), o.tire || 4);
    if (o.knobs) s += P(circD(cx, cy, r - 2), 2.4);
    s += P(circD(cx, cy, r - (o.deep ? 11 : 6)), o.deep ? 7 : 1.6, 'stroke-opacity=".85"');
    if (!o.deep) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        s += P(lineD([cx, cy], [cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)]), 0.8, 'stroke-opacity=".5"');
      }
    }
    s += `<circle cx="${cx}" cy="${cy}" r="3.2" class="hub"/>`;
    return s;
  }

  /** Bike drawn as grouped parts. opts: tire, knobs, deep, disc, bar, susp, bags, r */
  function bikeParts(o) {
    o = o || {};
    const wheels =
      `<g class="spin" style="transform-origin:${R[0]}px ${R[1]}px">${wheelParts(R[0], R[1], { r: o.r, tire: o.tire, knobs: o.knobs, deep: o.deep && o.disc })}</g>` +
      `<g class="spin" style="transform-origin:${F[0]}px ${F[1]}px">${wheelParts(F[0], F[1], { r: o.r, tire: o.tire, knobs: o.knobs, deep: o.deep })}</g>`;
    let frame = P(lineD(R, BB), 3.4) + P(lineD(R, S), 3) + P(lineD(S, BB), 4.4) + P(lineD(S, H), 4.4) + P(lineD(HB, BB), 5) + P(lineD(H, HB), 5) + P(lineD(HB, F), o.susp ? 7 : 3.6);
    frame += P(lineD(S, [117, 52]), 3.4) + P('M103 50q14 -5 28 0', 5);
    if (o.susp) frame += `<rect x="124" y="84" width="22" height="9" rx="4.5" transform="rotate(-28 135 88)" class="accent"/>`;
    if (o.bags) frame += `<path class="accent" d="M126 74L178 70L140 112Z"/>`;
    let cockpit = P(lineD(H, [194, 56]), 3.6);
    if (o.bar === 'bmx') cockpit = P(lineD(H, [192, 50]), 3.6) + P('M182 52L188 30M202 52L196 30M184 40h16', 3.4) + P(lineD([180, 30], [204, 30]), 4.2) + P(lineD([150, 128], [160, 128]), 5) + P(lineD([70, 128], [84, 128]), 5);
    else if (o.bar === 'flat') cockpit += P(lineD([184, 54], [208, 52]), 4);
    else if (o.bar === 'aero') cockpit += P(lineD([192, 56], [226, 54]), 3.6);
    else cockpit += P('M194 56h10q10 0 10 10q0 9 -8 11', 3.6);
    let drive = `<circle cx="${BB[0]}" cy="${BB[1]}" r="10" class="accent"/>`;
    drive += P(lineD(BB, [146, 138]), 3.4) + P(`M${R[0]} ${R[1] - 6}L${BB[0]} ${BB[1] - 10}M${R[0]} ${R[1] + 6}L${BB[0]} ${BB[1] + 10}`, 1.2, 'stroke-opacity=".6"');
    return `<g class="part part-wheels">${wheels}</g><g class="part part-frame">${frame}</g><g class="part part-drive">${drive}</g><g class="part part-cockpit">${cockpit}</g>`;
  }

  const BIKE_OPTS = {
    road: { tire: 3.4 },
    gravel: { tire: 5.4, knobs: true },
    bags: { tire: 5.4, knobs: true, bags: true },
    track: { tire: 3, deep: true, disc: true, bar: 'drop' },
    tt: { tire: 3, deep: true, disc: true, bar: 'aero' },
    mtb: { tire: 7, knobs: true, susp: true, bar: 'flat', r: 41 },
    bmx: { tire: 7, bar: 'bmx', r: 34 }
  };

  /** Big, scroll-drawable bike for the hero and the product viewer. */
  function KR_BIKE(kind, cls, weight) {
    const o = BIKE_OPTS[kind] || BIKE_OPTS.road;
    const k = weight || 1;
    const body = bikeParts(o).replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${(Number(w) * k).toFixed(2)}"`);
    return `<svg class="bike ${cls || ''}" viewBox="40 24 200 146" preserveAspectRatio="xMidYMid meet" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  }

  /* ---------- small card illustrations (static) ---------- */
  function cardBike(o) {
    // same geometry as bikeParts, but static (no pathLength)
    return bikeParts(o);
  }

  const draw = {
    road: () => cardBike(BIKE_OPTS.road),
    gravel: () => cardBike(BIKE_OPTS.gravel),
    bags: () => cardBike(BIKE_OPTS.bags),
    track: () => cardBike(BIKE_OPTS.track),
    tt: () => cardBike(BIKE_OPTS.tt),
    mtb: () => cardBike(BIKE_OPTS.mtb),
    bmx: () => cardBike(BIKE_OPTS.bmx),
    shoe: () => `
      <g transform="translate(20 6)">
      <path d="M40 112C44 84 58 70 76 66L98 62C108 60 112 52 118 50L130 52C136 66 148 76 170 82C196 88 214 96 220 112L222 124L40 124Z" fill="#fff" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M38 124L224 124L222 136C160 142 90 142 40 136Z" class="accent" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M96 66l12 14M108 62l12 14M120 60l12 14" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M60 102C100 96 150 98 210 108" stroke-width="2" stroke-dasharray="4 4"/>
      </g>`,
    ski: () => `
      <g transform="rotate(-24 140 90)">
        <rect x="20" y="70" width="240" height="14" rx="7" fill="#fff" stroke-width="3"/>
        <rect x="26" y="96" width="240" height="14" rx="7" class="accent" stroke-width="3"/>
        <rect x="118" y="62" width="38" height="12" rx="3" class="ink"/>
        <rect x="124" y="88" width="38" height="12" rx="3" class="ink"/>
      </g>
      <path d="M58 30L96 160M80 26L112 160" stroke-width="3" stroke-linecap="round"/>
      <circle cx="91" cy="144" r="7" stroke-width="2"/><circle cx="108" cy="146" r="7" stroke-width="2"/>`,
    board: () => `
      <g transform="rotate(-18 140 90)">
        <rect x="30" y="66" width="220" height="48" rx="24" fill="#fff" stroke-width="3.4"/>
        <path d="M40 90H240" stroke-width="2" stroke-dasharray="6 5"/>
        <rect x="92" y="72" width="22" height="36" rx="6" class="accent" stroke-width="2.6"/>
        <rect x="166" y="72" width="22" height="36" rx="6" class="accent" stroke-width="2.6"/>
      </g>`,
    barbell: () => `
      <path d="M20 96H260" stroke-width="5" stroke-linecap="round"/>
      <rect x="44" y="46" width="16" height="100" rx="4" class="accent" stroke-width="3"/>
      <rect x="62" y="56" width="12" height="80" rx="3" fill="#fff" stroke-width="3"/>
      <rect x="76" y="66" width="8" height="60" rx="2" class="ink"/>
      <rect x="220" y="46" width="16" height="100" rx="4" class="accent" stroke-width="3"/>
      <rect x="206" y="56" width="12" height="80" rx="3" fill="#fff" stroke-width="3"/>
      <rect x="196" y="66" width="8" height="60" rx="2" class="ink"/>
      <path d="M118 150h44l-6 -14h-32z" fill="#fff" stroke-width="2.6" stroke-linejoin="round"/>`,
    stand: () => `
      <g stroke-width="1.2" stroke-opacity=".3">${Array.from({ length: 7 }, (_, i) => `<path d="M20 ${20 + i * 12}H260"/>`).join('')}</g>
      <g class="ink">${Array.from({ length: 30 }, (_, i) => `<circle cx="${28 + (i % 15) * 16}" cy="${32 + Math.floor(i / 15) * 36}" r="1.6"/>`).join('')}</g>
      <path d="M40 30v24M52 30l6 22M70 30v18h6M226 30v26M240 30l-4 24" stroke-width="3" stroke-linecap="round"/>
      <path d="M140 164V96" stroke-width="5"/><path d="M110 166h60" stroke-width="5" stroke-linecap="round"/>
      <rect x="128" y="86" width="24" height="14" rx="4" class="accent" stroke-width="2.6"/>
      <g transform="translate(70 20) scale(.5)">${cardBike({ tire: 4 })}</g>`,
    desk: () => `
      <rect x="40" y="100" width="200" height="8" rx="3" class="ink"/>
      <path d="M60 108V160M220 108V160" stroke-width="5"/>
      <rect x="70" y="40" width="100" height="56" rx="6" fill="#fff" stroke-width="3"/>
      <polyline points="80,84 98,70 112,76 130,58 146,66 160,52" stroke-width="2.6" stroke-linejoin="round"/>
      <rect x="182" y="72" width="44" height="26" rx="3" class="accent" stroke-width="2.6"/>
      <rect x="40" y="148" width="70" height="14" rx="7" class="accent" stroke-width="2.6"/>`,
    rack: () => `
      <path d="M70 20V160M210 20V160" stroke-width="7"/>
      <path d="M64 24H216" stroke-width="5"/>
      <path d="M40 78H240" stroke-width="4" stroke-linecap="round"/>
      <rect x="44" y="56" width="12" height="44" rx="3" class="accent" stroke-width="2.6"/>
      <rect x="224" y="56" width="12" height="44" rx="3" class="accent" stroke-width="2.6"/>
      <rect x="30" y="160" width="220" height="8" rx="3" class="ink"/>`,
    climb: () => `
      <g transform="rotate(-18 104 96)">
        <rect x="80" y="38" width="48" height="116" rx="24" fill="#fff" stroke-width="6"/>
        <path d="M128 70V112" stroke-width="7" class="gate"/>
        <rect x="120" y="70" width="16" height="42" rx="6" class="accent" stroke-width="2.6"/>
      </g>
      <circle cx="196" cy="104" r="48" stroke-width="5"/>
      <circle cx="196" cy="104" r="38" stroke-width="5" stroke-dasharray="10 6"/>
      <circle cx="196" cy="104" r="28" stroke-width="5"/>
      <path d="M150 140C170 160 210 168 250 150" stroke-width="5" stroke-linecap="round"/>`,
    wheelwall: () => {
      let s = '';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
        const cx = 50 + c * 60, cy = 52 + r * 74;
        s += wheelParts(cx, cy, { r: 26, tire: 3 });
        s += `<path d="M${cx} ${cy - 30}v-6" stroke-width="2.4" stroke-linecap="round"/>`;
        if ((r + c) % 3 === 0) s += `<rect x="${cx + 10}" y="${cy + 16}" width="16" height="10" rx="2" class="accent" stroke-width="1.6"/>`;
      }
      return s;
    }
  };

  function sparkle(x, y, s) {
    return `<path class="ink" d="M${x} ${y - s}C${x + s * .15} ${y - s * .15} ${x + s * .15} ${y - s * .15} ${x + s} ${y}C${x + s * .15} ${y + s * .15} ${x + s * .15} ${y + s * .15} ${x} ${y + s}C${x - s * .15} ${y + s * .15} ${x - s * .15} ${y + s * .15} ${x - s} ${y}C${x - s * .15} ${y - s * .15} ${x - s * .15} ${y - s * .15} ${x} ${y - s}Z"/>`;
  }

  /**
   * Card illustration. Neutral light backdrop with one soft colour glow
   * (hue) so the grid reads lively without turning everything green.
   */
  function art(kind, hue, uid) {
    const id = 'g' + String(uid || Math.random().toString(36).slice(2, 8)).replace(/[^a-zA-Z0-9_-]/g, '');
    const h = Number(hue) || 140;
    const body = (draw[kind] || draw.road)();
    return `<svg class="art" viewBox="0 0 280 180" preserveAspectRatio="xMidYMid meet" overflow="visible" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="210" cy="40" r="260">
          <stop offset="0" stop-color="hsl(${h} 95% 80%)" stop-opacity=".95"/>
          <stop offset=".55" stop-color="hsl(${h} 70% 90%)" stop-opacity=".55"/>
          <stop offset="1" stop-color="#F2F2F4" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect x="-700" y="-700" width="1680" height="1580" fill="#F2F2F4"/>
      <rect x="-700" y="-700" width="1680" height="1580" fill="url(#${id})"/>
      ${sparkle(250, 26, 7)}${sparkle(30, 156, 4.5)}
      <g class="draw" fill="none" stroke="${INK}">${body}</g>
    </svg>`;
  }

  window.KR_ART = art;
  window.KR_BIKE = KR_BIKE;
  window.KR_ART_KINDS = Object.keys(draw);
  window.KR_COLORS = { INK, POP };
})();
