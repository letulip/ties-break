import { createWorld, tickWeek, toSnapshot, type WorldState } from '../engine/world'
import { rngFromSeed, type Rng } from '../engine/rng'
import { encodeExportFile, decodeExportFile } from '../engine/saveCodec'
import { autosave, writeSlot, readSlot, deleteSlot, listSlots } from '../db/saves'
import type { ToWorker, ToUI } from '../shared/protocol'

// The worker owns the authoritative world state (plain objects, non-reactive).
// The RNG stream position is part of determinism: it is reconstructed by fast-forwarding
// one draw-batch per elapsed week on load. Cheap now; Phase 1+ will persist stream state properly.

let world: WorldState | null = null
let rng: Rng | null = null

const post = (msg: ToUI) => (self as unknown as { postMessage(m: unknown, t?: Transferable[]): void }).postMessage(
  msg,
  'bytes' in msg && msg.ok ? [msg.bytes] : [],
)

function restoreRng(loaded: WorldState): Rng {
  const r = rngFromSeed(loaded.seed)
  const probe = createWorld(loaded.seed, loaded.profile)
  for (let w = 0; w < loaded.week; w++) tickWeek(probe, r)
  return r
}

async function handle(msg: ToWorker): Promise<ToUI> {
  switch (msg.type) {
    case 'new': {
      world = createWorld(msg.seed.trim() || 'wildcard', msg.profile)
      rng = rngFromSeed(world.seed)
      await autosave(world)
      return { id: msg.id, ok: true, type: 'snapshot', snapshot: toSnapshot(world) }
    }
    case 'tick': {
      if (!world || !rng) throw new Error('No active career')
      for (let i = 0; i < msg.weeks; i++) tickWeek(world, rng)
      await autosave(world)
      return { id: msg.id, ok: true, type: 'snapshot', snapshot: toSnapshot(world) }
    }
    case 'setPlan': {
      if (!world) throw new Error('No active career')
      const total = msg.plan.train + msg.plan.rest
      if (total !== 100 || msg.plan.train < 0 || msg.plan.rest < 0) {
        throw new Error('Week plan must split 100% between training and rest')
      }
      world.plan = { train: msg.plan.train, rest: msg.plan.rest }
      await autosave(world)
      return { id: msg.id, ok: true, type: 'snapshot', snapshot: toSnapshot(world) }
    }
    case 'save': {
      if (!world) throw new Error('No active career')
      await writeSlot(msg.slot ?? 'manual', world)
      return { id: msg.id, ok: true, type: 'slots', slots: await listSlots() }
    }
    case 'load': {
      world = await readSlot(msg.slot)
      rng = restoreRng(world)
      return { id: msg.id, ok: true, type: 'snapshot', snapshot: toSnapshot(world) }
    }
    case 'deleteSlot': {
      await deleteSlot(msg.slot)
      return { id: msg.id, ok: true, type: 'slots', slots: await listSlots() }
    }
    case 'listSlots':
      return { id: msg.id, ok: true, type: 'slots', slots: await listSlots() }
    case 'exportSave': {
      if (!world) throw new Error('No active career')
      const bytes = await encodeExportFile(world)
      const filename = `tennis-sim_${world.seed}_w${world.week}.tsave`
      return { id: msg.id, ok: true, type: 'exported', bytes: bytes.buffer as ArrayBuffer, filename }
    }
    case 'importSave': {
      world = await decodeExportFile(new Uint8Array(msg.bytes))
      rng = restoreRng(world)
      await autosave(world)
      return { id: msg.id, ok: true, type: 'snapshot', snapshot: toSnapshot(world) }
    }
  }
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
  handle(e.data)
    .then(post)
    .catch((err: unknown) =>
      post({ id: e.data.id, ok: false, error: err instanceof Error ? err.message : String(err) }),
    )
}
