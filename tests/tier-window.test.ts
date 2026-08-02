import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { feedContext, feedShows, preferredWeekEvent, type FeedEventFacts } from '../src/composables/tierState'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { createWorld, toSnapshot } from '../src/engine/world'
import type { TierId } from '../src/engine/season/types'

// =================================================================================================
// THE TWO-TYPE FEED (W2-LADDER §4, owner ruling 4) — and the stacked-week pick that predates it.
//
// ⚠ RE-AIMED, NOT WEAKENED, FROM R15-9's SLIDING WINDOW. The latch window hid three rungs by hand
// (local/regional behind the itf latch, j30 behind the wta one) and exempted National; the owner's
// 02.08 ruling replaced the hand-kept list with a RULE — «чтобы не больше 2х типов турниров в год
// было» — and the rule subsumes every case the old guard pinned: a latched track's lower rungs sit
// below the working pair by construction, so everything R15-9 hid stays hidden, plus everything
// the two-type budget hides beyond it. What this file pins now:
//   1. THE PAIR: derived from the ENGINE's tierOpen oracle (task #77 — never a band or latch read
//      in the UI), working = highest open rung, adjacent = next not-age-dead rung above.
//   2. THE SUBSTITUTION: a pro-capped week offers the strongest open below-pair event IN PLACE of
//      the W row, never as a third type.
//   3. ENTERED ALWAYS SHOWS (R10-3) — a committed week must stay actionable.
//
// ⚠ THE NATIONAL EXEMPTION IS SUPERSEDED, and this note is its tombstone rather than a deletion:
// R15-9 kept National visible for the brand deal's keep-condition (domestic top 30). Ruling 4 is
// later and stricter — at most two types, and «Если national доступен - показывать только их» is
// about the domestic FAMILY, not a standing exemption. The cost (a W-era career sees Nationals
// only as capped-week substitutes, so the national kit deal's keep-condition becomes hard to hold)
// is recorded in feedContext's header and the wave report, for the owner.
// =================================================================================================

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
const codeOf = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** A feed row. `eligible` defaults true; `capped` marks the pro-cap refusal shape. */
function row(tier: TierId, week: number, over: Partial<FeedEventFacts> = {}): FeedEventFacts {
  return { id: `${week}-${tier}`, week, tier, entered: false, eligible: true, ...over }
}

/** A tierOpen map where exactly `open` are open. */
function openMap(open: TierId[]): Record<TierId, boolean> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, open.includes(t)])) as Record<TierId, boolean>
}

describe('the pair: at most two tier types, from the engine oracle', () => {
  it('slides across the whole career: fresh -> domestic -> junior -> professional', () => {
    const pairAt = (open: TierId[], age: number) =>
      feedContext({ ageYears: age, tierOpen: openMap(open), upcoming: [] }).pair
    // A fresh kid: local open, regional the door she is walking towards.
    expect(pairAt(['local'], 14)).toEqual(['local', 'regional'])
    // The overlap climbs: highest open is the working rung, next above is the pair's other half.
    expect(pairAt(['local', 'regional'], 14)).toEqual(['regional', 'national'])
    expect(pairAt(['regional', 'national'], 14)).toEqual(['national', 'j30'])
    // «Если national доступен - показывать только их»: the domestic family collapses to its top
    // open rung by construction - local and regional are below the pair.
    expect(pairAt(['local', 'regional', 'national', 'j30'], 15)).toEqual(['j30', 'j60'])
    // Deep in the J era: j30 leaves the pair however open it stays (the R15-9 case, subsumed).
    expect(pairAt(['national', 'j30', 'j60', 'j300'], 17)).toEqual(['j300', 'w15'])
    // The professional era: the pair is professional, and the rungs below are gone.
    expect(pairAt(['national', 'j30', 'w15', 'w35'], 17)).toEqual(['w35', 'w50'])
    // The top of the ladder: one type is legal ("at most two").
    expect(pairAt(['national', 'w100', 'wta125'], 22)).toEqual(['wta125'])
  })

  it('the adjacent rung skips doors that have closed for ever, never doors not yet open', () => {
    // At nineteen the J rungs are age-dead: National's neighbour is the professional tour.
    expect(feedContext({ ageYears: 19, tierOpen: openMap(['national']), upcoming: [] }).pair).toEqual([
      'national',
      'w15',
    ])
    // At fifteen W15 is merely EARLY - it shows as the aspirational half, locked ("opens at 16").
    expect(feedContext({ ageYears: 15, tierOpen: openMap(['national', 'j30', 'j60', 'j300']), upcoming: [] }).pair).toEqual([
      'j300',
      'w15',
    ])
  })

  it('no oracle (old fixture, no snapshot yet) hides nothing - the safe direction', () => {
    const ctx = feedContext({ ageYears: 14, tierOpen: undefined, upcoming: [] })
    for (const tier of TIER_LADDER) expect(feedShows(row(tier, 5), ctx), tier).toBe(true)
  })

  it('entered events always show, whatever the pair says (R10-3)', () => {
    const ctx = feedContext({ ageYears: 17, tierOpen: openMap(['w15', 'w35']), upcoming: [] })
    expect(feedShows(row('local', 5, { entered: true }), ctx)).toBe(true)
    expect(feedShows(row('local', 5), ctx)).toBe(false)
  })
})

