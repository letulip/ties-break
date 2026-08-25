// ⭐⭐⭐ THE TOUR HAS A VOICE – the professional field's succession, said out loud (round 26 #10).
//
// THE OWNER, 24.08: «В новостях во время колледжа вообще пустота, как будто мир умер, мы вроде
// делали, чтобы он жил, при том, что даже в highlights на результатах есть какие-то события».
//
// ⚠⚠ THE WORLD WAS NEVER DEAD, AND THE INVENTORY IS THE FINDING. Measured over five careers ×
// four college years (`tools/college-news-probe.ts`, 25.08): the freeze WRITES 3,616 rows in 1,040
// weeks and 799 of them reach the news list – 0.77 a week, on 49% of the freeze's weeks, and the
// Home card at rest holds 15 rows over 9 week groups with 10 of them about the field. Not one rest
// state in forty was empty. So nothing is being filtered out and nothing is missing from the tick:
// what the feed says is «🏆 <a name> won the World Tour 500» twenty-nine times a season, and a
// stranger winning a tournament is the same sentence whether or not the world behind it moved.
//
// ⭐ AND THE WORLD BEHIND IT MOVES A LOT. `docs/backlog/the-living-world.md` and the field's own
// audit put it at ~120 retirements a season across 1,600 chairs, with the whole professional
// population turning over inside a career. `season/fieldPros.ts` has carried that since W4-LIVES –
// every chair holds a PERSON with a debut age and a retirement age, and `careerAt` walks the
// succession – and no sentence in the game has ever mentioned it. This module is that sentence.
//
// ⚠ THE ROW BUDGET IS A CONSTANT, NOT AN EMERGENT PROPERTY (`docs/plans/the-living-world-build.md`
// §5: «Feed budget: EVENTS_CAP 400, feed already takes ~364 a season – +~5 lines fits,
// all-retirements (~120) does not»). At most `FIELD_NEWS.farewellsPerSeason` named farewells plus
// one turnover line plus one intake line = 5 rows a season, 20 over a four-year freeze. None of
// them is `keep`, so `pruneEvents` sacrifices them exactly as it sacrifices a champion line and her
// own history can never be pushed out by the tour's.
//
// ⚠ ZERO MAIN DRAWS. `careerAt` and `fieldProsFor` are pure functions of (seed, chair, season) that
// re-derive their own purpose-scoped sub-streams at the call site; `rankingFor` is a fold. The
// frozen capture (41550 / e6b0c709) is untouched by construction.
//
// ⚠ NEWS IS NEWS AND NOT RESULTS. Nothing here writes a point, a cheque or a result row – which is
// the freeze's own law (no ranking points, no prize money, nothing that makes college a tour), and
// it is also simply what this module is: two `addEvent` calls with no `amountCents`.
import { formatShortName } from '../../shared/format'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { FIELD, careerAt } from '../season/fieldPros'
import { addEvent, seasonIndexOf } from './ledger'
import { fieldProsOf, rankingFor } from './ladder'
import type { WorldState } from '../world'

/** ⭐ HOW LOUD THE TOUR IS ALLOWED TO BE. Every number here is a feed-budget decision and lives in
 *  one place for the reason `ECONOMY` exists: a literal buried in a string template is a balance
 *  choice nobody can find. */
export const FIELD_NEWS = {
  /** How well a departing professional has to have been doing for the farewell to name her. The
   *  junior conveyor's `NOTABLE_DEPARTURE_RANK` is the same number for the same reason, one table
   *  down – somebody the player has plausibly seen in the standings or across a net. */
  notableRank: 50,
  /** ...and how many of them one season may name. ~4 a season clear the bar at 1,600 chairs over
   *  ~13-season careers; three is the plan's «+~5 lines fits» with the two summary rows beside it. */
  farewellsPerSeason: 3,
  /** The depth the turnover line reports churn at – the number `world-turnover.ts` measures and the
   *  one a reader can hold ("the top hundred"). */
  churnDepth: 100,
} as const

/** THE LAST WEEK OF A SEASON – where a farewell belongs, and the one week on which the season that
 *  is ending is still the LIVE one. Everything the farewell says is therefore read off the table the
 *  player has been looking at all year rather than reconstructed from a season that is already gone;
 *  a reconstruction would have to re-derive the field under a cohort that has since been renewed,
 *  and `fieldProsFor` resolves name collisions against exactly that list. */
export function isFieldFarewellWeek(week: number): boolean {
  return week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 1
}

/** Who is sitting in chair `n` this season and not next season – the succession, asked of the one
 *  function that owns it. Pure in (seed, n, season): a chair turns over exactly when the career
 *  index under it changes. */
