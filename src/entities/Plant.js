import { PALETTE, BALANCE } from '../constants/Palette.js';

/**
 * Base class for garden plants.
 */
export class Plant {
  constructor(scene, x, y, name, type) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.name = name;
    this.type = type; // 'sun_lover' or 'shade_feeder'

    this.bloomCharge = 0.15; // 0.0 to 1.0
    this.scorchStress = 0.0; // 0.0 to 1.0
    this.isShaded = false;
    this.isBloomed = false;
    this.hasAwardedBloom = false;
    this.isDead = false;
    this.wateredTimer = 0;
    this.movable = false;
    this.id = null;

    // Graphics containers
    this.plantGraphics = scene.add.graphics();
    this.hudGraphics = scene.add.graphics();

    // Pulse animation timer
    this.animTime = Math.random() * 10;
  }

  update(deltaSeconds, isShaded) {
    this.isShaded = isShaded;
    this.animTime += deltaSeconds * 2.5;
    if (this.wateredTimer > 0) this.wateredTimer = Math.max(0, this.wateredTimer - deltaSeconds);

    this.updateState(deltaSeconds);
    this.drawPlant();
    this.drawMeter();
  }

  water() {
    this.wateredTimer = 4.0;
  }

  isWatered() {
    return this.wateredTimer > 0;
  }

  updateState(deltaSeconds) {
    // Abstract, implemented by subclass
  }

  drawPlant() {
    // Abstract, implemented by subclass
  }

  drawMeter() {
    const g = this.hudGraphics;
    g.clear();

    const mx = this.x;
    const my = this.y - 48; // Floating directly above plant

    // 1. Exposure Badge (Circle with Sun/Moon icon, matching concept art)
    const badgeR = 12;
    g.fillStyle(PALETTE.hudCard, 0.95);
    g.fillCircle(mx - 22, my, badgeR);
    g.lineStyle(1.5, PALETTE.brassMid, 0.9);
    g.strokeCircle(mx - 22, my, badgeR);

    if (this.isShaded) {
      // Shaded Moon icon
      g.fillStyle(PALETTE.gaugeMoon, 1.0);
      g.beginPath();
      g.arc(mx - 22, my, 7, -Math.PI / 2, Math.PI / 2, false);
      g.arc(mx - 25, my, 5, Math.PI / 2, -Math.PI / 2, true);
      g.closePath();
      g.fillPath();
    } else {
      // Sunlit Sun icon
      g.fillStyle(PALETTE.gaugeSun, 1.0);
      g.fillCircle(mx - 22, my, 6);
      g.lineStyle(1.2, PALETTE.sunRays, 1.0);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.lineBetween(
          mx - 22 + Math.cos(a) * 7, my + Math.sin(a) * 7,
          mx - 22 + Math.cos(a) * 10, my + Math.sin(a) * 10
        );
      }
    }

    // 2. Dual Horizontal Mini-Bars (Bloom Charge & Scorch Stress)
    const barW = 46;
    const barH = 5;
    const barX = mx - 6;

    // --- Bloom Charge Bar ---
    g.fillStyle(PALETTE.barBg, 0.85);
    g.fillRect(barX, my - 5, barW, barH);
    g.lineStyle(1, PALETTE.stoneDark, 0.6);
    g.strokeRect(barX, my - 5, barW, barH);

    const bloomW = Math.max(0, Math.min(barW, barW * this.bloomCharge));
    const bloomCol = this.isBloomed ? PALETTE.brassHighlight : PALETTE.barBloom;
    g.fillStyle(bloomCol, 1.0);
    g.fillRect(barX + 0.5, my - 4.5, bloomW, barH - 1);

    // --- Scorch Stress Bar (if applicable or shade feeder) ---
    if (this.type === 'shade_feeder') {
      g.fillStyle(PALETTE.barBg, 0.85);
      g.fillRect(barX, my + 3, barW, barH);
      g.strokeRect(barX, my + 3, barW, barH);

      const stressW = Math.max(0, Math.min(barW, barW * this.scorchStress));
      if (stressW > 0) {
        g.fillStyle(PALETTE.barStress, 1.0);
        g.fillRect(barX + 0.5, my + 3.5, stressW, barH - 1);
      }
    } else {
      // For sun-lover, display comfort notch
      g.fillStyle(PALETTE.stoneMid, 0.8);
      g.fillRect(barX, my + 3, barW, 2);
    }
  }

  checkBloomReward() {
    if (this.bloomCharge >= 1.0 && !this.hasAwardedBloom) {
      this.hasAwardedBloom = true;
      this.isBloomed = true;
      return 10; // 10 pollen spores awarded
    }
    return 0;
  }

  destroy() {
    if (this.plantGraphics) {
      this.plantGraphics.destroy();
      this.plantGraphics = null;
    }
    if (this.hudGraphics) {
      this.hudGraphics.destroy();
      this.hudGraphics = null;
    }
  }
}

