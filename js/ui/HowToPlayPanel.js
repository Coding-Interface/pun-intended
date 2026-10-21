/**
 * HowToPlayPanel: short illustrated guide (4 pages) + a button that replays
 * the guided tutorial for the currently selected mode.
 */
class HowToPlayPanel {
  static PAGES = [
    {
      title: 'THE GOAL',
      rows: [
        { icon: 'cards', text: 'Every card hides a pun in its picture.' },
        { icon: 'zoom', text: 'Tap the card to see it bigger. Tap again to close.' },
        { icon: 'check', text: 'Work out the punny phrase to win the card!' },
      ],
    },
    {
      title: '3 WAYS TO PLAY',
      rows: [
        { icon: 'tiles', text: 'TILES - tap letter tiles to spell the answer.' },
        { icon: 'keyboard', text: 'KEYBOARD - type the whole answer yourself.' },
        { icon: 'quiz', text: 'QUIZ - pick the right answer from four.' },
      ],
    },
    {
      title: 'SCORE BIG',
      rows: [
        { icon: 'star', text: 'Every right answer scores points.' },
        { icon: 'timer', text: 'Answer quickly for a speed bonus.' },
        { icon: 'replay', text: 'Get answers right in a row for a combo!' },
      ],
    },
    {
      title: 'NEED HELP?',
      rows: [
        { icon: 'bulb', text: 'Hints reveal letters or remove wrong answers.' },
        { icon: 'tv', text: 'Out of hints? Watch an ad to get more.' },
        { icon: 'gear', text: 'Settings: sound, music and accessibility.' },
      ],
    },
  ];

  constructor(scene, { onTutorial, onClose } = {}) {
    this.scene = scene;
    this.onTutorial = onTutorial;
    const land = scene.scale.width > scene.scale.height;
    this.modal = new ModalPanel(scene, { width: land ? 980 : 960, height: land ? 860 : 1000, title: 'HOW TO PLAY', onClose });
    this.page = 0;
    this.pageBox = scene.add.container(0, 0);
    this.modal.content.add(this.pageBox);

    const ph = this.modal.h;
    const pw = this.modal.w;
    const navY = ph / 2 - 90;
    this.prev = new IconButton(scene, -pw / 2 + 100, navY, { icon: 'arrowL', size: 96, color: Theme.C.violet, onClick: () => this.show(this.page - 1) });
    this.next = new IconButton(scene, pw / 2 - 100, navY, { icon: 'arrowR', size: 96, color: Theme.C.violet, onClick: () => this.show(this.page + 1) });
    this.tutorialBtn = new IconButton(scene, 0, navY - 4, {
      icon: 'play',
      size: 110,
      color: Theme.C.coral,
      caption: 'TUTORIAL',
      onClick: () => {
        this.modal.close();
        if (this.onTutorial) this.onTutorial();
      },
    });
    this.tutorialBtn.caption.setY(-110 / 2 - 26);
    this.dots = scene.add.graphics();
    this.dotsY = -this.modal.h / 2 + 196;
    this.modal.content.add([this.prev, this.next, this.tutorialBtn, this.dots]);
    this.show(0);
  }

  show(index) {
    const pages = HowToPlayPanel.PAGES;
    this.page = Phaser.Math.Clamp(index, 0, pages.length - 1);
    const p = pages[this.page];
    const s = this.scene;
    const pw = this.modal.w;
    const top = -this.modal.h / 2 + 150;

    this.pageBox.removeAll(true);
    const title = s.add.text(0, top, p.title, Theme.display(46, Theme.HEX.cream)).setOrigin(0.5);
    this.pageBox.add(title);
    p.rows.forEach((row, i) => {
      const y = top + 150 + i * 140;
      const g = s.add.graphics({ x: -pw / 2 + 120, y });
      g.fillStyle(Theme.C.violet, 1).fillCircle(0, 0, 54);
      g.lineStyle(4, Theme.C.gold, 0.8).strokeCircle(0, 0, 54);
      Icons.draw(g, row.icon, 62, Theme.C.cream, { bg: Theme.C.violet });
      const t = s.add
        .text(-pw / 2 + 200, y, row.text, Theme.body(32, Theme.HEX.cream, { align: 'left', wordWrap: { width: pw - 280 } }))
        .setOrigin(0, 0.5);
      this.pageBox.add([g, t]);
    });
    this.pageBox.setAlpha(0).setX(30);
    s.tweens.add({ targets: this.pageBox, alpha: 1, x: 0, duration: 220, ease: 'Quad.out' });

    this.prev.setEnabled(this.page > 0, 0.25);
    this.next.setEnabled(this.page < pages.length - 1, 0.25);
    this.dots.clear();
    pages.forEach((_, i) => {
      this.dots.fillStyle(i === this.page ? Theme.C.gold : 0xffffff, i === this.page ? 1 : 0.25);
      this.dots.fillCircle((i - (pages.length - 1) / 2) * 34, this.dotsY, 9);
    });
  }
}
