/* =========================================================================
   COOLDOWN 3D avatars: glossy vinyl-toy riders built live with three.js.

   Uses the same settings as the 2D avatar (js/avatar.js), so everything a
   rider picks in the avatar maker shows up here in 3D.

   CD_AVATAR3D.ok                 true when the browser can draw 3D
   CD_AVATAR3D.headURL(cfg, px)   a still picture of the head (for small bubbles)
   CD_AVATAR3D.mount(el, cfg)     a live, spinnable figure inside el
                                  -> { update(cfg), wave(), dispose() }
   ========================================================================= */
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const A = window.CD_AVATAR; // 2D module: options, cleaning, labels
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeRenderer(w, h, keep) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!keep, powerPreference: 'low-power' });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.setClearColor(0x000000, 0);
  return r;
}

let shared = null, envTex = null;
function env(renderer) {
  if (envTex) return envTex;
  const pm = new THREE.PMREMGenerator(renderer);
  envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return envTex;
}
function makeScene(renderer) {
  const scene = new THREE.Scene();
  scene.environment = env(renderer);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2.5, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc4ff, 1.4); rim.position.set(-4, 3, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 0.55));
  return scene;
}

/* ---------------------------------------------------------------- materials */
const matCache = new Map();
function vinyl(color, o) {
  o = o || {};
  const k = color + JSON.stringify(o);
  if (matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color), roughness: o.rough != null ? o.rough : 0.32, metalness: o.metal || 0,
    clearcoat: o.coat != null ? o.coat : 1, clearcoatRoughness: o.coatRough != null ? o.coatRough : 0.12,
    sheen: o.sheen || 0, iridescence: o.irid || 0, iridescenceIOR: 1.6, transparent: !!o.opacity, opacity: o.opacity != null ? o.opacity : 1,
    side: o.double ? THREE.DoubleSide : THREE.FrontSide
  });
  matCache.set(k, m);
  return m;
}
const skinMat = (c) => vinyl(c, { rough: 0.42, coat: 0.55, coatRough: 0.25, sheen: 0.4 });
const darker = (hex, amt) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#000000'), amt).getHexString();

// jersey / skinsuit artwork painted on a canvas, wrapped around the torso
const texCache = new Map();
function kitTexture(a) {
  const pat = ['jersey', 'singlet', 'tee', 'trisuit', 'longsleeve'].includes(a.top) ? a.pattern : 'solid';
  const k = [a.top, a.topColor, a.topColor2, pat, a.extras.includes('bib') ? a.number : ''].join('|');
  if (texCache.has(k)) return texCache.get(k);
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = a.topColor; g.fillRect(0, 0, 512, 256);
  g.fillStyle = a.topColor2;
  // u runs around the body (front is the middle of the canvas), v runs top to bottom
  if (pat === 'stripes') for (let x = 0; x < 512; x += 64) g.fillRect(x + 20, 0, 22, 256);
  if (pat === 'hoops') for (let y = 70; y < 256; y += 56) g.fillRect(0, y, 512, 20);
  if (pat === 'sash') { g.beginPath(); g.moveTo(170, 0); g.lineTo(230, 0); g.lineTo(350, 256); g.lineTo(290, 256); g.fill(); }
  if (pat === 'dots') for (let y = 40; y < 256; y += 48) for (let x = (y / 48) % 2 ? 24 : 0; x < 512; x += 48) { g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); }
  if (pat === 'split') g.fillRect(256, 0, 256, 256);
  if (a.top === 'trisuit') { g.fillRect(118, 0, 18, 256); g.fillRect(376, 0, 18, 256); }
  if (a.top === 'jersey' || a.top === 'longsleeve') {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(253, 18, 6, 238); // zip
    g.fillStyle = pat === 'split' ? a.topColor : a.topColor2; g.font = '800 34px Bricolage, sans-serif'; g.textAlign = 'center'; g.fillText('CD', 300, 92);
  }
  if (a.top === 'apron') { g.fillStyle = a.topColor2; g.fillRect(150, 40, 212, 216); g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '800 30px Bricolage, sans-serif'; g.textAlign = 'center'; g.fillText('SHOP', 256, 200); }
  if (a.extras.includes('bib')) { g.fillStyle = '#ffffff'; g.fillRect(206, 100, 100, 74); g.fillStyle = '#15161a'; g.font = '800 48px Bricolage, sans-serif'; g.textAlign = 'center'; g.fillText(a.number, 256, 154); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(k, t);
  return t;
}

