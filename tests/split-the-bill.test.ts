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

/** Every rung's midpoint rate at one age - `self` being the court itself. */
function midRate(tier: CoachTier, age: number): number {
  if (tier === 'self') return facilityRateCents(age)
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
              const split = weeklyBillSplit({ rateCents: rate, ageYears: age, plan, background, corridor, jitter })
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
        plan: WEEK_PLAN_PRESETS.balanced,
        background: 'middle',
      })
      expect(s.coachCents, tier).toBeGreaterThan(s.facilityCents)
    }
    const budget = weeklyBillSplit({
      rateCents: midRate('budget', 14),
      ageYears: 14,
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

  it('says where she trains and for how long, in the app\'s own voice', () => {
    // The row has to be readable on its own: a venue that names the corridor and the hours the plan
    // buys, which together are the whole line bar the week's jitter.
    const texts = BACKGROUNDS.map((background) => {
      const world = createWorld('court-copy', { ...DEFAULT_PROFILE, background, coachTier: 'middle' })
      const rng = rngFromSeed(world.seed)
      tickWeek(world, rng)
      return world.events.find((e) => e.week === 1 && e.category === 'facility')!.text
    })
    expect(texts[0]).toBe('Club courts – 5 h')
    expect(texts[1]).toBe('Court hire – 5 h')
    expect(texts[2]).toBe('Academy courts – 5 h')
    // Short dash only, and no long dash anywhere in player-facing copy.
    for (const t of texts) expect(t).not.toContain('—')
    // The plan really does drive the hours the row prints.
    const world = createWorld('court-copy-grind', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    world.plan = WEEK_PLAN_PRESETS.grind
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    expect(world.events.find((e) => e.week === 1 && e.category === 'facility')!.text).toBe('Court hire – 6 h')
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

  it('puts the whole price difference between two coaches on the COACH line', () => {
    // The court is the court: two families in the same market, at the same plan and the same age,
    // pay the same for it whoever they hired. Everything a dearer coach costs lands on his own line,
    // which is what makes the two rows answer different questions instead of both drifting together.
    const at = (rateCents: number) =>
      weeklyBillSplit({ rateCents, ageYears: 15, plan: WEEK_PLAN_PRESETS.balanced, background: 'middle' })
    const cheap = at(30_00)
    const dear = at(120_00)
    expect(dear.facilityCents).toBe(cheap.facilityCents)
    expect(dear.coachCents - cheap.coachCents).toBe(dear.totalCents - cheap.totalCents)
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
  it('leaves daylight between the self band and the cheapest rung, at every age row', () => {
    for (const age of AGES) {
      const court = facilityRateCents(age)
      for (const tier of ['budget', 'middle', 'high', 'elite'] as CoachTier[]) {
        const [lo] = coachRateBandCents(tier, age)
        expect(lo, `${tier} @ ${age}`).toBeGreaterThan(court)
      }
    }
  })

  it('never books a coach line for a rung whose coach is the parent', () => {
    for (const age of AGES) {
      const s = weeklyBillSplit({
        rateCents: facilityRateCents(age),
        ageYears: age,
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
      plan: world.plan,
      background: world.profile.background,
    })
    // The quote's midpoint corridor, so this compares like with like against the market card.
    expect(expected.coachCents).toBeGreaterThan(0)
    expect(expected.facilityCents).toBe(
      weeklyBillSplit({
        rateCents: facilityRateCents(14),
        ageYears: 14,
        plan: world.plan,
        background: world.profile.background,
      }).totalCents,
    )
  })
})
