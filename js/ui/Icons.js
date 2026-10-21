/**
 * Icons: vector game-UI icons drawn into a Phaser Graphics object.
 * Every icon is centred on (0,0) and fits a box of `size` pixels.
 *
 *   Icons.draw(g, 'home', 48, 0xffffff, { bg: buttonColor, off: false })
 *
 * opts.bg  - colour used for cut-outs (gear hole, backspace X...)
 * opts.off - draws a "disabled" slash across the icon (sound / music off)
 */
class Icons {
  static NAMES = [
    'home', 'music', 'sound', 'gear', 'bulb', 'zoom', 'play', 'replay', 'close', 'arrowL', 'arrowR',
    'check', 'cross', 'backspace', 'cards', 'landscape', 'portrait', 'auto', 'tv', 'tiles', 'keyboard',
    'quiz', 'access', 'motion', 'timer', 'eye', 'pointer', 'star', 'help', 'skip',
  ];

  static draw(g, name, size, color = 0xffffff, opts = {}) {
    const fn = Icons[`_${name}`];
    if (!fn) throw new Error(`Unknown icon "${name}"`);
    fn(g, size, color, opts.bg ?? 0x000000);
    if (opts.off) Icons._slash(g, size, opts.bg ?? 0x000000);
  }

  // ---------------------------------------------------------------- helpers
  static _pts(s, list) {
    return list.map(([x, y]) => new Phaser.Geom.Point(x * s, y * s));
  }

  static _poly(g, s, list) {
    g.fillPoints(Icons._pts(s, list), true);
  }

  static _line(g, s, list, w, color) {
    g.lineStyle(w * s, color, 1);
    g.strokePoints(Icons._pts(s, list), false);
    // round the caps / joints
    list.forEach(([x, y]) => g.fillStyle(color, 1).fillCircle(x * s, y * s, (w * s) / 2));
  }

  static _slash(g, s, bg) {
    Icons._line(g, s, [[-0.42, -0.42], [0.42, 0.42]], 0.17, bg);
    Icons._line(g, s, [[-0.42, -0.42], [0.42, 0.42]], 0.09, 0xff5e5b);
  }

