/**
 * TestTools: QA panel for test.html ONLY (never shipped - see tools/build-release.sh).
 *  - Shows the current card's answer (and the quiz options marked)
 *  - SOLVE / WRONG buttons drive the real input path (board.handleKey)
 *  - +5 HINTS, RESET DECK (clears the "seen cards" rotation)
 *  - Ads reward instantly in test mode (AdService picks provider 'test')
 * Shortcuts: F2 = solve, F3 = wrong answer, F4 = toggle panel.
 */
class TestTools {
  constructor() {
    this.scene = null;
    this.card = null;
    this._buildPanel();
    window.addEventListener('pun:card', (e) => this._onCard(e.detail));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') (e.preventDefault(), this.solve());
      if (e.key === 'F3') (e.preventDefault(), this.wrong());
      if (e.key === 'F4') (e.preventDefault(), this.panel.classList.toggle('collapsed'));
    });
    console.info('%cPUN INTENDED - TEST MODE', 'color:#ffc93c;font-weight:bold', '(F2 solve, F3 wrong, F4 toggle panel)');
  }

  _buildPanel() {
    const p = document.createElement('div');
    p.id = 'test-panel';
    p.innerHTML = `
      <div class="tp-head"><span class="tp-badge">TEST MODE</span><button data-act="toggle">–</button></div>
      <div class="tp-body">
        <div class="tp-label">ANSWER</div>
        <div class="tp-answer">waiting for a card…</div>
        <div class="tp-meta"></div>
        <div class="tp-row">
          <button data-act="solve">SOLVE (F2)</button>
          <button data-act="wrong">WRONG (F3)</button>
        </div>
        <div class="tp-row">
          <button data-act="hints">+5 HINTS</button>
          <button data-act="reset">RESET DECK</button>
        </div>
      </div>`;
    p.addEventListener('click', (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act === 'toggle') p.classList.toggle('collapsed');
      if (act === 'solve') this.solve();
      if (act === 'wrong') this.wrong();
      if (act === 'hints') this.addHints(5);
      if (act === 'reset') this.resetDeck();
    });
    document.body.appendChild(p);
    this.panel = p;
    this.answerEl = p.querySelector('.tp-answer');
    this.metaEl = p.querySelector('.tp-meta');
  }

  _onCard({ scene, card, mode }) {
    this.scene = scene;
    this.card = card;
    this.answerEl.textContent = card.answer;
    this.metaEl.textContent = `#${card.id} · ${GameConfig.modeLabel(mode)} · card ${scene.index + 1}/${scene.deck.length}`;
    console.info(`[test] card #${card.id}: ${card.answer}`);
  }

  get board() {
    return this.scene && this.scene.board;
  }

  /** Clears whatever is placed, then types/taps the right answer through the normal input path. */
  solve() {
    const b = this.board;
    if (!b || !b.enabled || !this.card) return;
    if (this.scene.mode === 'mcq') {
      const idx = b.buttons.findIndex((x) => x.option === this.card.answer);
      b.handleKey(String(idx + 1));
      return;
    }
    let guard = 40;
    while (b.slots.some((s) => s.tile && !s.locked && s.tile.char !== b.answer[s.index]) && guard--) b.handleKey('Backspace');
    b.slots.forEach((s) => {
      if (!s.tile) b.handleKey(b.answer[s.index]);
    });
  }

  /** Submits a wrong answer (to test the mistake flow). */
  wrong() {
    const b = this.board;
    if (!b || !b.enabled || !this.card) return;
    if (this.scene.mode === 'mcq') {
      const idx = b.buttons.findIndex((x) => x.alive && x.option !== this.card.answer);
      if (idx >= 0) b.handleKey(String(idx + 1));
      return;
    }
    if (this.scene.mode === 'type') {
      const keys = Object.keys(b.keys).filter((k) => k.length === 1 && b.keys[k].enabled);
      b.slots.forEach((s, i) => {
        if (!s.tile) b.handleKey(keys.find((k) => k !== b.answer[s.index]) || keys[i % keys.length]);
      });
      return;
    }
    // Tiles: fill from the pool, avoiding the right letter where possible
    b.slots.forEach((s) => {
      if (s.tile) return;
      const t = b.tiles.find((x) => x.state === 'pool' && x.char !== b.answer[s.index]) || b.tiles.find((x) => x.state === 'pool');
      if (t) b.handleKey(t.char);
    });
  }

  addHints(n) {
    if (!this.scene) return;
    this.scene.hints += n;
    this.scene._refreshActions();
  }

  resetDeck() {
    GameConfig.set('seen', []);
    this.metaEl.textContent = 'Deck rotation reset - next round draws from all cards';
  }
}

window.testTools = new TestTools();