/* ---------------------------------------------------------------- geometry */
const G = {
  sphere: new THREE.SphereGeometry(1, 48, 32),
  cap: (t) => new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, t),
  capsule: (r, l) => new THREE.CapsuleGeometry(r, l, 10, 24),
  cyl: (r1, r2, h, open) => new THREE.CylinderGeometry(r1, r2, h, 40, 1, !!open),
  torus: (r, t, arc) => new THREE.TorusGeometry(r, t, 16, 48, arc || Math.PI * 2),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d)
};
const mesh = (geo, mat, pos, scl, rot) => {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (scl) m.scale.set(scl[0], scl[1], scl[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  return m;
};

const HEAD_Y = 2.25;

function buildHair(a) {
  const g = new THREE.Group(), m = vinyl(a.hairColor, { rough: 0.5, coat: 0.6 });
  const hidden = ['road', 'aero', 'mtbhelmet', 'skihelmet', 'climbhelmet', 'swimcap', 'beanie'].includes(a.head);
  const capHair = (t, s) => { const c = mesh(G.cap(t), m, [0, HEAD_Y + 0.02, -0.02], [s, s * 0.98, s]); c.rotation.x = -0.25; return c; };
  if (a.hair === 'long') g.add(mesh(G.capsule(0.62, 0.9), m, [0, HEAD_Y - 0.7, -0.45], [1.35, 1, 0.55]));
  if (a.hair === 'ponytail') g.add(mesh(G.capsule(0.2, 0.7), m, [0, HEAD_Y - 0.25, -1.05], null, [0.5, 0, 0]));
  if (hidden) return g;
  if (a.hair === 'bald') return g;
  if (a.hair === 'buzz') g.add(capHair(1.25, 1.02));
  else if (a.hair === 'curly') { g.add(capHair(1.2, 1.03)); for (let i = 0; i < 16; i++) { const th = (i / 16) * Math.PI * 2, ph = 0.55 + (i % 3) * 0.28; g.add(mesh(G.sphere, m, [Math.sin(th) * Math.sin(ph) * 1.02, HEAD_Y + Math.cos(ph) * 1.0, Math.cos(th) * Math.sin(ph) * 0.95 - 0.05], [0.28, 0.28, 0.28])); } }
  else { g.add(capHair(1.35, 1.045)); if (a.hair === 'bun') g.add(mesh(G.sphere, m, [0, HEAD_Y + 1.12, -0.25], [0.36, 0.34, 0.36])); }
  return g;
}

function buildHeadwear(a) {
  const g = new THREE.Group(), c = a.headColor, m = vinyl(c), dark = vinyl('#15161a', { rough: 0.4 });
  const shell = (t, sx, sy, sz, z) => mesh(G.cap(t), m, [0, HEAD_Y + 0.05, z || 0], [sx, sy, sz]);
  const straps = () => { [-1, 1].forEach((s) => g.add(mesh(G.cyl(0.025, 0.025, 0.85), dark, [s * 0.86, HEAD_Y - 0.3, 0.15], null, [0, 0, s * 0.12]))); };
  if (a.head === 'road' || a.head === 'mtbhelmet') {
    g.add(shell(1.25, 1.13, 1.05, 1.18, -0.03));
    for (let i = -2; i <= 2; i++) g.add(mesh(G.capsule(0.06, 0.55), dark, [i * 0.3, HEAD_Y + 0.98 - Math.abs(i) * 0.12, 0.05], [1, 1, 1], [Math.PI / 2 - 0.15, 0, i * 0.18]));
    if (a.head === 'mtbhelmet') g.add(mesh(G.box(1.3, 0.06, 0.45), vinyl(darker(c, 0.25)), [0, HEAD_Y + 0.62, 1.05], null, [0.35, 0, 0]));
    straps();
  } else if (a.head === 'aero') {
    g.add(shell(1.3, 1.14, 1.06, 1.15, -0.05));
    g.add(mesh(G.capsule(0.55, 0.9), m, [0, HEAD_Y + 0.35, -1.0], [1.2, 0.8, 1], [Math.PI / 2 - 0.35, 0, 0]));
    straps();
  } else if (a.head === 'cap' || a.head === 'runcap') {
    g.add(shell(1.15, 1.06, 1.0, 1.06));
    g.add(mesh(G.cyl(0.62, 0.62, 0.05), vinyl(darker(c, 0.2)), [0, HEAD_Y + 0.48, 0.95], [1, 1, 0.75], [0.35, 0, 0]));
    g.add(mesh(G.box(0.16, 0.6, 0.05), vinyl(a.topColor2), [0, HEAD_Y + 0.85, 0.55], null, [-0.6, 0, 0]));
  } else if (a.head === 'backcap') {
    g.add(shell(1.15, 1.06, 1.0, 1.06));
    g.add(mesh(G.cyl(0.62, 0.62, 0.05), vinyl(darker(c, 0.2)), [0, HEAD_Y + 0.5, -0.98], [1, 1, 0.75], [-0.35, 0, 0]));
  } else if (a.head === 'beanie') {
    g.add(shell(1.4, 1.07, 1.12, 1.07));
    g.add(mesh(G.torus(0.98, 0.13), vinyl(darker(c, 0.15), { rough: 0.6, coat: 0.2 }), [0, HEAD_Y + 0.38, 0], [1, 1, 1], [Math.PI / 2 - 0.12, 0, 0]));
    g.add(mesh(G.sphere, vinyl(a.topColor2, { rough: 0.8, coat: 0, sheen: 1 }), [0, HEAD_Y + 1.2, -0.05], [0.26, 0.26, 0.26]));
  } else if (a.head === 'headband') {
    g.add(mesh(G.torus(0.98, 0.1), m, [0, HEAD_Y + 0.42, 0], null, [Math.PI / 2 - 0.15, 0, 0]));
  } else if (a.head === 'visor') {
    g.add(mesh(G.torus(0.98, 0.07), m, [0, HEAD_Y + 0.4, 0], null, [Math.PI / 2 - 0.15, 0, 0]));
    g.add(mesh(G.cyl(0.6, 0.6, 0.05), vinyl(darker(c, 0.2)), [0, HEAD_Y + 0.42, 0.95], [1, 1, 0.7], [0.3, 0, 0]));
  }
  return g;
}

function lensMat(a) {
  const L = (A.LENS_COLORS || {})[a.lens] || ['#ff4fd8', '#5b2bff'];
  const col = new THREE.Color(L[0]).lerp(new THREE.Color(L[1]), 0.55);
  return vinyl('#' + col.getHexString(), { rough: 0.06, metal: 0.55, coat: 1, coatRough: 0.02, irid: 1, opacity: a.lens === 'clear' ? 0.55 : undefined });
}
function buildEyewear(a) {
  const g = new THREE.Group(), frame = vinyl('#15161a', { rough: 0.3 });
  if (a.eyes === 'wrap' || a.eyes === 'goggles') {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, a.eyes === 'goggles' ? 0.48 : 0.34, 48, 1, true, -1.05, 2.1), lensMat(a));
    band.position.set(0, HEAD_Y - 0.02, 0.04); band.scale.set(1.04, 1, 1.04); band.material.side = THREE.DoubleSide;
    g.add(band);
    const rimG = new THREE.CylinderGeometry(1.0, 1.0, a.eyes === 'goggles' ? 0.56 : 0.4, 48, 1, true, -1.08, 2.16);
    const rim = new THREE.Mesh(rimG, a.eyes === 'goggles' ? vinyl(a.headColor) : frame); rim.position.copy(band.position); rim.scale.set(1.02, 1, 1.02);
    rim.material = rim.material.clone(); rim.material.side = THREE.BackSide; g.add(rim);
    if (a.eyes === 'goggles') g.add(mesh(G.torus(1.03, 0.07), vinyl(a.headColor), [0, HEAD_Y - 0.02, 0], null, [Math.PI / 2, 0, 0]));
  } else if (a.eyes === 'round' || a.eyes === 'swimgoggles') {
    [-1, 1].forEach((s) => {
      g.add(mesh(G.torus(0.22, 0.04), frame, [s * 0.36, HEAD_Y, 0.95], null, [0, s * 0.3, 0]));
      g.add(mesh(G.cyl(0.21, 0.21, 0.02), lensMat(a), [s * 0.36, HEAD_Y, 0.95], null, [Math.PI / 2, 0, -s * 0.3]));
    });
    g.add(mesh(G.cyl(0.03, 0.03, 0.3), frame, [0, HEAD_Y + 0.05, 1.0], null, [0, 0, Math.PI / 2]));
  }
  return g;
}

