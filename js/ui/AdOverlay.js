/**
 * AdOverlay: stand-in rewarded-ad screen used until a real ad network is
 * connected (see AdService). Full-screen, blocks input, counts down, then
 * lets the player collect the reward. Closing early forfeits it.
 */
class AdOverlay {
  constructor(scene, seconds, done) {
    this.scene = scene;
    this.done = done;
    this.left = seconds;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const D = 400;
    const s = scene;
    this.objects = [];

    const bg = s.add.rectangle(0, 0, w, h, 0x05030f, 0.96).setOrigin(0).setDepth(D).setInteractive();
    this.objects.push(bg);

    const panelW = Math.min(820, w - 80);
    const panelH = Math.min(560, h * 0.5);
    const g = s.add.graphics().setDepth(D + 1);
    g.fillStyle(Theme.C.navy, 1).fillRoundedRect(w / 2 - panelW / 2, h / 2 - panelH / 2, panelW, panelH, 32);
    g.lineStyle(4, 0xffffff, 0.15).strokeRoundedRect(w / 2 - panelW / 2, h / 2 - panelH / 2, panelW, panelH, 32);
    this.objects.push(g);

    const tag = s.add.text(w / 2 - panelW / 2 + 30, h / 2 - panelH / 2 + 26, 'AD', Theme.body(24, Theme.HEX.gold)).setDepth(D + 2);
    const title = s.add
      .text(w / 2, h / 2 - 90, 'Your ad plays here', Theme.display(56, Theme.HEX.cream))
      .setOrigin(0.5)
      .setDepth(D + 2);
    const sub = s.add
      .text(w / 2, h / 2 - 20, `Watch to the end for +${AdService.REWARD_HINTS} hints`, Theme.body(30, Theme.HEX.muted))
      .setOrigin(0.5)
      .setDepth(D + 2);
    this.objects.push(tag, title, sub);

    // Countdown ring
    this.ring = s.add.graphics().setDepth(D + 2);
    this.count = s.add.text(w / 2, h / 2 + 100, String(seconds), Theme.display(64, Theme.HEX.white)).setOrigin(0.5).setDepth(D + 3);
    this.objects.push(this.ring, this.count);
    this.total = seconds * 1000;
    this.elapsed = 0;
    this.cx = w / 2;
    this.cy = h / 2 + 100;
    this._drawRing(0);

    // Close (forfeit) - small, top-right of the panel
    this.closeBtn = new IconButton(s, w / 2 + panelW / 2 - 50, h / 2 - panelH / 2 + 50, {
      icon: 'close',
      size: 68,
      color: 0x4a4466,
      onClick: () => this._finish(false),
    }).setDepth(D + 3);
    this.objects.push(this.closeBtn);

    this.timer = s.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        this.elapsed += 50;
        this._drawRing(Math.min(1, this.elapsed / this.total));
        const left = Math.ceil((this.total - this.elapsed) / 1000);
        if (left > 0) this.count.setText(String(left));
        if (this.elapsed >= this.total) this._ready();
      },
    });
  }

  _drawRing(frac) {
    const r = 62;
    this.ring.clear();
    this.ring.lineStyle(12, 0xffffff, 0.12).strokeCircle(this.cx, this.cy, r);
    this.ring.lineStyle(12, Theme.C.gold, 1);
    this.ring.beginPath();
    this.ring.arc(this.cx, this.cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    this.ring.strokePath();
  }

  _ready() {
    this.timer.remove();
    this.ring.setVisible(false);
    this.count.setVisible(false);
    Sfx.star(2);
    this.collectBtn = new IconButton(this.scene, this.cx, this.cy, {
      icon: 'bulb',
      size: 140,
      color: Theme.C.green,
      badge: `+${AdService.REWARD_HINTS}`,
      onClick: () => this._finish(true),
    }).setDepth(403);
    this.collectBtn.setScale(0);
    this.scene.tweens.add({ targets: this.collectBtn, scale: 1, duration: 320, ease: 'Back.out' });
    this.objects.push(this.collectBtn);
  }

  _finish(rewarded) {
    if (this.finished) return;
    this.finished = true;
    if (this.timer) this.timer.remove();
    this.objects.forEach((o) => {
      this.scene.tweens.killTweensOf(o);
      this.scene.tweens.add({ targets: o, alpha: 0, duration: 180, onComplete: () => o.destroy() });
    });
    this.scene.time.delayedCall(200, () => this.done(rewarded));
  }
}
