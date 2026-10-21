/**
 * MenuScene: title screen. Bouncing tile logo, a fanned hand of cards,
 * icon mode picker, big round PLAY button, plus How to Play and Settings
 * icon buttons (sound, music and accessibility live in Settings).
 * The layout always follows the device orientation.
 * The first PLAY in each mode runs that mode's guided tutorial.
 */
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Device rotated while away from the menu? Re-size first, then lay out.
    const dims = GameConfig.getDimensions();
    if (dims.width !== this.scale.width || dims.height !== this.scale.height) {
      this.game.scale.setGameSize(dims.width, dims.height);
      this.game.scale.refresh();
    }
    const w = this.scale.width;
    const h = this.scale.height;
    this.land = w > h;
    this.leaving = false;
    this.panel = null;

    const L = this.land
      ? {
          fan: { x: w * 0.215, y: h * 0.56, cardH: 520, spread: 96 },
          col: w * 0.71,
          logoY: [180, 306],
          logoSize: 96,
          tagY: 405,
          modeY: 525,
          modeSize: 140,
          modeGap: 80,
          playY: 760,
          playSize: 170,
          bestY: 880,
          rowY: 985,
          iconSize: 84,
          iconGap: 24,
        }
      : {
          fan: { x: w / 2, y: 870, cardH: 460, spread: 100 },
          col: w / 2,
          logoY: [200, 330],
          logoSize: 104,
          tagY: 440,
          modeY: 1280,
          modeSize: 156,
          modeGap: 90,
          playY: 1545,
          playSize: 190,
          bestY: 1680,
          rowY: 1800,
          iconSize: 96,
          iconGap: 30,
        };
    this.L = L;

    this.bg = new AnimatedBackground(this, { raysX: L.fan.x, raysY: L.fan.y, raysAlpha: 0.08 });
    this.fx = new Effects(this);

    this._buildFan(L.fan);
    this._buildLogo(L);
    this._buildModePicker(L);
    this._buildPlay(L);
    this._buildIconRow(L);

    this.input.keyboard.on('keydown', (e) => {
      if (this.panel) return;
      if (e.key === 'Enter' || e.key === ' ') this._play();
    });
    this.input.once('pointerdown', () => Sfx.unlock());
    Music.play('menu');
  }

  /* ---------------- Fan of cards ---------------- */

  _buildFan({ x, y, cardH, spread }) {
    const picks = Utils.shuffle(CARDS_DATA).slice(0, 5);
    const pivotY = y + cardH * 0.62;
    const motion = Utils.motionOK();
    this.fanCards = picks.map((card, i) => {
      const offset = i - 2;
      const img = this.add.image(x + offset * spread, pivotY + Math.abs(offset) * 18, `card_${card.id}`);
      img.setOrigin(0.5, 1);
      const scale = cardH / img.height;
      img.baseAngle = offset * 11;
      img.baseY = img.y;
      img.setScale(scale).setAngle(img.baseAngle).setDepth(5 + (offset === 0 ? 3 : 2 - Math.abs(offset)));
      img.setInteractive({ useHandCursor: true });

      // Fly in from below
      img.y = this.scale.height + cardH;
      img.setAngle(img.baseAngle + Phaser.Math.Between(-40, 40));
      this.tweens.add({
        targets: img,
        y: img.baseY,
        angle: img.baseAngle,
        duration: 700,
        delay: 150 + i * 90,
        ease: 'Back.out',
        onStart: () => Sfx.deal(i),
        onComplete: () => {
          if (!motion) return;
          img.idle = this.tweens.add({
            targets: img,
            angle: img.baseAngle + Phaser.Math.FloatBetween(1.5, 2.5) * (i % 2 ? 1 : -1),
            duration: Phaser.Math.Between(1800, 2600),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
          });
        },
      });

      img.on('pointerover', () => {
        if (this.panel) return;
        Sfx.hover();
        this.tweens.add({ targets: img, y: img.baseY - 50, scale: scale * 1.06, duration: 180, ease: 'Back.out' });
      });
      img.on('pointerout', () => this.tweens.add({ targets: img, y: img.baseY, scale, duration: 220, ease: 'Quad.out' }));
      img.on('pointerdown', () => {
        if (this.panel) return;
        Sfx.flip();
        this.tweens.add({ targets: img, scaleX: { from: scale, to: 0 }, duration: 140, yoyo: true, ease: 'Sine.inOut' });
        this.fx.sparkle(img.x, img.y - cardH * 0.5, 10);
      });
      return img;
    });
  }

  /* ---------------- Logo ---------------- */

  _buildLogo(L) {
    const rows = [
      { word: 'PUN', styles: ['coral', 'gold', 'teal'], size: L.logoSize * 1.15 },
      { word: 'INTENDED', styles: null, size: L.logoSize },
    ];
    const motion = Utils.motionOK();
    let n = 0;
    rows.forEach((row, r) => {
      const pitch = row.size * 1.1;
      const startX = L.col - ((row.word.length - 1) * pitch) / 2;
      row.word.split('').forEach((ch, i) => {
        const tile = new LetterTile(this, startX + i * pitch, L.logoY[r] - 700, ch, row.size, {
          style: row.styles ? row.styles[i] : 'normal',
        });
        tile.setDepth(20).setAngle(Phaser.Math.Between(-6, 6));
        const finalY = L.logoY[r];
        this.tweens.add({
          targets: tile,
          y: finalY,
          duration: 750,
          delay: 250 + n * 70,
          ease: 'Bounce.out',
          onStart: ((k) => () => this.time.delayedCall(420, () => Sfx.pop(k)))(n),
          onComplete: () => {
            if (!motion) return;
            this.tweens.add({ targets: tile, y: finalY - 10, duration: 900, delay: i * 110, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          },
        });
        tile.on('pointerdown', () => {
          if (this.panel) return;
          Sfx.pop(i + 4);
          this.tweens.add({ targets: tile, angle: tile.angle + 360, duration: 500, ease: 'Back.out' });
          this.fx.sparkle(tile.x, tile.y, 8);
        });
        n++;
      });
    });

    const tag = this.add
      .text(L.col, L.tagY, 'Read the picture. Crack the pun.', Theme.body(this.land ? 34 : 38, Theme.HEX.cream))
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);
    this.tweens.add({ targets: tag, alpha: 1, y: L.tagY - 10, duration: 500, delay: 1100 });
  }

  /* ---------------- Mode picker (icons) ---------------- */

  _buildModePicker(L) {
    const modes = [
      { key: 'tiles', icon: 'tiles', label: 'TILES', color: Theme.C.teal },
      { key: 'type', icon: 'keyboard', label: 'KEYBOARD', color: Theme.C.coral },
      { key: 'mcq', icon: 'quiz', label: 'QUIZ', color: Theme.C.sky },
    ];
    this.modeButtons = modes.map((m, i) => {
      const x = L.col + (i - 1) * (L.modeSize + L.modeGap);
      const btn = new IconButton(this, x, L.modeY, {
        icon: m.icon,
        size: L.modeSize,
        shape: 'square',
        color: Theme.C.navy,
        caption: m.label,
        captionSize: 28,
        onClick: () => this._setMode(m.key),
      }).setDepth(20);
      btn.modeKey = m.key;
      btn.activeColor = m.color;
      this._popIn(btn, 900 + i * 90);
      return btn;
    });
    this._refreshModes();
  }

  _setMode(key) {
    GameConfig.set('gameMode', key);
    this._refreshModes();
    this._refreshBest();
  }

  _refreshModes() {
    const mode = GameConfig.get('gameMode');
    this.modeButtons.forEach((b) => {
      const on = b.modeKey === mode;
      b.setColor(on ? b.activeColor : Theme.C.navy).setSelected(on);
      if (b.caption) b.caption.setColor(on ? Theme.HEX.gold : Theme.HEX.cream);
    });
  }

  /* ---------------- Play ---------------- */

  _buildPlay(L) {
    this.playBtn = new IconButton(this, L.col, L.playY, {
      icon: 'play',
      size: L.playSize,
      color: Theme.C.coral,
      iconScale: 0.55,
      onClick: () => this._play(),
    }).setDepth(20);
    this._popIn(this.playBtn, 1250, () => {
      if (!Utils.motionOK()) return;
      this.tweens.add({ targets: this.playBtn, scale: 1.07, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });

    this.bestText = this.add
      .text(L.col, L.bestY, '', Theme.body(this.land ? 30 : 34, Theme.HEX.gold))
      .setOrigin(0.5)
      .setDepth(20);
    this._refreshBest();
  }

  _refreshBest() {
    const best = GameConfig.getBest();
    this.bestText.setText(best > 0 ? `BEST  ${Utils.formatNumber(best)}` : '');
  }

  /* ---------------- Help + settings ---------------- */

  _buildIconRow(L) {
    const size = this.land ? 96 : 108;
    const gap = this.land ? 60 : 80;
    const defs = [
      { key: 'help', icon: 'help', caption: 'HOW TO PLAY', color: Theme.C.gold, iconColor: Theme.C.ink, onClick: () => this._openHelp() },
      { key: 'gear', icon: 'gear', caption: 'SETTINGS', color: Theme.C.violet, onClick: () => this._openSettings() },
    ];
    this.icons = {};
    defs.forEach((d, i) => {
      const x = L.col + (i - 0.5) * (size + gap);
      const btn = new IconButton(this, x, L.rowY - 20, {
        icon: d.icon,
        size,
        color: d.color,
        iconColor: d.iconColor,
        caption: d.caption,
        captionSize: 22,
        onClick: d.onClick,
      }).setDepth(20);
      this.icons[d.key] = btn;
      this._popIn(btn, 1350 + i * 80);
    });
  }

  /** Re-lays out the whole game if the resolved orientation changed. */
  applyOrientation() {
    const dims = GameConfig.getDimensions();
    if (dims.width === this.scale.width && dims.height === this.scale.height) return;
    TransitionScene.go(this, 'MenuScene', {}, () => {
      this.game.scale.setGameSize(dims.width, dims.height);
      this.game.scale.refresh();
    });
  }

  /* ---------------- Panels ---------------- */

  _openSettings() {
    if (this.panel) return;
    this.panel = new SettingsPanel(this, { onClose: () => (this.panel = null) });
  }

  _openHelp() {
    if (this.panel) return;
    this.panel = new HowToPlayPanel(this, {
      onTutorial: () => this._play(true),
      onClose: () => (this.panel = null),
    });
  }

  /* ---------------- Go ---------------- */

  _play(forceTutorial = false) {
    if (this.leaving) return;
    this.leaving = true;
    Sfx.unlock();
    this.fanCards.forEach((c, i) => {
      if (c.idle) c.idle.stop();
      this.tweens.add({ targets: c, y: c.y - 120, angle: c.angle * 2, duration: 300, delay: i * 30, ease: 'Back.in' });
    });
    const tutorial = forceTutorial === true || !GameConfig.isTutorialDone();
    TransitionScene.go(this, 'GameScene', { tutorial });
  }

  _popIn(obj, delay, onDone) {
    obj.setScale(0);
    this.tweens.add({
      targets: obj,
      scale: 1,
      duration: 450,
      delay,
      ease: 'Back.out',
      onComplete: () => onDone && onDone(),
    });
  }
}
