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

// ⚠⚠ RE-AIMED AT ROUND 42 ITEM 7 (15.09.2026). This describe was round 34 #1's presentational half:
// the domestic table was a season race, so «250 national pts» alone was half a condition and the
// sentence had to say «in one season». Round 42 #7 re-ruled the window to rolling-52 on his own word
// («тот же механизм — окно в 52 недели ... окно "ползет"»), so there is no season clause to add and
// the two sentences are back to the shape they had before round 34.
//
// ⭐ WHAT THE FILE STILL GUARDS IS THE MECHANISM ROUND 34 BUILT, which is the durable half: both
// sentences READ `WINDOW_BY_TRACK` rather than restating it. That is why this re-ruling cost the copy
// nothing but a constant – and the arms below prove the reading in BOTH directions, so the next
// ruling either way reaches the screens without anybody remembering these tests exist.
describe('round 42 #7 – the route to the Junior Tour, with no season clause left to add', () => {
  it('⭐⭐ J30\'s condition is its 250 national points and nothing about a season', () => {
    // ⚠ RE-AIMED (was «the 250 is a SEASON race, because the domestic table is one»). His round-34
    // «совершенно непонятно как выйти в j уровень» was answered by naming the window; his round-42
    // ruling removes the thing that needed naming. The number is the whole condition again, and it
    // stays true across a boundary now, which is what makes the plain sentence honest.
    const said = tierOpensWhen('j30')
    expect(said).toContain(`${TIERS.j30.enterPointBand[0]} national pts`)
    expect(said, 'the domestic table no longer restarts, so the clause must be gone').not.toContain('in one season')
  })

  it('⚠ it is DERIVED from `WINDOW_BY_TRACK`, so a re-ruling re-words the sentence', () => {
    // ⚠ THE MUTATION ARM, NOW POINTING THE OTHER WAY (round 42 #7). The constant is a plain object
    // precisely so `tools/domestic-season-to-date.ts` can patch it for an A/B arm, and a hardcoded
    // clause would go on lying through such a run. This is the proof that the sentence reads the gate
    // rather than restating it – and with the shipped value now `'rolling52'`, the informative
    // mutation is the OLD rule: patch it back and the clause must return, unprompted.
    const kept = WINDOW_BY_TRACK.domestic
    try {
      WINDOW_BY_TRACK.domestic = 'seasonToDate'
      expect(tierOpensWhen('j30')).toContain('in one season')
      expect(tierOpensWhen('j30')).toContain('250 national pts')
    } finally {
      WINDOW_BY_TRACK.domestic = kept
    }
    expect(tierOpensWhen('j30')).not.toContain('in one season')
  })

  it('the ITF-denominated threshold reads the same rule and has always been rolling', () => {
    // W15's band is ITF junior points, and `WINDOW_BY_TRACK.itf` has been `'rolling52'` through both
    // rulings: those points carry across a boundary, so the clause must not appear there either.
    expect(WINDOW_BY_TRACK.itf).toBe('rolling52')
    expect(tierOpensWhen('w15')).toContain('120 international pts')
    expect(tierOpensWhen('w15')).not.toContain('in one season')
  })

  it('and the lock\'s long form no longer says the table starts again', () => {
    // ⚠ RE-AIMED (was «says the table starts again»). Same derivation as the clause above: the
    // sentence is assembled from `WINDOW_BY_TRACK.domestic`, so the ruling edits it with no string
    // touched. What the long form still owes the reader – where the missing points are EARNED – is
    // unchanged and asserted here so this re-aim cannot quietly hollow the sentence out.
    const s = tierState('j30', {
      ...base,
      ageYears: 14,
      points: 106,
      engineOpen: false,
      refusal: { reason: 'locked', detail: 'x', pointsToEnter: 250 },
    })
    expect(s.note).toBe('106 / 250 national pts')
    expect(s.title).toContain('National points come from Local, Regional and National events')
    expect(s.title).not.toContain('starts again each season')
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
// ⭐⭐ IT WENT RED ON PURPOSE AT ROUND 42 #7, AND THAT IS THE TEST DOING ITS JOB. Its own header said
// what it was for: "this is the arm that would go red if the domestic table stopped being a season
// race, or if the domestic floors ever started latching ... what this file refuses to let happen is
// either of them changing SILENTLY". The owner changed the first, twice asked («второй раз пишу»),
// and the second followed from it without a latch – so the arms below are re-aimed at the new ruling
// rather than deleted, and they now refuse to let THAT change in silence.
//
// The pin that used to read «they are RESET by the boundary» now reads «they age out of a rolling
// window», and the pin that asserted a defect-shaped behaviour on purpose – Regional shut again on
// week 0 – asserts its absence instead. Both are still the same measurement, taken on the same walk,
// at the same week.

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

describe('round 42 #7 – the measured behaviour, pinned so it cannot change in silence', () => {
  it('⭐⭐ THE ANSWER TO HIS QUESTION: her book CROSSES the boundary – nothing is reset by a calendar', () => {
    // ⚠ RE-AIMED AT ROUND 42 #7 (was «they are RESET by the boundary, not aged out of a rolling
    // window» – round 34 #1's finding, true of the rule that shipped then). The reading is unchanged
    // and is the only one that can tell the two apart: FOLD THE SAME LEDGER TWICE. «обнулились» and
    // «выпали из окна» look identical on a chip, and at week 52 her season-one results are all inside
    // a rolling window and all outside a season-to-date one – so the two folds disagree by her whole
    // first-season book, and which one the snapshot AGREES with is the ruling, measured.
    const { boundary, world } = walkTwoSeasons('r34-domestic-reset')
    const last = boundary.find((b) => b.week === WEEKS_PER_YEAR - 1)!
    const first = boundary.find((b) => b.week === WEEKS_PER_YEAR)!
    expect(last, 'the walk reached the boundary').toBeDefined()
    expect(last.points, 'she earned a domestic book in season one').toBeGreaterThan(0)

    const fold = (window: 'rolling52' | 'seasonToDate') =>
      windowedBestSum(world.results, WEEKS_PER_YEAR, KID_ID, BEST_N_BY_TRACK.domestic, inTrack('domestic'), window)
    expect(fold('seasonToDate'), 'the OLD rule kept only what season TWO had paid so far').toBeLessThan(
      fold('rolling52'),
    )
    // ⭐ AND THE SNAPSHOT SHE READS ON WEEK 52 IS THE ROLLING FOLD, to the point. This is the arm that
    // was red under the old rule and is the whole of «каждый год заново надо набирать национальный
    // ранг» answered: her chip on the first week of the season is her book, not a zero.
    expect(first.points, 'week 0 of season two reads her season-one book').toBe(fold('rolling52'))
    expect(first.points, '...all of it – nothing has aged out at week 52').toBeGreaterThanOrEqual(last.points)
    // The rule behind it, read rather than restated: this is the one line that makes the above true.
    expect(WINDOW_BY_TRACK.domestic).toBe('rolling52')
  })

  it('⭐⭐ AND THE DOMESTIC GATES NO LONGER RE-CLOSE – his «мне снова закрылся регионарный», fixed', () => {
    // ⚠ RE-AIMED AT ROUND 42 #7 (was «AND THE DOMESTIC GATES RE-CLOSE WITH IT», a pin that asserted a
    // defect-shaped behaviour on purpose and said so). Round 34 #1 left the fix as a BALANCE decision
    // for the owner and offered him a latch on `peakDomesticPoints`; he ruled the mechanism instead,
    // and the latch is WITHDRAWN because it is unnecessary: `tierFloorOpen` reads
    // `kidPoints(world, 'domestic')` live, and a live total that no longer falls to zero holds the
    // door open by arithmetic, with no persisted state and no schema move.
    //
    // ⭐ THIS IS THE SECOND JOB THE ONE RULING DOES, and it is asserted on a real career rather than
    // argued from the constant: Regional's floor is 65 national points and National's is 150
    // (`calendar.ts`), both read off a total that used to read 0 on week 0 of every season.
    const { boundary } = walkTwoSeasons('r34-domestic-reset')
    const last = boundary.find((b) => b.week === WEEKS_PER_YEAR - 1)!
    const first = boundary.find((b) => b.week === WEEKS_PER_YEAR)!
    expect(last.open.regional, 'Regional was hers at the end of season one').toBe(true)
    expect(first.open.regional, 'and is STILL hers on week 0 of season two').toBe(true)
    // The discriminator: a career whose book never reached the floor would pass the line above by
    // having nothing to lose. Hers clears Regional's 65 at the boundary and keeps clearing it.
    expect(first.points, 'her book on week 0 clears Regional\'s floor').toBeGreaterThanOrEqual(
      TIERS.regional.enterPointBand[0],
    )
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