describe('the AER substitution rides INSIDE the budget', () => {
  const open = openMap(['national', 'j30', 'j60', 'w15', 'w35'])
  it('a week whose pair events are all pro-capped shows the strongest open fallback instead', () => {
    const upcoming = [
      row('w35', 10, { eligible: false, ineligibleReason: 'capped' }),
      row('w50', 10, { eligible: false, ineligibleReason: 'capped' }),
      row('j60', 10),
      row('national', 10),
    ]
    const ctx = feedContext({ ageYears: 16, tierOpen: open, upcoming })
    // The pair here is {w35, w50}; both capped -> the strongest OPEN below-pair event substitutes.
    expect(ctx.pair).toEqual(['w35', 'w50'])
    expect(feedShows(upcoming[2], ctx)).toBe(true) // the j60 rides in
    expect(feedShows(upcoming[3], ctx)).toBe(false) // ...and ONLY the strongest - never a third row
  })

  it('an uncapped pair week substitutes nothing', () => {
    const upcoming = [row('w35', 10), row('j60', 10)]
    const ctx = feedContext({ ageYears: 16, tierOpen: open, upcoming })
    expect(feedShows(upcoming[1], ctx)).toBe(false)
  })

  it('the fallback must itself be open and eligible - a substitute is a week she can PLAY', () => {
    const upcoming = [
      row('w35', 10, { eligible: false, ineligibleReason: 'capped' }),
      row('j300', 10, { eligible: false }), // scheduled, but the gate says no
    ]
    const ctx = feedContext({ ageYears: 16, tierOpen: open, upcoming })
    expect(feedShows(upcoming[1], ctx)).toBe(false)
  })
})

// ⚠ THE GATE'S FINDING, PINNED SO IT CANNOT COME BACK (02.08). Measured on the owner's own career
// at W38 '34 against the pre-wave build: the oracle opens W50/W75/WTA 125 to her (merged #61,
// acceptance percentiles honestly cleared) while those rungs are rare and had NO event in her
// horizon. Reading `working` as "the highest open rung" therefore pointed the pair at an eventless
// top of the ladder with nothing above it, and every rung where she actually plays sat below: the
// pre-wave feed offered W15/J300/W35/J60/W100 over those weeks, the first version of this rule
// offered one already-entered J60 and eight training weeks. The owner's boredom clause governs
// («игрок должен иметь возможность играть... чтобы не скучал»), so the rule has two floors now.
describe('the feed follows the calendar, and blank weeks are allowed', () => {
  const open = openMap(['local', 'regional', 'national', 'j30', 'j60', 'j300', 'w15', 'w35', 'w50', 'w75', 'w100', 'wta125'])

  it('an eventless rung cannot be the working rung - the pair follows the calendar', () => {
    // Her horizon holds J300 and W15 only; W50/W75/WTA125 are open but rare and absent.
    const upcoming = [row('j300', 40), row('w15', 39)]
    const ctx = feedContext({ ageYears: 17, tierOpen: open, upcoming })
    expect(ctx.pair[0]).toBe('w15')
    expect(feedShows(upcoming[1], ctx)).toBe(true)
  })

  it('⚠ REVERSED (03.08): a merely empty week borrows NOTHING - only a cap-refused one does', () => {
    // TWO RULINGS, OPPOSITE DIRECTIONS, THE LATER ONE WINS. The borrow was written the same morning
    // to stop an empty feed; that afternoon the owner ruled blank weeks NORMAL («пустые недели это
    // нормально, она же не может постоянно играть») and asked for the supply counter instead. Then
    // his W230 career showed what the borrow actually produced: at eighteen, WTA #27, four of six
    // cards in the horizon were a borrowed J30, a J60 and two W15s - «очень много мусора». A world
    // #27 is not offered a $15k. The AER substitution (ruling 2, the tour's age rule refused her)
    // is untouched and is pinned by the suite above; this pins that nothing ELSE borrows.
    const upcoming = [row('w15', 39), row('j300', 40), row('national', 40)]
    const ctx = feedContext({ ageYears: 17, tierOpen: open, upcoming })
    // Pair {w15, w35}: week 40 has neither, and stays blank rather than dredging the rungs below.
    expect(feedShows(upcoming[1], ctx)).toBe(false)
    expect(feedShows(upcoming[2], ctx)).toBe(false)
  })

  it('a week she is already entered in borrows nothing - she has her tennis', () => {
    // (Belt and braces now that only a cap refusal borrows at all: an entered week is skipped
    // before the refusal test, so a committed card can never drag a second row in beside it.)
    const upcoming = [row('w15', 39), row('j60', 43, { entered: true }), row('national', 43)]
    const ctx = feedContext({ ageYears: 17, tierOpen: open, upcoming })
    expect(feedShows(upcoming[1], ctx)).toBe(true) // the committed card, always (R10-3)
    expect(feedShows(upcoming[2], ctx)).toBe(false) // no second row beside it
  })

  it('with no tennis at all in the horizon the pair still resolves (off-season, layoff)', () => {
    const ctx = feedContext({ ageYears: 17, tierOpen: open, upcoming: [] })
    expect(ctx.pair).toEqual(['wta125'])
  })
})

