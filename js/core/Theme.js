/**
 * Theme: palette, fonts and text-style helpers shared by every scene.
 * Colours are pulled from the card art (cream banners, gold, coral, teal, navy).
 */
class Theme {
  static C = {
    ink: 0x1b1036,
    night: 0x140f2d,
    navy: 0x2b2160,
    violet: 0x3a2e7a,
    plum: 0x5b3fa8,
    cream: 0xfff3d6,
    creamLip: 0xd6b07a,
    gold: 0xffc93c,
    coral: 0xff5e5b,
    teal: 0x2ec4b6,
    green: 0x3ddc84,
    sky: 0x4ea8ff,
    pink: 0xff7eb6,
    white: 0xffffff,
  };

  static HEX = {
    ink: '#1b1036',
    cream: '#fff3d6',
    gold: '#ffc93c',
    coral: '#ff5e5b',
    teal: '#2ec4b6',
    green: '#3ddc84',
    white: '#ffffff',
    muted: '#b9b0e8',
  };

  static FONT_DISPLAY = '"Lilita One", "Arial Black", sans-serif';
  static FONT_BODY = 'Nunito, "Arial Rounded MT Bold", Arial, sans-serif';

  static CONFETTI = [0xffc93c, 0xff5e5b, 0x2ec4b6, 0x4ea8ff, 0xff7eb6, 0xfff3d6];

  /** Chunky display text with an ink outline. */
  static display(size, color = Theme.HEX.white, extra = {}) {
    return {
      fontFamily: Theme.FONT_DISPLAY,
      fontSize: `${Math.round(size)}px`,
      color,
      stroke: Theme.HEX.ink,
      strokeThickness: Math.max(4, Math.round(size * 0.12)),
      align: 'center',
      ...extra,
    };
  }

  /** Clean body text. */
  static body(size, color = Theme.HEX.white, extra = {}) {
    return {
      fontFamily: Theme.FONT_BODY,
      fontStyle: '900',
      fontSize: `${Math.round(size)}px`,
      color,
      align: 'center',
      ...extra,
    };
  }

  /** Right/wrong feedback colours; colour assist swaps green/red for blue/orange. */
  static feedback(kind) {
    const assist = GameConfig.get('colorAssist');
    const set = assist
      ? { correct: 0x3d8bff, correctLip: 0x2360c4, wrong: 0xff9f1c, wrongLip: 0xb86b00, assisted: 0xffd23f, hex: { correct: '#3d8bff', wrong: '#ff9f1c' } }
      : { correct: 0x3ddc84, correctLip: 0x22a05c, wrong: 0xff5e5b, wrongLip: 0xb83a38, assisted: 0xffc93c, hex: { correct: '#3ddc84', wrong: '#ff5e5b' } };
    return kind ? set[kind] : set;
  }

  static darken(color, amount = 25) {
    return Phaser.Display.Color.ValueToColor(color).darken(amount).color;
  }

  static lighten(color, amount = 20) {
    return Phaser.Display.Color.ValueToColor(color).lighten(amount).color;
  }
}
