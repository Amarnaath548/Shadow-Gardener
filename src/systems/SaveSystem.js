export class SaveSystem {
  static KEY = 'shadow_gardener_save_v1';
  static load() {
    try {
      const raw = localStorage.getItem(SaveSystem.KEY);
      if (!raw) return { pollen: 0, unlockedLevels: [0], best: {}, settings: { volume: 0.7, highContrast: false, reducedMotion: false, colorblind: false } };
      return JSON.parse(raw);
    } catch (e) {
      return { pollen: 0, unlockedLevels: [0], best: {}, settings: { volume: 0.7, highContrast: false, reducedMotion: false, colorblind: false } };
    }
  }
  static save(data) {
    try { localStorage.setItem(SaveSystem.KEY, JSON.stringify(data)); } catch (e) {}
  }
  static reset() {
    try { localStorage.removeItem(SaveSystem.KEY); } catch (e) {}
  }
}
