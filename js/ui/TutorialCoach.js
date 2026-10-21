/**
 * TutorialCoach: guided first-time tutorial overlay.
 *  - Dims the screen except a spotlight around the current target
 *  - Speech bubble with a short instruction
 *  - Animated pointer hand on the thing to tap
 *  - Each step waits for an action (a condition function) or a tap
 *  - SKIP button ends the tutorial at any time
 *
 * Steps: { text, target: () => obj|rect|null, hand: () => obj|rect|null,
 *          wait: 'tap' | () => boolean, dim: true }
 * The owning scene must call coach.update() every frame.
 */
class TutorialCoach {
  static DEPTH = 800;

  constructor(scene, { onSkip } = {}) {
    this.scene = scene;
    this.onSkip = onSkip;
    const D = TutorialCoach.DEPTH;
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.active = false;

    this.dim = scene.add.graphics().setDepth(D);
    this.ring = scene.add.graphics().setDepth(D + 1);
    this.bubble = scene.add.container(0, 0).setDepth(D + 2).setVisible(false);
    this.bubbleGfx = scene.add.graphics();
    this.bubbleText = scene.add.text(0, 0, '', Theme.body(34, Theme.HEX.ink, { wordWrap: { width: 600 } })).setOrigin(0.5);
    this.tapIcon = scene.add.graphics();
    this.bubble.add([this.bubbleGfx, this.bubbleText, this.tapIcon]);

    this.hand = scene.add.graphics().setDepth(D + 3).setVisible(false);
    Icons.draw(this.hand, 'pointer', 92, 0xffffff);
    this.bob = 0;
    scene.tweens.addCounter({ from: 0, to: 1, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut', onUpdate: (t) => (this.bob = t.getValue()) });

    // Full-screen catcher for "tap to continue" steps
    this.tapZone = scene.add.zone(0, 0, w, h).setOrigin(0).setDepth(D + 4);
    this.tapZone.on('pointerup', () => {
      if (this.step && this.step.wait === 'tap' && this.scene.time.now - this.stepStart > 350) this._next();
    });

    this.skipBtn = new IconButton(scene, w - 70, h - 70, {
      icon: 'skip',
      size: 92,
      color: Theme.C.violet,
      caption: 'SKIP',
      onClick: () => this.skip(),
    }).setDepth(D + 5);
    this.skipBtn.caption.setY(-46 - 26);
    this.skipBtn.setVisible(false);
  }

  run(steps, onDone) {
    this.steps = steps;
    this.onDone = onDone;
    this.index = -1;
    this.active = true;
    this.skipBtn.setVisible(true);
    this._next();
  }

  _next() {
    this.index++;
    if (this.index >= this.steps.length) return this._finish(false);
    this.step = this.steps[this.index];
    this.stepStart = this.scene.time.now;
    this.waitMet = false;
    if (this.step.onEnter) this.step.onEnter();
    this.bubbleText.setText(this.step.text || '');
    const tap = this.step.wait === 'tap';
    if (tap) this.tapZone.setInteractive();
    else this.tapZone.disableInteractive();
    this._layoutBubble(tap);
    this.bubble.setVisible(!!this.step.text).setScale(0.6).setAlpha(0);
    this.scene.tweens.add({ targets: this.bubble, scale: 1, alpha: 1, duration: 260, ease: 'Back.out' });
    Sfx.pop(this.index + 2);
  }

  _layoutBubble(tap) {
    const pad = 34;
    const bw = Math.max(this.bubbleText.width + pad * 2, 300);
    const bh = this.bubbleText.height + pad * 2 + (tap ? 34 : 0);
    const g = this.bubbleGfx;
    g.clear();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(-bw / 2 + 6, -bh / 2 + 10, bw, bh, 28);
    g.fillStyle(Theme.C.cream, 1).fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 28);
    g.lineStyle(5, Theme.C.gold, 1).strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 28);
    this.bubbleText.setY(tap ? -14 : 0);
    this.tapIcon.clear();
    if (tap) {
      this.tapIcon.setPosition(0, bh / 2 - 30);
      Icons.draw(this.tapIcon, 'arrowR', 34, Theme.C.coral);
    }
    this.bubbleSize = { w: bw, h: bh };
  }

