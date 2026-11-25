import { PALETTE } from '../constants/Palette.js';

/**
 * Converts a 24-bit integer color (0xRRGGBB) or CSS string into a CSS color string.
 */
function toCssColor(col) {
  if (typeof col === 'string') return col;
  return '#' + col.toString(16).padStart(6, '0');
}

/**
 * Generates and caches a crisp NEAREST-filtered CanvasTexture from an ASCII pixel grid.
 * Returns the texture key, or null in headless environments without Phaser textures.
 */
export function ensurePixelTexture(scene, key, grid, palette, pixelSize = 1) {
  if (!scene || !scene.textures || typeof scene.textures.createCanvas !== 'function') {
    return null;
  }
  if (scene.textures.exists(key)) {
    return key;
  }

  const height = grid.length;
  const width = grid[0] ? grid[0].length : 0;
  if (width === 0 || height === 0) return null;

  const tex = scene.textures.createCanvas(key, width * pixelSize, height * pixelSize);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color === undefined) continue;
      ctx.fillStyle = toCssColor(color);
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }

  tex.refresh();
  if (typeof tex.setFilter === 'function') {
    tex.setFilter(1); // NEAREST
  }
  return key;
}

/**
 * Helper to create a crisp pixel-art Image if scene.add.image is available.
 */
export function createPixelImage(scene, x, y, key, scale = 2) {
  if (!scene || !scene.add || typeof scene.add.image !== 'function' || !key) {
    return null;
  }
  const img = scene.add.image(x, y, key);
  img.setScale(scale);
  return img;
}

// ============================================================================
// SHARED PIXEL PALETTES & GRIDS
// ============================================================================

const PLANT_PALETTE = {
  // Outlines & shadows
  k: 0x181512, // dark outline / ground shadow
  d: 0x263A1B, // dark stem green
  g: PALETTE.lilyStem, // 0x40632E
  l: 0x6B9E4A, // light leaf green

  // Solaris Lily
  o: PALETTE.lilyPetal, // 0xF77F00
  y: PALETTE.lilyPetalLight, // 0xFCBF49
  r: PALETTE.lilyCenter, // 0xD62828
  w: PALETTE.lilyCenterGlow, // 0xFFE382
  W: 0xFFF9D6, // bright sparkle

  // Ghost Fern
  c: PALETTE.fernFrond, // 0x48CAE4
  C: PALETTE.fernFrondGlow, // 0x90E0EF
  b: PALETTE.fernFrondLight, // 0xCAF0F8
  B: PALETTE.fernDeep, // 0x0077B6
  s: PALETTE.fernScorched, // 0x9E2A2B
  S: PALETTE.fernScorchedStem, // 0x540B0E

  // Dappled Orchid
  p: 0x9D4EDD, // deep purple
  P: 0xC77DFF, // mid lavender
  v: 0xE0AAFF, // light violet
  a: 0xFFD6A5, // warm peach center

  // Velvet Puffball
  m: 0x5A3D82, // dark cap
  M: 0x7B5EA7, // mid cap
  u: 0xB39DDB, // light spot
  U: 0xE1BEE7, // glow spot
  t: 0x8B5A3C, // scorched brown
  T: 0x5C3A21, // dark scorched brown

  // Helio Cactus
  e: 0x1B5E20, // dark cactus green
  E: 0x2E7D32, // mid cactus green
  f: 0x66BB6A, // light cactus rib
  n: 0xC8E6C9, // spine highlight
  z: 0xFFEB3B, // cactus flower yellow

  // Terracotta / Brass Pot
  q: 0x7A3B24, // pot dark
  Q: 0xB85C38, // pot mid
  h: 0xE28A5C, // pot highlight
  j: PALETTE.brassMid, // brass rim

  // Water droplet
  i: 0x4FC3F7,
  I: 0xE1F5FE
};

