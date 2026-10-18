/* Kodshim Quest — high-resolution art for the encounter screen and the Sefer.
   Animals (64×64), people (32×40) and seals (32×32) are drawn from shapes,
   then snapped to pixels: anti-aliased edges are thresholded, colours are
   quantised to the sprite's palette and a one-pixel outline is grown around
   the silhouette. Species and sex markers are drawn deliberately: horns,
   beard, udder, wool, tail, so they read at a glance. */
window.Art = (function () {
  const cache = {};
  const OUTLINE = '#2b2230';
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  // ---- pixel pass: threshold alpha, snap colours to the palette, grow an outline
  function pixelate(c, palette) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const img = g.getImageData(0, 0, w, h), d = img.data;
    const pal = palette.map(hex);
    const snap = (r, gg, b) => { let best = 0, bd = 1e9; for (let i = 0; i < pal.length; i++) { const p = pal[i]; const dd = (p[0] - r) ** 2 + (p[1] - gg) ** 2 + (p[2] - b) ** 2; if (dd < bd) { bd = dd; best = i; } } return pal[best]; };
    const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const a = d[i * 4 + 3];
      if (a < 110) { d[i * 4 + 3] = 0; continue; }
      const p = snap(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; solid[i] = 1;
    }
    const o = hex(OUTLINE);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (solid[i]) continue;
      const n = (x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w]);
      if (n) { d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  // ---- shape helpers
  const ell = (g, x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
  const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  const stroke = (g, fn, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); fn(g); g.stroke(); };
  function clipLower(g, x, y, rx, ry, fn) { g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.clip(); fn(); g.restore(); }

  // ---- palettes
  const PAL = {
    sheep: { wool: '#f7f2e4', woolShade: '#d9cfb4', face: '#c89d73', faceShade: '#a87c54', horn: '#d9b06a', hornShade: '#a07a3a', leg: '#6b5a48', hoof: '#3a2a22', nose: '#5a3a3a', eye: '#1d1b2c', pink: '#e8a8a0' },
    goat: { coat: '#a39282', coatShade: '#7d6c5a', light: '#c4b6a6', beard: '#4a3d33', horn: '#d9b06a', hornShade: '#a07a3a', leg: '#7d6c5a', hoof: '#3a2a22', nose: '#3b312a', eye: '#1d1b2c', pink: '#e2aaa4', ear: '#bfae9e' },
    cattle: { coat: '#b0623a', coatShade: '#874423', light: '#d08a62', muzzle: '#e6b9a0', horn: '#ebd7a8', hornShade: '#b09660', leg: '#874423', hoof: '#3a2a22', eye: '#1d1b2c', pink: '#e8b4a4', nose: '#5a3a2a' },
    dove: { body: '#dcc0ab', shade: '#b7937a', wing: '#a37552', wingDark: '#6e4b32', black: '#2b2230', white: '#ffffff', beak: '#e0b12b', feet: '#d65a5a', eye: '#1d1b2c', breast: '#e9c8c0' },
    pigeon: { body: '#aeb6c6', shade: '#7f8a9e', wing: '#8f99ad', wingDark: '#5c667a', light: '#d7dde8', beak: '#e0b12b', cere: '#f0d090', feet: '#d65a5a', eye: '#1d1b2c', down: '#e6e0c8' },
  };

  function mammal(kind) {
    const S = {
      ram:   { sp: 'sheep', s: 1.0, horns: 'curl' },
      ewe:   { sp: 'sheep', s: 0.92, udder: true },
      lamb:  { sp: 'sheep', s: 0.62, young: true },
      buck:  { sp: 'goat', s: 1.0, horns: 'sweep', beard: true },
      nanny: { sp: 'goat', s: 0.9, horns: 'short', udder: true },
      kid:   { sp: 'goat', s: 0.6, young: true, horns: 'nub' },
      bull:  { sp: 'cattle', s: 1.0, horns: 'crescent', hump: true },
      cow:   { sp: 'cattle', s: 0.92, horns: 'shortc', udder: true },
      calf:  { sp: 'cattle', s: 0.6, young: true },
    }[kind];
    const P = PAL[S.sp];
    const [c, g] = mk(64, 64);
    const s = S.s, ground = 58;
    const legH = (S.sp === 'cattle' ? 13 : 12) * s + (S.young ? 1 : 0);
    const rx = (S.sp === 'cattle' ? 19 : S.sp === 'goat' ? 16 : 17) * s, ry = (S.sp === 'cattle' ? 12 : 10.5) * s;
    const cx = 36, cy = ground - legH - ry;
    const body = S.sp === 'sheep' ? P.wool : P.coat, shade = S.sp === 'sheep' ? P.woolShade : P.coatShade;
    const hr = (S.young ? 7.5 : 6.5) * (S.sp === 'cattle' ? 1.15 : 1) * Math.max(s, .75);
    const hx = cx - rx - hr * .6, hy = cy - ry * .55 - (S.sp === 'cattle' ? 1 : 2);
    // tail
    if (S.sp === 'sheep') ell(g, cx + rx - 3, cy + ry * .55, 4 * s, 6 * s, P.wool);
    if (S.sp === 'goat') poly(g, [[cx + rx - 4, cy - ry + 2], [cx + rx + 3, cy - ry - 5 * s], [cx + rx, cy - ry + 5]], P.coat);
    if (S.sp === 'cattle') { stroke(g, q => { q.moveTo(cx + rx - 2, cy - 2); q.lineTo(cx + rx + 2, cy + ry + 4); }, P.coatShade, 2.5); ell(g, cx + rx + 2, cy + ry + 6, 2.5, 3.5, P.coatShade); }
    // legs
    const legW = Math.max(3, 4.2 * s);
    const legs = [cx - rx * .62, cx - rx * .3, cx + rx * .3, cx + rx * .58];
    legs.forEach((lx, i) => { rect(g, lx - legW / 2, cy + ry * .6, legW, ground - (cy + ry * .6), i % 2 ? P.leg : (S.sp === 'sheep' ? P.leg : shade)); rect(g, lx - legW / 2, ground - 3, legW, 3, P.hoof); });
    // body
    ell(g, cx, cy, rx, ry, body);
    if (S.sp === 'sheep') { // woolly edge
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) ell(g, cx + Math.cos(a) * rx * .92, cy + Math.sin(a) * ry * .9, 4.2 * s, 4.2 * s, body);
    }
    clipLower(g, cx, cy, rx + 4 * s, ry + 4 * s, () => { ell(g, cx + 1, cy + ry * .75, rx + 2, ry * .55, shade); });
    if (S.sp === 'sheep') for (let a = Math.PI * .15; a < Math.PI * .85; a += Math.PI / 7) ell(g, cx + Math.cos(a) * rx * .92, cy + Math.sin(a) * ry * .9, 4.2 * s, 4.2 * s, shade);
    if (S.hump) ell(g, cx - rx * .35, cy - ry + 1, 9, 6, P.coat);
    if (S.sp === 'goat') for (let i = 0; i < 4; i++) poly(g, [[cx - rx * .5 + i * rx * .35, cy + ry - 1], [cx - rx * .5 + i * rx * .35 + 3, cy + ry + 3 * s], [cx - rx * .5 + i * rx * .35 + 6, cy + ry - 1]], shade);
    // udder
    if (S.udder) { ell(g, cx + rx * .32, cy + ry - 1, 5.5 * s, 3.5 * s, P.pink); }
    // neck
    poly(g, [[hx + hr * .2, hy - hr * .6], [cx - rx * .4, cy - ry * .4], [cx - rx * .3, cy + ry * .3], [hx + hr * .6, hy + hr * .8]], S.sp === 'sheep' ? P.wool : body);
    // head
    const faceCol = S.sp === 'sheep' ? P.face : body;
    ell(g, hx, hy, hr, hr * .92, faceCol);
    if (S.sp === 'sheep') { ell(g, hx + hr * .25, hy - hr * .55, hr * .9, hr * .6, P.wool); } // wool cap on the forehead
    // muzzle
    const mx = hx - hr * .75, my = hy + hr * .35;
    ell(g, mx, my, hr * .62, hr * .5, S.sp === 'cattle' ? P.muzzle : S.sp === 'sheep' ? P.faceShade : P.light);
    rect(g, mx - hr * .55, my - 1, 2, 2, P.nose);
    // eye
    rect(g, hx - hr * .25, hy - hr * .25, 2, 2, P.eye);
    // ear
    if (S.sp === 'goat') ell(g, hx + hr * .7, hy + hr * .15, hr * .75, hr * .32, P.ear, S.young ? .5 : -.1);
    else if (S.sp === 'cattle') ell(g, hx + hr * .75, hy - hr * .1, hr * .55, hr * .3, P.coatShade, -.3);
    else ell(g, hx + hr * .6, hy - hr * .05, hr * .5, hr * .28, P.face, -.4);
    // beard
    if (S.beard) poly(g, [[hx - hr * .35, hy + hr * .75], [hx + hr * .45, hy + hr * .7], [hx + hr * .05, hy + hr * 1.9]], P.beard);
    // horns
    const H = P.horn, HS = P.hornShade;
    if (S.horns === 'curl') {
      const ox = hx + hr * .55, oy = hy - hr * .25, r = hr * .72;
      stroke(g, q => q.arc(ox, oy, r, Math.PI * 1.05, Math.PI * 2.9), HS, 5 * s);
      stroke(g, q => q.arc(ox, oy, r, Math.PI * 1.05, Math.PI * 2.9), H, 3 * s);
      ell(g, ox, oy, r * .45, r * .45, faceCol);
    } else if (S.horns === 'sweep') {
      [0, 3].forEach((dx, i) => { stroke(g, q => { q.moveTo(hx + hr * .3 + dx, hy - hr * .6); q.quadraticCurveTo(hx + hr * .9 + dx, hy - hr * 2.6, hx + hr * 2.4 + dx, hy - hr * 2.6); }, i ? H : HS, 3.5 * s); });
    } else if (S.horns === 'short') {
      stroke(g, q => { q.moveTo(hx + hr * .2, hy - hr * .6); q.lineTo(hx + hr * .9, hy - hr * 1.6); }, HS, 3.5 * s);
      stroke(g, q => { q.moveTo(hx + hr * .5, hy - hr * .6); q.lineTo(hx + hr * 1.2, hy - hr * 1.55); }, H, 3 * s);
    } else if (S.horns === 'nub') {
      ell(g, hx + hr * .25, hy - hr * .85, 2, 2.5, HS); ell(g, hx + hr * .7, hy - hr * .85, 2, 2.5, H);
    } else if (S.horns === 'crescent') {
      const ox = hx + hr * .35, oy = hy - hr * .25, r = hr * 1.05;
      stroke(g, q => q.arc(ox, oy, r, Math.PI * 1.0, Math.PI * 1.62), HS, 4.5 * s);
      stroke(g, q => q.arc(ox + 1, oy - 1, r, Math.PI * 1.0, Math.PI * 1.62), H, 3 * s);
    } else if (S.horns === 'shortc') {
      const ox = hx + hr * .35, oy = hy - hr * .2, r = hr * .8;
      stroke(g, q => q.arc(ox, oy, r, Math.PI * 1.05, Math.PI * 1.6), HS, 4 * s);
      stroke(g, q => q.arc(ox + 1, oy - 1, r, Math.PI * 1.05, Math.PI * 1.6), H, 2.5 * s);
    }
    return pixelate(c, Object.values(P));
  }

  function bird(kind) {
    const P = PAL[kind === 'turtledove' ? 'dove' : 'pigeon'];
    const [c, g] = mk(64, 64);
    const dove = kind === 'turtledove';
    const cx = dove ? 34 : 33, cy = 38, rx = dove ? 15 : 15, ry = dove ? 9 : 11;
    // tail
    if (dove) poly(g, [[cx + rx - 6, cy - 4], [cx + rx + 14, cy + 2], [cx + rx + 12, cy + 8], [cx + rx - 6, cy + 5]], P.shade);
    else poly(g, [[cx + rx - 6, cy - 2], [cx + rx + 8, cy + 3], [cx + rx + 6, cy + 9], [cx + rx - 6, cy + 6]], P.shade);
    // legs
    stroke(g, q => { q.moveTo(cx - 3, cy + ry - 2); q.lineTo(cx - 5, cy + ry + 7); q.moveTo(cx + 4, cy + ry - 2); q.lineTo(cx + 3, cy + ry + 7); }, P.feet, 2);
    stroke(g, q => { q.moveTo(cx - 9, cy + ry + 7); q.lineTo(cx - 1, cy + ry + 7); q.moveTo(cx - 1, cy + ry + 7); q.lineTo(cx + 7, cy + ry + 7); }, P.feet, 2);
    // body
    ell(g, cx, cy, rx, ry, P.body);
    clipLower(g, cx, cy, rx, ry, () => ell(g, cx, cy + ry * .7, rx, ry * .6, P.shade));
    if (dove) ell(g, cx - 8, cy + 2, 7, 6, P.breast);
    if (!dove) { for (let i = 0; i < 7; i++) ell(g, cx - rx + 4 + i * 4.3, cy + ry - 2, 2.5, 2.5, P.down); }
    // wing
    ell(g, cx + 3, cy - 2, rx * .7, ry * .62, P.wing, -.25);
    if (dove) { for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) rect(g, cx - 2 + i * 4 + j * 2, cy - 6 + j * 4, 2, 2, P.wingDark); }
    else { stroke(g, q => { q.moveTo(cx - 6, cy - 2); q.lineTo(cx + 12, cy + 1); q.moveTo(cx - 4, cy + 2); q.lineTo(cx + 11, cy + 4); }, P.wingDark, 1.5); }
    // neck + head
    const hx = cx - rx - 1, hy = cy - 11;
    poly(g, [[hx - 2, hy + 2], [hx + 7, hy], [cx - 4, cy - 4], [cx - 12, cy + 2]], P.body);
    ell(g, hx, hy, 6.5, 6, P.body);
    if (dove) { for (let i = 0; i < 3; i++) { rect(g, hx + 4, hy + 2 + i * 2, 5, 1, i % 2 ? P.white : P.black); } }
    if (!dove) ell(g, hx - 5, hy + 1, 2.5, 1.6, P.cere);
    poly(g, [[hx - 6, hy - 1], [hx - 12, hy + 1], [hx - 6, hy + 3]], P.beak);
    rect(g, hx - 2, hy - 2, 2, 2, P.eye);
    return pixelate(c, Object.values(P));
  }

  // ---- people, front view 32×40 (and the player's back), from the overworld colour specs
  function person(kind, back = false) {
    const spec = window.Sprites.PEOPLE[kind] || window.Sprites.PEOPLE.player;
    const P = { hair: spec.hair || '#4a2f1b', skin: spec.skin || '#e8b98a', tunic: spec.tunic || '#f4efe0', belt: spec.belt || '#8a5a2b', sandal: '#5a3a22', eye: '#1d1b2c', hat: spec.hat_color || '#f4efe0', beard: spec.beard || '#6b6b6b', shade: shadeOf(spec.tunic || '#f4efe0') };
    const [c, g] = mk(32, 40);
    const cx = 16;
    // legs / dress
    if (spec.dress) { poly(g, [[cx - 7, 24], [cx + 7, 24], [cx + 9, 38], [cx - 9, 38]], P.tunic); rect(g, cx - 9, 35, 18, 3, P.shade); }
    else { rect(g, cx - 6, 26, 5, 10, P.skin); rect(g, cx + 1, 26, 5, 10, P.skin); rect(g, cx - 6, 35, 5, 3, P.sandal); rect(g, cx + 1, 35, 5, 3, P.sandal); }
    // tunic
    poly(g, [[cx - 7, 14], [cx + 7, 14], [cx + 8, 28], [cx - 8, 28]], P.tunic);
    rect(g, cx - 8, 25, 16, 3, P.shade);
    rect(g, cx - 7, 21, 14, 2, P.belt);
    // arms
    rect(g, cx - 10, 15, 3, 9, P.tunic); rect(g, cx + 7, 15, 3, 9, P.tunic);
    rect(g, cx - 10, 23, 3, 3, P.skin); rect(g, cx + 7, 23, 3, 3, P.skin);
    // head
    ell(g, cx, 8, 7, 7, back ? P.hair : P.skin);
    if (!back) {
      // hair
      ell(g, cx, 4, 7.5, 4.5, P.hair); rect(g, cx - 7.5, 4, 2.5, 6, P.hair); rect(g, cx + 5, 4, 2.5, 6, P.hair);
      rect(g, cx - 3, 8, 2, 2, P.eye); rect(g, cx + 1, 8, 2, 2, P.eye);
      if (spec.beard) { ell(g, cx, 13, 5.5, 3, P.beard); rect(g, cx - 5, 11, 10, 2, P.beard); }
    }
    if (spec.hat === 'turban') { ell(g, cx, 3.5, 8, 4.5, P.hat); rect(g, cx - 8, 3, 16, 3, P.hat); }
    else if (spec.hat === 'scarf') { ell(g, cx, 3.5, 8, 4.2, P.hat); rect(g, cx - 8, 3, 16, 3, P.hat); rect(g, cx - 8, 5, 2, 7, P.hat); rect(g, cx + 6, 5, 2, 7, P.hat); }
    else if (spec.hat === 'cap') { ell(g, cx, 2.5, 5, 2.5, P.hat); }
    return pixelate(c, Object.values(P));
  }
  function shadeOf(h) { const [r, g, b] = hex(h); return '#' + [r, g, b].map(v => Math.round(v * .72).toString(16).padStart(2, '0')).join(''); }

  // ---- seals 32×32: a clay stamp inscribed with the first letter of the word
  function seal(key) {
    const C = { egel: ['#8a5a2b', '#d9a86c', '#5a2a12', 'ע'], zachar: ['#2a4a8a', '#8fb3e8', '#13255a', 'ז'], gedi: ['#2f6b3a', '#9ad6a0', '#15381c', 'ג'], chotei: ['#8a2d2d', '#e8a0a0', '#4a1010', 'ח'], dal: ['#5a3a8a', '#c3a6e8', '#2a1550', 'ד'] }[key];
    const [c, g] = mk(32, 32);
    ell(g, 16, 16, 14, 14, C[0]); ell(g, 16, 16, 11, 11, C[1]);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) rect(g, 16 + Math.cos(a) * 12.5 - 1, 16 + Math.sin(a) * 12.5 - 1, 2, 2, C[1]);
    g.fillStyle = C[2]; g.font = '700 19px "Frank Ruhl Libre", "Varela Round", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(C[3], 16, 17);
    return pixelate(c, C.slice(0, 3));
  }

  function get(kind) {
    if (cache[kind]) return cache[kind];
    let c;
    if (kind === 'turtledove' || kind === 'pigeon') c = bird(kind);
    else if (kind.startsWith('seal:')) c = seal(kind.slice(5));
    else if (kind.startsWith('person:')) { const [, k, side] = kind.split(':'); c = person(k, side === 'back'); }
    else c = mammal(kind);
    return (cache[kind] = c);
  }
  return { get };
})();
