// THE TOURNAMENT PREVIEW – what the Season card can honestly say about an event she has not played.
//
// Three things, and they answer to different standards of truth:
//
//   1. HER CHANCE IN ROUND ONE. A real number, not a mood. The engine already owns a closed-form
//      match probability (`fastMatchProbability`, which is what resolves every AI-vs-AI match), and
//      it already builds each event's field deterministically. So the preview builds the field the
//      same way the bracket will, draws her into it with the SAME shared helper, and asks the same
//      formula who wins. Nothing here is a model of the model.
//
//   2. HOW STRONG THE FIELD IS. Words, because a second percentage on the same card would be two
//      numbers competing to say one thing.
//
//   3. THE WEATHER. Decorative, and labelled as such (the owner: «пока декоративно рандомно»). It
//      touches nothing the simulation reads.
//
//   4. THE CROWD. Decorative too, and built to the weather's pattern rather than a second one of
//      its own (the owner: «можно как-то прикинуть какие-то коридоры для разного уровня турниров»).
//      A corridor per tier, so the ladder can be FELT on a card. It touches nothing either – see
//      the warning on `eventCrowd`, which is the whole point of the field existing at all.
//
// WHAT THE PREVIEW CANNOT KNOW, and says so in its own type: the field is drawn from the standings
// AS THEY ARE TODAY. By the time the event plays they will have moved - other girls will have won
// and lost. That makes this an estimate about a field she would meet if it started now, which is
// the information the PLAYER has when deciding whether to enter. Never a prophecy.
//
// ⭐⭐ AND SINCE ROUND 31 #4 IT NO LONGER PRINTS ONE. The paragraph above was true and the card did
// not read as though it were: an estimate about a field can be quoted as a percentage, but the same
// estimate quoted as a NAME is a promise, and the name changed every week. So the opponent and the
// percentage now wait for the draw - see `DRAW_LEAD_WEEKS` below for the owner's ruling, the
// measurement, and why nothing needed to be persisted to keep them still.
//
// WHO TURNS UP AND HOW STRONG THEY ARE ARE TWO QUESTIONS, and the preview answers them from two
// different places. The bracket now gates entry on condition exactly as the kid is gated (a wrecked
// rival sits the week out), so WHO is in the draw depends on today's fatigue - and the preview must
// use it, or it would name an opponent who will not be there. HOW STRONG they are is the next
// paragraph: rested, always.
//
// THE FIELD IS PREVIEWED RESTED, and that is a correction, not a simplification. The first version
// scaled every opponent by her condition TODAY, which sounded more truthful and was much less so:
// measured over 10 careers at week 40, the elite band's median condition is 10 out of 100 and it is
// at or below 5 in 45% of weeks, so a J30 card eight weeks out read 81% when the same draw against a
// rested field reads 52%. Their exhaustion today says nothing about their condition on a week that
// has not happened; quoting it turns a transient into a promise, and the transient is enormous.
// So opponents are previewed at full condition: "this is who is there, and this is her chance
// against them at their best". The card understates rather than flatters.
//
// RNG DISCIPLINE. Every draw that builds the FIELD comes off `seed:kidtour:<eventId>` - the event's
// own sub-stream, created fresh, read, and thrown away. Building a preview cannot move the MAIN
// weekly stream, so the frozen capture is untouched; and because it is the same stream in the same
// order as the real run, a preview taken on the event's own week names the opponent she actually
// gets. The two decorative readings take the same discipline one step further: each has its OWN
// purpose-scoped sub-stream (`seed:weather:`, `seed:crowd:`), so decoration cannot perturb even the
// draw, let alone the world.

import { rngFromSeed } from '../rng'
import { ECONOMY } from '../economy'
import { fastMatchProbability } from '../match/engine'
import { chanceFromRatings, ratingOf } from '../match/rating'
import type { MatchPlayer, Surface } from '../match/types'
import { rivalConditions, rivalMatchPlayer } from './rival'
import { TIERS, isTierAgeOpen } from './calendar'
import {
  JUNIOR_TOUR,
  buildDraw,
  firstRoundOpponent,
  isEntrantBand,
  kidSeedIndexIn,
  selectEntrants,
} from './tournament'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from './types'
import type { SeasonResult } from './ranking'

/** How the field she would meet compares with her. Three bands, because a card has room for one
 *  short clause and the player only needs to know which way to lean. */
export type FieldStrength = 'favourite' | 'even' | 'strong'