/**
 * Solaris Lily (Sun-Lover):
 * Flourishes under direct sunlight, producing golden bloom petals.
 * Goes dormant in shadow.
 */
export class SolarisLily extends Plant {
  constructor(scene, x, y) {
    super(scene, x, y, 'Solaris Lily', 'sun_lover');
  }

  updateState(dt) {
    if (this.isBloomed) {
      this.bloomCharge = 1.0;
      return;
    }
    if (!this.isShaded) {
      // In direct sunlight: bloom increases
      this.bloomCharge = Math.min(1.0, this.bloomCharge + BALANCE.lilyBloomRate * dt);
      if (this.bloomCharge >= 1.0) {
        this.bloomCharge = 1.0;
        this.isBloomed = true;
      }
    } else {
      // In shade: dormant, bloom progress pauses (no decay)
      // no-op
    }
  }

  drawPlant() {
    const g = this.plantGraphics;
    g.clear();

    const x = this.x;
    const y = this.y;

    // Ambient ground shadow under plant
    g.fillStyle(0x181512, 0.35);
    g.fillEllipse(x, y + 8, 28, 14);

    // Green stem
    g.lineStyle(3, PALETTE.lilyStem, 1.0);
    g.beginPath();
    g.moveTo(x, y + 6);
    g.lineTo(x, y - 10);
    g.strokePath();

    // Stem leaves
    g.fillStyle(PALETTE.lilyStem, 1.0);
    g.fillEllipse(x - 8, y - 2, 10, 5);
    g.fillEllipse(x + 8, y - 4, 10, 5);

    // Opening animation factor (more open in sunlight / bloom)
    const openFactor = this.isShaded ? 0.55 : 0.85 + (this.bloomCharge * 0.35);
    const pulse = Math.sin(this.animTime) * 1.5;

    // Glowing aura if fully bloomed
    if (this.isBloomed) {
      g.fillStyle(PALETTE.lilyCenterGlow, 0.25 + Math.sin(this.animTime * 2) * 0.1);
      g.fillCircle(x, y - 16, 24 + pulse);
    }

    // 5 Petals clustered in golden gouache
    const numPetals = 5;
    const petalLen = (14 + this.bloomCharge * 6) * openFactor;
    const petalCol = this.isShaded ? PALETTE.lilyPetal : PALETTE.lilyPetalLight;

    for (let i = 0; i < numPetals; i++) {
      const a = (i / numPetals) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * (petalLen * 0.6);
      const py = y - 16 + Math.sin(a) * (petalLen * 0.6);

      g.fillStyle(petalCol, 1.0);
      g.fillEllipse(px, py, 11, petalLen);

      g.lineStyle(1, PALETTE.lilyCenter, 0.7);
      g.strokeEllipse(px, py, 11, petalLen);
    }

    // Flower Center Stamen
    g.fillStyle(PALETTE.lilyCenter, 1.0);
    g.fillCircle(x, y - 16, 5);

    g.fillStyle(PALETTE.lilyCenterGlow, 1.0);
    g.fillCircle(x, y - 16, 2.5);
  }
}

/**
 * Ghost Fern (Shade-Feeder):
 * Thrives in tranquil shadows with cool cyan bioluminescent fronds.
 * Withers and accumulates Scorch Stress under direct sunlight.
 */
export class GhostFern extends Plant {
  constructor(scene, x, y) {
    super(scene, x, y, 'Ghost Fern', 'shade_feeder');
  }

  updateState(dt) {
    if (this.isBloomed) {
      this.bloomCharge = 1.0;
      return;
    }
    const watered = this.isWatered();
    if (this.isShaded) {
      // In shade: Thriving and blooming!
      this.bloomCharge = Math.min(1.0, this.bloomCharge + BALANCE.fernBloomRate * dt);
      if (this.bloomCharge >= 1.0) {
        this.bloomCharge = 1.0;
        this.isBloomed = true;
      }
      // Scorch stress soothes and recovers
      this.scorchStress = Math.max(0, this.scorchStress - (watered ? BALANCE.fernRecoverRate * 1.8 : BALANCE.fernRecoverRate) * dt);
    } else {
      // In sunlight: Scorching
      const scorch = watered ? BALANCE.fernScorchRate * 0.5 : BALANCE.fernScorchRate;
      this.scorchStress = Math.min(1.0, this.scorchStress + scorch * dt);
      this.bloomCharge = Math.max(0.0, this.bloomCharge - BALANCE.fernSunDecayRate * dt);
    }
    if (this.scorchStress >= 1.0) this.isDead = true;
  }

