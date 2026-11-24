/**
 * Color tokens and balance constants inspired by warm gouache paintings
 * and the Shadow Gardener concept art.
 */

export const PALETTE = {
  // Ground & Garden Terraces
  ground: 0x2A2722,
  groundEdge: 0x1F1C18,
  terraceOuter: 0xB85C38,
  terraceOuterShade: 0x8C3F22,
  terraceMid: 0xD07347,
  terraceMidShade: 0x9D4E2A,
  terraceInner: 0xE28A5C,
  terraceInnerShade: 0xAF5E36,
  centerPlaza: 0xDDC59A,
  centerPlazaShade: 0xB69D71,

  // Stonework & Steps
  stoneLight: 0xE4D6B8,
  stoneMid: 0xC8B896,
  stoneDark: 0x8C7C5D,
  stoneBorder: 0x5C503A,

  // Rich Loamy Soil
  soilDark: 0x3E2B1E,
  soilLight: 0x543B2A,
  soilPatch: 0x664934,

  // Brass Dial & Sun
  brassDark: 0x8A6D1E,
  brassMid: 0xC5A038,
  brassLight: 0xE8CA65,
  brassHighlight: 0xFFF3B0,
  sunCore: 0xFFE270,
  sunGlow: 0xFFA726,
  sunRays: 0xFFB74D,

  // Shadows
  shadowIndigo: 0x141829,
  shadowAlpha: 0.65,

  // Basalt Obelisk
  basaltDeep: 0x1F232E,
  basaltMid: 0x2C3345,
  basaltLight: 0x434E69,
  basaltHighlight: 0x647496,
  basaltRune: 0xDEC27B,

  // Whispering Banyan Tree
  treeTrunk: 0x543D2F,
  treeTrunkDark: 0x3D2B20,
  treeLeafDark: 0x28472B,
  treeLeafMid: 0x3D6841,
  treeLeafLight: 0x5C8E62,
  treeLeafHighlight: 0x7EAA83,
  treeVine: 0x473327,

  // Solaris Lily
  lilyPetal: 0xF77F00,
  lilyPetalLight: 0xFCBF49,
  lilyCenter: 0xD62828,
  lilyCenterGlow: 0xFFE382,
  lilyStem: 0x40632E,

  // Ghost Fern
  fernFrond: 0x48CAE4,
  fernFrondGlow: 0x90E0EF,
  fernFrondLight: 0xCAF0F8,
  fernDeep: 0x0077B6,
  fernScorched: 0x9E2A2B,
  fernScorchedStem: 0x540B0E,

  // HUD & Gauges
  hudBackground: 0x221E19,
  hudCard: 0x2F2922,
  hudBorder: 0xD4AF37,
  hudText: 0xF7EEDD,
  hudTextSub: 0xC9BA9E,
  gaugeSun: 0xF6BD60,
  gaugeMoon: 0x4A6B82,
  barBloom: 0xF5A623,
  barStress: 0xE63946,
  barBg: 0x1E1B17
};

export const BALANCE = {
  // Sun orbit settings
  orbitRadius: 295,
  autoOrbitSpeed: 0.22, // radians per second (~28s per full day)

  // Solaris Lily tuning (Sun-Lover)
  lilyBloomRate: 0.14,    // +14% bloom per sec in sunlight
  lilyDecayRate: 0.05,    // -5% bloom per sec in shade

  // Ghost Fern tuning (Shade-Feeder)
  fernBloomRate: 0.15,    // +15% bloom per sec in shade
  fernRecoverRate: 0.22,  // -22% stress per sec in shade
  fernScorchRate: 0.26,   // +26% stress per sec in sun
  fernSunDecayRate: 0.08  // -8% bloom per sec in sun
};
