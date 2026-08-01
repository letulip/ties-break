import {
  createWorld,
  tickWeek,
  advanceWeeks,
  maxMainDraws,
  pendingKnock,
  replayMainState,
  enterEvent,
  withdrawEvent,
  cancelEntry,
  skipEvent,
  bookVacation,
  cancelVacation,
  bookPractice,
  hireCoach,
  setCoachOnEventWeeks,
  cancelPractice,
  decideKnock,
  acceptOffer,
  declineOffer,
  revealTournamentRound,
  skipTournament,
  closeTournament,
  toSnapshot,
  type WorldState,
} from '../engine/world'
import { mainStateConsistent, resumeMain, type MainRngState } from '../engine/rng'
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
// The RNG stream position is part of determinism, and since v35 IT LIVES ON THE WORLD
// (`world.rngMain`) — the "Phase 1+ will persist stream state properly" promise this header made
// for thirty schema versions, kept. Handlers draw through `resumeMain(world.rngMain)`, which
// mutates the pair in place, so the autosave that follows every mutation persists the live
// position by construction — and the module-level `rng` mirror that had to be kept in sync with
// `world` by hand across every handler is gone, which retires that standing desync hazard outright.
// A load VERIFIES the persisted pair (the s/n redundancy algebra + a plausibility bound) and
// resumes in O(1); the old whole-career replay survives only as `recoverMainState`, reachable
// solely behind a failed check, and announces itself with the snapshot's `recovered: true` flag.
// The main stream only feeds base costs + cohort drift – both tournament sides run on their own
// event-scoped streams keyed by (seed, event.id) – so a reloaded career replays its brackets by
// construction, whatever position the main stream holds.

let world: WorldState | null = null

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

/** The load-time verifier (v35): is the persisted MAIN position one this career could actually
 *  hold? Three arms, weakest first — shape (JSON rot can delete a field the type says exists),
 *  the s/n redundancy algebra (corruption of either field breaks it with probability ~1−2⁻³²;
 *  the pair IS the checksum), and the plausibility bound (a pair can satisfy the algebra and
 *  still claim more draws than the weekly budget allows — see `maxMainDraws` for the derivation).
 *  Read-only on purpose: deciding is this function's job, repairing is `recoverMainState`'s. */
function verifyMainState(w: WorldState): boolean {
  const st = w.rngMain as MainRngState | undefined
  if (!st || typeof st !== 'object' || typeof st.s !== 'number' || typeof st.n !== 'number') return false
  if (!mainStateConsistent(w.seed, st)) return false
  return st.n <= maxMainDraws(w.week, w.cohort.length)
}

/** Corruption recovery — the ONLY replay left in this file, and it is not a load path: it is
 *  unreachable except through a failed `verifyMainState`. Best-effort by design: it replays under
 *  CURRENT code, so it lands where current code says the career's weeks cost, not where history
 *  did — exactly what every load did on every boot before v35, now demoted to the emergency exit
 *  and surfaced to the player as `recovered: true` instead of happening silently for ever. */
function recoverMainState(w: WorldState): MainRngState {
  return replayMainState(w.seed, w.profile, w.week)
}

/** Shared tail of the three load paths: verify the persisted position, repair it if it fails, and
 *  say which happened — the boolean feeds straight into the snapshot's `recovered` flag. */
function ensureMainState(w: WorldState): boolean {
  if (verifyMainState(w)) return false
  w.rngMain = recoverMainState(w)
  return true
}

