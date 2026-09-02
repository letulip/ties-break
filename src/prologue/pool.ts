// THE PROLOGUE'S OWN TOURNAMENT POOL – phase 3 of docs/specs/childhood-prologue-build-2026-09.md.
//
// Eight local children who exist for one weekend and are thrown away. His ruling (§2.2): «отдельный
// маленький пул на пролог – да, я тоже об этом думал», at his own rhythm of «1-2 a year, по принципу
// колледжа», with real tournaments from ten.
//
// ⚠⚠ WHY A SEPARATE POOL EXISTS AT ALL, AND IT IS NOT THE TIER. Build spec §1b, re-measured on main:
// `COHORT.ageBand = [13, 19]`, so there is nobody under thirteen in the world. The Local / Regional /
// National rungs genuinely carry no `minAgeYears` – the LADDER is open to a ten-year-old and always
// was. What does not exist is the FIELD. Entering her today would draw her against fifteen-year-olds,
// and the fix for that is not a new age rule on a tier, it is eight other ten-year-olds.
//
// ⚠⚠ AND IT MAY NEVER ENTER `world.cohort` OR ANY TABLE. The tier ladder was repaired eight days ago
// (round 31 #3) after the card and its own tournament were found selecting from different tables, and
// this must not put children into the population that repair measured. Four things hold it out, and
// the first is the one that cannot be argued with:
//
//   1. ⭐⭐ THE TYPE IS THE GUARD. A child here is a `MatchPlayer`, which is somebody who can play one
//      match: five attributes, a name, an age. `world.cohort` is `AiPlayer[]`, which is a CAREER –
//      `nation`, `growth`, `ageYears` and a four-key `potential` on top of an `Omit<MatchPlayer,
//      'groundstrokes' | 'age'>`. NEITHER type is assignable to the other, in either direction, so a
//      pool child cannot be pushed into the cohort and a rival cannot be pulled into the pool without
//      `vue-tsc` refusing the build. That is a compiler check on every gate run, not a test somebody
//      has to remember to keep pointed at the right thing.
//   2. NO POTENTIAL, SO NO CAREER ARC. A `MatchPlayer` has no ceiling field to fill in, which is the
//      structural half of «no ranking, no potential, no career arc»: `driftCohort` reads
//      `p.potential.serve` and would not compile against one of these. Nothing here grows.
//   3. NOTHING IS STORED, BY ANYBODY. Every function below is pure and returns its answer; this
//      module holds no mutable binding, takes no world and imports nothing that owns one. The pool is
//      rebuilt from `(seed, age, index)` whenever it is wanted and dropped when the caller drops it,
//      which is the whole of «thrown away at the handover» – there is nothing to throw away.
//   4. NO POINTS ARE EVER COMPUTED. `TIERS.local.points` is `[30, 18, 10, 0]` and this file never
//      reads it. A `LocalOpen` carries a scoreline, a count of matches won and a finish INDEX, and no
//      ranking currency of any kind, so there is nothing here a season could count even if somebody
//      later handed the result to one. `tests/prologue-pool.test.ts` pins all four.
//
// ⚠ RNG: TWO PURPOSE-SCOPED SUB-STREAMS, NEVER MAIN (invariant 2). `seed:prologue:field:<age>:<i>`
// draws the children and `seed:prologue:draw:<age>:<i>` draws the bracket – both re-derived at the
// call site from `rngFromSeed`, both persisting nothing, exactly the shape `seed:kidtour:<id>` and
// `seed:aibirth:<id>` already ship in. Not one draw reaches the MAIN weekly stream, so the frozen
// capture (41550 draws / e6b0c709) and every career hash cannot move: this file never sees `rngMain`
// and nothing on the tick path imports it.
//
// ⚠ AND IT DOES NOT IMPORT `engine/childhood.ts` – see cards.ts's header. Phase 1's importer set is
// pinned EMPTY and phase 4 is the wiring phase; the join between a childhood and a tournament is made
// in the test, not in the source.
import { rngFromSeed, pickInt, type Rng } from '../engine/rng'
import { SKILL_KEYS, STARTING_SKILL_BAND, type SkillKey } from '../engine/development'
import { WEEKS_PER_YEAR, TIERS } from '../engine/season/calendar'
import { FIRST_NAMES, SURNAMES } from '../engine/season/names'
import { runTournament } from '../engine/season/tournament'
import type { MatchPlayer } from '../engine/match/types'
import type { MatchRecord, SeasonEvent, TierId, TournamentResult } from '../engine/season/types'
import { PROLOGUE_CARDS, type LocalOpenOutcome, type PrologueYear } from './cards'

