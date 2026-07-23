// Minimal promise wrapper over IndexedDB. No external deps.

export function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })
}

export function openDB(
  name: string,
  version: number,
  upgrade: (db: IDBDatabase, oldVersion: number, tx: IDBTransaction) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version)
    // req.transaction is the live versionchange transaction – the only way to read/rewrite
    // existing records during an upgrade. Async work inside `upgrade` must stay on IDB requests
    // (chained callbacks), never awaited promises, or the transaction auto-commits early.
    req.onupgradeneeded = (e) => upgrade(req.result, e.oldVersion, req.transaction!)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onblocked = () => reject(new Error('IndexedDB open blocked by another tab'))
  })
}
