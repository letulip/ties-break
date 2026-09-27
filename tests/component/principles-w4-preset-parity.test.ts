// THREE PRESET ROWS, ONE RULE – E-02 (docs/review-principles-2026-09-26/05-ui.md), T4.12, the
// owner's ruling 7a of 26.09: «the layout is the preset's», which is HerWeekTab's own reading and
// not a paraphrase of all three.
//
// WHAT THE FINDING MEASURED, and this file is the rendered form of it: `HerWeekTab` lit a preset only
// when the laid-out week IS the preset's week, while `CoachMarketScreen` compared `plan.train` alone
// and `ThisWeekScreen` compared `train` and `rest` – the same test, because `rest = 100 - train`. And
// because `planShapeError` admits only 4..6 sessions and `planTrainPct` maps 4/5/6 onto exactly the
// three presets' `train`, EVERY legal hand-arranged week lit a pill on the latter two and none on the
// first. Both tabs live on ONE screen, so a parent who ticked her own week saw "Balanced" selected on
// the Coaches tab and nothing selected on the tab beside it.
//
// ⚠ WHY THIS IS A MOUNT AND NOT A SOURCE PIN (docs/specs/engine-ui-parity-2026-09.md §1). The fix is
// form A – all three readers call `presetOf` in `engine/plan.ts`, so there is no second implementation
// left to drift and a test can only WITNESS the sharing. What the mount adds over the unit walk in
// tests/principles-w4-plan-preset.test.ts is the half that lives in a TEMPLATE: which pill carries
// `selected` and `aria-pressed`, per host, off one posed snapshot. §2's third arm is owed exactly here.
//
// ⚠ AND THE PILLS ARE A TOGGLE GROUP, NOT A RADIO GROUP, which is why `aria-pressed` is the right
// attribute and `role="radio"` / `aria-checked` would be wrong. Two measured reasons, both of them
// behaviour rather than taste:
//   * NOTHING SELECTED IS A LEGAL STATE – it is the whole point of the ruling. A hand-arranged week
//     lights no pill on any of the three, and a `role="radiogroup"` with no checked radio is a broken
//     radio group. `aria-pressed="false"` on all three says exactly what the screen says.
//   * A PRESS ON THE LIT PILL STILL FIRES `setPlan`, which a radio in its checked state does not do.
// The app's own real radio groups (`PrologueCard`, `KnockDialog`, `BirthdayDialog`, `LifeBeatDialog`,
// `OnboardingWizard`) carry `role="radiogroup"` + `role="radio"` + `aria-checked` + `aria-labelledby`
// and the shared arrow-key handler `composables/radioGroupKeys.ts`; these rows carry none of it and
// must not, so the handler is deliberately NOT bound here. `ui/SegmentedRow.vue:104-112` is the
// contract this row is built on – real buttons carrying `aria-pressed`, and the
// chosen one a value rather than a position.
//
// ⚠ MUTATION-VERIFIED – three arms, and the ASYMMETRY between them is the record (§2):
//   A. the shared SOURCE: `presetOf` in `engine/plan.ts` returns null -> BOTH surfaces of every pair
//      go red here AND the unit walk goes red, together.
//   B. the SHARING: `ThisWeekScreen`'s own `train`+`rest` predicate put back in place of `presetOf`
//      -> THIS file goes red ALONE, while the unit walk and ThisWeekScreen's own two files
//      (round30-next-tournament-layout, round33-tournament-arrival) stay entirely green.
//   C. the TEMPLATE: a second `selected` term added inside `ui/PlanPresetRow.vue`'s template -> this
//      file goes red and no unit net moves, which is the one-line argument for a rendered assertion.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HerWeekTab from '../../src/components/HerWeekTab.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { planSessions, planTrainPct } from '../../src/engine/plan'
import { DEFAULT_PROFILE, type SessionKind, type Snapshot, type WeekPlan } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

/** A real career through the real engine, so the snapshot is never a hand-written shape. */
const career = (): Snapshot => careerSnapshot(12, 'w4-preset-parity', { ...DEFAULT_PROFILE })

/** The plan a matrix projects to, spelled the way `planFromWeek` does – `train`/`rest` derived, never
 *  typed, so the posed snapshot carries exactly the pair a real `setPlan` would have written. */
function planOf(week: SessionKind[][]): WeekPlan {
  const train = planTrainPct(planSessions(week))
  return { train, rest: 100 - train, week }
}

/** BALANCED'S OWN WEEK – five general sessions in `sessionDays` order, which is byte-for-byte what
 *  the v46 -> v47 migration writes for `train: 75` and what `planWeek` reads a weekless plan back as. */
const BALANCED_WEEK: SessionKind[][] = [
  ['general'], ['general'], [], ['general'], ['general'], ['general'], [],
]

