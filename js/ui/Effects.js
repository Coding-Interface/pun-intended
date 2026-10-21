/**
 * Effects: confetti, sparkles, pop-up words, score floaters, ring bursts,
 * screen tint flashes. One instance per scene.
 */
class Effects {
  constructor(scene) {
    this.scene = scene;

    this.confettiEmitter = scene.add
      .particles(0, 0, 'confetti', {
        speed: { min: 450, max: 1100 },
        angle: { min: 210, max: 330 },
        gravityY: 1400,
        lifespan: 1800,
        scale: { min: 0.7, max: 1.5 },
        rotate: { start: 0, end: 720 },
        alpha: { start: 1, end: 0.2 },
        tint: Theme.CONFETTI,
        emitting: false,
      })
      .setDepth(70);

    this.sparkEmitter = scene.add
      .particles(0, 0, 'sparkle', {
        speed: { min: 120, max: 420 },
        angle: { min: 0, max: 360 },
        lifespan: 700,
        scale: { start: 0.9, end: 0 },
        rotate: { start: 0, end: 180 },
        blendMode: 'ADD',
        tint: [Theme.C.gold, Theme.C.white, Theme.C.cream],
        emitting: false,
      })
      .setDepth(71);
  }

  confetti(x, y, count = 70) {
    this.confettiEmitter.explode(Utils.motionOK() ? count : Math.round(count / 4), x, y);
  }

  sparkle(x, y, count = 14) {
    this.sparkEmitter.explode(count, x, y);
  }

  /** Confetti falling from the top for a while (results screen). */
  rain(duration = 2500) {
    const w = this.scene.scale.width;
    const ev = this.scene.time.addEvent({
      delay: 60,
      repeat: Math.floor(duration / 60),
      callback: () => {
        this.confettiEmitter.emitParticleAt(Phaser.Math.Between(0, w), -20, 2);
      },
    });
    return ev;
  }

  /** Big chunky word that pops in, wobbles and floats away. */
  popText(x, y, text, opts = {}) {
    const { size = 96, color = Theme.HEX.gold, rise = 140, hold = 500, angle = Phaser.Math.Between(-8, 8) } = opts;
    const t = this.scene.add
      .text(x, y, text, Theme.display(size, color))
      .setOrigin(0.5)
      .setDepth(80)
      .setScale(0)
      .setAngle(angle);
    t.setShadow(0, 8, 'rgba(0,0,0,0.35)', 0, true, true);
    this.scene.tweens.chain({
      targets: t,
      tweens: [
        { scale: 1.15, duration: 220, ease: 'Back.out' },
        { scale: 1, duration: 120, ease: 'Sine.out' },
        { y: y - rise, alpha: 0, duration: 520, delay: hold, ease: 'Cubic.in' },
      ],
      onComplete: () => t.destroy(),
    });
    return t;
  }

  /** "+150" that flies from a point to a HUD target. */
  floatScore(fromX, fromY, toX, toY, text, onArrive) {
    const t = this.scene.add.text(fromX, fromY, text, Theme.display(64, Theme.HEX.gold)).setOrigin(0.5).setDepth(85);
    this.scene.tweens.chain({
      targets: t,
      tweens: [
        { y: fromY - 70, scale: 1.25, duration: 260, ease: 'Back.out' },
        { x: toX, y: toY, scale: 0.5, duration: 520, ease: 'Cubic.in' },
      ],
      onComplete: () => {
        t.destroy();
        if (onArrive) onArrive();
      },
    });
  }

  ring(x, y, color = Theme.C.gold, radius = 260) {
    const g = this.scene.add.graphics().setDepth(69);
    const state = { r: 10, a: 1 };
    this.scene.tweens.add({
      targets: state,
      r: radius,
      a: 0,
      duration: 520,
      ease: 'Cubic.out',
      onUpdate: () => {
        g.clear();
        g.lineStyle(10 * state.a + 2, color, state.a);
        g.strokeCircle(x, y, state.r);
      },
      onComplete: () => g.destroy(),
    });
  }

  /** Full-screen colour tint that fades out (red for mistakes, white for wins). */
  tint(color = Theme.C.coral, alpha = 0.22, duration = 380) {
    if (!Utils.motionOK()) return; // no full-screen flashes with reduced motion
    const { width: w, height: h } = this.scene.scale;
    const r = this.scene.add.rectangle(0, 0, w, h, color, alpha).setOrigin(0).setDepth(90);
    this.scene.tweens.add({ targets: r, alpha: 0, duration, ease: 'Quad.out', onComplete: () => r.destroy() });
  }

  /**
   * Colour assist: a big ✓ / ✗ badge on the card, so right/wrong never
   * depends on colour alone. kind: 'correct' | 'wrong'.
   */
  stamp(x, y, kind, size = 150) {
    const fb = Theme.feedback();
    const color = kind === 'correct' ? fb.correct : fb.wrong;
    const c = this.scene.add.container(x, y).setDepth(85);
    const g = this.scene.add.graphics();
    g.fillStyle(0x000000, 0.3).fillCircle(4, 8, size / 2);
    g.fillStyle(Theme.C.white, 1).fillCircle(0, 0, size / 2);
    g.fillStyle(color, 1).fillCircle(0, 0, size / 2 - 9);
    Icons.draw(g, kind === 'correct' ? 'check' : 'cross', size * 0.55, Theme.C.white);
    c.add(g);
    c.setScale(0.3).setAlpha(0);
    const motion = Utils.motionOK();
    this.scene.tweens.add({
      targets: c,
      scale: 1,
      alpha: 1,
      duration: motion ? 260 : 120,
      ease: motion ? 'Back.out' : 'Quad.out',
      onComplete: () =>
        this.scene.tweens.add({ targets: c, alpha: 0, delay: kind === 'correct' ? 900 : 650, duration: 250, onComplete: () => c.destroy() }),
    });
  }
}
