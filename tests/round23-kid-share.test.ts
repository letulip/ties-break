// ⭐⭐ ROUND-23 #18 – HER SHARE OF THE PRIZE MONEY, AND IT REALLY LEAVES THE FAMILY WALLET.
//
// THE OWNER, 19.08:
//   «О! А ещё можно сделать после появления её счета в банке в 18 начать ей призовые переводить
//    какие-то суммы, например начать с 10-20% и может быть наращивать год к году»
//   ...and on the ceiling he was offered: «да, давай, но может не до 30, а до 40 или 50 вообще, это
//   всё-таки ее карьера?»
//
// SO THE SHIPPED LADDER IS 10% AT 18, +5 EVERY BIRTHDAY, 50% FROM 26 – and the table below is
// written out as LITERALS rather than by calling the function under test, because a ramp checked
// against its own implementation is a tautology with a describe block round it.
//
// ⭐⭐⭐ ROUND 41 #27 (12.09) OVERTURNED CLAIM 1, AND IT IS THE OWNER WHO OVERTURNED IT.
//
// HIS QUESTION: «может быть начать отчисления не в 18, а в 16 лет уже или вообще с момента, когда
// она в первый раз на w серию приходит? это же всё таки ее призовые» – and his ruling, option A1,
// the same day: «призовые падают на её счёт с первого старта W-серии независимо от возраста –
// согласен». So the ramp answers 10% at EVERY age below eighteen, and climbs from eighteen exactly
// as it always did. Claim 1 is re-aimed rather than deleted, because the property it was protecting
// is still real and is now a sharper one: her account fills from her FIRST W-SERIES CHEQUE and from
// nothing else.
//
// ⚠⚠ AND THERE IS NO «HAS SHE STARTED A W-SERIES» GATE ANYWHERE, WHICH IS A FACT ABOUT THE
// CATALOGUE RATHER THAN AN OMISSION – §1's new arm is what proves it rather than this comment.
// Prize money exists on the professional track ONLY (every `wta` tier carries a `prize` array; no
// domestic or ITF-junior rung does), and `finalizeTournament` splits inside `if (prize > 0)`. So
// «every prize cheque, at any age» and «from her first W-series start» are the same set of cheques,
// and a second predicate on top could only ever answer true where it was asked.
//
// THE THREE CLAIMS, and the second is the one the design decision turns on:
//
//   1. EVERY CENT IN HER ACCOUNT CAME OFF A W-SERIES CHEQUE, at whatever age it was written – and
//      before round 41 #27 this line read «NOTHING BEFORE HER EIGHTEENTH. Not a cent, on any week
//      of the junior story.»
//   2. THE MONEY LEAVES. Measured as an A/B on ONE seed: the family's booked prize income falls by
//      exactly her balance. This is the claim that separates a mechanic from a counter, and it is
//      the reason the split happens at the moment the cheque is written rather than in a report.
//   3. IT PERSISTS. `kidFundsCents` is a save field (v54), so a career loaded at twenty-six still
//      has the eight years of transfers behind it – and a save written before v54 arrives at ZERO
//      rather than at an invented back-fill.
//
// ⚠ MUTATION-VERIFIED (each applied alone, then reverted):
//   * `capBps: 3000` (the number he rejected)          -> the ramp table and the copy arm go red.
//   * `fromAgeYears: 17`                               -> the ramp table goes red (it moved every
//                                                         rung above it by a year).
//   ⭐ ROUND 41 #27 re-verified, each applied alone and read off the run:
//   * `kidPrizeShareBps` returning 0 below `fromAgeYears` again (the shipped rule)
//                                                      -> 5 red HERE (the ramp table, the
//                                                         cheque-splits sweep, the junior-cheque
//                                                         walk, the A/B, the realised ladder) and
//                                                         7 more in round41-kid-share-first-w.
//   * `kidPrizeShareBps` returning `capBps` below it (an absurd junior share)
//                                                      -> 4 red here, 5 there.
//   * `ownAccountNote`'s new balance clause deleted    -> 1 red here – the «silent before eighteen»
//                                                         arm, which is the arm that was already
//                                                         guarding it – and 2 there.
//   * credit `world.fundsCents += prize` (the whole cheque) and keep her credit
//                                                      -> the A/B arm goes red, and nothing else.
//   * migration back-fills `careerTotals.prizeCents / 2`  -> the v53 arm goes red.
import { describe, it, expect } from 'vitest'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from '../tools/econ-bench'
import {
  answerFork,
  answerRetirement,
  birthdayOffer,
  chooseGift,
  decideKnock,
  kidAgeYears,
  pendingBirthday,
  pendingKnock,
  SAVE_SCHEMA_VERSION,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY, kidPrizeShareBps, kidPrizeShareCents, managerCommissionBps } from '../src/engine/economy'