/** FIVE SESSIONS ARRANGED BY HAND. Same volume, same projection (75/25), a different week – so it is
 *  a week no pill would produce, and the case the whole finding turns on. */
const HAND_BUILT: SessionKind[][] = [
  ['serve'], [], ['rally'], ['general'], [], ['matchplay'], ['general'],
]

type PresetKey = 'light' | 'balanced' | 'grind'

/** ⚠ EACH HOST'S OWN DISPLAY ORDER, READ OFF ITS OWN SOURCE – and `ThisWeekScreen` legitimately
 *  differs (grind first). The order is a screen's business and the ruling does not touch it; what must
 *  agree is WHICH preset is hers, so a selected pill is mapped back through the row's own order rather
 *  than compared by position. */
const ORDER: Record<'herWeek' | 'coachMarket' | 'thisWeek', readonly PresetKey[]> = {
  herWeek: ['light', 'balanced', 'grind'],
  coachMarket: ['light', 'balanced', 'grind'],
  thisWeek: ['grind', 'balanced', 'light'],
}

/** THE LABELS, QUOTED FROM EACH HOST'S SOURCE – `HerWeekTab.vue`'s `PRESET_LABEL`,
 *  `CoachMarketScreen.vue`'s `planLabel` (`coachHoursForPlan` at 60/75/85 is 4/5/6) and
 *  `ThisWeekScreen.vue`'s `PRESET_LABEL`, each in its own host's order. Invariant 4: the labels become
 *  props and not one word moves, and this is the assertion that says so. */
const LABELS: Record<keyof typeof ORDER, readonly string[]> = {
  herWeek: ['Light', 'Balanced', 'Grind'],
  coachMarket: ['Light 4/wk', 'Balanced 5/wk', 'Grind 6/wk'],
  thisWeek: ['Grind 85/15', 'Balanced 75/25', 'Light 60/40'],
}

type Row = { labels: string[]; active: PresetKey | null; pressed: (string | undefined)[] }

/** What one row says: the words on it, which preset it calls hers, and what it tells a screen reader. */
function readRow(pills: { text: () => string; classes: () => string[]; attributes: (n: string) => string | undefined }[], host: keyof typeof ORDER): Row {
  const at = pills.findIndex((p) => p.classes().includes('selected'))
  return {
    labels: pills.map((p) => p.text()),
    active: at < 0 ? null : ORDER[host][at],
    pressed: pills.map((p) => p.attributes('aria-pressed')),
  }
}

function herWeekRow(snapshot: Snapshot): Row {
  const store = useGameStore()
  store.snapshot = snapshot
  store.setPlan = vi.fn(async () => {}) as unknown as typeof store.setPlan
  const wrapper = mount(HerWeekTab, { global: { stubs: { teleport: true } } })
  const row = readRow(wrapper.findAll('.hw-presets .option-pill'), 'herWeek')
  wrapper.unmount()
  return row
}

async function coachMarketRow(snapshot: Snapshot): Promise<Row> {
  const store = useGameStore()
  store.snapshot = snapshot
  store.setPlan = vi.fn(async () => {}) as unknown as typeof store.setPlan
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  // The regulator lives on the Coaches half (the `v-else` of `tab === 'week'`), so the row is reached
  // the way a player reaches it – by pressing the screen's own segmented pill.
  const tabs = wrapper.findAll('.tb-seg .tab-pill')
  await tabs[1].trigger('click')
  const row = readRow(wrapper.findAll('.cm-plan .option-pill'), 'coachMarket')
  wrapper.unmount()
  return row
}

function thisWeekRow(snapshot: Snapshot): Row {
  const store = useGameStore()
  store.snapshot = snapshot
  store.setPlan = vi.fn(async () => {}) as unknown as typeof store.setPlan
  const wrapper = mount(ThisWeekScreen, { global: { stubs: { teleport: true } } })
  const section = wrapper.findAll('section').find((s) => s.text().includes('Training plan'))!
  const row = readRow(section.findAll('.option-pill'), 'thisWeek')
  wrapper.unmount()
  return row
}

async function allThree(week: SessionKind[][]): Promise<Record<keyof typeof ORDER, Row>> {
  const snapshot = { ...career(), plan: planOf(week) }
  return {
    herWeek: herWeekRow(snapshot),
    coachMarket: await coachMarketRow(snapshot),
    thisWeek: thisWeekRow(snapshot),
  }
}

