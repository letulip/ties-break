// ⭐⭐ T4.13 · E-04 – THE RENDERED HALF: WHAT A PLAYER ACTUALLY READS ON A SUB-CAPPED RUNG.
//
// `tests/principles-e04-tier-cap-refusal.test.ts` owns the engine and the composable. This file exists
// because T4.13 is the one task in W4 that CHANGES WHAT A PLAYER READS, and a claim about that is a
// claim about the DOM: `tierState.title` reaches the strip through `HomeScreen`'s `seasonChips`, which
// routes it to two different surfaces – the sighted `title` and the chip's `aria-label`, which REPLACES
// the content under accname. `parity-plaque-national.test.ts` §3 records the same split for the outgrown
// chip, and records that a repair reaching only the tooltip leaves the other one holding whatever it held.
//
// ⚠⚠ NOT ONE WORD HERE IS NEW. Every string asserted below is read off the snapshot the engine built –
// `snapshot.tierRefusal[tier].detail` – so this file cannot pass by matching copy somebody typed into it.
// That is invariant 4's shape for a task whose whole content is «print the sentence the engine owns».
//
// ⚠ THE FIXTURE IS THE SUB-CAP, the third allowance, whose chip did not exist at all before today: the
// rung read 'scheduled' and the strip said OPEN over a rung `enterEvent` refuses. It is POSED, and
// `tests/principles-e04-tier-cap-refusal.test.ts`' fixture note carries the measurement that forces
// that (mean 0.0 over 90 careers; the point grant is bracketed by the acceptance cut below and
// `playDownBars` above).
//
// ⚠⚠ MUTATION ARM: remove the engine-driven cap arm in `composables/tierState.ts` and this file reddens
// with the composable's own file, while HomeScreen's other strip suites stay green. Quoted in the report.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  createWorld,
  kidAgeAt,
  recomputeKidRank,
  seasonStartWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { TIER_SHORT } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { DESKTOP, setViewport } from './fits'

// HomeScreen reads localStorage at setup and this runner has none – the same shim, and the same
// argument, as tests/component/round28-top-notices.test.ts.
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

const SUB_AGE = Number(Object.keys(ECONOMY.entryCap.proSubCapByAge)[0])
const SUB_ROW = ECONOMY.entryCap.proSubCapByAge[SUB_AGE]

/** The sub-capped world of `tests/principles-e04-tier-cap-refusal.test.ts`, kept in step with it by
 *  reading the same two constants off `ECONOMY`. Its long note lives there. */
function subCappedWorld(seed = 'e04-chip'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  let at = -1
  for (let w = 0; w < 200 && at < 0; w++) if (kidAgeAt(world, w) === SUB_AGE) at = w
  expect(at, `a week at ${SUB_AGE} exists`).toBeGreaterThan(0)
  world.week = at + 3
  world.results.push({ playerId: KID_ID, week: world.week, points: 500, tier: 'slam' })
  recomputeKidRank(world)
  world.seasonEntries = {
    fromWeek: seasonStartWeek(world.week),
    rows: Array.from({ length: SUB_ROW.max }, (_, i) => ({
      id: `subcap-${i}-${SUB_ROW.fromTier}`,
      track: 'wta' as const,
      outgrown: false,
      bookShut: false,
    })),
  }
  return world
}

/** The strip's chip for one rung, at DESKTOP – where the row draws itself already open (the owner's
 *  ruling of 04.09; a phone would hide the very rung this file is about). `parity-plaque-national`'s
 *  own harness, narrowed to one rung. */
function chipFor(snapshot: Snapshot, short: string) {
  setViewport(DESKTOP)
  useGameStore().snapshot = snapshot
  const wrapper = mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
  let found: { text: string; title: string; name: string; classes: string[] } | null = null
  for (const chip of wrapper.findAll('.season-strip .tier-chip')) {
    if (chip.classes().includes('strip-more')) continue
    if (chip.text().split('·')[0].trim() !== short) continue
    found = {
      text: chip.text(),
      title: chip.attributes('title') ?? '',
      name: chip.attributes('aria-label') ?? '',
      classes: chip.classes(),
    }
  }
  wrapper.unmount()
  return found
}

describe('E-04 rendered: the sub-capped rung has a chip, and it is the engine speaking', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⭐⭐⭐ the strip draws the rung as waiting rather than open', () => {
    const snap = toSnapshot(subCappedWorld())
    // The fixture's premise, restated on the snapshot so a failure here is read as a fixture failure
    // rather than as a screen failure.
    expect(snap.tierRefusal[SUB_ROW.fromTier]?.reason, 'the engine refuses the rung on the allowance').toBe('capped')
    const chip = chipFor(snap, TIER_SHORT[SUB_ROW.fromTier])
    expect(chip, `${TIER_SHORT[SUB_ROW.fromTier]} is on the strip at desktop`).not.toBeNull()
    // 'capped' rides the SAME chip state as 'unscheduled' by an explicit ruling in `HomeScreen.vue` –
    // «both mean not this week, and not because anything is wrong» – so the class is `waiting`, and the
    // padlock would be the lie that note refuses.
    expect(chip!.classes, 'the waiting state, never the padlock').toContain('waiting')
  })

  it('⭐⭐ the TOOLTIP is the engine\'s sentence, byte for byte', () => {
    const snap = toSnapshot(subCappedWorld())
    const engine = snap.tierRefusal[SUB_ROW.fromTier]!.detail!
    const chip = chipFor(snap, TIER_SHORT[SUB_ROW.fromTier])
    // Quoted off the snapshot, never typed here: `title` is composed in `seasonChips`, and for a
    // `waiting` chip it is `avail.title` unmodified.
    expect(chip!.title).toBe(engine)
  })

  it('⭐⭐ ...and the ACCESSIBLE NAME carries the count, because the visible label is abbreviated', () => {
    // The strip abbreviates the cap chip to «Used N of M» – a phone measurement of 16.08 recorded in
    // `HomeScreen.vue` – and hands the whole short form to `spoken`, so a screen reader hears the rule's
    // name rather than a bare count. Both halves asserted, because the abbreviation is only honest while
    // the name carries what it dropped.
    const snap = toSnapshot(subCappedWorld())
    const chip = chipFor(snap, TIER_SHORT[SUB_ROW.fromTier])
    expect(chip!.text, 'the visible label is the abbreviation').toContain(`Used ${SUB_ROW.max} of ${SUB_ROW.max}`)
    expect(chip!.name, 'and the name says which rule it is').toContain(`Tour age rule – ${SUB_ROW.max} of ${SUB_ROW.max}`)
  })
})
