/* Kodshim Quest — terrain and object tiles (16×16 unless noted).
   Terrain is generated procedurally with a seeded RNG so it gets the
   speckled, textured look of modern pixel games; objects are hand-drawn. */
window.Tiles = (function () {
  const T = 16;
  const cache = {};

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 10000) / 10000; };
  }
  function canvas(w = T, h = T) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function px(g, x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }

  // ---------- generated terrain ----------
  function grass(seed, dark) {
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    const base = dark ? ['#4f8f3f', '#4a873a', '#55973f'] : ['#63a84a', '#5fa346', '#68ae4c'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, base[Math.floor(r() * 3)]);
    for (let i = 0; i < 9; i++) { const x = Math.floor(r() * T), y = Math.floor(r() * T); px(g, x, y, dark ? '#3f7a32' : '#4f8f3f'); if (r() < .5) px(g, x, y - 1, dark ? '#3f7a32' : '#4f8f3f'); }
    for (let i = 0; i < 5; i++) { const x = Math.floor(r() * T), y = Math.floor(r() * T); px(g, x, y, dark ? '#6ab453' : '#86c86a'); }
    return c;
  }
  function flowers(seed, frame) {
    const c = grass(seed); const g = c.getContext('2d'); const r = rng(seed * 7 + 3);
    const cols = ['#f4d35e', '#ffffff', '#f28cb1', '#9ad0ff'];
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(r() * 12), y = 2 + Math.floor(r() * 12), col = cols[Math.floor(r() * 4)];
      const dy = frame && i % 2 ? -1 : 0;
      px(g, x, y + dy, col); px(g, x + 1, y + dy, col); px(g, x, y + 1 + dy, col); px(g, x + 1, y + 1 + dy, col);
      px(g, x, y + 2 + dy, '#3f7a32');
    }
    return c;
  }
  function tallgrass(seed, frame) {
    const c = grass(seed, true); const g = c.getContext('2d'); const r = rng(seed * 3 + 11);
    const dark = '#2f6a2a', mid = '#3f8a35', light = '#6cbf55';
    for (let i = 0; i < 7; i++) {
      const x = Math.floor(r() * 15), y = 5 + Math.floor(r() * 10);
      const lean = frame ? (i % 2 ? 1 : 0) : 0;
      for (let k = 0; k < 5; k++) px(g, x + (k > 2 ? lean : 0), y - k, k > 3 ? light : (k > 1 ? mid : dark));
      px(g, x + 1, y - 1, dark); px(g, x + 1 + lean, y - 3, mid);
      px(g, x - 1, y - 1, dark); px(g, x - 1 - lean, y - 3, mid);
    }
    return c;
  }
  function dirt(seed) {
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    const base = ['#c9a56a', '#c4a066', '#cfab70'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, base[Math.floor(r() * 3)]);
    for (let i = 0; i < 7; i++) px(g, Math.floor(r() * T), Math.floor(r() * T), '#b08c54');
    for (let i = 0; i < 4; i++) px(g, Math.floor(r() * T), Math.floor(r() * T), '#dcbd86');
    return c;
  }
  function sand(seed) {
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    const base = ['#e3cf9a', '#dfca94', '#e8d5a2'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, base[Math.floor(r() * 3)]);
    for (let i = 0; i < 6; i++) px(g, Math.floor(r() * T), Math.floor(r() * T), '#cdb57e');
    return c;
  }
  function pavement(seed, tone) {
    // Jerusalem limestone: pale warm bricks, offset courses
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    const pal = tone === 'dark' ? ['#b8a98a', '#b3a384', '#bcad8f'] : ['#d9cba8', '#d4c6a2', '#dfd1ae'];
    const line = tone === 'dark' ? '#8f8266' : '#b3a484';
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, pal[Math.floor(r() * 3)]);
    for (let y = 0; y < T; y += 8) {
      for (let x = 0; x < T; x++) px(g, x, y + 7, line);
      const off = (y / 8) % 2 ? 4 : 0;
      for (let x = off; x < T; x += 8) for (let k = 0; k < 7; k++) px(g, x, y + k, line);
    }
    for (let i = 0; i < 5; i++) px(g, Math.floor(r() * T), Math.floor(r() * T), tone === 'dark' ? '#a89878' : '#e8dcbc');
    return c;
  }
  function wall(seed, top) {
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    const pal = ['#c7b48f', '#bfab86', '#cbb894'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, pal[Math.floor(r() * 3)]);
    const line = '#8a7a5a';
    for (let y = 0; y < T; y += 6) {
      for (let x = 0; x < T; x++) px(g, x, y + 5, line);
      const off = (y / 6) % 2 ? 5 : 0;
      for (let x = off; x < T; x += 10) for (let k = 0; k < 5; k++) px(g, x, y + k, line);
    }
    for (let x = 0; x < T; x++) { px(g, x, 0, top ? '#e8dcbc' : '#a8966f'); }
    for (let x = 0; x < T; x++) px(g, x, 15, '#6f6246');
    if (top) for (let x = 0; x < T; x++) { px(g, x, 1, '#ddd0ab'); if (x % 4 === 0) px(g, x, 0, '#c7b48f'); }
    return c;
  }
  function water(seed, frame) {
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    const pal = ['#3f8fd6', '#3a86cc', '#4697dc'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, pal[Math.floor(r() * 3)]);
    const rr = rng(seed + 99);
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rr() * 12), y = (Math.floor(rr() * 16) + frame * 5) % 16;
      px(g, x, y, '#8fd0ff'); px(g, x + 1, y, '#8fd0ff'); px(g, x + 2, y, '#bfe6ff'); px(g, x + 3, y, '#8fd0ff');
    }
    for (let i = 0; i < 3; i++) { const x = Math.floor(rr() * 16), y = (Math.floor(rr() * 16) + frame * 3) % 16; px(g, x, y, '#2f73b8'); px(g, x + 1, y, '#2f73b8'); }
    return c;
  }
  function roof(seed, variant) {
    const c = canvas(); const g = c.getContext('2d');
    const pal = variant === 'blue' ? ['#4a6fa8', '#3f619a', '#5a80bb', '#2f4a78'] : ['#c66a3f', '#b85e36', '#d47a4c', '#8a4426'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, pal[(x + (y >> 2)) % 2]);
    for (let y = 0; y < T; y += 4) {
      for (let x = 0; x < T; x++) px(g, x, y + 3, pal[3]);
      const off = (y / 4) % 2 ? 2 : 0;
      for (let x = off; x < T; x += 4) px(g, x, y + 1, pal[2]);
    }
    return c;
  }
  function plaster(seed) {
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    const pal = ['#efe3c4', '#eadcba', '#f3e8cb'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, pal[Math.floor(r() * 3)]);
    for (let i = 0; i < 4; i++) px(g, Math.floor(r() * T), Math.floor(r() * T), '#dccaa0');
    for (let x = 0; x < T; x++) px(g, x, 15, '#b9a67e');
    return c;
  }
  function floor(seed, kind) {
    const c = canvas(); const g = c.getContext('2d'); const r = rng(seed);
    if (kind === 'wood') {
      const pal = ['#b8834a', '#b07c44', '#c08b52'];
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, pal[Math.floor(r() * 3)]);
      for (let y = 3; y < T; y += 4) for (let x = 0; x < T; x++) px(g, x, y, '#8a5e30');
      for (let i = 0; i < 3; i++) { const x = Math.floor(r() * T), y = Math.floor(r() * 4) * 4; px(g, x, y, '#8a5e30'); }
    } else {
      const pal = ['#d8cdb3', '#d2c7ad', '#ddd3b9'];
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(g, x, y, pal[Math.floor(r() * 3)]);
      for (let x = 0; x < T; x++) { px(g, x, 7, '#b8ad92'); px(g, x, 15, '#b8ad92'); }
      for (let y = 0; y < T; y++) { px(g, 7, y < 8 ? y : -1, '#b8ad92'); px(g, 15, y >= 8 ? y : -1, '#b8ad92'); }
    }
    return c;
  }

  // ---------- hand-drawn objects ----------
  function art(rows, legend, w) {
    const c = window.Sprites.build(rows, legend, { name: 'tile' });
    return c;
  }
  const K = '#2b2230';
  const TREE = art([
    "......kkkk......",
    "....kkAAAAkk....",
    "...kAAAABAAAk...",
    "..kAAABAAAAAAk..",
    ".kAAAAAAAABAAAk.",
    ".kABAAAAAAAAAAk.",
    "kAAAAAABAAAAAAak",
    "kAAAAAAAAAAAaaak",
    "kAAABAAAAAAaaaak",
    "kaAAAAAAAAaaaaak",
    "kaaAAABAAaaaaaak",
    ".kaaaaaaaaaaaak.",
    ".kaaaaaaaaaaaak.",
    "..kkaaakkaaakk..",
    "....kktttkk.....",
    "......kttk......",
    "......kttk......",
    "......kttk......",
    ".....kkttkk.....",
    "....k.kttk.k....",
    "....kkkkkkkk....",
    "................",
    "................",
    "................",
  ], { k: K, A: '#4f9a3f', B: '#7cc45e', a: '#35702c', t: '#6b4a2e' });
  const OLIVE = art([
    "................",
    ".....kkkkk......",
    "...kkAAAAAkk....",
    "..kAAAABAAAAk...",
    ".kAABAAAAAAAAk..",
    ".kAAAAAAABAAAAk.",
    "kAAAAABAAAAAAAk.",
    "kaAAAAAAAAAAaak.",
    "kaaAAABAAAaaaak.",
    ".kaaaaAAaaaaaak.",
    ".kaaaaaaaaaaak..",
    "..kkaaaakaaak...",
    "....kkktkkk.....",
    "......kttk......",
    ".....kttttk.....",
    ".....kkkkkk.....",
  ], { k: K, A: '#8aa06a', B: '#b5c48c', a: '#5f7347', t: '#5a4030' });
  const CYPRESS = art([
    ".......kk.......",
    "......kAAk......",
    "......kABk......",
    ".....kAAABk.....",
    ".....kAAAAk.....",
    "....kAABAAAk....",
    "....kAAAAAAk....",
    "....kaAAAAak....",
    "...kaAAABAAak...",
    "...kaaAAAAaak...",
    "...kaaAAAAaak...",
    "...kaaaAAaaak...",
    "..kaaaaAAaaaak..",
    "..kaaaaaaaaaak..",
    "...kkaaaaaakk...",
    ".....kkttkk.....",
    "......kttk......",
    "......kttk......",
    ".....kkkkkk.....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ], { k: K, A: '#3f7a3a', B: '#63a84a', a: '#2b5a28', t: '#5a4030' });
  const BUSH = art([
    "................",
    "................",
    "................",
    "....kkk.kkk.....",
    "...kAAAkABBk....",
    "..kAABAAAAAAk...",
    ".kAAAAAAABAAAk..",
    ".kAABAAAAAAAAk..",
    "kAAAAAAAAAAAABk.",
    "kaAAAABAAAAaaak.",
    "kaaAAAAAAAaaaak.",
    ".kaaaaaaaaaaaak.",
    ".kaaaaaaaaaaak..",
    "..kkaaaaaaakk...",
    "....kkkkkkk.....",
    "................",
  ], { k: K, A: '#5aa347', B: '#86c86a', a: '#3f7a32' });
  const ROCK = art([
    "................",
    "................",
    "................",
    "......kkkk......",
    "....kkLLLLkk....",
    "...kLLLLLLLLk...",
    "..kLLLLLLLLggk..",
    "..kLLLLLLLgggk..",
    ".kLLLLLLLggggGk.",
    ".kLLLLLLgggGGGk.",
    ".kgggggggGGGGGk.",
    "..kggggGGGGGGk..",
    "...kkGGGGGGkk...",
    ".....kkkkkk.....",
    "................",
    "................",
  ], { k: K, L: '#b8b0a0', g: '#9a927f', G: '#6f6960' });
  const FENCE_H = art([
    "................",
    "................",
    "................",
    "kkkkkkkkkkkkkkkk",
    "kppppppppppppppk",
    "kPPPPPPPPPPPPPPk",
    "kkkkkkkkkkkkkkkk",
    "..kpk......kpk..",
    "..kPk......kPk..",
    "kkkkkkkkkkkkkkkk",
    "kppppppppppppppk",
    "kPPPPPPPPPPPPPPk",
    "kkkkkkkkkkkkkkkk",
    "..kPk......kPk..",
    "..kkk......kkk..",
    "................",
  ], { k: K, p: '#c99a5b', P: '#9a6f3a' });
  const FENCE_V = art([
    "......kkkk......",
    "......kppk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kPpk......",
    "......kkkk......",
  ], { k: K, p: '#c99a5b', P: '#9a6f3a' });
  const SIGN = art([
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    "kppppppppppppppk",
    "kpPPPpPPpPPPPppk",
    "kppppppppppppppk",
    "kpPPpPPPPpPPpppk",
    "kppppppppppppppk",
    ".kkkkkkkkkkkkkk.",
    "......kPPk......",
    "......kPPk......",
    "......kPPk......",
    "......kPPk......",
    "......kPPk......",
    ".....kkkkkk.....",
    "................",
  ], { k: K, p: '#d9b06a', P: '#8a5a2b' });
  const DOOR = art([
    "kkkkkkkkkkkkkkkk",
    "kddddddddddddddk",
    "kdDDDDDDDDDDDDdk",
    "kdDddddddddddDdk",
    "kdDdDDDDDDDDdDdk",
    "kdDdDddddddDdDdk",
    "kdDdDddddddDdDdk",
    "kdDdDddddddDdDdk",
    "kdDdDddddddDdDdk",
    "kdDdDdddgddDdDdk",
    "kdDdDddddddDdDdk",
    "kdDdDddddddDdDdk",
    "kdDdDddddddDdDdk",
    "kdDdDDDDDDDDdDdk",
    "kdDDDDDDDDDDDDdk",
    "kkkkkkkkkkkkkkkk",
  ], { k: K, d: '#8a5a2b', D: '#5a3a22', g: '#f2c94c' });
  const WINDOW = art([
    "pppppppppppppppp",
    "pppkkkkkkkkkkppp",
    "ppkbbbbbbbbbbkpp",
    "ppkbBbbbbbbBbkpp",
    "ppkbbbbbbbbbbkpp",
    "ppkbbbbkkbbbbkpp",
    "ppkbbbbkkbbbbkpp",
    "ppkbbbbbbbbbbkpp",
    "ppkbbbbbbbbbbkpp",
    "ppkbbbbbbbbbbkpp",
    "ppkkkkkkkkkkkkpp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "pppppppppppppppp",
    "PPPPPPPPPPPPPPPP",
  ], { k: K, p: '#efe3c4', P: '#b9a67e', b: '#5a7fb8', B: '#a7c4ea' });
  // A market crowd seen from above: heads, shoulders, a basket or two.
  function crowd(seed, frame) {
    const c = pavement(seed + 40); const g = c.getContext('2d'); const r = rng(seed * 31 + 7);
    const hair = ['#4a2f1b', '#1a1a1a', '#9a9a9a', '#5a2a1a', '#e0b12b', '#2a1a0a'];
    const cloth = ['#3a7bd5', '#d94848', '#4fae5c', '#8a5cd6', '#e0b12b', '#f4efe0', '#d65a8c', '#a8784a'];
    const wraps = ['#f4efe0', '#8a5cd6', '#3a7bd5', '#e0c89a'];
    const n = 3 + Math.floor(r() * 2);
    const people = [];
    for (let i = 0; i < n; i++) people.push({ x: 1 + Math.floor(r() * 10), y: 1 + Math.floor(r() * 10), h: r() < .35 ? wraps[Math.floor(r() * 4)] : hair[Math.floor(r() * 6)], t: cloth[Math.floor(r() * 8)], b: r() < .5 ? 1 : 0 });
    people.sort((a, b) => a.y - b.y);
    for (const p of people) {
      const dy = frame && p.b ? -1 : 0;
      // shoulders
      g.fillStyle = K; g.fillRect(p.x - 1, p.y + 4 + dy, 8, 3); g.fillStyle = p.t; g.fillRect(p.x, p.y + 4 + dy, 6, 2);
      // head
      g.fillStyle = K; g.fillRect(p.x, p.y - 1 + dy, 6, 6); g.fillStyle = p.h; g.fillRect(p.x + 1, p.y + dy, 4, 4);
      g.fillStyle = '#e8b98a'; g.fillRect(p.x + 1, p.y + 3 + dy, 4, 1);
    }
    if (r() < .5) { const bx = 2 + Math.floor(r() * 9), by = 11; g.fillStyle = '#8a5a2b'; g.fillRect(bx, by, 4, 3); g.fillStyle = '#c99a5b'; g.fillRect(bx + 1, by + 1, 2, 1); }
    return c;
  }
  const CROWD = (frame) => crowd(1, frame);
  const STALL_TOP = art([
    "kkkkkkkkkkkkkkkk",
    "krrwwrrwwrrwwrrk",
    "krrwwrrwwrrwwrrk",
    "krrwwrrwwrrwwrrk",
    "kkkkkkkkkkkkkkkk",
    ".krrwwrrwwrrwwr.",
    ".kkkkkkkkkkkkkk.",
    "..kpk........kpk",
    "..kpk........kpk",
    "..kpk........kpk",
    "..kpk........kpk",
    "..kpk........kpk",
    "..kpk........kpk",
    "..kpk........kpk",
    "..kpk........kpk",
    "..kpk........kpk",
  ], { k: K, r: '#d94848', w: '#f4efe0', p: '#8a5a2b' });
  const STALL = art([
    "..kpk........kpk",
    "..kpk........kpk",
    "kkkkkkkkkkkkkkkk",
    "kppppppppppppppk",
    "kPPPPPPPPPPPPPPk",
    "kkkkkkkkkkkkkkkk",
    ".kPk..........kP",
    ".kPk.kkk.kkk..kP",
    ".kPk.kbbkkggk.kP",
    ".kPk.kbbkkggk.kP",
    ".kPk.kkkkkkkk.kP",
    ".kPk..........kP",
    ".kPk..........kP",
    ".kkk..........kk",
    "................",
    "................",
  ], { k: K, p: '#c99a5b', P: '#9a6f3a', b: '#d9a86c', g: '#9ad6a0' });
  const WELL = art([
    "......kkkk......",
    ".....kppppk.....",
    "....kppppppk....",
    "...kppppppppk...",
    "..kkkkkkkkkkkk..",
    "..kPk......kPk..",
    "..kPk......kPk..",
    "..kPk.kkkk.kPk..",
    ".kkkkkLLLLkkkkk.",
    ".kLLLLLLLLLLLLk.",
    "kLLLggLLggLLggLk",
    "kLggLLggLLggLLLk",
    "kLLLggLLggLLggLk",
    "kgggggggggggggGk",
    ".kkkkkkkkkkkkkk.",
    "................",
  ], { k: K, p: '#c66a3f', P: '#8a5a2b', L: '#c7b48f', g: '#9a8a6a', G: '#6f6246' });
  const POT = art([
    "................",
    "................",
    "......kkkk......",
    ".....kccccck....",
    "......kccck.....",
    ".....kcccccck...",
    "....kccccccCCk..",
    "...kcccccccCCCk.",
    "...kcccccccCCCk.",
    "...kccccccCCCCk.",
    "...kcccccCCCCCk.",
    "....kccccCCCCk..",
    ".....kccCCCCk...",
    "......kkkkkk....",
    "................",
    "................",
  ], { k: K, c: '#c08a5a', C: '#8a5a32' });
  const HAY = art([
    "................",
    "................",
    "....kkkkkkkk....",
    "...kyyYyyyYyk...",
    "..kyYyyyyyyyyk..",
    ".kyyyyYyyyYyyyk.",
    ".kyYyyyyyyyyyYk.",
    "kyyyyyYyyYyyyyyk",
    "kyYyyyyyyyyyyYyk",
    "kyyyyYyyyyyYyyyk",
    "kYyyyyyyYyyyyyyk",
    ".kyyyYyyyyyYyyk.",
    ".kyyyyyyYyyyyyk.",
    "..kkkkkkkkkkkk..",
    "................",
    "................",
  ], { k: '#6f5a2a', y: '#e8c96a', Y: '#c9a84a' });
  const RUG = art([
    "rrrrrrrrrrrrrrrr",
    "rggggggggggggggr",
    "rgrrrrrrrrrrrrgr",
    "rgrggggggggggrgr",
    "rgrgrrrrrrrrgrgr",
    "rgrgrgggggggrgr.",
    "rgrgrgrrrrrgrgrr",
    "rgrgrgrgggrgrgrr",
    "rgrgrgrgggrgrgrr",
    "rgrgrgrrrrrgrgrr",
    "rgrgrgggggggrgrr",
    "rgrgrrrrrrrrgrgr",
    "rgrggggggggggrgr",
    "rgrrrrrrrrrrrrgr",
    "rggggggggggggggr",
    "rrrrrrrrrrrrrrrr",
  ], { r: '#9b2f2f', g: '#e0b12b' });
  const SHELF = art([
    "kkkkkkkkkkkkkkkk",
    "kwwwwwwwwwwwwwwk",
    "kwRRkYYkBBkGGkwk",
    "kwRRkYYkBBkGGkwk",
    "kwRRkYYkBBkGGkwk",
    "kwwwwwwwwwwwwwwk",
    "kwBBkGGkRRkYYkwk",
    "kwBBkGGkRRkYYkwk",
    "kwBBkGGkRRkYYkwk",
    "kwwwwwwwwwwwwwwk",
    "kwYYkRRkGGkBBkwk",
    "kwYYkRRkGGkBBkwk",
    "kwYYkRRkGGkBBkwk",
    "kwwwwwwwwwwwwwwk",
    "kkkkkkkkkkkkkkkk",
    "................",
  ], { k: K, w: '#8a5a2b', R: '#d94848', Y: '#e0b12b', B: '#3a7bd5', G: '#4fae5c' });
  const TABLE = art([
    "................",
    "................",
    "kkkkkkkkkkkkkkkk",
    "kppppppppppppppk",
    "kpppsssssssspppk",
    "kpppsSSSSSSspppk",
    "kpppsSSSSSSspppk",
    "kpppsssssssspppk",
    "kPPPPPPPPPPPPPPk",
    "kkkkkkkkkkkkkkkk",
    ".kPk........kPk.",
    ".kPk........kPk.",
    ".kPk........kPk.",
    ".kkk........kkk.",
    "................",
    "................",
  ], { k: K, p: '#c99a5b', P: '#9a6f3a', s: '#f7f2e4', S: '#8a7a5a' });
  const BED = art([
    "kkkkkkkkkkkkkkkk",
    "kppppppppppppppk",
    "kpwwwwwwwwwwwwpk",
    "kpwwwwwwwwwwwwpk",
    "kpkkkkkkkkkkkkpk",
    "kpbbbbbbbbbbbbpk",
    "kpbBBbbbbBBbbbpk",
    "kpbbbbbbbbbbbbpk",
    "kpbBBbbbbBBbbbpk",
    "kpbbbbbbbbbbbbpk",
    "kpbBBbbbbBBbbbpk",
    "kpbbbbbbbbbbbbpk",
    "kppppppppppppppk",
    "kkkkkkkkkkkkkkkk",
    ".kPk........kPk.",
    ".kkk........kkk.",
  ], { k: K, p: '#c99a5b', P: '#9a6f3a', w: '#f7f2e4', b: '#3a7bd5', B: '#8fb3e8' });
  const BOARD = art([
    "kkkkkkkkkkkkkkkk",
    "kppppppppppppppk",
    "kpkkkkkkkkkkkkpk",
    "kpkbbbbbbbbbbkpk",
    "kpkbwwbwwwbwbkpk",
    "kpkbbbbbbbbbbkpk",
    "kpkbwwwbwbwwbkpk",
    "kpkbbbbbbbbbbkpk",
    "kpkbwbwwwbwwbkpk",
    "kpkbbbbbbbbbbkpk",
    "kpkkkkkkkkkkkkpk",
    "kppppppppppppppk",
    "kkkkkkkkkkkkkkkk",
    ".....kPk.kPk....",
    ".....kPk.kPk....",
    ".....kkk.kkk....",
  ], { k: K, p: '#c99a5b', P: '#9a6f3a', b: '#2b3a2e', w: '#f7f2e4' });
  // City gate, 48×48 (3×3 tiles): an arch in the wall
  const GATE = art([
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLk",
    "kLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLLkLk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk",
    "kwwwkwwwwwkwwwwwkwwwwwkwwwwwkwwwwwkwwwwwkwwwwwwk",
    "kwwwkwwwwwkwwwwwkwwwwwkwwwwwkwwwwwkwwwwwkwwwwwwk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "kwwwwwwwwwwwwwwwwkkkkkkkkkkkkkkwwwwwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwwkkkSSSSSSSSSSSSSSkkkwwwwwwwwwwwwwk",
    "kwwkwwwwwkwwwkSSSSSSSSSSSSSSSSSSSSkwwkwwwwwkwwwk",
    "kwwkwwwwwkwwkSSSSSSSSSSSSSSSSSSSSSSkwkwwwwwkwwwk",
    "kkkkkkkkkkkkkSSSSSSSSSSSSSSSSSSSSSSkkkkkkkkkkkkk",
    "kwwwwwwwwwwwkSSkkkkkkkkkkkkkkkkkkSSkwwwwwwwwwwwk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kkkkkkkkkkkkkSkggggggggggggggggggkSkkkkkkkkkkkkk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwkwwwwwkwwkSkggggggggggggggggggkSkwwkwwwwwkwwk",
    "kwwkwwwwwkwwkSkggggggggggggggggggkSkwwkwwwwwkwwk",
    "kkkkkkkkkkkkkSkggggggggggggggggggkSkkkkkkkkkkkkk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kkkkkkkkkkkkkSkggggggggggggggggggkSkkkkkkkkkkkkk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwkwwwwwkwwkSkggggggggggggggggggkSkwwkwwwwwkwwk",
    "kwwkwwwwwkwwkSkggggggggggggggggggkSkwwkwwwwwkwwk",
    "kkkkkkkkkkkkkSkggggggggggggggggggkSkkkkkkkkkkkkk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kkkkkkkkkkkkkSkggggggggggggggggggkSkkkkkkkkkkkkk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwkwwwwwkwwkSkggggggggggggggggggkSkwwkwwwwwkwwk",
    "kwwkwwwwwkwwkSkggggggggggggggggggkSkwwkwwwwwkwwk",
    "kkkkkkkkkkkkkSkggggggggggggggggggkSkkkkkkkkkkkkk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwwwwwwwwwkSkggggggggggggggggggkSkwwwwwwwwwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kwwwkwwwwwkwkSkggggggggggggggggggkSkwkwwwwwkwwwk",
    "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  ], { k: '#6f6246', L: '#e8dcbc', w: '#c7b48f', S: '#a8966f', g: '#2b2230' });

  // ---------- registry ----------
  const made = {
    grass: [grass(1), grass(2), grass(3), grass(4)],
    grass_dark: [grass(5, true), grass(6, true)],
    flowers: [[flowers(7, 0), flowers(7, 1)], [flowers(8, 0), flowers(8, 1)]],
    tall: [[tallgrass(9, 0), tallgrass(9, 1)], [tallgrass(10, 0), tallgrass(10, 1)], [tallgrass(11, 0), tallgrass(11, 1)]],
    dirt: [dirt(12), dirt(13), dirt(14)],
    sand: [sand(15), sand(16)],
    pave: [pavement(17), pavement(18), pavement(19)],
    pave_dark: [pavement(20, 'dark'), pavement(21, 'dark')],
    wall: wall(22, false), wall_top: wall(23, true),
    water: [water(24, 0), water(24, 1), water(24, 2)],
    roof: roof(25), roof_blue: roof(26, 'blue'),
    plaster: plaster(27),
    floor_wood: floor(28, 'wood'), floor_stone: floor(29, 'stone'),
    tree: TREE, olive: OLIVE, cypress: CYPRESS, bush: BUSH, rock: ROCK,
    fence_h: FENCE_H, fence_v: FENCE_V, sign: SIGN, door: DOOR, window: WINDOW,
    crowd: [[crowd(1, 0), crowd(1, 1)], [crowd(2, 0), crowd(2, 1)], [crowd(3, 0), crowd(3, 1)], [crowd(4, 0), crowd(4, 1)], [crowd(5, 0), crowd(5, 1)]], stall_top: STALL_TOP, stall: STALL, well: WELL, pot: POT, hay: HAY,
    rug: RUG, shelf: SHELF, table: TABLE, bed: BED, board: BOARD, gate: GATE,
  };

  return { T, made };
})();
