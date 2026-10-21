/**
 * TextureFactory: builds every procedural texture.
 *  buildUi()        - card back, gradients, particles, loader stripes (before loading)
 *  buildCardFaces() - one rounded texture per card (after the card images load)
 */
class TextureFactory {
  constructor(scene) {
    this.scene = scene;
  }

  /** Everything the loader screen itself needs (no downloaded files required). */
  buildUi() {
    this.buildCardBack();
    this.buildBackground();
    this.buildVignette();
    this.buildRays();
    this.buildGlow();
    this.buildConfetti();
    this.buildSparkle();
    this.buildStripes();
  }

  /** Candy stripes for the loading bar (tiled + scrolled). */
  buildStripes() {
    const s = 64;
    const { canvasTex, ctx } = this._canvas('stripes', s, s);
    ctx.fillStyle = '#ff5e5b';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#ffc93c';
    for (let i = -s; i < s * 2; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 16, 0);
      ctx.lineTo(i + 16 + s, s);
      ctx.lineTo(i + s, s);
      ctx.closePath();
      ctx.fill();
    }
    canvasTex.refresh();
  }

  _canvas(key, w, h) {
    const tex = this.scene.textures;
    if (tex.exists(key)) tex.remove(key);
    const canvasTex = tex.createCanvas(key, w, h);
    return { canvasTex, ctx: canvasTex.getContext() };
  }

  _roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** One clean texture per card, clipped with rounded corners. */
  buildCardFaces() {
    CARDS_DATA.forEach((card) => {
      let img;
      let f;
      if (card.image) {
        // Standalone image file (loaded in BootScene as card_src_<id>)
        img = this.scene.textures.get(`card_src_${card.id}`).getSourceImage();
        f = { x: 0, y: 0, w: img.width, h: img.height };
      } else {
        // Cut from a sprite sheet: exact `frame` rect, or an even grid cell
        const key = card.sheet || 'pun';
        const sheet = CARD_SHEETS[key];
        img = this.scene.textures.get(`sheet_${key}`).getSourceImage();
        const cellW = img.width / sheet.cols;
        const cellH = img.height / sheet.rows;
        f = card.frame || { x: card.col * cellW, y: card.row * cellH, w: cellW, h: cellH };
      }
      const { canvasTex, ctx } = this._canvas(`card_${card.id}`, f.w, f.h);
      ctx.save();
      this._roundRectPath(ctx, 0, 0, f.w, f.h, Math.round(f.w * 0.055));
      ctx.clip();
      ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      ctx.restore();
      canvasTex.refresh();
    });
  }

  buildCardBack() {
    const w = 320;
    const h = 500;
    const { canvasTex, ctx } = this._canvas('card_back', w, h);
    const r = 20;

    // Base
    this._roundRectPath(ctx, 0, 0, w, h, r);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3a2e7a');
    g.addColorStop(1, '#1b1036');
    ctx.fillStyle = g;
    ctx.fill();

    // Diamond pattern
    ctx.save();
    this._roundRectPath(ctx, 14, 14, w - 28, h - 28, 14);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 201, 60, 0.12)';
    ctx.lineWidth = 2;
    for (let i = -h; i < w + h; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, h);
      ctx.lineTo(i + h, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Borders
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffc93c';
    this._roundRectPath(ctx, 4, 4, w - 8, h - 8, r - 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff5e5b';
    this._roundRectPath(ctx, 16, 16, w - 32, h - 32, 12);
    ctx.stroke();

    // Centre medallion
    const cx = w / 2;
    const cy = h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 92, 0, Math.PI * 2);
    ctx.fillStyle = '#fff3d6';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffc93c';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 76, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff5e5b';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `120px ${Theme.FONT_DISPLAY}`;
    ctx.fillStyle = '#ff5e5b';
    ctx.fillText('?', cx, cy + 8);

    // Title ribbons
    ctx.font = `34px ${Theme.FONT_DISPLAY}`;
    ctx.fillStyle = '#ffc93c';
    ctx.fillText('PUN', cx, 70);
    ctx.fillText('INTENDED', cx, h - 70);

    canvasTex.refresh();
  }

  buildBackground() {
    const { canvasTex, ctx } = this._canvas('bg_grad', 8, 512);
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#2d1b69');
    g.addColorStop(0.55, '#171038');
    g.addColorStop(1, '#0b1030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 512);
    canvasTex.refresh();
  }

  buildVignette() {
    const s = 512;
    const { canvasTex, ctx } = this._canvas('vignette', s, s);
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.25, s / 2, s / 2, s * 0.72);
    g.addColorStop(0, 'rgba(5, 3, 20, 0)');
    g.addColorStop(1, 'rgba(5, 3, 20, 0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    canvasTex.refresh();
  }

  buildRays() {
    const s = 1024;
    const { canvasTex, ctx } = this._canvas('rays', s, s);
    const cx = s / 2;
    const rays = 18;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < rays; i++) {
      const a0 = (i / rays) * Math.PI * 2;
      const a1 = a0 + (Math.PI / rays) * 0.9;
      ctx.beginPath();
      ctx.moveTo(cx, cx);
      ctx.lineTo(cx + Math.cos(a0) * s, cx + Math.sin(a0) * s);
      ctx.lineTo(cx + Math.cos(a1) * s, cx + Math.sin(a1) * s);
      ctx.closePath();
      ctx.fill();
    }
    // Fade the rays out towards the edge
    ctx.globalCompositeOperation = 'destination-in';
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'source-over';
    canvasTex.refresh();
  }

  buildGlow() {
    const s = 256;
    const { canvasTex, ctx } = this._canvas('glow', s, s);
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    canvasTex.refresh();
  }

  buildConfetti() {
    const { canvasTex, ctx } = this._canvas('confetti', 18, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 18, 10);
    canvasTex.refresh();
  }

  buildSparkle() {
    const s = 48;
    const { canvasTex, ctx } = this._canvas('sparkle', s, s);
    const c = s / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(c, 0);
    ctx.quadraticCurveTo(c, c, s, c);
    ctx.quadraticCurveTo(c, c, c, s);
    ctx.quadraticCurveTo(c, c, 0, c);
    ctx.quadraticCurveTo(c, c, c, 0);
    ctx.fill();
    canvasTex.refresh();
  }
}
