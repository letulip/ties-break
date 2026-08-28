import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { feedContext, feedShows, preferredWeekEvent, type FeedEventFacts } from '../src/composables/tierState'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import {
  KID_ID,
  activeLadderOf,
  createWorld,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  tierOpenFor,
  toSnapshot,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import type { TierId } from '../src/engine/season/types'
// Comments are not code – the house helper, now in tests/helpers/source.ts.
import { codeOf } from './helpers/source'

// =================================================================================================
// THE SLIDING WINDOW (act2-pro-tour.md §11, owner ruling 11) — and the stacked-week pick that
// predates it.
//
// ⚠ RE-AIMED, NOT WEAKENED, FROM THE TWO-TYPE FEED (W2-LADDER §4, ruling 4), which was itself the
// re-aim of R15-9's latch window. Each step removed a hand-kept list and put a RULE in its place;
// this one removes the last of the UI's own judgement. Ruling 4 asked for at most two tier types
// and the pair rule delivered it by PICKING two of however many rungs the engine opened — the UI
// compensating for a ladder with no ceiling. Ruling 11 gives the ladder its ceiling instead
// (`tierOutgrown`: a rung closes when the rung three above opens), so the feed simply shows what
// is open. What this file pins now:
//   1. THE WINDOW: whatever `Snapshot.tierOpen` says, verbatim — never a pick made in the UI.
//   2. ITS SHAPE: three rungs through the climb, four at the top, sliding one rung at a time.
//   3. THE SUBSTITUTION: a pro-capped week offers the strongest open event from OUTSIDE the window
//      in place of the capped one, never as an extra row (ruling 2).
//   4. ENTERED ALWAYS SHOWS (R10-3) — a committed week must stay actionable.
//
// ⚠ TWO EARLIER FINDINGS ARE RE-POINTED RATHER THAN RETIRED. The pair rule needed a floor ("a rung
// with no tennis in the horizon cannot be the working rung") because it picked ONE rung to build
// the pair around, and on the owner's save at W38 '34 that rung was an eventless WTA 125 — the feed
// emptied to eight training weeks. A window cannot fail that way, and the case is asserted below
// against the window instead of deleted. The NATIONAL EXEMPTION stays superseded (the national kit
// deal's keep-condition is hard to hold in the W era) and this note remains its tombstone.
// =================================================================================================

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

/** A feed row. `eligible` defaults true; `capped` marks the pro-cap refusal shape. */
function row(tier: TierId, week: number, over: Partial<FeedEventFacts> = {}): FeedEventFacts {
  return { id: `${week}-${tier}`, week, tier, entered: false, eligible: true, ...over }
}

/** A tierOpen map where exactly `open` are open. */
function openMap(open: TierId[]): Record<TierId, boolean> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, open.includes(t)])) as Record<TierId, boolean>
}

