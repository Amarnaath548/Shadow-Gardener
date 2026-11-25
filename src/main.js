import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GardenScene } from './scenes/GardenScene.js';
import { GreenhouseScene } from './scenes/GreenhouseScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'phaser-app',
  backgroundColor: '#201D19',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [TitleScene, LevelSelectScene, GardenScene, GreenhouseScene]
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
