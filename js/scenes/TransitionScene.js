/**
 * TransitionScene: always-on-top overlay that plays a slanted "shutter"
 * wipe between scenes, with a spinning ? medallion in the middle.
 *
 * Usage from any scene:
 *   TransitionScene.go(this, 'GameScene', data);
 *   TransitionScene.go(this, 'MenuScene', null, () => { ...runs while covered... });
 */
class TransitionScene extends Phaser.Scene {
  static BAR_COLORS = [0xff5e5b, 0xffc93c, 0x2ec4b6, 0x3a2e7a, 0xff7eb6, 0x4ea8ff, 0xff5e5b, 0xffc93c];

  constructor() {
    super({ key: 'TransitionScene' });
    this.busy = false;
  }

  static go(fromScene, toKey, data = undefined, whileCovered = null) {
    const t = fromScene.scene.get('TransitionScene');
    t.run(fromScene.scene.key, toKey, data, whileCovered);
  }

  create() {
    this.busy = false;
  }

  _build(covered) {
    if (this.layer) this.layer.destroy();
    const w = this.scale.width;
    const h = this.scale.height;
    const diag = Math.hypot(w, h);
    this.blocker = this.blocker || this.add.zone(0, 0, 10, 10).setOrigin(0).setInteractive();
    this.blocker.setSize(w, h);

    this.layer = this.add.container(w / 2, h / 2).setAngle(-14);
    const n = TransitionScene.BAR_COLORS.length;
    const barW = (diag * 1.05) / n;
    const barH = diag * 1.2;
    this.barTravel = barH;
    this.bars = TransitionScene.BAR_COLORS.map((color, i) => {
      const x = -diag * 0.525 + barW * (i + 0.5);
      const dir = i % 2 === 0 ? -1 : 1;
      const bar = this.add.rectangle(x, covered ? 0 : dir * barH, barW + 3, barH, color);
      bar.dir = dir;
      // Thin highlight stripe
      const stripe = this.add.rectangle(x - barW * 0.32, bar.y, 8, barH, 0xffffff, 0.18);
      bar.stripe = stripe;
      this.layer.add([bar, stripe]);
      return bar;
    });

    // Medallion
    const medal = this.add.container(0, 0).setAngle(14);
    const g = this.add.graphics();
    g.fillStyle(Theme.C.ink, 1).fillCircle(0, 0, 112);
    g.fillStyle(Theme.C.cream, 1).fillCircle(0, 0, 96);
    g.lineStyle(8, Theme.C.gold, 1).strokeCircle(0, 0, 96);
    const q = this.add.text(0, 6, '?', Theme.display(130, Theme.HEX.coral, { strokeThickness: 0 })).setOrigin(0.5);
    medal.add([g, q]);
    medal.setScale(covered ? 1 : 0);
    this.medal = medal;
    this.layer.add(medal);
  }

  _syncStripes() {
    this.bars.forEach((b) => (b.stripe.y = b.y));
  }

  run(fromKey, toKey, data, whileCovered) {
    if (this.busy) return;
    this.busy = true;
    this.scene.bringToTop();
    this._build(false);
    this.blocker.setVisible(true).setInteractive();
    Sfx.whoosh();

    this.bars.forEach((bar, i) => {
      this.tweens.add({
        targets: bar,
        y: 0,
        duration: 360,
        delay: i * 40,
        ease: 'Cubic.out',
        onUpdate: () => this._syncStripes(),
      });
    });
    this.tweens.add({
      targets: this.medal,
      scale: 1,
      angle: 14 + 360,
      duration: 420,
      delay: 220,
      ease: 'Back.out',
    });

    const coverTime = 360 + this.bars.length * 40 + 60;
    this.time.delayedCall(coverTime, () => {
      const prevW = this.scale.width;
      const prevH = this.scale.height;
      if (whileCovered) whileCovered();
      if (fromKey && fromKey !== toKey) this.scene.stop(fromKey);
      if (toKey) {
        if (fromKey === toKey) this.scene.get(toKey).scene.restart(data);
        else this.scene.launch(toKey, data);
      }
      // Canvas size may have changed (orientation switch) - rebuild fully covered
      if (prevW !== this.scale.width || prevH !== this.scale.height) this._build(true);
      this.scene.bringToTop();
      this.time.delayedCall(140, () => this._reveal());
    });
  }

  _reveal() {
    if (this.scale.width !== this.layer.x * 2 || this.scale.height !== this.layer.y * 2) this._build(true);
    this.tweens.add({ targets: this.medal, scale: 0, duration: 220, ease: 'Back.in' });
    this.bars.forEach((bar, i) => {
      this.tweens.add({
        targets: bar,
        y: -bar.dir * this.barTravel,
        duration: 380,
        delay: 120 + i * 40,
        ease: 'Cubic.in',
        onUpdate: () => this._syncStripes(),
      });
    });
    this.time.delayedCall(120 + this.bars.length * 40 + 400, () => {
      this.layer.destroy();
      this.layer = null;
      this.blocker.disableInteractive().setVisible(false);
      this.busy = false;
    });
  }

  /** Simple opening reveal used when the game first boots. */
  intro() {
    this.busy = true;
    this.scene.bringToTop();
    this._build(true);
    this.blocker.setVisible(true).setInteractive();
    this.time.delayedCall(200, () => this._reveal());
  }
}