import { ownAccountNote, type KidLifeWorldView } from '../src/engine/kidLife'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
// ⭐ v74 T6 – ONE DRAIN FOR EVERY BEAT KIND. `answerLifeBeat(world, 'listen')` was a complete
// answer while `'fork-opinion'` was the only kind; wave 3's `'met'` beat does not offer that id and
// can be raised any week from her sixteenth on, so every hand-written call site threw. See
// `drainLifeBeats`.
import { drainLifeBeats } from './helpers/career'

/** His ladder, spelled out. NOT read from `ECONOMY.kidShare`, so a retune has to come here and be
 *  looked at rather than sliding through green.
 *
 *  ⚠⚠ THE FIRST FIVE ROWS WERE ZEROS UNTIL ROUND 41 #27 AND THE OWNER MOVED THEM HIMSELF: «призовые
 *  падают на её счёт с первого старта W-серии независимо от возраста – согласен». They are TENS now,
 *  and the ladder from eighteen is untouched to the point – the curve is continuous across her
 *  eighteenth birthday, which is what makes this a new floor rather than a new ramp.
 *
 *  ⚠ A THIRTEEN-YEAR-OLD CANNOT COLLECT ONE, AND THE TABLE STILL SAYS TEN. That is not a
 *  contradiction: this function answers «what share of a prize cheque is hers», and a thirteen-
 *  year-old's answer is hypothetical because junior tennis pays no prize money at all. §1's
 *  W-series arm is where that becomes a claim about a career rather than about a function. */
const HIS_RAMP: Record<number, number> = {
  13: 10,
  14: 10,
  15: 10,
  16: 10,
  17: 10,
  18: 10,
  19: 15,
  20: 20,
  21: 25,
  22: 30,
  23: 35,
  24: 40,
  25: 45,
  26: 50,
  27: 50,
  33: 50,
}

function answerAll(world: WorldState): void {
  if (pendingKnock(world)) decideKnock(world, 'rest')
  const age = pendingBirthday(world)
  if (age !== null) chooseGift(world, birthdayOffer(world.seed, age).options[0].id)
  // ⭐ v73: she speaks at the fork and the engine will not answer it until she has been heard.
  // `'listen'` is the harness's answer for the same reason `answerFork`'s no-tier default is the
  // cheapest place: a caller that never asked the player must not put a number on the scale.
  drainLifeBeats(world)
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
}

const ageOf = (w: WorldState): number => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)

/** The wealthy·elite arm reaches the paying rungs earliest, which is what makes a short horizon
 *  enough to see real cheques on both sides of her eighteenth. */
function walk(seedIndex: number, weeks: number, shareOff = false): WorldState {
  const savedStart = ECONOMY.kidShare.startBps
  const savedCap = ECONOMY.kidShare.capBps
  // The house idiom for a bench arm: ONE object patched in place and restored in a `finally`
  // (tools/school-bench.ts `withScenario`). `ECONOMY` is `as const`, so this is also the only way in.
  if (shareOff) Object.assign(ECONOMY.kidShare, { startBps: 0, capBps: 0 })
  try {
    const { world, rng } = openCareer(PRESETS[8], seedIndex, POLICIES[1])
    while (world.week < weeks && !world.ending) {
      answerAll(world)
      if (world.ending) break
      stepCareerWeek(world, rng, POLICIES[1])
    }
    return world
  } finally {
    Object.assign(ECONOMY.kidShare, { startBps: savedStart, capBps: savedCap })
  }
}