function buildFace(a, parts) {
  const g = new THREE.Group();
  const black = vinyl('#120c0a', { rough: 0.15, coat: 1, coatRough: 0.02 }), white = vinyl('#ffffff', { rough: 0.2 });
  const hideEyes = a.eyes === 'wrap' || a.eyes === 'goggles';
  if (!hideEyes) {
    const eyes = new THREE.Group();
    [-1, 1].forEach((s) => {
      const e = mesh(G.sphere, black, [s * 0.34, HEAD_Y + 0.02, 0.86], [0.12, 0.16, 0.08]);
      eyes.add(e);
      eyes.add(mesh(G.sphere, white, [s * 0.34 + 0.04, HEAD_Y + 0.08, 0.93], [0.035, 0.035, 0.02]));
      const by = a.face === 'focus' ? 0.27 : 0.32;
      g.add(mesh(G.capsule(0.03, 0.16), vinyl(darker(a.hairColor, 0.1), { rough: 0.5 }), [s * 0.34, HEAD_Y + by, 0.9], null, [0, 0, Math.PI / 2 + s * (a.face === 'focus' ? -0.25 : 0.12)]));
    });
    g.add(eyes); parts.eyes = eyes;
  }
  // nose and cheeks
  g.add(mesh(G.sphere, skinMat(a.skin), [0, HEAD_Y - 0.12, 0.98], [0.09, 0.07, 0.07]));
  const blush = vinyl('#ff7a8a', { opacity: 0.32, rough: 0.6, coat: 0 });
  [-1, 1].forEach((s) => g.add(mesh(G.sphere, blush, [s * 0.55, HEAD_Y - 0.2, 0.78], [0.16, 0.09, 0.05], [0, s * 0.6, 0])));
  // mouth
  if (a.face === 'grin') {
    const mm = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), black, [0, HEAD_Y - 0.36, 0.86], [0.2, 0.14, 0.06]);
    g.add(mm); g.add(mesh(G.box(0.3, 0.05, 0.02), white, [0, HEAD_Y - 0.38, 0.91]));
  } else if (a.face === 'focus') g.add(mesh(G.capsule(0.025, 0.16), black, [0, HEAD_Y - 0.38, 0.9], null, [0, 0, Math.PI / 2]));
  else g.add(mesh(G.torus(0.13, 0.028, Math.PI), black, [0, HEAD_Y - 0.3, 0.9], null, [0, 0, Math.PI]));
  // facial hair
  if (a.facial !== 'none') {
    const hm = vinyl(a.hairColor, { rough: 0.6, coat: 0.3, opacity: a.facial === 'stubble' ? 0.35 : undefined });
    if (a.facial === 'mustache') g.add(mesh(G.capsule(0.05, 0.24), hm, [0, HEAD_Y - 0.24, 0.94], null, [0, 0, Math.PI / 2]));
    else g.add(mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.42), hm, [0, HEAD_Y + 0.02, 0.02], [1.02, 1.0, 0.98]));
  }
  return g;
}

