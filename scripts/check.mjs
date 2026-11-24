import { PALETTE } from '../src/constants/Palette.js';
import { ShadowSystem } from '../src/systems/ShadowSystem.js';
import { BasaltObelisk, WhisperingBanyan } from '../src/entities/ShadowCaster.js';
import { SolarisLily, GhostFern, HelioCactus, VelvetPuffball, DappledOrchid } from '../src/entities/Plant.js';
import { SunDial, getSunElevation } from '../src/entities/SunDial.js';
import { LEVELS, getLevel } from '../src/systems/LevelManager.js';

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

// f) Static solvability levels 0-6
const interactLevels = new Set([2, 3, 4, 5, 6]);
for (let id = 0; id <= 6; id++) {
  const L = getLevel(id);
  const cx = 512, cy = 369;
  const casters = [];
  const plants = [];
  for (const c of L.casters) {
    const caster = makeCaster(c, cx, cy);
    if (caster) casters.push(caster);
    if (c.type === 'cactus') {
      // cactus plants may have pseudo caster; handled when building plants
    }
  }
  for (const p of L.plants) {
    const pl = plantByType(p.type, cx + p.ox, cy + p.oy);
    pl.movable = !!p.movable;
    plants.push(pl);
    if (p.type === 'cactus') {
      const pseudo = {
        x: pl.x, y: pl.y, height: 28, shadowLengthMultiplier: 0.5,
        getFootprintVertices() {
          const hw = 6, hh = 6;
          return [
            { x: pl.x - hw, y: pl.y - hh },
            { x: pl.x + hw, y: pl.y - hh },
            { x: pl.x + hw, y: pl.y + hh },
            { x: pl.x - hw, y: pl.y + hh }
          ];
        }
      };
      pl._caster = pseudo;
      casters.push(pseudo);
    }
  }
  const ss = makeShadow();
  for (const c of casters) ss.addCaster(c);

  if (interactLevels.has(id)) {
    console.log(`INFO - level ${id} (${L.name}): needs interaction, static check not conclusive`);
    continue;
  }

  let found = false;
  for (let deg = 0; deg < 360; deg += 5) {
    const ang = deg * Math.PI / 180;
    const sunX = cx + Math.cos(ang) * 295;
    const sunY = cy + Math.sin(ang) * 295;
    ss.update(sunX, sunY);
    let ok = true;
    for (const pl of plants) {
      const ignore = pl._caster || null;
      const shaded = ss.isPointInShadow(pl.x, pl.y, sunX, sunY, ignore);
      const isSunLover = pl.type === 'sun_lover';
      const isShadeFeeder = pl.type === 'shade_feeder';
      if (isSunLover && shaded) ok = false;
      if (isShadeFeeder && !shaded) ok = false;
    }
    if (ok) { found = true; break; }
  }
  report(`f) level ${id} static solvable`, found, L.name);
}

console.log(`\nTOTAL PASS=${pass} FAIL=${fail}`);
