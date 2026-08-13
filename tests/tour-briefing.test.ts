// ⭐ ROUND-18 #8 – THE BRIEFING'S NUMBERS ARE THE RULE'S NUMBERS.
//
// The owner asked for a notice before the season of big prizes saying that she really is required to
// be there and that there is a regulation behind it. The regulation is his own (W3-ACT2 §6) and has
// been enforced since v38; what never existed is anybody saying so. `buildTourBriefing` is that
// sentence, and this file guards the one property that makes it worth shipping:
//
//   ⚠⚠ A BRIEFING THAT CAN DRIFT FROM THE RULE IT EXPLAINS IS WORSE THAN NO BRIEFING. If the copy
//   said "the top 50" while `ECONOMY.mandatory.maxRank` said 40, the player would plan a season
//   against a rule the world does not run – and he would have no way of finding that out except by
//   being charged. So every figure the briefing prints is READ, and this file proves it two ways:
//   by patching each field of the economy and watching the sentence move, and by collecting every
//   integer in the finished text and refusing any that the rule does not hold.
//
// ⚠ MUTATION-VERIFIED, and each block names what was broken to watch it fail:
//   * `maxRank` hard-coded as `50` in the lead              -> the "the lead quotes" block goes red.
//   * the requirement list written out as three literal rows -> the "walks ECONOMY" block goes red.
//   * `18` typed into the zero sentence instead of BEST_N    -> the "every integer" block goes red.
//   * the zero sentence moved below the penalty-points one   -> the "the zero comes first" block.
//   * the season letter's id changed to a per-week one       -> the "one letter a season" block.
import { describe, it, expect } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { BEST_N_BY_TRACK } from '../src/engine/season/ranking'
import { buildTourBriefing, createWorld, KID_ID, type WorldState } from '../src/engine/world'
import { settleTourSeasonNotice } from '../src/engine/world/mandatory'
import { pruneEntryLetters } from '../src/engine/offers'
import type { TourLetterTerms } from '../src/shared/protocol'

/** A world the regime binds, built the cheapest honest way: `mandatoryBindsRank` asks for a counting
 *  W result (so an unranked girl cannot read as a number – the `hasResults` guard) and a rank inside
 *  the gate. Both are plain persisted state, so no career has to be simulated to reach the regime. */
function boundWorld(rank = 34, seed = 'tour-brief'): WorldState {
  const world = createWorld(seed)
  world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
  world.kidRankWta = rank
  return world
}

/** Everything the briefing says, as one string – the surface a player actually reads. */
function briefingText(world: WorldState): string {
  const b = buildTourBriefing(world)
  if (!b) throw new Error('the fixture does not bind – every assertion below would be vacuous')
  return [b.lead, ...b.requirements.map((r) => `${r.ask} ${r.detail}`), ...b.costs, b.closing].join(' ')
}

/** Patch fields of the mandatory block, run `read`, and always put them back. The patch-and-restore
 *  idiom `tools/best16-bench.ts` already uses on `BEST_N_BY_TRACK`, and the reason `ECONOMY` is a
 *  plain object rather than `as const`.
 *
 *  ⚠ WIDENED THROUGH `Record<string, unknown>` ON PURPOSE. The literals on the const object narrow
 *  to their own values (`maxRank: 50`, not `number`), so a typed patch cannot express "50 becomes
 *  25" – which is precisely the mutation every test below is made of. */
function withMandatory<T>(patch: Record<string, unknown>, read: () => T): T {
  const block = ECONOMY.mandatory as unknown as Record<string, unknown>
  const before = { ...block }
  Object.assign(block, patch)
  try {
    return read()
  } finally {
    Object.assign(block, before)
  }
}

