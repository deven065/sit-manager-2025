const DB_NAME = 'app-cache';
const STORE_NAME = 'cache-store';
const DB_VERSION = 1;

class IndexedDBCache {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB is not available');
      return null;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          objectStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          objectStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });

    return this.initPromise;
  }

  async set(key, value, options = {}) {
    const db = await this.init();
    if (!db) return false;

    const { ttl, tags = [] } = options;
    const expiresAt = ttl ? Date.now() + ttl : null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const entry = {
        key,
        value,
        expiresAt,
        tags,
        createdAt: Date.now(),
      };

      const request = store.put(entry);

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('IndexedDB set error:', request.error);
        reject(request.error);
      };
    });
  }

  async get(key) {
    const db = await this.init();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;

        if (!entry) {
          resolve(null);
          return;
        }

        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.value);
      };

      request.onerror = () => {
        console.error('IndexedDB get error:', request.error);
        reject(request.error);
      };
    });
  }

  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  async delete(key) {
    const db = await this.init();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('IndexedDB delete error:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteByTag(tag) {
    const db = await this.init();
    if (!db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('tags');
      const request = index.openCursor(IDBKeyRange.only(tag));
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          count++;
          cursor.continue();
        } else {
          resolve(count);
        }
      };

      request.onerror = () => {
        console.error('IndexedDB deleteByTag error:', request.error);
        reject(request.error);
      };
    });
  }

  async clear() {
    const db = await this.init();
    if (!db) return false;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('IndexedDB clear error:', request.error);
        reject(request.error);
      };
    });
  }

  async cleanup() {
    const db = await this.init();
    if (!db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('expiresAt');
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.expiresAt) {
            cursor.delete();
            count++;
          }
          cursor.continue();
        } else {
          resolve(count);
        }
      };

      request.onerror = () => {
        console.error('IndexedDB cleanup error:', request.error);
        reject(request.error);
      };
    });
  }

  async getOrSet(key, fetchFn, options = {}) {
    const cached = await this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, options);
    return value;
  }
}

export const idbCache = new IndexedDBCache();

export default IndexedDBCache;
