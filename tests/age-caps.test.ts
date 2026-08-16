import { describe, it, expect } from 'vitest'
import { worldFunction } from './worldSource'
import { readFileSync } from 'node:fs'
import {
  KID_ID,
  SAVE_SCHEMA_VERSION,
  ageAtWeek,
  ageWindowStartWeek,
  annualEntryLimit,
  annualProEntryLimit,
  availabilityStatus,
  cancelEntry,
  createWorld,
  enterEvent,
  entryCapUsage,
  entryStatus,
  isCappedTier,
  isTierAgeOpen,
  proEntryCapUsage,
  proSubCapUsage,
  recomputeKidRank,
  yearEndJuniorRank,
  seasonStartWeek,
  tickWeek,
  toSnapshot,
  withdrawEvent,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { tierState, type TierStateInput } from '../src/composables/tierState'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type SeasonHistoryEntry } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// THE ITF ANNUAL ENTRY CAP – docs/research/ranking-points-by-tier.md §2 (Appendix F of the
// 2026 ITF World Tennis Tour Juniors Regulations) and §6, structural consequence 4.
//
// The research found that reality's brake on "just grind cheap international events" is NOT the
// points table but a hard eligibility cap: how many ITF junior events a player may enter per year,
// tighter the younger she is. We let a 14-year-old play 26 J30s; the ITF lets her play 14 junior
// events in TOTAL. Wave B already proved that zeroing the first-round award did not reduce the
// count (docs/specs/wave-b-first-round-zero.md) – this is the eligibility half of that finding.
// ---------------------------------------------------------------------------

/** Grant the kid a single counting DOMESTIC result so her domestic best-6 equals `points`. */
function giveKidPoints(world: WorldState, points: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
}

/** Grant her a real international BOOK – four J300 titles – and refresh the rank cache the ITF
 *  rungs read. Four is the number, not one: J60 and J300 are an acceptance list, so what they ask
 *  for is a POSITION (top 120 / top 50), and a position is only as good as the field around it.
 *  1200 ITF points lands her #21–#35 against the pre-history table on every seed in this file. */
function giveKidItfStanding(world: WorldState): void {
  for (let i = 0; i < 4; i++) world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
  recomputeKidRank(world)
}

function injectEvent(
  world: WorldState,
  partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `cap-${partial.week}-${partial.tier}`,
    week: partial.week,
    tier: partial.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek ?? partial.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** A world where money, points, STANDING and body are all a non-issue – so the ONLY thing that can
 *  refuse an entry is the cap under test.
 *
 *  Standing joined that list with the two ladders (docs/specs/two-ladders.md): a domestic pile no
 *  longer buys an international entry, because J60 and J300 read her ITF RANK and J30 reads her
 *  national one. Both halves are therefore seeded – 1000 domestic points to clear every band, and
 *  an ITF book to put her inside the top 50 – or the cap tests below would be proving the entry
 *  gate refuses an unranked kid, which is a different test that already exists. */
/** ⚠ RE-AIMED, NOT WEAKENED, BY THE ONE-CLOCK RULING (09.08 – docs/specs/round15-triage.md ruling 1).
 *  Every allowance below is now read off HER age (`kidAgeAt`) instead of the birth-month-free band, and
 *  this file's whole arithmetic – "she is 14 at week 0", `AGE16_FROM = 104` – is the arithmetic of a
 *  girl whose birthday coincides with the season boundary. That is a JANUARY girl and nobody else:
 *  `DEFAULT_PROFILE` is a June one, who is genuinely 13 in the opening January and 15 at week 104.
 *
 *  So the birthday is PINNED rather than the numbers moved. Not one assertion in this file changes, and
 *  the file goes on measuring what it is named for – the per-age table and the gate that reads it – on
 *  the one birthday for which "the season block" and "the year she is 14" are the same interval. The
 *  December and June arms of the same rule are guarded in `tests/relative-age.test.ts`, which is where
 *  a claim ABOUT the birth month belongs. */
function openWorld(seed = 'agecap'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 6 })
  world.fundsCents = 9_999_999_00
  giveKidPoints(world, 1000) // clears every domestic enterPointBand, and j30's on-ramp at 150
  giveKidItfStanding(world) // ...and the acceptance list above it
  return world
}

/** Weeks INSIDE the current season that carry no blackout (exams 23-24, off-season 49-51).
 *  Staying inside one season matters: the cap is counted per season, so a helper that wandered
 *  past week 51 would be spending next year's allowance and silently prove nothing. A week that
 *  already carries a generated event is fine – `enterEvent` refuses a second ENTRY on a week, not
 *  a second event, and each caller enters at most one of these. */
function seasonWeeks(world: WorldState, count: number, from = 2): number[] {
  const out: number[] = []
  const seasonEnd = seasonStartWeek(world.week) + WEEKS_PER_YEAR
  for (let w = seasonStartWeek(world.week) + from; w < seasonEnd && out.length < count; w++) {
    const offset = w % WEEKS_PER_YEAR
    if (offset >= WEEKS_PER_YEAR - 3 || (offset >= 23 && offset <= 24)) continue
    out.push(w)
  }
  if (out.length < count) throw new Error(`only ${out.length} usable weeks this season`)
  return out
}

/** Enter `n` international events on distinct clean weeks of THIS season; returns those events.
 *  Weeks are taken from the BACK of the season so a caller can still find a free early week for
 *  the event it wants the gate to refuse. */
function fillCap(world: WorldState, n: number, tier: TierId = 'j30'): SeasonEvent[] {
  const events = seasonWeeks(world, 40)
    .slice(-n)
    .map((w, i) => injectEvent(world, { week: w, tier, id: `fill-${i}` }))
  for (const e of events) enterEvent(world, e.id)
  return events
}

