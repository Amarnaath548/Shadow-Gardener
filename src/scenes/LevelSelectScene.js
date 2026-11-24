import { LEVELS } from '../systems/LevelManager.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import Phaser from 'phaser';

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelSelectScene' }); }

  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.add.text(w/2, 40, 'Level Select', { fontFamily: 'Georgia, serif', fontSize: '32px', fontStyle: 'bold', color: '#E8CA65' }).setOrigin(0.5);
    const save = SaveSystem.load();
    const unlocked = save.unlockedLevels || [0];
    const best = save.best || {};

    let x = 80, y = 110;
    const cols = 3;
    for (let i = 0; i < LEVELS.length; i++) {
      const L = LEVELS[i];
      const isUnlocked = unlocked.includes(i);
      const bx = x + (i % cols) * 300;
      const by = y + Math.floor(i / cols) * 150;

      const g = this.add.graphics();
      g.fillStyle(isUnlocked ? 0x2F2922 : 0x1A1714, 0.95);
      g.fillRoundedRect(bx, by, 270, 120, 10);
      g.lineStyle(2, isUnlocked ? 0xD4AF37 : 0x444, 0.8);
      g.strokeRoundedRect(bx, by, 270, 120, 10);

      this.add.text(bx + 14, by + 12, L.name, { fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'bold', color: isUnlocked ? '#F7EEDD' : '#666' });
      this.add.text(bx + 14, by + 36, L.desc, { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#C9BA9E', wordWrap: { width: 240 } });
      if (best[i]) {
        this.add.text(bx + 14, by + 92, `Best pollen: ${best[i].pollen}`, { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#D4AF37' });
      }
      if (isUnlocked) {
        const hit = this.add.rectangle(bx + 135, by + 60, 270, 120, 0xffffff, 0.001).setInteractive({ cursor: 'pointer' });
        hit.on('pointerdown', () => this.scene.start('GardenScene', { levelId: i }));
      } else {
        this.add.text(bx + 14, by + 92, 'Locked', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#888' });
      }
    }

    // back + reset
    const back = this.add.text(40, h - 40, '< Back to Title', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#D4AF37' }).setInteractive({ cursor: 'pointer' });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    const reset = this.add.text(w - 140, h - 40, 'Reset Save', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#E63946' }).setInteractive({ cursor: 'pointer' });
    reset.on('pointerdown', () => { SaveSystem.reset(); this.scene.restart(); });
  }
}