// =================================================================================================
// 1 – THE RAMP ITSELF
// =================================================================================================
describe('#18 – the ramp, against the numbers he actually asked for', () => {
  it('⭐⭐ 10% at 18, five points a birthday, and it stops at half', () => {
    for (const [age, pct] of Object.entries(HIS_RAMP)) {
      expect(kidPrizeShareBps(Number(age)), `age ${age}`).toBe(pct * 100)
    }
    // The cap is REACHED, and it is reached at 26 – «это всё-таки её карьера», in her best years.
    expect(kidPrizeShareBps(26)).toBe(ECONOMY.kidShare.capBps)
    expect(kidPrizeShareBps(25)).toBeLessThan(ECONOMY.kidShare.capBps)
    // ...and it is monotone and bounded for every age the game can reach.
    let last = -1
    for (let age = 10; age <= 45; age++) {
      const bps = kidPrizeShareBps(age)
      expect(bps).toBeGreaterThanOrEqual(last)
      expect(bps).toBeLessThanOrEqual(ECONOMY.kidShare.capBps)
      last = bps
    }
  })

  it('a cheque splits to the cent – the two balances always add up to what the tournament paid', () => {
    for (const prize of [130_00, 2_200_00, 55_555_55, 3_000_000_00, 1, 7]) {
      // ⚠ THE SWEEP STARTS AT FOURTEEN SINCE ROUND 41 #27 AND USED TO START AT SEVENTEEN – the
      // junior years are a real rate now, so the rounding claim has to cover them. ⭐ And $130 is
      // deliberately the first prize in the list: it is a W15 first-round exit, the smallest cheque
      // the game can write and the one a junior is likeliest to be handed.
      for (let age = 14; age <= 27; age++) {
        const hers = kidPrizeShareCents(prize, age)
        expect(hers, `age ${age} of ${prize}`).toBeGreaterThanOrEqual(0)
        expect(hers).toBeLessThanOrEqual(prize)
        // The family's part is the REMAINDER, never a second rounding – so no cent is lost or made.
        expect(hers + (prize - hers)).toBe(prize)
        expect(Math.abs(hers / prize - HIS_RAMP[age] / 100), `age ${age}`).toBeLessThanOrEqual(0.5 / prize + 1e-9)
      }
    }
  })

  it('a ramp read off ECONOMY, not off a literal in a formula', () => {
    const saved = ECONOMY.kidShare.capBps
    Object.assign(ECONOMY.kidShare, { capBps: 2000 })
    try {
      expect(kidPrizeShareBps(30), 'the cap is the object, not the code').toBe(2000)
    } finally {
      Object.assign(ECONOMY.kidShare, { capBps: saved })
    }
  })
})