function limb(r, len, mat) { return mesh(G.capsule(r, len), mat, [0, -(len / 2 + r), 0]); }

function buildArm(side, a, parts) {
  const s = side === 'R' ? 1 : -1;
  const pivot = new THREE.Group(); pivot.position.set(s * 0.66, 1.0, 0);
  const sk = skinMat(a.skin);
  const sleeveLen = ['jacket', 'hoodie', 'longsleeve'].includes(a.top) ? 0.62 : ['tank', 'singlet'].includes(a.top) ? 0 : 0.26;
  pivot.add(limb(0.16, 0.5, sk));
  if (sleeveLen) pivot.add(mesh(G.capsule(0.2, sleeveLen), a.top === 'apron' ? vinyl(a.topColor) : vinyl(a.topColor), [0, -(sleeveLen / 2 + 0.12), 0]));
  const handMat = a.extras.includes('gloves') ? vinyl(a.sport === 'Shop' ? '#3b5bdb' : '#15161a', { rough: 0.45 }) : sk;
  const hand = mesh(G.sphere, handMat, [0, -0.86, 0], [0.21, 0.21, 0.21]);
  pivot.add(hand);
  if (a.extras.includes('watch') && side === 'L') pivot.add(mesh(G.torus(0.165, 0.045), vinyl('#15161a'), [0, -0.66, 0], null, [Math.PI / 2, 0, 0]));
  // poses
  let rz = s * 0.14;
  if (a.pose === 'flex') rz = s * 2.25;
  else if (a.pose === 'thumbs' && side === 'R') rz = 2.0;
  pivot.rotation.z = rz;
  if ((a.pose === 'thumbs' && side === 'R') || a.pose === 'flex') {
    const th = new THREE.Group(); th.position.set(0, -0.86, 0); th.rotation.z = -rz;
    th.add(mesh(G.capsule(0.07, 0.14), handMat, [0, 0.2, 0.02])); pivot.add(th);
  }
  // props in the other hand
  if (side === 'L' && a.pose !== 'flex') {
    if (a.prop === 'bottle') { const b = new THREE.Group(); b.position.set(0.05, -0.92, 0.18); b.add(mesh(G.cyl(0.13, 0.13, 0.55), vinyl(a.topColor2), [0, 0, 0])); b.add(mesh(G.cyl(0.07, 0.09, 0.12), vinyl('#15161a'), [0, 0.33, 0])); pivot.add(b); }
    if (a.prop === 'wrench') { const w = new THREE.Group(); w.position.set(0, -1.05, 0.12); w.rotation.z = 0.35; const chrome = vinyl('#c9ced8', { metal: 0.9, rough: 0.18 }); w.add(mesh(G.box(0.1, 0.7, 0.05), chrome, [0, 0, 0])); w.add(mesh(G.torus(0.11, 0.045, Math.PI * 1.5), chrome, [0, -0.4, 0], null, [0, 0, Math.PI * 0.25])); pivot.add(w); }
  }
  parts[side === 'R' ? 'armR' : 'armL'] = pivot;
  return pivot;
}