describe('E-02 – the three preset rows answer "which preset is hers" the same way', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it("⚠ THE CASE THE FINDING TURNS ON – a hand-arranged week is NO preset's, on all three", async () => {
    // Five sessions, the same 75/25 projection as Balanced, a week no pill would produce. Under the
    // shipped code HerWeekTab said null while the other two said `balanced`: two spellings of one
    // fact, on one screen, by construction.
    expect(planSessions(HAND_BUILT), 'the volume is Balanced\'s own').toBe(5)
    expect(planOf(HAND_BUILT).train, '...and so is the projection').toBe(75)
    const rows = await allThree(HAND_BUILT)
    expect({ herWeek: rows.herWeek.active, coachMarket: rows.coachMarket.active, thisWeek: rows.thisWeek.active }).toEqual({
      herWeek: null,
      coachMarket: null,
      thisWeek: null,
    })
  })

  it("...and a preset's OWN week is that preset, on all three", async () => {
    const rows = await allThree(BALANCED_WEEK)
    expect({ herWeek: rows.herWeek.active, coachMarket: rows.coachMarket.active, thisWeek: rows.thisWeek.active }).toEqual({
      herWeek: 'balanced',
      coachMarket: 'balanced',
      thisWeek: 'balanced',
    })
  })

  it('a weekless plan is still its preset – the migration and an old literal read the same', async () => {
    // `WeekPlan.week` is optional and a pre-v47 save carries none; `planWeek` reads one back as the
    // week the Calendar has been drawing for that scalar. Grind, with no matrix at all.
    const snapshot = { ...career(), plan: { train: 85, rest: 15 } as WeekPlan }
    expect(herWeekRow(snapshot).active).toBe('grind')
    expect((await coachMarketRow(snapshot)).active).toBe('grind')
    expect(thisWeekRow(snapshot).active).toBe('grind')
  })

  it('⚠ INVARIANT 4 – every label is byte-identical, per host, and no host borrowed another\'s', async () => {
    // The labels are PROPS, which is the mechanism that keeps this true: each host passes the words it
    // already rendered. Three label sets, three orders, and this is the assertion that the extraction
    // did not quietly converge them.
    const rows = await allThree(BALANCED_WEEK)
    expect(rows.herWeek.labels).toEqual([...LABELS.herWeek])
    expect(rows.coachMarket.labels).toEqual([...LABELS.coachMarket])
    expect(rows.thisWeek.labels).toEqual([...LABELS.thisWeek])
  })

  it('every pill tells a screen reader whether it is the pressed one', async () => {
    // A toggle group, not a radio group – see the file header for why, and for why the arrow-key
    // handler is not bound. The lit pill is `true`; the other two are `false`, not absent.
    const lit = await allThree(BALANCED_WEEK)
    for (const host of ['herWeek', 'coachMarket', 'thisWeek'] as const) {
      expect(lit[host].pressed, `${host}: one pressed, two not`).toEqual(
        ORDER[host].map((k) => String(k === 'balanced')),
      )
    }
    // ...and nothing pressed is a state the attribute can say, which a radio group could not.
    const none = await allThree(HAND_BUILT)
    for (const host of ['herWeek', 'coachMarket', 'thisWeek'] as const) {
      expect(none[host].pressed, `${host}: nothing is hers`).toEqual(['false', 'false', 'false'])
    }
  })

  it("the row is the shipped shape – one `.option-row`, three `.option-pill`s, and the host's own class", async () => {
    // ⚠ NOTHING GREW. The extraction adds no element and no wrapper, so no host's sheet is longer than
    // it was and the popup law's fit measurement has nothing new to measure. The row's own scoped
    // margin is asserted below, through the real cascade.
    const snapshot = { ...career(), plan: planOf(BALANCED_WEEK) }
    const store = useGameStore()
    store.snapshot = snapshot
    store.setPlan = vi.fn(async () => {}) as unknown as typeof store.setPlan
    const wrapper = mount(HerWeekTab, { attachTo: document.body })
    const row = wrapper.find('.hw-presets')
    expect(row.classes(), 'the shared row class rides with the component').toContain('option-row')
    expect(row.findAll('.option-pill').length).toBe(3)
    // ⚠ AND NO WORD WAS INVENTED. `SegmentedRow`'s other half is `groupLabel`, and a name for what
    // each of these three rows IS would be three new sentences – which is the owner's, not a
    // builder's (invariant 4). The row ships with `aria-pressed` and without a name of its own, and
    // this is the assertion that says the extraction did not smuggle one in.
    expect(row.attributes('aria-label')).toBeUndefined()
    expect(row.attributes('aria-labelledby')).toBeUndefined()
    // ⚠ THE SCOPED RULE STILL REACHES IT. `.hw-presets { margin-bottom: 10px }` lives in
    // HerWeekTab's own `<style scoped>`, and a child component's root carries the parent's scope id –
    // which is the one thing an extraction like this can silently lose.
    expect(getComputedStyle(row.element).marginBottom).toBe('10px')
    wrapper.unmount()
  })
})
