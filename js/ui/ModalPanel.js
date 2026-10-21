/**
 * ModalPanel: dimmed full-screen backdrop + rounded panel + title + close icon.
 * Content is added to `panel.content` (a container centred on the panel).
 */
class ModalPanel {
  static DEPTH = 600;

  constructor(scene, { width, height, title, onClose } = {}) {
    this.scene = scene;
    this.onClose = onClose;
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.w = Math.min(width || 900, w - 60);
    this.h = Math.min(height || 800, h - 80);
    const D = ModalPanel.DEPTH;

    this.backdrop = scene.add.rectangle(0, 0, w, h, 0x05030f, 0.82).setOrigin(0).setDepth(D).setInteractive();
    this.backdrop.setAlpha(0);
    scene.tweens.add({ targets: this.backdrop, alpha: 1, duration: 200 });

    this.root = scene.add.container(w / 2, h / 2).setDepth(D + 1);
    const g = scene.add.graphics();
    const pw = this.w;
    const ph = this.h;
    g.fillStyle(0x000000, 0.35).fillRoundedRect(-pw / 2 + 10, -ph / 2 + 16, pw, ph, 40);
    g.fillStyle(Theme.C.ink, 1).fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 40);
    g.lineStyle(6, Theme.C.gold, 1).strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 40);
    g.lineStyle(2, Theme.C.coral, 0.7).strokeRoundedRect(-pw / 2 + 14, -ph / 2 + 14, pw - 28, ph - 28, 30);
    this.root.add(g);

    if (title) {
      this.title = scene.add.text(0, -ph / 2 + 70, title, Theme.display(56, Theme.HEX.gold)).setOrigin(0.5);
      this.root.add(this.title);
    }
    this.closeBtn = new IconButton(scene, pw / 2 - 58, -ph / 2 + 58, {
      icon: 'close',
      size: 84,
      color: Theme.C.coral,
      onClick: () => this.close(),
    });
    this.root.add(this.closeBtn);

    this.content = scene.add.container(0, 0);
    this.root.add(this.content);

    this.root.setScale(0.7).setAlpha(0);
    scene.tweens.add({ targets: this.root, scale: 1, alpha: 1, duration: 280, ease: 'Back.out' });
    this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    const s = this.scene;
    s.tweens.add({ targets: this.root, scale: 0.8, alpha: 0, duration: 180, ease: 'Quad.in', onComplete: () => this.root.destroy() });
    s.tweens.add({ targets: this.backdrop, alpha: 0, duration: 200, onComplete: () => this.backdrop.destroy() });
    if (this.onClose) this.onClose();
  }
}
