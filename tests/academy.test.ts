import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'

// A couple of these tick four full seasons of a real career to reach the reviews they are about.
vi.setConfig({ testTimeout: 120_000 })

import {
  createWorld,
  tickWeek,
  enterEvent,
  skipEvent,
  skipTournament,
  closeTournament,
  travelCostFor,
  reviewAcademy,
  toSnapshot,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import {
  ceilingOf,
  kitGrantCents,
  netTravelCents,
  needFactor,
  resultScore,
  reviewLevel,
  scoutScore,
  travelCoverShare,
  type AcademySupport,
} from '../src/engine/academy'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type FamilyBackground, type KitLine, type Offer } from '../src/shared/protocol'

const SKILLS = { serve: 60, ret: 60, composure: 60, stamina: 60, groundstrokes: 60 }

function support(level: number): AcademySupport {
  return { level, sinceWeek: 52, seasonIndex: 1, coveredCents: 0 }
}

/** A career of the given background, ticked `weeks` weeks with a policy that enters whatever the
 *  gate allows – the same shape the demo-save tool and the benches use. */
function runCareer(seed: string, background: FamilyBackground, weeks: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* gated on points/funds/availability – the policy just moves on */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

describe('the academy verdict (pure)', () => {
  it('is need-based: a wealthy family is never backed, however good she is', () => {
    const level = reviewLevel({
      rank: 1,
      potential: { serve: 95, ret: 95, composure: 95, stamina: 95, groundstrokes: 95 },
      background: 'wealthy',
      playedLastYear: 12,
      ageYears: 16,
    })
    expect(level).toBe(0)
    expect(needFactor('wealthy')).toBe(0)
    expect(needFactor('working')).toBeGreaterThan(needFactor('middle'))
  })

  it('is junior support: outside the age band nobody is backed', () => {
    const [minAge, maxAge] = ECONOMY.academy.ageBand
    const args = {
      rank: 10,
      potential: { serve: 80, ret: 80, composure: 80, stamina: 80, groundstrokes: 80 },
      background: 'working' as const,
      playedLastYear: 10,
    }
    expect(reviewLevel({ ...args, ageYears: maxAge })).toBeGreaterThan(0)
    expect(reviewLevel({ ...args, ageYears: maxAge + 1 })).toBe(0)
    expect(reviewLevel({ ...args, ageYears: minAge - 1 })).toBe(0)
  })

  it('funds players, not prospects: below the minimum year of tournaments it pays nothing', () => {
    const args = {
      rank: 10,
      potential: { serve: 80, ret: 80, composure: 80, stamina: 80, groundstrokes: 80 },
      background: 'working' as const,
      ageYears: 16,
    }
    expect(reviewLevel({ ...args, playedLastYear: ECONOMY.academy.minEventsPerYear })).toBeGreaterThan(0)
    expect(reviewLevel({ ...args, playedLastYear: ECONOMY.academy.minEventsPerYear - 1 })).toBe(0)
  })

  it('is a size and not a switch: it rises with results and with the scouting read, and caps at 1', () => {
    const base = { background: 'working' as const, playedLastYear: 10, ageYears: 16 }
    const mid = reviewLevel({ ...base, rank: 90, potential: SKILLS })
    const better = reviewLevel({ ...base, rank: 45, potential: SKILLS })
    const taller = reviewLevel({ ...base, rank: 90, potential: { serve: 70, ret: 70, composure: 70, stamina: 70, groundstrokes: 70 } })
    expect(better).toBeGreaterThan(mid)
    expect(taller).toBeGreaterThan(mid)
    // Rank #1 with a ceiling above the band and full need: everything saturates, nothing overflows.
    expect(reviewLevel({ ...base, rank: 1, potential: { serve: 99, ret: 99, composure: 99, stamina: 99, groundstrokes: 99 } })).toBe(1)
  })

  it('reads the halves it says it reads', () => {
    expect(resultScore(ECONOMY.academy.rankFull)).toBe(1)
    expect(resultScore(ECONOMY.academy.rankNone)).toBe(0)
    expect(resultScore(ECONOMY.academy.rankNone + 50)).toBe(0)
    expect(scoutScore(ECONOMY.academy.ceilingBand[0])).toBe(0)
    expect(scoutScore(ECONOMY.academy.ceilingBand[1])).toBe(1)
    // ⚠ RE-AIMED: `ceilingOf` is the mean over `SKILL_KEYS`, and that is FIVE keys since v25 - it
    // walks the array rather than naming the attributes, which is why the function itself needed no
    // change. The answer is still 65, and deliberately so: a fifth value of 65 is the one that holds
    // the pin's arithmetic still while proving the fold really did widen. The protected fact is
    // unchanged - `ceilingOf` averages her whole ceiling and nothing else.
    expect(ceilingOf({ serve: 50, ret: 60, composure: 70, stamina: 80, groundstrokes: 65 })).toBe(65)
  })

  it('scales the trip and the kit off that one level', () => {
    expect(travelCoverShare(null)).toBe(0)
    expect(netTravelCents(1000_00, null)).toBe(1000_00)
    expect(travelCoverShare(support(1))).toBe(ECONOMY.academy.travelCover)
    expect(netTravelCents(1000_00, support(1))).toBe(1000_00 - Math.round(1000_00 * ECONOMY.academy.travelCover))
    expect(netTravelCents(1000_00, support(0.5))).toBeGreaterThan(netTravelCents(1000_00, support(1)))
    expect(kitGrantCents(0)).toBe(0)
    expect(kitGrantCents(1)).toBe(ECONOMY.academy.kitCentsAtFull)
  })
})

describe('the academy in a career', () => {
  it('reviews her at the season boundary and announces the offer once', () => {
    const world = runCareer('acad-offer', 'working', 60)
    expect(world.academy).not.toBeNull()
    expect(world.academy!.level).toBeGreaterThan(0)
    // The first review is the boundary into season 1 – she plays a year before anyone writes.
    expect(world.academy!.sinceWeek).toBe(52)
    const offers = world.events.filter((e) => e.milestoneKey?.startsWith('academy-in-'))
    expect(offers).toHaveLength(1)
    expect(offers[0].text).toMatch(/^An academy has taken her on – a scholarship covering \d+% of her travel\.$/)
  })

  it('pays the kit grant as income, once per review, under its own category', () => {
    const world = runCareer('acad-kit', 'working', 60)
    const grants = world.events.filter((e) => e.category === 'academy')
    expect(grants).toHaveLength(1)
    expect(grants[0].type).toBe('income')
    expect(grants[0].week).toBe(52)
    expect(grants[0].amountCents).toBe(kitGrantCents(world.academy!.level))
    expect(grants[0].amountCents!).toBeGreaterThan(0)
  })

  it('charges travel net of the scholarship, says so on the line, and tallies what was covered', () => {
    const world = runCareer('acad-travel', 'working', 90)
    expect(world.academy).not.toBeNull()
    const trips = world.events.filter((e) => e.category === 'travel' && e.type === 'expense' && e.week > 52)
    expect(trips.length).toBeGreaterThan(0)
    for (const t of trips) expect(t.text).toContain('academy covers')
    expect(world.academy!.coveredCents).toBeGreaterThan(0)
  })

  it('never backs a wealthy family, whatever the career does', () => {
    const world = runCareer('acad-rich', 'wealthy', 120)
    expect(world.academy).toBeNull()
    expect(world.events.some((e) => e.category === 'academy')).toBe(false)
    expect(world.events.some((e) => e.text.includes('academy covers'))).toBe(false)
  })

  it('ends the scholarship, and says which of the three reasons it was', () => {
    // Driven through reviewAcademy directly rather than through 260 weeks of career: the point is
    // the verdict's reason, and a real career reaches each of the three by a different route.
    const backed = () => {
      const w = runCareer('acad-offer', 'working', 60)
      expect(w.academy).not.toBeNull()
      return w
    }

    // Aged out: the band tops out at 18, so the review that makes her 19 closes it.
    const older = backed()
    older.week = (ECONOMY.academy.ageBand[1] + 1 - 14) * 52
    reviewAcademy(older)
    expect(older.academy).toBeNull()
    expect(lastEnding(older)).toContain('aged out')

    // Stopped competing: same age, but the year behind her is empty.
    const idle = backed()
    idle.week = 104
    idle.results = idle.results.filter((r) => r.playerId !== 'kid')
    reviewAcademy(idle)
    expect(idle.academy).toBeNull()
    expect(lastEnding(idle)).toContain('barely competed')

    // Neither: she is still a junior and still playing, but the case is no longer there.
    const dropped = backed()
    dropped.week = 104
    dropped.results.push(...Array.from({ length: 5 }, (_, i) => ({ playerId: 'kid', week: 100 - i, points: 0 })))
    dropped.kidRank = ECONOMY.academy.rankNone + 40
    dropped.potential = { serve: 30, ret: 30, composure: 30, stamina: 30, groundstrokes: 30 }
    reviewAcademy(dropped)
    expect(dropped.academy).toBeNull()
    expect(lastEnding(dropped)).toContain('did not make their case')
  })
})

function lastEnding(world: WorldState): string {
  const ended = world.events.filter((e) => e.text.startsWith('The academy has ended her scholarship'))
  expect(ended.length).toBeGreaterThan(0)
  return ended[ended.length - 1].text
}

// =================================================================================================
// THE KIT GRANT STANDS DOWN UNDER A LIVE KIT DEAL (round 15, owner 01.08: «мне кажется, что это
// справедливо»). Until this round the review paid the full grant while a signed brand deal covered
// the same lines – the family was paid twice for one string bed. The review now funds only the
// UNCOVERED lines, a third per line, and full coverage swaps the income row for an info line so the
// grant never just silently vanishes. The review is a flow, not persisted terms: no schema change.
// =================================================================================================
describe('the kit grant stands down under a live kit deal', () => {
  /** A backed career pushed to its SECOND review (week 104), with the review's own gates held
   *  open: enough played weeks in the window and a rank that reads as a prospect. Driven through
   *  reviewAcademy directly, the same idiom as the endings test above. */
  const backedAt104 = () => {
    const w = runCareer('acad-offer', 'working', 60)
    expect(w.academy).not.toBeNull()
    w.week = 104
    w.kidRank = ECONOMY.academy.rankFull
    w.results.push(...Array.from({ length: 5 }, (_, i) => ({ playerId: 'kid', week: 100 - i, points: 0 })))
    return w
  }
  const signedDeal = (covers: KitLine[], brand: string): Offer => ({
    id: 'kit-100',
    kind: 'kit',
    week: 100,
    deadlineWeek: 103,
    state: 'signed',
    decidedWeek: 100,
    untilWeek: 155,
    coveredCents: 0,
    terms: {
      tier: covers.length >= 3 ? 'global' : 'local',
      brand,
      kitAllowanceCents: 100_00,
      freshCap: 0.5,
      minEventsPerSeason: 6,
      covers,
      travelShare: 0,
      seasons: 1,
    },
  })
  const reviewGrant = (w: WorldState) => w.events.filter((e) => e.category === 'academy' && e.week === 104)

  it('no deal: the full grant, under the classic line', () => {
    const w = backedAt104()
    reviewAcademy(w)
    const grants = reviewGrant(w)
    expect(grants).toHaveLength(1)
    expect(grants[0].amountCents).toBe(kitGrantCents(w.academy!.level))
    expect(grants[0].text).toBe('Academy kit grant – rackets, strings and shoes for the season')
  })

  it('a local deal covers her strings: two thirds of the grant, and the row says what it is for', () => {
    const w = backedAt104()
    w.offers.push(signedDeal(['strings'], 'Baseline Sports'))
    reviewAcademy(w)
    const grants = reviewGrant(w)
    expect(grants).toHaveLength(1)
    expect(grants[0].amountCents).toBe(Math.round((kitGrantCents(w.academy!.level) * 2) / 3))
    expect(grants[0].text).toBe('Academy kit grant – frames and shoes; Baseline Sports covers her strings.')
  })

  it('a global deal covers everything: no grant, and the feed says why instead of going quiet', () => {
    const w = backedAt104()
    w.offers.push(signedDeal(['strings', 'frame', 'shoes'], 'Meteor'))
    const fundsBefore = w.fundsCents
    reviewAcademy(w)
    expect(reviewGrant(w)).toHaveLength(0)
    expect(w.fundsCents).toBe(fundsBefore)
    const info = w.events.filter((e) => e.week === 104 && e.type === 'info' && e.text.includes('kit grant'))
    expect(info).toHaveLength(1)
    expect(info[0].text).toBe('No academy kit grant this year – Meteor already kits her out.')
    // ...and the scholarship itself is untouched: the deal displaces the KIT, never the backing.
    expect(w.academy).not.toBeNull()
    expect(w.academy!.level).toBeGreaterThan(0)
  })

  it('the stand-down reads the ONE deal answer everything else reads', () => {
    // `activeKitDeal` is the single definition of "a deal is in force this week" (offers.ts). A
    // review that re-derived it – say by scanning `state === 'signed'` without the week window –
    // would stand the grant down under a deal that already lapsed. A lapsed deal pays in full.
    const w = backedAt104()
    const lapsed = signedDeal(['strings', 'frame', 'shoes'], 'Meteor')
    lapsed.untilWeek = 103 // ran out the week before the review
    w.offers.push(lapsed)
    reviewAcademy(w)
    const grants = reviewGrant(w)
    expect(grants).toHaveLength(1)
    expect(grants[0].amountCents).toBe(kitGrantCents(w.academy!.level))
  })
})

describe('the scholarship cannot be turned into free money', () => {
  it('refunds a post-deadline withdrawal at the price she actually paid', () => {
    // Walk a backed career forward until a tournament week spawns a reveal, then withdraw from it.
    const world = createWorld('acad-skip', { ...DEFAULT_PROFILE, background: 'working', coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    let charged: number | null = null
    let fundsAfterTick = 0
    let eventId = ''
    for (let w = 0; w < 208 && charged === null; w++) {
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* gated */
          }
        }
      }
      const before = world.fundsCents
      tickWeek(world, rng)
      if (world.pendingTournament) {
        const ev = world.season.find((e) => e.id === world.pendingTournament!.eventId)!
        // Only a trip the academy actually discounted proves anything.
        if (world.academy && world.academy.level > 0 && travelCostFor(world, ev) < ev.travelCostCents) {
          charged = travelCostFor(world, ev)
          fundsAfterTick = world.fundsCents
          eventId = ev.id
          break
        }
        skipTournament(world)
        closeTournament(world)
      }
      void before
    }
    expect(charged).not.toBeNull()

    const coveredBefore = world.academy!.coveredCents
    skipEvent(world, eventId)
    // She gets back what she paid – NOT the calendar's sticker price. Anything else is an arbitrage:
    // enter at the covered price, withdraw at the full refund, repeat for every J30 on the calendar.
    expect(world.fundsCents).toBe(fundsAfterTick + charged!)
    const refund = [...world.events].reverse().find((e) => e.text.startsWith('Travel refunded'))!
    expect(refund.amountCents).toBe(charged)
    // ...and the academy's season tally gives the covered part back too, so a season of enter-and-
    // withdraw cannot inflate what the wrap-up says the scholarship was worth.
    expect(world.academy!.coveredCents).toBeLessThan(coveredBefore)
  })
})

