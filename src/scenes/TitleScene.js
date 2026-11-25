import Phaser from 'phaser';
import { AudioSystem } from '../systems/AudioSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { getSandboxId } from '../systems/LevelManager.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.add.rectangle(w/2, h/2, w, h, 0x201D19);
    this.add.text(w/2, h/2 - 80, 'Shadow Gardener', { fontFamily: 'Georgia, serif', fontSize: '48px', fontStyle: 'bold', color: '#E8CA65' }).setOrigin(0.5);
    this.add.text(w/2, h/2 - 30, 'A puzzle of light and shadow', { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#C9BA9E' }).setOrigin(0.5);

    const btns = [
      { label: 'Play', onClick: () => this.scene.start('LevelSelectScene') },
      { label: 'Greenhouse', onClick: () => this.scene.start('GreenhouseScene') },
      { label: 'Sandbox (Zen)', onClick: () => this.scene.start('GardenScene', { levelId: getSandboxId() }) }
    ];
    let y = h/2 + 24;
    for (const b of btns) {
      const g = this.add.graphics();
      g.fillStyle(0x3C332A, 1);
      g.fillRoundedRect(w/2 - 120, y, 240, 40, 8);
      g.lineStyle(2, 0xD4AF37, 0.9);
      g.strokeRoundedRect(w/2 - 120, y, 240, 40, 8);
      this.add.text(w/2, y + 9, b.label, { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#F7EEDD' }).setOrigin(0.5, 0);
      const hit = this.add.rectangle(w/2, y + 20, 240, 40, 0xffffff, 0.001).setInteractive({ cursor: 'pointer' });
      hit.on('pointerdown', () => { (new AudioSystem()).ensure(); b.onClick(); });
      y += 56;
    }

    this.add.text(w/2, h - 40, 'Drag the sun ring. Toggle Auto-Orbit. Tools in each level.', { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#8C7C5D' }).setOrigin(0.5);

    const save = SaveSystem.load();
    const settings = save.settings;
    const makeToggle = (label, key, y) => {
      const t = this.add.text(w/2 - 120, y, `${label}: ${settings[key] ? 'ON' : 'OFF'}`, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#F7EEDD' }).setInteractive({ cursor: 'pointer' });
      t.on('pointerdown', () => {
        settings[key] = !settings[key];
        t.setText(`${label}: ${settings[key] ? 'ON' : 'OFF'}`);
        SaveSystem.save(save);
      });
    };
    makeToggle('High Contrast', 'highContrast', h - 110);
    makeToggle('Reduced Motion', 'reducedMotion', h - 88);
  }
}
