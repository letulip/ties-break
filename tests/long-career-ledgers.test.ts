// THE LONG CAREER: what the screens say once the CAPS have engaged.
//
// ⚠⚠ WHY THIS FILE EXISTS, and it is a finding about the whole suite rather than about one bug.
//
// The owner played to season 8 (week 412) and the wallet read zero on every screen except Home:
// «Что-то сломалось в кошельке в конце сезона... В турнирах пишут ноль, в week recap тоже, в самом
// ledger на вкладке расходов вообще нет транзакций.» The same card said "no tournaments played" over
// a 44-19 record. Then: «Вероятно наши поломки случились после рефакторинга, но в этом случае не
// очень понятно что делают наши тесты и почему не ловят таких вещей.»
//
// The answer is that the suite has never played a career this long. A save carries THREE independent
// caps – `events` (400 rows, by COUNT), `financeWeeks` (60 weeks, by TIME), `results` (52 weeks, by
// TIME) – and almost every screen reads across them. Measured over every test file in this repo
// before this one was written:
//
//   * the two longest careers are 520 weeks (tests/world.test.ts) and 500 (tests/offers.test.ts),
//     and NEITHER ENTERS A TOURNAMENT. With no matches in the feed the protected class is empty, so
//     the ordinary rows keep the whole budget and the failure mode is unreachable by construction.
//   * the longest career that actually PLAYS is 260-300 weeks (tests/ladder.test.ts,
//     tests/world-trio.test.ts) - five to six seasons, which is where a real career is when
//     everything still works.
//   * the one test that deliberately checks the cap is exercised (round11.test.ts R11-12a, and it
//     is a good test) runs TWO seasons and asserts the feed reaches 400 rows once.
//   * even the radar bench - the tool that OWNS the events-cap coupling - has a 208-week horizon.
//
// The regime this file measures begins around week 430 on a greedy career: the point at which her
// retained match rows plus the kept milestones fill the 400-row cap BETWEEN THEM, so the pruner has
// nothing left to give the ordinary rows. Nobody had ever been there. See
// docs/specs/wallet-and-wrapup.md for the reproduce-then-fix numbers, and tools/wallet-audit.ts for
// the probe that produced them.
//
// ⚠ ONE CAREER, BUILT ONCE, ASSERTED MANY TIMES. ~470 weeks with a real entry policy is a few
// seconds of engine time; rebuilding it per assertion would be minutes. Every `it` below reads the
// same frozen facts, which is also what keeps the failures readable - one career, many claims.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  toSnapshot,
  seasonStartWeek,
  seasonIndexOf,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { EVENTS_CAP, EVENTS_ORDINARY_FLOOR } from '../src/engine/world/constants'
import { finishLabel } from '../src/engine/world/labels'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { LadderTrack, TierId } from '../src/engine/season/types'
import type { Snapshot, SeasonSummary, WorldEvent } from '../src/shared/protocol'

const WEEKS = 520 // ten seasons - past the saturation point, which lands around week 430
/** ⚠ THE PROBE'S OWN SEED, deliberately: tools/wallet-audit.ts walks this exact career and
 *  docs/specs/wallet-and-wrapup.md quotes its numbers, so the test and the spec are about one
 *  career and a disagreement between them is a real disagreement rather than two seeds. */
const SEED = 'wallet-audit'

/** `isRadarEvidence` is private to world.ts. Restated here so the test can classify the feed the
 *  same way the pruner does; if the two ever drift the counts below stop meaning anything. */
const isEvidence = (e: WorldEvent): boolean =>
  e.match !== undefined && !e.friendly && (e.match.aId === KID_ID || e.match.bId === KID_ID)

interface WrapFacts {
  seasonIndex: number
  summary: SeasonSummary
  /** what the OLD fold would have said: the best `finishIdx` still in the capped event feed. */
  legacyBestText: string
  /** the best counting result the RESULTS ledger holds for the season - the durable answer. */
  ledgerBestText: string
  /** matches played per track this season, counted independently of the engine's own rule. */
  played: Record<LadderTrack, number>
  /** what the OLD rank line would have said. */
  legacyRankText: string
  /** tournament summaries for this season STILL IN the capped event feed at wrap time */
  feedRows: number
  /** ...against the counting results the durable ledger holds for the same window */
  ledgerRows: number
}