async function handle(msg: ToWorker): Promise<ToUI> {
  switch (msg.type) {
    case 'new': {
      const seed = msg.seed.trim() || 'wildcard'
      // createWorld owns the stream's birth now: `rngMain` is position zero, on the world.
      world = createWorld(seed, msg.profile, makeCareerId(seed))
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'tick': {
      if (!world) throw new Error('No active career')
      // ⚠ THE RAW LOOP MUST NOT OUTRUN A DECISION (P6 (c)). `advanceWeeks` refuses to move time
      // while a reveal or an unanswered knock is open – that contract is the whole W4 slice – but
      // this loop used to skip those guards: with a reveal open, tickWeek keeps running, skips
      // recomputeRankAndMilestones/housekeep/maybeFireSeasonWrapUp every subsequent week, and can
      // overwrite the unresolved reveal with a fresh computeShadowTournament. So the same two
      // predicates hold here, in both positions. At ENTRY it is a refusal – the typed error every
      // handler uses, because the caller asked for something the engine forbids. MID-LOOP it is a
      // stop: the returned snapshot then carries the pending state, so the UI mounts the
      // tournament flow / knock dialog exactly as it does after `advance`. Fewer ticks than asked
      // is RNG-safe – ⚠ re-aimed at v35, same conclusion, sturdier reason: this line used to lean
      // on the load-time replay walking `world.week` ticks rather than the requested count; now the
      // persisted `world.rngMain` advances only with draws that actually happened, so however early
      // the loop stops, the position on the world IS the position — by construction, not by
      // convention.
      if (world.pendingTournament || pendingKnock(world)) {
        throw new Error('A decision is open – resolve the tournament or knock before skipping weeks')
      }
      const rng = resumeMain(world.rngMain)
      for (let i = 0; i < msg.weeks; i++) {
        if (world.pendingTournament || pendingKnock(world)) break
        tickWeek(world, rng)
      }
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'advance': {
      if (!world) throw new Error('No active career')
      // R11-1: EVERY reason the advance stopped rides along (an injury landing on the wrap-up week
      // is both 'injury' and 'season-end'); `advance` is still the only message that sets them.
      const rng = resumeMain(world.rngMain)
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
    case 'hireCoach': {
      if (!world) throw new Error('No active career')
      hireCoach(world, msg.coachId)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'setCoachOnEventWeeks': {
      if (!world) throw new Error('No active career')
      setCoachOnEventWeeks(world, msg.on)
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
    // W4: the parent answers the knock. This is the ONLY command that can clear an undecided one, and
    // until it runs `advanceWeeks` refuses to tick at all - so this handler is what makes time move
    // again. `decideKnock` throws on a knock that is already answered, which is what keeps a
    // double-tap (or a stale dialog on a reloaded save) from re-deciding a week.
    case 'decideKnock': {
      if (!world) throw new Error('No active career')
      decideKnock(world, msg.choice)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    // THE INBOX (v32): the parent answers a letter. Both handlers go through the engine, which
    // re-checks the deadline - the UI's disabled button is a courtesy and the engine's refusal is the
    // rule, so a stale screen on a reloaded save cannot sign something that has already gone.
    //
    // ⚠ SIGNING IS IRREVERSIBLE AND THERE IS DELIBERATELY NO COMMAND TO UNDO IT. The confirm the UI
    // puts in front of this is the whole of the protection, which is the same bargain every
    // destructive action in More strikes.
    case 'signOffer': {
      if (!world) throw new Error('No active career')
      acceptOffer(world, msg.offerId)
      await autosave(world)
      return snapshotMsg(msg.id, world)
    }
    case 'refuseOffer': {
      if (!world) throw new Error('No active career')
      declineOffer(world, msg.offerId)
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
    // --- the three load paths (v35): verify-and-resume, O(1). None of them replays; the shared
    // `ensureMainState` repairs a corrupt position and its answer IS the `recovered` flag, on the
    // same channel (and the same UI surfacing) the autosave-generation fallback has always used.
    case 'load': {
      world = await readSlot(msg.slot)
      const rngRecovered = ensureMainState(world)
      // Opening it counts as playing it, or the next boot ignores the choice - see touchCareer.
      await touchCareer(world.careerId)
      return snapshotMsg(msg.id, world, rngRecovered)
    }
    case 'loadCareer': {
      const { world: loaded, recovered } = await readLatestAutosave(msg.careerId)
      world = loaded
      // Two independent recoveries can happen on one load — the older autosave GENERATION stood in
      // for an unreadable newer one, and/or the RNG position was rebuilt — and the player is told
      // about either through the one flag, because the message to them is the same: "this career
      // was repaired on the way in".
      const rngRecovered = ensureMainState(loaded)
      await touchCareer(loaded.careerId)
      return snapshotMsg(msg.id, loaded, recovered || rngRecovered)
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
      const rngRecovered = ensureMainState(world)
      await autosave(world)
      return snapshotMsg(msg.id, world, rngRecovered)
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
