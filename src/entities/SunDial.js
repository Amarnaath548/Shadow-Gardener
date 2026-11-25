import { PALETTE, BALANCE } from '../constants/Palette.js';
import { ensureSprite, createPixelImage } from '../systems/PixelArt.js';

/**
 * Orbital Sun Dial entity:
 * Renders the circular brass ring, miniature sun orb, sunburst rays,
 * and handles mouse dragging + Auto-Orbit simulation.
 */
export class SunDial {
  constructor(scene, centerX, centerY, radius = BALANCE.orbitRadius) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;

    // Angle theta in radians (0 = 3 o'clock / East)
    this.angle = -3 * Math.PI / 4; // Morning-ish start
    this.isDragging = false;
    this.isAutoOrbit = false;
    this.autoOrbitSpeed = BALANCE.autoOrbitSpeed;

    // Create graphics layers
    this.ringGraphics = scene.add.graphics();
    this.sunGraphics = scene.add.graphics();

    // Pulse animation timer for sun rays
    this.pulseTime = 0;

    // Setup interactive sun hit-area
    this.sunHandle = scene.add.circle(0, 0, 32, 0xffffff, 0);
    this.sunHandle.setInteractive({ cursor: 'grab' });

    this.setupInteractions();
    this.drawBrassRing();
    this.updateSunPosition();
  }

  setupInteractions() {
    this._onSunDown = (pointer) => {
      this.isDragging = true;
      if (this.sunHandle && this.sunHandle.input) {
        this.sunHandle.input.cursor = 'grabbing';
      }
      this.updateAngleFromPointer(pointer);
    };

    this._onScenePointerMove = (pointer) => {
      if (this.isDragging) {
        this.updateAngleFromPointer(pointer);
      }
    };

    this._onScenePointerUp = () => {
      this.stopDragging();
    };

    // Also allow clicking directly anywhere on the brass ring track
    this._onScenePointerDown = (pointer) => {
      const dist = Math.hypot(pointer.x - this.centerX, pointer.y - this.centerY);
      if (Math.abs(dist - this.radius) < 30) {
        this.isDragging = true;
        if (this.sunHandle && this.sunHandle.input) {
          this.sunHandle.input.cursor = 'grabbing';
        }
        this.updateAngleFromPointer(pointer);
      }
    };

    this._onWindowPointerUp = () => {
      this.stopDragging();
    };

    this.sunHandle.on('pointerdown', this._onSunDown);
    this.scene.input.on('pointermove', this._onScenePointerMove);
    this.scene.input.on('pointerup', this._onScenePointerUp);
    this.scene.input.on('pointerupoutside', this._onScenePointerUp);
    this.scene.input.on('gameout', this._onScenePointerUp);
    this.scene.input.on('pointerdown', this._onScenePointerDown);

    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', this._onWindowPointerUp);
      window.addEventListener('blur', this._onWindowPointerUp);
    }
  }

  stopDragging() {
    if (this.isDragging) {
      this.isDragging = false;
      if (this.sunHandle && this.sunHandle.input) {
        this.sunHandle.input.cursor = 'grab';
      }
    }
  }

  destroy() {
    this.stopDragging();

    if (this.sunHandle) {
      this.sunHandle.off('pointerdown', this._onSunDown);
      this.sunHandle.destroy();
      this.sunHandle = null;
    }

    if (this.scene && this.scene.input) {
      this.scene.input.off('pointermove', this._onScenePointerMove);
      this.scene.input.off('pointerup', this._onScenePointerUp);
      this.scene.input.off('pointerupoutside', this._onScenePointerUp);
      this.scene.input.off('gameout', this._onScenePointerUp);
      this.scene.input.off('pointerdown', this._onScenePointerDown);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerup', this._onWindowPointerUp);
      window.removeEventListener('blur', this._onWindowPointerUp);
    }

    if (this.sunRaysSprite) { this.sunRaysSprite.destroy(); this.sunRaysSprite = null; }
    if (this.sunOrbSprite) { this.sunOrbSprite.destroy(); this.sunOrbSprite = null; }

    if (this.ringGraphics) {
      this.ringGraphics.destroy();
      this.ringGraphics = null;
    }

    if (this.sunGraphics) {
      this.sunGraphics.destroy();
      this.sunGraphics = null;
    }
  }

  updateAngleFromPointer(pointer) {
    const dx = pointer.x - this.centerX;
    const dy = pointer.y - this.centerY;
    this.angle = Math.atan2(dy, dx);
    this.updateSunPosition();
  }

  toggleAutoOrbit() {
    this.isAutoOrbit = !this.isAutoOrbit;
    return this.isAutoOrbit;
  }

  setAutoOrbit(val) {
    this.isAutoOrbit = Boolean(val);
  }

  update(deltaSeconds) {
    this.pulseTime += deltaSeconds * 3;

    if (this.isAutoOrbit && !this.isDragging) {
      this.angle += this.autoOrbitSpeed * deltaSeconds;
      while (this.angle > Math.PI) this.angle -= Math.PI * 2;
      while (this.angle < -Math.PI) this.angle += Math.PI * 2;
      this.updateSunPosition();
    } else {
      this.drawSun();
    }
  }

  updateSunPosition() {
    this.sunX = this.centerX + Math.cos(this.angle) * this.radius;
    this.sunY = this.centerY + Math.sin(this.angle) * this.radius;

    this.sunHandle.setPosition(this.sunX, this.sunY);
    this.drawSun();
  }

  /**
   * Draws the double-rail brass orbital ring with gouache aesthetic.
   */
  drawBrassRing() {
    const g = this.ringGraphics;
    g.clear();

    const rOuter = this.radius + 6;
    const rInner = this.radius - 6;

    // Dark under-shadow of brass rail
    g.lineStyle(16, 0x181512, 0.45);
    g.strokeCircle(this.centerX, this.centerY + 3, this.radius);

    // Deep brass frame
    g.lineStyle(14, PALETTE.brassDark, 0.9);
    g.strokeCircle(this.centerX, this.centerY, this.radius);

    // Mid brass body
    g.lineStyle(10, PALETTE.brassMid, 1.0);
    g.strokeCircle(this.centerX, this.centerY, this.radius);

    // Dual shiny rail lines
    g.lineStyle(1.8, PALETTE.brassHighlight, 0.95);
    g.strokeCircle(this.centerX, this.centerY, rOuter);
    g.strokeCircle(this.centerX, this.centerY, rInner);

    // Etched dial notches / hour markings (every 15 degrees = 24 notches)
    const notches = 24;
    for (let i = 0; i < notches; i++) {
      const a = (i / notches) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const len = isMajor ? 9 : 5;
      const col = isMajor ? PALETTE.brassHighlight : PALETTE.brassDark;
      const width = isMajor ? 2.5 : 1.2;

      const x1 = this.centerX + Math.cos(a) * (this.radius - len);
      const y1 = this.centerY + Math.sin(a) * (this.radius - len);
      const x2 = this.centerX + Math.cos(a) * (this.radius + len);
      const y2 = this.centerY + Math.sin(a) * (this.radius + len);

      g.lineStyle(width, col, 0.85);
      g.lineBetween(x1, y1, x2, y2);
    }
  }

  /**
   * Draws the miniature pixel-art sun orb with rotating pixel rays.
   */
  drawSun() {
    const g = this.sunGraphics;
    g.clear();

    const x = Math.round(this.sunX);
    const y = Math.round(this.sunY);

    // Pixelated warm solar aura
    const auraPulse = Math.round(Math.sin(this.pulseTime) * 3);
    g.fillStyle(PALETTE.sunGlow, 0.2);
    g.fillRect(x - 28 - auraPulse, y - 28 - auraPulse, 56 + auraPulse * 2, 56 + auraPulse * 2);
    g.fillStyle(PALETTE.sunGlow, 0.35);
    g.fillRect(x - 20, y - 20, 40, 40);

    const raysKey = ensureSprite(this.scene, 'sun_rays');
    if (raysKey) {
      if (!this.sunRaysSprite) {
        this.sunRaysSprite = createPixelImage(this.scene, x, y, raysKey, 2);
        if (this.sunRaysSprite) this.sunRaysSprite.setDepth(4);
      } else {
        this.sunRaysSprite.setPosition(x, y);
        this.sunRaysSprite.setRotation(this.pulseTime * 0.15);
      }
    }

    const orbKey = ensureSprite(this.scene, 'sun_orb');
    if (orbKey) {
      if (!this.sunOrbSprite) {
        this.sunOrbSprite = createPixelImage(this.scene, x, y, orbKey, 2);
        if (this.sunOrbSprite) this.sunOrbSprite.setDepth(4);
      } else {
        this.sunOrbSprite.setPosition(x, y);
      }
    }
  }

  getSunPosition() {
    return { x: this.sunX, y: this.sunY, angle: this.angle };
  }

  getTimeString() {
    let hrs = (6 + ((this.angle + Math.PI) / (Math.PI * 2)) * 24) % 24;
    hrs = ((hrs % 24) + 24) % 24;
    const totalMinutes = Math.floor(hrs * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHrs = h % 12 === 0 ? 12 : h % 12;
    const displayMins = m < 10 ? `0${m}` : m;
    return `${displayHrs}:${displayMins} ${ampm}`;
  }
}

export function getSunElevation(angle) {
  return Math.max(0.35, (1 - Math.sin(angle)) / 2);
}