/** ⭐⭐ ROUND 31 #4 – HOW MANY WEEKS BEFORE AN EVENT ITS DRAW IS MADE, and it is the whole of the
 *  fix the owner asked for.
 *
 *  HIS COMPLAINT, 31.08: «каждую неделю это другой турнир с другой соперницей в первом круге –
 *  разве такое бывает в реальности? по-моему они точно знают с кем будут играть в первом туре и
 *  этот персонаж не меняется» (his words are kept in docs/rounds/round-31.md, where the Russian
 *  belongs). Measured on his own w933 save with tools/r31-draw-stability.ts: **20 of 24 tournaments
 *  changed their round-one opponent** while he watched them, the largest single swing 40 points of
 *  chance. Nothing was broken about the RNG – `drawnField` below is rebuilt on every read, and
 *  `ranking` and `conditions` are TODAY's, so a card six weeks out was answering a question about a
 *  field that has not been picked yet and printing the answer as a NAME. A player reads a name as a
 *  commitment.
 *
 *  ⚠ THE FIX IS NOT TO FREEZE THE ANSWER, IT IS TO STOP ASKING THE QUESTION. His own ruling:
 *  «можно писать, что жеребьевки еще не было, а потом (когда она происходит за 1 неделю, 2, 3?)
 *  прямо на карточке турнира писать имя и ранг соперницы на 1й круг». So a far-out card says the
 *  draw has not been made and shows only the FIELD STRENGTH band; the name appears at week − 1.
 *
 *  ⚠ WHY ONE WEEK AND NOT THREE. Entries close at the END of week − 2 (`makeEvent`'s
 *  `deadlineWeek`), so a draw at week − 1 lands the week AFTER he has committed: he chooses on the
 *  band and then learns the opponent, which is both how a real entry list works and the better
 *  scene. It also makes the name STRUCTURALLY unable to re-roll rather than merely unlikely to:
 *  `upcomingEvents` shows a card while `e.week > world.week`, so week − 1 is the LAST week a card
 *  exists at all and a named opponent is therefore read at exactly one week, once.
 *
 *  ⚠⚠ AND NOTHING IS PERSISTED, WHICH IS DELIBERATE AND WAS CHECKED BEFORE IT WAS CHOSEN. Freezing
 *  the draw on the entry would have been a save-schema move AND a change to `buildKidTournament`,
 *  whose brackets are pinned by the frozen career hashes in tests/coach-travel-edge.test.ts – a
 *  balance change dressed as a readout fix. The band was measured stable as it stands – 0 of 24
 *  events moved over six weeks on the owner's w933 save, with all three bands present – so the
 *  honest fix touches no stored byte, no bracket and no stream.
 *
 *  ⭐ THIS IS NOT A NEW IDEA, IT IS A THIRTEEN-MONTH-OLD RECOMMENDATION FINALLY SHIPPED.
 *  docs/specs/preview-odds-honesty.md §4.2 (31.07): "Keep the named opponent for the event's OWN week
 *  only… Before that week, naming an opponent is naming someone she has a 72% chance of never
 *  meeting." §6 of that file records what shipped, what the owner overruled, and the one gap this
 *  did NOT close – the week − 1 name still disagrees with the bracket's on 59.2% of draw-week cards,
 *  because the two fold the rivals' condition at different weeks (tools/r31-draw-promise.ts). That
 *  is a decision for him, and closing it moves brackets. */
export const DRAW_LEAD_WEEKS = 1

export interface EventPreview {
  /** ⭐ HAS THE DRAW BEEN MADE (round 31 #4)? False on every card further out than
   *  `DRAW_LEAD_WEEKS`, and while it is false there is no opponent and no percentage – see the
   *  note on the constant. It is carried as its own fact rather than left to be inferred from a
   *  null so a screen has to ask the question in the language the owner asked it in. */
  drawMade: boolean
  /** her probability of winning the FIRST match, 0..1 – the only round a preview can speak for
   *  without simulating a whole bracket, and the round that decides whether the trip was worth it.
   *  ⚠ NULL, NOT ZERO, when there is nobody to play: before the draw is made, and on the (unreached)
   *  card where she is not in her own bracket. Zero is a real reading and this is the absence of
   *  one, and the type is what stops a screen printing "0%" for "we do not know yet". */
  firstMatchChance: number | null
  /** the opponent that chance is against, so the card can name her rather than assert a number */
  opponentName: string
  opponentRank: number | null
  /** ⚠ THE TWO NUMBERS THE CHANCE IS MADE OF (round 21, the owner's D&D ruling: «шансы выиграть
   *  должны быть у всех, но не у всех одинаковые», and «чтобы игрокам не биться головой в бетон»).
   *
   *  `firstMatchChance` above is a percentage the player has no way to check. These are its INPUTS,
   *  on the surface this event is played on, and they satisfy
   *      firstMatchChance = 1 / (1 + 10^((opponentRating - kidRating) / 400))
   *  to inside a percentage point over the whole reachable build range (tests/rating.test.ts).
   *
   *  ⚠⚠ AND NOTHING DRAWS THEM. THIS IS A RULING, NOT DEAD CODE THAT NOBODY NOTICED. The «Rating
   *  1642 vs 1801» line under the odds ring lived on the calendar card and the season card for two
   *  commits; the owner took it off, round 21: «я не просил этого делать, лишняя информация, убери
   *  пожалуйста». The full argument is at the top of engine/match/rating.ts – in short, he asked for
   *  the odds to BE a formula, not for the card to print one.
   *
   *  They are computed anyway, and on purpose: they are the audit trail of the ring beside them (one
   *  source, two readings, so a quoted rating can never disagree with the percentage it explains),
   *  they cost two pure calls on a preview that already ran the match model, and the day a surface is
   *  wanted the pipe is already built and already measured. ⚠ If the answer is instead "take the pipe
   *  out too", that is a second decision and it is his, not a tidy-up.
   *
   *  Null when there is no first-round opponent to be rated against. */
  kidRating: number
  opponentRating: number | null
  fieldStrength: FieldStrength
  /** ⭐⭐ ROUND 34 #5 – HER CHANCE AGAINST THIS RUNG'S FIELD, 0..1, and the ONE number a card can
   *  honestly print before its draw exists. It is `fieldStrength`'s own quantity un-banded (see
   *  `fieldChance`), so the percentage and the sentence beside it are one reading, not two.
   *
   *  ⚠ IT IS ABOUT A LEVEL, NOT ABOUT A GIRL, AND THE TWO MUST NOT BE PRINTED UNDER ONE LABEL.
   *  `firstMatchChance` above answers «will she beat THIS opponent»; this answers «how does she
   *  match up against who plays at this rung». They are different questions with different
   *  volatility, which is exactly why the second one survives being planned against – so a surface
   *  drawing both has to say which it is showing (`fieldChanceLabel` in composables/eventCard.ts).
   *
   *  ⚠ NULL when the rung fields nobody this preview can rate – the same absence-of-a-reading
   *  `firstMatchChance` uses, never a 0 and never a 0.5. */
  fieldChance: number | null
  /** decorative, deterministic per event; degrees C */
  temperatureC: number
  /** decorative, deterministic per event; how many people are there to watch – see eventCrowd */
  crowd: number
}