function buildBody(a, parts) {
  const g = new THREE.Group();
  const sk = skinMat(a.skin);
  // legs
  const lowTop = a.sport === 'Skiing' || a.sport === 'Snowboard';
  [-1, 1].forEach((s) => {
    const leg = new THREE.Group(); leg.position.set(s * 0.27, -0.25, 0);
    leg.add(limb(0.2, 0.55, sk));
    if (!lowTop) leg.add(mesh(G.cyl(0.215, 0.215, 0.3), vinyl(a.socks, { rough: 0.6, coat: 0.2 }), [0, -0.78, 0]));
    leg.add(mesh(G.capsule(0.24, 0.32), vinyl(a.shoes), [0, -1.0, 0.12], [1, 0.75, 1], [Math.PI / 2, 0, 0]));
    leg.add(mesh(G.box(0.4, 0.06, 0.62), vinyl(darker(a.shoes, 0.35)), [0, -1.16, 0.12]));
    if (a.extras.includes('kneepads')) leg.add(mesh(G.sphere, vinyl('#15161a', { rough: 0.5 }), [0, -0.5, 0.12], [0.24, 0.2, 0.16]));
    g.add(leg);
  });
  // bottoms
  const bc = a.bottom === 'trisuit' ? a.topColor : a.bottomColor, bm = vinyl(bc, { rough: 0.45, coat: 0.5 });
  const long = ['pants', 'baggy', 'climbpants', 'tights', 'jeans'].includes(a.bottom);
  const len = long ? 0.95 : a.bottom === 'mtbshorts' ? 0.55 : 0.36;
  const wide = a.bottom === 'baggy' || a.bottom === 'mtbshorts' ? 0.27 : a.bottom === 'jeans' || a.bottom === 'pants' ? 0.245 : 0.225;
  g.add(mesh(G.capsule(0.6, 0.1), bm, [0, -0.08, 0], [1, 0.75, 0.8]));
  [-1, 1].forEach((s) => g.add(mesh(G.cyl(wide, wide * 0.95, len), bm, [s * 0.27, -0.2 - len / 2, 0])));
  if (a.bottom === 'bibs') [-1, 1].forEach((s) => g.add(mesh(G.cyl(0.215, 0.215, 0.06), vinyl(a.topColor), [s * 0.27, -0.2 - len + 0.02, 0])));
  // torso
  const torso = mesh(G.capsule(0.62, 0.62), new THREE.MeshPhysicalMaterial({ map: kitTexture(a), roughness: 0.38, clearcoat: 0.9, clearcoatRoughness: 0.14 }), [0, 0.62, 0], [1, 1, 0.8]);
  torso.rotation.y = -Math.PI / 2; // puts the middle of the artwork on the front
  g.add(torso);
  if (a.top === 'hoodie') g.add(mesh(G.torus(0.42, 0.14), vinyl(darker(a.topColor, 0.15)), [0, 1.22, -0.25], null, [Math.PI / 2 + 0.4, 0, 0]));
  if (a.extras.includes('belt')) g.add(mesh(G.cyl(0.66, 0.66, 0.2, true), vinyl('#2a1a12'), [0, 0.12, 0], [1, 1, 0.82]));
  if (a.extras.includes('harness')) g.add(mesh(G.torus(0.6, 0.05), vinyl(a.topColor2), [0, 0.0, 0], [1, 0.82, 1], [Math.PI / 2, 0, 0]));
  if (a.prop === 'medal') { g.add(mesh(G.torus(0.5, 0.03, Math.PI), vinyl(a.topColor2), [0, 1.0, 0.42], [0.8, 1, 1], [0, 0, Math.PI])); g.add(mesh(G.cyl(0.14, 0.14, 0.04), vinyl('#ffd84d', { metal: 0.8, rough: 0.2 }), [0, 0.55, 0.52], null, [Math.PI / 2, 0, 0])); }
  if (a.extras.includes('mud')) { const mud = vinyl('#6b4a2b', { rough: 0.8, coat: 0.2 }); [[0.3, -0.75, 0.2], [-0.25, -0.6, 0.2], [0.2, -0.95, 0.24], [-0.3, -1.0, 0.22], [0.05, 0.2, 0.5], [-0.35, 0.4, 0.45], [0.38, -0.3, 0.22]].forEach(([x, y, z]) => g.add(mesh(G.sphere, mud, [x, y, z], [0.06, 0.05, 0.03]))); }
  // neck
  g.add(mesh(G.cyl(0.24, 0.27, 0.35), sk, [0, 1.3, 0]));
  // arms
  g.add(buildArm('L', a, parts));
  g.add(buildArm('R', a, parts));
  // board / poles behind (legacy kits)
  if (a.prop === 'board') g.add(mesh(G.capsule(0.32, 2.4), vinyl(a.topColor2), [0.8, 0.6, -0.55], [1, 1, 0.18], [0, 0, -0.15]));
  return g;
}

