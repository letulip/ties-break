// THE PREGNANCY, WAVE 8 – T2: THE HAZARD AND THE ANNOUNCEMENT (life/wave-8;
// docs/plans/life-wave-8-builder-2026-09.md §2 T2, constants in `ECONOMY.motherhood`, the research
// docs/research/life-events-motherhood.md).
//
// ⭐ AMENDED 20.09 BY T2½ PIECE 3 – THE GATE IS FOUR CLAUSES, NOT THREE. `pregnancyEligible` gained
// «and none born» (`world.children.length > 0`), a SCOPE BRAKE that makes §4's «no repeat pregnancy
// enabled» true instead of merely true-by-accident: T2's third clause was the once-per-career receipt
// only because nothing on that tree ever cleared `world.pregnancy`, and T6 clears it. W5 LIFTS the
// line – replacing it with the count-aware hazard the design already asks for – and it is not a claim
// about a woman having one child. §A.3 is its case and ARM 10 is its warrant.
//
// The shapes are tests/wave7-wedding.test.ts's, one wave on, and each section names its donor: §A is
// the gate as that file's §A tests `weddingEligible`; §B is the count-keys net (wave 3's finding, the
// wave-4 brief's §0.1 LAW for every zero-draw claim – a two-worlds alignment stays green under
// draw-and-discard because every key carries its own week, so the honest net COUNTS the keys the gate
// reached, with a positive control) and it carries ONE CLAUSE MORE than the wedding's did, because
// this hazard can be 0 on an ELIGIBLE week and the wedding's flat one never could; §C is the raise
// and the record it writes; §D is the answer through the one `answerLifeBeat` seam, priced against
// the BRIEF'S OWN LITERALS and never against `ECONOMY.motherhood` (tests/wave3-reaction.test.ts ARM
// 2's law: an expectation read out of the thing under test moves with it); §E is THE DECOUPLING ARM.
//
// MUTATION LEDGER – run red-first against THIS file before it was believed (wave 4's own protocol,
// wave 7's ledger shape). ⚠ THE COUNTS ARE THE **MEASURED** REDS, NOT PREDICTIONS, and each arm was
// confirmed applied by md5 before its run and reverted by md5 after it:
//   ARM 1  the draw hoisted above the gate in `rollPregnancy`   → 2 RED: §B.1 (keys on ineligible
//          weeks) and §B.3 (the eligible week now derives two keys where one is asserted)
//   ARM 2  the `chance === 0` early return deleted              → 1 RED: §B.2 – a 23-year-old and a
//          ⚠⚠ THE ARM WITH NO BEHAVIOURAL SHADOW: `>=` already      36-year-old each derived a key
//          refuses a chance of 0, so NOTHING a career can see       for a hazard that cannot fire
//          changes and only the key count can see it at all
//   ARM 3  `latchedEpisode` swapped for `activeEpisode` in      → 2 RED: §A.1's unlatched case and
//          `pregnancyEligible` (the marriage door removed)        §B.1's unlatched arm
//   ARM 4  `knockRunning`'s `choice !== null` clause dropped    → 1 RED: §A.4's unanswered-knock
//          ⚠ AND THIS ARM MEASURED **0 RED** ON ITS FIRST RUN,     case
//          because the case parked the knock a week back and the week comparison refused on its own.
//          The fixture was re-cut to the engine's own shape (`sinceWeek === untilWeek === world.week`,
//          which is what `rollKnock` stamps) and the arm was re-run. The 0 is left in the ledger on
//          purpose: a case that cannot fail on the mutation it was written for is the finding.
//   ARM 5  `joyBond` re-priced to 0 in the engine's table       → 3 RED: §D.2's drafted +2.5, plus
//          §D.4's no-zero sweep and §D.8's orphan case, which both price `joy` off the engine
//   ARM 6  `EXPECTING_SUPPORT.worry` flipped to `'cold'`        → 2 RED: §D.3's grade row and §D.7's
//          drain, which asserts the grade a harness leaves behind
//   ARM 7  the record write removed from the raise (the shape   → 8 RED: §C.2 first, then every case
//          a write-at-the-ANSWER would leave at this line)        downstream that has a pregnancy to
//          read – §D.3, §D.4, §D.5, §D.7 and all three of §E
//   ARM 8  `world.pregnancy = null` added to `endEpisode`       → 3 RED: all three cases in §E –
//          THE DECOUPLING LAW'S OWN ARM, and the one this file exists for
//   ARM 9  `LIFE_BEAT_BLOCKING.expecting` flipped to false      → 6 RED: §C.3's own pin plus every
//          case that answers through `pendingLifeBeat` – the block contract is load-bearing
//   ARM 10 the once-per-career clause DELETED from              → 2 RED: §A.3's own case (a career
//          `pregnancyEligible` (`world.children.length > 0`)       that has given birth re-enters the
//          ⚠ ADDED BY T2½ PIECE 3 (20.09) AND THE ARM IS THE        hazard) and §B.1's new
//          CLAUSE'S WHOLE WARRANT – measured, applied by a           born-child arm, which derived
//          scripted edit with an `APPLIED=yes` receipt and           `w8-b7:life:pregnancy:855` for a
//          reverted by md5 to `a6e98606…`, never `git checkout`      week that must take no draw

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, verbatim and for its reason. Every
// draw is the engine's own; the mock exists only so §B can COUNT the keys the gate reached.
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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  answerLifeBeat,
  buildLifeBeatPrompt,
  createWorld,
  endEpisode,
  kidAgeExact,
  knockRunning,
  latchedEpisode,
  lifeLogOf,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  pregnancyChanceAt,
  pregnancyEligible,
  rollPregnancy,
  LIFE_BEAT_BLOCKING,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { drainLifeBeats, DRAIN_ANSWER, drainCostOf } from '../tools/_lifeBeats'