/** The kid's slot is the one `runTournament` gives her. The two share `buildDraw` outright – the
 *  preview cannot call `runTournament`, which PLAYS the bracket, but it must not build a second one
 *  either, so the draw is one function and both callers pass it the same stream at the same
 *  position. */
function drawnField(
  event: SeasonEvent,
  cohort: AiPlayer[],
  ranking: RankingRow[],
  conditions: ReadonlyMap<string, number>,
  kid: MatchPlayer,
  seed: string,
  excluded: ReadonlySet<string> | undefined,
  /** ⭐ ROUND 31 #3 – and it is the SECOND table, exactly as `computeShadowTournament` takes one.
   *  `selectEntrants` above positions the CANDIDATES (`ranking`); `kidSeedIndexIn` below positions
   *  HER, and the bracket has read those two off different tables since round 21 #4. See
   *  `previewEvent`'s `standing` parameter for the full argument. */
  standing: RankingRow[],
): MatchPlayer[] {
  const rng = rngFromSeed(`${seed}:kidtour:${event.id}`)
  // `conditions` decides WHO is drawn (the same availability gate the bracket applies); the max
  // below decides how strong they are. See the two notes at the top of this file.
  const entrants = selectEntrants(event, cohort, ranking, rng, conditions, excluded).map((p) =>
    rivalMatchPlayer(p, event.surface, ECONOMY.condition.max),
  )
  return buildDraw(event, entrants, kid, kidSeedIndexIn(entrants, standing, kid.id), rng)
}

/** ⭐⭐⭐ THE TIER'S OWN EXPECTED FIELD – who plays at this RUNG, rated at full condition and sorted
 *  strongest first. It is the population `strengthOf` below reads, and it is deliberately NOT the
 *  field `drawnField` above builds.
 *
 *  ⚠⚠ WHY A SECOND POPULATION EXISTS AT ALL, and it is the one number round 31 #3 made worse. The
 *  band is the ONLY thing a card says before week − 1 (see `DRAW_LEAD_WEEKS`), so it is the thing the
 *  owner plans on: «эта полоса тоже должна быть более-менее статична … может быть игрок планирует
 *  турниры и выбирает более выгодные для себя». `drawnField` cannot carry that weight and never
 *  claimed to – its own header says the field is drawn *"from the standings AS THEY ARE TODAY"* – so
 *  a share counted over 31 freshly drawn entrants moves when next week's redraw swaps one of them.
 *  Measured with tools/r31-draw-stability.ts on the owner's w933 save: **3 of 24** tournaments showed
 *  him two different bands over six weeks, against 0 of 24 the week before. The granularity is the
 *  whole story – 1/31 is 3.2%, and a field sitting one player from the 0.35 threshold crosses it on a
 *  coin toss.
 *
 *  ⭐ SO THE BAND STOPPED ASKING ABOUT A DRAW AND STARTED ASKING ABOUT A RUNG, which is the question
 *  it was always answering in words: *"how strong is the field at this level, compared with her"*.
 *  Nothing that rebuilds weekly enters this function – no standings table, no fatigue gate, no
 *  per-event die. What it reads is the three things that DEFINE a rung's field, straight off the
 *  tier's own definition and in the order `selectEntrants` applies them:
 *
 *    1. `isTierAgeOpen` – the universe (a J rung is U18, a W rung is 14+).
 *    2. `entrantPctBand` – the slab of that universe the rung draws from, read here off a table
 *       sorted by STRENGTH rather than by standings position. That substitution is the whole of
 *       round 31 #3 carried one storey up: measured on w933 the Spearman between standings position
 *       and actual rating is 0.11 on the ITF table and 0.64 at best on any of the four, so a
 *       percentile window on a standings table does not select a strength band. On a rating table it
 *       does, by construction – which is also what makes the rungs a LADDER rather than an 87-point
 *       scatter (docs/specs/tier-ladder-and-band.md §2).
 *    3. `drawSize` – and the head of the window, not the whole of it, because that is what the draw
 *       takes. `selectEntrants` keys candidates on `position + rng × drawSize` and slices `drawSize`
 *       off the front, so the players who actually turn up are the STRONG end of the band. Reading
 *       the whole window would price a Local Open at its weakest ninety instead of the eight it
 *       fields, and the band would flatter her against a ring drawn from the eight – measured, it
 *       costs the word `strong` entirely (0 of 44 observations on the owner's w933 save).
 *
 *  ⚠ THE HEAD IS **TWICE** THE DRAW, AND THAT IS THE JITTER'S OWN REACH RATHER THAN A SAFETY MARGIN.
 *  `key = position + rng() × drawSize` on consecutive positions means a candidate can enter from up
 *  to `drawSize` places below the cut and can be displaced from up to `drawSize` places above it, so
 *  the players who CAN turn up are the top `2 × drawSize` of the window – and the availability gate's
 *  backfill (`selectEntrants`' "a wrecked elite hands its slots to the tier below") reaches further
 *  down still. Slicing exactly `drawSize` would model the MODE of the draw; this models its
 *  EXPECTATION, which is the honest population for a question asked before the draw exists.
 *  ⚠ It is also the smoother of the two, and that is a consequence rather than the reason: a slab of
 *  `drawSize` at one percentile is only ~90 rating points wide, so it AMPLIFIES a shift in the world
 *  (the conveyor's annual turnover moved the domestic slab 11 points and the top-`drawSize` field 16),
 *  while the doubled slab tracks it one for one. Measured across every card on the w933 save, the
 *  band moves on 2 of 24 tournaments at `drawSize` and **0 of 24** at twice it.
 *
 *  ⚠ IT IS A MODEL OF THE SELECTION, NOT OF THE DRAW, and the two things it deliberately leaves out
 *  are exactly the two that move weekly: the availability floor (a wrecked elite hands its slots
 *  down – real, but it is this week's fatigue) and the position jitter (a real die, but a die).
 *  Leaving them out is what makes the answer hold still; §7 of the spec records that gating on
 *  availability was measured WORSE (4 of 24) when it was tried the other way round.
 *
 *  ⚠ THE ONLY THING LEFT THAT CAN MOVE IT IS THE WORLD ITSELF – the conveyor retiring a professional
 *  and landing a thirteen-year-old, and `driftCohort` nudging everybody's skills. That drift is real
 *  and it is slow, and it must NOT be frozen out with a constant table: measured over one career the
 *  same rung's expected field climbs from 1477 at week 10 to 1593 at week 450 and 1581 at week 933
 *  (local), and a J300's from 1735 to 1840. A table of constants would read the world of week 10 for
 *  the rest of a career. */
