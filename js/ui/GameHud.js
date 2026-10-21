/**
 * GameHud: top bar - home + settings icons (left), progress pips (centre)
 * and the score pill (right). Sound and music are switched in Settings.
 * Works in both orientations.
 */
class GameHud {
  constructor(scene, { total, onMenu, onSettings }) {
    this.scene = scene;
    this.total = total;
    this.displayScore = 0;
    const w = scene.scale.width;
    const land = Utils.isLandscape(scene);
    const y = land ? 62 : 70;
    const size = 82;
    this.depth = 60;

    // Left: home + settings
    this.homeBtn = new IconButton(scene, 56, y, { icon: 'home', size, color: Theme.C.violet, onClick: onMenu }).setDepth(this.depth);
    this.gearBtn = new IconButton(scene, 150, y, { icon: 'gear', size, color: Theme.C.violet, onClick: onSettings }).setDepth(this.depth);

    // Score pill
    const pillR = w - 24;
    const pillW = 290;
    this.scorePill = scene.add.graphics().setDepth(this.depth);
    this.scorePill.fillStyle(Theme.C.ink, 0.75);
    this.scorePill.fillRoundedRect(pillR - pillW, y - 36, pillW, 72, 36);
    this.scorePill.lineStyle(3, Theme.C.gold, 0.6);
    this.scorePill.strokeRoundedRect(pillR - pillW, y - 36, pillW, 72, 36);
    const star = scene.add.graphics({ x: pillR - pillW + 44, y }).setDepth(this.depth);
    Icons.draw(star, 'star', 50, Theme.C.gold);
    this.scoreText = scene.add
      .text(pillR - 28, y + 2, '0', Theme.display(44, Theme.HEX.white))
      .setOrigin(1, 0.5)
      .setDepth(this.depth);
    this.scoreTarget = { x: pillR - 90, y };

    // Combo badge (under the score)
    this.comboBadge = scene.add.container(pillR - pillW / 2, y + 74).setDepth(this.depth).setScale(0);
    const cb = scene.add.graphics();
    cb.fillStyle(Theme.C.coral, 1);
    cb.fillRoundedRect(-120, -26, 240, 52, 26);
    cb.fillStyle(0xffffff, 0.18);
    cb.fillRoundedRect(-112, -20, 224, 16, 8);
    this.comboText = scene.add.text(0, 0, 'COMBO x1.5', Theme.display(30, Theme.HEX.white)).setOrigin(0.5);
    this.comboBadge.add([cb, this.comboText]);

    // Progress pips
    const pipsY = land ? y : y + 92;
    const avail = land ? Math.min(820, w - 2 * 560) : w - 140;
    this.pipGap = Math.min(46, avail / Math.max(1, total));
    const startX = w / 2 - ((total - 1) * this.pipGap) / 2;
    this.pips = [];
    for (let i = 0; i < total; i++) {
      const pip = scene.add.circle(startX + i * this.pipGap, pipsY, Math.min(13, this.pipGap * 0.34), 0xffffff, 0.22);
      pip.setDepth(this.depth);
      this.pips.push(pip);
    }
    this.cardLabel = scene.add
      .text(w / 2, pipsY + 36, '', Theme.body(22, Theme.HEX.muted))
      .setOrigin(0.5)
      .setDepth(this.depth);
    this.bottomY = pipsY + 60;
  }

  /** Lets the scene move the combo badge (portrait puts it on the card corner). */
  placeCombo(x, y) {
    this.comboBadge.setPosition(x, y);
  }

  /** Kept for the scene's settings hook; audio toggles now live only in Settings. */
  refreshAudio() {}

  setCurrent(index) {
    const pip = this.pips[index];
    if (!pip) return;
    pip.setFillStyle(Theme.C.white, 1);
    if (Utils.motionOK()) this.scene.tweens.add({ targets: pip, scale: { from: 1, to: 1.45 }, duration: 520, yoyo: true, repeat: -1 });
    this.cardLabel.setText(`CARD ${index + 1} OF ${this.total}`);
  }

  /** result: 'perfect' | 'assisted' | 'missed' */
  markPip(index, result) {
    const pip = this.pips[index];
    if (!pip) return;
    this.scene.tweens.killTweensOf(pip);
    const fb = Theme.feedback();
    const color = result === 'perfect' ? fb.correct : result === 'assisted' ? fb.assisted : fb.wrong;
    pip.setFillStyle(color, 1);
    // Colour assist: a mark on the dot too (✓ first try, ✗ missed)
    if (GameConfig.get('colorAssist') && result !== 'assisted') {
      const r = pip.radius;
      const m = this.scene.add.graphics({ x: pip.x, y: pip.y }).setDepth(this.depth + 1);
      Icons.draw(m, result === 'perfect' ? 'check' : 'cross', r * 1.5, Theme.C.ink);
      this.scene.tweens.add({ targets: m, scale: { from: 1.8, to: 1 }, duration: 300, ease: 'Back.out' });
    }
    pip.setScale(1.8);
    this.scene.tweens.add({ targets: pip, scale: 1, duration: 300, ease: 'Back.out' });
  }

  setScore(score) {
    this.scene.tweens.addCounter({
      from: this.displayScore,
      to: score,
      duration: 600,
      ease: 'Cubic.out',
      onUpdate: (tw) => {
        this.displayScore = tw.getValue();
        this.scoreText.setText(Utils.formatNumber(this.displayScore));
      },
    });
    this.scene.tweens.add({ targets: this.scoreText, scale: 1.25, duration: 120, yoyo: true, ease: 'Quad.out' });
  }

  setCombo(streak, multiplier) {
    this.scene.tweens.killTweensOf(this.comboBadge);
    if (streak >= 2) {
      this.comboText.setText(`COMBO x${multiplier}`);
      this.comboBadge.setScale(1.4);
      this.scene.tweens.add({ targets: this.comboBadge, scale: 1, duration: 320, ease: 'Back.out' });
      if (Utils.motionOK()) {
        this.scene.tweens.add({
          targets: this.comboBadge,
          angle: { from: -3, to: 3 },
          duration: 300,
          yoyo: true,
          repeat: -1,
          delay: 320,
        });
      }
    } else {
      this.comboBadge.setAngle(0);
      this.scene.tweens.add({ targets: this.comboBadge, scale: 0, duration: 200, ease: 'Back.in' });
    }
  }
}
