/**
 * IconButton: a chunky 3D GameButton that shows a vector icon (see Icons)
 * instead of text, with an optional count badge and a small caption under it.
 *
 *   new IconButton(scene, x, y, { icon: 'bulb', size: 110, color: Theme.C.gold,
 *                                 badge: '3', caption: 'HINT', onClick })
 */
class IconButton extends GameButton {
  constructor(scene, x, y, opts = {}) {
    const size = opts.size || 96;
    const shape = opts.shape || 'circle';
    super(scene, x, y, {
      width: opts.width || size,
      height: opts.height || size,
      radius: shape === 'circle' ? Math.min(opts.width || size, opts.height || size) / 2 : Math.round(size * 0.26),
      label: '',
      shape,
      color: opts.color ?? Theme.C.violet,
      onClick: opts.onClick,
    });
    this.iconName = opts.icon;
    this.iconColor = opts.iconColor ?? Theme.C.white;
    this.iconScale = opts.iconScale ?? 0.6;
    this.isOff = !!opts.off;

    this.iconGfx = scene.add.graphics();
    this.iconGfx.y = -this.lip / 2;
    this.attachToFace([this.iconGfx]);
    this._drawIcon();

    if (opts.badge !== undefined && opts.badge !== null) this.setBadge(opts.badge);
    if (opts.caption) {
      this.caption = scene.add
        .text(0, (opts.height || size) / 2 + 24, opts.caption, Theme.display(opts.captionSize || 24, Theme.HEX.cream))
        .setOrigin(0.5);
      this.add(this.caption);
    }
  }

  _drawIcon() {
    const h = this.opts.height;
    const w = this.opts.width;
    this.iconGfx.clear();
    Icons.draw(this.iconGfx, this.iconName, Math.min(w, h) * this.iconScale, this.iconColor, {
      bg: this.opts.color,
      off: this.isOff,
    });
  }

  draw() {
    super.draw();
    if (this.iconGfx) this._drawIcon();
  }

  setIcon(name, off = this.isOff) {
    this.iconName = name;
    this.isOff = off;
    this._drawIcon();
    return this;
  }

  setOff(off) {
    this.isOff = off;
    this._drawIcon();
    return this;
  }

  /** Small round counter in the top-right corner (null hides it). */
  setBadge(text) {
    if (text === null || text === undefined) {
      if (this.badge) this.badge.setVisible(false);
      return this;
    }
    const r = Math.max(20, this.opts.height * 0.2);
    if (!this.badge) {
      const g = this.scene.add.graphics();
      const t = this.scene.add.text(0, 0, '', Theme.display(r * 1.05, Theme.HEX.white, { strokeThickness: 0 })).setOrigin(0.5);
      this.badge = this.scene.add.container(this.opts.width / 2 - r * 0.55, -this.opts.height / 2 + r * 0.55, [g, t]);
      this.badge.gfx = g;
      this.badge.text = t;
      this.attachToFace([this.badge]);
    }
    const str = String(text);
    const bw = Math.max(r * 2, r * 0.9 * str.length + r);
    this.badge.gfx.clear();
    this.badge.gfx.fillStyle(Theme.C.ink, 1).fillRoundedRect(-bw / 2 - 3, -r - 3, bw + 6, r * 2 + 6, r + 3);
    this.badge.gfx.fillStyle(Theme.C.coral, 1).fillRoundedRect(-bw / 2, -r, bw, r * 2, r);
    this.badge.text.setText(str);
    this.badge.setVisible(true);
    return this;
  }
}
