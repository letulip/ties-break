import {
  createWorld,
  tickWeek,
  advanceWeeks,
  maxMainDraws,
  pendingKnock,
  shootClashOpen,
  pendingBirthday,
  chooseGift,
  replayMainState,
  enterEvent,
  withdrawEvent,
  cancelEntry,
  skipEvent,
  bookVacation,
  cancelVacation,
  bookPractice,
  buyAsset,
  sellAsset,
  hireCoach,
  hireMasseur,
  setMasseurSessions,
  setMasseurTravels,
  setCoachOnEventWeeks,
  setCoachOnJuniorEvents,
  setKitGrade,
  cancelPractice,
  answerShootClash,
  decideKnock,
  acceptOffer,
  declineOffer,
  revealTournamentRound,
  skipTournament,
  closeTournament,
  answerFork,
  answerRetirement,
  resumeFromCollege,
  endCollegeEarly,
  toSnapshot,
  refreshDerivedRankCaches,
  guardNotEnded,
  type WorldState,
} from '../engine/world'
import { mainStateConsistent, resumeMain, type MainRngState, type Rng } from '../engine/rng'
import { planFromWeek, planShapeError, planWeek } from '../engine/plan'
import { encodeExportFile, decodeExportFile } from '../engine/saveCodec'
import { SaveFileError } from '../engine/saveGuard'
import {
  commitAutosave,
  adoptAutosave,
  SaveConflictError,
  writeNamed,
  readSlot,
  readLatestAutosave,
  listSlots,
  deleteSlot,
  listCareers,
  deleteCareer,
  touchCareer,
} from '../db/saves'
import type { ErrorReply, Snapshot, SnapshotReply, StopReason, ToWorker, ToUI } from '../shared/protocol'

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
//
// W1-INTEGRITY-A (Codex TB-02 + TB-03) — THE COMMITTED PAIR AND THE CANDIDATE RULE. `world` is no
// longer mutated in place by commands: every mutation runs against a structuredClone of the
// committed world (rngMain included — the v35 serializable pair is exactly what makes the clone a
// complete resumable universe), is PERSISTED as one IndexedDB transaction, and only then replaces
// `world` and bumps `committedRevision`. A thrown engine refusal or a failed persist therefore
// leaves the committed pair — memory, disk, revision, and the snapshot the UI holds — bit-for-bit
// unchanged, which is what lets the UI retry without double-applying. Measured before adopting the
// clone (tools/clone-bench.ts): structuredClone of a 20-season world is ~2.2 ms, ~41% of the
// gzip+sha256 each mutation already paid, so TB-03's copy-on-write fallback is not needed.

let world: WorldState | null = null

/** The monotonic revision of the committed `world` (0 = no active career). Adopted from disk on
 *  every load, advanced by exactly one per committed mutation/restore. The revision is the
 *  optimistic-concurrency token of the whole pipeline: mutating requests carry the
 *  `baseRevision` they were issued against, and a mismatch is a typed STALE_REVISION refusal
 *  rather than a command silently applied to state the caller has never seen. */
let committedRevision = 0

/** TB-02's typed conflict: the mutation was issued against a revision that is no longer the
 *  committed one. Carries the CURRENT revision so the caller can refresh and re-decide. */
class StaleRevisionError extends Error {
  constructor(
    readonly currentRevision: number,
    readonly baseRevision: number,
  ) {
    super(
      `Stale revision: the command was based on revision ${baseRevision}, ` +
        `but the world is at revision ${currentRevision} – refresh and try again`,
    )
    this.name = 'StaleRevisionError'
  }
}

const post = (msg: ToUI) => (self as unknown as { postMessage(m: unknown, t?: Transferable[]): void }).postMessage(
  msg,
  'bytes' in msg && msg.ok ? [msg.bytes] : [],
)

// careerId is generated here (outside the deterministic engine); Date.now is allowed in the worker.
function makeCareerId(seed: string): string {
  return `c-${seed}-${Date.now().toString(36)}`
}

/** ⚠ R2-05: the return type is the SNAPSHOT arm, not the `ToUI` union. That is what deleted the two
 *  `(msg as { recovered?: true })` casts this function used to need – a union has no `recovered` to
 *  assign to, its own arm does. The two `if`s are unchanged and the asymmetry between them is
 *  deliberate: `recovered` is only ever ADDED when true (never written as `false`), which is the
 *  shape tests/sim-worker-pipeline.test.ts asserts on a clean restore. */