import type { LoveEpisode } from '../src/shared/protocol'

const MOTHERHOOD = ECONOMY.motherhood

// ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY.motherhood`
// (tests/wave3-reaction.test.ts ARM 2's law). §2 T2 and §2 T3 of the wave-8 brief draft these four
// numbers; a silent re-tune has to walk past THIS block, which is the whole point of writing them
// out twice. The curve's SHAPE is the builder's draft and is asserted structurally in §A, never
// transcribed: the arithmetic that sizes it lives at the constant, where the owner reads it.
const BRIEF = { playsOnWeeks: 8, termWeeks: 31, joy: 2.5, worry: -0.5, careerFirst: -4 } as const

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – wave 7's own, in a newer situation
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – walked on the engine's own clock, never our
 *  arithmetic (`tests/wave4-ends.test.ts`'s helper, through wave 7). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A row of the v83 shape. `latchedWeek` non-null and `endedWeek` null is «married and not over»,
 *  which is `latchedEpisode`'s own reading and this wave's door. */
function married(sinceWeek: number, latchedWeek: number, endedWeek: number | null = null): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A career, parked at `week`, with whatever love life the case needs – a REAL `createWorld`. */
function careerAt(seed: string, week: number, ...rows: LoveEpisode[]): WorldState {
  const world = createWorld(seed)
  world.season = []
  world.week = week
  world.loveEpisodes = rows
  return world
}

/** A MARRIED career standing at `age`, the eligible fixture most sections start from. The marriage
 *  was latched a year before «now» – no depth clause exists in this gate, so the year is only so the
 *  fixture is not posed on the latch week itself. */
function wedded(seed: string, age: number): WorldState {
  const probe = createWorld(seed)
  const week = weekAtAge(probe, age)
  return careerAt(seed, week, married(week - 104, week - 52))
}

/** ⭐⭐ A MARRIED CAREER PARKED ON A WEEK WHOSE PREGNANCY UNIFORM IS A **HIT** – found on the
 *  engine's own stream, at the engine's own age-shaped chance, so a case that needs a hit stands on
 *  a real one and no constant is moved to manufacture it.
 *
 *  ⚠⚠ IT SEARCHES SEEDS AS WELL AS WEEKS, AND IT HAS TO – which is the census the curve is FOR,
 *  arriving as a property of the fixture. At the drafted ~0.0006/week over the ~572 weeks of the
 *  24–35 window, a majority of seeds hold NO hit at all: that is «15–30% of latched careers by 35»
 *  seen from inside a test, and a helper that could always find a hit on the first seed would be
 *  evidence the hazard was far too big. The `-N` suffixes keep every case deterministic. */
function onHitWeek(base: string): WorldState {
  for (let i = 0; i < 200; i++) {
    const seed = i === 0 ? base : `${base}-${i}`
    const probe = createWorld(seed)
    const to = weekAtAge(probe, 35)
    for (let w = weekAtAge(probe, 24); w < to; w++) {
      probe.week = w
      // ⚠ THE ENGINE'S OWN CHANCE AT THAT WEEK, never a second copy of the curve: a test that
      // transcribed the rungs would be hunting hits under a hazard the engine does not have.
      const chance = pregnancyChanceAt(probe)
      if (chance > 0 && rngFromSeed(`${seed}:life:pregnancy:${w}`)() < chance) {
        return careerAt(seed, w, married(w - 104, w - 52))
      }
    }
  }
  throw new Error(`no pregnancy hit inside the window for any seed from ${base}`)
}

/** A knock that has been ANSWERED and still has weeks to run – the third gate clause's fixture. */
function withKnock(world: WorldState, choice: 'rest' | 'push' | null, weeksLeft: number): WorldState {
  world.knock = { part: 'shoulder', sinceWeek: world.week - 1, repeat: false, choice, untilWeek: world.week + weeksLeft }
  return world
}

// =================================================================================================
// A. THE GATE – FOUR clauses, each one alone refuses; and the age curve, which is NOT one of them
// (three at T2; the fourth – «and none born» – is T2½ piece 3's scope brake, which W5 lifts)
// =================================================================================================
describe('wave 8 T2 A – `pregnancyEligible`, and the curve that is deliberately outside it', () => {
  it('⭐⭐⭐ THE DOOR IS MARRIAGE (RULED 20.09): an active but UNLATCHED episode never fires', () => {
    const world = wedded('w8-door', 28)
    expect(pregnancyEligible(world), 'the married fixture clears').toBe(true)
    // ...and the SAME row with the latch taken off refuses, which is what makes the door the latch's
    // own doing and not the episode's existence. ⚠ THE EPISODE IS STILL ACTIVE – this is exactly the
    // world a gate spelled `activeEpisode` would have let through (ARM 3).
    world.loveEpisodes[0].latchedWeek = null
    expect(latchedEpisode(world), 'an unlatched row is not a marriage').toBeNull()
    expect(pregnancyEligible(world), 'and a girlfriend is not the door').toBe(false)
  })

  it('an ENDED marriage is no marriage – the door asks about THIS week', () => {
    const world = wedded('w8-ended', 28)
    endEpisode(world, world.week - 1)
    expect(pregnancyEligible(world), 'a marriage that is over cannot start one').toBe(false)
  })

  it('⚠ a pregnancy already standing refuses – one at a time, the seat\'s own shape', () => {
    const world = wedded('w8-once', 28)
    world.pregnancy = {
      episodeId: world.loveEpisodes[0].id, announcedWeek: world.week - 4,
      pausesWeek: world.week + 4, dueWeek: world.week + 35, support: 'warm', rankAtPause: null,
    }
    expect(pregnancyEligible(world), 'she is already carrying one').toBe(false)
  })

  it('⭐⭐⭐ A CAREER THAT HAS GIVEN BIRTH AND COME BACK DOES NOT RE-ENTER THE HAZARD (v85 T2½ piece 3)', () => {
    // ⚠⚠ THE SCOPE BRAKE, AND THIS CASE IS THE WHOLE OF ITS PROOF. T2 left the once-per-career
    // property to the clause above – true only because nothing on THAT tree ever cleared
    // `world.pregnancy`. The moment T6 resolves the record into `world.comeback`, the same marriage
    // re-enters the standing hazard, and §4's «no repeat pregnancy enabled» becomes false in the
    // quietest way there is: repeat pregnancies at the FIRST pregnancy's rates, unbenched, under a
    // census corridor derived for a different quantity.
    //
    // ⚠ SO THE FIXTURE IS THE SHAPE T6 LEAVES BEHIND rather than a convenient one – the pregnancy
    // CLEARED (which is what makes W5's repeat possible at all), one child on the record, the
    // marriage still standing and her age still inside the window. Every other clause of the gate
    // clears here; only the count refuses.
    //
    // ⚠⚠ IT IS A SCOPE BRAKE AND NOT A RULE ABOUT HER LIFE. Repeat pregnancy is CONFIRMED WANTED
    // («после беременности может быть и повторная», 11.09) and W5 LIFTS this line – replacing it with
    // the count-aware hazard the design asks for, not deleting a receipt.
    const world = wedded('w8-once-per-career', 30)
    expect(pregnancyEligible(world), 'the control: married, in the window, no child – she clears').toBe(true)
    world.children.push({ bornWeek: world.week - 60, sex: 'girl' })
    expect(world.pregnancy, 'the pregnancy was cleared at the return, as T6 leaves it').toBeNull()
    expect(latchedEpisode(world), 'and the marriage is still standing – the door is open').not.toBeNull()
    expect(pregnancyChanceAt(world), 'and her age is still inside the research window').toBeGreaterThan(0)
    expect(pregnancyEligible(world), '⭐ and the wave still ships at most ONE pregnancy per career').toBe(false)
    // ⚠ AND THE REFUSAL IS A GATE REFUSAL, so it takes ZERO DRAWS like every other one – never a
    // draw-and-discard (invariant 2). §B counts the keys; this asserts the write.
    rollPregnancy(world)
    expect(world.pregnancy, 'nothing was written, and nothing was rolled to decide it').toBeNull()
    // ⚠ TWO CHILDREN REFUSE FOR THE SAME REASON, which is worth one line: the clause reads a COUNT
    // and not a boolean, so W5 edits the comparison rather than replacing the read.
    world.children.push({ bornWeek: world.week - 8, sex: 'girl' })
    expect(pregnancyEligible(world), 'and a second child refuses on the same read').toBe(false)
  })

  it('⭐ a RUNNING knock refuses, and an UNANSWERED one is a different question', () => {
    const world = wedded('w8-knock', 28)
    expect(pregnancyEligible(withKnock(world, 'rest', 2)), 'a rest week is a week her body is the subject').toBe(false)
    expect(knockRunning(world), 'and the predicate says so in one place').toBe(true)
    // ⚠ PUSH COUNTS TOO – «layoff» is the short name, not a narrowing: a girl sent back out on a sore
    // shoulder is still a family managing a body this week.
    expect(pregnancyEligible(withKnock(world, 'push', 3)), 'so does being sent back out').toBe(false)
    // ⚠⚠ AND AN UNANSWERED KNOCK READS FALSE, WHICH IS THE THREE-FIELD PREDICATE'S WHOLE POINT.
    // ⚠ THE FIXTURE IS THE ENGINE'S OWN SHAPE AND THE CASE IS WORTHLESS WITHOUT IT: `rollKnock`
    // stamps `sinceWeek: world.week` and `knockUntilWeek` leaves `untilWeek` EQUAL to it until the
    // answer, so a knock that arrived this week satisfies `world.week <= untilWeek` and ONLY
    // `choice !== null` refuses it. Measured: the first draft of this case parked the knock a week
    // back, the week comparison refused on its own, and ARM 4 came back 0 RED – a case that could
    // not fail on the mutation it was written for.
    world.knock = { part: 'shoulder', sinceWeek: world.week, repeat: false, choice: null, untilWeek: world.week }
    expect(knockRunning(world), 'nobody has answered – that is `pendingKnock`\'s question').toBe(false)
    expect(pregnancyEligible(world), 'and this gate does not claim to be that one').toBe(true)
    world.knock = null
    expect(pregnancyEligible(world), 'a career with no knock at all clears').toBe(true)
  })

  it('⭐⭐ AGE IS NOT IN THE GATE – it shapes the hazard, §0\'s adopted recommendation', () => {
    const world = wedded('w8-age', 23)
    // A married 23-year-old is ELIGIBLE and her chance is ZERO, which is the whole distinction: the
    // gate is about the world, the curve is about her, and the roll reads both.
    expect(pregnancyEligible(world), 'the gate holds no age clause at all').toBe(true)
    expect(pregnancyChanceAt(world), 'and the research window has not opened').toBe(0)
    world.week = weekAtAge(world, 24)
    expect(pregnancyChanceAt(world), 'it opens on her 24th birthday, fractional').toBeGreaterThan(0)
    world.week = weekAtAge(world, 35)
    expect(pregnancyEligible(world), 'still eligible at 35').toBe(true)
    expect(pregnancyChanceAt(world), 'and the window has closed').toBe(0)
  })

  it('⭐ the curve is the DIGEST\'S window and band: 24–35, and every live rung inside 2–4%/yr', () => {
    // ⚠ THE SHAPE IS THE BUILDER'S DRAFT, so this asserts the RESEARCH's boundaries rather than
    // transcribing the four rungs – a pin on the rungs themselves would go red on the retune T9 is
    // FOR, and would be asserting the table against itself. What must not move without the owner is
    // the window and the band, because those are his digest's row.
    const rungs = MOTHERHOOD.perWeekByAge
    expect(rungs[0].fromAge, 'the window opens where the research does').toBe(24)
    expect(rungs[rungs.length - 1], 'and closes where it does, at a rung and not an absence').toEqual({ fromAge: 35, perWeek: 0 })
    for (const rung of rungs) {
      if (rung.perWeek === 0) continue
      const annual = rung.perWeek * 52
      expect(annual, `${rung.fromAge}: at or above the digest's 2%/yr`).toBeGreaterThanOrEqual(0.02 - 1e-12)
      expect(annual, `${rung.fromAge}: at or below the digest's 4%/yr`).toBeLessThanOrEqual(0.04 + 1e-12)
    }
    // ⚠⚠ ASCENDING, BECAUSE THE READ DEPENDS ON IT. `pregnancyChanceAt` keeps the LAST rung she has
    // reached, so a rung inserted out of order silently re-shapes the curve and nothing else would
    // notice – the table would still typecheck and every band assertion above would still pass.
    for (let i = 1; i < rungs.length; i++) {
      expect(rungs[i].fromAge, `rung ${i} is above rung ${i - 1}`).toBeGreaterThan(rungs[i - 1].fromAge)
    }
  })
})

// =================================================================================================
// B. ZERO DRAWS – the count-keys net, with its positive control and its own extra clause
// =================================================================================================
describe('wave 8 T2 B – the gate AND the chance both return before any stream exists', () => {
  const pregnancyKeys = () => rngKeys.filter((k) => k.includes(':life:pregnancy:'))

  it('⚠⚠ an ineligible week derives NO pregnancy key – all FIVE refusals, counted', () => {
    // ⚠ RE-AIMED FROM FOUR TO FIVE BY T2½ PIECE 3 (the once-per-career scope brake), NOT WEAKENED:
    // the claim is «every shape of refusal takes zero draws», so a new clause owes an arm here or the
    // net has a hole exactly where the newest code is.
    for (const [name, world] of [
      ['unlatched', (() => { const w = wedded('w8-b1', 28); w.loveEpisodes[0].latchedWeek = null; return w })()],
      ['ended', (() => { const w = wedded('w8-b2', 28); endEpisode(w, w.week - 1); return w })()],
      ['already carrying', (() => {
        const w = wedded('w8-b3', 28)
        w.pregnancy = { episodeId: w.loveEpisodes[0].id, announcedWeek: w.week - 4, pausesWeek: w.week + 4, dueWeek: w.week + 35, support: null, rankAtPause: null }
        return w
      })()],
      ['a child already born', (() => {
        const w = wedded('w8-b7', 30)
        w.children.push({ bornWeek: w.week - 60, sex: 'girl' })
        return w
      })()],
      ['a knock running', withKnock(wedded('w8-b4', 28), 'rest', 2)],
    ] as const) {
      rngKeys.length = 0
      rollPregnancy(world)
      expect(pregnancyKeys(), `⚠⚠ ${name}: an ineligible week took a draw`).toEqual([])
    }
  })

  it('⭐⭐⭐ and NEITHER DOES A ZERO-HAZARD WEEK, which is the clause the wedding never needed', () => {
    // ⚠⚠ THIS IS THE ARM THE `chance === 0` EARLY RETURN EXISTS FOR, and it is INVISIBLE to every
    // behavioural assertion in this file: `<` already refuses a chance of 0, so deleting the early
    // return changes NOTHING a career could see and only the key count goes red (ARM 2). A hazard
    // that is genuinely 0 for eleven years of every career would otherwise be eleven years of
    // draw-and-discard, which invariant 2 forbids by name.
    for (const [name, age] of [['under the window', 23], ['past the window', 36]] as const) {
      const world = wedded(`w8-b5-${age}`, age)
      expect(pregnancyEligible(world), `${name}: the GATE clears – this is the curve's refusal`).toBe(true)
      expect(pregnancyChanceAt(world), `${name}: at a hazard of exactly zero`).toBe(0)
      rngKeys.length = 0
      rollPregnancy(world)
      expect(pregnancyKeys(), `⚠⚠ ${name}: a zero-hazard week took a draw`).toEqual([])
      expect(world.pregnancy, `${name}: and nothing was written`).toBeNull()
    }
  })

  it('⭐ the positive control: an eligible in-window week derives exactly its own key, and nothing else', () => {
    const world = wedded('w8-b6', 28)
    expect(pregnancyChanceAt(world), 'the fixture is inside the window').toBeGreaterThan(0)
    rngKeys.length = 0
    rollPregnancy(world)
    expect(pregnancyKeys(), 'one uniform, one week, its own key').toEqual([`${world.seed}:life:pregnancy:${world.week}`])
    // ⚠ AND ONLY that key – the roll reaches no sibling's stream, §5's «no section may read another
    // section's key» law counted rather than trusted.
    expect(rngKeys.filter((k) => k.includes(':life:') && !k.includes(':life:pregnancy:')), 'no sibling stream is touched').toEqual([])
  })
})

// =================================================================================================
// C. THE RAISE – the row, the RECORD, the block, and what a raise does NOT write
// =================================================================================================
describe('wave 8 T2 C – the `expecting` beat and the one place `world.pregnancy` goes non-null', () => {
  it('⭐ a hit raises one row: her week, the kind, the EPISODE ID as detail, unanswered', () => {
    const world = onHitWeek('w8-raise')
    const episodeId = world.loveEpisodes[0].id
    rollPregnancy(world)
    const rows = lifeLogOf(world).filter((r) => r.kind === 'expecting')
    expect(rows, 'exactly one row').toHaveLength(1)
    expect(rows[0], 'the record is the queue').toEqual({ week: world.week, kind: 'expecting', detail: episodeId, answer: null })
  })

  it('⭐⭐⭐ the RECORD is written at the RAISE, and its four dates are the BRIEF\'S literals', () => {
    const world = onHitWeek('w8-record')
    const at = world.week
    rollPregnancy(world)
    // ⚠ TRANSCRIBED FROM THE WAVE-8 BRIEF (§2 T2's `playsOnWeeks` 8, §2 T3's `termWeeks` 31), never
    // read off `ECONOMY.motherhood` – ARM 2's law. `dueWeek = pausesWeek + termWeeks` is the brief's
    // own formula, so the birth lands 39 weeks after the announcement: a full term.
    expect(world.pregnancy, 'the announcement is a fact about the world the moment she says it').toEqual({
      episodeId: world.loveEpisodes[0].id,
      announcedWeek: at,
      pausesWeek: at + BRIEF.playsOnWeeks,
      dueWeek: at + BRIEF.playsOnWeeks + BRIEF.termWeeks,
      support: null,
      // ⚠ RE-AIMED 20.09 BY v85 T6, NOT WEAKENED: `rankAtPause` is the sixth field – the capture the
      // ruled freeze is made of – and it is `null` HERE because the pause is eight weeks away and she
      // is still playing. `landPregnancyPause` takes it on the week it is true; the record written at
      // the RAISE cannot know it, and a non-null value on this line would be the announcement week
      // pretending to be the pause week.
      rankAtPause: null,
    })
    expect(world.pregnancy!.dueWeek - at, 'eight weeks playing on and thirty-one more – a term').toBe(39)
    // ⚠⚠ AND `support` IS NULL WHILE THE BLOCKING CARD STANDS, which is the TRUE reading of the gap
    // (T1's own note on the field) and not a placeholder: she has told him, and he has not answered.
    expect(pendingLifeBeat(world)?.kind, 'the card is still up').toBe('expecting')
    expect(world.pregnancy!.support, 'and no default is invented for a week that really happened').toBeNull()
  })

  it('⚠⚠ it BLOCKS – the layer\'s biggest news stops the week until it is answered', () => {
    expect(LIFE_BEAT_BLOCKING.expecting, 'declared blocking, per kind and by type').toBe(true)
    const world = onHitWeek('w8-block')
    rollPregnancy(world)
    expect(pendingLifeBeat(world)?.kind, 'and the queue reports it as the pending beat').toBe('expecting')
  })

  it('⚠ a raise writes the record and the row and NOTHING else – no feed row, no cents, no child', () => {
    const world = onHitWeek('w8-silent')
    const events = world.events.length
    const funds = world.fundsCents
    const latched = world.loveEpisodes[0].latchedWeek
    rollPregnancy(world)
    expect(world.events.length, 'no feed row at the raise – the texture is T8\'s').toBe(events)
    expect(world.fundsCents, 'and no money moved – there is no birth fee and no bill here').toBe(funds)
    expect(world.children, 'the child is T4\'s, thirty-nine weeks away').toEqual([])
    expect(world.loveEpisodes[0].latchedWeek, 'and the marriage is untouched').toBe(latched)
  })

  it('a miss raises nothing – the hazard is a hazard, not a schedule', () => {
    const world = wedded('w8-miss', 28)
    const chance = pregnancyChanceAt(world)
    // park on a week whose uniform is a MISS (>= the chance at that week), on the engine's own stream
    for (let w = world.week; w < world.week + 500; w++) {
      if (rngFromSeed(`${world.seed}:life:pregnancy:${w}`)() >= chance) { world.week = w; break }
    }
    rollPregnancy(world)
    expect(lifeLogOf(world).filter((r) => r.kind === 'expecting'), 'no row on a missed week').toHaveLength(0)
    expect(world.pregnancy, 'and no record either').toBeNull()
  })
})

// =================================================================================================
// D. THE ANSWER – one answer, TWO consequences, through the one seam
// =================================================================================================
describe('wave 8 T2 D – joy / worry / the career first, on `answerLifeBeat`', () => {
  /** An `'expecting'` beat standing, at the neutral bond 70 – inside her own voice
   *  (`speaksInHerOwnVoice` is false below 55) and far from both rails, so no delta can clamp. */
  function asked(seed: string): WorldState {
    const world = onHitWeek(seed)
    world.bond = 70
    rollPregnancy(world)
    return world
  }

  it('⭐ the prompt is the engine\'s: the drafted heading, her line, and exactly the three ids', () => {
    const world = asked('w8-prompt')
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.kind).toBe('expecting')
    expect(prompt.heading, 'one frame, keyed on nothing').toBe('A child is coming, and she has already decided')
    expect(prompt.said, 'she announces, in her own voice at a mid bond').toContain('We are having a baby')
    expect(prompt.options.map((o) => o.id), 'the research\'s own triple, in order').toEqual(['joy', 'worry', 'career-first'])
    expect(prompt.followUps, 'no listen detour – the decision is finished').toEqual([])
  })

  it('⭐⭐ the three prices are the BRIEF\'S drafted literals: +2.5 / −0.5 / −4 on `bond`', () => {
    // ⚠ TRANSCRIBED FROM THE WAVE-8 BRIEF'S T2 TABLE, never read off `ECONOMY.motherhood` – ARM 2's
    // law: an expectation read out of the thing under test moves with it.
    for (const [id, delta] of [
      ['joy', BRIEF.joy],
      ['worry', BRIEF.worry],
      ['career-first', BRIEF.careerFirst],
    ] as const) {
      const world = asked(`w8-price-${id}`)
      const before = world.bond
      answerLifeBeat(world, id)
      expect(world.bond - before, `${id}: the drafted delta, exactly`).toBeCloseTo(delta, 10)
      expect(pendingLifeBeat(world), `${id}: and the week is released`).toBeNull()
      expect(lifeLogOf(world).find((r) => r.kind === 'expecting')?.answer, `${id}: recorded on the row`).toBe(id)
    }
  })

  it('⭐⭐⭐ ...and the SAME answer is persisted as a GRADE, which is the second consequence', () => {
    // The research's row is «support only – reaction sets recovery trajectory»: the grade is what
    // T5's decision and T4's recovery read, months after the card has closed.
    for (const [id, grade] of [
      ['joy', 'warm'],
      ['worry', 'measured'],
      ['career-first', 'cold'],
    ] as const) {
      const world = asked(`w8-grade-${id}`)
      expect(world.pregnancy!.support, `${id}: null until he answers`).toBeNull()
      answerLifeBeat(world, id)
      expect(world.pregnancy!.support, `${id}: graded onto the pregnancy, once`).toBe(grade)
    }
  })

  it('⚠ NO ZERO among the three – the third no-free-answer kind, and every offered id has a grade', () => {
    const world = asked('w8-total')
    const offered = pendingLifeBeatOptions(world)!
    expect(offered, 'three answers').toHaveLength(3)
    for (const option of offered) {
      expect(option.bond, `${option.id}: an announcement like this is not free to answer`).not.toBe(0)
    }
    // ⚠⚠ TOTALITY OVER THE OPTION IDS, WHICH THE TYPE CANNOT CARRY (the ids are strings, not a
    // union): every id the card offers writes a grade, and `answerLifeBeat` throws BY NAME on a miss
    // rather than putting `undefined` on the field. Walked one world per id, so a fourth option
    // added without a grade goes red HERE and not in a bench three waves later.
    for (const option of offered) {
      const own = asked(`w8-total-${option.id}`)
      answerLifeBeat(own, option.id)
      expect(own.pregnancy!.support, `${option.id}: has a grade`).not.toBeNull()
    }
  })

  it('⚠ engine-side re-validation: an id this beat never offered is refused', () => {
    const world = asked('w8-reval')
    expect(() => answerLifeBeat(world, 'bless'), 'the wedding\'s answer is not this card\'s').toThrow()
    expect(pendingLifeBeat(world)?.kind, 'and the beat still stands').toBe('expecting')
    expect(world.pregnancy!.support, 'and nothing was graded').toBeNull()
  })

  it('the answer writes its feed line – an `info` row, no amount, no price in the words', () => {
    const world = asked('w8-row')
    answerLifeBeat(world, 'joy')
    const row = world.events[world.events.length - 1]
    expect(row.type).toBe('info')
    expect(row.text).toBe('She is expecting a child. We told her it was the best news in the house.')
    expect(row.amountCents, 'a life beat is never a purchase (rule 4)').toBeUndefined()
  })

  it('⭐ the drain: `worry` at the one −0.5 a harness can state, under every reading', () => {
    expect(DRAIN_ANSWER.expecting, 'the registry names the mildest answer').toBe('worry')
    expect(drainCostOf('expecting'), 'read-independent by construction – no overlay names this kind').toBe(BRIEF.worry)
    const world = asked('w8-drain')
    const before = world.bond
    expect(drainLifeBeats(world), 'the shared helper answers the row').toBe(1)
    expect(world.bond - before, 'at the stated −0.5 exactly').toBeCloseTo(BRIEF.worry, 10)
    // ⚠ AND THE DRAIN IS NOT SIDE-EFFECT-FREE HERE, which `tools/_lifeBeats.ts` says out loud: a
    // harness that walks a career past this card hands T5 a MEASURED grade rather than no grade.
    expect(world.pregnancy!.support, 'the walk graded it, honestly').toBe('measured')
  })

  it('⚠ a hand-built world with an `expecting` row and NO pregnancy answers without throwing', () => {
    // The drain sweep in tests/wave3-reaction.test.ts §D raises a beat of every blocking kind on a
    // world that has no pregnancy, and forty benches do the same shape. The grade is simply not
    // written when there is nothing to write it on – the honest reading of that world, and the
    // reason the write is guarded on the RECORD and not on the kind alone.
    const world = onHitWeek('w8-orphan')
    rollPregnancy(world)
    world.pregnancy = null
    const before = world.bond
    answerLifeBeat(world, 'joy')
    expect(world.bond - before, 'the bond is still priced').toBeCloseTo(BRIEF.joy, 10)
    expect(world.pregnancy, 'and nothing was invented to grade').toBeNull()
  })
})