export interface RatedEntrant {
  ageYears: number
  rating: number
}

/** Every player in `cohort` rated on `surface` AT FULL CONDITION, strongest first.
 *
 *  ⚠ RESTED, for the reason the header states for the drawn field and `strengthOf` states for her:
 *  *"Their exhaustion today says nothing about their condition on a week that has not happened"*. A
 *  rating table folded on today's fatigue would put the whole elite at the bottom of it.
 *
 *  ⚠ EXPORTED SO THE CALLER CAN PAY FOR IT ONCE. It is a fold over the whole cohort and every card
 *  in a snapshot shares it per surface; `previewEvent` will build its own if nobody hands it one, so
 *  a bench or a test still gets the right answer without knowing the memo exists. */
export function ratedField(cohort: readonly AiPlayer[], surface: Surface): RatedEntrant[] {
  return cohort
    .map((p) => ({
      ageYears: p.ageYears,
      rating: ratingOf(rivalMatchPlayer(p, surface, ECONOMY.condition.max), surface, JUNIOR_TOUR),
    }))
    .sort((a, b) => b.rating - a.rating)
}

/** How far past a rung's `drawSize` the entry jitter can reach – see rule 3 above. It is the ratio
 *  `selectEntrants`' own key is built on (`position + rng() × drawSize`, lowest `drawSize` taken),
 *  not a tuned number. */
const ENTRY_JITTER_REACH = 2

/** The ratings of the field `tier` is expected to field, out of a `ratedField` table. See the note
 *  above for the three rules and why they are these three. */
export function tierExpectedField(tier: TierId, rated: readonly RatedEntrant[]): number[] {
  const ofAge = rated.filter((p) => isTierAgeOpen(tier, p.ageYears))
  const total = ofAge.length
  if (!total) return []
  // Percentile from position exactly as `selectEntrants` reads it: (position + 1) / total, on a
  // table whose position IS strength here. The fallback to the whole of-age universe is the same
  // fillability escape the selection has – a window that cannot fill a draw is not a window.
  const window = ofAge.filter((_, i) => isEntrantBand(tier, (i + 1) / total))
  const pool = window.length ? window : ofAge
  return pool.slice(0, TIERS[tier].drawSize * ENTRY_JITTER_REACH).map((p) => p.rating)
}

