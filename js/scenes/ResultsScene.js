/**
 * ResultsScene: star rating, score count-up, round stats, best-score
 * badge, confetti and replay buttons.
 */
class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data) {
    this.result = {
      score: 0,
      total: 10,
      firstTry: 0,
      bestStreak: 0,
      hintsUsed: 0,
      mode: GameConfig.get('gameMode'),
      roundLength: GameConfig.get('roundLength'),
      ...(data || {}),
    };
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const land = w > h;
    const r = this.result;
    const cx = w / 2;

    const accuracy = r.total ? r.firstTry / r.total : 0;
    const stars = accuracy >= 0.85 ? 3 : accuracy >= 0.6 ? 2 : 1;
    this.isBest = GameConfig.submitScore(r.mode, r.roundLength, r.score);
    const titles = { 3: 'PUN-STOPPABLE!', 2: 'GREAT GAME!', 1: 'ROUND COMPLETE!' };

    const panelW = land ? 980 : 940;
    const panelH = land ? 900 : 1180;
    const top = h / 2 - panelH / 2;

    this.bg = new AnimatedBackground(this, { raysX: cx, raysY: top + 190, raysAlpha: 0.12 });
    this.fx = new Effects(this);

    // Panel
    const panel = this.add.container(cx, h / 2).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(-panelW / 2 + 10, -panelH / 2 + 18, panelW, panelH, 40);
    g.fillStyle(Theme.C.ink, 0.92).fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 40);
    g.lineStyle(6, Theme.C.gold, 1).strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 40);
    g.lineStyle(2, Theme.C.coral, 0.8).strokeRoundedRect(-panelW / 2 + 16, -panelH / 2 + 16, panelW - 32, panelH - 32, 30);
    panel.add(g);
    panel.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 450, ease: 'Back.out' });

    // Stars
    const starY = top + (land ? 150 : 190);
    const starGap = land ? 170 : 190;
    for (let i = 0; i < 3; i++) {
      const sx = cx + (i - 1) * starGap;
      const sy = starY + (i === 1 ? -26 : 0);
      const size = i === 1 ? 92 : 76;
      this.add.star(sx, sy + 6, 5, size * 0.48, size, 0x000000, 0.35).setDepth(20);
      this.add.star(sx, sy, 5, size * 0.48, size, 0x3a2e7a).setDepth(20).setStrokeStyle(5, 0x5b4fa0);
      if (i < stars) {
        const st = this.add.star(sx, sy, 5, size * 0.48, size, Theme.C.gold).setDepth(21).setStrokeStyle(6, 0xc98f12);
        st.setScale(0).setAngle(-120);
        this.tweens.add({
          targets: st,
          scale: 1,
          angle: 0,
          duration: 520,
          delay: 600 + i * 300,
          ease: 'Back.out',
          onStart: () => {
            Sfx.star(i);
            this.time.delayedCall(260, () => {
              this.fx.sparkle(sx, sy, 16);
              if (Utils.motionOK()) this.cameras.main.shake(90, 0.003);
            });
          },
        });
      }
    }

    // Title
    const titleY = starY + (land ? 150 : 170);
    const title = this.add
      .text(cx, titleY, titles[stars], Theme.display(land ? 92 : 96, Theme.HEX.gold))
      .setOrigin(0.5)
      .setDepth(20)
      .setScale(0);
    title.setShadow(0, 8, 'rgba(0,0,0,0.4)', 0, true, true);
    this.tweens.add({ targets: title, scale: 1, duration: 500, delay: 350, ease: 'Back.out' });
    Music.play('menu');

    // Score count-up
    const scoreY = titleY + (land ? 130 : 160);
    this.add.text(cx, scoreY - 62, 'FINAL SCORE', Theme.body(28, Theme.HEX.muted)).setOrigin(0.5).setDepth(20);
    const scoreText = this.add.text(cx, scoreY + 10, '0', Theme.display(110, Theme.HEX.white)).setOrigin(0.5).setDepth(20);
    this.tweens.addCounter({
      from: 0,
      to: r.score,
      duration: 1400,
      delay: 1500,
      ease: 'Cubic.out',
      onUpdate: (tw) => {
        scoreText.setText(Utils.formatNumber(tw.getValue()));
        if (Math.random() < 0.3) Sfx.tick();
      },
      onComplete: () => {
        this.tweens.add({ targets: scoreText, scale: 1.15, duration: 140, yoyo: true });
        if (this.isBest) this._showBestBadge(cx + 260, scoreY - 50);
        if (stars >= 2) {
          Sfx.fanfare();
          this.fx.rain(stars === 3 ? 3000 : 1500);
        }
      },
    });

    // Stats grid
    const stats = [
      ['FIRST TRY', `${r.firstTry} / ${r.total}`, Theme.HEX.green],
      ['ACCURACY', `${Math.round(accuracy * 100)}%`, Theme.HEX.teal],
      ['BEST STREAK', `${r.bestStreak}`, Theme.HEX.coral],
      ['HINTS USED', `${r.hintsUsed}`, Theme.HEX.gold],
    ];
    const cols = land ? 4 : 2;
    const cellW = land ? 205 : 400;
    const cellH = 130;
    const gridTop = scoreY + (land ? 130 : 170);
    stats.forEach(([label, value, color], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cx + (col - (cols - 1) / 2) * (cellW + 18);
      const y = gridTop + row * (cellH + 18);
      const cell = this.add.container(x, y).setDepth(20);
      const cg = this.add.graphics();
      cg.fillStyle(Theme.C.navy, 1).fillRoundedRect(-cellW / 2, -cellH / 2, cellW, cellH, 22);
      cg.lineStyle(3, 0xffffff, 0.12).strokeRoundedRect(-cellW / 2, -cellH / 2, cellW, cellH, 22);
      const v = this.add.text(0, -14, value, Theme.display(52, color)).setOrigin(0.5);
      const l = this.add.text(0, 40, label, Theme.body(20, Theme.HEX.muted)).setOrigin(0.5);
      cell.add([cg, v, l]);
      cell.setScale(0);
      this.tweens.add({ targets: cell, scale: 1, duration: 380, delay: 1700 + i * 110, ease: 'Back.out' });
    });

    // Buttons
    const btnY = top + panelH - (land ? 110 : 130);
    const modeLabel = GameConfig.modeLabel(r.mode);
    this.add
      .text(cx, btnY - 110, `${modeLabel}  ·  ${r.total} cards`, Theme.body(24, Theme.HEX.muted))
      .setOrigin(0.5)
      .setDepth(20);
    const btnSize = 130;
    const again = new IconButton(this, cx - 110, btnY, {
      icon: 'replay',
      size: btnSize,
      color: Theme.C.coral,
      onClick: () => TransitionScene.go(this, 'GameScene'),
    }).setDepth(30);
    const menu = new IconButton(this, cx + 110, btnY, {
      icon: 'home',
      size: btnSize,
      color: Theme.C.violet,
      onClick: () => TransitionScene.go(this, 'MenuScene'),
    }).setDepth(30);
    [again, menu].forEach((b, i) => {
      b.setScale(0);
      this.tweens.add({ targets: b, scale: 1, duration: 420, delay: 2300 + i * 100, ease: 'Back.out' });
    });

    this.input.keyboard.on('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') TransitionScene.go(this, 'GameScene');
      if (e.key === 'Escape') TransitionScene.go(this, 'MenuScene');
    });
  }

  _showBestBadge(x, y) {
    const badge = this.add.container(x, y).setDepth(40).setScale(0).setAngle(-14);
    const g = this.add.graphics();
    g.fillStyle(Theme.C.coral, 1).fillRoundedRect(-110, -34, 220, 68, 34);
    g.fillStyle(0xffffff, 0.2).fillRoundedRect(-100, -28, 200, 20, 10);
    const t = this.add.text(0, 0, 'NEW BEST!', Theme.display(38, Theme.HEX.white)).setOrigin(0.5);
    badge.add([g, t]);
    Sfx.combo(4);
    this.tweens.add({ targets: badge, scale: 1, duration: 420, ease: 'Back.out' });
    this.tweens.add({ targets: badge, angle: -8, duration: 500, yoyo: true, repeat: -1, delay: 420, ease: 'Sine.inOut' });
  }
}
