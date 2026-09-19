// ROUND 44 #7 – THE STAFF'S YEAR-END POST, AND WHAT EACH SEAT MAY HONESTLY CLAIM.
//
// THE OWNER, 18.09, having played a career to its end: «письмо от тренера по итогу года мне так и не
// пришло, да и ни от одного специалиста не пришло.»
//
// ⚠ IT WAS NOT A DEFECT. Measured before a line was written: no such letter had ever existed. So
// there is nothing here that guards a regression – every test below guards a CLAIM, and the claims
// that mattered were not «does a letter appear» but «can this letter's sentence be backed by
// something the world actually retains».
//
// ⚠⚠ THE THREE THAT WOULD HAVE SHIPPED A LIE, and each has its own section:
//   §C  the CHEMISTRY gate. The coach's sheet is the first surface in the game where chemistry
//       speaks in words rather than as a ring, and the bar is DRAWN PER PAIR – so a letter gated on
//       `ECONOMY.chemistry.readableFloor` would tell a parent what the gauge is still hiding for
//       exactly those pairs whose drawn bar sits above the floor. The mutation arm measures it.
//   §D  the EMPLOYMENT gate. «On the payroll today» is not «worked this season», and the difference
//       is a sentence claiming more than its code checks – the defect `spiritShock.weeks` was added
//       to avoid, named there in those words.
//   §E  the PSYCHOLOGIST's focus. One slot, overwritten by the next pick, so an unguarded read
//       prints NEXT year's focus over LAST year's season.
//
// ⚠ AND §G WALKS A REAL CAREER THROUGH `tickWeek`, on round 24's own hard-won lesson: the academy's
// settler was driven by hand in its tests for a whole round, every test stayed green whether or not
// the tick was wired, and «the ONE LINE that makes this feature reach a player had no guard anywhere
// in the repo». Do not replace that section with a direct call.
import { describe, it, expect } from 'vitest'

import { createWorld, hireMasseur, hirePsychologist, hireSparring, settleStaffLetters, tickWeek, type WorldState } from '../src/engine/world'
import { pruneEntryLetters, staffLetterId, staffLetters } from '../src/engine/offers'
import { chemistryReading } from '../src/engine/chemistry'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Offer, type StaffLetterTerms, type StaffSeat } from '../src/shared/protocol'

/** The played weeks of a season – the window the wrap-up folds and the settler measures against. */
const PLAYED = 49
/** A wrap week deep enough into a career that every seat can have a full year behind it. */
const WRAP = WEEKS_PER_YEAR * 4 + PLAYED
const SEASON = 4

/** A professional career – the one door all three support seats share (`activeLadderOf === 'wta'`,
 *  opened by her first counting W-series mark). `tests/wave5-psychologist-seat.test.ts`'s own `pro`
 *  helper, so the seats here are unlocked exactly the way the shipped gate unlocks them. */
function pro(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  return world
}

/** A world sitting ON the wrap week with a banked season row – the state the settler is called in.
 *  ⚠ The row is pushed in the shape `maybeFireSeasonWrapUp` banks, because reading that row rather
 *  than re-folding the season is the letter's whole contract with the Stats table. */
function atWrap(seed: string, row: Partial<{ wins: number; losses: number; bestFinish: number }> = {}): WorldState {
  const world = pro(seed)
  world.week = WRAP
  world.seasonHistory.push({
    seasonIndex: SEASON,
    // ⚠⚠ THIS NUMBER MUST DIFFER FROM `byTrack.wta.endRank` BELOW, AND THE FIRST DRAFT OF THIS
    // FIXTURE GOT IT WRONG. `SeasonHistoryEntry.endRank` is the ITF alias, always; the letter is
    // supposed to name the table she actually played. With both set to 120 the two readings were
    // the same number, so the mutant that reports the bare alias passed every assertion here – a
    // green arm measuring nothing. Caught by mutation M8, not by reading the test.
    endRank: 60,
    points: 400,
    wins: row.wins ?? 31,
    losses: row.losses ?? 14,
    fundsDeltaCents: 0,
    endFundsCents: 0,
    ...(row.bestFinish !== undefined ? { bestFinish: row.bestFinish } : {}),
    byTrack: {
      domestic: { points: 10, wins: 1, losses: 1, endRank: 40 },
      itf: { points: 90, wins: 10, losses: 5, endRank: 60 },
      wta: { points: 300, wins: 20, losses: 8, endRank: 120 },
    },
  })
  return world
}

