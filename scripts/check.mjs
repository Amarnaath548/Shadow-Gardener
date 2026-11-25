import { PALETTE, BALANCE } from '../src/constants/Palette.js';
import { ShadowSystem } from '../src/systems/ShadowSystem.js';
import { BasaltObelisk, WhisperingBanyan } from '../src/entities/ShadowCaster.js';
import { SolarisLily, GhostFern, HelioCactus, VelvetPuffball, DappledOrchid } from '../src/entities/Plant.js';
import { SunDial, getSunElevation } from '../src/entities/SunDial.js';
import { LEVELS, getLevel } from '../src/systems/LevelManager.js';
import { Simulator } from '../src/systems/Simulator.js';
import { projectOntoSegment } from '../src/systems/LevelBuilder.js';
import { SaveSystem } from '../src/systems/SaveSystem.js';

const g = () => new Proxy({}, { get: () => () => {} });
const scene = { centerX: 512, centerY: 369, settings: {}, add: { graphics: g, circle: g }, input: { on() {}, off() {} } };

function makeShadow() { return new ShadowSystem(scene); }

function plantByType(type, x, y) {
  switch (type) {
    case 'lily': return new SolarisLily(scene, x, y);
    case 'fern': return new GhostFern(scene, x, y);
    case 'orchid': return new DappledOrchid(scene, x, y);
    case 'puffball': return new VelvetPuffball(scene, x, y);
    case 'cactus': return new HelioCactus(scene, x, y);
    default: return new SolarisLily(scene, x, y);
  }
}

function makeCaster(c, cx, cy) {
  if (c.type === 'banyan') return new WhisperingBanyan(scene, cx + c.ox, cy + c.oy, c.radius || 52);
  if (c.type === 'obelisk') return new BasaltObelisk(scene, cx + c.ox, cy + c.oy, c.scale || 1.0, !!c.rotatable);
  return null;
}