describe('the briefing exists exactly when the regime binds', () => {
  it('is null for a career the tour asks nothing of – which is most of one', () => {
    expect(buildTourBriefing(createWorld('nobody'))).toBeNull()
  })

  it('is null for a girl ranked inside the gate who has never scored a W point', () => {
    // The `hasResults` guard `mandatoryBindsRank` keeps: competition ranking ties everybody without a
    // counting result at the floor, so a number alone is not a standing.
    const world = createWorld('unraced')
    world.kidRankWta = 12
    expect(buildTourBriefing(world)).toBeNull()
  })

  it('is non-null the moment she is ranked inside the gate', () => {
    const b = buildTourBriefing(boundWorld(34))
    expect(b).not.toBeNull()
    expect(b!.rank).toBe(34)
    expect(b!.maxRank).toBe(ECONOMY.mandatory.maxRank)
  })

  it('...and the GATE is read, not assumed – a tighter economy makes the same career unbriefed', () => {
    const world = boundWorld(34)
    expect(withMandatory({ maxRank: 20 }, () => buildTourBriefing(world))).toBeNull()
    // ...and it comes back when the rule does, so the patch is not just breaking the fixture.
    expect(buildTourBriefing(world)).not.toBeNull()
  })
})

describe('⚠⚠ every number the briefing prints is read from the rule', () => {
  it('the lead quotes ECONOMY.mandatory.maxRank and her own rank', () => {
    const world = boundWorld(41)
    expect(buildTourBriefing(world)!.lead).toContain('top 50')
    expect(buildTourBriefing(world)!.lead).toContain('41')
    // Mutation-verified: hard-code 50 in the lead and this line goes red.
    const patched = withMandatory({ maxRank: 25 }, () => buildTourBriefing(boundWorld(11))!.lead)
    expect(patched).toContain('top 25')
    expect(patched).not.toContain('top 50')
  })

  it('the requirement list WALKS ECONOMY.mandatory rather than naming rungs in the copy', () => {
    const b = buildTourBriefing(boundWorld())!
    // The per-event families, in the economy's own order, then the quota rung last.
    expect(b.requirements.map((r) => r.tier)).toEqual([
      ...ECONOMY.mandatory.perEventTiers,
      ECONOMY.mandatory.quotaTier,
    ])
    for (const row of b.requirements) {
      expect(row.label, `${row.tier} is labelled by the calendar`).toBe(TIERS[row.tier].label)
      expect(row.ask).toContain(TIERS[row.tier].label)
    }
    // ...and the COUNTS are the calendar's anchor weeks, not numbers in a sentence.
    for (const tier of ECONOMY.mandatory.perEventTiers) {
      const row = b.requirements.find((r) => r.tier === tier)!
      expect(row.ask).toContain(String(TIERS[tier].anchorWeeks!.length))
    }
    const quota = b.requirements[b.requirements.length - 1]
    expect(quota.ask).toContain(String(ECONOMY.mandatory.quota))
    expect(quota.ask).toContain(String(TIERS[ECONOMY.mandatory.quotaTier].anchorWeeks!.length))
  })

  it('a retune moves the quota sentence with it', () => {
    // Mutation-verified: write "6 of the 10" into the copy and this goes red.
    const asks = withMandatory({ quota: 9 }, () =>
      buildTourBriefing(boundWorld())!.requirements.map((r) => r.ask),
    )
    expect(asks.some((a) => a.startsWith('9 of the '))).toBe(true)
  })

  it('...and a NEW per-event family grows the list on its own', () => {
    // The strongest form of "walks the economy": add a rung to `perEventTiers` and the briefing has
    // to describe it without a line of new copy. A briefing that could not do this would silently go
    // on describing last month's regime after a retune.
    const rows = withMandatory({ perEventTiers: ['slam', 'wta1000', 'wta250'] }, () =>
      buildTourBriefing(boundWorld())!.requirements,
    )
    expect(rows.map((r) => r.tier)).toEqual(['slam', 'wta1000', 'wta250', 'wta500'])
    expect(rows[2].ask).toContain(TIERS.wta250.label)
  })

  it('every price in the cost list moves when its field does', () => {
    const world = boundWorld()
    // One sentinel per field, all distinctive, so a value that leaked into the copy as a literal
    // cannot be mistaken for one that was read.
    const sentinels: [string, number][] = [
      ['skipPoints', 71],
      ['lateWithdrawalPoints', 72],
      ['noShowPoints', 73],
      ['quotaShortfallPoints', 74],
      ['suspensionAt', 75],
      ['suspensionWeeks', 76],
      ['windowWeeks', 77],
      ['quota', 78],
    ]
    for (const [field, value] of sentinels) {
      const costs = withMandatory({ [field]: value }, () => buildTourBriefing(world)!.costs.join(' '))
      expect(costs, `${field} is read, not typed`).toContain(String(value))
    }
  })

  it('the counting-slot count is the RANKING\'s number, not one written into the sentence', () => {
    const world = boundWorld()
    expect(buildTourBriefing(world)!.costs[0]).toContain(String(BEST_N_BY_TRACK.wta))
    const before = BEST_N_BY_TRACK.wta
    BEST_N_BY_TRACK.wta = 23
    try {
      expect(buildTourBriefing(world)!.costs[0]).toContain('23')
    } finally {
      BEST_N_BY_TRACK.wta = before
    }
  })

  it('⚠⚠ NO INTEGER APPEARS THAT THE RULE DOES NOT HOLD', () => {
    // The catch-all, and the one that would have caught a hard-coded "50" that happened to be right
    // on the day it was written. Every digit run in the finished text has to be a number the world
    // can produce: the economy's own fields, the calendar's counts, the ranking window, her rank, or
    // a figure inside a rung's LABEL (the WTA 1000 / WTA 500 names are the calendar's, not copy).
    const world = boundWorld(41)
    const m = ECONOMY.mandatory
    const licensed = new Set<string>()
    for (const value of Object.values(m)) if (typeof value === 'number') licensed.add(String(value))
    for (const tier of [...m.perEventTiers, m.quotaTier]) {
      licensed.add(String(TIERS[tier].anchorWeeks?.length ?? 0))
      for (const digits of TIERS[tier].label.match(/\d+/g) ?? []) licensed.add(digits)
    }
    licensed.add(String(BEST_N_BY_TRACK.wta))
    licensed.add('41') // her rank, which the lead states
    const printed = briefingText(world).match(/\d+/g) ?? []
    expect(printed.length, 'not vacuous - the briefing does print numbers').toBeGreaterThan(8)
    expect([...new Set(printed)].filter((n) => !licensed.has(n))).toEqual([])
  })
})

