import { PALETTE, BALANCE } from '../constants/Palette.js';
import { BasaltObelisk, WhisperingBanyan } from '../entities/ShadowCaster.js';
import { getSunElevation } from '../entities/SunDial.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { LEVELS, getLevel } from '../systems/LevelManager.js';
import { buildLevel, createPlant, projectOntoSegment } from '../systems/LevelBuilder.js';
import Phaser from 'phaser';

export class GardenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GardenScene' });
  }

  init(data) {
    this.levelId = (data && typeof data.levelId === 'number') ? data.levelId : 0;
    this.level = getLevel(this.levelId);
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width * 0.5;
    const centerY = height * 0.48;

    this.centerX = centerX;
    this.centerY = centerY;
    this.pollenCount = 0;
    this.levelComplete = false;
    this.levelFailed = false;
    this.activeTool = null; // 'water','prune','move','rotate' or null
    this.save = SaveSystem.load();
    this.settings = this.save.settings || { volume: 0.7, highContrast: false, reducedMotion: false, colorblind: false };
    this.audio = new AudioSystem();
    this.audio.setVolume(this.save.settings.volume || 0.7);

    this.gardenGraphics = this.add.graphics();
    this.drawTerracedGarden(centerX, centerY);

    this.casters = [];
    this.plants = [];
    this.movableHandles = [];
    this.obeliskHandles = [];
    this.selectedSeed = null;
    this.extraPlantsCount = 0;

    this.buildLevel();

    if (this.save.upgrades && this.save.upgrades.slowSun) {
      this.sunDial.autoOrbitSpeed = BALANCE.autoOrbitSpeed * BALANCE.slowSunMultiplier;
    }

    this.createHUD(width, height);
    this.createToolPanel(width, height);
    if (this.level.goal.type === 'sandbox') {
      this.createSeedTray(width, height);
      if (this.input.mouse) this.input.mouse.disableContextMenu();
    }
    this.createLevelOverlay(width, height);

    // day/night overlay
    this.dayNightOverlay = this.add.graphics();
    this.dayNightOverlay.setDepth(5);
    this.dayNightOverlay.setAlpha(0.0);

    // keyboard
    this.input.keyboard.on('keydown-SPACE', () => { if (this.level.tools.includes('autoOrbit')) { const a = this.sunDial.toggleAutoOrbit(); this.updateAutoOrbitUI(a); } });
    this.input.keyboard.on('keydown-R', () => this.resetLevel());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

    // ambient audio
    this.audio.startAmbient();
  }

  buildLevel() {
    const { casters, plants, shadowSystem, sunDial } = buildLevel(this, this.level);
    this.casters = casters;
    this.plants = plants;
    this.shadowSystem = shadowSystem;
    this.sunDial = sunDial;

    for (const plant of this.plants) {
      if (plant.movable) {
        this.makeMovable(plant);
      }
    }

    // rotatable obelisk click handles
    for (const caster of this.casters) {
      if (caster instanceof BasaltObelisk && caster.rotatable) {
        this.makeRotatable(caster);
      }
    }
  }

  makeMovable(plant) {
    if (plant.track && this.gardenGraphics) {
      const g = this.gardenGraphics;
      g.lineStyle(4, PALETTE.brassDark, 0.85);
      g.lineBetween(plant.track.ax, plant.track.ay, plant.track.bx, plant.track.by);
      g.lineStyle(1.5, PALETTE.brassLight, 0.9);
      g.lineBetween(plant.track.ax, plant.track.ay, plant.track.bx, plant.track.by);
      g.fillStyle(PALETTE.brassMid, 1);
      g.fillCircle(plant.track.ax, plant.track.ay, 4);
      g.fillCircle(plant.track.bx, plant.track.by, 4);
    }
    const handle = this.add.circle(plant.x, plant.y, 22, 0xffffff, 0.001);
    handle.setInteractive({ cursor: 'move' });
    this.input.setDraggable(handle);
    handle.on('drag', (pointer, gameObject, dragX, dragY) => {
      let nx = dragX, ny = dragY;
      if (plant.track) {
        const pt = projectOntoSegment(dragX, dragY, plant.track.ax, plant.track.ay, plant.track.bx, plant.track.by);
        nx = pt.x;
        ny = pt.y;
      }
      plant.x = nx;
      plant.y = ny;
      handle.setPosition(nx, ny);
      if (plant._caster) { plant._caster.x = nx; plant._caster.y = ny; }
      if (plant.drawPlant) plant.drawPlant();
      if (plant.drawMeter) plant.drawMeter();
    });
    plant._handle = handle;
    this.movableHandles.push(handle);
    return handle;
  }

  makeRotatable(caster) {
    const handle = this.add.circle(caster.x, caster.y - 20, 26, 0xffffff, 0.001);
    handle.setInteractive({ cursor: 'pointer' });
    handle.on('pointerdown', () => {
      if (!this.level.tools.includes('rotate')) return;
      caster.rotate(Math.PI / 6);
      this.audio.playClick();
    });
    this.obeliskHandles.push(handle);
  }

  createHUD(width, height) {
    const pollenCard = this.add.graphics();
    pollenCard.fillStyle(PALETTE.hudCard, 0.92);
    pollenCard.fillRoundedRect(width - 210, 20, 190, 58, 10);
    pollenCard.lineStyle(2, PALETTE.hudBorder, 0.85);
    pollenCard.strokeRoundedRect(width - 210, 20, 190, 58, 10);

    this.add.text(width - 195, 27, 'Pollen & Spores', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#D4AF37'
    });

    this.pollenText = this.add.text(width - 195, 44, 'Pollen: 0', {
      fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold', color: '#F7EEDD'
    });

    // level title
    this.add.text(24, 20, this.level.name, {
      fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color: '#E8CA65'
    });
    this.add.text(24, 48, this.level.desc, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: '#C9BA9E', wordWrap: { width: 360 }
    });

    const dialCard = this.add.graphics();
    dialCard.fillStyle(PALETTE.hudCard, 0.94);
    dialCard.fillRoundedRect(20, height - 120, 260, 98, 12);
    dialCard.lineStyle(2, PALETTE.hudBorder, 0.85);
    dialCard.strokeRoundedRect(20, height - 120, 260, 98, 12);

    this.add.text(34, height - 110, 'SUN CONTROL', {
      fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold', color: '#D4AF37', letterSpacing: 2
    });

    this.timeText = this.add.text(34, height - 88, `Time: ${this.sunDial.getTimeString()}`, {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#C9BA9E'
    });

    this.autoOrbitBtn = this.add.container(34, height - 60);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x3C332A, 1.0);
    btnBg.fillRoundedRect(0, 0, 150, 28, 6);
    btnBg.lineStyle(1.5, PALETTE.brassMid, 0.8);
    btnBg.strokeRoundedRect(0, 0, 150, 28, 6);
    this.btnIndicator = this.add.circle(16, 14, 6, 0x888888);
    this.btnText = this.add.text(32, 7, 'Auto-Orbit: OFF', { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#F7EEDD' });
    this.autoOrbitBtn.add([btnBg, this.btnIndicator, this.btnText]);
    this.autoOrbitBtn.setSize(150, 28);
    this.autoOrbitBtn.setInteractive({ cursor: 'pointer' });
    this.autoOrbitBtn.on('pointerdown', () => {
      if (!this.level.tools.includes('autoOrbit')) return;
      const active = this.sunDial.toggleAutoOrbit();
      this.updateAutoOrbitUI(active);
      this.audio.playClick();
    });

    // guide pills
    const guideBox = this.add.graphics();
    guideBox.fillStyle(PALETTE.hudCard, 0.85);
    guideBox.fillRoundedRect(24, 80, 360, 62, 8);
    guideBox.lineStyle(1, PALETTE.stoneDark, 0.6);
    guideBox.strokeRoundedRect(24, 80, 360, 62, 8);
    this.add.text(32, 86, 'Sun: Solaris Lily / Helio Cactus flourish in direct sunlight', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#FFA200' });
    this.add.text(32, 103, 'Moon: Ghost Fern / Velvet Puffball thrive in shadow', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#64DFDF' });
    this.add.text(32, 120, 'Hybrid: Dappled Orchid needs rhythmic sun & shade', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#C77DFF' });

    // pause button
    this.pauseBtn = this.add.text(width - 60, height - 30, '||', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#D4AF37' }).setInteractive({ cursor: 'pointer' });
    this.pauseBtn.on('pointerdown', () => this.togglePause());

    const hasMove = (this.level.plants || []).some(p => p.movable);
    const hasRotate = (this.level.casters || []).some(c => c.rotatable);
    if (hasMove || hasRotate) {
      this.add.text(24, height - 156, 'Drag pots to move, click obelisks to rotate', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#C9BA9E' });
    }
  }

  createToolPanel(width, height) {
    const tools = this.level.tools || [];
    const bar = this.add.graphics();
    bar.fillStyle(PALETTE.hudCard, 0.94);
    bar.fillRoundedRect(20, height - 232, 300, 46, 10);
    bar.lineStyle(2, PALETTE.hudBorder, 0.85);
    bar.strokeRoundedRect(20, height - 232, 300, 46, 10);
    this.add.text(34, height - 226, 'TOOLS', { fontFamily: 'Georgia, serif', fontSize: '12px', fontStyle: 'bold', color: '#D4AF37' });

    const toolDefs = [
      { tool: 'water', label: 'Water' },
      { tool: 'prune', label: 'Prune' }
    ];
    let xi = 34;
    this.toolButtons = {};
    for (const td of toolDefs) {
      if (!tools.includes(td.tool)) continue;
      const g = this.add.graphics();
      g.fillStyle(0x3C332A, 1);
      g.fillRoundedRect(xi, height - 212, 62, 22, 5);
      g.lineStyle(1.2, PALETTE.brassMid, 0.8);
      g.strokeRoundedRect(xi, height - 212, 62, 22, 5);
      const t = this.add.text(xi + 4, height - 209, td.label.split(' ')[0], { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#F7EEDD' });
      const hit = this.add.rectangle(xi + 31, height - 201, 62, 22, 0xffffff, 0.001).setInteractive({ cursor: 'pointer' });
      hit.on('pointerdown', () => { this.activeTool = (this.activeTool === td.tool ? null : td.tool); this.updateToolHighlight(); this.audio.playClick(); });
      this.toolButtons[td.tool] = { g, t, x: xi, label: td.label.split(' ')[0] };
      xi += 68;
    }
    this.activeToolText = this.add.text(20, height - 180, 'Active: none', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#C9BA9E' });

    // click handling for watering/pruning/sandbox decorating
    this.input.on('pointerdown', (pointer) => {
      if (this.levelComplete || this.levelFailed) return;
      // water
      if (this.activeTool === 'water') {
        const waterBonus = (this.save.upgrades && this.save.upgrades.deepRoots) ? BALANCE.deepRootsBonusSec : 0;
        for (const plant of this.plants) {
          if (Phaser.Math.Distance.Between(pointer.x, pointer.y, plant.x, plant.y) < 30) {
            plant.water(waterBonus);
            this.audio.playWater();
            return;
          }
        }
        for (const caster of this.casters) {
          if (caster instanceof WhisperingBanyan && Phaser.Math.Distance.Between(pointer.x, pointer.y, caster.x, caster.y) < 50) {
            caster.water();
            this.audio.playWater();
            return;
          }
        }
      }
      // prune
      if (this.activeTool === 'prune') {
        if (this.level.goal.type === 'sandbox') {
          for (const plant of this.plants) {
            if (plant._isSandboxExtra && Phaser.Math.Distance.Between(pointer.x, pointer.y, plant.x, plant.y) < 28) {
              this.removeSandboxPlant(plant);
              this.audio.playPrune();
              return;
            }
          }
        }
        for (const caster of this.casters) {
          if (caster instanceof WhisperingBanyan && Phaser.Math.Distance.Between(pointer.x, pointer.y, caster.x, caster.y) < 40) {
            caster.prune();
            this.audio.playPrune();
            return;
          }
        }
      }
      // sandbox seed placement
      if (this.level.goal.type === 'sandbox' && this.selectedSeed && !pointer.rightButtonDown()) {
        if (this.extraPlantsCount >= 8) return;
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.centerX, this.centerY);
        if (dist <= 250) {
          const plant = createPlant(this, this.selectedSeed, pointer.x, pointer.y, { movable: true });
          plant._isSandboxExtra = true;
          this.plants.push(plant);
          if (plant._caster) {
            this.casters.push(plant._caster);
            this.shadowSystem.addCaster(plant._caster);
          }
          const handle = this.makeMovable(plant);
          handle.on('pointerdown', (p) => {
            if (p.rightButtonDown()) {
              this.removeSandboxPlant(plant);
              this.audio.playPrune();
            }
          });
          this.extraPlantsCount++;
          this.audio.playClick();
        }
      }
    });
  }

  createSeedTray(width, height) {
    const seeds = this.save.unlockedSeeds || ['lily', 'fern'];
    const trayX = width - 210;
    const trayY = 92;
    const trayH = 36 + seeds.length * 30;

    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.hudCard, 0.92);
    bg.fillRoundedRect(trayX, trayY, 190, trayH, 10);
    bg.lineStyle(2, PALETTE.hudBorder, 0.85);
    bg.strokeRoundedRect(trayX, trayY, 190, trayH, 10);

    this.add.text(trayX + 14, trayY + 8, 'SEEDS (max 8)', {
      fontFamily: 'Georgia, serif', fontSize: '12px', fontStyle: 'bold', color: '#D4AF37'
    });

    this.seedButtons = {};
    let sy = trayY + 30;
    for (const seedId of seeds) {
      const g = this.add.graphics();
      const t = this.add.text(trayX + 22, sy + 4, seedId.toUpperCase(), {
        fontFamily: 'Georgia, serif', fontSize: '12px', color: '#F7EEDD'
      });
      const hit = this.add.rectangle(trayX + 95, sy + 12, 166, 24, 0xffffff, 0.001).setInteractive({ cursor: 'pointer' });
      hit.on('pointerdown', () => {
        this.selectedSeed = (this.selectedSeed === seedId ? null : seedId);
        if (this.selectedSeed) {
          this.activeTool = null;
          this.updateToolHighlight();
        }
        this.updateSeedTrayHighlight();
        this.audio.playClick();
      });
      this.seedButtons[seedId] = { g, t, x: trayX + 12, y: sy };
      sy += 30;
    }
    this.updateSeedTrayHighlight();
  }

  updateSeedTrayHighlight() {
    if (!this.seedButtons) return;
    for (const [id, info] of Object.entries(this.seedButtons)) {
      info.g.clear();
      const active = this.selectedSeed === id;
      info.g.fillStyle(active ? 0x52B788 : 0x3C332A, 1);
      info.g.fillRoundedRect(info.x, info.y, 166, 24, 5);
      info.g.lineStyle(1.2, active ? 0x95D5B2 : PALETTE.brassMid, 0.9);
      info.g.strokeRoundedRect(info.x, info.y, 166, 24, 5);
      info.t.setColor(active ? '#0B3D2E' : '#F7EEDD');
    }
  }

  removeSandboxPlant(plant) {
    const idx = this.plants.indexOf(plant);
    if (idx !== -1) this.plants.splice(idx, 1);
    if (plant._caster) {
      const ci = this.casters.indexOf(plant._caster);
      if (ci !== -1) this.casters.splice(ci, 1);
      if (this.shadowSystem && this.shadowSystem.casters) {
        const si = this.shadowSystem.casters.indexOf(plant._caster);
        if (si !== -1) this.shadowSystem.casters.splice(si, 1);
      }
    }
    if (plant._handle) {
      const hi = this.movableHandles.indexOf(plant._handle);
      if (hi !== -1) this.movableHandles.splice(hi, 1);
      plant._handle.destroy();
      plant._handle = null;
    }
    plant.destroy();
    this.extraPlantsCount = Math.max(0, this.extraPlantsCount - 1);
  }

  updateToolHighlight() {
    for (const [tool, info] of Object.entries(this.toolButtons)) {
      info.g.clear();
      const active = this.activeTool === tool;
      info.g.fillStyle(active ? 0x52B788 : 0x3C332A, 1);
      info.g.fillRoundedRect(info.x, this.cameras.main.height - 212, 62, 22, 5);
      info.g.lineStyle(1.2, active ? 0x95D5B2 : PALETTE.brassMid, 0.9);
      info.g.strokeRoundedRect(info.x, this.cameras.main.height - 212, 62, 22, 5);
      info.t.setColor(active ? '#0B3D2E' : '#F7EEDD');
    }
    this.activeToolText.setText(`Active: ${this.activeTool || 'none (drag sun ring)'}`);
  }

  createLevelOverlay(width, height) {
    this.overlay = this.add.container(0, 0);
    this.overlay.setDepth(100);
    this.overlay.setVisible(false);
  }

  showOverlay(title, body, buttons) {
    this.overlay.removeAll(true);
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, w, h);
    this.overlay.add(bg);
    const card = this.add.graphics();
    card.fillStyle(PALETTE.hudCard, 0.98);
    card.fillRoundedRect(w/2 - 220, h/2 - 140, 440, 280, 14);
    card.lineStyle(2, PALETTE.hudBorder, 0.9);
    card.strokeRoundedRect(w/2 - 220, h/2 - 140, 440, 280, 14);
    this.overlay.add(card);
    const t = this.add.text(w/2, h/2 - 100, title, { fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold', color: '#E8CA65' }).setOrigin(0.5);
    this.overlay.add(t);
    const b = this.add.text(w/2, h/2 - 40, body, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#F7EEDD', align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);
    this.overlay.add(b);

    let yi = h/2 + 40;
    for (const btn of buttons) {
      const g = this.add.graphics();
      g.fillStyle(0x3C332A, 1);
      g.fillRoundedRect(w/2 - 110, yi, 220, 34, 8);
      g.lineStyle(1.5, PALETTE.brassMid, 0.9);
      g.strokeRoundedRect(w/2 - 110, yi, 220, 34, 8);
      this.overlay.add(g);
      const txt = this.add.text(w/2, yi + 7, btn.label, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#F7EEDD' }).setOrigin(0.5, 0);
      this.overlay.add(txt);
      const hit = this.add.rectangle(w/2, yi + 17, 220, 34, 0xffffff, 0.001).setInteractive({ cursor: 'pointer' });
      hit.on('pointerdown', () => btn.onClick());
      this.overlay.add(hit);
      yi += 46;
    }
    this.overlay.setVisible(true);
  }

  togglePause() {
    if (this.levelComplete || this.levelFailed) return;
    if (!this.paused) {
      this.paused = true;
      this.sunDial.setAutoOrbit(false);
      this.showOverlay('Paused', 'Take a breath. The garden waits.', [
        { label: 'Resume', onClick: () => { this.paused = false; this.overlay.setVisible(false); } },
        { label: 'Reset Level', onClick: () => { this.resetLevel(); } },
        { label: 'Level Select', onClick: () => { this.scene.start('LevelSelectScene'); } }
      ]);
    }
  }

  updateAutoOrbitUI(isActive) {
    if (isActive) {
      this.btnIndicator.setFillStyle(0x52B788);
      this.btnText.setText('Auto-Orbit: ON');
      this.btnText.setColor('#52B788');
    } else {
      this.btnIndicator.setFillStyle(0x888888);
      this.btnText.setText('Auto-Orbit: OFF');
      this.btnText.setColor('#F7EEDD');
    }
  }

  update(time, delta) {
    if (this.paused || this.levelComplete || this.levelFailed) {
      // still draw? keep minimal
      return;
    }
    const dt = delta * 0.001;

    this.sunDial.update(dt);
    const sun = this.sunDial.getSunPosition();

    this.shadowSystem.update(sun.x, sun.y);

    for (const caster of this.casters) {
      if (caster.draw) caster.draw(sun.angle);
    }
    // update movable pseudo caster positions already handled by drag

    for (const plant of this.plants) {
      const ignore = plant._caster || null;
      const isShaded = this.shadowSystem.isPointInShadow(plant.x, plant.y, sun.x, sun.y, ignore);
      plant.update(dt, isShaded);

      const reward = plant.checkBloomReward();
      if (reward > 0) {
        this.pollenCount += reward;
        this.pollenText.setText(`Pollen: ${this.pollenCount}`);
        this.createBloomSparks(plant.x, plant.y, plant.type === 'sun_lover' || plant.type === 'hybrid' ? 0xFFD166 : 0x64DFDF);
        this.audio.playBloom();
        if (!this.settings.reducedMotion) this.cameras.main.shake(120, 0.004);
      }
    }

    // fail check (skip in sandbox)
    if (this.level.goal.type !== 'sandbox') {
      for (const plant of this.plants) {
        if (plant.isDead) {
          this.failLevel('A plant has withered beyond recovery.');
          return;
        }
      }
    }

    // win check
    if (this.level.goal.type === 'bloomAll' && this.plants.length > 0 && this.plants.every(p => p.isBloomed)) {
      this.completeLevel();
    }

    this.timeText.setText(`Time: ${this.sunDial.getTimeString()}`);

    // day/night overlay
    const elev = getSunElevation(sun.angle);
    this.dayNightOverlay.clear();
    const nightAlpha = (1 - elev) * 0.35;
    this.dayNightOverlay.fillStyle(0x0B1026, nightAlpha);
    this.dayNightOverlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // ambient audio
    this.audio.updateAmbient(elev);
  }

  completeLevel() {
    this.levelComplete = true;
    this.sunDial.setAutoOrbit(false);
    this.audio.playLevelComplete();

    // save progress
    const save = SaveSystem.load();
    save.pollen = (save.pollen || 0) + this.pollenCount;
    if (!save.unlockedLevels) save.unlockedLevels = [0];
    const next = this.levelId + 1;
    if (next < LEVELS.length && !save.unlockedLevels.includes(next)) save.unlockedLevels.push(next);
    if (!save.best) save.best = {};
    const prev = save.best[this.levelId];
    if (!prev || this.pollenCount > prev.pollen) save.best[this.levelId] = { pollen: this.pollenCount };
    SaveSystem.save(save);

    const stars = this.pollenCount >= 40 ? 3 : (this.pollenCount >= 20 ? 2 : 1);
    this.showOverlay(`Level Complete!`, `${this.level.name}\nStars: ${'★'.repeat(stars)}${'☆'.repeat(3-stars)}\nPollen earned: ${this.pollenCount}`, [
      { label: 'Next Level', onClick: () => { if (this.levelId + 1 < LEVELS.length) this.scene.restart({ levelId: this.levelId + 1 }); else this.scene.start('LevelSelectScene'); } },
      { label: 'Level Select', onClick: () => { this.scene.start('LevelSelectScene'); } },
      { label: 'Replay', onClick: () => { this.scene.restart({ levelId: this.levelId }); } }
    ]);
  }

  failLevel(reason) {
    this.levelFailed = true;
    this.sunDial.setAutoOrbit(false);
    this.audio.playFail();
    this.showOverlay('Level Failed', reason, [
      { label: 'Retry', onClick: () => { this.scene.restart({ levelId: this.levelId }); } },
      { label: 'Level Select', onClick: () => { this.scene.start('LevelSelectScene'); } }
    ]);
  }

  resetLevel() {
    this.scene.restart({ levelId: this.levelId });
  }

  createBloomSparks(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const spark = this.add.circle(x, y - 15, 3, color, 1.0);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y - 15 + Math.sin(angle) * speed - 20,
        alpha: 0,
        scale: 0.2,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  drawTerracedGarden(cx, cy) {
    const g = this.gardenGraphics;
    g.clear();
    g.fillStyle(PALETTE.ground, 1.0);
    g.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    g.fillStyle(PALETTE.groundEdge, 0.7);
    g.fillCircle(cx, cy, 275);
    g.fillStyle(PALETTE.terraceOuterShade, 1.0);
    g.fillCircle(cx, cy + 8, 245);
    g.fillStyle(PALETTE.terraceOuter, 1.0);
    g.fillCircle(cx, cy, 245);
    g.fillStyle(PALETTE.soilDark, 1.0);
    g.fillCircle(cx, cy, 230);
    g.fillStyle(PALETTE.soilLight, 1.0);
    g.fillCircle(cx, cy, 222);
    g.fillStyle(PALETTE.terraceMidShade, 1.0);
    g.fillCircle(cx, cy + 6, 175);
    g.fillStyle(PALETTE.terraceMid, 1.0);
    g.fillCircle(cx, cy, 175);
    g.fillStyle(PALETTE.soilDark, 1.0);
    g.fillCircle(cx, cy, 162);
    g.fillStyle(PALETTE.soilPatch, 0.9);
    g.fillCircle(cx, cy, 156);
    g.fillStyle(PALETTE.stoneDark, 1.0);
    g.fillCircle(cx, cy + 5, 100);
    g.fillStyle(PALETTE.centerPlaza, 1.0);
    g.fillCircle(cx, cy, 100);
    g.fillStyle(PALETTE.centerPlazaShade, 0.6);
    g.fillCircle(cx, cy, 90);
    g.lineStyle(2, PALETTE.brassMid, 0.8);
    g.strokeCircle(cx, cy, 45);
    g.lineStyle(1.2, PALETTE.brassHighlight, 0.6);
    g.strokeCircle(cx, cy, 38);
    const stairAngles = [-Math.PI * 0.5, 0, Math.PI * 0.5, Math.PI];
    for (let i = 0; i < stairAngles.length; i++) {
      const a = stairAngles[i];
      const cosA = Math.cos(a), sinA = Math.sin(a);
      const stairWidth = 32;
      const stepDepths = [110, 165, 220];
      for (let s = 0; s < stepDepths.length; s++) {
        const dist = stepDepths[s];
        const sx = cx + cosA * dist;
        const sy = cy + sinA * dist;
        g.fillStyle(PALETTE.stoneBorder, 0.85);
        g.fillEllipse(sx, sy + 3, stairWidth, 14);
        g.fillStyle(PALETTE.stoneLight, 1.0);
        g.fillEllipse(sx, sy, stairWidth, 12);
        g.lineStyle(1.5, PALETTE.stoneDark, 0.8);
        g.strokeEllipse(sx, sy, stairWidth, 12);
      }
    }
    g.lineStyle(3, PALETTE.stoneDark, 0.75);
    g.strokeCircle(cx, cy, 246);
    g.lineStyle(1.5, PALETTE.stoneLight, 0.5);
    g.strokeCircle(cx, cy, 244);
  }

  cleanup() {
    if (this.sunDial) { this.sunDial.destroy(); this.sunDial = null; }
    if (this.shadowSystem) { this.shadowSystem.destroy(); this.shadowSystem = null; }
    if (this.casters) {
      for (const caster of this.casters) {
        if (caster.destroy) caster.destroy();
        else if (caster.graphics) { caster.graphics.destroy(); caster.graphics = null; }
      }
      this.casters = [];
    }
    if (this.plants) {
      for (const plant of this.plants) { if (plant.destroy) plant.destroy(); }
      this.plants = [];
    }
    if (this.movableHandles) { for (const h of this.movableHandles) h.destroy(); this.movableHandles = []; }
    if (this.obeliskHandles) { for (const h of this.obeliskHandles) h.destroy(); this.obeliskHandles = []; }
    if (this.gardenGraphics) { this.gardenGraphics.destroy(); this.gardenGraphics = null; }
    if (this.dayNightOverlay) { this.dayNightOverlay.destroy(); this.dayNightOverlay = null; }
  }
}