interface WeekFacts {
  week: number
  kept: number
  evidence: number
  rest: number
  /** the week's money as the durable per-category ledger holds it */
  ledgerIncome: number
  ledgerExpense: number
  /** the same week's money as the SNAPSHOT hands the week-recap card */
  cardIncome: number
  cardExpense: number
  /** what the card folded before this wave: a scrape of the snapshot's event window */
  legacyIncome: number
  legacyExpense: number
  financialEvents: number
}

function bestFinishFromResults(world: WorldState, from: number, to: number): number | null {
  let best: number | null = null
  for (const r of world.results) {
    if (r.playerId !== KID_ID || r.week < from || r.week >= to) continue
    if (!r.tier || r.points <= 0) continue
    const finish = TIERS[r.tier].points.indexOf(r.points)
    if (finish >= 0 && (best === null || finish < best)) best = finish
  }
  return best
}

function legacyBestFinish(world: WorldState, from: number, to: number): number | null {
  let best: number | null = null
  for (const e of world.events) {
    if (e.week < from || e.week >= to) continue
    if (e.type === 'tournament' && e.finishIdx !== undefined && (best === null || e.finishIdx < best)) {
      best = e.finishIdx
    }
  }
  return best
}

/** A GREEDY PROFESSIONAL CAREER: the strongest rung she is admitted to, one entry a week, funds kept
 *  solvent so the wallet gate is never the reason she stays home. Same idiom as tools/boredom-guard.ts,
 *  and the only way to reach professional VOLUME - which is the whole point of this file. */