/** ⚠ THE ONE PLACE A PROLOGUE EVENT IS NAMED, and the prefix is load-bearing rather than decorative.
 *  A world event's id is `${year}-w${week}-${tier}` (season/types.ts), so every id the calendar can
 *  ever produce STARTS WITH A DIGIT. An id that starts with a letter therefore cannot be one, and the
 *  reverse is equally true – which makes `id.startsWith(PROLOGUE_EVENT_PREFIX)` a total and permanent
 *  test for «this result came from the prologue» that no future calendar change can blur. */
export const PROLOGUE_EVENT_PREFIX = 'prologue-'

/** THE DIALS. Two of the four are his numbers and are marked as such; the other two are read from the
 *  game's own tables rather than chosen here. */
export const LOCAL_POOL = {
  /** HIS FLOOR, and the size of the pool: «8-16 local children». It is the local rung's own draw, so
   *  the field is a real acceptance list – eight children enter, she is the ninth, and the weakest
   *  child misses the cut exactly as `buildDraw` has always made the weakest entrant miss it.
   *
   *  ⚠ IT MAY NOT GO BELOW `drawSize - 1`, and that is a constraint of the shipped bracket rather
   *  than a taste. `buildDraw` fills the draw from the entrants it is handed and `runTournament`
   *  reads `Math.log2` of what comes back, so a pool too small to fill a local draw produces a
   *  bracket that is not a power of two – which this engine has no bye machinery for (season/
   *  types.ts: «POWERS OF TWO ONLY»). Pinned in tests/prologue-pool.test.ts, where a mutation run
   *  found it. */
  size: TIERS.local.drawSize,

  /** ⚠ HIS RULING: «real tournaments FROM 10» (§2.2). Below this age a year holds no tournament
   *  whatever the player bought, which is why this is a floor on the AGE and not on the card. */
  fromAge: 10,

  /** ...and his rhythm: «1-2 a year». A cap rather than a target – most years hold none. */
  maxPerYear: 2,

  /** The rung. `local` is open to a ten-year-old today (§1b: no `minAgeYears`), which is why this
   *  phase needed a field and not a tier change. */
  tier: 'local' as TierId,

  /** One weekend, one surface. A local under-twelves open is played on whatever the club has. */
  surface: 'hard',
} as const

/** THE AGE THE PROLOGUE HANDS HER OVER AT – derived from the card table's last row rather than
 *  written down a third time. `PROLOGUE_CARDS` runs 5..13 (pinned in tests/prologue-cards.test.ts)
 *  and the game takes her at the end of the thirteenth year, so the handover is one past the last
 *  card. Read only to place the prologue's weeks on the far side of week 0 – see `localOpenEvent`. */
const HANDOVER_AGE = PROLOGUE_CARDS[PROLOGUE_CARDS.length - 1].age + 1

// =================================================================================================
// THE CHILDREN
// =================================================================================================

/** ⭐⭐ ONE LOCAL CHILD. Five attributes drawn uniformly from `STARTING_SKILL_BAND` – the EXACT band
 *  and the EXACT draw (`pickInt`) that `startingSkills` uses for the girl the game has always begun
 *  with – plus a name from the house pool and her age.
 *
 *  ⚠ WHY A FOURTEEN-YEAR-OLD'S BAND IS THE RIGHT BAND FOR A TEN-YEAR-OLD, which looks wrong and is
 *  the load-bearing claim of this file. The match engine reads DIFFERENCES: `basePServe` weighs one
 *  girl's serve against the other's return and the groundstroke term enters as a subtraction, so
 *  scaling the whole draw down to what a ten-year-old really hits would move every number and change
 *  no outcome. The one thing that reads an absolute age is the serve-speed curve, and it takes
 *  `MatchPlayer.age` – which is set below, and whose own comment already documents the curve down to
 *  age 6. So the honest model is: the children are on the game's own attribute scale, and their AGE
 *  is what says they are ten. A second scale would have been a second population with no way to
 *  compare it to hers.
 *
 *  ⚠ EXACTLY SEVEN DRAWS, IN A FIXED ORDER: name, name, then the five attributes in `SKILL_KEYS`
 *  order. Not because anything persists – nothing here does – but because a pool rebuilt from the
 *  same seed must be the same pool, or a match re-watched from the handover would be a different
 *  match. `SKILL_KEYS` is append-only for the same reason it is append-only for her.
 *
 *  ⚠ NO `condition`, DELIBERATELY. types.ts is explicit that absent means a multiplier of exactly 1
 *  and NOT «she was fresh» – «a raw opponent nobody composed a condition for … is deliberately left
 *  absent: "no opinion" and "fresh at 100" are different claims». Nobody has composed a ten-year-old
 *  club player's condition and this phase is not going to pretend otherwise. */