/** How the field at this rung compares with her. `strong` = most of them are ahead of her,
 *  `favourite` = most are behind. The thresholds are deliberately coarse: this is a lean, not a
 *  measurement, and the number beside it is the one that has to be right.
 *
 *  ⭐⭐⭐ ROUND 31 #3 – IT COUNTS WHO IS BETTER, NOT WHO IS RANKED HIGHER, AND THE TWO THRESHOLDS
 *  DID NOT MOVE ONE POINT. This used to read a STANDINGS TABLE, and the round's defect (b) is what
 *  that costs: on the owner's w933 save a thirty-one-year-old professional sits **199 of 200** in
 *  the ITF table – her junior points expired thirteen years ago – so every junior and every
 *  domestic card read `strong` against fields she outrates by 120 points, and the promise probe
 *  reported `DEGENERATE: only one band occurs in these careers`.
 *
 *  ⚠⚠ AND RE-SCALING 0.75/0.35 WOULD HAVE BEEN EXACTLY THE WRONG FIX, because the bands were never
 *  mis-cut – they were being applied to a quantity that does not measure the thing. Measured over
 *  the cohort on that save, the Spearman between a player's STANDINGS POSITION and her actual
 *  rating is **0.11** on the ITF table, 0.53 on the table the bracket selects from, 0.59 on the
 *  domestic one and 0.64 on the professional one. Not one of the four tables answers "who is
 *  better" well, and a wider threshold on a bad proxy just spreads the labels out over noise.
 *
 *  ⭐ SO IT READS THE SAME SOURCE THE RING BESIDE IT IS MADE OF. `ratingOf` on this event's surface
 *  is what `fastMatchProbability` plays the match with and what `kidRating` / `opponentRating`
 *  already quote – the file's own rule is *"one source, two readings, so the card can never quote a
 *  rating that disagrees with the ring beside it"*. This is the third reading of that one source,
 *  which is what makes band-versus-ring agreement STRUCTURAL rather than hoped for: the ring is a
 *  function of (her rating − the opponent's), the opponent is drawn out of the very window this
 *  field is the head of, and both are read off the same `ratingOf`. tests/preview.test.ts asserts
 *  the pair cannot contradict and mutates to prove the assertion bites.
 *
 *  ⚠⚠ AND SHE IS READ RESTED, WHICH IS THE OTHER HALF OF A RULE THIS FILE ALREADY STATES AND WAS
 *  ONLY APPLYING TO THE FIELD. The header's own paragraph – *"THE FIELD IS PREVIEWED RESTED, and
 *  that is a correction, not a simplification… Their exhaustion today says nothing about their
 *  condition on a week that has not happened; quoting it turns a transient into a promise"* – is
 *  exactly as true of HER. `kid` arrives with `conditionMatchFactor(world.condition)` already
 *  multiplied into her five attributes, so a rating-based band read off it would move every time she
 *  got tired.
 *
 *  ⚠ THE RING IS DELIBERATELY NOT CHANGED. `firstMatchChance` is her chance in a match she would
 *  play in the state she is in, and the owner's card has quoted it that way since wave 2; what moves
 *  here is the BAND, which is a statement about the FIELD's level relative to her own and has no
 *  business asking how tired she was the week he happened to look. `kidAtRest` defaults to `kid`, so
 *  a caller that does not distinguish them gets the pre-change reading.
 *
 *  ⚠ THE FIELD IT READS IS THE **TIER'S**, NOT THIS WEEK'S DRAW – see `tierExpectedField` above for
 *  why, and docs/specs/tier-ladder-and-band.md §7 for the 3-of-24 measurement that moved it there.
 *  That is what makes the band hold still while the ring moves.
 *
 *  ⭐⭐⭐ AND IT IS AN EXPECTED CHANCE, NOT A HEADCOUNT – the last of the three changes and the one
 *  that finally made the word stand still. Counting the share of the field above her sounds like the
 *  plainer question and is a far sharper instrument than the thing it measures: a rung's expected
 *  field is only about ninety rating points wide across thirty-two players, so ONE player is 3.1% of
 *  the share and less than three rating points. Measured on the owner's w933 save, the conveyor's
 *  annual turnover (`season/conveyor.ts` retiring and replacing 18 of 199 players in the rollover
 *  week) moves the domestic slab by **13 rating points** – and a headcount inside that slab turned
 *  those 13 points into a share swing of 0.813 → 0.500, which crossed a threshold and put two
 *  different words on a card he was planning against. The world moving one per cent should not move
 *  a word by a third.
 *
 *  ⭐ SO IT ASKS THE RING'S OWN QUESTION OF THE WHOLE FIELD: *her mean chance against the players
 *  this rung is expected to field*. `chanceFromRatings` is the formula the card's percentage already
 *  satisfies to inside a point (tests/rating.test.ts), so this is the FOURTH reading of the one
 *  source and the closest of them to the ring – a band and a ring that disagree would now be two
 *  readings of the same Elo expression disagreeing, which they cannot do by much. And it is smooth:
 *  those same 13 points move it by 0.03 instead of by 0.31, because a mean of thirty-two continuous
 *  probabilities has no granularity to quantise against.
 *
 *  ⚠⚠ THE THRESHOLDS THEREFORE MOVE, AND THAT IS NOT THE RE-SCALE THE ROUND FORBADE. What round 31
 *  #3 refused was widening 0.75/0.35 to spread a DEGENERATE label out over a bad proxy – repainting
 *  a measurement rather than fixing it. These are not those numbers re-cut: they are the cut points
 *  of a different quantity, and they are the quantity's own plain meaning. `strong` is the word for a
 *  week she would usually lose and `favourite` for one she would usually win, so the two cuts sit
 *  either side of a coin toss with a deliberate dead zone between them – `even` is not "exactly 50%",
 *  it is "close enough that the draw decides".
 *
 *  ⚠⚠ AND THE DEAD ZONE'S WIDTH IS THE ONE FREE NUMBER IN THIS FILE, SO IT WAS SWEPT RATHER THAN
 *  PICKED (CLAUDE.md invariant 5). ±0.125 is ±88 Elo – just inside the 100-point class
 *  `chanceFromRatings` quotes from its own source (*"A 100-point difference in Elo ratings implies
 *  that the favorite has a 64% chance"*), which is the anchor. What CHOSE it is the sweep behind the
 *  anchor: eight careers (the owner's w933 save and seven fresh ones), seven weeks each, 382
 *  card-observations, every width from ±0.09 to ±0.17 in steps of 0.005. Two things it says –
 *
 *    * between ±0.11 and ±0.13 the band's composition barely moves, so no cluster of cards lives
 *      there; and ±0.125 is the width whose cuts sit FURTHEST from the nearest card on both
 *      acceptance fixtures (margin 0.0029 against a median of 0.0004 over the other widths).
 *    * wider is not safer, it is only quieter: by ±0.17 the `even` bucket has swallowed three cards
 *      in five, which is the degeneracy this whole wave exists to undo.
 *
 *  ⚠⚠ AND THE SWEEP'S OTHER FINDING IS THE HONEST ONE: NO WIDTH MAKES THE RESIDUE ZERO. At every
 *  one of the seventeen widths some card in the 382 sits within 0.0005 of a cut, because the chance
 *  axis is densely populated, and 3 to 12 observations step. That is not this design leaking – it is
 *  what a THREE-VALUED readout of a MOVING quantity is. What moves it is her: a card sits on screen
 *  for eight weeks and in that time she genuinely outgrows a rung by about **5 rating points**
 *  (measured at 13: +9 for her, +4 for the field, over six weeks). So roughly one card in a hundred
 *  steps ONCE, monotonically, in the direction she is actually going. That is news, not flicker, and
 *  it is the whole residue: nothing here can move because the preview was re-read.
 *  See docs/specs/tier-ladder-and-band.md §7.
 *
 *  ⚠ THE THREE SENTENCES ON SCREEN ARE UNCHANGED AND STAY TRUE OF IT. `Most of this field is ranked
 *  above her` fires when the rung's typical entrant outrates her by 88+, which puts most of the
 *  field above her by a wider margin than the old headcount ever required; `She is among the
 *  strongest entered` fires 88 points the other way. The copy is the owner's and this task did not
 *  ask for it (CLAUDE.md invariant 4). */
const BAND_FAVOURITE_AT = 0.625
const BAND_STRONG_AT = 0.375