function buildCareer(): { world: WorldState; weeks: WeekFacts[]; wraps: WrapFacts[] } {
  const world = createWorld(SEED)
  const rng = rngFromSeed(world.seed)
  const strongestFirst = [...TIER_LADDER].reverse() as TierId[]
  const weeks: WeekFacts[] = []
  const wraps: WrapFacts[] = []

  for (let i = 0; i < WEEKS; i++) {
    // ⚠ CAPTURED BEFORE THE TICK, and it has to be: `maybeFireSeasonWrapUp` runs INSIDE `tickWeek`
    // and resets `seasonRecord` as its last act, so reading it after the wrap tick returns zeroes.
    // The wrap fires on week 49, the first off-season week, and nothing is played in an off-season
    // week - so the record as it stood entering that tick IS the season's full per-track record.
    // (The first cut of this file read it after the tick, and both (C) assertions below went
    // silently vacuous on an all-zero tally. Mutation-verified since.)
    const record = world.seasonRecord
    const recordBefore: Record<LadderTrack, number> = {
      domestic: (record?.domestic.wins ?? 0) + (record?.domestic.losses ?? 0),
      itf: (record?.itf.wins ?? 0) + (record?.itf.losses ?? 0),
      wta: (record?.wta.wins ?? 0) + (record?.wta.losses ?? 0),
    }
    world.fundsCents = Math.max(world.fundsCents, 5_000_00)
    if (world.condition >= 30) {
      for (const tier of strongestFirst) {
        const e = world.season.find(
          (x) =>
            x.tier === tier &&
            x.deadlineWeek >= world.week &&
            x.deadlineWeek - world.week <= 2 &&
            !world.entries.includes(x.id) &&
            !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
        )
        if (!e) continue
        try {
          enterEvent(world, e.id)
          break
        } catch {
          /* the gate said no - try the rung below */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }

    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) {
      const yearStart = seasonStartWeek(world.week)
      const played = recordBefore
      const legacy = legacyBestFinish(world, yearStart, world.week)
      const ledger = bestFinishFromResults(world, yearStart, world.week)
      wraps.push({
        seasonIndex: seasonIndexOf(world.week),
        summary: { ...world.lastSeasonSummary! },
        legacyBestText: legacy === null ? 'no tournaments played' : finishLabel(legacy),
        ledgerBestText: ledger === null ? 'no counting result' : finishLabel(ledger),
        played,
        legacyRankText:
          toSnapshot(world).ladders.itf.rank !== null ? `International #${world.kidRank}` : 'Unranked internationally',
        feedRows: world.events.filter(
          (e) => e.type === 'tournament' && e.finishIdx !== undefined && e.week >= yearStart && e.week < world.week,
        ).length,
        ledgerRows: world.results.filter(
          (r) => r.playerId === KID_ID && r.tier && r.week >= yearStart && r.week < world.week,
        ).length,
      })
    }

    // The snapshot is the wire the screens read, so every "what the screen shows" figure below comes
    // off a real one. Sampled from week 300 to keep the file a few seconds rather than a minute -
    // the regime under test starts a hundred weeks after that.
    if (world.week >= 300) {
      const snap: Snapshot = toSnapshot(world)
      const ledgerRow = snap.finance.weekly12.find((p) => p.week === snap.week)
      const weekEvents = snap.events.filter((e) => e.week === snap.week)
      weeks.push({
        week: world.week,
        kept: world.events.filter((e) => e.keep).length,
        evidence: world.events.filter((e) => !e.keep && isEvidence(e)).length,
        rest: world.events.filter((e) => !e.keep && !isEvidence(e)).length,
        ledgerIncome: world.financeWeeks
          .filter((f) => f.week === world.week)
          .reduce((s, f) => s + Object.values(f.byCategory).reduce((a, v) => a + Math.max(0, v ?? 0), 0), 0),
        ledgerExpense: world.financeWeeks
          .filter((f) => f.week === world.week)
          .reduce((s, f) => s + Object.values(f.byCategory).reduce((a, v) => a + Math.max(0, -(v ?? 0)), 0), 0),
        cardIncome: ledgerRow?.incomeCents ?? 0,
        cardExpense: ledgerRow?.expenseCents ?? 0,
        legacyIncome: weekEvents.filter((e) => e.type === 'income').reduce((s, e) => s + (e.amountCents ?? 0), 0),
        legacyExpense: weekEvents.filter((e) => e.type === 'expense').reduce((s, e) => s + -(e.amountCents ?? 0), 0),
        financialEvents: snap.financialEvents.length,
      })
    }
  }
  return { world, weeks, wraps }
}

const { world, weeks, wraps } = buildCareer()
const saturated = weeks.filter((w) => w.kept + w.evidence >= EVENTS_CAP - EVENTS_ORDINARY_FLOOR)

describe('the long career reaches the regime this file exists for', () => {
  it('plays professional volume for nine seasons', () => {
    expect(world.week).toBe(WEEKS)
    const matches = wraps.reduce((sum, w) => sum + w.summary.wins + w.summary.losses, 0)
    expect(matches).toBeGreaterThan(300) // a real career, not a tick-only one
    expect(wraps.length).toBeGreaterThanOrEqual(8)
  })

  it('SATURATES the event cap: her matches plus the kept rows claim the whole budget', () => {
    // ⚠ THE ANTI-VACUOUS CLAIM, and every assertion below depends on it. Before this wave the
    // pruner spent the cap BY CLASS - every ordinary row went before the first match did - so the
    // moment `kept + evidence` reached 400 the feed held NO money, NO tournament summaries and no
    // ordinary news at all, on every tick, for the rest of the career. That is the owner's save:
    // 382 match rows + 18 kept = 400 exactly. If this ever stops being true the career has stopped
    // being a professional one and the rest of this file has quietly stopped testing anything.
    expect(saturated.length).toBeGreaterThan(20)
    const last = weeks[weeks.length - 1]
    expect(last.kept + last.evidence + last.rest).toBeLessThanOrEqual(EVENTS_CAP + 4)
    expect(last.evidence).toBeGreaterThan(200)
  })
})

describe('(A) the wallet - the money screens after the caps engage', () => {
  it('the ordinary news floor holds, so the feed never runs out of ordinary rows', () => {
    // Pre-fix this was 0 from week 436 on: `rest` was empty on every tick and the money rows were
    // deleted by the same tick that wrote them.
    for (const w of saturated) {
      expect(w.rest, `week ${w.week} kept ${w.kept} evidence ${w.evidence}`).toBeGreaterThanOrEqual(
        EVENTS_ORDINARY_FLOOR,
      )
    }
  })

  it("the Money screen's ledger tab is never handed an empty transaction list", () => {
    // The owner: «в самом ledger на вкладке расходов вообще нет транзакций». `financialEvents` is a
    // slice of the feed, so it emptied with it.
    for (const w of saturated) {
      expect(w.financialEvents, `week ${w.week}`).toBeGreaterThan(0)
    }
  })

  it('the week recap reads the DURABLE ledger, cent for cent, on every week of the career', () => {
    // The card folds `snapshot.finance.weekly12` now - the dense per-week series off `financeWeeks`,
    // which prunes on a 60-week WINDOW and therefore always holds the week being shown. This is the
    // assertion that fails if anyone re-points it at `snapshot.events`.
    for (const w of weeks) {
      expect(w.cardIncome, `income, week ${w.week}`).toBe(w.ledgerIncome)
      expect(w.cardExpense, `expense, week ${w.week}`).toBe(w.ledgerExpense)
    }
  })

  it('...and a week the card would once have reported as $0 still has real money in it', () => {
    // The owner's screenshot, mechanised: a week whose ledger moved four figures. Read through the
    // ledger it is a real week; read through a count-capped feed it was three matches and no money.
    const busy = saturated.filter((w) => w.ledgerIncome > 0 && w.ledgerExpense > 0)
    expect(busy.length).toBeGreaterThan(10)
    for (const w of busy) expect(w.cardIncome + w.cardExpense).toBeGreaterThan(0)
  })
})

describe('(B) the season wrap-up - best result', () => {
  it('never reports "no tournaments played" over a season she played', () => {
    // The owner's card: "no tournaments played" beside a 44-19 record, on the same card.
    for (const w of wraps) {
      if (w.summary.wins + w.summary.losses === 0) continue
      expect(w.summary.bestResultText, `season ${w.seasonIndex}`).not.toBe('no tournaments played')
    }
  })

  it('reports the best counting result the RESULTS ledger holds, every season', () => {
    for (const w of wraps) {
      expect(w.summary.bestResultText, `season ${w.seasonIndex}`).toBe(w.ledgerBestText)
    }
  })

  it('...and the old event-feed scrape would have got it wrong, so this is not vacuous', () => {
    // THE BUG'S OWN WITNESS, the R11-12a idiom. `world.events` prunes by COUNT, so a season's
    // tournament summaries decay out of it gradually: the wrap-up was already reporting a WEAKER
    // finish than she achieved seasons before it collapsed into the owner's "no tournaments
    // played". If this ever starts agreeing everywhere, the career has stopped exercising the
    // pruning and the assertion above has gone quietly vacuous.
    //
    // ⚠ AND IT IS THE FEED'S DECAY, NOT ITS COLLAPSE, THAT THIS PINS - which is the reason the
    // read-side fix was needed on top of the prune floor rather than instead of it. The floor keeps
    // ~120 ordinary rows, i.e. about thirty weeks; a season is forty-nine. So even with the feed
    // healthy again its oldest tournament summaries are gone by the wrap and a scrape still
    // under-reports the year.
    //
    // ⚠⚠ RE-AIMED 13.08 (docs/specs/coach-match-edge.md), AND THE GUARD GOT STRONGER RATHER THAN
    // LOOSER. The coach's edge changed this career - `DEFAULT_PROFILE.coachTier` is 'middle', she is
    // measurably better, and she is now CHAMPION in nine of the ten seasons. That is exactly the
    // condition under which the old witness stops witnessing: when almost every season's best is a
    // title, the handful of rows the feed still holds usually contains one, so the scrape happens to
    // agree. Measured here: 5 seasons of 10 disagreed before, 1 of 10 now.
    //
    // A witness that weakens when the girl improves was measuring the wrong thing, so the FIRST
    // assertion below is now the MECHANISM - how many of the season's tournament summaries survive in
    // the feed at wrap time, against how many the durable ledger holds. That cannot go vacuous
    // because she got better: measured on this career the feed keeps 4-9 rows of the 16-21 the ledger
    // holds from season 3 on, and it is strictly short in 7 of the 10 seasons. The outcome-level
    // witness is kept beside it, re-aimed to what it actually measures now.
    const decayed = wraps.filter((w) => w.feedRows < w.ledgerRows)
    expect(decayed.length, 'the feed no longer loses rows – the read-side fix has gone vacuous').toBeGreaterThan(4)
    const wrong = wraps.filter((w) => w.legacyBestText !== w.ledgerBestText)
    expect(wrong.length).toBeGreaterThan(0)
  })
})

describe('(C) the season wrap-up - the rank line follows where she plays', () => {
  it('names the table that carried the season, not the junior one for ever', () => {
    for (const w of wraps) {
      const total = w.played.domestic + w.played.itf + w.played.wta
      if (total === 0) continue
      const dominant = (Object.keys(w.played) as LadderTrack[]).reduce((a, b) =>
        w.played[b] > w.played[a] ? b : a,
      )
      expect(w.summary.rankTrack, `season ${w.seasonIndex} played ${JSON.stringify(w.played)}`).toBe(dominant)
    }
  })

  it('gives a professional season a professional rank, where the old line said "Unranked"', () => {
    // The owner's card, at twenty-one, on the W tour: "Final international rank: Unranked - She has
    // not played a Junior Tour event yet." Her junior rank in his save is #74; her world rank #288.
    const pro = wraps.filter((w) => w.summary.rankTrack === 'wta')
    expect(pro.length).toBeGreaterThan(2)
    for (const w of pro) {
      expect(w.summary.rankInTrack, `season ${w.seasonIndex}`).not.toBeNull()
      expect(typeof w.summary.rankInTrack).toBe('number')
    }
    // ...and the witness: at least one of those seasons is one the old ITF-only line called unranked.
    expect(pro.some((w) => w.legacyRankText === 'Unranked internationally')).toBe(true)
  })

  it('still names a NON-professional table while she is still on one', () => {
    // The fallback is not "always professional": the early seasons are played below the professional
    // table and the line must keep saying so, which is what makes this a dynamic rule rather than a
    // second hard-coding.
    //
    // ⚠ RE-AIMED 13.08 (docs/specs/coach-match-edge.md): "junior" was ITF, and this career no longer
    // has an ITF-dominant season. It has not stopped having a non-professional PHASE - seasons 0 and
    // 1 are played 47-0-0 and 46-11-0 on the DOMESTIC table - it is that the coach's edge carries her
    // through the junior rungs fast enough that ITF never dominates a full year. Which of the two
    // non-professional tables carries her early seasons is a fact about the ladder and the greedy
    // entry policy, not about the rule under test, so the witness now asks the question the rule is
    // actually about: a season spent below the professional table must not be reported as a
    // professional one. Same guard, one rung wider, and it stops being hostage to how fast she climbs.
    // The SAME `dominant` reduce the first assertion in this block uses – one definition of "the
    // table that carried the season", so the witness cannot disagree with the rule it witnesses.
    const dominantOf = (w: WrapFacts): LadderTrack =>
      (Object.keys(w.played) as LadderTrack[]).reduce((a, b) => (w.played[b] > w.played[a] ? b : a))
    const preTour = wraps.filter(
      (w) => w.played.domestic + w.played.itf + w.played.wta > 0 && dominantOf(w) !== 'wta',
    )
    expect(preTour.length, 'no season below the pro table – the fallback has gone vacuous').toBeGreaterThan(0)
    for (const w of preTour) {
      expect(w.summary.rankTrack, `season ${w.seasonIndex} played ${JSON.stringify(w.played)}`).toBe(dominantOf(w))
    }
  })
})
