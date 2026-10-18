/* Kodshim Quest — chiptune audio (WebAudio, no samples).
   Songs are note lists per track; a tiny scheduler loops them. */
window.Audio2 = (function () {
  let ctx = null, master = null, enabled = true, current = null, timer = null, bus = null;
  const MUSIC_GAIN = 0.32;    // music sits well under the sound effects
  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(n) { if (typeof n === 'number') return n; const m = /^([A-G][#b]?)(\d)$/.exec(n); const midi = 12 * (+m[2] + 1) + NOTE[m[1]]; return 440 * Math.pow(2, (midi - 69) / 12); }
  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = enabled ? 0.5 : 0; master.connect(ctx.destination);
    return ctx;
  }
  function tone(f, t0, dur, { wave = 'square', vol = .2, slide = 0, attack = .005, release = .03, out = null } = {}) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.setValueAtTime(vol, Math.max(t0 + attack, t0 + dur - release)); g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(out || master); o.start(t0); o.stop(t0 + dur + .01);
  }
  function noise(t0, dur, vol = .15) {
    if (!ctx) return;
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = vol;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800;
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }

  // ---- songs ----
  // a track: { wave, vol, notes: [[note|0, beats], ...] }
  const SONGS = {
    field: { bpm: 112, tracks: [
      { wave: 'triangle', vol: .17, notes: [
        ['E4', 1], ['G#4', .5], ['A4', .5], ['B4', 1], ['A4', .5], ['G#4', .5],
        ['F4', 1], ['E4', 1], ['D4', .5], ['E4', .5], ['F4', 1],
        ['E4', 1], ['G#4', .5], ['A4', .5], ['B4', 1], ['C5', 1],
        ['B4', .5], ['A4', .5], ['G#4', 1], ['F4', .5], ['E4', .5], [0, 1],
        ['B4', 1], ['C5', .5], ['B4', .5], ['A4', 1], ['G#4', 1],
        ['A4', .5], ['B4', .5], ['A4', .5], ['G#4', .5], ['F4', 1], ['E4', 1],
        ['D4', 1], ['E4', .5], ['F4', .5], ['G#4', 1], ['A4', 1],
        ['G#4', .5], ['F4', .5], ['E4', 2], [0, 1],
      ] },
      { wave: 'triangle', vol: .16, notes: [
        ['E2', 1], ['E3', .5], ['E2', .5], ['E2', 1], ['B2', 1],
        ['E2', 1], ['E3', .5], ['E2', .5], ['E2', 1], ['B2', 1],
        ['A2', 1], ['A3', .5], ['A2', .5], ['A2', 1], ['E3', 1],
        ['B2', 1], ['B2', .5], ['B2', .5], ['E2', 1], ['E2', 1],
        ['E2', 1], ['E3', .5], ['E2', .5], ['E2', 1], ['B2', 1],
        ['F2', 1], ['F3', .5], ['F2', .5], ['F2', 1], ['C3', 1],
        ['D2', 1], ['D3', .5], ['D2', .5], ['D2', 1], ['A2', 1],
        ['B2', 1], ['B2', 1], ['E2', 1], ['E2', 1],
      ] },
    ] },
    city: { bpm: 132, tracks: [
      { wave: 'square', vol: .12, notes: [
        ['D4', .5], ['F4', .5], ['A4', .5], ['D5', .5], ['C5', .5], ['A4', .5], ['F4', .5], ['A4', .5],
        ['G4', .5], ['Bb4', .5], ['D5', .5], ['G5', .5], ['F5', .5], ['D5', .5], ['Bb4', .5], ['D5', .5],
        ['A4', .5], ['C5', .5], ['E5', .5], ['A5', .5], ['G5', .5], ['E5', .5], ['C5', .5], ['E5', .5],
        ['D5', 1], ['C5', .5], ['A4', .5], ['F4', 1], ['D4', 1],
        ['D5', .5], ['D5', .5], ['E5', .5], ['F5', .5], ['E5', .5], ['D5', .5], ['C5', 1],
        ['Bb4', .5], ['Bb4', .5], ['C5', .5], ['D5', .5], ['C5', .5], ['Bb4', .5], ['A4', 1],
        ['G4', .5], ['A4', .5], ['Bb4', .5], ['C5', .5], ['D5', .5], ['E5', .5], ['F5', .5], ['E5', .5],
        ['D5', 2], [0, 2],
      ] },
      { wave: 'triangle', vol: .2, notes: [
        ['D2', .5], ['D3', .5], ['D2', .5], ['D3', .5], ['D2', .5], ['D3', .5], ['D2', .5], ['D3', .5],
        ['G2', .5], ['G3', .5], ['G2', .5], ['G3', .5], ['G2', .5], ['G3', .5], ['G2', .5], ['G3', .5],
        ['A2', .5], ['A3', .5], ['A2', .5], ['A3', .5], ['A2', .5], ['A3', .5], ['A2', .5], ['A3', .5],
        ['D2', .5], ['D3', .5], ['D2', .5], ['D3', .5], ['D2', .5], ['D3', .5], ['D2', .5], ['D3', .5],
        ['Bb2', .5], ['Bb3', .5], ['Bb2', .5], ['Bb3', .5], ['Bb2', .5], ['Bb3', .5], ['Bb2', .5], ['Bb3', .5],
        ['G2', .5], ['G3', .5], ['G2', .5], ['G3', .5], ['G2', .5], ['G3', .5], ['G2', .5], ['G3', .5],
        ['A2', .5], ['A3', .5], ['A2', .5], ['A3', .5], ['A2', .5], ['A3', .5], ['A2', .5], ['A3', .5],
        ['D2', .5], ['D3', .5], ['D2', .5], ['D3', .5], ['D2', 1], [0, 1],
      ] },
    ] },
    battle: { bpm: 150, tracks: [
      { wave: 'square', vol: .12, notes: [
        ['E4', .5], ['E4', .5], ['G4', .5], ['E4', .5], ['B4', .5], ['A4', .5], ['G4', .5], ['F#4', .5],
        ['E4', .5], ['E4', .5], ['G4', .5], ['E4', .5], ['D5', .5], ['C5', .5], ['B4', .5], ['A4', .5],
        ['C5', .5], ['C5', .5], ['B4', .5], ['A4', .5], ['G4', .5], ['A4', .5], ['B4', 1],
        ['A4', .5], ['G4', .5], ['F#4', .5], ['E4', .5], ['D#4', 1], ['E4', 1],
      ] },
      { wave: 'sawtooth', vol: .08, notes: [
        ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25], ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25],
        ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25], ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25],
        ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25], ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25],
        ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25], ['E2', .25], ['E2', .25], ['E3', .25], ['E2', .25],
        ['C2', .25], ['C2', .25], ['C3', .25], ['C2', .25], ['C2', .25], ['C2', .25], ['C3', .25], ['C2', .25],
        ['A2', .25], ['A2', .25], ['A3', .25], ['A2', .25], ['B2', .25], ['B2', .25], ['B3', .25], ['B2', .25],
        ['A2', .25], ['A2', .25], ['A3', .25], ['A2', .25], ['B2', .25], ['B2', .25], ['B3', .25], ['B2', .25],
        ['B2', .25], ['B2', .25], ['B3', .25], ['B2', .25], ['E2', .5], ['E2', .5],
      ] },
    ] },
    interior: { bpm: 84, tracks: [
      { wave: 'triangle', vol: .16, notes: [
        ['G4', 1], ['B4', 1], ['D5', 2], ['C5', 1], ['B4', 1], ['A4', 2],
        ['B4', 1], ['G4', 1], ['A4', 2], ['G4', 1], ['F#4', 1], ['G4', 2],
      ] },
      { wave: 'sine', vol: .18, notes: [['G2', 4], ['A2', 4], ['E2', 4], ['D2', 2], ['G2', 2]] },
    ] },
    gate: { bpm: 120, tracks: [
      { wave: 'square', vol: .12, notes: [
        ['D4', 1], ['D4', .5], ['D4', .5], ['F4', 1], ['A4', 1], ['G4', .5], ['F4', .5], ['E4', 1], ['D4', 2],
        ['A4', 1], ['A4', .5], ['A4', .5], ['C5', 1], ['D5', 1], ['C5', .5], ['Bb4', .5], ['A4', 1], ['G4', 2],
        ['F4', .5], ['G4', .5], ['A4', .5], ['Bb4', .5], ['A4', .5], ['G4', .5], ['F4', .5], ['E4', .5], ['D4', 2], ['C#4', 1], ['D4', 1],
      ] },
      { wave: 'triangle', vol: .2, notes: [
        ['D2', 1], ['D2', 1], ['D2', 1], ['D2', 1], ['Bb2', 1], ['Bb2', 1], ['A2', 1], ['A2', 1],
        ['F2', 1], ['F2', 1], ['F2', 1], ['F2', 1], ['G2', 1], ['G2', 1], ['A2', 1], ['A2', 1],
        ['D2', 1], ['D2', 1], ['Bb2', 1], ['Bb2', 1], ['A2', 1], ['A2', 1], ['A2', 1], ['D2', 1],
      ] },
    ] },
  };

  function trackLen(t) { return t.notes.reduce((s, n) => s + n[1], 0); }
  function play(name) {
    if (current === name) return;
    stop();
    current = name;
    if (!ensure() || !SONGS[name]) return;
    const song = SONGS[name];
    const beat = 60 / song.bpm;
    // every song plays through its own bus, so a switch can fade the old one out
    const myBus = ctx.createGain(); myBus.gain.setValueAtTime(0, ctx.currentTime); myBus.gain.linearRampToValueAtTime(MUSIC_GAIN, ctx.currentTime + .4); myBus.connect(master);
    bus = myBus;
    // per-track playheads: schedule only the notes that fall within a short lookahead
    const heads = song.tracks.map(tr => ({ tr, i: 0, t: ctx.currentTime + .08 }));
    const LOOKAHEAD = 0.6;
    const schedule = () => {
      if (current !== name || bus !== myBus) return;
      const horizon = ctx.currentTime + LOOKAHEAD;
      for (const h of heads) {
        while (h.t < horizon) {
          const [n, b] = h.tr.notes[h.i];
          if (n) tone(freq(n), h.t, b * beat * .92, { wave: h.tr.wave, vol: h.tr.vol, out: myBus });
          h.t += b * beat; h.i = (h.i + 1) % h.tr.notes.length;
        }
      }
      timer = setTimeout(schedule, 150);
    };
    schedule();
  }
  function stop() {
    current = null; if (timer) { clearTimeout(timer); timer = null; }
    if (bus && ctx) { const old = bus; bus = null; old.gain.cancelScheduledValues(ctx.currentTime); old.gain.setValueAtTime(old.gain.value, ctx.currentTime); old.gain.linearRampToValueAtTime(0, ctx.currentTime + .35); setTimeout(() => old.disconnect(), 600); }
  }
  function setEnabled(on) { enabled = on; if (master) master.gain.setTargetAtTime(on ? .5 : 0, ctx.currentTime, .05); }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  const SFX = {
    blip: () => tone(880, now(), .05, { vol: .12 }),
    confirm: () => { tone(660, now(), .06, { vol: .12 }); tone(990, now() + .06, .08, { vol: .12 }); },
    cancel: () => { tone(440, now(), .08, { vol: .1, slide: -200 }); },
    correct: () => ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freq(n), now() + i * .07, .12, { vol: .14 })),
    wrong: () => { tone(220, now(), .25, { wave: 'sawtooth', vol: .12, slide: -120 }); tone(110, now() + .05, .3, { wave: 'square', vol: .08, slide: -60 }); },
    encounter: () => { for (let i = 0; i < 6; i++) tone(900 - i * 120, now() + i * .05, .06, { vol: .14 }); noise(now(), .3, .12); },
    heal: () => ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => { tone(freq(n), now() + i * .08, .18, { vol: .12 }); tone(freq(n), now() + i * .08 + .2, .18, { vol: .06 }); }),
    fanfare: () => { const s = [['C5', 0, .12], ['C5', .14, .12], ['C5', .28, .12], ['E5', .42, .3], ['G5', .72, .3], ['C6', 1.02, .6]]; s.forEach(([n, d, l]) => { tone(freq(n), now() + d, l, { vol: .14 }); tone(freq(n) / 2, now() + d, l, { wave: 'triangle', vol: .12 }); }); },
    register: () => ['E6', 'G6', 'B6', 'E7', 'B6', 'E7'].forEach((n, i) => tone(freq(n), now() + i * .05, .1, { wave: 'triangle', vol: .12 })),
    rustle: () => noise(now(), .08, .07),
    hit: () => { noise(now(), .12, .12); tone(140, now(), .15, { wave: 'square', vol: .1, slide: -80 }); },
    exclaim: () => { tone(1200, now(), .08, { vol: .14 }); tone(1600, now() + .09, .14, { vol: .14 }); },
    door: () => { noise(now(), .1, .08); tone(300, now(), .1, { wave: 'triangle', vol: .1, slide: 200 }); },
    save: () => ['G5', 'C6'].forEach((n, i) => tone(freq(n), now() + i * .1, .15, { vol: .12 })),
  };
  function now() { return ctx ? ctx.currentTime : 0; }
  function sfx(name) { if (!ensure()) return; resume(); if (SFX[name]) SFX[name](); }

  return { play, stop, sfx, setEnabled, ensure, resume, get enabled() { return enabled; } };
})();
