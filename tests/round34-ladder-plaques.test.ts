// ⭐⭐ ROUND 34 #6 AND #1 – WHAT A LOCKED RUNG SAYS, AND WHAT THE ROUTE TO THE JUNIOR TOUR IS.
//
// Two owner reports, one file, because they are the same plaque seen from two sides.
//
//   #6  «W35 · 🔒 163 / 0 international pts вот это вот что значит? И на следующих тирах такое же»
//   #1  «в начале 2го сезона все очки в региональном уровне у меня обнулились, мне снова закрылся
//        регионарный и национальный чемпионаты … совершенно непонятно как выйти в j уровень»
//
// =================================================================================================
// #6 – A REQUIREMENT OF ZERO IS NOT A REQUIREMENT
// =================================================================================================
//
// WHAT PRODUCED IT. Since PR-09 / TB-05 the ENGINE's refusal decides whether `tierState` calls a
// rung locked, and an acceptance-list rung is refused on a RANK (`rankToEnter`), never on points.
// The points arm then fell back to the tier's own `enterPointBand[0]`, which is `0` on every
// acceptance rung, and printed her book over a threshold that does not exist – with the tooltip
// going NEGATIVE beside it («locked: -163 more international pts (she has 163 of 0)»).
//
// ⚠ IT IS THE FIFTH OF ITS FAMILY and the notes in `composables/tierState.ts` name the other four.
// The nearest one is the W15 that read «68 / 120 international pts» on a rung the engine held OPEN;
// its fix was `engineOpen === true` short-circuiting the band, and what stayed live was the engine
// holding W15 SHUT on the junior reserved place – `rankToEnter`, no `pointsToEnter` – which this
// file's sweep also covers.
//
// THE GUARD IS THE SHAPE, NOT A LIST OF RUNGS. "A lock that quotes a threshold of zero" is the
// defect; a rung added tomorrow with a `[0, MAX]` band inherits the guard instead of needing a case.
//
// =================================================================================================
// #1 – THE POINTS DO RESET, AND THE ROUTE IS THE PART THAT WAS NEVER SAID
// =================================================================================================
//
// ⚠⚠ MEASURED BEFORE ANYTHING WAS CHANGED (tools/r34-domestic-reset.ts, 25k middle career, seed 0):
//
//     week  season week   national pts   Regional   National   J30
//       51            51            106   open       SHUT       SHUT
//       52             0              0   SHUT       SHUT       SHUT
//      103            51            251   open       open       open
//      104             0              0   SHUT       SHUT       open
//
// BOTH HALVES OF HIS REPORT ARE TRUE, and they have different answers:
//
//   * THE POINTS GENUINELY ZERO. `WINDOW_BY_TRACK.domestic` is `'seasonToDate'` – round 23 #12/#13,
//     his own ruling («да, это мелочь, а будет хорошо ... первый сезон у нас показательный»). It is
//     NOT a rolling window aging out, and it is not a defect.
//   * THE GATES RE-CLOSE WITH IT, because `tierFloorOpen` reads that season-to-date total live. That
//     is the consequence nobody priced when the race was approved, and it is a BALANCE question for
//     the owner rather than an agent's to settle – the engine already has the mechanism (the ITF/WTA
//     on-ramps latch through `onRampCleared`, so a cleared door never re-closes), which is why the
//     asymmetry is worth pinning: the J door she reached at week 77 is still open at week 207, and
//     the Regional she reached at week 25 is shut every January.
//
// ⭐ SO THE FIX SHIPPED HERE IS PRESENTATIONAL, and it is the sentence his last line asks for: the
// threshold names the WINDOW it is counted over, so «250 national pts» becomes «250 national pts in
// one season» and the lock's long form says the table starts again. Derived from `WINDOW_BY_TRACK`,
// never written down – see the note at `tierOpensWhen`.
import { describe, it, expect } from 'vitest'
import { tierState, tierOpensWhen, pointsLockNote, type TierStateInput } from '../src/composables/tierState'
import { TIERS, TIER_LADDER, TIER_SHORT, WEEKS_PER_YEAR, hasAcceptanceList } from '../src/engine/season/calendar'
import { BEST_N_BY_TRACK, WINDOW_BY_TRACK, windowedBestSum } from '../src/engine/season/ranking'
import { createWorld, enterEvent, tickWeek, skipTournament, closeTournament, toSnapshot, inTrack, KID_ID } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const base: TierStateInput = {
  ageYears: 17,
  points: 0,
  upcoming: [],
  horizonWeeks: 8,
  entryCap: { used: 0, limit: 14, remaining: 14 },
  proEntryCap: { used: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER },
}