  _bounds(t) {
    if (!t) return null;
    // Buttons: use their real size (a container's getBounds only sees text/graphics children)
    if (t.opts && t.opts.width && t.opts.height && typeof t.getWorldTransformMatrix === 'function') {
      const m = t.getWorldTransformMatrix();
      const sx = Math.abs(m.scaleX) || 1;
      const sy = Math.abs(m.scaleY) || 1;
      const bw = t.opts.width * sx;
      const bh = t.opts.height * sy;
      return new Phaser.Geom.Rectangle(m.tx - bw / 2, m.ty - bh / 2, bw, bh);
    }
    if (typeof t.getBounds === 'function') return t.getBounds();
    return new Phaser.Geom.Rectangle(t.x, t.y, t.w, t.h);
  }

  update() {
    if (!this.active || !this.step) return;
    const st = this.step;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const target = this._bounds(st.target ? st.target() : null);
    const handT = this._bounds(st.hand ? st.hand() : st.target ? st.target() : null);

    // Spotlight: four dim rectangles around the target
    this.dim.clear();
    this.ring.clear();
    if (st.dim !== false) {
      this.dim.fillStyle(0x05030f, 0.62);
      if (target) {
        const p = 16;
        const x0 = Math.max(0, target.x - p);
        const y0 = Math.max(0, target.y - p);
        const x1 = Math.min(w, target.right + p);
        const y1 = Math.min(h, target.bottom + p);
        this.dim.fillRect(0, 0, w, y0);
        this.dim.fillRect(0, y1, w, h - y1);
        this.dim.fillRect(0, y0, x0, y1 - y0);
        this.dim.fillRect(x1, y0, w - x1, y1 - y0);
        this.ring.lineStyle(6, Theme.C.gold, 0.6 + this.bob * 0.4);
        this.ring.strokeRoundedRect(x0, y0, x1 - x0, y1 - y0, 22);
      } else {
        this.dim.fillRect(0, 0, w, h);
      }
    }

    // Pointer hand (its fingertip sits on the target centre)
    if (handT && st.wait !== 'tap') {
      this.hand.setVisible(true);
      this.hand.setPosition(handT.centerX + 8 + this.bob * 10, handT.centerY + 42 + this.bob * 16);
    } else {
      this.hand.setVisible(false);
    }

    // Bubble: above the target if it's in the lower half, otherwise below
    const bs = this.bubbleSize;
    let by = h / 2;
    if (target) {
      by = target.centerY > h / 2 ? target.y - 40 - bs.h / 2 : target.bottom + 40 + bs.h / 2;
      by = Phaser.Math.Clamp(by, bs.h / 2 + 20, h - bs.h / 2 - 140);
    }
    const bx = Phaser.Math.Clamp(target ? target.centerX : w / 2, bs.w / 2 + 20, w - bs.w / 2 - 20);
    this.bubble.setPosition(bx, by);

    // Advance when the step's action has happened
    if (typeof st.wait === 'function' && !this.waitMet && st.wait()) {
      this.waitMet = true;
      this.scene.time.delayedCall(st.delay ?? 350, () => {
        if (this.active && this.step === st) this._next();
      });
    }
  }

  skip() {
    if (!this.active) return;
    this._finish(true);
  }

  _finish(skipped) {
    this.active = false;
    this.step = null;
    this.dim.clear();
    this.ring.clear();
    this.hand.setVisible(false);
    this.bubble.setVisible(false);
    this.tapZone.disableInteractive();
    this.skipBtn.setVisible(false);
    if (skipped) {
      if (this.onSkip) this.onSkip();
    } else if (this.onDone) {
      this.onDone();
    }
  }
}
