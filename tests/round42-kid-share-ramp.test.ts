// ROUND 42 #25 – TEN POINTS A BIRTHDAY, 60% AT TWENTY-THREE, AND COLLEGE PAUSES THE CLIMB.
//
// THE OWNER, 14.09: «может быть нам с 18 не по 5, а по 10% в год ей добавлять стоит?», then «может
// даже до 60% к 23», and – the half that is a mechanic rather than a number – «пока она снова в тур
// не вернется». Confirmed 15.09: «подтверждаю связку».
//
// The measurement that shipped with it is docs/specs/kid-share-ramp-2026-09.md
// (`tools/r42-kid-share-ramp.ts`), predicted-first, per invariant 5.
//
// ⚠⚠ NO SCHEMA MOVE, AND §4 IS THAT CLAIM RATHER THAN A COMMENT. `CollegeState.fromWeek` and
// `untilWeek` have been on every save since v51 and a career has at most one college era, so «how
// many birthdays did college eat» is a subtraction over facts the save already holds.
//
// ⚠ THE LADDER IS ASSERTED AGAINST `ECONOMY.kidShare` WHEREVER THE SHAPE IS THE CLAIM and against
// literal percentages exactly once (§1's table), which is the same division of labour
// `round23-kid-share.test.ts` uses: one place says what the numbers ARE, everywhere else says what
// the rule is.
//
// MUTATIONS, each applied alone to the engine, run, reverted. Control 18/18 green before and after.
// ⚠ THE COUNTS ARE READ OFF THE RUNS, NOT PREDICTED:
//   N1 `kidPrizeShareBps` ignoring `pausedYears` (the pre-item arithmetic)        -> 5 red
//   N2 `collegePausedShareYears` reading `untilWeek` instead of `untilWeek - 1`
//      (a birthday in the week she is BACK counted as eaten)                      -> 4 red
//   N3 the `max(enter, fromAgeYears)` floor removed (a pre-eighteen enrolment
//      eating steps that were never hers to lose)                                 -> 1 red
//   N4 `stepBps` back to 500, run across this file plus round23-kid-share,
//      round41-kid-share-first-w and team-share                                   -> 10 red
//   N5 `toSnapshot` handing 0 instead of `collegePausedShareYears(world)`         -> 1 red (§5)
import { describe, it, expect } from 'vitest'
import {
  collegePausedShareYears,
  createWorld,
  kidAgeYears,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY, kidPrizeShareBps, kidPrizeShareCents } from '../src/engine/economy'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world/state'
import { ownAccountCard, ownAccountNote, type KidLifeWorldView } from '../src/engine/kidLife'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type CollegeState } from '../src/shared/protocol'

const K = ECONOMY.kidShare

/** The age the cap lands on, DERIVED from the three constants exactly as the engine's own comment
 *  says it is. Written here once so the file has a name for it without a second literal. */
const CAP_AGE = K.fromAgeYears + (K.capBps - K.startBps) / K.stepBps

/** A world with a college era written onto it. The span is the only thing the derivation reads, so
 *  a hand-built one is an honest input – §4's second arm walks a real career for the integration. */
function withCollege(seed: string, week: number, from: number, until: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  const college: CollegeState = {
    fromWeek: from,
    untilWeek: until,
    doneWeek: until <= week ? until : null,
    years: [],
    pendingCallUp: null,
    pendingLeague: null,
  }
  world.college = college
  return world
}

const ageAt = (w: WorldState, week: number) => kidAgeYears(week, w.profile.birthMonth, w.profile.birthDay)
/** The first week of the career on which she is `age` – the walk that gives §4 real birthday weeks
 *  without a second definition of when her birthday is. */
function firstWeekAtAge(w: WorldState, age: number): number {
  for (let week = 0; week < 40 * WEEKS_PER_YEAR; week++) if (ageAt(w, week) === age) return week
  throw new Error(`no week at age ${age}`)
}

