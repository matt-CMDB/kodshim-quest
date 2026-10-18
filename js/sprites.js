/* Kodshim Quest — pixel art.
   Every sprite is a list of equal-length strings; each character maps to a
   colour through the sprite's legend ('.' is transparent). build() rasterises
   a sprite once into an offscreen canvas; get() caches by name. */
window.Sprites = (function () {
  const cache = {};
  const problems = [];

  const COL = {
    k: '#2b2230', // outline
    w: '#ffffff',
  };

  function build(rows, legend, opts = {}) {
    const h = rows.length;
    const w = Math.max(...rows.map(r => r.length));
    rows.forEach((r, i) => { if (r.length !== w) problems.push(`${opts.name || '?'} row ${i}: ${r.length} != ${w}`); });
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      const r = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = r[x];
        if (!ch || ch === '.') continue;
        const col = legend[ch] || COL[ch];
        if (!col) { problems.push(`${opts.name || '?'} unknown char '${ch}' at ${x},${y}`); continue; }
        g.fillStyle = col;
        g.fillRect(opts.mirror ? w - 1 - x : x, y, 1, 1);
      }
    }
    return c;
  }

  // ------------------------------------------------------------------
  // Humans. 16×20, three views (down / up / side). Legend characters:
  // k outline, h hair, s skin, t tunic, u tunic shade, b belt, d sandal,
  // e eye, H headwear, B beard, c cloak.
  // ------------------------------------------------------------------
  const HUMAN = {
    down: [
      "......kkkk......",
      "....kkhhhhkk....",
      "...khhhhhhhhk...",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..khhsshhsshhk..",
      "..kssssssssssk..",
      "..ksessssssesk..",
      "..ksessssssesk..",
      "..kssssssssssk..",
      "...kssssssssk...",
      "....kkttttkk....",
      "..kkttttttttkk..",
      ".kstkttttttktsk.",
      ".kstkttbbttktsk.",
      ".kkkkttttttkkkk.",
      "....kttttttk....",
      "....kuuuuuuk....",
      "....kssk.kssk...",
      "....kddk.kddk...",
    ],
    up: [
      "......kkkk......",
      "....kkhhhhkk....",
      "...khhhhhhhhk...",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..kshhhhhhhhsk..",
      "...kssssssssk...",
      "....kkttttkk....",
      "..kkttttttttkk..",
      ".kstkttttttktsk.",
      ".kstkttbbttktsk.",
      ".kkkkttttttkkkk.",
      "....kttttttk....",
      "....kuuuuuuk....",
      "....kssk.kssk...",
      "....kddk.kddk...",
    ],
    side: [
      "......kkkk......",
      "....kkhhhhkk....",
      "...khhhhhhhhk...",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..ksshhhhhhhhk..",
      "..ksssshhhhhhk..",
      "..kesssshhhhhk..",
      "..kssssssshhhk..",
      "..kssssssshhhk..",
      "...kssssssssk...",
      "....kkttttkk....",
      "...kttttttttk...",
      "...kttksttttk...",
      "...kttksbbttk...",
      "...kttkkttttk...",
      "....kttttttk....",
      "....kuuuuuuk....",
      ".....kssssk.....",
      ".....kddddk.....",
    ],
  };
  // walking frames: replace the last three rows
  const LEGS = {
    down_step: ["....kuuuuuuk....", "....kssk.kddk...", "....kddk........"],
    side_step: ["....kuuuuuuk....", "...kssk..kssk...", "...kddk..kddk..."],
  };
  const HATS = {
    turban: [ // migba'at of a kohen
      "......kkkk......",
      "....kkHHHHkk....",
      "...kHHHHHHHHk...",
      "..kHHHHHHHHHHk..",
      "..kHHHHHHHHHHk..",
      "..kkkkkkkkkkkk..",
    ],
    scarf: [ // shepherd's head wrap / woman's scarf
      "......kkkk......",
      "....kkHHHHkk....",
      "...kHHHHHHHHk...",
      "..kHHHHHHHHHHk..",
      "..kHHHHHHHHHHk..",
      "..kHHkkkkkkHHk..",
    ],
    cap: [ // small kippah-like cap
      "......kkkk......",
      "....kkHHHHkk....",
      "...khHHHHHHhk...",
      "..khhhhhhhhhhk..",
      "..khhhhhhhhhhk..",
      "..khhsshhsshhk..",
    ],
  };
  const BEARD = {
    down: { 9: "..ksBBBBBBBBsk..", 10: "...kBBBBBBBBk...", 11: "....kBBBBBBk...." },
    side: { 8: "..kBBsssssshhk..", 9: "..kBBBBsssshhk..", 10: "...kBBBssssk...." },
  };
  const DRESS = ["...kttttttttk...", "...kuuuuuuuuk...", "..kttttttttttk..", "..kkkkkkkkkkkk.."];

  function human(spec) {
    const legend = {
      h: spec.hair || '#4a2f1b', s: spec.skin || '#e8b98a', t: spec.tunic || '#f4efe0',
      u: spec.shade || shade(spec.tunic || '#f4efe0'), b: spec.belt || '#8a5a2b', d: '#5a3a22',
      e: '#1d1b2c', H: spec.hat_color || '#f4efe0', B: spec.beard || '#6b6b6b',
    };
    const out = {};
    const views = { down: HUMAN.down, up: HUMAN.up, side: HUMAN.side };
    for (const [view, base] of Object.entries(views)) {
      let rows = base.slice();
      if (spec.hat && HATS[spec.hat]) {
        const hat = HATS[spec.hat];
        for (let i = 0; i < hat.length; i++) rows[i] = hat[i];
        if (view === 'up' && spec.hat !== 'cap') {
          // from behind the wrap covers the hair
          for (let i = 6; i <= 9; i++) rows[i] = rows[i].replace(/h/g, 'H');
        }
        if (view === 'side' && spec.hat === 'cap') rows[5] = "..ksshhhhhhhhk..";
      }
      if (spec.beard && BEARD[view]) for (const [i, r] of Object.entries(BEARD[view])) rows[+i] = r;
      if (spec.dress) for (let i = 0; i < 4; i++) rows[16 + i] = DRESS[i];
      const frames = { stand: rows };
      if (!spec.dress) {
        const step = rows.slice();
        const legs = view === 'side' ? LEGS.side_step : LEGS.down_step;
        for (let i = 0; i < 3; i++) step[17 + i] = legs[i];
        frames.step = step;
      } else {
        // a dress bobs instead of stepping
        frames.step = [rows[0].replace(/k/g, '.'), ...rows.slice(0, 19)];
      }
      out[view] = frames;
    }
    return { legend, views: out };
  }

  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.round(v * 0.72));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  const PEOPLE = {
    player:   { hair: '#4a2f1b', tunic: '#f4efe0', belt: '#b8862b', hat: 'cap', hat_color: '#3a7bd5' },
    kohen:    { hair: '#3a2a1a', tunic: '#ffffff', belt: '#8a5cd6', hat: 'turban', hat_color: '#ffffff', beard: '#4a3a2a' },
    gadol:    { hair: '#3a2a1a', tunic: '#ffffff', belt: '#e0b12b', hat: 'turban', hat_color: '#f2c94c', beard: '#9a9a9a' },
    elder:    { hair: '#9a9a9a', tunic: '#c9b79c', belt: '#5a3a22', beard: '#dddddd' },
    shepherd: { hair: '#2a1a0a', tunic: '#a8784a', belt: '#5a3a22', hat: 'scarf', hat_color: '#e0c89a' },
    shepherd2:{ hair: '#2a1a0a', tunic: '#7a8a5a', belt: '#5a3a22', hat: 'scarf', hat_color: '#c9a070', beard: '#2a1a0a' },
    pilgrim:  { hair: '#1a1a1a', tunic: '#3a7bd5', belt: '#f2c94c' },
    pilgrim2: { hair: '#5a2a1a', tunic: '#d94848', belt: '#f2c94c', beard: '#5a2a1a' },
    pilgrim3: { hair: '#1a1a1a', tunic: '#4fae5c', belt: '#8a5a2b' },
    woman:    { hair: '#8a5cd6', tunic: '#d65a8c', belt: '#f2c94c', hat: 'scarf', hat_color: '#8a5cd6', dress: true },
    woman2:   { hair: '#3a7bd5', tunic: '#e0b12b', belt: '#8a5a2b', hat: 'scarf', hat_color: '#3a7bd5', dress: true },
    merchant: { hair: '#2a1a0a', tunic: '#8a5cd6', belt: '#f2c94c', beard: '#2a1a0a' },
    boy:      { hair: '#e0b12b', tunic: '#4fae5c', belt: '#5a3a22' },
    levi:     { hair: '#2a1a0a', tunic: '#e8e1cc', belt: '#3a7bd5', hat: 'cap', hat_color: '#e8e1cc' },
  };

  function person(kind, view, frame, mirror) {
    const key = `p:${kind}:${view}:${frame}:${mirror ? 1 : 0}`;
    if (cache[key]) return cache[key];
    const spec = PEOPLE[kind] || PEOPLE.player;
    const h = human(spec);
    const rows = h.views[view][frame] || h.views[view].stand;
    return (cache[key] = build(rows, h.legend, { mirror, name: key }));
  }

  // Player seen from behind, for the encounter screen (24×32).
  const PLAYER_BACK = [
    "........kkkkkkkk........",
    "......kkHHHHHHHHkk......",
    ".....kHHHHHHHHHHHHk.....",
    "....khhHHHHHHHHHHhhk....",
    "....khhhhhhhhhhhhhhk....",
    "....khhhhhhhhhhhhhhk....",
    "....khhhhhhhhhhhhhhk....",
    "....khhhhhhhhhhhhhhk....",
    "....khhhhhhhhhhhhhhk....",
    "....khhhhhhhhhhhhhhk....",
    ".....kshhhhhhhhhhsk.....",
    "......kssssssssssk......",
    ".......kkssssssskk......",
    ".......kkttttttkk.......",
    "....kkkttttttttttkkk....",
    "...ktttttttttttttttttk..",
    "..kstkttttttttttttktsk..",
    "..kstkttttttttttttktsk..",
    "..kstkttttbbbbttttktsk..",
    "..kstkttttbbbbttttktsk..",
    "..kkkkttttttttttttkkkk..",
    ".....kttttttttttttk.....",
    ".....kttttttttttttk.....",
    ".....kuuuuuuuuuuuuk.....",
    ".....kuuuuuuuuuuuuk.....",
    ".....ksssssk.ksssssk....",
    ".....ksssssk.ksssssk....",
    ".....ksssssk.ksssssk....",
    ".....kdddddk.kdddddk....",
    ".....kkkkkkk.kkkkkkk....",
    "........................",
    "........................",
  ];

  // ------------------------------------------------------------------
  // Animals for the encounter screen. Facing left.
  // Sheep legend: w wool, v wool shade, x wool dark, f face, n nose,
  // o horn, p horn shade, l leg, d hoof, e eye.
  // ------------------------------------------------------------------
  const SHEEP_L = { w: '#f7f2e4', v: '#dcd3bb', x: '#b9ad90', f: '#c79a6b', g: '#a8784a', n: '#d98c8c', o: '#d9b06a', p: '#9c7a3c', l: '#6b5a48', d: '#3a2a22', e: '#1d1b2c' };
  const RAM = [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............kkkkkkkkkk.......",
    "..............kwwwwwwwwwwkk.....",
    "............kkwwwwwwwwwwwwwk....",
    "...........kwwwwwwwwwwwwwwwwk...",
    "..........kwwwwwwwwwwwwwwwwwwk..",
    ".....kkk..kwwwwwwwwwwwwwwwwwwk..",
    "....koopk.kwwwwwwwwwwwwwwwwwwwk.",
    "...koppppkkwwwwwwwwwwwwwwwwwwwk.",
    "...kopkkopkwwvvwwwwwwwwwwwwwwwk.",
    "...kopkffkpkwvvvwwwwwwwwwwwwwwk.",
    "...kokfffffkkvvvvwwwwwwwwwwwwwk.",
    "...kkfffefffkvvvvvwwwwwwwwwwwwk.",
    "..kffffffffffkvvvvvvwwwwwwwwwwk.",
    "..kffffffffffkxvvvvvvvwwwwwwwwk.",
    "..knnfffffffkxxvvvvvvvvvwwwwwwk.",
    "..knnfffffffkxxxvvvvvvvvvvwwwk..",
    "...kkffffffkxxxxvvvvvvvvvvvvk...",
    ".....kkkkkkkxxxxxvvvvvvvvvvk....",
    "...........kkxxxxxxvvvvvvkk.....",
    "............kllkkxxxkkllk.......",
    "............kllk..kk.kllk.......",
    "............kllk.....kllk.......",
    "............kllk.....kllk.......",
    "............kllk.....kllk.......",
    "............kddk.....kddk.......",
    "............kkkk.....kkkk.......",
    "................................",
  ];
  const EWE = [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............kkkkkkkkkk.......",
    "..............kwwwwwwwwwwkk.....",
    "............kkwwwwwwwwwwwwwk....",
    "...........kwwwwwwwwwwwwwwwwk...",
    "..........kwwwwwwwwwwwwwwwwwwk..",
    "......kk..kwwwwwwwwwwwwwwwwwwk..",
    ".....kffkkkwwwwwwwwwwwwwwwwwwwk.",
    "....kfffffkwwwwwwwwwwwwwwwwwwwk.",
    "....kffffffkwvvwwwwwwwwwwwwwwwk.",
    "...kffffffffkvvvwwwwwwwwwwwwwwk.",
    "...kfffefffffkvvvvwwwwwwwwwwwwk.",
    "..kffffffffffkvvvvvwwwwwwwwwwwk.",
    "..kffffffffffkxvvvvvvwwwwwwwwwk.",
    "..knnfffffffkxxvvvvvvvvvwwwwwwk.",
    "..knnfffffffkxxxvvvvvvvvvvwwwk..",
    "...kkffffffkxxxxvvvvvvvvvvvvk...",
    ".....kkkkkkkxxxxxvvvvvvvvvvk....",
    "...........kkxxxxxxvvvvvvkk.....",
    "............kllkkxxxkkllk.......",
    "............kllk..kk.kllk.......",
    "............kllk.....kllk.......",
    "............kllk.....kllk.......",
    "............kllk.....kllk.......",
    "............kddk.....kddk.......",
    "............kkkk.....kkkk.......",
    "................................",
  ];
  const LAMB = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "...........kkkkkkkk.....",
    ".....kk...kwwwwwwwwk....",
    "....kffk.kwwwwwwwwwwk...",
    "...kffffkkwwwwwwwwwwwk..",
    "...kfefffkwvwwwwwwwwwk..",
    "..kffffffkvvvwwwwwwwwk..",
    "..kffffffkvvvvwwwwwwwk..",
    "..knnfffffkxvvvvwwwwwk..",
    "..knnffffkxxvvvvvvwwwk..",
    "...kkffffkxxxvvvvvvwk...",
    ".....kkkkkxxxxvvvvvvk...",
    ".........kkxxxxvvvvkk...",
    "..........kllkxxkllk....",
    "..........kllk..kllk....",
    "..........kllk..kllk....",
    "..........kddk..kddk....",
    "..........kkkk..kkkk....",
    "........................",
    "........................",
  ];

  // Goat legend: g coat, G shade, D dark, L light, B beard, u udder, o/p horn
  const GOAT_L = { g: '#9c8b78', G: '#7a6a58', D: '#4e4238', L: '#bfb0a0', B: '#3b312a', u: '#d9a6a0', o: '#d9b06a', p: '#9c7a3c', n: '#3b312a', e: '#1d1b2c', d: '#3a2a22' };
  const BUCK = [
    "................................",
    "................................",
    "................................",
    "..............kk................",
    ".............koopk..............",
    "............koppk...............",
    "...........koppk................",
    "..........koppk....kkkkkkkk.....",
    ".........koppk...kkLLLLLLLLkk...",
    "......kkkkoppkkkkLLLLLLLLLLLLk..",
    ".....kggggggkpkLLLLggggggggggLk.",
    "....kggggggggkkLLggggggggggggggk",
    "....kgeggggggggkLgggggggggggggGk",
    "...kggggggggggkggggggggggggggGGk",
    "...kgggggggggkgggggggggggggggGGk",
    "...knngggggggkggggggggggggggGGGk",
    "...knnggggggkgGgggggggggggggGGk.",
    "....kkggggkkkGGgggggggggggggGGk.",
    ".....kBBBBkkGGGgggggggggggGGGk..",
    ".....kBBBk.kGGGGggggggggGGGGk...",
    "......kBBk.kDGGGGGGGGGGGGGGDk...",
    "......kBk..kDDGGGGGGGGGGGDDk....",
    "......kk...kDkDDDDGGDDDDkDk.....",
    "...........kDk.kDDkkDDk.kDk.....",
    "...........kGk.kGk..kGk.kGk.....",
    "...........kGk.kGk..kGk.kGk.....",
    "...........kGk.kGk..kGk.kGk.....",
    "...........kDk.kDk..kDk.kDk.....",
    "...........kkk.kkk..kkk.kkk.....",
    "................................",
    "................................",
    "................................",
  ];
  const NANNY = [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...................kkkkkkkk.....",
    ".........kk......kkLLLLLLLLkk...",
    "........kopk....kLLLLLLLLLLLLk..",
    ".....kkkkopkk..kLLLggggggggggLk.",
    "....kggggggggkkLLggggggggggggggk",
    "....kgeggggggggkLgggggggggggggGk",
    "...kggggggggggkggggggggggggggGGk",
    "...kgggggggggkgggggggggggggggGGk",
    "...knngggggggkggggggggggggggGGGk",
    "...knnggggggkgGgggggggggggggGGk.",
    "....kkggggkkkGGgggggggggggggGGk.",
    ".....kBBkkkGGGGgggggggggggGGGk..",
    "......kk...kGGGGggggggggGGGGk...",
    "...........kDGGGGGGGGGGGGGGDk...",
    "...........kDDGGGGGGGGuuuDDk....",
    "...........kDkDDDDGGDkuukkDk....",
    "...........kDk.kDDkkDDkkkkDk....",
    "...........kGk.kGk..kGk.kGk.....",
    "...........kGk.kGk..kGk.kGk.....",
    "...........kGk.kGk..kGk.kGk.....",
    "...........kDk.kDk..kDk.kDk.....",
    "...........kkk.kkk..kkk.kkk.....",
    "................................",
    "................................",
    "................................",
  ];
  const KID = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "..............kkkkkk....",
    ".....kkk....kkLLLLLLk...",
    "....kgggk..kLLLgggggLk..",
    "...kggggkkkLLggggggggk..",
    "...kgeggggkLgggggggggk..",
    "..kkgggggggkggggggggGk..",
    ".kggkgggggkgggggggggGk..",
    ".kggknngggkggggggggGGk..",
    "..kkknngggkggggggggGGk..",
    "....kkggkkkGGggggggGGk..",
    "......kBkkDGGGGGGGGGk...",
    "......kk.kDkDDGGDDDDk...",
    ".........kDkkkDkkDDkk...",
    ".........kGk.kGk.kGk....",
    ".........kGk.kGk.kGk....",
    ".........kDk.kDk.kDk....",
    ".........kkk.kkk.kkk....",
    "........................",
    "........................",
  ];

  // Cattle legend: c coat, C shade, D dark, L light, m muzzle, u udder
  const CATTLE_L = { c: '#b0623a', C: '#874423', D: '#4e2412', L: '#d08a62', m: '#e2b39a', u: '#e8b4a4', o: '#e4cf9a', p: '#a8905a', e: '#1d1b2c', d: '#3a2a22', n: '#5a3a2a' };
  const BULL = [
    "................................",
    "................................",
    "................................",
    "..................kkkkkkkk......",
    "................kkLLLLLLLLkk....",
    "...kkk.........kLLLccccccccckk..",
    "..koopk.......kLLccccccccccccck.",
    ".koppppk.....kLccccccccccccccccc",
    ".kopkkopk...kLcccccccccccccccccC",
    ".kok.kkopkkkkcccccccccccccccccCC",
    ".kk..kcccccccccccccccccccccccCCC",
    "....kcccccccccccccccccccccccccCC",
    "...kccecccccccccccccccccccccCCCC",
    "...kcccccccccccccccccccccccCCCCk",
    "..kccccccccccccccccccccccccCCCCk",
    "..kmmmccccccccccccccccccccCCCCCk",
    "..kmmmmmcccccccccccccccccCCCCCk.",
    "..kmnmmmcccccccCccccccccCCCCCCk.",
    "..kmmmmmcccccCCCCCCCCCCCCCCCDk..",
    "...kmmmmckCCCCCCCCCCCCCCCCCDk...",
    "....kkkkkkDDCCCCCCCCCCCCCDDk....",
    "..........kDDDDDCCCCDDDDDDk.....",
    "..........kDDkkDDDDDDkkDDk......",
    "..........kDk..kDDDDk..kDk......",
    "..........kCk..kCkkCk..kCk......",
    "..........kCk..kCk.kCk.kCk......",
    "..........kCk..kCk.kCk.kCk......",
    "..........kDk..kDk.kDk.kDk......",
    "..........kkk..kkk.kkk.kkk......",
    "................................",
    "................................",
    "................................",
  ];
  const COW = [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..................kkkkkkkk......",
    "...kkk...........kLLLLLLLLkk....",
    "..kopk..........kLLcccccccccck..",
    "..koppk........kLccccccccccccck.",
    "...kkoppkkkk..kcccccccccccccccc.",
    ".....kccccccccccccccccccccccccC.",
    "....kccccccccccccccccccccccccCCk",
    "...kccecccccccccccccccccccccCCCk",
    "...kcccccccccccccccccccccccCCCCk",
    "..kccccccccccccccccccccccccCCCCk",
    "..kmmmccccccccccccccccccccCCCCCk",
    "..kmmmmmcccccccccccccccccCCCCCk.",
    "..kmnmmmcccccccCccccccccCCCCCCk.",
    "..kmmmmmcccccCCCCCCCCCCCCCCCDk..",
    "...kmmmmckCCCCCCCCCCCCCCCCCDk...",
    "....kkkkkkDDCCCCCCCCCCCuuuDk....",
    "..........kDDDDDCCCCDDkuuukk....",
    "..........kDDkkDDDDDDkkkkDk.....",
    "..........kDk..kDDDDk..kDk......",
    "..........kCk..kCkkCk..kCk......",
    "..........kCk..kCk.kCk.kCk......",
    "..........kCk..kCk.kCk.kCk......",
    "..........kDk..kDk.kDk.kDk......",
    "..........kkk..kkk.kkk.kkk......",
    "................................",
    "................................",
    "................................",
  ];
  const CALF = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "..............kkkkkk....",
    "............kkLLLLLLk...",
    "....kkkk...kLLcccccccLk.",
    "...kcccck.kLccccccccccck",
    "..kccecccckccccccccccccC",
    "..kcccccccccccccccccccCC",
    "..kccccccccccccccccccCCk",
    "..kmmcccccccccccccccCCCk",
    "..kmnmmccccccccccccCCCCk",
    "..kmmmmcccccCCCCCCCCCCk.",
    "...kkkkkcDDCCCCCCCCCDDk.",
    ".......kDkDDDCCCDDDkDk..",
    ".......kDk.kDDkkDDk.kDk.",
    ".......kCk.kCk..kCk.kCk.",
    ".......kCk.kCk..kCk.kCk.",
    ".......kDk.kDk..kDk.kDk.",
    ".......kkk.kkk..kkk.kkk.",
    "........................",
    "........................",
  ];

  // Birds. Turtledove: t body, T shade, b wing brown, s black/white neck patch, w white, y beak, f feet
  const DOVE_L = { t: '#d9b9a3', T: '#b58f78', b: '#9a6b47', B: '#6b4530', s: '#2b2230', w: '#ffffff', y: '#e0b12b', f: '#d65a5a', e: '#1d1b2c', g: '#9aa4b8', G: '#6f7a90', p: '#c9d2e0', o: '#f2c94c' };
  const TURTLEDOVE = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    ".......kkkk.............",
    "......ktttttk...........",
    ".....kteTttttk..........",
    "....kyyttttttkkkkk......",
    ".....kktttswsttttkkk....",
    ".......kttwswtttbbbbk...",
    ".......ktttttttbbBbbbk..",
    "........kttttttbbBbbbbk.",
    "........ktttttttbBbbbbbk",
    "........kTttttttBBbbbbkk",
    ".........kTTTttttBBBkkk.",
    "..........kTTTTTTkkkk...",
    "...........kkkTTkkkk....",
    "............kfkkfk......",
    "...........kffkkffk.....",
    "...........kkkkkkkk.....",
    "........................",
    "........................",
    "........................",
  ];
  const PIGEON = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "......kkkkk.............",
    ".....kppppppk...........",
    "....kpegppppppk.........",
    "...kyyppppppppkkkk......",
    "....kkpppppppppppppkk...",
    "......kgggpppppggggggk..",
    "......kgggggppgggGGggk..",
    ".......kgggggggggGGGgk..",
    ".......kggggggggGGGGkk..",
    "........kGggggggGGGkk...",
    ".........kGGGGGGGkkk....",
    "..........kkGGGkkk......",
    "...........kfkkfk.......",
    "..........kffkkffk......",
    "..........kkkkkkkk......",
    "........................",
    "........................",
    "........................",
  ];

  const ANIMALS = {
    ram: [RAM, SHEEP_L], ewe: [EWE, SHEEP_L], lamb: [LAMB, SHEEP_L],
    buck: [BUCK, GOAT_L], nanny: [NANNY, GOAT_L], kid: [KID, GOAT_L],
    bull: [BULL, CATTLE_L], cow: [COW, CATTLE_L], calf: [CALF, CATTLE_L],
    turtledove: [TURTLEDOVE, DOVE_L], pigeon: [PIGEON, DOVE_L],
  };

  // Small overworld animals (16×16), facing left.
  const SMALL = {
    sheep: [[
      "................",
      "................",
      "................",
      ".......kkkkkk...",
      "..kk..kwwwwwwk..",
      ".kffkkwwwwwwwwk.",
      ".kefffkwvwwwwwk.",
      ".kfffffkvvwwwwk.",
      ".knffffkvvvvwwk.",
      "..kkfffkxvvvvwk.",
      "....kkkxxxvvvk..",
      ".....kkxxxxkkk..",
      ".....klk.klk....",
      ".....klk.klk....",
      ".....kdk.kdk....",
      "................",
    ], SHEEP_L],
    goat: [[
      "................",
      "................",
      ".....kk.........",
      "....kopk........",
      "...kkopkkkkkkk..",
      "..kggggkLLgggGk.",
      "..kegggkgggggGk.",
      "..kggggkgggggGk.",
      "..knggggggggGGk.",
      "...kkggkGGGGGGk.",
      "....kBkDDDDDDk..",
      ".....kkDkkkDk...",
      ".....kGk..kGk...",
      ".....kGk..kGk...",
      ".....kdk..kdk...",
      "................",
    ], GOAT_L],
    cattle: [[
      "................",
      "................",
      "................",
      "..kk....kkkkkk..",
      ".kopk..kLLccccck",
      "..kkkkkcccccccck",
      "..kcccccccccccCk",
      ".kcecccccccccCCk",
      ".kccccccccccCCCk",
      ".kmmcccccCCCCCk.",
      ".kmmmccCCCCCCDk.",
      "..kkkkDDDDDDDk..",
      ".....kDkkkkDk...",
      ".....kCk..kCk...",
      ".....kCk..kCk...",
      ".....kdk..kdk...",
    ], CATTLE_L],
    bird: [[
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "......kkk.......",
      ".....kteTk......",
      "....kyttttkkk...",
      ".....kkttttbbk..",
      ".......kttbbbbk.",
      ".......kTttBbbk.",
      "........kTTTkk..",
      ".........kfkf...",
      "........kkkkkk..",
      "................",
    ], DOVE_L],
  };

  // UI bits
  const HEART = [[
    "..kkk..kkk..",
    ".krrrkkrrrk.",
    "krrwrrrrrrrk",
    "krwrrrrrrrrk",
    "krrrrrrrrrrk",
    ".krrrrrrrrk.",
    "..krrrrrrk..",
    "...krrrrk...",
    "....krrk....",
    ".....kk.....",
  ], { r: '#e8464a', w: '#ffb3b5' }];
  const HEART_EMPTY = [[
    "..kkk..kkk..",
    ".kgggkkgggk.",
    "kgggggggggkk",
    "kggggggggggk",
    "kggggggggggk",
    ".kggggggggk.",
    "..kggggggk..",
    "...kggggk...",
    "....kggk....",
    ".....kk.....",
  ], { g: '#4a4a5a' }];

  // Seals of the Mikdash (Shekalim 5:3). 16×16 clay stamps.
  function sealRows(motif) {
    return [
      ".....kkkkkk.....",
      "...kkbbbbbbkk...",
      "..kbbllllllbbk..",
      ".kbllllllllllbk.",
      ".kbll" + motif[0] + "lllbk.",
      "kbll" + motif[1] + "lllbk",
      "kbll" + motif[2] + "lllbk",
      "kbll" + motif[3] + "lllbk",
      "kbll" + motif[4] + "lllbk",
      "kbll" + motif[5] + "lllbk",
      ".kbll" + motif[6] + "lllbk.",
      ".kbllllllllllbk.",
      "..kbbllllllbbk..",
      "...kkbbbbbbkk...",
      ".....kkkkkk.....",
      "................",
    ];
  }
  const SEALS = {
    egel:   [sealRows(["mm.mm", "mmmmmmm", "mmmmmmm", ".mmmmm.", ".mm.mm.", ".mmmmm.", "..mmm"]), { b: '#8a5a2b', l: '#d9a86c', m: '#5a2a12' }],
    zachar: [sealRows(["m...m", "mm...mm", ".mm.mm.", "..mmm..", "...m...", "...m...", "...m."]), { b: '#2a4a8a', l: '#8fb3e8', m: '#13255a' }],
    gedi:   [sealRows([".m.m.", "mmmmmmm", ".mmmmm.", "..mmm..", "..mmm..", "...m...", "...m."]), { b: '#2f6b3a', l: '#9ad6a0', m: '#15381c' }],
    chotei: [sealRows(["mmmmm", "mm...mm", "m.....m", "m..m..m", "m.....m", "mm...mm", "mmmmm"]), { b: '#8a2d2d', l: '#e8a0a0', m: '#4a1010' }],
    dal:    [sealRows(["..m..", "..m....", "mmmmmmm", "..m....", "..m....", "..m....", ".mmm."]), { b: '#5a3a8a', l: '#c3a6e8', m: '#2a1550' }],
  };

  // ------------------------------------------------------------------
  function get(name) {
    if (cache[name]) return cache[name];
    let c;
    if (ANIMALS[name]) c = build(ANIMALS[name][0], ANIMALS[name][1], { name });
    else if (name.startsWith('small:')) { const k = name.slice(6).split(':'); const s = SMALL[k[0]]; c = build(s[0], s[1], { name, mirror: k[1] === 'r' }); }
    else if (name === 'heart') c = build(HEART[0], HEART[1], { name });
    else if (name === 'heart_empty') c = build(HEART_EMPTY[0], HEART_EMPTY[1], { name });
    else if (name.startsWith('seal:')) { const s = SEALS[name.slice(5)]; c = build(s[0], s[1], { name }); }
    else if (name === 'player_back') c = build(PLAYER_BACK, { h: '#4a2f1b', s: '#e8b98a', t: '#f4efe0', u: '#b0a88f', b: '#b8862b', d: '#5a3a22', H: '#3a7bd5' }, { name });
    else throw new Error('unknown sprite ' + name);
    return (cache[name] = c);
  }

  return { get, person, build, problems, PEOPLE, ANIMALS, SMALL };
})();