/** Hire a seat AT a stated week, through the real command, so the kept, tagged `*-since-` row the
 *  settler reads is the one production writes. ⚠ Never a hand-poked flag: a world carrying
 *  `masseurHired: true` and no tagged row reads as ZERO weeks served by design, which is exactly the
 *  courtesy `masseurWeeksServedAt` documents – and a test that poked the flag would be measuring
 *  that courtesy instead of the feature. */
function hireAt(world: WorldState, seat: Exclude<StaffSeat, 'coach'>, week: number, hire = true): void {
  const was = world.week
  world.week = week
  if (seat === 'masseur') hireMasseur(world, hire)
  if (seat === 'psychologist') hirePsychologist(world, hire)
  if (seat === 'sparring') hireSparring(world, hire)
  world.week = was
}

const seatsOf = (world: WorldState): StaffSeat[] =>
  staffLetters(world.offers).map((o) => (o.terms as StaffLetterTerms).seat)
const termsFor = (world: WorldState, seat: StaffSeat): StaffLetterTerms | null => {
  const found = staffLetters(world.offers).find((o) => (o.terms as StaffLetterTerms).seat === seat)
  return found ? (found.terms as StaffLetterTerms) : null
}

// =================================================================================================
// A. THE POST ITSELF – one letter per hired seat, in the academy's shape
// =================================================================================================
describe('round 44 #7 A – the shape of the post', () => {
  it('⭐ every HIRED seat leaves exactly one letter, and an empty seat leaves none', () => {
    const world = atWrap('post-shape')
    hireAt(world, 'masseur', WRAP - 40)
    hireAt(world, 'psychologist', WRAP - 40)
    // the hitting partner is deliberately NOT hired
    settleStaffLetters(world)
    expect(seatsOf(world)).toEqual(['coach', 'masseur', 'psychologist'])
    expect(termsFor(world, 'sparring'), 'an empty seat does not write').toBeNull()
  })

  it('⭐ it is the academy`s shape exactly – info, unexpirable, keyed on seat and season', () => {
    const world = atWrap('post-donor')
    settleStaffLetters(world)
    const letter = world.offers.find((o) => o.kind === 'staff') as Offer
    expect(letter.state, 'a notice: nothing to sign, nothing to refuse, nothing for expireOffers').toBe('info')
    expect(letter.deadlineWeek, 'an informational letter has no window').toBe(letter.week)
    expect(letter.week).toBe(WRAP)
    expect(letter.id).toBe(staffLetterId('coach', SEASON))
  })

  it('⭐ IDEMPOTENT ON THE ID – a re-run week cannot double the post', () => {
    const world = atWrap('post-idem')
    hireAt(world, 'masseur', WRAP - 40)
    settleStaffLetters(world)
    const first = JSON.stringify(world.offers)
    settleStaffLetters(world)
    settleStaffLetters(world)
    expect(staffLetters(world.offers).length, 'two seats, three settles, two letters').toBe(2)
    expect(JSON.stringify(world.offers), 'and the second settle changed not one byte').toBe(first)
  })

  it('⭐ it speaks on the WRAP WEEK and on no other week of the year', () => {
    for (const offset of [0, 1, 25, 48, 50, 51]) {
      const world = atWrap(`post-week-${offset}`)
      world.week = WEEKS_PER_YEAR * SEASON + offset
      settleStaffLetters(world)
      expect(staffLetters(world.offers).length, `week ${offset} is not the wrap week`).toBe(0)
    }
    const wrap = atWrap('post-week-wrap')
    settleStaffLetters(wrap)
    expect(staffLetters(wrap.offers).length).toBe(1)
  })

  it('⭐ NEVER PRUNED – he went looking at the END of a career, which is the whole ask', () => {
    const world = atWrap('post-prune')
    settleStaffLetters(world)
    const kept = pruneEntryLetters(world.offers, WRAP + WEEKS_PER_YEAR * 6)
    expect(kept.filter((o) => o.kind === 'staff').length, 'six seasons later it is still in the inbox').toBe(1)
  })
})

