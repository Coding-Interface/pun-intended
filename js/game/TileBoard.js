/**
 * TileBoard: the "Letter Tiles" puzzle. Answer slots (grouped by word)
 * on top, scrambled letter pool below. Tap / type to place, tap a placed
 * tile or press Backspace to send it back. Hint locks the next correct letter.
 */
class TileBoard {
  static SPACING = 1.14; // tile pitch as a multiple of tile size
  static WORD_GAP = 0.6; // extra gap between words (in tile units)
  static DECOYS = 3;

  /**
   * @param {Phaser.Scene} scene
   * @param {{cx:number, top:number, bottom:number, width:number}} area
   * @param {{onSolved:Function, onWrong:Function}} callbacks
   */
  constructor(scene, area, callbacks) {
    this.scene = scene;
    this.area = area;
    this.cb = callbacks;
    this.tiles = [];
    this.slots = [];
    this.enabled = false;
    this.caret = scene.add.graphics().setDepth(25);
    this.caretTween = scene.tweens.add({
      targets: this.caret,
      alpha: { from: 1, to: 0.35 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Build                                                               */
  /* ------------------------------------------------------------------ */

  build(card, dealFrom) {
    this.card = card;
    this.answer = Utils.lettersOnly(card.answer);
    const words = card.answer.trim().toUpperCase().split(/\s+/);
    const { cx, top, bottom, width } = this.area;
    const SP = TileBoard.SPACING;
    const unitsOf = (ws) => ws.reduce((a, w) => a + w.length, 0) * SP - (SP - 1) + (ws.length - 1) * TileBoard.WORD_GAP;

    // Slot rows: one row, or split multi-word answers over two rows if tiles get too small
    let rows = [words];
    let slotSize = width / unitsOf(words);
    if (slotSize < 76 && words.length > 1) {
      let best = null;
      for (let k = 1; k < words.length; k++) {
        const a = words.slice(0, k);
        const b = words.slice(k);
        const u = Math.max(unitsOf(a), unitsOf(b));
        if (!best || u < best.u) best = { u, rows: [a, b] };
      }
      rows = best.rows;
      slotSize = width / best.u;
    }

    // Pool letters: answer + decoys, never letting the answer come out pre-solved
    const letters = this.answer.split('');
    const alphabet = 'ABCDEFGHIJKLMNOPRSTUVWY';
    for (let i = 0; i < TileBoard.DECOYS; i++) letters.push(Utils.pick(alphabet.split('')));
    let pool = Utils.shuffle(letters);
    let guard = 0;
    while (pool.slice(0, this.answer.length).join('') === this.answer && guard++ < 10) pool = Utils.shuffle(letters);

    const n = pool.length;
    let perRow = n;
    let poolSize = width / (n * SP);
    if (poolSize < 72) {
      perRow = Math.ceil(n / 2);
      poolSize = width / (perRow * SP);
    }
    const size = Math.floor(Math.min(slotSize, poolSize, 100));
    this.size = size;
    const tileH = size * 1.1;
    const rowGap = size * 0.22;

    const slotRows = rows.length;
    const poolRows = Math.ceil(n / perRow);
    const slotsH = slotRows * tileH + (slotRows - 1) * rowGap;
    const poolH = poolRows * tileH + (poolRows - 1) * rowGap;
    const between = Math.max(50, size * 0.8);
    const total = slotsH + between + poolH;
    let y = top + Math.max(0, (bottom - top - total) / 2) + tileH / 2;

    // Slots
    this.slots = [];
    let index = 0;
    rows.forEach((rowWords) => {
      const rowW = unitsOf(rowWords) * size;
      let x = cx - rowW / 2 + size / 2;
      rowWords.forEach((word, wi) => {
        for (let i = 0; i < word.length; i++) {
          this.slots.push(this._makeSlot(index++, x, y));
          x += size * SP;
        }
        if (wi < rowWords.length - 1) x += size * TileBoard.WORD_GAP;
      });
      y += tileH + rowGap;
    });
    this.poolTop = y - tileH / 2 - rowGap + between;

    // Pool tiles
    y = this.poolTop + tileH / 2;
    this.tiles = [];
    for (let r = 0; r < poolRows; r++) {
      const rowLetters = pool.slice(r * perRow, (r + 1) * perRow);
      const rowW = rowLetters.length * size * SP - size * (SP - 1);
      rowLetters.forEach((ch, i) => {
        const x = cx - rowW / 2 + size / 2 + i * size * SP;
        const tile = new LetterTile(this.scene, dealFrom.x, dealFrom.y, ch, size);
        tile.home = { x, y };
        tile.setScale(0.2).setDepth(30);
        tile.on('pointerdown', () => this._onTileTap(tile));
        this.tiles.push(tile);
        tile.flyTo(x, y, { duration: 420, delay: 120 + (r * perRow + i) * 35 });
        this.scene.time.delayedCall(120 + (r * perRow + i) * 35, () => Sfx.deal(i));
      });
      y += tileH + rowGap;
    }

    const dealTime = 120 + n * 35 + 420;
    this.scene.time.delayedCall(dealTime, () => {
      this.enabled = true;
      this._updateCaret();
    });
    return dealTime;
  }

  _makeSlot(index, x, y) {
    const s = this.size;
    const lip = Math.round(s * 0.1);
    const g = this.scene.add.graphics().setDepth(22);
    g.fillStyle(Theme.C.ink, 0.7);
    g.fillRoundedRect(x - s / 2, y - lip / 2 - s / 2 + lip, s, s, s * 0.18);
    g.lineStyle(3, 0xffffff, 0.18);
    g.strokeRoundedRect(x - s / 2, y - lip / 2 - s / 2 + lip, s, s, s * 0.18);
    g.setAlpha(0);
    this.scene.tweens.add({ targets: g, alpha: 1, duration: 300, delay: index * 25 });
    return { index, x, y, tile: null, gfx: g };
  }

  /* ------------------------------------------------------------------ */
  /* Interaction                                                         */
  /* ------------------------------------------------------------------ */

  _onTileTap(tile) {
    if (!this.enabled || tile.locked) return;
    if (tile.state === 'pool') {
      const slot = this.slots.find((s) => !s.tile);
      if (!slot) return;
      this._place(tile, slot);
      this._afterChange();
    } else {
      Sfx.drop();
      this._return(tile);
      this._updateCaret();
    }
  }

  _place(tile, slot) {
    tile.state = 'slot';
    tile.slot = slot;
    slot.tile = tile;
    tile.setStyleName('placed');
    tile.flyTo(slot.x, slot.y, { duration: 240, restDepth: 32 });
    Sfx.pop(slot.index);
  }

  _return(tile) {
    if (tile.slot) tile.slot.tile = null;
    tile.slot = null;
    tile.state = 'pool';
    tile.locked = false;
    tile.setStyleName('normal');
    tile.flyTo(tile.home.x, tile.home.y, { duration: 260 });
  }

  _afterChange() {
    this._updateCaret();
    if (this.slots.every((s) => s.tile)) {
      this.enabled = false;
      this.scene.time.delayedCall(280, () => this._evaluate());
    }
  }

  _updateCaret() {
    this.caret.clear();
    const slot = this.slots.find((s) => !s.tile);
    if (!slot || !this.enabled) return;
    const s = this.size;
    const lip = Math.round(s * 0.1);
    this.caret.lineStyle(5, Theme.C.gold, 1);
    this.caret.strokeRoundedRect(slot.x - s / 2 - 5, slot.y - lip / 2 - s / 2 + lip - 5, s + 10, s + 10, s * 0.2);
  }

  _evaluate() {
    const guess = this.slots.map((s) => s.tile.char).join('');
    if (guess === this.answer) {
      this.slots.forEach((s, i) => {
        s.tile.setStyleName('correct');
        s.tile.jump(i * 45);
      });
      this.caret.clear();
      if (this.cb.onSolved) this.cb.onSolved();
      return;
    }

    // Wrong: flash red, shake, then send unlocked tiles home
    this.slots.forEach((s) => {
      if (!s.tile.locked) {
        s.tile.setStyleName('wrong');
        s.tile.shake();
      }
    });
    if (this.cb.onWrong) this.cb.onWrong();
    this.scene.time.delayedCall(650, () => {
      this.slots.forEach((s) => {
        if (s.tile && !s.tile.locked) this._return(s.tile);
      });
      this.enabled = true;
      this._updateCaret();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Public actions                                                      */
  /* ------------------------------------------------------------------ */

  handleKey(key) {
    if (!this.enabled) return;
    if (key === 'Backspace' || key === 'Delete') {
      const filled = this.slots.filter((s) => s.tile && !s.tile.locked);
      const last = filled[filled.length - 1];
      if (last) {
        Sfx.drop();
        this._return(last.tile);
        this._updateCaret();
      }
      return;
    }
    if (/^[a-zA-Z]$/.test(key)) {
      const ch = key.toUpperCase();
      const tile = this.tiles.find((t) => t.state === 'pool' && t.char === ch);
      if (tile) this._onTileTap(tile);
    }
  }

  /** What the next hint will do (shown on the hint button). */
  get hintLabel() {
    return 'Reveal a letter';
  }

  /** Locks the first wrong/empty slot to the correct letter. Returns false if nothing to do. */
  hint() {
    if (!this.enabled) return false;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const need = this.answer[i];
      if (slot.tile && slot.tile.char === need) continue;

      if (slot.tile) this._return(slot.tile);

      let tile = this.tiles.find((t) => t.state === 'pool' && t.char === need);
      if (!tile) {
        // The letter is sitting in a wrong slot somewhere - pull it out
        tile = this.tiles.find(
          (t) => t.state === 'slot' && !t.locked && t.char === need && this.answer[t.slot.index] !== need,
        );
        if (tile) this._return(tile);
      }
      if (!tile) return false;

      tile.state = 'slot';
      tile.slot = slot;
      slot.tile = tile;
      tile.locked = true;
      tile.setStyleName('hint');
      tile.flyTo(slot.x, slot.y, { duration: 320, restDepth: 32 });
      Sfx.hint();
      this.scene.time.delayedCall(320, () => {
        if (this.scene && this.scene.fx) this.scene.fx.sparkle(slot.x, slot.y, 12);
      });
      this._afterChange();
      return true;
    }
    return false;
  }

  /** Animate everything away and clean up. */
  destroy() {
    this.enabled = false;
    this.caretTween.stop();
    this.caret.destroy();
    this.tiles.forEach((t, i) => {
      this.scene.tweens.killTweensOf(t);
      if (t._arcTween) t._arcTween.stop();
      this.scene.tweens.add({
        targets: t,
        scale: 0,
        alpha: 0,
        angle: Phaser.Math.Between(-90, 90),
        duration: 260,
        delay: i * 12,
        ease: 'Back.in',
        onComplete: () => t.destroy(),
      });
    });
    this.slots.forEach((s) => {
      this.scene.tweens.add({ targets: s.gfx, alpha: 0, duration: 220, onComplete: () => s.gfx.destroy() });
    });
    this.tiles = [];
    this.slots = [];
  }
}