describe('⚠ the price list is the design, in the design\'s order', () => {
  it('the ZERO comes first, and it is named as a slot rather than as a fine', () => {
    // `season/ranking.ts` argues at length why the zero is the real rule and crueller than a fine:
    // the tour takes a SLOT, not points off a total. Leading on the penalty points would teach the
    // player that this is a fine, which it is not.
    const costs = buildTourBriefing(boundWorld())!.costs
    expect(costs[0]).toMatch(/zero/i)
    expect(costs[0]).toMatch(/counting results/i)
    expect(costs[0]).toMatch(/not a fine/i)
    // ...and no OTHER line calls it one.
    expect(costs.slice(1).join(' ')).not.toMatch(/\bfine\b/i)
  })

  it('«an obligation she could not have met is not an obligation» is stated to the player', () => {
    // The clause `mandatoryBinds` enforces, and the half nobody would assume. It belongs in a price
    // list precisely because it is the one thing on it that is free.
    const costs = buildTourBriefing(boundWorld())!.costs.join(' ')
    expect(costs).toMatch(/injured/i)
    expect(costs).toMatch(/suspended/i)
    expect(costs).toMatch(/entry list/i)
    expect(costs).toMatch(/committed to another tournament/i)
  })

  it('⚠⚠ NOTHING IN IT LEANS ON THE PLAYER – the standing ruling, as an assertion', () => {
    // «Мы ни за что не наказываем», and `engine/offers.ts` carries the sentence that decides this
    // family's voice above `raiseMandatoryDueLetter`: the tour has rules and the GAME has none. A
    // penalty is a price she chose to pay, so the briefing is priced like an invoice and worded like
    // one. Mutation-verified by adding "she really should play these" to the closing line.
    const text = briefingText(boundWorld())
    expect(text).not.toMatch(/should|ought to|make sure|don't forget|be careful|failed|failure/i)
    expect(text).not.toMatch(/punish|penalis|penaliz|shame|let her down|disappoint/i)
    // ...and the closing line says so outright.
    const b = buildTourBriefing(boundWorld())!
    expect(b.closing).toMatch(/none of it is an instruction/i)
    expect(b.closing).toMatch(/decision/i)
  })

  it('the copy rule: short dash only, never the long one', () => {
    expect(briefingText(boundWorld())).not.toContain('—')
    expect(briefingText(boundWorld())).toContain('–')
  })
})

describe('the quiet half: one season letter, and it never nags', () => {
  const tourLetters = (world: WorldState) => world.offers.filter((o) => o.kind === 'tour')

  it('writes nothing at all for a career the regime does not bind', () => {
    const world = createWorld('quiet')
    settleTourSeasonNotice(world)
    expect(tourLetters(world)).toEqual([])
  })

  it('ONE letter a season, however many times the week is replayed', () => {
    // Mutation-verified: key the id on the week instead of the season and this reads 3.
    const world = boundWorld()
    settleTourSeasonNotice(world)
    settleTourSeasonNotice(world)
    world.week += 5
    settleTourSeasonNotice(world)
    expect(tourLetters(world).length).toBe(1)
    expect(tourLetters(world)[0].id).toBe('tour-season-0')
  })

  it('...and a new season gets a new one', () => {
    const world = boundWorld()
    settleTourSeasonNotice(world)
    world.week = 52
    settleTourSeasonNotice(world)
    expect(tourLetters(world).map((o) => o.id)).toEqual(['tour-season-0', 'tour-season-1'])
  })

  it('...and last season\'s is REPLACED, not stacked beside the new one', () => {
    // The inbox's own destructor drops `tour` letters from finished seasons, so the reminder lives
    // exactly as long as the season it describes. Without this the letter would be the one thing in
    // the inbox that accumulated for ever – a "quiet reminder" turning into a pile.
    const world = boundWorld()
    settleTourSeasonNotice(world)
    world.week = 52
    settleTourSeasonNotice(world)
    world.offers = pruneEntryLetters(world.offers, world.week)
    expect(world.offers.filter((o) => o.kind === 'tour').map((o) => o.id)).toEqual(['tour-season-1'])
  })

  it('it is INFORMATIONAL and writes no feed row – the inbox cue is what announces post', () => {
    const world = boundWorld()
    const before = world.events.length
    settleTourSeasonNotice(world)
    expect(tourLetters(world)[0].state).toBe('info')
    expect(world.events.length, 'the feed budget is one row a season boundary, and this is not it')
      .toBe(before)
  })

  it('its terms carry the rule\'s numbers, so the sheet cannot drift either', () => {
    const world = boundWorld()
    settleTourSeasonNotice(world)
    const terms = tourLetters(world)[0].terms as TourLetterTerms
    expect(terms.notice).toBe('season')
    expect(terms.maxRank).toBe(ECONOMY.mandatory.maxRank)
    expect(terms.points).toBe(ECONOMY.mandatory.skipPoints)
    expect(terms.suspensionAt).toBe(ECONOMY.mandatory.suspensionAt)
    expect(terms.suspensionWeeks).toBe(ECONOMY.mandatory.suspensionWeeks)
    expect(terms.windowWeeks).toBe(ECONOMY.mandatory.windowWeeks)
    expect(terms.countingSlots).toBe(BEST_N_BY_TRACK.wta)
    // The same requirement list the briefing prints, so the two surfaces cannot say different things.
    expect(terms.requirements).toEqual(buildTourBriefing(world)!.requirements.map((r) => r.ask))
  })

  it('...and a retuned economy writes a retuned letter', () => {
    // Ranked 11, so the tighter gate below still binds her – the whole point of the patch is to move
    // the NUMBERS on the paper, not to make the letter vanish (which is what rank 34 did, correctly).
    const world = boundWorld(11)
    withMandatory({ maxRank: 18, skipPoints: 9 }, () => settleTourSeasonNotice(world))
    const terms = tourLetters(world)[0].terms as TourLetterTerms
    expect(terms.maxRank).toBe(18)
    expect(terms.points).toBe(9)
  })
})
