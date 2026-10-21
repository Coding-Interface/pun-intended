/**
 * SpeedMeter: draining bar (with a timer icon) showing the time bonus still on offer.
 */
class SpeedMeter extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, opts = {}) {
    super(scene, x, y);
    this.w = width;
    this.duration = opts.duration || 20000;
    this.maxBonus = opts.maxBonus || 50;
    this.running = false;
    this.elapsed = 0;

    this.label = scene.add.graphics({ x: -width / 2 + 22, y: 0 });
    Icons.draw(this.label, 'timer', 44, 0xb9b0e8);
    this.value = scene.add.text(width / 2, 0, '+50', Theme.body(26, Theme.HEX.gold)).setOrigin(1, 0.5);
    this.barX = -width / 2 + 60;
    this.barW = width - 60 - 80;
    this.gfx = scene.add.graphics();
    this.add([this.gfx, this.label, this.value]);
    this._draw(1);
    scene.add.existing(this);
  }

  _draw(frac) {
    const g = this.gfx;
    const h = 18;
    g.clear();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(this.barX, -h / 2, this.barW, h, h / 2);
    if (frac > 0.001) {
      const color = frac > 0.5 ? Theme.C.teal : frac > 0.25 ? Theme.C.gold : Theme.C.coral;
      g.fillStyle(color, 1);
      g.fillRoundedRect(this.barX, -h / 2, Math.max(h, this.barW * frac), h, h / 2);
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(this.barX + 4, -h / 2 + 3, Math.max(8, this.barW * frac - 8), 4, 2);
    }
    this.value.setText(`+${this.bonusFor(frac)}`);
  }

  bonusFor(frac) {
    return Math.round(this.maxBonus * Math.max(0, frac));
  }

  get fraction() {
    return 1 - Math.min(1, this.elapsed / this.duration);
  }

  start() {
    this.elapsed = 0;
    this.running = true;
    this._draw(1);
  }

  stop() {
    this.running = false;
    return this.bonusFor(this.fraction);
  }

  tick(delta) {
    if (!this.running) return;
    this.elapsed += delta;
    this._draw(this.fraction);
  }
}
