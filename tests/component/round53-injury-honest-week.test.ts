// ROUND 53 №4 (owner, 21.10) – «календарь показывает 4 недели, я снимаю заявки, а за неделю до
// турнира она здорова, и подать заявку уже поздно». The calendar, the chips, the note and the withdraw
// confirm read the HONEST week (`Snapshot.injury.expectedWeeks`) – the figure the engine's onset sweep
// has used since round 34 #21 – and say the masseur is why.
//
// ⚠ MUTATION-VERIFIED (see the ledger): point `layoffWeeksOut` back at `weeksRemaining` and every
// block below goes red; point `withdrawInjuryNote` at nothing and the last block does.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import type { SeasonEvent } from '../../src/engine/season/types'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { layoffNoteFor, layoffReturnWeek } from '../../src/composables/weekDays'
import { weekLabel } from '../../src/shared/dates'
import { mountSeason } from '../helpers/mountSeason'

const EVENT_ID = 'r53-injury-event'
/** The snapshot reads week 9 (labelled W10), six weeks on the clinic's clock, the daily
 *  rung: back at the top of 12 with the masseur (`expectedWeeks` 3), at the top of 15 without him. The
 *  event sits on 14 – in time on the honest reading, missed on the clinic's – and its entry list closes
 *  at the end of 12. */
function hurtWorld(masseur: boolean): WorldState {
  const world = createWorld('r53-injury-honest', { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = 9
  world.physioActive = false
  world.condition = 100
  world.fundsCents = 1_000_000_00
  world.masseurHired = masseur
  if (masseur) world.masseurSessionsPerWeek = 7
  const event: SeasonEvent = { id: EVENT_ID, week: 14, tier: 'national', surface: 'hard', travelCostCents: 100_00, deadlineWeek: 12 }
  world.season.push(event)
  world.season.sort((a, b) => a.week - b.week)
  world.entries = [EVENT_ID]
  world.injury = { kind: 'ankle sprain', severity: 'moderate', weeksRemaining: 6, totalWeeks: 9, sinceWeek: 6 }
  return world
}

beforeEach(() => setActivePinia(createPinia()))

describe('the note and the return week', () => {
  it('with the masseur: the honest week, and the note names both and says why', () => {
    const snap = toSnapshot(hurtWorld(true))
    expect(snap.injury?.expectedWeeks).toBe(3)
    expect(layoffReturnWeek(snap)).toBe(12)
    const note = layoffNoteFor(snap)
    expect(note).toContain('with the masseur')
    expect(note).toContain(weekLabel(12, snap.startYear))
    expect(note).toContain(weekLabel(15, snap.startYear))
  })

  it('without a masseur: the clinic\'s week and the sentence it always was, byte for byte', () => {
    const snap = toSnapshot(hurtWorld(false))
    expect(snap.injury?.expectedWeeks).toBeUndefined()
    expect(layoffReturnWeek(snap)).toBe(15)
    expect(layoffNoteFor(snap)).toBe(`Injured – back ${weekLabel(15, snap.startYear)}`)
    expect(layoffNoteFor(snap)).not.toContain('masseur')
  })
})

describe('CalendarScreen – the look-ahead between his return and the clinic\'s', () => {
  function mountCalendar(masseur: boolean) {
    const store = useGameStore()
    store.snapshot = toSnapshot(hurtWorld(masseur))
    return mount(CalendarScreen, { global: { stubs: { teleport: true } } })
  }
  const chipWeeks = (w: ReturnType<typeof mountCalendar>): string[] =>
    w.findAll('.cal-ahead li').filter((li) => li.find('.avail-chip.red').exists()).map((li) => li.find('.cal-ahead-week').text())

  it('with the masseur no row from his return week on reads «injury»', () => {
    const w = mountCalendar(true)
    const hurt = chipWeeks(w)
    expect(w.findAll('.cal-ahead li').length, 'the look-ahead is drawn').toBeGreaterThan(3)
    expect(hurt.some((label) => /W1[3-9]/.test(label)), `chips on ${hurt.join()}`).toBe(false)
    w.unmount()
  })

  it('without him the same weeks still read «injury» (control)', () => {
    const w = mountCalendar(false)
    expect(chipWeeks(w).some((label) => /W1[3-5]/.test(label))).toBe(true)
    w.unmount()
  })
})

describe('SeasonScreen – the withdraw confirm', () => {
  async function askedFor(masseur: boolean): Promise<{ text: string; startYear: number }> {
    const snap = toSnapshot(hurtWorld(masseur))
    const w = mountSeason(snap)
    const button = w.findAll('button').find((b) => b.text() === 'Withdraw')
    expect(button, 'the entered, still-open event draws Withdraw').toBeDefined()
    await button!.trigger('click')
    const text = w.text()
    w.unmount()
    return { text, startYear: snap.startYear }
  }

  it('with the masseur it says she is back in time, why, and when entries close', async () => {
    const { text, startYear } = await askedFor(true)
    expect(text).toContain('Withdraw from')
    expect(text).toContain(`With the masseur she is expected back by ${weekLabel(12, startYear)}`)
    expect(text).toContain(`Entries close at the end of ${weekLabel(12, startYear)}`)
  })

  it('without him, in time or not, the sentence is not invented: out past the event says nothing', async () => {
    const { text } = await askedFor(false)
    expect(text).toContain('Withdraw from')
    expect(text).not.toContain('expected back')
  })
})
