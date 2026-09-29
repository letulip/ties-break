// C-01 (principles review, 26.09) – THE RIVALS' RUN-INDEX FOLLOWS EVERY KNOB IT IS BUILT FROM.
//
// The finding: `season/rival.ts`'s `runsIndex` memoises the (tier, finish) -> strain table, and its
// freshness test read the IDENTITY of two arrays – `runFatigueLadder` and `runFatigueLadderWta`.
// `runStrain` reads FIVE knobs (`condition.ts`: `matchFatigue.straightSets`,
// `tierMatchFatigue[tier]`, and whichever of the three ladders the tier's family and draw select),
// so a dial on the other three left a stale index in place and the whole cohort kept the strains it
// had. The cache's own note says it exists to stop exactly that: it broke twice before, first as a
// module-load snapshot, then keyed on one ladder only, and the third ladder arrived on 14.08
// (`84c7d12e`) without joining the key.
//
// ⚠ WHY THIS IS A CORRECTNESS TEST AND NOT A BALANCE ONE. On the shipped knobs the index is the
// same table either way – nothing a player reads moves, and no frozen hash does. What moves is what
// an A/B on one of those three knobs MEASURES: the kid's side reads the knobs live
// (`tournamentRunStrain`), the cohort's side read a cache that ignored them, so a sweep on
// `tierMatchFatigue` re-priced her and left 199 rivals where they were – half the game.
//
// ⭐ THE ORACLE IS THE KID'S OWN PRICE, NOT A NUMBER. `rival.ts`'s header states the contract this
// file witnesses – "a five-match J300 title costs a rival 5 x 6 + the ladder = 36, exactly what the
// kid would pay for the same five straight-sets wins at that tier". `tournamentRunStrain` is pure
// and unmemoised, so it answers on the LIVE knobs by construction: the left side of every assertion
// below goes through the memo and the right side cannot. No pinned strain, no re-implementation of
// `walkWindow`, and nothing to re-pin when a knob is legitimately retuned.
//
// ⚠ AND EVERY CASE PROVES ITS OWN DIAL MOVED before it reads the memo (CLAUDE.md: "before you
// believe a null result, prove the arm contains both the change and its reader"). A dial that does
// not move the kid's live price is a null arm, and it would make this test pass on a stale cache.
//
// THE MUTATION ARM, NAMED AND RUN (26.09): put the two-ladder identity key back in `runsIndex` –
//   `if (runsIndexCache && runsIndexCache.ladder === ladder && runsIndexCache.ladderWta === ladderWta)`
// – and all three knob cases go RED on the oracle line, each naming the knob it disagreed on.
import { describe, expect, it } from 'vitest'
import { tournamentRunStrain } from '../src/engine/condition'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { reconstructRun, rivalCondition } from '../src/engine/season/rival'
import type { SeasonResult } from '../src/engine/season/ranking'
import type { TierId } from '../src/engine/season/types'

/** The five knobs `runStrain` reads, as a mutable view – `as const` is compile-time only, and the
 *  repo's own benches patch these in place (`tools/season-equation.ts` `withDials`). */
type Knobs = {
  runFatigueLadder: number[]
  runFatigueLadderWta: number[]
  runFatigueLadderDeep: number[]
  matchFatigue: { straightSets: number; hardMatch: number; extraTiebreaks: number }
  tierMatchFatigue: Record<TierId, number>
}
const KNOB = ECONOMY.condition as unknown as Knobs

/** What the KID pays for the same run, on the knobs that are live right now. Unmemoised. */
function kidPrice(tier: TierId, matches: number): number {
  return tournamentRunStrain(tier, new Array<{ score?: string }>(matches).fill({}))
}

/** One rival's title at `tier`, two weeks before the week we read her at – so the walk has the
 *  played week and two recovery weeks inside the fatigue window, as a live tick would. */
const WEEK = 400
function titleRow(tier: TierId): SeasonResult {
  return { playerId: 'ai-x', week: WEEK - 2, points: TIERS[tier].points[0], tier }
}

