import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { TIERS, buildSeason, TIER_LADDER, tierFromLabel, isOffSeasonWeek } from '../src/engine/season/calendar'
import { selectEntrants } from '../src/engine/season/tournament'
import { generateCohort } from '../src/engine/season/cohort'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { WIN_IMMUNITY_WEEKS } from '../src/shared/avatarEmotion'
import {
  tierOpenFor,
  createWorld,
  enterEvent,
  isTierEligible,
  isTierAgeOpen,
  recomputeKidRank,
  availabilityStatus,
  tickWeek,
  skipTournament,
  closeTournament,
  matchDrain,
  financeWindow,
  KID_ID,
  START_AGE_YEARS,
  type WorldState,
} from '../src/engine/world'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// Ladder-up Part B — the J-level family (docs/specs/ladder-up.md + ladder-up-impl.md).
// The inert `itf` tier is replaced by three live junior-tour levels: j30/j60 dense (the
// real tour's bread and butter, 75% of all events) plus a rare prestige j300. Bands
// OVERLAP so there is ALWAYS somewhere to go, and NO J level pays prize money.
// ---------------------------------------------------------------------------

const ALL_TIERS = Object.keys(TIERS) as TierId[]

function countByTier(events: SeasonEvent[]): Record<TierId, number> {
  const c = Object.fromEntries(ALL_TIERS.map((t) => [t, 0])) as Record<TierId, number>
  for (const e of events) c[e.tier]++
  return c
}

describe('L1 — the tier catalogue is the J family + the W family (itf is gone)', () => {
  // ⚠ RE-AIMED, NOT WEAKENED (task #17). Both assertions below are still EXACT lists – the whole
  // job of this block is that a rung cannot join the game without a human writing its id down twice
  // – and the `itf` guard is untouched. `itf` is a TRACK now (LadderTrack) and never a TierId, so
  // "no `itf` anywhere" means exactly what it always meant and the adult rungs do not soften it:
  // they are `w15`/`w35`/`w100` on track `'wta'`, which is a third table, not a resurrected
  // placeholder.
  it('has exactly nine tiers and no `itf` anywhere', () => {
    expect([...ALL_TIERS].sort()).toEqual([
      'j30', 'j300', 'j60', 'local', 'national', 'regional', 'w100', 'w15', 'w35',
    ])
    expect(ALL_TIERS).not.toContain('itf')
  })

  it('TIER_LADDER orders the catalogue weakest -> strongest and covers every tier', () => {
    expect([...TIER_LADDER].sort()).toEqual([...ALL_TIERS].sort())
    expect(TIER_LADDER).toEqual([
      'local', 'regional', 'national', 'j30', 'j60', 'j300', 'w15', 'w35', 'w100',
    ])
  })

  it('every id field equals its record key, and no tier is locked any more', () => {
    for (const [key, def] of Object.entries(TIERS)) {
      expect(def.id).toBe(key)
      expect(def.everyNWeeks).toBeGreaterThan(0)
    }
  })

  it('points array length still matches rounds + 1 for every tier', () => {
    for (const t of Object.values(TIERS)) {
      expect(t.points.length).toBe(Math.log2(t.drawSize) + 1)
    }
  })
})

describe('L2 — the J-level table (spec numbers)', () => {
  it('pins j30 – the dense entry level', () => {
    expect(TIERS.j30.label).toBe('Junior Tour 30')
    expect(TIERS.j30.drawSize).toBe(32)
    expect(TIERS.j30.entryFeeCents).toBe(200_00)
    expect(TIERS.j30.travelCostCents).toEqual([900_00, 2000_00])
    expect(TIERS.j30.everyNWeeks).toBe(2)
    expect(TIERS.j30.minAgeYears).toBe(13)
  })

  it('pins j60 – dense, one step up', () => {
    expect(TIERS.j60.label).toBe('Junior Tour 60')
    expect(TIERS.j60.drawSize).toBe(32)
    expect(TIERS.j60.entryFeeCents).toBe(250_00)
    expect(TIERS.j60.travelCostCents).toEqual([1100_00, 2400_00])
    expect(TIERS.j60.everyNWeeks).toBe(3)
    expect(TIERS.j60.minAgeYears).toBe(13)
  })

  it('pins j300 – rare, prestige', () => {
    expect(TIERS.j300.label).toBe('Junior Tour 300')
    expect(TIERS.j300.drawSize).toBe(32)
    expect(TIERS.j300.entryFeeCents).toBe(400_00)
    expect(TIERS.j300.travelCostCents).toEqual([1600_00, 3200_00])
    expect(TIERS.j300.everyNWeeks).toBe(13)
    expect(TIERS.j300.minAgeYears).toBe(13)
  })

  it('points scale with the level, at the REAL ITF ratios: j60 = 2x j30, j300 = 10x j30', () => {
    // ⚠ RE-AIMED for the two ladders (29.07). Was [400, 240, 140, 70, 30, 0] with the level scaling
    // asserted as x1.5 / x2.5 - our invention. These are ITF Reg 31's own singles rows, and the
    // convention every rung of the real ladder follows is that the GRADE NAME IS THE WINNER'S
    // POINTS. The ratios that fall out are the real ones: j60 is twice a j30 and j300 is TEN times
    // it, where ours paid 2.5x. That inversion is the whole reason for this slice - a flawless
    // season of J30s used to out-score a J300 title 2.4 to 1, so there was never a reason to get on
    // the expensive plane.
    //
    // The last element stays 0 at every rung and that is NOT the ITF table's number: Reg 31's "R32"
    // column means REACHED the round of 32 having won a round, which in a real J300 (draws of
    // 48-64) is a player who has already won. Our draws are 32, so the last finish index IS the
    // first-round loser, and Reg 31(a) pays nobody until they win a main-draw round.
    expect(TIERS.j30.points).toEqual([30, 18, 9, 5, 2, 0])
    expect(TIERS.j60.points).toEqual([60, 36, 18, 10, 5, 0])
    expect(TIERS.j300.points).toEqual([300, 210, 140, 100, 60, 0])
    expect(TIERS.j60.points[0]).toBe(TIERS.j30.points[0] * 2)
    expect(TIERS.j300.points[0]).toBe(TIERS.j30.points[0] * 10)
    // ...and the compression the real ladder has and ours never did: a title is worth FEWER single
    // wins as you climb. At j30 the title is 15 wins; at j300 it is 5.
    const titleOverOneWin = (t: 'j30' | 'j60' | 'j300') =>
      TIERS[t].points[0] / TIERS[t].points[TIERS[t].points.length - 2]
    expect(titleOverOneWin('j30')).toBeGreaterThan(titleOverOneWin('j60'))
    expect(titleOverOneWin('j60')).toBeGreaterThan(titleOverOneWin('j300'))
  })
})