  drawPlant() {
    const g = this.plantGraphics;
    g.clear();

    const x = this.x;
    const y = this.y;

    // Ambient ground shadow under fern
    g.fillStyle(0x181512, 0.4);
    g.fillEllipse(x, y + 8, 32, 16);

    const isScorched = this.scorchStress > 0.65;
    const pulse = Math.sin(this.animTime * 1.8) * 2;

    // Bioluminescent glow aura in shade
    if (this.isShaded && this.scorchStress < 0.3) {
      const glowR = 26 + (this.bloomCharge * 10) + pulse;
      g.fillStyle(PALETTE.fernFrondGlow, 0.18 + (this.bloomCharge * 0.12));
      g.fillCircle(x, y - 8, glowR);
    } else if (this.scorchStress > 0.4) {
      // Heat warning aura
      g.fillStyle(PALETTE.barStress, 0.15 + (this.scorchStress * 0.15));
      g.fillCircle(x, y - 8, 20 + pulse);
    }

    // Color blending between bioluminescent cyan and scorched red-brown
    const frondColor = isScorched ? PALETTE.fernScorched : (this.isShaded ? PALETTE.fernFrondGlow : PALETTE.fernFrond);
    const stemColor = isScorched ? PALETTE.fernScorchedStem : PALETTE.fernDeep;

    // Draw central arching stems
    g.lineStyle(2, stemColor, 0.95);

    // 5 Arching Fronds
    const frondAngles = [-0.65, -0.32, 0.0, 0.32, 0.65];
    const curl = isScorched ? 0.6 : 1.0; // curls up when scorched

    for (let i = 0; i < frondAngles.length; i++) {
      const a = frondAngles[i] - Math.PI / 2;
      const fLen = (20 + (i === 2 ? 6 : 0)) * curl;

      const tipX = x + Math.cos(a) * fLen;
      const tipY = y + Math.sin(a) * fLen;

      g.lineBetween(x, y, tipX, tipY);

      // Procedural side leaflets along each frond
      const numLeaflets = 4;
      g.fillStyle(frondColor, isScorched ? 0.8 : 0.95);

      for (let j = 1; j <= numLeaflets; j++) {
        const t = j / numLeaflets;
        const lx = x + (tipX - x) * t;
        const ly = y + (tipY - y) * t;

        const leafSize = (4.5 - t * 1.5) * curl;
        g.fillEllipse(lx - 3, ly, leafSize * 1.8, leafSize);
        g.fillEllipse(lx + 3, ly, leafSize * 1.8, leafSize);
      }

      // Frond tip bud
      g.fillStyle(this.isShaded ? PALETTE.fernFrondLight : frondColor, 1.0);
      g.fillCircle(tipX, tipY, isScorched ? 2 : 3);
    }
  }
}

/**
 * Dappled Orchid (Hybrid): needs rhythmic cycles of sun and shade.
 */
export class DappledOrchid extends Plant {
  constructor(scene, x, y) {
    super(scene, x, y, 'Dappled Orchid', 'hybrid');
    this.prevShaded = null;
    this.timeSinceChange = 0;
    this.cycleCount = 0;
    this.neededCycles = 4;
  }

  updateState(dt) {
    if (this.isBloomed) {
      this.bloomCharge = 1.0;
      return;
    }
    if (this.prevShaded === null) this.prevShaded = this.isShaded;
    this.timeSinceChange += dt;

    if (this.isShaded !== this.prevShaded) {
      // transition
      if (this.timeSinceChange >= 0.6 && this.timeSinceChange <= 6.0) {
        this.cycleCount++;
        this.bloomCharge = Math.min(1.0, this.bloomCharge + 0.22);
      } else {
        this.bloomCharge = Math.max(0, this.bloomCharge - 0.05);
      }
      this.prevShaded = this.isShaded;
      this.timeSinceChange = 0;
    }

    if (this.timeSinceChange > 7.0) {
      this.bloomCharge = Math.max(0, this.bloomCharge - 0.02 * dt);
    }

    if (this.bloomCharge >= 1.0) {
      this.bloomCharge = 1.0;
      this.isBloomed = true;
    }
  }