function localChild(rng: Rng, id: string, age: number): MatchPlayer {
  const first = FIRST_NAMES[pickInt(rng, 0, FIRST_NAMES.length - 1)]
  const last = SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
  const skills = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) skills[k] = pickInt(rng, ...STARTING_SKILL_BAND[k])
  return { id, name: `${first} ${last}`, age, ...skills }
}

/** How good a child is, for ordering the acceptance list. The mean of the five.
 *
 *  ⚠ IT IS NOT `season/cohort.ts`'s `power()` AND MUST NOT CALL IT, which looks like the duplication
 *  CLAUDE.md forbids and is the opposite. `power` takes an `AiPlayer` and reaches for
 *  `rivalGroundstrokes(p)` because a rival does NOT STORE her fifth attribute – it is derived from her
 *  id off a `gs:<id>` sub-stream. A `MatchPlayer` stores all five. Calling `power` here would need a
 *  fake cohort row and would then answer with a groundstroke this child does not have. Same words,
 *  different question. */
function standardOf(p: MatchPlayer): number {
  let total = 0
  for (const k of SKILL_KEYS) total += p[k]
  return total / SKILL_KEYS.length
}

/** ⭐ THE POOL – `LOCAL_POOL.size` children of `age`, strongest first.
 *
 *  Ordered because `runTournament` seeds the top of what it is handed (`seedsFor(8) === 2`, the ITF
 *  shape) and shuffles the rest. A pool in generation order would have handed the two seeds to
 *  whoever happened to be drawn first, which is a bracket with the word «seed» on it and no meaning
 *  behind it. Sorted, the two best children are seeded, she arrives unseeded and is drawn at random
 *  among the others – which is the owner's own ruling about a real draw («в настоящем теннисе
 *  несеяная новичок попадает в сетку случайно»), applied at ten.
 *
 *  ⚠ THE SORT IS A TIE-BREAK ON ID, not a bare comparator. Two children with identical means would
 *  otherwise be ordered by whatever the runtime's sort does with a 0, and the pool has to be a
 *  function of the seed alone. */
export function localPool(seed: string, age: number, index = 0): MatchPlayer[] {
  const rng = rngFromSeed(`${seed}:prologue:field:${age}:${index}`)
  const pool: MatchPlayer[] = []
  for (let i = 0; i < LOCAL_POOL.size; i++) pool.push(localChild(rng, `local-${age}-${index}-${i}`, age))
  return pool.sort((a, b) => standardOf(b) - standardOf(a) || (a.id < b.id ? -1 : 1))
}

