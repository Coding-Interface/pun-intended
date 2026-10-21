/**
 * GameScene: one round. Deals cards one by one, runs the chosen puzzle
 * board (tiles / keyboard / quiz), scores (base + speed bonus) x combo,
 * then heads to Results.
 *
 * - Tap the card (or the magnifier) to see it bigger; tap again to close.
 * - Out of hints? Watch a rewarded ad (AdService) for more - nobody gets stuck.
 * - First time in a mode, `create({ tutorial: true })` plays one guided card
 *   with TutorialCoach, then starts a normal round.
 */
class GameScene extends Phaser.Scene {
  static PRAISE = ['PUN-TASTIC!', 'PUNBELIEVABLE!', 'NAILED IT!', 'GENIUS!', 'WORD UP!', 'SO PUNNY!', 'BRILLIANT!'];
  static FLUBS = ['OOPS!', 'NOPE!', 'NOT QUITE!', 'SO CLOSE!'];
  static TUTORIAL_CARD = { tiles: 9, type: 8, mcq: 19 }; // HOT DOG, BOOKWORM, COPY CAT
  static RELAXED_BONUS = 25;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data = {}) {
    const w = this.scale.width;
    const h = this.scale.height;
    this.land = w > h;

    this.mode = GameConfig.get('gameMode');
    this.tutorial = !!data.tutorial;
    this.tutorialSolved = false;
    this.tutorialEnded = false;
    this.relaxed = !!GameConfig.get('relaxedMode');
    this.lengthKey = GameConfig.get('roundLength'); // 10 | 20 | 'all' (best-score key)
    if (this.tutorial) {
      this.deck = [CARDS_DATA.find((c) => c.id === GameScene.TUTORIAL_CARD[this.mode]) || CARDS_DATA[0]];
      this.roundLength = 1;
    } else {
      this.roundLength = GameConfig.roundCount(this.lengthKey);
      this.deck = GameConfig.drawDeck(this.roundLength);
    }

    this.index = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    // Hints scale with round length (Keyboard mode is harder, so it gets more)
    this.hints = this.tutorial ? 3 : Math.max(3, Math.round(this.roundLength * (this.mode === 'type' ? 0.45 : 0.28)));
    this.hintsUsed = 0;
    this.firstTry = 0;
    this.busy = true;
    this.board = null;
    this.adOpen = false;
    this.panelOpen = false;
    this.coach = null;

    this.L = this._layout(w, h);
    const L = this.L;

    this.bg = new AnimatedBackground(this, { raysX: L.card.x, raysY: L.card.y, raysAlpha: 0.06, glyphs: false });
    this.fx = new Effects(this);

    this.hud = new GameHud(this, {
      total: this.roundLength,
      onMenu: () => this._quit(),
      onSettings: () => this._openSettings(),
    });
    if (!this.land) this.hud.placeCombo(200, 262);

    this.card = new PunCard(this, L.card.x, L.card.y, L.card.h).setDepth(10);
    this.card.setPosition(w + 600, L.card.y);
    this.card.enableTap(() => this._openZoom());

    this.zoom = new CardZoom(this);

    this.speed = new SpeedMeter(this, L.area.cx, L.area.speedY, L.area.width * 0.86, { duration: 20000, maxBonus: 50 })
      .setDepth(20)
      .setAlpha(0);

    this._buildActions();

    if (this.tutorial) this.coach = new TutorialCoach(this, { onSkip: () => this._endTutorial() });

    this.input.keyboard.on('keydown', (e) => this._onKey(e));
    Music.play('game');
    this.time.delayedCall(500, () => this._startCard());
  }

  /** Keyboard mode needs a bit more board room in portrait. */
  _layout(w, h) {
    if (this.land) {
      return {
        card: { x: w * 0.255, y: 578, h: 900 },
        area: { cx: w * 0.7, width: 900, speedY: 190, top: 240, bottom: 885, actionsY: 985 },
      };
    }
    if (this.mode === 'type') {
      return {
        card: { x: w / 2, y: 600, h: 720 },
        area: { cx: w / 2, width: 980, speedY: 1005, top: 1045, bottom: 1745, actionsY: 1840 },
      };
    }
    return {
      card: { x: w / 2, y: 660, h: 860 },
      area: { cx: w / 2, width: 960, speedY: 1140, top: 1185, bottom: 1735, actionsY: 1840 },
    };
  }

  get paused() {
    return this.zoom.isOpen || this.adOpen || this.panelOpen;
  }

  update(time, delta) {
    if (this.coach) this.coach.update();
    // The speed bonus pauses while zoomed in, watching an ad or in settings
    if (!this.paused) this.speed.tick(delta);
  }

  /* ---------------- Actions (hint / ad / zoom) ---------------- */

  _buildActions() {
    const { cx, actionsY } = this.L.area;
    this.hintBtn = new IconButton(this, cx - 95, actionsY, {
      icon: 'bulb',
      size: 128,
      color: Theme.C.gold,
      iconColor: Theme.C.ink,
      onClick: () => this._useHint(),
    }).setDepth(40);
    this.zoomBtn = new IconButton(this, cx + 95, actionsY, {
      icon: 'zoom',
      size: 128,
      color: Theme.C.teal,
      onClick: () => this._openZoom(),
    }).setDepth(40);
    this._refreshActions();
  }

  _refreshActions() {
    if (this.hints > 0) {
      this.hintBtn.iconColor = Theme.C.ink;
      this.hintBtn.setColor(Theme.C.gold).setIcon('bulb').setBadge(this.hints);
    } else {
      // Out of hints: offer a rewarded ad instead of a dead button
      this.hintBtn.iconColor = Theme.C.white;
      this.hintBtn.setColor(Theme.C.pink).setIcon('tv').setBadge(`+${AdService.REWARD_HINTS}`);
    }
    this.hintBtn.setEnabled(true);
  }

  _useHint() {
    if (this.busy || !this.board || this.paused) return;
    if (this.hints <= 0) {
      if (this.tutorial) {
        this.hints = 3; // never block the tutorial
        this._refreshActions();
        return;
      }
      return this._watchAd();
    }
    if (this.board.hint()) {
      this.hints--;
      this.hintsUsed++;
      this.cardHint = true;
      this._refreshActions();
    } else {
      this.hintBtn.shake();
    }
  }

  _watchAd() {
    this.adOpen = true;
    AdService.showRewarded(this, {
      onReward: (n) => {
        this.hints += n;
        this._refreshActions();
        this.fx.sparkle(this.hintBtn.x, this.hintBtn.y, 18);
        this.fx.popText(this.hintBtn.x, this.hintBtn.y - 100, `+${n}`, { size: 64, color: Theme.HEX.gold, rise: 70 });
        Sfx.hint();
      },
      onDone: () => (this.adOpen = false),
    });
  }

  _openZoom() {
    if (this.busy || !this.board || this.paused || !this.card.front.visible) return;
    const c = this.card;
    this.zoom.open(this.deck[this.index], {
      x: c.x,
      y: c.y + c.inner.y,
      h: c.cardH * c.scale,
      angle: c.angle + c.inner.angle,
    });
  }

  _openSettings() {
    if (this.panelOpen || this.adOpen) return;
    if (this.zoom.isOpen) this.zoom.close();
    this.panelOpen = true;
    this.settingsPanel = new SettingsPanel(this, {
      onClose: () => {
        this.panelOpen = false;
        this.settingsPanel = null;
        this.hud.refreshAudio();
      },
    });
  }

  _onKey(e) {
    if (this.adOpen || this.panelOpen) return;
    if (this.zoom.isOpen) {
      this.zoom.handleKey(e.key);
      return;
    }
    if (e.key === 'Escape') return this._quit();
    if (this.busy || !this.board) return;
    if (e.key === '?' || e.key === '/') return this._useHint();
    if (e.key === '+' || e.key === '=') return this._openZoom();
    this.board.handleKey(e.key);
  }

  /* ---------------- Card flow ---------------- */

  _createBoard() {
    const callbacks = { onSolved: () => this._onSolved(), onWrong: () => this._onWrong() };
    const { cx, top, bottom, width } = this.L.area;
    const area = { cx, top, bottom, width };
    if (this.mode === 'type') return new TypeBoard(this, area, callbacks);
    if (this.mode === 'mcq') return new ChoiceBoard(this, area, callbacks);
    return new TileBoard(this, area, callbacks);
  }

  _startCard() {
    const card = this.deck[this.index];
    this.cardWrong = 0;
    this.cardHint = false;
    this.busy = true;
    this.hud.setCurrent(this.index);
    const timed = !this.relaxed && !this.tutorial;

    this.card.setCard(card);
    this.card.dealIn(this.scale.width + this.card.cardW, this.L.card.y - 260, () => {
      if (timed) this.tweens.add({ targets: this.speed, alpha: 1, duration: 250 });
      this.board = this._createBoard();
      this._refreshActions();
      const dealTime = this.board.build(card, { x: this.card.x, y: this.card.y });
      this.time.delayedCall(dealTime, () => {
        this.busy = false;
        if (timed) this.speed.start();
        if (this.tutorial) this._runTutorial();
        // Hook for test.html's TestTools (the release build has no listener)
        window.dispatchEvent(new CustomEvent('pun:card', { detail: { scene: this, card, mode: this.mode } }));
      });
    });
  }

  _onSolved() {
    this.busy = true;
    const timed = !this.relaxed && !this.tutorial;
    const bonus = timed ? this.speed.stop() : GameScene.RELAXED_BONUS;
    const clean = this.cardWrong === 0;
    if (clean) this.firstTry++;
    this.streak = clean ? this.streak + 1 : 0;
    this.bestStreak = Math.max(this.bestStreak, this.streak);

    const mult = this.streak >= 2 ? 1 + 0.25 * Math.min(this.streak - 1, 4) : 1;
    const base = this.cardHint ? 50 : 100;
    const points = Math.round((base + bonus) * mult);
    this.score += points;

    const result = clean && !this.cardHint ? 'perfect' : clean ? 'assisted' : 'missed';
    this.hud.markPip(this.index, result);

    // Juice
    const { x, y } = this.card;
    const ch = this.L.card.h;
    Sfx.correct();
    if (this.streak >= 2) Sfx.combo(this.streak);
    this.card.celebrate();
    if (GameConfig.get('colorAssist')) this.fx.stamp(x, y + ch * 0.12, 'correct', this.land ? 170 : 160);
    this.bg.pulseRays(0.2, Theme.C.gold);
    this.fx.ring(x, y, Theme.C.gold, ch * 0.7);
    this.fx.confetti(x, y - ch * 0.15, 90);
    this.fx.popText(x, y - ch * 0.12, Utils.pick(GameScene.PRAISE), { size: this.land ? 96 : 88 });
    if (timed && bonus >= 35) {
      this.time.delayedCall(250, () =>
        this.fx.popText(x, y - ch * 0.32, 'SPEEDY!', { size: 60, color: Theme.HEX.teal, rise: 90 }),
      );
    }
    this.time.delayedCall(350, () => {
      this.fx.floatScore(x, y + ch * 0.22, this.hud.scoreTarget.x, this.hud.scoreTarget.y, `+${points}`, () =>
        this.hud.setScore(this.score),
      );
    });
    this.hud.setCombo(this.streak, mult);

    if (this.tutorial) {
      this.tutorialSolved = true; // the coach takes over (see _runTutorial)
      return;
    }
    this.time.delayedCall(1700, () => this._next());
  }

  _onWrong() {
    this.cardWrong++;
    Sfx.wrong();
    this.card.shake();
    this.fx.tint(Theme.feedback('wrong'), 0.16);
    if (Utils.motionOK()) this.cameras.main.shake(160, 0.004);
    const { x, y } = this.card;
    if (GameConfig.get('colorAssist')) this.fx.stamp(x, y + this.L.card.h * 0.12, 'wrong', this.land ? 170 : 160);
    const color = Theme.feedback().hex.wrong;
    if (this.streak >= 2) this.fx.popText(x, y, 'COMBO LOST', { size: 72, color });
    else this.fx.popText(x, y, Utils.pick(GameScene.FLUBS), { size: 80, color });
    this.streak = 0;
    this.hud.setCombo(0, 1);
  }

  _next() {
    this.tweens.add({ targets: this.speed, alpha: 0, duration: 200 });
    if (this.board) this.board.destroy();
    this.board = null;
    this.index++;

    const outX = -this.card.cardW;
    const outY = this.L.card.y - 200;
    if (this.index >= this.deck.length) {
      this.card.flyOut(outX, outY, () => this._finish());
    } else {
      this.card.flyOut(outX, outY, () => this._startCard());
    }
  }

  _finish() {
    TransitionScene.go(this, 'ResultsScene', {
      score: this.score,
      total: this.deck.length,
      firstTry: this.firstTry,
      bestStreak: this.bestStreak,
      hintsUsed: this.hintsUsed,
      mode: this.mode,
      roundLength: this.lengthKey,
    });
  }

  _quit() {
    this.busy = true;
    if (this.board) this.board.enabled = false;
    TransitionScene.go(this, 'MenuScene');
  }

  /* ---------------- Tutorial ---------------- */

  _cardRect() {
    const c = this.card;
    return { x: c.x - c.cardW / 2, y: c.y - c.cardH / 2, w: c.cardW, h: c.cardH };
  }

  /** Next thing to tap in Tiles / Keyboard mode: a misplaced letter to remove, or the next right letter. */
  _nextLetterTarget() {
    const b = this.board;
    if (!b || !b.slots) return null;
    for (let i = 0; i < b.slots.length; i++) {
      const slot = b.slots[i];
      const need = b.answer[slot.index];
      if (slot.tile && slot.tile.char !== need && !slot.locked && !slot.tile.locked) return slot.tile;
      if (!slot.tile) {
        if (this.mode === 'type') return b.keys[need];
        return b.tiles.find((t) => t.state === 'pool' && t.char === need) || null;
      }
    }
    return null;
  }

  _filledCount() {
    return this.board && this.board.slots ? this.board.slots.filter((s) => s.tile).length : 0;
  }

  _runTutorial() {
    const intro = [
      { text: 'Every card hides a pun.\nLook closely at the picture!', target: () => this._cardRect(), wait: 'tap' },
      { text: 'Tap the card to see it bigger.', target: () => this._cardRect(), wait: () => this.zoom.isOpen },
      { text: 'Tap anywhere to close it.', target: null, dim: false, wait: () => !this.zoom.isOpen },
    ];
    let play;
    if (this.mode === 'mcq') {
      play = [
        { text: 'Tap the bulb to knock out\ntwo wrong answers.', target: () => this.hintBtn, wait: () => this.hintsUsed > 0 },
        {
          text: 'Now pick the answer\nthat matches the picture!',
          target: () => this.board && this.board.buttons.find((b) => b.option === this.board.card.answer),
          wait: () => this.tutorialSolved,
          delay: 900,
        },
      ];
    } else {
      const verb = this.mode === 'type' ? 'Type the answer on the keyboard.' : 'Tap the letters to spell the answer.';
      const hintText =
        this.mode === 'type' ? "Stuck? Tap the bulb - it removes\nletters you don't need." : 'Stuck? Tap the bulb\nfor a free letter.';
      play = [
        { text: verb, target: () => this._nextLetterTarget(), wait: () => this._filledCount() >= 2 },
        { text: hintText, target: () => this.hintBtn, wait: () => this.hintsUsed > 0 },
        { text: 'Now finish the answer!', target: () => this._nextLetterTarget(), wait: () => this.tutorialSolved, delay: 900 },
      ];
    }
    const outro = [
      {
        text: "Brilliant! Answer fast for a speed bonus\nand get answers in a row for combos.\nYou're ready to play!",
        target: null,
        wait: 'tap',
      },
    ];
    this.coach.run([...intro, ...play, ...outro], () => this._endTutorial());
  }

  _endTutorial() {
    if (this.tutorialEnded) return;
    this.tutorialEnded = true;
    GameConfig.setTutorialDone(this.mode, true);
    TransitionScene.go(this, 'GameScene', {});
  }
}
