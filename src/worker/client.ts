import type { ToWorker, ToUI } from '../shared/protocol'

// UI-side wrapper: request/response correlation over postMessage.

type Pending = { resolve: (msg: ToUI) => void; reject: (err: Error) => void }

// Omit must distribute over the message union, else only shared fields survive.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type WorkerRequest = DistributiveOmit<ToWorker, 'id'>

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()

function ensureWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<ToUI>) => {
    const p = pending.get(e.data.id)
    if (!p) return
    pending.delete(e.data.id)
    p.resolve(e.data)
  }
  worker.onerror = (e) => {
    const err = new Error(e.message || 'Sim worker crashed')
    for (const p of pending.values()) p.reject(err)
    pending.clear()
  }
  return worker
}

export function request(msg: WorkerRequest, transfer: Transferable[] = []): Promise<ToUI> {
  const id = nextId++
  const full = { ...msg, id } as ToWorker
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ensureWorker().postMessage(full, transfer)
  })
}