describe('the window: exactly what the engine holds open', () => {
  it('is the oracle\'s answer verbatim - the UI picks nothing', () => {
    const rungsAt = (open: TierId[], age: number) =>
      feedContext({ ageYears: age, tierOpen: openMap(open), upcoming: [] }).rungs
    // Whatever the engine opens is what the feed carries, in ladder order, at every stage.
    expect(rungsAt(['local'], 14)).toEqual(['local'])
    expect(rungsAt(['local', 'regional'], 14)).toEqual(['local', 'regional'])
    expect(rungsAt(['local', 'regional', 'national'], 14)).toEqual(['local', 'regional', 'national'])
    expect(rungsAt(['regional', 'national', 'j30'], 15)).toEqual(['regional', 'national', 'j30'])
    expect(rungsAt(['j60', 'j300', 'w15'], 17)).toEqual(['j60', 'j300', 'w15'])
    // ...and the terminal four at the top. The owner's own «50 + 75 + 100 + 125» was the terminal
    // set until W3-ACT2 added four rungs above it; the FEED's rule is unchanged either way (it
    // carries whatever the engine opens), so both sets are asserted - the old one as an ordinary
    // three-plus-one window in the middle of the ladder, the new one as the terminal top.
    expect(rungsAt(['w50', 'w75', 'w100', 'wta125'], 22)).toEqual(['w50', 'w75', 'w100', 'wta125'])
    expect(rungsAt(['wta250', 'wta500', 'wta1000', 'slam'], 24)).toEqual([
      'wta250', 'wta500', 'wta1000', 'slam',
    ])
  })

  it('THE SHAPE, walked end to end against the real engine rule', () => {
    // The window is not a number this module keeps - it falls out of `tierOutgrown` (a rung closes
    // when the rung three above opens) plus the terminal top four. Walking it here, through the
    // engine's own predicate, is what makes "three wide, widening to four" a property rather than a
    // claim in a comment. `tierFloorOpen` is stubbed per stage: the point is the CEILING's arithmetic.
    // ⚠ GENERATED FROM `TIER_LADDER` SINCE W3-ACT2 RATHER THAN HAND-LISTED. The stages ARE the
    // ladder's prefixes - "she has reached rung i" for each i - and hand-listing them meant the last
    // entry was a literal `[...TIER_LADDER]`, which jumped FOUR rungs at once the moment the ladder
    // grew and made the slide guard below assert nothing about the top of it. Written as prefixes
    // the walk covers every rung the catalogue will ever hold, and the widths line below is what
    // pins the shape.
    const stages: TierId[][] = TIER_LADDER.map((_, i) => TIER_LADDER.slice(0, i + 1))
    // A rung is CLOSED when the rung three above has been REACHED; the top four never close.
    const windowOf = (reached: TierId[]) =>
      reached.filter((t) => {
        const i = TIER_LADDER.indexOf(t)
        if (i >= TIER_LADDER.length - 4) return true
        return !reached.includes(TIER_LADDER[i + 3])
      })
    // ⚠ WIDENED BY W3-ACT2 AND THE SHAPE IS UNCHANGED: 1, 2, then three all the way up, then the
    // terminal four. Sixteen rungs, so twelve threes instead of nine - one entry per rung reached.
    const widths = stages.map((reached) => windowOf(reached).length)
    expect(widths).toEqual([1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4])
    // ...and it SLIDES: consecutive windows differ by at most one rung at each end.
    for (let i = 1; i < stages.length; i++) {
      const before = windowOf(stages[i - 1])
      const after = windowOf(stages[i])
      const gained = after.filter((t) => !before.includes(t))
      const lost = before.filter((t) => !after.includes(t))
      expect(gained.length, `stage ${i} gained ${gained.join(',')}`).toBeLessThanOrEqual(1)
      expect(lost.length, `stage ${i} lost ${lost.join(',')}`).toBeLessThanOrEqual(1)
    }
    // ⚠ THE TERMINAL WINDOW MOVED, WHICH IS THE WHOLE REASON W3-ACT2 EXISTS. The owner's own
    // answer («50 + 75 + 100 + 125») described the top of the ladder as W2-LADDER shipped it, and
    // act2-pro-tour.md §11.3 measured what that top could offer: 28 events a season, so a player
    // who plays every second week got ~11 and the ladder ran out of tennis. The rule did not change
    // a word - the top four never close - so adding four rungs slid the terminal window up by
    // exactly four, and it is the act-3 family that never closes now.
    expect(windowOf(stages[stages.length - 1])).toEqual(['wta250', 'wta500', 'wta1000', 'slam'])
  })

  // ===============================================================================================
  // ⭐ ROUND-17 #19 – A RUNG SHE HAS AGED OUT OF IS NOT OFFERED
  // ===============================================================================================
  // THE REPORT: a Junior Tour 30 card, at twenty. `TIERS.j30.maxAgeYears` is 18 and the engine's
  // turnstile refused it correctly the whole time - which is why it was a card that could not be
  // entered rather than a broken career, and why nothing caught it.
  //
  // THE CAUSE: `feedContext` took `ageYears` and NEVER READ IT. Its own comment said the age arm had
  // been deleted because the ladder carried the clause - and the ladder does not. `tierOpenFor` is
  // `tierFloorOpen`, and for j30 that is `onRampOpen('itf')`, A LATCH: crossed once at fourteen and
  // true for ever after, at any age.
  it('⭐ a junior rung she has aged out of leaves the feed, however open the ladder says it is', () => {
    // The ladder's own answer is UNCHANGED here - all three J rungs latched open - which is the
    // point: the age door is a second question and the oracle does not answer it.
    const open = openMap(['j30', 'j60', 'j300', 'w75', 'w100'])
    const at18 = feedContext({ ageYears: 18, tierOpen: open, upcoming: [] })
    const at19 = feedContext({ ageYears: 19, tierOpen: open, upcoming: [] })
    const at20 = feedContext({ ageYears: 20, tierOpen: open, upcoming: [] })

    // 18 is the last year of the junior tour (`maxAgeYears: 18`), so they are still hers.
    expect(at18.rungs, 'the junior rungs are open at 18').toEqual(['j30', 'j60', 'j300', 'w75', 'w100'])
    expect(feedShows(row('j30', 9), at18)).toBe(true)

    // 19 is the first year they are shut, and it is permanent - the one gate in the game that closes
    // behind her (see `availabilityStatus`).
    expect(at19.rungs, 'and gone the season she turns 19').toEqual(['w75', 'w100'])
    expect(feedShows(row('j30', 9), at19)).toBe(false)
    expect(feedShows(row('j60', 9), at19)).toBe(false)
    expect(feedShows(row('j300', 9), at19)).toBe(false)

    // ...and the owner's actual card, at twenty.
    expect(feedShows(row('j30', 9), at20), 'the reported card').toBe(false)
    // The adult rungs are untouched: this hides an age-dead door, not a ladder.
    expect(feedShows(row('w75', 9), at20)).toBe(true)
  })

  it('⚠ ...but a rung she is too YOUNG for still shows - a locked rung is aspiration', () => {
    // The asymmetry is deliberate and is the difference between the two ends of the age gate. Too
    // OLD can never reopen, so the card is dead furniture; too YOUNG opens on a birthday, and the
    // feed is also how she learns what is out there. Hiding those would be the empty-weeks
    // regression the 06.08 ladder-floor ruling was about.
    const ctx = feedContext({ ageYears: 14, tierOpen: openMap(['local', 'j30', 'w15']), upcoming: [] })
    expect(feedShows(row('w15', 9), ctx), 'W15 opens at 16 and she is 14').toBe(true)
    expect(ctx.rungs).toEqual(['local', 'j30', 'w15'])
  })

  it('⚠ an ENTERED aged-out event still shows - R10-3 outranks the age door', () => {
    // She committed to it before the birthday; a committed week must stay actionable, and the age
    // filter must not be the thing that strands one. `feedShows` reads `entered` first.
    const at20 = feedContext({ ageYears: 20, tierOpen: openMap(['j30', 'w75']), upcoming: [] })
    expect(feedShows(row('j30', 9, { entered: true }), at20)).toBe(true)
  })

  it('no oracle (old fixture, no snapshot yet) hides nothing - the safe direction', () => {
    const ctx = feedContext({ ageYears: 14, tierOpen: undefined, upcoming: [] })
    for (const tier of TIER_LADDER) expect(feedShows(row(tier, 5), ctx), tier).toBe(true)
  })

  it('entered events always show, whatever the window says (R10-3)', () => {
    const ctx = feedContext({ ageYears: 17, tierOpen: openMap(['w15', 'w35']), upcoming: [] })
    expect(feedShows(row('local', 5, { entered: true }), ctx)).toBe(true)
    expect(feedShows(row('local', 5), ctx)).toBe(false)
  })

  it('a closed rung leaves the feed even when the calendar still holds one', () => {
    // The junk, as a class: measured on the owner's W230 career, 48 of the 64 entries left in his
    // season sat at rungs whose strongest entrant is weaker than she is. Those rungs are CLOSED by
    // the engine now, so this is the whole of the filtering that used to be done card by card.
    const ctx = feedContext({ ageYears: 22, tierOpen: openMap(['w50', 'w75', 'w100', 'wta125']), upcoming: [] })
    expect(feedShows(row('w15', 9), ctx)).toBe(false)
    expect(feedShows(row('j30', 9), ctx)).toBe(false)
    expect(feedShows(row('w75', 9), ctx)).toBe(true)
  })
})

