import { defineStore } from 'pinia'
import { request, WorkerRestartError } from '../worker/client'
import {
  DEFAULT_PROFILE,
  type CareerMeta,
  type CareersReply,
  type CollegeTier,
  type ErrorReply,
  type ForkAnswer,
  type KitGrade,
  type KitLine,
  type KnockChoice,
  type OkReply,
  type PlayerProfile,
  type PrologueHandover,
  type SavePeek,
  type ShootClashChoice,
  type Snapshot,
  type SlotMeta,
  type SlotsReply,
  type SnapshotReply,
  type WeekPlan,
  type WorkerErrorCode,
} from '../shared/protocol'

// W1-INTEGRITY-A: the store is the worker pipeline's UI-side ledger. It tracks the committed
// `revision` off every response and hands it back as `baseRevision` on every mutation, so a
// command can only ever apply to the exact state the player was looking at when they chose it —
// the worker refuses anything else with a typed STALE_REVISION (see `run`'s catch for how both
// typed failures recover).

/** A worker refusal, with the machine-readable half of the wire error preserved. The plain
 *  `new Error(res.error)` this replaces flattened STALE_REVISION / SAVE_CONFLICT into prose,
 *  which left `run()` no honest way to dispatch recovery. Exported for the Settings/import
 *  surfaces (W1-INTEGRITY-B's seam) to reuse. */
export class CommandRejected extends Error {
  constructor(
    message: string,
    readonly code?: WorkerErrorCode,
    readonly revision?: number,
  ) {
    super(message)
    this.name = 'CommandRejected'
  }
}

/**
 * R2-05 — the assertion the central appliers below are built on.
 *
 * ⚠ IT IS NOT A DUPLICATE OF `replyMismatch` IN worker/client.ts, and the difference is which
 * mistake each one can see. The client holds the COMMAND and checks the reply against the command
 * that asked for it; that is the wire contract and it needs `REPLY_BY_COMMAND`. This one holds only
 * the reply and checks it against the arm the consumer is about to read fields off – so it is the
 * one that fires if a reply reaches an applier by any route that did not come through `request`.
 *
 * ⚠ AND IT MUST THROW RATHER THAN RETURN. `this.snapshot = res.snapshot` on a wrong arm assigns
 * `undefined` and blanks the game; the `if (res.type === 'snapshot')` this replaced merely did
 * nothing. Neither is acceptable, and only a refusal says what happened – it lands in `run`'s catch,
 * leaves the previous snapshot standing, and the player sees a message instead of an empty screen.
 */
function expectArm<K extends OkReply['type']>(res: OkReply, arm: K): Extract<OkReply, { type: K }> {
  if (res.type !== arm) {
    throw new CommandRejected(`The simulation answered '${res.type}' where a '${arm}' reply was expected`)
  }
  // The parameter type already guarantees this at every call site in this file; the cast is what
  // lets the guard exist at all, for the one caller the compiler cannot see coming.
  return res as Extract<OkReply, { type: K }>
}

/** Which save-management operation a status row is about – the UI maps these to labels/retries. */
export type SaveOpKind = 'save' | 'load' | 'delete' | 'delete-career' | 'export' | 'import'
export interface SaveOpStatus {
  op: SaveOpKind
  status: 'pending' | 'ok' | 'error'
  message?: string
}

