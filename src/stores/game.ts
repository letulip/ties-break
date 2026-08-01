import { defineStore } from 'pinia'
import { request } from '../worker/client'
import {
  DEFAULT_PROFILE,
  type CareerMeta,
  type KnockChoice,
  type PlayerProfile,
  type Snapshot,
  type SlotMeta,
  type WeekPlan,
} from '../shared/protocol'

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
        this.error = err instanceof Error ? err.message : String(err)
      } finally {
        this.busy = false
      }
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
        const res = await request({ type: 'new', seed: finalSeed, profile })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        this.recovered = false
        if (wasEmpty) this.firstEverCareer = true
        await this.refreshCareers()
        await this.refreshSlots()
      })
    },
    async tick(weeks: number) {
      await this.run(async () => {
        const res = await request({ type: 'tick', weeks })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    async advance(weeks: 1 | 4) {
      await this.run(async () => {
        const res = await request({ type: 'advance', weeks })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
        await this.refreshCareers()
      })
    },
    async enterEvent(eventId: string) {
      await this.run(async () => {
        const res = await request({ type: 'enterEvent', eventId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async withdrawEvent(eventId: string) {
      await this.run(async () => {
        const res = await request({ type: 'withdrawEvent', eventId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** R10-13: cancel an entry before its week starts. Past the deadline the entry fee is NOT
     *  refunded and the week becomes plannable again (practice/vacation); before the deadline it is
     *  an ordinary withdrawal with a full refund. */
    async cancelEntry(eventId: string) {
      await this.run(async () => {
        const res = await request({ type: 'cancelEntry', eventId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** R9-9: skip an entered tournament at its event week (fee forfeited, travel refunded). */
    async skipEvent(eventId: string) {
      await this.run(async () => {
        const res = await request({ type: 'skipEvent', eventId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async tournamentReveal() {
      await this.run(async () => {
        const res = await request({ type: 'tournamentReveal' })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async tournamentSkip() {
      await this.run(async () => {
        const res = await request({ type: 'tournamentSkip' })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async tournamentClose() {
      await this.run(async () => {
        const res = await request({ type: 'tournamentClose' })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    // --- season planner (v13) -------------------------------------------------------------
    /** Book a family vacation on an empty future week (price = the sub-stream quote). */
    async bookVacation(week: number, packageId: string) {
      await this.run(async () => {
        const res = await request({ type: 'bookVacation', week, packageId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Cancel a booked vacation before its week starts – full refund. */
    async cancelVacation(week: number) {
      await this.run(async () => {
        const res = await request({ type: 'cancelVacation', week })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Book a practice match (watchable friendly) on an empty future week. */
    async bookPractice(week: number, withCoach: boolean) {
      await this.run(async () => {
        const res = await request({ type: 'bookPractice', week, withCoach })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Hire a coach off the market, or pass `null` to put the parent back on the court. */
    async hireCoach(coachId: string | null) {
      await this.run(async () => {
        const res = await request({ type: 'hireCoach', coachId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Buy the coach for competition weeks too, or send him home for them. */
    async setCoachOnEventWeeks(on: boolean) {
      await this.run(async () => {
        const res = await request({ type: 'setCoachOnEventWeeks', on })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** Cancel a booked practice match before its week starts – full refund. */
    async cancelPractice(week: number) {
      await this.run(async () => {
        const res = await request({ type: 'cancelPractice', week })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async setPlan(plan: WeekPlan) {
      await this.run(async () => {
        const res = await request({ type: 'setPlan', plan })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    // W4: answer the knock. Nothing else can clear it and the sim will not tick until it is answered,
    // so this is the one action on the store that unblocks time.
    async decideKnock(choice: KnockChoice) {
      await this.run(async () => {
        const res = await request({ type: 'decideKnock', choice })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    /** THE INBOX (v32): sign a letter. Irreversible – the UI puts a ConfirmDialog in front of this
     *  and there is no unsign command to reach for afterwards. */
    async signOffer(offerId: string) {
      await this.run(async () => {
        const res = await request({ type: 'signOffer', offerId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    /** ...and refuse one. Terminal in the same way, so the deadline means something on both sides. */
    async refuseOffer(offerId: string) {
      await this.run(async () => {
        const res = await request({ type: 'refuseOffer', offerId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async setPhysio(active: boolean) {
      await this.run(async () => {
        const res = await request({ type: 'setPhysio', active })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    async saveManual() {
      await this.runOp('save', async () => {
        const res = await request({ type: 'save', slot: 'manual' })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async saveNamed(name: string) {
      await this.runOp('save', async () => {
        const res = await request({ type: 'saveNamed', name })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async load(slot: string) {
      await this.runOp('load', async () => {
        const res = await request({ type: 'load', slot })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    async loadCareer(careerId: string) {
      await this.runOp('load', async () => {
        const res = await request({ type: 'loadCareer', careerId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') {
          this.snapshot = res.snapshot
          this.recovered = res.recovered ?? false
        }
        await this.refreshSlots()
      })
    },
    async deleteSlot(slot: string) {
      await this.runOp('delete', async () => {
        const res = await request({ type: 'deleteSlot', slot })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async deleteCareer(careerId: string) {
      await this.runOp('delete-career', async () => {
        const res = await request({ type: 'deleteCareer', careerId })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'careers') this.careers = res.careers
        if (this.snapshot?.careerId === careerId) {
          this.snapshot = null
          this.slots = []
        }
      })
    },
    async refreshSlots() {
      const res = await request({ type: 'listSlots' })
      if (res.ok && res.type === 'slots') this.slots = res.slots
    },
    async refreshCareers() {
      const res = await request({ type: 'listCareers' })
      if (res.ok && res.type === 'careers') this.careers = res.careers
    },
    async exportSave() {
      await this.runOp('export', async () => {
        const res = await request({ type: 'exportSave' })
        if (!res.ok) throw new Error(res.error)
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
        const res = await request({ type: 'importSave', bytes }, [bytes])
        if (!res.ok) throw new Error(res.error)
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
