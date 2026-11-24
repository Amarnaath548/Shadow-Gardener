import { PALETTE } from '../constants/Palette.js';

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

    const x = this.x;
    const y = this.y;
    const s = this.scale;

    // Pedestal base (stone plinth)
    const pw = 34 * s;
    const ph = 24 * s;

    // Base shadow rim
    g.fillStyle(0x181512, 0.4);
    g.fillEllipse(x, y + ph * 0.45, pw * 1.1, ph * 0.6);

    // Plinth bottom tier
    g.fillStyle(PALETTE.stoneDark, 1.0);
    g.fillRect(x - pw * 0.5, y - ph * 0.5, pw, ph);

    // Plinth top bevel
    g.fillStyle(PALETTE.stoneMid, 1.0);
    g.fillRect(x - pw * 0.4, y - ph * 0.45, pw * 0.8, ph * 0.7);

    // Dynamic light facet calculation based on sun angle
    // Determine which side of obelisk is sunlit
    const sunVectorX = Math.cos(sunAngle);
    const leftIsSunlit = sunVectorX < 0;

    const leftFacetCol = leftIsSunlit ? PALETTE.basaltLight : PALETTE.basaltDeep;
    const rightFacetCol = leftIsSunlit ? PALETTE.basaltDeep : PALETTE.basaltMid;

    const shaftW = 18 * s;
    const topW = 10 * s;
    const shaftH = 60 * s;
    const tipH = 14 * s;

    const baseY = y - 4 * s;
    const topY = baseY - shaftH;
    const tipY = topY - tipH;

    // Left Facet of Obelisk Shaft
    g.fillStyle(leftFacetCol, 1.0);
    g.beginPath();
    g.moveTo(x - shaftW * 0.5, baseY);
    g.lineTo(x, baseY);
    g.lineTo(x, topY);
    g.lineTo(x - topW * 0.5, topY);
    g.closePath();
    g.fillPath();

    // Right Facet of Obelisk Shaft
    g.fillStyle(rightFacetCol, 1.0);
    g.beginPath();
    g.moveTo(x, baseY);
    g.lineTo(x + shaftW * 0.5, baseY);
    g.lineTo(x + topW * 0.5, topY);
    g.lineTo(x, topY);
    g.closePath();
    g.fillPath();

    // Pyramidion Tip Left
    g.fillStyle(leftIsSunlit ? PALETTE.basaltHighlight : PALETTE.basaltMid, 1.0);
    g.beginPath();
    g.moveTo(x - topW * 0.5, topY);
    g.lineTo(x, topY);
    g.lineTo(x, tipY);
    g.closePath();
    g.fillPath();

    // Pyramidion Tip Right
    g.fillStyle(leftIsSunlit ? PALETTE.basaltMid : PALETTE.basaltLight, 1.0);
    g.beginPath();
    g.moveTo(x, topY);
    g.lineTo(x + topW * 0.5, topY);
    g.lineTo(x, tipY);
    g.closePath();
    g.fillPath();

    // Golden runic carved channel down the center
    g.lineStyle(1.5 * s, PALETTE.basaltRune, 0.75);
    g.beginPath();
    g.moveTo(x, baseY - 6 * s);
    g.lineTo(x, topY + 4 * s);
    g.strokePath();

    // Runic diamond badge
    g.fillStyle(PALETTE.basaltRune, 0.9);
    g.beginPath();
    g.moveTo(x, baseY - 24 * s);
    g.lineTo(x + 3 * s, baseY - 20 * s);
    g.lineTo(x, baseY - 16 * s);
    g.lineTo(x - 3 * s, baseY - 20 * s);
    g.closePath();
    g.fillPath();
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
    this.minRadius = 30;
    this.maxRadius = 90;
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
    this.radius = Math.min(this.maxRadius, this.radius + 6);
    this.regenerateFootprint();
  }

  prune() {
    this.radius = Math.max(this.minRadius, this.radius - 8);
    this.regenerateFootprint();
  }

  getFootprintVertices() {
    return this.footprint;
  }

  draw(sunAngle) {
    const g = this.graphics;
    g.clear();

    const x = this.x;
    const y = this.y;

    // Ambient ground shadow under trunk
    g.fillStyle(0x181512, 0.5);
    g.fillEllipse(x, y + 16, 68, 38);

    // Thick twisted Banyan trunk & aerial roots
    g.fillStyle(PALETTE.treeTrunkDark, 1.0);
    g.beginPath();
    g.moveTo(x - 22, y + 22);
    g.lineTo(x - 14, y - 10);
    g.lineTo(x + 14, y - 10);
    g.lineTo(x + 22, y + 22);
    g.lineTo(x + 8, y + 18);
    g.lineTo(x, y + 12);
    g.lineTo(x - 8, y + 18);
    g.closePath();
    g.fillPath();

    // Trunk highlights
    g.fillStyle(PALETTE.treeTrunk, 1.0);
    g.fillRect(x - 10, y - 6, 20, 22);

    // Hanging aerial roots (vines)
    g.lineStyle(2, PALETTE.treeVine, 0.9);
    g.lineBetween(x - 28, y - 4, x - 30, y + 18);
    g.lineBetween(x - 18, y - 2, x - 19, y + 22);
    g.lineBetween(x + 18, y - 2, x + 19, y + 20);
    g.lineBetween(x + 28, y - 4, x + 30, y + 16);

    // Canopy foliage blobs (gouache layering)
    // Dark base foliage
    g.fillStyle(PALETTE.treeLeafDark, 1.0);
    g.fillCircle(x - 28, y - 24, 30);
    g.fillCircle(x + 28, y - 24, 30);
    g.fillCircle(x, y - 36, 38);
    g.fillCircle(x - 16, y - 10, 26);
    g.fillCircle(x + 16, y - 10, 26);

    // Mid green lush leaves
    g.fillStyle(PALETTE.treeLeafMid, 1.0);
    g.fillCircle(x - 24, y - 28, 25);
    g.fillCircle(x + 24, y - 28, 25);
    g.fillCircle(x, y - 38, 32);
    g.fillCircle(x - 12, y - 14, 22);
    g.fillCircle(x + 12, y - 14, 22);

    // Sunlit foliage highlights based on sun position
    const lightOffsetX = -Math.cos(sunAngle) * 8;
    const lightOffsetY = -Math.sin(sunAngle) * 8;

    g.fillStyle(PALETTE.treeLeafLight, 0.95);
    g.fillCircle(x - 20 + lightOffsetX, y - 32 + lightOffsetY, 18);
    g.fillCircle(x + 20 + lightOffsetX, y - 32 + lightOffsetY, 18);
    g.fillCircle(x + lightOffsetX, y - 42 + lightOffsetY, 24);

    // Top gouache dapples
    g.fillStyle(PALETTE.treeLeafHighlight, 0.85);
    g.fillCircle(x + lightOffsetX * 1.3, y - 46 + lightOffsetY * 1.3, 14);
    g.fillCircle(x - 18 + lightOffsetX * 1.2, y - 36 + lightOffsetY * 1.2, 10);
  }
}
