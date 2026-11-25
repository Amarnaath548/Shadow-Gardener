import { BasaltObelisk, WhisperingBanyan } from '../entities/ShadowCaster.js';
import { SolarisLily, GhostFern, DappledOrchid, VelvetPuffball, HelioCactus } from '../entities/Plant.js';
import { ShadowSystem } from './ShadowSystem.js';
import { SunDial } from '../entities/SunDial.js';

export function buildLevel(scene, level) {
  const cx = scene.centerX;
  const cy = scene.centerY;

  const shadowSystem = new ShadowSystem(scene);
  const casters = [];
  const plants = [];

  for (const c of level.casters) {
    let caster = null;
    if (c.type === 'banyan') {
      caster = new WhisperingBanyan(scene, cx + c.ox, cy + c.oy, c.radius || 52);
    } else if (c.type === 'obelisk') {
      caster = new BasaltObelisk(scene, cx + c.ox, cy + c.oy, c.scale || 1.0, !!c.rotatable);
    }
    if (caster) {
      casters.push(caster);
      shadowSystem.addCaster(caster);
    }
  }

  for (const p of level.plants) {
    let plant;
    const x = cx + p.ox;
    const y = cy + p.oy;
    switch (p.type) {
      case 'lily': plant = new SolarisLily(scene, x, y); break;
      case 'fern': plant = new GhostFern(scene, x, y); break;
      case 'orchid': plant = new DappledOrchid(scene, x, y); break;
      case 'puffball': plant = new VelvetPuffball(scene, x, y); break;
      case 'cactus': plant = new HelioCactus(scene, x, y); break;
      default: plant = new SolarisLily(scene, x, y); break;
    }
    plant.movable = !!p.movable;
    plants.push(plant);

    if (p.type === 'cactus') {
      const pseudo = {
        x: plant.x,
        y: plant.y,
        height: 28,
        shadowLengthMultiplier: 0.5,
        getFootprintVertices: () => {
          const hw = 6, hh = 6;
          return [
            { x: plant.x - hw, y: plant.y - hh },
            { x: plant.x + hw, y: plant.y - hh },
            { x: plant.x + hw, y: plant.y + hh },
            { x: plant.x - hw, y: plant.y + hh }
          ];
        }
      };
      plant._caster = pseudo;
      casters.push(pseudo);
      shadowSystem.addCaster(pseudo);
    }
  }

  const sunDial = new SunDial(scene, cx, cy);

  return { casters, plants, shadowSystem, sunDial };
}
