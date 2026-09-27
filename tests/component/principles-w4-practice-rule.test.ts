// ⭐⭐ T4.3 · F-07 – ONE RULE FOR "THIS WEEK'S PRACTICE FRIENDLY", ASSERTED ON THE RENDERED SCREENS.
//
// The finding (docs/review-principles-2026-09-26/06-duplication.md, F-07): the question was spelled
// THREE times in the UI. `WeekRecapCard.vue` narrowed to the id `resolvePractice` files under and
// called it «a trap closed rather than a bug fixed»; `App.vue` and `SeasonScreen.vue` kept the broad
// `e.friendly` predicate. `friendly` means "a watchable match that awards ZERO ranking points" – the
// flag the radar, the avatar's emotion, the knock history and the Weekly Story all read – and since
// the college wave a national-team RUBBER wears it too (`callUpRubberId`). So the two broad readers
// could hand the practice flow a match the player never booked and never paid for.
//
// ⚠⚠ ALL THREE READERS ARE IN, AND THE THIRD CAME IN SECOND (27.09). The first commit moved the two
// broad ones and left `WeekRecapCard.vue` on its own prefix spelling, on the reasoning that it was
// already narrow and outside the task's named surface – so F-07's «one rule» was two rules for a few
// hours, and this header said so. The third reader joined later the same day. What it gave up is a
// PREFIX test, which is the only difference left between the card's own rule and the engine's, and
// §2b is that difference on the screen.
//
// ⚠⚠ FORM A, NOT FORM B (docs/specs/engine-ui-parity-2026-09.md §1). The fix EXPORTS the engine's own
// primitive – `practiceMatchId(week)` and `isPracticeMatchEvent(e)` in `world/planner.ts` – and both
// screens call it, so there is no second implementation left to drift and this file can only WITNESS
// the sharing. The spec's order is explicit that a witness is never a substitute for the primitive:
// what is asserted below is that the rendered surfaces really do route through it, which is the one
// claim the engine's own unit cases cannot make.
//
// ⚠ THE FIXTURE IS THE ONE STATE THAT SEPARATES THE TWO PREDICATES, and it is posed rather than
// walked because it is unreachable today: a college week's epilogue covers the shell, so a rubber and
// a booked practice cannot land in one week on a live career. That is precisely F-07's argument –
// «"cannot fire today" is precisely how the unreachable copy this wave was sent to fix came about» –
// and the spec's §5.2 technique (a posed snapshot) is what it licenses. ⚠ THE RUBBER IS FIRST IN
// `events`, deliberately: both readers use `Array.prototype.find`, so a broad predicate returns the
// RUBBER and a narrowed one the PRACTICE. A fixture with the practice first would pass under either
// rule and prove nothing.
//
// ⚠⚠ MUTATION ARMS, ALL THREE RUN – see the wave's report for the quoted output of each:
//   arm A (the shared SOURCE): widen `isPracticeMatchEvent` back to `friendly` inside the engine and
//     BOTH rendered surfaces lose the practice to the rubber TOGETHER (4 of 5 cases red) – which is
//     what «they read one engine answer» looks like from outside.
//   arm B (the SHARING): restore `e.friendly &&` on ONE screen and only that screen's case reddens,
//     while the screen's own file – `season-screen.test.ts`, 11 tests – stays entirely green. That
//     asymmetry is this file's licence to exist.
//   arm B' (the THIRD reader, 27.09): restore the PREFIX form on `WeekRecapCard.vue` and only §2b's
//     stale-id case reddens, while the other two readers' cases and the card's own suites stay green.
//     ⚠ The rubber fixture cannot produce that red – a rubber's id fails a prefix test too, because
//     the recap has been narrow since the college wave – so the third reader's arm had to be the
//     stale id, which is the whole of what it gave up by joining the primitive.
//   ⚠ a third arm, and its result is worth writing down because it is NOT the spec's arm A: changing
//     `practiceMatchId`'s FORMAT reddens the format pin alone, and both rendered cases stay green –
//     the fixture builds its ids from the same exported function, so the screens follow the engine
//     wherever it goes. A format change is not a divergence, and this file says so rather than
//     claiming a red it does not produce.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import PracticeFlow from '../../src/components/PracticeFlow.vue'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import PrimaryPill from '../../src/components/ui/PrimaryPill.vue'
import { mountSeason } from '../helpers/mountSeason'
import { careerSnapshot } from '../helpers/career'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  advanceWeeks,
  bookPractice,
  callUpRubberId,
  createWorld,
  isPracticeMatchEvent,
  practiceMatchId,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain, rngFromSeed } from '../../src/engine/rng'