  // ---------------------------------------------------------------- icons
  static _home(g, s, c) {
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[-0.44, -0.02], [0, -0.42], [0.44, -0.02]]);
    g.fillRect(-0.3 * s, -0.06 * s, 0.6 * s, 0.44 * s);
    g.fillStyle(0x000000, 0.3).fillRoundedRect(-0.09 * s, 0.12 * s, 0.18 * s, 0.26 * s, 0.05 * s);
  }

  static _music(g, s, c) {
    g.fillStyle(c, 1);
    g.fillEllipse(-0.2 * s, 0.26 * s, 0.28 * s, 0.22 * s);
    g.fillEllipse(0.24 * s, 0.18 * s, 0.28 * s, 0.22 * s);
    g.fillRect(-0.1 * s, -0.28 * s, 0.07 * s, 0.54 * s);
    g.fillRect(0.34 * s, -0.36 * s, 0.07 * s, 0.54 * s);
    Icons._poly(g, s, [[-0.1, -0.28], [0.41, -0.4], [0.41, -0.26], [-0.1, -0.14]]);
  }

  static _sound(g, s, c) {
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[-0.4, -0.13], [-0.2, -0.13], [0.02, -0.33], [0.02, 0.33], [-0.2, 0.13], [-0.4, 0.13]]);
    g.lineStyle(0.08 * s, c, 1);
    g.beginPath();
    g.arc(0.04 * s, 0, 0.17 * s, -0.8, 0.8);
    g.strokePath();
    g.beginPath();
    g.arc(0.04 * s, 0, 0.32 * s, -0.8, 0.8);
    g.strokePath();
  }

  static _gear(g, s, c, bg) {
    const pts = [];
    const teeth = 8;
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const r = i % 4 < 2 ? 0.44 : 0.32;
      pts.push(new Phaser.Geom.Point(Math.cos(a) * r * s, Math.sin(a) * r * s));
    }
    g.fillStyle(c, 1).fillPoints(pts, true);
    g.fillStyle(bg, 1).fillCircle(0, 0, 0.14 * s);
  }

  static _bulb(g, s, c, bg) {
    g.fillStyle(c, 1);
    g.fillCircle(0, -0.1 * s, 0.26 * s);
    Icons._poly(g, s, [[-0.17, 0.06], [0.17, 0.06], [0.12, 0.22], [-0.12, 0.22]]);
    g.fillRoundedRect(-0.13 * s, 0.24 * s, 0.26 * s, 0.07 * s, 0.03 * s);
    g.fillRoundedRect(-0.1 * s, 0.33 * s, 0.2 * s, 0.07 * s, 0.03 * s);
    g.fillStyle(0xffffff, 0.55).fillCircle(-0.09 * s, -0.18 * s, 0.07 * s);
  }

  static _zoom(g, s, c) {
    g.lineStyle(0.1 * s, c, 1).strokeCircle(-0.07 * s, -0.07 * s, 0.24 * s);
    Icons._line(g, s, [[0.12, 0.12], [0.36, 0.36]], 0.14, c);
    Icons._line(g, s, [[-0.07, -0.17], [-0.07, 0.03]], 0.07, c);
    Icons._line(g, s, [[-0.17, -0.07], [0.03, -0.07]], 0.07, c);
  }

  static _play(g, s, c) {
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[-0.2, -0.34], [0.38, 0], [-0.2, 0.34]]);
  }

  static _replay(g, s, c) {
    g.lineStyle(0.11 * s, c, 1);
    g.beginPath();
    g.arc(0, 0.02 * s, 0.28 * s, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(220));
    g.strokePath();
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[0.06, -0.42], [0.32, -0.26], [0.06, -0.08]]);
  }

  static _close(g, s, c) {
    Icons._line(g, s, [[-0.26, -0.26], [0.26, 0.26]], 0.13, c);
    Icons._line(g, s, [[0.26, -0.26], [-0.26, 0.26]], 0.13, c);
  }

  static _cross(g, s, c) {
    Icons._close(g, s, c);
  }

  static _arrowL(g, s, c) {
    Icons._line(g, s, [[0.12, -0.3], [-0.16, 0], [0.12, 0.3]], 0.13, c);
  }

  static _arrowR(g, s, c) {
    Icons._line(g, s, [[-0.12, -0.3], [0.16, 0], [-0.12, 0.3]], 0.13, c);
  }

  static _check(g, s, c) {
    Icons._line(g, s, [[-0.3, 0.02], [-0.08, 0.24], [0.32, -0.24]], 0.13, c);
  }

  static _backspace(g, s, c, bg) {
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[-0.44, 0], [-0.2, -0.26], [0.42, -0.26], [0.42, 0.26], [-0.2, 0.26]]);
    Icons._line(g, s, [[-0.02, -0.11], [0.2, 0.11]], 0.07, bg);
    Icons._line(g, s, [[0.2, -0.11], [-0.02, 0.11]], 0.07, bg);
  }

  static _cards(g, s, c) {
    g.fillStyle(c, 0.55).fillRoundedRect(-0.12 * s, -0.36 * s, 0.44 * s, 0.6 * s, 0.07 * s);
    g.fillStyle(c, 1).fillRoundedRect(-0.32 * s, -0.24 * s, 0.44 * s, 0.6 * s, 0.07 * s);
  }

  static _landscape(g, s, c) {
    g.lineStyle(0.09 * s, c, 1).strokeRoundedRect(-0.4 * s, -0.24 * s, 0.8 * s, 0.48 * s, 0.08 * s);
    g.fillStyle(c, 1).fillCircle(0.3 * s, 0, 0.04 * s);
  }

  static _portrait(g, s, c) {
    g.lineStyle(0.09 * s, c, 1).strokeRoundedRect(-0.24 * s, -0.4 * s, 0.48 * s, 0.8 * s, 0.08 * s);
    g.fillStyle(c, 1).fillCircle(0, 0.3 * s, 0.04 * s);
  }

  static _auto(g, s, c) {
    g.lineStyle(0.07 * s, c, 1).strokeRoundedRect(-0.16 * s, -0.26 * s, 0.32 * s, 0.52 * s, 0.06 * s);
    g.lineStyle(0.07 * s, c, 1);
    g.beginPath();
    g.arc(0, 0, 0.42 * s, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(290));
    g.strokePath();
    g.beginPath();
    g.arc(0, 0, 0.42 * s, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(110));
    g.strokePath();
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[0.08, -0.48], [0.22, -0.4], [0.08, -0.3]]);
    Icons._poly(g, s, [[-0.08, 0.48], [-0.22, 0.4], [-0.08, 0.3]]);
  }

  static _tv(g, s, c) {
    g.lineStyle(0.08 * s, c, 1).strokeRoundedRect(-0.4 * s, -0.3 * s, 0.8 * s, 0.56 * s, 0.1 * s);
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[-0.1, -0.15], [0.16, -0.02], [-0.1, 0.11]]);
    g.fillRect(-0.16 * s, 0.3 * s, 0.32 * s, 0.07 * s);
  }

  static _tiles(g, s, c) {
    g.fillStyle(c, 1);
    [[-0.4, -0.4], [0.04, -0.4], [-0.4, 0.04], [0.04, 0.04]].forEach(([x, y]) =>
      g.fillRoundedRect(x * s, y * s, 0.36 * s, 0.36 * s, 0.08 * s),
    );
  }

  static _keyboard(g, s, c) {
    g.lineStyle(0.07 * s, c, 1).strokeRoundedRect(-0.44 * s, -0.26 * s, 0.88 * s, 0.52 * s, 0.08 * s);
    g.fillStyle(c, 1);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) g.fillRect((-0.32 + i * 0.14) * s, (-0.14 + r * 0.13) * s, 0.08 * s, 0.07 * s);
    g.fillRect(-0.2 * s, 0.12 * s, 0.4 * s, 0.07 * s);
  }

  static _quiz(g, s, c) {
    g.fillStyle(c, 1);
    [-0.28, 0, 0.28].forEach((y) => {
      g.fillCircle(-0.3 * s, y * s, 0.08 * s);
      g.fillRoundedRect(-0.16 * s, (y - 0.06) * s, 0.54 * s, 0.12 * s, 0.05 * s);
    });
  }

  static _access(g, s, c) {
    g.lineStyle(0.06 * s, c, 1).strokeCircle(0, 0, 0.44 * s);
    g.fillStyle(c, 1).fillCircle(0, -0.24 * s, 0.08 * s);
    Icons._line(g, s, [[-0.26, -0.1], [0.26, -0.1]], 0.07, c);
    Icons._line(g, s, [[0, -0.1], [0, 0.1]], 0.08, c);
    Icons._line(g, s, [[0, 0.1], [-0.14, 0.3]], 0.07, c);
    Icons._line(g, s, [[0, 0.1], [0.14, 0.3]], 0.07, c);
  }

  static _motion(g, s, c) {
    g.lineStyle(0.08 * s, c, 1);
    [-0.2, 0, 0.2].forEach((y) => {
      g.beginPath();
      g.moveTo(-0.38 * s, y * s);
      g.lineTo(0.38 * s, y * s);
      g.strokePath();
    });
    g.fillStyle(c, 1).fillCircle(0.2 * s, -0.2 * s, 0.07 * s).fillCircle(-0.12 * s, 0, 0.07 * s).fillCircle(0.08 * s, 0.2 * s, 0.07 * s);
  }

  static _timer(g, s, c) {
    g.lineStyle(0.08 * s, c, 1).strokeCircle(0, 0.05 * s, 0.32 * s);
    g.fillStyle(c, 1).fillRoundedRect(-0.08 * s, -0.42 * s, 0.16 * s, 0.08 * s, 0.03 * s);
    Icons._line(g, s, [[0, 0.05], [0, -0.13]], 0.07, c);
    Icons._line(g, s, [[0, 0.05], [0.13, 0.12]], 0.07, c);
  }

  static _eye(g, s, c, bg) {
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[-0.44, 0], [-0.22, -0.2], [0, -0.26], [0.22, -0.2], [0.44, 0], [0.22, 0.2], [0, 0.26], [-0.22, 0.2]]);
    g.fillStyle(bg, 1).fillCircle(0, 0, 0.15 * s);
    g.fillStyle(c, 1).fillCircle(0, 0, 0.07 * s);
  }

  static _pointer(g, s, c) {
    const outline = [[-0.08, -0.46], [-0.08, 0.22], [0.06, 0.08], [0.18, 0.4], [0.3, 0.35], [0.18, 0.04], [0.38, 0.04]];
    g.fillStyle(0x1b1036, 1);
    g.fillPoints(Icons._pts(s * 1.18, outline), true);
    g.fillStyle(c, 1);
    g.fillPoints(Icons._pts(s, outline), true);
  }

  static _star(g, s, c) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.44 : 0.2;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(new Phaser.Geom.Point(Math.cos(a) * r * s, Math.sin(a) * r * s));
    }
    g.fillStyle(c, 1).fillPoints(pts, true);
  }

  static _help(g, s, c) {
    g.lineStyle(0.11 * s, c, 1);
    g.beginPath();
    g.arc(0, -0.14 * s, 0.17 * s, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(400));
    g.strokePath();
    Icons._line(g, s, [[0.02, 0.0], [0, 0.12]], 0.11, c);
    g.fillStyle(c, 1).fillCircle(0, 0.33 * s, 0.07 * s);
  }

  static _skip(g, s, c) {
    g.fillStyle(c, 1);
    Icons._poly(g, s, [[-0.36, -0.28], [0, 0], [-0.36, 0.28]]);
    Icons._poly(g, s, [[-0.02, -0.28], [0.34, 0], [-0.02, 0.28]]);
    g.fillRect(0.32 * s, -0.28 * s, 0.08 * s, 0.56 * s);
  }
}