/** ⭐⭐⭐ ROUND 34 #5 – THE NUMBER THE BAND WAS ALREADY MADE OF, GIVEN A NAME AND A SURFACE.
 *
 *  HIS COMPLAINT, and it is a PLANNING complaint before it is a numbers one: «за 2 недели до
 *  турнира можно сняться бесплатно, но ты не знаешь шансов, а за неделю ты знаешь шансы, но сняться
 *  бесплатно нельзя. В итоге у тебя нет планирования… может общую цифру шанса на проход первого
 *  тура делать, но чтобы она всё-таки реальность отражала и не скакала от недели к неделе?»
 *
 *  ⭐ NOTHING IS MODELLED HERE THAT WAS NOT ALREADY BEING COMPUTED. `strengthOf` below has folded
 *  exactly this mean since round 31 #3 and then thrown the number away to keep three words; the
 *  whole of this change is that the mean is returned as well as banded. So the figure and the word
 *  beside it are ONE quantity read twice – they cannot come to disagree, which is the property the
 *  rest of this file is built on («one source, two readings»).
 *
 *  ⚠ WHY IT DOES NOT JUMP, which is the half he actually asked for. Read `tierExpectedField`'s note
 *  above: no standings table, no fatigue gate, no per-event die and no draw enters this. What is
 *  left that can move it is the world's own slow drift and her own growth – measured in round 31 #3
 *  at 0.03 of chance for the conveyor's whole annual turnover, against the 0.80 → 0.54 the drawn
 *  opponent legitimately swings by over the same two weeks (round 31 #4, and reproduced as this
 *  round's control in tools/r34-field-chance.ts).
 *
 *  ⚠ NULL, NOT 0.5, ON AN EMPTY FIELD. `strengthOf` answers `even` there because a word must be
 *  chosen; a percentage must not be invented, and `EventPreview.firstMatchChance` already
 *  establishes that null is this file's word for «we do not know yet». */
export function fieldChance(field: readonly number[], mine: number): number | null {
  if (!field.length) return null
  return field.reduce((a, r) => a + chanceFromRatings(mine, r), 0) / field.length
}

function strengthOf(field: readonly number[], mine: number): FieldStrength {
  const chance = fieldChance(field, mine)
  if (chance === null) return 'even'
  if (chance <= BAND_STRONG_AT) return 'strong'
  if (chance >= BAND_FAVOURITE_AT) return 'favourite'
  return 'even'
}

/** Decorative weather. Its own sub-stream so it can never perturb the draw, and keyed on the event
 *  so a tournament's day is the same every time the card is rendered. Bands are loosely seasonal by
 *  surface: clay is the spring/summer swing, grass high summer, hard the shoulders.
 *
 *  ⚠ ROUND 26 #6 – IT TAKES AN ID AND A SURFACE, NOT A `SeasonEvent`, AND THAT IS A WIDENING RATHER
 *  THAN A CHANGE. A `SeasonEvent` still satisfies it, every existing call site is byte-identical and
 *  no number moved; what it buys is that the College League – a fixture with no calendar event and
 *  no rung behind it – gets its day out of the SAME function rather than out of a second copy of
 *  this formula. Two weather functions is how one tournament comes to have two days. */
export function eventTemperature(seed: string, event: { id: string; surface: Surface }): number {
  const rng = rngFromSeed(`${seed}:weather:${event.id}`)
  const [lo, hi] =
    event.surface === 'grass' ? [19, 29] : event.surface === 'clay' ? [16, 28] : [12, 26]
  return Math.round(lo + rng() * (hi - lo))
}