describe('visibility is not access: the engine never reads the feed rule', () => {
  it('the engine sources are free of the feed vocabulary', () => {
    for (const rel of ['../src/engine/world.ts', '../src/engine/season/calendar.ts']) {
      const src = codeOf(read(rel))
      expect(src).not.toContain('feedShows')
      expect(src).not.toContain('feedContext')
    }
  })

  it('both consumers pick through the ONE rule', () => {
    // The Season rows and the Calendar look-ahead read the same two functions, which is what makes
    // "the two lists cannot disagree" a property rather than a hope. The last-write-wins map is
    // gone from the season screen for good.
    const season = codeOf(read('../src/components/screens/SeasonScreen.vue'))
    expect(season).toContain('feedShows(e, feed.value)')
    expect(season).toContain('preferredWeekEvent(')
    expect(season).not.toContain('for (const e of visibleUpcoming.value) byWeek.set(e.week, e)')
    const days = codeOf(read('../src/composables/weekDays.ts'))
    expect(days).toContain('preferredWeekEvent(')
    expect(days).toContain('feedShows(e, feed)')
  })
})

describe('the stacked-week pick', () => {
  type E = { tier: TierId; entered: boolean; id: string }
  const ev = (tier: TierId, entered = false): E => ({ tier, entered, id: `${tier}${entered ? '+' : ''}` })

  it('prefers the highest tier, whatever order the list arrives in', () => {
    // The regression this pins: strongest-first input used to come out WEAKEST (last write won).
    expect(preferredWeekEvent([ev('j300'), ev('j30'), ev('local')])!.tier).toBe('j300')
    expect(preferredWeekEvent([ev('local'), ev('j30'), ev('j300')])!.tier).toBe('j300')
    expect(preferredWeekEvent([ev('w15'), ev('j300')])!.tier).toBe('w15')
    expect(preferredWeekEvent([ev('w100'), ev('wta125')])!.tier).toBe('wta125')
  })

  it('an ENTERED event beats any tier – a committed week is the card she must act on', () => {
    expect(preferredWeekEvent([ev('j300'), ev('local', true)])!.id).toBe('local+')
    expect(preferredWeekEvent([ev('local', true), ev('j300')])!.id).toBe('local+')
  })

  it('is total: an empty week picks nothing', () => {
    expect(preferredWeekEvent([])).toBeNull()
  })
})

describe('the oracle reaches the UI on the snapshot, as a copy', () => {
  it('toSnapshot surfaces tierOpen and onRampCleared read-only', () => {
    const world = createWorld('tier-window-snap')
    const snap = toSnapshot(world)
    expect(snap.onRampCleared).toEqual({ itf: false, wta: false })
    // A copy, never a live view: the snapshot crosses the worker boundary.
    expect(snap.onRampCleared).not.toBe(world.onRampCleared)
    // ...and the feed's own input is the per-rung verdict map, total over the ladder.
    for (const tier of TIER_LADDER) expect(typeof snap.tierOpen[tier], tier).toBe('boolean')
    // A fresh kid's pair: local working, regional adjacent - derived here as the screens derive it.
    const ctx = feedContext({ ageYears: snap.ageYears, tierOpen: snap.tierOpen, upcoming: snap.upcoming })
    expect(ctx.pair[0]).toBe('local')
  })
})
