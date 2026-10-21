/**
 * AnimatedBackground: gradient + slowly spinning sunburst + drifting bokeh
 * and floating glyphs. Purely decorative, sits at depth -100..-90.
 */
class AnimatedBackground {
  constructor(scene, opts = {}) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const { raysX = w / 2, raysY = h / 2, raysAlpha = 0.07, raysTint = Theme.C.gold, glyphs = true } = opts;

    scene.add.image(0, 0, 'bg_grad').setOrigin(0).setDisplaySize(w, h).setDepth(-100);

    this.rays = scene.add
      .image(raysX, raysY, 'rays')
      .setDepth(-99)
      .setAlpha(raysAlpha)
      .setTint(raysTint)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.rays.setScale((Math.max(w, h) * 1.6) / 1024);
    const motion = Utils.motionOK();
    if (motion) scene.tweens.add({ targets: this.rays, angle: 360, duration: 90000, repeat: -1 });

    // Bokeh blobs
    for (let i = 0; i < 14; i++) {
      const blob = scene.add
        .image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'glow')
        .setDepth(-98)
        .setTint(Utils.pick(Theme.CONFETTI))
        .setAlpha(Phaser.Math.FloatBetween(0.06, 0.16))
        .setScale(Phaser.Math.FloatBetween(0.6, 2.2))
        .setBlendMode(Phaser.BlendModes.ADD);
      if (motion) scene.tweens.add({
        targets: blob,
        x: blob.x + Phaser.Math.Between(-160, 160),
        y: blob.y + Phaser.Math.Between(-220, 220),
        duration: Phaser.Math.Between(7000, 13000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    // Floating glyphs
    if (glyphs) {
      const chars = ['?', '!', 'A', 'Z', '?', 'P', 'U', 'N', '!', '?'];
      chars.forEach((ch) => {
        const size = Phaser.Math.Between(70, 170);
        const t = scene.add
          .text(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), ch, {
            fontFamily: Theme.FONT_DISPLAY,
            fontSize: `${size}px`,
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setAlpha(Phaser.Math.FloatBetween(0.03, 0.07))
          .setAngle(Phaser.Math.Between(-25, 25))
          .setDepth(-97);
        if (motion) scene.tweens.add({
          targets: t,
          y: t.y - Phaser.Math.Between(60, 160),
          angle: t.angle + Phaser.Math.Between(-20, 20),
          duration: Phaser.Math.Between(6000, 11000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
      });
    }

    scene.add.image(w / 2, h / 2, 'vignette').setDisplaySize(w, h).setDepth(-90);
  }

  pulseRays(alpha = 0.22, tint = Theme.C.gold) {
    const base = this.rays.alpha;
    this.rays.setTint(tint);
    this.scene.tweens.add({
      targets: this.rays,
      alpha: alpha,
      duration: 200,
      yoyo: true,
      hold: 350,
      onComplete: () => {
        this.rays.setAlpha(base);
        this.rays.setTint(Theme.C.gold);
      },
    });
  }
}