export const useGameStore = defineStore('game', {
  state: () => ({
    snapshot: null as Snapshot | null,
    slots: [] as SlotMeta[],
    careers: [] as CareerMeta[],
    /** set when the active autosave was damaged and the previous generation was restored */
    recovered: false,
    // ⚠ `firstEverCareer` WAS HERE AND IS GONE (16.08). Round 5 item 10 used it as a one-shot signal
    // that this `newCareer` was the very first ever on the device, and App.vue consumed it on the
    // first snapshot transition to decide whether to launch the coach-mark tour. It is not
    // persisted, so a player whose first session ended before they answered the tour lost the
    // onboarding for good: the flag was spent and the localStorage mark it guarded is written only
    // when the tour is actually dismissed. The gate is a function of that durable mark now (App.vue,
    // `tourWanted`) and needs no signal from the store at all – so the field is removed rather than
    // left as an unread one-shot for the next wave to reintroduce the race with.
    persisted: null as boolean | null,
    /** the worker's committed revision as of the last response seen – the `baseRevision`
     *  every mutation carries (W1-INTEGRITY-A) */
    revision: 0,
    busy: false,
    error: '',
    ready: false,
    /** INIT IS A TOTAL TRANSITION (W1-INTEGRITY-B, TB-06): `loading -> ready | recovery`, no third
     *  exit. `ready` (above) stays as the legacy boolean every screen already reads; this field is
     *  the full state, and `recovery` is the one `ready` could never express – the database said
     *  no, and the app must SAY so and offer a way forward instead of spinning on the splash. */
    phase: 'loading' as 'loading' | 'ready' | 'recovery',
    /** what went wrong when `phase === 'recovery'` – rendered verbatim on the recovery screen */
    initError: '',
    /** The last save-management operation's visible outcome (TB-19: every persistence result gets
     *  pending/success/failure feedback). One row, newest wins – More renders it. */
    saveOp: null as SaveOpStatus | null,
  }),
  actions: {
    /** Unwrap a worker reply: absorb the committed revision, throw typed on refusal.
     *
     *  ⚠ R2-05 — IT NOW RETURNS THE COMMAND'S OWN REPLY, not the ok-narrowed union of all of them.
     *  `T` is whatever `request` inferred for the command that produced `res`, so an `advance`
     *  arrives here as a `SnapshotReply` and leaves as one. That is what retires the 36 copies of
     *  `if (res.type === 'snapshot')` this store used to carry: there is nothing left to narrow. */
    takeOk<T extends OkReply>(res: T | ErrorReply): T {
      if (!res.ok) throw new CommandRejected(res.error, res.code, res.revision)
      this.revision = res.revision
      return res
    },
    // ---------------------------------------------------------------------------------------
    // R2-05 — THE CENTRAL APPLIERS. One place per reply shape where a worker answer becomes UI
    // state, replacing a per-command `if` at every call site.
    //
    // ⚠ WHY THE `if` HAD TO GO RATHER THAN BE TIDIED. `if (res.type === 'snapshot')` reads like a
    // check and behaves like a SILENCE: on a mispaired reply it is simply false, the snapshot is
    // never published, no error is raised, and the screen keeps showing the previous week. These
    // take the exact arm instead, so the same mistake is a compile error – and if the worker itself
    // ever answers off-contract, `worker/client.ts` has already rejected the request before the
    // reply can reach one of these (`replyMismatch`, the runtime half of the same table).
    // ---------------------------------------------------------------------------------------
    /** THE ONE PLACE A `Snapshot` REACHES THE UI. */
    applySnapshot(res: SnapshotReply): void {
      this.snapshot = expectArm(res, 'snapshot').snapshot
    },
    applySlots(res: SlotsReply): void {
      this.slots = expectArm(res, 'slots').slots
    },
    applyCareers(res: CareersReply): void {
      this.careers = expectArm(res, 'careers').careers
    },
    async init() {
      this.phase = 'loading'
      this.initError = ''
      try {
        if (navigator.storage?.persist) {
          this.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist())
        }
        // The probe is a DIRECT request, not refreshCareers(): that helper swallows a failed reply
        // on purpose (fine mid-game, where stale lists beat noise), and swallowing it HERE is how
        // the old init turned "IndexedDB denied" into "fresh install" – it booted a player with
        // years of careers straight into the onboarding wizard, and the first hint anything was
        // wrong came when their new career failed to autosave. A failed probe now lands in
        // `recovery` with the actual error, and every path out of it is explicit.
        const res = await request({ type: 'listCareers' })
        if (!res.ok) {
          this.initError = res.error
          this.phase = 'recovery'
          return
        }
        this.applyCareers(res)
        if (!this.snapshot && this.careers.length) {
          const mostRecent = [...this.careers].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)[0]
          await this.loadCareer(mostRecent.careerId)
        }
        this.ready = true
        this.phase = 'ready'
      } catch (err) {
        // A crashed worker rejects every pending request (client.ts) – without this catch that
        // rejection would fly out of onMounted unhandled and the splash would spin forever.
        this.initError = err instanceof Error ? err.message : String(err)
        this.phase = 'recovery'
      }
    },
    /** The recovery screen's Retry. Works WITHOUT a reload because db/saves.ts no longer caches a
     *  rejected open – a fresh init really does knock on IndexedDB again. */
    async retryInit() {
      await this.init()
    },
    /** The recovery screen's "start a new career": an explicit player decision to walk past the
     *  storage failure into onboarding. Nothing is deleted – if the database comes back, every
     *  career is still there – but a new career's saves may fail until it does, and those
     *  failures now surface (the wizard renders `error`, More renders `saveOp`). */
    startFreshFromRecovery() {
      this.ready = true
      this.phase = 'ready'
    },
    async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
      this.busy = true
      this.error = ''
      try {
        return await fn()
      } catch (err) {
        // TB-05: the worker died (crash / undeliverable message / timeout) and was torn down.
        // TB-03 makes the recovery unambiguous — every ok response was durable, so the last
        // committed autosave IS the last state the player was truthfully shown as saved. Reload
        // it through the fresh worker the next request spawns; never retry the failed command
        // itself, because whether it committed is exactly what a dead worker cannot answer.
        if (err instanceof WorkerRestartError) {
          await this.reloadAfterRestart()
          return undefined
        }
        if (err instanceof CommandRejected && err.code === 'STALE_REVISION') {
          // TB-02: the command was based on a state the worker has since moved past (two surfaces
          // racing; the busy-flag usually prevents it, the worker's refusal is the guarantee).
          // Adopt the current revision, re-fetch the committed snapshot so the player decides
          // against what IS, and say why nothing happened.
          await this.refreshAfterStale(err)
          return undefined
        }
        if (err instanceof CommandRejected && err.code === 'SAVE_CONFLICT') {
          // TB-04 (CAS half): the disk holds newer progress than this tab's world — another tab
          // committed since we loaded. The write was refused with nothing clobbered. Full tab
          // ownership (Web Locks lease, read-only secondary tabs) is deferred by the launch plan;
          // until then the honest move is to say it plainly and let the player reload by hand.
          this.error = 'Another tab has newer progress for this career – reload before continuing here.'
          return undefined
        }
        this.error = err instanceof Error ? err.message : String(err)
      } finally {
        this.busy = false
      }
    },
    /** The TB-05 recovery tail: a fresh worker boots empty, so reload the last committed
     *  autosave of the career the player was in and tell them where time resumed. Raw
     *  `request` on purpose — this runs inside `run`'s catch, not as a nested action. */
    async reloadAfterRestart() {
      const careerId = this.snapshot?.careerId
      if (!careerId) {
        this.error = 'The simulation restarted. Try again.'
        return
      }
      try {
        const res = this.takeOk(await request({ type: 'loadCareer', careerId }))
        this.applySnapshot(res)
        await this.refreshSlots()
        // The required copy (TB-05): the player is told whether unsaved work may have been lost —
        // under TB-03 nothing past the last ok response ever existed, and that is the saved week.
        this.error = 'Simulation restarted from the last saved week.'
      } catch {
        // Even the reload failed (storage denied, second crash): stay honest, stay recoverable —
        // the next tap retries through another fresh worker.
        this.error = 'The simulation crashed. Try again, or reopen the app to continue.'
      }
    },
    async refreshAfterStale(err: CommandRejected) {
      if (typeof err.revision === 'number') this.revision = err.revision
      try {
        const res = this.takeOk(await request({ type: 'getSnapshot' }))
        this.applySnapshot(res)
      } catch {
        /* no active career or a fresh failure – the copy below still explains the refusal */
      }
      this.error = 'That action was based on an outdated screen – it was refreshed. Try again.'
    },
    /** `run`, plus a visible outcome (TB-19). Save-management actions route through this so the
     *  result – pending, then ok or a typed error – is STATE the More screen renders, instead of
     *  a string that only four unrelated screens happened to show. `run` still owns busy/error. */
    async runOp<T>(op: SaveOpKind, fn: () => Promise<T>): Promise<T | undefined> {
      this.saveOp = { op, status: 'pending' }
      const out = await this.run(fn)
      this.saveOp = this.error ? { op, status: 'error', message: this.error } : { op, status: 'ok' }
      return out
    },
    /** ⭐ `prologue` IS THE SECOND PATH AND IT IS OPTIONAL (build spec §6). The wizard calls this with
     *  two arguments exactly as it always has; the nine cards call it with three. Everything the
     *  prologue earned is applied engine-side by `createWorld` – this store does no arithmetic and
     *  holds no prologue state. */
    async newCareer(seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) {
      // Empty seed -> generate a readable one store-side (UI randomness is fine outside the engine).
      const finalSeed =
        seed.trim() || `${profile.kidName.toLowerCase()}-${(Math.random().toString(36).slice(2) + '0000').slice(0, 4)}`
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'new', seed: finalSeed, profile, prologue }))
        this.applySnapshot(res)
        this.recovered = false
        await this.refreshCareers()
        await this.refreshSlots()
      })
    },
    async tick(weeks: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tick', weeks, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    // ⚠ ROUND 29 #6: `1 | 4` widened to a plain count – the span the pill offers is now the length
    // of the actual quiet slot (`spanWeeksFor`), not the engine's historical step.
    async advance(weeks: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'advance', weeks, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    async enterEvent(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'enterEvent', eventId, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    // W2-ENDINGS. Three answers to three questions the engine asked. `startFreshCareer` is not one
    // of them: the hand-off's «raise another» is a UI transition into onboarding, not a command, and
    // that is the whole point of §5.6 - nothing mechanical carries over, so there is nothing for the
    // worker to carry.
    // ⭐ `tier` IS THE PLACE THE PLAYER PICKED (17.08). Optional on the wire because only one of the
    // three answers has one – see the command's own note in `protocol.ts`.
    async answerFork(answer: ForkAnswer, tier?: CollegeTier) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'answerFork', answer, tier, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async answerRetirement(retire: boolean) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'answerRetirement', retire, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** «Another year» – the one command that CLEARS an ending. It ticks a college year inside a
     *  single worker call, so it is one of the slowest commands in the game; the store's own `busy`
     *  flag is what keeps the button from being pressed twice.
     *
     *  ⭐ P5: it used to tick 208 weeks and hand back a twenty-two-year-old. One year at a time is
     *  what makes the early return possible at all – see `endCollegeEarly`. */
    async resumeFromCollege() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'resumeFromCollege', baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** ⭐ P5 – «back on tour now». The other answer at a college year boundary: it takes the latch
     *  off for good instead of putting it back on. Engine-side it refuses on a career that is not at
     *  a boundary, so this is a request and not a guarantee. */
    async endCollegeEarly() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'endCollegeEarly', baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async withdrawEvent(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'withdrawEvent', eventId, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** R10-13: cancel an entry before its week starts. Past the deadline the entry fee is NOT
     *  refunded and the week becomes plannable again (practice/vacation); before the deadline it is
     *  an ordinary withdrawal with a full refund. */
    async cancelEntry(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'cancelEntry', eventId, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** R9-9: skip an entered tournament at its event week (fee forfeited, travel refunded). */
    async skipEvent(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'skipEvent', eventId, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async tournamentReveal() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tournamentReveal', baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async tournamentSkip() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tournamentSkip', baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async tournamentClose() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tournamentClose', baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    // --- season planner (v13) -------------------------------------------------------------
    /** Book a family vacation on an empty future week (price = the sub-stream quote). */
    async bookVacation(week: number, packageId: string) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'bookVacation', week, packageId, baseRevision: this.revision }),
        )
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** Cancel a booked vacation before its week starts – full refund. */
    async cancelVacation(week: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'cancelVacation', week, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** ⭐ v63, the shop slice 1: buy a rung of the shelf. `stakeCents` is the amount on an 'open'
     *  rung (an investment names a minimum) and is ignored on a 'fixed' one. `refreshSlots` because
     *  money moved – the same reason the two bookings above refresh and `chooseGift` does not. */
    async buyAsset(itemId: string, stakeCents?: number, name?: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'buyAsset', itemId, stakeCents, name, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** ...and sell one, at the value the engine stored – never at a price this side computed. */
    async sellAsset(itemId: string, amountCents?: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'sellAsset', itemId, amountCents, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** Book a practice match (watchable friendly) on an empty future week. */
    async bookPractice(week: number, withCoach: boolean) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'bookPractice', week, withCoach, baseRevision: this.revision }),
        )
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** Hire a coach off the market, or pass `null` to put the parent back on the court. */
    async hireCoach(coachId: string | null) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'hireCoach', coachId, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** v59, the travelling team step 1: the masseur on or off the payroll. The engine re-validates
     *  the pro-career gate and the college freeze; this is a thin RPC like every other command. */
    async hireMasseur(hire: boolean) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'hireMasseur', hire, baseRevision: this.revision }))
        this.applySnapshot(res)
      })
    },
    /** v59 step 2: the sessions dial – the engine refuses a rung the market does not sell. */
    async setMasseurSessions(sessions: number) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'setMasseurSessions', sessions, baseRevision: this.revision }),
        )
        this.applySnapshot(res)
      })
    },
    /** v59 step 2: the travel stance – one more fare on every trip to a paying rung. */
    async setMasseurTravels(on: boolean) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'setMasseurTravels', on, baseRevision: this.revision }),
        )
        this.applySnapshot(res)
      })
    },
    /** Buy the coach for competition weeks too, or send him home for them. */
    async setCoachOnEventWeeks(on: boolean) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'setCoachOnEventWeeks', on, baseRevision: this.revision }),
        )
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** ⭐ v49: ...and send him to the junior and domestic trips too, or stop. The screen warns what
     *  that costs before it calls this; the engine records the decision and refuses nothing. */
    async setCoachOnJuniorEvents(on: boolean) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'setCoachOnJuniorEvents', on, baseRevision: this.revision }),
        )
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** Cancel a booked practice match before its week starts – full refund. */
    async cancelPractice(week: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'cancelPractice', week, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async setPlan(plan: WeekPlan) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'setPlan', plan, baseRevision: this.revision }))
        this.applySnapshot(res)
      })
    },
    // W4: answer the knock. Nothing else can clear it and the sim will not tick until it is answered,
    // so this is the one action on the store that unblocks time.
    async decideKnock(choice: KnockChoice) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'decideKnock', choice, baseRevision: this.revision }))
        this.applySnapshot(res)
      })
    },
    /** ⭐⭐ ROUND 29 #3: answer the shoot that landed on a tournament week. Like `decideKnock` above,
     *  nothing else can clear it and the sim will not tick until it is answered – and unlike the
     *  knock two of its four answers stop being POSSIBLE once the week starts, which is why the
     *  engine refuses to move time in front of it rather than merely halting on it. */
    async answerShootClash(choice: ShootClashChoice) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'answerShootClash', choice, baseRevision: this.revision }))
        this.applySnapshot(res)
      })
    },
    /** ⭐ v48: answer the birthday. Like `decideKnock` above, nothing else can clear it and the sim
     *  will not tick until it is answered – and unlike the knock there is no "skip" branch to reach
     *  for, because all four options are presents in their own way. */
    async chooseGift(giftId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'chooseGift', giftId, baseRevision: this.revision }))
        this.applySnapshot(res)
      })
    },
    /** THE INBOX (v32): sign a letter. Irreversible – the UI puts a ConfirmDialog in front of this
     *  and there is no unsign command to reach for afterwards. */
    async signOffer(offerId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'signOffer', offerId, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    /** ...and refuse one. Terminal in the same way, so the deadline means something on both sides. */
    async refuseOffer(offerId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'refuseOffer', offerId, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async setPhysio(active: boolean) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'setPhysio', active, baseRevision: this.revision }))
        this.applySnapshot(res)
      })
    },
    /** W3-KIT: put one line of her kit on another rung. Moving up buys the item and is billed at
     *  once; moving down is free and lands at the next scheduled purchase. */
    async setKitGrade(line: KitLine, grade: KitGrade) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'setKitGrade', line, grade, baseRevision: this.revision }))
        this.applySnapshot(res)
        await this.refreshSlots()
      })
    },
    async saveManual() {
      await this.runOp('save', async () => {
        const res = this.takeOk(await request({ type: 'save', slot: 'manual' }))
        this.applySlots(res)
      })
    },
    /** TB-01: restore a slot AS THE ACTIVE STATE. The worker commits it as the newest autosave
     *  before replying ok, so a restore that answered is a restore that survives a relaunch —
     *  this replaced `load`, whose restored world evaporated on the next boot. */
    async restoreSlot(slot: string) {
      await this.runOp('load', async () => {
        const res = this.takeOk(await request({ type: 'restoreSlot', slot }))
        this.applySnapshot(res)
        this.recovered = res.recovered ?? false
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    async saveNamed(name: string) {
      await this.runOp('save', async () => {
        const res = this.takeOk(await request({ type: 'saveNamed', name }))
        this.applySlots(res)
      })
    },
    async loadCareer(careerId: string) {
      await this.runOp('load', async () => {
        const res = this.takeOk(await request({ type: 'loadCareer', careerId }))
        this.applySnapshot(res)
        this.recovered = res.recovered ?? false
        await this.refreshSlots()
      })
    },
    async deleteSlot(slot: string) {
      await this.runOp('delete', async () => {
        const res = this.takeOk(await request({ type: 'deleteSlot', slot }))
        this.applySlots(res)
      })
    },
    async deleteCareer(careerId: string) {
      await this.runOp('delete-career', async () => {
        const res = this.takeOk(await request({ type: 'deleteCareer', careerId }))
        this.applyCareers(res)
        if (this.snapshot?.careerId === careerId) {
          this.snapshot = null
          this.slots = []
        }
      })
    },
    // ⚠ THE TWO REFRESH HELPERS SWALLOW A FAILED REPLY ON PURPOSE and still do: mid-game a stale
    // list beats noise, and `init` deliberately does NOT come through here for exactly that reason
    // (its own note says why). R2-05 removed only the `&& res.type === 'slots'` half of the
    // condition – the reply's arm is now decided by the command – and left the `res.ok` half alone.
    async refreshSlots() {
      const res = await request({ type: 'listSlots' })
      if (res.ok) {
        this.revision = res.revision
        this.applySlots(res)
      }
    },
    async refreshCareers() {
      const res = await request({ type: 'listCareers' })
      if (res.ok) {
        this.revision = res.revision
        this.applyCareers(res)
      }
    },
    async exportSave() {
      await this.runOp('export', async () => {
        // ⚠ `if (res.type !== 'exported') return` STOOD HERE AND IS GONE (R2-05). It was the export
        // path's copy of the silence: a mispaired reply left the player with no file and no error.
        // `exportSave` answers `exported` by the protocol's own table, so `res.bytes` is simply here.
        const res = this.takeOk(await request({ type: 'exportSave' }))
        const blob = new Blob([res.bytes], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename
        a.click()
        URL.revokeObjectURL(url)
      })
    },
    /** ⭐ ROUND-21 #1 – WHAT IS IN THIS FILE, before anything is done with it.
     *
     *  ⚠ ADVISORY, AND `null` MEANS "CANNOT SAY" RATHER THAN "SAFE". A peek that fails – a hostile
     *  file, a rotted one, a dead database, a wedged worker – must not be reported as a verdict, so
     *  the caller shows the cautious wording and lets the REAL import produce the real typed error
     *  through `saveOp`. Nothing here decides whether the import is allowed; the worker is still the
     *  only gate (CLAUDE.md invariant 1) and this asks it a read-only question.
     *
     *  ⚠ IT DOES NOT GO THROUGH `runOp`, which would be the obvious shape and is the wrong one: this
     *  is not an operation the player asked for and its failure is not a failure to report. Writing
     *  a red "Import – failed" row here would announce an error for a file they have not yet agreed
     *  to import, and then announce it a second time when they do. */
    async peekSave(file: File): Promise<SavePeek | null> {
      try {
        // Its own copy of the bytes: `request` TRANSFERS the buffer, so a peek that shared one with
        // the import would hand the worker a detached ArrayBuffer. A File can be read twice.
        const bytes = await file.arrayBuffer()
        const res = await request({ type: 'peekSave', bytes }, [bytes])
        // ⚠ `!res.ok` STAYS AND IS THE WHOLE POINT OF THIS ACTION – a failed peek is "cannot say",
        // never "safe". Only the `res.type !== 'peek'` half went with R2-05, and a worker that
        // answered off-contract would now reject in the client and land in the catch below, which
        // returns the same cautious `null`.
        if (!res.ok) return null
        this.revision = res.revision
        return res.peek
      } catch {
        return null
      }
    },
    async importSave(file: File) {
      await this.runOp('import', async () => {
        const bytes = await file.arrayBuffer()
        const res = this.takeOk(await request({ type: 'importSave', bytes }, [bytes]))
        this.applySnapshot(res)
        await this.refreshCareers()
        await this.refreshSlots()
        // A successful import IS a way out of storage recovery – the write went through, so the
        // database is back (or was never the problem). Flip to ready so the shell mounts the game.
        if (this.phase === 'recovery') {
          this.ready = true
          this.phase = 'ready'
        }
      })
    },
  },
})
