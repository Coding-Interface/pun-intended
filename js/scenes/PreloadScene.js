/**
 * PreloadScene: splash + loader.
 *  1. The logo tiles bounce in over the animated background (splash).
 *  2. All card art loads behind a candy-striped progress bar with a
 *     flipping card and a live percentage.
 *  3. A big round PLAY button - the tap also unlocks audio (browsers
 *     require a gesture) and starts the music.
 *
 * Loading is started from create() (not preload()) so the scene is
 * running and its tweens animate while files download.
 */
class PreloadScene extends Phaser.Scene {
  static MIN_SHOW_MS = 1800; // keep the splash up at least this long

  constructor() {
    super({ key: 'PreloadScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.land = w > h;
    new TextureFactory(this).buildUi();

    const logoY = this.land ? [230, 360] : [520, 660];
    this.barY = this.land ? 760 : 1260;
    this.barW = Math.min(this.land ? 760 : 820, w - 160);

    new AnimatedBackground(this, { raysX: w / 2, raysY: logoY[1], raysAlpha: 0.1 });
    this._buildLogo(w, logoY, this.land ? 100 : 112);
    this._buildCard(w, this.land ? 560 : 950);
    this._buildBar(w);
    this._hideHtmlSplash();

    // Queue every asset
    Object.entries(CARD_SHEETS).forEach(([key, sheet]) => this.load.image(`sheet_${key}`, sheet.file));
    CARDS_DATA.filter((c) => c.image).forEach((c) => this.load.image(`card_src_${c.id}`, c.image));

    this.loadProgress = 0;
    this.shown = 0;
    this.startTime = this.time.now;
    this.loaded = false;
    this.load.on('progress', (v) => (this.loadProgress = v));
    this.load.once('complete', () => {
      new TextureFactory(this).buildCardFaces();
      this.loaded = true;
    });
    this.load.start();

    this.scene.launch('TransitionScene');
  }

  update() {
    if (this.ready) return;
    // Smooth display: never faster than the real load, never faster than MIN_SHOW_MS
    const timeCap = (this.time.now - this.startTime) / PreloadScene.MIN_SHOW_MS;
    const target = Math.min(this.loaded ? 1 : this.loadProgress * 0.98, timeCap);
    this.shown += (target - this.shown) * 0.12;
    if (target - this.shown < 0.002) this.shown = target;
    this._drawBar(this.shown);
    this.stripes.tilePositionX -= 2.2;
    if (this.loaded && this.shown >= 0.999) this._onReady();
  }

  /* ---------------- Pieces ---------------- */

  _buildLogo(w, ys, size) {
    const rows = [
      { word: 'PUN', styles: ['coral', 'gold', 'teal'], size: size * 1.15 },
      { word: 'INTENDED', styles: null, size },
    ];
    let n = 0;
    this.logoTiles = [];
    rows.forEach((row, r) => {
      const pitch = row.size * 1.1;
      const startX = w / 2 - ((row.word.length - 1) * pitch) / 2;
      row.word.split('').forEach((ch, i) => {
        // Starts in place (the HTML splash shows the same logo), so there is no drop-in:
        // tiles fade and settle over the splash while it fades out.
        const tile = new LetterTile(this, startX + i * pitch, ys[r], ch, row.size, {
          style: row.styles ? row.styles[i] : 'normal',
          interactive: false,
        });
        tile.setAngle(Phaser.Math.Between(-6, 6)).setDepth(20).setAlpha(0).setScale(0.92);
        this.tweens.add({
          targets: tile,
          alpha: 1,
          scale: 1,
          duration: 380,
          delay: 40 + n * 25,
          ease: 'Quad.out',
          onComplete: () => {
            if (Utils.motionOK())
              this.tweens.add({ targets: tile, y: ys[r] - 10, duration: 900, delay: i * 110, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          },
        });
        this.logoTiles.push(tile);
        n++;
      });
    });
    this.tagline = this.add
      .text(w / 2, ys[1] + size * 1.05, 'Read the picture. Crack the pun.', Theme.body(this.land ? 34 : 40, Theme.HEX.cream))
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);
    this.tweens.add({ targets: this.tagline, alpha: 1, duration: 400, delay: 250 });
  }

  /** A card that keeps flipping while we load - the "spinner". */
  _buildCard(w, y) {
    const card = this.add.image(w / 2, y, 'card_back').setDepth(15);
    card.setScale(150 / card.height);
    const base = card.scaleX;
    card.setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 400, delay: 700 });
    this.tweens.add({ targets: card, scaleX: { from: base, to: -base }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: card, y: y - 14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.spinnerCard = card;
  }

  _buildBar(w) {
    const x0 = w / 2 - this.barW / 2;
    const y = this.barY;
    const hh = 46;
    this.barX0 = x0;
    this.barH = hh;

    this.track = this.add.graphics().setDepth(20);
    this.track.fillStyle(0x000000, 0.35).fillRoundedRect(x0 - 8, y - hh / 2 - 8 + 8, this.barW + 16, hh + 16, (hh + 16) / 2);
    this.track.fillStyle(Theme.C.ink, 1).fillRoundedRect(x0 - 8, y - hh / 2 - 8, this.barW + 16, hh + 16, (hh + 16) / 2);

    this.stripes = this.add.tileSprite(x0, y - hh / 2, this.barW, hh, 'stripes').setOrigin(0).setDepth(21);
    this.maskGfx = this.make.graphics({ add: false });
    this.stripes.setMask(this.maskGfx.createGeometryMask());

    this.shine = this.add.graphics().setDepth(22);
    this.rider = this.add.star(x0, y - hh / 2 - 4, 5, 12, 26, Theme.C.gold).setStrokeStyle(4, Theme.C.ink).setDepth(23);
    this.tweens.add({ targets: this.rider, angle: 360, duration: 1600, repeat: -1 });

    this.pct = this.add.text(w / 2, y + 62, 'LOADING  0%', Theme.display(40, Theme.HEX.white)).setOrigin(0.5).setDepth(22);
    this.loaderParts = [this.track, this.stripes, this.shine, this.rider, this.pct];
    this.loaderParts.forEach((o) => o.setAlpha(0));
    this.tweens.add({ targets: this.loaderParts, alpha: 1, duration: 400, delay: 600 });
  }

  _drawBar(frac) {
    const hh = this.barH;
    const y = this.barY - hh / 2;
    const fw = Math.max(hh, this.barW * frac);
    this.maskGfx.clear();
    this.maskGfx.fillStyle(0xffffff).fillRoundedRect(this.barX0, y, fw, hh, hh / 2);
    this.shine.clear();
    this.shine.fillStyle(0xffffff, 0.3).fillRoundedRect(this.barX0 + 10, y + 6, Math.max(0, fw - 20), 8, 4);
    this.rider.x = this.barX0 + fw;
    this.pct.setText(`LOADING  ${Math.round(frac * 100)}%`);
  }

  _hideHtmlSplash() {
    const splash = document.getElementById('boot-splash');
    if (!splash) return;
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 600);
  }

  /* ---------------- Ready ---------------- */

  _onReady() {
    this.ready = true;
    this._drawBar(1);
    this.pct.setText('READY!');
    Sfx.star(2);
    this.tweens.add({ targets: [this.track, this.stripes, this.shine, this.rider], alpha: 0, duration: 300, delay: 300 });
    this.tweens.add({ targets: this.spinnerCard, alpha: 0, duration: 300, delay: 300 });

    const w = this.scale.width;
    this.playBtn = new IconButton(this, w / 2, this.barY, {
      icon: 'play',
      size: this.land ? 170 : 190,
      color: Theme.C.coral,
      iconScale: 0.55,
      onClick: () => this._start(),
    }).setDepth(30);
    this.playBtn.setScale(0);
    this.tweens.add({ targets: this.pct, alpha: 0, duration: 200, delay: 500 });
    this.tweens.add({
      targets: this.playBtn,
      scale: 1,
      duration: 450,
      delay: 450,
      ease: 'Back.out',
      onComplete: () => this.tweens.add({ targets: this.playBtn, scale: 1.06, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' }),
    });

    // Tap anywhere / Enter / Space also starts
    this.time.delayedCall(500, () => {
      this.input.once('pointerup', () => this._start());
      this.input.keyboard.once('keydown', () => this._start());
    });
  }

  _start() {
    if (this.starting) return;
    this.starting = true;
    Sfx.unlock();
    Sfx.click();
    Music.play('menu');
    this.logoTiles.forEach((t, i) => t.jump(i * 30));
    TransitionScene.go(this, 'MenuScene');
  }
}