// =================================================================================================
// B. THE COACH'S FIGURES – read off the banked row, never re-folded
// =================================================================================================
describe('round 44 #7 B – what the coach reports', () => {
  it('⭐ the record is the BANKED ROW`s, so the paper and the Stats table are one fact', () => {
    const world = atWrap('coach-row', { wins: 27, losses: 9, bestFinish: 1 })
    settleStaffLetters(world)
    const t = termsFor(world, 'coach')!
    expect(t.wins).toBe(27)
    expect(t.losses).toBe(9)
    expect(t.bestFinish).toBe(1)
  })

  it('⭐ the rank is named with the table carrying the most points – never the bare ITF alias', () => {
    const world = atWrap('coach-track')
    settleStaffLetters(world)
    const t = termsFor(world, 'coach')!
    // The fixture's `wta` row holds 300 of the 400 points, so that is her season's table. The row's
    // own `endRank` is the ITF alias and reads 60 – a DIFFERENT number on purpose, because naming
    // that one over a professional is the exact defect the wrap-up's own rank line had to fix, and
    // a fixture where the two agree cannot tell the two readings apart.
    expect(t.rankTrack).toBe('wta')
    expect(t.endRank, 'the table she played, not the junior alias beside it').toBe(120)
    expect(t.endRank, 'and demonstrably not the alias').not.toBe(world.seasonHistory[0].endRank)
  })

  it('⭐ a pre-v46 row has NO byTrack, and absent is «not recorded» rather than zero', () => {
    const world = atWrap('coach-old-row')
    delete world.seasonHistory[0].byTrack
    settleStaffLetters(world)
    const t = termsFor(world, 'coach')!
    expect(t.endRank, 'no rank is invented for a season nobody split by table').toBeUndefined()
    expect(t.rankTrack).toBeUndefined()
    expect(t.wins, 'but the record it DOES hold is still reported').toBe(31)
  })

  it('⭐ `bestFinish` absent means «no finish that scored» and is not printed as a zero', () => {
    const world = atWrap('coach-no-finish')
    settleStaffLetters(world)
    expect(termsFor(world, 'coach')!.bestFinish).toBeUndefined()
  })

  it('⭐ titles are counted off `trophiesByTier`, which stores WEEKS and is never pruned', () => {
    const world = atWrap('coach-titles')
    const yearStart = WRAP - PLAYED
    world.trophiesByTier.w15 = { titles: [yearStart + 3, yearStart + 30, yearStart - 5], finals: [yearStart + 9] }
    settleStaffLetters(world)
    // Two inside the window; the third is last season's and the lost final is not a title.
    expect(termsFor(world, 'coach')!.titles).toBe(2)
  })

  it('⭐ a SELF-COACHED career gets no coach letter – a parent does not write the family a letter', () => {
    const world = pro('coach-self')
    world.week = WRAP
    world.coachId = null
    settleStaffLetters(world)
    expect(termsFor(world, 'coach')).toBeNull()
  })
})