describe('schema v21', () => {
  it('migrates a v20 save to an unbacked career rather than inventing a scholarship', () => {
    const v20 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v20.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(v20)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.academy).toBeNull()
  })

  it('opens a fresh career unbacked', () => {
    const world = createWorld('acad-fresh')
    expect(world.academy).toBeNull()
    // ⚠ RE-AIMED from the literal 21 to the constant (the coach ladder bumped it to 22). The fact
    // this line guards is "a fresh career opens on the CURRENT schema", which a literal restates as
    // a version number and then has to chase every bump; the constant states it directly.
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
  })
})

// --- what the player is shown -------------------------------------------------
// The project has no component mounting, so the UI facts are pinned by reading the source – the
// same guard style the redesign slices use. ⚠ If one of these fires, RE-AIM it at wherever the fact
// moved to; do not delete it. The fact being protected is that a discounted number is never shown
// without saying who discounted it.

describe('the scholarship is visible where the money is', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

  it('names the academy under the Season card travel figure', () => {
    const src = read('../src/components/screens/SeasonScreen.vue')
    expect(src).toContain('academyCoverPct')
    expect(src).toContain('academy covers {{ academyCoverPct }}%')
    // The figure it explains is the engine's net price, not the calendar's sticker.
    expect(src).toContain('formatDollars(row.event.travelCostCents)')
  })

  it('reports the season total in the wrap-up, and hides the row when nobody backed her', () => {
    const src = read('../src/components/SeasonSummaryDialog.vue')
    expect(src).toContain('Academy covered')
    expect(src).toContain('(summary.academyCoveredCents ?? 0) > 0')
  })

  it('carries the scholarship on the snapshot as a SHARE, ready to print', () => {
    const world = runCareer('acad-offer', 'working', 60)
    const snap = toSnapshot(world)
    expect(snap.academy).not.toBeNull()
    expect(snap.academy!.coverShare).toBeCloseTo(travelCoverShare(world.academy), 12)
    expect(snap.academy!.sinceWeek).toBe(52)
    // ...and every quoted travel price is already net of it.
    const full = world.season.find((e) => e.week > world.week)!
    expect(travelCostFor(world, full)).toBeLessThan(full.travelCostCents)
  })
})