// 1. SOLARIS LILY (20x22)
const LILY_SHADED_GRID = [
  '....................',
  '....................',
  '.........oo.........',
  '........oyyo........',
  '.......oyrryo.......',
  '.......oywryo.......',
  '......ooyyyoo.......',
  '......ooyyyoo.......',
  '.......ooooo........',
  '........ooo.........',
  '.........g..........',
  '........dgl.........',
  '......ddgg..........',
  '.....dgl.g..........',
  '.........gdd........',
  '.........glgd.......',
  '.........g..........',
  '........dgd.........',
  '......kkkkkkk.......',
  '.....kkkkkkkkk......',
  '....................',
  '....................'
];

const LILY_SUNLIT_GRID = [
  '........oyyo........',
  '.......oyWWyo.......',
  '...oo..oyrryo..oo...',
  '..oyyo..oyyo..oyyo..',
  '..oyryooywryooyryo..',
  '...oyyyyrwryyyyro...',
  '....ooyyrwryyyoo....',
  '......oywWryo.......',
  '....ooyyyyyyyoo.....',
  '...oyyyo.g.oyyyo....',
  '...oyo..dgd..oyo....',
  '........dgl.........',
  '......ddgg..........',
  '.....dgl.g..........',
  '.........gdd........',
  '.........glgd.......',
  '.........g..........',
  '........dgd.........',
  '......kkkkkkk.......',
  '.....kkkkkkkkk......',
  '....................',
  '....................'
];

const LILY_BLOOMED_GRID = [
  '..W.....oyyo.....W..',
  '.......oyWWyo.......',
  '..ooo..oyrryo..ooo..',
  '.oyWyo..oyyo..oyWyo.',
  '.oyryooywWWyooyryo..',
  '..oyyyyrwWWwryyyro..',
  '...ooyyrwWWwryyoo...',
  '..W...oywWWryo...W..',
  '...ooyyyyyyyyyyoo...',
  '..oyyyoo.g.ooyyyo...',
  '..oyyo..dgd..oyyo...',
  '........dgl.........',
  '......ddgg..........',
  '.....dgl.g..........',
  '.........gdd........',
  '.........glgd.......',
  '....W....g....W.....',
  '........dgd.........',
  '......kkkkkkk.......',
  '.....kkkkkkkkk......',
  '....................',
  '....................'
];

// 2. GHOST FERN (22x22)
const FERN_SHADED_GRID = [
  '..........b...........',
  '.........bCb..........',
  '....b....cCc....b.....',
  '...bCb..cBCBc..bCb....',
  '...cCc...cCc...cCc....',
  '..cBCBc..cBc..cBCBc...',
  '...cCc..cBCBc..cCc....',
  '.b..cB..cBCBc..Bc..b..',
  'bCb..Bc..cBc..cB..bCb.',
  'cCc..cBc.cBc.cBc..cCc.',
  '.cBc..cBccBccBc..cBc..',
  '..cBc..BBBBBBB..cBc...',
  '...cBc..BBBBB..cBc....',
  '....cBccBBBBBccBc.....',
  '.....BBBBBBBBBBB......',
  '.......BBBBBBB........',
  '........BBBBB.........',
  '.......kkkkkkk........',
  '.....kkkkkkkkkkk......',
  '......kkkkkkkkk.......',
  '......................',
  '......................'
];

const FERN_SUNLIT_GRID = [
  '..........C...........',
  '.........cCc..........',
  '....C....BcB....C.....',
  '...cCc..cBBBc..cCc....',
  '...BcB...BcB...BcB....',
  '..cBBBc..cBc..cBBBc...',
  '...BcB..cBBBc..BcB....',
  '.C..cB..cBBBc..Bc..C..',
  'cCc..Bc..cBc..cB..cCc.',
  'BcB..cBc.cBc.cBc..BcB.',
  '.cBc..cBccBccBc..cBc..',
  '..cBc..BBBBBBB..cBc...',
  '...cBc..BBBBB..cBc....',
  '....cBccBBBBBccBc.....',
  '.....BBBBBBBBBBB......',
  '.......BBBBBBB........',
  '........BBBBB.........',
  '.......kkkkkkk........',
  '.....kkkkkkkkkkk......',
  '......kkkkkkkkk.......',
  '......................',
  '......................'
];

