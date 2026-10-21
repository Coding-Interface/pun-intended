/**
 * LetterTile: a cream "board-game" tile with a lip that can fly between
 * the letter pool and answer slots. Also used decoratively for the logo.
 */
class LetterTile extends Phaser.GameObjects.Container {
  static STYLES = {
    normal: { face: 0xfff3d6, lip: 0xd6b07a, text: '#1b1036' },
    placed: { face: 0xffffff, lip: 0x9d8fd6, text: '#1b1036' },
    wrong: { face: 0xff5e5b, lip: 0xb83a38, text: '#ffffff' },
    correct: { face: 0x3ddc84, lip: 0x22a05c, text: '#ffffff' },
    hint: { face: 0xffc93c, lip: 0xc98f12, text: '#1b1036' },
    gold: { face: 0xffc93c, lip: 0xc98f12, text: '#1b1036' },
    coral: { face: 0xff5e5b, lip: 0xb83a38, text: '#ffffff' },
    teal: { face: 0x2ec4b6, lip: 0x1b8b80, text: '#ffffff' },
    sky: { face: 0x4ea8ff, lip: 0x2a6fbd, text: '#ffffff' },
  };

  constructor(scene, x, y, char, size, opts = {}) {
    super(scene, x, y);
    this.char = char;
    this.size = size;
    this.state = 'pool'; // 'pool' | 'slot'
    this.slot = null;
    this.locked = false;
    this.home = { x, y };
    this.styleName = opts.style || 'normal';
    this.lip = Math.round(size * 0.1);

    this.gfx = scene.add.graphics();
    this.text = scene.add
      .text(0, -this.lip / 2, char, {
        fontFamily: Theme.FONT_DISPLAY,
        fontSize: `${Math.round(size * 0.62)}px`,
        color: '#1b1036',
      })
      .setOrigin(0.5);
    this.add([this.gfx, this.text]);

    this.setSize(size, size + this.lip);
    if (opts.interactive !== false) this.setInteractive({ useHandCursor: true });
    this.draw();
    scene.add.existing(this);
  }

  draw() {
    const s = this.size;
    const lip = this.lip;
    const r = s * 0.18;
    let st = LetterTile.STYLES[this.styleName] || LetterTile.STYLES.normal;
    const fb = Theme.feedback();
    if (this.styleName === 'correct') st = { face: fb.correct, lip: fb.correctLip, text: '#ffffff' };
    if (this.styleName === 'wrong') st = { face: fb.wrong, lip: fb.wrongLip, text: '#ffffff' };
    const g = this.gfx;
    const top = -(s + lip) / 2;

    g.clear();
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(-s / 2 + 3, top + lip + 6, s, s, r);
    g.fillStyle(st.lip, 1);
    g.fillRoundedRect(-s / 2, top + lip, s, s, r);
    g.fillStyle(st.face, 1);
    g.fillRoundedRect(-s / 2, top, s, s, r);
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(-s / 2 + s * 0.1, top + s * 0.07, s * 0.8, s * 0.16, s * 0.08);

    // Colour assist: right/wrong is also shown by a ✓ / ✗ mark, not colour alone
    if (GameConfig.get('colorAssist') && (this.styleName === 'correct' || this.styleName === 'wrong')) {
      const mx = s / 2 - s * 0.14;
      const my = top + s * 0.14;
      g.fillStyle(Theme.C.ink, 1).fillCircle(mx, my, s * 0.17);
      g.save();
      g.translateCanvas(mx, my);
      Icons.draw(g, this.styleName === 'correct' ? 'check' : 'cross', s * 0.26, 0xffffff);
      g.restore();
    }

    this.text.setColor(st.text);
    this.text.y = top + s / 2 + 2;
  }

  setStyleName(name) {
    if (this.styleName !== name) {
      this.styleName = name;
      this.draw();
    }
    return this;
  }

  /** Arc-flight to a position with a little scale pop. */
  flyTo(x, y, opts = {}) {
    const { duration = 260, delay = 0, onComplete } = opts;
    this.scene.tweens.killTweensOf(this);
    if (this._arcTween) this._arcTween.stop();
    this.setScale(1);
    this.setDepth(opts.depth ?? 40);
    const lift = Math.min(80, Phaser.Math.Distance.Between(this.x, this.y, x, y) * 0.25);
    const startY = this.y;
    this.scene.tweens.add({
      targets: this,
      x,
      duration,
      delay,
      ease: 'Cubic.out',
    });
    this._arcTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      delay,
      ease: 'Sine.inOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        this.y = Phaser.Math.Linear(startY, y, t) - Math.sin(t * Math.PI) * lift;
      },
      onComplete: () => {
        this.y = y;
        this.setDepth(opts.restDepth ?? 30);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1,
          scaleY: 1,
          duration: 160,
          ease: 'Back.out',
        });
        if (onComplete) onComplete();
      },
    });
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: duration * 0.5,
      delay,
      yoyo: true,
      ease: 'Sine.out',
    });
    return this;
  }

  shake() {
    const x0 = this.x;
    this.scene.tweens.add({
      targets: this,
      x: x0 + 10,
      duration: 45,
      yoyo: true,
      repeat: 3,
      onComplete: () => (this.x = x0),
    });
  }

  jump(delay = 0) {
    const y0 = this.y;
    this.scene.tweens.add({
      targets: this,
      y: y0 - this.size * 0.35,
      duration: 180,
      delay,
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => (this.y = y0),
    });
  }
}
