// ROUND 24 #1 – THE ACADEMY'S THREE NOTICES BECOME LETTERS, AND THE LETTERS ARE KEPT.
//
// The owner, 20.08: «сейчас как-то незаметно появляется один маленький попапчик сверху, который
// призывает изучить scholarship и кнопка dismiss. Я бы и рад изучить, да только далее не знаю где.»
//
// ⚠ HALF OF THAT IS THE ROUND-23 FIX WORKING AS DESIGNED. #16 found the verdict landing on
// `week % 52 === 0` – the one week a `+4` advance can never reach – and gave it a stop, which is the
// toast he is describing. The stop stays; `tests/academy-notice.test.ts` is its net and nothing here
// touches it. What was never true is that the toast should be the WHOLE surface: it said "check her
// scholarship" and there was nothing in the game to check.
//
// ⚠⚠ AND "KEPT" IS THE HALF THAT IS A REAL DEFECT RATHER THAN A MISSING SIGNPOST. Of the three
// notices only the ARRIVAL survives a long career: `fireMilestone` writes it `keep: true`, and the
// changed share and the ending are ordinary `info` rows that `pruneEvents` drops at 400 non-`keep`
// rows. `pruneEntryLetters` touches `entry` and `tour` letters and NOTHING else, so an `academy`
// letter outlives the career – which is what test 3 measures, on a walked world rather than a
// hand-built one.
//
// ⚠⚠⚠ THE WALK CALLS `settleAcademyLetters` ITSELF, AND THAT IS A STATED GAP RATHER THAN A TRICK.
// The settler's production home is the tick's inbox block, one line beside `settleTourSeasonNotice`
// in `engine/world.ts` – a file this agent does not own and another agent was mid-flight in. Until
// that line lands these tests drive the settler exactly where the tick would, so every claim below
// is about a REAL walked career and none of them is about a hand-written world. See the report.
import { describe, it, expect, vi } from 'vitest'

// Six to eight seasons of a real career per arm; measured at ~2s each, but the runner is shared.
vi.setConfig({ testTimeout: 300_000 })

import {
  ACADEMY_NOTICE,
  closeTournament,
  createWorld,
  enterEvent,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { settleAcademyLetters, travelCoverPct } from '../src/engine/academy'
import { academyLetters, pruneEntryLetters } from '../src/engine/offers'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type AcademyLetterTerms, type FamilyBackground, type Offer } from '../src/shared/protocol'

/** A real career, entering whatever the gate allows – the academy's hard gate is that she COMPETES,
 *  so a world that never entered anything can only ever prove the "she stopped playing" arm. The
 *  policy is `tests/academy-notice.test.ts`'s own, so the two files walk the same kind of career.
 *
 *  `stopEnteringAt` is how the "she stopped playing" ending is reached honestly: the parent simply
 *  stops entering her, which is a thing a player does. */
interface Walk {
  world: WorldState
  /** ⚠ THE FEED, RECORDED AS IT HAPPENED, because reading it back at the end is exactly the thing
   *  this item exists to fix: `pruneEvents` caps the news at 400 non-`keep` rows and by season eight
   *  the review lines are gone. Collecting them week by week is what lets the paper be checked
   *  against the ledger AND lets the loss itself be measured. */
  feed: { week: number; text: string }[]
}

function runCareer(seed: string, background: FamilyBackground, weeks: number, stopEnteringAt = Infinity): Walk {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  const feed: { week: number; text: string }[] = []
  for (let w = 0; w < weeks; w++) {
    if (world.week < stopEnteringAt) {
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* gated on points / funds / availability – the policy just moves on */
          }
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    // ⚠ THE ONE LINE THE TICK IS OWED. See the file header.
    settleAcademyLetters(world)
    for (const e of world.events) {
      if (e.week === world.week && Object.values(ACADEMY_NOTICE).some((o) => e.text.startsWith(o))) {
        feed.push({ week: e.week, text: e.text })
      }
    }
  }
  return { world, feed }
}

const termsOf = (o: Offer): AcademyLetterTerms => o.terms as AcademyLetterTerms
const notices = (world: WorldState) => academyLetters(world.offers).map((o) => termsOf(o).notice)

/** The percentage the FEED said on the week the letter claims, read off the journal the walk kept.
 *  The cross-check that matters: the paper and the ledger are two renderings of one verdict, and
 *  `travelCoverPct` is a second copy of the expression `reviewAcademy` computes inline – so this is
 *  what stops the two drifting. */
function feedPctAt(walk: Walk, week: number): number | null {
  const row = walk.feed.find(
    (e) =>
      e.week === week &&
      (e.text.startsWith(ACADEMY_NOTICE.arrived) || e.text.startsWith(ACADEMY_NOTICE.reviewed)),
  )
  const m = row?.text.match(/(\d+)%/)
  return m ? Number(m[1]) : null
}