const FERN_SCORCHED_GRID = [
  '......................',
  '......................',
  '......................',
  '......................',
  '........sS............',
  '.......sS.s...........',
  '....sS....Ss...sS.....',
  '...sSs...sSs..sSs.....',
  '....sS..sSSs..Ss......',
  '..sS.Ss.sSSs.sS.Ss....',
  '..sSs.SssSSssS.sSs....',
  '...sS..SSSSSSS..Ss....',
  '....sS..SSSSS..Ss.....',
  '.....SssSSSSSssS......',
  '......SSSSSSSSS.......',
  '.......SSSSSSS........',
  '........SSSSS.........',
  '.......kkkkkkk........',
  '.....kkkkkkkkkkk......',
  '......kkkkkkkkk.......',
  '......................',
  '......................'
];

const FERN_BLOOMED_GRID = [
  '..W.......b.......W...',
  '.........bWb..........',
  '...b.....CWC.....b....',
  '..bWb...cWCWc...bWb...',
  '..CWC....CWC....CWC...',
  '.cWCWc..cWCWc..cWCWc..',
  '..CWC...cBCBc...CWC...',
  'b..cB...cBCBc...Bc..b.',
  'Wb..Bc...cBc...cB..bW.',
  'CWC..cBc.cBc.cBc..CWC.',
  '.cBc..cBccBccBc..cBc..',
  '..cBc..BBBBBBB..cBc...',
  '...cBc..BBBBB..cBc....',
  '....cBccBBBBBccBc.....',
  '.....BBBBBBBBBBB......',
  '..W....BBBBBBB....W...',
  '........BBBBB.........',
  '.......kkkkkkk........',
  '.....kkkkkkkkkkk......',
  '......kkkkkkkkk.......',
  '......................',
  '......................'
];

// 3. DAPPLED ORCHID (20x22)
const ORCHID_BUD_GRID = [
  '....................',
  '....................',
  '........ppp.........',
  '.......pPPPp........',
  '......pPvvvPp.......',
  '.....pPvaaaavPp.....',
  '.....pPvvvvpPp......',
  '......pPPPPpp.......',
  '.......ppppp........',
  '.........g..........',
  '........dgd.........',
  '.......dg.gd........',
  '......dgl.lgd.......',
  '.........g..........',
  '........dgd.........',
  '.........g..........',
  '........dgd.........',
  '......kkkkkkk.......',
  '.....kkkkkkkkk......',
  '....................',
  '....................',
  '....................'
];

const ORCHID_BLOOMED_GRID = [
  '..W.....ppp......W..',
  '.......pPvPp........',
  '..ppp..pPvPp..ppp...',
  '.pPvPp.pPPPp.pPvPp..',
  '.pPvvPpvaaaavpPvvPp.',
  '..pPPvvaWWWWavvPPp..',
  '...pPppvaaaavppPp...',
  '..pp...pPvPp...pp...',
  '.pPvPp..ppp..pPvPp..',
  '.pPPp....g....pPPp..',
  '..pp....dgd....pp...',
  '.......dg.gd........',
  '......dgl.lgd.......',
  '..W......g.......W..',
  '........dgd.........',
  '.........g..........',
  '........dgd.........',
  '......kkkkkkk.......',
  '.....kkkkkkkkk......',
  '....................',
  '....................',
  '....................'
];

// 4. VELVET PUFFBALL (20x20)
const PUFFBALL_SHADED_GRID = [
  '....................',
  '....................',
  '......mmmmmmmm......',
  '....mmMMMMMMMMmm....',
  '...mMMuuMMMMuuMMm...',
  '..mMMuUUuMMuUUuMMm..',
  '..mMMuuuuMMuuuuMMm..',
  '.mMMMMMMMMMMMMMMMMm.',
  '.mMMuuMMMMMMMMuuMMm.',
  '.mMuUUuMMMMMMuUUuMm.',
  '.mMMuuMMMMMMMMuuMMm.',
  '..mmmmMMMMMMMMmmmm..',
  '....mmmmmmmmmmmm....',
  '......llllllll......',
  '......dddddddd......',
  '.....kkkkkkkkkk.....',
  '....kkkkkkkkkkkk....',
  '....................',
  '....................',
  '....................'
];

