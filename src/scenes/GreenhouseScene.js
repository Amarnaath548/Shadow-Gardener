import Phaser from 'phaser';
import { PALETTE, SHOP_CATALOG } from '../constants/Palette.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';

export class GreenhouseScene extends Phaser.Scene {
  constructor() { super({ key: 'GreenhouseScene' }); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const audio = new AudioSystem();

    this.add.rectangle(w / 2, h / 2, w, h, 0x201D19);
    this.add.text(w / 2, 42, 'Greenhouse', {
      fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'bold', color: '#E8CA65'
    }).setOrigin(0.5);

    const pollen = SaveSystem.getPollen();
    this.add.text(w / 2, 82, `Pollen: ${pollen}`, {
      fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: '#F7EEDD'
    }).setOrigin(0.5);

    const rows = [
      ...SHOP_CATALOG.seeds.map(s => ({ ...s, kind: 'seed', owned: SaveSystem.hasSeed(s.id) })),
      ...SHOP_CATALOG.upgrades.map(u => ({ ...u, kind: 'upgrade', owned: SaveSystem.hasUpgrade(u.id) }))
    ];

    let y = 128;
    for (const item of rows) {
      const canBuy = !item.owned && pollen >= item.price;
      const g = this.add.graphics();
      g.fillStyle(item.owned ? 0x243025 : 0x2F2922, 0.96);
      g.fillRoundedRect(w / 2 - 280, y, 560, 84, 10);
      g.lineStyle(2, item.owned ? 0x52B788 : (canBuy ? PALETTE.brassLight : 0x554D42), 0.9);
      g.strokeRoundedRect(w / 2 - 280, y, 560, 84, 10);

      const tag = item.kind === 'seed' ? 'SEED' : 'UPGRADE';
      this.add.text(w / 2 - 260, y + 12, `${item.name}  [${tag}]`, {
        fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold', color: '#F7EEDD'
      });
      this.add.text(w / 2 - 260, y + 40, item.desc, {
        fontFamily: 'Georgia, serif', fontSize: '12px', color: '#C9BA9E', wordWrap: { width: 390 }
      });

      const btnLabel = item.owned ? 'Owned' : `Buy (${item.price})`;
      const btnBg = this.add.graphics();
      btnBg.fillStyle(item.owned ? 0x3A5A40 : (canBuy ? 0x3C332A : 0x1D1A16), 1);
      btnBg.fillRoundedRect(w / 2 + 150, y + 22, 112, 38, 8);
      btnBg.lineStyle(1.5, item.owned ? 0x52B788 : (canBuy ? PALETTE.brassLight : 0x555), 0.9);
      btnBg.strokeRoundedRect(w / 2 + 150, y + 22, 112, 38, 8);

      this.add.text(w / 2 + 206, y + 41, btnLabel, {
        fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold',
        color: item.owned ? '#95D5B2' : (canBuy ? '#E8CA65' : '#777')
      }).setOrigin(0.5);

      if (canBuy) {
        const hit = this.add.rectangle(w / 2 + 206, y + 41, 112, 38, 0xffffff, 0.001).setInteractive({ cursor: 'pointer' });
        hit.on('pointerdown', () => {
          const ok = item.kind === 'seed'
            ? SaveSystem.unlockSeed(item.id, item.price)
            : SaveSystem.buyUpgrade(item.id, item.price);
          if (ok) {
            audio.playBloom();
            this.scene.restart();
          }
        });
      }

      y += 98;
    }

    const back = this.add.text(40, h - 40, '< Back to Title', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#D4AF37'
    }).setInteractive({ cursor: 'pointer' });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
  }
}
