#!/usr/bin/env node
/* Export every piece of player-facing text in Kodshim Quest to GAME-TEXT.md,
   in the order a player meets it, with the file and line it comes from.

     node tools/export-text.js            writes GAME-TEXT.md
     node tools/export-text.js out.md     writes somewhere else

   Data files (content.js, rules.js, maps.js) are loaded and walked. Text that
   is written inline in the code (engine.js, battle.js, sefer.js) is pulled out
   by reading the string literals of each function. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'GAME-TEXT.md');
const src = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');

// ---------------------------------------------------------------- load data
const sandbox = { window: {}, console };
vm.createContext(sandbox);
for (const f of ['content.js', 'rules.js', 'maps.js']) vm.runInContext(src(f), sandbox, { filename: f });
const C = sandbox.window.Content, R = sandbox.window.Rules, M = sandbox.window.Maps;

// ---------------------------------------------------------------- locating text
const SRC = {};
for (const f of ['content.js', 'rules.js', 'maps.js', 'engine.js', 'battle.js', 'sefer.js']) SRC[f] = src(f);
const lineAt = (text, idx) => text.slice(0, idx).split('\n').length;
// Find a data string in a source file the way it is written there (apostrophes escaped).
function where(file, str, near) {
  const text = SRC[file];
  const variants = [str.replace(/\\/g, '\\\\').replace(/'/g, "\\'"), str];
  for (const v of variants) {
    for (const len of [Math.min(v.length, 60), Math.min(v.length, 25)]) {
      const probe = v.slice(0, len);
      let idx = near != null ? text.indexOf(probe, near) : -1;
      if (idx < 0) idx = text.indexOf(probe);
      if (idx >= 0) return `${file}:${lineAt(text, idx)}`;
    }
  }
  return file;
}

// ---------------------------------------------------------------- string literals in code
// A small tokenizer: returns every '…', "…" and `…` literal with its position,
// skipping comments and regular expressions.
function literals(text) {
  const out = [];
  let i = 0, prev = '';
  const regexOK = () => /[(,=:[!&|?{};+\-*%<>~^]$|^$|\breturn$|\btypeof$/.test(prev.trimEnd());
  while (i < text.length) {
    const ch = text[i], nx = text[i + 1];
    if (ch === '/' && nx === '/') { const e = text.indexOf('\n', i); i = e < 0 ? text.length : e; continue; }
    if (ch === '/' && nx === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? text.length : e + 2; continue; }
    if (ch === '/' && regexOK()) {
      let j = i + 1, cls = false;
      while (j < text.length && text[j] !== '\n') {
        if (text[j] === '\\') { j += 2; continue; }
        if (text[j] === '[') cls = true; else if (text[j] === ']') cls = false; else if (text[j] === '/' && !cls) break;
        j++;
      }
      i = j + 1; prev = 'x'; continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const start = i; let j = i + 1, depth = 0, raw = '';
      while (j < text.length) {
        const c = text[j];
        if (c === '\\') { raw += c + text[j + 1]; j += 2; continue; }
        if (ch === '`' && c === '$' && text[j + 1] === '{' ) { depth++; raw += '${'; j += 2; continue; }
        if (ch === '`' && depth > 0) {
          if (c === '{') depth++;
          if (c === '}') depth--;
          // nested template or string inside ${…}: copy through
          if (c === '`' || c === "'" || c === '"') {
            const q = c; raw += c; j++;
            while (j < text.length && text[j] !== q) { if (text[j] === '\\') { raw += text[j]; j++; } raw += text[j]; j++; }
          }
          raw += text[j]; j++; continue;
        }
        if (c === ch) break;
        raw += c; j++;
      }
      out.push({ start, end: j + 1, quote: ch, raw });
      i = j + 1; prev = 'x'; continue;
    }
    if (!/\s/.test(ch)) prev = text.slice(Math.max(0, i - 8), i + 1);
    i++;
  }
  return out;
}
const unescape = s => s.replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n');
// ${expr} → a readable blank such as {species} or {age}.
const BLANKS = [
  [/SPECIES\[[^\]]+\]\.en/, 'species'], [/ANIMALS\[nameKey\]\.tr/, 'name'], [/ANIMALS\[nameKey\]\.he/, 'Hebrew name'],
  [/sex === 'm' \? 'male'/, 'male/female'], [/sex === 'm' \? '♂'/, '♂/♀'], [/ageText/, 'age'], [/a\.mum \?/, ', blemish'],
  [/spec\.name\.split/, 'examiner'], [/art\(a\.tr/, 'a/an NAME'], [/KNAME\[korban\]/, 'korban'], [/GO\(right\)/, 'right answer'],
  [/G_\(q\.why\)/, 'explanation'], [/S\.hp <= 0/, '" That was your last one..." when no hearts are left'],
  [/LESSONS\[id\]\.who/, 'teachers not yet heard'], [/LESSONS\[id\]\.title/, 'lessons not yet heard'], [/^a\.tr$/, 'name'], [/^a\.he$/, 'Hebrew name'],
  [/^a\.en$/, 'English'], [/^it\.n$/, 'offering'], [/^(tr|spec)\.name$/, 'challenger'], [/^rc$/, 'number of names'], [/^correct$/, 'right'],
  [/^done$/, 'asked'], [/TABS\[tab\]/, 'chapter'], [/entries\[sel\]\.num/, 'number'], [/=== 1 \? '' : 's'/, 's'], [/TABS\.map/, 'chapter tabs'], [/^L\.who$/, 'teacher'], [/^regN$/, 'number of names'], [/seals\.length$/, 'number of seals'], [/^L\.journal$/, 'journal summary'], [/^L\.title$/, 'lesson title'], [/^next$/, 'off/low/medium/loud'],
];
const blank = e => {
  const said = [...e.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'")).filter(x => /\w+ \w+/.test(x));
  if (said.length) return `{${said.map(x => `"${x.trim()}"`).join(' or ')}${/:\s*''/.test(e) ? ' or nothing' : ''}}`;
  for (const [re, name] of BLANKS) if (re.test(e)) return `{${name}}`; return /^[\w.]+$/.test(e) ? `{${e}}` : '{…}'; };
const holes = s => s.replace(/\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, (m, e) => blank(e.trim()));
function htmlToText(s) {
  return s
    .replace(/<br\s*\/?>/g, '\n').replace(/<\/h[12]>/g, '\n').replace(/<\/(p|h3|tr|div)>/g, '\n').replace(/<(p|h3|tr)[^>]*>/g, '\n')
    .replace(/<span class="tl-lbl">([^<]*)<\/span>/g, '$1: ').replace(/<\/span>/g, ' ').replace(/<\/t[hd]>/g, ' | ').replace(/<small>/g, ' — ').replace(/<\/i>/g, ' | ')
    .replace(/<[^>]+>/g, '').replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .split('\n').map(l => l.replace(/\s+/g, ' ').replace(/(\s*\|\s*)+$/, '').trim()).filter(Boolean).join('\n');
}
// Is this literal something a player reads?
function isProse(lit, text) {
  const s = holes(unescape(lit.raw));
  const lineStart = text.lastIndexOf('\n', lit.start) + 1;
  const before = text.slice(lineStart, lit.start);
  if (/choice\(\[[^\]]*$/.test(before)) return true;                       // a menu option
  if (/toast\(\s*$/.test(before)) return true;                               // a pop-up message
  if (/el\('\w+',\s*$/.test(before)) return false;                          // a CSS class name
  if (/(const name =|=== |== )\s*$/.test(before)) return false;              // speaker names, comparisons
  if (/^[A-Z][A-Z :!]{2,}$/.test(s) && /TABS|items|opts/.test(before)) return true; // SEFER, NEW GAME
  if (!/\s/.test(s.trim())) return false;                                    // ids and keys
  if (/(className|classList|querySelector|getElementById|\.id = |sfx|play|getContext|createElement|Art\.get|SP\.get|'person:)/.test(before.slice(-40)) && !/say\(|text\(|toast\(/.test(before.slice(-12))) return false;
  if (/(px|rgba?\(|url\(|translate|var\(--|;\s*$|^#|^\.|^\w+:\w)/.test(s) && !/[a-z]{3,} [a-z]{3,}/.test(htmlToText(s))) return false;
  const words = htmlToText(s).replace(/\{[^}]*\}/g, '').match(/[A-Za-z֐-׿']{2,}/g) || [];
  return words.length >= 2;
}
// Top-level function or const that encloses a position (2-space indent inside the IIFE).
function enclosing(text, pos) {
  const head = text.slice(0, pos);
  const re = /^ {2}(?:async\s+)?function\s+(\w+)|^ {2}const\s+(\w+)\s*=/gm;
  let m, name = '(top)';
  while ((m = re.exec(head))) name = m[1] || m[2];
  return name;
}
function codeText(file) {
  const text = SRC[file];
  return literals(text).filter(l => isProse(l, text)).map(l => {
    const lineStart = text.lastIndexOf('\n', l.start) + 1;
    const key = (text.slice(lineStart, l.start).match(/(\w+):\s*$/) || [])[1];
    let s = holes(unescape(l.raw));
    if (/<[a-z][^>]*>/i.test(s)) s = htmlToText(s);
    return { fn: enclosing(text, l.start), key, text: s, loc: `${file}:${lineAt(text, l.start)}` };
  });
}
const CODE = { engine: codeText('engine.js'), battle: codeText('battle.js'), sefer: codeText('sefer.js'), rules: codeText('rules.js') };
const used = new Set();
const take = (part, fn, filter = () => true) => CODE[part].filter(x => x.fn === fn && !used.has(x) && filter(x)).map(x => (used.add(x), x));

// ---------------------------------------------------------------- writing
const lines = [];
const w = (...a) => lines.push(...a);
const one = s => s.replace(/\n/g, ' / ');
const item = (loc, text) => w(`- \`${loc}\` ${one(text)}`);
const block = (loc, text) => { w(`- \`${loc}\``); for (const l of text.split('\n')) w(`  > ${l}`); };
const codeItems = list => { const seen = new Set(); for (const x of list) { if (seen.has(x.text)) continue; seen.add(x.text); (x.text.includes('\n') ? block : item)(x.loc, (x.key && !['html', 'text'].includes(x.key) ? `**${x.key}:** ` : '') + x.text); } };

const allNpcs = Object.values(M).flatMap(m => (m.npcs || []).map(n => ({ ...n, map: m })));
const lessonUsers = {};
for (const n of allNpcs) for (const id of [n.lesson, ...(n.lessons || [])].filter(Boolean)) (lessonUsers[id] = lessonUsers[id] || []).push(n.name);
for (const m of SRC['engine.js'].matchAll(/teach\('(\w+)'/g)) (lessonUsers[m[1]] = lessonUsers[m[1]] || []).push('(scripted)');
const qUsers = {};
for (const n of allNpcs) if (n.trainer) for (const id of n.trainer.questions) (qUsers[id] = qUsers[id] || []).push(`${n.trainer.name} (${n.map.name.split(':')[0]})`);

function lesson(id) {
  const L = C.LESSONS[id];
  const loc = where('content.js', L.lines[0]);
  w(`**Lesson: ${L.title}** (taught by ${L.who})`, '');
  L.lines.forEach((l, i) => item(i === 0 ? loc : '…', l));
  item(where('content.js', L.journal), `*Journal summary:* ${L.journal}`);
  item(where('content.js', `title: '${L.title.replace(/'/g, "\\'")}'`) , `*Journal title:* ${L.title}`);
  w('');
}
function question(id) {
  const q = C.QUESTIONS.find(x => x.id === id);
  const loc = where('content.js', `id: '${id}'`);
  w(`- \`${loc}\` **${q.q}**`);
  q.opts.forEach((o, i) => w(`  - ${i === q.a ? '✓' : '✗'} ${o}`));
  w(`  - *Explanation:* ${q.why}`);
}
function trainer(n) {
  const t = n.trainer;
  const loc = where('maps.js', t.intro);
  w(`#### ${t.name}`, '', `${WHERE[n.id] || ''} Spots you from ${t.sight} tiles away.`, '');
  item(loc, `*Challenge:* ${t.intro}`);
  w('', 'Questions (shown in random order; the correct answer is marked ✓):', '');
  for (const id of t.questions) question(id);
  w('');
  item(loc, `*If you pass:* ${t.lose}`);
  item(loc, `*Talking to them afterwards:* ${t.after}`);
  w('');
}
function npc(n) {
  if (n.trainer) return trainer(n);
  w(`#### ${n.name}`, '');
  if (WHERE[n.id]) w(WHERE[n.id], '');
  if (n.say) { n.say.forEach(l => item(where('maps.js', l), l)); w(''); }
  if (n.lesson) lesson(n.lesson);
  if (n.lessons) {
    w('Talking to them opens a menu of their lessons (section 6).', '');
    n.lessons.forEach(lesson);
  }
}
function signs(m) {
  const s = Object.entries(m.signs || {});
  if (!s.length) return;
  w('#### Signs', '');
  for (const [, t] of s) item(where('maps.js', t), t);
  w('');
  const wp = Object.values(m.warps || {}).filter(x => x.locked || x.done);
  if (wp.length) { w('#### Gates that are still closed', ''); for (const x of wp) { if (x.locked) item(where('maps.js', x.locked), x.locked); if (x.done) item(where('maps.js', x.done), `*After the seal is earned:* ${x.done}`); } w(''); }
}

// Where each character stands, in words.
const WHERE = {
  elazar_home: 'Inside his house, where the game begins.',
  rivka: 'Just outside Elazar\'s door, by the house sign.',
  yair: 'Outside Elazar\'s house.',
  tzviya: 'By the sheep pen, on the west side of the pasture.',
  yoav: 'By the goat pen, below the sheep pen.',
  nachum: 'By the cattle pen, on the east side.',
  chanah: 'At her bird stall, north-east, near the gate.',
  mevaker: 'At Sha\'ar HaTzon, the gate at the top of the pasture.',
  elder: 'Inside the cowherd\'s hut, south-east corner of the pasture.',
  pilgrim_a: 'On the path north-west of the sheep pen.',
  pilgrim_b: 'East side of the pasture, south of the cattle pen.',
  boy_a: 'South-east of the pasture, on the way to the cowherd\'s hut.',
  nechunya: 'Just inside the city, by the entrance from the pasture.',
  yishmael: 'North of the market street, left of centre.',
  asaf: 'North of the market street, right of centre.',
  baruch: 'At the market of korbanos, west side.',
  devorah: 'Outside her kitchen, east side.',
  pilgrim_c: 'West side of the market street.',
  pilgrim_d: 'East side of the market street, lower down.',
  woman_e: 'In the middle of the market street.',
  gate2: 'At the gate of the Azarah, top of the street.',
  rosh: 'Inside the Beis Midrash, by the boards.',
  host: 'Inside the houses of the city.',
};

// ================================================================= document
w('# Kodshim Quest: all game text', '',
  'Every line a player can read in Kodshim Quest, in roughly the order they meet it. Generated by `node tools/export-text.js` from the game\'s source.', '',
  '**How to use this file.** Change any text in place and send the file back (or commit it). Leave the grey location tags such as `content.js:140` alone: they say where each line lives in the code, so the changes can be carried into the game.', '',
  'Notes on reading it:', '',
  '- `{he:בָּקָר}` shows the Hebrew word in a Hebrew font inside the sentence.',
  '- Words in curly brackets, such as `{species}` or `{age}`, are blanks the game fills in while playing.',
  '- Multiple-choice options appear in random order in the game. Here the correct one is marked ✓ and the others ✗.',
  '- The first time a word from the glossary (near the end of this file) appears in a challenge question, the game adds its English meaning in brackets, for example "chatas (sin-offering)". The text below is shown without those additions.',
  '- A line marked `…` continues the speech of the line above it, one dialogue box per line.', '');

// ---- 1. Title and controls
w('## 1. Title screen', '');
codeItems(take('engine', 'title'));
w('');

// ---- 2. Elazar's house
w('## 2. Elazar\'s house (the start)', '', '### Elazar HaKohen', '', WHERE.elazar_home, '', 'First visit:', '');
const mentor = take('engine', 'mentor');
const firstReturn = mentor.findIndex(x => /Rest\. There/.test(x.text));
codeItems(mentor.slice(0, firstReturn));
w('');
lesson('five_species');
w('Every later visit:', '');
codeItems(mentor.slice(firstReturn));
w('');

// ---- 3. Pasture
const P = M.pasture;
w(`## 3. ${P.name}`, '', 'The first outdoor area. Characters are listed roughly from Elazar\'s door to the Sheep Gate.', '');
w('### Rivka the record-keeper', '', WHERE.rivka, '');
lesson('calendar');
codeItems(take('engine', 'talkTo', x => /calendar|Sefer with ESC/.test(x.text)));
w('', '**The calendar board** (opens after her lesson):', '');
codeItems(take('engine', 'BOARDS', x => x.key === 'calendar'));
w('');
const order = ['yair', 'tzviya', 'yoav', 'nachum', 'chanah', 'pilgrim_a', 'pilgrim_b', 'boy_a'];
for (const id of order) npc(P.npcs.find(n => n.id === id));
w('### Avigdor the Elder (cowherd\'s hut)', '', WHERE.elder, '');
lesson('ages');
signs(P);

// ---- 4. Sheep Gate
w('## 4. The Sheep Gate test (Mevaker Shimon)', '', WHERE.mevaker, '');
codeItems(take('engine', 'gatekeeper1'));
w('', 'The test itself: five questions drawn at random from the Level 1 question bank (section 9), then one animal to name and judge, generated the same way as the animals in the tall grass (section 7). After you pass, Shimon gives this lesson:', '');
lesson('seals');

// ---- 5. City
const Cy = M.city;
w(`## 5. ${Cy.name}`, '', 'The second area, behind the Sheep Gate. Its lessons fill in the Korbanos chapter of the Sefer.', '');
for (const id of ['nechunya', 'yishmael', 'asaf', 'baruch', 'devorah', 'pilgrim_c', 'pilgrim_d', 'woman_e']) npc(Cy.npcs.find(n => n.id === id));
w('### Inside the houses', '');
npc(M.home2.npcs[0]);
w('### The Beis Midrash', '');
npc(M.midrash.npcs[0]);
const boardLine = +where('engine.js', 'Welcome to the Beis Midrash').split(':')[1];
codeItems(take('engine', 'talkTo', x => Math.abs(+x.loc.split(':')[1] - boardLine) <= 1));
w('', '**The boards** (the same three boards are on the wall of the Beis Midrash):', '');
codeItems(take('engine', 'BOARDS'));
w('');
signs(Cy);
w('### Kohen Gamliel at the Azarah gate (the Level 2 test)', '', WHERE.gate2, '');
codeItems(take('engine', 'gatekeeper2'));
w('', 'The test itself: six questions drawn at random from the Level 2 question bank (section 9), then two generated Level 2 questions (section 8).', '');

// ---- 6. Shared lines
w('## 6. Lines used in many places', '', '### Challenges against a character', '');
codeItems(take('engine', 'trainerBattle'));
codeItems(take('battle', 'run', x => /challenges you|Three mistakes|You passed|Correct!|Not quite/.test(x.text)));
w('', '### Teachers with more than one lesson', '');
codeItems(take('engine', 'talkTo'));
w('', '### Losing your last heart', '');
codeItems(take('engine', 'faint'));
w('', '### Messages that pop up', '');
codeItems([...take('engine', 'teach'), ...take('engine', 'warp'), ...take('engine', 'board')]);
w('', '### Things you can look at', '');
codeItems(take('engine', 'interact'));
w('');

// ---- 7. Wild animals
w('## 7. Animals in the tall grass (Level 1)', '', 'Every encounter asks what the animal is called (not for birds), then whether it can be offered. Naming it correctly writes it into the Sefer. Mistakes here never cost a heart.', '', '### Encounter lines', '');
codeItems(take('battle', 'run', x => /wanders|written into your Sefer|trots back|wanders off|WILD/.test(x.text)));
codeItems(take('battle', 'usesLine'));
w('- For the four animals the Torah never names for a particular korban, that list starts with ⚠ instead of "When is it brought?".');
w('', 'After a new animal is written in, the game shows its "When is it brought?" list from the Sefer (section 10).', '');
w('### What the animal panel shows', '');
codeItems(take('rules', 'describe'));
item(where('rules.js', 'blind in one eye'), `*Blemishes an animal may have:* ${R.MUMS.join(' · ')}`);
codeItems(take('rules', 'randomAnimal'));
w('', '### Question: what is it called?', '');
codeItems(take('rules', 'nameQuestion'));
w('', 'The four options are names of the same species (other species fill in if needed):', '');
for (const [sp, keys] of Object.entries(R.NAME_POOL)) item(where('rules.js', `${sp}: [`), `*${sp}:* ${keys.map(k => `${C.ANIMALS[k].tr} ${C.ANIMALS[k].he}`).join(' · ')}`);
w('', 'The explanation after answering is "{name}: {English}. {first fact from the animal\'s Sefer page}".', '');
w('', '### Question: can this animal be offered on the mizbeach (altar)?', '');
codeItems(take('rules', 'fitQuestion'));
w('', 'Each question shows the right answer, exactly one "Yes" option, and "No" reasons to fill four slots. Every possible answer and the explanation shown after it:', '');
for (const [k, f] of Object.entries(R.FIT)) {
  const at = SRC['rules.js'].search(new RegExp(`\\n\\s+${k}:\\s+\\{`));
  item(`rules.js:${lineAt(SRC['rules.js'], at + 1)}`, `**${f.label}**${f.ok ? ' (counts as Yes)' : ''}`);
  w(f.why ? `  - *Explanation:* ${f.why}` : '  - *Never the right answer; offered only as a wrong choice for birds.*');
}
w('', '### Gate test: the generated animal', '');
codeItems(take('battle', 'run', x => /shows you a|The same animal/.test(x.text)));
w('');

// ---- 8. Level 2 generated
w('## 8. Pilgrims in the city crowd (Level 2)', '', 'Walking through the crowd in the city starts one or two generated questions. They never cost a heart. The Azarah gate test uses the same generator.', '');
codeItems(take('battle', 'run', x => /pilgrim|Thank you|Ask your teacher|A PILGRIM|has a question/i.test(x.text)));
w('', '### "Is that allowed?" questions', '');
codeItems(take('rules', 'canBeQuestion'));
w('', 'How each korban is named inside the question:', '');
for (const [k, v] of Object.entries(R.KNAME)) item(where('rules.js', v), `*${k}:* ${v}`);
w('', 'Possible answers and their explanations:', '');
for (const [k, v] of Object.entries(R.REASON)) { item(where('rules.js', v.label), `**${v.label}**`); if (v.why) w(`  - *Explanation:* ${v.why}`); else w('  - *Explanation when this is right:* "A {name} ({English}) may be brought as {korban}."'); }
w('', '### "Which ONE can it be?" questions', '');
codeItems(take('rules', 'whichQuestion'));
w('', 'The explanation is the first fact on that korban\'s Sefer page (section 10), or the matching "No" explanation above.', '');
w('', '### Holiness questions', '');
item(where('rules.js', 'An olah\''.slice(0, 7)), `*The offerings asked about:* ${R.KED.map(x => x.n).join(' · ')}`);
codeItems(take('rules', 'kedushahQuestion'));
w('');

// ---- 9. Question bank
w('## 9. The question bank', '', 'Written questions used by the characters who challenge you and by the two gate tests. The gate tests draw from every question of their level.', '');
for (const lvl of [1, 2]) {
  w(`### Level ${lvl}`, '');
  for (const q of C.QUESTIONS.filter(x => x.lvl === lvl)) {
    question(q.id);
    w(`  - *Used by:* ${[...(qUsers[q.id] || []), lvl === 1 ? 'Sheep Gate test pool' : 'Azarah gate test pool'].join('; ')}`);
  }
  w('');
}

// ---- 10. Sefer
w('## 10. The Sefer', '', '### Screen text', '');
codeItems([...take('sefer', 'TABS'), ...take('sefer', 'open')]);
codeItems(take('engine', 'updateHud'));
w('', '### Animals chapter', '');
for (const k of C.ANIMAL_ORDER) {
  const a = C.ANIMALS[k];
  const loc = where('content.js', `${k}:`.length > 3 ? `tr: '${a.tr.replace(/'/g, "\\'")}'` : a.he);
  w(`#### ${a.tr} ${a.he}${a.bonus ? ' (bonus entry)' : ''}`, '');
  item(loc, `*Subtitle:* ${a.en}${a.alt ? ` · also ${a.alt}` : ''}`);
  for (const f of a.facts) item(where('content.js', f), f);
  w(a.never ? '- *Box heading:* Never named for a particular korban' : '- *Box heading:* When is it brought?');
  for (const u of a.uses) item(where('content.js', u), u);
  w(`- *Sources quoted:* ${a.src.join(', ')}`, '');
}
w('### Korbanos chapter', '', 'Blank ("Not yet learned") until the lesson that opens each page has been heard.', '');
for (const k of C.KORBAN_ORDER) {
  const kb = C.KORBANOS[k];
  w(`#### ${kb.tr} ${kb.he}`, '');
  item(where('content.js', `tr: '${kb.tr}'`), `*Subtitle:* ${kb.en} · ${kb.kedushah === 'kk' ? 'kodshei kodashim (most holy)' : 'kodashim kalim (lesser holiness)'}`);
  for (const f of kb.facts) item(where('content.js', f), f);
  w(`- *Opens after the lesson:* ${C.LESSONS[kb.unlock].title}`, `- *Sources quoted:* ${kb.src.join(', ')}`, '');
}
w('### Seals chapter', '');
for (const [k, s] of Object.entries(C.SEALS)) item(where('content.js', s.desc), `**${s.en} ${s.he}:** ${s.desc}`);
w('', '### Journal chapter', '', 'Each lesson adds its title and summary (shown with the lessons above). Lessons that no character currently teaches:', '');
const unused = Object.keys(C.LESSONS).filter(id => !lessonUsers[id]);
if (unused.length) for (const id of unused) lesson(id); else w('- (none)', '');

// ---- 11. Menu
w('## 11. Menu and help', '');
codeItems([...take('engine', 'startMenu'), ...take('engine', 'helpPanel')]);
w('');

// ---- 12. Glossary and sources
w('## 12. Glossary', '', 'Added in brackets after the first use of each term in a challenge question, option or explanation.', '');
for (const [t, g] of C.GLOSS) item(where('content.js', `['${t.replace(/'/g, "\\'")}'`), `**${t}**: ${g}`);
w('', '## 13. Sources and their translations', '', 'Quoted in the Sefer under each entry.', '');
for (const [k, s] of Object.entries(C.SOURCES)) { item(where('content.js', `'${k}': {`), `**${k}**`); w(`  - ${s.he}`, `  - ${s.en}`); }

// ---- leftovers: anything inline that no section picked up
// rules.js tables are printed from the loaded data above; its logic has no player text.
const SHOWN = new Set(['FIT', 'YES', 'fitness', 'nameOf', 'MUMS', 'KNAME', 'REASON', 'KED', 'NAME_POOL', 'canBe', 'L2_ANIMALS', 'cite', 'quotes']);
const rest = Object.entries(CODE).flatMap(([, list]) => list.filter(x => !used.has(x) && !SHOWN.has(x.fn)));
if (rest.length) { w('', '## 14. Other text found in the code', '', 'Strings the sections above did not place. Most are labels or fragments.', ''); codeItems(rest); }

fs.writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${lines.length} lines`);