describe('round 34 #6 – a locked rung can never quote a requirement of zero', () => {
  it('⭐⭐ THE REPRODUCTION, at his own numbers: W35 refused on a rank, with a junior book behind her', () => {
    // His chip, exactly: 163 ITF junior points, W35 shut because the acceptance list takes the top
    // 700 of a professional table she has never scored on. The engine's refusal carries `rankToEnter`
    // and NO `pointsToEnter`, which is the whole of the input that produced «163 / 0».
    const s = tierState('w35', {
      ...base,
      itfPoints: 163,
      itfRank: 41,
      engineOpen: false,
      acceptsRank: 700,
      refusal: {
        reason: 'locked',
        detail: 'World Tour 35 takes the top 700 – she has no professional ranking yet',
        rankToEnter: 700,
      },
    })
    expect(s.kind, 'still locked – nothing about the verdict changed').toBe('locked')
    expect(s.note, 'the chip he photographed').not.toBe('163 / 0 international pts')
    expect(s.note).toBe('Opens in the top 700')
    // ...and the tooltip is the ENGINE's own sentence, which names the table the cut is read off.
    // The old one said «locked: -163 more international pts (she has 163 of 0)».
    expect(s.title).toBe('World Tour 35 takes the top 700 – she has no professional ranking yet')
    expect(s.title).not.toMatch(/-\d+ more/)
  })

  it('⭐ EVERY rung, refused on a rank at every book she could hold – no zero threshold anywhere', () => {
    // The sweep is over the SHAPE: a `locked` refusal carrying `rankToEnter` and no `pointsToEnter`
    // is what the engine emits for an acceptance list, at any rung, and the plaque must never price
    // it in points. Books chosen to straddle every band edge in the game.
    for (const id of TIER_LADDER) {
      for (const book of [0, 64, 120, 163, 251, 604]) {
        const s = tierState(id, {
          ...base,
          ageYears: 17,
          points: book,
          itfPoints: book,
          engineOpen: false,
          acceptsRank: TIERS[id].acceptsRank,
          refusal: { reason: 'locked', detail: `${TIERS[id].label} takes the top 100`, rankToEnter: 100 },
        })
        expect(s.note, `${TIER_SHORT[id]} @ ${book}`).not.toMatch(/\/ 0 /)
        expect(s.title ?? '', `${TIER_SHORT[id]} @ ${book}`).not.toMatch(/of 0\)/)
        expect(s.title ?? '', `${TIER_SHORT[id]} @ ${book}`).not.toMatch(/-\d+ more/)
      }
    }
  })

  it('the on-ramp reserved place is the same defect and the same repair (the W15 the file\'s notes describe)', () => {
    // W15's band IS 120 ITF points, so this rung is the one place the old fallback produced a
    // NON-zero – and still the wrong sentence: the engine is holding it shut on the junior RESERVED
    // PLACE, a position, and the plaque priced it in points and never mentioned the place.
    const s = tierState('w15', {
      ...base,
      ageYears: 15,
      itfPoints: 163,
      itfRank: 41,
      engineOpen: false,
      refusal: {
        reason: 'locked',
        detail: 'World Tour 15 holds junior places for the top 20 – she is #41',
        rankToEnter: 20,
      },
    })
    expect(s.note).toBe('Opens in the top 20')
    expect(s.note).not.toBe('163 / 120 international pts')
    expect(s.title).toContain('junior places')
  })

  it('a POINTS refusal is untouched – the fraction is still the right sentence where there is a threshold', () => {
    // The non-regression half. A domestic rung is refused on points and the engine says so, so the
    // plaque still prints progress against the number. Nothing about this arm moved.
    const s = tierState('national', {
      ...base,
      points: 112,
      engineOpen: false,
      refusal: { reason: 'locked', detail: 'Not enough national pts for National Series yet (need 150)', pointsToEnter: 150 },
    })
    expect(s.kind).toBe('locked')
    expect(s.note).toBe(pointsLockNote('national', 150, 112))
    expect(s.note).toBe('112 / 150 national pts')
    expect(s.title).toContain('38 more national pts')
  })

  it('and a lock with NO distance at all is still «Outgrown», not a zero (round 28 #12\'s arm)', () => {
    // The play-down refusal carries neither number, and its arm sits above the one this round moved.
    // Asserted here so the ordering cannot be re-shuffled into printing «0 / 0» again.
    const s = tierState('w15', {
      ...base,
      itfPoints: 604,
      engineOpen: false,
      refusal: { reason: 'locked', detail: "World Tour 15 is closed to the world's top 150 – she is #111." },
    })
    expect(s.kind).toBe('outgrown')
    expect(s.note).toBe('Outgrown')
  })
})