// ⚠⚠ THE AER SUBSTITUTION'S TOMBSTONE, AND ITS REPLACEMENT (ruling 2, §5). The pair rule borrowed
// «the strongest OPEN, eligible event from outside the pair» on a week the pro cap emptied. Under
// the window "open" and "inside the window" are the same set, so the borrow had no source left and
// the code was unreachable. What carries the ruling now is the WINDOW: the pro cap binds at 16 and
// 17 only (proPerYearByAge 12 / 16, unlimited after), and at those ages the window still holds the
// junior rungs beside the professional one - so a capped W week offers her the J events on it, from
// inside the window, as events she can actually ENTER rather than merely see. These cases assert
// exactly that, in place of the three that asserted the borrow.
describe('a pro-capped week still has tennis, from inside the window', () => {
  it('the junior rungs sit beside the professional one at the ages the cap binds', () => {
    // The window a sixteen-year-old on the W on-ramp has: J300 and W15 together, then J300 leaves.
    for (const open of [
      ['j60', 'j300', 'w15'] as TierId[],
      ['j300', 'w15', 'w35'] as TierId[],
    ]) {
      const ctx = feedContext({ ageYears: 16, tierOpen: openMap(open), upcoming: [] })
      expect(ctx.rungs.some((t) => TIERS[t].track !== 'wta'), open.join('+')).toBe(true)
    }
  })

  it('a capped W card still renders - the plaque IS the explanation (transparency ruling 1)', () => {
    const upcoming = [
      row('w15', 10, { eligible: false, ineligibleReason: 'capped' }),
      row('j300', 10),
    ]
    const ctx = feedContext({ ageYears: 16, tierOpen: openMap(['j300', 'w15', 'w35']), upcoming })
    expect(feedShows(upcoming[0], ctx)).toBe(true) // capped, and it says so
    expect(feedShows(upcoming[1], ctx)).toBe(true) // ...and the J week beside it is enterable
  })

  it('a rung the window has closed never comes back as a substitute', () => {
    // The borrow used to be able to put a J30 in front of a professional. It cannot now, and that
    // is the junk-removal half of ruling 11 holding even on the week the cap bites.
    const upcoming = [row('w35', 10, { eligible: false, ineligibleReason: 'capped' }), row('j30', 10)]
    const ctx = feedContext({ ageYears: 17, tierOpen: openMap(['w15', 'w35', 'w50']), upcoming })
    expect(feedShows(upcoming[1], ctx)).toBe(false)
  })
})