// =================================================================================================
// E. ⭐⭐⭐ THE DECOUPLING ARM – a mid-pregnancy divorce is ORDINARY LIFE (RULED 20.09)
// =================================================================================================
//
// «развелись и развелись, жизнь продолжается, да, будут эмоциональные последствия, но в целом,
// ничего необычного». The architect's drafted ×0 suppression is DEAD, and what replaces it is this:
// T4's birth and T5's decision read `world.pregnancy` and NEVER the episode's aliveness. T2's part is
// to make that structurally possible – `episodeId` is a REFERENCE and never a liveness check – and
// this section is the pin that says so. ARM 8 is its mutation.
describe('wave 8 T2 E – the marriage ends mid-term and the pregnancy is untouched', () => {
  it('⭐⭐⭐ ending the carrying episode changes NOT ONE FIELD of the record', () => {
    const world = onHitWeek('w8-decouple')
    rollPregnancy(world)
    answerLifeBeat(world, 'joy')
    const carried = { ...world.pregnancy! }
    expect(carried.support, 'the fixture really answered').toBe('warm')

    // ...and the marriage ends halfway to the birth, through the engine's OWN writer.
    world.week = carried.pausesWeek + 10
    endEpisode(world, world.week)
    expect(latchedEpisode(world), 'the marriage is over').toBeNull()
    expect(world.loveEpisodes[0].endedWeek, 'on the week it ended').toBe(world.week)

    expect(world.pregnancy, '⚠⚠ every field, including the id of a marriage that no longer stands').toEqual(carried)
    expect(world.pregnancy!.dueWeek, 'the birth is still due on its own week').toBe(carried.dueWeek)
    expect(world.pregnancy!.episodeId, 'and the id still says WHOSE – a reference, not a gate').toBe(world.loveEpisodes[0].id)
  })

  it('⚠ and it stays untouched all the way to the due week, tick after tick', () => {
    const world = onHitWeek('w8-decouple-walk')
    rollPregnancy(world)
    answerLifeBeat(world, 'career-first')
    const carried = { ...world.pregnancy! }
    world.week = carried.announcedWeek + 5
    endEpisode(world, world.week)
    // ⚠ THE SECTION THAT COULD TOUCH IT IS THE ONE THAT RUNS – `rollPregnancy` is called every week
    // of every career, and on every one of these weeks it refuses (a pregnancy stands, and the
    // marriage is gone) without reading, clearing or re-dating anything.
    for (let w = world.week; w <= carried.dueWeek; w++) {
      world.week = w
      rollPregnancy(world)
      expect(world.pregnancy, `week ${w}: the record is what it was`).toEqual(carried)
    }
    expect(world.pregnancy!.support, 'the grade survives the marriage that produced it').toBe('cold')
  })

  it('⚠ nothing new is added for it and nothing is suppressed – the ending is wave 7\'s, unchanged', () => {
    // The ruling's other half: the mid-term ending is ORDINARY, so the standing machinery carries the
    // whole event and T2 contributes no special case in either direction. What this asserts is the
    // absence: ending the episode raises no pregnancy-shaped anything, and the gate's refusal
    // afterwards is clause 2 (a pregnancy stands) rather than a divorce rule.
    const world = onHitWeek('w8-decouple-quiet')
    rollPregnancy(world)
    answerLifeBeat(world, 'worry')
    const rows = lifeLogOf(world).length
    endEpisode(world, world.week + 3)
    world.week += 3
    expect(lifeLogOf(world).length, 'ending an episode raises nothing of this section\'s').toBe(rows)
    expect(world.pregnancy, 'and the pregnancy is still there to be born').not.toBeNull()
    expect(pregnancyEligible(world), 'the gate refuses because one stands, not because a marriage ended').toBe(false)
    world.pregnancy = null
    expect(pregnancyEligible(world), '...and with the record cleared it is the marriage door refusing').toBe(false)
  })
})
