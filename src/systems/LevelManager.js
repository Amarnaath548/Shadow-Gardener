export const LEVELS = [
  {
    id: 0, name: 'Dawn Terrace', chapter: 1,
    desc: 'Learn the basics: keep Solaris Lilies in sun and Ghost Ferns in shade.',
    plants: [
      { type: 'lily', ox: 125, oy: 65 },
      { type: 'lily', ox: 70, oy: 30 },
      { type: 'fern', ox: -130, oy: 65 },
      { type: 'fern', ox: -75, oy: 30 }
    ],
    casters: [
      { type: 'banyan', ox: 0, oy: -130, radius: 52 },
      { type: 'obelisk', ox: -125, oy: -20, scale: 1.05, angle: 0 },
      { type: 'obelisk', ox: 130, oy: -15, scale: 1.0, angle: 0 }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun'],
    parTime: 90
  },
  {
    id: 1, name: 'Sunlit Bed', chapter: 1,
    desc: 'Two lilies need uninterrupted light; one fern needs deep shade.',
    plants: [
      { type: 'lily', ox: 150, oy: 40 },
      { type: 'lily', ox: 90, oy: -20 },
      { type: 'fern', ox: -150, oy: 40 }
    ],
    casters: [
      { type: 'obelisk', ox: -100, oy: -30, scale: 1.1, angle: 0 },
      { type: 'obelisk', ox: 100, oy: -10, scale: 0.9, angle: 0 }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun'],
    parTime: 75
  },
  {
    id: 2, name: 'Whispering Copse', chapter: 2,
    desc: 'Water the Banyan to grow its shadow and shade the ferns, then prune to free the lilies.',
    plants: [
      { type: 'lily', ox: 120, oy: 70 },
      { type: 'fern', ox: -120, oy: 70 },
      { type: 'fern', ox: -60, oy: 10 }
    ],
    casters: [
      { type: 'banyan', ox: 0, oy: -120, radius: 40 }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'water', 'prune'],
    parTime: 120
  },
  {
    id: 3, name: 'Thirsty Grove', chapter: 2,
    desc: 'Water the Banyan so its shadow reaches the distant fern, then prune it to free the lily.',
    plants: [
      { type: 'fern', ox: -95, oy: 80 },
      { type: 'lily', ox: 65, oy: 20 }
    ],
    casters: [
      { type: 'banyan', ox: 0, oy: -130, radius: 36 }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'water', 'prune'],
    parTime: 110
  },
  {
    id: 4, name: 'Rotating Shadows', chapter: 3,
    desc: 'Rotate the obelisks to redirect shadows as the sun moves.',
    plants: [
      { type: 'lily', ox: 140, oy: 50 },
      { type: 'fern', ox: -140, oy: 50 },
      { type: 'fern', ox: 0, oy: 80 }
    ],
    casters: [
      { type: 'obelisk', ox: -60, oy: -40, scale: 1.1, angle: 0, rotatable: true },
      { type: 'obelisk', ox: 60, oy: -40, scale: 1.1, angle: 0, rotatable: true }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'rotate'],
    parTime: 100
  },
  {
    id: 5, name: 'Sliding Tracks', chapter: 3,
    desc: 'Slide planters along brass rails and rotate the obelisk with Auto-Orbit.',
    plants: [
      { type: 'fern', ox: -90, oy: 60, movable: true, track: { ax: -110, ay: 60, bx: 110, by: 60 } },
      { type: 'lily', ox: 90, oy: -10, movable: true, track: { ax: 90, ay: -80, bx: 90, by: 80 } }
    ],
    casters: [
      { type: 'obelisk', ox: 0, oy: -40, scale: 1.15, angle: 0, rotatable: true }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'rotate', 'autoOrbit'],
    parTime: 100
  },
  {
    id: 6, name: 'Dappled Dance', chapter: 3,
    desc: 'Dappled Orchid needs rhythmic sun and shade. Use Auto-Orbit.',
    plants: [
      { type: 'orchid', ox: 0, oy: 60 },
      { type: 'lily', ox: 130, oy: 30 },
      { type: 'fern', ox: -130, oy: 30 }
    ],
    casters: [
      { type: 'obelisk', ox: -80, oy: -30, scale: 1.0, angle: 0, rotatable: true }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'autoOrbit', 'rotate'],
    parTime: 90
  },
  {
    id: 7, name: 'Tidal Rhythm', chapter: 3,
    desc: 'Time Auto-Orbit with two rotating obelisks for the Dappled Orchid and Velvet Puffball.',
    plants: [
      { type: 'orchid', ox: 0, oy: 45 },
      { type: 'puffball', ox: -70, oy: 35 }
    ],
    casters: [
      { type: 'obelisk', ox: -70, oy: -40, scale: 1.15, angle: 0, rotatable: true },
      { type: 'obelisk', ox: 70, oy: -40, scale: 1.15, angle: 0, rotatable: true }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'rotate', 'autoOrbit'],
    parTime: 110
  },
  {
    id: 8, name: 'Movable Pots', chapter: 3,
    desc: 'Drag planters into the right light.',
    plants: [
      { type: 'fern', ox: -40, oy: 70, movable: true },
      { type: 'lily', ox: 40, oy: 70, movable: true }
    ],
    casters: [
      { type: 'obelisk', ox: 0, oy: -60, scale: 1.2, angle: 0, rotatable: true }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'rotate'],
    parTime: 90
  },
  {
    id: 9, name: 'Mixed Garden', chapter: 4,
    desc: 'Combine everything. Velvet Puffball tolerates brief sun sweeps.',
    plants: [
      { type: 'lily', ox: 150, oy: 40 },
      { type: 'fern', ox: -150, oy: 40 },
      { type: 'puffball', ox: 0, oy: 90 },
      { type: 'cactus', ox: 80, oy: -10 }
    ],
    casters: [
      { type: 'banyan', ox: -60, oy: -120, radius: 48 },
      { type: 'obelisk', ox: 60, oy: -100, scale: 1.0, angle: 0, rotatable: true }
    ],
    goal: { type: 'bloomAll' },
    tools: ['sun', 'water', 'prune', 'rotate', 'autoOrbit'],
    parTime: 150
  },
  {
    id: 10, name: 'Zen Garden', chapter: 0,
    desc: 'Free play. No goals, no failure. Experiment with light and shadow.',
    plants: [
      { type: 'lily', ox: 150, oy: 40, movable: true },
      { type: 'fern', ox: -150, oy: 40, movable: true },
      { type: 'orchid', ox: 0, oy: 90, movable: true },
      { type: 'puffball', ox: -80, oy: -20, movable: true },
      { type: 'cactus', ox: 80, oy: -20, movable: true }
    ],
    casters: [
      { type: 'banyan', ox: -60, oy: -120, radius: 48 },
      { type: 'obelisk', ox: 60, oy: -100, scale: 1.0, angle: 0, rotatable: true }
    ],
    goal: { type: 'sandbox' },
    tools: ['sun', 'water', 'prune', 'rotate', 'autoOrbit'],
    parTime: 0
  }
];

export function getLevel(id) { return LEVELS.find(l => l.id === id) || LEVELS[0]; }
export function levelCount() { return LEVELS.length; }
export function getSandboxId() {
  const s = LEVELS.find(l => l.goal && l.goal.type === 'sandbox');
  return s ? s.id : LEVELS.length - 1;
}