describe('round 34 #1 – the route to the Junior Tour names the window it is counted over', () => {
  it('⭐⭐ J30\'s condition says the 250 is a SEASON race, because the domestic table is one', () => {
    // His «совершенно непонятно как выйти в j уровень». The route to the J tour is J30's floor, and
    // the number alone was only half the condition: the domestic total starts again every January,
    // so 106 at week 51 is not 106 of the way to 250.
    const said = tierOpensWhen('j30')
    expect(said).toContain(`${TIERS.j30.enterPointBand[0]} national pts`)
    expect(said, 'the half that was missing').toContain('in one season')
  })

  it('⚠ it is DERIVED from `WINDOW_BY_TRACK`, so a re-ruling re-words the sentence', () => {
    // The constant is a plain object precisely so `tools/domestic-season-to-date.ts` can patch it for
    // an A/B arm, and a hardcoded clause would go on lying through such a run. Mutating it here is
    // the cheapest proof that the sentence reads the gate rather than restating it.
    const kept = WINDOW_BY_TRACK.domestic
    try {
      WINDOW_BY_TRACK.domestic = 'rolling52'
      expect(tierOpensWhen('j30')).not.toContain('in one season')
      expect(tierOpensWhen('j30')).toContain('250 national pts')
    } finally {
      WINDOW_BY_TRACK.domestic = kept
    }
    expect(tierOpensWhen('j30')).toContain('in one season')
  })

  it('the ITF-denominated threshold is NOT touched – that table genuinely rolls 52 weeks', () => {
    // W15's band is ITF junior points, and `WINDOW_BY_TRACK.itf` is `'rolling52'`: those points do
    // carry across a season boundary, so the clause must not appear there.
    expect(WINDOW_BY_TRACK.itf).toBe('rolling52')
    expect(tierOpensWhen('w15')).toContain('120 international pts')
    expect(tierOpensWhen('w15')).not.toContain('in one season')
  })

  it('and the lock\'s long form says the table starts again', () => {
    const s = tierState('j30', {
      ...base,
      ageYears: 14,
      points: 106,
      engineOpen: false,
      refusal: { reason: 'locked', detail: 'x', pointsToEnter: 250 },
    })
    expect(s.note).toBe('106 / 250 national pts')
    expect(s.title).toContain('starts again each season')
  })

  it('⚠ the acceptance rungs say nothing of the kind – their gate is a position, not a total', () => {
    for (const id of TIER_LADDER) {
      if (!hasAcceptanceList(id)) continue
      expect(tierOpensWhen(id, 100), id).not.toContain('in one season')
    }
  })
})

// =================================================================================================
// ⚠⚠ THE MEASUREMENT ITSELF, PINNED – what the engine actually does across a season boundary.
// =================================================================================================
//
// This is the arm that would go red if the domestic table stopped being a season race, or if the
// domestic floors ever started latching. Both are decisions for the owner; what this file refuses to
// let happen is either of them changing SILENTLY, because the sentences above are derived from the
// first and the report in docs/rounds/round-34.md #1 is derived from the second.

/** Two seasons of a real career, entering whatever the ladder opens – the walk the probe makes.
 *  ⚠ THE WORLD COMES BACK AT THE BOUNDARY (week 52), not at the end: the fold comparison below has
 *  to be made at the week the two window rules disagree, and a world walked on past it has pruned
 *  the rows the rolling arm needs. */