// =================================================================================================
// C. ⚠⚠ THE CHEMISTRY GATE – the one field that could leak a reading the ring is hiding
// =================================================================================================
describe('round 44 #7 C – the coach may not say what the gauge is still hiding', () => {
  /** A pair whose level sits BELOW this pair's own drawn bar. The bar is a uniform in
   *  [readableFloor, readableCeiling] off `seed:chemistry:readable:<coachId>`, so the only honest way
   *  to build this arm is to ask the shipped function where the bar is and step under it. */
  function pairUnderItsOwnBar(world: WorldState): number {
    const id = world.coachId!
    // Walk up from the floor until the shipped reader admits a value; the last refusal is under the bar.
    let level = ECONOMY.chemistry.readableFloor
    while (level < ECONOMY.chemistry.readableCeiling + 1) {
      world.coachPairs[id] = { chem: level, phase: 0, standing: 0 }
      if (chemistryReading(world.coachPairs[id], world.seed, id) !== null) return level - 0.01
      level += 0.01
    }
    throw new Error('the bar is outside its own corridor')
  }

  it('⭐⭐ a pair UNDER its own drawn bar puts no chemistry on the paper', () => {
    const world = atWrap('chem-hidden')
    const under = pairUnderItsOwnBar(world)
    world.coachPairs[world.coachId!] = { chem: under, phase: 0, standing: 0 }
    expect(chemistryReading(world.coachPairs[world.coachId!], world.seed, world.coachId!), 'the ring is hiding it')
      .toBeNull()
    settleStaffLetters(world)
    expect(termsFor(world, 'coach')!.chem, 'and so is the letter').toBeUndefined()
  })

  it('⭐⭐ THE MUTATION ARM – gating on the FLOOR instead of the drawn bar leaks a hidden pair', () => {
    // The defect this test exists to catch, expressed as the wrong predicate: `|chem| >= floor`.
    // On a seed whose drawn bar sits above the floor there is a band of levels the floor admits and
    // the real gate refuses, and every one of them is a reading the gauge is not showing.
    let leaked = 0
    let checked = 0
    for (let i = 0; i < 60; i++) {
      const world = atWrap(`chem-mutate-${i}`)
      const id = world.coachId!
      const under = pairUnderItsOwnBar(world)
      if (Math.abs(under) < ECONOMY.chemistry.readableFloor) continue
      checked += 1
      world.coachPairs[id] = { chem: under, phase: 0, standing: 0 }
      // the SHIPPED gate refuses it...
      expect(chemistryReading(world.coachPairs[id], world.seed, id)).toBeNull()
      // ...and the mutant (floor-gated) would have printed it.
      if (Math.abs(under) >= ECONOMY.chemistry.readableFloor) leaked += 1
    }
    expect(checked, 'the corridus is wide enough that this arm is not vacuous').toBeGreaterThan(0)
    expect(leaked, 'every one of these is a pair the floor-gated mutant would have put on paper')
      .toBe(checked)
  })

  it('⭐ a pair OVER its own bar is carried, with its sign, and the phase is never carried at all', () => {
    const world = atWrap('chem-shown')
    const id = world.coachId!
    world.coachPairs[id] = { chem: -62, phase: 0.8, standing: 3 }
    settleStaffLetters(world)
    const t = termsFor(world, 'coach')!
    expect(t.chem, 'the level, with its own minus – the sign is the whole content').toBe(-62)
    expect(JSON.stringify(t), 'the weather may not be shown: printing a draw makes it a forecast')
      .not.toContain('phase')
  })

  it('⭐ a coach she has never trained with has no row, and an absent row says nothing', () => {
    const world = atWrap('chem-no-row')
    delete world.coachPairs[world.coachId!]
    settleStaffLetters(world)
    expect(termsFor(world, 'coach')!.chem).toBeUndefined()
  })
})