// THE CROWD, tier by tier. The corridor the owner asked for, and it is NOT invented here: every
// band below is the venue docs/lore/setting.md §6 already describes, converted to a headcount.
//
//   local     "Parents on a wooden bench, one dog."                              10-40
//   j30       "Still no crowd."                                                  30-90
//   regional  a proper club, a flip scoreboard, "maybe thirty people"            45-130
//   j60       "a small stand along one court", a camera nobody is watching      110-320
//   national  a national training centre, an umpire chair, a real stand         220-650
//   j300      "a show court, actual seating, a media wall, agents on the fence" 900-2600
//
// ⚠ THE ORDER IS PRODUCTION SCALE, NOT PRESTIGE, and the two deliberately disagree: j30 sits BELOW
// regional and j60 below national, because a J30 abroad is thirty parents from nine countries and a
// national championship at home is a stand full of people who know her. That is the lore's own
// reading ("Still no crowd" at the rung that costs $900-2,000 to reach) and it is the point the
// figure makes: she flies further and further to play in front of fewer and fewer people, until
// J300 - the one rung where a junior plays in front of strangers. Note also that setting.md §6
// warns against building on tier PRESTIGE while the points retable is open, and in the same
// breath that production scale "does not move". This field is banded on the half that does not move.
//
// ⚠ DECORATIVE, AND IT MUST STAY DECORATIVE. Nothing in the simulation may read it - not condition,
// not nerves, not prize money. Those are real systems with their own specs and their own balance
// evidence; a free number that quietly becomes an input to one of them stops being free and starts
// needing a schema, a capture re-pin and a balance sweep. Pinned by a grep guard in
// tests/preview.test.ts, exactly as the weather is.
//
// PER EVENT, NOT PER ROUND. A final really does draw more than a first round, but neither surface
// that shows this number has a round to scale by: `EventPreview` describes an event she has not
// entered (no round exists yet) and screen E's brief is rendered before round one. Scaling would
// therefore make the SAME field mean "the first round's crowd" on one card and "the tournament's
// crowd" on the other, which is worse than not modelling it. If a round ever wants its own gate,
// it should take a round argument and be a second reading, not a re-interpretation of this one.
const CROWD_BANDS: Record<TierId, readonly [number, number]> = {
  local: [10, 40],
  regional: [45, 130],
  national: [220, 650],
  j30: [30, 90],
  j60: [110, 320],
  j300: [900, 2600],
  // THE ADULT TOUR REPEATS THE JOKE ONE TABLE UP, because the real one does. A W15 is played on an
  // outside court of a club in a town nobody has heard of, in front of the other players' parents
  // and a groundsman – twenty to seventy people, which is FEWER than a Regional and fewer even than
  // a J30. She has just turned professional and the stand is emptier than the one she played her
  // national under-14s in. That is exactly the shape j30-under-regional already draws, and it is the
  // same sentence the table's note makes about production scale disagreeing with prestige: this is
  // the first rung of the WOMEN'S PROFESSIONAL TOUR and it is the quietest room in the game.
  //
  // W35 buys a small stand and a few locals (60-200, about a J60's room). W100 is the first adult
  // week with a real crowd – a proper club with seating, a scoreboard, a couple of hundred paying
  // spectators and whoever the tournament can pull on finals day (400-1,400) – and note that it is
  // still SMALLER than a J300's 900-2,600. That is not a mistake either: a J300 is a junior Slam
  // feeder with agents on the fence and a national federation busing children in, while a W100 is a
  // Tuesday in a mid-size town. The crowd she plays in front of gets smaller as the tennis gets
  // better, right up until the tour she is climbing towards, which is off this table entirely.
  w15: [20, 70],
  w35: [60, 200],
  // The W2-LADDER middle rungs continue the same production-scale climb: a W50 is a W35 with a
  // second stand (90-280, a shade over a J60's room), a W75 is the first adult week that looks
  // organised on television-less terms (150-500). Both still sit BELOW a J300's 900-2,600 - the
  // agents-on-the-fence joke holds until W100.
  w50: [90, 280],
  w75: [150, 500],
  w100: [400, 1400],
  // The 125 is the first rung whose room finally OUTGROWS a J300: a WTA event proper, a city
  // arena's outer configuration, 1,200-3,500 - the tour she was climbing towards starts being
  // audible from the court. Still decorative; nothing reads it.
  wta125: [1200, 3500],
  // W3-ACT2 – and this is where the joke the table has been telling since `local` finally stops.
  // Every rung so far has been a room: a club, a stand, a city arena's outer configuration. A WTA
  // 250 is a full tournament week in a real venue (3,000-9,000); a 500 fills a show court
  // (7,000-18,000); a 1000 is a stadium (15,000-35,000); a major is a fortnight a country watches
  // (25,000-70,000, which is the ground, not the television). The crowd got SMALLER as the tennis
  // got better right up to the tour she was climbing towards - and these four are that tour.
  // Still decorative; nothing reads these numbers, which is pinned by a grep guard in
  // tests/preview.test.ts exactly as the weather is.
  wta250: [3000, 9000],
  wta500: [7000, 18000],
  wta1000: [15000, 35000],
  slam: [25000, 70000],
}

/** ⭐⭐⭐ ROUND 30 #23 (30.08) – THE CORRIDOR'S MIDPOINT FOR A RUNG, and it is the ONE thing outside
 *  this file that may read the crowd. The owner, overruling the `[GAP]` the brand wave had filed:
 *  «у нас есть понимание **коридора зрителей на каждом турнире**, мне кажется этого достаточно
 *  вполне.»
 *
 *  ⚠⚠ THE CORRIDOR IS NOT THE DRAW, AND THE DISTINCTION IS WHAT KEEPS THE RULING ABOVE INTACT.
 *  `eventCrowd` is a per-event ROLL off `seed:crowd:<eventId>`; nothing in the simulation reads it,
 *  the grep guard in tests/preview.test.ts still says so, and it stays decorative. THIS is the static
 *  table under it – how big the room is at that rung – and it is a pure constant with no stream, no
 *  event id and no week. That matters beyond tidiness: `world/brand.ts`' whole contract is «a
 *  valuation is a fold over history, zero draws», and reading the ROLL would have put a die inside a
 *  valuation. Reading the CORRIDOR cannot.
 *
 *  ⚠ It is a MIDPOINT and never a sample: two careers that played the same rung must be credited the
 *  same room, or the brand would price the dice rather than the schedule. */
export function tierCrowdMid(tier: TierId): number {
  const band = CROWD_BANDS[tier]
  return band ? (band[0] + band[1]) / 2 : 0
}

/** Decorative crowd. Its own sub-stream so it can never perturb the draw, and keyed on the event so
 *  a tournament's gate is the same every time the card is rendered. Banded by tier – see the table
 *  above for where the numbers come from and why nothing may read them.
 *
 *  Rounded to a step that grows with the band (5 / 10 / 50), because an estimate that reads "1,473"
 *  claims a turnstile we do not have. Every band's ends are multiples of their own step, so the
 *  rounding can never push a figure outside its corridor. */
export function eventCrowd(seed: string, event: SeasonEvent): number {
  const rng = rngFromSeed(`${seed}:crowd:${event.id}`)
  const [lo, hi] = CROWD_BANDS[event.tier]
  const step = hi >= 1000 ? 50 : hi >= 200 ? 10 : 5
  return Math.round((lo + rng() * (hi - lo)) / step) * step
}