const PUFFBALL_SCORCHED_GRID = [
  '....................',
  '....................',
  '....................',
  '.......TTTTTT.......',
  '.....TTttttttTT.....',
  '....TttTttttTttT....',
  '....TttttttttttT....',
  '...TttttTttTttttT...',
  '...TttttttttttttT...',
  '....TTTTTTTTTTTT....',
  '.....TTTTTTTTTT.....',
  '......TTTTTTTT......',
  '.......dddddd.......',
  '......dddddddd......',
  '.....kkkkkkkkkk.....',
  '....kkkkkkkkkkkk....',
  '....................',
  '....................',
  '....................',
  '....................'
];

const PUFFBALL_BLOOMED_GRID = [
  '..W..............W..',
  '......mmmmmmmm......',
  '....mmMMUUUUmmMM....',
  '...mMMuUUUUUuuMMm...',
  '..mMMuUUuMMuUUuMMm..',
  '.mMMuuuuMMMMuuuuMMm.',
  '.mMMMMMMuUUuMMMMMMm.',
  '.mMMuuMMUUUUmmuuMMm.',
  '.mMuUUuMMMMMMuUUuMm.',
  '.mMMuuMMMMMMMMuuMMm.',
  '..mMMMMuuuuuuMMMMm..',
  '...mmmmmmmmmmmmmm...',
  '.....llllllllll.....',
  '......dddddddd......',
  '....kkkkkkkkkkkk....',
  '...kkkkkkkkkkkkkk...',
  '..W..............W..',
  '....................',
  '....................',
  '....................'
];

// 5. HELIO CACTUS (20x24)
const CACTUS_GROWING_GRID = [
  '....................',
  '........eeee........',
  '.......eEffEe.......',
  '.......eEfneE.......',
  '.......eEffEe.......',
  '..eee..eEfneE.......',
  '.eEfEe.eEffEe..eee..',
  '.eEfEe.eEfneE.eEfEe.',
  '.eEfEe.eEffEe.eEfEe.',
  '.eEfEeeeEfneE.eEfEe.',
  '..eEfffeEffEeeeEfEe.',
  '...eeeeeEfneEfffeE..',
  '.......eEffEeeeee...',
  '.......eEfneE.......',
  '.......eEffEe.......',
  '.......eEfneE.......',
  '.......eEffEe.......',
  '.......eEffEe.......',
  '.......eEffEe.......',
  '.......eeeeee.......',
  '.....kkkkkkkkkk.....',
  '....kkkkkkkkkkkk....',
  '....................',
  '....................'
];

const CACTUS_BLOOMED_GRID = [
  '........zzzz........',
  '.......zrWWrz.......',
  '.......ezzzzEe......',
  '.......eEfneE.......',
  '.......eEffEe.......',
  '..eee..eEfneE.......',
  '.eEfEe.eEffEe..eee..',
  '.eEfEe.eEfneE.eEfEe.',
  '.eEfEe.eEffEe.eEfEe.',
  '.eEfEeeeEfneE.eEfEe.',
  '..eEfffeEffEeeeEfEe.',
  '...eeeeeEfneEfffeE..',
  '.......eEffEeeeee...',
  '.......eEfneE.......',
  '.......eEffEe.......',
  '.......eEfneE.......',
  '.......eEffEe.......',
  '.......eEffEe.......',
  '.......eEffEe.......',
  '.......eeeeee.......',
  '.....kkkkkkkkkk.....',
  '....kkkkkkkkkkkk....',
  '....................',
  '....................'
];