// =================================================================================================
// 2 – ON A REAL CAREER: nothing before eighteen, and the family feels it after
// =================================================================================================
describe('#18 – the transfer, on a career that is really played', () => {
  it('⭐⭐⭐ EVERY CENT SHE IS PAID BEFORE EIGHTEEN CAME OFF A W-SERIES CHEQUE – #27, re-aimed', () => {
    // ⚠⚠ THIS ARM READ «NOT ONE CENT BEFORE HER EIGHTEENTH, on every week of the junior story» AND
    // IT WAS INVERTED BY THE OWNER, NOT BY AN AGENT. «призовые падают на её счёт с первого старта
    // W-серии независимо от возраста – согласен» (12.09, option A1). What it asserts now is the
    // property that REPLACED the silence, and it is a stronger claim than the old one: her account
    // fills, and every cent of it is professional prize money.
    //
    // ⚠ THE W-SERIES HALF IS MEASURED THROUGH THE LEDGER RATHER THAN THROUGH A PREDICATE, which is
    // what makes it a claim about the career instead of a restatement of the code: the week her
    // balance moves is compared against the week a `prize` row was booked, and a prize row can only
    // be written by `finalizeTournament`'s `if (prize > 0)` – reachable on `wta`-track tiers alone,
    // because no domestic or ITF-junior rung carries a prize table at all.
    const { world, rng } = openCareer(PRESETS[8], 1, POLICIES[1])
    let hers = 0
    let paidWeeks = 0
    let firstPaidAge = -1
    while (ageOf(world) < ECONOMY.kidShare.fromAgeYears && !world.ending) {
      answerAll(world)
      if (world.ending) break
      const before = world.kidFundsCents ?? 0
      stepCareerWeek(world, rng, POLICIES[1])
      const moved = (world.kidFundsCents ?? 0) - before
      if (moved > 0) {
        paidWeeks++
        if (firstPaidAge < 0) firstPaidAge = ageOf(world)
        // The week her account moved is a week a W-series cheque was written, and the `prize` row
        // the till booked for the family that same week is the other half of it.
        const prizeRow = world.events.find((e) => e.week === world.week && e.category === 'prize')
        expect(prizeRow, `w${world.week}: her account moved on a week with no prize cheque`).toBeDefined()
        expect(moved, `w${world.week}: her cut is the ramp's own share of the gross`).toBe(
          Math.round(((prizeRow!.amountCents! + moved) * kidPrizeShareBps(ageOf(world))) / 10_000),
        )
        hers += moved
      }
    }
    // ⚠ THE ARM HAS TO CONTAIN THE THING IT IS PROVING. A career that never won a cheque before
    // eighteen would pass every line above with the mechanic deleted.
    expect(paidWeeks, 'she really was paid in the junior years').toBeGreaterThan(0)
    expect(hers, '...and it reached her account').toBeGreaterThan(0)
    expect(hers).toBe(world.kidFundsCents)
    expect(firstPaidAge, 'and the first cheque came years before her eighteenth')
      .toBeLessThan(ECONOMY.kidShare.fromAgeYears)
    expect(ageOf(world)).toBe(ECONOMY.kidShare.fromAgeYears)
  })

  it('⭐⭐⭐ THE MONEY LEAVES THE FAMILY WALLET – A/B on one seed, one arm with the ramp at zero', () => {
    // Two arms of the SAME seed, differing only in `ECONOMY.kidShare`. The horizon has to be short
    // enough that the two careers are still the same career: the split moves money, and money moves
    // entry decisions, so a long horizon compares two different lives.
    //
    // ⚠⚠ RE-AIMED BY ROUND 41 #27 (12.09), AND THE OLD HORIZON BECAME A DIFFERENT CAREER RATHER
    // THAN A WRONG NUMBER. It was `WEEKS_PER_YEAR * 5 + 26` – her eighteenth plus a season – chosen
    // when the FIRST transfer happened on her eighteenth birthday, so the arms were identical for
    // five of those six years. His ruling starts the transfers at her first W-series cheque, which
    // this career collects at fourteen, so the wallets now diverge from week ~55 and by five years
    // the two arms have played different tournaments (measured: gross $247,800 against $654,850).
    // ⚠ THE FIX IS THE HORIZON AND NOT THE ASSERTION – the comparability guard below is UNCHANGED
    // and still refuses to read a difference between two different lives.
    //
    // ⚠⚠ AND RE-AIMED AGAIN THE SAME DAY, BY THE ELITE SHELF (round 41, the owner's «единая
    // элит-полка вверх - верно»), FOR THE SAME REASON AND BY THE SAME REMEDY. `PRESETS[8]` is the
    // wealthy family with the ELITE coach, so a 25% rise in that rung's price is 25% more off the
    // wallet both arms spend from – and at two years the guard did exactly its job: **2,179 results
    // against 2,180**, one entry decision falling differently on the tighter side. That is the guard
    // WORKING rather than a defect in it, and the rule the block above sets is the rule followed.
    //
    // ⭐ THE NEW HORIZON IS MEASURED RATHER THAN GUESSED, and it is set INSIDE the green run instead
    // of at its edge. Scanned on the shipped constant, both arms walked at every step:
    //   104 -> 2,179 / 2,180  ✗ (the only divergent point in the scan)
    //   100 · 96 · 92 · 88 · 84 · 80 · 78 · 76 · 72 · 68 · 64 · 60 -> identical, every one
    // 78 – a year and a half, and the file's own `+ 26` idiom – sits in the middle of that run
    // rather than four weeks from a known break, which is what stops the next balance change
    // re-breaking this test for a third time. It costs no coverage: she is still paid real cheques
    // on it ($2,158 of her own money against $6,021 at two years), which is all the claim needs.
    const HORIZON = WEEKS_PER_YEAR + 26
    const on = walk(1, HORIZON)
    const off = walk(1, HORIZON, true)

    // ⚠ PROVE THE ARMS ARE COMPARABLE BEFORE READING THE DIFFERENCE (CLAUDE.md's own A/B rule).
    expect(on.week, 'both arms walked the same number of weeks').toBe(off.week)
    expect(on.results.length, 'and played the same tournaments').toBe(off.results.length)
    expect(off.kidFundsCents, 'the control transfers nothing, by construction').toBe(0)

    const grossOn = on.careerTotals.prizeCents + on.kidFundsCents
    expect(on.kidFundsCents, 'she has really been paid something').toBeGreaterThan(0)
    expect(grossOn, 'the cheques are the same cheques in both arms').toBe(off.careerTotals.prizeCents)
    // THE CLAIM: the family's prize income is lighter by exactly what she was given. Not "tallied
    // beside", not "reported" – the wallet is smaller.
    expect(off.careerTotals.prizeCents - on.careerTotals.prizeCents).toBe(on.kidFundsCents)
    expect(on.fundsCents, 'and so is the balance the parent spends from').toBeLessThan(off.fundsCents)
  })

  it('the realised share matches the ladder, year by year, on the cheques she actually won', () => {
    const { world, rng } = openCareer(PRESETS[8], 1, POLICIES[1])
    let age = ageOf(world)
    let hersAtBirthday = 0
    let familyAtBirthday = 0
    const realised: { age: number; pct: number }[] = []
    while (world.week < WEEKS_PER_YEAR * 14 && !world.ending) {
      answerAll(world)
      if (world.ending) break
      stepCareerWeek(world, rng, POLICIES[1])
      const now = ageOf(world)
      if (now !== age) {
        const hers = world.kidFundsCents - hersAtBirthday
        const family = world.careerTotals.prizeCents - familyAtBirthday
        if (hers + family > 100_00) realised.push({ age, pct: (100 * hers) / (hers + family) })
        hersAtBirthday = world.kidFundsCents
        familyAtBirthday = world.careerTotals.prizeCents
        age = now
      }
    }
    // ⚠ ROUND 41 #27 – THE WALK COVERS MORE RUNGS NOW, because the junior years pay too. The bound
    // is left at eight rather than raised: what it guards is «the walk really covered the ramp», and
    // a career that ended early should fail on the ramp's own rungs rather than on the new floor.
    expect(realised.length, 'the walk really covered the ramp').toBeGreaterThanOrEqual(8)
    for (const r of realised) {
      // The only slack is the per-cheque rounding, and it is WIDEST IN THE THINNEST YEAR – which is
      // why the bound is a quarter of a point and not a tenth.
      //
      // ⚠ RE-AIMED 0.1 -> 0.25 BY ROUND 38 C4 (07.09, docs/specs/one-closed-form-2026-09.md). The
      // MECHANISM did not move: `kidShare` still splits every cheque at the ramp's rate and the split
      // is still exact to the cent. What moved is WHICH CHEQUES SHE WON – C4 put composure and
      // stamina into the closed form, so every AI-vs-AI result changed and this career's draws,
      // opponents and finishes changed with them. Measured on this exact walk after the change:
      //
      //     18  10.1444 vs 10      21  25.0308 vs 25      24  40 vs 40 exactly
      //     19  15      vs 15      22  30.0424 vs 30      25  45 vs 45 exactly
      //     20  20.0782 vs 20      23  35      vs 35      26  50 vs 50 exactly
      //
      // The deviation is entirely in the EARLY, THIN years and it is arithmetic: a cheque rounds to
      // the cent, so a year made of a few small cheques divides coarsely, and her eighteenth is the
      // first year she is paid anything at all. Five of the nine years are exact to the last cent.
      // The bound is 1.7x the worst reading, the same headroom `tests/rating.test.ts` keeps over its
      // own measured worst case.
      //
      // ⚠⚠ RE-AIMED 0.25 -> 1.1 BY ROUND 41 #27 (12.09), AND IT IS THE CAREER THAT MOVED, NOT THE
      // ARITHMETIC – the same shape as C4's re-aim above, one round later and for a nearer cause.
      // The split now starts at her first W-series cheque (age fourteen on this walk) instead of on
      // her eighteenth birthday, so the family's wallet is lighter from week ~55, the entry policy
      // spends it differently, and every draw, opponent and finish downstream of that is a different
      // career. Re-measured on the new walk:
      //
      //     14  10 exactly     18  10.6426 vs 10     22  30.0155 vs 30     26  50 exactly
      //     15  10 exactly     19  15 exactly        23  35 exactly
      //     16  10 exactly     20  20.0598 vs 20     24  40 exactly
      //     17  10 exactly     21  25.0291 vs 25     25  45 exactly
      //
      // ⚠ NINE OF THE THIRTEEN YEARS ARE NOW EXACT TO THE LAST CENT, including all four junior ones,
      // which is the sharper reading of the same fact: a rate applied to every cheque divides more
      // evenly than a rate that switches on mid-career. The one wide year is her eighteenth, and the
      // excess is the TEAM's cut rather than hers – `careerTotals.prizeCents` is what the family
      // BANKED, so a year carrying a title pays the coach and the masseur out of the same gross and
      // the denominator shrinks under her numerator. The bound is 1.7x the worst reading (0.6426),
      // exactly as it was before.
      expect(Math.abs(r.pct - HIS_RAMP[r.age]), `age ${r.age}: realised ${r.pct.toFixed(2)}%`).toBeLessThan(1.1)
    }
    // And she really is on the cap by 26, which is the whole of «до 40 или 50 вообще».
    expect(realised.some((r) => r.age >= 26 && r.pct > 49.9)).toBe(true)
  })
})

