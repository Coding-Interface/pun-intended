/**
 * CardZoom: enlarged card view.
 *  - Tap the card to open it big; tap anywhere to close it again.
 *  - Close icon (top-right), Esc or Z also close it.
 * The game's speed timer is paused by GameScene while the view is open.
 */
class CardZoom {
  static DEPTH = 300;

  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.objects = [];
  }

  open(card, from) {
    if (this.isOpen) return;
    if (this._leftovers) this._destroyLeftovers(this._leftovers); // re-opened mid-close
    this.isOpen = true;
    this.from = from;
    const s = this.scene;
    const w = s.scale.width;
    const h = s.scale.height;
    const D = CardZoom.DEPTH;
    Sfx.zoom(true);

    this.backdrop = s.add.rectangle(0, 0, w, h, 0x0a0820, 0.92).setOrigin(0).setDepth(D).setAlpha(0);
    this.backdrop.setInteractive();
    s.tweens.add({ targets: this.backdrop, alpha: 1, duration: 200 });

    this.img = s.add.image(from.x, from.y, `card_${card.id}`).setDepth(D + 1);
    const tex = this.img.frame;
    const fit = Math.min((h - 70) / tex.height, (w - 70) / tex.width);
    this.img.setScale(from.h / tex.height).setAngle(from.angle || 0);
    s.tweens.add({ targets: this.img, x: w / 2, y: h / 2, scale: fit, angle: 0, duration: 340, ease: 'Cubic.out' });

    this.closeBtn = new IconButton(s, w - 66, 66, {
      icon: 'close',
      size: 88,
      color: Theme.C.coral,
      onClick: () => this.close(),
    }).setDepth(D + 2);
    this.objects = [this.closeBtn];

    // Any quick tap closes. Only a press that starts after opening counts, so the
    // release of the tap that opened the view can't close it straight away.
    this._armed = false;
    this._onDown = () => (this._armed = true);
    this._onUp = (pointer, over) => {
      if (!this._armed || over.includes(this.closeBtn)) return;
      this._armed = false;
      if (pointer.getDistance() < 16 && pointer.getDuration() < 500) this.close();
    };
    s.input.on('pointerdown', this._onDown);
    s.input.on('pointerup', this._onUp);
  }

  /** Returns true if the key was handled. */
  handleKey(key) {
    if (!this.isOpen) return false;
    if (key === 'Escape' || key === 'z' || key === 'Z' || key === ' ' || key === 'Enter') this.close();
    return true;
  }

  close() {
    if (!this.isOpen) return;
    // State flips immediately (input, timer and re-opening never wait on animations)
    this.isOpen = false;
    const s = this.scene;
    s.input.off('pointerdown', this._onDown);
    s.input.off('pointerup', this._onUp);
    Sfx.zoom(false);
    const img = this.img;
    const leftovers = [img, this.backdrop, ...this.objects];
    this._leftovers = leftovers;
    this.objects = [];
    this.backdrop.disableInteractive();
    s.tweens.killTweensOf(img);
    s.tweens.add({
      targets: img,
      x: this.from.x,
      y: this.from.y,
      scale: this.from.h / img.frame.height,
      duration: 280,
      ease: 'Cubic.in',
    });
    leftovers.slice(1).forEach((o) => {
      s.tweens.killTweensOf(o);
      s.tweens.add({ targets: o, alpha: 0, duration: o === this.backdrop ? 280 : 140 });
    });
    s.time.delayedCall(300, () => this._destroyLeftovers(leftovers));
  }

  _destroyLeftovers(list) {
    list.forEach((o) => {
      if (o && o.scene) {
        this.scene.tweens.killTweensOf(o);
        o.destroy();
      }
    });
    if (this._leftovers === list) this._leftovers = null;
  }
}
