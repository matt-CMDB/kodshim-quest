/* Kodshim Quest — bootstrap */
(function () {
  const start = () => window.Game.boot();
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 16px "Pixelify Sans"'), document.fonts.load('500 16px Rubik')]).catch(() => {}).finally(start);
  } else start();
})();
