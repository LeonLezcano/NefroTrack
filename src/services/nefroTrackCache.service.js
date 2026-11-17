/**
 * nefroTrackCache.service.js — Persistencia Offline-First, Outbox FIFO y Centinela Anti-Siembras
 * AiAppFactory Standard (Engine #123)
 */

const STORAGE_KEYS = {
  PATIENTS: 'nefrotrack_patients',
  DIALYZERS: 'nefrotrack_dialyzers',
  WATER_GATES: 'nefrotrack_water_gates',
  SESSIONS: 'nefrotrack_sessions',
  PAMI_BATCHES: 'nefrotrack_pami_batches',
  OUTBOX: 'nefrotrack_outbox',
  PURGED_FLAG: 'nefrotrack_demo_purged'
};

export class NefroTrackCacheService {
  constructor(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
    this.storage = storage || new MemoryStorageFallback();
    this.corruptionWarnings = [];
  }

  getCorruptionWarnings() {
    return [...this.corruptionWarnings];
  }

  clearCorruptionWarnings() {
    this.corruptionWarnings = [];
  }

  isDemoPurged() {
    return this.storage.getItem(STORAGE_KEYS.PURGED_FLAG) === 'true';
  }

  setDemoPurged(val = true) {
    this.storage.setItem(STORAGE_KEYS.PURGED_FLAG, val ? 'true' : 'false');
  }

  getItems(key, fallbackDemo = []) {
    const raw = this.storage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        this.corruptionWarnings.push(`Datos locales dañados en "${key}" (${err?.message || 'JSON inválido'}).`);
        return [];
      }
    }
    if (this.isDemoPurged()) {
      return [];
    }
    if (fallbackDemo && fallbackDemo.length > 0) {
      this.saveItems(key, fallbackDemo);
      return fallbackDemo;
    }
    return [];
  }

  saveItems(key, items) {
    this.storage.setItem(key, JSON.stringify(items));
  }

  // Patients
  getPatients(fallback = []) {
    return this.getItems(STORAGE_KEYS.PATIENTS, fallback);
  }
  savePatients(items) {
    this.saveItems(STORAGE_KEYS.PATIENTS, items);
  }

  // Dialyzers
  getDialyzers(fallback = []) {
    return this.getItems(STORAGE_KEYS.DIALYZERS, fallback);
  }
  saveDialyzers(items) {
    this.saveItems(STORAGE_KEYS.DIALYZERS, items);
  }

  // Water Gates
  getWaterGates(fallback = []) {
    return this.getItems(STORAGE_KEYS.WATER_GATES, fallback);
  }
  saveWaterGates(items) {
    this.saveItems(STORAGE_KEYS.WATER_GATES, items);
  }

  // Sessions
  getSessions(fallback = []) {
    return this.getItems(STORAGE_KEYS.SESSIONS, fallback);
  }
  saveSessions(items) {
    this.saveItems(STORAGE_KEYS.SESSIONS, items);
  }

  // PAMI Batches
  getPamiBatches(fallback = []) {
    return this.getItems(STORAGE_KEYS.PAMI_BATCHES, fallback);
  }
  savePamiBatches(items) {
    this.saveItems(STORAGE_KEYS.PAMI_BATCHES, items);
  }

  // Outbox FIFO
  getOutbox() {
    const raw = this.storage.getItem(STORAGE_KEYS.OUTBOX);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      this.corruptionWarnings.push(`Cola Outbox local dañada (${err?.message || 'JSON inválido'}).`);
      return [];
    }
  }

  pushOutbox(action) {
    const outbox = this.getOutbox();
    const item = {
      id: `EVT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      action
    };
    outbox.push(item);
    this.storage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(outbox));
    return item;
  }

  flushOutbox() {
    const outbox = this.getOutbox();
    this.storage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify([]));
    return outbox;
  }

  purgeAllData() {
    this.storage.removeItem(STORAGE_KEYS.PATIENTS);
    this.storage.removeItem(STORAGE_KEYS.DIALYZERS);
    this.storage.removeItem(STORAGE_KEYS.WATER_GATES);
    this.storage.removeItem(STORAGE_KEYS.SESSIONS);
    this.storage.removeItem(STORAGE_KEYS.PAMI_BATCHES);
    this.storage.removeItem(STORAGE_KEYS.OUTBOX);
    this.setDemoPurged(true);
  }
}

class MemoryStorageFallback {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.get(key) || null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}
