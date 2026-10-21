/**
 * Entry point: waits for web fonts (max 2.5s), then boots Phaser.
 */
function createGame() {
  const dims = GameConfig.getDimensions();

  const config = {
    type: Phaser.AUTO,
    width: dims.width,
    height: dims.height,
    parent: 'game-container',
    backgroundColor: '#140f2d',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      roundPixels: false,
    },
    input: {
      activePointers: 2,
    },
    // TransitionScene is last so it always renders on top.
    scene: [PreloadScene, MenuScene, GameScene, ResultsScene, TransitionScene],
  };

  const game = new Phaser.Game(config);

  // Auto orientation: re-layout when the window flips shape while on the menu.
  // (Mid-round the layout is kept; the menu catches up when the player returns.)
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const menu = game.scene.getScene('MenuScene');
      if (menu && game.scene.isActive('MenuScene')) menu.applyOrientation();
    }, 250);
  });

  return game;
}

function waitForFonts(timeoutMs = 2500) {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const loads = Promise.all([
    document.fonts.load('64px "Lilita One"'),
    document.fonts.load('900 32px "Nunito"'),
  ]).catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([loads, timeout]);
}

window.phaserGame = null;
window.addEventListener('DOMContentLoaded', () => {
  waitForFonts().then(() => {
    window.phaserGame = createGame();
  });
});