// MOVABLE PLANTER POT (18x12)
const POT_GRID = [
  '..................',
  '.jjjjjjjjjjjjjjjj.',
  '.qQQQQQQQQQQQQQhq.',
  '..qQQQQQQQQQQhhq..',
  '..qQQQQQQQQQQQhq..',
  '...qQQQQQQQQQhq...',
  '...qQQQQQQQQQhq...',
  '....qQQQQQQQhq....',
  '....qqqqqqqqqq....',
  '...kkkkkkkkkkkk...',
  '..................',
  '..................'
];

// WATER DROPLET (8x10)
const WATER_DROP_GRID = [
  '....i...',
  '...iI...',
  '..iIIi..',
  '.iIIIii.',
  '.iIIiii.',
  '.iIiiii.',
  '..iiii..',
  '...ii...',
  '........',
  '........'
];

// ============================================================================
// SHADOW CASTERS: BASALT OBELISK & WHISPERING BANYAN
// ============================================================================

const CASTER_PALETTE = {
  k: 0x181512,
  s: PALETTE.stoneDark,
  S: PALETTE.stoneMid,
  L: PALETTE.stoneLight,
  d: PALETTE.basaltDeep,
  m: PALETTE.basaltMid,
  l: PALETTE.basaltLight,
  h: PALETTE.basaltHighlight,
  r: PALETTE.basaltRune,
  R: 0xFFF3B0,

  b: PALETTE.brassDark,
  B: PALETTE.brassMid,
  g: PALETTE.brassLight,
  G: PALETTE.brassHighlight,

  t: PALETTE.treeTrunkDark,
  T: PALETTE.treeTrunk,
  v: PALETTE.treeVine,
  1: PALETTE.treeLeafDark,
  2: PALETTE.treeLeafMid,
  3: PALETTE.treeLeafLight,
  4: PALETTE.treeLeafHighlight
};

// BASALT OBELISK (24x52) - Left Sunlit
const OBELISK_LEFT_GRID = [
  '...........ll...........',
  '..........lhml..........',
  '..........lhml..........',
  '.........llhmmd.........',
  '.........llhmmd.........',
  '.........llhmmd.........',
  '.........llhmmd.........',
  '........lllhmmdd........',
  '........lllhmmdd........',
  '........lllhmmdd........',
  '........lllhrmdd........',
  '........lllhrmdd........',
  '........lllhrmdd........',
  '........lllhrmdd........',
  '.......llllhrmddd.......',
  '.......llllhrmddd.......',
  '.......llllhrmddd.......',
  '.......llllhrmddd.......',
  '.......llllhrmddd.......',
  '.......llllhrmddd.......',
  '.......llllhrmddd.......',
  '.......lllhrRmddd.......',
  '.......lllrRRrmdd.......',
  '.......lllhrRmddd.......',
  '.......llllhrmddd.......',
  '.......llllhrmddd.......',
  '......lllllhrmdddd......',
  '......lllllhrmdddd......',
  '......lllllhrmdddd......',
  '......lllllhrmdddd......',
  '......lllllhrmdddd......',
  '......lllllhrmdddd......',
  '......lllllhmmdddd......',
  '......lllllhmmdddd......',
  '......lllllhmmdddd......',
  '......lllllhmmdddd......',
  '.....LLLLLLLLSSSSss.....',
  '....LLSSSSSSSSSSSSss....',
  '....LSSSSSSSSSSSSSss....',
  '....ssssssssssssssss....',
  '...ssssssssssssssssss...',
  '...kkkkkkkkkkkkkkkkkk...',
  '..kkkkkkkkkkkkkkkkkkkk..',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................'
];

