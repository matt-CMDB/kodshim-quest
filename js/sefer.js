/* Kodshim Quest — the Sefer HaKorbanos: an open logbook.
   Left page: the index of the current chapter. Right page: the entry. */
window.Sefer = (function () {
  const C = window.Content, SP = window.Sprites, A = window.Audio2;
  const G = () => window.Game;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const TABS = ['ANIMALS', 'KORBANOS', 'SEALS', 'JOURNAL'];
  const pad = n => String(n).padStart(2, '0');
  function cite(src) { return src.startsWith('MK ') ? 'Rambam, Maaseh HaKorbanos ' + src.slice(3) : src.startsWith('Issurei') ? 'Rambam, ' + src : (src.startsWith('Chullin') || src.startsWith('Shekalim')) ? 'Mishnah ' + src : src; }
  function quotes(srcs) { return srcs.map(s => { const q = C.SOURCES[s]; return q ? `<div class="quote"><span class="he">${q.he}</span><span class="cite">${cite(s)} &middot; ${G().esc(q.en)}</span></div>` : ''; }).join(''); }
  function sprite(name, size = 48, silhouette = false) {
    const c = document.createElement('canvas'); c.width = size; c.height = size; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const s = SP.get(name); const k = Math.floor(size / Math.max(s.width, s.height));
    g.drawImage(s, Math.floor((size - s.width * k) / 2), size - s.height * k - 2, s.width * k, s.height * k);
    if (silhouette) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#8a7a5a'; g.fillRect(0, 0, size, size); }
    return c;
  }

  // Parchment: generated once, used as a background image for pages and boards.
  let parchmentURL = null;
  function parchment() {
    if (parchmentURL) return parchmentURL;
    const w = 512, h = 512, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#efe3c3'; g.fillRect(0, 0, w, h);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    let seed = 7;
    const r = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >> 17; seed ^= seed << 5; seed >>>= 0; return (seed % 1000) / 1000; };
    for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 22; d[i] += n; d[i + 1] += n * .9; d[i + 2] += n * .6; }
    g.putImageData(img, 0, 0);
    // soft stains
    for (let i = 0; i < 14; i++) {
      const x = r() * w, y = r() * h, rad = 40 + r() * 120;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(120,80,30,${.05 + r() * .06})`); gr.addColorStop(1, 'rgba(120,80,30,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // fibres
    g.strokeStyle = 'rgba(90,60,20,.06)'; g.lineWidth = 1;
    for (let i = 0; i < 160; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 40, y + (r() - .5) * 6); g.stroke(); }
    return (parchmentURL = c.toDataURL());
  }

  async function open() {
    const Game = G(); const S = Game.S;
    const root = el('div'); root.id = 'sefer';
    document.getElementById('ui').appendChild(root);
    let tab = 0, sel = 0;
    const regN = C.ANIMAL_ORDER.filter(k => !C.ANIMALS[k].bonus && S.reg[k]).length;
    const paper = `background-image: url(${parchment()}); background-size: 512px 512px;`;

    function entriesFor(t) {
      if (t === 0) return C.ANIMAL_ORDER.map((k, i) => {
        const a = C.ANIMALS[k]; const seen = S.seen[k], reg = S.reg[k];
        return { num: a.bonus ? '✦' : pad(i + 1), label: reg ? `<span class="nm">${a.tr}</span><span class="he">${a.he}</span>` : seen ? `<span class="nm">${a.tr}</span>` : '<span class="nm">? ? ?</span>', cls: reg ? '' : 'unknown',
          detail: () => {
            if (!seen && !reg) return { html: `<div class="head"><div class="plate"><div class="pic unknown">?</div></div><div><h2><span class="he">?</span>Unknown</h2><div class="sub">Walk the tall grass of the pastures to meet it.</div></div></div>` };
            const pic = sprite(a.sprite, 128, !reg); pic.className = 'pic';
            const head = `<div class="head"><div class="plate"><span class="picwrap"></span>${reg ? '<div class="stamp">Registered</div>' : ''}</div><div><h2><span class="he">${a.he}</span>${a.tr}</h2><div class="sub">${a.en}${a.alt ? ' · also ' + a.alt : ''}${a.sex ? ' · ' + (a.sex === 'm' ? '♂' : '♀') : ''}</div></div></div>`;
            const facts = reg ? a.facts.map(f => `<div class="fact">${f}</div>`).join('') + quotes(a.src) : `<div class="fact">Seen, not yet registered. Name it correctly in an encounter to unlock its page.</div>`;
            return { html: head + facts, pic };
          } };
      });
      if (t === 1) return C.KORBAN_ORDER.map((k, i) => {
        const kb = C.KORBANOS[k];
        return { num: pad(i + 1), label: `<span class="nm">${kb.tr}</span><span class="he">${kb.he}</span>`, cls: '',
          detail: () => ({ html: `<div class="head"><div><h2><span class="he">${kb.he}</span>${kb.tr}</h2><div class="sub">${kb.en} · ${kb.kedushah === 'kk' ? 'kodshei kodashim' : 'kodashim kalim'}</div></div></div>` + kb.facts.map(f => `<div class="fact">${f}</div>`).join('') + quotes(kb.src) }) };
      });
      if (t === 2) return Object.entries(C.SEALS).map(([k, s], i) => {
        const have = S.seals.includes(k);
        return { num: pad(i + 1), label: `<span class="nm">${s.en}</span><span class="he">${s.he}</span>`, cls: have ? '' : 'unknown',
          detail: () => { const pic = sprite('seal:' + k, 128, !have); pic.className = 'pic'; return { html: `<div class="head"><div class="plate"><span class="picwrap"></span>${have ? '<div class="stamp">Earned</div>' : ''}</div><div><h2><span class="he">${s.he}</span>${s.en}</h2><div class="sub">Level ${s.level}${have ? '' : s.level <= 2 ? ' · not yet earned' : ' · coming soon'}</div></div></div><div class="fact">${s.desc}</div>` + quotes(['Shekalim 5:3']), pic }; } };
      });
      return S.journal.length ? S.journal.map((id, i) => { const L = C.LESSONS[id]; return { num: pad(i + 1), label: `<span class="nm">${L.title}</span>`, cls: '', detail: () => ({ html: `<div class="head"><div><h2>${L.title}</h2><div class="sub">as taught by ${L.who}</div></div></div><div class="fact">${L.journal}</div>` + quotes([L.src]) }) }; })
        : [{ num: '—', label: '<span class="nm">Nothing written yet</span>', cls: 'unknown', detail: () => ({ html: '<div class="fact">Listen to the teachers; what they say is recorded here.</div>' }) }];
    }

    function render() {
      const entries = entriesFor(tab);
      sel = Math.min(sel, entries.length - 1);
      root.innerHTML = `<div class="book"><div class="page left" style="${paper}"><h1>${TABS[tab]} · Index</h1><div class="list"></div><div class="no">Sefer HaKorbanos · ${regN}/14 names</div></div><div class="page right" style="${paper}"><h1>Entry ${entries[sel].num}</h1><div class="detail"></div><div class="no">XP ${S.xp}</div></div><div class="tabs">${TABS.map((t, i) => `<div class="tab${i === tab ? ' on' : ''}">${t}</div>`).join('')}</div></div><div class="foot"><span>◀ ▶ chapters</span><span>▲ ▼ browse</span><span>B close</span></div>`;
      [...root.querySelectorAll('.tab')].forEach((t, i) => t.addEventListener('click', () => { tab = i; sel = 0; render(); }));
      const list = root.querySelector('.list'), detail = root.querySelector('.detail');
      entries.forEach((it, i) => { const d = el('div', 'item ' + it.cls + (i === sel ? ' sel' : ''), `<span class="num">${it.num}</span>${it.label}`); d.addEventListener('click', () => { sel = i; render(); }); list.appendChild(d); });
      const cur = entries[sel].detail();
      detail.innerHTML = cur.html;
      if (cur.pic) detail.querySelector('.picwrap').replaceWith(cur.pic);
      const selEl = list.children[sel]; if (selEl) selEl.scrollIntoView({ block: 'nearest' });
    }
    render();
    await new Promise(resolve => {
      const pop = Game.pushHandler(act => {
        const n = entriesFor(tab).length;
        if (act === 'left') { tab = (tab + 3) % 4; sel = 0; render(); A.sfx('blip'); }
        else if (act === 'right') { tab = (tab + 1) % 4; sel = 0; render(); A.sfx('blip'); }
        else if (act === 'up') { sel = (sel + n - 1) % n; render(); A.sfx('blip'); }
        else if (act === 'down') { sel = (sel + 1) % n; render(); A.sfx('blip'); }
        else if (act === 'b' || act === 'start') { pop(); A.sfx('cancel'); resolve(); }
      }, true);
    });
    root.remove();
  }
  return { open, parchment };
})();