import { setDayCrossOff } from '../../src/composables/dayCross'
import type { Snapshot, WorldEvent, WorldMatch } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT AT SETUP – the same shim and the same
// argument as tests/component/round28-top-notices.test.ts, quoted there in full.
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

/** A match record of the right SHAPE under whatever id the case is about – the two readers only ever
 *  look at `eventId`, and the rest is what makes the row renderable (a winner, a scoreline) and
 *  replayable (the two builds `MatchReplay` re-simulates from). */
function record(eventId: string, winnerId: string): WorldMatch {
  const player = (id: string, name: string) => ({
    id,
    name,
    serve: 55,
    ret: 52,
    composure: 50,
    stamina: 54,
    groundstrokes: 51,
  })
  return {
    round: 0,
    aId: KID_ID,
    bId: 'opp',
    winnerId,
    seed: `${eventId}:seed`,
    score: '6-4 6-4',
    eventId,
    surface: 'hard',
    oppName: 'T. Seed',
    a: player(KID_ID, 'A. Rose'),
    b: player('opp', 'T. Seed'),
  }
}

/** The week's two friendlies, rubber FIRST. Both carry `friendly: true`, which is the whole point. */
function rubberThenPractice(week: number): WorldEvent[] {
  return [
    {
      id: 90_001,
      week,
      type: 'match',
      friendly: true,
      text: 'National team rubber: A. Rose beat T. Seed 6-4 6-4 – no ranking points',
      match: record(callUpRubberId(week, 0), KID_ID),
    },
    {
      id: 90_002,
      week,
      type: 'match',
      friendly: true,
      text: 'Practice match: A. Rose lost to T. Seed 4-6 4-6 – no ranking points',
      match: record(practiceMatchId(week), 'opp'),
    },
  ]
}

/** The broad predicate F-07 found on both screens, kept here as a FUNCTION rather than as prose: it
 *  is what the fixture's asymmetry is measured against, and a reader can see it pick the wrong row. */
const broadPredicate = (e: WorldEvent, week: number): boolean =>
  e.type === 'match' && e.friendly === true && e.week === week && !!e.match

