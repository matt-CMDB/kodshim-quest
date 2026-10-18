/* Kodshim Quest — the Sefer HaKorbanos (the "dex"): animals, korbanos, seals, journal. */
window.Sefer = (function () {
  const C = window.Content, SP = window.Sprites, A = window.Audio2;
  const G = () => window.Game;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const TABS = ['ANIMALS', 'KORBANOS', 'SEALS', 'JOURNAL'];
  function cite(src) { return src.startsWith('MK ') ? 'Rambam, Maaseh HaKorbanos ' + src.slice(3) : src.startsWith('Issurei') ? 'Rambam, ' + src : (src.startsWith('Chullin') || src.startsWith('Shekalim')) ? 'Mishnah ' + src : src; }
  function quotes(srcs) { return srcs.map(s => { const q = C.SOURCES[s]; return q ? `<div class="quote"><span class="he">${q.he}</span><span class="cite">${cite(s)} · ${G().esc(q.en)}</span></div>` : ''; }).join(''); }
  function sprite(name, size = 48, silhouette = false) { const c = document.createElement('canvas'); c.width = size; c.height = size; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const s = SP.get(name); const k = Math.floor(size / Math.max(s.width, s.height)); g.drawImage(s, Math.floor((size - s.width * k) / 2), size - s.height * k - 2, s.width * k, s.height * k); if (silhouette) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#6a6480'; g.fillRect(0, 0, size, size); } return c; }

  async function open() {
    const Game = G(); const S = Game.S;
    const root = el('div'); root.id = 'sefer';
    document.getElementById('ui').appendChild(root);
    let tab = 0, sel = 0;
    const regN = C.ANIMAL_ORDER.filter(k => !C.ANIMALS[k].bonus && S.reg[k]).length;
    function render() {
      root.innerHTML = `<div class="tabs">${TABS.map((t, i) => `<div class="tab${i === tab ? ' on' : ''}">${t}</div>`).join('')}</div><div class="body"></div><div class="foot"><span>◀ ▶ tabs · ▲ ▼ browse · B close</span><span>Sefer: ${regN}/14 names · XP ${S.xp}</span></div>`;
      const body = root.querySelector('.body');
      [...root.querySelectorAll('.tab')].forEach((t, i) => t.addEventListener('click', () => { tab = i; sel = 0; render(); }));
      if (tab === 0) listDetail(body, C.ANIMAL_ORDER, k => {
        const a = C.ANIMALS[k]; const seen = S.seen[k], reg = S.reg[k];
        return { label: reg ? `${a.tr} <span class="he">${a.he}</span>` : seen ? `${a.tr}` : '? ? ?', cls: reg ? '' : 'unknown', detail: () => {
          if (!seen && !reg) return `<div class="head"><div class="pic unknown">?</div><div><h2><span class="he">?</span>Unknown</h2><div class="sub">Walk the tall grass of the pastures to meet it.</div></div></div>`;
          const pic = sprite(a.sprite, 48, !reg); pic.className = 'pic';
          const head = `<div class="head"><div class="picwrap"></div><div><h2><span class="he">${a.he}</span>${a.tr}</h2><div class="sub">${a.en}${a.alt ? ' · also ' + a.alt : ''}${a.sex ? ' · ' + (a.sex === 'm' ? '♂' : '♀') : ''}</div></div></div>`;
          const facts = reg ? a.facts.map(f => `<div class="fact">${f}</div>`).join('') + quotes(a.src) : `<div class="fact">Seen, not yet registered. Name it correctly in an encounter to unlock its page.</div>`;
          return { html: head + facts, pic };
        } };
      });
      else if (tab === 1) listDetail(body, C.KORBAN_ORDER, k => {
        const kb = C.KORBANOS[k];
        return { label: `${kb.tr} <span class="he">${kb.he}</span>`, cls: '', detail: () => `<div class="head"><div><h2><span class="he">${kb.he}</span>${kb.tr}</h2><div class="sub">${kb.en} · ${kb.kedushah === 'kk' ? 'kodshei kodashim' : 'kodashim kalim'}</div></div></div>` + kb.facts.map(f => `<div class="fact">${f}</div>`).join('') + quotes(kb.src) };
      });
      else if (tab === 2) {
        const wrap = el('div', 'seals');
        for (const [k, s] of Object.entries(C.SEALS)) {
          const have = S.seals.includes(k);
          const card = el('div', 'sealcard' + (have ? '' : ' locked'));
          const c = sprite('seal:' + k, 32); card.appendChild(c);
          card.appendChild(el('div', 'nm', `${s.en}<span class="he">${s.he}</span>`)); card.appendChild(el('div', 'd', have ? s.desc : `Level ${s.level}. ${s.level <= 2 ? 'Not yet earned.' : 'Coming soon.'}`));
          wrap.appendChild(card);
        }
        const note = el('div', 'd', `<div class="quote" style="margin:0 auto;max-width:90%"><span class="he">${C.SOURCES['Shekalim 5:3'].he}</span><span class="cite">Mishnah Shekalim 5:3 · ${C.SOURCES['Shekalim 5:3'].en}</span></div>`);
        note.style.width = '100%'; wrap.appendChild(note);
        body.appendChild(wrap);
      }
      else {
        const j = el('div', 'journal');
        if (!S.journal.length) j.innerHTML = '<div class="entry">Nothing written yet. Listen to the teachers; what they say is recorded here.</div>';
        for (const id of S.journal) { const L = C.LESSONS[id]; j.appendChild(el('div', 'entry', `<span class="who">${L.title}</span> (${L.who})<br>${L.journal}<span class="src">${cite(L.src)}</span>`)); }
        body.appendChild(j);
      }
    }
    function listDetail(body, keys, fn) {
      const list = el('div', 'list'), detail = el('div', 'detail');
      body.appendChild(list); body.appendChild(detail);
      const items = keys.map(k => fn(k));
      items.forEach((it, i) => { const d = el('div', 'item ' + it.cls + (i === sel ? ' sel' : ''), it.label); d.addEventListener('click', () => { sel = i; render(); }); list.appendChild(d); });
      const cur = items[sel].detail();
      if (typeof cur === 'string') detail.innerHTML = cur; else { detail.innerHTML = cur.html; detail.querySelector('.picwrap').replaceWith(cur.pic); }
      const selEl = list.children[sel]; if (selEl) selEl.scrollIntoView({ block: 'nearest' });
    }
    render();
    await new Promise(resolve => {
      const pop = Game.pushHandler(act => {
        const n = tab === 0 ? C.ANIMAL_ORDER.length : tab === 1 ? C.KORBAN_ORDER.length : 1;
        if (act === 'left') { tab = (tab + 3) % 4; sel = 0; render(); A.sfx('blip'); }
        else if (act === 'right') { tab = (tab + 1) % 4; sel = 0; render(); A.sfx('blip'); }
        else if (act === 'up') { sel = (sel + n - 1) % n; render(); A.sfx('blip'); }
        else if (act === 'down') { sel = (sel + 1) % n; render(); A.sfx('blip'); }
        else if (act === 'b' || act === 'start') { pop(); A.sfx('cancel'); resolve(); }
      });
    });
    root.remove();
  }
  return { open };
})();
