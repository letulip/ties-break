import { defineStore } from 'pinia'
import { request } from '../worker/client'
import {
  DEFAULT_PROFILE,
  type CareerMeta,
  type PlayerProfile,
  type Snapshot,
  type SlotMeta,
  type WeekPlan,
} from '../shared/protocol'

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
  }),
  actions: {
    async init() {
      if (navigator.storage?.persist) {
        this.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist())
      }
      await this.refreshCareers()
      if (!this.snapshot && this.careers.length) {
        const mostRecent = [...this.careers].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)[0]
        await this.loadCareer(mostRecent.careerId)
      }
      this.ready = true
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
    async setPlan(plan: WeekPlan) {
      await this.run(async () => {
        const res = await request({ type: 'setPlan', plan })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    async saveManual() {
      await this.run(async () => {
        const res = await request({ type: 'save', slot: 'manual' })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async saveNamed(name: string) {
      await this.run(async () => {
        const res = await request({ type: 'saveNamed', name })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async load(slot: string) {
      await this.run(async () => {
        const res = await request({ type: 'load', slot })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    async loadCareer(careerId: string) {
      await this.run(async () => {
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
      await this.run(async () => {
        const res = await request({ type: 'deleteSlot', slot })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async deleteCareer(careerId: string) {
      await this.run(async () => {
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
      await this.run(async () => {
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
      await this.run(async () => {
        const bytes = await file.arrayBuffer()
        const res = await request({ type: 'importSave', bytes }, [bytes])
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshCareers()
        await this.refreshSlots()
      })
    },
  },
})