// BASALT OBELISK (24x52) - Right Sunlit
const OBELISK_RIGHT_GRID = [
  '...........mm...........',
  '..........dmhl..........',
  '..........dmhl..........',
  '.........ddmhll.........',
  '.........ddmhll.........',
  '.........ddmhll.........',
  '.........ddmhll.........',
  '........dddmhlll........',
  '........dddmhlll........',
  '........dddmhlll........',
  '........dddmrlll........',
  '........dddmrlll........',
  '........dddmrlll........',
  '........dddmrlll........',
  '.......ddddmrllll.......',
  '.......ddddmrllll.......',
  '.......ddddmrllll.......',
  '.......ddddmrllll.......',
  '.......ddddmrllll.......',
  '.......ddddmrllll.......',
  '.......ddddmrllll.......',
  '.......dddmrRllll.......',
  '.......ddmrRRrlll.......',
  '.......dddmrRllll.......',
  '.......ddddmrllll.......',
  '.......ddddmrllll.......',
  '......dddddmrlllll......',
  '......dddddmrlllll......',
  '......dddddmrlllll......',
  '......dddddmrlllll......',
  '......dddddmrlllll......',
  '......dddddmrlllll......',
  '......dddddmhlllll......',
  '......dddddmhlllll......',
  '......dddddmhlllll......',
  '......dddddmhlllll......',
  '.....ssSSSSLLLLLLLL.....',
  '....ssSSSSSSSSSSSSLL....',
  '....ssSSSSSSSSSSSSSL....',
  '....ssssssssssssssss....',
  '...ssssssssssssssssss...',
  '...kkkkkkkkkkkkkkkkkk...',
  '..kkkkkkkkkkkkkkkkkkkk..',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................'
];

// BRASS TURNTABLE (28x20)
const TURNTABLE_GRID = [
  '.........gggggggggg.........',
  '......gggBBBBBBBBBBggg......',
  '....ggBBbbbbbbbbbbbbBBgg....',
  '...gBBbbBBBBBBBBBBBBbbBBg...',
  '..gBbbBBGGbbbbbbbbGGBBbbBg..',
  '.gBbBBGbbBBBBBBBBBBbbGBBbBg.',
  '.gBbBbbBBBBBBBBBBBBBBbbBbBg.',
  'gBbBBbBBBBbbbbbbbbBBBBbBBbBg',
  'gBbBBbBBBbbbbbbbbbbBBBbBBbBg',
  'gBbBBbBBBbbbbbbbbbbBBBbBBbBg',
  'gBbBBbBBBBbbbbbbbbBBBBbBBbBg',
  '.gBbBbbBBBBBBBBBBBBBBbbBbBg.',
  '.gBbBBGbbBBBBBBBBBBbbGBBbBg.',
  '..gBbbBBGGbbbbbbbbGGBBbbBg..',
  '...gBBbbBBBBBBBBBBBBbbBBg...',
  '....ggBBbbbbbbbbbbbbBBgg....',
  '......gggBBBBBBBBBBggg......',
  '.........gggggggggg.........',
  '............................',
  '............................'
];

// WHISPERING BANYAN TREE BASE (44x44)
const BANYAN_BASE_GRID = [
  '...............111111111111.................',
  '............111122222222221111..............',
  '..........1122222222222222222211............',
  '........11222223332222223332222211..........',
  '......112222233333322223333332222211........',
  '.....11222222233332222223333222222211.......',
  '....1222222222222222222222222222222221......',
  '...122221112222222222222222222211122221.....',
  '..12221111112222222222222222221111112221....',
  '.1222112222112222222222222222112222112221...',
  '.1222222332222222222222222222222332222221...',
  '112222222222222222222222222222222222222211..',
  '122222222222222211222222112222222222222221..',
  '122222222222221111122221111122222222222221..',
  '122222222222211222112211222112222222222221..',
  '112222222222222222222222222222222222222211..',
  '.1222222222222222222222222222222222222221...',
  '.1122222111222222222222222222211122222211...',
  '..11122111111222222222222222111111222111....',
  '...111111111111111111111111111111111111.....',
  '.....1111v111111111tTTt111111111v1111.......',
  '........v.v.......ttTTtt.......v.v..........',
  '........v.........tTTTTt.........v..........',
  '........v..v......tTTTTt......v..v..........',
  '........v..v......tTTTTt......v..v..........',
  '...........v.....ttTTTTtt.....v.............',
  '...........v.....tTTTTTTt.....v.............',
  '................ttTTTTTTtt..................',
  '...............ttTTtTTtTTtt.................',
  '..............ttTTt.TT.tTTtt................',
  '.............ttTTt..tt..tTTtt...............',
  '............tttTt...kk...tTttt..............',
  '...........kkkkkkkkkkkkkkkkkkkk.............',
  '..........kkkkkkkkkkkkkkkkkkkkkk............',
  '...........kkkkkkkkkkkkkkkkkkkk.............',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................'
];