/** The three dials, in the shape the repo's own instruments use them (the two in-place patches are
 *  `tools/season-equation.ts`'s surcharge and noDrain arms; the replacement is
 *  `tools/deep-run-cost.ts`'s). One tier per knob, chosen so the knob is actually on the path:
 *  w35 is a WTA 32-draw (ladderWta), j300 a junior one (ladder), slam the deep ladder's own rung. */
const CASES: { knob: string; tier: TierId; dial: () => () => void }[] = [
  {
    knob: 'tierMatchFatigue +3 on every rung, IN PLACE',
    tier: 'w35',
    dial: () => {
      const saved = { ...KNOB.tierMatchFatigue }
      for (const t of Object.keys(saved) as TierId[]) KNOB.tierMatchFatigue[t] = saved[t] + 3
      return () => {
        for (const t of Object.keys(saved) as TierId[]) KNOB.tierMatchFatigue[t] = saved[t]
      }
    },
  },
  {
    knob: 'matchFatigue.straightSets +2, IN PLACE',
    tier: 'j300',
    dial: () => {
      const saved = KNOB.matchFatigue.straightSets
      KNOB.matchFatigue.straightSets = saved + 2
      return () => {
        KNOB.matchFatigue.straightSets = saved
      }
    },
  },
  {
    knob: 'runFatigueLadderDeep replaced – the third ladder, which never joined the old key',
    tier: 'slam',
    dial: () => {
      const saved = KNOB.runFatigueLadderDeep
      KNOB.runFatigueLadderDeep = [...KNOB.runFatigueLadderWta, 9, 9]
      return () => {
        KNOB.runFatigueLadderDeep = saved
      }
    },
  },
]

describe('C-01 – the rivals’ run index is keyed on every knob its strain column reads', () => {
  it('the shipped knobs already agree: a reconstructed title costs the rival what it costs the kid', () => {
    // The contract at rest, on every rung. This is what makes the cases below about FRESHNESS
    // rather than about the reconstruction itself.
    for (const tier of Object.keys(TIERS) as TierId[]) {
      const run = reconstructRun(titleRow(tier))
      expect(run.strain, `${tier} title`).toBe(kidPrice(tier, run.matches))
    }
  })

  for (const c of CASES) {
    it(`⭐ a dial on ${c.knob} re-prices the COHORT, not just the kid`, () => {
      const row = titleRow(c.tier)
      // 1. Warm the index on the shipped knobs – a live tick has always read it before a bench dials.
      const shippedRun = reconstructRun(row)
      const shippedCondition = rivalCondition([row], 'ai-x', WEEK)
      expect(shippedRun.strain, 'the shipped reading').toBe(kidPrice(c.tier, shippedRun.matches))

      const restore = c.dial()
      try {
        // 2. THE ARM CONTAINS THE CHANGE: the dial moved the price the kid pays for this very run.
        //    Without this line a knob that did nothing would let a stale cache pass the next one.
        expect(kidPrice(c.tier, shippedRun.matches), 'the dial must move the kid’s live price').toBeGreaterThan(
          shippedRun.strain,
        )
        // 3. THE ASSERTION C-01 IS ABOUT: the memo answers on the dialled knobs, not the warm ones.
        const dialled = reconstructRun(row)
        expect(dialled.strain, `${c.knob}: the rival’s strain after the dial`).toBe(kidPrice(c.tier, dialled.matches))
        // 4. And it reaches the reader the engine actually calls: more drain per match cannot leave
        //    a rival FRESHER than she was on the cheaper knobs.
        expect(rivalCondition([row], 'ai-x', WEEK), 'her derived condition after the dial').toBeLessThan(
          shippedCondition,
        )
      } finally {
        restore()
      }
      // 5. Nothing leaked: the shipped reading is back, by the same two routes.
      expect(reconstructRun(row).strain, 'restored strain').toBe(shippedRun.strain)
      expect(rivalCondition([row], 'ai-x', WEEK), 'restored condition').toBe(shippedCondition)
    })
  }
})
