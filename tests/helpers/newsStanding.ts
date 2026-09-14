// ⭐⭐⭐ THE STANDING, POSED – the owner's D1 (14.09): «вот уже с топ-200 можно иногда начинать
// что-то говорить, а в топ-100 так и вполне уверенно, прямая аналогия – спонсорская лестница».
// `newsStandingOf` (world/spotlight.ts) reads TWO facts and this helper poses exactly those two:
// live professional points (`kidPoints(world, 'wta') > 0` – the «unranked is not rank one» belt)
// and the cached rank against `ECONOMY.spotlight.newsRankKnown` / `newsRankNoticed`.
//
// ⚠⚠ THE ROW'S SHAPE IS DELIBERATE, FIELD BY FIELD. `points: 10` is exactly `RANKABLE_MIN.points`,
// the smallest single-row total the professional table counts at all (season/ranking.ts – below it
// `rankableTotal` folds her to 0 and the standing stays quiet however the rank is set). `tier:
// 'wta250'` sits BELOW `stageTierMin`, so the row can never be read back as a `'publicLoss'`
// exposure event by the very suites that pose it – the fixture opens the gate without also standing
// in the light. And the WEEK is the caller's, because `kidPoints` folds a rolling 52-week window
// (`WINDOW_BY_TRACK.wta`): the row counts only while `week <= world.week <= week + 52`, so a sweep
// longer than the window has to lay rows along its path – one call per stretch.
//
// ⚠ THE RANK IS WRITTEN, NEVER FOLDED – `world.kidRankWta`'s one engine writer is `recomputeKidRank`
// and nothing these suites drive (`rollLeak`, `airBoothMention`, `resolveBodyAndPlanner`) ever calls
// it, so the number set here is the number the standing reads for the fixture's whole life. 50 and
// 150 sit mid-band on purpose: a re-tune of either bar by ±20 moves neither fixture across a line.
// For `'quiet'` the rank is 999 – past every bar – and NOTHING else is touched, so a quiet world
// stays quiet even if some other fixture line gave her points.
//
// ⚠⚠ AND THE ROW IS **VERIFIED AGAINST THE REAL FOLD**, NEVER TRUSTED – the marker-helper law
// (tests/helpers/source.ts: everything THROWS on an absent marker) applied to a fixture: a row the
// window has silently dropped would leave the gate shut and every «she is known» case downstream
// proving the wrong thing with a green tick. The check is `kidPoints` ITSELF – the exact fold
// `newsStandingOf` reads – asked through a view of the world parked at the caller's `week`, so the
// question is «does the fold count this row AT THE WEEK THE SUITE ASKS ABOUT», not «at wherever
// `world.week` happens to sit while the fixture is still being assembled» (the leak suite lays rows
// along a sweep BEFORE walking it, so the live week at call time is the wrong clock to check on).
// One spelling, no drift: re-spelling the fold's five arguments here would be the two-currencies
// defect the ladder file exists to prevent.
import { KID_ID, kidPoints } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'

export function standHerAt(world: WorldState, band: 'quiet' | 'noticed' | 'known', week: number): void {
  if (band === 'quiet') {
    world.kidRankWta = 999
    return
  }
  world.results.push({ playerId: KID_ID, week, points: 10, tier: 'wta250' })
  world.kidRankWta = band === 'known' ? 50 : 150
  // The belt, proven live for THIS row at THIS week – see the ⚠⚠ above. A shallow view is enough:
  // `kidPoints` reads `world.week` and `world.results`, and the spread shares the ledger array.
  if (kidPoints({ ...world, week }, 'wta') <= 0) {
    throw new Error(`standHerAt: the fold does not count the row at week ${week} – the fixture would pose a shut gate`)
  }
}