// =================================================================================================
// §1 – THE LADDER HE CONFIRMED
// =================================================================================================
describe('§1 the ramp – ten points a birthday, and it stops at sixty', () => {
  // ⚠ RE-AIMED BY ROUND 42 #25. The round-23 table (10 10 15 20 25 30 35 40 45 50, capped at 26) is
  // in `tests/round23-kid-share.test.ts`, which moved with this item and carries the same note.
  const RAMP: Record<number, number> = {
    13: 10, 14: 10, 15: 10, 16: 10, 17: 10,
    18: 10, 19: 20, 20: 30, 21: 40, 22: 50,
    23: 60, 24: 60, 25: 60, 26: 60, 30: 60, 41: 60,
  }

  it('⭐⭐⭐ his table, age by age', () => {
    for (const [age, pct] of Object.entries(RAMP)) {
      expect(kidPrizeShareBps(Number(age)), `age ${age}`).toBe(pct * 100)
    }
  })

  it('⭐⭐ the cap lands at twenty-three, and the age is DERIVED rather than written down', () => {
    expect(CAP_AGE, 'the three constants say twenty-three').toBe(23)
    expect(kidPrizeShareBps(CAP_AGE)).toBe(K.capBps)
    expect(kidPrizeShareBps(CAP_AGE - 1), 'and the year before it is not yet there').toBeLessThan(K.capBps)
  })

  it('⚠ the curve is still CONTINUOUS across her eighteenth – round 41 #27 is untouched', () => {
    expect(kidPrizeShareBps(K.fromAgeYears)).toBe(kidPrizeShareBps(K.fromAgeYears - 1))
    expect(kidPrizeShareBps(K.fromAgeYears)).toBe(K.startBps)
    for (let age = 10; age < K.fromAgeYears; age++) expect(kidPrizeShareBps(age), `age ${age}`).toBe(K.startBps)
  })

  it('⚠ monotone and bounded at every age the game can reach, and read off ECONOMY', () => {
    let last = -1
    for (let age = 10; age <= 45; age++) {
      const bps = kidPrizeShareBps(age)
      expect(bps).toBeGreaterThanOrEqual(last)
      expect(bps).toBeLessThanOrEqual(K.capBps)
      last = bps
    }
    for (let age = K.fromAgeYears; age <= 45; age++) {
      expect(kidPrizeShareBps(age), `age ${age} off the constants`)
        .toBe(Math.min(K.capBps, K.startBps + (age - K.fromAgeYears) * K.stepBps))
    }
  })
})

