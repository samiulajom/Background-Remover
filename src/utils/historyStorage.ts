import { HistoryItem } from '../types';

const DB_NAME = 'OmniBG_Store';
const DB_VERSION = 1;
const STORE_NAME = 'cutout_history';
const LOCAL_STORAGE_KEY = 'omnibg_history_v2';
const EVENT_NAME = 'omnibg_history_changed';
const MAX_ITEMS = 25;

/**
 * Opens or initializes the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all saved history items ordered by timestamp descending
 */
export async function getHistoryItems(): Promise<HistoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result as HistoryItem[]) || [];
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items.slice(0, MAX_ITEMS));
      };

      req.onerror = () => {
        resolve(getFromLocalStorage());
      };
    });
  } catch {
    return getFromLocalStorage();
  }
}

/**
 * Saves a new item to history and notifies all listeners
 */
export async function addHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem[]> {
  const newItem: HistoryItem = {
    ...item,
    id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now()
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(newItem);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });

    // Prune old items if over MAX_ITEMS
    const all = await getHistoryItems();
    if (all.length > MAX_ITEMS) {
      const toDelete = all.slice(MAX_ITEMS);
      const delTx = db.transaction(STORE_NAME, 'readwrite');
      const delStore = delTx.objectStore(STORE_NAME);
      toDelete.forEach(d => delStore.delete(d.id));
    }
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to localStorage:', err);
    saveToLocalStorage(newItem);
  }

  // Also sync a small thumbnail in localStorage as backup
  syncBackupToLocalStorage(newItem);

  // Notify listeners across app
  notifyHistoryChanged();

  return getHistoryItems();
}

/**
 * Deletes a single item from history
 */
export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    removeFromLocalStorage(id);
  }

  removeFromLocalStorage(id);
  notifyHistoryChanged();
  return getHistoryItems();
}

/**
 * Clears all history
 */
export async function clearAllHistoryItems(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Ignore
  }

  notifyHistoryChanged();
}

/**
 * Dispatches custom event to sync all UI badges and drawers in real-time
 */
function notifyHistoryChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/**
 * Subscribes to history updates
 */
export function subscribeToHistory(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

// Fallback LocalStorage helpers with size safety
function getFromLocalStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(newItem: HistoryItem) {
  try {
    const list = getFromLocalStorage();
    const updated = [newItem, ...list.filter(i => i.name !== newItem.name)].slice(0, 10);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('localStorage full, skipping backup', e);
  }
}

function removeFromLocalStorage(id: string) {
  try {
    const list = getFromLocalStorage().filter(i => i.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

function syncBackupToLocalStorage(newItem: HistoryItem) {
  try {
    // Store only lightweight thumbnail in localStorage to avoid QuotaExceededError
    const backupItem: HistoryItem = {
      ...newItem,
      dataUrl: newItem.thumbnail // keep compact
    };
    const list = getFromLocalStorage();
    const updated = [backupItem, ...list.filter(i => i.id !== newItem.id)].slice(0, 8);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silent
  }
}
