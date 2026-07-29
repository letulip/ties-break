import {
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  withdrawEvent,
  cancelEntry,
  skipEvent,
  bookVacation,
  cancelVacation,
  bookPractice,
  cancelPractice,
  revealTournamentRound,
  skipTournament,
  closeTournament,
  toSnapshot,
  type WorldState,
} from '../engine/world'
import { rngFromSeed, type Rng } from '../engine/rng'
import { encodeExportFile, decodeExportFile } from '../engine/saveCodec'
import {
  autosave,
  writeNamed,
  readSlot,
  readLatestAutosave,
  listSlots,
  deleteSlot,
  listCareers,
  deleteCareer,
  touchCareer,
} from '../db/saves'
import type { ToWorker, ToUI } from '../shared/protocol'

// The worker owns the authoritative world state (plain objects, non-reactive) for the ACTIVE career.
// The RNG stream position is part of determinism: it is reconstructed by fast-forwarding
// one draw-batch per elapsed week on load. Cheap now; Phase 1+ will persist stream state properly.
// The main stream only feeds base costs + cohort drift – both tournament sides run on their own
// event-scoped streams keyed by (seed, event.id) – so a reloaded career replays its brackets by
// construction, not because this fast-forward happened to land on exactly the right draw.

let world: WorldState | null = null
let rng: Rng | null = null

const post = (msg: ToUI) => (self as unknown as { postMessage(m: unknown, t?: Transferable[]): void }).postMessage(
  msg,
  'bytes' in msg && msg.ok ? [msg.bytes] : [],
)

// careerId is generated here (outside the deterministic engine); Date.now is allowed in the worker.
function makeCareerId(seed: string): string {
  return `c-${seed}-${Date.now().toString(36)}`
}

function snapshotMsg(id: number, w: WorldState, recovered = false): ToUI {
  const msg: ToUI = { id, ok: true, type: 'snapshot', snapshot: toSnapshot(w) }
  return recovered ? { ...msg, recovered: true } : msg
}

function restoreRng(loaded: WorldState): Rng {
  const r = rngFromSeed(loaded.seed)
  const probe = createWorld(loaded.seed, loaded.profile)
  for (let w = 0; w < loaded.week; w++) tickWeek(probe, r)
  return r
}

async function handle(msg: ToWorker): Promise<ToUI> {
  switch (msg.type) {
    case 'new': {
      const seed = msg.seed.trim() || 'wildcard'
      world = createWorld(seed, msg.profile, makeCareerId(seed))
      rng = rngFromSeed(world.seed)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'tick': {
      if (!world || !rng) throw new Error('No active career')
      for (let i = 0; i < msg.weeks; i++) tickWeek(world, rng)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'advance': {
      if (!world || !rng) throw new Error('No active career')
      // R11-1: EVERY reason the advance stopped rides along (an injury landing on the wrap-up week
      // is both 'injury' and 'season-end'); `advance` is still the only message that sets them.
      const stopReasons = advanceWeeks(world, rng, msg.weeks)
      await autosave(world)
      return { id: msg.id, ok: true, type: 'snapshot', snapshot: toSnapshot(world, stopReasons) }
    }
    case 'enterEvent': {
      if (!world) throw new Error('No active career')
      enterEvent(world, msg.eventId)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'withdrawEvent': {
      if (!world) throw new Error('No active career')
      withdrawEvent(world, msg.eventId)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'cancelEntry': {
      // R10-13: cancel before the event week – past the deadline the fee is forfeited and the week
      // becomes plannable again; before it, a full refund (the withdrawal path).
      if (!world) throw new Error('No active career')
      cancelEntry(world, msg.eventId)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'skipEvent': {
      // R9-9: post-deadline withdrawal at the event week (fee forfeited, travel refunded).
      if (!world) throw new Error('No active career')
      skipEvent(world, msg.eventId)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'tournamentReveal': {
      if (!world) throw new Error('No active career')
      revealTournamentRound(world)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'tournamentSkip': {
      if (!world) throw new Error('No active career')
      skipTournament(world)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'tournamentClose': {
      if (!world) throw new Error('No active career')
      closeTournament(world)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    // --- season planner (v13): book/cancel a vacation or a practice match ---------------
    // Pure player state on the engine side: the price comes off a purpose-scoped sub-stream, so
    // none of these can move the world's main draw sequence.
    case 'bookVacation': {
      if (!world) throw new Error('No active career')
      bookVacation(world, msg.week, msg.packageId)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'cancelVacation': {
      if (!world) throw new Error('No active career')
      cancelVacation(world, msg.week)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'bookPractice': {
      if (!world) throw new Error('No active career')
      bookPractice(world, msg.week, msg.withCoach)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'cancelPractice': {
      if (!world) throw new Error('No active career')
      cancelPractice(world, msg.week)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'setPlan': {
      if (!world) throw new Error('No active career')
      const total = msg.plan.train + msg.plan.rest
      if (total !== 100 || msg.plan.train < 0 || msg.plan.rest < 0) {
        throw new Error('Week plan must split 100% between training and rest')
      }
      world.plan = { train: msg.plan.train, rest: msg.plan.rest }
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'setPhysio': {
      // Season-Life slice B: the toggle just reflects/sets the flag (default = hired coach). Its
      // recovery/cost lever is billed in Slice C; no engine draw, no schema impact here.
      if (!world) throw new Error('No active career')
      world.physioActive = msg.active
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'save': {
      if (!world) throw new Error('No active career')
      await writeNamed(world, msg.slot ?? 'manual')
      return { id: msg.id, ok: true, type: 'slots', slots: await listSlots(world.careerId) }
    }
    case 'saveNamed': {
      if (!world) throw new Error('No active career')
      await writeNamed(world, msg.name)
      return { id: msg.id, ok: true, type: 'slots', slots: await listSlots(world.careerId) }
    }
    case 'load': {
      world = await readSlot(msg.slot)
      rng = restoreRng(world)
      // Opening it counts as playing it, or the next boot ignores the choice - see touchCareer.
      await touchCareer(world.careerId)
      return snapshotMsg(msg.id, world)
    }
    case 'loadCareer': {
      const { world: loaded, recovered } = await readLatestAutosave(msg.careerId)
      world = loaded
      rng = restoreRng(loaded)
      await touchCareer(loaded.careerId)
      return snapshotMsg(msg.id, loaded, recovered)
    }
    case 'deleteSlot': {
      await deleteSlot(msg.slot)
      const careerId = world?.careerId
      return { id: msg.id, ok: true, type: 'slots', slots: careerId ? await listSlots(careerId) : [] }
    }
    case 'deleteCareer': {
      await deleteCareer(msg.careerId)
      if (world?.careerId === msg.careerId) {
        world = null
        rng = null
      }
      return { id: msg.id, ok: true, type: 'careers', careers: await listCareers() }
    }
    case 'listSlots': {
      const careerId = msg.careerId ?? world?.careerId
      return { id: msg.id, ok: true, type: 'slots', slots: careerId ? await listSlots(careerId) : [] }
    }
    case 'listCareers':
      return { id: msg.id, ok: true, type: 'careers', careers: await listCareers() }
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
      return snapshotMsg(msg.id, world)
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