// BANYAN SUNLIT CANOPY HIGHLIGHTS (44x24)
const BANYAN_HIGHLIGHT_GRID = [
  '...............333333333333.................',
  '............33344444444444333...............',
  '..........334444444444444444433.............',
  '.........33444444444444444444433............',
  '......33333344444433333344444433333.........',
  '.....334444333333........33333344433........',
  '....33444433..................3344433.......',
  '....33333........................3333.......',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................',
  '............................................'
];

// ============================================================================
// SUN ORB & RAYS
// ============================================================================

const SUN_PALETTE = {
  b: PALETTE.brassMid,
  B: PALETTE.brassDark,
  g: PALETTE.sunGlow,
  c: PALETTE.sunCore,
  r: PALETTE.sunRays,
  h: PALETTE.brassHighlight
};

const SUN_ORB_GRID = [
  '......BBBBBBBB......',
  '....BBbbbbbbbbBB....',
  '...BbbggggggggbbB...',
  '..BbgghhhccccccgbB..',
  '.BbggghhhcccccccgbB.',
  '.BbggghhccccccccgbB.',
  'BbgcccccccccccccggbB',
  'BbgcccccccccccccggbB',
  'BbgcccccccccccccggbB',
  'BbgcccccccccccccggbB',
  'BbgcccccccccccccggbB',
  'BbgcccccccccccccggbB',
  '.BbgccccccccccccgbB.',
  '.BbgccccccccccccgbB.',
  '..BbggccccccccggbB..',
  '...BbbggggggggbbB...',
  '....BBbbbbbbbbBB....',
  '......BBBBBBBB......'
];

const SUN_RAYS_GRID = [
  '.............rr.............',
  '.............rr.............',
  '....r........rr........r....',
  '....rr.......rr.......rr....',
  '.....rr..............rr.....',
  '......rr............rr......',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  'rrrr....................rrrr',
  'rrrr....................rrrr',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '............................',
  '......rr............rr......',
  '.....rr..............rr.....',
  '....rr.......rr.......rr....',
  '....r........rr........r....',
  '.............rr.............',
  '.............rr.............',
  '............................'
];

// ============================================================================
// GARDEN ENVIRONMENT PIXEL DECALS
// ============================================================================

const ENV_PALETTE = {
  k: PALETTE.stoneBorder,
  d: PALETTE.stoneDark,
  m: PALETTE.stoneMid,
  l: PALETTE.stoneLight,
  s: PALETTE.soilDark,
  S: PALETTE.soilPatch,
  g: 0x3D6841,
  G: 0x5C8E62,
  b: PALETTE.brassMid,
  h: PALETTE.brassHighlight
};

const STEPPING_STONE_GRID = [
  '..kkkkkkkkkkkkkk..',
  '.kllllllllllllllk.',
  'kllmmmmmmmmmmmmmllk',
  'klmmmmmmmmmmmmmmmld',
  'kmmmmmmmmmmmmmmmddd',
  '.kdddddddddddddddk.',
  '..kkkkkkkkkkkkkkk..',
  '...................'
];

const TUFT_GRID = [
  '..g..G..',
  '.gG.gGg.',
  '..gGgG..',
  '...SS...'
];

const PEBBLE_GRID = [
  '..dd..',
  '.dmmk.',
  '..kk..'
];

// ============================================================================
// HUD EXPOSURE BADGES (10x10)
// ============================================================================

const HUD_PALETTE = {
  s: PALETTE.gaugeSun,
  r: PALETTE.sunRays,
  h: PALETTE.brassHighlight,
  m: PALETTE.gaugeMoon,
  M: 0x8DB4D0
};

