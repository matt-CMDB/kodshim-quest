/* Kodshim Quest — pixel-drawn UI chrome.
   9-slice frames and the menu cursor are rasterised once at an exact pixel
   scale and handed to CSS as data URLs, so the boxes look drawn, not styled. */
window.UI = (function () {
  const PX = 3;                       // screen pixels per frame pixel
  const N = 22, B = 6;                // frame source size and border width (frame pixels)
  function png(draw, w, h, px = PX) {
    const c = document.createElement('canvas'); c.width = w * px; c.height = h * px;
    const g = c.getContext('2d');
    const put = (x, y, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x * px, y * px, px, px); };
    draw(put);
    return c.toDataURL();
  }
  function frame(pal) {
    return png(put => {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const d = Math.min(x, y, N - 1 - x, N - 1 - y);
        const cx = x < 2 || x > N - 3, cy = y < 2 || y > N - 3;
        let col;
        if (d === 0) col = (cx && cy) ? null : pal.outline;           // rounded-off corner
        else if (d === 1) col = (cx && cy) ? pal.outline : pal.light;
        else if (d === 2) col = pal.mid;
        else if (d === 3) col = pal.mid2;
        else if (d === 4) col = pal.dark;
        else if (d === 5) col = pal.inner;
        else col = pal.fill;
        // corner rivets
        if ((x === 3 || x === N - 4) && (y === 3 || y === N - 4)) col = pal.light;
        put(x, y, col);
      }
    }, N, N);
  }
  const DARK = frame({ outline: '#120f1c', light: '#f7e7bd', mid: '#d2ad5e', mid2: '#9d7a33', dark: '#120f1c', inner: '#2a2f4e', fill: 'rgba(14,18,36,.93)' });
  const PAPER = frame({ outline: '#3a2a14', light: '#fbf1d8', mid: '#caa874', mid2: '#8e6c3a', dark: '#3a2a14', inner: '#e3d2a8', fill: '#efe3c3' });
  const BLUE = frame({ outline: '#120f1c', light: '#e9f3ff', mid: '#7ea7e0', mid2: '#2f4f8a', dark: '#120f1c', inner: '#223a66', fill: 'rgba(16,28,60,.93)' });
  const CURSOR = png(put => {
    const rows = ['k.......', 'kk......', 'kgk.....', 'kggk....', 'kgggk...', 'kggggk..', 'kgggggk.', 'kggggggk', 'kgggggk.', 'kggggk..', 'kgggk...', 'kggk....', 'kgk.....', 'kk......', 'k.......'];
    rows.forEach((r, y) => [...r].forEach((ch, x) => put(x, y, ch === 'k' ? '#120f1c' : ch === 'g' ? '#f2c94c' : null)));
  }, 8, 15, 2);
  const HEART_PX = PX;
  const root = document.documentElement.style;
  root.setProperty('--frame-dark', `url(${DARK})`);
  root.setProperty('--frame-paper', `url(${PAPER})`);
  root.setProperty('--frame-blue', `url(${BLUE})`);
  root.setProperty('--cursor', `url(${CURSOR})`);
  root.setProperty('--fb', (B * PX) + 'px');       // CSS border width that matches the slice
  root.setProperty('--fslice', String(B * PX));
  return { DARK, PAPER, BLUE, CURSOR, PX };
})();
