/**
 * ChoiceBoard: the "Quiz" puzzle. Four shuffled answer buttons with
 * A-D badges (keys 1-4 or A-D). Hint = remove up to two wrong answers.
 */
class ChoiceBoard {
  static BADGES = ['A', 'B', 'C', 'D', 'E', 'F'];

  constructor(scene, area, callbacks) {
    this.scene = scene;
    this.area = area;
    this.cb = callbacks;
    this.buttons = [];
    this.enabled = false;
  }

  build(card, dealFrom) {
    this.card = card;
    const { cx, top, bottom, width } = this.area;
    const options = Utils.shuffle(card.options);
    const n = options.length;
    const gap = 26;
    const btnH = Math.min(116, (bottom - top - gap * (n - 1)) / n);
    const btnW = Math.min(width, 820);
    const totalH = n * btnH + (n - 1) * gap;
    const y0 = top + (bottom - top - totalH) / 2 + btnH / 2;

    this.buttons = options.map((opt, i) => {
      const y = y0 + i * (btnH + gap);
      const btn = new GameButton(this.scene, cx, y, {
        width: btnW,
        height: btnH,
        radius: 24,
        label: opt,
        fontSize: Math.min(44, btnH * 0.4),
        color: Theme.C.navy,
        onClick: () => this._choose(btn),
      }).setDepth(30);
      btn.option = opt;
      btn.alive = true;

      // Letter badge on the left of the face
      const badgeX = -btnW / 2 + btnH * 0.55;
      const badgeY = -btn.lip / 2;
      const badge = this.scene.add.graphics();
      badge.fillStyle(Theme.C.gold, 1);
      badge.fillCircle(badgeX, badgeY, btnH * 0.3);
      const badgeText = this.scene.add
        .text(badgeX, badgeY, ChoiceBoard.BADGES[i], Theme.display(btnH * 0.34, Theme.HEX.ink, { strokeThickness: 0 }))
        .setOrigin(0.5);
      btn.attachToFace([badge, badgeText]);
      btn.badge = badge;
      btn.badgeText = badgeText;

      // Deal in from the card
      const homeX = btn.x;
      btn.setPosition(dealFrom.x, dealFrom.y).setScale(0.2).setAlpha(0);
      this.scene.tweens.add({
        targets: btn,
        x: homeX,
        y,
        scale: 1,
        alpha: 1,
        duration: 420,
        delay: 120 + i * 80,
        ease: 'Back.out',
        onStart: () => Sfx.deal(i),
      });
      return btn;
    });

    const dealTime = 120 + n * 80 + 420;
    this.scene.time.delayedCall(dealTime, () => (this.enabled = true));
    return dealTime;
  }

  _choose(btn) {
    if (!this.enabled || !btn.alive) return;
    if (btn.option === this.card.answer) {
      this.enabled = false;
      btn.setColor(Theme.feedback('correct'));
      this._mark(btn, 'check');
      this.buttons.forEach((b) => {
        b.disableInteractive();
        if (b !== btn) this.scene.tweens.add({ targets: b, alpha: 0.25, scale: 0.94, duration: 220 });
      });
      this.scene.tweens.add({ targets: btn, scale: 1.08, duration: 160, yoyo: true, ease: 'Back.out' });
      if (this.cb.onSolved) this.cb.onSolved();
    } else {
      btn.alive = false;
      btn.setColor(Theme.feedback('wrong'));
      this._mark(btn, 'cross');
      btn.disableInteractive();
      btn.shake();
      this.scene.time.delayedCall(420, () => btn.setAlpha(0.55));
      if (this.cb.onWrong) this.cb.onWrong();
    }
  }

  /** Colour assist: show right/wrong with a ✓ / ✗ too, not by colour alone. */
  _mark(btn, icon) {
    if (!GameConfig.get('colorAssist')) return;
    const h = btn.opts.height;
    const g = this.scene.add.graphics({ x: btn.opts.width / 2 - h * 0.55, y: -btn.lip / 2 });
    g.fillStyle(Theme.C.ink, 1).fillCircle(0, 0, h * 0.28);
    Icons.draw(g, icon, h * 0.36, 0xffffff);
    btn.attachToFace([g]);
  }

  handleKey(key) {
    if (!this.enabled) return;
    let idx = -1;
    if (/^[1-9]$/.test(key)) idx = parseInt(key, 10) - 1;
    else if (/^[a-fA-F]$/.test(key)) idx = ChoiceBoard.BADGES.indexOf(key.toUpperCase());
    const btn = this.buttons[idx];
    if (btn && btn.alive) {
      Sfx.click();
      this._choose(btn);
    }
  }

  get hintLabel() {
    return 'Remove 2 answers';
  }

  /** 50:50 - knocks out up to two remaining wrong answers. */
  hint() {
    if (!this.enabled) return false;
    const wrong = Utils.shuffle(this.buttons.filter((b) => b.alive && b.option !== this.card.answer)).slice(0, 2);
    if (!wrong.length) return false;
    wrong.forEach((b, i) => {
      b.alive = false;
      b.disableInteractive();
      this.scene.tweens.add({
        targets: b,
        alpha: 0.2,
        scaleY: 0.85,
        duration: 260,
        delay: i * 120,
        onStart: () => this.scene.fx && this.scene.fx.sparkle(b.x, b.y, 10),
      });
    });
    Sfx.hint();
    return true;
  }

  destroy() {
    this.enabled = false;
    this.buttons.forEach((b, i) => {
      this.scene.tweens.killTweensOf(b);
      this.scene.tweens.add({
        targets: b,
        x: b.x + 120,
        alpha: 0,
        duration: 240,
        delay: i * 40,
        ease: 'Cubic.in',
        onComplete: () => b.destroy(),
      });
    });
    this.buttons = [];
  }
}
