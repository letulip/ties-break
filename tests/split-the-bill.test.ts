import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  COACH_TIERS,
  coachById,
  coachRateBandCents,
  coachCorridorMid,
  coachWeeklyCents,
  facilityRateCents,
  weeklyBillSplit,
} from '../src/engine/coach'
import { createWorld, tickWeek, SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type CoachTier,
  type FamilyBackground,
  type WorldEvent,
} from '../src/shared/protocol'

// THE BILL SPLIT (docs/specs/split-the-bill-2026-08.md). The weekly training charge becomes two
// ledger lines - the coach's labour and the court's hire - and the owner's report is what it answers:
//
//   «нам нужно отдельной строчкой списывать тренера, а отдельной рент залов и прочего»
//
// ⚠ IT IS A LEGIBILITY CHANGE AND THE WHOLE POINT IS THAT THE MONEY DID NOT MOVE. This file's first
// describe is that claim stated as arithmetic: whatever the split does, the two lines must sum to the
// EXACT expression `resolveBaseCosts` charged before it existed. Everything else here is about what
// the family can now see.

const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']
const PLANS = [WEEK_PLAN_PRESETS.light, WEEK_PLAN_PRESETS.balanced, WEEK_PLAN_PRESETS.grind]
const AGES = [14, 16, 17, 22, 23, 28]

/** Every rung's midpoint rate at one age - `self` being the court itself, at the club. */
function midRate(tier: CoachTier, age: number): number {
  if (tier === 'self') return facilityRateCents(age, 'self')
  const [lo, hi] = coachRateBandCents(tier, age)
  return Math.round((lo + hi) / 2)
}

function weekRows(events: WorldEvent[], week: number): WorldEvent[] {
  return events.filter((e) => e.week === week && (e.category === 'coaching' || e.category === 'facility'))
}

function readFixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/saves/${name}`, import.meta.url)), 'utf8')
}

describe('the total did not move - the split is a partition, not a re-price', () => {
  it('reproduces the pre-split expression exactly, at every rung, corridor, plan, age and jitter', () => {
    // ⚠ THIS IS THE GUARANTEE, WRITTEN OUT. Before the split `resolveBaseCosts` charged
    //     Math.round(coachWeeklyCents(rate, plan, background, corridor) * jitter)
    // and that line is reproduced here verbatim as `wasCharged`. If a future change to
    // `weeklyBillSplit` alters the total by so much as one cent - a different rounding order, a
    // facility rate that is no longer a share of the same number - this fails, which is exactly the
    // accident the bench cannot be relied on to catch (a $1/week drift is invisible in a survival
    // rate and is $208 over a career).
    //
    // The jitter arm walks the real band's ENDS and its centre, because the ends are where a
    // rounding disagreement shows up first.
    const [jLo, jHi] = [9200, 10800]
    let checked = 0
    for (const background of BACKGROUNDS) {
      for (const tier of COACH_TIERS) {
        for (const plan of PLANS) {
          for (const age of AGES) {
            for (const bps of [jLo, 9600, 10_000, 10_400, jHi]) {
              const rate = midRate(tier, age)
              const corridor = coachCorridorMid(background)
              const jitter = bps / 10_000
              const wasCharged = Math.round(coachWeeklyCents(rate, plan, background, corridor) * jitter)
              const split = weeklyBillSplit({ rateCents: rate, ageYears: age, tier, plan, background, corridor, jitter })
              expect(split.totalCents, `${background}/${tier}/${age}/${bps}`).toBe(wasCharged)
              expect(split.coachCents + split.facilityCents).toBe(split.totalCents)
              expect(split.coachCents).toBeGreaterThanOrEqual(0)
              expect(split.facilityCents).toBeGreaterThan(0)
              checked++
            }
          }
        }
      }
    }
    expect(checked).toBe(BACKGROUNDS.length * COACH_TIERS.length * PLANS.length * AGES.length * 5)
  })

  it('holds the partition on the LEDGER too, week after week, at every rung', () => {
    // The pure function is one thing; what the family is actually charged is another. A world is
    // ticked for a season and every week's two rows are summed back against the funds the tick took.
    for (const tier of COACH_TIERS) {
      const world = createWorld(`ledger-partition-${tier}`, { ...DEFAULT_PROFILE, coachTier: tier })
      world.fundsCents = 10_000_000_00 // never bankrupt; the bill is the measurement
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 52; i++) {
        tickWeek(world, rng)
        const rows = weekRows(world.events, world.week)
        expect(rows.length, `${tier} week ${world.week}`).toBeGreaterThan(0)
        const booked = rows.reduce((s, e) => s - (e.amountCents ?? 0), 0)
        // ...and the aggregate the Money screen reads agrees with the rows the ledger shows.
        const fw = world.financeWeeks.find((w) => w.week === world.week)!
        const aggregate = -((fw.byCategory.coaching ?? 0) + (fw.byCategory.facility ?? 0))
        expect(aggregate).toBe(booked)
      }
    }
  })
})

describe('what the family can now see', () => {
  it('bills a self-coached family for the court and NOTHING for a coach', () => {
    // ⚠ THE WORST OF WHAT THE OLD MODEL DID. `self` has always been priced at exactly the court
    // rental - the parent's hour is free - and the line was still labelled coaching, so the game
    // charged a family "coaching" for a parent who works free and could not be told otherwise.
    const world = createWorld('self-is-honest', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 12; i++) tickWeek(world, rng)
    const coaching = world.events.filter((e) => e.category === 'coaching')
    const facility = world.events.filter((e) => e.category === 'facility')
    expect(facility.length).toBeGreaterThan(0)
    for (const row of facility) expect(-(row.amountCents ?? 0)).toBeGreaterThan(0)
    // Not one cent of coaching, ever - the only 'coaching' row a self-coached career may carry is a
    // stood-down $0 line, and this career books none of those either.
    for (const row of coaching) expect(row.amountCents).toBe(0)
    expect(world.financeWeeks.every((w) => w.byCategory.coaching === undefined)).toBe(true)
  })

  it('bills a hired family for both, with the coach the larger half at every rung above budget', () => {
    for (const tier of ['budget', 'middle', 'high', 'elite'] as CoachTier[]) {
      const world = createWorld(`hired-${tier}`, { ...DEFAULT_PROFILE, coachTier: tier })
      world.fundsCents = 10_000_000_00
      const rng = rngFromSeed(world.seed)
      tickWeek(world, rng)
      const rows = weekRows(world.events, 1)
      expect(rows.map((r) => r.category).sort()).toEqual(['coaching', 'facility'])
      for (const row of rows) expect(-(row.amountCents ?? 0)).toBeGreaterThan(0)
    }
    // ...and at the midpoint of each rung the coach overtakes the court above Budget, which is the
    // shape of the price ladder read back off the split: Budget is mostly the court (a $30/h coach
    // over a $20/h court), Elite is mostly the man.
    for (const tier of ['middle', 'high', 'elite'] as CoachTier[]) {
      const s = weeklyBillSplit({
        rateCents: midRate(tier, 14),
        ageYears: 14,
        tier,
        plan: WEEK_PLAN_PRESETS.balanced,
        background: 'middle',
      })
      expect(s.coachCents, tier).toBeGreaterThan(s.facilityCents)
    }
    const budget = weeklyBillSplit({
      rateCents: midRate('budget', 14),
      ageYears: 14,
      tier: 'budget',
      plan: WEEK_PLAN_PRESETS.balanced,
      background: 'middle',
    })
    expect(budget.coachCents).toBeLessThan(budget.facilityCents)
  })

  it('keeps the training flavour as the week\'s FIRST expense, which is the recap\'s scrap', () => {
    // ⚠ THE EMISSION ORDER IS LOAD-BEARING. `WeekRecapCard`'s handwritten note under the painting is
    // `weekEvents.find(e => e.type === 'expense').text` - the week's first expense - and on roughly
    // two ordinary weeks in three it is the only thing the Weekly Story has to say. Emitting the
    // court above the coach would have replaced every hired family's "Coaching block: technique
    // drills" with a court receipt, silently, and no other test looks at the order.
    const world = createWorld('recap-scrap', { ...DEFAULT_PROFILE, coachTier: 'high' })
    world.fundsCents = 10_000_000_00
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    const first = world.events.find((e) => e.week === 1 && e.type === 'expense')!
    expect(first.category).toBe('coaching')
    expect(first.text).not.toContain('courts')
    expect(first.text).not.toContain('Court hire')

    // ...and a self-coached family's scrap is the court line, deliberately: it used to read
    // "Coaching block: ..." to a family with no coach, which is the category error this slice removes.
    const solo = createWorld('recap-scrap-self', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng2 = rngFromSeed(solo.seed)
    tickWeek(solo, rng2)
    const soloFirst = solo.events.find((e) => e.week === 1 && e.type === 'expense')!
    expect(soloFirst.category).toBe('facility')
  })

  it('prices the facility by the corridor - the owner\'s own argument, and it needed no new maths', () => {
    // «с разным тиром для разного уровня семей». The corridor multiplies the whole bill, so it
    // multiplies the court with it: the same rung's court costs less in a working-class club than in
    // a premium academy. Asserted on the LEDGER rather than on the helper, because the claim is about
    // what the family is charged.
    const facilityFor = (background: FamilyBackground): number => {
      const world = createWorld('court-corridor', { ...DEFAULT_PROFILE, background, coachTier: 'middle' })
      const rng = rngFromSeed(world.seed)
      tickWeek(world, rng)
      const row = world.events.find((e) => e.week === 1 && e.category === 'facility')!
      return -(row.amountCents ?? 0)
    }
    const [w, m, r] = BACKGROUNDS.map(facilityFor)
    expect(w).toBeLessThan(m)
    expect(m).toBeLessThan(r)
  })

  // ⚠ THE ROW GREW A WEEK CLAUSE (R15-17), SO THE TWO COPY TESTS BELOW READ ITS HEAD - AND NOTHING
  // ELSE ABOUT THEM MOVED. `facilityFlavor` now returns "<venue> – <hours> h, <when>", where the
  // clause is a fact about THIS WEEK's booking (peak / off-peak read off the jitter the bill already
  // drew, or an ordinary slot off the private `seed:court:<week>` sub-stream). The owner's sighting
  // was that the head alone was byte-identical for 208 weeks on a self-coached career, which is the
  // line their recap scrap shows them.
  //
  // The protected fact these two tests exist for is a claim about the HEAD: the row names the
  // corridor's venue and the hours the plan buys, and one venue step per distinct court price. That
  // claim is asserted here exactly as before, against the same nine strings, byte for byte - the
  // slice is what re-aims, not the assertion. Comparing whole strings would instead pin the DICE,
  // which is the opposite of what this file is for.
  const head = (text: string): string => text.split(', ')[0]

  it('says where she trains and for how long, in the app\'s own voice', () => {
    // The row has to be readable on its own: a venue that names the corridor and the hours the plan
    // buys, which together are the whole line bar the week's jitter.
    //
    // ⚠ RE-AIMED 08.08 FROM `coachTier: 'middle'` TO `'budget'`, AND NOT WEAKENED
    // (docs/specs/court-follows-the-coach-2026-08.md, owner: «более дорогой тренер = более дорогой
    // корт»). These three strings are the CLUB row - the venue `self` and `budget` share - and they are
    // byte-identical to what shipped with the split. `middle` used to be a club rung too and is now one
    // step up the venue ladder, so the fixture moves to a rung that still trains at the club and the
    // asserted copy does not move at all. The protected fact is unchanged: the row names the corridor's
    // venue and the hours the plan buys. Every OTHER cell of the 3 x 4 table is pinned in the test below,
    // which also asserts that no two rungs in one corridor can share words at different prices.
    const texts = BACKGROUNDS.map((background) => {
      const world = createWorld('court-copy', { ...DEFAULT_PROFILE, background, coachTier: 'budget' })
      const rng = rngFromSeed(world.seed)
      tickWeek(world, rng)
      return world.events.find((e) => e.week === 1 && e.category === 'facility')!.text
    })
    expect(head(texts[0])).toBe('Club courts – 5 h')
    expect(head(texts[1])).toBe('Court hire – 5 h')
    expect(head(texts[2])).toBe('Academy courts – 5 h')
    // ...and R15-17's clause is really there, on every one of them, so the re-aim above cannot be
    // satisfied by a row that quietly went back to printing the head alone.
    for (const t of texts) {
      expect(t.startsWith(`${head(t)}, `), t).toBe(true)
      expect(t.slice(head(t).length + 2).length, t).toBeGreaterThan(0)
    }
    // Short dash only, and no long dash anywhere in player-facing copy.
    for (const t of texts) expect(t).not.toContain('—')
    // The plan really does drive the hours the row prints. (Same re-aim: a club rung, so the venue words
    // are the ones this test has always asserted and only the hour count is under examination.)
    const world = createWorld('court-copy-grind', { ...DEFAULT_PROFILE, coachTier: 'budget' })
    world.plan = WEEK_PLAN_PRESETS.grind
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    expect(head(world.events.find((e) => e.week === 1 && e.category === 'facility')!.text)).toBe('Court hire – 6 h')
  })

  it('names the RUNG\'S venue too, because the court price now moves with it', () => {
    // ⚠ THE COPY HAD TO GROW WITH `courtTierFactor`, and it is not decoration
    // (docs/specs/court-follows-the-coach-2026-08.md). A `high` family and a `budget` family in the SAME
    // corridor now pay different court prices; if the row said the same words to both, we would have
    // re-created the unexplained-charge complaint the bill split exists to remove - the same number
    // wearing no explanation. So the look-up is 3 corridors x 3 venue steps.
    //
    // ⚠ THE THREE STRINGS THE TEST ABOVE PINS SURVIVE VERBATIM as the club row (self / budget / middle),
    // which is the copy half of "the cheap end did not move". This test is the OTHER two rows.
    // ⚠ READS THE HEAD (R15-17) - see the note above the previous test. Every cell below is the same
    // string it has always been; the week clause is stripped because it is a property of the WEEK and
    // each of these nine worlds runs a different seed, so leaving it in would have turned a copy pin
    // into a dice pin. `venueRaw` keeps the whole row for the two sweeps that need it.
    const venueRaw = (background: FamilyBackground, coachTier: CoachTier): string => {
      const world = createWorld(`venue-${background}-${coachTier}`, { ...DEFAULT_PROFILE, background, coachTier })
      const rng = rngFromSeed(world.seed)
      tickWeek(world, rng)
      return world.events.find((e) => e.week === 1 && e.category === 'facility')!.text
    }
    const venueFor = (background: FamilyBackground, coachTier: CoachTier): string =>
      head(venueRaw(background, coachTier))
    // ⚠ ONE VENUE STEP PER DISTINCT COURT PRICE, which is the rule that makes the copy honest: rungs
    // that pay the same read the same, and rungs that pay differently say so. `self` and `budget` share
    // the club row - and that row is the string that shipped with the split, unchanged, because their
    // court price did not move one cent.
    for (const tier of ['self', 'budget'] as CoachTier[]) {
      expect(venueFor('working', tier), tier).toBe('Club courts – 5 h')
      expect(venueFor('middle', tier), tier).toBe('Court hire – 5 h')
      expect(venueFor('wealthy', tier), tier).toBe('Academy courts – 5 h')
    }
    // ...and the three rungs that pay more each say so. The ladders OVERLAP between corridors on
    // purpose: a working family's best venue is a middle family's ordinary one, which is what a real
    // market looks like from inside it.
    expect(venueFor('working', 'middle')).toBe('Indoor courts – 5 h')
    expect(venueFor('working', 'high')).toBe('Academy courts – 5 h')
    expect(venueFor('working', 'elite')).toBe('Performance centre – 5 h')
    expect(venueFor('middle', 'middle')).toBe('Academy courts – 5 h')
    expect(venueFor('middle', 'high')).toBe('Performance centre – 5 h')
    expect(venueFor('middle', 'elite')).toBe('Show courts – 5 h')
    expect(venueFor('wealthy', 'middle')).toBe('Performance centre – 5 h')
    expect(venueFor('wealthy', 'high')).toBe('Show courts – 5 h')
    expect(venueFor('wealthy', 'elite')).toBe('Centre court – 5 h')

    // ⚠ AND THE COPY MUST NOT SAY THE SAME THING AT TWO DIFFERENT PRICES, inside one corridor. That is
    // the whole reason this test exists rather than a spot-check: it is the exact bug the bill split was
    // built to remove, one level deeper.
    for (const bg of BACKGROUNDS) {
      const seen = new Map<string, number>()
      for (const tier of COACH_TIERS) {
        const price = facilityRateCents(14, tier)
        const words = venueFor(bg, tier)
        const already = seen.get(words)
        if (already !== undefined) expect(price, `${bg}/${tier}`).toBe(already)
        seen.set(words, price)
      }
    }
    // Short dash only, no Cyrillic, in every one of the nine – and this sweep reads the WHOLE row,
    // clause included, because a copy rule that stopped at the comma would be no rule at all.
    for (const bg of BACKGROUNDS) {
      for (const tier of COACH_TIERS) {
        const t = venueRaw(bg, tier)
        expect(t).not.toContain('—')
        expect(t).not.toMatch(/[Ѐ-ӿ]/)
      }
    }
  })
})

// =================================================================================================
// R15-17 - "Club courts – 5 h", every week, for a whole career.
//
// Owner, 09.08. `facilityFlavor` was `FACILITY_VENUE[background][coachStep]` plus the plan's hours,
// and for a self-coached family at a fixed background BOTH inputs are constant - so the string was
// byte-identical on all 208 weeks. It is also the line those families read most: a self-coached
// family books no coach row at all, so the court row is what WeekRecapCard puts on the handwritten
// scrap under the painting.
//
// ⚠ THE FIX MAY NOT COST THE MAIN STREAM A DRAW and may not turn a receipt into a story. Both halves
// are asserted below, and the first one is also held from the other end by the frozen MAIN capture in
// tests/condition.test.ts - a new `pickInt` here would move `e6b0c709` and that file would go red.
// =================================================================================================
describe('R15-17 - the court receipt stops being one string for a career', () => {
  /** The facility row for each of the first `weeks` weeks of a self-coached working career - the
   *  owner's own cell, the one where every other input is constant. */
  function facilityRows(weeks: number, seed = 'court-variety'): string[] {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
    world.fundsCents = 10_000_000_00
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < weeks; i++) tickWeek(world, rng)
    return world.events.filter((e) => e.category === 'facility').map((e) => e.text)
  }

  it('the same family, same background, same plan, no longer reads one sentence for ever', () => {
    const rows = facilityRows(40)
    expect(rows.length).toBeGreaterThan(30)
    // The defect, stated: before this wave `new Set(rows).size` was 1.
    expect(new Set(rows).size).toBeGreaterThan(3)
  })

  it('...and it is still a RECEIPT: every row names the venue and the hours it charged for', () => {
    // The variation may not cost the line its job. The head is the thing the family is paying for,
    // and it is the same head on every week because the venue and the plan really did not move.
    const rows = facilityRows(40)
    for (const r of rows) expect(r.startsWith('Club courts – 5 h, '), r).toBe(true)
    // ...and the clause is short enough for the scrap it lands on (see facilityFlavor's own note:
    // the training flavours sharing that paper already run to 40 characters).
    for (const r of rows) expect(r.length, r).toBeLessThanOrEqual(40)
  })

  it('it is DETERMINISTIC - the same career replays the same receipts', () => {
    // A career is a replay of its seed. A line that re-rolled on every load would be the one thing a
    // ledger may never do, whatever else it varies.
    expect(facilityRows(30)).toEqual(facilityRows(30))
    // ...and a different career is a different sequence, so the pin above is not vacuous.
    expect(facilityRows(30)).not.toEqual(facilityRows(30, 'court-variety-two'))
  })

  it('it costs the MAIN stream nothing - the clause rides the jitter and a private sub-stream', () => {
    // ⚠ INVARIANT 2. The `seed:court:<week>` stream is re-derived at the call site and persists
    // nothing; the peak/off-peak half is read off the jitter `resolveBaseCosts` already drew. So the
    // draw COUNT and the draw VALUES for a whole season must be identical to a run where the words
    // could not vary - which is what a self-coached and an elite career being byte-identical proves,
    // since the two take different branches through the row emission entirely.
    const capture = (tier: CoachTier): string => {
      const world = createWorld('court-rng', { ...DEFAULT_PROFILE, coachTier: tier })
      world.fundsCents = 10_000_000_00
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) tickWeek(world, rng)
      return `${draws.length}:${draws.join(',')}`
    }
    expect(capture('self')).toBe(capture('elite'))
  })

  it('the clause is a READING OF THE CHARGE - peak weeks really do cost more than off-peak ones', () => {
    // ⚠ THE HALF WORTH HAVING, AND THE ONE THAT MAKES IT A RECEIPT RATHER THAN DECORATION. `jitter`
    // is the one MAIN `pickInt` the bill already draws and it multiplies the facility line, so weeks
    // genuinely cost different money - and until this wave the row said nothing about why. The peak
    // and off-peak wordings are read off that same draw, so they must sort with the price.
    //
    // ⚠ ASSERTED ON MEANS, NOT ON THE TOP AND BOTTOM ROWS, and that is arithmetic rather than
    // caution. The corridor roll (`seed:coachbg:<week>`) is a SECOND multiplier of comparable width -
    // working is [0.7, 0.8], ±6.7%, against the jitter's ±8% - so a single dear week can be cheaper
    // than a single quiet one and the price ORDER does not track the jitter order row by row. Over a
    // season the corridor averages out and the ~11% gap between the two jitter bands does not.
    //
    // The two wordings are named here because they are copy, and pinning copy is what this file
    // already does with the nine venue strings above.
    const DEAR = new Set(['peak slots', 'peak rate', 'prime time', 'the busy hours'])
    const CHEAP = new Set(['off-peak', 'quiet hours', 'early slots', 'off-peak rate'])

    const world = createWorld('court-price-words', { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
    world.fundsCents = 10_000_000_00
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 104; i++) tickWeek(world, rng)
    const rows = world.events
      .filter((e) => e.category === 'facility')
      .map((e) => ({ cents: -(e.amountCents ?? 0), clause: e.text.split(', ')[1] }))
    expect(rows.length).toBeGreaterThan(40)

    // All THREE bands are live: the two price bands and the ordinary one in between. A branch that
    // never reached one of them would still pass the variety test above.
    const dear = rows.filter((r) => DEAR.has(r.clause))
    const cheap = rows.filter((r) => CHEAP.has(r.clause))
    const ordinary = rows.filter((r) => !DEAR.has(r.clause) && !CHEAP.has(r.clause))
    expect(dear.length, 'no week ever read as a peak week').toBeGreaterThan(3)
    expect(cheap.length, 'no week ever read as an off-peak week').toBeGreaterThan(3)
    expect(ordinary.length, 'no week ever read as an ordinary booking').toBeGreaterThan(3)

    const mean = (xs: { cents: number }[]): number => xs.reduce((s, x) => s + x.cents, 0) / xs.length
    expect(mean(dear), 'peak weeks must bill more than off-peak ones').toBeGreaterThan(mean(cheap))
    expect(mean(dear)).toBeGreaterThan(mean(ordinary))
    expect(mean(ordinary)).toBeGreaterThan(mean(cheap))
  })
})

describe('RNG discipline - one draw produced two lines', () => {
  it('taps a byte-identical MAIN sequence whether the rung books one line or two', () => {
    // ⚠ THE SPLIT ADDED NO DRAW, and it did not need to. The jitter is a property of the WEEK - a
    // session moved, a court at a busier hour - so ONE `pickInt` is carried by both lines rather than
    // each of them wobbling independently. `self` books one row and `elite` books two; the streams
    // must not be able to tell.
    const capture = (tier: CoachTier): string => {
      const world = createWorld('split-rng', { ...DEFAULT_PROFILE, coachTier: tier })
      world.fundsCents = 10_000_000_00
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) tickWeek(world, rng)
      return `${draws.length}:${draws.join(',')}`
    }
    const reference = capture('self')
    for (const tier of COACH_TIERS) expect(capture(tier), tier).toBe(reference)
  })

  it('puts the whole price difference between two coaches AT ONE RUNG on the COACH line', () => {
    // ⚠ RE-AIMED 08.08 FROM "two coaches" TO "two coaches AT ONE RUNG", NOT WEAKENED
    // (docs/specs/court-follows-the-coach-2026-08.md). It used to compare a $30/h coach against a
    // $120/h one and assert an identical facility line, which was true only because
    // `facilityRateCents` took no rung argument at all - and that WAS the defect: an Elite coach
    // worked on the same court as a self-coaching parent. The owner's own venue ladder is $22 club /
    // $44+ elsewhere / dearer again at elite, and a published single-venue coach card spans only
    // x1.13-1.43 against our x4.0 rung ladder, so our four rungs are four VENUES.
    //
    // THE PROTECTED FACT IS UNCHANGED AND IS NOW ASSERTED TWICE, which is why this is a re-aim: the
    // court is a property of WHERE she trains and never of WHO she hired, so (a) two coaches at the
    // same rung pay the identical court however far apart their own rates are - the arm below, and
    // the one the original test was really about - and (b) the court moves ONLY when the rung does.
    const at = (rateCents: number, tier: CoachTier) =>
      weeklyBillSplit({ rateCents, ageYears: 15, tier, plan: WEEK_PLAN_PRESETS.balanced, background: 'middle' })

    // (a) WITHIN a rung: the elite band is $96-144/h at 12-16, so these are two real elite coaches.
    const cheapElite = at(96_00, 'elite')
    const dearElite = at(144_00, 'elite')
    expect(dearElite.facilityCents).toBe(cheapElite.facilityCents)
    expect(dearElite.coachCents - cheapElite.coachCents).toBe(dearElite.totalCents - cheapElite.totalCents)

    // ...and it holds at the bottom rung too, where the court is most of the bill.
    const cheapBudget = at(24_00, 'budget')
    const dearBudget = at(36_00, 'budget')
    expect(dearBudget.facilityCents).toBe(cheapBudget.facilityCents)

    // (b) ACROSS rungs the court DOES move, and it moves by `courtTierFactor` and nothing else. At the
    // same rate, same age, same plan, same corridor: an elite venue is x2.4 a club court and a `high`
    // one x1.9, so a coach who somehow charged $100/h would pay a different court at each rung.
    const club = at(100_00, 'middle')
    const better = at(100_00, 'high')
    const best = at(100_00, 'elite')
    expect(better.facilityCents).toBeGreaterThan(club.facilityCents)
    expect(best.facilityCents).toBeGreaterThan(better.facilityCents)
    expect(club.totalCents).toBe(best.totalCents) // the TOTAL is the rate's, not the venue's
  })

  it('climbs with the rung - a dearer coach means a dearer court, which is the owner\'s rule', () => {
    // ⚠ HIS RULING, 08.08, and the ladder's shape is it verbatim:
    //     «Можно вообще стоимость корта по тиру к тиру тренера привязывать и всё.
    //      Более дорогой тренер = более дорогой корт.»
    // So the court is a monotone non-decreasing function of the rung, at EVERY age row, and it is
    // strictly increasing everywhere the arithmetic allows.
    for (const age of AGES) {
      let prev = 0
      for (const tier of COACH_TIERS) {
        const court = facilityRateCents(age, tier)
        expect(court, `${tier} @ ${age} must not be cheaper than the rung below`).toBeGreaterThanOrEqual(prev)
        prev = court
      }
      // Strict at the three rungs that can take a step.
      const club = facilityRateCents(age, 'self')
      expect(facilityRateCents(age, 'middle'), `middle @ ${age}`).toBeGreaterThan(club)
      expect(facilityRateCents(age, 'high'), `high @ ${age}`).toBeGreaterThan(facilityRateCents(age, 'middle'))
      expect(facilityRateCents(age, 'elite'), `elite @ ${age}`).toBeGreaterThan(facilityRateCents(age, 'high'))
      // ⚠ AND `budget` IS THE ONE CELL HIS RULE CANNOT REACH, asserted so the reason survives as code.
      // A Budget coach's whole bill is $30/h at 12-16 and $20 of it is already the court, so his labour
      // is $10 at the midpoint and $4 at the bottom of his band. Lifting his court even to the owner's
      // own $22 club figure would leave the cheapest Budget coach in the game $2/h - below every
      // published coaching rate anywhere in docs/research/real-coaching-costs.md §3a. It shares the
      // club with `self`, and the fiction is exact: a club coach uses the club's courts, which are the
      // same courts the parent books for herself.
      expect(facilityRateCents(age, 'budget'), `budget @ ${age}`).toBe(club)
    }
    // And the club court is still the number the owner signed off on 29.07: the middle of $10-30. The
    // cheap end was already right (research §7) and a re-price there would be inventing a correction.
    expect(facilityRateCents(14, 'self')).toBe(20_00)
  })

  it('cannot move the TOTAL whatever the venue ladder says - the theorem, pinned', () => {
    // ⚠⚠ THIS IS WHY A COURT RE-PRICE IS FREE, AND IT IS WORTH AN ASSERTION RATHER THAN AN ARGUMENT
    // (docs/specs/court-follows-the-coach-2026-08.md §3d). `totalCents` is computed from the rate, the
    // plan, the background, the corridor and the jitter - `tier` does not appear in it. So ANY value of
    // `courtTierFactor` that clears the guards above leaves `world.fundsCents` identical on every week
    // of every career, and the bench can only ever report the survival rate it already had.
    //
    // The consequence the owner should know: the bench CANNOT decide what the court ladder should be.
    // It is free in survival terms, so the question is evidential and not economic. Two full bench runs
    // demonstrated it at two different ladders (538 of 1,620 both times); this holds it as arithmetic,
    // which is cheaper and stricter than a third run.
    for (const background of BACKGROUNDS) {
      for (const age of AGES) {
        for (const plan of PLANS) {
          const rate = 100_00
          const totals = COACH_TIERS.map(
            (tier) => weeklyBillSplit({ rateCents: rate, ageYears: age, tier, plan, background }).totalCents,
          )
          for (const t of totals) expect(t, `${background}/${age}`).toBe(totals[0])
        }
      }
    }
  })

  it('keeps the venue ladder inside the two ceilings that pin it', () => {
    // ⚠ NEITHER CEILING IS A STYLE PREFERENCE; each is a place the model breaks.
    //
    // (1) A rung's court must stay UNDER HALF its midpoint bill, or the room becomes the larger half
    //     and the "Budget is mostly the court, Elite is mostly the man" shape inverts. This is why
    //     `middle` gets no step at all - its $50/h midpoint caps the court at $25/h, a x1.25 ceiling
    //     too small to be a decision - and why `high` is 1.9 rather than the 2.0 his "$44 vs $22"
    //     implies: at 2.0 the court is EXACTLY half an $80 bill and the assertion above turns on a
    //     rounding.
    // (2) Every hired rung's band LOW must exceed its OWN court, or a coach drawn at the bottom of his
    //     rung books a $0 coach line and the ledger says a coach worked free.
    for (const age of AGES) {
      for (const tier of ['budget', 'middle', 'high', 'elite'] as CoachTier[]) {
        const court = facilityRateCents(age, tier)
        const [lo, hi] = coachRateBandCents(tier, age)
        expect(lo, `${tier} @ ${age}: band low vs its own court`).toBeGreaterThan(court)
        if (tier !== 'budget') {
          // Budget is court-dominated by design (the rung above asserts it); everything above is not.
          // The midpoint is (lo + hi) / 2 and the court must be under half of THAT, so the comparison
          // is `court * 4 < lo + hi`. ⚠ Written as an integer inequality rather than `court < mid / 2`
          // so a rung sitting exactly on the line fails rather than surviving on a rounding - which is
          // the case that actually bites, since `high` at x2.0 lands precisely there.
          expect(court * 4, `${tier} @ ${age}: court vs half the midpoint`).toBeLessThan(lo + hi)
        }
      }
    }
  })
})

describe('an old save still reads, and its history is not retconned', () => {
  it('migrates v43 to the current schema and leaves its coaching rows exactly as they were billed', () => {
    // ⚠ THE MIGRATION BACK-FILLS NOTHING ON PURPOSE. A v43 career's 'coaching' rows are the numbers
    // that were ACTUALLY charged as one line, and nothing in a save can say which cents of them were
    // the court - `financeWeeks` keeps a total per category and no rate, no hours and no week's plan.
    // A reconstruction would be a guess wearing a ledger's clothes, so history stays as it was billed
    // and the split begins at the next tick.
    const raw = JSON.parse(
      readFixture('v43.json'),
    ) as { financeWeeks: { week: number; byCategory: Record<string, number> }[] }
    const before = raw.financeWeeks.map((w) => [w.week, w.byCategory.coaching ?? 0] as const)
    const migrated = migrateSave(JSON.parse(readFixture('v43.json')))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    const after = migrated.financeWeeks.map((w) => [w.week, w.byCategory.coaching ?? 0] as const)
    expect(after).toEqual(before)
    // ...and not one facility row was invented.
    expect(migrated.financeWeeks.every((w) => w.byCategory.facility === undefined)).toBe(true)
    expect(migrated.events.every((e) => e.category !== 'facility')).toBe(true)
  })

  it('starts splitting from the very next tick of a migrated career', () => {
    const migrated = migrateSave(JSON.parse(readFixture('v43.json')))
    migrated.fundsCents = 10_000_000_00
    const rng = rngFromSeed(migrated.seed)
    const at = migrated.week
    tickWeek(migrated, rng)
    expect(migrated.events.some((e) => e.week > at && e.category === 'facility')).toBe(true)
  })
})


/** ⚠ A coach's own hourly rate can never fall to the court's, or the split would produce a $0 coach
 *  line for a hired rung and the ledger would say a coach worked free. Asserted over the whole rate
 *  table rather than at one age, because it is a property of the PRICES and the prices are tuned. */
describe('the price table keeps every hired rung above the court', () => {
  it('leaves daylight between the club court and the cheapest rung, at every age row', () => {
    // ⚠ RE-AIMED 08.08: `facilityRateCents` now takes the rung, so this arm reads the CLUB court and
    // the per-rung version of the same claim moved into "keeps the venue ladder inside the two
    // ceilings that pin it" above, where it is asserted against each rung's OWN court. Both survive:
    // this one is about the cheap end (no rung starts below the club court) and that one is about the
    // top (no rung's low falls below its own dearer venue).
    for (const age of AGES) {
      const court = facilityRateCents(age, 'self')
      for (const tier of ['budget', 'middle', 'high', 'elite'] as CoachTier[]) {
        const [lo] = coachRateBandCents(tier, age)
        expect(lo, `${tier} @ ${age}`).toBeGreaterThan(court)
      }
    }
  })

  it('never books a coach line for a rung whose coach is the parent', () => {
    for (const age of AGES) {
      const s = weeklyBillSplit({
        rateCents: facilityRateCents(age, 'self'),
        ageYears: age,
        tier: 'self',
        plan: WEEK_PLAN_PRESETS.balanced,
        background: 'middle',
      })
      expect(s.coachCents).toBe(0)
      expect(s.facilityCents).toBe(s.totalCents)
    }
  })
})

/** The hired-rung roster resolves through `coachById`, and the split reads its rate - so a career
 *  that holds a coach id must produce a coach line whose size tracks THAT coach's price. */
describe('the coach line is HIS price, not the rung\'s', () => {
  it('moves with the individual coach a career actually hired', () => {
    const world = createWorld('his-price', { ...DEFAULT_PROFILE, coachTier: 'elite' })
    const coach = coachById(world.seed, 14, world.coachId)!
    const expected = weeklyBillSplit({
      rateCents: coach.rateCents,
      ageYears: 14,
      tier: coach.tier,
      plan: world.plan,
      background: world.profile.background,
    })
    // The quote's midpoint corridor, so this compares like with like against the market card.
    expect(expected.coachCents).toBeGreaterThan(0)
    // ⚠ RE-AIMED 08.08: the reference court is HIS RUNG'S court, not the club's. An elite career pays
    // an elite venue (x2.4), so comparing against `facilityRateCents(14, 'self')` would now be
    // comparing against a court she never books. The protected fact is the same one - the facility
    // line is exactly what the court alone would cost at her plan and corridor.
    expect(expected.facilityCents).toBe(
      weeklyBillSplit({
        rateCents: facilityRateCents(14, coach.tier),
        ageYears: 14,
        tier: coach.tier,
        plan: world.plan,
        background: world.profile.background,
      }).totalCents,
    )
  })
})
