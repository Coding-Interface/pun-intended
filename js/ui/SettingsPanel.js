/**
 * SettingsPanel: sound + accessibility options.
 *  - Sound effects on/off
 *  - Background music on/off
 *  - Reduce motion   (no screen shake / flashes, calmer animations)
 *  - Relaxed mode    (no speed timer - every answer gets the same bonus)
 *  - Colour assist   (colour-blind friendly blue/orange feedback + ✓ / ✗ marks)
 * Sound changes apply instantly; the rest apply from the next card/screen.
 */
class SettingsPanel {
  static ROWS = [
    { key: 'soundEnabled', icon: 'sound', label: 'Sound effects' },
    { key: 'musicEnabled', icon: 'music', label: 'Music' },
    { key: 'reduceMotion', icon: 'motion', label: 'Reduce motion', note: 'No shaking or flashing' },
    { key: 'relaxedMode', icon: 'timer', label: 'Relaxed mode', note: 'No speed timer' },
    { key: 'colorAssist', icon: 'eye', label: 'Colour assist', note: 'Blue/orange + tick/cross marks' },
  ];

  constructor(scene, { onClose } = {}) {
    const land = scene.scale.width > scene.scale.height;
    const rowH = 112;
    const rows = SettingsPanel.ROWS;
    this.modal = new ModalPanel(scene, {
      width: land ? 860 : 940,
      height: 220 + rows.length * rowH,
      title: 'SETTINGS',
      onClose,
    });
    const pw = this.modal.w;
    const top = -this.modal.h / 2 + 170;

    rows.forEach((row, i) => {
      const y = top + i * rowH + rowH / 2;
      const ig = scene.add.graphics({ x: -pw / 2 + 90, y });
      ig.fillStyle(Theme.C.violet, 1).fillCircle(0, 0, 40);
      Icons.draw(ig, row.icon, 46, Theme.C.cream, { bg: Theme.C.violet });
      const label = scene.add
        .text(-pw / 2 + 155, y - (row.note ? 16 : 0), row.label, Theme.display(36, Theme.HEX.cream, { align: 'left' }))
        .setOrigin(0, 0.5);
      const items = [ig, label];
      if (row.note) {
        items.push(scene.add.text(-pw / 2 + 157, y + 24, row.note, Theme.body(22, Theme.HEX.muted)).setOrigin(0, 0.5));
      }
      let preview = null;
      if (row.key === 'colorAssist') {
        // Live preview: the right / wrong colours (and marks) the game will use
        preview = scene.add.graphics({ x: pw / 2 - 270, y });
        items.push(preview);
        SettingsPanel._drawPreview(preview);
      }
      const sw = new ToggleSwitch(scene, pw / 2 - 110, y, {
        value: !!GameConfig.get(row.key),
        onChange: (v) => {
          SettingsPanel.apply(row.key, v);
          if (preview) SettingsPanel._drawPreview(preview);
        },
      });
      items.push(sw);
      if (i < rows.length - 1) {
        const line = scene.add.graphics();
        line.lineStyle(2, 0xffffff, 0.08).lineBetween(-pw / 2 + 50, y + rowH / 2, pw / 2 - 50, y + rowH / 2);
        items.push(line);
      }
      this.modal.content.add(items);
    });
  }

  /** Two chips showing the current right / wrong feedback colours (✓ and ✗). */
  static _drawPreview(g) {
    const fb = Theme.feedback();
    const assist = GameConfig.get('colorAssist');
    g.clear();
    [
      ['check', fb.correct, -34],
      ['cross', fb.wrong, 34],
    ].forEach(([icon, color, x]) => {
      g.fillStyle(0xffffff, 0.9).fillCircle(x, 0, 28);
      g.fillStyle(color, 1).fillCircle(x, 0, 24);
      if (assist) {
        g.save();
        g.translateCanvas(x, 0);
        Icons.draw(g, icon, 26, Theme.C.white);
        g.restore();
      }
    });
  }

  /** Saves a setting and applies anything that can change instantly. */
  static apply(key, value) {
    GameConfig.set(key, value);
    if (key === 'musicEnabled') Music.refresh();
  }
}
