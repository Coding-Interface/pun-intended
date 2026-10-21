/**
 * GameButton: chunky "3D" button with a lip, hover bounce and press squash.
 * Supports an optional sub-label and a "selected" outline (for toggles).
 */
class GameButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);
    this.opts = {
      width: 320,
      height: 100,
      radius: 26,
      label: '',
      sublabel: '',
      color: Theme.C.coral,
      textColor: Theme.HEX.white,
      fontSize: 40,
      subFontSize: 22,
      onClick: null,
      ...opts,
    };
    this.lip = Math.max(6, Math.round(this.opts.height * 0.1));
    this.pressed = false;
    this.enabled = true;
    this.selected = false;

    this.gfx = scene.add.graphics();
    this.labelText = scene.add
      .text(0, 0, this.opts.label, Theme.display(this.opts.fontSize, this.opts.textColor))
      .setOrigin(0.5);
    this.subText = scene.add
      .text(0, 0, this.opts.sublabel, Theme.body(this.opts.subFontSize, 'rgba(255,255,255,0.85)'))
      .setOrigin(0.5);
    this.add([this.gfx, this.labelText, this.subText]);

    this.setSize(this.opts.width, this.opts.height);
    this.setInteractive({ useHandCursor: true });
    this._bindInput();
    this.draw();
    scene.add.existing(this);
  }

  _bindInput() {
    this.on('pointerover', () => {
      if (!this.enabled) return;
      Sfx.hover();
      this.scene.tweens.add({ targets: this, scale: this.baseScale * 1.05, duration: 120, ease: 'Quad.out' });
    });
    this.on('pointerout', () => {
      this.pressed = false;
      this.draw();
      this.scene.tweens.add({ targets: this, scale: this.baseScale, duration: 140, ease: 'Quad.out' });
    });
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      Sfx.unlock();
      this.pressed = true;
      this.draw();
    });
    this.on('pointerup', () => {
      if (!this.enabled || !this.pressed) return;
      this.pressed = false;
      this.draw();
      Sfx.click();
      this.scene.tweens.add({
        targets: this,
        scaleX: this.baseScale * 1.08,
        scaleY: this.baseScale * 0.94,
        duration: 70,
        yoyo: true,
        ease: 'Quad.out',
      });
      if (this.opts.onClick) this.opts.onClick(this);
    });
  }

  get baseScale() {
    return this._baseScale || 1;
  }

  setBaseScale(s) {
    this._baseScale = s;
    this.setScale(s);
    return this;
  }

  draw() {
    const g = this.gfx;
    const { width: w, height: h, radius, color } = this.opts;
    const lip = this.lip;
    const faceH = h - lip;
    const top = -h / 2 + (this.pressed ? lip * 0.7 : 0);
    g.clear();

    if (this.opts.shape === 'circle') {
      // True circles: shadow, lip, face, then a gloss ellipse kept inside the face
      const R = (Math.min(w, h) - lip) / 2;
      const lipCy = -h / 2 + lip + R;
      const cy = top + R;
      g.fillStyle(0x000000, 0.28).fillCircle(3, lipCy + 7, R);
      g.fillStyle(Theme.darken(color, 28), 1).fillCircle(0, lipCy, R);
      g.fillStyle(color, 1).fillCircle(0, cy, R);
      g.fillStyle(0xffffff, 0.16).fillEllipse(0, cy - R * 0.45, R * 1.25, R * 0.62);
      if (this.selected) g.lineStyle(6, Theme.C.gold, 1).strokeCircle(0, cy, R + 7);
    } else {
      // Rounded rectangles: never let a corner radius exceed half a side (Phaser draws it inverted)
      const rr = (x, y, rw, rh, r) => g.fillRoundedRect(x, y, rw, rh, Math.max(0, Math.min(r, rw / 2, rh / 2)));
      g.fillStyle(0x000000, 0.28);
      rr(-w / 2 + 4, -h / 2 + lip + 8, w, faceH, radius);
      g.fillStyle(Theme.darken(color, 28), 1);
      rr(-w / 2, -h / 2 + lip, w, faceH, radius);
      g.fillStyle(color, 1);
      rr(-w / 2, top, w, faceH, radius);
      g.fillStyle(0xffffff, 0.16);
      rr(-w / 2 + 8, top + 6, w - 16, faceH * 0.42, radius * 0.7);
      if (this.selected) {
        const sr = Math.min(radius + 6, (w + 14) / 2, (faceH + 14) / 2);
        g.lineStyle(6, Theme.C.gold, 1).strokeRoundedRect(-w / 2 - 7, top - 7, w + 14, faceH + 14, sr);
      }
    }

    const cy = top + faceH / 2;
    if (this.opts.sublabel) {
      this.labelText.y = cy - this.opts.subFontSize * 0.55;
      this.subText.y = cy + this.opts.fontSize * 0.55;
    } else {
      this.labelText.y = cy;
    }
    this.subText.setVisible(!!this.opts.sublabel);
    this._faceTop = top;
    this._faceH = faceH;
    const offset = this.pressed ? lip * 0.7 : 0;
    (this.faceChildren || []).forEach((c) => (c.y = c.baseY + offset));
  }

  /** Adds extra objects (icons, badges) that move with the face when pressed. */
  attachToFace(objects) {
    this.faceChildren = this.faceChildren || [];
    objects.forEach((o) => {
      o.baseY = o.y;
      this.faceChildren.push(o);
    });
    this.add(objects);
    return this;
  }

  setLabel(text) {
    this.labelText.setText(text);
    return this;
  }

  setSublabel(text) {
    this.opts.sublabel = text;
    this.subText.setText(text);
    this.draw();
    return this;
  }

  setColor(color) {
    this.opts.color = color;
    this.draw();
    return this;
  }

  setSelected(selected) {
    this.selected = selected;
    this.draw();
    return this;
  }

  setEnabled(enabled, dimAlpha = 0.45) {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : dimAlpha);
    if (enabled) this.setInteractive({ useHandCursor: true });
    else this.disableInteractive();
    return this;
  }

  /** Little horizontal shake (wrong answer, locked, etc.). */
  shake() {
    const x0 = this.x;
    this.scene.tweens.add({
      targets: this,
      x: x0 + 14,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.inOut',
      onComplete: () => (this.x = x0),
    });
  }
}