// =================================================================================================
// §2 – THE PAUSE, AS ARITHMETIC
// =================================================================================================
describe('§2 a paused birthday adds nothing', () => {
  it('⭐⭐⭐ every paused year costs exactly one step', () => {
    for (let age = K.fromAgeYears; age <= 30; age++) {
      for (let paused = 0; paused <= 6; paused++) {
        const steps = Math.max(0, age - K.fromAgeYears - paused)
        expect(kidPrizeShareBps(age, paused), `age ${age}, ${paused} paused`)
          .toBe(Math.min(K.capBps, K.startBps + steps * K.stepBps))
      }
    }
  })

  it('⭐⭐⭐ HIS OWN CASE: four college years from nineteen, and she comes back near the bottom', () => {
    // She arrives at nineteen and is back on tour the week she turns twenty-three, so THREE of her
    // birthdays were answered from a dorm – her twentieth, twenty-first and twenty-second (§3 walks
    // that span and counts them). Two tour birthdays are left: her nineteenth and the twenty-third
    // she has on the week she comes home. So she returns on 30%, not on the cap. «пока она снова
    // в тур не вернется.»
    expect(kidPrizeShareBps(23, 3)).toBe(K.startBps + 2 * K.stepBps)
    expect(kidPrizeShareBps(23, 0), 'against the cap she would have been on with no pause').toBe(K.capBps)
    // ...and she climbs from there, reaching the cap three birthdays later than she otherwise would.
    expect(kidPrizeShareBps(26, 3)).toBe(K.capBps)
    expect(kidPrizeShareBps(25, 3)).toBeLessThan(K.capBps)
  })

  it('⚠ it can never push her below the floor, however absurd the count', () => {
    for (const paused of [1, 5, 40, 999]) {
      for (let age = 10; age <= 45; age++) {
        expect(kidPrizeShareBps(age, paused), `age ${age}, ${paused} paused`).toBeGreaterThanOrEqual(K.startBps)
      }
    }
    expect(kidPrizeShareBps(30, -7), 'and a negative count is not a bonus').toBe(kidPrizeShareBps(30, 0))
  })

  it('⚠ a cheque still splits to the cent under the pause – the family keeps the remainder', () => {
    for (const prize of [130_00, 55_555_55, 3_000_000_00, 1, 7]) {
      for (const paused of [0, 2, 4]) {
        for (let age = 18; age <= 28; age++) {
          const hers = kidPrizeShareCents(prize, age, paused)
          expect(hers + (prize - hers), `age ${age}/${paused} of ${prize}`).toBe(prize)
          expect(hers).toBeLessThanOrEqual(prize)
          expect(hers).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })
})

// =================================================================================================
// §3 – THE DERIVATION: WHICH BIRTHDAYS COLLEGE ATE
// =================================================================================================
describe('§3 `collegePausedShareYears` counts the birthdays inside the freeze', () => {
  it('⭐ a career that never enrolled is untouched – zero, always', () => {
    const world = createWorld('no-college', { ...DEFAULT_PROFILE, coachTier: 'self' })
    for (const week of [0, 100, 400, 700]) {
      world.week = week
      expect(collegePausedShareYears(world), `week ${week}`).toBe(0)
    }
  })

  it('⭐⭐⭐ four years inside the freeze eat the three birthdays that fall inside it', () => {
    const probe = createWorld('span', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const from = firstWeekAtAge(probe, 19)
    const until = firstWeekAtAge(probe, 23)
    const world = withCollege('span', until + 10, from, until)
    expect(ageAt(world, from), 'she enrols the week she turns nineteen').toBe(19)
    expect(ageAt(world, until), 'and is back on tour the week she turns twenty-three').toBe(23)
    // ⚠ THREE AND NOT FOUR, AND THE ARITHMETIC IS THE RULE RATHER THAN AN EDGE CASE: the birthdays
    // that fall INSIDE the freeze are her twentieth, twenty-first and twenty-second. The nineteenth
    // is the week she arrives and the twenty-third is the week she is back – `inCollege` is
    // `week < untilWeek`, so neither of those weeks is a college week.
    expect(collegePausedShareYears(world)).toBe(3)
    // ⚠ AND THE RAMP READS IT: at twenty-three she is two steps up and not five.
    expect(kidPrizeShareBps(ageAt(world, world.week), collegePausedShareYears(world)))
      .toBe(K.startBps + 2 * K.stepBps)
  })

  it('⭐⭐ the birthday in the week she is BACK is a tour birthday and counts', () => {
    const probe = createWorld('boundary', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const from = firstWeekAtAge(probe, 19)
    const back = firstWeekAtAge(probe, 22)
    // She leaves the freeze on the very week she turns twenty-two: `inCollege` is `week < untilWeek`,
    // so that week is already a tour week and the birthday is hers.
    const world = withCollege('boundary', back + 5, from, back)
    expect(collegePausedShareYears(world), 'her 20th and 21st only').toBe(2)
    // ...and one week later it WOULD have been a college birthday.
    const world2 = withCollege('boundary', back + 5, from, back + 1)
    expect(collegePausedShareYears(world2)).toBe(3)
  })

  it('⭐ while she is still there, this week\'s birthday is already paused', () => {
    const probe = createWorld('midway', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const from = firstWeekAtAge(probe, 19)
    const turns21 = firstWeekAtAge(probe, 21)
    const world = withCollege('midway', turns21, from, from + 4 * WEEKS_PER_YEAR)
    expect(world.week, 'she is mid-freeze').toBeLessThan(world.college!.untilWeek)
    expect(collegePausedShareYears(world), 'her 20th and her 21st, the latter this very week').toBe(2)
  })

  it('⚠ a girl who leaves the week she arrives loses nothing', () => {
    const probe = createWorld('bail', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const from = firstWeekAtAge(probe, 19)
    const world = withCollege('bail', from + 60, from, from)
    expect(collegePausedShareYears(world)).toBe(0)
  })

  it('⚠ only a birthday that would have ADDED a step can be eaten', () => {
    // A span that sits entirely under the eighteenth pauses nothing: those birthdays never moved
    // the ladder, and counting them would push her below `startBps`.
    const probe = createWorld('early', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const from = firstWeekAtAge(probe, 15)
    const until = firstWeekAtAge(probe, 18)
    const world = withCollege('early', until + 20, from, until)
    expect(collegePausedShareYears(world)).toBe(0)
    // ...and a span straddling it counts only the part above eighteen.
    const straddle = withCollege('early', firstWeekAtAge(probe, 21) + 5, from, firstWeekAtAge(probe, 21))
    expect(collegePausedShareYears(straddle), 'her 19th and 20th – not her 16th to 18th, and not the 21st she is back for').toBe(2)
  })
})

// =================================================================================================
// §4 – NO SCHEMA MOVE
// =================================================================================================
describe('§4 nothing is persisted for any of it', () => {
  it('⭐⭐ the save schema does not move for round 42 #25', () => {
    // The ladder is three constants and the pause is a subtraction over v51 fields. If this item
    // ever needed a field it would need a migration and a golden fixture with it (invariant 3).
    //
    // ⚠ RE-AIMED BY ROUND 42's v78 BUNDLE, NOT WEAKENED, AND THE RE-AIM IS THE CLAIM SAID PROPERLY.
    // `toBe(77)` was never a statement about THIS item – it was «the ladder head is where wave 6 left
    // it», which is a fact about somebody else's work that this file happened to be standing next to.
    // Any later bundle taking a number of its own would have reddened it for a reason item 25 has no
    // opinion about. What item 25 actually claims is that IT persists nothing, and that is asserted
    // directly below: no key of this item's own appears on a fresh world, at any schema version.
    const fresh = createWorld('r42-25-no-field') as unknown as Record<string, unknown>
    expect(Object.keys(fresh).filter((k) => /kidShare|shareRamp|collegePaused/i.test(k)), 'item 25 stores nothing')
      .toEqual([])
    expect(SAVE_SCHEMA_VERSION, 'and the ladder has only ever gone forward since wave 6').toBeGreaterThanOrEqual(77)
  })

  it('⭐⭐ asking the question writes nothing', () => {
    const probe = createWorld('pure', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const world = withCollege('pure', firstWeekAtAge(probe, 24), firstWeekAtAge(probe, 19), firstWeekAtAge(probe, 23))
    const before = JSON.stringify(world)
    for (let i = 0; i < 50; i++) collegePausedShareYears(world)
    expect(JSON.stringify(world)).toBe(before)
  })
})

// =================================================================================================
// §5 – ONE DERIVATION, EVERY SURFACE: HER PAGE QUOTES WHAT THE TILL DIVIDES BY
// =================================================================================================
describe('§5 the page and the till cannot quote two different percentages', () => {
  it('⭐⭐⭐ the snapshot carries the paused count, and her own-account sentence reads it', () => {
    const probe = createWorld('surface', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const world = withCollege('surface', firstWeekAtAge(probe, 23) + 2, firstWeekAtAge(probe, 19), firstWeekAtAge(probe, 23))
    world.kidFundsCents = 40_000_00
    const snap = toSnapshot(world)
    // ⚠ THE COUNT IS AN INPUT TO THE VIEW AND NOT A FIELD ON THE SNAPSHOT – `KidLifeWorldView` carries
    // it, `KidLife` carries the composed sentence. So the claim is read where a player would read
    // it: off the sentence her page prints.
    expect(collegePausedShareYears(world), 'the count the view is built from').toBe(3)
    // The sentence quotes her REAL rate – two steps up, not the cap she would be on with no pause.
    const rate = kidPrizeShareBps(snap.ageYears, collegePausedShareYears(world))
    expect(rate).toBe(K.startBps + 2 * K.stepBps)
    expect(snap.life.ownAccount, 'her page says the paused rate').toContain(`${rate / 100}% of every prize cheque`)
    expect(snap.life.ownAccount, '...and not the one the calendar alone would give her')
      .not.toContain(`${K.capBps / 100}% of every prize cheque`)
  })

  it('⚠ the same view with the pause removed says the other number – the arm contains its own reader', () => {
    const base: KidLifeWorldView = {
      seed: 'reader',
      week: 9 * WEEKS_PER_YEAR,
      ageYears: 23,
      seasonYear: 2030,
      temperament: 'quiet',
      // ⚠ ROUND 42 #37 – the Personality line's first word; this file is about the ramp.
      composure: 50,
      playStyle: 'all-court',
      birthMonth: 6,
      injured: false,
      weeksAway: 0,
      lossStreak: 0,
      weeksSinceTitle: null,
      college: null,
      kidFundsCents: 40_000_00,
      kidSharePausedYears: 4,
      ownsBrand: false,
    }
    expect(ownAccountNote(base)).toContain(`${(K.startBps + K.stepBps) / 100}% of every prize cheque`)
    expect(ownAccountNote({ ...base, kidSharePausedYears: 0 })).toContain(`${K.capBps / 100}% of every prize cheque`)
  })

  // ===============================================================================================
  // ⭐⭐⭐ ROUND 42 #44 – AND BOTH SENTENCES SAY WHICH BIRTHDAYS COUNT
  // ===============================================================================================
  //
  // «пока не в туре – доля не растёт» (15.09). The shipped pair promised «10 points more every
  // birthday» / «Her share grows 10 points every birthday», which the four college years make false
  // – the mechanic above is exactly the one that eats them. His two replacement sentences tie the
  // growth to the birthdays she spends ON TOUR and let the reader draw the negative.
  //
  // ⚠ THE WORDS ARE HIS AND THIS PIN MOVES ONLY WITH HIM (invariant 4). What it asserts is the
  // qualifier and the figures around it, both read off `ECONOMY.kidShare` rather than typed, so a
  // retune of the ramp moves the assertion with the sentence.
  it('⭐⭐⭐ #44 – the ramp clause names the birthdays she spends ON TOUR, on both surfaces', () => {
    const growing: KidLifeWorldView = {
      seed: 'tour-birthdays',
      week: 5 * WEEKS_PER_YEAR,
      ageYears: 20,
      seasonYear: 2030,
      temperament: 'quiet',
      composure: 50,
      playStyle: 'all-court',
      birthMonth: 6,
      injured: false,
      weeksAway: 0,
      lossStreak: 0,
      weeksSinceTitle: null,
      college: null,
      kidFundsCents: 2_400_00,
      kidSharePausedYears: 0,
      ownsBrand: false,
    }
    const note = ownAccountNote(growing)
    expect(note, 'the Money screen sentence, verbatim to the qualifier').toContain(
      `${K.stepBps / 100} points more every birthday she spends on tour, up to ${K.capBps / 100}%.`,
    )
    const card = ownAccountCard(growing)
    expect(card, 'her page draws the card at this age').not.toBeNull()
    expect(card!.note, 'the Kid page card, in its own phrasing and with the same qualifier').toContain(
      `Her share grows ${K.stepBps / 100} points every birthday she spends on tour, up to ${K.capBps / 100}%.`,
    )
    // ⚠ AND NEITHER SURFACE SAYS THE OLD, FALSE THING – the bare promise with no qualifier after it.
    // This is the arm that reddens if a вычитка pass drops the clause: `toContain` alone would stay
    // green on «every birthday she spends on tour» AND on «every birthday, up to», so the negative
    // has to name the shipped phrasing it replaced.
    expect(note).not.toContain(`points more every birthday up to`)
    expect(card!.note).not.toContain(`points every birthday, up to`)

    // ⚠ AT THE CAP NEITHER OF THEM PROMISES ANYTHING AT ALL, which is the clause the qualifier does
    // not touch: «and the share goes no higher» / «Her share goes no higher.»
    const capped = { ...growing, ageYears: 26 }
    expect(ownAccountNote(capped)).toMatch(/goes no higher/)
    expect(ownAccountNote(capped)).not.toContain('she spends on tour')
    expect(ownAccountCard(capped)!.note).not.toContain('she spends on tour')
  })
})