function walkTwoSeasons(seed: string): {
  boundary: { week: number; points: number; open: Record<string, boolean> }[]
  world: WorldState
} {
  const world: WorldState = createWorld(seed, DEFAULT_PROFILE)
  world.fundsCents = 500_000_00
  const rng = rngFromSeed(world.seed)
  const boundary: { week: number; points: number; open: Record<string, boolean> }[] = []
  const watch: TierId[] = ['regional', 'national', 'j30']
  for (let w = 0; w < 2 * WEEKS_PER_YEAR + 2; w++) {
    const byRung = [...world.season].sort(
      (a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
    )
    for (const e of byRung) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
      if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
      try {
        enterEvent(world, e.id)
      } catch {
        /* the ladder refused – exactly what this walk is measuring */
      }
    }
    const offset = world.week % WEEKS_PER_YEAR
    if (offset === WEEKS_PER_YEAR - 1 || offset === 0) {
      const snap = toSnapshot(world)
      boundary.push({
        week: world.week,
        points: snap.ladders.domestic.points,
        open: Object.fromEntries(watch.map((t) => [t, snap.tierOpen?.[t] === true])),
      })
    }
    if (world.week === WEEKS_PER_YEAR) break
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return { boundary, world }
}

describe('round 34 #1 – the measured behaviour, pinned so it cannot change in silence', () => {
  it('⭐⭐ THE ANSWER TO HIS QUESTION: they are RESET by the boundary, not aged out of a rolling window', () => {
    // ⚠ THE TWO HYPOTHESES ARE DISTINGUISHED BY FOLDING THE SAME LEDGER TWICE, which is the only
    // reading that can tell them apart – «обнулились» and «выпали из окна» look identical on a chip.
    // At week 52 her season-one results are all inside a rolling 52-week window and all outside a
    // season-to-date one, so the two folds disagree by her whole first-season book.
    const { boundary, world } = walkTwoSeasons('r34-domestic-reset')
    const last = boundary.find((b) => b.week === WEEKS_PER_YEAR - 1)!
    expect(last, 'the walk reached the boundary').toBeDefined()
    expect(last.points, 'she earned a domestic book in season one').toBeGreaterThan(0)

    const fold = (window: 'rolling52' | 'seasonToDate') =>
      windowedBestSum(world.results, WEEKS_PER_YEAR, KID_ID, BEST_N_BY_TRACK.domestic, inTrack('domestic'), window)
    expect(fold('rolling52'), 'a rolling window would still be carrying season one').toBeGreaterThan(0)
    expect(fold('rolling52'), '...all of it – nothing has aged out at week 52').toBeGreaterThanOrEqual(last.points)
    expect(fold('seasonToDate'), 'the shipped rule keeps only what season TWO has paid so far').toBeLessThan(
      fold('rolling52'),
    )
    // The rule behind it, read rather than restated: this is the one line that makes the above true.
    expect(WINDOW_BY_TRACK.domestic).toBe('seasonToDate')
  })

  it('⚠ AND THE DOMESTIC GATES RE-CLOSE WITH IT – his «мне снова закрылся регионарный»', () => {
    // ⚠ THIS PIN ASSERTS A DEFECT-SHAPED BEHAVIOUR ON PURPOSE, and it is NOT an endorsement of it.
    // `tierFloorOpen` reads the season-to-date total live, so a rung she cleared in September is shut
    // again in January. The alternative – latching a cleared domestic floor the way `onRampCleared`
    // latches the two on-ramps – is a BALANCE decision and the owner's to make (docs/rounds/
    // round-34.md #1). Until he rules, this arm exists so that a change lands with a red test and a
    // reader instead of quietly, and so the report in the ledger cannot go stale.
    const { boundary } = walkTwoSeasons('r34-domestic-reset')
    const last = boundary.find((b) => b.week === WEEKS_PER_YEAR - 1)!
    const first = boundary.find((b) => b.week === WEEKS_PER_YEAR)!
    expect(last.open.regional, 'Regional was hers at the end of season one').toBe(true)
    expect(first.open.regional, 'and shut again on week 0 of season two').toBe(false)
  })

  it('⭐ the J door does NOT re-close, and that asymmetry is the whole answer to his last sentence', () => {
    // `onRampCleared.itf` is a latch: crossed once, hers for ever. So «как выйти в j уровень» has a
    // permanent answer where «как вернуть regional» does not – which is exactly why the route needed
    // saying out loud.
    const world: WorldState = createWorld('r34-j-latch', DEFAULT_PROFILE)
    world.onRampCleared = { itf: true, wta: false }
    // Her domestic book is empty – a season boundary has just wiped it – and the door is still open.
    expect(toSnapshot(world).tierOpen?.j30, 'the latch survives an empty domestic book').toBe(true)
  })
})
