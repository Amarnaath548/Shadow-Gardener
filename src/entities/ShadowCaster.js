import { PALETTE } from '../constants/Palette.js';
import { ensureSprite, createPixelImage } from '../systems/PixelArt.js';

/**
 * Base class for all shadow casting obstacles.
 */
export class ShadowCaster {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.graphics = scene.add.graphics();
    this.shadowLengthMultiplier = 1.0;
  }

  getFootprintVertices() {
    return [];
  }

  draw(sunAngle) {
    // Override in subclass
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

/**
 * Basalt Obelisk:
 * A tall monolithic polygonal pillar with pedestal base and chiseled facets.
 */
export class BasaltObelisk extends ShadowCaster {
  constructor(scene, x, y, scale = 1.0, rotatable = false) {
    super(scene, x, y);
    this.scale = scale;
    this.baseW = 28 * scale;
    this.baseH = 20 * scale;
    this.height = 70 * scale;
    this.shadowLengthMultiplier = 1.1;
    this.rotatable = rotatable;
    this.rotation = 0;

    this.draw(0);
  }

  rotate(delta) {
    this.rotation += delta;
    // normalize
    while (this.rotation > Math.PI) this.rotation -= Math.PI * 2;
    while (this.rotation < -Math.PI) this.rotation += Math.PI * 2;
  }

  getFootprintVertices() {
    const hw = this.baseW * 0.5;
    const hh = this.baseH * 0.5;
    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh }
    ];
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    return corners.map(c => ({
      x: this.x + c.x * cos - c.y * sin,
      y: this.y + c.x * sin + c.y * cos
    }));
  }

  draw(sunAngle) {
    const g = this.graphics;
    g.clear();

    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const s = this.scale;

    if (this.rotatable) {
      const turnKey = ensureSprite(this.scene, 'brass_turntable');
      if (turnKey) {
        if (!this.turntableSprite) {
          this.turntableSprite = createPixelImage(this.scene, x, y + Math.round(4 * s), turnKey, 2 * s);
          if (this.turntableSprite) this.turntableSprite.setDepth(2);
        } else {
          this.turntableSprite.setPosition(x, y + Math.round(4 * s));
          this.turntableSprite.setScale(2 * s);
          this.turntableSprite.setRotation(this.rotation);
        }
      }
    }

    const leftIsSunlit = Math.cos(sunAngle) < 0;
    const obKey = ensureSprite(this.scene, leftIsSunlit ? 'obelisk_left' : 'obelisk_right');
    if (obKey) {
      if (!this.sprite) {
        this.sprite = createPixelImage(this.scene, x, y - Math.round(28 * s), obKey, 2.2 * s);
        if (this.sprite) this.sprite.setDepth(3);
      } else {
        if (this.sprite.texture && this.sprite.texture.key !== obKey) {
          this.sprite.setTexture(obKey);
        }
        this.sprite.setPosition(x, y - Math.round(28 * s));
        this.sprite.setScale(2.2 * s);
      }
    }
  }

  destroy() {
    if (this.turntableSprite) { this.turntableSprite.destroy(); this.turntableSprite = null; }
    if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
    super.destroy();
  }
}

/**
 * Whispering Banyan Tree:
 * Majestic ancient tree with thick gnarled trunk, hanging aerial roots,
 * and broad multi-tiered gouache canopy.
 */
export class WhisperingBanyan extends ShadowCaster {
  constructor(scene, x, y, radius = 55) {
    super(scene, x, y);
    this.baseRadius = radius;
    this.radius = radius;
    this.growth = radius;
    this.height = this.growth;
    this.minGrowth = 30;
    this.maxGrowth = 90;
    this.shadowLengthMultiplier = 1.35;

    this.regenerateFootprint();
    this.draw(0);
  }

  regenerateFootprint() {
    this.footprint = [];
    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const jitter = (i % 2 === 0 ? 1.04 : 0.94);
      const r = this.radius * jitter;
      this.footprint.push({
        x: this.x + Math.cos(a) * r,
        y: this.y + Math.sin(a) * (r * 0.85)
      });
    }
  }

  water() {
    this.growth = Math.min(this.maxGrowth, this.growth + 6);
    this.height = this.growth;
    this.radius = this.growth;
    this.regenerateFootprint();
  }

  prune() {
    this.growth = Math.max(this.minGrowth, this.growth - 8);
    this.height = this.growth;
    this.radius = this.growth;
    this.regenerateFootprint();
  }

  getFootprintVertices() {
    return this.footprint;
  }

  draw(sunAngle) {
    const g = this.graphics;
    g.clear();

    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const sc = this.growth / 55;
    const spriteScale = 2.6 * sc;

    const baseKey = ensureSprite(this.scene, 'banyan_base');
    const hiKey = ensureSprite(this.scene, 'banyan_highlight');

    if (baseKey) {
      if (!this.sprite) {
        this.sprite = createPixelImage(this.scene, x, y - Math.round(8 * sc), baseKey, spriteScale);
        if (this.sprite) this.sprite.setDepth(3);
      } else {
        this.sprite.setPosition(x, y - Math.round(8 * sc));
        this.sprite.setScale(spriteScale);
      }
    }

    if (hiKey) {
      const lightOffsetX = Math.round(-Math.cos(sunAngle) * 5 * sc);
      const lightOffsetY = Math.round(-Math.sin(sunAngle) * 4 * sc);
      const hy = y - Math.round(32 * sc) + lightOffsetY;
      if (!this.highlightSprite) {
        this.highlightSprite = createPixelImage(this.scene, x + lightOffsetX, hy, hiKey, spriteScale);
        if (this.highlightSprite) this.highlightSprite.setDepth(3);
      } else {
        this.highlightSprite.setPosition(x + lightOffsetX, hy);
        this.highlightSprite.setScale(spriteScale);
      }
    }
  }

  destroy() {
    if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
    if (this.highlightSprite) { this.highlightSprite.destroy(); this.highlightSprite = null; }
    super.destroy();
  }
}