const SUN_BADGE_GRID = [
  '....r.....',
  '.r..s..r..',
  '..rsssr...',
  '.rsshsr...',
  'rsshhsssr.',
  '.rsssssr..',
  '..rsssr...',
  '.r..s..r..',
  '....r.....',
  '..........'
];

const MOON_BADGE_GRID = [
  '....MMM...',
  '...MMmm...',
  '..MMmm....',
  '..Mmm.....',
  '..Mmm.....',
  '..MMmm....',
  '...MMmm...',
  '....MMM...',
  '..........',
  '..........'
];

export const PIXEL_SPRITES = {
  // Plants
  lily_shaded: { grid: LILY_SHADED_GRID, palette: PLANT_PALETTE },
  lily_sunlit: { grid: LILY_SUNLIT_GRID, palette: PLANT_PALETTE },
  lily_bloomed: { grid: LILY_BLOOMED_GRID, palette: PLANT_PALETTE },

  fern_shaded: { grid: FERN_SHADED_GRID, palette: PLANT_PALETTE },
  fern_sunlit: { grid: FERN_SUNLIT_GRID, palette: PLANT_PALETTE },
  fern_scorched: { grid: FERN_SCORCHED_GRID, palette: PLANT_PALETTE },
  fern_bloomed: { grid: FERN_BLOOMED_GRID, palette: PLANT_PALETTE },

  orchid_bud: { grid: ORCHID_BUD_GRID, palette: PLANT_PALETTE },
  orchid_bloomed: { grid: ORCHID_BLOOMED_GRID, palette: PLANT_PALETTE },

  puffball_shaded: { grid: PUFFBALL_SHADED_GRID, palette: PLANT_PALETTE },
  puffball_scorched: { grid: PUFFBALL_SCORCHED_GRID, palette: PLANT_PALETTE },
  puffball_bloomed: { grid: PUFFBALL_BLOOMED_GRID, palette: PLANT_PALETTE },

  cactus_growing: { grid: CACTUS_GROWING_GRID, palette: PLANT_PALETTE },
  cactus_bloomed: { grid: CACTUS_BLOOMED_GRID, palette: PLANT_PALETTE },

  plant_pot: { grid: POT_GRID, palette: PLANT_PALETTE },
  water_drop: { grid: WATER_DROP_GRID, palette: PLANT_PALETTE },

  // Casters
  obelisk_left: { grid: OBELISK_LEFT_GRID, palette: CASTER_PALETTE },
  obelisk_right: { grid: OBELISK_RIGHT_GRID, palette: CASTER_PALETTE },
  brass_turntable: { grid: TURNTABLE_GRID, palette: CASTER_PALETTE },
  banyan_base: { grid: BANYAN_BASE_GRID, palette: CASTER_PALETTE },
  banyan_highlight: { grid: BANYAN_HIGHLIGHT_GRID, palette: CASTER_PALETTE },

  // Sun Dial
  sun_orb: { grid: SUN_ORB_GRID, palette: SUN_PALETTE },
  sun_rays: { grid: SUN_RAYS_GRID, palette: SUN_PALETTE },

  // Environment
  stepping_stone: { grid: STEPPING_STONE_GRID, palette: ENV_PALETTE },
  grass_tuft: { grid: TUFT_GRID, palette: ENV_PALETTE },
  pebble: { grid: PEBBLE_GRID, palette: ENV_PALETTE },

  // HUD
  sun_badge: { grid: SUN_BADGE_GRID, palette: HUD_PALETTE },
  moon_badge: { grid: MOON_BADGE_GRID, palette: HUD_PALETTE }
};

/**
 * Ensures a named sprite from PIXEL_SPRITES is registered in scene.textures.
 */
export function ensureSprite(scene, name) {
  const def = PIXEL_SPRITES[name];
  if (!def) return null;
  return ensurePixelTexture(scene, `px_${name}`, def.grid, def.palette, 1);
}