/** The whole card's worth of preview for one event. Pure; no MAIN-stream draws; nothing persisted. */
export function previewEvent(
  world: {
    seed: string
    week: number
    cohort: AiPlayer[]
    results: SeasonResult[]
  },
  event: SeasonEvent,
  /** ⭐ WHO TURNS UP – the table `selectEntrants` positions the candidates on, and it must be the
   *  one the BRACKET selects from or the card previews a field the tournament will not field. See
   *  the `standing` note below for the pair this is half of. */
  ranking: RankingRow[],
  kid: MatchPlayer,
  /** WEEK EXCLUSIVITY (W2-FIELD2): whoever a HIGHER W rung of this same week has already drawn. The
   *  CALLER computes it, because only the caller holds the season – and it must, or the card would
   *  name an opponent the bracket will not contain. See `weekFieldExclusion`. */
  excluded?: ReadonlySet<string>,
  /** ⭐⭐ WHERE **SHE** STANDS AMONG THEM (round 31 #3) – the tier's OWN track's table, and it is a
   *  SECOND table on purpose rather than a widening of the first.
   *
   *  `computeShadowTournament` (world/phaseHerWeek.ts) has taken two tables since round 21 #4 and
   *  spells out why: *"Who TURNS UP must not depend on her… Where SHE STANDS among them must depend
   *  on her and on nothing else - it is the acceptance list's own question, and `rankingFor` is the
   *  table every other surface answers it with, so the draw now agrees with the Season card instead
   *  of contradicting it."* The preview was handed ONE table and used it for both, so the card and
   *  the bracket seeded her from different places – and for a DOMESTIC event they are different
   *  places by a whole table. Two readings, two tables, exactly as the bracket has them.
   *
   *  ⚠ OPTIONAL, AND ABSENT ⇒ `ranking`, WHICH IS BYTE-IDENTICAL TO WHAT THIS FUNCTION ALWAYS DID.
   *  Same discipline as `excluded` above and as `kidMatchPlayerFor`'s optional world keys: a pure
   *  caller that has only one table (a bench, an older test) gets the pre-change preview rather than
   *  a silently different one. */
  standing?: RankingRow[],
  /** ⭐ HER, AT FULL CONDITION – the BAND's reading of her, and the symmetric half of the header's
   *  "THE FIELD IS PREVIEWED RESTED" rule. Built by the caller through the same composer `kid` comes
   *  from, so nothing is inverted here; see `strengthOf` for what it is for and for the 3-of-24
   *  regression that produced it. Absent ⇒ `kid`, which is byte-identical to what this function did
   *  before it existed. */
  kidAtRest?: MatchPlayer,
  /** ⭐ THE COHORT, RATED AND SORTED ONCE (`ratedField`) – the BAND's population, and the only
   *  parameter here that exists purely to be paid for once. It is a fold over the whole cohort per
   *  SURFACE and every card in a snapshot shares it, so `upcomingEvents` memoises it and hands it
   *  down; a caller that does not have one gets an identical answer at the cost of building its own.
   *  ⚠ Unlike `standing` and `kidAtRest` this default is not a compatibility shim – there is one
   *  right answer and both paths compute it. See `tierExpectedField`. */
  rated?: readonly RatedEntrant[],
): EventPreview {
  const standingTable = standing ?? ranking
  const alive = drawnField(
    event,
    world.cohort,
    ranking,
    rivalConditions(world.results, world.week),
    kid,
    world.seed,
    excluded,
    standingTable,
  )
  // ⭐ ROUND 31 #4 – THE DRAW, OR THE ABSENCE OF ONE. The field above is still built, because the
  // BAND is what a far-out card is for and the band is a reading of the whole field; what waits for
  // week − 1 is naming one player out of it. See DRAW_LEAD_WEEKS for the owner's ruling and the
  // measurement behind it.
  //
  // ⚠ ZERO RNG CONSEQUENCE, BY CONSTRUCTION. `drawnField` is untouched and runs on every card, so
  // `seed:kidtour:<eventId>` is spent in the same order and to the same depth it always was;
  // `firstRoundOpponent` is a pure index lookup into the finished draw. The MAIN weekly stream was
  // never in this file at all.
  const drawMade = event.week - world.week <= DRAW_LEAD_WEEKS
  const opp = drawMade ? firstRoundOpponent(alive, kid) : null
  // THE RUNG'S OWN FIELD AND HER RESTED RATING – built once, read twice (band + figure).
  const expected = tierExpectedField(event.tier, rated ?? ratedField(world.cohort, event.surface))
  const mineAtRest = ratingOf(kidAtRest ?? kid, event.surface, JUNIOR_TOUR)
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  return {
    drawMade,
    firstMatchChance: opp
      ? fastMatchProbability(kid, opp, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })
      : null,
    // Same (player, surface, tour) the chance above is computed from - one source, two readings, so
    // the card can never quote a rating that disagrees with the ring beside it.
    kidRating: ratingOf(kid, event.surface, JUNIOR_TOUR),
    opponentRating: opp ? ratingOf(opp, event.surface, JUNIOR_TOUR) : null,
    opponentName: opp?.name ?? '',
    // ⚠ HER RANK COMES OFF THE SAME TABLE THE TOURNAMENT OVERLAY PRINTS IT FROM (round 31 #3).
    // `standingTable` is the tier's own track's, which is exactly what `overlayRanks` in
    // world/snapshot.ts reads – so the rank beside her name on the card and the rank beside it in
    // the draw are one number. Before this they were two for every DOMESTIC event, because the card
    // was handed the ITF table and the overlay reads the domestic one.
    opponentRank: opp ? (standingTable.find((r) => r.playerId === opp.id)?.rank ?? null) : null,
    // ⚠ THE BAND IS NOT READ OFF `alive`. It is a statement about the RUNG, counted over the field
    // this tier is expected to field rather than over the one this week's redraw happened to
    // produce – see `tierExpectedField` for the measurement that moved it there.
    // ⭐ ROUND 34 #5 – AND THE FIGURE BESIDE IT IS THE SAME TWO ARGUMENTS FOLDED ONCE. Hoisted into
    // `expected` / `mineAtRest` so the word and the number are provably the same reading: a band
    // computed from one field and a percentage from another is precisely the drift this file's
    // «one source, two readings» rule exists to make impossible.
    fieldStrength: strengthOf(expected, mineAtRest),
    fieldChance: fieldChance(expected, mineAtRest),
    temperatureC: eventTemperature(world.seed, event),
    crowd: eventCrowd(world.seed, event),
  }
}