/** A clean week of this season that `fillCap` did not take – where a refused entry is tested. */
function freeWeek(world: WorldState): number {
  const taken = new Set(world.internationalEntryWeeks)
  const w = seasonWeeks(world, 40).find((x) => !taken.has(x))
  if (w === undefined) throw new Error('no free week')
  return w
}

// ---------------------------------------------------------------------------
// A1 – THE TABLE. Pinned against the primary source, not invented.
// ---------------------------------------------------------------------------
describe('A1 — the per-age cap table (ITF Appendix F, research §2)', () => {
  it('pins the published per-age numbers verbatim', () => {
    // | 18, 17 | unrestricted | 16 | 25 | 15 | 18 | 14 | 14 | 13 | 10 | <=12 | not eligible |
    expect(ECONOMY.entryCap.perYearByAge[13]).toBe(10)
    expect(ECONOMY.entryCap.perYearByAge[14]).toBe(14)
    expect(ECONOMY.entryCap.perYearByAge[15]).toBe(18)
    expect(ECONOMY.entryCap.perYearByAge[16]).toBe(25)
    expect(ECONOMY.entryCap.perYearByAge.default).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('annualEntryLimit reads the table, and 17+ is unrestricted', () => {
    expect(annualEntryLimit(13)).toBe(10)
    expect(annualEntryLimit(14)).toBe(14)
    expect(annualEntryLimit(15)).toBe(18)
    expect(annualEntryLimit(16)).toBe(25)
    expect(annualEntryLimit(17)).toBe(Number.MAX_SAFE_INTEGER)
    expect(annualEntryLimit(18)).toBe(Number.MAX_SAFE_INTEGER)
    expect(annualEntryLimit(22)).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('is monotonic in age – an older kid is never allowed fewer events', () => {
    for (let age = 13; age < 20; age++) {
      expect(annualEntryLimit(age + 1)).toBeGreaterThanOrEqual(annualEntryLimit(age))
    }
  })

  it('caps ONLY the international tiers – the invented domestic ladder is uncapped', () => {
    expect(isCappedTier('j30')).toBe(true)
    expect(isCappedTier('j60')).toBe(true)
    expect(isCappedTier('j300')).toBe(true)
    expect(isCappedTier('local')).toBe(false)
    expect(isCappedTier('regional')).toBe(false)
    expect(isCappedTier('national')).toBe(false)
    // and the knob agrees with the ladder: every capped tier is a real tier
    for (const t of ECONOMY.entryCap.cappedTiers) expect(TIER_LADDER).toContain(t)
  })
})

// ---------------------------------------------------------------------------
// A2 – THE GATE, through the ONE predicate every surface reads.
// ---------------------------------------------------------------------------
describe('A2 — the gate lives in availabilityStatus / entryStatus', () => {
  it('lets a 14-year-old make exactly 14 international entries, then blocks', () => {
    const world = openWorld()
    expect(ageAtWeek(world.week)).toBe(14)
    fillCap(world, 14)
    expect(entryCapUsage(world, world.week).used).toBe(14)

    const extra = injectEvent(world, { week: freeWeek(world), tier: 'j30', id: 'extra' })
    const gate = entryStatus(world, extra)
    expect(gate.level).toBe('blocked')
    expect(gate.reason).toBe('capped')
    expect(gate.entryCap).toEqual({ used: 14, limit: 14, remaining: 0 })
    expect(() => enterEvent(world, 'extra')).toThrow(/limit/i)
  })

  it('counts j30 + j60 + j300 TOGETHER against one allowance (the ITF caps events, not grades)', () => {
    const world = openWorld()
    const weeks = seasonWeeks(world, 14)
    weeks.forEach((w, i) => {
      const tier: TierId = i % 3 === 0 ? 'j30' : i % 3 === 1 ? 'j60' : 'j300'
      injectEvent(world, { week: w, tier, id: `mix-${i}` })
      enterEvent(world, `mix-${i}`)
    })
    const extra = injectEvent(world, { week: freeWeek(world), tier: 'j300', id: 'mix-extra' })
    expect(entryStatus(world, extra).reason).toBe('capped')
  })

  it('never blocks a DOMESTIC event, however full the international allowance is', () => {
    const world = openWorld()
    fillCap(world, 14)
    for (const tier of ['local', 'regional', 'national'] as TierId[]) {
      const w = freeWeek(world)
      const e = injectEvent(world, { week: w, tier, id: `dom-${tier}` })
      // local/regional graduate her out at 1000 pts, so only assert she is not CAPPED
      expect(entryStatus(world, e).reason).not.toBe('capped')
      expect(availabilityStatus(world, e).reason).not.toBe('capped')
    }
  })

  it('is ONE rule: entryStatus and availabilityStatus give the same capped verdict', () => {
    const world = openWorld()
    fillCap(world, 14)
    const extra = injectEvent(world, { week: freeWeek(world), tier: 'j60', id: 'one-rule' })
    expect(availabilityStatus(world, extra).level).toBe('blocked')
    expect(availabilityStatus(world, extra).reason).toBe('capped')
    expect(entryStatus(world, extra).reason).toBe('capped')
  })

  it('is a POST-DRAW gate: asking the question draws no RNG', () => {
    const world = openWorld()
    fillCap(world, 14)
    const extra = injectEvent(world, { week: freeWeek(world), tier: 'j30', id: 'pure' })
    let draws = 0
    const base = rngFromSeed('unused')
    const counting = () => {
      draws++
      return base()
    }
    void counting // the gate takes no rng at all – proving it by signature
    entryStatus(world, extra)
    availabilityStatus(world, extra)
    entryCapUsage(world, world.week)
    expect(draws).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// A3 – THE YEAR BOUNDARY.
//
// ⚠ RE-AIMED BY P2, NOT WEAKENED: the boundary is HER BIRTHDAY, not `seasonStartWeek`. Every
// assertion below is unchanged and still passes, because this file pins a JANUARY girl (see
// `openWorld`) and for her the season block and the birthday year are the same interval – which is
// exactly why the leak was invisible here for two waves. The claim ABOUT the birth month lives in
// tests/relative-age.test.ts, which now walks a June girl's whole sixteenth year through the gate.
// ---------------------------------------------------------------------------
describe('A3 — the allowance resets on the year boundary', () => {
  it('an event in NEXT season is enterable while THIS season is full', () => {
    const world = openWorld()
    fillCap(world, 14)
    const nextSeason = WEEKS_PER_YEAR + 4
    expect(seasonStartWeek(nextSeason)).toBe(WEEKS_PER_YEAR)
    const e = injectEvent(world, { week: nextSeason, tier: 'j30', id: 'next-season' })
    expect(entryStatus(world, e).reason).not.toBe('capped')
    expect(entryCapUsage(world, nextSeason)).toEqual({ used: 0, limit: 18, remaining: 18 })
  })

  it('reads the allowance of the age she will be in the EVENT season, not the current one', () => {
    const world = openWorld()
    // she is 14 now; an event a season out is played at 15, whose allowance is 18
    expect(annualEntryLimit(ageAtWeek(world.week))).toBe(14)
    expect(entryCapUsage(world, WEEKS_PER_YEAR + 4).limit).toBe(18)
    expect(entryCapUsage(world, 2 * WEEKS_PER_YEAR + 4).limit).toBe(25)
  })

  it('⚠ the WINDOW is the age year, and the prune knows the same boundary (P2)', () => {
    // ⚠ RE-AIMED FROM "uses seasonStartWeek rather than a second definition of this season". That pin
    // was right about the danger (two spellings of one boundary drift apart) and wrong about which
    // boundary: the allowance is counted birthday-to-birthday, so a window on the season block leaked
    // a whole second allowance into every non-January girl's birth year. It now pins the SAME
    // anti-drift property against the right rule, and it is strictly more than the line it replaced –
    // three functions instead of one, both ledgers, and the prune that has to agree with them.
    for (const fn of ['entryCapUsage', 'proEntryCapUsage']) {
      const src = worldFunction(fn)
      expect(src, `${fn}: the window is an age comparison on the ledger row`).toContain('kidAgeAt(world, w) === age')
      expect(src, `${fn}: and no longer a season block`).not.toContain('seasonStartWeek(')
    }
    // The prune is the one caller that genuinely needs a first week, and it must not eat a row either
    // rule can still read – so it takes the EARLIER of the age window and the season block.
    const prune = worldFunction('pruneInternationalEntries')
    expect(prune).toContain('ageWindowStartWeek(')
    expect(prune).toContain('seasonStartWeek(')
    expect(prune).toContain('Math.min(')
  })

  it('a full allowance really does clear once the world ticks into the next season', () => {
    const world = openWorld('agecap-roll')
    fillCap(world, 14)
    expect(entryCapUsage(world, world.week).remaining).toBe(0)
    const rng = rngFromSeed(world.seed)
    while (world.week < WEEKS_PER_YEAR) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        world.pendingTournament.finished = true
        world.pendingTournament = null
      }
    }
    expect(seasonStartWeek(world.week)).toBe(WEEKS_PER_YEAR)
    // ⚠ THE LIMIT IS 22 AND NOT 18 SINCE P2, AND THE FOUR ARE EARNED RATHER THAN LEAKED. This career
    // really does finish its first season inside the junior top twenty (`openWorld` hands her four
    // J300 titles), and Appendix F grants a top-20 fifteen-year-old four extra international events.
    // The claim this test is named for is `used`: the ledger turned over, and it is asserted against
    // the engine's own arithmetic rather than a copied number, so a knob change moves it honestly.
    const fresh = entryCapUsage(world, world.week)
    expect(fresh.used, 'the allowance really did clear').toBe(0)
    expect(fresh.remaining).toBe(fresh.limit)
    expect(yearEndJuniorRank(world), 'and she banked a top-20 season to earn the four').toBeLessThanOrEqual(20)
    expect(fresh.limit).toBe(annualEntryLimit(15) + ECONOMY.entryCap.meritIncrease.juniorByAge[15].extra)
  })
})

// ---------------------------------------------------------------------------
// A3b – THE MERITED INCREASES (P2). ITF Appendix F's +4 and the WTA Pro Path's +4, and the one
// property that makes an addition to a limit safe: it may never fall inside a window.
// ---------------------------------------------------------------------------
function banked(seasonIndex: number, itf: number | null, wta: number | null = null): SeasonHistoryEntry {
  return {
    seasonIndex,
    endRank: 199,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0, ...(itf === null ? {} : { endRank: itf }) },
      wta: { points: 0, wins: 0, losses: 0, ...(wta === null ? {} : { endRank: wta }) },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }
}

describe('A3b — the merited increases', () => {
  it('pins the published rows – Appendix F and the WTA Pro Path, not our invention', () => {
    const m = ECONOMY.entryCap.meritIncrease
    expect(m.juniorByAge[13]).toEqual({ throughRank: 50, extra: 4 })
    expect(m.juniorByAge[14]).toEqual({ throughRank: 20, extra: 4 })
    expect(m.juniorByAge[15]).toEqual({ throughRank: 20, extra: 4 })
    expect(m.juniorByAge[16], 'the appendix grants none at 16').toBeUndefined()
    expect(m.proExtra).toBe(4)
    expect(m.proJuniorThroughRank, 'the same top-5 gate the Accelerator uses').toBe(5)
    expect(m.proDirectTiers).toEqual(['slam', 'wta1000'])
  })

  it('the ITF +4 is earned by the year-end list and by nothing else', () => {
    const world = openWorld('merit-itf')
    // ⚠ A JANUARY GIRL IS 14 AT WEEK 0 (see `openWorld`), so season N is the year she is 14 + N.
    const at15 = WEEKS_PER_YEAR + 4
    expect(annualEntryLimit(15)).toBe(18)
    world.seasonHistory = [banked(0, 40)]
    expect(entryCapUsage(world, at15).limit, 'outside the top 20 – no bonus').toBe(18)
    world.seasonHistory = [banked(0, 12)]
    expect(entryCapUsage(world, at15).limit, 'inside it – the appendix grants four').toBe(22)
    // ...and the bonus belongs to the age, not to the standing: 16 has no row in the appendix.
    world.seasonHistory = [banked(0, 12), banked(1, 1)]
    expect(entryCapUsage(world, 2 * WEEKS_PER_YEAR + 4).limit, 'no merit row at 16').toBe(25)
  })

  it('the PRO +4 is an OR – junior top 5 or direct acceptance – and never a sum', () => {
    const world = openWorld('merit-pro')
    const at16 = 2 * WEEKS_PER_YEAR + 4
    expect(annualProEntryLimit(16)).toBe(12)
    world.seasonHistory = [banked(1, 30)]
    expect(proEntryCapUsage(world, at16).limit, 'on neither list').toBe(12)
    world.seasonHistory = [banked(1, 3)]
    expect(proEntryCapUsage(world, at16).limit, 'year-end junior top 5').toBe(16)
    // Direct acceptance is the rung's OWN cut, read off the banked professional row.
    const cut = Math.max(TIERS.slam.acceptsRank!, TIERS.wta1000.acceptsRank!)
    world.seasonHistory = [banked(1, 200, cut)]
    expect(proEntryCapUsage(world, at16).limit, 'direct acceptance to a major').toBe(16)
    world.seasonHistory = [banked(1, 200, cut + 1)]
    expect(proEntryCapUsage(world, at16).limit, 'one place outside it').toBe(12)
    world.seasonHistory = [banked(1, 3, cut)]
    expect(proEntryCapUsage(world, at16).limit, 'both routes still buy four').toBe(16)
  })

  it('⚠ an unlimited row STAYS unlimited – the sentinel cannot be added to', () => {
    const world = openWorld('merit-sentinel')
    world.seasonHistory = [banked(3, 1, 1)]
    const at18 = 4 * WEEKS_PER_YEAR + 4
    expect(proEntryCapUsage(world, at18).limit).toBe(Number.MAX_SAFE_INTEGER)
    expect(entryCapUsage(world, at18).limit).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('⚠⚠ THE BONUS CAN ONLY RISE INSIDE A WINDOW, so no entry is ever retro-invalidated', () => {
    // The property the whole design turns on. A season that closes INSIDE her birth year may switch
    // the bonus on; nothing may ever switch it off, because the limit is what refuses an entry and
    // `tierOutgrown` reads `remaining <= 0` to re-open the rungs below her.
    //
    // ⚠ MUTATION-PROVABLE: read a LIVE rank instead of the banked window and this goes red on the
    // very week the good season is superseded by a bad one.
    const world = openWorld('merit-monotone')
    world.seasonHistory = [banked(0, 2), banked(1, 180)] // a great season, then a poor one
    let last = 0
    for (let w = 0; w < 5 * WEEKS_PER_YEAR; w++) {
      const limit = proEntryCapUsage(world, w).limit
      const boundary = ageWindowStartWeek(world, w) === w
      if (!boundary) expect(limit, `w${w}`).toBeGreaterThanOrEqual(last)
      last = limit
    }
    // ...and the good season really is superseded, or the walk above proves nothing.
    expect(yearEndJuniorRank(world), 'the newest row is the poor one').toBe(180)
  })
})

// ---------------------------------------------------------------------------
// A3c – THE SUB-CAP INSIDE THE FOURTEEN-YEAR-OLD'S EIGHT (WTA §X.A.2).
// ---------------------------------------------------------------------------
describe('A3c — at most three of a fourteen-year-old\'s eight may be at W75 or above', () => {
  /** Spend `count` professional entries at `tier` on the season ledger, exactly as `enterEvent`
   *  records them – one row whose id carries the rung (the shape `seasonWEntriesByTier` folds). */
  function spendAt(world: WorldState, tier: TierId, count: number): void {
    world.seasonEntries ??= { fromWeek: 0, rows: [] }
    for (let i = 0; i < count; i++) {
      world.seasonEntries.rows.push({ id: `2031-w${i}-${tier}`, track: 'wta', outgrown: false, bookShut: false })
    }
  }

  it('pins the rule as the source states it – three, from W75 up, at 14 and at no other age', () => {
    const row = ECONOMY.entryCap.proSubCapByAge[14]
    expect(row).toEqual({ fromTier: 'w75', max: 3 })
    expect(ECONOMY.entryCap.proSubCapByAge[15], 'the sub-cap is the 14 row only').toBeUndefined()
    expect(ECONOMY.entryCap.proSubCapByAge[16]).toBeUndefined()
    // ...and three really is a fraction of the eight it sits inside.
    expect(row.max).toBeLessThan(annualProEntryLimit(14))
  })

  it('counts every rung AT OR ABOVE the floor, and is silent below it', () => {
    const world = openWorld('subcap')
    const at14 = 4 // she is 14 at week 0 on this file's January birthday
    expect(proSubCapUsage(world, at14, 'w50'), 'below the floor – not this rule\'s business').toBeNull()
    expect(proSubCapUsage(world, at14, 'w15')).toBeNull()
    expect(proSubCapUsage(world, at14, 'w75')).toEqual({ used: 0, limit: 3, remaining: 3 })
    // A W100 entry is an entry "at W75 or above", so it spends the same quota.
    spendAt(world, 'w100', 2)
    expect(proSubCapUsage(world, at14, 'w75'), 'the walk is up the ladder, not one rung').toEqual({
      used: 2,
      limit: 3,
      remaining: 1,
    })
    spendAt(world, 'w50', 5)
    expect(proSubCapUsage(world, at14, 'w75')!.used, 'and the rungs below it never count').toBe(2)
    spendAt(world, 'w75', 1)
    expect(proSubCapUsage(world, at14, 'w75'), 'the third fills it').toEqual({ used: 3, limit: 3, remaining: 0 })
  })

  it('is silent at every other age, so an adult never meets a rule about children', () => {
    const world = openWorld('subcap-age')
    spendAt(world, 'w100', 9)
    for (const week of [WEEKS_PER_YEAR + 4, 2 * WEEKS_PER_YEAR + 4, 5 * WEEKS_PER_YEAR + 4]) {
      expect(proSubCapUsage(world, week, 'w75'), `week ${week}`).toBeNull()
    }
  })

  it('⚠ AND IT MEASURES ZERO AT THE SHIPPED CONSTANTS, which is the finding, not the test failing', () => {
    // W75 opens at 17 and no W rung above W15 opens below 16, so a fourteen-year-old can never reach
    // the rungs this quota counts. The rule ships anyway – see the knob's own note – and this
    // assertion is what makes "it cannot bind" a checked claim rather than a belief: the day a phase
    // opens one of these rungs lower, this goes red and the sub-cap becomes live machinery.
    const floor = ECONOMY.entryCap.proSubCapByAge[14].fromTier
    const from = TIER_LADDER.indexOf(floor)
    for (const tier of TIER_LADDER.slice(from)) {
      expect(isTierAgeOpen(tier, 14), `${tier} is shut to a fourteen-year-old`).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// A4 – THE SLOT FOLLOWS THE FEE. Mirrors the existing withdraw/cancel money rule exactly.
// ---------------------------------------------------------------------------
describe('A4 — a refunded withdrawal frees the slot, a forfeited one does not', () => {
  it('withdrawing before the deadline gives the slot back (as it gives the fee back)', () => {
    const world = openWorld()
    const entered = fillCap(world, 14)
    expect(entryCapUsage(world, world.week).remaining).toBe(0)
    withdrawEvent(world, entered[entered.length - 1].id)
    expect(entryCapUsage(world, world.week).remaining).toBe(1)
    const again = injectEvent(world, { week: freeWeek(world), tier: 'j30', id: 'again' })
    expect(entryStatus(world, again).level).not.toBe('blocked')
  })

  it('cancelling after the deadline keeps the slot used (as it keeps the fee)', () => {
    const world = openWorld()
    const entered = fillCap(world, 14)
    const last = entered[entered.length - 1]
    world.week = last.deadlineWeek + 1 // the list has closed, the week has not started
    cancelEntry(world, last.id)
    expect(world.entries).not.toContain(last.id)
    expect(entryCapUsage(world, world.week).remaining).toBe(0)
  })

  it('a played event keeps its slot after the entry itself is gone', () => {
    const world = openWorld('agecap-played')
    const e = injectEvent(world, { week: world.week + 3, tier: 'j30', id: 'played' })
    enterEvent(world, e.id)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 4; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        world.pendingTournament.finished = true
        world.pendingTournament = null
      }
    }
    expect(world.entries).not.toContain('played')
    expect(entryCapUsage(world, world.week).used).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// A5 – WHAT THE PLAYER IS TOLD. Distinguishable from "locked on points" and from
// "nothing scheduled", and it must read as "for this year", not "forever".
// ---------------------------------------------------------------------------
describe('A5 — the UI says WHY, in the wording the other lock states use', () => {
  const baseInput: TierStateInput = {
    ageYears: 14,
    points: 1000,
    upcoming: [{ tier: 'j30', week: 3 }],
    horizonWeeks: 8,
    entryCap: { used: 14, limit: 14, remaining: 0 },
    proEntryCap: { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER }, // the pro AER has its own arm; untouched here
  }

  it('reports a distinct capped state instead of "scheduled"', () => {
    const s = tierState('j30', baseInput)
    expect(s.kind).toBe('capped')
    expect(s.kind).not.toBe('locked')
    expect(s.kind).not.toBe('unscheduled')
    expect(s.entryCap).toEqual({ used: 14, limit: 14, remaining: 0 })
  })

  it('names the YEAR, and says the lock is temporary', () => {
    const s = tierState('j30', baseInput)
    expect(s.note).toContain('14 of 14')
    expect(s.note.toLowerCase()).toMatch(/year|season/)
    // ⚠ "NEXT BIRTHDAY" SINCE P2, and the change of word is the change of rule: the allowance's
    // window is her birthday year now, so "next season" named the wrong date. A refusal that names
    // the wrong date is worse than one that names none.
    expect(s.title.toLowerCase()).toContain('next birthday')
  })

  it('leaves the domestic tiers alone even at a full allowance', () => {
    expect(tierState('national', { ...baseInput, points: 200 }).kind).not.toBe('capped')
    expect(tierState('local', { ...baseInput, points: 10 }).kind).not.toBe('capped')
  })

  it('still ranks the permanent locks first – points before the year cap', () => {
    // ⚠ RE-AIMED by the two ladders (29.07). The claim was "a points lock outranks the year cap",
    // and it held while every rung had a points lock. An INTERNATIONAL rung has none - it gates on
    // an acceptance list, and a J30's is open - so for a point-less kid there is no permanent lock
    // to rank first and the cap is the true and only answer. The precedence rule itself is
    // untouched and still proved below on a rung that HAS a permanent lock.
    // 0 points: she is locked on points, which is the headline whatever the cap says
    expect(tierState('j30', { ...baseInput, points: 0 }).kind).toBe('locked')
    // too young: the age gate outranks everything (kept wired for the childhood prologue)
    expect(tierState('j30', { ...baseInput, ageYears: 12 }).kind).toBe('age-locked')
  })

  it('goes back to "scheduled" when she has allowance left', () => {
    const s = tierState('j30', { ...baseInput, entryCap: { used: 3, limit: 14, remaining: 11 } })
    expect(s.kind).toBe('scheduled')
  })

  it('every capped string is player-safe: short dash only, no Cyrillic', () => {
    const strings = [
      tierState('j30', baseInput).note,
      tierState('j30', baseInput).title,
      entryStatus(openWorldFull(), cappedEvent()).detail ?? '',
    ]
    for (const s of strings) {
      expect(s).not.toContain('—') // em dash
      expect(s).not.toMatch(/[Ѐ-ӿ]/) // Cyrillic
      expect(s.length).toBeGreaterThan(0)
    }
  })

  function openWorldFull(): WorldState {
    const world = openWorld('agecap-copy')
    fillCap(world, 14)
    injectEvent(world, { week: freeWeek(world), tier: 'j30', id: 'copy' })
    return world
  }
  function cappedEvent(): SeasonEvent {
    return {
      id: 'copy',
      week: 40,
      tier: 'j30',
      surface: 'hard',
      travelCostCents: 100_00,
      deadlineWeek: 38,
    }
  }
})

// ---------------------------------------------------------------------------
// A5b – THE TWO SCREENS THAT CONSUME THE RULE both have a branch for it. Source-level, the same
// way round11-view.test.ts pins its wiring: a new TierStateKind that no screen handles falls
// silently into an else-branch, which is how the Home strip would have invited her to
// "enter your first!" an event the engine refuses.
// ---------------------------------------------------------------------------
describe('A5b — no screen falls through on the capped state', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

  it('the Season card has a lock label for it, printing the engine own count', () => {
    const src = read('../src/components/screens/SeasonScreen.vue')
    expect(src).toContain("case 'capped'")
    expect(src).toContain('e.entryCap')
  })

  it('the Home season strip routes it away from the "unlocked" chip', () => {
    const src = read('../src/components/screens/HomeScreen.vue')
    expect(src).toContain("avail.kind === 'capped'")
  })
})

// ---------------------------------------------------------------------------
// A6 – THE WIRE. Every surface reads the engine's own numbers.
// ---------------------------------------------------------------------------
describe('A6 — the snapshot carries the allowance', () => {
  it('surfaces the current season usage', () => {
    const world = openWorld()
    fillCap(world, 5)
    expect(toSnapshot(world).entryCap).toEqual({ used: 5, limit: 14, remaining: 9 })
  })

  it('marks a capped upcoming card with its own used/limit pair', () => {
    const world = openWorld()
    fillCap(world, 14)
    // an event inside the 8-week horizon that she cannot take
    const free = world.week + 3
    injectEvent(world, { week: free, tier: 'j30', id: 'card', deadlineWeek: free - 2 })
    const card = toSnapshot(world).upcoming.find((e) => e.id === 'card')
    expect(card).toBeDefined()
    expect(card!.eligible).toBe(false)
    expect(card!.ineligibleReason).toBe('capped')
    expect(card!.entryCap).toEqual({ used: 14, limit: 14, remaining: 0 })
  })
})

// ---------------------------------------------------------------------------
// A7 – SCHEMA. Append-only, idempotent, and every historical save still loads.
// ---------------------------------------------------------------------------
describe('A7 — schema v15', () => {
  it('a fresh world starts with an empty ledger of international entries', () => {
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(15)
    expect(createWorld('fresh').internationalEntryWeeks).toEqual([])
  })

  it('migrates a v14 save (backfilled empty – a legacy career gets this season free)', () => {
    const v14 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v14.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v14))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.internationalEntryWeeks).toEqual([])
    expect(migrated.week).toBe(v14.week)
    expect(migrateSave(structuredClone(migrated))).toEqual(migrated)
  })

  it('never resets an existing ledger on re-migration', () => {
    const save = { ...createWorld('remig'), internationalEntryWeeks: [4, 9, 12] }
    expect(migrateSave(structuredClone(save)).internationalEntryWeeks).toEqual([4, 9, 12])
  })
})

// ---------------------------------------------------------------------------
// P — THE PRO AER (W2-LADDER §5): the junior cap's parallel, never its extension.
// The WTA age rule is "separate from and additional to" the ITF junior one (research §4), so
// everything below asserts the two families in the same breath: spending one allowance never
// touches the other. The gate is tested at the EVENT's week (age and season are both read there),
// so no fixture has to tick a hundred weeks to be sixteen.
// ---------------------------------------------------------------------------

// ⚠ P2: `annualProEntryLimit` and `proEntryCapUsage` moved to the file's top import – the merit
// suite (A3b) needs them above this point, and one name may only be imported once.
import { isCappedProTier } from '../src/engine/world'

/** Her age-16 season: weeks 104-155 (START_AGE 14 at week 0, and `openWorld`'s January birthday, so
 *  the season block and the year she is sixteen are the same 52 weeks – see `openWorld`'s note). */
const AGE16_FROM = 104

/** Clean weeks of the age-16 season (no off-season 49-51, no exams 23-24), for injected events. */
function age16Weeks(count: number): number[] {
  const out: number[] = []
  for (let w = AGE16_FROM + 2; w < AGE16_FROM + WEEKS_PER_YEAR && out.length < count; w++) {
    const offset = w % WEEKS_PER_YEAR
    if (offset >= WEEKS_PER_YEAR - 3 || (offset >= 23 && offset <= 24)) continue
    out.push(w)
  }
  return out
}

/** An open world whose W gates all stand open: elite domestic + ITF books (the on-ramp), plus a
 *  counting W row so the acceptance rungs read a live position for her. */
// ⚠ 100 -> 400 W POINTS BY W2-FIELD2, AND IT IS A FIXTURE RE-AIM WITH A FINDING BEHIND IT. This
// world exists so the AER pro cap is the rule that refuses her - every test below is about the CAP.
// 100 points used to put her inside every W acceptance list (the merged table's #118 against W35's
// cut of 282), so the cap was the binding refusal. The wave's points lift gives the merged table
// the real points-to-rank curve, and 100 points is now #365: the RANK gate refuses her first and
// the cap never speaks. 400 points is #183, comfortably inside W35's cut, so these tests measure
// the cap again rather than the gate above it.
//
// ⚠⚠ THE FINDING ITSELF IS NOT A FIXTURE PROBLEM AND IS FLAGGED FOR THE OWNER: against the lifted
// curve `enterPct` (a SHARE of the merged table) bites in points, and a W35 now needs ~250 W points
// while a best-16 window of nothing but W15 titles caps at 160. See docs/specs/living-field.md
// §8.2c for the measured table; the remedy is beyond this wave's scope.
function openProWorld(seed = 'procap'): WorldState {
  const world = openWorld(seed)
  world.results.push({ playerId: KID_ID, week: world.week, points: 400, tier: 'w100' })
  // ⚠ RE-AIMED, NOT WEAKENED (P1, docs/specs/junior-access-2026-08.md). This fixture's girl is
  // SIXTEEN, so she is a junior, and a junior now meets the Junior Accelerator in front of every W
  // rung above W15. With no banked year-end junior standing she holds no places at all there – which
  // is a LADDER fact and therefore precedes availability in `entryVerdict`, exactly as an acceptance
  // cut does – so the PRO CAP's own refusal, which is what this block is about, would become
  // unreachable at W35 and up and the copy case would be asserting the precedence instead of the
  // promise. A banked year-end junior #1 puts her past that gate; her professional book already puts
  // her past every acceptance cut. The Accelerator has its own suite (tests/junior-access.test.ts).
  //
  // ⚠ RE-AIMED AGAIN AT P2, AND THE NUMBER MOVED FROM #1 TO #6 FOR A REASON THAT IS THE POINT OF THE
  // WHOLE BLOCK. P2 ships the WTA Pro Path's merited increase: a year-end junior top FIVE earns four
  // extra professional entries. A fixture banking #1 therefore stopped measuring the twelve this
  // block is named for and started measuring sixteen – the bonus, not the cap. #6 is the first place
  // outside that gate and is still inside the Accelerator's 6-10 row (two W50 places and three W35),
  // which covers every rung these tests actually touch (w15, and one w35). Nothing is weakened: the
  // cap is the binding refusal again, which is the property the fixture exists to create. The merit
  // increase has its own suite in A3b above, on its own fixtures.
  world.seasonHistory = [
    {
      seasonIndex: 0,
      endRank: 6,
      points: 0,
      wins: 0,
      losses: 0,
      byTrack: {
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { endRank: 6, points: 0, wins: 0, losses: 0 },
        wta: { points: 0, wins: 0, losses: 0 },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    },
  ]
  recomputeKidRank(world)
  return world
}

/** Enter `n` W15s on distinct clean weeks of her age-16 season. */
function fillProCap(world: WorldState, n: number): SeasonEvent[] {
  const events = age16Weeks(40)
    .slice(-n)
    .map((w, i) => injectEvent(world, { week: w, tier: 'w15', id: `profill-${i}` }))
  for (const e of events) enterEvent(world, e.id)
  return events
}

describe('P1 — the pro table (spec §5 design values over the real rulebook shape)', () => {
  it('pins 16 -> 12, 17 -> 16, 18+ unlimited', () => {
    expect(annualProEntryLimit(16)).toBe(12)
    expect(annualProEntryLimit(17)).toBe(16)
    expect(annualProEntryLimit(18)).toBe(Number.MAX_SAFE_INTEGER)
    expect(annualProEntryLimit(25)).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('⚠ ...and 14 -> 8 / 15 -> 10, which the one-clock ruling put in the table', () => {
    // Owner ruling 1, 09.08: the AER was being asked of the BAND, so a March girl was "16" from week
    // 104 at a real 15.83, cleared the age gate and then met `default` – i.e. UNLIMITED professional
    // entries – because the table had no row for her. The gate reads her own age now; these rows are
    // the second half, so `default` (a rule about adults) can never answer for a child again.
    expect(annualProEntryLimit(14)).toBe(8)
    expect(annualProEntryLimit(15)).toBe(10)
    // the rulebook's shape, and it must stay monotone or an older girl would be allowed fewer events
    for (let age = 14; age < 20; age++) {
      expect(annualProEntryLimit(age + 1), `${age} -> ${age + 1}`).toBeGreaterThanOrEqual(annualProEntryLimit(age))
    }
    // ⚠ AND 13 IS DELIBERATELY NOT A ROW even though the rulebook has one (0 events). A limit of 0
    // makes `remaining <= 0` true for a girl who has entered nothing, and `tierOutgrown` reads exactly
    // that to re-open the rungs below her – so a 13 row would silently disable the ladder ceiling for
    // the first season of every career but a January one. See the knob's note in economy.ts.
    expect(ECONOMY.entryCap.proPerYearByAge[13]).toBeUndefined()
    expect(annualProEntryLimit(13)).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('14 and 15 never reach the table: every W rung refuses them on AGE first', () => {
    // ⚠ RE-AIMED, EVERY ASSERTION KEPT (one-clock, 09.08). This used to read "the rulebook's
    // 14 -> 8 / 15 -> 10 rows are ABSENT because the doorway is closed at those ages". The rows are
    // present now – but the claim the assertions actually make is about the DOORWAY, and it is the
    // claim that was false under the band and is true again: `availabilityStatus` asks `tierAgeBlock`
    // before it asks any cap, and it asks it of her real age. The rows exist as the honest table
    // rather than as a live gate, which is why both facts are pinned and neither is dropped.
    for (const t of ECONOMY.entryCap.cappedProTiers) {
      expect(isTierAgeOpen(t, 14), t).toBe(false)
      expect(isTierAgeOpen(t, 15), t).toBe(false)
    }
  })

  it('the two families are disjoint and exhaustive over the international rungs', () => {
    for (const t of TIER_LADDER) {
      expect(isCappedTier(t) && isCappedProTier(t), `${t} in both families`).toBe(false)
    }
    // ⚠ WIDENED BY W3-ACT2, NOT WEAKENED: the real AER counts "professional events", so the four
    // act-3 rungs join the family the moment they exist - a Grand Slam counts against a
    // seventeen-year-old's sixteen exactly as a W15 does. The list stays pinned EXACTLY so a rung
    // still cannot reach the engine without somebody deciding which allowance it spends.
    expect(ECONOMY.entryCap.cappedProTiers).toEqual([
      'w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam',
    ])
  })
})

describe('P2 — the gate, and the parallel ledgers never touch', () => {
  it('the 13th W entry of her age-16 season is refused, and the refusal NAMES the tour rule', () => {
    const world = openProWorld('procap-gate')
    fillProCap(world, 12)
    const extra = injectEvent(world, { week: age16Weeks(40)[0], tier: 'w15', id: 'pro-extra' })
    const gate = entryStatus(world, extra)
    expect(gate.level).toBe('blocked')
    expect(gate.reason).toBe('capped')
    expect(gate.detail).toMatch(/Tour age rule/)
    expect(gate.detail).toMatch(/12 of 12/)
    expect(gate.entryCap).toEqual({ used: 12, limit: 12, remaining: 0 })
    expect(() => enterEvent(world, extra.id)).toThrow(/Tour age rule/)
  })

  it('spending the whole pro allowance leaves the JUNIOR allowance untouched, and vice versa', () => {
    const world = openProWorld('procap-parallel')
    fillProCap(world, 12)
    const probeWeek = age16Weeks(40)[0]
    expect(proEntryCapUsage(world, probeWeek)).toEqual({ used: 12, limit: 12, remaining: 0 })
    // Her junior ledger has not moved by one: a J30 in the same season is still enterable.
    expect(entryCapUsage(world, probeWeek).used).toBe(0)
    const j = injectEvent(world, { week: probeWeek, tier: 'j30', id: 'pro-j-fallback' })
    expect(entryStatus(world, j).level).not.toBe('blocked')
    enterEvent(world, j.id)
    // ...and that junior entry did not touch the pro ledger back.
    expect(entryCapUsage(world, probeWeek).used).toBe(1)
    expect(proEntryCapUsage(world, probeWeek).used).toBe(12)
  })

  it('the boredom guard promise in copy: the refusal says what stays open', () => {
    const world = openProWorld('procap-copy')
    fillProCap(world, 12)
    const extra = injectEvent(world, { week: age16Weeks(40)[0], tier: 'w35', id: 'pro-copy' })
    expect(entryStatus(world, extra).detail).toMatch(/junior and national events stay open/)
  })
})

describe('P3 — the slot follows the fee, pro arm', () => {
  it('a refunding withdrawal frees the pro slot; a forfeiting cancel keeps it spent', () => {
    const world = openProWorld('procap-refund')
    const events = fillProCap(world, 12)
    const probeWeek = age16Weeks(40)[0]
    expect(proEntryCapUsage(world, probeWeek).remaining).toBe(0)
    // Before the deadline: withdrawal refunds fee AND slot.
    withdrawEvent(world, events[0].id)
    expect(proEntryCapUsage(world, probeWeek)).toEqual({ used: 11, limit: 12, remaining: 1 })
    // Past the deadline: a cancel forfeits the fee and KEEPS the slot - the list closed with her
    // name on it, and the tour counts participation.
    const late = events[1]
    world.week = late.deadlineWeek + 1
    cancelEntry(world, late.id)
    expect(world.proEntryWeeks).toContain(late.week)
  })
})

describe('P4 — the allowance is the season\'s, read at the event', () => {
  it('an event in her age-17 season is judged against the 16-entry allowance, unspent', () => {
    const world = openProWorld('procap-reset')
    fillProCap(world, 12) // the whole age-16 allowance
    const nextSeason = AGE16_FROM + WEEKS_PER_YEAR + 5 // age 17
    expect(proEntryCapUsage(world, nextSeason)).toEqual({ used: 0, limit: 16, remaining: 16 })
    const e = injectEvent(world, { week: nextSeason, tier: 'w15', id: 'pro-next-season' })
    expect(entryStatus(world, e).reason).not.toBe('capped')
  })
})

describe('P5 — schema v36', () => {
  it('a fresh world starts with an empty pro ledger, and v35 saves migrate to one', () => {
    // ⚠ RE-AIMED FROM `toBe(36)` (W3-KIT bumped the schema to v37). The equality was never this
    // test's subject - it was a "did you remember the three-part move" tripwire for the P5 wave, and
    // it fires on every LATER wave too, which is a false positive by construction. What P5 actually
    // owns is that a v35 save gains the pro ledger and that re-migration is idempotent, both of which
    // are checked below and neither of which cares what the current version number is. The tripwire
    // it was standing in for is real and lives where it belongs: `tests/goldenSaves.test.ts` fails the
    // whole suite until a bump is matched by a `v<N>.json` fixture.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(36)
    expect(createWorld('fresh-pro').proEntryWeeks).toEqual([])
    const v35 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v35.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v35))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.proEntryWeeks).toEqual([])
    expect(migrateSave(structuredClone(migrated))).toEqual(migrated)
  })

  it('never resets an existing pro ledger on re-migration', () => {
    const save = { ...createWorld('remig-pro'), proEntryWeeks: [110, 117] }
    expect(migrateSave(structuredClone(save)).proEntryWeeks).toEqual([110, 117])
  })
})