function buildAvatar(input, opts) {
  const a = A.clean(input);
  opts = opts || {};
  const root = new THREE.Group(), parts = {};
  const body = opts.head ? new THREE.Group() : buildBody(a, parts);
  if (opts.head) { body.add(mesh(G.capsule(0.62, 0.3), new THREE.MeshPhysicalMaterial({ map: kitTexture(a), roughness: 0.38, clearcoat: 0.9 }), [0, 0.95, 0], [1, 1, 0.8], [0, -Math.PI / 2, 0])); body.add(mesh(G.cyl(0.24, 0.27, 0.35), skinMat(a.skin), [0, 1.3, 0])); }
  const head = new THREE.Group();
  head.add(mesh(G.sphere, skinMat(a.skin), [0, HEAD_Y, 0], [1, 0.97, 0.94]));
  [-1, 1].forEach((s) => head.add(mesh(G.sphere, skinMat(a.skin), [s * 0.98, HEAD_Y - 0.05, 0], [0.18, 0.22, 0.13])));
  head.add(buildFace(a, parts));
  head.add(buildHair(a));
  head.add(buildEyewear(a));
  head.add(buildHeadwear(a));
  parts.head = head;
  root.add(body); root.add(head);
  parts.body = body;
  root.userData.parts = parts;
  return root;
}

function shadowDisc() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = -1.42;
  return m;
}

function disposeTree(o) {
  o.traverse((x) => { if (x.isMesh && x.geometry && !Object.values(G).includes(x.geometry) && x.geometry !== G.sphere) x.geometry.dispose(); });
}

