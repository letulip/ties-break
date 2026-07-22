import { defineStore } from 'pinia'
import { request } from '../worker/client'
import {
  DEFAULT_PROFILE,
  type PlayerProfile,
  type Snapshot,
  type SlotMeta,
  type WeekPlan,
} from '../shared/protocol'

export const useGameStore = defineStore('game', {
  state: () => ({
    snapshot: null as Snapshot | null,
    slots: [] as SlotMeta[],
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
      await this.refreshSlots()
      if (!this.snapshot && this.slots.length) {
        const mostRecent = [...this.slots].sort((a, b) => b.savedAt - a.savedAt)[0]
        await this.load(mostRecent.slot)
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
      await this.run(async () => {
        const res = await request({ type: 'new', seed, profile })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
        await this.refreshSlots()
      })
    },
    async tick(weeks: number) {
      await this.run(async () => {
        const res = await request({ type: 'tick', weeks })
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
    async load(slot: string) {
      await this.run(async () => {
        const res = await request({ type: 'load', slot })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'snapshot') this.snapshot = res.snapshot
      })
    },
    async deleteSlot(slot: string) {
      await this.run(async () => {
        const res = await request({ type: 'deleteSlot', slot })
        if (!res.ok) throw new Error(res.error)
        if (res.type === 'slots') this.slots = res.slots
      })
    },
    async refreshSlots() {
      const res = await request({ type: 'listSlots' })
      if (res.ok && res.type === 'slots') this.slots = res.slots
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
        await this.refreshSlots()
      })
    },
  },
})
