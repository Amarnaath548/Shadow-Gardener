import { buildLevel } from './LevelBuilder.js';

const noopGraphics = () => new Proxy({}, { get: () => () => {} });

export function createHeadlessScene(centerX = 512, centerY = 369) {
  return {
    centerX,
    centerY,
    settings: {},
    add: { graphics: noopGraphics, circle: noopGraphics },
    input: { on() {}, off() {} }
  };
}

export function createWorld(level, centerX = 512, centerY = 369) {
  const scene = createHeadlessScene(centerX, centerY);
  const { casters, plants, shadowSystem, sunDial } = buildLevel(scene, level);
  return {
    scene,
    level,
    casters,
    plants,
    shadowSystem,
    sunDial,
    pollenCount: 0,
    levelComplete: false,
    levelFailed: false,
    failReason: null,
    time: 0
  };
}

export function step(world, dt) {
  if (world.levelComplete || world.levelFailed) return world;

  world.time += dt;
  world.sunDial.update(dt);
  const sun = world.sunDial.getSunPosition();

  world.shadowSystem.update(sun.x, sun.y);

  for (const plant of world.plants) {
    const ignore = plant._caster || null;
    const isShaded = world.shadowSystem.isPointInShadow(plant.x, plant.y, sun.x, sun.y, ignore);
    plant.update(dt, isShaded);

    const reward = plant.checkBloomReward();
    if (reward > 0) {
      world.pollenCount += reward;
    }
  }

  if (world.level.goal.type !== 'sandbox') {
    for (const plant of world.plants) {
      if (plant.isDead) {
        world.levelFailed = true;
        world.failReason = 'A plant has withered beyond recovery.';
        return world;
      }
    }
  }

  if (world.level.goal.type === 'bloomAll' && world.plants.length > 0 && world.plants.every(p => p.isBloomed)) {
    world.levelComplete = true;
  }

  return world;
}

export function setSunAngle(world, angle) {
  world.sunDial.angle = angle;
  world.sunDial.updateSunPosition();
}

export function water(plantOrCaster) {
  if (plantOrCaster && typeof plantOrCaster.water === 'function') {
    plantOrCaster.water();
  }
}

export function prune(caster) {
  if (caster && typeof caster.prune === 'function') {
    caster.prune();
  }
}

export function rotate(obelisk, delta = Math.PI / 6) {
  if (obelisk && typeof obelisk.rotate === 'function') {
    obelisk.rotate(delta);
  }
}

export function movePlant(plant, x, y) {
  plant.x = x;
  plant.y = y;
  if (plant._caster) {
    plant._caster.x = x;
    plant._caster.y = y;
  }
}

export function runFor(world, seconds, dt = 0.1) {
  let remaining = seconds;
  while (remaining > 1e-6 && !world.levelComplete && !world.levelFailed) {
    const stepDt = Math.min(dt, remaining);
    step(world, stepDt);
    remaining -= stepDt;
  }
  return world;
}

export class Simulator {
  constructor(level, centerX = 512, centerY = 369) {
    this.world = createWorld(level, centerX, centerY);
  }

  step(dt) { return step(this.world, dt); }
  setSunAngle(a) { setSunAngle(this.world, a); }
  setAutoOrbit(active) { this.world.sunDial.setAutoOrbit(active); }
  water(plantOrCaster) { water(plantOrCaster); }
  prune(caster) { prune(caster); }
  rotate(obelisk, delta = Math.PI / 6) { rotate(obelisk, delta); }
  movePlant(plant, x, y) { movePlant(plant, x, y); }
  runFor(seconds, dt = 0.1) { return runFor(this.world, seconds, dt); }
}
