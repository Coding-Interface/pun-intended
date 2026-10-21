/**
 * ToggleSwitch: pill-shaped on/off switch with a sliding knob.
 */
class ToggleSwitch extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { value = false, onChange, width = 120, height = 64 } = {}) {
    super(scene, x, y);
    this.value = value;
    this.onChange = onChange;
    this.w = width;
    this.h = height;
    this.track = scene.add.graphics();
    this.knob = scene.add.graphics();
    this.add([this.track, this.knob]);
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerup', () => this.toggle());
    this._drawTrack();
    this._drawKnob();
    this.knob.x = this._knobX();
    scene.add.existing(this);
  }

  _knobX() {
    return this.value ? this.w / 2 - this.h / 2 : -this.w / 2 + this.h / 2;
  }

  _drawTrack() {
    const { w, h } = this;
    this.track.clear();
    this.track.fillStyle(this.value ? Theme.C.green : 0x4a4466, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.track.lineStyle(4, Theme.C.ink, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  }

  _drawKnob() {
    const r = this.h / 2 - 7;
    this.knob.clear();
    this.knob.fillStyle(0x000000, 0.25).fillCircle(2, 4, r);
    this.knob.fillStyle(0xffffff, 1).fillCircle(0, 0, r);
    this.knob.lineStyle(3, Theme.C.ink, 0.6).strokeCircle(0, 0, r);
    // tiny on/off glyph inside the knob
    if (this.value) Icons.draw(this.knob, 'check', r * 1.1, Theme.C.green);
    else Icons.draw(this.knob, 'close', r * 0.9, 0x9a93c0);
  }

  toggle() {
    this.setValue(!this.value, true);
  }

  setValue(v, notify = false) {
    this.value = v;
    Sfx.click();
    this._drawTrack();
    this._drawKnob();
    this.scene.tweens.add({ targets: this.knob, x: this._knobX(), duration: 160, ease: 'Back.out' });
    if (notify && this.onChange) this.onChange(v);
    return this;
  }
}