/** ⭐⭐ HER, AS A LOCAL OPEN MEETS HER – phase 11, and it is the NINTH CHILD and nothing more.
 *
 *  Drawn from the same `STARTING_SKILL_BAND`, by the same `pickInt`, in the same `SKILL_KEYS` order
 *  as the eight above, on her own purpose-scoped sub-stream `seed:prologue:her` (invariant 2). One
 *  draw for the whole childhood, with `age` moved on each time: the same girl, a year older.
 *
 *  ⚠⚠ THE CHILDHOOD DOES NOT MOVE HER HERE, AND THAT IS A REFUSAL RATHER THAN AN OVERSIGHT. The
 *  honest way to make nine years of decisions show up on a court is `childhoodArrival`, and this
 *  module may not reach it: `tests/childhood.test.ts` pins `engine/childhood.ts`'s importer set as
 *  exactly `['engine/world.ts']`, which is phase 1's guarantee that the childhood model cannot be
 *  reached from the tick path. The alternatives are both worse than the gap:
 *
 *    * A SECOND STRENGTH MODEL HERE would be two copies of one model, which CLAUDE.md forbids by
 *      name and `foldYears` was written to avoid («Two copies of one model is a model that drifts»).
 *    * A PARTIAL WALK WOULD NOT MEAN WHAT IT SAYS EVEN IF IT WERE REACHABLE. `childhoodWalk`
 *      normalises the level against a MEDIAN and a DEVOTED childhood over all nine years, so a walk
 *      of the first six would read as far below median simply for being short – the same trap
 *      cards.ts §"what a card shows" §4 already records about drawing a number at seven.
 *
 *  ⭐ WHAT THE PLAYER'S CHOICES DO REACH is the RHYTHM below: a year she gave everything to holds
 *  two of these weekends and an ordinary one holds one, so a devoted childhood plays more draws and
 *  therefore wins more of them. That is the connection, it is derived from the table, and it is the
 *  only one this phase claims. Making the girl herself stronger is the owner's call and is named in
 *  the report as a thing NOT done. */
export function prologueEntrant(seed: string, id: string, name: string, age: number): MatchPlayer {
  const rng = rngFromSeed(`${seed}:prologue:her`)
  const skills = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) skills[k] = pickInt(rng, ...STARTING_SKILL_BAND[k])
  return { id, name, age, ...skills }
}

// =================================================================================================
// THE WEEKEND
// =================================================================================================

/** THE EVENT ROW the bracket runs on. A `SeasonEvent` because `runTournament` takes one – NOT because
 *  the calendar has anything to do with this. The calendar never sees it: `buildSeason` produces the
 *  world's events and this one is made here, on demand, from an age.
 *
 *  ⚠ THE WEEK IS BEFORE THE GAME STARTS AND IS READ BY NOTHING. `runTournament` reads `id`, `tier`
 *  and `surface` and no more; the week is here because the type has the field. It is set to the real
 *  distance back from week 0 – a Local Open at ten is four years before she is handed over – so that
 *  if it is ever read, it reads as what it is. It is also outside every window a season counts: the
 *  results window is 52 weeks and the pre-history rows the world does keep sit at [-51, -1].
 *
 *  ⚠ AND `travelCostCents` IS ZERO, WHICH IS NOT A PLACEHOLDER. The prologue's money is the CARD's:
 *  the age-10 row already charges the weekend («an entry and a weekend – about a month of the group,
 *  once», 1_950_00 against 1_800_00 for staying home) and `spentCents` in run.ts accumulates it. A
 *  second number here would be the same weekend billed twice, and the tier's own [60_00, 120_00] band
 *  is a number about a fourteen-year-old's travel to a rung she entered on standings. */
export function localOpenEvent(age: number, index = 0): SeasonEvent {
  const week = -WEEKS_PER_YEAR * (HANDOVER_AGE - age)
  return {
    id: `${PROLOGUE_EVENT_PREFIX}${LOCAL_POOL.tier}-a${age}-${index}`,
    week,
    tier: LOCAL_POOL.tier,
    surface: LOCAL_POOL.surface,
    travelCostCents: 0,
    deadlineWeek: week - 2,
  }
}

/** ⭐ WHAT ONE WEEKEND CAME TO. A result and a memory – and the memory is these three numbers, not a
 *  sentence: the copy that says them belongs to the handover, which is phase 4, and none of the
 *  prologue's words have been approved.
 *
 *  ⚠ THERE IS NO POINTS FIELD AND THERE MAY NOT BE ONE. `finish` is an INDEX into a bracket (0 = she
 *  won it, `rounds` = she lost her first match) and is deliberately the same index `TierDef.points`
 *  is keyed by WITHOUT this file ever looking that table up – so a reader can see what she did and
 *  nobody, here or later, has a number to add to a standings row. */
export interface LocalOpen {
  readonly event: SeasonEvent
  /** the eight children, strongest first – the acceptance list, before she takes the last place */
  readonly field: readonly MatchPlayer[]
  /** the bracket, as `runTournament` resolved it */
  readonly result: TournamentResult
  /** how many matches she won */
  readonly wins: number
  /** her finish: 0 is the title, `rounds` is a first-round exit */
  readonly finish: number
  /** how many rounds the draw had */
  readonly rounds: number
}

