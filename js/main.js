/* Kodshim Quest — bootstrap */
(function () {
  const start = () => window.Game.boot();
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 16px "Pixelify Sans"'), document.fonts.load('400 16px Alegreya'), document.fonts.load('700 16px Cinzel'), document.fonts.load('500 16px "Frank Ruhl Libre"')]).catch(() => {}).finally(start);
  } else start();
})();