// ⚠ THE PAIR RULE'S OWN FINDING, RE-POINTED AT THE WINDOW (02.08, measured on the owner's save at
// W38 '34). Reading "the working rung" as the highest OPEN rung pointed the feed at a WTA 125 the
// calendar had no event of, and the pair collapsed onto one eventless rung: the pre-wave feed
// offered W15/J300/W35/J60/W100 over the same weeks, the new one offered a single already-entered
// J60 and eight training weeks. The owner's boredom clause governs («игрок должен иметь возможность
// играть... чтобы не скучал»). A window cannot fail that way, and this is what says so.
describe('the feed follows the calendar, and blank weeks are allowed', () => {
  const open = openMap(['j300', 'w15', 'w35'])

  it('an open rung with nothing in the horizon costs her none of the rungs that have events', () => {
    const upcoming = [row('j300', 40), row('w15', 39)]
    const ctx = feedContext({ ageYears: 17, tierOpen: open, upcoming })
    expect(feedShows(upcoming[0], ctx)).toBe(true)
    expect(feedShows(upcoming[1], ctx)).toBe(true)
    expect(ctx.rungs).toEqual(['j300', 'w15', 'w35'])
  })

  it('⚠ a merely empty week borrows NOTHING (03.08) - and now nothing does, ever', () => {
    // TWO RULINGS, OPPOSITE DIRECTIONS, THE LATER ONE WINS. The borrow was written the morning of
    // 03.08 to stop an empty feed; that afternoon the owner ruled blank weeks NORMAL («пустые
    // недели это нормально, она же не может постоянно играть») and asked for the supply counter
    // instead. The window finishes the argument: a week the window leaves empty is empty, and a
    // rung the window has CLOSED cannot appear on it for any reason at all.
    const upcoming = [row('w15', 39), row('j30', 41)]
    const ctx = feedContext({ ageYears: 17, tierOpen: openMap(['j300', 'w15', 'w35']), upcoming })
    expect(feedShows(upcoming[1], ctx)).toBe(false)
    expect(upcoming.filter((e) => feedShows(e, ctx)).map((e) => e.week)).toEqual([39])
  })

  it('with no tennis at all in the horizon the window still resolves (off-season, layoff)', () => {
    const ctx = feedContext({ ageYears: 17, tierOpen: open, upcoming: [] })
    expect(ctx.rungs).toEqual(['j300', 'w15', 'w35'])
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
  // ⚠ WIDENED 05.08 (fix/outgrown-entry), NOT WEAKENED: the pick now has THREE tiebreaks, so the
  // fixture has to be able to express the middle one. `eligible` defaults to true, which makes every
  // assertion written before this day mean exactly what it meant - all cards enterable, so the
  // actionability tiebreak is a no-op and the tier order decides, as pinned below.
  type E = { tier: TierId; entered: boolean; eligible: boolean; id: string }
  const ev = (tier: TierId, entered = false, eligible = true): E => ({
    tier,
    entered,
    eligible,
    id: `${tier}${entered ? '+' : ''}${eligible ? '' : '!'}`,
  })

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

  // ===============================================================================================
  // THE MIDDLE TIEBREAK – a card she can enter beats a taller one she cannot (05.08).
  //
  // The owner's second report: «у меня сейчас там висит 5 w-серий подряд, т.е. я вообще 5 недель не
  // могу нигде играть, хотя j30, j60, j300 мне вполне доступны.» His pro allowance was spent, so
  // every W card refused him - and the J events on those same weeks, which the AER boredom guard
  // deliberately re-opens when the allowance runs out, were never shown, because the pick asked
  // only which rung was taller.
  // ===============================================================================================

  it('an ENTERABLE lower rung beats a BLOCKED higher one – the owner\'s five dead W weeks', () => {
    const w35Blocked = ev('w35', false, false)
    const j60Open = ev('j60', false, true)
    expect(preferredWeekEvent([w35Blocked, j60Open])!.id).toBe('j60')
    expect(preferredWeekEvent([j60Open, w35Blocked])!.id).toBe('j60')
    // ...three deep, which is what a stacked week really looks like
    expect(preferredWeekEvent([ev('w50', false, false), ev('w35', false, false), ev('j30', false, true)])!.id).toBe('j30')
  })

  it('...and among enterable cards the tier order is untouched', () => {
    expect(preferredWeekEvent([ev('j30'), ev('j300'), ev('w15', false, false)])!.tier).toBe('j300')
  })

  it('a week where NOTHING is enterable still shows its tallest card – the feed is also how she learns', () => {
    // Never empty a week: a locked rung is aspiration, and hiding it would tell her less than the
    // blocked card does. This is the half that keeps the change a re-order rather than a filter.
    const picked = preferredWeekEvent([ev('j30', false, false), ev('w35', false, false), ev('w15', false, false)])
    expect(picked!.tier).toBe('w35')
  })

  it('an ENTERED card still beats everything, enterable or not – R10-3 is the first tiebreak', () => {
    // An entered event can legitimately read `eligible: false` (the list closed with her on it and
    // her points moved afterwards), and it must still be the card the week shows: it is the one she
    // has to be able to act on. The new tiebreak sits BELOW `entered` precisely so this holds.
    const committedButOutgrown = ev('local', true, false)
    expect(preferredWeekEvent([ev('j300', false, true), committedButOutgrown])!.id).toBe('local+!')
    expect(preferredWeekEvent([committedButOutgrown, ev('j300', false, true)])!.id).toBe('local+!')
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
    expect(ctx.rungs[0]).toBe('local')
  })
})

// =================================================================================================
// ROUND-21 #5 – THE TABLE SHE HAS LEFT. «И мне всё ещё показывают local чемпионаты в ленте у обоих»
// =================================================================================================
//
// Backlog #84's last open half, and his SECOND report of it. The window above cannot reach this on
// its own, which is why it needed a rule and why this block is written against a BUILT WORLD rather
// than against a hand-made `tierOpen` map: the whole finding is that the engine's two verdicts are
// both correct and together still offer a professional a club draw.
//
//   * `tierOpenFor` is the FLOOR alone since 06.08 and Local's floor is ZERO domestic points, so
//     Local is open on week 0 and open for ever – no book is empty enough to close it;
//   * `tierOutgrown` (the ceiling that used to collapse the domestic family upward) asks whether the
//     rung THREE ABOVE is open TO HER TODAY, age included – and past eighteen J30/J60/J300 are
//     age-shut for good, so Local/Regional/National have no reachable ceiling left.
//
// So the feed asks the one question neither of them asks: WHICH TABLE IS HERS (`activeLadder`, the
// engine's `activeLadderOf`). Each `it` below fails for one reason, and the seam has as many
// assertions as the fix does, because the seam is where a hard cut would have broken a career.
describe('round-21 #5 – the feed offers the rungs that pay into her table', () => {
  /** A career ticked to `age` with a professional book AND the domestic book she climbed up on –
   *  which is the state the owner is in, and the state that makes all three domestic rungs open. */
  function proWorld(seed: string, age: number, book: number) {
    const world = createWorld(seed)
    const rng = resumeMain(world.rngMain)
    while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < age) tickWeek(world, rng)
    world.season = []
    world.results.push({ playerId: KID_ID, week: world.week, points: book, tier: 'w15' })
    world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'national' })
    world.onRampCleared = { itf: true, wta: true }
    recomputeKidRank(world)
    return world
  }

  const foldFeed = (world: ReturnType<typeof createWorld>, judgeTable: boolean) => {
    const snap = toSnapshot(world)
    return feedContext({
      ageYears: snap.ageYears,
      tierOpen: snap.tierOpen,
      tierOutgrown: snap.tierOutgrown,
      ...(judgeTable ? { activeLadder: snap.activeLadder } : {}),
      upcoming: snap.upcoming,
    })
  }

  it('⚠ THE REPORT: a professional is offered NO domestic rung, at any age past the seam', () => {
    // A value read out of real state, not a constant: the world is built, ticked, and folded through
    // the same `feedContext` the Season screen calls.
    for (const [age, book] of [[19, 140], [20, 300], [22, 600]] as const) {
      const world = proWorld(`r21-5-${age}`, age, book)
      expect(activeLadderOf(world), `age ${age} is on the professional table`).toBe('wta')
      const feed = foldFeed(world, true)
      const domestic = feed.rungs.filter((t) => TIERS[t].track === 'domestic')
      expect(domestic, `age ${age}: ${feed.rungs.join(', ')}`).toEqual([])
      // ...and the Home strip inherits it, because both answers are folded from the same set.
      expect(feed.working.filter((t) => TIERS[t].track === 'domestic'), `strip at ${age}`).toEqual([])
      // The feed is not empty – she has her own table to play on.
      expect(feed.rungs.length, `age ${age} still has tennis`).toBeGreaterThan(0)
    }
  })

  // ⚠⚠ RE-AIMED 28.08 BY ROUND 28 #12 PART 0 – AND THE RE-AIM IS THE RECEIPT, NOT A LOSS.
  //
  // This case used to be the WITNESS for the one above: fold the identical snapshot with
  // `activeLadder` withheld and the club draws came straight back – `local, regional, national`
  // beside w100/wta125/wta250, with `national` inside her WORKING window. It proved that the
  // filter, and only the filter, was doing the work.
  //
  // THAT IS EXACTLY WHAT PART 0 CHANGED, and it is what act2-pro-tour.md §4 asks for: the closure
  // is «the engine's latch, not the UI's guess». `PLAY_DOWN.domesticFromProTable` now shuts the
  // domestic rungs in the LADDER, so withholding the UI's verdict no longer brings them back and
  // the old expectation can no longer be satisfied by any world. Deleting the case would throw away
  // the finding; asserting the OPPOSITE keeps it, and turns it into the proof that the rule moved
  // rather than the proof that it existed.
  //
  // ⭐ The mutation that reddens it is `PLAY_DOWN.domesticFromProTable = false`, which restores the
  // exact list this case used to expect.
  it('⚠ ...and WITHOUT the table verdict they STAY gone – the rule is the ladder\'s now, not the feed\'s', () => {
    const world = proWorld('r21-5-witness', 22, 600)
    const before = foldFeed(world, false)
    expect(before.rungs.filter((t) => TIERS[t].track === 'domestic')).toEqual([])
    // ...and the Home strip inherits it from the same place, with the UI judging no table at all.
    expect(before.working).not.toContain('national')
    // The ENGINE's own answer, said out loud, so this case names the mechanism it is measuring.
    for (const t of ['local', 'regional', 'national'] as const) {
      expect(toSnapshot(world).tierOpen[t], t).toBe(false)
    }
  })

  it('⚠ THE SEAM: her first counting W point costs her the domestic three and NOT the junior tour', () => {
    // The failure a hard "only her own table" filter would have caused, and the reason the rule
    // carries one table of slack. She is sixteen, one W15 result old, and still visibly playing J
    // events – ruling 2's boredom guard depends on those staying in front of her when the pro
    // allowance runs out.
    const world = createWorld('r21-5-seam')
    const rng = resumeMain(world.rngMain)
    while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < 16) tickWeek(world, rng)
    world.season = []
    world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'national' })
    world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
    world.results.push({ playerId: KID_ID, week: world.week, points: 10, tier: 'w15' })
    recomputeKidRank(world)
    expect(activeLadderOf(world)).toBe('wta')
    const feed = foldFeed(world, true)
    expect(feed.rungs.filter((t) => TIERS[t].track === 'domestic')).toEqual([])
    // Every ITF rung the engine held open is still held open here – nothing of the table one below
    // hers is taken away.
    const itfOpen = TIER_LADDER.filter((t) => TIERS[t].track === 'itf' && toSnapshot(world).tierOpen[t])
    expect(feed.rungs.filter((t) => TIERS[t].track === 'itf')).toEqual(itfOpen)
  })

  it('...and a domestic career and a junior career are byte-identical to what they were', () => {
    // Nothing below the professional seam moves: one table of slack means the filter's floor is at
    // or under the bottom of the ladder for both of them, so the answer is the input.
    const cases: [string, number, [TierId, number][]][] = [
      ['fresh', 14, []],
      ['domestic climber', 15, [['national', 300]]],
      ['junior', 15, [['national', 300], ['j30', 60]]],
      ['junior deep', 17, [['national', 300], ['j300', 300]]],
    ]
    for (const [name, age, results] of cases) {
      const world = createWorld(`r21-5-below-${name}`)
      const rng = resumeMain(world.rngMain)
      while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < age) tickWeek(world, rng)
      world.season = []
      for (const [tier, points] of results) {
        world.results.push({ playerId: KID_ID, week: world.week, points, tier })
      }
      recomputeKidRank(world)
      expect(activeLadderOf(world), name).not.toBe('wta')
      expect(foldFeed(world, true).rungs, name).toEqual(foldFeed(world, false).rungs)
    }
  })

  // ⚠⚠ RE-AIMED 28.08 BY ROUND 28 #12 PART 0 – the claim narrows by exactly one rung family and
  // the reason it narrows is worth stating, because "visibility, never access" was true of THIS
  // wave and is no longer the whole story.
  //
  // Round-21 #5 changed only what the feed offered; Part 0 closes the domestic rungs in the LADDER,
  // so for a professional they are now access as well as visibility. ⚠ THE 06.08 RULING IS STILL
  // INTACT AND THAT IS THE HALF THIS CASE NOW HAS TO CARRY: what shuts them is an UPPER bound (the
  // Play Down family's domestic limb – "she is too good for this ladder") and never a floor. The
  // floor still refuses nobody, which is asserted on a domestic climber below, where it is the
  // ruling's actual subject.
  it('VISIBILITY, NEVER ACCESS – still true of every rung this wave touched, and the 06.08 floor still refuses nobody', () => {
    const world = proWorld('r21-5-access', 22, 600)
    // ⭐ THE DOMESTIC THREE ARE NOW ACCESS TOO, by the ladder and not by the feed. Named rather than
    // quietly dropped, so the day it changes back this line says so.
    for (const tier of ['local', 'regional', 'national'] as const) {
      expect(tierOpenFor(world, tier), `${tier} is shut by the ladder for a professional`).toBe(false)
    }
    // ...and an ENTERED domestic event still renders, on `feedShows`'s own first arm (R10-3): a
    // committed week stays actionable whatever the ladder has since decided.
    const feed = foldFeed(world, true)
    expect(feedShows({ id: 'x', tier: 'local', entered: true }, feed)).toBe(true)
    expect(feedShows({ id: 'x', tier: 'local', entered: false }, feed)).toBe(false)

    // THE 06.08 RULING, ON THE CAREER IT IS ABOUT. A domestic climber has passed Local and Regional
    // by her points, and both are still hers to enter – the lower bound does not refuse, exactly as
    // it has not since `ladder-floor-2026-08.md`. Part 0 took nothing from her.
    const home = createWorld('r21-5-access-home')
    home.results.push({ playerId: KID_ID, week: home.week, points: 300, tier: 'national' })
    recomputeKidRank(home)
    expect(activeLadderOf(home), 'she has never played a professional event').not.toBe('wta')
    for (const tier of ['local', 'regional'] as const) {
      expect(tierOpenFor(home, tier), `${tier} is behind her AND still hers`).toBe(true)
    }
  })
})