/** ⭐⭐ SHE PLAYS THE LOCAL OPEN. The whole of phase 3's behaviour, and it is the game's own bracket:
 *  `runTournament` is pure – event, entrants, kid, seed, rng – so it needs no world, writes to none,
 *  and resolves her matches through the real point engine under a replayable seed. That is what makes
 *  the match viewer able to show this weekend without a single new mechanism (§2.2's «да»).
 *
 *  ⚠ SHE GOES IN UNSEEDED, and `kidSeedIndex` is deliberately not passed. It exists so that three
 *  callers can agree on where a RANKED girl slots into a standings-ordered field, and a ten-year-old
 *  at her first tournament has no standing to slot by – there is no ranking in this pool and there is
 *  not going to be one. Omitted means she goes in last, which the shipped comment already describes
 *  as «what an unranked newcomer deserves».
 *
 *  ⚠ `kid.id` MUST BE `KID_ID` FOR THE VIEWER TO KNOW HER, and this function does not enforce it –
 *  composing her is phase 4's. What it does enforce is the other side: no child in the pool can ever
 *  collide with her, because every pool id is `local-<age>-<index>-<i>` and the test pins the shape. */
export function playLocalOpen(seed: string, kid: MatchPlayer, age: number, index = 0): LocalOpen {
  const event = localOpenEvent(age, index)
  const field = localPool(seed, age, index)
  const rng = rngFromSeed(`${seed}:prologue:draw:${age}:${index}`)
  const result = runTournament(event, [...field], kid, seed, rng)
  // ⚠ THE ROUND COUNT IS READ OFF THE BRACKET THAT WAS ACTUALLY PLAYED, and it used to be
  // `Math.log2(TIERS[tier].drawSize)` – which is the same number today and is a SECOND source of
  // truth for it. A mutation run caught the difference: `runTournament` sizes its rounds from the
  // entrant list it was handed, so the two agree only while the pool is big enough to fill the draw,
  // and a pool that was not made `finish` and `wins` quietly wrong instead of failing. A single
  // elimination of n players is exactly n-1 matches, so this cannot disagree with the bracket.
  const rounds = Math.log2(result.matches.length + 1)
  const finish = result.finishes[kid.id] ?? rounds
  return { event, field, result, wins: rounds - finish, finish, rounds }
}

/** ⭐⭐ WHAT THE WEEKEND CAME TO, IN THE OWNER'S OWN THREE FACES – «либо победный арт, либо serious
 *  если в финал выбралась, либо грустный, если до финала не дошла».
 *
 *  ⚠ IT IS READ OFF `finish`, WHICH IS AN INDEX AND NOT A PRIZE. 0 is the title and 1 is the match
 *  she lost on the last day, because `finish` is `rounds - round` for a loser – so «she reached the
 *  final» is `finish === 1` by the bracket's own arithmetic and needs no flag, no points table and
 *  nothing stored. The header's fourth guard («NO POINTS ARE EVER COMPUTED») is untouched: this
 *  reads the same index and still never opens `TIERS[tier].points`. */
export function outcomeOf(open: LocalOpen): LocalOpenOutcome {
  if (open.finish === 0) return 'won'
  if (open.finish === 1) return 'final'
  return 'lost'
}

/** ⭐ HER MATCHES, IN THE ORDER SHE PLAYED THEM – one to `rounds` of them, and every one carries the
 *  `seed` `playMatch` wrote onto it, so a screen can replay any of them through the real point
 *  engine and get exactly the match the bracket already resolved. That replayability is what makes
 *  the shipped viewer able to show this weekend with no new mechanism.
 *
 *  ⚠ HERS ONLY. The other three quarters of the draw are AI-AI rows resolved by the closed form –
 *  they carry no seed and no scoreline and there is nothing to watch in them (`playMatch`). */
export function herMatches(open: LocalOpen, kidId: string): MatchRecord[] {
  return open.result.matches
    .filter((m) => m.aId === kidId || m.bId === kidId)
    .sort((a, b) => a.round - b.round)
}

