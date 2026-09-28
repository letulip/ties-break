// ⭐⭐ D-05 (principles review of 26.09, docs/review-principles-2026-09-26/04-worker-protocol-persistence.md)
// – THE CAREERS LIST IS REFRESHED WHERE IT IS READ, INCLUDING WHILE THE SCREEN IS ALREADY OPEN.
//
// WHY THIS FILE EXISTS AT ALL, AND IT IS THE ONE HALF OF D-05 THAT IS NOT COVERED BY WHAT W1 LANDED.
// D-01 gave `slots` a `watch(() => game.revision, …, { immediate: true })` on More, which is what
// licenses deleting the store's 26 `refreshSlots()` tails: the list's one reader refreshes it.
// `careers` had only the MOUNT half (`onMounted(() => game.refreshCareers())`), and its store tails
// lived on `tick`, `advance`, `newCareer`, `restoreSlot` and `importSave`. Delete those without
// giving `careers` the same revision watch and the career row's week / last-played goes stale under
// the ONE control that can tick without leaving the screen: the `▶▶ 52 (dev)` button, which ships in
// every build by an owner ruling and sits on this very tab beside the list it would leave behind.
//
// ⚠⚠ THE MUTATION ARM IS THE INTERMEDATE TREE, AND SAYING SO IS NOT A FORMALITY. This case is GREEN
// on the pre-D-05 tree – for the wrong reason: the store's own `refreshCareers()` tail inside `tick`.
// A net that is green before and after, with no arm in between, is not evidence. Its honest arm is
// the middle commit of D-05's series, where the tails are gone and the watch is not there yet:
//   · MEASURED 28.09 on that tree: «the row follows the week the press bought» goes RED with the row
//     still reading «Season 1 · week 1» after a press that moved the career to week 53.
//   · On the finished tree the same press moves the row, and deleting the careers `watch` from
//     MoreScreen.vue reproduces the red arm at any later date.
//
// ⚠ THE TRANSPORT IS STUBBED AND THE SCREEN IS REAL, which is the right way round for this claim.
// What is under test is WHERE the list is refreshed, not what the engine does with 52 weeks: the stub
// answers `tick` with a career that has moved and a revision that has advanced – exactly what the
// worker's reply carries – and the question is whether the rendered row follows it. The engine's own
// tick has its own suites (tests/dev-fast-forward.test.ts pins the button's bargain).
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import type { CareerMeta, Snapshot, ToUI } from '../../src/shared/protocol'
// ⚠ THE APP'S OWN LABEL, NOT A SECOND SPELLING OF IT. The row prints `weekLabel(c.week)`, whose
// output is a season/year pair rather than a week number, so a test that asserted «week 53» would be
// asserting copy this screen does not write (CLAUDE.md invariant 4 cuts both ways: a test may not
// invent the string either). Reading the helper makes the claim about WHICH WEEK the row is showing.
import { weekLabel } from '../../src/shared/dates'

// ⚠ THIS RUNNER HAS NO localStorage AND MoreScreen READS IT ON MOUNT (sound, motion, match
// defaults) – the same shim round21-dialogs.test.ts, round20-ui.test.ts and
// principles-d01-restore-previous.test.ts install, for the reason quoted there: supply the browser's
// own object rather than weaken the app to suit the runner.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

const CAREER_ID = 'c-d05-fresh'

/** The worker's committed state, as far as this file is concerned: a week and a revision that move
 *  together, because the revision IS the worker's count of committed mutations. */
const committed = { week: 1, revision: 4 }

const snapshotOf = (): Snapshot =>
  ({ careerId: CAREER_ID, week: committed.week, kidName: 'Vera' }) as unknown as Snapshot

const careerRow = (): CareerMeta => ({
  careerId: CAREER_ID,
  kidName: 'Vera',
  country: 'US',
  seed: 'd05-fresh',
  createdAt: 1,
  lastPlayedAt: 1000 + committed.week,
  week: committed.week,
  revision: committed.revision,
})

