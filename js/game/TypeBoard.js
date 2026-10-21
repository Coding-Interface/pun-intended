/**
 * TypeBoard: the "Keyboard" puzzle. Empty answer boxes (grouped by word)
 * sit above a full on-screen QWERTY keyboard. Type to fill the boxes - the
 * answer is checked automatically when the last box is filled. Tap a placed
 * letter (or press DEL / Backspace) to take it back out.
 *
 * Hints escalate:
 *   1. Remove extra letters -> keys not in the answer are knocked out
 *   2+ Reveal a letter      -> locks the next correct letter in gold
 */
class TypeBoard {
  static ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  static SPACING = 1.12;
  static WORD_GAP = 0.6;

  constructor(scene, area, callbacks) {
    this.scene = scene;
    this.area = area;
    this.cb = callbacks;
    this.enabled = false;
    this.slots = []; // { index, x, y, gfx, tile, locked }
    this.keys = {}; // 'A'..'Z', 'DEL' -> GameButton
    this.distractorsRemoved = false;
    this.objects = [];
  }

  /* ------------------------------------------------------------------ */
  /* Build                                                               */
  /* ------------------------------------------------------------------ */

  build(card) {
    this.card = card;
    this.answer = Utils.lettersOnly(card.answer);
    this.words = card.answer.trim().toUpperCase().split(/\s+/);
    const { cx, top, bottom, width } = this.area;

    // Keyboard (bottom of the area)
    const pitch = Math.min(width / 10, 100);
    this.keyW = pitch * 0.9;
    this.keyH = Math.min(pitch * 1.08, 104);
    const rowGap = this.keyH * 0.16;
    const kbH = this.keyH * 3 + rowGap * 2;
    const kbTop = bottom - kbH;
    this._buildKeyboard(cx, kbTop, pitch, rowGap);

    // Answer boxes (above the keyboard)
    this.answerTop = top + 10;
    this.answerBottom = kbTop - 34;
    this._buildSlots();

    this.caret = this.scene.add.graphics().setDepth(25);
    this.caretTween = this.scene.tweens.add({
      targets: this.caret,
      alpha: { from: 1, to: 0.3 },
      duration: 480,
      yoyo: true,
      repeat: -1,
    });

    const dealTime = 520 + 27 * 18;
    this.scene.time.delayedCall(dealTime, () => {
      this.enabled = true;
      this._updateCaret();
    });
    return dealTime;
  }

  _buildKeyboard(cx, kbTop, pitch, rowGap) {
    let n = 0;
    TypeBoard.ROWS.forEach((row, r) => {
      const y = kbTop + this.keyH / 2 + r * (this.keyH + rowGap);
      const items = row.split('');
      if (r === 2) items.push('DEL');
      const units = items.reduce((a, k) => a + (k.length > 1 ? 1.5 : 1), 0);
      let x = cx - (units * pitch) / 2;
      items.forEach((k) => {
        const wide = k.length > 1;
        const kw = wide ? pitch * 1.5 - (pitch - this.keyW) : this.keyW;
        const bx = x + (wide ? pitch * 0.75 : pitch / 2);
        const btn = wide
          ? new IconButton(this.scene, bx, y, {
              icon: 'backspace',
              width: kw,
              height: this.keyH,
              shape: 'square',
              iconScale: 0.62,
              color: Theme.C.coral,
              onClick: () => this._press(k),
            }).setDepth(30)
          : new GameButton(this.scene, bx, y, {
              width: kw,
              height: this.keyH,
              radius: Math.round(this.keyH * 0.2),
              label: k,
              fontSize: this.keyH * 0.44,
              color: Theme.C.navy,
              onClick: () => this._press(k),
            }).setDepth(30);
        btn.setScale(0);
        this.scene.tweens.add({ targets: btn, scale: 1, duration: 320, delay: 120 + n * 18, ease: 'Back.out' });
        this.keys[k] = btn;
        x += wide ? pitch * 1.5 : pitch;
        n++;
      });
    });
  }