/*  ⭐⭐ AND `snapshot` IS E-02's HALF OF THE ORDERING (05.09 engine review). `toSnapshot` is the one
 *  step of a lifecycle command that can THROW on a file the gate let through, and on `new`,
 *  `restoreSlot` and `importSave` it used to run last – after `adoptAutosave`, after `world =
 *  candidate`. So an import whose snapshot throws had already been adopted as the active career AND
 *  written as the newest autosave when the throw became an error reply, and every later
 *  `getSnapshot`/`advance` threw the same way: a persisted career that cannot render. Those three
 *  cases now build the snapshot BEFORE they commit anything and hand it in here – the queue's own
 *  rule, "the reply is DECIDED before it is posted", moved one step earlier so that the reply is
 *  decided before the world is ADOPTED. `revision` is still read off `committedRevision` at reply
 *  time, which is why this stays one function and not two. */
function snapshotMsg(
  id: number,
  w: WorldState,
  opts: {
    recovered?: boolean
    restoredFrom?: string
    stopReasons?: StopReason[]
    snapshot?: Snapshot
  } = {},
): SnapshotReply {
  const msg: SnapshotReply = {
    id,
    ok: true,
    type: 'snapshot',
    snapshot: opts.snapshot ?? toSnapshot(w, opts.stopReasons),
    revision: committedRevision,
  }
  if (opts.recovered) msg.recovered = true
  if (opts.restoredFrom !== undefined) msg.restoredFrom = opts.restoredFrom
  return msg
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

/** Shared tail of the load paths: verify the persisted position, repair it if it fails, and
 *  say which happened — the boolean feeds straight into the snapshot's `recovered` flag.
 *
 *  ⚠ THE RANK-CACHE REFRESH RIDES HERE ON PURPOSE (wave/pro-prep): every world this worker adopts
 *  — boot, restore, import — passes through this function, and a save written under an older
 *  table definition wakes up with stale persisted rank caches (the "#9 chip over a #61 table"
 *  defect; see `refreshDerivedRankCaches`). The refresh is deterministic and idempotent, so it is
 *  NOT a recovery: its answer never touches the `recovered` flag the player is warned with. */
function ensureMainState(w: WorldState): boolean {
  const rngRepaired = !verifyMainState(w)
  if (rngRepaired) w.rngMain = recoverMainState(w)
  refreshDerivedRankCaches(w)
  return rngRepaired
}

/**
 * TB-03 — THE CANDIDATE-STATE COMMIT, the shape of every mutating command:
 *
 *     capture committed state            (`world`, `committedRevision`)
 *             ↓
 *     create candidate world + RNG       (structuredClone; rngMain rides along, so resumeMain
 *             ↓                           draws against the CANDIDATE's pair — the committed
 *     execute command                     pair does not move a single draw)
 *             ↓
 *     persist save + metadata            (ONE IndexedDB transaction, resolved on `complete`;
 *             ↓                           CAS-refused if the disk is ahead — src/db/saves.ts)
 *     commit candidate + publish
 *
 * Failure at ANY arrow leaves the committed pair untouched: an engine refusal throws before the
 * persist, a storage failure rejects before the commit, and in both cases the error response the
 * UI receives describes a world that genuinely did not change. Success means the returned
 * snapshot corresponds exactly to bytes that are already durable — never "applied in memory,
 * hopefully saved soon".
 *
 * `baseRevision` is checked FIRST: a command issued against a snapshot the worker has since moved
 * past must not run at all (TB-02's stale-refusal), not even against a candidate.
 *
 * The closure's `world` parameter deliberately shadows the module's committed `world`: inside a
 * command body "the world" IS the candidate, and the shadowing makes it impossible for a handler
 * to accidentally reach the committed copy (also what keeps the W1-QUICK tick-guard source pins
 * in tests/dev-fast-forward.test.ts matching on the same `world.…` spelling they always did).
 */
async function mutate(
  id: number,
  baseRevision: number,
  command: (world: WorldState, rng: Rng) => StopReason[] | void,
): Promise<SnapshotReply> {
  if (!world) throw new Error('No active career')
  if (baseRevision !== committedRevision) throw new StaleRevisionError(committedRevision, baseRevision)

  const candidate = structuredClone(world)
  const rng = resumeMain(candidate.rngMain)
  const stopReasons = command(candidate, rng) ?? undefined

  await commitAutosave(candidate, committedRevision + 1)
  world = candidate
  committedRevision += 1
  return snapshotMsg(id, candidate, { stopReasons })
}

/**
 * ⚠ THE SWITCH IS EXPLICIT AND STAYS EXPLICIT – a `case` per command, no handler table, no dynamic
 * dispatch on `msg.type`. Two things depend on that and neither is negotiable: `noFallthroughCasesInSwitch`
 * plus this declared return type make a MISSING case a compile error today (TS2366 – the function
 * would end without returning), and the guard pins in tests/dev-fast-forward.test.ts read the `tick`
 * case as source text between two `case` markers. A registry would delete both properties silently.
 *
 * ⚠ R2-05 – AND WHICH ARM EACH CASE RETURNS IS NOW WRITTEN DOWN, in `REPLY_BY_COMMAND`
 * (src/shared/protocol.ts). The declared type here stays the full `ToUI` on purpose: this is the
 * OTHER side of `postMessage`, and a Worker is a separate program – nothing the compiler can say
 * here binds the client's expectations. What binds them is tests/worker-reply-correlation.test.ts,
 * which drives this switch over every key of that table and compares the real reply's arm to it.
 * The builders help from below: `mutate`/`snapshotMsg` return `SnapshotReply` and `errorMsg` returns
 * `ErrorReply`, so the thirty-odd mutation cases are the right shape by construction.
 */
async function handle(msg: ToWorker): Promise<ToUI> {
  switch (msg.type) {
    // ------------------------------------------------------------------ lifecycle
    case 'new': {
      const seed = msg.seed.trim() || 'wildcard'
      // createWorld owns the stream's birth now: `rngMain` is position zero, on the world.
      // Candidate-first like every other path: the fresh world only becomes the active one after
      // its first autosave is durable, so a storage failure cannot strand an unsaveable career.
      const candidate = createWorld(seed, msg.profile, makeCareerId(seed), msg.prologue)
      // ⭐ E-02: the reply is BUILT before the career is adopted – see `snapshotMsg`. `createWorld`
      // writes every required field itself, so this cannot throw today; it is here because the
      // ordering is the property, and a lifecycle path that commits before it can render is the
      // defect regardless of which of the three found it first.
      const snapshot = toSnapshot(candidate)
      const { revision } = await adoptAutosave(candidate)
      world = candidate
      committedRevision = revision
      return snapshotMsg(msg.id, candidate, { snapshot })
    }
    // ------------------------------------------------------------------ mutations
    case 'tick': {
      return mutate(msg.id, msg.baseRevision, (world, rng) => {
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
        // ⚠ Re-aimed again at W1-INTEGRITY-A, conclusion unchanged: `world` here is the CANDIDATE
        // (the mutate() closure parameter shadows the committed module state on purpose), a clone of
        // the committed world — so both predicates read exactly the state they always read, and a
        // refusal now provably leaves the committed world without a single tick applied.
        // ⚠ RE-AIMED AGAIN AT W2-ENDINGS, and this one is a real hole rather than a widening. The
        // dev fast-forward ships in EVERY build (an owner ruling – the deployed build is the
        // playtest device), so a loop that outran the fork at nineteen would tick a year of her life
        // past the most expensive click in the game with nobody answering it, and a loop that outran
        // the LATCH would keep ticking a career that has ended. Same two positions as the pair above,
        // same reasoning: a refusal at entry, a stop mid-loop.
        const decisionOpen = (w: WorldState): boolean =>
          w.pendingTournament !== null ||
          pendingKnock(w) ||
          // ⭐ v48: ...AND THE BIRTHDAY, for the reason the whole list exists. The dev fast-forward
          // ships in EVERY build (an owner ruling), so a `▶▶ 52` that outran an unanswered birthday
          // would tick a year past the one popup the owner asked to fire ALWAYS, with nobody
          // answering it – which is exactly the hole the knock and the fork are on this list to close.
          pendingBirthday(w) !== null ||
          w.ending !== null ||
          (w.fork !== null && w.fork.answer === null) ||
          w.retirementOffer !== null ||
          // ⭐⭐ ROUND 29 #3: ...AND THE SHOOT/TOURNAMENT COLLISION, for the reason this whole list
          // exists. The dev fast-forward ships in EVERY build (an owner ruling), so a `▶▶ 52` that
          // outran this question would tick a year past a decision two of whose four answers stop
          // being possible the moment the week starts – which is exactly the hole the knock and the
          // fork are on this list to close, with the extra sharpness that it fires on the week BEFORE
          // the one it is about.
          shootClashOpen(w)
        // ⚠ THE SHAPE AND THE WORDING ARE BOTH PINNED (tests/dev-fast-forward.test.ts): it matches
        // `if (decisionOpen(world)) {` followed immediately by the throw, and asserts the substring
        // "resolve the tournament or knock". So v48's birthday joins the parenthesis rather than
        // rewriting the sentence, and this note sits ABOVE the `if` rather than inside it.
        if (decisionOpen(world)) {
          throw new Error('A decision is open – resolve the tournament or knock (or the birthday, the fork, the offer, the ending) before skipping weeks')
        }
        for (let i = 0; i < msg.weeks; i++) {
          tickWeek(world, rng)
          if (decisionOpen(world)) break
        }
      })
    }
    case 'advance': {
      // R11-1: EVERY reason the advance stopped rides along (an injury landing on the wrap-up week
      // is both 'injury' and 'season-end'); `advance` is still the only message that sets them.
      return mutate(msg.id, msg.baseRevision, (world, rng) => advanceWeeks(world, rng, msg.weeks))
    }
    case 'enterEvent': {
      return mutate(msg.id, msg.baseRevision, (world) => enterEvent(world, msg.eventId))
    }
    case 'withdrawEvent': {
      return mutate(msg.id, msg.baseRevision, (world) => withdrawEvent(world, msg.eventId))
    }
    case 'cancelEntry': {
      // R10-13: cancel before the event week – past the deadline the fee is forfeited and the week
      // becomes plannable again; before it, a full refund (the withdrawal path).
      return mutate(msg.id, msg.baseRevision, (world) => cancelEntry(world, msg.eventId))
    }
    case 'skipEvent': {
      // R9-9: post-deadline withdrawal at the event week (fee forfeited, travel refunded).
      return mutate(msg.id, msg.baseRevision, (world) => skipEvent(world, msg.eventId))
    }
    case 'tournamentReveal': {
      return mutate(msg.id, msg.baseRevision, (world) => revealTournamentRound(world))
    }
    case 'tournamentSkip': {
      return mutate(msg.id, msg.baseRevision, (world) => skipTournament(world))
    }
    case 'tournamentClose': {
      return mutate(msg.id, msg.baseRevision, (world) => closeTournament(world))
    }
    // --- season planner (v13): book/cancel a vacation or a practice match ---------------
    // Pure player state on the engine side: the price comes off a purpose-scoped sub-stream, so
    // none of these can move the world's main draw sequence.
    case 'bookVacation': {
      return mutate(msg.id, msg.baseRevision, (world) => bookVacation(world, msg.week, msg.packageId))
    }
    case 'cancelVacation': {
      return mutate(msg.id, msg.baseRevision, (world) => cancelVacation(world, msg.week))
    }
    case 'bookPractice': {
      return mutate(msg.id, msg.baseRevision, (world) => bookPractice(world, msg.week, msg.withCoach))
    }
    case 'hireCoach': {
      return mutate(msg.id, msg.baseRevision, (world) => hireCoach(world, msg.coachId))
    }
    case 'hireMasseur': {
      // v59, the travelling team step 1. Re-validated engine-side like every command: the pro-career
      // gate and the college freeze both refuse inside `hireMasseur` (guardNotEnded first), so a
      // stale screen cannot put a masseur on a junior's – or a student's – payroll.
      return mutate(msg.id, msg.baseRevision, (world) => hireMasseur(world, msg.hire))
    }
    case 'setMasseurSessions': {
      // v59 step 2, the dial. `setMasseurSessions` refuses a rung the market does not sell and
      // refuses inside the freeze (guardNotEnded first) – the worker is not the gate.
      return mutate(msg.id, msg.baseRevision, (world) => setMasseurSessions(world, msg.sessions))
    }
    case 'setMasseurTravels': {
      return mutate(msg.id, msg.baseRevision, (world) => setMasseurTravels(world, msg.on))
    }
    case 'setCoachOnEventWeeks': {
      return mutate(msg.id, msg.baseRevision, (world) => setCoachOnEventWeeks(world, msg.on))
    }
    case 'setCoachOnJuniorEvents': {
      return mutate(msg.id, msg.baseRevision, (world) => setCoachOnJuniorEvents(world, msg.on))
    }
    case 'cancelPractice': {
      return mutate(msg.id, msg.baseRevision, (world) => cancelPractice(world, msg.week))
    }
    // W2-ENDINGS. Three answers, and none of them can be issued unprompted: the engine refuses when
    // its own question is not open, which is what stops a stale screen ending a career that was
    // never asked. `resumeFromCollege` is the one command in the game that CLEARS an ending – it
    // spends a college YEAR of weeks inside a single mutate, so the autosave that commits it commits
    // a girl a year older. ⭐ P5: it used to spend all four in one call; `endCollegeEarly` is the
    // other answer at each boundary, and both are re-validated engine-side.
    case 'answerFork': {
      return mutate(msg.id, msg.baseRevision, (world) => answerFork(world, msg.answer, msg.tier))
    }
    case 'answerRetirement': {
      return mutate(msg.id, msg.baseRevision, (world) => answerRetirement(world, msg.retire))
    }
    // ⭐⭐ THE COLLEGE WAVE: this is the second producer of stop reasons in the whole app, and the
    // only one that is not an `advance`. `resumeFromCollege` spends a college YEAR in one mutate, so
    // a national-team week played inside it would otherwise never reach a screen – the reasons it
    // returns are what carry it out (see the command's own note, and `StopReason`'s 'call-up').
    case 'resumeFromCollege': {
      return mutate(msg.id, msg.baseRevision, (world, rng) => resumeFromCollege(world, rng))
    }
    case 'endCollegeEarly': {
      return mutate(msg.id, msg.baseRevision, (world) => endCollegeEarly(world))
    }
    // ⚠ v47 – THE ONE WRITER OF `train`/`rest`, AND SINCE THE WEEK BECAME THE PLAN IT DERIVES THEM
    // (docs/specs/training-dials.md §10). Keeping the legacy pair as a PROJECTION is what makes every
    // existing reader byte-identical, and the drift risk that creates has exactly one answer: this
    // handler is the only place either field is ever assigned – the discipline `weeklyBillSplit` uses
    // to guarantee `coach + facility === total`. So a command that carries a week is projected here
    // and the caller's own `train`/`rest` are IGNORED rather than trusted.
    case 'setPlan': {
      return mutate(msg.id, msg.baseRevision, (world) => {
        guardNotEnded(world)
        if (msg.plan.week !== undefined) {
          // The engine re-validates every command, so a stale screen cannot corrupt a career. It checks
          // the SHAPE and never this week's capacity - see `planShapeError` for why a standing plan may
          // not be judged against the week the player happens to be looking at.
          const bad = planShapeError(msg.plan.week)
          if (bad) throw new Error(`Week plan: ${bad}`)
          world.plan = planFromWeek(msg.plan.week)
          return
        }
        const total = msg.plan.train + msg.plan.rest
        if (total !== 100 || msg.plan.train < 0 || msg.plan.rest < 0) {
          throw new Error('Week plan must split 100% between training and rest')
        }
        // ⚠ THE PRESET PATH, AND IT LAYS A WEEK DOWN RATHER THAN LEAVING ONE ABSENT. `WEEK_PLAN_PRESETS`
        // is still what the three pills send, and `planWeek` expands it through exactly the convention
        // the migration uses - so tapping Balanced and loading a v46 career produce the identical
        // matrix, and the plan tab never has to render "no week".
        world.plan = { train: msg.plan.train, rest: msg.plan.rest, week: planWeek(msg.plan) }
      })
    }
    // W4: the parent answers the knock. This is the ONLY command that can clear an undecided one, and
    // until it runs `advanceWeeks` refuses to tick at all - so this handler is what makes time move
    // again. `decideKnock` throws on a knock that is already answered, which is what keeps a
    // double-tap (or a stale dialog on a reloaded save) from re-deciding a week.
    // ⭐⭐ ROUND 29 #3 – THE SHOOT ON A TOURNAMENT WEEK. The knock's own shape one case up: the ONLY
    // way `shootClashOpen` clears, and the only way time moves again on that week. `answerShootClash`
    // throws on a collision that is not open, which is what keeps a stale card from withdrawing her
    // from a tournament the world has already moved past.
    case 'answerShootClash': {
      return mutate(msg.id, msg.baseRevision, (world) => answerShootClash(world, msg.choice))
    }
    case 'decideKnock': {
      return mutate(msg.id, msg.baseRevision, (world) => decideKnock(world, msg.choice))
    }
    // ⭐ v48: the parent answers the birthday. Same contract as the knock above – the ONLY command
    // that can clear a pending birthday, and until it runs `advanceWeeks` refuses to tick. `chooseGift`
    // throws on a week with no birthday and on a gift this birthday never offered, which is what keeps
    // a double-tap (or a stale dialog on a reloaded save) from recording a second row for one year.
    case 'chooseGift': {
      return mutate(msg.id, msg.baseRevision, (world) => chooseGift(world, msg.giftId))
    }
    // ⭐⭐ v63, THE SHOP SLICE 1: the parent buys and sells with the family's own money. Nothing here
    // is a gate - `buyAsset` re-derives the professional-era unlock, the already-owned rung, the
    // 'open' rung's minimum and the wallet, and `sellAsset` re-derives ownership AND (part two #4)
    // the divisibility, the amount's floor and its ceiling, so a stale screen
    // cannot spend or liquidate. Zero draws on any stream: the values are arithmetic on `boughtWeek`,
    // which is why a purchase cannot move the world's dice (CLAUDE.md invariant 2).
    case 'buyAsset': {
      // ⭐ ROUND 30 #8/#10 – the typed name rides the same command. It is NOT trusted: `buyAsset`
      // decides whether this purchase names anything and sanitises whatever arrived.
      return mutate(msg.id, msg.baseRevision, (world) => buyAsset(world, msg.itemId, msg.stakeCents, msg.name))
    }
    case 'sellAsset': {
      return mutate(msg.id, msg.baseRevision, (world) => sellAsset(world, msg.itemId, msg.amountCents))
    }
    // THE INBOX (v32): the parent answers a letter. Both handlers go through the engine, which
    // re-checks the deadline - the UI's disabled button is a courtesy and the engine's refusal is the
    // rule, so a stale screen on a reloaded save cannot sign something that has already gone.
    //
    // ⚠ SIGNING IS IRREVERSIBLE AND THERE IS DELIBERATELY NO COMMAND TO UNDO IT. The confirm the UI
    // puts in front of this is the whole of the protection, which is the same bargain every
    // destructive action in More strikes.
    case 'signOffer': {
      // braces: accept/declineOffer return the Offer for their engine callers; the pipeline's
      // closure contract is StopReason[] | void, and an Offer is neither.
      return mutate(msg.id, msg.baseRevision, (world) => {
        acceptOffer(world, msg.offerId)
      })
    }
    case 'refuseOffer': {
      return mutate(msg.id, msg.baseRevision, (world) => {
        declineOffer(world, msg.offerId)
      })
    }
    case 'setPhysio': {
      // Season-Life slice B: the toggle just reflects/sets the flag (default = hired coach). Its
      // recovery/cost lever is billed in Slice C; no engine draw, no schema impact here.
      return mutate(msg.id, msg.baseRevision, (world) => {
        guardNotEnded(world)
        world.physioActive = msg.active
      })
    }
    case 'setKitGrade': {
      // W3-KIT: move one line onto another rung. Re-validated engine-side like every other command
      // (the line and the rung are both checked against the ladder), and the purchase half is charged
      // there too - a stale screen cannot buy a frame at last week's price.
      return mutate(msg.id, msg.baseRevision, (world) => setKitGrade(world, msg.line, msg.grade))
    }
    // ------------------------------------------------------------------ persistence
    case 'save': {
      if (!world) throw new Error('No active career')
      // Named saves stamp the revision they captured but allocate none: the world did not change.
      await writeNamed(world, msg.slot ?? 'manual', committedRevision)
      return { id: msg.id, ok: true, type: 'slots', slots: await listSlots(world.careerId), revision: committedRevision }
    }
    case 'saveNamed': {
      if (!world) throw new Error('No active career')
      await writeNamed(world, msg.name, committedRevision)
      return { id: msg.id, ok: true, type: 'slots', slots: await listSlots(world.careerId), revision: committedRevision }
    }
    // --- the load paths (v35, re-aimed at W1-INTEGRITY-A): verify-and-resume, O(1). None of them
    // replays; the shared `ensureMainState` repairs a corrupt position and its answer IS the
    // `recovered` flag, on the same channel (and the same UI surfacing) the autosave-generation
    // fallback has always used. ⚠ The third load path this comment used to cover — `load`, which
    // swapped the worker's world WITHOUT committing an autosave — is GONE, replaced by
    // `restoreSlot` below: that gap was verified as the "restore rolls back on relaunch" defect
    // (readLatestAutosave picked the newer pre-restore generation), TB-01's whole reason to exist.
    case 'loadCareer': {
      const { world: loaded, recovered, revision } = await readLatestAutosave(msg.careerId)
      // Two independent recoveries can happen on one load — the older autosave GENERATION stood in
      // for an unreadable newer one, and/or the RNG position was rebuilt — and the player is told
      // about either through the one flag, because the message to them is the same: "this career
      // was repaired on the way in".
      const rngRecovered = ensureMainState(loaded)
      // Opening it counts as playing it, or the next boot ignores the choice - see touchCareer.
      await touchCareer(loaded.careerId)
      world = loaded
      // The disk's highest known revision, NOT the loaded record's own: after a generation
      // fallback the corpse generation still owns a higher number, and the next CAS commit must
      // clear it (readLatestAutosave documents the wedge this avoids).
      committedRevision = revision
      return snapshotMsg(msg.id, loaded, { recovered: recovered || rngRecovered })
    }
    /**
     * TB-01 — RESTORE AS A COMMITTED REVISION. Restoring a slot IS a mutation of the career's
     * timeline, so it takes the mutation path's whole bargain: validate into a candidate, allocate
     * the next revision (never reuse the historical record's — the restored state is a NEW commit
     * whose content happens to be old), persist as the NEWEST autosave + careers row in one
     * transaction, and only then replace the worker's world. The ok response therefore already
     * means "restore → close → relaunch reopens the restored state", because on relaunch
     * readLatestAutosave finds this commit as the newest generation. A persistence failure leaves
     * the pre-restore world active and durable, exactly as if the restore was never asked for.
     * Named saves are untouched by construction — this writes only the autosave rotation.
     */
    case 'restoreSlot': {
      const candidate = await readSlot(msg.slot)
      const rngRecovered = ensureMainState(candidate)
      // ⭐ E-02: after every repair, before any commit – see `snapshotMsg`. A slot that cannot render
      // must leave the world the player is playing exactly where it was.
      const snapshot = toSnapshot(candidate)
      let revision: number
      if (world && candidate.careerId === world.careerId) {
        // The ordinary restore (MoreScreen: previous autosave / a named save of the active
        // career): the next revision of the lineage the worker is already playing, CAS-guarded.
        revision = committedRevision + 1
        await commitAutosave(candidate, revision)
      } else {
        // A slot of ANOTHER career (no surface does this today, but the command stays total):
        // restoring it is switching to it, so adopt that career's disk lineage instead.
        ;({ revision } = await adoptAutosave(candidate))
      }
      world = candidate
      committedRevision = revision
      return snapshotMsg(msg.id, candidate, {
        recovered: rngRecovered,
        restoredFrom: msg.slot,
        snapshot,
      })
    }
    case 'importSave': {
      // Candidate-first: decode and repair BEFORE touching module state, adopt the disk lineage
      // (an import over an existing career appends a revision rather than clobbering it), and only
      // commit memory once the autosave is durable.
      const candidate = await decodeExportFile(new Uint8Array(msg.bytes))
      const rngRecovered = ensureMainState(candidate)
      // ⭐⭐ E-02, AND THIS IS THE PATH THE REVIEW MEASURED IT ON. The spine above refuses eight more
      // shapes than it did, but a gate can only refuse what it knows to look for, and the file door
      // is the one input in the game that arrives from outside our own writers. So the last step
      // that can throw runs BEFORE the file becomes the active career and before it is written as
      // the newest autosave: a foreign file that cannot render is now a refused import rather than a
      // persisted career that renders nothing. See `snapshotMsg`.
      const snapshot = toSnapshot(candidate)
      const { revision } = await adoptAutosave(candidate)
      world = candidate
      committedRevision = revision
      return snapshotMsg(msg.id, candidate, { recovered: rngRecovered, snapshot })
    }
    // ⭐ ROUND-21 #1 – THE IMPORT'S CONFIRM NEEDS TO KNOW WHOSE CAREER IS IN THE FILE, and the only
    // place that can answer is here: `careerId` is inside the gzipped payload, so no filename and no
    // careers-list lookup can tell an overwrite from a first import. This runs the SAME strict gate
    // `importSave` does one line up and then throws the world away – nothing is adopted, nothing is
    // committed, `world` and `committedRevision` are not touched, and a hostile file fails here with
    // the identical typed error it would have failed with at the import. The caller is free to treat
    // a failure as "cannot say" and let the real import report it.
    case 'peekSave': {
      const candidate = await decodeExportFile(new Uint8Array(msg.bytes))
      return {
        id: msg.id,
        ok: true,
        type: 'peek',
        peek: { careerId: candidate.careerId, kidName: candidate.profile.kidName, week: candidate.week },
        revision: committedRevision,
      }
    }
    case 'deleteSlot': {
      await deleteSlot(msg.slot)
      const careerId = world?.careerId
      return {
        id: msg.id,
        ok: true,
        type: 'slots',
        slots: careerId ? await listSlots(careerId) : [],
        revision: committedRevision,
      }
    }
    case 'deleteCareer': {
      await deleteCareer(msg.careerId)
      if (world?.careerId === msg.careerId) {
        world = null
        committedRevision = 0
      }
      return { id: msg.id, ok: true, type: 'careers', careers: await listCareers(), revision: committedRevision }
    }
    // ------------------------------------------------------------------ queries
    case 'getSnapshot': {
      // The stale-revision refresh path: a caller refused with STALE_REVISION re-reads the
      // committed world instead of guessing. Read-only by construction.
      if (!world) throw new Error('No active career')
      return snapshotMsg(msg.id, world)
    }
    case 'listSlots': {
      const careerId = msg.careerId ?? world?.careerId
      return {
        id: msg.id,
        ok: true,
        type: 'slots',
        slots: careerId ? await listSlots(careerId) : [],
        revision: committedRevision,
      }
    }
    case 'listCareers':
      return { id: msg.id, ok: true, type: 'careers', careers: await listCareers(), revision: committedRevision }
    case 'exportSave': {
      if (!world) throw new Error('No active career')
      const bytes = await encodeExportFile(world)
      const filename = `tennis-sim_${world.seed}_w${world.week}.tsave`
      return {
        id: msg.id,
        ok: true,
        type: 'exported',
        bytes: bytes.buffer as ArrayBuffer,
        filename,
        revision: committedRevision,
      }
    }
  }
}

function errorMsg(id: number, err: unknown): ErrorReply {
  if (err instanceof StaleRevisionError) {
    return { id, ok: false, error: err.message, code: 'STALE_REVISION', revision: err.currentRevision }
  }
  if (err instanceof SaveConflictError) {
    return { id, ok: false, error: err.message, code: 'SAVE_CONFLICT', revision: err.diskRevision }
  }
  // ⭐⭐ E-05 (05.09 engine review) – AND THE SAVE-FILE CODE CROSSES THE BOUNDARY TOO. `SaveFileError`
  // has carried seven machine-readable kinds since the import gate was written, and that gate's own
  // header states the reason: "the code exists so tests (and any future UI that wants to branch)
  // never match on prose". This function dropped every one of them, so `future-schema` – whose whole
  // point is that the answer is «update the app, then import it» rather than «this file is broken» –
  // reached the store as an untyped sentence. The claim in the header was simply false.
  //
  // ⚠ NO `revision`: a refused file never measured itself against one. The field is for the two
  // concurrency kinds above and stays absent here, which is what the arm in
  // tests/worker-reply-correlation.test.ts asserts alongside the code.
  if (err instanceof SaveFileError) {
    return { id, ok: false, error: err.message, code: err.code }
  }
  return { id, ok: false, error: err instanceof Error ? err.message : String(err) }
}

// =================================================================================================
// W1-INTEGRITY-A (Codex TB-02) — THE SERIALIZED PIPELINE.
//
// Every message runs TO COMPLETION — engine work AND its persistence — before the next one starts.
// The previous dispatcher fired `handle(e.data).then(post)` per message with no queue, so any
// handler awaiting its autosave yielded to the next message: two commands could interleave between
// one command's mutation and its persist (the verified load-bearing defect #2 of this wave), two
// autosaves could race the same generation choice, and a snapshot could serialize a world another
// command was mid-mutating. One promise chain retires the whole class.
//
// CLASSIFICATION of the protocol (TB-02 asks for it recorded; the queue treats them uniformly —
// see WHY below the table):
//
//   message            class        world     storage                    revision
//   -----------------  -----------  --------  -------------------------  -----------------------
//   new                lifecycle    replaces  autosave+meta (adopt)      allocates disk+1
//   tick               mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   advance            mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   enterEvent         mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   withdrawEvent      mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   cancelEntry        mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   skipEvent          mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   tournamentReveal   mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   tournamentSkip     mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   tournamentClose    mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   bookVacation       mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   cancelVacation     mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   bookPractice       mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   hireCoach          mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   hireMasseur        mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   setMasseurSessions mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   setMasseurTravels  mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   setCoachOnEventWeeks mutation   mutates   autosave+meta (CAS)        +1, needs baseRevision
//   setCoachOnJuniorEvents mutation mutates   autosave+meta (CAS)        +1, needs baseRevision
//   cancelPractice     mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   setPlan            mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   decideKnock        mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   signOffer          mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   refuseOffer        mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   setPhysio          mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   setKitGrade        mutation     mutates   autosave+meta (CAS)        +1, needs baseRevision
//   save/saveNamed     persistence  reads     named record+meta (1 tx)   stamps current, no bump
//   deleteSlot         persistence  none      deletes a record           unchanged
//   deleteCareer       persistence  may null  deletes records+meta       resets to 0 if active
//   restoreSlot        lifecycle    replaces  autosave+meta (CAS/adopt)  +1 of the restored lineage
//   loadCareer         lifecycle    replaces  touch lastPlayedAt only    adopts disk max
//   importSave         lifecycle    replaces  autosave+meta (adopt)      allocates disk+1
//   peekSave           query        none      none                       unchanged
//   getSnapshot        query        reads     none                       unchanged
//   listSlots          query        none      reads                      unchanged
//   listCareers        query        none      reads                      unchanged
//   exportSave         query        reads     none                       unchanged
//
// WHY QUERIES RIDE THE SAME QUEUE even though TB-02 permits them to read a captured committed
// revision concurrently: with the candidate rule, `world` is never mid-mutation, so a concurrent
// query would in fact be safe TODAY — but "safe because every current handler is candidate-shaped"
// is an invariant a future handler can silently break, while "safe because nothing runs
// concurrently" cannot be broken without deleting the queue. The cost is a listSlots waiting out
// an advance, which the store's sequential awaits impose anyway. Revisit only with a measured
// UI-latency reason, and then only for the four queries above.
//
// A FAILED COMMAND CANNOT POISON THE QUEUE: each task settles through its own catch (errors become
// error responses), and the chain advances off BOTH settle arms. If posting the RESPONSE itself
// throws (a non-cloneable reply — nothing today can produce one), the final catch keeps the chain
// alive and the client's per-command timeout owns that request's fate.
// =================================================================================================

/** Development-only slow-entry diagnostic (TB-02's last bullet). 2s is far above any healthy
 *  command (a 4-week advance is tens of ms; a 52-week dev tick ~hundreds) and far below the
 *  client's timeouts, so a warning here is an early smell, not noise. */
const SLOW_ENTRY_MS = 2000

let queue: Promise<void> = Promise.resolve()

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const task = async (): Promise<void> => {
    const t0 = performance.now()
    // Two phases on purpose: the reply is DECIDED before it is posted, so a throw out of `post`
    // (a non-cloneable reply — nothing today can produce one) can never convert a command that
    // COMMITTED into an error response claiming it did not run. TB-03's "never report the action
    // itself as failed after it ran" applies to the transport too.
    let reply: ToUI
    try {
      reply = await handle(e.data)
    } catch (err) {
      reply = errorMsg(e.data.id, err)
    }
    try {
      post(reply)
    } catch {
      // The client's per-command timeout owns this request's fate; the queue keeps serving.
    }
    const elapsed = performance.now() - t0
    if (import.meta.env?.DEV && elapsed > SLOW_ENTRY_MS) {
      console.warn(`[sim.worker] slow queue entry: '${e.data.type}' took ${Math.round(elapsed)}ms`)
    }
  }
  queue = queue.then(task, task).catch(() => {})
}