// =================================================================================================
// 3 – IT PERSISTS, AND AN OLD SAVE ARRIVES AT ZERO
// =================================================================================================
describe('#18 – the save schema move (v54)', () => {
  it('her balance survives a save/load round trip', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    expect(world.kidFundsCents).toBeGreaterThan(0)
    const reloaded = migrateSave(JSON.parse(JSON.stringify(world)))
    expect(reloaded.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(reloaded.kidFundsCents).toBe(world.kidFundsCents)
  })

  it('⚠ A v53 SAVE ARRIVES AT ZERO – the migration invents no history it could not have had', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    const asV53 = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    asV53.schemaVersion = 53
    delete asV53.kidFundsCents
    const migrated = migrateSave(asV53)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.kidFundsCents).toBe(0)
    // ...and nothing is clawed back out of the family's wallet to pay for it.
    expect(migrated.fundsCents).toBe(world.fundsCents)
    expect(migrated.careerTotals.prizeCents).toBe(world.careerTotals.prizeCents)
  })

  it('a corrupted balance is rebuilt whole rather than carried through as NaN', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    const broken = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    broken.schemaVersion = 53
    broken.kidFundsCents = 'lots'
    expect(migrateSave(broken).kidFundsCents).toBe(0)
  })
})

// =================================================================================================
// 4 – WHAT THE PLAYER IS TOLD, AND WHERE THE FIGURES IN IT COME FROM
// =================================================================================================
describe('#18 – the line on her own page', () => {
  const view = (over: Partial<KidLifeWorldView>): KidLifeWorldView => ({
    seed: 'share',
    week: 400,
    ageYears: 18,
    seasonYear: 2038,
    playStyle: 'all-court',
    birthMonth: 6,
    injured: false,
    weeksAway: 0,
    lossStreak: 0,
    weeksSinceTitle: null,
    college: null,
    kidFundsCents: 0,
    // ⭐ ROUND 35 #9 – the DEFAULT is no brand, so every arm above keeps reading the sentence it
    // read before this item; the brand clause is asked for explicitly by the arm that is about it.
    ownsBrand: false,
    ...over,
  })

  // ⚠⚠ RE-AIMED BY ROUND 29 PART THREE P3, 29.08, NOT DELETED. This line is the ONE surface that
  // tells a player the rule exists, and until the manager's commission there was one rule to tell:
  // her ramp split every cheque in the game. P3 gave sponsor money its own rule (hers, less the
  // manager's fee), so «N% of every cheque» became a promise the ramp does not keep – the word
  // «prize» is now load-bearing, and the sponsor clause is the half that was missing. The claim
  // this arm makes is unchanged in kind: the line carries the balance AND the rule, and every
  // percentage in it is the engine's own.
  it('silent before eighteen, and from eighteen it carries the balance AND the rule', () => {
    expect(ownAccountNote(view({ ageYears: 17, kidFundsCents: 0 }))).toBe('')
    const at18 = ownAccountNote(view({ ageYears: 18, kidFundsCents: 90_150_00 }))
    expect(at18).toContain('$90,150')
    expect(at18).toContain('10% of every prize cheque')
    expect(at18).toContain('50%')
    // ⭐ P3's half, read off the engine and never typed – the same rule part-one #13 set for the
    // coach's line: `managerCommissionBps` is the function `bankSponsorCheque` pays by.
    expect(at18, 'and the sponsor money is named as hers, less the fee').toContain(
      `Sponsor cheques are hers, less the manager's ${managerCommissionBps() / 100}%.`,
    )
    const at26 = ownAccountNote(view({ ageYears: 26, kidFundsCents: 8_909_415_00 }))
    expect(at26).toContain('50% of every prize cheque')
    expect(at26, 'at the cap it stops promising more').toMatch(/goes no higher/)
    expect(at26).not.toContain('every birthday')
    // Player copy: short dash only, and no Cyrillic.
    for (const s of [at18, at26]) {
      expect(s).not.toContain('—')
      expect(s).toMatch(/^[\x20-\x7e–]+$/)
    }
  })

  // ⭐⭐⭐ ROUND 35 #9 – AND THE BRAND'S SHARE IS STATED ON THE SAME LINE, which is the half of the
  // item that is about the screen: «в интерфейсе напишем про ее долю».
  //
  // ⚠ THE NEGATIVE IS THE ARM THAT MATTERS, and it is why `ownsBrand` exists at all: a family that
  // never started a brand must not be told the terms of a business it does not own. Both directions
  // are asserted off ONE view differing in ONE field, so the clause cannot pass by accident.
  it('⭐ #9 – the brand clause appears only for a family whose brand is actually paying', () => {
    const without = ownAccountNote(view({ ageYears: 22, kidFundsCents: 100_00, ownsBrand: false }))
    const withBrand = ownAccountNote(view({ ageYears: 22, kidFundsCents: 100_00, ownsBrand: true }))
    expect(without, 'no brand, no sentence about one').not.toContain('brand')
    expect(withBrand, 'and it is stated when there is one').toContain(
      "The same share comes off her brand's weekly income.",
    )
    // ⚠ THE REST OF THE LINE IS UNTOUCHED, so this is an ADDED clause and not a rewritten sentence –
    // invariant 4's own test, applied to the one string this item was allowed to move.
    expect(withBrand.startsWith(without.replace(/\s*$/, '')), 'the shipped sentence is intact ahead of it').toBe(true)
    // ⚠ AND IT SAYS «the same share» RATHER THAN A SECOND PERCENTAGE. Two spellings of one number on
    // one line is how a stale one survives; the ramp is already named earlier in the sentence.
    // ⚠ THE RATE IS READ OFF THE ENGINE AND NEVER TYPED – `kidPrizeShareBps` is the function the
    // till itself divides by, so a retune moves this assertion with the money rather than leaving a
    // stale number in a test. At 22 the shipped ramp is 30%, and that is a reading, not a promise.
    const rampPct = kidPrizeShareBps(22) / 100
    expect(withBrand.match(new RegExp(`${rampPct}%`, 'g')) ?? [], 'the ramp is quoted once, not twice')
      .toHaveLength(1)
    // Player copy: short dash only, and no Cyrillic (the shipped arm's own rule).
    expect(withBrand).not.toContain('—')
    expect(withBrand).toMatch(/^[\x20-\x7e–]+$/)
  })

  it('⭐ THE COMMISSION IS THE ENGINE\'S OWN TOO – P3, and it moves with the constant', () => {
    // The mirror of the arm below, for the second rate this sentence now carries. A retune of
    // `ECONOMY.managerCommission` must move the line; a literal typed into kidLife.ts would not.
    const saved = ECONOMY.managerCommission.bps
    Object.assign(ECONOMY.managerCommission, { bps: 1234 })
    try {
      expect(ownAccountNote(view({ ageYears: 18, kidFundsCents: 100_00 }))).toContain("less the manager's 12.34%")
    } finally {
      Object.assign(ECONOMY.managerCommission, { bps: saved })
    }
  })

  it('⭐ THE PERCENTAGE IS THE ENGINE\'S OWN, not a number typed into a sentence', () => {
    const saved = ECONOMY.kidShare.stepBps
    Object.assign(ECONOMY.kidShare, { stepBps: 100 })
    try {
      // 10% at 18 + one point a year: at 20 the line must say 12%, which no literal could.
      expect(ownAccountNote(view({ ageYears: 20, kidFundsCents: 100_00 }))).toContain('12% of every prize cheque')
    } finally {
      Object.assign(ECONOMY.kidShare, { stepBps: saved })
    }
  })

  it('and it reaches the screen through the snapshot, on a real career', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    const life = toSnapshot(world).life
    expect(ageOf(world)).toBeGreaterThanOrEqual(ECONOMY.kidShare.fromAgeYears)
    expect(life.ownAccount).toContain('Her own account')
    expect(life.ownAccount).toContain('% of every prize cheque')
  })
})
