import { describe, it, expect } from 'vitest'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
import { OFF_SEASON_WEEKS, TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { runTournament } from '../src/engine/season/tournament'
import { rivalField } from '../src/engine/world/weekField'
import { playerShortName } from '../src/engine/world/snapshot'
import { tierMakesWorldNews } from '../src/engine/world/matchNews'
import { rngFromSeed } from '../src/engine/rng'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

// ⭐⭐ v64 – THE CHAMPION OF EVERY AI TOURNAMENT IS WRITTEN DOWN, AND THIS FILE IS WHY IT HAD TO BE.
//
// THE DEFECT IT CLOSES. `runAiTournament` resolves every canonical bracket in the game and
// `runTournament` stamps the winner explicitly – `finishes[alive[0].id] = 0`, one line, no ambiguity
// – and the result was then dropped three separate ways over: the points went to
// `fieldSeasonPoints` with no event and no finish attached, the ledger row was written for the LIVE
// cohort only (a field pro hit a bare `continue`), and the news line carries PROSE with no player id
// on 6 of 16 rungs and is skipped entirely on the event the kid entered. The world knew its
// champions ~187 times a season and no reader could name one.
//
// ⚠ AND RE-RUNNING THE BRACKET IS NOT A RECOVERY, which is what makes this a WRITE and not a query.
// The same tick destroys `deriveWeekField`'s inputs: `world.season` is pruned to future events, the
// results ledger prunes at 52 weeks, the cohort has drifted and the season's points are already
// added. A replay of last March deals a different draw and would invent a champion the save never
// had – worse than an absent one.
//
// ⚠ WHAT IT WAS BOUGHT FOR, and the second test below is the whole reason the owner paid for it: a
// FIELD-level census against the real tour's own. «Titles per distinct champion» was asked of this
// engine on 28.08 and could not be answered from a save – it had to be settled by arithmetic
// (`docs/research/title-drought-reality.md` §2: 59 WTA titles among ~32 champions in 2024 = 1.84).
//
// ⚠ THE ASSERTIONS ARE MUTATION-VERIFIED, in the discipline CLAUDE.md's gotchas demand – "mutate the
// thing you think you are covering and watch it fail before you believe a green run". Four mutations
// were made to `recordTourChampion` and every one of them goes red, each on the assertion it should:
//   * dropping the write entirely           -> "one title recorded per tournament played" (0 vs 187)
//   * writing the champion twice            -> the same, plus the per-rung tally and the census
//   * recording under a FIXED rung ('slam')  -> the feed check inside the walk, on the first week a
//                                              rung that is not slam has a champion
//   * recording the RUNNER-UP (finish === 1) -> the same feed check, naming the wrong woman
// ⚠ The last two fail while the walk is still running, i.e. during COLLECT, so vitest reports the
// FILE rather than a test name. That is the assertion doing its job early, not a different failure –
// the message is `week 54: nothing in the feed says "🏆 <name> won the Grand Slam"`.

const WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
/** The last week of a season on which the tally is still whole. `maybeFireSeasonWrapUp` clears it on
 *  the wrap week itself, in the same breath as `fieldSeasonPoints` – so a census is read the week
 *  before. No event is ever scheduled on the wrap week (asserted below, not assumed), so this is the
 *  FULL season and not a season minus its last week. */
const CENSUS_WEEK = 2 * WEEKS_PER_YEAR - 4 // = 100: season 1's last playing week

type Titles = Partial<Record<TierId, Record<string, number>>>

const titlesTotal = (t: Titles): number =>
  Object.values(t).reduce((sum, rung) => sum + Object.values(rung ?? {}).reduce((a, b) => a + b, 0), 0)

/** Every (rung, champion) increment between two snapshots of the tally, one entry per title. */
function newTitles(before: Titles, after: Titles): Array<{ tier: TierId; id: string }> {
  const out: Array<{ tier: TierId; id: string }> = []
  for (const [tier, rung] of Object.entries(after) as Array<[TierId, Record<string, number>]>) {
    for (const [id, n] of Object.entries(rung)) {
      const was = before[tier]?.[id] ?? 0
      for (let i = 0; i < n - was; i++) out.push({ tier, id })
    }
  }
  return out
}

const clone = (t: Titles | undefined): Titles => JSON.parse(JSON.stringify(t ?? {}))

/** ⚠ THE INDEPENDENT COUNT OF "TOURNAMENTS PLAYED", and it is taken from the CALENDAR rather than
 *  from the thing under test. `tickWeek` increments `world.week` at its head and `deriveWeekField`
 *  then folds `world.season.filter((e) => e.week === world.week)` – so the events about to be played
 *  are exactly those standing at `world.week + 1` before the tick. Every one of them gets a
 *  canonical bracket in `closeTheWeek` step 4c, the kid's own event included. */
const dueNextWeek = (world: WorldState) => world.season.filter((e) => e.week === world.week + 1)

/** One career walked to the census week, collecting the per-week evidence as it goes. */
function walkASeason(presetIndex: number, policyIndex: number) {
  const { world, rng } = openCareer(PRESETS[presetIndex], 0, POLICIES[policyIndex])
  let onTheWrapWeek = 0
  /** how many recorded champions were confirmed against the world's own news line for that event */
  let namedAndConfirmed = 0
  const tiersPlayed: TierId[] = []
  const tiersRecorded: TierId[] = []

  for (let w = 0; w < 2 * WEEKS_PER_YEAR; w++) {
    const due = dueNextWeek(world)
    const enteredIds = new Set(due.filter((e) => world.entries.includes(e.id)).map((e) => e.id))
    const before = clone(world.fieldSeasonTitles)

    stepCareerWeek(world, rng, POLICIES[policyIndex])

    const added = newTitles(before, clone(world.fieldSeasonTitles))
    if (world.week % WEEKS_PER_YEAR === WRAP_OFFSET) onTheWrapWeek += due.length

    // ⚠ THE TALLY'S SEASON OPENS ON THE WEEK AFTER THE WRAP, NOT ON THE CALENDAR YEAR. It is
    // cleared by `maybeFireSeasonWrapUp` at offset 49, so the census covers weeks 50-100 and NOT
    // 53-100 – three domestic events sit in that gap and counting from the year boundary loses
    // them, which is exactly how this comparison first came out 187 against 184.
    if (world.week > WRAP_OFFSET && world.week <= CENSUS_WEEK) {
      for (const e of due) tiersPlayed.push(e.tier)
      for (const a of added) tiersRecorded.push(a.tier)

      // ⚠ IDENTITY, TIED TO THE BRACKET'S OWN `finishes` THROUGH A SURFACE THIS CHANGE DID NOT WRITE.
      // `announceTourChampion` names the winner of the canonical bracket – `playerShortName` of the
      // id whose finish is 0 – on the rungs that make world news, and skips the event the kid
      // entered. So for every one of those the feed row is an INDEPENDENT statement of who won, and
      // the recorded champion has to be the person it names. Built FORWARDS (compose the sentence
      // the feed would have written for the id we recorded, then look for it) rather than parsed
      // backwards, so a wrong id or a wrong rung cannot quietly match some other row.
      // ⚠ `endsWith(').')` EXCLUDES HER OWN LINE: `finalizeTournament` writes
      // `🏆 <name> won the <label> (<surface>).` about the draw SHE played, which is a different
      // universe for the same event id and is deliberately NOT what the tally holds.
      for (const a of added) {
        const event = due.find((e) => e.tier === a.tier)
        if (!event || enteredIds.has(event.id) || !tierMakesWorldNews(a.tier)) continue
        const prefix = `🏆 ${playerShortName(world, a.id)} won the ${TIERS[a.tier].label}`
        const row = world.events.find(
          (e) => e.week === world.week && e.text.startsWith(prefix) && !e.text.endsWith(').'),
        )
        expect(row, `week ${world.week}: nothing in the feed says "${prefix}"`).toBeDefined()
        namedAndConfirmed++
      }
    }

    if (world.week === CENSUS_WEEK) {
      return {
        world,
        census: clone(world.fieldSeasonTitles),
        // the season the tally covers opens the week after the wrap and closes on the census week
        played: tiersPlayed,
        recorded: tiersRecorded,
        namedAndConfirmed,
        onTheWrapWeek,
      }
    }
  }
  throw new Error('never reached the census week')
}

/** preset/policy triples, the same three arms the frozen careers use – a grinder, a rich grinder and
 *  a player-policy career, so the claim is not about one seed's luck. */
const ARMS = [
  [5, 0, '25k · middle coach · grinder'],
  [8, 0, '120k · high coach · grinder'],
  [0, 1, '8k · self-coached · player'],
] as const

const WALKS = ARMS.map(([p, q, label]) => ({ label, ...walkASeason(p, q) }))

describe('the champion of every AI tournament is recorded', () => {
  it('one title recorded per tournament played, across a whole season', () => {
    for (const walk of WALKS) {
      // ⚠ THE WRAP WEEK CARRIES NO EVENT, so "the season the tally covers" and "the season the
      // calendar plays" are the same set of tournaments rather than nearly the same. Asserted
      // because everything below counts on it: an event on the wrap week would be recorded and then
      // cleared in the same tick, and the count would be short by that many for a reason no comment
      // could name.
      expect(walk.onTheWrapWeek, `${walk.label}: an event fell on the wrap week`).toBe(0)
      expect(walk.recorded.length, `${walk.label}: titles recorded`).toBe(walk.played.length)
      expect(titlesTotal(walk.census), `${walk.label}: the census sums to the season`).toBe(walk.played.length)
      // and it is a real season, not an empty one that trivially matches
      expect(walk.played.length).toBeGreaterThan(150)
    }
  })

  it('each title is recorded at the rung that played it', () => {
    for (const walk of WALKS) {
      const tally = (xs: readonly TierId[]) => {
        const m: Partial<Record<TierId, number>> = {}
        for (const t of xs) m[t] = (m[t] ?? 0) + 1
        return m
      }
      expect(tally(walk.recorded), walk.label).toEqual(tally(walk.played))
    }
  })

  it('the recorded champion is the one the news names – i.e. the id the bracket finished first', () => {
    for (const walk of WALKS) {
      // every confirmation is an `expect` inside the walk; this is the guard that says there WERE
      // confirmations, so a future change that made the feed silent could not turn this green.
      expect(walk.namedAndConfirmed, `${walk.label}: champions confirmed against the feed`).toBeGreaterThan(20)
    }
  })

  it("a bracket has exactly one champion, and `finishes` is where it says so", () => {
    // The contract the tally reads, asserted directly on `runTournament` rather than trusted: the
    // champion is the single id whose finish is 0 (`finishes[alive[0].id] = 0`). If a draw ever
    // produced two of them or none, the tally above would be counting something else.
    const { world } = WALKS[0]
    // a REAL event off the world's own calendar, so the draw geometry is the shipped one
    const event = world.season[0]
    const drawSize = TIERS[event.tier].drawSize
    for (let i = 0; i < 20; i++) {
      const entrants = world.cohort.slice(i, i + drawSize)
      const field = rivalField(entrants, event, new Map())
      const result = runTournament(event, field, null, world.seed, rngFromSeed(`probe:${i}`))
      const winners = Object.entries(result.finishes).filter(([, f]) => f === 0)
      expect(winners.length, `draw ${i}`).toBe(1)
      expect(entrants.map((e) => e.id)).toContain(winners[0][0])
    }
  })
})

// ⭐⭐⭐ THE PAYOFF – A FIELD-LEVEL CENSUS, WHICH IS THE WHOLE REASON THE RECORD EXISTS.
//
// The real figure, from `docs/research/title-drought-reality.md` §2: **59 WTA Tour singles titles in
// 2024 among ~32 distinct champions = 1.84 titles each**, the 36 WTA 125s excluded. This prints ours
// beside it.
//
// ⚠ NOTHING HERE IS TUNED TO 1.84 AND NOTHING ASSERTS IT. The bounds below are structural – the
// count of titles must be the count of events, a ratio must be at least 1 – and they would hold on
// any tour. The number is a MEASUREMENT and it is reported, not defended.
//
// ⚠ AND THE DENOMINATORS DIFFER, WHICH ANY READING OF THE FIGURE HAS TO CARRY. Our four WTA rungs
// hold **30** events a season (wta250 8 · wta500 10 · wta1000 8 · slam 4) against the real tour's
// 58 tournaments – so our ratio is computed over half as many titles, and a ratio of titles to
// champions rises with the number of titles when concentration is held fixed. Ours being lower is
// therefore not by itself proof that our champions repeat too little; the comparable statement is
// what share of titles the repeat winners take, which is printed alongside.
describe('titles per distinct champion at the four WTA rungs, ours against the real 1.84', () => {
  const WTA_RUNGS: TierId[] = ['wta250', 'wta500', 'wta1000', 'slam']

  it('is readable off the season census', () => {
    const lines: string[] = []
    for (const walk of WALKS) {
      const perChampion = new Map<string, number>()
      let titles = 0
      for (const rung of WTA_RUNGS) {
        for (const [id, n] of Object.entries(walk.census[rung] ?? {})) {
          perChampion.set(id, (perChampion.get(id) ?? 0) + n)
          titles += n
        }
      }
      const distinct = perChampion.size
      const counts = [...perChampion.values()].sort((a, b) => b - a)
      const repeatTitles = counts.filter((n) => n > 1).reduce((a, b) => a + b, 0)
      const expectedEvents = walk.played.filter((t) => WTA_RUNGS.includes(t)).length

      expect(titles, `${walk.label}: a title per WTA-rung event`).toBe(expectedEvents)
      expect(distinct).toBeGreaterThan(0)
      expect(titles / distinct).toBeGreaterThanOrEqual(1)

      lines.push(
        `  ${walk.label.padEnd(30)} ${titles} titles · ${distinct} champions · ` +
          `${(titles / distinct).toFixed(2)} each · ${Math.round((100 * repeatTitles) / titles)}% of titles ` +
          `taken by repeat winners · most by one woman: ${counts[0]}`,
      )
    }
    console.log(
      `\nTITLES PER DISTINCT CHAMPION – wta250/wta500/wta1000/slam, one season (weeks ${WRAP_OFFSET + 1}-${CENSUS_WEEK})\n` +
        `${lines.join('\n')}\n` +
        `  ${'REAL (2024 WTA Tour)'.padEnd(30)} 59 titles · ~32 champions · 1.84 each\n`,
    )
  })
})
