// =================================================================================================
// WAVE 5, T3 – THE YEAR-FOCUS: WHAT THE SEAT IS WORKING ON, AND WHO GETS TO SAY SO
// =================================================================================================
//
// `docs/plans/life-wave-5-builder-2026-09.md` §2 T3, the ruled shape from
// `docs/specs/the-psychologists-year-2026-09.md` §2/§6 (O1 «at the season boundary only», O2 «every
// focus at every rung») and the consent rulings of 09.09 (the joint choice from 18, the not-ready
// card), with `docs/plans/life-wave-5-rulings-2026-09.md` ruling G binding the wire.
//
// ⚠⚠ WHAT T3 IS, SAID ONCE. It ships a DECISION and nothing that decision does: the command, its
// refusals, the three facts the card needs and the row that shows them. The recovery slope is T4,
// the composure walk T5, the listen draw T6, the walls T7. So every case below is about WHO may
// choose WHAT and WHEN – and about the two things the wave says a pick must never be: a life beat
// (no `lifeLog` row) and a parenting act (no bond delta, no money).
//
// ⚠ THE SENTENCES ARE DRAFTS (CLAUDE.md invariant 4) and every pin below asserts IDENTITY between
// two readers – the string the command throws and the string the constant holds, the string the
// snapshot carries and the string the command throws – never the prose itself. The архитектор's
// вычитка moves the draft and the test moves with it.
//
// ⚠⚠ T3b (ruling I) RE-CUT THE SEASON RULE AND NOTHING ELSE. Two edits, both in §C's ground: the
// WINDOW is `isOffSeasonWeek(week)` rather than `isBlackoutWeek(week, schoolIsOver(...))`, and the
// STAMP is `psychologistFocusSeasonFor(week)` – the season the choice is FOR – read by the setter
// and the guard alike. No string moved, no field joined the schema, no snapshot member changed. §C
// is the section that carries the whole of it, row by row against the ruling's own table.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ⚠ EIGHT MUTATIONS, RUN 13.09.2026, CONTROL GREEN FIRST (47 unit – 23 here and 24 in
//   tests/wave5-psychologist-seat.test.ts; 26 component across the psychologist, masseur and
//   household files) AND RE-EDITED BACK BY HAND – never `git checkout` – with each touched file's
//   md5 asserted back to pristine BEFORE the next arm was applied
//   (psychologist.ts d40dddc6…, SupportStaffTab.vue 2e87ad53…). The counts below are MEASURED, and
//   where a prediction was wrong the measurement is what is written:
//
//     ARM 1  4 RED      ARM 2  3 RED      ARM 3  1 RED      ARM 4  16 RED
//     ARM 5  2 RED      ARM 6  2 RED      ARM 7  6 RED      ARM 8   2 RED (component)
//
//   ARM 1  the season stamp deleted (`world.psychologistFocusSeason` never written). **4 RED** –
//          §A's free-pick case, and the three §C cases that lean on the stamp to tell one season
//          from the next.
//
//   ARM 2  ⚠⚠ THE HOLE THE ARCHITECT NAMED, AND THE ONE A PLAYER WOULD FIND: `hirePsychologist`
//          nulls `psychologistFocus` on the way out, so a re-hire reads as «never picked» and the
//          first pick is free again. Fire, re-hire, choose a different year, mid-season, for free.
//          **3 RED** – §C's laundering case, §A's dead-letter read, and T2's own dead-letter case
//          next door. ⚠ It is the same edit T2's ARM 4 made, and it is pinned twice on purpose:
//          over there it breaks a FIELD's documented contract, here it breaks the RULE that
//          contract exists for.
//
//   ARM 3  the two consent gates swapped, so `'herself'`'s readiness test runs before the joint
//          decline. **1 RED, WHERE TWO WERE PREDICTED, AND THE MISS IS WORTH READING**: §D's
//          precedence case went red on the sentence («expected 'This is her call…', got 'She is not
//          ready…'») and NOTHING ELSE COULD. Under this mutation the OPEN SET is identical – at 18+
//          with a strained bond all four are still closed, only the wording changes – so every
//          set-shaped assertion in §D and §E stays green by construction. The precedence is
//          therefore held by exactly one case, which is why that case asserts the sentence three
//          ways (the throw, the refusal read, and the negative that it is not the other one).
//
//   ARM 4  ⚠⚠ CONSENT DRAWN INSTEAD OF READ – `bondWithholdsConsent` returns
//          `rngFromSeed(`${world.seed}:psy:consent:${world.week}`)() < 0.5`, which is the most
//          plausible wrong thing to write for «she declines» and is exactly what §0.4 forbids
//          («her yes is never dice»). **16 RED, where six were predicted** – the whole of §B (the
//          keys, including the positive control, whose `[seed:physio:300]` gains a consent key in
//          front of it), both determinism cases, the band edge, the two consent cases, §E's
//          exhaustive agreement and the detail identity, and five cases that merely wanted a world
//          to consent and got a coin. ⭐ The same defect measured twice over – in KEYS and in
//          ANSWERS – which is the shape wave-4 §0.1 asks for, and the reason the count is so large
//          is that a coin toss makes half of every fixture in the file unreliable.
//
//   ARM 5  the window check deleted (`isBlackoutWeek` never asked). **2 RED** – §C's
//          outside-the-window case and §E's detail identity, which reads a mid-season state.
//
//   ARM 6  the once-a-season check deleted (`psychologistFocusSeason` never compared). **2 RED** –
//          §C's same-season case and §C's laundering case, which is the pair that makes the two
//          halves of the rule independent: neither arm takes both down.
//
//   ARM 7  `psychologistFocusOpen` returns all four regardless of the refusals – the wire promising
//          a permission the engine does not hold, which is the R10-16 doctrine's own failure.
//          **6 RED** – §D's precedence and not-ready cases, §E's three wire cases and T2's own
//          card-facts case next door.
//
//   ARM 8  the card's `:disabled` binding drops `!f.open` – the same defect one layer up, where a
//          player can actually press it. **2 RED**, both in tests/component/psychologist-card.test.ts
//          (§10's disabled sweep and §11's consent cases). ⚠ THE COMPONENT REDS ARE THE ONES THAT
//          MATTER: they are the only arms measured on the surface a parent reads.
//
// =================================================================================================
// ⚠⚠ T3b's ARM LEDGER – ruling I's two edits, and the drift the shared expression forbids
// =================================================================================================
//
//   ⚠ SEVEN MUTATIONS, RUN 13.09.2026, CONTROL GREEN FIRST (96 tests across five files: this one,
//   wave5-psychologist-seat, wave5-psychologist-schema, round24-college-refusals and the mounted
//   tests/component/psychologist-card) AND RE-EDITED BACK BY SCRIPT – never `git checkout` – with
//   psychologist.ts's md5 asserted back to pristine (24a72f26…) after EVERY arm. ⚠ All seven arms'
//   reds land inside THIS file, which is why the counts are comparable with T3's despite the wider
//   scope. Three of the seven are T3's own arms re-run, to say whether its nets moved:
//
//     ARM 9  1 RED      ARM 10  5 RED      ARM 11  5 RED      ARM 12  4 RED
//     ARM 1  5 RED (was 4)   ARM 5  3 RED (was 2)   ARM 6  3 RED (was 2)
//
//   ARM 9  ⚠⚠ EDIT 1 PUT BACK: the window returns to `isBlackoutWeek(week, schoolIsOver(...))`.
//          **1 RED – §C's exam-fortnight case, and NOTHING ELSE COULD GO RED**, which is the entry
//          worth reading rather than a thin result. The two predicates differ on exactly one kind of
//          week – an exam fortnight while school is not over – so every other case in the file is
//          green by construction under both, the same structural miss T3's ARM 3 records one
//          paragraph up. The message is the defect in one line: «week 179: expected [Function] to
//          throw an error». That is a still-at-school professional changing her year in JUNE.
//
//   ARM 10 ⚠⚠ EDIT 2 PUT BACK: `psychologistFocusSeasonFor` returns `seasonIndexOf(week)`, which is
//          the stamp T3 shipped – both readers move together, so this is the honest revert rather
//          than a drift. **5 RED** – four §C cases (the mid-season pick's first reopening slides
//          from +7 weeks to +59: «expected 309 to be 257»; the off-season free pick's stamp reads
//          the ending year; the second change in one window; the laundering re-aim) and §C's exam
//          case, where the door she DOES get slides a year off too: «expected 205 to be 153». ⭐ The
//          exam case therefore answers under both edits, which is why it carries the acceptance
//          alongside the refusals rather than the refusals alone.
//
//   ARM 11 ⚠⚠ THE DRIFT, AND IT IS WHY THE EXPRESSION IS A FUNCTION. The GUARD is re-typed as
//          `seasonIndexOf(world.week)` while the stamp keeps `psychologistFocusSeasonFor` – two
//          readers of one rule, written twice, disagreeing by one. **5 RED.** ⭐ Note it takes down
//          the same four §C cases as ARM 10 PLUS the exam case: a rule written twice is not a
//          weaker version of the rule, it is a different rule.
//
//   ARM 12 the drift the other way round – the STAMP re-typed as `seasonIndexOf(world.week)` while
//          the guard keeps the shared expression. **4 RED.**
//
//   ARM 1  (T3's, re-run) the season stamp deleted. **5 RED, was 4** – §A's free-pick case and the
//          four §C cases that lean on the stamp. The net grew with §C, it did not move.
//
//   ARM 5  (T3's, re-run) the window check deleted – now `isOffSeasonWeek`. **3 RED, was 2** – §C's
//          outside-the-window sweep, §E's detail identity (T3's two) and now §C's exam case.
//
//   ARM 6  (T3's, re-run) the once-a-season check deleted. **3 RED, was 2** – the second-change
//          case, the off-season free pick and the laundering case. ⚠ ARMS 5 and 6 STILL TAKE ONE
//          HALF DOWN EACH AND NEVER BOTH, which is T3's own claim re-measured on the new rule: the
//          window and the once-a-season fact remain independent.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, wave 4's and T2's §B apparatus, verbatim and for
// its reason. Every call is delegated to the real `rngFromSeed`, so any number this file measures is
// the engine's own; the mock exists only so §B can COUNT the keys the command reached. Hoisted,
// because `vi.mock`'s factory is lifted above the imports.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import {
  PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
  PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
  PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
  PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL,
  PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL,
  PSY_FOCUSES,
  PSY_FOCUS_LABEL,
  PSY_FOCUS_LINE,
  createWorld,
  hirePsychologist,
  kidAgeExact,
  psychologistFocusDetailOf,
  psychologistFocusOpen,
  psychologistFocusRefusal,
  psychologistFocusSeasonFor,
  psychologistUnlocked,
  resolvePhysio,
  setPsychologistFocus,
  setPsychologistRung,
  toSnapshot,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { seasonIndexOf, seasonStartWeek } from '../src/engine/world/ledger'