let pass = 0, fail = 0;
function report(name, ok, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${extra ? ' :: ' + extra : ''}`);
  if (ok) pass++; else fail++;
}

// a) Cactus never shaded by itself at any of 72 sun angles; plant behind it IS shaded.
{
  const cx = 512, cy = 369;
  const cactus = new HelioCactus(scene, cx, cy);
  const pseudo = {
    x: cactus.x, y: cactus.y, height: 28, shadowLengthMultiplier: 0.5,
    getFootprintVertices() {
      const hw = 6, hh = 6;
      return [
        { x: cactus.x - hw, y: cactus.y - hh },
        { x: cactus.x + hw, y: cactus.y - hh },
        { x: cactus.x + hw, y: cactus.y + hh },
        { x: cactus.x - hw, y: cactus.y + hh }
      ];
    }
  };
  cactus._caster = pseudo;
  const ss = makeShadow();
  ss.addCaster(pseudo);
  const radius = 295;
  let selfShaded = false;
  for (let i = 0; i < 72; i++) {
    const ang = (i / 72) * Math.PI * 2;
    const sunX = cx + Math.cos(ang) * radius;
    const sunY = cy + Math.sin(ang) * radius;
    ss.update(sunX, sunY);
    if (ss.isPointInShadow(cactus.x, cactus.y, sunX, sunY, pseudo)) { selfShaded = true; break; }
  }
  // plant behind it at angle 0
  const ang = 0;
  const sunX = cx + Math.cos(ang) * radius;
  const sunY = cy + Math.sin(ang) * radius;
  ss.update(sunX, sunY);
  const behindX = cactus.x - 40;
  const behindY = cactus.y;
  const behindShaded = ss.isPointInShadow(behindX, behindY, sunX, sunY);
  report('a) cactus not self-shaded; behind shaded', !selfShaded && behindShaded, `selfShaded=${selfShaded} behind=${behindShaded}`);
}

// b) Banyan water/prune
{
  const b = new WhisperingBanyan(scene, 100, 100, 55);
  const h0 = b.height;
  for (let i = 0; i < 5; i++) b.water();
  const h1 = b.height;
  b.prune();
  const h2 = b.height;
  const ok = h1 > h0 && h2 < h1 && h1 <= 90 && h1 >= 30 && h2 <= 90 && h2 >= 30;
  report('b) banyan growth water/prune', ok, `h0=${h0} h1=${h1} h2=${h2}`);
}

// c) Lily in shade 60s not dead
{
  const l = new SolarisLily(scene, 0, 0);
  l.isShaded = true;
  for (let t = 0; t < 60; t++) l.update(1, true);
  report('c) lily survives 60s shade', !l.isDead, `dead=${l.isDead} bloom=${l.bloomCharge}`);
}

// d) Fern bloomed then 30s sun stays bloomed/alive; pollen once
{
  const f = new GhostFern(scene, 0, 0);
  // shade until bloom
  let steps = 0;
  while (!f.isBloomed && steps < 1000) { f.update(0.1, true); steps++; }
  const r1 = f.checkBloomReward();
  // sun 30s
  for (let t = 0; t < 300; t++) f.update(0.1, false);
  const r2 = f.checkBloomReward();
  report('d) fern stays bloomed/alive; pollen once', f.isBloomed && !f.isDead && r1 > 0 && r2 === 0, `bloomed=${f.isBloomed} dead=${f.isDead} r1=${r1} r2=${r2}`);
}

// e) Elevation + time strings
{
  const noon = -Math.PI / 2;
  const six = Math.PI; // 06:00 left
  const eighteen = 0; // 18:00 right
  const midnight = Math.PI / 2; // bottom
  const eNoon = getSunElevation(noon);
  const eSix = getSunElevation(six);
  const eEighteen = getSunElevation(eighteen);
  const eMid = getSunElevation(midnight);
  const sd = new SunDial(scene, 512, 369);
  sd.angle = noon; const tNoon = sd.getTimeString();
  sd.angle = six; const tSix = sd.getTimeString();
  sd.angle = eighteen; const tEighteen = sd.getTimeString();
  sd.angle = midnight; const tMid = sd.getTimeString();
  const elevOk = eNoon > eSix && eNoon > eEighteen && eMid < eSix && eMid < eEighteen;
  const timeOk = tNoon === '12:00 PM' && tSix === '6:00 AM' && tEighteen === '6:00 PM' && tMid === '12:00 AM';
  report('e) elevation ordering', elevOk, `noon=${eNoon.toFixed(2)} 6=${eSix.toFixed(2)} 18=${eEighteen.toFixed(2)} mid=${eMid.toFixed(2)}`);
  report('e) time strings', timeOk, `${tNoon}, ${tSix}, ${tEighteen}, ${tMid}`);
}

// f) Scripted solutions for puzzle levels 0-9 via Simulator
const deg = d => (d * Math.PI) / 180;
const SOLUTIONS = {
  0: (sim) => {
    sim.setSunAngle(deg(-75));
    sim.runFor(15);
  },
  1: (sim) => {
    sim.setSunAngle(deg(-80));
    sim.runFor(15);
  },
  2: (sim) => {
    const banyan = sim.world.casters[0];
    sim.water(banyan);
    sim.setSunAngle(deg(-70));
    sim.runFor(15);
    sim.prune(banyan);
    sim.runFor(10);
  },
  3: (sim) => {
    const banyan = sim.world.casters[0];
    sim.setSunAngle(deg(-90));
    // Water Banyan until its shadow reaches the distant fern
    for (let i = 0; i < 7; i++) sim.water(banyan);
    sim.runFor(15);
    // Prune Banyan to free the lily
    for (let i = 0; i < 6; i++) sim.prune(banyan);
    sim.runFor(15);
  },
  4: (sim) => {
    sim.setSunAngle(deg(-55));
    sim.runFor(15);
  },
  5: (sim) => {
    const cx = sim.world.scene.centerX;
    const cy = sim.world.scene.centerY;
    const [fern, lily] = sim.world.plants;
    const obelisk = sim.world.casters[0];
    sim.rotate(obelisk);
    sim.movePlant(fern, cx, cy + 60);
    sim.movePlant(lily, cx + 90, cy - 60);
    sim.setSunAngle(deg(-90));
    sim.runFor(15);
  },
  6: (sim) => {
    sim.setSunAngle(deg(-75));
    sim.runFor(15);
    for (let i = 0; i < 4; i++) {
      sim.setSunAngle(deg(-132));
      sim.runFor(2);
      sim.setSunAngle(deg(-100));
      sim.runFor(2);
    }
  },
  7: (sim) => {
    const ob0 = sim.world.casters[0];
    const ob1 = sim.world.casters[1];
    sim.rotate(ob1);
    // Keep puffball shaded under ob0 until it blooms
    sim.setSunAngle(deg(-90));
    sim.runFor(15);
    // Alternate sun/shade on orchid using ob1 while puffball is already bloomed
    for (let i = 0; i < 4; i++) {
      sim.setSunAngle(deg(-50));
      sim.runFor(2);
      sim.setSunAngle(deg(-110));
      sim.runFor(2);
    }
  },
  8: (sim) => {
    const cx = sim.world.scene.centerX;
    const cy = sim.world.scene.centerY;
    const [fern, lily] = sim.world.plants;
    sim.movePlant(fern, cx, cy + 20);
    sim.movePlant(lily, cx + 100, cy + 70);
    sim.setSunAngle(deg(-90));
    sim.runFor(15);
  },
  9: (sim) => {
    const banyan = sim.world.casters[0];
    const obelisk = sim.world.casters[1];
    sim.water(banyan);
    sim.rotate(obelisk);
    sim.setSunAngle(deg(-65));
    sim.runFor(20);
  }
};

for (let id = 0; id <= 9; id++) {
  const L = getLevel(id);
  const sim = new Simulator(L);
  SOLUTIONS[id](sim);
  const anyDead = sim.world.plants.some(p => p.isDead);
  const ok = sim.world.levelComplete && !sim.world.levelFailed && !anyDead;
  const detail = ok ? '' : ' ' + sim.world.plants.map(p => `${p.name}(sh=${p.isShaded},bl=${p.bloomCharge.toFixed(2)},dead=${p.isDead})`).join(' ');
  report(`f) level ${id} (${L.name})`, ok, `complete=${sim.world.levelComplete} failed=${sim.world.levelFailed} dead=${anyDead}${detail}`);
}

// g) Track segment projection unit test
{
  const pA = projectOntoSegment(-50, 40, 0, 10, 100, 10);
  const pB = projectOntoSegment(250, -30, 0, 10, 100, 10);
  const pMid = projectOntoSegment(42, 10, 0, 10, 100, 10);
  const pPerp = projectOntoSegment(42, 99, 0, 10, 100, 10);
  const ok = Math.abs(pA.x - 0) < 1e-6 && Math.abs(pA.y - 10) < 1e-6
    && Math.abs(pB.x - 100) < 1e-6 && Math.abs(pB.y - 10) < 1e-6
    && Math.abs(pMid.x - 42) < 1e-6 && Math.abs(pMid.y - 10) < 1e-6
    && Math.abs(pPerp.x - 42) < 1e-6 && Math.abs(pPerp.y - 10) < 1e-6;
  report('g) track segment projection', ok, `A=(${pA.x},${pA.y}) B=(${pB.x},${pB.y}) mid=(${pMid.x},${pMid.y})`);
}

// h) SaveSystem shop & upgrade unit tests
{
  SaveSystem.reset();
  const defSeeds = SaveSystem.getUnlockedSeeds();
  const shortFail = SaveSystem.spendPollen(10);
  const pAfterShort = SaveSystem.getPollen();
  SaveSystem.addPollen(120);
  const seedOk = SaveSystem.unlockSeed('puffball', 25);
  const upgOk = SaveSystem.buyUpgrade('deepRoots', 80);
  const shortUpg = SaveSystem.buyUpgrade('slowSun', 100);
  const finalPollen = SaveSystem.getPollen();
  const ok = defSeeds.includes('lily') && defSeeds.includes('fern')
    && !shortFail && pAfterShort === 0
    && seedOk && SaveSystem.hasSeed('puffball')
    && upgOk && SaveSystem.hasUpgrade('deepRoots')
    && !shortUpg && !SaveSystem.hasUpgrade('slowSun')
    && finalPollen === 15 && finalPollen >= 0;
  SaveSystem.reset();
  report('h) SaveSystem pollen/seeds/upgrades', ok, `pollen=${finalPollen}`);
}

// i) Deep Roots bonus water duration
{
  const f = new GhostFern(scene, 0, 0);
  f.water(BALANCE.deepRootsBonusSec);
  const ok = Math.abs(f.wateredTimer - 6.0) < 1e-6;
  report('i) Deep Roots +2s water timer', ok, `timer=${f.wateredTimer}`);
}

console.log(`\nTOTAL PASS=${pass} FAIL=${fail}`);