// =================================================================================================
// D. ⚠⚠ THE EMPLOYMENT GATE – «on the payroll today» is not «worked this season»
// =================================================================================================
describe('round 44 #7 D – a seat may only write about a season it actually worked', () => {
  it('⭐⭐ HIRED IN THE LAST WEEK, THE OWNER`S OWN EDGE: nothing to report, so nothing is written', () => {
    const world = atWrap('gate-last-week')
    hireAt(world, 'masseur', WRAP - 1)
    settleStaffLetters(world)
    expect(world.masseurHired, 'he IS on the payroll...').toBe(true)
    expect(termsFor(world, 'masseur'), '...and still has no year to write about').toBeNull()
  })

  it('⭐ the bar is HALF the season – the coach`s plaque rule (`coachRevealWeek`) read as a gate', () => {
    // 49 played weeks, so the bar sits at 24.5 and the two arms are whole weeks either side of it.
    const early = atWrap('gate-early')
    hireAt(early, 'masseur', WRAP - 25) // 25 weeks served – over
    settleStaffLetters(early)
    expect(termsFor(early, 'masseur')!.weeksServed).toBe(25)
    expect(termsFor(early, 'masseur'), 'over the bar – he writes').not.toBeNull()

    const late = atWrap('gate-late')
    hireAt(late, 'masseur', WRAP - 24) // 24 weeks served – under
    settleStaffLetters(late)
    expect(termsFor(late, 'masseur'), 'under the bar – he does not').toBeNull()
  })

  it('⭐⭐ weeks served are the SUM OF THE HIRED SPANS, so a mid-year firing is not free', () => {
    // Hired all year on paper, but stood down for the middle 30 weeks of it. A clock that measured
    // «since the first hire» would read a full season; the span sum reads what was actually worked.
    const world = atWrap('gate-spans')
    hireAt(world, 'masseur', WRAP - PLAYED)
    hireAt(world, 'masseur', WRAP - PLAYED + 8, false)
    hireAt(world, 'masseur', WRAP - 4)
    settleStaffLetters(world)
    expect(world.masseurHired, 'he is on the payroll at the wrap').toBe(true)
    expect(termsFor(world, 'masseur'), '8 weeks + 4 weeks is not half a year').toBeNull()
  })

  it('⭐ `weeksServed` is the season`s own weeks and never the career`s', () => {
    const world = atWrap('gate-weeks')
    hireAt(world, 'masseur', WRAP - PLAYED * 3) // three seasons on the payroll
    settleStaffLetters(world)
    expect(termsFor(world, 'masseur')!.weeksServed, 'this season holds 49 of them and no more').toBe(PLAYED)
  })

  it('⭐ a founding COACH has no tagged row and is not silenced by that', () => {
    // `profile.coachTier` is chosen in the prologue and writes no `coach-since-` row, so the span
    // walk would read a founding coach as zero weeks served. `coachSinceWeek`'s week-0 fallback is
    // what stops the commonest career in the game losing its coach's letter for ever.
    const world = atWrap('gate-founding-coach')
    expect(world.events.some((e) => e.milestoneKey?.startsWith('coach-since-')), 'no row exists').toBe(false)
    settleStaffLetters(world)
    expect(termsFor(world, 'coach')!.weeksServed).toBe(PLAYED)
  })
})