import {
  OFF_SEASON_WEEKS,
  WEEKS_PER_YEAR,
  isBlackoutWeek,
  isExamWeek,
  isOffSeasonWeek,
} from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { PsyFocus, WorldState } from '../src/engine/world'

/** A professional career with the seat filled – the state every case here starts from, because a
 *  year of work is refused outright without one. The pro door is her first counting W-series result
 *  on the never-pruned mark (`psychologistUnlocked`), the same fixture T2's file opens its pro arm
 *  with. */
function hired(seed: string, week = 250): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  world.week = week
  hirePsychologist(world, true)
  return world
}

/** Her age at this world's week – used to SAY what a fixture is rather than to assume it, because
 *  the joint-choice gate is an age gate and a fixture that drifted under it would prove nothing. */
function ageAt(world: WorldState): number {
  return kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
}

/** Is this week inside the off-season window the change rule is written against? Asked through the
 *  engine's own predicate, never re-derived.
 *
 *  ⚠⚠ T3b MOVED THIS OFF `isBlackoutWeek(week, schoolIsOver(...))` (ruling I, problem 1). The wider
 *  predicate is the off-season OR an exam fortnight while school is not over, and §C's exam case is
 *  the one that says why that mattered. */
function inWindow(world: WorldState): boolean {
  return isOffSeasonWeek(world.week)
}

/** THE FIRST WEEK FROM `from` ONWARD AT WHICH THE ENGINE WOULD ACCEPT A CHANGE, or `-1`. The world's
 *  own week is restored, so a scan is a pure question.
 *
 *  ⚠ IT IS THE MEASUREMENT RULING I TURNS ON, and it is deliberately a SCAN rather than a probe at a
 *  week somebody chose: «up to two years locked» is a claim about the first reopening, and only a
 *  walk over the weeks can say where that is. `'listen'` is the probe focus because no case here
 *  runs it as the live year and it is never the readiness gate's own option. */
function firstReopening(world: WorldState, from: number, to: number): number {
  const saved = world.week
  try {
    for (let week = from; week <= to; week++) {
      world.week = week
      if (psychologistFocusRefusal(world, 'listen') === null) return week
    }
    return -1
  } finally {
    world.week = saved
  }
}

// The bond numbers the bands are cut at (ECONOMY.bond.band: close ≥ 80 · steady 55..79 ·
// strained 35..54 · cold < 35). Read from the constants rather than typed, so a re-band moves the
// fixtures with it – and each is named for the band it lands in, because the BAND is the whole claim.
const CLOSE = ECONOMY.bond.band.close
const STEADY = ECONOMY.bond.band.steady
const STRAINED = ECONOMY.bond.band.strained
const COLD = ECONOMY.bond.band.strained - 1

