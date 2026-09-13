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
  resolvePhysio,
  setPsychologistFocus,
  setPsychologistRung,
  toSnapshot,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { isBlackoutWeek } from '../src/engine/season/calendar'
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
 *  engine's own two functions, never re-derived – `isBlackoutWeek(week, schoolIsOver(...))` is the
 *  architect's named seam and the command reads exactly this pair. */
function inWindow(world: WorldState): boolean {
  return isBlackoutWeek(world.week, schoolIsOver(world.week, world.profile.birthMonth))
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
  it('⭐⭐ THE FIRST PICK IS FREE, and it stamps the season it was made in', () => {
    const world = hired('psy-focus-first')
    expect(world.psychologistFocus, 'nobody has been asked yet').toBeNull()
    expect(inWindow(world), 'and the fixture is deliberately NOT in the off-season window').toBe(false)
    setPsychologistFocus(world, 'coolhead')
    expect(world.psychologistFocus, 'the year starts when the work starts').toBe('coolhead')
    expect(world.psychologistFocusSeason, '...and the season it started in is recorded').toBe(
      seasonIndexOf(world.week),
    )
  })

  it('⭐ the four are the four – an id the game does not sell is refused, and writes nothing', () => {
    const world = hired('psy-focus-id')
    expect(PSY_FOCUSES.length, 'four at step 5; the fifth is the spotlight wave`s (O7)').toBe(4)
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

  it('re-choosing the year already running is a NO-OP – not a refusal and not a re-stamp', () => {
    // `setPsychologistRung`'s idempotence, for its own reason: nothing is being decided, so nothing
    // may be thrown or written. Measured OUTSIDE the window, where a real change would be refused.
    const world = hired('psy-focus-noop')
    setPsychologistFocus(world, 'recovery')
    const stamped = world.psychologistFocusSeason
    world.week += 1
    expect(inWindow(world), 'and this week a CHANGE would be refused').toBe(false)
    expect(() => setPsychologistFocus(world, 'recovery')).not.toThrow()
    expect(world.psychologistFocusSeason, 'the season it was chosen in did not move').toBe(stamped)
    expect(() => setPsychologistFocus(world, 'listen'), '...but a different year is a change').toThrow(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )
  })

  it('the four names and the four lines are complete, dash-clean and pronoun-free', () => {
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
    expect(strings.length, 'four names, four lines, five refusals').toBe(13)
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
// C. ⭐⭐ THE SEASON GUARD – both directions, and the laundering path a player would find
// =================================================================================================
//
// O1, made mechanical: «в ближайший год» is the owner's own grain, so a change is an OFF-SEASON
// decision and a once-a-season one. The window is `isBlackoutWeek(week, schoolIsOver(...))` and the
// once-a-season fact is `psychologistFocusSeason` against `seasonIndexOf(week)`.
describe('wave 5 T3 C – the year changes at the season`s edge, once', () => {
  it('⭐⭐ a change INSIDE the window in a NEW season is accepted', () => {
    const world = hired('psy-focus-change-ok')
    setPsychologistFocus(world, 'coolhead')
    expect(world.psychologistFocusSeason).toBe(seasonIndexOf(250))
    world.week = 309 // season 5's off-season tail (5 × 52 + 49)
    expect(inWindow(world), 'the fixture really is in the window').toBe(true)
    expect(seasonIndexOf(world.week), '...and really is a new season').not.toBe(seasonIndexOf(250))
    setPsychologistFocus(world, 'recovery')
    expect(world.psychologistFocus).toBe('recovery')
    expect(world.psychologistFocusSeason, 'and the new year is stamped with ITS season').toBe(
      seasonIndexOf(309),
    )
  })

  it('⭐⭐ a change inside the window in the SAME season is refused – the pick spends its own season', () => {
    // ⚠ THIS IS THE HALF THAT MAKES THE FREE PICK A YEAR RATHER THAN AN OPEN SEASON: hire in week
    // 250, choose, and the off-season three weeks later is already spent.
    const world = hired('psy-focus-change-same')
    setPsychologistFocus(world, 'coolhead')
    world.week = 257 // season 4's own off-season tail
    expect(inWindow(world), 'in the window').toBe(true)
    expect(seasonIndexOf(world.week), '...and in the season the pick was made in').toBe(
      world.psychologistFocusSeason,
    )
    expect(() => setPsychologistFocus(world, 'listen')).toThrow(PSYCHOLOGIST_FOCUS_SEASON_REFUSAL)
    expect(world.psychologistFocus, 'and the running year is untouched').toBe('coolhead')
  })

  it('⭐⭐ a change OUTSIDE the window is refused, however many seasons have passed', () => {
    const world = hired('psy-focus-change-outside')
    setPsychologistFocus(world, 'coolhead')
    for (const week of [251, 300, 400, 500]) {
      world.week = week
      expect(inWindow(world), `week ${week} is mid-season`).toBe(false)
      expect(() => setPsychologistFocus(world, 'listen'), `week ${week}`).toThrow(
        PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
      )
    }
    expect(world.psychologistFocus).toBe('coolhead')
  })

  it('⭐⭐⭐ FIRE AND RE-HIRE DOES NOT LAUNDER A CHANGE – «free» means never picked, not «just hired»', () => {
    // ⚠⚠ THE HOLE, PINNED EXPLICITLY BECAUSE IT IS THE ONE A PLAYER WOULD FIND. The first pick is
    // free because the year starts when the work starts – but firing keeps the focus as a dead
    // letter (T2's rule), so if a re-hire counted as a fresh free pick, fire-and-re-hire would be a
    // free mid-season switch and O1 would be decorative. Both halves are measured: mid-season, and
    // inside the window of the season the year was already picked in.
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

    world.week = 257
    hirePsychologist(world, false)
    hirePsychologist(world, true)
    expect(inWindow(world), 'and now in the window, where only the season fact stands between').toBe(true)
    expect(() => setPsychologistFocus(world, 'listen'), 'in the window, same season, after a re-hire').toThrow(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )
    expect(world.psychologistFocus, 'the year the family paid for is still the year').toBe('coolhead')
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

  it('⭐⭐ UNDER 18 the same bond closes `herself` ALONE – the other three years are hers to be given', () => {
    const world = hired('psy-focus-not-ready', 200)
    expect(ageAt(world), 'the fixture is under eighteen').toBeLessThan(18)
    for (const bond of [STRAINED, COLD]) {
      world.bond = bond
      expect(() => setPsychologistFocus(world, 'herself'), `bond ${bond}`).toThrow(
        PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
      )
      expect(psychologistFocusOpen(world), 'the other three are open').toEqual([
        'coolhead',
        'recovery',
        'listen',
      ])
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