  drawPlant() {
    const g = this.plantGraphics;
    g.clear();
    const x = this.x, y = this.y;
    g.fillStyle(0x181512, 0.35);
    g.fillEllipse(x, y + 8, 30, 14);
    // stem
    g.lineStyle(2, 0x5A7A4A, 1);
    g.lineBetween(x, y + 6, x, y - 12);
    // petals alternating colors
    const open = 0.7 + this.bloomCharge * 0.3;
    const cols = [0xC77DFF, 0xE0AAFF, 0x9D4EDD];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * 10 * open;
      const py = y - 14 + Math.sin(a) * 10 * open;
      g.fillStyle(cols[i % cols.length], 0.9);
      g.fillEllipse(px, py, 8, 12);
    }
    g.fillStyle(0xFFD6A5, 1);
    g.fillCircle(x, y - 14, 4);
    if (this.isBloomed) {
      g.fillStyle(0xFFFFFF, 0.25 + Math.sin(this.animTime * 2) * 0.1);
      g.fillCircle(x, y - 14, 18);
    }
  }
}

/**
 * Velvet Puffball (Shade-Feeder): tolerates brief sun sweeps.
 */
export class VelvetPuffball extends Plant {
  constructor(scene, x, y) {
    super(scene, x, y, 'Velvet Puffball', 'shade_feeder');
    this.sunTimer = 0;
  }

  updateState(dt) {
    const watered = this.isWatered();
    if (this.isBloomed) {
      this.bloomCharge = 1.0;
      return;
    }
    if (this.isShaded) {
      this.bloomCharge = Math.min(1.0, this.bloomCharge + 0.12 * dt);
      this.scorchStress = Math.max(0, this.scorchStress - (watered ? 0.35 : 0.2) * dt);
      this.sunTimer = 0;
    } else {
      this.sunTimer += dt;
      if (this.sunTimer > 1.2) {
        this.scorchStress = Math.min(1.0, this.scorchStress + 0.12 * dt);
        this.bloomCharge = Math.max(0, this.bloomCharge - 0.04 * dt);
      }
    }
    if (this.bloomCharge >= 1.0) {
      this.bloomCharge = 1.0;
      this.isBloomed = true;
    }
    if (this.scorchStress >= 1.0) this.isDead = true;
  }

  drawPlant() {
    const g = this.plantGraphics;
    g.clear();
    const x = this.x, y = this.y;
    g.fillStyle(0x181512, 0.3);
    g.fillEllipse(x, y + 6, 34, 16);
    const col = this.scorchStress > 0.6 ? 0x8B5A3C : 0x7B5EA7;
    const r = 16 + this.bloomCharge * 6;
    g.fillStyle(col, 0.95);
    g.fillCircle(x, y - 8, r);
    g.fillStyle(0xB39DDB, 0.6);
    g.fillCircle(x - 4, y - 12, r * 0.5);
    if (this.isShaded && this.scorchStress < 0.3) {
      g.fillStyle(0xCE93D8, 0.15);
      g.fillCircle(x, y - 8, r + 8);
    }
  }
}

/**
 * Helio Cactus (Sun-Lover): high light; casts small shadow behind.
 */
export class HelioCactus extends Plant {
  constructor(scene, x, y) {
    super(scene, x, y, 'Helio Cactus', 'sun_lover');
  }

  updateState(dt) {
    if (this.isBloomed) {
      this.bloomCharge = 1.0;
      return;
    }
    const watered = this.isWatered();
    if (!this.isShaded) {
      this.bloomCharge = Math.min(1.0, this.bloomCharge + (watered ? 0.1 : 0.16) * dt);
      if (this.bloomCharge >= 1.0) {
        this.bloomCharge = 1.0;
        this.isBloomed = true;
      }
    } else {
      // In shade: dormant, bloom progress pauses
    }
  }

  drawPlant() {
    const g = this.plantGraphics;
    g.clear();
    const x = this.x, y = this.y;
    g.fillStyle(0x181512, 0.3);
    g.fillEllipse(x, y + 8, 24, 12);
    g.fillStyle(0x2E7D32, 1);
    g.fillRoundedRect(x - 6, y - 28, 12, 34, 4);
    // arms
    g.fillRoundedRect(x - 14, y - 20, 8, 14, 3);
    g.fillRoundedRect(x + 6, y - 24, 8, 16, 3);
    g.fillStyle(0x81C784, 0.8);
    g.fillCircle(x, y - 30, 4);
    if (this.isBloomed) {
      g.fillStyle(0xFFEB3B, 0.3);
      g.fillCircle(x, y - 18, 18);
    }
  }
}