vi.mock('../../src/worker/client', () => ({
  WorkerRestartError: class extends Error {},
  request: vi.fn(async (msg: { type: string; weeks?: number }): Promise<ToUI> => {
    if (msg.type === 'tick' || msg.type === 'advance') {
      committed.week += msg.weeks ?? 1
      committed.revision += 1
      return { id: 0, ok: true, type: 'snapshot', snapshot: snapshotOf(), revision: committed.revision }
    }
    if (msg.type === 'listCareers') {
      return { id: 0, ok: true, type: 'careers', careers: [careerRow()], revision: committed.revision }
    }
    if (msg.type === 'listSlots') {
      return { id: 0, ok: true, type: 'slots', slots: [], revision: committed.revision }
    }
    return { id: 0, ok: true, type: 'snapshot', snapshot: snapshotOf(), revision: committed.revision }
  }),
}))
import { useGameStore } from '../../src/stores/game'

type Game = ReturnType<typeof useGameStore>

/** Mount More on the Saves tab – the tab that holds BOTH the careers list and the ▶▶ 52 button. */
async function openSaves(): Promise<ReturnType<typeof mount>> {
  const w = mount(MoreScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = w.findAll('.more-tabs .tab-pill').find((t) => t.text() === 'Saves')!
  await tab.trigger('click')
  await flushPromises()
  await flushPromises()
  return w
}

/** The career row's own hint line – the week, her age and when it was last played. */
function rowHint(w: ReturnType<typeof mount>): string {
  const row = w.find('.career-row .hint')
  expect(row.exists(), 'the careers list drew a row').toBe(true)
  return row.text()
}

describe('⭐⭐ D-05 – the careers row follows the career while More is open', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
    committed.week = 1
    committed.revision = 4
  })

  it('⚠ the mount half still holds: a screen opened after a tick shows the week it arrived at', async () => {
    const game: Game = useGameStore()
    game.snapshot = snapshotOf()
    await game.tick(52)
    const w = await openSaves()
    expect(rowHint(w), 'the row printed the week the career is at').toContain(weekLabel(53))
    expect(rowHint(w), 'and not the week it started from').not.toContain(weekLabel(1))
    w.unmount()
  })

  it('⭐⭐⭐ THE ITEM: the ▶▶ 52 press on THIS tab moves the row it sits beside', async () => {
    const game: Game = useGameStore()
    game.snapshot = snapshotOf()
    const w = await openSaves()
    expect(rowHint(w), 'the row starts where the career is').toContain(weekLabel(1))

    const dev = w.findAll('button').find((b) => b.text() === '▶▶ 52 (dev)')
    expect(dev, 'the fast-forward ships in every build – it is on this tab').toBeTruthy()
    await dev!.trigger('click')
    await flushPromises()
    await flushPromises()

    expect(game.snapshot!.week, 'the press really did buy its weeks – the case is not vacuous').toBe(53)
    expect(rowHint(w), 'the row follows the week the press bought').toContain(weekLabel(53))
    expect(rowHint(w), 'the row is not the one the screen mounted with').not.toContain(weekLabel(1))
    w.unmount()
  })

  it('⚠ and it does not re-ask on a reply that moved nothing – a query is not a mutation', async () => {
    const game: Game = useGameStore()
    game.snapshot = snapshotOf()
    const w = await openSaves()
    const { request } = await import('../../src/worker/client')
    const mocked = vi.mocked(request)
    const before = mocked.mock.calls.filter(([m]) => m.type === 'listCareers').length
    expect(before, 'the list was asked for on mount').toBeGreaterThan(0)
    // `refreshCareers` writes back the SAME revision the reply carried, so the watch that called it
    // cannot re-enter. Without that, one refresh would chase its own tail for ever.
    await game.refreshCareers()
    await flushPromises()
    await flushPromises()
    const after = mocked.mock.calls.filter(([m]) => m.type === 'listCareers').length
    expect(after - before, 'a refresh whose revision did not move asks exactly once more').toBe(1)
    w.unmount()
  })
})
