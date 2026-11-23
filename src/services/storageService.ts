import type {
  ActivityEvent,
  AppSettings,
  QRRecord,
  ScanHistoryItem,
} from '../types/qr';
import { DEFAULT_APP_SETTINGS } from '../data/qrContentTypes';

const DB_NAME = 'qr_code_generator_studio_v1';
const DB_VERSION = 1;
const STORE_QRS = 'qrs';
const STORE_ACTIVITY = 'activity';
const STORE_SCANS = 'scans';
const STORE_META = 'meta';

const LS_QRS = 'qr_studio_qrs_fallback';
const LS_ACTIVITY = 'qr_studio_activity_fallback';
const LS_SCANS = 'qr_studio_scans_fallback';
const LS_SETTINGS = 'qr_studio_settings';
const LS_FAV_TEMPLATES = 'qr_studio_fav_templates';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_QRS)) {
        db.createObjectStore(STORE_QRS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ACTIVITY)) {
        db.createObjectStore(STORE_ACTIVITY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SCANS)) {
        db.createObjectStore(STORE_SCANS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
  return dbPromise;
}

async function getAllFromStore<T>(storeName: string, lsKey: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(lsKey);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }
}

async function putItemInStore<T>(storeName: string, item: T, lsKey: string, allItems?: T[]): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // fallback handled below
  }
  if (allItems) {
    try {
      localStorage.setItem(lsKey, JSON.stringify(allItems));
    } catch {
      // ignore quota error
    }
  }
}

async function deleteItemFromStore(storeName: string, id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

async function clearStore(storeName: string, lsKey: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(lsKey);
  } catch {
    // ignore
  }
}

export const storageService = {
  async loadQRs(): Promise<QRRecord[]> {
    const items = await getAllFromStore<QRRecord>(STORE_QRS, LS_QRS);
    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async saveQR(qr: QRRecord, updatedList: QRRecord[]): Promise<void> {
    await putItemInStore(STORE_QRS, qr, LS_QRS, updatedList);
  },

  async replaceAllQRs(qrs: QRRecord[]): Promise<void> {
    await clearStore(STORE_QRS, LS_QRS);
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_QRS, 'readwrite');
        const store = tx.objectStore(STORE_QRS);
        qrs.forEach((qr) => store.put(qr));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // fallback
    }
    try {
      localStorage.setItem(LS_QRS, JSON.stringify(qrs));
    } catch {
      // ignore
    }
  },

  async deleteQR(id: string, remaining: QRRecord[]): Promise<void> {
    await deleteItemFromStore(STORE_QRS, id);
    try {
      localStorage.setItem(LS_QRS, JSON.stringify(remaining));
    } catch {
      // ignore
    }
  },

  async loadActivity(): Promise<ActivityEvent[]> {
    const items = await getAllFromStore<ActivityEvent>(STORE_ACTIVITY, LS_ACTIVITY);
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addActivity(event: ActivityEvent, allEvents: ActivityEvent[]): Promise<void> {
    await putItemInStore(STORE_ACTIVITY, event, LS_ACTIVITY, allEvents.slice(0, 300));
  },

  async clearActivity(): Promise<void> {
    await clearStore(STORE_ACTIVITY, LS_ACTIVITY);
  },

  async loadScans(): Promise<ScanHistoryItem[]> {
    const items = await getAllFromStore<ScanHistoryItem>(STORE_SCANS, LS_SCANS);
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addScan(item: ScanHistoryItem, allScans: ScanHistoryItem[]): Promise<void> {
    await putItemInStore(STORE_SCANS, item, LS_SCANS, allScans.slice(0, 200));
  },

  async clearScans(): Promise<void> {
    await clearStore(STORE_SCANS, LS_SCANS);
  },

  loadFavoriteTemplateIds(): string[] {
    try {
      const raw = localStorage.getItem(LS_FAV_TEMPLATES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  },

  saveFavoriteTemplateIds(ids: string[]): void {
    try {
      localStorage.setItem(LS_FAV_TEMPLATES, JSON.stringify(ids));
    } catch {
      // ignore
    }
  },

  loadSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      if (!raw) return DEFAULT_APP_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        theme: parsed.theme ?? DEFAULT_APP_SETTINGS.theme,
        defaultStyle: {
          ...DEFAULT_APP_SETTINGS.defaultStyle,
          ...(parsed.defaultStyle ?? {}),
        },
        defaultExport: {
          ...DEFAULT_APP_SETTINGS.defaultExport,
          ...(parsed.defaultExport ?? {}),
        },
      };
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  async clearAllLocalData(): Promise<void> {
    await clearStore(STORE_QRS, LS_QRS);
    await clearStore(STORE_ACTIVITY, LS_ACTIVITY);
    await clearStore(STORE_SCANS, LS_SCANS);
    try {
      localStorage.removeItem(LS_FAV_TEMPLATES);
    } catch {
      // ignore
    }
  },
};