/* ---------------------------------------------------------------- stills */
const urlCache = new Map();
function headURL(cfg, px) {
  px = px || 96;
  const key = JSON.stringify(A.clean(cfg)) + '|' + px;
  if (urlCache.has(key)) return urlCache.get(key);
  if (!shared) { shared = { renderer: makeRenderer(192, 192, true) }; shared.scene = makeScene(shared.renderer); shared.cam = new THREE.PerspectiveCamera(26, 1, 0.1, 100); }
  const { renderer, scene, cam } = shared;
  const size = px > 96 ? 256 : 160;
  renderer.setPixelRatio(1); renderer.setSize(size, size, false);
  const av = buildAvatar(cfg, { head: true });
  av.rotation.y = -0.18;
  scene.add(av);
  cam.position.set(0.5, HEAD_Y + 0.15, 7.4); cam.lookAt(0, HEAD_Y - 0.12, 0);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(av); disposeTree(av);
  urlCache.set(key, url);
  return url;
}

/* ---------------------------------------------------------------- live figure */
const live = new Set();
function mount(el, cfg) {
  const w = Math.max(120, el.clientWidth || 240), h = Math.max(160, el.clientHeight || Math.round(w * 1.35));
  const renderer = makeRenderer(w, h, false);
  const scene = makeScene(renderer);
  const cam = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);
  cam.position.set(0, 1.2, 12.6); cam.lookAt(0, 0.95, 0);
  scene.add(shadowDisc());
  let av = buildAvatar(cfg); scene.add(av);
  const canvas = renderer.domElement; canvas.className = 'av3d-canvas';
  el.innerHTML = ''; el.appendChild(canvas);
  let yaw = -0.25, vel = 0, drag = null, waveT = -1, t0 = performance.now(), raf = 0, alive = true;
  const st = { el, dispose };
  live.add(st);
  function frame(now) {
    if (!alive) return;
    if (!el.isConnected) { dispose(); return; }
    const t = (now - t0) / 1000;
    if (!drag) { yaw += vel; vel *= 0.92; if (Math.abs(vel) < 0.0005) yaw += (-0.25 + Math.sin(t * 0.6) * 0.25 - yaw) * 0.02; }
    av.rotation.y = yaw;
    const p = av.userData.parts;
    if (!reduce) {
      p.head.position.y = Math.sin(t * 2) * 0.03;
      p.head.rotation.z = Math.sin(t * 1.3) * 0.03;
      if (p.eyes) p.eyes.scale.y = (t % 4.2) > 4.05 ? 0.15 : 1;
      if (waveT >= 0) {
        const k = (now - waveT) / 1000;
        if (k > 1.2) { waveT = -1; p.armR.rotation.z = p.armR.userData.rz; p.body.position.y = 0; av.position.y = 0; }
        else { p.armR.rotation.z = Math.max(p.armR.userData.rz, 2.3) + Math.sin(k * 16) * 0.35; av.position.y = Math.max(0, Math.sin(Math.min(1, k / 0.55) * Math.PI)) * 0.35; }
      }
    }
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  const remember = () => { const p = av.userData.parts; p.armR.userData.rz = p.armR.rotation.z; };
  remember();
  canvas.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; drag = { x: e.clientX, yaw, moved: false, last: e.clientX, id: e.pointerId }; vel = 0; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
    if (drag.moved) { yaw = drag.yaw + dx * 0.012; vel = (e.clientX - drag.last) * 0.004; drag.last = e.clientX; }
  });
  const up = (e) => { if (!drag || drag.id !== e.pointerId) return; const moved = drag.moved; drag = null; if (!moved && e.type === 'pointerup') wave(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.style.touchAction = 'pan-y';
  function wave() { if (!reduce) waveT = performance.now(); }
  function update(next) { scene.remove(av); disposeTree(av); av = buildAvatar(next); av.rotation.y = yaw; scene.add(av); remember(); if (reduce) renderer.render(scene, cam); }
  function resize() { const W = el.clientWidth || w, H = el.clientHeight || h; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null; if (ro) ro.observe(el);
  function dispose() { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); scene.remove(av); disposeTree(av); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); live.delete(st); }
  raf = requestAnimationFrame(frame);
  if (reduce) renderer.render(scene, cam);
  return { update, wave, dispose };
}

// can this browser draw 3D at all?
let ok = false;
try { const c = document.createElement('canvas'); ok = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))) && !!A; } catch (_) { ok = false; }

window.CD_AVATAR3D = { ok, headURL: (cfg, px) => { try { return headURL(cfg, px); } catch (e) { return ''; } }, mount: (el, cfg) => { try { return mount(el, cfg); } catch (e) { console.warn('COOLDOWN 3D avatar failed, showing 2D', e); return null; } } };
document.dispatchEvent(new Event('cd-avatar3d-ready'));
