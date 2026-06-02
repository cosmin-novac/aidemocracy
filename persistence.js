// persistence.js — tiny promise-based save layer (IndexedDB, localStorage fallback).
// Stores compact game records; the 10k individuals are NOT stored (regenerated
// from the saved seed). One implicit slot "autosave" backs the auto-save; named
// slots back manual saves.

const DB_NAME = "aidemocracy";
const STORE = "saves";
const VERSION = 1;
const AUTOSAVE = "autosave";

const hasIDB = typeof indexedDB !== "undefined";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, val) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const rq = tx.objectStore(STORE).get(key);
    rq.onsuccess = () => resolve(rq.result ?? null);
    rq.onerror = () => reject(rq.error);
  });
}
async function idbDel(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const rq = tx.objectStore(STORE).getAllKeys();
    rq.onsuccess = () => resolve(rq.result || []);
    rq.onerror = () => reject(rq.error);
  });
}

// localStorage fallback
const lsKey = k => `aid:${k}`;

export async function saveState(record, key = AUTOSAVE) {
  const data = JSON.parse(JSON.stringify(record));
  if (hasIDB) { try { return await idbPut(key, data); } catch { /* fall through */ } }
  localStorage.setItem(lsKey(key), JSON.stringify(data));
}

export async function loadState(key = AUTOSAVE) {
  if (hasIDB) { try { const r = await idbGet(key); if (r) return r; } catch { /* fall through */ } }
  const raw = localStorage.getItem(lsKey(key));
  return raw ? JSON.parse(raw) : null;
}

export async function clearState(key = AUTOSAVE) {
  if (hasIDB) { try { await idbDel(key); } catch { /* ignore */ } }
  localStorage.removeItem(lsKey(key));
}

export async function listSlots() {
  let names = [];
  if (hasIDB) { try { names = await idbKeys(); } catch { /* ignore */ } }
  if (!names.length) {
    names = Object.keys(localStorage)
      .filter(k => k.startsWith("aid:"))
      .map(k => k.slice(4));
  }
  return names.filter(n => n !== AUTOSAVE);
}

// Debounced autosave so rapid actions don't thrash the DB.
let timer = null;
export function autosave(record) {
  clearTimeout(timer);
  const snapshot = JSON.parse(JSON.stringify(record));
  timer = setTimeout(() => { saveState(snapshot).catch(() => {}); }, 350);
}