// =================================================================================================
// ⭐ THE RHYTHM – 1-2 A YEAR, FROM TEN, AND DERIVED FROM WHAT THE PLAYER BOUGHT
// =================================================================================================
//
// His ruling (§2.2) is a rhythm and not a schedule: «1-2 a year, по принципу колледжа». So this reads
// the year the player actually chose rather than carrying a list of tournament years beside the card
// table, which would be a second place the prologue's shape is written down and the first one to go
// stale. It is the same mechanism `readTwelfth` uses one file over: a comparison against the table,
// no flag, no field anywhere saying «this year has a tournament in it».

// ⚠⚠ PHASE 11 CORRECTED THE READING OF HIS RHYTHM – TWICE, AND THE SECOND CORRECTION IS HIS OWN.
//
// FIRST, PHASE 3's reading: «1-2 a year» is a property of THE YEAR – a year is a matchplay year or
// it is not. Phase 3 measured the consequence honestly: no card at 11, 12 or 13 is a matchplay year,
// so the table produced exactly one Open, at ten, «because no card there is a matchplay year – that
// is a card-table question, not a pool question». He then said what he meant: «мы договаривались,
// что турниры в прологе тоже будут, сейчас этого нет, надо с 10 лет по 1 хотя бы добавить в год, как
// в колледже.»
//
// SECOND, AND WRONG, WAS MINE: that the age-10 card decides whether she becomes a competitor at all
// and every later year follows from it – a switch thrown once. THE OWNER: «Сказали "не в этом году"
// – значит не в этом году, дальше тоже можно спрашивать, не вижу проблем.»
//
// ⭐ SO THE RHYTHM IS A YEAR-BY-YEAR ANSWER AND NOT A STATE. The question is asked in every year
// from his floor (the card's own decision at ten, the lighter `tournament` ask at 11, 12 and 13 –
// see cards.ts), and a year holds a weekend if and only if the player said yes THAT YEAR. Nothing is
// carried forward, nothing is remembered between years, and «not this year» means what it says.
//
// ⭐⭐ ONE YES BUYS ONE WEEKEND, and that is a reading of his correction rather than of his range.
// «1-2 a year» is his phrase and `maxPerYear` below is still his cap – but the question is now asked
// ONCE a year, and a year that quietly produced TWO weekends off a hidden appetite threshold would
// be the game deciding something it had just asked the player about. So a yes is a weekend. The cap
// is what holds a future card that asks twice; today's table asks once, so today one is what a yes
// buys, and `tests/prologue-pool.test.ts` pins both halves.

/** HOW MANY LOCAL OPENS A YEAR HOLDS. Zero before ten (his floor) and zero in a year the player did
 *  not enter her; otherwise one, and never more than his cap.
 *
 *  ⚠ `entered` IS NOT A FLAG ON ANYTHING AND NOT A STATE. It is `enteredIn(age, run)` in run.ts –
 *  the ONE reader of this year's answer, which knows that at ten the answer is the card's own
 *  `matchplay` decision and at eleven and after it is the lighter ask. This module never sees a run
 *  and never sees a card's ask; it is handed the answer. */
export function localOpensIn(year: PrologueYear, entered: boolean): number {
  if (year.age < LOCAL_POOL.fromAge) return 0
  if (!entered) return 0
  return Math.min(1, LOCAL_POOL.maxPerYear)
}

/** ⭐ HOW MANY WEEKENDS THE YEAR AT `age` HOLDS – the ONE entry point a screen needs. `entered` is
 *  the set of ages the player said yes in (`enteredAges` in run.ts). A year that is not in `years`
 *  yet holds nothing, which is what a childhood still in progress looks like. */
export function localOpensAt(years: readonly PrologueYear[], age: number, entered: readonly number[]): number {
  const year = years.find((y) => y.age === age)
  if (!year) return 0
  return localOpensIn(year, entered.includes(age))
}

/** Every Local Open of a whole childhood, in order, as `(age, index)` pairs. The caller plays them;
 *  this only says which weekends happened. */
export function prologueSchedule(
  years: readonly PrologueYear[],
  entered: readonly number[],
): { age: number; index: number }[] {
  const out: { age: number; index: number }[] = []
  for (const y of years) {
    for (let i = 0; i < localOpensAt(years, y.age, entered); i++) out.push({ age: y.age, index: i })
  }
  return out
}
