export class SaveSystem {
  static KEY = 'shadow_gardener_save_v2';
  static _mem = {};

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
      const raw = (typeof localStorage !== 'undefined')
        ? localStorage.getItem(SaveSystem.KEY)
        : (SaveSystem._mem[SaveSystem.KEY] || null);
      if (!raw) return SaveSystem.defaultSave();
      const parsed = JSON.parse(raw);
      const def = SaveSystem.defaultSave();
      return {
        ...def,
        ...parsed,
        unlockedSeeds: Array.isArray(parsed.unlockedSeeds) ? parsed.unlockedSeeds : def.unlockedSeeds,
        upgrades: parsed.upgrades && typeof parsed.upgrades === 'object' ? parsed.upgrades : def.upgrades,
        settings: { ...def.settings, ...(parsed.settings || {}) }
      };
    } catch (e) {
      return SaveSystem.defaultSave();
    }
  }

  static save(data) {
    try {
      const raw = JSON.stringify(data);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SaveSystem.KEY, raw);
      } else {
        SaveSystem._mem[SaveSystem.KEY] = raw;
      }
    } catch (e) {}
  }

  static reset() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SaveSystem.KEY);
      } else {
        delete SaveSystem._mem[SaveSystem.KEY];
      }
    } catch (e) {}
  }

  static getPollen() {
    return SaveSystem.load().pollen || 0;
  }

  static addPollen(n) {
    if (typeof n !== 'number' || n <= 0 || !Number.isFinite(n)) return false;
    const data = SaveSystem.load();
    data.pollen = (data.pollen || 0) + n;
    SaveSystem.save(data);
    return true;
  }

  static spendPollen(n) {
    if (typeof n !== 'number' || n < 0 || !Number.isFinite(n)) return false;
    const data = SaveSystem.load();
    const cur = data.pollen || 0;
    if (cur < n) return false;
    data.pollen = cur - n;
    SaveSystem.save(data);
    return true;
  }

  static getUnlockedSeeds() {
    return SaveSystem.load().unlockedSeeds || ['lily', 'fern'];
  }

  static hasSeed(id) {
    return SaveSystem.getUnlockedSeeds().includes(id);
  }

  static unlockSeed(id, price = 0) {
    const data = SaveSystem.load();
    if (!Array.isArray(data.unlockedSeeds)) data.unlockedSeeds = ['lily', 'fern'];
    if (data.unlockedSeeds.includes(id)) return true;
    if (price > 0 && !SaveSystem.spendPollen(price)) return false;
    const refreshed = SaveSystem.load();
    if (!refreshed.unlockedSeeds.includes(id)) refreshed.unlockedSeeds.push(id);
    SaveSystem.save(refreshed);
    return true;
  }

  static getUpgrades() {
    return SaveSystem.load().upgrades || {};
  }

  static hasUpgrade(id) {
    return !!SaveSystem.getUpgrades()[id];
  }

  static buyUpgrade(id, price = 0) {
    const data = SaveSystem.load();
    if (!data.upgrades) data.upgrades = {};
    if (data.upgrades[id]) return true;
    if (price > 0 && !SaveSystem.spendPollen(price)) return false;
    const refreshed = SaveSystem.load();
    if (!refreshed.upgrades) refreshed.upgrades = {};
    refreshed.upgrades[id] = true;
    SaveSystem.save(refreshed);
    return true;
  }
}