// =================================================================================================
// E. THE POORER SEATS – what they may say, and what they must not
// =================================================================================================
describe('round 44 #7 E – the masseur, the psychologist and the hitting partner', () => {
  it('⭐⭐ the masseur counts only the layoffs he DEMONSTRABLY worked', () => {
    const world = atWrap('masseur-layoffs')
    hireAt(world, 'masseur', WRAP - PLAYED)
    const yearStart = WRAP - PLAYED
    world.injuryHistory = [
      { kind: 'wrist', severity: 'minor', week: yearStart + 10, weeksOut: 3, weeksSaved: 2 },
      // no `weeksSaved` – he shortened nothing here, so it is not a layoff he worked
      { kind: 'ankle', severity: 'minor', week: yearStart + 20, weeksOut: 4 },
      { kind: 'back', severity: 'moderate', week: yearStart + 30, weeksOut: 6, weeksSaved: 3 },
      // last season's, and outside the window
      { kind: 'knee', severity: 'major', week: yearStart - 6, weeksOut: 9, weeksSaved: 4 },
    ]
    settleStaffLetters(world)
    const t = termsFor(world, 'masseur')!
    expect(t.layoffs, 'two in the window carry his mark').toBe(2)
    expect(t.weeksSaved, 'and 2 + 3 of them are his').toBe(5)
  })

  it('⭐⭐ THE MUTATION ARM – counting every layoff in the window claims work he did not do', () => {
    const world = atWrap('masseur-mutate')
    hireAt(world, 'masseur', WRAP - PLAYED)
    const yearStart = WRAP - PLAYED
    world.injuryHistory = [
      { kind: 'ankle', severity: 'minor', week: yearStart + 20, weeksOut: 4 },
      { kind: 'hip', severity: 'minor', week: yearStart + 26, weeksOut: 2 },
    ]
    settleStaffLetters(world)
    const t = termsFor(world, 'masseur')!
    // The mutant – `if (h.week < yearStart || h.week >= wrapWeek) continue` alone, without the
    // `weeksSaved` test – would report TWO layoffs and ZERO weeks saved: a letter saying «she came
    // to me twice» about two layoffs his hands never shortened.
    expect(t.layoffs, 'he shortened neither, so he worked neither').toBe(0)
    expect(t.weeksSaved).toBe(0)
  })

  it('⭐ the masseur says NOTHING about knocks – there is no link in the world to say it through', () => {
    const world = atWrap('masseur-knocks')
    hireAt(world, 'masseur', WRAP - PLAYED)
    world.knockHistory = [
      { part: 'shoulder', sinceWeek: WRAP - 30, untilWeek: WRAP - 28, choice: 'rest' },
      { part: 'wrist', sinceWeek: WRAP - 20, untilWeek: WRAP - 18, choice: 'push' },
    ]
    settleStaffLetters(world)
    const t = termsFor(world, 'masseur')!
    expect(t.layoffs, 'two knocks in the year move nothing on his paper').toBe(0)
    expect(JSON.stringify(t)).not.toContain('knock')
  })

  it('⭐⭐ the psychologist names the year`s focus ONLY while the stamp still points at that season', () => {
    const world = atWrap('psy-focus')
    hireAt(world, 'psychologist', WRAP - PLAYED)
    world.psychologistFocus = 'coolhead'
    world.psychologistFocusSeason = SEASON
    world.composureBonus = 2.5
    settleStaffLetters(world)
    const t = termsFor(world, 'psychologist')!
    expect(t.focus).toBe('coolhead')
    expect(t.composureBonus, '`coolhead` is the one focus with a counter').toBe(2.5)
  })

  it('⭐⭐ THE MUTATION ARM – an unguarded read prints NEXT year`s focus over LAST year`s season', () => {
    const world = atWrap('psy-repicked')
    hireAt(world, 'psychologist', WRAP - PLAYED)
    // The parent has already re-picked for the season ahead. `psychologistFocus` is ONE slot, so the
    // old year's subject is simply gone – and a letter reading the field unguarded would name the
    // new one as though it were the year just finished.
    world.psychologistFocus = 'publicLife'
    world.psychologistFocusSeason = SEASON + 1
    settleStaffLetters(world)
    const t = termsFor(world, 'psychologist')!
    expect(t.focus, 'the season it was bought for is not this letter`s season').toBeUndefined()
    expect(t, 'and the seat still writes – it simply reports no subject').not.toBeNull()
  })

  it('⭐ `composureBonus` rides with `coolhead` alone – the other four focuses have no counter', () => {
    for (const focus of ['recovery', 'listen', 'herself', 'publicLife'] as const) {
      const world = atWrap(`psy-${focus}`)
      hireAt(world, 'psychologist', WRAP - PLAYED)
      world.psychologistFocus = focus
      world.psychologistFocusSeason = SEASON
      world.composureBonus = 3
      settleStaffLetters(world)
      const t = termsFor(world, 'psychologist')!
      expect(t.focus).toBe(focus)
      expect(t.composureBonus, `${focus} retains nothing, so it claims nothing`).toBeUndefined()
    }
  })

  it('⭐⭐ the hitting partner`s letter carries his WEEKS and not one other field', () => {
    const world = atWrap('sparring-thin')
    hireAt(world, 'sparring', WRAP - PLAYED)
    world.form = 7
    world.sparringRung = 2
    settleStaffLetters(world)
    const t = termsFor(world, 'sparring')!
    expect(Object.keys(t).sort(), 'the honest shape of a seat that retains nothing else')
      .toEqual(['seasonIndex', 'seat', 'weeksServed'])
    expect(t.weeksServed).toBe(PLAYED)
  })

  it('⭐⭐ NO SEAT REPORTS FORM – the owner`s ruling O2, and a letter is a surface like any other', () => {
    const world = atWrap('no-form')
    hireAt(world, 'masseur', WRAP - PLAYED)
    hireAt(world, 'psychologist', WRAP - PLAYED)
    hireAt(world, 'sparring', WRAP - PLAYED)
    world.form = -9.5
    settleStaffLetters(world)
    const paper = JSON.stringify(staffLetters(world.offers))
    expect(paper, 'no form field').not.toContain('"form"')
    expect(paper, 'and not the number behind it either').not.toContain('-9.5')
  })
})