describe('T4.3 · F-07 – the engine owns "this week\'s practice friendly"', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  // ===============================================================================================
  // 1. THE PRIMITIVE – the id in one place, and the one thing `friendly` was never about
  // ===============================================================================================

  it('the id format lives in the engine, and the resolved practice is filed under it', () => {
    expect(practiceMatchId(41)).toBe('practice-w41')
    // Walked, not asserted from the template: a booked practice really is filed under the id the
    // exported function returns, which is what makes the predicate below a fact about saved worlds.
    const world = createWorld('w4-f07-resolve')
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    world.condition = 90
    world.fundsCents = 500_000_00
    bookPractice(world, world.week + 1, false)
    tickWeek(world, rng)
    const played = world.events.find((e) => e.friendly && e.week === world.week)
    expect(played, 'the fixture must actually play the booked friendly').toBeDefined()
    expect(played!.match!.eventId).toBe(practiceMatchId(world.week))
    expect(isPracticeMatchEvent(played!)).toBe(true)
  })

  it('⚠ a college call-up RUBBER is `friendly` and is NOT a practice match', () => {
    const [rubber, practice] = rubberThenPractice(120)
    expect(rubber.friendly, 'the rubber really does wear the flag').toBe(true)
    expect(isPracticeMatchEvent(rubber)).toBe(false)
    expect(isPracticeMatchEvent(practice)).toBe(true)
    // ...and the broad predicate cannot tell them apart, which is the defect stated as arithmetic.
    expect(broadPredicate(rubber, 120)).toBe(true)
    expect(broadPredicate(practice, 120)).toBe(true)
  })

  it('...and the id is checked against the ROW it sits on, not against a caller\'s week', () => {
    // A stored `practice-w41` on a week-42 row is not this week's practice under any reading. The
    // week the CALLER is showing stays the caller's own filter, which is why this is a property of
    // the predicate rather than of either screen.
    const stale: WorldEvent = {
      id: 90_003,
      week: 42,
      type: 'match',
      friendly: true,
      text: 'Practice match: stale id',
      match: record(practiceMatchId(41), KID_ID),
    }
    expect(isPracticeMatchEvent(stale)).toBe(false)
  })

  // ===============================================================================================
  // 2. SEASONSCREEN – the PRACTICE card, rendered
  // ===============================================================================================

  /** A real career, with the week's two friendlies appended to its own feed. */
  function seasonSnapshot(seed: string): Snapshot {
    const world = createWorld(seed)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 6; i++) tickWeek(world, rng)
    world.events.push(...rubberThenPractice(world.week))
    return toSnapshot(world)
  }

  it('⭐ the practice card names the PRACTICE, with a rubber in the same week', () => {
    const snap = seasonSnapshot('w4-f07-season')
    // The fixture's own honesty check: both rows are on the wire, and the broad predicate really
    // would have picked the rubber off this snapshot.
    const friendlies = snap.events.filter((e) => e.week === snap.week && e.friendly)
    expect(friendlies.length, 'two friendlies in one week is the state that separates the rules').toBe(2)
    expect(friendlies.find((e) => broadPredicate(e, snap.week))!.match!.eventId).toBe(callUpRubberId(snap.week, 0))

    const wrapper = mountSeason(snap)
    const card = wrapper.findAll('section').find((s) => s.text().includes("This week's practice match"))
    expect(card, 'the practice card must be on screen at all').toBeDefined()
    expect(card!.text()).toContain('Practice match:')
    expect(card!.text(), 'the national-team rubber is not this week\'s practice').not.toContain('National team rubber')
    // The Watch button opens THIS match, so the id is asserted where the player's tap lands.
    expect(card!.find('button[aria-label="Watch practice match"]').exists()).toBe(true)
    wrapper.unmount()
  })

  // ===============================================================================================
  // 2b. THE WEEK STORY – the THIRD reader, which had the rule first and now asks for it
  // ===============================================================================================

  it('⭐ the recap card offers the PRACTICE to replay, with a rubber in the same week', async () => {
    // The happy path, for the anti-vacuity: the offer really is on the card and it really is about
    // this week's practice. ⚠ THIS HALF DOES NOT DISCRIMINATE and says so, because the rubber's id
    // fails a prefix test too – the recap has been narrow since the college wave. What separates the
    // two spellings on THIS reader is the case below.
    const snap = seasonSnapshot('w4-f07-recap')
    useGameStore().snapshot = snap
    const wrapper = mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
    expect(wrapper.find('.recap-watch').exists(), 'the week played a practice, so the replay offer must be there').toBe(true)
    expect(wrapper.findComponent(PracticeFlow).exists(), 'the card mounts no flow until the pill is pressed').toBe(false)
    wrapper.findComponent(PrimaryPill).vm.$emit('click')
    await nextTick()
    const opened = wrapper.findComponent(PracticeFlow)
    expect(opened.exists(), 'pressing the pill opens the replay').toBe(true)
    // Which match it hands the flow is the claim, so it is read off the RECORD rather than off the
    // button's words – the label is the owner's and not this file's business.
    expect((opened.props('match') as WorldMatch).eventId).toBe(practiceMatchId(snap.week))
    wrapper.unmount()
  })

  it('⭐⭐ ...and a practice id from ANOTHER week is not this week\'s practice – the recap\'s own gain', () => {
    // ⚠⚠ THIS IS THE ONE INPUT THAT SEPARATES THE TWO SPELLINGS ON THIS READER, and it is what the
    // card gave up a prefix test for. `WeekRecapCard.vue` had the narrowing FIRST – its note is what
    // `isPracticeMatchEvent` was made out of – so joining the primitive could only ever be about the
    // remaining difference: a stored `practice-w<n>` sitting on a week-<m> row passes `startsWith` and
    // is refused by `=== practiceMatchId(e.week)`. Posed, because the engine cannot file one: the id
    // and the row are written in the same breath by `resolvePractice`. A save edited by hand, a
    // migration that renumbered weeks, or a future recorder that files ahead can all produce it, and
    // the honest answer on a week she did not play a practice in is no offer at all.
    const base = careerSnapshot(6, 'w4-f07-recap-stale')
    const stale: WorldEvent = {
      id: 90_004,
      week: base.week,
      type: 'match',
      friendly: true,
      text: 'Practice match: a record filed under another week',
      match: record(practiceMatchId(base.week - 1), KID_ID),
    }
    const snap: Snapshot = { ...base, events: [...base.events, stale] }
    // The fixture's honesty check, stated as arithmetic: a prefix reader accepts this row.
    expect(stale.match!.eventId.startsWith('practice-w'), 'the posed id must still LOOK like a practice').toBe(true)
    expect(isPracticeMatchEvent(stale), 'and the engine must refuse it').toBe(false)

    useGameStore().snapshot = snap
    const wrapper = mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
    expect(
      wrapper.find('.recap-watch').exists(),
      'the card offers a replay of a practice that belongs to another week',
    ).toBe(false)
    wrapper.unmount()
  })

  // ===============================================================================================
  // 3. THE SHELL – what an advance through a practice week hands the live flow
  // ===============================================================================================

  /** The shell, past the splash, on a career whose NEXT week is a booked practice.
   *
   *  ⚠ THE STORE IS THE ONLY THING STUBBED, and it is stubbed onto the real engine, on
   *  `r2-13-span-report.test.ts`' own reasoning: the worker is not available here, so `advance` runs
   *  `advanceWeeks` in-process and republishes the snapshot – precisely what `sim.worker.ts` does.
   *  `setDayCrossOff(true)` is the documented state in which the press reaches `game.advance` instead
   *  of detouring to the calendar for the animation. */
  async function openPracticeWeek(seed: string) {
    const world: WorldState = createWorld(seed)
    const rng = resumeMain(world.rngMain)
    tickWeek(world, rng)
    world.condition = 90
    world.fundsCents = 500_000_00
    world.season = []
    bookPractice(world, world.week + 1, false)
    // The rubber is raised on the week the practice will resolve in, BEFORE the tick, so it lands
    // earlier in `events` than the practice the tick appends.
    world.events.push(rubberThenPractice(world.week + 1)[0])
    const game = useGameStore()
    vi.spyOn(game, 'init').mockResolvedValue(undefined)
    vi.spyOn(game, 'advance').mockImplementation(async (weeks) => {
      advanceWeeks(world, rng, weeks)
      game.snapshot = toSnapshot(world)
    })
    game.$patch({ ready: true, phase: 'ready' })
    game.snapshot = toSnapshot(world)
    setDayCrossOff(true)
    const w = mount(App, { global: { stubs: { teleport: true } } })
    w.findComponent(SplashScreen).vm.$emit('done')
    await flushPromises()
    return { w, game, world }
  }

  it('⭐ the week button hands the live flow the PRACTICE, not the rubber beside it', async () => {
    const { w, game, world } = await openPracticeWeek('w4-f07-shell')
    const from = world.week
    await w.find('.next-week-btn').trigger('click')
    await flushPromises()
    await nextTick()

    expect(world.week, 'the press really spent the week').toBe(from + 1)
    const raised = game.snapshot!.events.filter((e) => e.week === world.week && e.friendly)
    expect(raised.length, 'the posed rubber and the resolved practice are both in the week').toBe(2)
    expect(
      raised.find((e) => broadPredicate(e, world.week))!.match!.eventId,
      'the fixture is only worth running if the broad rule picks the wrong one',
    ).toBe(callUpRubberId(world.week, 0))

    // The flow is open on the practice: `PracticeFlow` is handed `practiceLive`, so the id under the
    // player's eyes is the assertion.
    const flow = w.findComponent(PracticeFlow)
    expect(flow.exists(), 'the practice flow opened').toBe(true)
    expect((flow.props('match') as WorldMatch).eventId).toBe(practiceMatchId(world.week))
    w.unmount()
    setDayCrossOff(false)
  })
})
