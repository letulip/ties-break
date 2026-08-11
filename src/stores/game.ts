import { defineStore } from 'pinia'
import { request, WorkerRestartError } from '../worker/client'
import {
  DEFAULT_PROFILE,
  type CareerMeta,
  type ForkAnswer,
  type KitGrade,
  type KitLine,
  type KnockChoice,
  type PlayerProfile,
  type Snapshot,
  type SlotMeta,
  type ToUI,
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

type OkReply = Extract<ToUI, { ok: true }>

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
    /** Round 5 item 10: one-shot signal – this `newCareer` was the very first one ever
     *  on this device (the careers list was empty before it). App.vue consumes it once
     *  (to decide whether to launch the coach-mark tour) then patches it back to false. */
    firstEverCareer: false,
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
    /** Unwrap a worker reply: absorb the committed revision, throw typed on refusal. Returning
     *  the ok-narrowed union keeps each action's `res.type === '…'` dispatch type-safe. */
    takeOk(res: ToUI): OkReply {
      if (!res.ok) throw new CommandRejected(res.error, res.code, res.revision)
      this.revision = res.revision
      return res
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
        if (res.type === 'careers') this.careers = res.careers
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
        if (res.type === 'snapshot') this.snapshot = res.snapshot
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
        if (res.type === 'snapshot') this.snapshot = res.snapshot
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
    async newCareer(seed: string, profile: PlayerProfile = DEFAULT_PROFILE) {
      // Empty seed -> generate a readable one store-side (UI randomness is fine outside the engine).
      const finalSeed =
        seed.trim() || `${profile.kidName.toLowerCase()}-${(Math.random().toString(36).slice(2) + '0000').slice(0, 4)}`
      // Snapshot BEFORE creation: "the careers list was empty" is what makes this the
      // very first career ever, not whatever it becomes after refreshCareers() below.
      const wasEmpty = this.careers.length === 0
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'new', seed: finalSeed, profile }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        this.recovered = false
        if (wasEmpty) this.firstEverCareer = true
        await this.refreshCareers()
        await this.refreshSlots()
      })
    },
    async tick(weeks: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tick', weeks, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    async advance(weeks: 1 | 4) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'advance', weeks, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    async enterEvent(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'enterEvent', eventId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    // W2-ENDINGS. Three answers to three questions the engine asked. `startFreshCareer` is not one
    // of them: the hand-off's «raise another» is a UI transition into onboarding, not a command, and
    // that is the whole point of §5.6 - nothing mechanical carries over, so there is nothing for the
    // worker to carry.
    async answerFork(answer: ForkAnswer) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'answerFork', answer, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async answerRetirement(retire: boolean) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'answerRetirement', retire, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** «Four years later» – the one command that CLEARS an ending. It ticks 208 weeks inside a
     *  single worker call, so it is the slowest command in the game by an order of magnitude; the
     *  store's own `busy` flag is what keeps the button from being pressed twice. */
    async resumeFromCollege() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'resumeFromCollege', baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async withdrawEvent(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'withdrawEvent', eventId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** R10-13: cancel an entry before its week starts. Past the deadline the entry fee is NOT
     *  refunded and the week becomes plannable again (practice/vacation); before the deadline it is
     *  an ordinary withdrawal with a full refund. */
    async cancelEntry(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'cancelEntry', eventId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** R9-9: skip an entered tournament at its event week (fee forfeited, travel refunded). */
    async skipEvent(eventId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'skipEvent', eventId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async tournamentReveal() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tournamentReveal', baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async tournamentSkip() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tournamentSkip', baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async tournamentClose() {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'tournamentClose', baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
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
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Cancel a booked vacation before its week starts – full refund. */
    async cancelVacation(week: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'cancelVacation', week, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Book a practice match (watchable friendly) on an empty future week. */
    async bookPractice(week: number, withCoach: boolean) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'bookPractice', week, withCoach, baseRevision: this.revision }),
        )
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Hire a coach off the market, or pass `null` to put the parent back on the court. */
    async hireCoach(coachId: string | null) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'hireCoach', coachId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Buy the coach for competition weeks too, or send him home for them. */
    async setCoachOnEventWeeks(on: boolean) {
      await this.run(async () => {
        const res = this.takeOk(
          await request({ type: 'setCoachOnEventWeeks', on, baseRevision: this.revision }),
        )
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Cancel a booked practice match before its week starts – full refund. */
    async cancelPractice(week: number) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'cancelPractice', week, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async setPlan(plan: WeekPlan) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'setPlan', plan, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    // W4: answer the knock. Nothing else can clear it and the sim will not tick until it is answered,
    // so this is the one action on the store that unblocks time.
    async decideKnock(choice: KnockChoice) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'decideKnock', choice, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    /** ⭐ v48: answer the birthday. Like `decideKnock` above, nothing else can clear it and the sim
     *  will not tick until it is answered – and unlike the knock there is no "skip" branch to reach
     *  for, because all four options are presents in their own way. */
    async chooseGift(giftId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'chooseGift', giftId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    /** THE INBOX (v32): sign a letter. Irreversible – the UI puts a ConfirmDialog in front of this
     *  and there is no unsign command to reach for afterwards. */
    async signOffer(offerId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'signOffer', offerId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** ...and refuse one. Terminal in the same way, so the deadline means something on both sides. */
    async refuseOffer(offerId: string) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'refuseOffer', offerId, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async setPhysio(active: boolean) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'setPhysio', active, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    /** W3-KIT: put one line of her kit on another rung. Moving up buys the item and is billed at
     *  once; moving down is free and lands at the next scheduled purchase. */
    async setKitGrade(line: KitLine, grade: KitGrade) {
      await this.run(async () => {
        const res = this.takeOk(await request({ type: 'setKitGrade', line, grade, baseRevision: this.revision }))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async saveManual() {
      await this.runOp('save', async () => {
        const res = this.takeOk(await request({ type: 'save', slot: 'manual' }))
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    /** TB-01: restore a slot AS THE ACTIVE STATE. The worker commits it as the newest autosave
     *  before replying ok, so a restore that answered is a restore that survives a relaunch —
     *  this replaced `load`, whose restored world evaporated on the next boot. */
    async restoreSlot(slot: string) {
      await this.runOp('load', async () => {
        const res = this.takeOk(await request({ type: 'restoreSlot', slot }))
        if (res.type === 'snapshot') {
          this.snapshot = res.snapshot
          this.recovered = res.recovered ?? false
        }
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    async saveNamed(name: string) {
      await this.runOp('save', async () => {
        const res = this.takeOk(await request({ type: 'saveNamed', name }))
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async loadCareer(careerId: string) {
      await this.runOp('load', async () => {
        const res = this.takeOk(await request({ type: 'loadCareer', careerId }))
        if (res.type === 'snapshot') {
          this.snapshot = res.snapshot
          this.recovered = res.recovered ?? false
        }
        await this.refreshSlots()
      })
    },
    async deleteSlot(slot: string) {
      await this.runOp('delete', async () => {
        const res = this.takeOk(await request({ type: 'deleteSlot', slot }))
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async deleteCareer(careerId: string) {
      await this.runOp('delete-career', async () => {
        const res = this.takeOk(await request({ type: 'deleteCareer', careerId }))
        if (res.type === 'careers') this.careers = res.careers
        if (this.snapshot?.careerId === careerId) {
          this.snapshot = null
          this.slots = []
        }
      })
    },
    async refreshSlots() {
      const res = await request({ type: 'listSlots' })
      if (res.ok && res.type === 'slots') {
        this.revision = res.revision
        this.slots = res.slots
      }
    },
    async refreshCareers() {
      const res = await request({ type: 'listCareers' })
      if (res.ok && res.type === 'careers') {
        this.revision = res.revision
        this.careers = res.careers
      }
    },
    async exportSave() {
      await this.runOp('export', async () => {
        const res = this.takeOk(await request({ type: 'exportSave' }))
        if (res.type !== 'exported') return
        const blob = new Blob([res.bytes], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename
        a.click()
        URL.revokeObjectURL(url)
      })
    },
    async importSave(file: File) {
      await this.runOp('import', async () => {
        const bytes = await file.arrayBuffer()
        const res = this.takeOk(await request({ type: 'importSave', bytes }, [bytes]))
        if (res.type === 'snapshot') this.snapshot = res.snapshot
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
