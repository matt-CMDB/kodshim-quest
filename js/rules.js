/* Kodshim Quest — the rules engine.
   Generates animals and korban scenarios and grades the player's answers
   from the halachos in content.js. A game year is 12 months of 30 days, so
   "1 year 20 days" is exactly day 20 of the second year. */
window.Rules = (function () {
  const C = window.Content;
  const YEAR = 360;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };

  const isBird = sp => sp === 'turtledove' || sp === 'pigeon';
  const total = age => age.y * YEAR + age.m * 30 + age.d;
  const R_total = a => (a.age ? total(a.age) : 0);
  const maxAge = sp => sp === 'cattle' ? 3 * YEAR : 2 * YEAR;

  function ageText(age) {
    const parts = [];
    if (age.y) parts.push(age.y + (age.y === 1 ? ' year' : ' years'));
    if (age.m) parts.push(age.m + (age.m === 1 ? ' month' : ' months'));
    if (age.d || parts.length === 0) parts.push(age.d + (age.d === 1 ? ' day' : ' days'));
    return parts.join(' ');
  }

  // ---- naming ----
  function nameOf(a) {
    if (a.species === 'turtledove') return 'tor';
    if (a.species === 'pigeon') return 'ben_yonah';
    const t = total(a.age), m = a.sex === 'm';
    if (a.species === 'cattle') return t <= YEAR ? (m ? 'egel' : 'eglah') : (m ? 'par' : 'parah');
    if (a.species === 'goat') return t <= YEAR ? (m ? 'gedi' : 'gediyah') : (m ? 'sair' : 'ez');
    // sheep
    if (t <= YEAR) return m ? 'keves' : 'kivsah';
    if (m && t <= YEAR + 30) return 'pilgas';
    return m ? 'ayil' : 'rachel';
  }

  // ---- fitness ----
  // returns { key, ok, label, why, src }
  const FIT = {
    fit:       { ok: true,  label: 'Yes, it is fit', why: 'Right species, right age, no blemish.', src: 'MK 1:11' },
    bedieved:  { ok: true,  label: 'Valid, but lechatchilah wait until day 30', why: 'From the eighth day it is valid, but one does not offer it lechatchilah before day thirty.', src: 'MK 1:12' },
    young:     { ok: false, label: 'No: younger than eight days', why: '"From the eighth day on it is acceptable." Before that it is not a korban at all.', src: 'Vayikra 22:27' },
    zaken:     { ok: false, label: 'No: too old (zaken)', why: 'Cattle may be offered until three full years, sheep and goats until two. Older is zaken and is not offered.', src: 'MK 1:11' },
    mum:       { ok: false, label: 'No: it has a mum', why: '"Anything that has a blemish you shall not offer."', src: 'Vayikra 22:20' },
    pilgas:    { ok: false, label: 'No: a pilgas is fit as neither keves nor ayil', why: 'In the first thirty days of its second year a sheep is a pilgas, valid as neither.', src: 'MK 1:14' },
    bird_fit:  { ok: true,  label: 'Yes, it is fit', why: 'Turtledoves are fit when grown; pigeons while young. Sex does not matter for birds.', src: 'Chullin 1:5' },
    tor_young: { ok: false, label: 'No: a turtledove is fit only when grown', why: 'Grown turtledoves are fit, young ones unfit.', src: 'Chullin 1:5' },
    yonah_old: { ok: false, label: 'No: a pigeon is fit only while young', why: 'Young pigeons are fit, grown ones unfit.', src: 'Chullin 1:5' },
    tzihuv:    { ok: false, label: 'No: at the start of tzihuv both are unfit', why: 'When the neck feathers just begin to turn golden, both turtledove and pigeon are unfit.', src: 'Chullin 1:5' },
    bird_mum:  { ok: true,  label: 'Yes: a blemish does not disqualify a bird', why: 'The laws of mum apply to animals, not birds. Only a missing limb, a dried wing or a blinded eye disqualifies a bird.', src: 'Issurei Mizbeach 3:1' },
    bird_limb: { ok: false, label: 'No: a bird missing a limb is unfit', why: 'Ordinary blemishes do not disqualify birds, but a missing limb (or a dried wing or a blinded eye) does.', src: 'Issurei Mizbeach 3:1' },
    // tempting wrong reasons for birds (never the answer)
    bird_zaken: { ok: false, label: 'No: too old (zaken)', why: '', src: '' },
    bird_mumno: { ok: false, label: 'No: it has a mum', why: '', src: '' },
  };
  const YES = new Set(['fit', 'bedieved', 'bird_fit', 'bird_mum']);
  function fitness(a) {
    if (isBird(a.species)) {
      if (a.limb) return 'bird_limb';
      if (a.stage === 'tzihuv') return 'tzihuv';
      if (a.species === 'turtledove' && a.stage === 'young') return 'tor_young';
      if (a.species === 'pigeon' && a.stage === 'grown') return 'yonah_old';
      return a.mum ? 'bird_mum' : 'bird_fit';
    }
    const t = total(a.age);
    if (t < 8) return 'young';
    if (t > maxAge(a.species)) return 'zaken';
    if (a.mum) return 'mum';
    if (nameOf(a) === 'pilgas') return 'pilgas';
    if (t < 30) return 'bedieved';
    return 'fit';
  }

  // ---- generation ----
  const MUMS = ['blind in one eye', 'a broken leg', 'a split ear', 'a torn eyelid', 'a broken horn to the root', 'a wart with hair on it'];
  function randomAnimal(opts = {}) {
    const species = opts.species || pick(['sheep', 'sheep', 'goat', 'goat', 'cattle', 'cattle', 'turtledove', 'pigeon']);
    if (isBird(species)) {
      const r = Math.random();
      const stage = r < .4 ? 'young' : r < .8 ? 'grown' : 'tzihuv';
      const sex = pick(['m', 'f']);
      const r2 = Math.random();
      const mum = r2 < .12 ? pick(['a blemish on the wing', 'a scar on the beak']) : null;
      const limb = !mum && r2 > .9 ? 'missing a leg' : null;
      return { species, sex, stage, mum, limb };
    }
    const sex = pick(['m', 'f']);
    const r = Math.random();
    let age, kind;
    if (r < .10) { kind = 'newborn'; age = { y: 0, m: 0, d: 1 + rnd(7) }; }
    else if (r < .20) { kind = 'week'; age = { y: 0, m: 0, d: 8 + rnd(22) }; }
    else if (r < .50) { kind = 'young'; age = { y: 0, m: 1 + rnd(11), d: rnd(30) }; }
    else if (r < .62 && species === 'sheep' && sex === 'm') { kind = 'pilgas'; age = { y: 1, m: 0, d: 1 + rnd(30) }; }
    else if (r < .90) {
      kind = 'adult';
      if (species === 'cattle') age = { y: 1 + rnd(2), m: rnd(12), d: rnd(30) };
      else age = { y: 1, m: 1 + rnd(11), d: rnd(30) };
      if (species === 'sheep' && sex === 'm' && age.m === 1 && age.d === 0) age.d = 1 + rnd(29);
    }
    else { kind = 'zaken'; age = species === 'cattle' ? { y: 3, m: 1 + rnd(11), d: rnd(30) } : { y: 2, m: 1 + rnd(11), d: rnd(30) }; }
    const mum = (kind === 'young' || kind === 'adult') && Math.random() < .14 ? pick(MUMS) : null;
    return { species, sex, age, mum };
  }

  function describe(a) {
    const tags = [];
    tags.push({ cls: 'sp', text: C.SPECIES[a.species].en.toUpperCase() });
    if (!isBird(a.species)) tags.push({ cls: a.sex === 'm' ? 'm' : 'f', text: a.sex === 'm' ? '♂ male' : '♀ female' });
    else tags.push({ cls: a.sex === 'm' ? 'm' : 'f', text: a.sex === 'm' ? '♂' : '♀' });
    if (!isBird(a.species)) tags.push({ cls: 'age', text: ageText(a.age) });
    else tags.push({ cls: 'age', text: a.stage === 'young' ? 'young plumage' : a.stage === 'grown' ? 'grown: golden neck' : 'neck just starting to yellow' });
    if (a.mum) tags.push({ cls: 'warn', text: a.mum });
    if (a.limb) tags.push({ cls: 'warn', text: a.limb });
    return tags;
  }

  // ---- questions about an animal ----
  const NAME_POOL = {
    cattle: ['egel', 'eglah', 'par', 'parah'],
    sheep: ['keves', 'kivsah', 'ayil', 'rachel', 'pilgas'],
    goat: ['gedi', 'gediyah', 'sair', 'ez'],
  };
  function label(key) { const a = C.ANIMALS[key]; return a.tr + ' ' + a.he; }
  function nameQuestion(a) {
    const ans = nameOf(a);
    const pool = NAME_POOL[a.species].filter(k => k !== ans);
    const others = Object.keys(NAME_POOL).filter(s => s !== a.species).flatMap(s => NAME_POOL[s]);
    let opts = shuffle(pool).slice(0, 3);
    while (opts.length < 3) opts.push(pick(others));
    opts = shuffle([ans, ...opts]);
    const why = ans === 'pilgas'
      ? 'A male sheep in the first thirty days of its second year is a pilgas: no longer a keves, not yet an ayil.'
      : C.ANIMALS[ans].facts[0];
    return { kind: 'name', prompt: 'What is this animal called?', opts: opts.map(k => ({ key: k, label: label(k) })), answer: ans, why, src: C.ANIMALS[ans].src[0] };
  }
  function fitQuestion(a) {
    const ans = fitness(a);
    const bird = isBird(a.species);
    // exactly one affirmative option per question; the rest are "No" reasons
    const noPool = bird
      ? ['tor_young', 'yonah_old', 'tzihuv', 'bird_limb', 'bird_zaken', 'bird_mumno']
      : ['young', 'zaken', 'mum', ...(a.species === 'sheep' && a.sex === 'm' ? ['pilgas'] : [])];
    const nos = shuffle(noPool.filter(k => k !== ans));
    let opts;
    if (YES.has(ans)) opts = [ans, ...nos.slice(0, 3)];
    else {
      // one "Yes": the tempting one when a blemish is in play, otherwise the plain one
      const yes = bird ? (a.mum ? 'bird_mum' : 'bird_fit') : (R_total(a) >= 8 && R_total(a) < 30 ? 'bedieved' : 'fit');
      opts = [ans, yes, ...nos.slice(0, 2)];
    }
    opts = shuffle(opts);
    return { kind: 'fit', prompt: 'May it be brought on the mizbeach?', opts: opts.map(k => ({ key: k, label: FIT[k].label })), answer: ans, why: FIT[ans].why, src: FIT[ans].src };
  }

  // ---- Level 2: korban scenarios ----
  const KORBAN_SET = ['olah', 'chatat', 'asham', 'shelamim'];
  const KNAME = { olah: 'an OLAH', chatat: 'a CHATAS (for an unintentional sin)', asham: 'an ASHAM', shelamim: 'a SHELAMIM' };
  function canBe(key, korban) {
    const a = C.ANIMALS[key]; const bird = isBird(a.species);
    switch (korban) {
      case 'olah': return bird ? null : (a.sex === 'm' ? null : 'olah_female');
      case 'chatat': if (bird) return 'chatat_bird'; if (a.species === 'cattle') return 'chatat_cattle'; if (a.sex !== 'f') return 'chatat_male'; return a.age === 'young' ? null : 'chatat_age';
      case 'asham': if (a.species !== 'sheep') return 'asham_species'; return a.sex === 'm' ? null : 'asham_female';
      case 'shelamim': return bird ? 'shelamim_bird' : null;
    }
  }
  const REASON = {
    olah_female: { label: 'No: an animal olah must be male', why: 'An animal olah comes only from males; only a bird olah may be either sex.', src: 'MK 1:8' },
    chatat_bird: { label: 'No: his chatas is a female sheep or goat', why: 'An ordinary person\'s chatas for a sin is a se\'iras izim or a kivsah.', src: 'Vayikra 4:28' },
    chatat_cattle: { label: 'No: an individual\'s chatas is never cattle', why: 'Every individual\'s chatas is female and not from cattle, except the three bulls and the nasi\'s goat.', src: 'MK 1:15' },
    chatat_male: { label: 'No: an individual\'s chatas must be female', why: 'Every individual\'s chatas is female; only the nasi, the kohen mashiach and the kohen gadol on Yom Kippur bring males.', src: 'MK 1:15' },
    chatat_age: { label: 'No: the chatas is a female in its first year', why: 'The Torah asks for "a she-goat in her first year" (ez bas shenasah), and a keves means a sheep in its first year; a grown ewe or she-goat is not the individual\'s chatas.', src: 'Bamidbar 15:27' },
    asham_species: { label: 'No: an asham comes only from sheep', why: 'The asham comes only from male sheep.', src: 'MK 1:10' },
    asham_female: { label: 'No: an asham must be a male sheep', why: 'The asham comes only from male sheep.', src: 'MK 1:10' },
    shelamim_bird: { label: 'No: there are no bird shelamim', why: '"No bird is brought as shelamim."', src: 'MK 1:11' },
    yes: { label: 'Yes, it may', why: '', src: '' },
  };
  const L2_ANIMALS = C.ANIMAL_ORDER.filter(k => k !== 'pilgas');
  const art = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  function canBeQuestion() {
    const key = pick(L2_ANIMALS), korban = pick(KORBAN_SET);
    const a = C.ANIMALS[key];
    const reason = canBe(key, korban);
    const ans = reason || 'yes';
    const distract = Object.keys(REASON).filter(k => k !== ans && k !== 'yes');
    const opts = shuffle([ans, ...(ans === 'yes' ? [] : ['yes']), ...shuffle(distract).slice(0, ans === 'yes' ? 3 : 2)]);
    const why = ans === 'yes' ? `A ${a.tr} ${a.he} may be brought as ${KNAME[korban]}.` : REASON[ans].why;
    const src = ans === 'yes' ? C.KORBANOS[korban].src[0] : REASON[ans].src;
    return { kind: 'canbe', animal: key, korban, prompt: `A pilgrim brings ${art(a.tr.toUpperCase())} ${a.he} (${a.en}) as ${KNAME[korban]}. Allowed?`, opts: opts.map(k => ({ key: k, label: REASON[k].label })), answer: ans, why, src };
  }
  function whichQuestion() {
    for (let tries = 0; tries < 20; tries++) {
      const key = pick(L2_ANIMALS); const a = C.ANIMALS[key];
      const valid = KORBAN_SET.filter(k => !canBe(key, k));
      const labels = { olah: 'Olah', chatat: 'Chatas of an ordinary person', asham: 'Asham', shelamim: 'Shelamim' };
      if (valid.length === 1) {
        return { kind: 'which', animal: key, prompt: `${art(a.tr.toUpperCase()).replace(/^a/, 'A')} ${a.he} (${a.en}). As which of these may it be brought?`, opts: shuffle(KORBAN_SET).map(k => ({ key: k, label: labels[k] })), answer: valid[0], why: C.KORBANOS[valid[0]].facts[0], src: C.KORBANOS[valid[0]].src[0] };
      }
      if (valid.length === 3) {
        const bad = KORBAN_SET.find(k => canBe(key, k));
        return { kind: 'which', animal: key, prompt: `${art(a.tr.toUpperCase()).replace(/^a/, 'A')} ${a.he} (${a.en}). Which of these can it NOT be?`, opts: shuffle(KORBAN_SET).map(k => ({ key: k, label: labels[k] })), answer: bad, why: REASON[canBe(key, bad)].why, src: REASON[canBe(key, bad)].src };
      }
    }
    return canBeQuestion();
  }
  const KED = [
    { n: 'An olah', k: 'kk' }, { n: 'A chatas', k: 'kk' }, { n: 'An asham', k: 'kk' }, { n: 'The two Shavuos lambs', k: 'kk' },
    { n: 'An individual\'s shelamim', k: 'kalim' }, { n: 'A todah', k: 'kalim' }, { n: 'A bechor', k: 'kalim' }, { n: 'Maaser beheimah', k: 'kalim' }, { n: 'The korban pesach', k: 'kalim' },
  ];
  function kedushahQuestion() {
    const it = pick(KED);
    const form = rnd(3);
    if (form === 0) return { kind: 'ked', prompt: `${it.n}: kodshei kodashim or kodashim kalim?`, opts: [{ key: 'kk', label: 'Kodshei kodashim' }, { key: 'kalim', label: 'Kodashim kalim' }], answer: it.k, why: it.k === 'kk' ? 'Olos, chataos, ashamos and the two Shavuos lambs are kodshei kodashim.' : 'An individual\'s shelamim (todah included), the bechor, the maaser and the pesach are kodashim kalim.', src: 'MK 1:17' };
    if (form === 1) return { kind: 'ked', prompt: `${it.n}. Where is it slaughtered?`, opts: shuffle([{ key: 'north', label: 'North of the mizbeach only' }, { key: 'any', label: 'Anywhere in the Azarah' }, { key: 'city', label: 'Anywhere in Yerushalayim' }, { key: 'heichal', label: 'Inside the Heichal' }]), answer: it.k === 'kk' ? 'north' : 'any', why: it.k === 'kk' ? 'Kodshei kodashim are slaughtered only north of the mizbeach.' : 'Kodashim kalim are slaughtered anywhere in the Azarah.', src: 'MK 5:2' };
    const eat = it.n === 'An olah' ? 'none' : it.k === 'kk' ? 'kohanim' : 'city';
    return { kind: 'ked', prompt: `${it.n}. Who eats it, and where?`, opts: shuffle([{ key: 'none', label: 'No one: it is entirely burned' }, { key: 'kohanim', label: 'Male kohanim, in the Azarah' }, { key: 'city', label: 'Anyone tahor, anywhere in Yerushalayim' }, { key: 'home', label: 'The owner, at home outside the city' }]), answer: eat, why: eat === 'none' ? 'The olah goes up entirely; only its hide goes to the kohanim.' : eat === 'kohanim' ? 'Kodshei kodashim are eaten by male kohanim in the Azarah.' : 'Kodashim kalim are eaten anywhere in the city by anyone tahor.', src: eat === 'none' ? 'MK 6:1' : eat === 'kohanim' ? 'MK 10:3' : 'MK 10:5' };
  }
  function l2Question() {
    const r = Math.random();
    if (r < .4) return canBeQuestion();
    if (r < .65) return whichQuestion();
    return kedushahQuestion();
  }

  // curated question → uniform shape
  function curated(q) {
    const opts = q.opts.map((label, i) => ({ key: String(i), label }));
    return { kind: 'curated', id: q.id, prompt: q.q, opts: shuffle(opts), answer: String(q.a), why: q.why, src: q.src };
  }
  function curatedSet(level, n, exclude = []) {
    const pool = C.QUESTIONS.filter(q => q.lvl === level && !exclude.includes(q.id));
    return shuffle(pool).slice(0, n).map(curated);
  }
  function byId(id) { return curated(C.QUESTIONS.find(q => q.id === id)); }

  return { YEAR, total, ageText, nameOf, fitness, FIT, randomAnimal, describe, nameQuestion, fitQuestion, canBe, canBeQuestion, whichQuestion, kedushahQuestion, l2Question, curated, curatedSet, byId, shuffle, pick, isBird };
})();
