export class SaveSystem {
  static KEY = 'shadow_gardener_save_v2';
  static defaultSave() {
    return {
      pollen: 0,
      unlockedLevels: [0],
      best: {},
      unlockedSeeds: ['lily', 'fern'],
      upgrades: {},
      settings: { volume: 0.7, highContrast: false, reducedMotion: false, colorblind: false }
    };
  }
  static load() {
    try {
      const raw = localStorage.getItem(SaveSystem.KEY);
      if (!raw) return SaveSystem.defaultSave();
      const parsed = JSON.parse(raw);
      return { ...SaveSystem.defaultSave(), ...parsed };
    } catch (e) {
      return SaveSystem.defaultSave();
    }
  }
  static save(data) {
    try { localStorage.setItem(SaveSystem.KEY, JSON.stringify(data)); } catch (e) {}
  }
  static reset() {
    try { localStorage.removeItem(SaveSystem.KEY); } catch (e) {}
  }
}