describe('L3 — NO prize money on the JUNIOR ladder (juniors pay to play)', () => {
  // ⚠ RE-AIMED AT THE RULE IT WAS ALWAYS ABOUT, NOT WEAKENED (task #17, A2). It used to assert that
  // NO tier in the game carried a payout and that the string `prizeCents` did not occur in world.ts,
  // which was the strongest available reading while every rung on the calendar was a junior one. The
  // adult rungs now pay (docs/specs/adult-tour-and-endings.md §3), so the literal old assertion would
  // have to be deleted or the feature would not exist - and deleting it would take the actual thesis
  // with it. The thesis is not "the game has no prize money", it is «juniors pay to play»: the
  // domestic and junior rungs pay NOTHING, ever, and that is what "invest without knowing the return"
  // means. So the assertion is now per-TRACK, which is a STRICTER statement than a global grep could
  // ever be - it survives the feature landing and it will still fail the day somebody quietly
  // attaches a payout to a J300, which is the failure it was written to catch.
  it('no domestic or junior tier carries a prize field; only the adult rungs do', () => {
    for (const t of Object.values(TIERS)) {
      expect(Object.keys(t)).not.toContain('prizeMoneyCents') // never a second spelling
      if (t.track === 'wta') {
        expect(t.prizeCents, `${t.id} must pay`).toBeDefined()
        expect(t.prizeCents!.length, `${t.id} pays once per finish`).toBe(t.points.length)
      } else {
        expect(Object.keys(t), `${t.id} must never pay`).not.toContain('prizeCents')
      }
    }
  })

  // The other half of the old grep, kept as a rule about the CODE rather than about the strings in
  // it: exactly one function in the engine may turn a finish into money, and it must not be able to
  // see the family's wealth corridor (§3's third rule). A signature that cannot take a background
  // cannot price by one.
  it('exactly one payout function exists, and it cannot see the family background', () => {
    const src = readFileSync(new URL('../src/engine/world.ts', import.meta.url), 'utf8')
    const decls = src.match(/^export function prize\w*\(.*$/gm) ?? []
    expect(decls).toEqual(['export function prizeCentsFor(tier: TierId, finish: number): number {'])
    expect(decls[0]).not.toMatch(/background|FamilyBackground|world/i)
  })

  it('a J-level week banks points but is pure OUTGOING money (entry + travel, no payout)', () => {
    // Walk seeds until one actually reaches the J30 week healthy – an injury before the event
    // auto-withdraws the entry (Season-Life slice C), and which seed does that is not the point here.
    let world: WorldState | undefined
    let played: SeasonEvent | undefined
    for (let i = 0; i < 25 && !world; i++) {
      const w = createWorld(`no-prize-${i}`)
      // Put her deep into the J band and drop her onto a j30 week.
      w.results.push({ playerId: KID_ID, week: 0, points: 1200, tier: 'national' })
      w.fundsCents = 500_000_00
      const j30 = w.season.find((e) => e.tier === 'j30' && e.deadlineWeek >= w.week)
      if (!j30) continue
      enterEvent(w, j30.id)
      const rng = rngFromSeed(w.seed)
      while (w.week < j30.week) tickWeek(w, rng)
      if (!w.pendingTournament) continue
      // ⚠ WIDENED by the random-draw change (28.07): she used to meet the top seed in every first
      // round, which meant a predictable early exit – and a first-round loss banks NO points
      // (wave B). Now the draw is random, so the seed walk also has to find a run she actually
      // SCORED in, or the "she banked points" assertion below is a coin flip. Resolving the run
      // inside the walk is the only way to know.
      skipTournament(w)
      closeTournament(w)
      if (!w.results.some((r) => r.playerId === KID_ID && r.week === j30.week)) continue
      world = w
      played = j30
    }
    expect(world, 'no seed in 25 produced a scoring J30 run').toBeTruthy()
    const week = financeWindow(world!.financeWeeks, played!.week).byCategory
    // travel is charged, and the ONLY positive buckets a J week may show are the parent's
    // contribution and savings interest – there is no prize bucket at any junior level.
    expect(week.travel).toBeLessThan(0)
    for (const [cat, amt] of Object.entries(week)) {
      if ((amt ?? 0) > 0) expect(['income', 'interest', 'sponsor']).toContain(cat)
    }
    // ...and she DID bank ranking points for the run.
    expect(world!.results.some((r) => r.playerId === KID_ID && r.week === played!.week)).toBe(true)
  })
})

describe('L4 — the overlapping ladder: there is ALWAYS somewhere to go', () => {
  it('pins the DOMESTIC bands, and the international rungs gate on rank instead', () => {
    // ⚠ RE-AIMED for the two ladders. The point bands are a DOMESTIC instrument now and they did
    // not move, because the domestic point tables did not move either. The J rungs left the band
    // system entirely: an international entry is an ACCEPTANCE LIST, read off her ITF rank - the
    // same signal `entrantPctBand` already uses to pick the AI field, which is what finally makes
    // both sides of one event obey one rule (docs/specs/rank-plateau.md 2b).
    expect(TIERS.local.enterPointBand).toEqual([0, 85])
    expect(TIERS.regional.enterPointBand).toEqual([65, 250])
    expect(TIERS.national.enterPointBand).toEqual([150, Number.MAX_SAFE_INTEGER])
    // ⚠ RE-AIMED AGAIN (the National stagger). Regional's ceiling moved 230 → 250 to sit exactly on
    // J30's new floor, so the domestic ladder stays open right up to the week the international one
    // opens. THE FACT THIS TEST IS FOR is the gap below, not the literals: National must open a long
    // way BEFORE the on-ramp does, or the entry policy skips it entirely (measured at 0.3 entries
    // per four-year career when the two shared a floor). Do not close it to tidy the numbers.
    expect(TIERS.j30.enterPointBand[0] - TIERS.national.enterPointBand[0]).toBeGreaterThanOrEqual(100)
    // ...and regional hands over to the on-ramp with no band in between where only National is open.
    expect(TIERS.regional.enterPointBand[1]).toBe(TIERS.j30.enterPointBand[0])
    // j30 is OPEN - the research is explicit that an unranked thirteen-year-old near home gets into
    // one, and that the gate up the ladder is the queue rather than the fee.
    // ⚠ The acceptance list is a SHARE of the field, not a rank number - a count would silently
    // change meaning when the population grows (living-field.md plans 2-3k against today's 199).
    expect(TIERS.j30.enterPct).toBeUndefined()
    //
    // ⚠ RE-AIMED 30.07 (tune/rank-numbers). THE IDENTITY IS GONE, DELIBERATELY, and it is the whole
    // finding of that slice's item 1. This used to assert
    //     enterPct === entrantPctBand[1]
    // for both rungs - "she is accepted if she would be inside the field they draw from", which is a
    // genuinely nice sentence and was a defensible identity when nobody had measured it.
    //
    // WHY IT HAD TO GO. The two numbers answer two different questions:
    //   * `entrantPctBand` is where an AI player's AMBITION window sits - a J300 regular is a top-25%
    //     player, which is a statement about who the tour's J300 field is MADE of;
    //   * `enterPct` is the ACCEPTANCE CUT - the point at which the tournament stops saying no.
    // In real tennis the cut sits BELOW the regulars (that is what qualifying and wildcards are for,
    // and junior-economics.md lists them as the escape hatches we do not model). Making the two equal
    // therefore set the cut AT the top of the field it draws from, which is the strictest reading
    // available - and measured against an honest ITF rank it shut the ladder: j60 fell to 0.0-3.4
    // entries per four-year career and j300 to 0.0-0.1, in all nine presets, on both arms.
    //
    // THE FACT THIS TEST NOW PROTECTS is the one that survived the identity: the lists must tighten as
    // you climb, and they must sit inside the range where the knob still MEANS something. That second
    // one is measured: the ITF table is only ~120 deep in a 200-strong cohort (everyone without a
    // counting international result ties at the floor), so any share at or above ~0.65 accepts every
    // ranked player and the gate silently becomes a no-op - measured: the weeks-on-list count is
    // identical for every share from 0.65 to 0.90, and careers re-run at 0.65 and 0.70 come out
    // byte-identical. That is exactly the kind of dead knob a guard should refuse to allow.
    expect(TIERS.j60.enterPct).toBe(0.5)
    expect(TIERS.j300.enterPct).toBe(0.4)
    // ...the acceptance lists tighten as you climb, which is the ladder.
    expect(TIERS.j300.enterPct!).toBeLessThan(TIERS.j60.enterPct!)
    // ...and neither has drifted into the range where the share stops gating anything.
    for (const tier of ['j60', 'j300'] as const) {
      expect(TIERS[tier].enterPct!).toBeLessThan(0.65)
      // ...nor below its own field's floor, which would be a cut stricter than the draw it fills.
      expect(TIERS[tier].enterPct!).toBeGreaterThan(TIERS[tier].entrantPctBand[0])
    }
    // The cut sits AT or BELOW the top of the band the field is drawn from for j60 and ABOVE it for
    // j300 - i.e. the prestige rung is the one that admits players from outside its own regular
    // field. Pinned as a DIRECTION rather than a number so the reason stays visible: without it,
    // j300's field (top 25%) would be a wall no career in any preset ever cleared.
    expect(TIERS.j300.enterPct!).toBeGreaterThan(TIERS.j300.entrantPctBand[1])
  })

  it('every point total 0..5000 keeps at least one tier open – no gap, ever', () => {
    for (let pts = 0; pts <= 5000; pts++) {
      expect(ALL_TIERS.some((t) => isTierEligible(t, pts))).toBe(true)
    }
  })

  it('from 150 points up, at least TWO tiers are open at once (the handover overlaps)', () => {
    for (let pts = 150; pts <= 5000; pts++) {
      const open = ALL_TIERS.filter((t) => isTierEligible(t, pts))
      expect(open.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('the DOMESTIC ladder opens in order and nothing above national ever closes', () => {
    // ⚠ RE-AIMED: "opens in order" was a statement about one ladder. There are two, and only the
    // domestic one is ordered by points - the J rungs are ordered by acceptance list instead (see
    // the band test above), so asserting a points ordering across all six now asserts nothing.
    const domestic: TierId[] = ['local', 'regional', 'national']
    const opensAt = (t: TierId) => TIERS[t].enterPointBand[0]
    for (let i = 1; i < domestic.length; i++) {
      expect(opensAt(domestic[i])).toBeGreaterThan(opensAt(domestic[i - 1]))
    }
    for (const t of ['national', 'j30', 'j60', 'j300'] as TierId[]) {
      expect(TIERS[t].enterPointBand[1]).toBe(Number.MAX_SAFE_INTEGER)
    }
  })
})

describe('L5 — the calendar densifies (J30/J60 are the bread and butter)', () => {
  const events = buildSeason('ladder-struct', 0, 52)

  // ⚠ RE-AIMED, NOT WEAKENED (task #17): three rungs joined, so the exact-count map grew by three.
  // Every pre-existing count is UNCHANGED and that is the half worth reading - `everyNWeeks` is a
  // per-tier cadence and `floor(52 / n)` cannot see how many other tiers exist, so a whole new family
  // cannot thin the junior calendar by a single week. The density claim below is unchanged too, and a
  // matching one is now asserted for the W family, which ships the same 2/3/13-week shape one table
  // up: dense, dense, rare.
  it('yields the per-tier season counts, with the dense rungs the clear majority of each family', () => {
    const counts = countByTier(events)
    expect(counts).toEqual({
      local: 26, regional: 13, national: 6,
      j30: 26, j60: 17, j300: 4,
      w15: 26, w35: 17, w100: 4,
    })
    const jTotal = counts.j30 + counts.j60 + counts.j300
    expect((counts.j30 + counts.j60) / jTotal).toBeGreaterThan(0.75)
    const wTotal = counts.w15 + counts.w35 + counts.w100
    expect((counts.w15 + counts.w35) / wTotal).toBeGreaterThan(0.75)
  })

  it('never schedules two events of the SAME tier in one week (ids stay unique)', () => {
    const seen = new Set<string>()
    for (const e of events) {
      expect(e.id).toBe(`${Math.floor(e.week / 52)}-w${e.week}-${e.tier}`)
      expect(seen.has(e.id)).toBe(false)
      seen.add(e.id)
    }
  })

  // The event id is not just a label any more: it KEYS the tournament's RNG stream
  // (`seed:aitour:<id>` for the AI bracket, `seed:kidtour:<id>` for the kid's). Two events sharing
  // an id would silently share a stream, so uniqueness has to hold across the whole LIVE calendar –
  // multi-event weeks and every year-block a long career generates, not just one 52-week span.
  it('event ids stay globally unique over a multi-year live calendar (they key an RNG stream)', () => {
    const world = createWorld('id-uniqueness')
    const rng = rngFromSeed(world.seed)
    const idOf = new Map<string, string>() // id -> "week:tier" that first claimed it
    const collect = () => {
      for (const e of world.season) {
        const key = `${e.week}:${e.tier}`
        const prior = idOf.get(e.id)
        if (prior === undefined) idOf.set(e.id, key)
        else expect(prior).toBe(key) // same id ⇒ must be the same event, never a second one
      }
    }
    collect()
    for (let i = 0; i < 260; i++) {
      tickWeek(world, rng)
      collect()
    }
    // Five seasons' worth of distinct events actually got generated (not a vacuous pass), and a
    // week really does carry several of them.
    expect(idOf.size).toBeGreaterThan(400)
    const perWeek = new Map<string, number>()
    for (const key of idOf.values()) {
      const week = key.split(':')[0]
      perWeek.set(week, (perWeek.get(week) ?? 0) + 1)
    }
    expect([...perWeek.values()].some((n) => n > 1)).toBe(true)
  })

  it('DOES stack different tiers in a week – that is the CHOICE the owner asked for', () => {
    const perWeek = new Map<number, number>()
    for (const e of events) perWeek.set(e.week, (perWeek.get(e.week) ?? 0) + 1)
    expect([...perWeek.values()].some((n) => n > 1)).toBe(true)
    // ...and, because equal-cadence rungs are phase-staggered rather than piled on the same weeks,
    // essentially every playable week of the season carries something to enter.
    const playable = 52 - 3 /* off-season */ - 3 /* the floored first weeks */
    expect(perWeek.size).toBeGreaterThanOrEqual(playable - 1)
  })

  it('still keeps the off-season empty and the first block floored at week 3', () => {
    for (const e of events) {
      expect(isOffSeasonWeek(e.week)).toBe(false)
      expect(e.week).toBeGreaterThanOrEqual(3)
      expect(e.deadlineWeek).toBe(e.week - 2)
    }
  })

  it('R9-20: national densifies in the season SECOND half', () => {
    const nat = events.filter((e) => e.tier === 'national').map((e) => e.week)
    expect(nat.length).toBe(6)
    expect(nat.filter((w) => w >= 26).length).toBeGreaterThan(nat.filter((w) => w < 26).length)
  })

  it('holds for later year-blocks too', () => {
    const later = buildSeason('ladder-later', 52, 52)
    // ⚠ RE-AIMED with its sibling above (task #17): three rungs, three more counts, and every
    // pre-existing figure unchanged. A year-block is still a year-block whichever year it is.
    expect(countByTier(later)).toEqual({
      local: 26, regional: 13, national: 6,
      j30: 26, j60: 17, j300: 4,
      w15: 26, w35: 17, w100: 4,
    })
    for (const e of later) expect(e.week).toBeGreaterThanOrEqual(52)
  })
})

describe('L6 — AI entrant fields step UP the ladder', () => {
  const cohort = generateCohort('ladder-field')
  // Standings position = array order, so percentile == (index + 1) / size.
  const ranking: RankingRow[] = cohort.map((p, i) => ({ playerId: p.id, points: cohort.length - i, rank: i + 1 }))
  const posOf = new Map(cohort.map((p, i) => [p.id, i]))
  const ev = (tier: TierId): SeasonEvent => ({
    id: `0-w10-${tier}`,
    week: 10,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: 8,
  })
  const meanPos = (entrants: AiPlayer[]) =>
    entrants.reduce((s, p) => s + posOf.get(p.id)!, 0) / entrants.length

  it('every tier fills its draw from inside its own percentile window', () => {
    for (const tier of ALL_TIERS) {
      const entrants = selectEntrants(ev(tier), cohort, ranking, rngFromSeed(`f-${tier}`))
      expect(entrants.length).toBe(TIERS[tier].drawSize)
      const [lo, hi] = TIERS[tier].entrantPctBand
      for (const p of entrants) {
        const pct = (posOf.get(p.id)! + 1) / cohort.length
        expect(pct).toBeGreaterThanOrEqual(lo)
        expect(pct).toBeLessThanOrEqual(hi)
      }
      expect(new Set(entrants.map((p) => p.id)).size).toBe(entrants.length)
    }
  })

  // ⚠ RE-AIMED PER TRACK, NOT WEAKENED (task #17). The claim was "mean standings position improves
  // all the way up TIER_LADDER", which was exactly right while the ladder was one continuous climb
  // from Local to J300. With a THIRD TABLE it stops being a well-formed question at one seam and one
  // only: the step from J300 to W15. A W15 is the BOTTOM rung of the professional tour and a J300 is
  // the TOP of the junior one, so the adult family restarts wide (its entrant window is [0.15, 0.75])
  // exactly as J30 restarted wide under National - the fields go 15.97 -> 52.00 at that seam, and
  // they should. It is the same shape the points make (a J300 title pays 300, a W15 title pays 10)
  // and for the same reason: she starts again at the bottom of a different table.
  //
  // So the monotonicity is asserted WITHIN each family, three times, which is the strictly stronger
  // reading: it now fails if any rung stops being harder than the one below it in its OWN table,
  // including inside the new family, where nothing checked it before. Measured on this fixture:
  //   domestic 113.00 -> 86.94 -> 55.50 · itf 39.53 -> 26.44 -> 15.97 · wta 52.00 -> 40.66 -> 29.75
  // The cross-family SEAMS are pinned separately below, so the restart cannot silently become a
  // demotion (a W15 field must still be harder than a Regional one).
  it('a higher rung really is a harder field, inside each of the three tables', () => {
    for (const track of ['domestic', 'itf', 'wta'] as const) {
      const rungs = TIER_LADDER.filter((t) => TIERS[t].track === track)
      expect(rungs.length).toBe(3)
      const means = rungs.map((t) => meanPos(selectEntrants(ev(t), cohort, ranking, rngFromSeed(`m-${t}`))))
      for (let i = 1; i < means.length; i++) {
        expect(means[i], `${rungs[i]} vs ${rungs[i - 1]}`).toBeLessThan(means[i - 1])
      }
    }
  })

  it('each table restarts wide, but never below the table under it', () => {
    const mean = (t: TierId) => meanPos(selectEntrants(ev(t), cohort, ranking, rngFromSeed(`m-${t}`)))
    // The seam is a RESTART: the bottom of a table is an easier field than the top of the one below.
    expect(mean('j30')).toBeGreaterThan(mean('j300'))
    expect(mean('w15')).toBeGreaterThan(mean('j300'))
    // ...and it is still a step UP overall: the entry rung of each table is harder than the entry
    // rung of the one below it, so nothing about the restart is a demotion.
    expect(mean('j30')).toBeLessThan(mean('local'))
    expect(mean('w15')).toBeLessThan(mean('national'))
  })

  it('every window is wide enough that the field can actually vary', () => {
    for (const tier of ALL_TIERS) {
      const [lo, hi] = TIERS[tier].entrantPctBand
      const candidates = Math.round((hi - lo) * 199)
      expect(candidates).toBeGreaterThan(TIERS[tier].drawSize)
    }
  })
})

describe('L7 — age gate (the junior tour is 13-18), open immediately at our start age', () => {
  it('the J levels are shut below 13 and open from 13 up; the domestic ladder has no gate', () => {
    for (const t of ['j30', 'j60', 'j300'] as TierId[]) {
      expect(isTierAgeOpen(t, 12)).toBe(false)
      expect(isTierAgeOpen(t, 13)).toBe(true)
      expect(isTierAgeOpen(t, START_AGE_YEARS)).toBe(true)
    }
    for (const t of ['local', 'regional', 'national'] as TierId[]) {
      expect(isTierAgeOpen(t, 8)).toBe(true)
    }
  })

  // ⚠ THE CEILING, ADDED BY §4.1 (docs/specs/adult-tour-and-endings.md) - the symmetric half of the
  // case above, and the half that did not exist for three releases. Real ITF juniors is U18, and
  // until this landed the J rungs opened at 13 and closed NEVER: a nineteen-year-old still played
  // J30s and 13.7% of a measured J300 field was 19 or older. `living-field.md` §2.1 has described
  // the rule all along ("nobody dominates the junior tour at 19 because nobody IS in the junior tour
  // at 19"); this is the assertion that it is finally true of the code.
  it('the J levels CLOSE after 18, and neither the domestic nor the adult ladder ever closes', () => {
    for (const t of ['j30', 'j60', 'j300'] as TierId[]) {
      expect(TIERS[t].maxAgeYears, `${t} carries the cap`).toBe(18)
      expect(isTierAgeOpen(t, 18), `${t} at 18`).toBe(true) // the whole season she turns 18
      expect(isTierAgeOpen(t, 19), `${t} at 19`).toBe(false) // ...and never again
      expect(isTierAgeOpen(t, 25), `${t} at 25`).toBe(false)
    }
    // The domestic ladder is OURS, not the ITF's, and stays open at every age – owner's call 2: it is
    // where an adult who is not good enough still plays, which is most of them.
    for (const t of ['local', 'regional', 'national'] as TierId[]) {
      expect(TIERS[t].maxAgeYears).toBeUndefined()
      expect(isTierAgeOpen(t, 30)).toBe(true)
    }
    // The adult rungs open at 16/16/17 and never close – the fork at 19 is a decision, not a wall,
    // precisely because these are still here on the far side of it.
    for (const t of ['w15', 'w35', 'w100'] as TierId[]) {
      expect(TIERS[t].maxAgeYears).toBeUndefined()
      expect(isTierAgeOpen(t, 30)).toBe(true)
    }
  })

  // THE OVERLAP IS THE POINT, and it is what makes 19 a fork rather than a cliff: for three whole
  // seasons she holds both tours at once and can price one against the other with real results.
  it('16-18 is a genuine overlap – both tours open at once', () => {
    for (const age of [16, 17, 18]) {
      expect(isTierAgeOpen('j30', age), `j30 at ${age}`).toBe(true)
      expect(isTierAgeOpen('w15', age), `w15 at ${age}`).toBe(true)
    }
    // ...and at 19 the junior half is gone while the adult half remains.
    expect(isTierAgeOpen('j30', 19)).toBe(false)
    expect(isTierAgeOpen('w15', 19)).toBe(true)
  })

  // ⚠ RE-AIMED, NOT WEAKENED (task #17), and this one changed because the WORLD changed rather than
  // because the test was wrong. It asserted that NO event on a fourteen-year-old's calendar can be
  // refused on age, which was true when every rung opened at 13 or lower and was the whole content of
  // "our start is above the gate". Three rungs now open at 16/16/17, so a fourteen-year-old's
  // calendar contains events she genuinely may not enter, and an assertion that no such event exists
  // would be asserting the adult tour away.
  //
  // The rule it was protecting is intact and is what is asserted now: NOTHING SHE IS OLD ENOUGH FOR
  // MAY BE REFUSED ON AGE. The junior and domestic rungs are still all open to her on day one, and
  // the refusals are exactly the rungs whose `minAgeYears` she has not reached - checked against the
  // tier table rather than against a list, so a re-priced age gate cannot slip past this.
  it('availabilityStatus blocks a 14-year-old on age for exactly the rungs above her age', () => {
    const world = createWorld('age-gate')
    let refused = 0
    for (const e of world.season) {
      const status = availabilityStatus(world, e)
      const tooYoung = /too young/i.test(status.detail ?? '')
      expect(tooYoung, `${e.tier} at 14`).toBe(!isTierAgeOpen(e.tier, START_AGE_YEARS))
      if (tooYoung) refused++
    }
    // Not a vacuous pass: her first season really does carry rungs she cannot reach yet.
    expect(refused).toBeGreaterThan(0)
    for (const e of world.season.filter((x) => isTierAgeOpen(x.tier, START_AGE_YEARS))) {
      expect(availabilityStatus(world, e).detail ?? '').not.toMatch(/too young/i)
    }
  })
})

describe('L8 — she can only play ONE tournament a week', () => {
  it('a second entry in the same week is refused (and the first stands)', () => {
    const world = createWorld('one-per-week')
    // One-per-week is a CALENDAR rule, so the fixture has to clear every other gate first – and
    // since the two ladders (docs/specs/two-ladders.md) that is two piles, not one. The domestic
    // book opens the domestic rungs and j30's on-ramp; the international book is what j60 and j300
    // ask for, because they read her ITF RANK and refuse to read a position at all until she owns a
    // counting ITF result. The stacked pair this seed finds contains a J60, so without the second
    // pile the FIRST entry was refused and the rule under test was never reached.
    world.results.push({ playerId: KID_ID, week: 0, points: 1500, tier: 'national' })
    for (let i = 0; i < 4; i++) world.results.push({ playerId: KID_ID, week: 0, points: 300, tier: 'j300' })
    recomputeKidRank(world)
    world.fundsCents = 500_000_00
    const byWeek = new Map<number, SeasonEvent[]>()
    for (const e of world.season) {
      if (e.deadlineWeek < world.week) continue
      // ⚠ AND THE ADULT RUNGS ARE FILTERED OUT, WHICH IS NOT A WEAKENING (task #17). The rule under
      // test is a CALENDAR rule – one body, one week – and the fixture's whole job is to clear every
      // OTHER gate so that rule is the only thing left standing between her and a second entry. She
      // is fourteen here, so a W15/W35/W100 on a stacked week is refused on AGE and the throw the
      // assertion below reads would be the wrong throw entirely: the test would pass while proving
      // nothing. No third pile of points can fix that, because age is not a pile of points. Filtering
      // to what a fourteen-year-old may enter is the same move the two piles above already make.
      if (!isTierAgeOpen(e.tier, START_AGE_YEARS)) continue
      byWeek.set(e.week, [...(byWeek.get(e.week) ?? []), e])
    }
    const stacked = [...byWeek.values()].find((list) => list.length > 1)!
    expect(stacked).toBeTruthy()
    enterEvent(world, stacked[0].id)
    expect(() => enterEvent(world, stacked[1].id)).toThrow(/already entered in a tournament that week/i)
    expect(world.entries).toEqual([stacked[0].id])
  })
})

describe('L9 — the ECONOMY ripple covers every tier', () => {
  it('minConditionToEnter and tierMatchFatigue are exhaustive and rise up the ladder', () => {
    for (const key of ['minConditionToEnter'] as const) {
      const table = ECONOMY.availability[key] as Record<TierId, number>
      expect(Object.keys(table).sort()).toEqual([...ALL_TIERS].sort())
      for (let i = 1; i < TIER_LADDER.length; i++) {
        expect(table[TIER_LADDER[i]]).toBeGreaterThan(table[TIER_LADDER[i - 1]])
      }
    }
    const fatigue = ECONOMY.condition.tierMatchFatigue as Record<TierId, number>
    expect(Object.keys(fatigue).sort()).toEqual([...ALL_TIERS].sort())
    for (let i = 1; i < TIER_LADDER.length; i++) {
      expect(fatigue[TIER_LADDER[i]]).toBeGreaterThan(fatigue[TIER_LADDER[i - 1]])
    }
  })

  it('matchDrain extrapolates above national for the J levels', () => {
    // ⚠ RE-PINNED +1 each 26.07 (MATCH BASE RAISE, straightSets 1 → 2): the J extrapolation itself
    // is untouched – tierMatchFatigue is unchanged and the +1-per-rung shape is what this test is
    // about. Only the base under it moved, so every cell went up by exactly one.
    expect(matchDrain('national', '6-4 6-2')).toBe(4) // 2 + 2
    expect(matchDrain('j30', '6-4 6-2')).toBe(5) // 2 + 3 (was the itf pin)
    expect(matchDrain('j60', '6-4 6-2')).toBe(6)
    expect(matchDrain('j300', '6-4 6-2')).toBe(7)
  })

  it('WIN_IMMUNITY_WEEKS covers every tier (avatar emotion)', () => {
    expect(Object.keys(WIN_IMMUNITY_WEEKS).sort()).toEqual([...ALL_TIERS].sort())
  })
})

describe('L10 — UI surfaces cover the whole catalogue and stay fiction-safe', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

  it('TierGuide renders the whole ladder and the Home strip names every rung', () => {
    const guide = read('../src/components/TierGuide.vue')
    expect(guide).toContain('TIER_LADDER') // derived from the catalogue, never a hand-kept list
    expect(guide).not.toContain("'itf'")
    const home = read('../src/components/screens/HomeScreen.vue')
    for (const t of ALL_TIERS) expect(home).toContain(`'${t}'`)
    expect(home).not.toContain("'itf'")
  })

  it('player-facing copy drops the ITF trademark and keeps the short dash', () => {
    for (const rel of [
      '../src/components/TierGuide.vue',
      '../src/components/screens/HomeScreen.vue',
      '../src/components/screens/SeasonScreen.vue',
    ]) {
      const src = read(rel)
      expect(src).not.toMatch(/\bITF\b/) // fictional analogues only – ITF is a trademark
      expect(src.includes('—')).toBe(false) // short dash only
      // No Cyrillic in RENDERED copy. Script comments legitimately quote the owner in Russian
      // (the existing convention across the engine), so only the template is checked.
      // ⚠ RE-AIMED by U0 – the EXTRACTION, not the assertion. The slice ran to the end of the FILE,
      // which was the template only while these SFCs had no <style> block; U0 gave Home and Season
      // one, and CSS comments follow the same quote-the-owner-in-Russian convention the script
      // comments do. Bounding at the last `</template>` reads exactly what the player sees, which is
      // what the comment above already said this was for. The assertion is untouched.
      const template = src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
      expect(template.length, `${rel} template`).toBeGreaterThan(500) // never a silent empty slice
      expect(template).not.toMatch(/[Ѐ-ӿ]/)
    }
  })

  it('tierFromLabel resolves a summary line even though "Junior Tour 30" prefixes "Junior Tour 300"', () => {
    const labels = ALL_TIERS.map((t) => TIERS[t].label)
    expect(new Set(labels).size).toBe(labels.length)
    // The trap: j30's label IS a prefix of j300's, so a first-match scan mis-credits every J300.
    expect(TIERS.j300.label.startsWith(TIERS.j30.label)).toBe(true)
    for (const t of ALL_TIERS) {
      expect(tierFromLabel(`${TIERS[t].label} (hard, W12): Mirra – Champion (+1 pts)`)).toBe(t)
    }
    expect(tierFromLabel('Something else entirely')).toBeUndefined()
  })
})

describe('L11 — the whole career still runs (integration smoke)', () => {
  it('a 156-week career climbs the ladder and books J-level entries', () => {
    const world: WorldState = createWorld('ladder-smoke')
    const rng = rngFromSeed(world.seed)
    const entered = new Set<TierId>()
    for (let i = 0; i < 156; i++) {
      // Pretend she is elite: huge counting results keep her inside every top band, so this
      // measures pure CALENDAR reach (does the J family actually turn up and stay enterable?)
      // rather than re-testing the ladder.
      // ⚠ TWO ROWS NOW, one per track. A single j300 row made her #1 in the world and left her
      // DOMESTIC total at zero - which shuts the on-ramp, because j30 opens on her national
      // standing. Being elite abroad is not a way into your first international event; that is the
      // whole point of the on-ramp, and this fixture has to say it in both currencies.
      world.results.push({ playerId: KID_ID, week: world.week, points: 5000, tier: 'j300' })
      world.results.push({ playerId: KID_ID, week: world.week, points: 5000, tier: 'national' })
      for (const e of world.season) {
        if (world.entries.includes(e.id)) continue
        if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
        if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
        // ⚠ RE-AIMED: `isTierEligible` is the DOMESTIC half only, and it waves every international
        // event through - the J rungs sit on a [0, MAX] band and are gated by an acceptance list
        // instead. Asking the engine's own single gate is the point of having one.
        if (!tierOpenFor(world, e.tier)) continue
        if (availabilityStatus(world, e).level === 'blocked') continue
        world.fundsCents = 500_000_00
        enterEvent(world, e.id)
        entered.add(e.tier)
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        // fast-forward the reveal exactly like the benches do
        skipTournament(world)
        closeTournament(world)
      }
    }
    // ⚠ RE-AIMED by the two ladders. The claim was "a three-year career reaches every rung", which
    // was true when the top rungs opened on a points total any grinder accumulates. They are
    // ACCEPTANCE LISTS now - j60 takes the top 40% of the field and j300 the top 25% - so reaching
    // them is a competitive achievement rather than a matter of time served, and a smoke test that
    // demanded it would be asserting the ladder has no top. What this test is for is that the whole
    // catalogue still RUNS end to end over three years, so it asserts the climb it can guarantee:
    // the domestic ladder and the international on-ramp. Whether a given career reaches j300 is a
    // BALANCE question and it is measured on the bench, not pinned here.
    expect(entered.has('j30')).toBe(true)
    expect(entered.has('j60')).toBe(true)
    expect(entered.has('j300')).toBe(true)
  })
})
