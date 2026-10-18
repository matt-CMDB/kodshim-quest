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
    const infoE = el('div', 'info enemy'); const infoM = el('div', 'info me');
    root.appendChild(infoE); root.appendChild(infoM);
    const box = el('div', 'box'); box.innerHTML = `<div class="text"><span class="t"></span><div class="arrow" style="display:none"></div></div><div class="opts hidden"></div>`;
    root.appendChild(box);
    document.getElementById('ui').appendChild(root);
    const textEl = box.querySelector('.text .t'), arrow = box.querySelector('.arrow'), opts = box.querySelector('.opts');

    const total = spec.questions ? spec.questions.length + (spec.generated || 0) : (spec.type === 'wild2' ? 1 + (Math.random() < .4 ? 1 : 0) : 2);
    let done = 0, correct = 0, registered = false, lost = false;
    function hpClass() { const r = S.hp / S.maxHp; return r > .5 ? '' : r > .25 ? 'mid' : 'low'; }
    function renderInfo(tags, title) {
      infoE.innerHTML = `<div class="row"><span class="nm">${title}</span></div><div class="tags">${(tags || []).map(t => `<span class="tag ${t.cls || ''}">${Game.esc(t.text)}</span>`).join('')}</div>` + (isWild ? '' : `<div class="lbl">QUESTIONS</div><div class="bar q"><i style="width:${100 * (1 - done / total)}%"></i></div>`);
      infoM.innerHTML = `<div class="row"><span class="nm">TRAINEE</span><span>Lv ${1 + Math.floor(S.xp / 120)}</span></div><div class="lbl">HP ${S.hp}/${S.maxHp}</div><div class="bar hp"><i class="${hpClass()}" style="width:${100 * S.hp / S.maxHp}%"></i></div><div class="lbl">XP</div><div class="bar xp"><i style="width:${(S.xp % 120) / 1.2}%"></i></div>`;
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
    async function ask(q) {
      run.current = q;
      await text(q.prompt, false);
      opts.innerHTML = ''; opts.classList.remove('hidden');
      const long = q.opts.some(o => o.label.length > 22);
      opts.classList.toggle('one', long);
      q.opts.forEach((o, i) => opts.appendChild(el('div', 'item' + (i === 0 ? ' sel' : ''), Game.markup(o.label))));
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
      const chosen = q.opts[pick];
      const ok = chosen.key === q.answer;
      items.forEach((it, i) => { if (q.opts[i].key === q.answer) it.classList.add('good'); else if (i === pick) it.classList.add('bad'); });
      done++;
      if (ok) {
        correct++; A.sfx('correct');
        if (!isWild) { enemy.classList.remove('hit'); void enemy.offsetWidth; enemy.classList.add('hit'); }
        Game.addXp(isWild ? 10 : 15);
        renderInfo(curTags, curTitle);
        await text('Correct! ' + q.why);
      } else {
        A.sfx('wrong'); me.classList.remove('hit'); void me.offsetWidth; me.classList.add('hit');
        Game.damage(1); renderInfo(curTags, curTitle);
        const right = q.opts.find(o => o.key === q.answer).label;
        await text(`Not quite. The answer: ${right}. ${q.why}`);
        if (S.hp <= 0) lost = true;
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
        await text(`A wild ${C.SPECIES[a.species].en.toUpperCase()} appeared!`);
        if (!R.isBird(a.species)) {
          const ok = await ask(R.nameQuestion(a));
          if (ok) {
            const isNew = Game.register(nameKey);
            curTitle = `${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he}`; renderInfo(curTags, curTitle);
            if (isNew) { registered = true; A.sfx('register'); enemy.classList.add('reg'); sparkle(root, enemy); Game.addXp(15); await text(`✦ ${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he} was written into your Sefer!`); }
          } else if (!lost) {
            curTitle = `${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he}`; renderInfo(curTags, curTitle);
          }
          if (!lost) await ask(R.fitQuestion(a));
        } else {
          const ok = await ask(R.fitQuestion(a));
          if (ok) {
            const isNew = Game.register(nameKey);
            curTitle = `${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he}`; renderInfo(curTags, curTitle);
            if (isNew) { registered = true; A.sfx('register'); enemy.classList.add('reg'); sparkle(root, enemy); Game.addXp(15); await text(`✦ ${C.ANIMALS[nameKey].tr.toUpperCase()} ${C.ANIMALS[nameKey].he} was written into your Sefer!`); }
          }
        }
        if (!lost) await text(registered ? 'It trots back into the grass. Your Sefer grows.' : 'It wanders off into the grass.');
      } else if (spec.type === 'wild2') {
        curTitle = 'A PILGRIM'; curTags = [{ cls: '', text: 'has a question' }];
        renderInfo(curTags, curTitle);
        await text('A pilgrim steps out of the crowd. "Trainee! Settle something for me."');
        for (let i = 0; i < total && !lost; i++) await ask(R.l2Question());
        if (!lost) await text(correct === total ? '"Thank you! Elazar teaches well."' : '"Hm. Ask your teacher again, trainee."');
      } else {
        curTitle = spec.name; curTags = [{ cls: '', text: spec.type === 'gate' ? 'gatekeeper' : 'pilgrim' }];
        renderInfo(curTags, curTitle);
        await text(spec.intro || `${spec.name} challenges you!`);
        const qs = [...spec.questions];
        for (let i = 0; i < (spec.generated || 0); i++) {
          if (spec.level === 1) { const a = R.randomAnimal({ species: R.pick(['sheep', 'goat', 'cattle']) }); const nq = R.nameQuestion(a); nq.prompt = `${spec.name.split(' ').pop()} shows you a ${C.SPECIES[a.species].en}, ${a.sex === 'm' ? 'male' : 'female'}, ${R.ageText(a.age)}${a.mum ? ', ' + a.mum : ''}. What is it called?`; qs.push(nq); const fq = R.fitQuestion(a); fq.prompt = `The same animal (${a.sex === 'm' ? '♂' : '♀'} ${C.SPECIES[a.species].en}, ${R.ageText(a.age)}${a.mum ? ', ' + a.mum : ''}). May it go up on the mizbeach?`; qs.push(fq); i++; }
          else qs.push(R.l2Question());
        }
        for (const q of qs) { if (lost) break; await ask(q); }
      }
    } catch (e) { console.error(e); }

    const won = !lost && (isWild || spec.type === 'wild2' || correct >= Math.ceil(done * (spec.type === 'gate' ? 0.75 : 0.67)));
    if (!isWild && spec.type !== 'wild2' && !lost) await text(won ? `You won! ${correct}/${done} correct.` : `${correct}/${done} correct. Not enough this time.`);
    if (lost) await text('You have no hearts left...');
    root.remove();
    A.play(Game.map.music);
    Game.updateHud();
    return { won, correct, total: done, registered };
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