describe('Round 24 #1 – the academy writes, and what it writes is true', () => {
  // ⭐ THE MEASURED CAREER. 'r24-life' / middle / 8 seasons: the scholarship arrives at w52 on 18%,
  // is reviewed four times (w104 22, w156 23, w208 22, w260 23) and ends at w312 when she turns 19.
  // Every one of the three notices happens naturally in one walk – nothing here is staged.
  const walk = runCareer('r24-life', 'middle', 8 * WEEKS_PER_YEAR + 2)
  const life = walk.world

  it('all three notices arrive as letters, in season order, one per review', () => {
    const letters = academyLetters(life.offers)
    expect(letters.length).toBeGreaterThanOrEqual(3)
    expect(notices(life)[0]).toBe('arrived')
    expect(notices(life)[letters.length - 1]).toBe('ended')
    expect(notices(life).slice(1, -1).every((n) => n === 'reviewed')).toBe(true)
    // One letter per season, and the id says which season – so a replayed boundary week cannot
    // write a second sheet about one review.
    const seasons = letters.map((o) => termsOf(o).seasonIndex)
    expect(new Set(seasons).size).toBe(seasons.length)
    expect(letters.map((o) => o.id)).toEqual(seasons.map((s) => `academy-${s}`))
  })

  it('every letter is filed on a review week, and its season is that week', () => {
    for (const o of academyLetters(life.offers)) {
      expect(o.week % WEEKS_PER_YEAR, `letter ${o.id} filed off the season boundary`).toBe(0)
      expect(termsOf(o).seasonIndex).toBe(seasonIndexOf(o.week))
      // A notice, never a decision: nothing to sign, nothing to refuse, nothing to lapse.
      expect(o.state).toBe('info')
      expect(o.deadlineWeek).toBe(o.week)
    }
  })

  it('the share on the paper is the share in the ledger, to the whole percent', () => {
    const supported = academyLetters(life.offers).filter((o) => termsOf(o).notice !== 'ended')
    expect(supported.length).toBeGreaterThanOrEqual(2)
    for (const o of supported) {
      expect(feedPctAt(walk, o.week), `no feed line for ${o.id}`).not.toBeNull()
      expect(termsOf(o).sharePct, `${o.id} disagrees with the feed`).toBe(feedPctAt(walk, o.week))
    }
    // ...and the last one is still what the world is actually charging her at.
    const last = supported[supported.length - 1]
    if (life.academy) expect(travelCoverPct(life.academy.level)).toBe(termsOf(last).sharePct)
  })

  it('a review letter carries BOTH ends of the move, and never a move of zero', () => {
    const letters = academyLetters(life.offers)
    const reviews = letters.filter((o) => termsOf(o).notice === 'reviewed')
    expect(reviews.length).toBeGreaterThanOrEqual(2)
    for (const o of reviews) {
      const t = termsOf(o)
      const before = letters[letters.indexOf(o) - 1]
      expect(t.wasPct, `${o.id} must quote the share it moved from`).toBe(termsOf(before).sharePct)
      expect(t.sharePct).not.toBe(t.wasPct)
    }
    // The review is SILENT when the rounded share does not move (`reviewAcademy`'s own rule), so
    // the seasons with no letter are exactly the seasons the feed said nothing in.
    const spoke = new Set(letters.map((o) => o.week))
    for (let w = WEEKS_PER_YEAR; w <= life.week; w += WEEKS_PER_YEAR) {
      const feed = walk.feed.some((e) => e.week === w)
      expect(feed, `week ${w}: feed and inbox disagree about whether the academy spoke`).toBe(spoke.has(w))
    }
  })

  it('the run has one start date, and the ending letter quotes it', () => {
    const letters = academyLetters(life.offers)
    const arrival = letters[0]
    const end = letters[letters.length - 1]
    const t = termsOf(end)
    expect(t.notice).toBe('ended')
    expect(t.sharePct).toBe(0)
    expect(t.sinceWeek).toBe(termsOf(arrival).sinceWeek)
    expect(t.sinceWeek).toBe(arrival.week)
    // She turned nineteen; the academy's junior band tops out at eighteen.
    expect(t.reason).toBe('aged-out')
  })

  it('...and "she stopped competing" is a different ending, told as a different story', () => {
    // Entering stops at w110, so by the w208 review the 52-week window holds nothing.
    const quit = runCareer('r24-quit', 'working', 4 * WEEKS_PER_YEAR + 2, 110).world
    const letters = academyLetters(quit.offers)
    const end = letters[letters.length - 1]
    expect(termsOf(end).notice).toBe('ended')
    expect(termsOf(end).reason).toBe('stopped-playing')
  })

  // ============================================================================================
  // RETENTION – the whole of his complaint, measured on the walked world above
  // ============================================================================================
  it('the letter is still in the inbox hundreds of weeks later, on the list the prune runs over', () => {
    const letters = academyLetters(life.offers)
    const arrival = letters[0]
    expect(life.week - arrival.week).toBeGreaterThan(5 * WEEKS_PER_YEAR)
    // It is still ON `world.offers` – the array `pruneEntryLetters` rewrites every single tick.
    expect(life.offers.some((o) => o.id === arrival.id)).toBe(true)
    // Every academy letter is from a finished season, and every one of them is still here.
    const thisSeason = seasonIndexOf(life.week)
    expect(letters.every((o) => seasonIndexOf(o.week) < thisSeason)).toBe(true)
    // ⚠ AND THE CONTROL, ON THE SAME LIST AND THROUGH THE SAME PRUNE, so that "the academy letter
    // survived" is a fact about the KIND rather than about a prune that never fired. This career is
    // a junior one and files no desk receipts of its own – `raiseEntryLetter` is a professional
    // event's paper – so the control is one, put on the same list from the same finished season and
    // handed to `pruneEntryLetters`, which is the function `housekeep` calls every tick.
    const desk = { ...letters[0], id: 'entry-control', kind: 'entry' as const }
    const after = pruneEntryLetters([...life.offers, desk], life.week)
    expect(after.some((o) => o.id === 'entry-control')).toBe(false)
    expect(academyLetters(after).map((o) => o.id)).toEqual(letters.map((o) => o.id))
  })

  it('...and the feed has already lost two of the three, which is why the letters exist', () => {
    // The arrival is a milestone (`keep: true`) and survives; the review lines are ordinary rows.
    // This is a MEASUREMENT, not a rule: if a future wave gives the review lines `keep`, the letters
    // are still the answer to "where do I go to read it", and this expectation is the one to re-aim.
    const arrivalLine = life.events.some((e) => e.text.startsWith(ACADEMY_NOTICE.arrived))
    expect(arrivalLine).toBe(true)
    const feedRowsNow = life.events.filter((e) =>
      Object.values(ACADEMY_NOTICE).some((o) => e.text.startsWith(o)),
    ).length
    // Every line the academy ever wrote is in the journal; the feed no longer holds them all.
    expect(walk.feed.length).toBe(academyLetters(life.offers).length)
    expect(feedRowsNow).toBeLessThan(walk.feed.length)
  })

  // ============================================================================================
  // AN OLD CAREER – what a save written before this wave can and cannot have derived for it
  // ============================================================================================
  it('a career that has been on a scholarship for years gets its arrival letter back, from its own data', () => {
    // A save written before this wave: the support is on the world, the letters are not.
    const old = runCareer('r24-life', 'middle', 3 * WEEKS_PER_YEAR + 7).world
    expect(old.academy).not.toBeNull()
    const since = old.academy!.sinceWeek
    old.offers = old.offers.filter((o) => o.kind !== 'academy')
    expect(academyLetters(old.offers)).toEqual([])

    // ...and one ordinary mid-season week later it is back, at the week the run began.
    expect(old.week % WEEKS_PER_YEAR).not.toBe(0)
    settleAcademyLetters(old)
    const letters = academyLetters(old.offers)
    expect(letters).toHaveLength(1)
    expect(termsOf(letters[0]).notice).toBe('arrived')
    expect(letters[0].week).toBe(since)
    expect(termsOf(letters[0]).sinceWeek).toBe(since)
    expect(termsOf(letters[0]).sharePct).toBe(travelCoverPct(old.academy!.level))
  })

  it('...but nothing is invented for the history the save cannot prove', () => {
    // 1. A career whose scholarship ENDED before this wave has `academy === null` and no letters.
    //    "It ended" and "there never was one" are indistinguishable in that save, so the settler
    //    says nothing rather than dating an ending it cannot date.
    const gone = runCareer('r24-life', 'middle', 7 * WEEKS_PER_YEAR).world
    expect(gone.academy).toBeNull()
    gone.offers = gone.offers.filter((o) => o.kind !== 'academy')
    settleAcademyLetters(gone)
    expect(academyLetters(gone.offers)).toEqual([])

    // 2. And a mid-season settle never writes a REVIEW either: a share that moved three seasons ago
    //    is not in the save, and stamping it at today's week would be a record of a week in which
    //    nothing happened.
    const live = runCareer('r24-life', 'middle', 5 * WEEKS_PER_YEAR + 11).world
    const before = academyLetters(live.offers).length
    live.academy!.level = live.academy!.level * 0.5
    settleAcademyLetters(live)
    expect(academyLetters(live.offers)).toHaveLength(before)
  })

  it('settling twice writes nothing twice, and draws nothing at all', () => {
    const w = runCareer('r24-idem', 'working', 2 * WEEKS_PER_YEAR + 4).world
    const offers = w.offers.length
    const draws = w.rngMain?.n
    settleAcademyLetters(w)
    settleAcademyLetters(w)
    settleAcademyLetters(w)
    expect(w.offers.length).toBe(offers)
    expect(w.rngMain?.n).toBe(draws)
  })
})
