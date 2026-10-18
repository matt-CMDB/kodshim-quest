/* Kodshim Quest — the engine: loop, overworld, dialogue, scripts, save. */
window.Game = (function () {
  const T = 16;
  let VW = 36, VH = 22, W = VW * T, H = VH * T, SCALE = 2;
  const C = window.Content, R = window.Rules, SP = window.Sprites, TL = window.Tiles.made, A = window.Audio2;
  const canvas = document.getElementById('world');
  const g = canvas.getContext('2d');
  const glowC = document.getElementById('glow'), blurC = document.getElementById('blur'), lightC = document.getElementById('light');
  const glowG = glowC.getContext('2d'), blurG = blurC.getContext('2d'), lightG = lightC.getContext('2d');
  const gameEl = document.getElementById('game');
  g.imageSmoothingEnabled = false;
  let motes = [];
  const ui = document.getElementById('ui');
  const fadeEl = document.getElementById('fade');
  const SAVE_KEY = 'kodshim.quest.v1';

  // ------------------------------------------------------------ state
  const fresh = () => ({ map: 'home', x: 5, y: 6, dir: 'up', hp: 6, maxHp: 6, xp: 0, flags: {}, seen: {}, reg: {}, seals: [], journal: [], beaten: {}, taught: {}, music: true, steps: 0, wins: 0, losses: 0, encounters: 0, moved: {} });
  let S = fresh();
  let map = null, npcs = [], anims = [], player = null, cam = { x: 0, y: 0 }, tick = 0;
  let mode = 'title';          // title | world | script
  let busy = false;            // a script is running
  let particles = [], emotes = [], clouds = [];
  const keys = {};
  const handlers = [];         // input handler stack (topmost gets presses)
  let lastEncounterStep = -10;

  // ------------------------------------------------------------ tiles
  const TILE = {
    '.': { tex: 'grass' }, ',': { tex: 'flowers' }, '"': { tex: 'tall', encounter: true }, 'x': { tex: 'grass_dark' },
    'T': { tex: 'grass', obj: 'tree', solid: true, tall: true }, 't': { tex: 'grass', obj: 'olive', solid: true },
    'Y': { tex: 'grass', obj: 'cypress', solid: true, tall: true }, 'b': { tex: 'grass', obj: 'bush', solid: true },
    'r': { tex: 'grass', obj: 'rock', solid: true }, '=': { tex: 'dirt' }, '*': { tex: 'sand' }, '~': { tex: 'water', solid: true },
    '-': { tex: 'grass', obj: 'fence_h', solid: true }, '|': { tex: 'grass', obj: 'fence_v', solid: true }, '_': { tex: 'dirt' },
    'w': { tex: 'wall_top', solid: true }, 'W': { tex: 'wall', solid: true },
    'R': { tex: 'roof', solid: true }, 'H': { tex: 'plaster', solid: true }, 'n': { tex: 'window', solid: true }, 'D': { tex: 'door' },
    's': { ground: true, obj: 'sign', solid: true, sign: true }, 'S': { tex: 'pave' }, 'P': { tex: 'pave_dark' },
    'G': { tex: 'wall', solid: true, gate: true },
    'h': { ground: true, obj: 'hay', solid: true }, 'o': { ground: true, obj: 'pot', solid: true }, 'l': { ground: true, obj: 'well', solid: true },
    '%': { ground: true, obj: 'stall_top', solid: true }, '&': { ground: true, obj: 'stall', solid: true },
    'C': { tex: 'pave', obj: 'crowd', encounter: true },
    'F': { tex: 'floor_wood' }, 'f': { tex: 'floor_stone' }, 'u': { tex: 'rug' },
    'k': { ground: true, obj: 'shelf', solid: true }, 'm': { ground: true, obj: 'table', solid: true }, 'e': { ground: true, obj: 'bed', solid: true },
    'B': { ground: true, obj: 'board', solid: true, board: true }, '#': { tex: 'void', solid: true },
  };
  const GROUND = { pasture: 'grass', city: 'pave', home: 'floor_wood', home2: 'floor_wood', pen_house: 'floor_stone', midrash: 'floor_stone' };
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
  function tileAt(x, y) { if (!map || x < 0 || y < 0 || x >= map.w || y >= map.h) return '#'; return map.rows[y][x]; }
  function tileInfo(x, y) { return TILE[tileAt(x, y)] || TILE['.']; }
  function gateAt(x, y) { // is (x,y) inside a gate block? returns anchor or null
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) if (tileAt(x - dx, y - dy) === 'G') return { ax: x - dx, ay: y - dy, dx, dy };
    return null;
  }
  function isSolid(x, y, who) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
    const gt = gateAt(x, y);
    if (gt) return !(gt.dx === 1 && gt.dy === 2);
    const ch = tileAt(x, y);
    // the row under a gate anchor's neighbours ('.' placeholders inside walls) are covered by the gate block above
    if (tileInfo(x, y).solid) return true;
    if (who !== player && player && player.tx === x && player.ty === y) return true;
    for (const n of npcs) if (n !== who && n.tx === x && n.ty === y) return true;
    for (const a of anims) if (a !== who && a.tx === x && a.ty === y) return true;
    return false;
  }

  // ------------------------------------------------------------ map loading
  function loadMap(id, x, y, dir) {
    map = window.Maps[id];
    S.map = id; S.x = x; S.y = y; S.dir = dir || 'down';
    player = { tx: x, ty: y, px: x * T, py: y * T, dir: S.dir, moving: false, prog: 0, frame: 0, kind: 'player' };
    npcs = map.npcs.filter(n => !(S.moved[n.id] === 'gone')).map(n => {
      const pos = S.moved[n.id] || {};
      return Object.assign({}, n, { tx: pos.x ?? n.x, ty: pos.y ?? n.y, px: (pos.x ?? n.x) * T, py: (pos.y ?? n.y) * T, dir: pos.dir || n.dir || 'down', moving: false, prog: 0, frame: 0, timer: Math.random() * 90, home: { x: n.x, y: n.y } });
    });
    anims = (map.animals || []).map(a => Object.assign({}, a, { tx: a.x, ty: a.y, px: a.x * T, py: a.y * T, dir: 'left', moving: false, prog: 0, timer: Math.random() * 120, home: { x: a.x, y: a.y } }));
    particles = []; emotes = [];
    clouds = map.outdoor ? [0, 1, 2].map(i => ({ x: Math.random() * map.w * T, y: Math.random() * map.h * T, r: 70 + Math.random() * 60, vx: .12 + Math.random() * .1, vy: .04 })) : [];
    snapCamera();
    A.play(map.music);
    updateHud();
  }

  // ------------------------------------------------------------ input
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right', KeyZ: 'a', Space: 'a', Enter: 'a', KeyX: 'b', Backspace: 'b', Escape: 'start', Tab: 'start', ShiftLeft: 'run', ShiftRight: 'run' };
  window.addEventListener('keydown', e => {
    const act = KEYMAP[e.code]; if (!act) return;
    e.preventDefault();
    A.resume();
    if (!keys[act]) press(act);
    keys[act] = true;
  });
  window.addEventListener('keyup', e => { const act = KEYMAP[e.code]; if (act) keys[act] = false; });
  function press(act) {
    const h = handlers[handlers.length - 1];
    if (h) h(act);
  }
  function pushHandler(fn) { handlers.push(fn); return () => { const i = handlers.lastIndexOf(fn); if (i >= 0) handlers.splice(i, 1); }; }
  function waitPress(accept = ['a']) { return new Promise(res => { const pop = pushHandler(act => { if (accept.includes(act)) { pop(); res(act); } }); }); }
  // touch
  for (const b of document.querySelectorAll('#touch button')) {
    const dir = b.dataset.dir, btn = b.dataset.btn;
    const down = e => { e.preventDefault(); A.resume(); const act = dir || btn; if (!keys[act]) press(act); keys[act] = true; };
    const up = e => { e.preventDefault(); keys[dir || btn] = false; };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
  }

  // ------------------------------------------------------------ scale
  function resize() {
    const touch = document.getElementById('touch');
    const th = getComputedStyle(touch).display !== 'none' ? touch.offsetHeight + 8 : 0;
    const iw = window.innerWidth, ih = window.innerHeight - th;
    SCALE = iw >= 1900 && ih >= 1000 ? 3 : iw >= 820 ? 2 : 1;
    VW = Math.max(16, Math.min(38, Math.floor(iw / (T * SCALE)))); VH = Math.max(12, Math.min(24, Math.floor(ih / (T * SCALE))));
    W = VW * T; H = VH * T;
    for (const c of [canvas, glowC, blurC]) { c.width = W; c.height = H; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lightC.width = W * SCALE * dpr; lightC.height = H * SCALE * dpr;
    g.imageSmoothingEnabled = false; glowG.imageSmoothingEnabled = false; blurG.imageSmoothingEnabled = false;
    gameEl.style.width = (W * SCALE) + 'px'; gameEl.style.height = (H * SCALE) + 'px';
    document.documentElement.style.setProperty('--s', SCALE);
    motes = Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random(), r: 1.5 + Math.random() * 2.5, p: Math.random() * 6.28, v: .00008 + Math.random() * .00012 }));
    if (player) snapCamera();
  }
  window.addEventListener('resize', resize); resize();

  // ------------------------------------------------------------ UI helpers
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function markup(s) { return esc(s).replace(/\{he:([^}]*)\}/g, '<span class="he">$1</span>'); }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function fadeOut(ms = 250) { fadeEl.classList.remove('flash'); fadeEl.classList.add('on'); return sleep(ms); }
  function fadeIn(ms = 250) { fadeEl.classList.remove('on'); return sleep(ms); }
  async function flash(times = 2) { for (let i = 0; i < times; i++) { fadeEl.classList.add('flash'); fadeEl.classList.add('on'); await sleep(70); fadeEl.classList.remove('on'); await sleep(70); } fadeEl.classList.remove('flash'); }

  let dlg = null;
  function pages(text) {
    // split into pages of ~230 characters at sentence boundaries
    const sentences = text.match(/[^.!?]+[.!?]+["']?\s*|[^.!?]+$/g) || [text];
    const out = []; let cur = '';
    for (const s of sentences) { if ((cur + s).length > 230 && cur) { out.push(cur.trim()); cur = s; } else cur += s; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  async function say(text, opts = {}) {
    if (!dlg) { dlg = el('div', 'panel'); dlg.id = 'dlg'; dlg.innerHTML = '<div class="name"></div><div class="text"></div><div class="arrow" style="display:none"></div>'; ui.appendChild(dlg); }
    const nameEl = dlg.querySelector('.name'), textEl = dlg.querySelector('.text'), arrow = dlg.querySelector('.arrow');
    nameEl.style.display = opts.name ? '' : 'none'; nameEl.textContent = opts.name || '';
    for (const page of pages(text)) {
      const html = markup(page);
      // typewriter: reveal progressively by character count of the plain text, while keeping markup intact
      const plain = page; let i = 0, done = false;
      textEl.innerHTML = ''; arrow.style.display = 'none';
      const popSkip = pushHandler(act => { if (act === 'a' || act === 'b') done = true; });
      while (i < plain.length && !done) {
        i += keys.a ? 4 : 2;
        textEl.innerHTML = markup(plain.slice(0, i));
        await sleep(16);
      }
      popSkip();
      textEl.innerHTML = html; arrow.style.display = '';
      if (opts.noWait) break;
      await sleep(60);
      await waitPress(['a', 'b']);
      A.sfx('blip');
    }
    if (!opts.keep) closeDlg();
  }
  function closeDlg() { if (dlg) { dlg.remove(); dlg = null; } }
  async function choice(options, opts = {}) {
    const box = el('div', 'panel'); box.id = 'choice';
    const menu = el('div', 'menu'); box.appendChild(menu);
    options.forEach((o, i) => menu.appendChild(el('div', 'item' + (i === 0 ? ' sel' : ''), markup(o))));
    ui.appendChild(box);
    let sel = 0;
    const items = [...menu.children];
    const render = () => items.forEach((it, i) => it.classList.toggle('sel', i === sel));
    items.forEach((it, i) => it.addEventListener('click', () => { sel = i; render(); press('a'); }));
    const res = await new Promise(resolve => {
      const pop = pushHandler(act => {
        if (act === 'up') { sel = (sel + options.length - 1) % options.length; render(); A.sfx('blip'); }
        else if (act === 'down') { sel = (sel + 1) % options.length; render(); A.sfx('blip'); }
        else if (act === 'a') { pop(); A.sfx('confirm'); resolve(sel); }
        else if ((act === 'b' || act === 'start') && opts.cancel !== false) { pop(); A.sfx('cancel'); resolve(opts.cancelIndex ?? options.length - 1); }
      });
    });
    box.remove();
    return res;
  }
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById('toast'); if (t) t.remove();
    t = el('div', 'panel', markup(msg)); t.id = 'toast'; ui.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2200);
  }
  async function board(html) {
    const b = el('div', 'panel', html); b.id = 'board'; ui.appendChild(b);
    await say('(Press A to close the board.)', { keep: true, noWait: true });
    await waitPress(['a', 'b', 'start']);
    closeDlg(); b.remove();
  }

  // ------------------------------------------------------------ HUD
  let hud = null;
  function updateHud() {
    if (!hud) { hud = el('div'); hud.id = 'hud'; ui.appendChild(hud); }
    hud.style.display = mode === 'title' ? 'none' : '';
    let h = '<div class="hearts">';
    for (let i = 0; i < S.maxHp; i++) h += `<img class="heart" src="${(i < S.hp ? SP.get('heart') : SP.get('heart_empty')).toDataURL()}">`;
    h += '</div>';
    for (const s of S.seals) h += `<img class="seal" src="${SP.get('seal:' + s).toDataURL()}" title="${C.SEALS[s].en}">`;
    h += `<span class="area">${map ? esc(map.name) : ''}</span>`;
    hud.innerHTML = h;
  }

  // ------------------------------------------------------------ progress helpers
  function addXp(n) { S.xp += n; }
  function damage(n = 1) { S.hp = Math.max(0, S.hp - n); updateHud(); }
  function heal() { S.hp = S.maxHp; updateHud(); }
  function markSeen(key) { if (!S.seen[key]) { S.seen[key] = true; } }
  function register(key) { markSeen(key); if (!S.reg[key]) { S.reg[key] = Date.now(); return true; } return false; }
  function regCount() { return C.ANIMAL_ORDER.filter(k => !C.ANIMALS[k].bonus && S.reg[k]).length; }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  function load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d) S = Object.assign(fresh(), d); } catch (e) { /* ignore */ } }

  // ------------------------------------------------------------ scripts
  async function runScript(fn) {
    if (busy) return; busy = true; mode = 'script';
    try { await fn(); } catch (e) { console.error(e); closeDlg(); }
    busy = false; mode = 'world'; updateHud();
  }
  async function teach(id, who) {
    const L = C.LESSONS[id];
    for (const line of L.lines) await say(line, { name: who || L.who, keep: true });
    closeDlg();
    if (!S.taught[id]) {
      S.taught[id] = true; S.journal.push(id); addXp(20);
      toast('✎ Journal: ' + L.title);
      A.sfx('save');
    }
    save();
  }
  async function warp(to) {
    A.sfx('door');
    await fadeOut();
    loadMap(to.map, to.x, to.y, to.dir);
    if (window.Maps[to.map].heal && S.hp < S.maxHp) { heal(); A.sfx('heal'); toast('You rest a moment. HP restored.'); }
    save();
    await fadeIn();
  }
  async function faint() {
    await say('Your head is spinning... You need to review before going on.');
    await fadeOut();
    loadMap('home', 5, 6, 'up');
    heal(); S.losses++; save();
    await fadeIn();
    A.sfx('heal');
    await say('Elazar: "Sit, trainee. Drink. Then go out again. Every mistake you make here is one you will not make at the gate."', { name: 'Elazar HaKohen' });
  }

  // ---- lesson boards (Beis Midrash)
  const BOARDS = {
    names: `<h3>Names and ages (Maaseh HaKorbanos 1:11, 1:14)</h3><table><tr><th></th><th>Cattle</th><th>Sheep</th><th>Goats</th></tr>
      <tr><th>♂ first year</th><td>egel <span class="he">עֵגֶל</span></td><td>keves <span class="he">כֶּבֶשׂ</span></td><td>gedi / se'ir izim <span class="he">גְּדִי</span></td></tr>
      <tr><th>♀ first year</th><td>eglah <span class="he">עֶגְלָה</span></td><td>kivsah <span class="he">כִּבְשָׂה</span></td><td>gediyah / se'irah <span class="he">גְּדִיָּה</span></td></tr>
      <tr><th>♂ grown</th><td>par (shor) <span class="he">פַּר</span></td><td>ayil <span class="he">אַיִל</span> from day 31 of yr 2<br><b>days 1–30 of yr 2: pilgas</b></td><td>sa'ir / tayish <span class="he">שָׂעִיר</span>, all of yr 2</td></tr>
      <tr><th>♀ grown</th><td>parah <span class="he">פָּרָה</span></td><td>rachel <span class="he">רָחֵל</span></td><td>ez <span class="he">עֵז</span></td></tr>
      <tr><th>Too old (zaken)</th><td>after 3 full years</td><td>after 2 full years</td><td>after 2 full years</td></tr></table>
      <p>Valid from day 8; lechatchilah from day 30 (not bechor, pesach, maaser). Hours count, through zerikah. Any mum: pasul.<br>Turtledove: fit only grown. Pigeon: fit only young. Start of tzihuv: both unfit. Birds: sex and ordinary blemishes do not matter; a missing limb, dried wing or blinded eye does.</p>`,
    kinds: `<h3>The four kinds (Maaseh HaKorbanos 1:8–1:11, 1:15)</h3><table><tr><th></th><th>Olah <span class="he">עוֹלָה</span></th><th>Chatas <span class="he">חַטָּאת</span></th><th>Asham <span class="he">אָשָׁם</span></th><th>Shelamim <span class="he">שְׁלָמִים</span></th></tr>
      <tr><th>Cattle</th><td class="y">♂ only</td><td class="n">not for an individual*</td><td class="n">no</td><td class="y">♂ or ♀</td></tr>
      <tr><th>Sheep</th><td class="y">♂ only</td><td class="y">♀ (kivsah)</td><td class="y">♂ only (ayil; keves for nazir, metzora)</td><td class="y">♂ or ♀</td></tr>
      <tr><th>Goats</th><td class="y">♂ only</td><td class="y">♀ (se'irah)</td><td class="n">no</td><td class="y">♂ or ♀</td></tr>
      <tr><th>Birds</th><td class="y">♂ or ♀</td><td class="y">in the cases the Torah names</td><td class="n">no</td><td class="n">no</td></tr></table>
      <p>*An individual's chatas is female and not cattle, except the nasi (male goat), the kohen mashiach (bull) and the kohen gadol on Yom Kippur (bull).</p>`,
    kedushah: `<h3>Kodshei kodashim and kodashim kalim (1:17, 5:2, 10:3–10:7)</h3><table><tr><th></th><th>Kodshei kodashim</th><th>Kodashim kalim</th></tr>
      <tr><th>Which</th><td>olah, chatas, asham, the two Shavuos lambs</td><td>an individual's shelamim (and todah), bechor, maaser, pesach</td></tr>
      <tr><th>Shechitah</th><td>north of the mizbeach only</td><td>anywhere in the Azarah</td></tr>
      <tr><th>Eaten by</th><td>male kohanim (olah: no one; hide to kohanim)</td><td>anyone tahor; kohanim get chazeh and shok of shelamim</td></tr>
      <tr><th>Where</th><td>in the Azarah</td><td>anywhere in Yerushalayim</td></tr>
      <tr><th>How long</th><td>that day and the night after</td><td>two days and a night (todah: a day and a night)</td></tr></table>
      <p>Eimurin (burned on the mizbeach from chatas, asham, shelamim): the fat on the innards, the two kidneys with their fat and the flank fat, the lobe of the liver; from a sheep also the alyah.</p>`,
  };

  // ---- NPC interaction
  async function talkTo(n) {
    const name = n.name;
    // face the player
    n.dir = player.dir === 'up' ? 'down' : player.dir === 'down' ? 'up' : player.dir === 'left' ? 'right' : 'left';
    if (n.role === 'mentor') return mentor(n);
    if (n.role === 'gatekeeper1') return gatekeeper1(n);
    if (n.role === 'gatekeeper2') return gatekeeper2(n);
    if (n.role === 'board') {
      await say('Welcome to the Beis Midrash. The boards hold what the teachers taught. Which would you like to see?', { name });
      const i = await choice(['Names and ages', 'The four kinds', 'Holiness, place, time', 'Nothing now']);
      if (i === 0) await board(BOARDS.names); else if (i === 1) await board(BOARDS.kinds); else if (i === 2) await board(BOARDS.kedushah);
      return;
    }
    if (n.trainer) {
      if (S.beaten[n.id]) return say(n.trainer.after, { name: n.trainer.name });
      return trainerBattle(n);
    }
    if (n.lesson) return teach(n.lesson, name);
    if (n.lessons) {
      const titles = n.lessons.map(id => C.LESSONS[id].title);
      await say('Shalom, trainee. What shall I teach you?', { name });
      const i = await choice([...titles, 'Nothing now']);
      if (i < titles.length) await teach(n.lessons[i], name);
      return;
    }
    if (n.say) { for (const line of n.say) await say(line, { name, keep: true }); closeDlg(); }
  }

  async function mentor(n) {
    const name = 'Elazar HaKohen';
    if (!S.flags.intro) {
      await say('So you are the new trainee. Good. Sit. Before you ever stand in the Azarah you must know the flock as a shepherd knows it.', { name, keep: true });
      await say('Take this: your Sefer HaKorbanos. Every animal you name correctly in the pastures is written into it. Open it any time with the menu (Esc).', { name, keep: true });
      closeDlg();
      await teach('five_species', name);
      await say('Now go out. The shepherds by the pens will teach you the names. Walk through the tall grass and name what you meet. When at least EIGHT names are written in your Sefer, Shimon the mevaker will test you at the Sheep Gate.', { name, keep: true });
      await say('And trainee: a wrong answer costs you a heart. Come back here and you will recover.', { name });
      S.flags.intro = true; save();
      return;
    }
    if (S.hp < S.maxHp) { heal(); A.sfx('heal'); await say('Rest. There. Your strength is back.', { name, keep: true }); }
    const rc = regCount();
    if (!S.seals.includes('egel')) {
      if (rc < 8) await say(`Your Sefer holds ${rc} of 14 names. Keep walking the pastures; the shepherds by the pens can teach you the rest.`, { name });
      else await say('Your Sefer is filling well. Go to Shimon at the Sheep Gate and show him what you know.', { name });
    } else if (!S.seals.includes('zachar')) {
      await say('You carry the Egel seal. In the city, Kohen Yishmael and Levi Asaf will teach you the four kinds of korban. Then the gate of the Azarah.', { name });
    } else {
      await say('Two seals! The rest of the road, who brings what, and the avodah itself, is still being paved. Review your Sefer; it will serve you.', { name });
    }
  }

  async function gatekeeper1(n) {
    const name = n.name;
    if (S.seals.includes('egel')) return say('The gate is open to you, trainee. Keep the seal close.', { name });
    const need = ['names_sheep', 'names_goats', 'names_cattle', 'birds'].filter(id => !S.taught[id]);
    const rc = regCount();
    if (need.length || rc < 8) {
      await say('Halt. Nothing passes this gate uninspected, and no trainee passes untested.', { name, keep: true });
      if (need.length) await say(`You have not yet heard ${need.map(id => C.LESSONS[id].who).join(', ')}. Go and listen first.`, { name, keep: true });
      if (rc < 8) await say(`Your Sefer holds ${rc} names. Bring me at least eight. The tall grass is full of animals; name them.`, { name, keep: true });
      closeDlg();
      return;
    }
    await say('So. Elazar\'s trainee. Eight names and more in the Sefer, the shepherds all heard. Then let us see if you can inspect as I inspect.', { name, keep: true });
    await say('Seven animals and questions. Fail and you go back to the pastures.', { name });
    const qs = [...R.curatedSet(1, 5)];
    const res = await window.Battle.run({ type: 'gate', arena: 'gate', name: 'MEVAKER SHIMON', kind: 'gadol', questions: qs, generated: 2, level: 1, intro: 'Mevaker Shimon wants to see your inspection!' });
    if (res.won) {
      S.seals.push('egel'); S.wins++; addXp(100); S.moved[n.id] = { x: 17, y: 4, dir: 'right' }; n.tx = 17; n.px = 17 * T; n.dir = 'right';
      A.sfx('fanfare'); updateHud();
      await say('Well inspected! You have the eye. Take this.', { name, keep: true });
      await say('✦ You received the EGEL SEAL {he:עֵגֶל}!', { keep: true });
      closeDlg();
      await teach('seals', name);
      await say('The gate is open. Beyond it, Yerushalayim. Find Kohen Yishmael in the market; he will teach you what the animals are FOR.', { name });
      heal(); save();
    } else {
      await say('Not yet. Walk the pastures again, listen to the shepherds, and come back.', { name });
      if (S.hp <= 0) await faint(); else save();
    }
  }
  async function gatekeeper2(n) {
    const name = n.name;
    if (S.seals.includes('zachar')) return say('The Zachar seal! Well earned. The next gate is still being built; return when it opens.', { name });
    const need = ['four_kinds', 'olah_rules', 'chatat_rules', 'asham_rules', 'shelamim_rules', 'kedushah'].filter(id => !S.taught[id]);
    if (need.length) {
      await say('The Azarah gate. Before I let you argue with a kohen about an animal, I want you to know the four kinds.', { name, keep: true });
      await say(`Still missing: ${need.map(id => C.LESSONS[id].title).join('; ')}. Ask around the market and the Beis Midrash.`, { name });
      return;
    }
    await say('You have been thorough. Then answer as a kohen on duty must: quickly and correctly. Eight questions.', { name });
    const qs = R.curatedSet(2, 6);
    const res = await window.Battle.run({ type: 'gate', arena: 'gate', name: 'KOHEN GAMLIEL', kind: 'gadol', questions: qs, generated: 2, level: 2, intro: 'Kohen Gamliel tests you at the gate of the Azarah!' });
    if (res.won) {
      S.seals.push('zachar'); S.wins++; addXp(150); A.sfx('fanfare'); updateHud();
      await say('Olah, chatas, asham, shelamim: you know them. Take the second seal.', { name, keep: true });
      await say('✦ You received the ZACHAR SEAL {he:זָכָר}!', { keep: true });
      await say('That is the end of this chapter of Kodshim Quest. Levels 3, 4 and 5 (who brings what; the avodah of olah, chatas and asham; the communal offerings) are coming. Your Sefer and seals are saved.', { name });
      heal(); save();
    } else {
      await say('Go to the Beis Midrash, read the boards, and return.', { name });
      if (S.hp <= 0) await faint(); else save();
    }
  }
  async function trainerBattle(n) {
    const tr = n.trainer;
    await say(tr.intro, { name: tr.name });
    const qs = tr.questions.map(id => R.byId(id));
    const res = await window.Battle.run({ type: 'trainer', arena: map.id === 'city' ? 'city' : 'pasture', name: tr.name.toUpperCase(), kind: n.kind, questions: qs, level: map.encounters === 'l2' ? 2 : 1, intro: `${tr.name} challenges you!` });
    if (res.won) { S.beaten[n.id] = true; S.wins++; addXp(40); await say(tr.lose, { name: tr.name }); save(); }
    else { await say('Come back when you have learned more.', { name: tr.name }); if (S.hp <= 0) await faint(); else save(); }
  }
  async function wildEncounter() {
    S.encounters++; lastEncounterStep = S.steps;
    A.sfx('encounter');
    await flash(2);
    if (map.encounters === 'l1') {
      const animal = R.randomAnimal();
      const res = await window.Battle.run({ type: 'wild', arena: 'pasture', animal, level: 1 });
      if (res.registered) { /* toast shown in battle */ }
    } else {
      const res = await window.Battle.run({ type: 'wild2', arena: 'city', level: 2 });
    }
    if (S.hp <= 0) await faint(); else save();
  }

  // ------------------------------------------------------------ interaction
  function facing() { const d = DIRS[player.dir]; return { x: player.tx + d.x, y: player.ty + d.y }; }
  const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  function interact() {
    const f = facing();
    const n = npcs.find(n => n.tx === f.x && n.ty === f.y);
    if (n) return runScript(() => talkTo(n));
    const an = anims.find(a => a.tx === f.x && a.ty === f.y);
    if (an) return runScript(() => say(an.kind === 'bird' ? 'The bird tilts its head at you.' : an.kind === 'sheep' ? 'Baa. It chews, unbothered. (Name the ones in the tall grass; these belong to the shepherds.)' : an.kind === 'goat' ? 'Meh-eh-eh. It tries to eat your sleeve.' : 'Moo. It is enormous up close.'));
    const key = `${f.x},${f.y}`;
    if (map.signs && map.signs[key]) return runScript(() => say(map.signs[key]));
    const ch = tileAt(f.x, f.y);
    if (ch === 'B') return runScript(async () => { const i = await choice(['Names and ages', 'The four kinds', 'Holiness, place, time', 'Close']); if (i === 0) await board(BOARDS.names); else if (i === 1) await board(BOARDS.kinds); else if (i === 2) await board(BOARDS.kedushah); });
    if (ch === 'k') return runScript(() => say('Scrolls of Vayikra and the Mishnah, well thumbed.'));
    if (ch === 'e') return runScript(() => say('A bed. You could rest here. (HP restores when you enter a house.)'));
    if (ch === 'm') return runScript(() => say('A table with a map of the Azarah scratched on it. "North" is marked with an arrow.'));
    if (ch === 'l') return runScript(() => say('A well. The water is cold and sweet.'));
    if (ch === '&' || ch === '%') return runScript(() => say(map.id === 'city' ? 'A stall selling animals for korbanos. "Fit for olah!" the merchant calls. "Check it yourself," says the sign.' : 'Chanah\'s bird stall: turtledoves in one cage, young pigeons in another. "Look at the neck feathers," reads the sign.'));
    if (ch === 'h') return runScript(() => say('Hay. Something is chewing on the other side of it.'));
  }

  // ------------------------------------------------------------ movement
  function tryMove(ent, dir) {
    ent.dir = dir;
    const d = DIRS[dir], nx = ent.tx + d.x, ny = ent.ty + d.y;
    if (isSolid(nx, ny, ent)) return false;
    ent.moving = true; ent.prog = 0; ent.from = { x: ent.tx, y: ent.ty }; ent.tx = nx; ent.ty = ny;
    return true;
  }
  function stepEntity(ent, speed) {
    if (!ent.moving) return false;
    ent.prog += speed;
    const d = DIRS[ent.dir];
    if (ent.prog >= T) { ent.prog = T; ent.moving = false; ent.px = ent.tx * T; ent.py = ent.ty * T; ent.frame = (ent.frame + 1) % 2; return true; }
    ent.px = ent.from.x * T + d.x * ent.prog; ent.py = ent.from.y * T + d.y * ent.prog;
    return false;
  }
  function onPlayerArrived() {
    S.steps++; S.x = player.tx; S.y = player.ty; S.dir = player.dir;
    const ch = tileAt(player.tx, player.ty);
    const key = `${player.tx},${player.ty}`;
    if (ch === '"' || ch === 'C') { A.sfx('rustle'); spawnRustle(player.px + 8, player.py + 14); }
    else if (ch === '=' || ch === '*') spawnDust(player.px + 8, player.py + 15);
    // warps
    const wp = map.warps && map.warps[key];
    if (wp) {
      if (wp.requires && !S.seals.includes(wp.requires.replace('seal_', ''))) {
        runScript(async () => { await say(wp.locked); const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.dir]; tryMove(player, back); });
        return;
      }
      if (wp.done) { runScript(async () => { await say(wp.done); const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.dir]; tryMove(player, back); }); return; }
      runScript(() => warp(wp));
      return;
    }
    // trainers' line of sight
    for (const n of npcs) {
      if (!n.trainer || S.beaten[n.id]) continue;
      if (inSight(n)) { runScript(() => trainerApproach(n)); return; }
    }
    // encounters
    if (TILE[ch] && TILE[ch].encounter && map.encounters && S.steps - lastEncounterStep > 3 && Math.random() < 0.16) {
      runScript(wildEncounter);
    }
  }
  function inSight(n) {
    const d = DIRS[n.dir]; const sight = n.trainer.sight || 4;
    for (let i = 1; i <= sight; i++) {
      const x = n.tx + d.x * i, y = n.ty + d.y * i;
      if (player.tx === x && player.ty === y) return true;
      if (tileInfo(x, y).solid) return false;
    }
    return false;
  }
  async function trainerApproach(n) {
    A.sfx('exclaim');
    emotes.push({ ent: n, text: '!', t: 50 });
    await sleep(700);
    // walk toward the player until adjacent
    const d = DIRS[n.dir];
    for (let guard = 0; guard < 10; guard++) {
      const nx = n.tx + d.x, ny = n.ty + d.y;
      if (nx === player.tx && ny === player.ty) break;
      if (!tryMove(n, n.dir)) break;
      while (n.moving) await sleep(16);
    }
    player.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[n.dir];
    await trainerBattle(n);
  }

  // ------------------------------------------------------------ particles
  function spawnDust(x, y) { for (let i = 0; i < 3; i++) particles.push({ x: x + (Math.random() - .5) * 6, y, vx: (Math.random() - .5) * .4, vy: -.2 - Math.random() * .3, t: 18, col: 'rgba(200,170,120,.8)' }); }
  function spawnRustle(x, y) { for (let i = 0; i < 5; i++) particles.push({ x: x + (Math.random() - .5) * 10, y: y - Math.random() * 6, vx: (Math.random() - .5) * .8, vy: -.4 - Math.random() * .5, t: 22, col: 'rgba(120,200,90,.9)' }); }

  // ------------------------------------------------------------ update
  function update() {
    tick++;
    if (!map || !player) return;
    if (mode === 'world' && !busy) {
      if (!player.moving) {
        const dir = keys.up ? 'up' : keys.down ? 'down' : keys.left ? 'left' : keys.right ? 'right' : null;
        if (dir) { if (!tryMove(player, dir)) player.dir = dir; }
      }
    }
    if (player) {
      const speed = (keys.run || keys.b) ? 3 : 2;
      if (stepEntity(player, speed)) onPlayerArrived();
    }
    // npcs
    for (const n of npcs) {
      if (n.moving) { stepEntity(n, 1); continue; }
      if (!n.wander || busy) continue;
      if (--n.timer > 0) continue;
      n.timer = 60 + Math.random() * 120;
      const dirs = ['up', 'down', 'left', 'right'];
      const dir = dirs[Math.floor(Math.random() * 4)];
      const d = DIRS[dir], nx = n.tx + d.x, ny = n.ty + d.y;
      if (Math.abs(nx - n.home.x) <= n.wander && Math.abs(ny - n.home.y) <= n.wander && !TILE[tileAt(nx, ny)].encounter && tileAt(nx, ny) !== 'D') tryMove(n, dir); else n.dir = dir;
    }
    for (const a of anims) {
      if (a.moving) { stepEntity(a, .6); continue; }
      if (busy || !a.r) continue;
      if (--a.timer > 0) continue;
      a.timer = 90 + Math.random() * 200;
      const dirs = ['up', 'down', 'left', 'right'];
      const dir = dirs[Math.floor(Math.random() * 4)];
      const d = DIRS[dir], nx = a.tx + d.x, ny = a.ty + d.y;
      if (Math.abs(nx - a.home.x) <= a.r && Math.abs(ny - a.home.y) <= a.r && !isSolid(nx, ny, a) && !TILE[tileAt(nx, ny)].encounter) { tryMove(a, dir); if (dir === 'left' || dir === 'right') a.face = dir; }
    }
    // camera
    const cx = player.px + 8 - W / 2, cy = player.py + 8 - H / 2;
    cam.x += (cx - cam.x) * .18; cam.y += (cy - cam.y) * .18;
    clampCamera();
    // particles
    particles = particles.filter(p => --p.t > 0); for (const p of particles) { p.x += p.vx; p.y += p.vy; }
    emotes = emotes.filter(e => --e.t > 0);
    for (const c of clouds) { c.x += c.vx; c.y += c.vy; if (c.x - c.r > map.w * T) c.x = -c.r; if (c.y - c.r > map.h * T) c.y = -c.r; }
  }
  function clampCamera() {
    const mw = map.w * T, mh = map.h * T;
    cam.x = Math.max(0, Math.min(mw - W, cam.x)); cam.y = Math.max(0, Math.min(mh - H, cam.y));
    if (mw < W) cam.x = (mw - W) / 2; if (mh < H) cam.y = (mh - H) / 2;
  }
  function snapCamera() { cam.x = player.px + 8 - W / 2; cam.y = player.py + 8 - H / 2; clampCamera(); }

  // ------------------------------------------------------------ render
  function texFor(ch, x, y) {
    const info = TILE[ch] || TILE['.'];
    let tex = info.ground ? GROUND[map.id] || 'grass' : info.tex;
    if (tex === 'void') return null;
    const t = TL[tex];
    if (Array.isArray(t)) {
      const h = hash(x, y);
      const v = t[h % t.length];
      if (Array.isArray(v)) return v[Math.floor(tick / 28 + (h % 3)) % v.length];
      if (tex === 'water') return t[Math.floor(tick / 16) % t.length];
      return v;
    }
    return t;
  }
  const softCache = {};
  function softShadow(w, h, a = .4) {
    const key = w + 'x' + h + 'x' + a;
    if (softCache[key]) return softCache[key];
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
    const cg = c.getContext('2d');
    const gr = cg.createRadialGradient(w, h, 0, w, h, w);
    gr.addColorStop(0, `rgba(10,8,20,${a})`); gr.addColorStop(.55, `rgba(10,8,20,${a * .45})`); gr.addColorStop(1, 'rgba(10,8,20,0)');
    cg.fillStyle = gr; cg.save(); cg.translate(w, h); cg.scale(1, h / w); cg.beginPath(); cg.arc(0, 0, w, 0, Math.PI * 2); cg.fill(); cg.restore();
    return (softCache[key] = c);
  }
  function drawShadow(x, y, w = 14, h = 6, a = .45) {
    const c = softShadow(w, h, a);
    g.drawImage(c, Math.round(x - w), Math.round(y - h));
  }
  let aoStrip = null, aoSide = null;
  function aoStrips() {
    if (aoStrip) return;
    aoStrip = document.createElement('canvas'); aoStrip.width = T; aoStrip.height = 10;
    let cg = aoStrip.getContext('2d'); let gr = cg.createLinearGradient(0, 0, 0, 10);
    gr.addColorStop(0, 'rgba(10,8,20,.42)'); gr.addColorStop(1, 'rgba(10,8,20,0)'); cg.fillStyle = gr; cg.fillRect(0, 0, T, 10);
    aoSide = document.createElement('canvas'); aoSide.width = 6; aoSide.height = T;
    cg = aoSide.getContext('2d'); gr = cg.createLinearGradient(0, 0, 6, 0);
    gr.addColorStop(0, 'rgba(10,8,20,.28)'); gr.addColorStop(1, 'rgba(10,8,20,0)'); cg.fillStyle = gr; cg.fillRect(0, 0, 6, T);
  }
  const WALLISH = new Set(['W', 'w', 'R', 'H', 'n', 'k', 'e', 'm', 'B', '%', '&']);
  function ambientOcclusion(x0, y0, x1, y1, ox, oy) {
    aoStrips();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ch = tileAt(x, y);
      const below = tileAt(x, y + 1);
      const gt = gateAt(x, y);
      const wall = WALLISH.has(ch) || (gt && !(gt.dx === 1 && gt.dy === 2));
      if (wall && !WALLISH.has(below) && !gateAt(x, y + 1) && below !== '#') g.drawImage(aoStrip, x * T - ox, (y + 1) * T - oy);
      if (wall) { const right = tileAt(x + 1, y); if (!WALLISH.has(right) && !gateAt(x + 1, y) && right !== '#') g.drawImage(aoSide, (x + 1) * T - ox, y * T - oy); }
      const info = TILE[ch];
      if (info && info.obj && info.obj !== 'crowd' && !WALLISH.has(ch)) {
        const big = info.tall || info.obj === 'tree' || info.obj === 'olive';
        drawShadow(x * T + 8 - ox, y * T + 14 - oy, big ? 14 : 10, big ? 6 : 4, big ? .5 : .35);
      }
      if (ch === '~') { // water: soft shimmer line
        if (((x * 7 + y * 13 + (tick >> 4)) % 9) === 0) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x * T + 3 - ox, y * T + ((tick >> 2) + x * 5) % 16 - oy, 7, 1); }
      }
    }
  }
  function personSprite(ent) {
    const view = ent.dir === 'left' || ent.dir === 'right' ? 'side' : ent.dir;
    const frame = ent.moving ? (Math.floor(ent.prog / 8) % 2 === 0 ? 'step' : 'stand') : 'stand';
    const mirror = ent.dir === 'right';
    let c = SP.person(ent.kind, view, frame, mirror);
    if (frame === 'step' && (view === 'down' || view === 'up') && ent.frame % 2 === 1) c = SP.person(ent.kind, view, frame, !mirror);
    return c;
  }
  function render() {
    g.fillStyle = '#0b0c12'; g.fillRect(0, 0, W, H);
    if (!map) return;
    const ox = Math.round(cam.x), oy = Math.round(cam.y);
    const x0 = Math.max(0, Math.floor(ox / T)), y0 = Math.max(0, Math.floor(oy / T));
    const x1 = Math.min(map.w - 1, Math.ceil((ox + W) / T)), y1 = Math.min(map.h - 1, Math.ceil((oy + H) / T));
    // base
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ch = tileAt(x, y);
      const tex = texFor(ch, x, y);
      if (tex) g.drawImage(tex, x * T - ox, y * T - oy);
    }
    ambientOcclusion(x0, y0, x1, y1, ox, oy);
    // drawables
    const items = [];
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0; x <= x1; x++) {
      const ch = tileAt(x, y); const info = TILE[ch];
      if (!info) continue;
      if (info.obj) {
        let img = TL[info.obj];
        if (info.obj === 'crowd') { const h = hash(x, y); img = TL.crowd[h % TL.crowd.length][Math.floor(tick / 24 + (h % 2)) % 2]; }
        else if (Array.isArray(img)) img = img[Math.floor(tick / 30) % img.length];
        items.push({ y: y * T + (info.tall ? 8 : 0), draw: () => g.drawImage(img, x * T - ox, y * T + T - img.height - oy) });
      }
      if (ch === 'G') { const img = TL.gate; items.push({ y: (y + 2) * T + 1, draw: () => g.drawImage(img, x * T - ox, y * T - oy) }); }
    }
    for (const a of anims) {
      const sm = SP.get('small:' + a.kind + ':' + (a.face === 'right' ? 'r' : 'l'));
      items.push({ y: a.py + 16, draw: () => { drawShadow(a.px - ox + 8, a.py - oy + 15, 11, 5, .4); g.drawImage(sm, a.px - ox, a.py - oy + (a.moving && Math.floor(a.prog / 4) % 2 ? -1 : 0)); } });
    }
    for (const n of npcs) items.push({ y: n.py + 16, draw: () => { drawShadow(n.px - ox + 8, n.py - oy + 15, 12, 5, .45); g.drawImage(personSprite(n), n.px - ox, n.py - oy - 4); } });
    items.push({ y: player.py + 16, draw: () => { drawShadow(player.px - ox + 8, player.py - oy + 15, 12, 5, .45); g.drawImage(personSprite(player), player.px - ox, player.py - oy - 4); } });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
    // particles
    for (const p of particles) { g.fillStyle = p.col; g.fillRect(Math.round(p.x - ox), Math.round(p.y - oy), 1, 1); }
    // emotes
    for (const e of emotes) {
      const x = e.ent.px - ox + 8, y = e.ent.py - oy - 10;
      g.fillStyle = '#fff'; g.fillRect(x - 5, y - 8, 10, 10); g.fillStyle = '#2b2230'; g.fillRect(x - 5, y - 8, 10, 1); g.fillRect(x - 5, y + 1, 10, 1); g.fillRect(x - 5, y - 8, 1, 10); g.fillRect(x + 4, y - 8, 1, 10);
      g.fillStyle = '#d94848'; g.fillRect(x - 1, y - 6, 2, 5); g.fillRect(x - 1, y, 2, 1);
    }
    // ambient
    if (map.outdoor) {
      for (const c of clouds) {
        const gr = g.createRadialGradient(c.x - ox, c.y - oy, 0, c.x - ox, c.y - oy, c.r);
        gr.addColorStop(0, 'rgba(20,30,60,.16)'); gr.addColorStop(1, 'rgba(20,30,60,0)');
        g.fillStyle = gr; g.fillRect(c.x - c.r - ox, c.y - c.r - oy, c.r * 2, c.r * 2);
      }
      const warm = g.createLinearGradient(0, 0, 0, H);
      warm.addColorStop(0, 'rgba(255,200,120,.08)'); warm.addColorStop(1, 'rgba(60,40,90,.10)');
      g.fillStyle = warm; g.fillRect(0, 0, W, H);
    }
    // bloom + tilt-shift copies
    glowG.clearRect(0, 0, W, H); glowG.drawImage(canvas, 0, 0);
    blurG.drawImage(canvas, 0, 0);
    renderLight();
  }
  function renderLight() {
    const lw = lightC.width, lh = lightC.height;
    lightG.clearRect(0, 0, lw, lh);
    if (map.outdoor) {
      // sun
      const sun = lightG.createRadialGradient(lw * .82, -lh * .1, 0, lw * .82, -lh * .1, lw * .7);
      sun.addColorStop(0, 'rgba(255,236,190,.26)'); sun.addColorStop(.5, 'rgba(255,220,160,.07)'); sun.addColorStop(1, 'rgba(255,220,160,0)');
      lightG.fillStyle = sun; lightG.fillRect(0, 0, lw, lh);
      // motes
      lightG.fillStyle = 'rgba(255,245,210,.55)';
      for (const m of motes) {
        m.x += Math.sin(tick * .01 + m.p) * .00025 + m.v * .4; m.y -= m.v; if (m.y < -.05) { m.y = 1.05; m.x = Math.random(); } if (m.x > 1.05) m.x = -.05;
        const a = .18 + .22 * (0.5 + 0.5 * Math.sin(tick * .03 + m.p));
        lightG.globalAlpha = a; lightG.beginPath(); lightG.arc(m.x * lw, m.y * lh, m.r * (lw / 1100), 0, Math.PI * 2); lightG.fill();
      }
      lightG.globalAlpha = 1;
    } else {
      const cg = lightG.createRadialGradient(lw / 2, lh * .45, 0, lw / 2, lh * .45, lw * .45);
      cg.addColorStop(0, 'rgba(255,214,150,.16)'); cg.addColorStop(1, 'rgba(255,214,150,0)');
      lightG.fillStyle = cg; lightG.fillRect(0, 0, lw, lh);
    }
    const vg = lightG.createRadialGradient(lw / 2, lh / 2, lh * .35, lw / 2, lh / 2, lw * .75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, map.outdoor ? 'rgba(5,5,15,.42)' : 'rgba(5,5,15,.7)');
    lightG.fillStyle = vg; lightG.fillRect(0, 0, lw, lh);
  }

  function loop() { update(); render(); requestAnimationFrame(loop); }

  // ------------------------------------------------------------ start menu
  async function startMenu() {
    const box = el('div', 'panel'); box.id = 'startmenu';
    const items = [['SEFER', 'animals, korbanos, seals, journal'], ['SAVE', 'write progress'], [A.enabled ? 'MUSIC: ON' : 'MUSIC: OFF', 'toggle music'], ['HOW TO PLAY', 'controls and goals'], ['CLOSE', '']];
    const menu = el('div', 'menu'); box.appendChild(menu);
    items.forEach(([t, d], i) => menu.appendChild(el('div', 'item' + (i === 0 ? ' sel' : ''), `${t}<small>${d}</small>`)));
    ui.appendChild(box);
    let sel = 0; const its = [...menu.children];
    const render = () => its.forEach((it, i) => it.classList.toggle('sel', i === sel));
    its.forEach((it, i) => it.addEventListener('click', () => { sel = i; render(); press('a'); }));
    const i = await new Promise(resolve => {
      const pop = pushHandler(act => {
        if (act === 'up') { sel = (sel + 4) % 5; render(); A.sfx('blip'); }
        else if (act === 'down') { sel = (sel + 1) % 5; render(); A.sfx('blip'); }
        else if (act === 'a') { pop(); A.sfx('confirm'); resolve(sel); }
        else if (act === 'b' || act === 'start') { pop(); A.sfx('cancel'); resolve(4); }
      });
    });
    box.remove();
    if (i === 0) await window.Sefer.open();
    else if (i === 1) { save(); A.sfx('save'); toast('Progress saved.'); }
    else if (i === 2) { S.music = !A.enabled; A.setEnabled(S.music); save(); }
    else if (i === 3) await say('ARROWS / WASD move. Z, SPACE or ENTER: talk, confirm (A). X: cancel (B); hold to run. ESC: this menu. Name the animals in the tall grass to fill your Sefer; hear the teachers; then face the kohen at the gate. Wrong answers cost hearts; houses restore them.');
  }

  // world-mode handler
  pushHandler(act => {
    if (mode !== 'world' || busy) return;
    if (act === 'a' && !player.moving) interact();
    else if (act === 'start') runScript(startMenu);
  });

  // ------------------------------------------------------------ title
  async function title() {
    mode = 'title';
    const t = el('div'); t.id = 'title';
    const art = document.createElement('canvas'); art.width = W; art.height = 96; art.style.width = (W * SCALE) + 'px'; art.style.height = (96 * SCALE) + 'px';
    const ag = art.getContext('2d'); ag.imageSmoothingEnabled = false;
    // a little diorama: grass, a pen, animals, the player
    const cx = Math.floor(W / 2);
    for (let y = 0; y < 6; y++) for (let x = 0; x < VW; x++) ag.drawImage(y < 2 ? TL.grass[hash(x, y) % 4] : (y === 2 ? TL.tall[hash(x, y) % 3][0] : TL.grass[(x + y) % 4]), x * T, y * T);
    for (let x = 0; x < VW; x += 3) ag.drawImage(TL.tree, x * T + (x % 2) * 6, (x % 3) * 3 - 6);
    ag.drawImage(TL.olive, cx - 100, 58); ag.drawImage(TL.bush, cx + 120, 70);
    const sh = (x, y, w, h) => { const c = softShadow(w, h, .4); ag.drawImage(c, x - w, y - h); };
    const place = (name, x, y) => { sh(x + 8, y + 15, 10, 4); ag.drawImage(SP.get(name), x, y); };
    place('small:sheep:l', cx - 130, 56); place('small:sheep:r', cx - 104, 62); place('small:goat:l', cx + 100, 58); place('small:cattle:r', cx + 52, 50); place('small:bird:l', cx - 60, 40);
    sh(cx + 2, 71, 12, 5); ag.drawImage(SP.person('player', 'down', 'stand'), cx - 6, 52); sh(cx - 22, 67, 12, 5); ag.drawImage(SP.person('kohen', 'side', 'stand', true), cx - 30, 48);
    t.innerHTML = `<div class="logo"><span class="he">מַסַּע קָדָשִׁים</span>KODSHIM QUEST</div><div class="tag">Name the flock. Pass the gates. Fill the Sefer.</div>`;
    t.appendChild(art);
    const menu = el('div', 'menu');
    const opts = hasSave() ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
    opts.forEach((o, i) => menu.appendChild(el('div', 'item' + (i === 0 ? ' sel' : ''), o)));
    t.appendChild(menu);
    t.appendChild(el('div', 'foot', 'Content: Rambam, Hilchos Maaseh HaKorbanos ch. 1, 5, 10 · Vayikra · Mishnah Chullin 1:5, Shekalim 5:3'));
    ui.appendChild(t); updateHud();
    let sel = 0; const its = [...menu.children];
    const render = () => its.forEach((it, i) => it.classList.toggle('sel', i === sel));
    its.forEach((it, i) => it.addEventListener('click', () => { sel = i; render(); press('a'); }));
    const i = await new Promise(resolve => {
      const pop = pushHandler(act => {
        A.ensure();
        if (act === 'up' || act === 'down') { sel = (sel + 1) % opts.length; render(); A.sfx('blip'); }
        else if (act === 'a') { pop(); A.sfx('confirm'); resolve(sel); }
      });
    });
    let newGame = opts[i] === 'NEW GAME';
    if (newGame && hasSave()) {
      const c = await choice(['Keep my save', 'Erase and start over'], { cancel: true, cancelIndex: 0 });
      if (c === 0) newGame = false;
    }
    await fadeOut();
    t.remove();
    if (newGame) { S = fresh(); save(); } else load();
    A.setEnabled(S.music);
    loadMap(S.map, S.x, S.y, S.dir);
    mode = 'world';
    await fadeIn();
    if (!S.flags.intro) {
      const n = npcs.find(n => n.role === 'mentor');
      if (n) runScript(() => mentor(n));
    }
  }

  function boot() {
    if (SP.problems.length) console.warn('sprite problems', SP.problems);
    loop();
    title();
  }

  return {
    boot, get S() { return S; }, get map() { return map; }, say, choice, toast, board, sleep, fadeOut, fadeIn, flash, pushHandler, waitPress, press,
    addXp, damage, heal, markSeen, register, regCount, save, updateHud, markup, esc, el, teach, T,
    debug: { encounter: () => runScript(wildEncounter), warpTo: (m, x, y, d) => runScript(() => warp({ map: m, x, y, dir: d })), get busy() { return busy; } },
  };
})();