  /** Empty boxes, grouped by word; long multi-word answers split over two rows. */
  _buildSlots() {
    const { cx, width } = this.area;
    const SP = TypeBoard.SPACING;
    const unitsOf = (ws) => ws.reduce((a, w) => a + w.length, 0) * SP - (SP - 1) + (ws.length - 1) * TypeBoard.WORD_GAP;
    let rows = [this.words];
    let size = width / unitsOf(this.words);
    const avail = this.answerBottom - this.answerTop;
    if (size < 74 && this.words.length > 1) {
      let best = null;
      for (let k = 1; k < this.words.length; k++) {
        const u = Math.max(unitsOf(this.words.slice(0, k)), unitsOf(this.words.slice(k)));
        if (!best || u < best.u) best = { u, rows: [this.words.slice(0, k), this.words.slice(k)] };
      }
      rows = best.rows;
      size = width / best.u;
    }
    size = Math.floor(Math.min(size, 92, (avail - 20) / (rows.length * 1.25)));
    this.slotSize = size;
    const lip = Math.round(size * 0.1);
    const tileH = size * 1.1;
    const gap = size * 0.2;
    const blockH = rows.length * tileH + (rows.length - 1) * gap;
    let y = (this.answerTop + this.answerBottom) / 2 - blockH / 2 + tileH / 2;
    let index = 0;
    rows.forEach((rowWords) => {
      const rowW = unitsOf(rowWords) * size;
      let x = cx - rowW / 2 + size / 2;
      rowWords.forEach((word, wi) => {
        for (let i = 0; i < word.length; i++) {
          // Drawn around a local origin so the pop-in scale tween grows from the box centre
          const g = this.scene.add.graphics({ x, y }).setDepth(22);
          g.fillStyle(Theme.C.ink, 0.7).fillRoundedRect(-size / 2, -lip / 2 - size / 2 + lip, size, size, size * 0.18);
          g.lineStyle(3, 0xffffff, 0.18).strokeRoundedRect(-size / 2, -lip / 2 - size / 2 + lip, size, size, size * 0.18);
          g.setScale(0.6).setAlpha(0);
          this.scene.tweens.add({ targets: g, alpha: 1, scaleX: 1, scaleY: 1, duration: 260, delay: 100 + index * 30 });
          this.objects.push(g);
          this.slots.push({ index, x, y, gfx: g, tile: null, locked: false });
          index++;
          x += size * SP;
        }
        if (wi < rowWords.length - 1) x += size * TypeBoard.WORD_GAP;
      });
      y += tileH + gap;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                               */
  /* ------------------------------------------------------------------ */

  handleKey(key) {
    if (!this.enabled) return;
    let k = null;
    if (key === 'Backspace' || key === 'Delete') k = 'DEL';
    else if (/^[a-zA-Z]$/.test(key)) k = key.toUpperCase();
    if (!k || !this.keys[k] || !this.keys[k].enabled) return;
    this.scene.tweens.add({ targets: this.keys[k], scale: 0.88, duration: 60, yoyo: true });
    Sfx.key();
    this._press(k);
  }

  _press(k) {
    if (!this.enabled) return;
    if (k === 'DEL') this._removeLast();
    else this._type(k);
  }

  _type(ch) {
    const slot = this.slots.find((s) => !s.tile);
    if (!slot) return;
    const key = this.keys[ch];
    const tile = new LetterTile(this.scene, key.x, key.y, ch, this.slotSize, { style: 'placed' });
    tile.setDepth(35);
    tile.on('pointerdown', () => this._tapTile(tile));
    slot.tile = tile;
    tile.slot = slot;
    tile.flyTo(slot.x, slot.y, { duration: 230, restDepth: 35 });
    Sfx.pop(slot.index);
    this._afterChange();
  }

  /** Tap a placed letter to take it back out (revealed hint letters stay). */
  _tapTile(tile) {
    if (!this.enabled || !tile.slot || tile.slot.locked) return;
    Sfx.drop();
    this._clearSlot(tile.slot);
    this._updateCaret();
  }

  _removeLast() {
    const filled = this.slots.filter((s) => s.tile && !s.locked);
    const last = filled[filled.length - 1];
    if (!last) return;
    Sfx.drop();
    this._clearSlot(last);
    this._updateCaret();
  }

  _clearSlot(slot) {
    const tile = slot.tile;
    slot.tile = null;
    if (tile) {
      tile.slot = null;
      this._popOut(tile);
    }
  }

  _afterChange() {
    this._updateCaret();
    if (this.slots.every((s) => s.tile)) {
      this.enabled = false;
      this.caret.clear();
      this.scene.time.delayedCall(260, () => this._evaluate());
    }
  }

  _updateCaret() {
    this.caret.clear();
    const slot = this.slots.find((s) => !s.tile);
    if (!slot || !this.enabled) return;
    const s = this.slotSize;
    const lip = Math.round(s * 0.1);
    this.caret.lineStyle(5, Theme.C.gold, 1);
    this.caret.strokeRoundedRect(slot.x - s / 2 - 4, slot.y - lip / 2 - s / 2 - 4 + lip, s + 8, s + 8, s * 0.2);
  }

  /* ------------------------------------------------------------------ */
  /* Evaluate                                                            */
  /* ------------------------------------------------------------------ */

  _evaluate() {
    const guess = this.slots.map((s) => s.tile.char).join('');
    if (guess === this.answer) {
      this.slots.forEach((s, i) => {
        s.tile.setStyleName('correct');
        s.tile.jump(i * 40);
      });
      if (this.cb.onSolved) this.cb.onSolved();
      return;
    }
    this.slots.forEach((s) => {
      if (!s.locked) {
        s.tile.setStyleName('wrong');
        s.tile.shake();
      }
    });
    if (this.cb.onWrong) this.cb.onWrong();
    this.scene.time.delayedCall(650, () => {
      this.slots.forEach((s, i) => {
        if (!s.locked) this.scene.time.delayedCall(i * 25, () => this._clearSlot(s));
      });
      this.scene.time.delayedCall(this.slots.length * 25 + 40, () => {
        this.enabled = true;
        this._updateCaret();
      });
    });
  }

  _popOut(tile) {
    this.scene.tweens.killTweensOf(tile);
    if (tile._arcTween) tile._arcTween.stop();
    tile.disableInteractive();
    this.scene.tweens.add({
      targets: tile,
      scale: 0,
      angle: Phaser.Math.Between(-60, 60),
      duration: 180,
      ease: 'Back.in',
      onComplete: () => tile.destroy(),
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hints                                                               */
  /* ------------------------------------------------------------------ */

  get hintLabel() {
    return this.distractorsRemoved ? 'Reveal a letter' : 'Remove extra letters';
  }

  hint() {
    if (!this.enabled) return false;
    if (!this.distractorsRemoved) return this._hintDistractors();
    return this._hintReveal();
  }

  _hintDistractors() {
    this.distractorsRemoved = true;
    const needed = new Set(this.answer.split(''));
    let i = 0;
    Object.entries(this.keys).forEach(([k, btn]) => {
      if (k.length > 1 || needed.has(k)) return;
      const n = i++;
      this.scene.time.delayedCall(n * 18, () => {
        btn.setEnabled(false, 0.18);
        if (this.scene.fx && n % 3 === 0) this.scene.fx.sparkle(btn.x, btn.y, 4);
      });
    });
    Sfx.hint();
    return true;
  }

  _hintReveal() {
    const slot = this.slots.find((s) => !s.locked && (!s.tile || s.tile.char !== this.answer[s.index]));
    if (!slot) return false;
    if (slot.tile) this._clearSlot(slot);

    const ch = this.answer[slot.index];
    const key = this.keys[ch];
    const tile = new LetterTile(this.scene, key.x, key.y, ch, this.slotSize, { interactive: false, style: 'hint' }).setDepth(36);
    slot.tile = tile;
    slot.locked = true;
    tile.slot = slot;
    tile.flyTo(slot.x, slot.y, { duration: 320, restDepth: 36 });
    this.scene.time.delayedCall(320, () => this.scene.fx && this.scene.fx.sparkle(slot.x, slot.y, 12));
    Sfx.hint();
    this._afterChange();
    return true;
  }

  /* ------------------------------------------------------------------ */

  destroy() {
    this.enabled = false;
    this.caretTween.stop();
    this.caret.destroy();
    this.slots.forEach((s) => s.tile && this._popOut(s.tile));
    Object.values(this.keys).forEach((b, i) => {
      this.scene.tweens.killTweensOf(b);
      this.scene.tweens.add({
        targets: b,
        scale: 0,
        alpha: 0,
        duration: 200,
        delay: i * 6,
        ease: 'Back.in',
        onComplete: () => b.destroy(),
      });
    });
    this.objects.forEach((o) => this.scene.tweens.add({ targets: o, alpha: 0, duration: 200, onComplete: () => o.destroy() }));
    this.slots = [];
    this.keys = {};
  }
}