function retiresAfter(seed: string, n: number, season: number): boolean {
  return careerAt(seed, n, season).index !== careerAt(seed, n, season + 1).index
}

/** ⭐⭐ THE FAREWELLS – fired on the last week of every season, in college and out of it.
 *
 *  ⚠ NOT GATED ON THE FREEZE, AND THAT IS THE POINT. The tour turns over whether or not she is
 *  watching, so a line that only spoke while she was at a university would be college wearing the
 *  world's clothes. What the freeze changes is that these four seasons have nothing else in them –
 *  which is why the silence was noticed there first.
 *
 *  ⚠ NO PRONOUN NAMES A PROFESSIONAL, the rule every world-news string in this codebase keeps
 *  (R15-7's reasoning, applied to the field: `announceTourChampion` and the junior intake line are
 *  both written this way). Ages and seasons are facts; "she" is not needed to state either. */
export function announceFieldFarewells(world: WorldState): void {
  const season = seasonIndexOf(world.week)
  const pros = fieldProsOf(world)
  // The merged table AS DISPLAYED this week – the same fold the Stats standings and every
  // acceptance cut read, so the number in the sentence is the number on the screen.
  const rank = new Map(rankingFor(world, 'wta').map((r) => [r.playerId, r.rank]))
  const leaving = pros.filter((p) => retiresAfter(world.seed, chairIndexOf(p.id), season))
  if (leaving.length === 0) return

  // ⭐ THE NAMED ONES, best-ranked first. `formatShortName` is the form the champion lines have been
  // using all season, so a farewell names somebody the way the feed already named her.
  const notable = leaving
    .map((p) => ({ pro: p, rank: rank.get(p.id) ?? Number.MAX_SAFE_INTEGER }))
    .filter((x) => x.rank <= FIELD_NEWS.notableRank)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, FIELD_NEWS.farewellsPerSeason)
  for (const { pro, rank: r } of notable) {
    const seasons = season - careerAt(world.seed, chairIndexOf(pro.id), season).debutSeason + 1
    addEvent(world, {
      week: world.week,
      type: 'info',
      text:
        `👋 ${formatShortName(pro.name)} (#${r}) has played a last match on tour – retiring at ${pro.ageYears}` +
        ` after ${seasons} ${seasons === 1 ? 'season' : 'seasons'}.`,
    })
  }

  // ⭐ ...AND THE SIZE OF IT, which is the fact the named three cannot carry. ~120 a season across
  // 1,600 chairs is the whole professional population turning over inside one career, and the
  // top-`churnDepth` count is «where the field moved» stated as a number a reader can hold.
  const churn = leaving.filter((p) => (rank.get(p.id) ?? Number.MAX_SAFE_INTEGER) <= FIELD_NEWS.churnDepth).length
  addEvent(world, {
    week: world.week,
    type: 'info',
    text:
      `The tour turns over: ${leaving.length} professionals retire at the end of this season` +
      `${churn > 0 ? `, ${churn} of them from the top ${FIELD_NEWS.churnDepth}` : ''}.`,
  })
}

/** ⭐⭐ ...AND WHO TOOK THE CHAIRS – fired on the season boundary, after `turnOverField` has renewed
 *  the junior cohort, because `fieldProsOf` resolves the field's name collisions against exactly
 *  that list and the new season's field has to be derived under the new season's names.
 *
 *  ONE row. The debutantes are identified by `careerAt`, not by comparing two fields: a career whose
 *  `debutSeason` is this season is a person who was not on the table last year, which is the same
 *  question the farewell above asks from the other side. */
export function announceFieldIntake(world: WorldState): void {
  const season = seasonIndexOf(world.week)
  const pros = fieldProsOf(world)
  const debutants = pros.filter((p) => careerAt(world.seed, chairIndexOf(p.id), season).debutSeason === season)
  if (debutants.length === 0) return
  const rank = new Map(rankingFor(world, 'wta').map((r) => [r.playerId, r.rank]))
  const best = debutants.reduce((a, b) =>
    (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) <= (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER) ? a : b,
  )
  const bestRank = rank.get(best.id)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text:
      `${debutants.length} players have joined the professional tour this season` +
      `${bestRank === undefined ? '.' : ` – the highest-placed of them is ${formatShortName(best.name)} at #${bestRank}.`}`,
  })
}

/** `fp-137` -> 137. The chair number is the only thing `careerAt` takes, and it is carried in the id
 *  rather than on the row (`FieldPro` is a player, not a seat). `isFieldProId`'s prefix, sliced. */
function chairIndexOf(id: string): number {
  return Number(id.slice(FIELD.idPrefix.length))
}
