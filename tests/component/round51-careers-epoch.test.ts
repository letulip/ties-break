// ROUND 51 №3 – THE CAREERS LIST DATES EACH ROW IN ITS OWN EPOCH, MOUNTED.
//
// The owner's list printed every row with the ACTIVE career's epoch, so once the daughter (epoch 2066) was active, her mother's week 1037 read «'85» where it is «'50» (2031 + 19 seasons). The
// claim is about what a player SEES on a screen, so it is mounted: a source pin would pass on a component that prints whatever year it likes.
//
// ⚠ THE LABELS ARE COMPUTED BY THE SAME `weekLabel` THE SCREEN CALLS, never typed: the format («W50 · '50») is the owner's and this file does not restate it. What is asserted is WHICH YEAR the
// screen hands that function – and each case first proves its fixture is not vacuous (the two epochs really print different labels), the way one-clock-ui does for the two ages.
//
// WHAT EACH ARM HOLDS (and which wrong implementation reddens it):
//   defect arm     a row with no epoch of its own (every row saved before the field) dates in 2031     ← "use the active epoch" (the shipped defect) reddens it
//   field wins     a row WITH an epoch dates in it, whether it equals the default, the active or neither ← "always the default" / "always the active" redden it
//   active, bare   the ACTIVE career's row without the field still dates in the active epoch            ← a bare `?? DEFAULT_START_YEAR` would regress the one row the player is looking at
//   age edge       the age uses the row's epoch too (it differs from the active one only in a birthday week)
//   named slots    the table lists the ACTIVE career's slots only, so the active epoch is right there      ← pins the one site that was NOT broken
//   import confirm both branches date the FILE's week in the FILE's calendar, and the existing row in its own
//
// MUTATION (measured 13.10, two ways). (1) `git apply -R` of the MoreScreen.vue half of the fix → FIVE of seven go RED: the defect arm (it printed «W50 '85» where «W50 '50» belongs), field-wins, the age
// edge and both import-confirm arms; active-bare and named-slots stay green, which is right – the old code dated everything in the active epoch, so those two were never broken. (2) Drop ONLY the active
// rung of `rowStartYear` (a bare `?? DEFAULT_START_YEAR`) → exactly the active-bare arm goes RED and nothing else, which is what that arm is for. The row builder's and the worker's halves are
// tests/round51-careers-epoch.test.ts.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { weekLabel } from '../../src/i18n/dates'
import { DEFAULT_START_YEAR } from '../../src/shared/dates'
import { kidAgeYears } from '../../src/engine/world'
import type { CareerMeta, SavePeek, SlotMeta, Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

// ⚠ THIS RUNNER HAS NO localStorage AND MoreScreen READS IT ON MOUNT – the shim round21-dialogs.test.ts installs, for the reason quoted there.
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

const DAUGHTER_ID = 'c-daughter'
/** The daughter's epoch: the mother opened in 2031 and ended in 2050, the daughter was born in 2052 and starts at 14 (docs/specs/succession-2026-10.md §1.3). */
const DAUGHTER_EPOCH = 2066
/** The mother's last week: season 20, week 50 – 2031 + 19 = 2050, where the daughter's calendar would say 2085. */
const MOTHER_WEEK = 1037

/** The ACTIVE career: a real snapshot with the daughter's identity and epoch posed on it. */
function activeSnapshot(): Snapshot {
  return { ...careerSnapshot(4, 'r51-epoch'), careerId: DAUGHTER_ID, startYear: DAUGHTER_EPOCH }
}

const row = (over: Partial<CareerMeta> = {}): CareerMeta => ({
  careerId: 'c-mother',
  kidName: 'Vera',
  country: 'US',
  seed: 'r51-mother',
  createdAt: 0,
  lastPlayedAt: 0,
  week: MOTHER_WEEK,
  ...over,
})

/** More on the Saves tab, with the daughter active and the given careers, slots and peek. There is no worker under happy-dom: the two refreshes are replaced and the two file actions spied. */
async function openSaves(careers: CareerMeta[], opts: { slots?: SlotMeta[]; peek?: SavePeek | null } = {}) {
  const store = useGameStore()
  store.snapshot = activeSnapshot()
  store.careers = careers
  store.slots = opts.slots ?? []
  store.refreshCareers = async () => {}
  store.refreshSlots = async () => {}
  vi.spyOn(store, 'peekSave').mockResolvedValue(opts.peek ?? null)
  vi.spyOn(store, 'importSave').mockResolvedValue(undefined)
  const w = mount(MoreScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = w.findAll('.more-tabs .tab-pill').find((b) => b.text() === 'Saves')!
  await tab.trigger('click')
  return w
}

/** The date line of the list row for `kidName` – `.career-info` is the Careers list's own cell, so the settings rows that reuse `.career-row` on Play are never in the way. */
function hintOf(w: Awaited<ReturnType<typeof openSaves>>, kidName: string): string {
  const info = w.findAll('.career-info').find((i) => i.find('.career-name').text().startsWith(kidName))
  expect(info, `the list has a row for ${kidName}`).toBeTruthy()
  return info!.find('.hint').text()
}

/** Pick a file the way the picker does (happy-dom's `files` is read-only: defined onto the element, then the same `change` the screen listens for). */
async function pickFile(w: Awaited<ReturnType<typeof openSaves>>): Promise<void> {
  const input = w.find('input[type="file"]')
  expect(input.exists(), 'the Saves tab draws the import picker').toBe(true)
  Object.defineProperty(input.element, 'files', { value: [new File([new Uint8Array([1, 2, 3, 4])], 'vera.tsave')], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

/** Two epochs, one week: the label each would print, with the precondition that they differ (or the arm below is vacuous). */
function labels(week: number, right: number, wrong: number): { right: string; wrong: string } {
  const pair = { right: weekLabel(week, right), wrong: weekLabel(week, wrong) }
  expect(pair.right, `fixture: week ${week} dates differently in ${right} and ${wrong}, or the arm is vacuous`).not.toBe(pair.wrong)
  return pair
}

describe('⭐ r51 №3 – the Careers list dates each row in its own epoch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐ THE DEFECT ARM – the mother (a row with no epoch of its own) is dated in 2031, not in her daughter\'s 2066', async () => {
    const { right, wrong } = labels(MOTHER_WEEK, DEFAULT_START_YEAR, DAUGHTER_EPOCH)
    // The owner's two numbers, so the arm is legible as the complaint: «'50» is right, «'85» is what the list printed.
    expect(right).toContain("'50")
    expect(wrong).toContain("'85")
    const w = await openSaves([row()])
    const hint = hintOf(w, 'Vera')
    expect(hint, 'a row saved before the field falls back to 2031 – exact for every generation-1 career').toContain(right)
    expect(hint, 'and it does NOT take the active career\'s epoch').not.toContain(wrong)
    w.unmount()
  })

  it('a row that CARRIES its epoch dates in it – whether it is the default, the active one, or neither', async () => {
    const motherLabel = labels(MOTHER_WEEK, DEFAULT_START_YEAR, DAUGHTER_EPOCH)
    const daughterLabel = labels(130, DAUGHTER_EPOCH, DEFAULT_START_YEAR)
    // A generation-2 career that opened in 2048 (the spec's own example): neither the default nor the active epoch.
    const minaWeek = 300
    const mina = labels(minaWeek, 2048, DEFAULT_START_YEAR)
    expect(mina.right).not.toBe(weekLabel(minaWeek, DAUGHTER_EPOCH))

    const w = await openSaves([
      row({ startYear: DEFAULT_START_YEAR }),
      row({ careerId: 'c-mina', kidName: 'Mina', week: minaWeek, startYear: 2048 }),
      row({ careerId: DAUGHTER_ID, kidName: 'Ines', week: 130, startYear: DAUGHTER_EPOCH }),
    ])
    expect(hintOf(w, 'Vera')).toContain(motherLabel.right)
    expect(hintOf(w, 'Vera')).not.toContain(motherLabel.wrong)
    expect(hintOf(w, 'Mina')).toContain(mina.right)
    expect(hintOf(w, 'Mina')).not.toContain(weekLabel(minaWeek, DAUGHTER_EPOCH))
    expect(hintOf(w, 'Mina')).not.toContain(weekLabel(minaWeek, DEFAULT_START_YEAR))
    expect(hintOf(w, 'Ines')).toContain(daughterLabel.right)
    expect(hintOf(w, 'Ines')).not.toContain(daughterLabel.wrong)
    w.unmount()
  })

  it('⭐ THE ACTIVE ROW WITHOUT THE FIELD still dates in the active epoch – the one row the player is looking at must not go wrong in the window before its first autosave', async () => {
    // The update lands, the daughter is active, and her row (written by the old build) has no epoch yet. A bare 2031 fallback would regress exactly this row, which the old code printed right.
    const { right, wrong } = labels(130, DAUGHTER_EPOCH, DEFAULT_START_YEAR)
    const w = await openSaves([row({ careerId: DAUGHTER_ID, kidName: 'Ines', week: 130 })])
    expect(hintOf(w, 'Ines')).toContain(right)
    expect(hintOf(w, 'Ines')).not.toContain(wrong)
    w.unmount()
  })

  it('the AGE on a row is computed in the row\'s epoch too – it differs from the active one only in the week a birthday falls in', async () => {
    // `kidAgeYears` uses the epoch to align weeks to calendar dates (the absolute year cancels inside it), so the two epochs agree on nearly every week and split on a birthday week. Find one, from the
    // real function, rather than hand-picking a date the calendar might one day move.
    let pick: { week: number; month: number; day: number } | null = null
    search: for (let week = 0; week < 400; week++) {
      for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= 28; day++) {
          if (kidAgeYears(week, month, day, DEFAULT_START_YEAR) !== kidAgeYears(week, month, day, DAUGHTER_EPOCH)) {
            pick = { week, month, day }
            break search
          }
        }
      }
    }
    expect(pick, 'fixture: some (week, birthday) splits the two epochs, or the age arm is vacuous').not.toBeNull()
    const { week, month, day } = pick!
    const right = kidAgeYears(week, month, day, DEFAULT_START_YEAR)
    const wrong = kidAgeYears(week, month, day, DAUGHTER_EPOCH)
    const w = await openSaves([row({ week, birthMonth: month, birthDay: day })])
    const hint = hintOf(w, 'Vera')
    expect(hint, 'a bare row\'s age is the 2031-epoch age').toContain(`age ${right} `)
    expect(hint, 'not the one the active career\'s calendar would give').not.toContain(`age ${wrong} `)
    w.unmount()
  })

  it('the NAMED-SLOT table dates in the active epoch, and rightly: it lists the active career\'s slots only', async () => {
    // Pins the one site of the audit that was NOT broken, so a "symmetrical" change cannot break it silently. A slot record carries no epoch; the table's rows are the active career's by construction.
    const { right, wrong } = labels(200, DAUGHTER_EPOCH, DEFAULT_START_YEAR)
    const slot: SlotMeta = { slot: `manual:${DAUGHTER_ID}:Spring`, careerId: DAUGHTER_ID, savedAt: 1, week: 200, seed: 'r51-epoch', bytes: 2048 }
    const w = await openSaves([], { slots: [slot] })
    const cells = w.findAll('td.num').map((c) => c.text())
    expect(cells, 'the slot row\'s week cell is the label in the ACTIVE epoch').toContain(right)
    expect(cells, 'and not the 2031 default').not.toContain(wrong)
    w.unmount()
  })
})

describe('⭐ r51 №3 – the import confirm dates the FILE\'s week in the FILE\'s calendar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐ OVERWRITE branch – the mother\'s file and the mother\'s row are both dated in 2031 while her daughter is active', async () => {
    // existing row: week 1000, no epoch (written by the old build); the file: week 1037, epoch 2031. Before the fix both labels carried the daughter's 2066.
    const mine = labels(1000, DEFAULT_START_YEAR, DAUGHTER_EPOCH)
    const file = labels(MOTHER_WEEK, DEFAULT_START_YEAR, DAUGHTER_EPOCH)
    const peek: SavePeek = { careerId: 'c-mother', kidName: 'Vera', week: MOTHER_WEEK, startYear: DEFAULT_START_YEAR }
    const w = await openSaves([row({ week: 1000 })], { peek })
    await pickFile(w)
    const text = w.findComponent(ConfirmDialog).text()
    expect(text, 'the question is the overwrite one').toContain('Vera')
    expect(text, 'her row\'s week, in her own calendar').toContain(mine.right)
    expect(text, 'the file\'s week, in the file\'s calendar').toContain(file.right)
    expect(text).not.toContain(mine.wrong)
    expect(text).not.toContain(file.wrong)
    w.unmount()
  })

  it('⭐ ADD branch – a file that is not on this device is dated in its own epoch: the one it carries, or 2031 when the reply carries none', async () => {
    const gen1 = labels(MOTHER_WEEK, DEFAULT_START_YEAR, DAUGHTER_EPOCH)
    // With the epoch in the reply (the worker's reply since this wave) and without it (a reply that predates it): the same 2031, exact for a generation-1 file.
    for (const peek of [
      { careerId: 'c-mother', kidName: 'Vera', week: MOTHER_WEEK, startYear: DEFAULT_START_YEAR },
      { careerId: 'c-mother', kidName: 'Vera', week: MOTHER_WEEK },
    ] satisfies SavePeek[]) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const w = await openSaves([], { peek })
      await pickFile(w)
      const text = w.findComponent(ConfirmDialog).text()
      expect(text).toContain(gen1.right)
      expect(text).not.toContain(gen1.wrong)
      w.unmount()
    }
    // A generation-2 file carries its own year, and that is the one printed – neither the default nor the active career's.
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    const mina = labels(300, 2048, DEFAULT_START_YEAR)
    const w = await openSaves([], { peek: { careerId: 'c-mina', kidName: 'Mina', week: 300, startYear: 2048 } })
    await pickFile(w)
    const text = w.findComponent(ConfirmDialog).text()
    expect(text).toContain(mina.right)
    expect(text).not.toContain(weekLabel(300, DAUGHTER_EPOCH))
    w.unmount()
  })
})
