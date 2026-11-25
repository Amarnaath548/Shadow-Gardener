import { PALETTE, BALANCE } from '../constants/Palette.js';
import { ensureSprite, createPixelImage } from '../systems/PixelArt.js';

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

    // Graphics & pixel-art sprite containers
    this.plantGraphics = scene.add.graphics();
    if (this.plantGraphics.setDepth) this.plantGraphics.setDepth(1);
    this.hudGraphics = scene.add.graphics();
    if (this.hudGraphics.setDepth) this.hudGraphics.setDepth(4);
    this.potSprite = null;
    this.sprite = null;
    this.waterSprite = null;
    this.hudBadgeSprite = null;

    // Pulse animation timer
    this.animTime = Math.random() * 10;
  }

  /**
   * Ensures a pixel-art sprite exists for this plant and updates its texture/position.
   */
  syncPixelSprite(spriteName, offsetY = -10, scale = 2.1) {
    const texKey = ensureSprite(this.scene, spriteName);
    if (!texKey) return;

    if (this.movable) {
      if (!this.potSprite) {
        const potKey = ensureSprite(this.scene, 'plant_pot');
        this.potSprite = createPixelImage(this.scene, this.x, this.y + 8, potKey, 2);
        if (this.potSprite) this.potSprite.setDepth(2);
      } else {
        this.potSprite.setPosition(Math.round(this.x), Math.round(this.y + 8));
      }
    }

    if (!this.sprite) {
      this.sprite = createPixelImage(this.scene, this.x, this.y + offsetY, texKey, scale);
      if (this.sprite) this.sprite.setDepth(3);
    } else {
      if (this.sprite.texture && this.sprite.texture.key !== texKey) {
        this.sprite.setTexture(texKey);
      }
      this.sprite.setPosition(Math.round(this.x), Math.round(this.y + offsetY));
      this.sprite.setScale(scale);
    }

    if (this.isWatered()) {
      const dropKey = ensureSprite(this.scene, 'water_drop');
      const bob = Math.round(Math.sin(this.animTime * 2) * 2);
      if (!this.waterSprite && dropKey) {
        this.waterSprite = createPixelImage(this.scene, this.x + 18, this.y - 24 + bob, dropKey, 1.5);
        if (this.waterSprite) this.waterSprite.setDepth(4);
      } else if (this.waterSprite) {
        this.waterSprite.setVisible(true);
        this.waterSprite.setPosition(Math.round(this.x + 18), Math.round(this.y - 24 + bob));
      }
    } else if (this.waterSprite) {
      this.waterSprite.setVisible(false);
    }
  }

  update(deltaSeconds, isShaded) {
    this.isShaded = isShaded;
    this.animTime += deltaSeconds * 2.5;
    if (this.wateredTimer > 0) this.wateredTimer = Math.max(0, this.wateredTimer - deltaSeconds);

    this.updateState(deltaSeconds);
    this.drawPlant();
    this.drawMeter();
  }

  water(bonusSeconds = 0) {
    this.wateredTimer = 4.0 + bonusSeconds;
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

    const mx = Math.round(this.x);
    const my = Math.round(this.y - 48); // Floating directly above plant

    // 1. Pixel-art Exposure Badge (square pixel frame with Sun/Moon sprite)
    g.fillStyle(PALETTE.hudCard, 0.95);
    g.fillRect(mx - 32, my - 10, 20, 20);
    g.lineStyle(2, PALETTE.brassMid, 0.95);
    g.strokeRect(mx - 32, my - 10, 20, 20);

    const badgeName = this.isShaded ? 'moon_badge' : 'sun_badge';
    const badgeKey = ensureSprite(this.scene, badgeName);
    if (badgeKey) {
      if (!this.hudBadgeSprite) {
        this.hudBadgeSprite = createPixelImage(this.scene, mx - 22, my, badgeKey, 1.5);
        if (this.hudBadgeSprite) this.hudBadgeSprite.setDepth(4);
      } else {
        if (this.hudBadgeSprite.texture && this.hudBadgeSprite.texture.key !== badgeKey) {
          this.hudBadgeSprite.setTexture(badgeKey);
        }
        this.hudBadgeSprite.setPosition(mx - 22, my);
      }
    }

    // 2. Dual Horizontal Pixel Mini-Bars (Bloom Charge & Scorch Stress)
    const barW = 46;
    const barH = 6;
    const barX = mx - 6;

    // --- Bloom Charge Bar ---
    g.fillStyle(PALETTE.barBg, 0.9);
    g.fillRect(barX, my - 6, barW, barH);
    g.lineStyle(1.5, PALETTE.stoneDark, 0.85);
    g.strokeRect(barX, my - 6, barW, barH);

    const bloomW = Math.max(0, Math.min(barW - 2, Math.round((barW - 2) * this.bloomCharge)));
    const bloomCol = this.isBloomed ? PALETTE.brassHighlight : PALETTE.barBloom;
    g.fillStyle(bloomCol, 1.0);
    if (bloomW > 0) g.fillRect(barX + 1, my - 5, bloomW, barH - 2);

    // --- Scorch Stress Bar (if applicable or shade feeder) ---
    if (this.type === 'shade_feeder') {
      g.fillStyle(PALETTE.barBg, 0.9);
      g.fillRect(barX, my + 3, barW, barH);
      g.strokeRect(barX, my + 3, barW, barH);

      const stressW = Math.max(0, Math.min(barW - 2, Math.round((barW - 2) * this.scorchStress)));
      if (stressW > 0) {
        g.fillStyle(PALETTE.barStress, 1.0);
        g.fillRect(barX + 1, my + 4, stressW, barH - 2);
      }
    } else {
      // For sun-lover, display comfort notch
      g.fillStyle(PALETTE.stoneMid, 0.8);
      g.fillRect(barX, my + 4, barW, 2);
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
    if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
    if (this.potSprite) { this.potSprite.destroy(); this.potSprite = null; }
    if (this.waterSprite) { this.waterSprite.destroy(); this.waterSprite = null; }
    if (this.hudBadgeSprite) { this.hudBadgeSprite.destroy(); this.hudBadgeSprite = null; }
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

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // Pixelated glowing aura if fully bloomed
    if (this.isBloomed) {
      const pulse = Math.round(Math.sin(this.animTime * 2) * 3);
      g.fillStyle(PALETTE.lilyCenterGlow, 0.22);
      g.fillRect(x - 22 - pulse, y - 34 - pulse, 44 + pulse * 2, 44 + pulse * 2);
    }

    const spriteName = this.isBloomed
      ? 'lily_bloomed'
      : (this.isShaded ? 'lily_shaded' : 'lily_sunlit');
    const scale = 2.0 + (this.bloomCharge * 0.25);
    this.syncPixelSprite(spriteName, -10, scale);
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

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    const isScorched = this.scorchStress > 0.65;
    const pulse = Math.round(Math.sin(this.animTime * 1.8) * 2);

    // Pixelated bioluminescent glow aura or heat warning
    if (this.isShaded && this.scorchStress < 0.3) {
      const r = 22 + Math.round(this.bloomCharge * 6) + pulse;
      g.fillStyle(PALETTE.fernFrondGlow, 0.16 + (this.bloomCharge * 0.1));
      g.fillRect(x - r, y - 12 - r, r * 2, r * 2);
    } else if (this.scorchStress > 0.4) {
      const r = 18 + pulse;
      g.fillStyle(PALETTE.barStress, 0.18 + (this.scorchStress * 0.12));
      g.fillRect(x - r, y - 12 - r, r * 2, r * 2);
    }

    const spriteName = isScorched
      ? 'fern_scorched'
      : (this.isBloomed ? 'fern_bloomed' : (this.isShaded ? 'fern_shaded' : 'fern_sunlit'));
    const scale = 2.0 + (this.bloomCharge * 0.2);
    this.syncPixelSprite(spriteName, -10, scale);
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
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if (this.isBloomed) {
      const pulse = Math.round(Math.sin(this.animTime * 2) * 2);
      g.fillStyle(0xE0AAFF, 0.22);
      g.fillRect(x - 20 - pulse, y - 32 - pulse, 40 + pulse * 2, 40 + pulse * 2);
    }
    const spriteName = (this.isBloomed || this.bloomCharge >= 0.5) ? 'orchid_bloomed' : 'orchid_bud';
    const scale = 2.0 + this.bloomCharge * 0.2;
    this.syncPixelSprite(spriteName, -10, scale);
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
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const isScorched = this.scorchStress > 0.6;
    if (this.isShaded && this.scorchStress < 0.3) {
      g.fillStyle(0xCE93D8, 0.16);
      g.fillRect(x - 20, y - 28, 40, 36);
    }
    const spriteName = isScorched
      ? 'puffball_scorched'
      : (this.isBloomed ? 'puffball_bloomed' : 'puffball_shaded');
    const scale = 2.0 + this.bloomCharge * 0.3;
    this.syncPixelSprite(spriteName, -8, scale);
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
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if (this.isBloomed) {
      g.fillStyle(0xFFEB3B, 0.22);
      g.fillRect(x - 18, y - 34, 36, 40);
    }
    const spriteName = this.isBloomed ? 'cactus_bloomed' : 'cactus_growing';
    this.syncPixelSprite(spriteName, -12, 2.1);
  }
}
