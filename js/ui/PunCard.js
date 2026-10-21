/**
 * PunCard: the big picture card. Deals in face-down, flips over,
 * idles with a gentle float, celebrates, shakes and flies away.
 *
 * Structure: outer container (position / deal / exit tweens)
 *   -> inner container (idle float + flip scaleX)
 *        -> glow, shadow, front image, back image
 */
class PunCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, cardHeight) {
    super(scene, x, y);
    this.homeX = x;
    this.homeY = y;
    this.cardH = cardHeight;
    this.cardW = cardHeight * 0.64;

    this.inner = scene.add.container(0, 0);
    this.glow = scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(Theme.C.gold).setAlpha(0);
    this.shadow = scene.add.graphics();
    this.back = scene.add.image(0, 0, 'card_back');
    this.front = scene.add.image(0, 0, 'card_back').setVisible(false);
    this.outline = scene.add.graphics();

    this.zoomBadge = this._makeZoomBadge();
    this.inner.add([this.glow, this.shadow, this.back, this.front, this.outline, this.zoomBadge]);
    this.add(this.inner);
    scene.add.existing(this);

    this._fit(this.back);
    this._drawShadow();
    this._startIdle();
  }

  /** Small magnifier badge on the card corner - signals "tap to zoom". */
  _makeZoomBadge() {
    const b = this.scene.add.container(0, 0).setVisible(false);
    const g = this.scene.add.graphics();
    g.fillStyle(0x000000, 0.3).fillCircle(3, 5, 34);
    g.fillStyle(Theme.C.ink, 1).fillCircle(0, 0, 34);
    g.lineStyle(4, Theme.C.gold, 1).strokeCircle(0, 0, 34);
    g.lineStyle(6, Theme.C.cream, 1).strokeCircle(-5, -5, 13);
    g.lineStyle(8, Theme.C.cream, 1).lineBetween(5, 5, 16, 16);
    b.add(g);
    return b;
  }

  /** Makes the whole card tappable (used to open the zoom viewer). */
  enableTap(onTap) {
    this.onTap = onTap;
    this.setSize(this.cardW, this.cardH);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerup', () => {
      if (this.front.visible && this.onTap) this.onTap();
    });
    return this;
  }

  _fit(img) {
    const scale = this.cardH / img.frame.height;
    img.setScale(scale);
    return img.frame.width * scale;
  }

  _drawShadow() {
    const w = this.cardW;
    const h = this.cardH;
    this.shadow.clear();
    this.shadow.fillStyle(0x000000, 0.35);
    this.shadow.fillRoundedRect(-w / 2 + 16, -h / 2 + 24, w, h, 22);
    this.glow.setDisplaySize(w * 1.9, h * 1.6);
  }

  _drawFrame(color = null) {
    this.outline.clear();
    if (color === null) return;
    const w = this.cardW;
    const h = this.cardH;
    this.outline.lineStyle(10, color, 1);
    this.outline.strokeRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 24);
  }

  _startIdle() {
    if (!Utils.motionOK()) return;
    this.scene.tweens.add({
      targets: this.inner,
      y: { from: -8, to: 8 },
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.scene.tweens.add({
      targets: this.inner,
      angle: { from: -1.4, to: 1.4 },
      duration: 2700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  /** Prepare a new card face-down. */
  setCard(card) {
    this.card = card;
    this.front.setTexture(`card_${card.id}`);
    this.cardW = this._fit(this.front);
    this.back.setDisplaySize(this.cardW, this.cardH);
    this.front.setVisible(false);
    this.back.setVisible(true);
    this.inner.scaleX = 1;
    this._drawShadow();
    this._drawFrame(null);
    this.zoomBadge.setPosition(this.cardW / 2 - 14, -this.cardH / 2 + 14).setVisible(false);
    if (this.input) {
      this.setSize(this.cardW, this.cardH);
      this.input.hitArea.setTo(0, 0, this.cardW, this.cardH);
    }
    return this;
  }

  /** Slide in from off-screen (face down) then flip. */
  dealIn(fromX, fromY, onDone) {
    this.setPosition(fromX, fromY).setAngle(28).setScale(0.7).setAlpha(1);
    Sfx.whoosh();
    this.scene.tweens.add({
      targets: this,
      x: this.homeX,
      y: this.homeY,
      angle: 0,
      scale: 1,
      duration: 560,
      ease: 'Cubic.out',
      onComplete: () => this.flip(onDone),
    });
  }

  flip(onDone) {
    Sfx.flip();
    this.scene.tweens.add({
      targets: this.inner,
      scaleX: 0,
      duration: 170,
      ease: 'Sine.in',
      onComplete: () => {
        this.back.setVisible(false);
        this.front.setVisible(true);
        this.zoomBadge.setVisible(!!this.onTap);
        this.scene.tweens.add({
          targets: this.inner,
          scaleX: 1,
          duration: 260,
          ease: 'Back.out',
          onComplete: () => onDone && onDone(),
        });
      },
    });
    this.scene.tweens.add({ targets: this, scale: 1.06, duration: 210, yoyo: true, ease: 'Sine.out' });
  }

  flyOut(toX, toY, onDone) {
    Sfx.whoosh();
    this.scene.tweens.add({
      targets: this,
      x: toX,
      y: toY,
      angle: -32,
      scale: 0.75,
      duration: 460,
      ease: 'Cubic.in',
      onComplete: () => onDone && onDone(),
    });
  }

  celebrate() {
    this._drawFrame(Theme.feedback('correct'));
    this.scene.tweens.add({ targets: this.glow, alpha: { from: 0, to: 0.85 }, duration: 260, yoyo: true, hold: 300 });
    this.scene.tweens.add({ targets: this, scale: 1.08, duration: 180, yoyo: true, ease: 'Back.out' });
  }

  shake() {
    this.scene.tweens.add({
      targets: this,
      x: this.homeX + 18,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.inOut',
      onComplete: () => (this.x = this.homeX),
    });
    this._drawFrame(Theme.feedback('wrong'));
    this.scene.time.delayedCall(450, () => this._drawFrame(null));
  }
}