// =================================================================================================
// F. DETERMINISM – a report does not roll dice
// =================================================================================================
describe('round 44 #7 F – the post is a read, not a draw', () => {
  it('⭐⭐ THE MAIN STREAM DOES NOT MOVE – not by one draw, on any arm', () => {
    const world = atWrap('rng-main')
    hireAt(world, 'masseur', WRAP - PLAYED)
    hireAt(world, 'psychologist', WRAP - PLAYED)
    hireAt(world, 'sparring', WRAP - PLAYED)
    world.coachPairs[world.coachId!] = { chem: 55, phase: 0.4, standing: 1 }
    world.psychologistFocus = 'coolhead'
    world.psychologistFocusSeason = SEASON
    const before = { ...world.rngMain }
    settleStaffLetters(world)
    expect(staffLetters(world.offers).length, 'four letters were written...').toBe(4)
    expect(world.rngMain.n, '...and the MAIN counter did not move').toBe(before.n)
    expect(world.rngMain.s, 'nor its register').toBe(before.s)
  })

  it('⭐⭐ THE SAME WORLD WRITES THE SAME PAPER, to the byte, however many times it is asked', () => {
    const build = () => {
      const w = atWrap('rng-stable')
      hireAt(w, 'masseur', WRAP - PLAYED)
      w.coachPairs[w.coachId!] = { chem: 44, phase: -0.3, standing: 0 }
      return w
    }
    const a = build()
    const b = build()
    settleStaffLetters(a)
    settleStaffLetters(b)
    expect(JSON.stringify(staffLetters(a.offers))).toBe(JSON.stringify(staffLetters(b.offers)))
  })

  it('⭐ the settler never writes money, an event or a milestone – it only posts paper', () => {
    const world = atWrap('rng-no-side-effects')
    hireAt(world, 'masseur', WRAP - PLAYED)
    const funds = world.fundsCents
    const events = world.events.length
    const milestones = world.milestones.length
    settleStaffLetters(world)
    expect(world.fundsCents, 'nobody is paid for writing a letter').toBe(funds)
    expect(world.events.length, 'the inbox is the surface, not the feed').toBe(events)
    expect(world.milestones.length).toBe(milestones)
  })
})

// =================================================================================================
// G. ⚠⚠ THE WALK – the one line that makes this reach a player
// =================================================================================================
describe('round 44 #7 G – a walked career finds the post in its inbox', () => {
  it('⭐⭐⭐ `tickWeek` ITSELF raises the coach`s letter on the wrap week – not this test`s own call', () => {
    // Round 24's lesson, paid for once already: the academy's settler was driven by hand in its own
    // tests and every one of them stayed green whether or not the tick was wired. Nothing in this
    // test calls `settleStaffLetters`.
    const world = createWorld('walk-to-the-wrap', DEFAULT_PROFILE)
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < PLAYED; w++) tickWeek(world, rng)
    expect(world.week, 'sitting on the wrap week').toBe(PLAYED)
    const letters = staffLetters(world.offers)
    expect(letters.length, 'the default career is coached, so exactly one seat writes').toBe(1)
    const t = letters[0].terms as StaffLetterTerms
    expect(t.seat).toBe('coach')
    expect(t.seasonIndex, 'about the season that has just finished').toBe(0)
    expect(t.weeksServed).toBe(PLAYED)
    // And the figures are the row the wrap-up banked moments earlier, not a second fold.
    const row = world.seasonHistory.find((h) => h.seasonIndex === 0)!
    expect(t.wins).toBe(row.wins)
    expect(t.losses).toBe(row.losses)
  })

  it('⭐⭐ ...and a second year adds a second letter rather than rewriting the first', () => {
    const world = createWorld('walk-two-years', DEFAULT_PROFILE)
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < WEEKS_PER_YEAR + PLAYED; w++) tickWeek(world, rng)
    const letters = staffLetters(world.offers)
    expect(letters.map((o) => (o.terms as StaffLetterTerms).seasonIndex), 'oldest season first').toEqual([0, 1])
    expect(new Set(letters.map((o) => o.id)).size, 'two distinct ids').toBe(2)
  })
})