// =================================================================================================
// A. THE PICK – the free first one, the id, and everything a pick deliberately is not
// =================================================================================================
describe('wave 5 T3 A – the pick, and what a pick is not', () => {
  it('⭐⭐ THE FIRST PICK IS FREE, and it stamps the season the choice is FOR', () => {
    const world = hired('psy-focus-first')
    expect(world.psychologistFocus, 'nobody has been asked yet').toBeNull()
    expect(inWindow(world), 'and the fixture is deliberately NOT in the off-season window').toBe(false)
    setPsychologistFocus(world, 'coolhead')
    expect(world.psychologistFocus, 'the year starts when the work starts').toBe('coolhead')
    // ⚠ T3b: the stamp is `psychologistFocusSeasonFor(week)` and not `seasonIndexOf(week)` – asked
    // through the engine's own function, which is the point of the function existing (ruling I).
    // Mid-season the two AGREE, and saying so here is what makes §C's off-season cases readable as
    // a difference rather than as a second rule.
    expect(world.psychologistFocusSeason, '...and the year it buys is recorded').toBe(
      psychologistFocusSeasonFor(world.week),
    )
    expect(psychologistFocusSeasonFor(world.week), 'mid-season, the year bought IS the year standing in').toBe(
      seasonIndexOf(world.week),
    )
  })

  it('⭐ the roster is the roster – an id the game does not sell is refused, and writes nothing', () => {
    const world = hired('psy-focus-id')
    // ⚠⚠ RE-AIMED 14.09 BY WAVE 6's T5, AND **STRENGTHENED RATHER THAN MOVED** – the architect's
    // RULING O. The old line was wave 5's own tripwire, and its message named this wave: «four at
    // step 5; the fifth is the spotlight wave`s (O7)». O7 landed, so the number is five – but a
    // COUNT was never the claim worth making here, and ruling O says why in one sentence: **a length
    // is not a membership.** `PSY_FOCUSES` is a `readonly PsyFocus[]`, so widening the union does NOT
    // make this line red (an array of four is a valid array of a five-member union), and an array of
    // five holding a DUPLICATE would satisfy `toBe(5)` while a real focus went unoffered. That is the
    // one roster site the compiler will not defend, and it is the site that decides whether a focus is
    // ever on the card at all.
    //
    // ⚠⚠ SO THE ORACLE IS THE TYPE-FORCED `Record` NEXT DOOR. `PSY_FOCUS_LABEL` is
    // `Record<PsyFocus, string>` – total by type, red at compile time the day the union widens – so
    // its key set IS the complete list of the union, held by the compiler and not by a human. Sorted
    // equality against it is total by construction, costs one line, and goes red the day a SIXTH
    // focus is added to the type and forgotten in the roster. ⚠ THE LENGTH ASSERTION STAYS BESIDE IT
    // and is not deleted: it still names the number a reader is checking against the spec §2's table.
    expect([...PSY_FOCUSES].sort(), '⚠ ruling O: the roster IS the union, and the compiler holds the union')
      .toEqual(Object.keys(PSY_FOCUS_LABEL).sort())
    expect(PSY_FOCUSES.length, 'five since v77 T5 – the spec §2`s four plus «The public life» (O7)').toBe(5)
    for (const bad of ['spotlight', 'coolHead', '', 'recovery ']) {
      expect(
        () => setPsychologistFocus(world, bad as PsyFocus),
        `${bad} is not one of the four`,
      ).toThrow(PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL)
    }
    expect(world.psychologistFocus, 'and not one refusal moved the field').toBeNull()
    // Every one of the four IS buyable, at every rung – O2 ruled («the rung scales quality, never
    // unlocks menu items»), so the roster and the year menu are independent by construction.
    for (const rung of [0, 1, 2]) {
      for (const focus of PSY_FOCUSES) {
        const fresh = hired(`psy-focus-grid-${rung}-${focus}`)
        setPsychologistRung(fresh, rung)
        expect(psychologistFocusRefusal(fresh, focus), `rung ${rung} / ${focus}`).toBeNull()
      }
    }
  })

  it('⭐ a year of work with nobody on the payroll is refused – and firing does not clear the year', () => {
    const world = createWorld('psy-focus-unhired', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    world.week = 250
    expect(() => setPsychologistFocus(world, 'listen')).toThrow(PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL)
    expect(world.psychologistFocus).toBeNull()

    hirePsychologist(world, true)
    setPsychologistFocus(world, 'listen')
    hirePsychologist(world, false)
    // The dead letter (T2's own rule, and the reason the laundering case in §C can exist at all).
    expect(world.psychologistFocus, 'the year survives the release').toBe('listen')
    expect(() => setPsychologistFocus(world, 'coolhead'), 'and nobody is working it').toThrow(
      PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL,
    )
  })

  it('⭐⭐ A PICK IS A STAFFING DECISION, NOT A LIFE BEAT – no row, no bond, no spirit, no money', () => {
    // The wave brief's own «deliberately absent» list, as four measurements: a `lifeLog` row would
    // make a staffing decision something that happened to HER; a bond delta would price the pick as
    // a parenting act (and the price list is universal – who-she-is §3's fence); a spirit write
    // outside `accrueSpirit` is the gravest finding this wave can produce (§0.1); and the retainer
    // is the only money this seat ever costs. ⚠ The ledger is checked EMPTY rather than «no expense
    // row»: the hire and the rung change write info lines because the BILL moves, and nothing about
    // the bill moves here.
    const world = hired('psy-focus-silent')
    const before = {
      lifeLog: world.lifeLog.length,
      events: world.events.length,
      bond: world.bond,
      spirit: world.spirit,
      funds: world.fundsCents,
    }
    setPsychologistFocus(world, 'herself')
    expect(world.lifeLog.length, 'no life-beat row').toBe(before.lifeLog)
    expect(world.events.length, 'no feed row of any kind').toBe(before.events)
    expect(world.bond, 'the pick is not a parenting act').toBe(before.bond)
    expect(world.spirit, '`accrueSpirit` stays the one writer of spirit').toBe(before.spirit)
    expect(world.fundsCents, 'and it costs nothing beyond the retainer already running').toBe(before.funds)
  })

  // ===============================================================================================
  // ⭐⭐⭐ 17.09 – RE-AFFIRMING THE YEAR SHE ALREADY HAS. THE DEFECT HE FOUND IN PLAY.
  // ===============================================================================================
  //
  // HIS REPORT: «у меня в межсезонье мигает группа плашек выбора что делать с психологом, но почему-то
  // не выбирается повторно существующая».
  //
  // ⚠⚠ THE CASE THAT STOOD HERE ASSERTED THE DEFECT, which is why nothing caught it. Its own words,
  // kept because the reasoning was half right and only the scope was wrong:
  //
  //     «re-choosing the year already running is a NO-OP – not a refusal and not a re-stamp.
  //      `setPsychologistRung`'s idempotence, for its own reason: nothing is being decided, so
  //      nothing may be thrown or written.»
  //
  // Nothing may be CHARGED or WRITTEN – that half stands and is asserted below. The SEASON STAMP was
  // never part of it: confirming last year's work for THIS season buys the year and spends the
  // once-a-season window, so an early return above the stamp meant his choice was never recorded,
  // `psychologistFocusOpen` stayed non-empty and the marker he had followed never cleared.
  //
  // ⚠ MUTATION ARM, RUN AND WATCHED RED: `if ((world.psychologistFocus ?? null) === focus) return`
  // restored to the top of `setPsychologistFocus`. The counts are in the round's handoff.
  it('⭐⭐⭐ re-affirming the year she already has BUYS the season – the stamp moves and the row closes', () => {
    const world = hired('psy-focus-reaffirm')
    // The free first pick, mid-season: this is the year he arrives in the off-season carrying.
    setPsychologistFocus(world, 'recovery')
    const firstStamp = world.psychologistFocusSeason
    expect(inWindow(world), 'the first pick was taken outside the window, as the free one may be').toBe(false)

    // ...and now the off-season he was standing in. Walked to the calendar's own next one rather than
    // posed, so a re-tuned `OFF_SEASON_WEEKS` moves the fixture instead of rotting it.
    while (!isOffSeasonWeek(world.week)) world.week += 1
    expect(inWindow(world), 'the fixture really is in the window').toBe(true)
    expect(psychologistFocusOpen(world), 'every option is open, which is why the block glows').toContain('recovery')
    expect(psychologistFocusRefusal(world, 'recovery'), 'including the one already running').toBeNull()

    const before = { events: world.events.length, lifeLog: world.lifeLog.length, funds: world.fundsCents }
    setPsychologistFocus(world, 'recovery') // «same again this year»

    expect(world.psychologistFocus, 'the year he confirmed is the year that runs').toBe('recovery')
    expect(world.psychologistFocusSeason, 'the stamp is the season this choice is FOR').toBe(
      psychologistFocusSeasonFor(world.week),
    )
    expect(world.psychologistFocusSeason, 'and it really moved off the one the free pick bought').not.toBe(firstStamp)
    // THE MARKER'S OWN PREDICATE – `psychologistFocusNudge` reads exactly this length, so an empty
    // row is the dot going out. Before the repair it stayed full and the block kept glowing.
    expect(psychologistFocusOpen(world), 'the row is spent for this season, so the marker clears').toEqual([])
    expect(psychologistFocusRefusal(world, 'recovery'), 'and a second press this window is refused').toBe(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )
    // ⚠ THE HALF OF THE OLD GUARD THAT WAS RIGHT, kept as an assertion rather than as a comment:
    // a re-affirmation decides a year, and it still writes nothing to the feed and charges nothing.
    expect(world.events.length, 'no feed row for a year that did not change').toBe(before.events)
    expect(world.lifeLog.length, 'and no life-beat row either').toBe(before.lifeLog)
    expect(world.fundsCents, 'and it costs nothing beyond the retainer already running').toBe(before.funds)
  })

  it('⚠ ...and OUTSIDE the window it is REFUSED rather than silently swallowed', () => {
    // The stale-screen case the old early return was written for, and the refusal is now the honest
    // answer to it: the engine re-validates every command (invariant 1), and a LIVE card cannot
    // produce this press at all because `psychologistFocusOpen` is empty and the row is disabled.
    const world = hired('psy-focus-noop')
    setPsychologistFocus(world, 'recovery')
    const stamped = world.psychologistFocusSeason
    world.week += 1
    expect(inWindow(world), 'and this week a CHANGE would be refused').toBe(false)
    expect(psychologistFocusOpen(world), 'so the card offers nothing to press').toEqual([])
    expect(() => setPsychologistFocus(world, 'recovery'), 'the year already has its work').toThrow(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )
    expect(world.psychologistFocusSeason, 'the season it was chosen in did not move').toBe(stamped)
    expect(() => setPsychologistFocus(world, 'listen'), '...and a different year is refused by the same sentence').toThrow(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )
  })

  it('every name and every line is complete, dash-clean and pronoun-free', () => {
    // House law checked here rather than trusted (the short dash `–`, no Cyrillic in player copy),
    // plus R15-7's own rule stated locally: the corpus sweep in tests/coach-voice.test.ts is the
    // real net, and this is the local reminder for whoever rewrites a draft in this file's company.
    const strings = [
      ...PSY_FOCUSES.map((f) => PSY_FOCUS_LABEL[f]),
      ...PSY_FOCUSES.map((f) => PSY_FOCUS_LINE[f]),
      PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL,
      PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL,
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
      PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
      PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
    ]
    // ⚠ RE-AIMED 14.09 BY WAVE 6's T5 AND **STRENGTHENED IN THE SAME EDIT**: «The public life» (O7)
    // brings a fifth name and a fifth line, so the corpus is 15. ⚠⚠ AND THE COUNT IS NOW DERIVED
    // FROM THE ROSTER rather than retyped, for ruling O's reason one section up – a literal here
    // would have to be hand-edited by every future focus, and a hand-edited number is exactly what
    // this line exists to stop drifting. The five refusals stay a literal: their number is a design
    // fact about the gates and has nothing to do with how many focuses the game sells.
    expect(strings.length, 'a name and a line per focus, plus the five refusals')
      .toBe(PSY_FOCUSES.length * 2 + 5)
    for (const s of strings) {
      expect(s.length, 'every one of them is real').toBeGreaterThan(0)
      expect(s, 'short dash only').not.toMatch(/—/)
      expect(s, 'no Cyrillic in player copy').not.toMatch(/[Ѐ-ӿ]/)
      expect(s, 'R15-7: nobody in this game is called «he» by a guess').not.toMatch(/\b(he|his|him|himself)\b/i)
    }
  })
})

// =================================================================================================
// B. ⚠⚠ ZERO DRAWS – §0.4's «no draw, ever», with a positive control that proves the counter
// =================================================================================================
//
// ⚠⚠ THE SHAPE IS THE LAW AND NOT A PREFERENCE (wave-4 §0.1): «prove eligibility short-circuits with
// a key COUNTER the code cannot see, plus a positive control». The claim here is the strongest form
// of it – consent is a BAND READ and this command must never reach a stream in ANY arm, refused or
// accepted – so the counter is unfiltered and the assertion is `[]`.
//
// ⚠ AND A STREAM-ALIGNMENT COMPARISON WOULD PROVE NOTHING, which is why there isn't one: a consent
// draw would be keyed on the week like every other, so two worlds walked side by side would agree
// under the very mutation this section exists to catch. The array lives where `psychologist.ts`
// cannot see it.
describe('wave 5 T3 B – the year-focus takes ZERO draws, on any stream', () => {
  beforeEach(() => {
    rngKeys.length = 0
  })

  it('⭐⭐ every set, every change and every refusal – not one key between them', () => {
    const world = hired('psy-focus-zero')
    rngKeys.length = 0 // `createWorld` and the hire legitimately derive some; this is about the year.

    setPsychologistFocus(world, 'coolhead') // the free pick
    expect(() => setPsychologistFocus(world, 'listen')).toThrow() // refused: the season rule
    world.bond = STRAINED
    expect(() => setPsychologistFocus(world, 'herself')).toThrow() // refused: her readiness or her no
    world.bond = STEADY
    world.week = 260 + 49 // the next season's window, and her consent back
    setPsychologistFocus(world, 'recovery') // accepted: a real change
    world.bond = COLD
    expect(() => setPsychologistFocus(world, 'listen')).toThrow() // refused: the decline
    world.psychologistHired = false
    expect(() => setPsychologistFocus(world, 'listen')).toThrow() // refused: nobody on the payroll

    expect(rngKeys, 'the whole decision, start to finish, on no stream at all').toEqual([])
  })

  it('⭐⭐ ...and not while the CARD reads it either, at every band and every age', () => {
    // The derivations the snapshot builds every tick are the hot path – a draw there would be paid
    // for on every snapshot, not once per decision – so they are counted too.
    const world = hired('psy-focus-zero-reads')
    rngKeys.length = 0
    for (const bond of [CLOSE, STEADY, STRAINED, COLD]) {
      for (const week of [200, 250, 257, 309]) {
        world.bond = bond
        world.week = week
        psychologistFocusOpen(world)
        psychologistFocusDetailOf(world)
        for (const f of PSY_FOCUSES) psychologistFocusRefusal(world, f)
      }
    }
    expect(rngKeys, 'sixteen states, four focuses each, silent').toEqual([])
  })

  it('⭐⭐ THE POSITIVE CONTROL – the physio`s charge, on the same world and the same counter, DOES draw', () => {
    // ⚠⚠ WITHOUT THIS THE TWO CASES ABOVE ARE UNFALSIFIABLE. `resolvePhysio` prices its week from a
    // corridor (`seed:physio:<week>`) in the very same weekly pass, so it is the instrument's own
    // proof that a drawing sibling WOULD have been counted. T2's §B uses exactly this control on
    // exactly this recorder – the same instrument, extended, rather than a second one invented here.
    const world = hired('psy-focus-zero-control')
    world.week = 300
    world.physioActive = true
    rngKeys.length = 0
    setPsychologistFocus(world, 'listen')
    expect(rngKeys, 'the decision, silent').toEqual([])
    resolvePhysio(world)
    expect(rngKeys, 'and the physio beside it, counted').toEqual([`${world.seed}:physio:300`])
  })
})

// =================================================================================================
// C. ⭐⭐ THE SEASON GUARD – every row of ruling I's table, and the laundering path a player would find
// =================================================================================================
//
// O1, made mechanical: «в ближайший год» is the owner's own grain, so a change is an OFF-SEASON
// decision and a once-a-season one. T3b re-cuts both halves against the arithmetic (ruling I):
//
//   the WINDOW is `isOffSeasonWeek(week)` – the last three weeks of the 52-week block
//   (`OFF_SEASON_WEEKS = 3`, offsets 49-51) and NOTHING ELSE. An exam fortnight is not a season
//   boundary, and the exam case below is the one that says so;
//
//   the FACT is `psychologistFocusSeason` against `psychologistFocusSeasonFor(week)` – the season a
//   pick made in that week is FOR, which is `seasonIndexOf(week) + (isOffSeasonWeek(week) ? 1 : 0)`
//   written ONCE in the engine and read by the stamp and the guard alike.
//
// ⚠⚠ WHY THE SECOND HALF MOVED, BECAUSE IT IS THE HALF THAT LOOKS LIKE A DETAIL. The off-season
// sits INSIDE the season index of the year it ends (`seasonIndexOf` is `floor(week / 52)`, the
// off-season is offsets 49-51), so a stamp of `seasonIndexOf(week)` made a mid-season hire wait for
// the NEXT block's off-season – 50 to 101 weeks behind a FREE pick taken before the player knew
// anything. `firstReopening` is the instrument that measures that claim, and it is a scan rather
// than a probe at a week somebody chose.
describe('wave 5 T3 C – the year changes at the season`s edge, once', () => {
  it('⭐⭐⭐ A MID-SEASON PICK OPENS AT THE COMING OFF-SEASON – and the change buys the year AFTER it', () => {
    // Ruling I's rows 1 and 3 in one walk: hire mid-season in block N, and the boundary that opens
    // is N's own, seven weeks later – not N+1's, fifty-nine weeks later.
    const world = hired('psy-focus-change-ok')
    setPsychologistFocus(world, 'coolhead')
    expect(world.psychologistFocusSeason, 'the free pick buys the year it is standing in').toBe(
      psychologistFocusSeasonFor(world.week),
    )
    expect(world.psychologistFocusSeason, '...which mid-season is the calendar season too').toBe(seasonIndexOf(250))

    // ⚠⚠ THE MEASUREMENT, NOT A PROBE AT A WEEK I PICKED. The first week the engine would accept a
    // change is the off-season of the SAME block – derived from the calendar's own constants, so a
    // re-tuned `OFF_SEASON_WEEKS` moves the pin with it rather than rotting against a literal.
    const reopens = firstReopening(world, 251, 250 + 2 * WEEKS_PER_YEAR)
    expect(reopens, 'the coming off-season of her own season, not the next one`s').toBe(
      seasonStartWeek(250) + WEEKS_PER_YEAR - OFF_SEASON_WEEKS,
    )
    expect(isOffSeasonWeek(reopens), 'it really is the off-season').toBe(true)
    expect(seasonIndexOf(reopens), '...and really is still the block the pick was made in').toBe(seasonIndexOf(250))
    expect(reopens - 250, 'weeks held to a free pick – ruling I`s «49 − k», not a year and a half').toBe(7)
    expect(reopens - 250, 'and under a season in any case').toBeLessThan(WEEKS_PER_YEAR)

    world.week = reopens
    expect(inWindow(world), 'the fixture really is in the window').toBe(true)
    setPsychologistFocus(world, 'recovery')
    expect(world.psychologistFocus).toBe('recovery')
    // ⭐ ROW 3: the change is stamped for the year it BUYS – the one about to start.
    expect(world.psychologistFocusSeason, 'the new year is the year the off-season is selling').toBe(
      psychologistFocusSeasonFor(reopens),
    )
    expect(world.psychologistFocusSeason, '...which is one past the block the click happened in').toBe(
      seasonIndexOf(reopens) + 1,
    )
    expect(world.psychologistFocusSeason, 'and NOT the block the click happened in – ruling I`s whole +1').not.toBe(
      seasonIndexOf(reopens),
    )
  })

  it('⭐⭐ A SECOND CHANGE INSIDE THE SAME OFF-SEASON IS REFUSED – the window cannot be spent twice', () => {
    // Ruling I's row 4, and the half that keeps «one choice a year» a year. ⚠ It is also the case
    // that proves the stamp and the guard read ONE expression, and it catches the drift in BOTH
    // directions (measured – ARMS 11 and 12): re-type the GUARD as `seasonIndexOf(week)` and the
    // legitimate first change below is refused outright; re-type the STAMP instead and every week
    // of the window opens again.
    const world = hired('psy-focus-change-twice')
    setPsychologistFocus(world, 'coolhead')
    const reopens = seasonStartWeek(250) + WEEKS_PER_YEAR - OFF_SEASON_WEEKS
    world.week = reopens
    setPsychologistFocus(world, 'recovery')
    const bought = world.psychologistFocusSeason

    for (let week = reopens + 1; week < seasonStartWeek(250) + WEEKS_PER_YEAR; week++) {
      world.week = week
      expect(inWindow(world), `week ${week} is still the off-season`).toBe(true)
      expect(psychologistFocusSeasonFor(week), `week ${week} still sells the same year`).toBe(bought)
      expect(() => setPsychologistFocus(world, 'listen'), `week ${week}`).toThrow(
        PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
      )
    }
    expect(world.psychologistFocus, 'the year the family just bought is the year').toBe('recovery')

    // ...and the NEXT boundary is a full year on – which is what «once a year» means from the
    // inside of the window rather than from the outside.
    const next = firstReopening(world, reopens + 1, reopens + 2 * WEEKS_PER_YEAR)
    expect(next, 'one year, to the week').toBe(reopens + WEEKS_PER_YEAR)
  })

  it('⭐⭐ A FREE PICK TAKEN INSIDE THE OFF-SEASON BUYS THE NEXT YEAR – and waits a full one', () => {
    // Ruling I's row 2. The free pick is free because it is the FIRST, not because it is unstamped:
    // taken in the off-season it buys the year about to start, and the year about to start is the
    // one it then has to run.
    const offSeasonHire = seasonStartWeek(250) + WEEKS_PER_YEAR - OFF_SEASON_WEEKS
    const world = hired('psy-focus-offseason-hire', offSeasonHire)
    expect(world.psychologistFocus, 'nobody has been asked yet – this pick is still the free one').toBeNull()
    expect(inWindow(world), 'and the hire lands inside the off-season').toBe(true)

    setPsychologistFocus(world, 'coolhead')
    expect(world.psychologistFocusSeason, 'the year the off-season is selling').toBe(
      seasonIndexOf(offSeasonHire) + 1,
    )
    expect(world.psychologistFocusSeason, 'and not the block the click happened in').not.toBe(
      seasonIndexOf(offSeasonHire),
    )

    const reopens = firstReopening(world, offSeasonHire + 1, offSeasonHire + 2 * WEEKS_PER_YEAR)
    expect(reopens - offSeasonHire, 'one year, to the week – the next block`s own off-season').toBe(WEEKS_PER_YEAR)
    expect(isOffSeasonWeek(reopens)).toBe(true)
    expect(seasonIndexOf(reopens), 'the block after the one she was hired in').toBe(seasonIndexOf(offSeasonHire) + 1)
  })

  it('⭐⭐ a change OUTSIDE the window is refused – every mid-season week of a whole season', () => {
    // Ruling I's row 5, swept rather than sampled: from the first week of the block after the pick
    // to the last week before its off-season, there is no door at all.
    const world = hired('psy-focus-change-outside')
    setPsychologistFocus(world, 'coolhead')
    const from = seasonStartWeek(250) + WEEKS_PER_YEAR
    const to = from + WEEKS_PER_YEAR - OFF_SEASON_WEEKS - 1
    expect(to - from + 1, 'a whole season minus its off-season tail').toBe(WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
    for (let week = from; week <= to; week++) {
      world.week = week
      expect(inWindow(world), `week ${week} is mid-season`).toBe(false)
      expect(() => setPsychologistFocus(world, 'listen'), `week ${week}`).toThrow(
        PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
      )
    }
    // ...and the far side of a career says the same – the rule is not about how long it has been.
    for (const week of [400, 500]) {
      world.week = week
      expect(inWindow(world), `week ${week} is mid-season`).toBe(false)
      expect(() => setPsychologistFocus(world, 'listen'), `week ${week}`).toThrow(
        PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
      )
    }
    expect(world.psychologistFocus).toBe('coolhead')
  })

  it('⭐⭐⭐ AN EXAM FORTNIGHT IS NOT A SEASON BOUNDARY – the school`s calendar buys no second window', () => {
    // ⚠⚠ THE ROW T3b EXISTS FOR (ruling I, problem 1). T3 shipped the window as
    // `isBlackoutWeek(week, schoolIsOver(...))` because the wave brief named that predicate – and
    // `isBlackoutWeek` is the off-season OR an exam fortnight while school is not over. The
    // professional unlock can precede school's end, so a still-at-school professional got a SECOND
    // change window in June: mid-season switching, which is exactly what O1 forbids.
    //
    // ⚠ THE FIXTURE IS THE CLAIM, so it is asserted rather than described: a hired professional
    // (`psychologistUnlocked` reads the never-pruned W-series mark, and `TIERS.w15.minAgeYears` is
    // 14) who is STILL AT SCHOOL (`schoolEndWeek` lands at 18.0-19.0 for every birth month the game
    // can generate). The combination is ordinary, not contrived: measured over `DEFAULT_PROFILE`,
    // FIVE exam fortnights fall while she is still at school (weeks 23/24, 75/76, 127/128, 179/180,
    // 231/232 – ages 14.0 through 18.0), and the pro door can open at 14.
    const pickWeek = 150 // block 2, offset 46 – mid-season, and she is sixteen
    const world = hired('psy-focus-exam', pickWeek)
    expect(psychologistUnlocked(world), 'a professional – the seat would not open otherwise').toBe(true)
    expect(schoolIsOver(pickWeek, world.profile.birthMonth), '...and still at school').toBe(false)
    expect(ageAt(world), 'sixteen, which is where this collision lives').toBeLessThan(18)
    setPsychologistFocus(world, 'coolhead')
    const bought = world.psychologistFocusSeason

    // The exam fortnight of the NEXT block – next, so that the once-a-season FACT cannot be what
    // refuses and the window is left alone on the stand.
    const examBlock = seasonIndexOf(pickWeek) + 1
    const examWeeks = ECONOMY.availability.examWeeks.flatMap(([lo, hi]) =>
      Array.from({ length: hi - lo + 1 }, (_, i) => examBlock * WEEKS_PER_YEAR + lo + i),
    )
    expect(examWeeks.length, 'a fortnight is two weeks').toBe(2)

    for (const week of examWeeks) {
      const schoolOver = schoolIsOver(week, world.profile.birthMonth)
      world.week = week
      expect(isExamWeek(week, schoolOver), `week ${week} is an exam blackout`).toBe(true)
      expect(schoolOver, `week ${week}: and she is still at school`).toBe(false)
      expect(isOffSeasonWeek(week), `week ${week} is NOT the off-season`).toBe(false)
      // ⚠⚠ THE COUNTERFACTUAL, NAMED IN THE TEST RATHER THAN IN A COMMIT MESSAGE: the predicate T3
      // shipped calls this week a window. This line is why the case cannot pass under both.
      expect(isBlackoutWeek(week, schoolOver), 'the WIDER predicate would have opened it').toBe(true)
      // ...and the season FACT is not what refuses either – by the stamp's own arithmetic this week
      // sells a different year, so only the window is left to say no.
      expect(psychologistFocusSeasonFor(week), `week ${week} sells a year she has not bought`).not.toBe(bought)
      expect(() => setPsychologistFocus(world, 'listen'), `week ${week}`).toThrow(
        PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
      )
      expect(world.psychologistFocus, `week ${week}: the running year is untouched`).toBe('coolhead')
    }

    // ⭐ AND THE DOOR SHE DOES GET IS THE REAL ONE – a refusal test that never shows the acceptance
    // is a test that would pass on a function returning a refusal for everything.
    const reopens = firstReopening(world, pickWeek + 1, pickWeek + 2 * WEEKS_PER_YEAR)
    expect(reopens, 'the off-season of her own block, and nothing before it').toBe(
      seasonStartWeek(pickWeek) + WEEKS_PER_YEAR - OFF_SEASON_WEEKS,
    )
    expect(isOffSeasonWeek(reopens)).toBe(true)
    expect(schoolIsOver(reopens, world.profile.birthMonth), 'still at school there too – school is not the rule').toBe(
      false,
    )
  })

  it('⭐⭐⭐ FIRE AND RE-HIRE DOES NOT LAUNDER A CHANGE – «free» means never picked, not «just hired»', () => {
    // ⚠⚠ THE HOLE, PINNED EXPLICITLY BECAUSE IT IS THE ONE A PLAYER WOULD FIND. The first pick is
    // free because the year starts when the work starts – but firing keeps the focus as a dead
    // letter (T2's rule), so if a re-hire counted as a fresh free pick, fire-and-re-hire would be a
    // free mid-season switch and O1 would be decorative. Both halves are measured: mid-season, and
    // inside an off-season whose one change has already been taken.
    //
    // ⚠ T3b RE-AIMED THE SECOND HALF, and the re-aim is the ruling rather than a convenience. T3
    // measured it «in the window, same season», where the refusal came from a lock ruling I has
    // since removed: that window is now a real boundary and the change is legitimately accepted. So
    // the laundering attempt is measured where a refusal still stands – on the SECOND change inside
    // one off-season.
    const world = hired('psy-focus-launder')
    setPsychologistFocus(world, 'coolhead')
    const stamped = world.psychologistFocusSeason

    world.week = 252
    hirePsychologist(world, false)
    hirePsychologist(world, true)
    expect(world.psychologistFocus, 'the re-hire resumed the year, it did not reopen the choice').toBe('coolhead')
    expect(world.psychologistFocusSeason, '...and the stamp came back with it').toBe(stamped)
    expect(() => setPsychologistFocus(world, 'listen'), 'mid-season, after a re-hire').toThrow(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )

    const reopens = seasonStartWeek(250) + WEEKS_PER_YEAR - OFF_SEASON_WEEKS
    world.week = reopens
    setPsychologistFocus(world, 'listen') // the change ruling I gives back, spent honestly
    expect(world.psychologistFocusSeason).toBe(psychologistFocusSeasonFor(reopens))

    world.week = reopens + 1
    hirePsychologist(world, false)
    hirePsychologist(world, true)
    expect(inWindow(world), 'still inside the off-season whose change is already spent').toBe(true)
    expect(world.psychologistFocus, 'the re-hire resumed the year it did not reopen').toBe('listen')
    expect(world.psychologistFocusSeason, '...and the stamp came back with it').toBe(
      psychologistFocusSeasonFor(world.week),
    )
    expect(() => setPsychologistFocus(world, 'recovery'), 'a second change in one window, after a re-hire').toThrow(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )
    expect(world.psychologistFocus, 'the year the family paid for is still the year').toBe('listen')
  })
})

// =================================================================================================
// D. ⚠⚠ CONSENT – deterministic, band-read, and the precedence between the two gates
// =================================================================================================
//
// §0.4: «the not-ready card and the 18+ joint decline read the bond BAND and nothing else – no draw,
// ever. Her yes is never dice.» Determinism is therefore pinned AS DETERMINISM and not as «it
// refused once»: same band ⇒ same answer, across repeated calls and across worlds that differ in
// everything but the band.
describe('wave 5 T3 D – her consent is a band read, and the same band always answers the same', () => {
  it('⭐⭐ the SAME WORLD asked a hundred times gives one answer, at every band', () => {
    const world = hired('psy-focus-determinism')
    for (const bond of [CLOSE, STEADY, STRAINED, COLD]) {
      world.bond = bond
      const first = PSY_FOCUSES.map((f) => psychologistFocusRefusal(world, f))
      for (let i = 0; i < 100; i++) {
        expect(PSY_FOCUSES.map((f) => psychologistFocusRefusal(world, f)), `bond ${bond}`).toEqual(first)
      }
    }
  })

  it('⭐⭐ ...and worlds that differ in EVERYTHING BUT THE BAND agree with each other', () => {
    // ⚠ THE ARM A SINGLE CALL CANNOT SEE. A draw keyed on (seed, week) is constant per world, so
    // «asked twice, same answer» is green under one. Different seeds, different weeks inside one
    // season, different rungs, different bond NUMBERS inside one band – everything a draw could key
    // on moves, and the answer may not.
    const arms: string[][] = []
    for (const [i, seed] of ['a', 'b', 'c', 'd'].entries()) {
      const world = hired(`psy-focus-band-${seed}`, 250 + i)
      setPsychologistRung(world, i % 3)
      world.bond = STRAINED + i // 35, 36, 37, 38 – four numbers, one band
      arms.push(PSY_FOCUSES.map((f) => psychologistFocusRefusal(world, f) ?? 'open'))
    }
    for (const arm of arms) expect(arm, 'one band, one answer').toEqual(arms[0])
    // ⚠ AND THE ANSWER IS NOT UNIFORM, so the agreement above is a fact about the band rather than
    // about the function returning one thing: at 18+ these four are all the decline.
    expect(arms[0].some((a) => a !== 'open'), 'the fixture really is refusing something').toBe(true)
  })

  it('⭐⭐ it is the BAND and not the number – one point across the edge flips the answer', () => {
    const world = hired('psy-focus-edge')
    world.bond = STEADY // the floor of `steady`
    expect(psychologistFocusRefusal(world, 'herself'), 'inside `steady`, everything is open').toBeNull()
    world.bond = STEADY - 1 // the top of `strained`
    expect(psychologistFocusRefusal(world, 'herself'), 'one point lower is a different band').not.toBeNull()
    // ...and inside the band the number does nothing at all.
    const top = psychologistFocusRefusal(world, 'herself')
    world.bond = STRAINED
    expect(psychologistFocusRefusal(world, 'herself'), 'the whole band answers alike').toBe(top)
  })

  it('⭐⭐⭐ THE PRECEDENCE: at 18+, strained, `herself` gives the JOINT DECLINE and not the not-ready line', () => {
    // ⚠⚠ BOTH GATES BITE AT ONCE HERE, AND THE OUTER ONE WINS. From 18 the choice is joint, so she
    // declines ANY set or change – `'herself'` never reaches its own readiness test. One story per
    // refusal, never two sentences racing.
    const world = hired('psy-focus-precedence')
    expect(ageAt(world), 'the fixture really is eighteen or over').toBeGreaterThanOrEqual(18)
    for (const bond of [STRAINED, COLD]) {
      world.bond = bond
      expect(() => setPsychologistFocus(world, 'herself'), `bond ${bond}`).toThrow(
        PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
      )
      expect(psychologistFocusRefusal(world, 'herself')).toBe(PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL)
      // ⚠ THE NEGATIVE IS THE ITEM: the other sentence exists and is NOT the one told here.
      expect(psychologistFocusRefusal(world, 'herself')).not.toBe(PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL)
      // ...and the decline closes the ROW, not one option.
      expect(psychologistFocusOpen(world), 'she declines any set or change').toEqual([])
      expect(psychologistFocusDetailOf(world)).toBe(PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL)
    }
  })

  it('⭐⭐ UNDER 18 the same bond closes `herself` ALONE – every other year is hers to be given', () => {
    const world = hired('psy-focus-not-ready', 200)
    expect(ageAt(world), 'the fixture is under eighteen').toBeLessThan(18)
    for (const bond of [STRAINED, COLD]) {
      world.bond = bond
      expect(() => setPsychologistFocus(world, 'herself'), `bond ${bond}`).toThrow(
        PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
      )
      // ⚠⚠ RE-AIMED 14.09 BY WAVE 6's T5 AND **STRENGTHENED IN THE SAME EDIT**. «The public life»
      // (O7) joined the roster, so the hand-typed three became a stale four-item claim about a
      // five-item roster – and that is precisely the shape ruling O warns about, one section up: a
      // re-typed list does not move with the union. The claim this case makes is «EXACTLY ONE option
      // is closed, and it is `herself`», so it is now spelled that way and derived from
      // `PSY_FOCUSES`. It is strictly stronger: a sixth focus wrongly closed by the readiness gate
      // goes red here without anybody editing this line, which the literal could never do.
      expect(psychologistFocusOpen(world), 'exactly one option is closed, and it is the one she has to want')
        .toEqual(PSY_FOCUSES.filter((f) => f !== 'herself'))
      expect(psychologistFocusDetailOf(world), 'and the card says she is not ready').toBe(
        PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
      )
    }
    // ⭐ AND THE ONE THAT IS OPEN REALLY IS OPEN – «repair is free, growth is work»: a strained bond
    // never locks the whole seat, at any age below the joint choice.
    world.bond = COLD
    setPsychologistFocus(world, 'coolhead')
    expect(world.psychologistFocus).toBe('coolhead')
  })

  it('⭐ at `close` and `steady` every year is open, at every age – consent is given and nothing is said', () => {
    for (const week of [200, 250, 400]) {
      for (const bond of [CLOSE, CLOSE + 15, STEADY]) {
        const world = hired(`psy-focus-open-${week}-${bond}`, week)
        world.bond = bond
        expect(psychologistFocusOpen(world), `week ${week} bond ${bond}`).toEqual([...PSY_FOCUSES])
        expect(psychologistFocusDetailOf(world), 'and the row says nothing at all').toBe('')
      }
    }
  })
})

// =================================================================================================
// E. ⭐⭐ THE WIRE – the field, its two companions, and the ONE story they tell with the command
// =================================================================================================
//
// Ruling G: «a `Snapshot` member ships WITH its reader, never before it». The reader is the focus row
// on the staff card (tests/component/psychologist-card.test.ts §9-§11); this section is the producer
// half – that what the card is handed is what the engine would actually do.
describe('wave 5 T3 E – what the card is told is what the engine would do', () => {
  it('⭐ the three facts reach the wire and follow the world', () => {
    const world = hired('psy-focus-wire')
    const idle = toSnapshot(world)
    expect(idle.psychologistFocus, 'nobody has picked').toBeNull()
    expect(idle.psychologistFocusOpen, 'and all four are on offer').toEqual([...PSY_FOCUSES])
    expect(idle.psychologistFocusDetail, 'so there is nothing to explain').toBe('')

    setPsychologistFocus(world, 'listen')
    const live = toSnapshot(world)
    expect(live.psychologistFocus).toBe('listen')
    expect(live.psychologistFocusOpen, 'the year is running now, so nothing may be chosen').toEqual([])
    expect(live.psychologistFocusDetail).toBe(PSYCHOLOGIST_FOCUS_SEASON_REFUSAL)
  })

  it('⭐ an empty seat carries an empty row – the card renders none of it', () => {
    const world = createWorld('psy-focus-wire-unhired', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    const snap = toSnapshot(world)
    expect(snap.psychologistHired).toBe(false)
    expect(snap.psychologistFocus).toBeNull()
    expect(snap.psychologistFocusOpen, 'nothing is on offer without a hire').toEqual([])
    // ⚠ `''` AND NOT THE UNHIRED REFUSAL: the row is not rendered at all, so a sentence here would be
    // copy nobody reads – the refusal exists for the stale-screen CLICK, which is §A's case.
    expect(snap.psychologistFocusDetail).toBe('')
  })

  it('⭐⭐⭐ EXHAUSTIVELY: for every state, every option the wire calls OPEN is one the command accepts', () => {
    // ⚠⚠ THE R10-16 ONE-STORY DOCTRINE AS AN EQUIVALENCE RATHER THAN AS A CLAIM. The card disables
    // what `psychologistFocusOpen` leaves out and prints `psychologistFocusDetail`; the command
    // throws `psychologistFocusRefusal`. If those ever disagree, the screen offers a permission the
    // engine does not hold – so the sweep asserts the two agree on every combination this wave has.
    for (const week of [200, 250, 257, 260, 309]) {
      for (const bond of [CLOSE, STEADY, STRAINED, COLD]) {
        for (const already of [null, 'coolhead'] as const) {
          const world = hired(`psy-e-${week}-${bond}-${already}`, week)
          if (already) {
            setPsychologistFocus(world, already)
            world.bond = bond
          } else {
            world.bond = bond
          }
          const snap = toSnapshot(world)
          for (const focus of PSY_FOCUSES) {
            const offered = snap.psychologistFocusOpen.includes(focus)
            const probe = hired(`psy-e-${week}-${bond}-${already}`, week)
            if (already) setPsychologistFocus(probe, already)
            probe.bond = bond
            const where = `week ${week} bond ${bond} already ${already} → ${focus}`
            if (focus === already) continue // a no-op press, neither offered nor refused
            if (offered) {
              expect(() => setPsychologistFocus(probe, focus), `${where}: offered`).not.toThrow()
            } else {
              expect(() => setPsychologistFocus(probe, focus), `${where}: withheld`).toThrow()
            }
          }
          // ...and the row's sentence is one of the engine's own, never a fifth wording.
          const detail = snap.psychologistFocusDetail
          if (detail) {
            expect(
              [
                PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
                PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
                PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
              ],
              `week ${week} bond ${bond} already ${already}`,
            ).toContain(detail)
          }
        }
      }
    }
  })

  it('⭐⭐ ...and the detail is EXACTLY the sentence the command throws for that state', () => {
    // The identity the card leans on: not «a sentence» but THE sentence, so the вычитка moves one
    // string and both surfaces move with it.
    for (const [week, bond] of [
      [250, STRAINED],
      [250, COLD],
      [200, STRAINED],
      [251, STEADY],
    ] as const) {
      const world = hired(`psy-detail-${week}-${bond}`, 250)
      setPsychologistFocus(world, 'coolhead')
      world.week = week
      world.bond = bond
      const detail = toSnapshot(world).psychologistFocusDetail
      expect(detail, `week ${week} bond ${bond}`).not.toBe('')
      let thrown = ''
      try {
        setPsychologistFocus(world, 'listen')
      } catch (err) {
        thrown = (err as Error).message
      }
      // ⚠ `'listen'` is the probe because it is never the running year here and never the readiness
      // gate's own option – so what it throws is the ROW's sentence, which is what the detail is.
      expect(thrown, `week ${week} bond ${bond}`).toBe(detail)
    }
  })
})
