// THE CARPET'S POSES – wave L4-2. The fixtures the `i18n-l4-2-xx-carpet-*` files share, every one a REAL engine career (or the v46 golden
// save) built by the helpers the L2 nets already use (`careerSnapshot`, `createWorld`, `toSnapshot`, `migrateSave`) – no fixture is invented
// here where a net already posed the screen, and none is built twice: each is lazy and cached for the worker (the files run in parallel
// workers, so «cached» means once per FILE, which is the cost that matters).
//
// ⚠ NOTHING HERE WRITES COPY. A pose is a snapshot; the words on screen are the engine's, the composables' and the templates' own.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createWorld, decideKnock, enterEvent, pendingBirthday, pendingKnock, setCoachOnEventWeeks, tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { rngFromSeed } from '../../src/engine/rng'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { DEFAULT_PROFILE, type CareerMeta, type SlotMeta, type Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'
import { sevenWeeksAndADailyMasseur } from '../helpers/r41InjuryForecast'
import { SHELL, renderedComponents, type Mounted } from './xxCarpet'

const once = <T>(make: () => T): (() => T) => {
  let value: T | undefined
  return () => (value ??= make())
}

const WEEKS = 40

/** A middle-tier coach (the default career's): the training bill has a coaching line, the Coach Market lands on the coaches tab. */
export const coached = once(() => careerSnapshot(WEEKS, 'l42-coached', { ...DEFAULT_PROFILE, coachTier: 'middle' }))
/** The family coaches her: the profile says «You», the Coach Market lands on «Her week». */
export const selfCoached = once(() => careerSnapshot(WEEKS, 'l42-self', { ...DEFAULT_PROFILE, coachTier: 'self' }))

/** The same career with a rank on the active table – the rank chip is drawn only once something counts (`rankChipTrack`). */
export function withRank(snap: Snapshot, rank = 17, prevRank = 21): Snapshot {
  const track = snap.activeLadder
  return { ...snap, ladders: { ...snap.ladders, [track]: { ...snap.ladders[track], rank, prevRank } } }
}
export const ranked = once(() => withRank(coached()))

/** The v46 golden save, migrated and snapshotted – a REAL career with all three ranking tables, counting results and a season history (round 37's fixture). */
export const golden = once(() => toSnapshot(migrateSave(JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8'))) as WorldState))

/** A professional career with a full purse: the shelf is open and every rung reachable (`shop-tab.test.ts`'s recipe, as L2-6 poses it). */
export const shopSnap = once(() => {
  const world = createWorld('l42-shop')
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 20; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  world.bestFinishByTier.wta250 = 3
  const snap = toSnapshot(world)
  snap.fundsCents = 60_000_000_00
  return snap
})

/** A REAL career ticked to a REAL tournament, entering whatever the engine allows (round21's recipe, as L2-4 poses it). */
export const atFlow = once(() => {
  const world = createWorld('l42-flow', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  setCoachOnEventWeeks(world, true)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 80; i++) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* eligibility and caps are the engine's business */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) return toSnapshot(world)
  }
  throw new Error('no tournament reached – the fixture is broken, not the assertion')
})

/** A fresh career at week 0 (the planner's pose in L2-5). */
export const fresh = once(() => toSnapshot(createWorld('l42-plan', DEFAULT_PROFILE)))
/** An injured career with a daily masseur (the injury report's pose in L2-5). */
export const injured = once(() => toSnapshot(sevenWeeksAndADailyMasseur('l42-injury')))

/** A real career ticked to a real birthday (birthday-dialog.test.ts' own recipe). */
export const birthday = once(() => {
  const world = createWorld('l42-bday', { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60 && pendingBirthday(world) === null; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  if (pendingBirthday(world) === null) throw new Error('the fixture never reached a birthday')
  return toSnapshot(world)
})

/** More, on `tab` (0 Play, 1 Saves, 2 About), with a known device: two careers, three slots – the L2-11 recipe. The CALLER's file mocks
 *  `../../src/worker/client` (a `vi.mock` is file-scoped) so the screen's worker queries answer «no». `after` runs once the tab is open
 *  (the confirmations and the feedback card are raised from there). */
export async function mountMore(tab: 0 | 1 | 2, after?: (w: VueWrapper) => Promise<void>): Promise<Mounted> {
  const store = useGameStore()
  store.snapshot = careerSnapshot(4, 'l42-more')
  const activeId = store.snapshot.careerId ?? 'c-active'
  const now = Date.now()
  const active: CareerMeta = { careerId: activeId, kidName: 'Mira', country: 'US', seed: 'l42-more', createdAt: 1, lastPlayedAt: now - 3 * 86_400_000, week: 4 }
  const other: CareerMeta = { careerId: 'c-ines', kidName: 'Ines', country: 'ES', seed: 'ines-xgv7', createdAt: 1, lastPlayedAt: now - 86_400_000, week: 400 }
  const slots: SlotMeta[] = [
    { slot: `auto:${activeId}:a`, careerId: activeId, savedAt: now - 5 * 60_000, week: 4, seed: 'l42-more', bytes: 20_480, revision: 5 },
    { slot: `manual:${activeId}:backup-one`, careerId: activeId, savedAt: now - 2 * 86_400_000, week: 2, seed: 'l42-more', bytes: 1_536, revision: 3 },
    { slot: `manual:${activeId}:before-the-final`, careerId: activeId, savedAt: now - 86_400_000, week: 3, seed: 'l42-more', bytes: 2_048, revision: 4 },
  ]
  store.careers = [active, other]
  store.slots = slots
  store.persisted = true
  store.refreshCareers = async () => {}
  store.refreshSlots = async () => {}
  const w = mount(MoreScreen, SHELL) as VueWrapper
  await w.findAll('.more-tabs .tab-pill')[tab]!.trigger('click')
  await flushPromises()
  if (after) await after(w)
  // the slot names the rows print («backup-one») are the tail of the slot id: user data, not copy
  return { unmount: () => w.unmount(), rendered: () => renderedComponents(w), engine: [active, other, slots, ['backup-one', 'before-the-final']] }
}
