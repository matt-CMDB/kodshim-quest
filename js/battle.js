/* Kodshim Quest — the encounter screen.
   Wild: an animal appears, you name it (registering it in the Sefer) and rule
   on its fitness. Trainer / gate: a person's questions, one per "round". */
window.Battle = (function () {
  const C = window.Content, R = window.Rules, SP = window.Sprites, A = window.Audio2, TL = window.Tiles.made;
  const G = () => window.Game;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const CITE = { 'MK': 'Rambam, Maaseh HaKorbanos' };
  function citeText(src) {
    if (!src) return '';
    if (src.startsWith('MK ')) return 'Rambam, Hil. Maaseh HaKorbanos ' + src.slice(3);
    if (src.startsWith('Issurei')) return 'Rambam, Hil. ' + src;
    if (src.startsWith('Chullin') || src.startsWith('Shekalim')) return 'Mishnah ' + src;
    return src;
  }
  function spriteCanvas(src, size) {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(src, Math.floor((size - src.width) / 2), size - src.height);
    return c;
  }

  async function run(spec) {
    const Game = G();
    const S = Game.S;
    const root = el('div'); root.id = 'battle'; root.classList.add(spec.arena || 'pasture');
    root.innerHTML = `<div class="sky"></div><canvas class="deco"></canvas><div class="plat enemy"></div><div class="plat me"></div>`;
    // scenery
    const deco = root.querySelector('.deco');
    const DW = 480, DH = Math.round(480 * document.getElementById('game').clientHeight / document.getElementById('game').clientWidth);
    deco.width = DW; deco.height = DH;
    const dg = deco.getContext('2d'); dg.imageSmoothingEnabled = false;
    const hz = Math.round(DH * .40);                                       // horizon line in deco pixels
    if (spec.arena === 'pasture') { for (let i = 0; i < 12; i++) dg.drawImage(TL.tree, i * 42 + (i % 2) * 10, hz - 26 + (i % 3) * 3); dg.drawImage(TL.olive, DW - 90, hz - 12); for (let x = 0; x < DW / 16; x++) dg.drawImage(TL.tall[x % 3][0], x * 16, DH - 36); }
    else if (spec.arena === 'city') { for (let x = 0; x < DW / 16; x++) { dg.drawImage(TL.wall_top, x * 16, hz - 24); dg.drawImage(TL.wall, x * 16, hz - 8); } dg.drawImage(TL.stall_top, 40, hz - 8); dg.drawImage(TL.stall, 40, hz + 8); dg.drawImage(TL.cypress, DW - 60, hz - 40); dg.drawImage(TL.cypress, 20, hz - 40); }
    else { for (let x = 0; x < DW / 16; x++) { dg.drawImage(TL.wall_top, x * 16, hz - 40); dg.drawImage(TL.wall, x * 16, hz - 24); dg.drawImage(TL.wall, x * 16, hz - 8); } dg.drawImage(TL.gate, DW / 2 - 24, hz - 40); }

    // enemy sprite
    let enemyImg;
    const isWild = spec.type === 'wild';
    const Art = window.Art;
    if (isWild) enemyImg = Art.get(C.ANIMALS[R.nameOf(spec.animal) === 'pilgas' ? 'ayil' : R.nameOf(spec.animal)].sprite);
    else if (spec.type === 'wild2') enemyImg = Art.get('person:' + R.pick(['pilgrim', 'pilgrim2', 'pilgrim3', 'woman', 'woman2', 'merchant']));
    else enemyImg = Art.get('person:' + (spec.kind || 'pilgrim'));
    const gw = document.getElementById('game').clientWidth, gh = document.getElementById('game').clientHeight;
    const ka = gh >= 900 ? 4 : gh >= 560 ? 3 : 2, kp = ka + 1;            // magnification: animals (64px art), people (32×40 art)
    const ew = enemyImg.width * (isWild ? ka : kp), eh = enemyImg.height * (isWild ? ka : kp);
    const enemy = el('div', 'mon enemy in'); enemy.appendChild(enemyImg);
    enemy.style.width = ew + 'px'; enemy.style.height = eh + 'px';
    enemy.style.left = Math.round(gw * .73 - ew / 2) + 'px'; enemy.style.top = Math.round(gh * .40 - eh) + 'px';
    root.appendChild(enemy);
    // player sprite
    const me = el('div', 'mon me'); const meImg = Art.get('person:player:back'); me.appendChild(meImg);
    const mw = meImg.width * kp, mh = meImg.height * kp;
    me.style.width = mw + 'px'; me.style.height = mh + 'px'; me.style.left = Math.round(gw * .22 - mw / 2) + 'px'; me.style.top = Math.round(gh * .68 - mh) + 'px';
    root.appendChild(me);
    // info panels
    const infoE = el('div', 'info enemy'); const infoM = el('div', 'status');
    root.appendChild(infoE); root.appendChild(infoM);
    const box = el('div', 'box'); box.innerHTML = `<div class="text"><span class="t"></span><div class="arrow" style="display:none"></div></div><div class="opts hidden"></div>`;
    root.appendChild(box);
    document.getElementById('ui').appendChild(root);
    const textEl = box.querySelector('.text .t'), arrow = box.querySelector('.arrow'), opts = box.querySelector('.opts');

    // Gate and trainer tests: written questions, then generated animals (Level 1) or scenarios (Level 2).
    const qs = spec.questions ? [...spec.questions] : null;
    if (qs) {
      for (let k = 0; k < (spec.animals || 0); k++) qs.push(...animalQuestions(spec));
      for (let k = 0; k < (spec.generated || 0); k++) qs.push(R.l2Question());
    }
    const total = qs ? qs.length : (spec.type === 'wild2' ? 1 + (Math.random() < .4 ? 1 : 0) : 2);
    let done = 0, correct = 0, strikes = 0, registered = false, lost = false;
    const MAX_STRIKES = 3;
    function renderInfo(tags, title) {
      infoE.innerHTML = `<div class="row"><span class="nm">${title}</span></div><div class="tags">${(tags || []).map(t => `<span class="tag ${t.cls || ''}">${Game.esc(t.text)}</span>`).join('')}</div>` + (isWild ? '' : `<div class="lbl">QUESTIONS</div><div class="bar q"><i style="width:${100 * (1 - done / total)}%"></i></div>`);
      let h = '<div class="hearts">';
      for (let i = 0; i < S.maxHp; i++) h += `<img src="${(i < S.hp ? SP.get('heart') : SP.get('heart_empty')).toDataURL()}">`;
      h += '</div>';
      if (!isWild) h += `<div class="strikes"><span class="lbl">MISTAKES</span>${[0, 1, 2].map(i => `<i class="${i < strikes ? 'x' : ''}">${i < strikes ? '✗' : ''}</i>`).join('')}</div>`;
      infoM.innerHTML = h;
    }
    async function text(msg, wait = true) {
      arrow.style.display = 'none';
      const plain = msg; let i = 0, skip = false;
      const pop = Game.pushHandler(act => { if (act === 'a' || act === 'b') skip = true; });
      while (i < plain.length && !skip) { i += 3; textEl.innerHTML = Game.markup(plain.slice(0, i)); await Game.sleep(16); }
      pop();
      textEl.innerHTML = Game.markup(plain);
      if (!wait) return;
      arrow.style.display = '';
      await Game.sleep(80);
      await Game.waitPress(['a', 'b']);
      A.sfx('blip');
      arrow.style.display = 'none';
    }
    function flashPanel() { infoE.classList.remove('flash'); void infoE.offsetWidth; infoE.classList.add('flash'); }
    async function ask(q) {
      run.current = q;
      const nudge = isWild ? setInterval(flashPanel, 60000) : null;   // no answer for a minute: point at the panel again
      const G_ = q.kind === 'name' ? (t => t) : (t => C.gloss(t));
      const GO = (q.kind === 'name' || q.kind === 'fit') ? (t => t) : G_;
      await text(G_(q.prompt), false);
      opts.innerHTML = ''; opts.classList.remove('hidden');
      const long = q.opts.some(o => o.label.length > 22);
      opts.classList.toggle('one', long);
      q.opts.forEach((o, i) => opts.appendChild(el('div', 'item' + (i === 0 ? ' sel' : ''), Game.markup(GO(o.label)))));
      const items = [...opts.children];
      let sel = 0; const n = items.length;
      const render = () => items.forEach((it, i) => it.classList.toggle('sel', i === sel));
      items.forEach((it, i) => it.addEventListener('click', () => { sel = i; render(); Game.press('a'); }));
      const pick = await new Promise(resolve => {
        const pop = Game.pushHandler(act => {
          const cols = long ? 1 : 2;
          if (act === 'up') { sel = (sel - cols + n) % n; render(); A.sfx('blip'); }
          else if (act === 'down') { sel = (sel + cols) % n; render(); A.sfx('blip'); }
          else if (act === 'left' || act === 'right') { if (!long) { sel = sel % 2 ? sel - 1 : Math.min(n - 1, sel + 1); render(); A.sfx('blip'); } }
          else if (act === 'a') { pop(); resolve(sel); }
        });
      });
      if (nudge) clearInterval(nudge);
      const chosen = q.opts[pick];
      const ok = chosen.key === q.answer;
      items.forEach((it, i) => { if (q.opts[i].key === q.answer) it.classList.add('good'); else if (i === pick) it.classList.add('bad'); });
      done++;
      if (ok) {
        correct++; A.sfx('correct');
        if (!isWild) { enemy.classList.remove('hit'); void enemy.offsetWidth; enemy.classList.add('hit'); }
        renderInfo(curTags, curTitle);
        await text('Correct! ' + G_(q.why));
      } else {
        A.sfx('wrong'); me.classList.remove('hit'); void me.offsetWidth; me.classList.add('hit');
        if (!isWild) strikes++;
        renderInfo(curTags, curTitle);
        const right = q.opts.find(o => o.key === q.answer).label;
        await text(`Not quite. The answer is: ${GO(right)}. ${G_(q.why)}`);
        if (!isWild && strikes >= MAX_STRIKES) { lost = true; }
      }
      opts.classList.add('hidden');
      return ok;
    }
    let curTags = [], curTitle = '';
    A.play(spec.type === 'gate' ? 'gate' : 'battle');

    try {
      if (isWild) {
        const a = spec.animal; const nameKey = R.nameOf(a);
        curTitle = `WILD ${C.SPECIES[a.species].en.toUpperCase()}`; curTags = R.describe(a);
        Game.markSeen(nameKey);
        renderInfo(curTags, curTitle);
        flashPanel();
        await text(`A ${C.SPECIES[a.species].en.toUpperCase()} wanders out of the grass! Look at what you can see: its kind, whether it is male or female, and its age.`);
        if (!R.isBird(a.species) && a.species !== 'goat') {
          const ok = await ask(R.nameQuestion(a));
          if (ok) {
            const isNew = Game.register(nameKey);
            curTitle = `${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he}`; renderInfo(curTags, curTitle);
            if (isNew) { registered = true; A.sfx('register'); enemy.classList.add('reg'); sparkle(root, enemy); await text(`✦ ${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he} was written into your Sefer!`); await text(usesLine(nameKey)); }
          } else if (!lost) {
            curTitle = `${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he}`; renderInfo(curTags, curTitle);
          }
          if (!lost) await ask(R.fitQuestion(a));
        } else {
          const ok = await ask(R.fitQuestion(a));
          if (ok) {
            const isNew = Game.register(nameKey);
            curTitle = `${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he}`; renderInfo(curTags, curTitle);
            if (isNew) { registered = true; A.sfx('register'); enemy.classList.add('reg'); sparkle(root, enemy); await text(`✦ ${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he} was written into your Sefer!`); await text(usesLine(nameKey)); }
          }
        }
        if (!lost) await text(registered ? 'It trots back into the grass. Your Sefer grows.' : 'It wanders off into the grass.');
      } else if (spec.type === 'wild2') {
        curTitle = 'A PILGRIM'; curTags = [{ cls: '', text: 'has a question' }];
        renderInfo(curTags, curTitle);
        await text(R.pick(['A pilgrim steps out of the crowd. "Trainee! Settle something for me." (A pilgrim\'s question never costs a heart.)', 'A pilgrim points at you and shouts. "Hey you with the badge! Help me choose an animal." (A pilgrim\'s question never costs a heart.)']));
        for (let i = 0; i < total && !lost; i++) await ask(R.l2Question());
        if (!lost) await text(correct === total ? '"Thank you! Elazar teaches well."' : '"Hm. Ask your teacher again, trainee."');
      } else {
        curTitle = spec.name; curTags = [{ cls: '', text: spec.type === 'gate' ? 'gatekeeper' : 'pilgrim' }];
        renderInfo(curTags, curTitle);
        await text(spec.intro || `${spec.name} challenges you!`);
        for (const q of qs) { if (lost) break; await ask(q); }
      }
    } catch (e) { console.error(e); }

    const won = !lost;
    if (lost) { Game.damage(1); renderInfo(curTags, curTitle); await text(`That makes three mistakes. The test has cost you a heart.${S.hp <= 0 ? ' That was your last one...' : ''}`); }
    else if (!isWild && spec.type !== 'wild2') {
      if (correct >= 3 && S.hp < S.maxHp) { Game.healOne(); renderInfo(curTags, curTitle); A.sfx('heal'); await text(`You passed: ${correct} of ${done} right. Three right answers in one test earn a heart back!`); }
      else await text(`You passed: ${correct} of ${done} right.`);
    }
    root.remove();
    A.play(Game.map.music);
    Game.updateHud();
    return { won, correct, total: done, registered };
  }
  function animalQuestions(spec) {
    const a = R.randomAnimal({ species: R.pick(['sheep', 'goat', 'cattle']) });
    const who = spec.name.split(' ').pop();
    const desc = `${C.SPECIES[a.species].en}, ${a.sex === 'm' ? 'male' : 'female'}, ${R.ageText(a.age)}${a.mum ? ', ' + a.mum : ''}`;
    const fq = R.fitQuestion(a);
    if (a.species === 'goat') { fq.prompt = `${who} shows you a ${desc}. May it go up on the mizbeach?`; return [fq]; }
    const nq = R.nameQuestion(a);
    nq.prompt = `${who} shows you a ${desc}. What is it called?`;
    fq.prompt = `The same animal (${a.sex === 'm' ? '♂' : '♀'} ${C.SPECIES[a.species].en}, ${R.ageText(a.age)}${a.mum ? ', ' + a.mum : ''}). May it go up on the mizbeach?`;
    return [nq, fq];
  }
  function usesLine(key) {
    const a = C.ANIMALS[key];
    if (!a.uses || !a.uses.length) return '';
    return (a.never ? '⚠ ' : 'When is it brought? ') + a.uses.join(' ');
  }
  function sparkle(root, around) {
    const r = around.getBoundingClientRect(), p = root.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const s = el('div', 'spark', '✦');
      s.style.left = (r.left - p.left + Math.random() * r.width) + 'px'; s.style.top = (r.top - p.top + Math.random() * r.height) + 'px';
      s.style.animationDelay = (i * .08) + 's';
      root.appendChild(s); setTimeout(() => s.remove(), 1200);
    }
  }
  return { run };
})();
