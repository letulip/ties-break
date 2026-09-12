// THE SPIRIT BENCH (wave 1, runbook §6; wave 2's bench duty, runbook §7) - `npm run bench:spirit`.
// Same shape as the econ / fatigue / knock / radar benches: a measurement harness, run by hand,
// never part of a gate.
//
// ⭐⭐⭐ WHAT WAVE 2 ADDED, AND WHAT IT FOUND (09.09, who-she-is §4a-w2). Bar 3 was re-aimed to wave 2
// by the owner's ruling, so the two arms now ANSWER her at the fork instead of listening: care backs
// her want and matches it, grind presses and contradicts. The census in section [3] then measured
// that the arms never run - her opinion is raised by the tick that opens the fork, week 242, and the
// bar grid ends at week 208 with bar 3's own reading at week 156. `--fork` walks past 242 to price
// the deltas where they land; that row is a diagnostic and is not a bar.
//
// ⚠⚠⚠ AND ONE ROW OF `--fork` RUNS IN A **BENCH-ONLY MODE** – section [3c], v74 T16b point 4. T17's
// walked grid measured the drivers at the fork as `worn 0 · strained 26 · own 226`: no career on the
// grid is `worn` there, so the whole `worn` column of the copy (her four lines and the coach's read)
// is carried by unit tests and by nothing walked. [3c] therefore POKES `world.spirit` TOOL-SIDE into
// the worn band on the week before the fork opens – `tools/life-arrival.ts`'s own precedent, one
// field written by the bench on the bench's own world – so the column renders at least once inside a
// real walk. It takes NO draw, derives NO stream and changes NO engine code, and MAIN is untouched
// (the frozen capture 41550 / e6b0c709 lives in `tests/condition.test.ts` and cannot see this file).
// ⚠⚠ THE POKED CAREERS ARE A SEPARATE LIST AND ENTER NO OTHER SECTION. Nothing in [1]–[6], in [3] or
// in [3b] sees them: the walked census keeps printing its honest `worn 0`, which is the FINDING, and
// [3c] prints the two rows side by side under a banner so that no reader can take one for the other.
//
// ⭐⭐⭐ WHAT v75 T9 PAID OFF, AND IT IS THE OLDEST DEBT IN THIS FILE. Five calls here stood inside a
// bare `catch {}` – `bookVacation`, `enterEvent`, `chooseGift`, `answerLifeBeat`, `answerFork` – and
// two of them ARE the history above: the `'met'` row that left 842 beats raised and zero answered,
// and the `FORK_UNHEARD_REFUSAL` that printed `bondAtFork: NaN` in both arms. who-she-is §4a's
// wave-3 entry called the second «found and fixed»; the 12.09 correction (`8388c070`) records that
// the fix was a DRAIN placed in front of the catch, and that the catch stayed. Each of the five is
// now either a TESTED precondition or a narrow catch keyed on an engine-exported refusal constant,
// and every refusal either shape tolerates is counted into **[7] THE REFUSAL LEDGER** – printed on
// every mode, printed when it is empty, and summarised in one line on the verdict sheet. A stall can
// no longer reach this file's output wearing a number.
//
// ⚠⚠ WHAT THIS FILE IS FOR, AND WHAT IT IS FORBIDDEN TO DO. CLAUDE.md invariant 5 - «tuning is
// measured, not guessed» - and the runbook's own sentence: **a bar that fails is a finding for the
// owner, never a licence to touch a constant.** This tool reads `ECONOMY.spirit` / `ECONOMY.bond`
// and changes nothing. If a number below comes back red, the number below is the report.
//
// THE QUESTION THE WAVE OWES AN ANSWER TO, in six parts (runbook §6):
//
//   1  does spirit MOVE at all                per-career sd over weeks >= 2 points, both arms
//   2  does it DRIFT                          weeks < 20 or > 95 under 2%; long-run mean 70 +/- 4,
//                                             held PER TEMPERAMENT and not merely pooled
//   3  does bond SEPARATE parenting           grind-vs-care gap >= 12 points at season 3, > 2x SEM
//   4  is either arm pinned at a clamp        neither bond median at 0 or 100
//   5  ⚠ THE FAIRNESS CORRIDOR                paired lifetime match-win deltas across temperaments
//                                             inside +/- 1.5 pp. who-she-is §4 names the ONLY
//                                             sanctioned compensator and it needs his word first.
//   6  is any Mood word dead copy             with the five-word ladder's cut points as a FREE
//                                             PARAMETER, what distribution is there to cut, and
//                                             which cuts would put all five in >= 2% of weeks
//
// ⚠ 6 PROPOSES NOTHING AS RULED. The five words, the ladder and its cut points are the owner's
// (CLAUDE.md invariant 4) and step 4 of the runbook is blocked on his wording pass. This file
// prints the DISTRIBUTION and the arithmetic of what would fit; it ships no word and no threshold.
//
// =================================================================================================
// THE GRID, AND WHY EACH HALF OF IT IS BUILT THE WAY IT IS
// =================================================================================================
//
// 32 seeds x 4 seasons x {care, grind} x 4 temperaments. Runbook §6, verbatim.
//
//   care    rest every knock  ·  a family week booked every season  ·  LIGHT exam weeks
//   grind   push every knock  ·  no family week ever                ·  HEAVY exam weeks
//
// ⚠ THE ARMS DIFFER IN PARENTING, NOT IN THE CALENDAR - the runbook's own words - and three
// deliberate choices keep that true rather than merely claimed:
//
//   (a) THE ENTRY POLICY IS IDENTICAL IN BOTH ARMS (`enterWhatSheCan`). A grind arm that also
//       entered more tournaments would fold the calendar into the answer, and bar 3 would be
//       measuring two things at once.
//       ⚠ AND IT IS THE ENGINE'S OWN CAUTION, not "enter everything": a week whose
//       `availabilityStatus` is anything but `ok` is skipped, which is exactly the family that does
//       not race her while she is Exhausted. MEASURED, because the aggressive policy looked
//       reasonable and was not: entering everything the medical gate does not HARD-block took her
//       into tournaments at condition 8-19 week after week, and the −4 played-hurt row then
//       out-weighed every arm-defining decision combined (bond ending at 13.5 in the CARE arm).
//       It also produced LESS tennis, not more – 206 lifetime matches against 211-231 for the
//       cautious policy, because a wrecked girl loses in the first round.
//
//   (b) THE BASE PLAN IS `balanced` IN BOTH ARMS. Only the EXAM weeks differ - `light` (train 60)
//       against `grind` (train 85) - because `ECONOMY.spirit.examTrainFloor` is exactly what
//       "light exams" vs "heavy exams" MEANS in the engine: the exam row fires at train >= 85 and
//       is silent below it. Running the whole career at two different plans would also have moved
//       injury rates, development and condition, and the spirit numbers would then be reporting
//       the training regime rather than the parenting.
//
//   (c) THE CARE ARM'S FAMILY WEEKS ARE BOOKED IN THE OFF-SEASON (season offsets 50 and 51, the
//       `staycation` package, which is free at every wealth band so no funds confound rides along).
//       The planner's own comment calls the off-season "the natural family-vacation week"; more to
//       the point, those weeks hold no tournaments, so a booked family week in the care arm takes
//       nothing off the calendar the grind arm still has.
//       ⚠ WEEK 49 IS LEFT FREE ON PURPOSE: it is `seasonWrapsWithNoVacation`'s own week, and the
//       two bookings at 50/51 are what makes that predicate answer false for the care arm.
//
// ⚠ THE FAMILY IS `wealthy`, WHICH IS radar-bench's OWN CHOICE AND FOR THE SAME REASON: this is a
// bench about the private life's two numbers, and the family's finances are not the variable under
// test. Measured on the default `middle` background, 2 careers in 8 ended in BANKRUPTCY at weeks 125
// and 157 - a ragged grid, a season-3 reading taken off careers that no longer exist, and a money
// story sitting inside every spirit number. At `wealthy` all careers run the full four seasons.
//
// ⚠ THE BIRTHDAY IS ANSWERED IDENTICALLY IN BOTH ARMS - always the thing she asked for. It is not
// one of the runbook's arm-defining decisions, so making it an arm difference would have handed
// bar 3 a gap it did not earn; answering it the same way in both arms exercises `chooseGift`'s new
// bond rows and hands §6's "his read" print the ask itself, without touching the care/grind
// difference at all.
//
// ⚠⚠ AND THE TEMPERAMENT IS ASSIGNED, NOT DRAWN, WHICH IS THE WHOLE FAIRNESS MEASUREMENT. The four
// temperament arms run the SAME 32 seeds with `world.temperament` overwritten after `createWorld`,
// so bar 5's deltas are PAIRED: seed-for-seed, arm-for-arm, the only difference between two careers
// being compared is who she is. Letting `temperamentFor` decide would have compared four DIFFERENT
// sets of careers and called the noise between them unfairness. The override is legal for exactly
// the reason it is safe: `temperament` is drawn on its own `seed:temperament` sub-stream and read in
// wave 1 by nothing but `temperamentIntensity` inside `accrueSpirit`, so overwriting the field moves
// no draw on any stream (the bench takes no draws of its own either - `rngFromSeed(world.seed)` is
// the world's own MAIN, exactly as every other bench drives it).
import {
  createWorld,
  tickWeek,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  chooseGift,
  birthdayOfferFor,
  bookVacation,
  enterEvent,
  availabilityStatus,
  skipTournament,
  closeTournament,
  matchesEverPlayed,
  TEMPERAMENTS,
  // ⚠ the two the SWEEP block below needs, and nothing the default run reads: the intensity axis
  // (bar 1 is read per intensity arm, not pooled) and the weekly rule itself (sweep 2 measures the
  // heal time through the engine's own function rather than as 25/rate).
  temperamentIntensity,
  accrueSpirit,
  // ⚠⚠ WAVE 2 - THE FOUR THE BEAT ARMS NEED. `answerLifeBeat` is what makes the two arms ANSWER her
  // rather than leave her standing there, `answerFork` is where the second delta lands, and
  // `forkWantOf` / `FORK_WANT_ANSWER` are how the bench knows what "matching her want" IS without
  // re-deriving her want (and without a second reading that could disagree with the engine's).
  pendingLifeBeat,
  answerLifeBeat,
  answerFork,
  forkWantOf,
  FORK_WANT_ANSWER,
  // ⚠⚠ v74 T17 – THE FIVE THE STOP-WANT SECTION NEEDS. `forkWantWeights` is the PURE formula the grid
  // is printed from (no world, no draw, no walk – so the grid is arithmetic and the share below it is
  // a measurement, and the two cannot be confused); `forkStopDriverOf` is the engine's own single
  // spelling of which root a stop has, asked rather than re-derived here; `lifeLogOf` is how the
  // walked half COUNTS the counsel rows the arc actually raised, which is this file's own hard rule
  // about actuation after a bench that exited 0 while answering nothing.
  forkWantWeights,
  forkStopDriverOf,
  lifeLogOf,
  FORK_WANTS,
  FORK_WANT_TILT,
  FORK_STOP_DRIVERS,
  // ⚠⚠ v74 T16b point 4 – THE TWO THE POKED ARM [3c] NEEDS, AND THEY ARE BOTH READS. The poked arm
  // must assert the STRING the walk selected and not merely that a string came back, so it captures
  // `buildLifeBeatPrompt(world).said` – the exact line a screen would draw, off the world in hand –
  // and then asks `lifeBeatSaid` (the engine's own pure assembler) for the SAME girl's `worn` and
  // `own` readings. Equal to the first and different from the second is the whole proof; a bench that
  // re-typed either pool would be asserting its own copy of the copy. ⚠ NEITHER TAKES A DRAW.
  buildLifeBeatPrompt,
  lifeBeatSaid,
  // ⚠ v74 – the engine's own refusal string, so the drain below can tell a terminal latch (which is
  // tolerated) from a beat kind with no bond-neutral answer (which must never be swallowed here).
  CAREER_ENDED_REFUSAL,
  // ⚠⚠ v75 T9 – THE FOUR THE REFUSAL LEDGER NEEDS, AND EVERY ONE OF THEM IS THE ENGINE'S OWN ANSWER
  // TO A QUESTION THIS FILE USED TO SWALLOW. `COLLEGE_FREEZE_REFUSAL` is the second half of
  // `guardNotEnded`'s pair, so a narrow catch can name BOTH latches instead of keying on one and
  // letting the other read as an unknown throw. `vacationForWeek` and `entryStatus` are the readers
  // the planner and the entry command validate with – asked HERE, before the call, so the bench does
  // not need a sentence of the engine's copy to know what the refusal would have been.
  // ⚠ THEY ARE READS. No draw, no stream, no write – `entryStatus` is the same function `enterEvent`
  // itself consults, which is exactly what keeps this from being a second reading of one rule.
  COLLEGE_FREEZE_REFUSAL,
  vacationForWeek,
  entryStatus,
  // ⚠⚠ T12 – the attachment slot, read for ONE purpose: `accrueSpirit` walks toward
  // `baseline + attachmentLift` while it returns a row, so "weeks under the baseline" has to know
  // how many of the pair's weeks were lived above a LIFTED target. It is also an invariance probe –
  // the arrival is keyed on (seed, calendar) alone, so the two arms must hold it on the same weeks.
  activeEpisode,
  // ⚠⚠ v75 T7 – THE ONE THE SHOCK ARMS NEED FROM THE BARREL, AND IT IS THE SAME RULE
  // `tools/life-arrival.ts` states at length: her age is ASKED of the engine and never computed here
  // (`14 + week/52` is the coach market's restocking clock wearing her name). Every week the shock
  // block cuts its windows on is derived through it.
  kidAgeExact,
} from '../src/engine/world'
import type { ForkStopDriver, ForkWant, Temperament, WorldState } from '../src/engine/world'
import type { LifeBeatKind } from '../src/shared/protocol'
// ⚠ T12 reads two knock facts the barrel does not re-export, from the leaf that owns them – the same
// direct-to-leaf shape this file already uses for `ECONOMY`, `isExamWeek` and `schoolEndWeek`.
// `knockGoverns` is the engine's OWN answer to "is this week one the push is being paid for", so the
// governed-week count below is the rule itself rather than a bench re-derivation of 3 weeks a push.
import { knockGoverns, KNOCK_PUSH_WEEKS, KNOCK_REST_GROWTH } from '../src/engine/knock'
// ⚠ [3c] READS THE THREE LADDERS OFF THE LEAF THAT OWNS THEM, `tools/life-arrival.ts`'s own
// direct-to-leaf import repeated: `lifeBeatPromptFor` words a line from (voice, register, band) and
// the poked arm has to ask `lifeBeatSaid` for the same girl, so it derives the register and the band
// through the ENGINE'S functions at the instant the prompt was built rather than by cutting its own.
// ⚠ AND IF EITHER DERIVATION IS EVER WRONG, THE ASSERTION GOES RED – it compares the captured string
// against them – which is the safe direction for a second reading to fail in.
// ⚠ v75 T7 – `spiritMatchFactor` joins them for ONE printed line: the shock arms report the exact
// factor the landing spirit produces, because «what a shock can reach a match through» is the whole
// of the mechanism behind bar S2 and a bench that quoted 0.98 would be re-typing the engine's curve.
import { bondBandOf, moodRegisterOf, spiritBandOf, spiritMatchFactor } from '../src/engine/spirit'
// ⚠ v75 T7 – the TALLIED drain and its two readers, so the shock arms can print «N drained x −1» as
// arithmetic rather than carry an unstated offset into a bond column (wave-4 brief §0.2).
import { drainLifeBeats, drainLifeBeatsTallied, drainSkewLine, emptyDrainCounts } from './_lifeBeats'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
// ⚠ v75 T9 – `TIERS` joins them for ONE read: the entry fee `enterEvent` refuses on. It is the
// engine's own table, asked at the call site, and it is the last of the four facts the entry policy
// now tests for instead of catching. Same direct-to-leaf shape this file already uses for `ECONOMY`.
import { isExamWeek, TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { schoolIsOver, schoolEndWeek } from '../src/engine/kidLife'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'

// =================================================================================================
// THE GRID
// =================================================================================================

const SEASONS = 4
/** Season 3's LAST week - the moment bar 3 reads bond at. ⚠ THE SAME NUMBER IN EVERY MODE below:
 *  bar 3 is «the gap AT SEASON 3» and a diagnostic that moved its reading would be answering a
 *  different question under the bar's name. */
const SEASON_3_WEEK = 3 * WEEKS_PER_YEAR
const SEED_COUNT = seedCount()
const ARMS = ['care', 'grind'] as const
type Arm = (typeof ARMS)[number]

/** ⭐⭐⭐ WAVE 2 - THE WEEK HER OPINION EXISTS, DERIVED AND NEVER QUOTED. `raiseForkOpinion` is
 *  called by the tick that opens the fork (`world/endings.ts`), the fork opens on `schoolEndWeek`,
 *  and the bench's profile is `DEFAULT_PROFILE` with only `background` overridden - so this is the
 *  earliest week any career on this grid can hold a `'fork-opinion'` row.
 *
 *  ⚠⚠ IT IS 242, THE DEFAULT GRID ENDS AT 208, AND BAR 3 READS AT 156. That ordering is the whole
 *  of what section [3] found in wave 2 and it is computed here rather than asserted, so a later
 *  birth-month or school-length change moves the print instead of silently invalidating it. */
const FORK_WEEK = schoolEndWeek(DEFAULT_PROFILE.birthMonth)

/** ⚠ THE DIAGNOSTIC GRID, `--fork`, AND IT IS NOT THE BAR GRID. The default walk is the runbook's
 *  four seasons, unchanged from wave 1, and every bar in this file is read off it. `--fork` walks
 *  one week past `FORK_WEEK` INSTEAD, for one purpose only: to price what the wave-2 deltas are
 *  worth on the week they land, since on the bar grid they never land at all. Bars 1/2/4/5/6 read a
 *  longer week series in that mode and are NOT comparable with wave 1; bar 3 is, because its reading
 *  is week 156 in both and the two walks are byte-identical up to week 208. */
const FORK_MODE = process.argv.includes('--fork')
const WEEKS = FORK_MODE ? FORK_WEEK + 1 : SEASONS * WEEKS_PER_YEAR

// =================================================================================================
// ⚠⚠⚠ [3c]'s POKE – THE BENCH-ONLY ARM, ITS DEPTH, AND WHY EACH NUMBER IS DERIVED
// =================================================================================================
//
// The walked grid cannot reach the `worn` driver (T17 measured `worn 0` over 252 careers that stated
// a want), so the copy keyed on it never renders in a walk. [3c] writes ONE FIELD – `world.spirit` –
// on the week before the fork opens, and that is the whole of the poke: no draw, no stream, no
// engine change, and no second field. `tools/life-arrival.ts`'s `endedWeek` poke is the precedent,
// down to the banner it prints over its own table.

/** ⚠⚠ HOW DEEP, AND IT IS DERIVED FROM THE ENGINE'S OWN TWO NUMBERS RATHER THAN CHOSEN. The driver
 *  line is `ECONOMY.life.forkStopDriverFrom` (worn > 0.15); the poke lands at THREE TIMES it, which
 *  is the shallowest depth the opening tick cannot undo: `accrueSpirit` walks her back toward the
 *  baseline by at most `max(ECONOMY.spirit.returnPerWeek)` a week, and the margin below is many
 *  times that. The arithmetic is printed in [3c] rather than asserted, so a constant that moves
 *  moves the print.
 *
 *  ⚠ IT IS A LEGAL SPIRIT AND NOT A SENTINEL: `min <= POKED_SPIRIT <= max`, a state the game itself
 *  can hold. A poke to an impossible number would be measuring a world the engine cannot produce. */
const POKE_WORN_MULTIPLE = 3
const POKED_SPIRIT =
  ECONOMY.spirit.baseline - POKE_WORN_MULTIPLE * ECONOMY.life.forkStopDriverFrom * (ECONOMY.spirit.baseline - ECONOMY.spirit.min)
/** The spirit at which the driver line itself sits – printed beside the poke so the margin is visible. */
const DRIVER_LINE_SPIRIT = ECONOMY.spirit.baseline - ECONOMY.life.forkStopDriverFrom * (ECONOMY.spirit.baseline - ECONOMY.spirit.min)
const MAX_RETURN_PER_WEEK = Math.max(...Object.values(ECONOMY.spirit.returnPerWeek))

/** ⚠ ONE PARENTING POLICY, AND `care` IS IT. The poked arm's job is to RENDER the worn column inside
 *  a walk, not to compare two parentings: a second policy would double a diagnostic whose bar is «at
 *  least once», and – worse – would hand the reader a second bond column to line up against the
 *  walked grid's, which is exactly the confusion the banner exists to prevent. `care` is the policy
 *  whose bond at the fork sits highest (measured 72.2 against grind's 56.6 at 4 seeds), and bond is
 *  what decides whether HER OWN VOICE speaks at all – below the flat-pool cut she says the pool's
 *  line and the driver reaches the player only through the coach. */
const POKED_ARM: Arm = 'care'
/** ⚠ SMALL ON PURPOSE, AND CAPPED RATHER THAN FIXED so `--seeds=1` still walks a poked career. This
 *  arm proves a column renders; it is not a rate and has no denominator worth widening. */
const POKED_SEEDS = Math.min(8, SEED_COUNT)

/** `--seeds=N` for a smoke run; the grid the bars are read off is the runbook's 32. */
function seedCount(): number {
  const flag = process.argv.find((a) => a.startsWith('--seeds='))
  const n = flag ? Number(flag.slice('--seeds='.length)) : 32
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 32
}

/** The care arm's two family weeks a season: off-season offsets, where no tournament ever sits. */
const VACATION_OFFSETS = [50, 51]
const VACATION_PACKAGE = 'staycation'

// =================================================================================================
// ⭐⭐⭐ [7] THE REFUSAL LEDGER – v75 T9, AND IT IS THE FIVE BARE `catch {}` BLOCKS BEING PAID OFF
// =================================================================================================
//
// ⚠⚠ WHAT STOOD HERE, AND WHY THE RECORD OF IT WAS WRONG. Until this step five calls in this file
// sat inside `} catch {` with an EMPTY body – `bookVacation`, `enterEvent`, `chooseGift`,
// `answerLifeBeat` and `answerFork` – and every one of them swallowed every throw the engine could
// raise. Two of the five ARE this file's history: `'That is not one of the answers this beat
// offered'` (wave 3's `'met'` row – 842 beats raised, ZERO answered, exit 0) and
// `FORK_UNHEARD_REFUSAL` (`bondAtFork` NaN in both arms, with no error anywhere). who-she-is §4a's
// wave-3 fourth entry called the second one «found and fixed with a second bond-neutral drain»; the
// correction of 12.09 (`8388c070`) records what actually happened – **the drain was added IN FRONT
// of the catch and the catch stayed** – so the day the drain stopped clearing, the swallow was still
// sitting there ready to print NaN in silence. This block is that debt paid, not re-described.
//
// ⚠⚠ THE RULE IT INSTALLS IS THE SHOCK BLOCK'S OWN INSTRUMENT LAW READ ONTO THE REST OF THE FILE
// ([S]'s «NO try/catch IN THIS BLOCK. Not one … the one refusal a walk can legitimately meet is
// TESTED, never caught»), and the `--push` block's `knocksLatched` column is its precedent: a
// refusal the walk is entitled to meet is COUNTED and PRINTED rather than caught. Every guarded call
// below is now exactly one of two shapes:
//
//   TESTED  the bench asks the ENGINE'S OWN reader first and does not make the call. ⚠⚠ THE CALL
//           BEHIND THE TEST STAYS **BARE**, which is the whole reason a test here is not a second
//           reading of the engine's rule: a test that is too PERMISSIVE lets the engine throw and
//           STOPS THE RUN, and a test that is too STRICT shows up as a count in this table that
//           nobody can explain. Neither direction can be silent, which is the one property the
//           swallow denied us.
//   CAUGHT  a narrow catch keyed on one of the engine's own EXPORTED refusal constants – the shape
//           `drainEveryBeat` and the two `drainLifeBeats` sites already use, and the reason those
//           three are untouched by this step. Anything else is rethrown, with the site and the
//           career prefixed onto the message, so the run dies where the swallow used to shrug.
//
// ⚠ THE ARM-DEFINING **POLICY** SKIP IS NOT A REFUSAL AND IS DELIBERATELY NOT IN HERE.
// `enterWhatSheCan` passing over an event whose `availabilityStatus` is not `ok` is the family
// reading the caution and waiting – it is the header's decision (a), it is identical in both arms,
// and it was never a swallowed throw. Counting it would bury the rows this table exists for under
// thousands of rows of the entry policy working exactly as ruled.

type RefusalHow = 'tested' | 'caught'

interface RefusalRow {
  /** the bench function that met it – two sites meeting one sentence stay two rows */
  site: string
  how: RefusalHow
  /** the ENGINE'S own sentence (`caught`), or the state its own reader answered (`tested`) */
  because: string
  count: number
  /** seed / temperament / week of the FIRST one: a count with no example is not reproducible */
  firstAt: string
}

const REFUSALS = new Map<string, RefusalRow>()

/** Where a refusal happened, in the one spelling every row uses. ⚠ `world.temperament` is the field
 *  this bench overwrites itself, which is what makes it the right label here: it names the arm the
 *  row came from without a call site having to be handed a `Career` it does not otherwise need
 *  (`bookTheFamilyWeeks` and `answerTheBirthday` take shapes, on purpose – see their own notes). */
function refusalAt(world: WorldState): string {
  return `${world.seed}/${world.temperament} w${world.week}`
}

function noteRefusal(site: string, how: RefusalHow, because: string, at: string): void {
  const key = `${site}|${how}|${because}`
  const row = REFUSALS.get(key)
  if (row === undefined) REFUSALS.set(key, { site, how, because, count: 1, firstAt: at })
  else row.count++
}

/** ⭐⭐ THE NARROW CATCH, SPELLED ONCE. Tolerates ONLY the engine's own exported refusal constants the
 *  call site names, counts what it tolerated, and RETHROWS everything else – the same error object,
 *  so the stack still points at the engine, with the site and the career prefixed onto its message.
 *
 *  ⚠⚠ `allowed` IS A LIST OF ENGINE CONSTANTS AND MAY NEVER BECOME A LIST OF LITERALS. A sentence
 *  retyped here is a copy of the engine's copy: it rots silently the first time the engine rewords
 *  one, and a tolerance that has rotted is a swallow again. Every caller below passes
 *  `CAREER_ENDED_REFUSAL` and/or `COLLEGE_FREEZE_REFUSAL`, both imported from the barrel. */
function tolerate(site: string, at: string, e: unknown, allowed: readonly string[]): void {
  if (!(e instanceof Error) || !allowed.includes(e.message)) {
    if (e instanceof Error) e.message = `${site} @ ${at}: ${e.message}`
    throw e
  }
  noteRefusal(site, 'caught', e.message, at)
}

// =================================================================================================
// ONE CAREER
// =================================================================================================

interface Career {
  seed: string
  arm: Arm
  temperament: Temperament
  /** spirit after every resolved week, in order */
  spirit: number[]
  /** bond at the end of every resolved week, after that week's decisions */
  bond: number[]
  /** bond at the end of season 3 - bar 3's own reading */
  bondAtSeason3: number
  matchesPlayed: number
  matchesWon: number
  knocks: number
  injuries: number
  vacations: number
  /** Weeks a decision cost her 3.5 bond or more INSIDE one tick. Only two rows can do that: the
   *  played-hurt −4 and (grind arm only, once a season) the zero-vacation −3 landing beside the
   *  0.5 regression. Read off the bond delta across the tick rather than off a news string, so no
   *  copy change can silently turn this counter into a zero. */
  heavyWeeks: number
  /** every birthday ask she raised, by gift id */
  asks: string[]
  /** ⭐⭐ WAVE 2's CENSUS, AND IT EXISTS TO MAKE A NULL RESULT FALSIFIABLE. CLAUDE.md's rule -
   *  «before you believe a null result, prove the arm contains both the change and its reader» - is
   *  unprovable from a bond number alone: an arm that answers her and an arm whose answering code
   *  never runs produce the SAME gap if the beat is out of the grid's reach. These four counters are
   *  what tells those two apart, and section [3] prints them beside the bar. */
  /** `'fork-opinion'` rows this career ever held (0 or 1 - the fork is raised once). */
  beatsRaised: number
  /** what he SAID, by option id, in `lifeLog` order - `back` in the care arm, `press` in grind. */
  beatAnswers: string[]
  /** what he DID at the fork, priced against her recorded want, or null if he never answered one. */
  forkCongruence: 'with' | 'against' | null
  /** bond immediately after the fork was answered - the week the two wave-2 deltas have landed.
   *  NaN for every career that never reached one, which on the bar grid is all of them. */
  bondAtFork: number
  /** ⭐⭐⭐ v74 T17's FOUR, AND THEY ARE THE ACTUATION RECORD AS MUCH AS THE MEASUREMENT. The share
   *  printed in [3b] is «stops with no readable root, over careers that reached the fork», and a
   *  share whose denominator nobody printed is worth nothing - this file has already shipped a
   *  «0 answered» run that exited 0. So the want, the root reading it was drawn under, the driver the
   *  ENGINE derived from that reading, and the count of counsel rows the arc actually raised are all
   *  recorded per career, and every one of them is printed beside the number it supports. */
  forkWant: ForkWant | null
  /** the driver at the moment her row was answered - the engine's own function, not a re-derivation */
  forkDriver: ForkStopDriver | null
  /** the two roots as the weights read them, for the STRICT «unsupported» reading (both exactly 0) */
  forkRoots: { worn: number; strained: number } | null
  /** `'fork-counsel'` rows this career ever held - 0 on every want but `stop`, 1 on a stop */
  counselRows: number
  /** ⭐⭐⭐ v75 T9 – REFUSALS THE TWO **ANSWER** SITES TOLERATED ON THIS CAREER, so the census in [3]
   *  carries the number in the row that once printed `bondAtFork: NaN`. The ledger in [7] is the
   *  whole run's and covers all five sites; this is the per-career half, and it exists because «her
   *  row was answered» and «her row refused and nobody said so» are the two readings the wave-2
   *  census cannot otherwise tell apart. ⚠ A non-zero cell here does NOT mean a bug – it means the
   *  terminal latch landed on the same week as her row – but a non-zero cell beside a `–` in
   *  `bond @ fork` is the exact shape of the stall this file has shipped twice. */
  refusals: number
  weeks: number
  /** null when she played all four seasons; the ending's own type when she did not */
  endedAs: string | null
  /** ⚠⚠ [3c] ONLY – true on a career walked in the BENCH-ONLY poked arm, false on every career any
   *  other section of this file reads. The separation is structural rather than a filter: the poked
   *  careers live in [3c]'s own local list and are never pushed into `careers`, which is the list
   *  every bar and every census reads. The flag is what the WALK itself asks (`if (career.poked)`)
   *  before it pokes a field or captures a string, so a career that was never meant to be poked
   *  cannot be, and a reader of any row can see which population it came from. */
  poked: boolean
  /** the spirit the ENGINE had on the week the poke overwrote it, and `null` when the poke never
   *  fired (the career ended before the fork week). «The poke moved the state» is this number beside
   *  `forkRoots.worn`, and a poke that silently did nothing is visible as an unmoved pair. */
  spiritBeforePoke: number | null
  /** ⭐⭐⭐ WHAT THE WALK ACTUALLY RENDERED, captured in the poked arm alone – the trap this step is
   *  written against is «a poked arm renders a line without proving it is the right one». */
  render: ForkRender | null
}

/** ⭐⭐⭐ [3c]'s EVIDENCE ROW. Every field is either a string the WALK produced (`said`) or the
 *  ENGINE'S OWN reading of the same girl under a named driver (`worn` / `own`), so the assertion is a
 *  comparison of two things this file did not write.
 *
 *  ⚠⚠ AND THE `own` READING IS NOT DECORATION – IT IS THE DISCRIMINATOR. At a bond below the flat-pool
 *  cut her line is the pool's line whatever the driver is, so `said === worn` ALONE would pass on a
 *  career whose worn copy never rendered. `worn !== own` is what says the driver is visible in this
 *  girl's line at all; `worn === own` is the honest «flat pool spoke» reading, counted apart and
 *  never as a render. The coach's read is keyed on the driver at EVERY band, so his pair always
 *  differs – and if it ever does not, [3c] throws rather than counting it. */
interface ForkRender {
  /** her line, as `buildLifeBeatPrompt` assembled it for a screen this week */
  herSaid: string
  herWorn: string
  herOwn: string
  /** the coach's counsel, null when the want was not `stop` (no counsel is raised, by the ruling) */
  coachSaid: string | null
  coachWorn: string | null
  coachOwn: string | null
  /** the spirit and bond the two readings above were derived at – the instant the prompt was built */
  spiritAtRead: number
  bondAtRead: number
}

function runCareer(seed: string, arm: Arm, temperament: Temperament, poked = false): Career {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy' })
  // ⚠ THE ONE FIELD THE BENCH WRITES. See the header: paired arms, zero draws moved.
  world.temperament = temperament
  const rng = rngFromSeed(world.seed)
  const career: Career = {
    seed,
    arm,
    temperament,
    spirit: [],
    bond: [],
    bondAtSeason3: Number.NaN,
    matchesPlayed: 0,
    matchesWon: 0,
    knocks: 0,
    injuries: 0,
    vacations: 0,
    heavyWeeks: 0,
    asks: [],
    beatsRaised: 0,
    beatAnswers: [],
    forkCongruence: null,
    bondAtFork: Number.NaN,
    forkWant: null,
    forkDriver: null,
    forkRoots: null,
    counselRows: 0,
    refusals: 0,
    weeks: 0,
    endedAs: null,
    poked,
    spiritBeforePoke: null,
    render: null,
  }

  for (let i = 0; i < WEEKS; i++) {
    if (world.ending !== null) break
    // --- the family's season plan, laid at each season boundary (care arm only) ------------------
    if (arm === 'care' && world.week % WEEKS_PER_YEAR === 0) bookTheFamilyWeeks(world, career)
    // --- what this week is going to be worked at ------------------------------------------------
    world.plan = { ...planFor(world, arm) }
    // --- the ordinary entry policy, the SAME one in both arms ------------------------------------
    enterWhatSheCan(world)

    // --- ⚠⚠ THE POKE. BENCH-ONLY, [3c] ONLY. ONE FIELD, NEVER A STREAM, NEVER THE ENGINE. --------
    //
    // The only line in this file that writes to a world after `temperament`, and it writes to the
    // bench's own copy. It fires on the week BEFORE the fork opens, because the tick below is the one
    // that opens it: `tickWeek` increments the week first and `raiseForkOpinion` READS `world.spirit`
    // when it draws her want (world/endings.ts §7c), so a poke landing after the tick would colour
    // the wording of a want that was drawn off an unpoked girl – two readings of one moment, which is
    // the defect this file keeps catching in itself.
    // ⚠ `accrueSpirit` runs inside that same tick and walks her back toward the baseline by at most
    // `MAX_RETURN_PER_WEEK`; `POKED_SPIRIT` sits many times that below the driver line, which is why
    // the depth is derived from the constants instead of chosen. [3c] prints the margin.
    // ⚠ IT IS CONFINED TO ONE WEEK OF ONE CAREER IN ONE ARM: every career in every other section of
    // this file walks with `poked === false` and never enters this branch.
    if (career.poked && world.week + 1 === FORK_WEEK) {
      career.spiritBeforePoke = world.spirit
      world.spirit = POKED_SPIRIT
    }

    const bondBefore = world.bond
    tickWeek(world, rng)
    career.weeks++
    career.spirit.push(world.spirit)
    if (world.bond - bondBefore <= -3.5) career.heavyWeeks++
    if (world.injury !== null && world.injury.sinceWeek === world.week) career.injuries++

    // Her competition resolves the way a played career's does: watch nothing, close everything.
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }

    // --- the parent's two decisions of the week --------------------------------------------------
    if (pendingKnock(world)) {
      career.knocks++
      decideKnock(world, arm === 'care' ? 'rest' : 'push')
    }
    answerTheBirthday(world, career)
    // ⭐⭐⭐ WAVE 2 - AND THE ORDER OF THESE TWO IS THE ENGINE'S, NOT THE BENCH'S. `answerFork`
    // refuses while her row is unanswered (`FORK_UNHEARD_REFUSAL`), so the words come before the
    // deed here because they come before the deed in the world.
    answerTheLifeBeat(world, arm, career)
    answerTheForkTheWayThisArmWould(world, arm, career)

    // Bond is read AFTER the week's decisions - "what he has built with her by the end of week W".
    career.bond.push(world.bond)
    if (world.week === SEASON_3_WEEK) career.bondAtSeason3 = world.bond
  }

  career.endedAs = world.ending === null ? null : world.ending.type
  career.matchesPlayed = matchesEverPlayed(world)
  career.matchesWon = world.seasonWins + world.seasonHistory.reduce((sum, h) => sum + h.wins, 0)
  // ⚠ NaN IS LEFT IN PLACE for a career that never reached week 156 (a career-ending injury is a
  // real outcome, not a harness fault). Bar 3 filters it out and prints its own n rather than
  // substituting the final bond of a career that was over by then - which would have quietly told
  // the bar a season-3 number that no season 3 produced.
  return career
}

/** LIGHT exam weeks against HEAVY ones, and nothing else about the plan differs - see header (b). */
function planFor(world: WorldState, arm: Arm) {
  const next = world.week + 1
  const exam = isExamWeek(next, schoolIsOver(next, world.profile.birthMonth))
  if (!exam) return WEEK_PLAN_PRESETS.balanced
  return arm === 'care' ? WEEK_PLAN_PRESETS.light : WEEK_PLAN_PRESETS.grind
}

/** The care arm's family weeks, booked a season ahead into the off-season.
 *
 *  ⚠⚠ v75 T9 – THE SWALLOW IS GONE AND THE CALL IS BARE. This doc read «Swallows the planner's
 *  refusals the way the screen does: an unbookable week is simply a week the family does not get» –
 *  a true sentence about a SCREEN and the wrong one for an instrument. The screen shows the parent a
 *  lock; the `catch {}` showed nobody anything, and it stood over `guardNotEnded`, seven
 *  `assertPlannable` refusals, an unknown package id and the funds check alike.
 *
 *  Two TESTS replace it and the call behind them is bare (see [7]'s header for why that is the point
 *  and not a risk):
 *    · the LATCH, which is the shape the rest of the house uses – every caller of this function
 *      already breaks its loop on `world.ending !== null`, and testing it here too costs nothing and
 *      makes the function honest on its own rather than on its callers' behaviour;
 *    · the week already being SPOKEN FOR, asked through `vacationForWeek` – the engine's own reader,
 *      the very one `assertPlannable` consults, rather than a re-derivation of the rule.
 *
 *  ⚠ AND EVERYTHING ELSE `assertPlannable` CAN REFUSE IS A FINDING THAT STOPS THE RUN – an exam week,
 *  a tournament entered that week, a practice booking, the funds. The care arm books off-season
 *  offsets 50/51, which hold no tournament (the header's decision (c)) and no exam (`examWeeks` is
 *  offsets 23–24), for a `wealthy` family taking `staycation`, which is free at every band. If one of
 *  those ever refuses, the header of this file has stopped being true – and a silent `vacations`
 *  column is the last place anybody would have looked for it.
 *
 *  ⚠ THE COUNTER IS TAKEN STRUCTURALLY (`{ vacations: number }`) RATHER THAN AS A `Career`, so T12's
 *  pair below books its family weeks through THIS function instead of growing a second copy of the
 *  off-season rule. Nothing about the care arm changed: a `Career` still satisfies the shape. ⚠ It is
 *  also why this site's refusals live in [7]'s run-wide ledger and in no per-career column: the shape
 *  is the whole point, and widening it to carry a counter would undo it. */
function bookTheFamilyWeeks(world: WorldState, career: { vacations: number }): void {
  if (world.ending !== null) {
    noteRefusal('bookTheFamilyWeeks', 'tested', 'the career has a latched ending', refusalAt(world))
    return
  }
  for (const offset of VACATION_OFFSETS) {
    const week = world.week + offset
    if (week >= WEEKS) continue
    if (vacationForWeek(world, week) !== undefined) {
      noteRefusal('bookTheFamilyWeeks', 'tested', 'that week is already a family vacation', refusalAt(world))
      continue
    }
    bookVacation(world, week, VACATION_PACKAGE)
    career.vacations++
  }
}

/** THE ORDINARY ENTRY POLICY, IDENTICAL IN BOTH ARMS: everything she is eligible for inside a
 *  four-week horizon, and NOTHING the game itself is cautioning about. `availabilityStatus`'s three
 *  levels are the engine's own opinion of an entry - `blocked` is the doctor's veto and the tour's
 *  closed doors, `caution` is "Exhausted - racing risks injury", and `ok` is the rest. Taking only
 *  `ok` is the family that reads the caution and waits a week; see the header for what taking
 *  `caution` as well was measured to do to her.
 *
 *  ⚠⚠ v75 T9 – AND THE `catch {}` AROUND IT IS GONE, REPLACED BY `enterEvent`'S OWN FOUR REFUSALS
 *  ASKED IN `enterEvent`'S OWN ORDER. The old comment named three of them («not affordable, not
 *  eligible, deadline gone») and the catch covered everything, including a policy call that threw.
 *  The FOUR that this walk can actually meet are now tested, counted into [7] and skipped:
 *
 *    deadline    `world.week > e.deadlineWeek`. ⚠ THIS ONE FIRES ON EVERY CAREER, EVERY WEEK, AND
 *                WAS INVISIBLE: entries close at `week − 2` (season/calendar.ts), and this loop's
 *                horizon opens at `world.week + 1`, so the nearest event in the window is ALWAYS
 *                past its deadline. The swallow was carrying a structural miss as if it were an
 *                occasional lock.
 *    one a week  she has one body and one week – `enterEvent`'s own ladder-up rule.
 *    funds       the tier's entry fee against the family's cash.
 *    the gate    `entryStatus(...).level === 'blocked'` – THE SAME FUNCTION `enterEvent`
 *                re-validates with, so this is not a second reading of the rule. ⚠ It is a STRICTLY
 *                STRONGER gate than the policy line above it: `availabilityStatus` answers «can she
 *                play at all this week», `entryStatus` is band + availability, so an event she is
 *                simply not ranked for passed the policy and was refused by the engine, silently.
 *
 *  ⚠ THE POLICY LINE ITSELF IS UNTOUCHED AND STILL FIRST. It is arm-defining (header (a)) and it is
 *  a SKIP, never a caught throw, so it is not in [7]'s ledger – see that block's own note. It is also
 *  now OUTSIDE any catch: if `availabilityStatus` ever throws, the run stops instead of quietly
 *  entering nobody for a season.
 *  ⚠ THE LATCH NEEDS NO TEST HERE: every caller breaks its loop on `world.ending !== null` on the
 *  line before, and `enterEvent`'s `guardNotEnded` is therefore unreachable. If that ever stops being
 *  true the guard throws and the run stops, which is the direction this whole block chooses. */
function enterWhatSheCan(world: WorldState): void {
  for (const e of world.season) {
    if (e.week <= world.week || e.week > world.week + 4) continue
    if (world.entries.includes(e.id)) continue
    if (availabilityStatus(world, e).level !== 'ok') continue
    const at = refusalAt(world)
    if (world.week > e.deadlineWeek) {
      noteRefusal('enterWhatSheCan', 'tested', 'the entry deadline has passed', at)
      continue
    }
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) {
      noteRefusal('enterWhatSheCan', 'tested', 'she is already entered in a tournament that week', at)
      continue
    }
    if (world.fundsCents < TIERS[e.tier].entryFeeCents) {
      noteRefusal('enterWhatSheCan', 'tested', 'not enough funds for the entry fee', at)
      continue
    }
    if (entryStatus(world, e).level === 'blocked') {
      noteRefusal('enterWhatSheCan', 'tested', 'the entry gate is blocked (entryStatus: band + availability)', at)
      continue
    }
    enterEvent(world, e.id)
  }
}

/** Answered the SAME way in both arms - she gets the thing she asked for. See the header for why
 *  this is deliberately not an arm difference. The ask itself is what §6's print wants.
 *
 *  ⚠ `{ asks: string[] }` FOR THE SAME REASON `bookTheFamilyWeeks` TAKES A SHAPE: T12's pair answers
 *  the birthday identically in both of ITS arms too, and one implementation is what guarantees the
 *  two walks cannot drift into answering her differently. */
function answerTheBirthday(world: WorldState, career: { asks: string[] }): void {
  const age = pendingBirthday(world)
  if (age === null) return
  const { options, askedId } = birthdayOfferFor(world, age)
  if (options.length === 0) return
  career.asks.push(askedId)
  const granted = options.some((g) => g.id === askedId) ? askedId : options[0].id
  try {
    chooseGift(world, granted)
  } catch (e) {
    // ⚠⚠ v75 T9 – NARROW AND RE-THROWING, KEYED ON THE ENGINE'S OWN EXPORTED CONSTANT. It read
    // `catch { /* a latch we cannot answer behind */ }`, and the comment described ONE of the three
    // things `chooseGift` throws. The other two are already TESTED two lines up and must never be
    // tolerated: «there is no birthday to answer this week» cannot fire behind `pendingBirthday`
    // returning non-null, and «that is not one of this birthday's four options» cannot fire on an id
    // taken from `birthdayOfferFor`'s OWN list – unless the offer and the re-validation have stopped
    // agreeing about the college band, which is a defect in the engine's one-function rule and not a
    // birthday the family does not get. Either of them now stops the run.
    // ⚠ `guardNotEndedForGood`, so the freeze is NOT a tolerance here: a college week is exactly when
    // this command is supposed to work (round 24's ruling – the third member of that list).
    tolerate('answerTheBirthday', refusalAt(world), e, [CAREER_ENDED_REFUSAL])
  }
}

// =================================================================================================
// ⭐⭐⭐ WAVE 2 - THE TWO ARMS ANSWER HER, AND THEY ANSWER HER DIFFERENTLY
// =================================================================================================
//
// ⚠⚠ WHY THIS IS NOT `answerLifeBeat(world, 'listen')`. Forty tools and several suites gained
// `if (pendingLifeBeat(world)) answerLifeBeat(world, 'listen')` when the fork refusal landed, because
// every harness that walks a career to the fork must now answer her before it may answer the fork.
// That line is correct for a harness measuring something else and WRONG here: `beatListened` is 0 on
// the bond table, so a bench that listened in both arms would be measuring a NEUTRAL world and
// reporting wave 1's number back with a wave-2 date on it. This bench is the one place the answer is
// itself the variable, so the arms answer deliberately - and the census counters above are what
// prove the code ran rather than merely existing.
//
//   care    backs her want (+2) and MATCHES it at the fork (+3)      = +5 over the two deltas
//   grind   presses the other way (−2) and CONTRADICTS it (−4)       = −6
//
// 11 raw points of arm separation, which is the whole of what wave 2 can be worth to bar 3.
//
// ⚠⚠ AND THE SAME PARAGRAPH IS WHY v74 NEARLY KILLED THIS FILE IN SILENCE. Wave 3's T6 added a
// second beat kind, `'met'`, raised on `knownWeek` – any week from her sixteenth on, which is inside
// this bench's own four seasons. `'back'` and `'press'` are not among ITS answers, so every attempt
// threw, the `try/catch` below swallowed the throw (⚠ v75 T9: it does not any more – the latch is
// tolerated by name and counted, every other sentence stops the run), and the row stayed open
// forever: `answerFork`
// refuses behind an unanswered beat, so from her sixteenth birthday on this bench answered NOTHING
// and measured NOTHING, while exiting 0. Measured on a 4-seed grid before the repair:
//
//     arm       careers   beats   back  press  listen  fork with  fork against  bond @ fork
//     care           16     379      0      0       0          0             0            –
//     grind          16     463      0      0       0          0             0            –
//
// 842 rows raised, zero answered, both fork columns empty - and no error anywhere. The distinction
// the block above draws is UNCHANGED: the two arms still answer a `'fork-opinion'` row and only that
// row, deliberately, and `'listen'` is still in neither arm. What changed is that a beat this bench
// never meant to price is now DRAINED bond-neutrally instead of being left to block her.

/** WHAT HE SAYS. One answer per arm, from `LIFE_BEAT_OPTIONS`' own ids, and no third case: `listen`
 *  is deliberately in neither arm (see the block above).
 *
 *  ⚠ THE DRAIN GOES FIRST AND IS NOT AN ARM (v74, T6b). Any row that is not the fork opinion is a
 *  beat this file does not measure – it takes the bond-neutral answer of its own kind (`metWary` is
 *  0), so it cannot move bar 3 and cannot sit in front of the one row the arms are about. The arms
 *  themselves are untouched: `beatsRaised` and `beatAnswers` still count ONLY `'fork-opinion'`, which
 *  is what the census columns have always meant. */
function answerTheLifeBeat(world: WorldState, arm: Arm, career: Career): void {
  try {
    drainLifeBeats(world, 'fork-opinion')
  } catch (e) {
    // ⚠ ONLY the terminal latch is tolerated, and the test is the engine's own refusal string.
    // Anything else is rethrown on purpose: a swallowed drain is the exact defect the block above
    // records, and it cost this file a wave.
    // ⚠ v75 T3b (12.09) – WHAT «ANYTHING ELSE» IS HAS CHANGED, AND THE CLASSIFIER HAS NOT. The drain
    // no longer throws «this kind has no bond-neutral answer»; it throws when the registered drain
    // answer's price DEPENDS ON WHAT SHE WANTS, or when the registry names an id the kind does not
    // offer (`drainCostOf`, tools/_lifeBeats.ts). Both are still «anything else» and both still stop
    // this run, which is why this test reads the engine's string rather than the drain's.
    if (!(e instanceof Error) || e.message !== CAREER_ENDED_REFUSAL) throw e
  }
  const pending = pendingLifeBeat(world)
  if (pending === null) return
  career.beatsRaised++
  // ⭐⭐⭐ v74 T17 – READ THE WANT AND ITS ROOTS **BEFORE** THE ANSWER, for the engine's own reason: the
  // bond delta this answer is about to apply moves the very number `strained` is measured off, so a
  // reading taken after it would sometimes describe the parent's reply instead of the girl. This is
  // the same line `answerLifeBeat` draws internally, and `forkStopDriverOf` is the SAME function - a
  // bench re-derivation of «which root» is exactly the second reading this repo keeps catching.
  career.forkWant = forkWantOf(world)
  const s = ECONOMY.spirit
  const b = ECONOMY.bond
  career.forkRoots = {
    worn: Math.min(1, Math.max(0, (s.baseline - world.spirit) / (s.baseline - s.min))),
    strained: Math.min(1, Math.max(0, (b.start - world.bond) / (b.start - b.min))),
  }
  career.forkDriver = forkStopDriverOf(world.spirit, world.bond)
  // ⭐⭐⭐ v74 T16b point 4 – AND IN THE POKED ARM, THE WORDS THEMSELVES, CAPTURED BEFORE THE ANSWER.
  // Same reason the driver above is read here: the answer's bond delta lands one line down and it
  // moves the very band `lifeBeatPromptFor` selects her pool with. `captureHerWords` takes no draw.
  if (career.poked) captureHerWords(world, career)
  const said = arm === 'care' ? 'back' : 'press'
  try {
    answerLifeBeat(world, said)
    career.beatAnswers.push(said)
  } catch (e) {
    // ⭐⭐⭐ v75 T9 – THIS IS THE SWALLOW THE BLOCK ABOVE IS ABOUT, AND IT IS NOW THE SAME NARROW
    // SHAPE AS THE TWO DRAINS EITHER SIDE OF IT. It read
    // `catch { /* a terminal latch – guardNotEndedForGood refuses */ }` and the comment was HALF the
    // truth: `answerLifeBeat` also throws «That is not one of the answers this beat offered», which
    // is BYTE-FOR-BYTE what wave 3's `'met'` row did to this bench – 842 rows raised, zero answered,
    // `bond @ fork` empty, exit 0. The drain above is what stops a `'met'` row reaching this line
    // today; the `catch {}` is what made it invisible when it did, and it is the thing that would
    // make the NEXT kind invisible too. The latch is tolerated BY NAME and counted; that sentence,
    // and every other, now stops the run with the site and the career on the front of it.
    // ⚠ THE LATCH IS REACHABLE HERE and is not a theoretical tolerance: `pendingLifeBeat` does not
    // read `world.ending`, so a tick that latched an ending while a blocking row was open leaves
    // exactly this state – her row up, and `guardNotEndedForGood` refusing to answer it.
    tolerate('answerTheLifeBeat', refusalAt(world), e, [CAREER_ENDED_REFUSAL])
    career.refusals++
  }
  // ⭐⭐ ...AND THE COACH, WHILE HIS ROW IS STILL UP. The drain three lines down ANSWERS the counsel
  // bond-neutrally, which clears it – so the only moment his read exists to be read is here, between
  // the answer that raised him and the drain that clears him.
  if (career.poked) captureTheCoachsWords(world, career)
  // ⭐⭐⭐ v74 T17 – AND THE SECOND DRAIN IS NOT A TIDY-UP, IT IS THE FIX FOR A BENCH THAT WOULD HAVE
  // LIED AGAIN. Answering a `'stop'` opinion raises `'fork-counsel'` (the coach's read, blocking), and
  // `answerTheForkTheWayThisArmWould` one line below HAD a `catch {}` around `answerFork` – so every
  // stopping career would have had `forkCongruence: null` and `bondAtFork: NaN` with no error
  // anywhere, which is byte-for-byte the failure mode this file's own header records from T6b.
  // ⚠⚠ v75 T9 – THE DRAIN IS STILL THE FIX AND IS NOT REDUNDANT, BUT IT IS NO LONGER THE ONLY THING
  // STANDING BETWEEN THIS FILE AND THAT LIE. The swallow it was added in front of is gone: the site
  // below now rethrows `FORK_UNHEARD_REFUSAL` by name, so the day THIS drain stops clearing her
  // counsel the run dies with the engine's own sentence instead of printing a mean over the careers
  // that happened to work. That ordering – symptom cured in T17, cause paid in T9 – is exactly what
  // who-she-is §4a's 12.09 correction was written to stop anyone from having to rediscover.
  // ⚠ IT IS THE BOND-NEUTRAL DRAIN, so the counsel cannot move the number either arm is measuring –
  // both of its answers are zero by construction, which is what makes it drainable at all.
  try {
    drainLifeBeats(world, 'fork-opinion')
  } catch (e) {
    if (!(e instanceof Error) || e.message !== CAREER_ENDED_REFUSAL) throw e
  }
  // ⚠⚠ AND THE ARC IS COUNTED OFF THE WORLD'S OWN LOG, not off the bench's expectation of it. «The
  // counsel fired» is the actuation half of [3b]'s share: a run reporting «0% unsupported» with zero
  // counsel rows is a run in which nothing happened, and the two numbers printed together is what
  // makes that impossible to miss.
  career.counselRows = lifeLogOf(world).filter((row) => row.kind === 'fork-counsel').length
}

/** ⭐⭐⭐ [3c] – HER LINE AS THE WALK RENDERED IT, BESIDE THE ENGINE'S OWN TWO READINGS OF THE SAME
 *  GIRL. This is the answer to the trap this step was written against: **a poked arm can render a
 *  line without proving the line is the right one.**
 *
 *  ⚠⚠ `herSaid` IS THE SCREEN'S OWN STRING. `buildLifeBeatPrompt` is what the worker hands a dialog,
 *  so the captured line is the line a player would read this week – not a pool entry this file
 *  looked up and hoped the walk agrees with.
 *
 *  ⚠⚠ AND THE TWO READINGS BESIDE IT ARE THE ENGINE'S, DIFFERING IN THE DRIVER AND IN NOTHING ELSE.
 *  Same kind, same row detail, same voice, same register, same band – so `herWorn !== herOwn` is
 *  «the driver is visible in this girl's line» and `herSaid === herWorn` is «and the walk selected
 *  the worn one». Without the first half the second is worth nothing: below the flat-pool cut both
 *  readings collapse to the pool's line and an equality check would pass on a career whose worn copy
 *  never appeared. [3c] counts those apart and never as a render.
 *
 *  ⚠ THE REGISTER AND THE BAND ARE DERIVED THROUGH THE ENGINE'S OWN LADDERS at the instant the
 *  prompt was built, which is the only instant they agree with it. `wants` and `stage` are the
 *  assembler's own defaults and reach no fork line (its case reads neither – the fork is roof-only by
 *  construction); if that ever stops being true the equality below goes RED, which is the direction a
 *  second reading has to fail in. */
function captureHerWords(world: WorldState, career: Career): void {
  const prompt = buildLifeBeatPrompt(world)
  if (prompt === null || prompt.kind !== 'fork-opinion') {
    throw new Error(
      `${career.seed}/${career.temperament}: the poked arm found ${prompt === null ? 'no prompt' : `a '${prompt.kind}' prompt`} where her ` +
        'fork-opinion row should be – the capture would have measured a different beat',
    )
  }
  const want = forkWantOf(world)
  if (want === null) throw new Error(`${career.seed}/${career.temperament}: a fork-opinion prompt whose row carries no want`)
  const register = moodRegisterOf(spiritBandOf(world.spirit))
  const band = bondBandOf(world.bond)
  career.render = {
    herSaid: prompt.said,
    herWorn: lifeBeatSaid('fork-opinion', want, career.temperament, register, band, 'open', 'school', 'worn'),
    herOwn: lifeBeatSaid('fork-opinion', want, career.temperament, register, band, 'open', 'school', 'own'),
    coachSaid: null,
    coachWorn: null,
    coachOwn: null,
    spiritAtRead: world.spirit,
    bondAtRead: world.bond,
  }
}

/** ⭐⭐ [3c] – THE COACH'S READ, CAPTURED IN THE ONE WEEK IT EXISTS. Answering a `stop` raises
 *  `'fork-counsel'`; the bond-neutral drain two lines later answers it; between those two lines is
 *  the only moment `buildLifeBeatPrompt` returns it.
 *
 *  ⚠ NOTHING IS OWED ON A `college` OR A `tour` – no counsel is raised at all, which is the ruling's
 *  own boundary and not a gap – and nothing is owed when her row was never answered (a terminal latch
 *  refuses; [3c] prints that as «stops answered X/Y» rather than counting the difference as a miss).
 *
 *  ⚠ HIS PAIR IS KEYED ON THE DRIVER AND ON NOTHING ELSE – no voice, no register, no band – so it
 *  cannot collapse the way hers can, and `coachWorn === coachOwn` would mean the copy has lost its
 *  key. [3c] throws on it rather than printing a render it cannot tell apart. */
function captureTheCoachsWords(world: WorldState, career: Career): void {
  if (career.render === null || career.forkWant !== 'stop' || career.beatAnswers.length === 0) return
  const prompt = buildLifeBeatPrompt(world)
  if (prompt === null || prompt.kind !== 'fork-counsel') {
    throw new Error(
      `${career.seed}/${career.temperament}: she stated 'stop' and was answered, but the row waiting is ` +
        `${prompt === null ? 'nothing' : `'${prompt.kind}'` } – the counsel arc did not fire`,
    )
  }
  // ⚠ THE SAME GIRL HIS READ IS ABOUT, and that is why the two ladders are re-derived off the numbers
  // recorded WITH her line rather than off the world as it stands now: `applyBondDelta` has landed
  // between the two captures, and a reading taken after it would describe the parent's answer.
  const register = moodRegisterOf(spiritBandOf(career.render.spiritAtRead))
  const band = bondBandOf(career.render.bondAtRead)
  career.render.coachSaid = prompt.said
  career.render.coachWorn = lifeBeatSaid('fork-counsel', 'worn', career.temperament, register, band)
  career.render.coachOwn = lifeBeatSaid('fork-counsel', 'own', career.temperament, register, band)
}

/** ⭐⭐ WHAT HE DOES, priced against the want the ENGINE recorded rather than against a want the
 *  bench re-drew - `forkWantOf` reads the `lifeLog` row, so the two readings cannot disagree.
 *
 *  ⚠ THE CARE ARM MATCHES HER, WHATEVER SHE SAID, `'stop'` INCLUDED. Doing what she asked is the
 *  definition of the arm, and a bench that quietly declined to match the one want that ends a career
 *  would be scoring the care arm on an answer it did not give.
 *
 *  ⚠⚠ THE GRIND ARM'S CONTRADICTION NEVER PICKS `'stop'`, AND THAT IS A MEASUREMENT DECISION WITH A
 *  REASON. Two of the three fork answers end the career; `'stop'` ends it for good. A contradicting
 *  arm that sometimes retired her and sometimes did not would fold "he took the decision away" and
 *  "the career stopped here" into one number, and bar 3 would again be measuring two things at once
 *  (the same argument the header makes for the identical entry policy). So the grind arm keeps her
 *  playing when she wanted anything else, and sends her to college when she wanted the tour - the
 *  contradiction in both directions, and never the ending. */
function answerTheForkTheWayThisArmWould(world: WorldState, arm: Arm, career: Career): void {
  if (world.fork === null || world.fork.answer !== null) return
  const want = forkWantOf(world)
  if (want === null) return
  const hers = FORK_WANT_ANSWER[want]
  const answer = arm === 'care' ? hers : hers === 'continue' ? 'college' : 'continue'
  try {
    answerFork(world, answer)
    career.forkCongruence = answer === hers ? 'with' : 'against'
    career.bondAtFork = world.bond
  } catch (e) {
    // ⭐⭐⭐ v75 T9 – AND THIS IS THE ONE THE RECORD LIED ABOUT. It read `catch { /* her row is still
    // open, or the fork closed under us - either way nothing was answered */ }`, which names the
    // failure and then declines to report it: «her row is still open» IS `FORK_UNHEARD_REFUSAL`, and
    // it is precisely the state that printed `forkCongruence: null` and `bondAtFork: NaN` for every
    // stopping career in v74. who-she-is §4a's wave-3 entry called that «found and fixed with a
    // second bond-neutral drain»; the drain went in FRONT of this catch and this catch stayed, which
    // the 12.09 correction (`8388c070`) is the record of.
    //
    // ⚠⚠ SO `FORK_UNHEARD_REFUSAL` IS NOT TOLERATED HERE AND NEVER CAN BE. It is the engine saying
    // the drain two calls up did not clear her row, and the whole of this debt is that the bench must
    // then STOP rather than print a mean over the careers that happened to work. The day the drain
    // stops clearing, this line is what says so – loudly, with the seed and the week.
    // ⚠ «the fork closed under us» is likewise TESTED, on the first line of this function
    // (`world.fork === null || world.fork.answer !== null`), so «The fork is not open» is a finding
    // too. What is left, and all that is left, is `guardNotEnded`'s pair: a tick that ended the
    // career – or froze it at college – in the same week the fork stood open.
    tolerate('answerTheForkTheWayThisArmWould', refusalAt(world), e, [CAREER_ENDED_REFUSAL, COLLEGE_FREEZE_REFUSAL])
    career.refusals++
  }
}

// =================================================================================================
// STATISTICS - the plainest possible spellings, so the numbers are auditable by hand
// =================================================================================================

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? Number.NaN : xs.reduce((a, b) => a + b, 0) / xs.length
}

function sd(xs: readonly number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}

function sem(xs: readonly number[]): number {
  return xs.length < 2 ? 0 : sd(xs) / Math.sqrt(xs.length)
}

function median(xs: readonly number[]): number {
  if (xs.length === 0) return Number.NaN
  const s = [...xs].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return Number.NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : (100 * part) / whole
}

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n)
}

function padL(s: string | number, n: number): string {
  return String(s).padStart(n)
}

function verdict(pass: boolean): string {
  return pass ? 'PASS' : 'FAIL'
}

function rule(title: string): void {
  console.log(`\n${'='.repeat(100)}\n${title}\n${'='.repeat(100)}`)
}

/** ⭐⭐⭐ [7]'s TABLE – EVERY SUPPRESSED CALL ON THIS RUN, AS A NUMBER. See the ledger block's header
 *  for the two dispositions and why a `tested` row is not a second reading of an engine rule.
 *
 *  ⚠ PRINTED AT THE END OF EACH MODE AND NOT BESIDE ITS HEADER, for a structural reason rather than
 *  a cosmetic one: [3c] walks a population of its own AFTER the bar grid, so a ledger printed early
 *  would be missing the poked arm's rows and would read as a smaller number than the run produced.
 *
 *  ⚠⚠ AND IT IS PRINTED WHEN IT IS EMPTY. «Nothing was refused» is the claim a reader of this file
 *  came for after wave 3, and a blank space is not that claim – it is the absence of one, which is
 *  the whole of what the five `catch {}` blocks used to offer (`drainSkewLine`'s own argument). */
function printRefusalLedger(): void {
  rule('[7] THE REFUSAL LEDGER – every call this file suppressed, counted · ⚠ NOT A BAR, AND A COUNT IS NOT A FAILURE')
  const rows = [...REFUSALS.values()].sort((a, b) => (a.site === b.site ? b.count - a.count : a.site < b.site ? -1 : 1))
  const total = rows.reduce((a, r) => a + r.count, 0)
  console.log(
    `    ${pad('site', 32)}${pad('how', 8)}${padL('count', 9)}   ${pad("the engine's own sentence, or the state its own reader answered", 64)}first seen`,
  )
  console.log(`    ${'─'.repeat(140)}`)
  if (rows.length === 0) console.log('    NOTHING WAS REFUSED ON THIS RUN – every guarded call went through.')
  for (const r of rows) {
    console.log(`    ${pad(r.site, 32)}${pad(r.how, 8)}${padL(r.count, 9)}   ${pad(r.because, 64)}${r.firstAt}`)
  }
  console.log(`    ${'─'.repeat(140)}`)
  console.log(`    ${pad('TOTAL', 32)}${pad('', 8)}${padL(total, 9)}`)
  console.log('')
  console.log('    ⚠ `tested` = the bench asked the ENGINE\'S OWN reader and did not make the call. The call behind every test is')
  console.log('      still BARE, so a test that is too permissive lets the engine throw and STOPS THE RUN, and a test that is too')
  console.log('      strict shows up here as a count nobody can explain. Neither direction can be silent, which is the point.')
  console.log('    ⚠ `caught` = a narrow catch keyed on an EXPORTED refusal constant (`CAREER_ENDED_REFUSAL`,')
  console.log('      `COLLEGE_FREEZE_REFUSAL`). Every other sentence is rethrown with the site and the career prefixed – there is')
  console.log('      no longer a throw in this file that nobody sees.')
  console.log('    ⚠⚠ A ZERO IS NOT A PASS EITHER. What a zero in a row means is that the state that row names never happened on')
  console.log('       this grid – which for the two ANSWER sites is exactly what a four-season walk predicts, because the fork')
  console.log('       opens later than the grid ends. Read this table BESIDE [3]\'s census, never instead of it.')
}

// =================================================================================================
// ⭐ SWEEP MODE – `npm run bench:spirit -- --sweep=return` and `-- --sweep=bond`
// =================================================================================================
//
// ⚠⚠ THIS CHANGES NOTHING AND PROPOSES NOTHING. Two of the six bars above fail by ARITHMETIC – the
// weekly return is larger than almost every perturbation (bar 1), and the flat bond regression is
// larger than what either arm's decisions are worth per week (bar 3) – and the owner's ruling on a
// failed bar is the file header's: *a bar that fails is a finding for him, never a licence to touch
// a constant.* So this mode does not propose a value. It walks a dial across a handful of settings
// and prints, for each one, WHAT THE BAR WOULD READ **and what the setting costs elsewhere**, so
// the ruling is made on numbers instead of on an opinion. The shipped value is always the FIRST row
// of each table, and it is the row every other row has to be read against.
//
// ⚠⚠ NOTHING IN `src/` IS EDITED, AND NO SEAM WAS CARVED TO MAKE THIS WORK. `ECONOMY` is declared
// `as const`, which is a TYPE-level readonly and nothing more – at runtime it is an ordinary object
// and is never frozen – and `accrueSpirit` reads `ECONOMY.spirit.returnPerWeek` /
// `ECONOMY.bond.regressionPerWeek` INSIDE the weekly call rather than caching either at module
// load. So the bench writes the dial in its own process, runs the grid, and puts the shipped value
// back before it exits. The default run (`npm run bench:spirit`, no arguments) never enters this
// branch at all and its output is byte-identical to what it was before this mode existed.
//
// ⚠ AND EVERY ROW IS A FULL RE-RUN OF THE SAME GRID – the same 32 seeds, the same four temperaments,
// the same two arms, the same entry policy – so two rows differ in the dial and in nothing else.

type Sweep = 'return' | 'bond' | 'return-deep'

/** `--sweep=return` / `--sweep=bond` / `--sweep=return-deep`; absent = the ordinary bench, untouched. */
function sweepMode(): Sweep | null {
  const flag = process.argv.find((a) => a.startsWith('--sweep='))
  if (flag === undefined) return null
  const value = flag.slice('--sweep='.length)
  if (value === 'return' || value === 'bond' || value === 'return-deep') return value
  console.error(`unknown --sweep=${value} – the sweeps are 'return', 'return-deep' and 'bond'`)
  process.exit(2)
}

/** The five settings of each dial, shipped value FIRST. */
const RETURN_VALUES: readonly { steady: number; intense: number }[] = [
  { steady: 5, intense: 3 },
  { steady: 4, intense: 2.5 },
  { steady: 3, intense: 2 },
  { steady: 2, intense: 1.5 },
  { steady: 1.5, intense: 1 },
]
/** ⚠ BEYOND THE FIVE, AND SEPARATE FROM THEM ON PURPOSE. Sweep 1 answers "what would each of these
 *  five settings read" and NOT ONE OF THEM clears bar 1 on the STEADY arm – it tops out at 1.52
 *  against a bar of 2.00. So the question "what would" has no answer inside the requested range,
 *  and this second list exists only to BOUND it. It is its own flag (`--sweep=return-deep`) so the
 *  five the owner asked for are reported exactly as asked, unpadded; its first row REPEATS the last
 *  row of sweep 1 as the anchor that proves the two runs are the same grid. It proposes nothing:
 *  every row here is far outside anything who-she-is §4 has ruled on. */
const RETURN_DEEP_VALUES: readonly { steady: number; intense: number }[] = [
  { steady: 1.5, intense: 1 },
  { steady: 1, intense: 0.7 },
  { steady: 0.75, intense: 0.5 },
  { steady: 0.5, intense: 0.35 },
]
const REGRESSION_VALUES: readonly number[] = [0.5, 0.4, 0.3, 0.2, 0.1]

/** How long a probe is given to heal before "never" is the honest answer. Four seasons is the
 *  whole grid; 2000 weeks is ~38 of them. */
const HEAL_CAP = 2000

/** The whole grid, once. */
function runGrid(): Career[] {
  const cs: Career[] = []
  for (const arm of ARMS) {
    for (const temperament of TEMPERAMENTS) {
      for (let s = 0; s < SEED_COUNT; s++) cs.push(runCareer(`spirit-${s}`, arm, temperament))
    }
  }
  return cs
}

const flat = (cs: readonly Career[], pick: (c: Career) => number[]) => cs.flatMap(pick)

/** BAR 1's OWN STATISTIC, over any slice of careers: the mean per-career sd of spirit over weeks. */
function meanCareerSd(cs: readonly Career[]): number {
  return mean(cs.map((c) => sd(c.spirit)))
}

/** ⚠ THE FAIRNESS CORRIDOR, RECOMPUTED FROM SCRATCH FOR EVERY ROW – bar 5 is a HARD bar and a
 *  slower return is not allowed to buy bar 1 by breaching it. Same paired construction as section
 *  [5]: seed-for-seed and arm-for-arm, the two careers in a delta differing in nothing but who she
 *  is. Returns the worst pair's |mean Δ| in points of win rate. */
function fairnessWorst(cs: readonly Career[]): number {
  const winRate = new Map<string, number>()
  for (const c of cs) {
    winRate.set(`${c.arm}|${c.temperament}|${c.seed}`, c.matchesPlayed === 0 ? Number.NaN : pct(c.matchesWon, c.matchesPlayed))
  }
  let worst = 0
  for (let i = 0; i < TEMPERAMENTS.length; i++) {
    for (let j = i + 1; j < TEMPERAMENTS.length; j++) {
      const deltas: number[] = []
      for (const arm of ARMS) {
        for (let s = 0; s < SEED_COUNT; s++) {
          const x = winRate.get(`${arm}|${TEMPERAMENTS[i]}|spirit-${s}`)
          const y = winRate.get(`${arm}|${TEMPERAMENTS[j]}|spirit-${s}`)
          if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) continue
          deltas.push(x - y)
        }
      }
      worst = Math.max(worst, Math.abs(mean(deltas)))
    }
  }
  return worst
}

/** SECTION [6]'s DP, lifted out so a sweep row can call it – identical arithmetic, plus the ONE
 *  number section [6] does not print and the owner is actually choosing on: THE WIDTH OF THE
 *  NARROWEST BAND. Five words are five contiguous bands, and the two outer ones are open-ended, so
 *  the width that can be measured is an INTERIOR band's: the distance between two adjacent cut
 *  points. A band 0.3 points wide is a tile that changes word on a rounding difference. */
function cutSearch(xs: readonly number[]): { bestShare: number; cuts: number[]; narrowest: number } {
  const distinct = [...new Set(xs)].sort((a, b) => a - b)
  if (distinct.length < 5) return { bestShare: 0, cuts: [], narrowest: Number.NaN }
  const counts = new Map<number, number>()
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1)
  const cum: number[] = []
  let running = 0
  for (const v of distinct) {
    running += counts.get(v) ?? 0
    cum.push(running)
  }
  const upto = (index: number) => (index < 0 ? 0 : cum[index])
  const massOf = (from: number, to: number) => upto(to) - upto(from - 1)
  const NEG = -1
  const best: number[][] = Array.from({ length: 6 }, () => new Array(distinct.length).fill(NEG))
  const cutAt: number[][] = Array.from({ length: 6 }, () => new Array(distinct.length).fill(-1))
  for (let i = 0; i < distinct.length; i++) best[1][i] = massOf(0, i)
  for (let k = 2; k <= 5; k++) {
    for (let i = k - 1; i < distinct.length; i++) {
      for (let j = k - 2; j < i; j++) {
        if (best[k - 1][j] === NEG) continue
        const score = Math.min(best[k - 1][j], massOf(j + 1, i))
        if (score > best[k][i]) {
          best[k][i] = score
          cutAt[k][i] = j
        }
      }
    }
  }
  const edges: number[] = []
  let k = 5
  let i = distinct.length - 1
  while (k > 1) {
    const j = cutAt[k][i]
    edges.unshift(j)
    i = j
    k--
  }
  const cuts = edges.map((e) => distinct[e + 1])
  let narrowest = Number.POSITIVE_INFINITY
  for (let b = 1; b < cuts.length; b++) narrowest = Math.min(narrowest, cuts[b] - cuts[b - 1])
  return { bestShare: pct(best[5][distinct.length - 1], xs.length), cuts, narrowest }
}

/** BAR 3's OWN STATISTIC: the mean of the 32 PAIRED per-seed care−grind differences at the end of
 *  season 3, with the paired SEM – over the 32 seeds and never over the 128 careers. */
function bondGapAtSeason3(cs: readonly Career[]): { gap: number; sem: number; n: number } {
  const seedIds = [...new Set(cs.map((c) => c.seed))]
  const perSeed = (arm: Arm) =>
    seedIds.map((s) =>
      mean(cs.filter((c) => c.arm === arm && c.seed === s).map((c) => c.bondAtSeason3).filter((x) => !Number.isNaN(x))),
    )
  const care = perSeed('care')
  const grind = perSeed('grind')
  const gaps = care.map((x, idx) => x - grind[idx]).filter((d) => !Number.isNaN(d))
  return { gap: mean(gaps), sem: sem(gaps), n: gaps.length }
}

/** ⚠⚠ THE COST HALF OF SWEEP 2, AND IT IS MEASURED THROUGH THE ENGINE'S OWN WEEKLY RULE rather
 *  than computed as 25 / rate. `accrueSpirit` is the only writer of the regression and it rounds
 *  EVERY write onto `ECONOMY.bond.step` (0.5), so "how many weeks does a −25 season take to heal"
 *  is the number of times that function has to run at the dial as currently set – which is not
 *  always 25 / rate, and the table is the place to find that out rather than the shipping build.
 *  A probe world is held at a non-wrap week so the zero-vacations row cannot fire into the answer;
 *  a week that moves nothing at all is reported as never, not as a large number. */
function healWeeksForMinus25(): number {
  const world = createWorld('bond-heal-probe', { ...DEFAULT_PROFILE, background: 'wealthy' })
  world.week = 5
  world.bond = ECONOMY.bond.start - 25
  for (let w = 1; w <= HEAL_CAP; w++) {
    const before = world.bond
    accrueSpirit(world)
    if (world.bond >= ECONOMY.bond.start) return w
    if (world.bond === before) return Number.POSITIVE_INFINITY
  }
  return Number.POSITIVE_INFINITY
}

/** ⚠⚠ THE OTHER HALF OF THE SAME PROOF, AND THE REASON THREE ROWS OF SWEEP 2 READ IDENTICALLY.
 *  What ONE week of the regression is actually worth at the dial as currently set, measured by
 *  running `accrueSpirit` exactly once on the same probe world. It is NOT the dial: every bond
 *  write goes through the engine's `roundHalf`, which lands the result on `ECONOMY.bond.step`
 *  (0.5), so a rate of 0.4 or 0.3 rounds UP to a full half-point and a rate of 0.2 or 0.1 rounds
 *  DOWN to nothing. Printed rather than argued, so a row that looks like a dial that failed to
 *  apply can be read as the quantisation it is – and so the injection itself is visibly working,
 *  since a dial that never reached the engine would print one number in every row. */
function effectiveBondStep(): number {
  const world = createWorld('bond-heal-probe', { ...DEFAULT_PROFILE, background: 'wealthy' })
  world.week = 5
  world.bond = ECONOMY.bond.start - 25
  const before = world.bond
  accrueSpirit(world)
  return world.bond - before
}

/** BAR 2, SAID IN ONE CELL WITHOUT COLLAPSING ITS TWO HALVES INTO ONE WORD. */
function bar2Label(rails: boolean, meanOk: boolean): string {
  if (rails && meanOk) return 'PASS'
  if (!rails && !meanOk) return 'FAIL both'
  return rails ? 'FAIL mean' : 'FAIL rails'
}

function healLabel(weeks: number): string {
  return Number.isFinite(weeks) ? `${weeks} wk` : 'never'
}

/** ⚠ THE ONE SEAM. `ECONOMY` is `as const` at the TYPE level only; at runtime it is a plain object
 *  and `accrueSpirit` re-reads it every week. The casts widen the literal types the `as const`
 *  produced; they write no file and the shipped values go back before the process exits. */
const RETURN_DIAL = ECONOMY.spirit.returnPerWeek as unknown as { steady: number; intense: number }
const BOND_DIAL = ECONOMY.bond as unknown as { regressionPerWeek: number }

function runSweep(mode: Sweep): void {
  const shippedReturn = { steady: RETURN_DIAL.steady, intense: RETURN_DIAL.intense }
  const shippedRegression = BOND_DIAL.regressionPerWeek
  const startedSweep = Date.now()
  try {
    if (mode === 'return') sweepReturn(RETURN_VALUES, false)
    else if (mode === 'return-deep') sweepReturn(RETURN_DEEP_VALUES, true)
    else sweepBond()
  } finally {
    RETURN_DIAL.steady = shippedReturn.steady
    RETURN_DIAL.intense = shippedReturn.intense
    BOND_DIAL.regressionPerWeek = shippedRegression
    console.log(
      `\n    dials restored to the shipped values: returnPerWeek ${RETURN_DIAL.steady} / ${RETURN_DIAL.intense} · ` +
        `bond.regressionPerWeek ${BOND_DIAL.regressionPerWeek}`,
    )
    console.log(`    ${((Date.now() - startedSweep) / 1000).toFixed(1)}s`)
  }
}

// --- SWEEP 1: THE WEEKLY RETURN ------------------------------------------------------------------

interface ReturnRow {
  label: string
  /** the 2×2 of bar 1's own statistic: policy arm × intensity arm */
  careSteady: number
  careIntense: number
  grindSteady: number
  grindIntense: number
  steady: number
  intense: number
  care: number
  grind: number
  at70all: number
  at70care: number
  under60: number
  meanAll: number
  /** BAR 2's TWO HALVES, KEPT APART. "the drift bar failed" is not a reading – the rails half and
   *  the 70 ± 4 half fail for different reasons and cost different things, and a row whose mean is
   *  still 69.30 has plainly failed the OTHER one. */
  bar2rails: boolean
  bar2mean: boolean
  fairWorst: number
  minBand: number
  narrowest: number
  cuts: number[]
}

function sweepReturn(values: readonly { steady: number; intense: number }[], deep: boolean): void {
  rule(
    (deep
      ? `SWEEP 1-DEEP – ECONOMY.spirit.returnPerWeek BELOW the five, to bound a bar none of them clears\n`
      : `SWEEP 1 – ECONOMY.spirit.returnPerWeek, everything else held at the shipped value\n`) +
      `${SEED_COUNT} seeds × ${SEASONS} seasons × {care, grind} × 4 temperaments, the whole grid re-run per row\n` +
      (deep
        ? `⚠⚠ THESE ARE NOT PROPOSALS AND NOT THE OWNER'S FIVE. Sweep 1's slowest requested setting leaves the\n` +
          `  STEADY arm at 1.52 against a bar of 2.00, so "the smallest change that makes bar 1 pass" has no\n` +
          `  answer inside the requested range. These rows bound it and nothing else. The FIRST row repeats\n` +
          `  sweep 1's last so the two runs can be checked against each other.`
        : `⚠ BAR 1 IS READ PER INTENSITY ARM AND NOT POOLED. The return rate IS the intensity axis – 5 for a\n` +
          `  steady girl, 3 for an intense one – so the care arm's shipped 2.00 is the mean of a 1.21 and a\n` +
          `  2.79 and is a property of NEITHER population. The 2×2 below is the honest reading of that bar.`),
  )
  const rows: ReturnRow[] = []
  for (const value of values) {
    RETURN_DIAL.steady = value.steady
    RETURN_DIAL.intense = value.intense
    const cs = runGrid()
    const slice = (arm: Arm | null, intensity: 'steady' | 'intense' | null) =>
      cs.filter((c) => (arm === null || c.arm === arm) && (intensity === null || temperamentIntensity(c.temperament) === intensity))
    const all = flat(cs, (c) => c.spirit)
    const care = flat(slice('care', null), (c) => c.spirit)
    const base = ECONOMY.spirit.baseline
    // ⚠ BAR 2 IS A HARD BAR TOO, AND A SLOWER RETURN IS EXACTLY WHAT WOULD BREAK IT: the return is
    // the only restoring force spirit has, so weakening it widens the distribution around 70. Held
    // PER TEMPERAMENT ARM, both halves, the same way section [2] holds it – a row that buys bar 1
    // by drifting out of 70 ± 4, or by pushing 2% of weeks past a rail, has not bought anything.
    let bar2rails = true
    let bar2mean = true
    for (const armName of ARMS) {
      for (const t of TEMPERAMENTS) {
        const xs = flat(cs.filter((c) => c.arm === armName && c.temperament === t), (c) => c.spirit)
        bar2rails &&= pct(xs.filter((x) => x < 20 || x > 95).length, xs.length) < 2
        bar2mean &&= Math.abs(mean(xs) - 70) <= 4
      }
    }
    const cut = cutSearch(care)
    rows.push({
      label: `${value.steady} / ${value.intense}${value.steady === 5 && value.intense === 3 ? ' ◄ shipped' : ''}`,
      careSteady: meanCareerSd(slice('care', 'steady')),
      careIntense: meanCareerSd(slice('care', 'intense')),
      grindSteady: meanCareerSd(slice('grind', 'steady')),
      grindIntense: meanCareerSd(slice('grind', 'intense')),
      steady: meanCareerSd(slice(null, 'steady')),
      intense: meanCareerSd(slice(null, 'intense')),
      care: meanCareerSd(slice('care', null)),
      grind: meanCareerSd(slice('grind', null)),
      at70all: pct(all.filter((x) => x === base).length, all.length),
      at70care: pct(care.filter((x) => x === base).length, care.length),
      under60: pct(all.filter((x) => x < ECONOMY.spirit.knee).length, all.length),
      meanAll: mean(all),
      bar2rails,
      bar2mean,
      fairWorst: fairnessWorst(cs),
      minBand: cut.bestShare,
      narrowest: cut.narrowest,
      cuts: cut.cuts,
    })
  }

  console.log(`\n    1A · BAR 1 – the mean per-career sd of spirit, cut BOTH ways. The bar is ≥ 2.00.`)
  console.log(
    `    ${pad('steady/intense', 16)}${padL('care·std', 10)}${padL('care·int', 10)}${padL('grind·std', 11)}${padL('grind·int', 11)}` +
      `${padL('STEADY', 9)}${padL('INTENSE', 9)}${padL('care', 8)}${padL('grind', 8)}${padL('both int.', 11)}${padL('both pol.', 11)}`,
  )
  console.log(`    ${'─'.repeat(114)}`)
  for (const r of rows) {
    console.log(
      `    ${pad(r.label, 16)}${padL(r.careSteady.toFixed(2), 10)}${padL(r.careIntense.toFixed(2), 10)}` +
        `${padL(r.grindSteady.toFixed(2), 11)}${padL(r.grindIntense.toFixed(2), 11)}` +
        `${padL(r.steady.toFixed(2), 9)}${padL(r.intense.toFixed(2), 9)}${padL(r.care.toFixed(2), 8)}${padL(r.grind.toFixed(2), 8)}` +
        `${padL(verdict(r.steady >= 2 && r.intense >= 2), 11)}${padL(verdict(r.care >= 2 && r.grind >= 2), 11)}`,
    )
  }
  console.log(`    ${'─'.repeat(114)}`)
  console.log('    "STEADY"/"INTENSE" pool the two policy arms; "care"/"grind" pool the two intensity arms – section [1]\'s own reading.')
  console.log('    "both int." = both INTENSITY arms ≥ 2.00 · "both pol." = both POLICY arms ≥ 2.00, which is how section [1] states it.')

  console.log(`\n    1B · WHAT THE SETTING COSTS. Every column is measured on the same run as its 1A row.`)
  console.log(
    `    ${pad('steady/intense', 16)}${padL('@70.0 all', 11)}${padL('@70.0 care', 12)}${padL('< 60 knee', 11)}${padL('mean', 8)}${padL('bar 2', 12)}` +
      `${padL('fair worst', 12)}${padL('bar 5', 8)}${padL('min band', 10)}${padL('narrowest', 11)}   cut points (descending)`,
  )
  console.log(`    ${'─'.repeat(144)}`)
  for (const r of rows) {
    console.log(
      `    ${pad(r.label, 16)}${padL(r.at70all.toFixed(2) + '%', 11)}${padL(r.at70care.toFixed(2) + '%', 12)}` +
        `${padL(r.under60.toFixed(2) + '%', 11)}${padL(r.meanAll.toFixed(2), 8)}${padL(bar2Label(r.bar2rails, r.bar2mean), 12)}` +
        `${padL(r.fairWorst.toFixed(3) + 'pp', 12)}${padL(verdict(r.fairWorst <= 1.5), 8)}` +
        `${padL(r.minBand.toFixed(2) + '%', 10)}${padL(Number.isFinite(r.narrowest) ? r.narrowest.toFixed(1) : '–', 11)}   ` +
        `${[...r.cuts].reverse().map((c) => c.toFixed(1)).join('  ·  ')}`,
    )
  }
  console.log(`    ${'─'.repeat(144)}`)
  console.log('    "@70.0" = weeks sitting at EXACTLY the baseline – the erasure bar 1 fails on. "< 60 knee" = the only weeks')
  console.log('      `spiritMatchFactor` is not 1.0, i.e. the only weeks either number reaches the tennis at all.')
  console.log('    "mean"/"bar 2" = the long-run spirit mean over all weeks, and BAR 2 held PER TEMPERAMENT ARM. Its two halves are')
  console.log('      reported apart: "FAIL rails" = some arm put ≥ 2% of weeks below 20 or above 95, "FAIL mean" = some arm drifted')
  console.log('      out of 70 ± 4, "FAIL both" = both. They fail for different reasons and cost different things.')
  console.log('    ⚠ "fair worst"/"bar 5" = the worst temperament pair\'s |mean Δ| lifetime win rate against the ±1.5 pp corridor.')
  console.log('      A HARD BAR, recomputed on every row: a slower return may not buy bar 1 by breaching who-she-is §4.')
  console.log('    "min band" = the largest share the SMALLEST of five Mood words can hold, cut points free (bar 6 is ≥ 2%).')
  console.log('    ⚠ "narrowest" = the WIDTH IN SPIRIT POINTS of the narrowest INTERIOR band of that best split, and it is the')
  console.log('      number a tile actually lives on: at the shipped value the best cuts make one word 0.3 points wide, which is')
  console.log('      a word that changes on a rounding difference. The two outer bands are open-ended and have no width to measure.')
}

// --- SWEEP 2: THE BOND REGRESSION ----------------------------------------------------------------

function sweepBond(): void {
  rule(
    `SWEEP 2 – ECONOMY.bond.regressionPerWeek, everything else held at the shipped value\n` +
      `${SEED_COUNT} seeds × ${SEASONS} seasons × {care, grind} × 4 temperaments, re-run per row\n` +
      `⚠⚠ THE COST IS IN THE SAME TABLE, ON THE SAME ROW. Build plan §1d states the memory property as\n` +
      `  «a −25 season heals in ~50 weeks, which is §4a.3's recoverability», and 25 / 0.5 = 50 IS the\n` +
      `  shipped value. Lowering this dial buys bar 3 and sells recoverability; both halves are here.`,
  )
  console.log(
    `    ${pad('regression', 16)}${padL('gap @ S3', 11)}${padL('± SEM', 9)}${padL('≥ 12', 7)}${padL('> 2×SEM', 10)}` +
      `${padL('care med', 10)}${padL('grind med', 11)}${padL('at 0 %', 9)}${padL('at 100 %', 10)}${padL('clamped', 9)}` +
      `${padL('eff. step/wk', 14)}${padL('−25 heals in', 14)}${padL('sd care', 10)}${padL('fair worst', 12)}`,
  )
  console.log(`    ${'─'.repeat(153)}`)
  for (const value of REGRESSION_VALUES) {
    BOND_DIAL.regressionPerWeek = value
    const cs = runGrid()
    const g = bondGapAtSeason3(cs)
    const bondOf = (arm: Arm) => flat(cs.filter((c) => c.arm === arm), (c) => c.bond)
    const careBond = bondOf('care')
    const grindBond = bondOf('grind')
    const bothBond = [...careBond, ...grindBond]
    const careMed = median(careBond)
    const grindMed = median(grindBond)
    const clamped = [careMed, grindMed].some((m) => m === ECONOMY.bond.min || m === ECONOMY.bond.max)
    const step = effectiveBondStep()
    const heal = healWeeksForMinus25()
    const label = `${value.toFixed(1)}${value === 0.5 ? ' ◄ shipped' : ''}`
    console.log(
      `    ${pad(label, 16)}${padL(g.gap.toFixed(2), 11)}${padL(g.sem.toFixed(3), 9)}${padL(verdict(g.gap >= 12), 7)}` +
        `${padL(verdict(g.gap > 2 * g.sem), 10)}${padL(careMed.toFixed(2), 10)}${padL(grindMed.toFixed(2), 11)}` +
        `${padL(pct(bothBond.filter((x) => x === ECONOMY.bond.min).length, bothBond.length).toFixed(2) + '%', 9)}` +
        `${padL(pct(bothBond.filter((x) => x === ECONOMY.bond.max).length, bothBond.length).toFixed(2) + '%', 10)}` +
        `${padL(clamped ? 'YES' : 'no', 9)}${padL(step.toFixed(2), 14)}${padL(healLabel(heal), 14)}` +
        `${padL(meanCareerSd(cs.filter((c) => c.arm === 'care')).toFixed(2), 10)}${padL(fairnessWorst(cs).toFixed(3) + 'pp', 12)}`,
    )
  }
  console.log(`    ${'─'.repeat(153)}`)
  console.log(`    "gap @ S3" = the mean of ${SEED_COUNT} PAIRED per-seed care−grind differences at the end of season 3; BAR 3 is ≥ 12 AND > 2×SEM.`)
  console.log('    "care med"/"grind med" = the arm\'s bond median over every resolved week (bar 4\'s own reading); "clamped" = either median at 0 or 100.')
  console.log('    ⚠⚠ "eff. step/wk" = what ONE week of the regression is actually worth at that dial, measured by running `accrueSpirit`')
  console.log('       once. It is NOT the dial: `roundHalf` lands every bond write on `ECONOMY.bond.step` (0.5), so 0.4 and 0.3 round UP')
  console.log('       to a full half-point and 0.2 and 0.1 round DOWN to zero. Rows that read identically are that quantisation, not a')
  console.log('       dial that failed to apply – a dial that never reached the engine would print ONE number down the whole column.')
  console.log('    ⚠⚠ "−25 heals in" = weeks of `accrueSpirit` for a bond of 45 to reach 70 again, MEASURED through the engine\'s own')
  console.log('       weekly rule and NOT computed as 25/rate – every bond write is rounded onto `ECONOMY.bond.step` (0.5), so a rate')
  console.log('       below half a step can move nothing at all and "never" is then the honest reading, not a large number.')
  console.log('    "sd care" and "fair worst" are invariance checks: bond has no reader anywhere in the match, so they should not move.')
}

const SWEEP = sweepMode()
if (SWEEP !== null) {
  runSweep(SWEEP)
  process.exit(0)
}

// =================================================================================================
// ⭐⭐⭐ T12 – THE PUSH-THROUGH PAIR – `npm run bench:spirit -- --push`
// =================================================================================================
//
// ⚠⚠ WHAT THIS IS. Wave 1 shipped the push-through PRICE – bond +1 / −3 / −5 at `decideKnock`, and
// spirit −2 on every week a push governs – and shipped it WITHOUT the paired measurement CLAUDE.md
// invariant 5 owes every balance change («balance changes ship with a bench run and a spec recording
// predicted vs measured»). That debt is wave 3's T12 and this block is the payment: one clean pair,
// identical policy except the knock answer, 64 seeds × 4 temperaments.
//
// ⚠⚠ IT DOES NOT TOUCH THE TWO ARMS ABOVE AND MUST NOT. `care` / `grind` move THREE decisions at
// once (the knock, the family week, the exam plan) because they are pricing the BOND, and they
// answer her beats non-neutrally on purpose – that is the runbook's grid and every bar in this file
// is read off it. A pair that prices ONE decision cannot be carved out of a grid that moves three,
// so this is its own walk with its own policy. The `--push` flag exits before THE RUN below, exactly
// as `--sweep` does, so the default printout is byte-identical to what it was before this existed.
//
// THE PAIR, and every clause is HELD EQUAL rather than merely unmentioned:
//
//   arm A  rest    `decideKnock(world, 'rest')` on every knock
//   arm B  push    `decideKnock(world, 'push')` on every knock
//
//   · `balanced` every week in both arms, so the exam row (`train >= examTrainFloor`) cannot fire in
//     either. The care/grind arms vary the exam plan deliberately; a knock pair must not.
//   · THE FAMILY WEEKS ARE BOOKED IN BOTH ARMS (off-season 50/51, `staycation`, free at `wealthy`),
//     so the season-wrap `seasonWithNoVacation` row (−3 bond AND −3 spirit) cannot fire in either.
//     Both of those rows would cancel in a paired difference anyway – they are held out because they
//     are worth four weeks under the baseline apiece, and number 2 below counts weeks.
//   · the same entry policy (`enterWhatSheCan`), the same birthday answer (`answerTheBirthday`), and
//     every life beat drained at its own bond-neutral price in both arms.
//   · `wealthy`, `DEFAULT_PROFILE`, assigned temperament – this file's own three choices, unchanged.
//
// ⚠⚠ AND THE CAREER IS SELF-COACHED (`coachTier: 'self'`), WHICH IS THE ONE POLICY CHOICE THIS BLOCK
// MAKES THAT THE BAR GRID DOES NOT – MEASURED, not preferred. `DEFAULT_PROFILE` is `middle`, and
// `coachManagesLoad` is true for every rung but `self`: a hired coach ANSWERS most knocks himself
// inside the tick (`coachDecidesKnock`), escalating to the parent only when `coachEscalates` says
// so, and his answer moves no bond at all («the hired coach answering on his own is the one knock
// path the parent did not take» – world/knock.ts). Two things follow and both are fatal to this
// pair: the parent is asked about only a fraction of her knocks, so "arm A rests EVERY knock" is
// simply not what the walk does; and the push-governed weeks in arm A are then NOT zero – they are
// the coach's, and the spirit row fires for a decision neither arm made. Run
// `npm run bench:spirit -- --push --coached` to reproduce that reading at the shipped `middle` rung:
// it prints the same census with the coach's own column filled in, and it is why the default is
// `self`. ⚠ `'self'` is a first-class rung (`CoachTier`, «the parent on the court»), not a poke: it
// reaches the world through `openingCoachId`, which returns null for it, and nothing is written
// behind the engine's back.
//
// ⚠⚠ THE ANTI-STALL CONTRACT, AND IT IS THE POINT OF THE BLOCK RATHER THAN A PRECAUTION. This file
// spent a wave printing a full census while answering NOTHING (842 beats raised, 0 answered, exit 0
// – see the wave-2 banner above §"THE TWO ARMS ANSWER HER"), so a pair that can report a price it
// did not measure is not an instrument. Four properties, and the run DIES rather than prints if any
// of them fails:
//
//   1. THE ARMS ARE COUNTED, NOT ASSUMED. Every knock that ARRIVED is counted, every one the parent
//      was asked about is counted, every answer is counted, and BOTH ledgers have to balance:
//      `asked + coach-decided === arrived` and `answered + latched === asked`, per arm. Arm B must
//      record pushes > 0 and arm A rests > 0 – printed beside every price, never in a comment.
//   2. NO `try/catch` STANDS BETWEEN A KNOCK AND ITS ANSWER. `decideKnock` is called bare. Its one
//      legitimate refusal on this walk – `guardNotEnded`, when the tick that raised the knock also
//      ended the career – is handled by TESTING the latch instead of catching its throw, and those
//      knocks are counted into their own printed column. Any other refusal propagates and kills the
//      run, which is the behaviour the swallowed throw of v74 did not have.
//   3. THE TWO ARMS ARE PROVEN TO HAVE TAPPED ONE MAIN STREAM, per week, by a counting wrapper that
//      takes no draw of its own – see `runPushCareer`. A pair whose draw counts or draw hashes
//      diverge is measuring the seed and not the choice, and is a hard failure.
//   4. EVERY PRINTED NUMBER CARRIES ITS OWN `n`, and a number with n = 0 is a failure, not a dash.
//
// ⚠⚠ AND NOTHING HERE CHANGES A CONSTANT. Same ruling as the sweeps and the bars: a measurement that
// disagrees with the delta table's prediction IS the finding, and retuning is the owner's call on
// the record (who-she-is §4a).

/** ⚠⚠ THE ARM **IS** THE KNOCK ANSWER, which is the strongest statement of «the two arms differ only
 *  in the knock answer» that can be made in code rather than in prose: the arm label is a
 *  `KnockChoice`, the walker reads `arm` in exactly ONE expression (`decideKnock(world, arm)`), and
 *  there is no second branch anywhere in this block for a difference to hide in. */
const PUSH_ARMS = ['rest', 'push'] as const
type PushArm = (typeof PUSH_ARMS)[number]

const PUSH_MODE = process.argv.includes('--push')
/** ⚠ THE CONTROL FOR THE PARAGRAPH ABOVE, NOT A SECOND MEASUREMENT. `--push --coached` runs the same
 *  pair at `DEFAULT_PROFILE`'s shipped `middle` rung, where the coach answers most knocks himself –
 *  so the reason the default is self-coached is a command anyone can re-run rather than a number
 *  quoted in a comment. Its arms are NOT "rest/push every knock" and its printout says so. */
const PUSH_COACHED = process.argv.includes('--coached')
const PUSH_COACH_TIER = PUSH_COACHED ? DEFAULT_PROFILE.coachTier : 'self'

/** The brief's grid is 64 seed-pairs; `--seeds=N` shrinks it for a smoke run and the printout says
 *  so in its own header rather than letting a 4-seed run be read as the measurement. */
const PUSH_SEEDS_ASKED = 64
function pushSeedCount(): number {
  const flag = process.argv.find((a) => a.startsWith('--seeds='))
  if (flag === undefined) return PUSH_SEEDS_ASKED
  const n = Number(flag.slice('--seeds='.length))
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : PUSH_SEEDS_ASKED
}

interface PairCareer {
  seed: string
  arm: PushArm
  temperament: Temperament
  weeks: number
  endedAs: string | null
  // --- the census that makes a stall visible ----------------------------------------------------
  /** every knock that ARRIVED in this career, whoever ended up answering it. */
  knocksArrived: number
  /** ...of which the coach answered inside the tick and the parent was never asked about. Zero is
   *  the whole point of the self-coached profile, and it is CHECKED rather than assumed. */
  knocksCoachDecided: number
  /** ...and of which the parent was asked (`pendingKnock` true after the tick). */
  knocksAsked: number
  knocksAnswered: number
  /** asked by the same tick that ended the career – `decideKnock` would refuse, so it is COUNTED
   *  and printed instead of being caught. `answered + latched === asked` is checked. */
  knocksLatched: number
  rests: number
  pushesFirst: number
  pushesRepeat: number
  /** weeks `knockGoverns` says a push is being paid for – the engine's own rule, not 3 × pushes. */
  pushGovernedWeeks: number
  /** ⭐ THE DELTA TABLE, MEASURED AT THE DECISION ITSELF: what `world.bond` actually moved by across
   *  each `decideKnock` call, against what `ECONOMY.bond.delta` says that answer is worth. This is
   *  the ONE reading that can tell «the delta never landed» from «the delta landed and the weekly
   *  regression paid it back», which is the whole question [P1] below turns on. */
  knockBondMeasured: number
  knockBondPredicted: number
  knockDeltaMismatches: number
  // --- the three prices -------------------------------------------------------------------------
  bond: number[]
  spirit: number[]
  weeksUnderBaseline: number
  weeksUnderKnee: number
  minSpirit: number
  matchesPlayed: number
  matchesWon: number
  injuries: number
  weeksInjured: number
  attachedWeeks: number
  episodeWeeks: number[]
  /** how many life beats `drainLifeBeats` cleared – printed for the same reason every other counter
   *  in this block is: a drain that never ran is indistinguishable from a walk with nothing to drain
   *  until somebody prints the number. */
  beatsDrained: number
  /** the two the SHARED helpers write - `bookTheFamilyWeeks` and `answerTheBirthday`. They are here
   *  so this pair can call the bar grid's own implementations instead of growing a second copy of
   *  the off-season rule and the birthday answer. */
  vacations: number
  asks: string[]
  // --- the invariance trace ---------------------------------------------------------------------
  /** cumulative MAIN draws after every resolved week, and a cumulative hash of the VALUES drawn. */
  mainDrawsAtWeek: number[]
  mainHashAtWeek: number[]
}

/** Every life beat, answered at its own bond-neutral price, in BOTH arms – this pair prices one
 *  decision and a beat is not it.
 *
 *  ⚠ THE ONE TOLERATED REFUSAL IS THE TERMINAL LATCH, tested against the engine's OWN string, and
 *  ANYTHING ELSE IS RETHROWN on purpose. A drain that cannot state its own price must stop this run,
 *  not be swallowed: the swallowed version of this exact `catch` is what left the census above
 *  printing 842 beats raised and zero answered while exiting 0.
 *  ⚠ v75 T3b – «cannot state its own price» is the amended wording of what used to be «a beat kind
 *  with no bond-neutral answer»: `drainCostOf` now refuses a registered answer whose delta moves with
 *  her `wants`, rather than the drain refusing a kind with no zero. Same catch, same rethrow. */
function drainEveryBeat(world: WorldState): number {
  try {
    return drainLifeBeats(world)
  } catch (e) {
    if (!(e instanceof Error) || e.message !== CAREER_ENDED_REFUSAL) throw e
    return 0
  }
}

function runPushCareer(seed: string, arm: PushArm, temperament: Temperament): PairCareer {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: PUSH_COACH_TIER })
  // ⚠ the same single field the bar grid writes, for the same reason – see the file header.
  world.temperament = temperament

  // ⚠⚠ THE COUNTING WRAPPER TAKES NO DRAW OF ITS OWN. It calls the same generator, in the same
  // order, and returns the same value; what it adds is a POSITION, which is the only way two arms
  // can be proven to have tapped one stream instead of being expected to. `rngFromSeed(world.seed)`
  // is the world's own MAIN, exactly as every other bench drives it – zero new RNG, on any stream.
  const main = rngFromSeed(world.seed)
  let draws = 0
  let hash = 0x811c9dc5 | 0
  const rng: Rng = () => {
    const v = main()
    draws++
    hash = Math.imul(hash ^ Math.floor(v * 0x100000000), 16777619) | 0
    return v
  }

  const career: PairCareer = {
    seed,
    arm,
    temperament,
    weeks: 0,
    endedAs: null,
    knocksArrived: 0,
    knocksCoachDecided: 0,
    knocksAsked: 0,
    knocksAnswered: 0,
    knocksLatched: 0,
    rests: 0,
    pushesFirst: 0,
    pushesRepeat: 0,
    pushGovernedWeeks: 0,
    knockBondMeasured: 0,
    knockBondPredicted: 0,
    knockDeltaMismatches: 0,
    bond: [],
    spirit: [],
    weeksUnderBaseline: 0,
    weeksUnderKnee: 0,
    minSpirit: Number.POSITIVE_INFINITY,
    matchesPlayed: 0,
    matchesWon: 0,
    injuries: 0,
    weeksInjured: 0,
    attachedWeeks: 0,
    episodeWeeks: [],
    beatsDrained: 0,
    vacations: 0,
    asks: [],
    mainDrawsAtWeek: [],
    mainHashAtWeek: [],
  }

  for (let i = 0; i < WEEKS; i++) {
    if (world.ending !== null) break
    // The family weeks are booked in BOTH arms - see the block header for why this is held equal
    // rather than made an arm difference.
    if (world.week % WEEKS_PER_YEAR === 0) bookTheFamilyWeeks(world, career)
    world.plan = { ...WEEK_PLAN_PRESETS.balanced }
    enterWhatSheCan(world)

    tickWeek(world, rng)
    career.weeks++
    career.mainDrawsAtWeek.push(draws)
    career.mainHashAtWeek.push(hash)
    career.spirit.push(world.spirit)
    if (world.spirit < ECONOMY.spirit.baseline) career.weeksUnderBaseline++
    if (world.spirit < ECONOMY.spirit.knee) career.weeksUnderKnee++
    career.minSpirit = Math.min(career.minSpirit, world.spirit)
    if (activeEpisode(world) !== null) career.attachedWeeks++
    // ⚠ READ HERE, BEFORE THIS WEEK'S DECISIONS: `accrueSpirit` has already run inside the tick and
    // has already asked this same question, so this counts the weeks the `knockPushedWeek` row
    // actually fired rather than the weeks a bench thinks it should have.
    if (knockGoverns(world.knock, world.week) && world.knock?.choice === 'push') career.pushGovernedWeeks++
    if (world.injury !== null) {
      career.weeksInjured++
      if (world.injury.sinceWeek === world.week) career.injuries++
    }

    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }

    // --- ⭐⭐⭐ THE ONE DECISION THE ARMS DISAGREE ABOUT, AND THE ONLY READ OF `arm` IN THIS WALK ----
    //
    // ⚠ THE ARRIVAL IS COUNTED SEPARATELY FROM THE ASK, because they are not the same number on a
    // coached career: `rollKnock` calls `coachDecidesKnock` inside the tick, and a knock he answered
    // himself never reaches `pendingKnock`. Both ledgers are printed and both have to balance.
    if (world.knock !== null && world.knock.sinceWeek === world.week) {
      career.knocksArrived++
      if (!pendingKnock(world)) career.knocksCoachDecided++
    }
    if (pendingKnock(world)) {
      career.knocksAsked++
      if (world.ending === null) {
        // ⚠ the repeat flag is the WORLD's (`k.repeat`, engine/knock.ts `pushedParts`), read before
        // the answer so the −3 and the −5 rows can be predicted apart from the delta table below.
        const repeat = world.knock?.repeat === true
        const predicted =
          arm === 'rest' ? ECONOMY.bond.delta.knockRest : repeat ? ECONOMY.bond.delta.knockPushRepeatPart : ECONOMY.bond.delta.knockPush
        const bondBeforeDecision = world.bond
        // ⚠⚠ NO `try/catch`. `decideKnock`'s only legitimate refusal on this walk is `guardNotEnded`
        // on a career the same tick ended, and that case is TESTED above rather than caught – so any
        // other refusal propagates, kills the run, and cannot be mistaken for a measurement.
        decideKnock(world, arm)
        const landed = world.bond - bondBeforeDecision
        career.knockBondMeasured += landed
        career.knockBondPredicted += predicted
        // ⚠ A CLAMP IS THE ONLY LEGAL DISAGREEMENT (`ECONOMY.bond.min`/`max`); anything else would be
        // a delta that did not land, which is exactly what this counter exists to make visible.
        if (landed !== predicted) career.knockDeltaMismatches++
        career.knocksAnswered++
        if (arm === 'rest') career.rests++
        else if (repeat) career.pushesRepeat++
        else career.pushesFirst++
      } else {
        career.knocksLatched++
      }
    }
    answerTheBirthday(world, career)
    career.beatsDrained += drainEveryBeat(world)

    career.bond.push(world.bond)
  }

  career.endedAs = world.ending === null ? null : world.ending.type
  career.matchesPlayed = matchesEverPlayed(world)
  career.matchesWon = world.seasonWins + world.seasonHistory.reduce((sum, h) => sum + h.wins, 0)
  career.episodeWeeks = (world.loveEpisodes ?? []).map((e) => e.sinceWeek)
  return career
}

interface Pair {
  seed: string
  temperament: Temperament
  rest: PairCareer
  push: PairCareer
  /** the last week BOTH arms resolved – a pushed career that ended early is a shorter arm, and a
   *  reading taken off a week one of the two never saw is not a paired reading. */
  horizon: number
  full: boolean
}

interface Stat {
  mean: number
  sem: number
  n: number
}

function stat(xs: readonly number[]): Stat {
  const d = xs.filter((x) => !Number.isNaN(x))
  return { mean: mean(d), sem: sem(d), n: d.length }
}

/** ⚠⚠ EVERY HEADLINE NUMBER IS FOLDED TO ONE VALUE PER SEED BEFORE ITS SEM IS TAKEN – section [3]'s
 *  own construction, and here it is not a refinement but a correction. The four temperament arms are
 *  the SAME seeds played four times over, and in wave 1 `temperament` is read by nothing but
 *  `temperamentIntensity` inside `accrueSpirit`, while `spiritMatchFactor` is flat 1.0 above the
 *  knee – so for the bond gap and the match-pp cost the four rows are four REPLICAS, not four
 *  samples. MEASURED rather than argued: the per-temperament table below prints an identical knock
 *  census, an identical bond gap and an identical Δ pp down all four rows. Pooling 4 × 64 as if it
 *  were 256 independent pairs would halve every SEM in this block for free. */
function foldBySeed(pairs: readonly Pair[], pick: (p: Pair) => number): number[] {
  const seedIds = [...new Set(pairs.map((p) => p.seed))]
  return seedIds.map((s) => mean(pairs.filter((p) => p.seed === s).map(pick).filter((x) => !Number.isNaN(x))))
}

function say(s: Stat, digits = 2): string {
  return s.n === 0 ? 'n=0 ⚠' : `${s.mean.toFixed(digits)} ± ${s.sem.toFixed(digits + 1)} (n ${s.n})`
}

/** ⚠⚠ THE RUN DIES HERE RATHER THAN PRINTING A PRICE. Every caller is a property the pair has to
 *  have before any of its three numbers means anything; the exit code is what a gate reads. */
function stall(headline: string, detail: string): never {
  console.error(`\n${'!'.repeat(100)}`)
  console.error(`THE PUSH PAIR MEASURED NOTHING – NO PRICE IS PRINTED`)
  console.error(`  ${headline}`)
  console.error(`  ${detail}`)
  console.error(
    `  ⚠ This is the anti-stall contract firing, not a crash. A pair that cannot prove it answered\n` +
      `    knocks in both arms, on one MAIN stream, is a stall wearing a census – see the block header.`,
  )
  console.error(`${'!'.repeat(100)}\n`)
  process.exit(1)
}

function winRateOf(c: PairCareer): number {
  return c.matchesPlayed === 0 ? Number.NaN : pct(c.matchesWon, c.matchesPlayed)
}

function runPushPair(): void {
  const startedPair = Date.now()
  /** The delta table itself, read once – every "predicted" number in this block comes off it. */
  const d0 = ECONOMY.bond.delta
  const seedCountHere = pushSeedCount()
  const careers: PairCareer[] = []
  for (const arm of PUSH_ARMS) {
    for (const temperament of TEMPERAMENTS) {
      for (let s = 0; s < seedCountHere; s++) careers.push(runPushCareer(`push-${s}`, arm, temperament))
    }
  }
  const armOf = (arm: PushArm) => careers.filter((c) => c.arm === arm)
  const find = (arm: PushArm, t: Temperament, seed: string) =>
    careers.find((c) => c.arm === arm && c.temperament === t && c.seed === seed)

  const pairs: Pair[] = []
  for (const t of TEMPERAMENTS) {
    for (let s = 0; s < seedCountHere; s++) {
      const seed = `push-${s}`
      const rest = find('rest', t, seed)
      const push = find('push', t, seed)
      if (rest === undefined || push === undefined) stall('a pair is missing an arm', `${t} / ${seed}`)
      const horizon = Math.min(rest.weeks, push.weeks)
      pairs.push({ seed, temperament: t, rest, push, horizon, full: rest.weeks === WEEKS && push.weeks === WEEKS })
    }
  }

  rule(
    `THE PUSH-THROUGH PAIR (T12) – wave 1's measurement debt, paid · ${seedCountHere} seeds × 4 temperaments × {rest, push}\n` +
      `${pairs.length} seed-pairs, ${careers.length} careers, ${careers.reduce((a, c) => a + c.weeks, 0).toLocaleString('en-US')} resolved weeks · ` +
      `the grid is ${WEEKS} weeks (${FORK_MODE ? '--fork' : `${SEASONS} seasons`})\n` +
      `IDENTICAL POLICY EXCEPT THE KNOCK ANSWER: balanced plan every week in both arms · the family weeks booked in BOTH ·\n` +
      `  one entry policy · one birthday answer · every life beat drained bond-neutrally in both · constants read, none changed\n` +
      `coach rung: ${PUSH_COACH_TIER}` +
      (PUSH_COACHED
        ? `  ⚠⚠ --coached: THE CONTROL, NOT THE MEASUREMENT. At this rung \`coachDecidesKnock\` answers most knocks inside\n` +
          `   the tick and moves no bond, so NEITHER arm rests-or-pushes every knock and the three prices below are not T12's.\n` +
          `   It exists to print the "coach decided" column the default run has to show as zero.\n`
        : `  (self-coached on purpose – see the block header; the "coach decided" column below is the proof, and it must be 0)\n`) +
      (seedCountHere < PUSH_SEEDS_ASKED
        ? `⚠⚠ SMOKE RUN – ${seedCountHere} seeds is BELOW the brief's ${PUSH_SEEDS_ASKED} seed-pairs and these numbers are not the measurement.\n`
        : ''),
  )

  // --- P0. THE ARMS DID THE THING -----------------------------------------------------------------
  console.log(`\n    [P0] THE ARMS DID THE THING – counted, never assumed. Every price below is void if a cell here is wrong.`)
  console.log(
    `    ${pad('arm', 8)}${padL('careers', 9)}${padL('arrived', 9)}${padL('coach did', 11)}${padL('asked', 8)}${padL('answered', 10)}${padL('latched', 9)}` +
      `${padL('rests', 8)}${padL('push 1st', 10)}${padL('push rpt', 10)}${padL('gov. wks', 10)}${padL('per career', 12)}`,
  )
  console.log(`    ${'─'.repeat(114)}`)
  interface ArmTotals {
    arrived: number
    coach: number
    asked: number
    answered: number
    latched: number
    rests: number
    first: number
    repeat: number
    gov: number
    beats: number
    bondMeasured: number
    bondPredicted: number
    deltaMismatches: number
  }
  const zero = (): ArmTotals => ({
    arrived: 0, coach: 0, asked: 0, answered: 0, latched: 0, rests: 0, first: 0, repeat: 0, gov: 0, beats: 0,
    bondMeasured: 0, bondPredicted: 0, deltaMismatches: 0,
  })
  const armTotals: Record<PushArm, ArmTotals> = { rest: zero(), push: zero() }
  for (const arm of PUSH_ARMS) {
    const cs = armOf(arm)
    const tot = armTotals[arm]
    for (const c of cs) {
      tot.arrived += c.knocksArrived
      tot.coach += c.knocksCoachDecided
      tot.asked += c.knocksAsked
      tot.answered += c.knocksAnswered
      tot.latched += c.knocksLatched
      tot.rests += c.rests
      tot.first += c.pushesFirst
      tot.repeat += c.pushesRepeat
      tot.gov += c.pushGovernedWeeks
      tot.beats += c.beatsDrained
      tot.bondMeasured += c.knockBondMeasured
      tot.bondPredicted += c.knockBondPredicted
      tot.deltaMismatches += c.knockDeltaMismatches
    }
    console.log(
      `    ${pad(arm, 8)}${padL(cs.length, 9)}${padL(tot.arrived, 9)}${padL(tot.coach, 11)}${padL(tot.asked, 8)}${padL(tot.answered, 10)}${padL(tot.latched, 9)}` +
        `${padL(tot.rests, 8)}${padL(tot.first, 10)}${padL(tot.repeat, 10)}${padL(tot.gov, 10)}${padL((tot.answered / cs.length).toFixed(2), 12)}`,
    )
  }
  console.log(`    ${'─'.repeat(114)}`)
  console.log(`    "coach did" = answered inside the tick by \`coachDecidesKnock\`, which moves no bond – MUST be 0 on the self-coached default.`)
  console.log(`    "latched" = asked by the tick that ALSO ended the career, so \`decideKnock\` would refuse – tested, not caught.`)
  console.log(`    "gov. wks" = weeks \`knockGoverns\` says a push is being paid for (the engine's own rule, not ${KNOCK_PUSH_WEEKS} × pushes).`)
  console.log(
    `    ⚠ THE TWO ARMS DO NOT SEE THE SAME NUMBER OF KNOCKS, and that is the answer working rather than a broken pairing:\n` +
      `      \`knockUntilWeek\` holds a pushed knock for ${KNOCK_PUSH_WEEKS} weeks against the rested one's 1, and the cooldown runs from the\n` +
      `      RETIREMENT, so pushing buys fewer future knocks. The prediction in [P1] is therefore computed off each arm's OWN\n` +
      `      counts, never off a shared one.`,
  )

  // --- P0a. THE DELTA TABLE, MEASURED AT THE DECISION ITSELF --------------------------------------
  console.log(`\n    [P0a] THE DELTA TABLE LANDED – what \`world.bond\` moved by across each \`decideKnock\`, against the table.`)
  console.log(`    ${pad('arm', 8)}${padL('decisions', 11)}${padL('predicted', 11)}${padL('measured', 11)}${padL('per decision', 14)}${padL('mismatches', 12)}`)
  console.log(`    ${'─'.repeat(67)}`)
  for (const arm of PUSH_ARMS) {
    const tot = armTotals[arm]
    console.log(
      `    ${pad(arm, 8)}${padL(tot.answered, 11)}${padL(tot.bondPredicted.toFixed(1), 11)}${padL(tot.bondMeasured.toFixed(1), 11)}` +
        `${padL(tot.answered === 0 ? '–' : (tot.bondMeasured / tot.answered).toFixed(3), 14)}${padL(tot.deltaMismatches, 12)}`,
    )
  }
  console.log(`    ${'─'.repeat(67)}`)
  console.log(
    `    \`knockRest\` ${d0.knockRest} · \`knockPush\` ${d0.knockPush} · \`knockPushRepeatPart\` ${d0.knockPushRepeatPart}. "mismatches" = decisions where the bond moved by\n` +
      `    something other than the table says – only a clamp at ${ECONOMY.bond.min}/${ECONOMY.bond.max} can do that legally, and a non-zero column with\n` +
      `    no clamped career is a delta that did not land. ⚠ THIS ROW IS WHAT SEPARATES «the price is nothing» from «the price\n` +
      `    was paid and the ${ECONOMY.bond.regressionPerWeek}/wk regression took it back», which is the whole of [P1].`,
  )

  // THE HARD CHECKS. Order matters: a price is printed only after every one of them passes.
  for (const arm of PUSH_ARMS) {
    const tot = armTotals[arm]
    if (tot.asked + tot.coach !== tot.arrived) {
      stall(
        `arm '${arm}': the arrival ledger does not balance`,
        `asked ${tot.asked} + coach-decided ${tot.coach} ≠ arrived ${tot.arrived} – a knock nobody is recorded as having handled.`,
      )
    }
    if (tot.answered + tot.latched !== tot.asked) {
      stall(
        `arm '${arm}' was asked about ${tot.asked} knocks and accounted for ${tot.answered + tot.latched}`,
        `answered ${tot.answered} + latched ${tot.latched} ≠ asked ${tot.asked} – a knock this arm never answered is an arm that did not run.`,
      )
    }
  }
  if (!PUSH_COACHED && armTotals.rest.coach + armTotals.push.coach !== 0) {
    stall(
      `the coach answered ${armTotals.rest.coach + armTotals.push.coach} knocks on a self-coached grid`,
      `arm A would not be resting every knock and arm B would not be pushing every one – the pair is not the pair.`,
    )
  }
  if (armTotals.rest.rests === 0) {
    stall(`arm A recorded ZERO rests`, `${armTotals.rest.asked} knocks reached the parent in the rest arm and none of them was rested.`)
  }
  if (armTotals.push.first + armTotals.push.repeat === 0) {
    stall(`arm B recorded ZERO pushes`, `${armTotals.push.asked} knocks reached the parent in the push arm and none of them was pushed through.`)
  }
  if (armTotals.push.gov === 0) {
    stall(
      `arm B pushed ${armTotals.push.first + armTotals.push.repeat} knocks and NO week was ever governed by one`,
      `\`knockPushedWeek\` therefore never fired, so number 2 below would be pricing a spirit row that never ran.`,
    )
  }
  if (armTotals.rest.first + armTotals.rest.repeat !== 0 || armTotals.push.rests !== 0) {
    stall(`the arms answered each other's answer`, `rest arm pushes ${armTotals.rest.first + armTotals.rest.repeat}, push arm rests ${armTotals.push.rests}.`)
  }
  if (armTotals.rest.bondMeasured <= 0 || armTotals.push.bondMeasured >= 0) {
    stall(
      `the knock deltas did not land on the ledger`,
      `rest arm moved bond by ${armTotals.rest.bondMeasured.toFixed(1)} (expected > 0) and the push arm by ${armTotals.push.bondMeasured.toFixed(1)} (expected < 0) across their decisions.`,
    )
  }

  // --- P0b. ONE MAIN STREAM -----------------------------------------------------------------------
  let drawMismatch = 0
  let hashMismatch = 0
  let episodeMismatch = 0
  let firstBad = ''
  for (const p of pairs) {
    for (let w = 0; w < p.horizon; w++) {
      if (p.rest.mainDrawsAtWeek[w] !== p.push.mainDrawsAtWeek[w]) {
        drawMismatch++
        if (firstBad === '') firstBad = `${p.temperament}/${p.seed} week ${w + 1}: rest ${p.rest.mainDrawsAtWeek[w]} draws vs push ${p.push.mainDrawsAtWeek[w]}`
        break
      }
      if (p.rest.mainHashAtWeek[w] !== p.push.mainHashAtWeek[w]) {
        hashMismatch++
        if (firstBad === '') firstBad = `${p.temperament}/${p.seed} week ${w + 1}: the same draw COUNT and a different value hash`
        break
      }
    }
    const upTo = (c: PairCareer) => c.episodeWeeks.filter((w) => w <= p.horizon).join(',')
    if (upTo(p.rest) !== upTo(p.push)) episodeMismatch++
  }
  console.log(`\n    [P0b] ONE MAIN STREAM, MEASURED – the two arms may not re-roll the world's dice (CLAUDE.md invariant 2).`)
  console.log(
    `    ${pad('pairs checked', 20)}${padL(pairs.length, 8)}   ` +
      `draw-count mismatches ${drawMismatch} · draw-value hash mismatches ${hashMismatch} · arrival-week mismatches ${episodeMismatch}`,
  )
  console.log(
    `    Compared week by week to each pair's COMMON horizon (a career the push ended early is a shorter arm, not a\n` +
      `    divergent stream). The counting wrapper adds a position and no draw; the hash is over the VALUES drawn.`,
  )
  if (drawMismatch > 0 || hashMismatch > 0) {
    stall(`the two arms did NOT tap the same MAIN stream`, `${drawMismatch} draw-count and ${hashMismatch} hash mismatches – first: ${firstBad}`)
  }
  if (episodeMismatch > 0) {
    stall(
      `the two arms drew DIFFERENT arrival weeks (${episodeMismatch} pairs)`,
      `the arrival is keyed on (seed, calendar) alone, so a knock answer that moves it is a broken invariant, not a price.`,
    )
  }
  console.log(`    → the arms differ in the knock answer and in nothing the dice can see.`)

  // --- P0c. WHAT THE WALK COST --------------------------------------------------------------------
  console.log(`\n    [P0c] THE SHAPE OF THE TWO WALKS – printed because a truncated arm cannot be read at season end.`)
  console.log(
    `    ${pad('arm', 8)}${padL('ran full', 10)}${padL('ended early', 13)}${padL('injuries', 10)}${padL('wks injured', 13)}` +
      `${padL('family wks', 12)}${padL('birthdays', 11)}${padL('beats drained', 15)}${padL('attached wks', 14)}${padL('min spirit', 12)}${padL('wks < knee', 12)}  endings`,
  )
  console.log(`    ${'─'.repeat(146)}`)
  for (const arm of PUSH_ARMS) {
    const cs = armOf(arm)
    const full = cs.filter((c) => c.weeks === WEEKS).length
    const kinds = [...new Set(cs.filter((c) => c.endedAs !== null).map((c) => c.endedAs))]
      .map((k) => `${k} ${cs.filter((c) => c.endedAs === k).length}`)
      .join(', ')
    console.log(
      `    ${pad(arm, 8)}${padL(`${full}/${cs.length}`, 10)}${padL(cs.length - full, 13)}` +
        `${padL(cs.reduce((a, c) => a + c.injuries, 0), 10)}${padL(cs.reduce((a, c) => a + c.weeksInjured, 0), 13)}` +
        `${padL(cs.reduce((a, c) => a + c.vacations, 0), 12)}${padL(cs.reduce((a, c) => a + c.asks.length, 0), 11)}` +
        `${padL(cs.reduce((a, c) => a + c.beatsDrained, 0), 15)}${padL(cs.reduce((a, c) => a + c.attachedWeeks, 0), 14)}` +
        `${padL(Math.min(...cs.map((c) => c.minSpirit)).toFixed(1), 12)}${padL(cs.reduce((a, c) => a + c.weeksUnderKnee, 0), 12)}  ${kinds || '–'}`,
    )
  }
  console.log(`    ${'─'.repeat(146)}`)
  console.log(`    ⚠ "family wks" and "birthdays" are the HELD-EQUAL columns: both arms book the same off-season weeks and give her the`)
  console.log(`      thing she asked for. They differ only where a pushed career ended early and stopped booking – see "ended early".`)
  console.log(`    "beats drained" = rows \`drainLifeBeats\` cleared at their own bond-neutral price. Printed, not assumed: a drain that`)
  console.log(`      never ran and a walk with nothing to drain look the same until somebody counts.`)
  if (armTotals.rest.beats + armTotals.push.beats === 0) {
    console.log(`    ⚠⚠ ZERO BEATS DRAINED over the whole grid – the \`'met'\` row is raised from her sixteenth on, which is inside this`)
    console.log(`       grid, so this is a finding about the beat and not about the price. No number below reads it either way.`)
  }
  const cleanPairs = pairs.filter((p) => p.full)
  console.log(
    `    ${cleanPairs.length}/${pairs.length} pairs ran the whole ${WEEKS}-week grid in BOTH arms. The season-end readings below are those pairs;\n` +
      `    the common-horizon rows beside them use every pair, so the dropped ones cannot hide inside a selection.`,
  )
  if (cleanPairs.length === 0) {
    stall(`no pair ran the full grid in both arms`, `there is no season-end week both arms saw, so no season-end gap can be reported.`)
  }

  // --- P1. THE BOND TRAJECTORY GAP ----------------------------------------------------------------
  rule('[P1] BOND – the delta table\'s PREDICTION against the gap MEASURED at season end')
  const predictedOf = (p: Pair) =>
    p.rest.rests * d0.knockRest - (p.push.pushesFirst * d0.knockPush + p.push.pushesRepeat * d0.knockPushRepeatPart)
  const endBond = (c: PairCareer) => c.bond[c.bond.length - 1]
  const predicted = stat(foldBySeed(cleanPairs, predictedOf))
  const measuredEnd = stat(foldBySeed(cleanPairs, (p) => endBond(p.rest) - endBond(p.push)))
  const measuredCommon = stat(foldBySeed(pairs, (p) => p.rest.bond[p.horizon - 1] - p.push.bond[p.horizon - 1]))
  const measuredTrajectory = stat(foldBySeed(pairs, (p) => mean(p.rest.bond.slice(0, p.horizon)) - mean(p.push.bond.slice(0, p.horizon))))
  const seasonEnds: number[] = []
  for (let s = 1; s * WEEKS_PER_YEAR <= WEEKS; s++) seasonEnds.push(s * WEEKS_PER_YEAR)
  console.log(
    `    PREDICTED, straight off \`ECONOMY.bond.delta\` and each arm's OWN measured knock counts:\n` +
      `      rest  ${(armTotals.rest.rests / armOf('rest').length).toFixed(2)} rests × ${d0.knockRest} per career · ` +
      `push  ${(armTotals.push.first / armOf('push').length).toFixed(2)} × ${d0.knockPush} + ${(armTotals.push.repeat / armOf('push').length).toFixed(2)} × ${d0.knockPushRepeatPart} per career\n` +
      `      → ${predicted.mean.toFixed(2)} raw bond points of separation per pair over the career (± ${predicted.sem.toFixed(3)}, n ${predicted.n} seeds),\n` +
      `        and [P0a] above has already shown those points LANDING on the ledger, decision by decision.`,
  )
  console.log(
    `\n    ${pad('reading', 40)}${padL('gap', 10)}${padL('± SEM', 10)}${padL('n', 7)}   what it is`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  console.log(
    `    ${pad('PREDICTED (delta table, raw)', 40)}${padL(predicted.mean.toFixed(2), 10)}${padL(predicted.sem.toFixed(3), 10)}${padL(predicted.n, 7)}   every knock delta the two arms took, summed`,
  )
  console.log(
    `    ${pad('MEASURED at season end (week ' + WEEKS + ')', 40)}${padL(measuredEnd.mean.toFixed(2), 10)}${padL(measuredEnd.sem.toFixed(3), 10)}${padL(measuredEnd.n, 7)}   bond(rest) − bond(push), full-grid pairs`,
  )
  console.log(
    `    ${pad('MEASURED at the common horizon', 40)}${padL(measuredCommon.mean.toFixed(2), 10)}${padL(measuredCommon.sem.toFixed(3), 10)}${padL(measuredCommon.n, 7)}   the same, every pair, at min(weeks)`,
  )
  console.log(
    `    ${pad('MEASURED over the whole trajectory', 40)}${padL(measuredTrajectory.mean.toFixed(2), 10)}${padL(measuredTrajectory.sem.toFixed(3), 10)}${padL(measuredTrajectory.n, 7)}   mean weekly bond gap, the area between the curves`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  // ⚠ EVERY SEASON END AND NOT JUST THE LAST ONE, because "at season end" is a reading week and the
  // last week of this grid is an OFF-SEASON week with no knock anywhere near it. Four readings turn
  // "the endpoint is uninformative" from an excuse into a measurement.
  console.log(`    ⚠ the same gap at EVERY season end, so the choice of reading week cannot flatter or bury it:`)
  console.log(
    `      ` +
      seasonEnds
        .map((w) => {
          const g = stat(foldBySeed(pairs.filter((p) => p.horizon >= w), (p) => p.rest.bond[w - 1] - p.push.bond[w - 1]))
          return `week ${w}: ${g.n === 0 ? 'n=0' : `${g.mean.toFixed(2)} ± ${g.sem.toFixed(3)} (n ${g.n})`}`
        })
        .join('   ·   '),
  )
  // THE BRIDGE between the two, computed from the constants the way section [3] computes its own.
  const restWeeks = armOf('rest').reduce((a, c) => a + c.weeks, 0)
  const pushWeeks = armOf('push').reduce((a, c) => a + c.weeks, 0)
  const restRate = armTotals.rest.answered / restWeeks
  const pushRate = armTotals.push.answered / pushWeeks
  const restPerWeek = armTotals.rest.bondMeasured / restWeeks
  const pushPerWeek = armTotals.push.bondMeasured / pushWeeks
  console.log(
    `\n    ⚠ THE ARITHMETIC CEILING, and it is why those rows disagree with the prediction. Bond regresses a FLAT\n` +
      `      ${ECONOMY.bond.regressionPerWeek}/week toward ${ECONOMY.bond.start}, so a displacement survives only while the arm's decisions are worth ≥ ${ECONOMY.bond.regressionPerWeek}/week:\n` +
      `        rest  ${restRate.toFixed(4)} decisions/wk, ${restPerWeek.toFixed(4)} bond/wk   ${Math.abs(restPerWeek) >= ECONOMY.bond.regressionPerWeek ? '≥' : '<'} ${ECONOMY.bond.regressionPerWeek}\n` +
      `        push  ${pushRate.toFixed(4)} decisions/wk, ${pushPerWeek.toFixed(4)} bond/wk   ${Math.abs(pushPerWeek) >= ECONOMY.bond.regressionPerWeek ? '≥' : '<'} ${ECONOMY.bond.regressionPerWeek}\n` +
      `      Neither arm is worth half a point a week, so the ${predicted.mean.toFixed(2)} raw points ARE paid (see [P0a]) and are then paid\n` +
      `      BACK between knocks. What survives to a reading week is a snapshot of how recently a knock landed.`,
  )

  // --- P2. SPIRIT WEEKS UNDER THE BASELINE ---------------------------------------------------------
  rule('[P2] SPIRIT – the weeks under the baseline that PUSHING is responsible for')
  // ⚠ THE PREDICTION IS THE DIFFERENCE IN GOVERNED WEEKS AND NOT ARM B's COUNT. On the self-coached
  // default arm A's count is zero and the two are the same number; under `--coached` it is not,
  // because the coach pushes her in BOTH arms and those weeks belong to neither arm's answer.
  const predictedWeeks = stat(foldBySeed(cleanPairs, (p) => p.push.pushGovernedWeeks - p.rest.pushGovernedWeeks))
  const measuredWeeks = stat(foldBySeed(cleanPairs, (p) => p.push.weeksUnderBaseline - p.rest.weeksUnderBaseline))
  const measuredWeeksCommon = stat(
    foldBySeed(
      pairs,
      (p) =>
        p.push.spirit.slice(0, p.horizon).filter((x) => x < ECONOMY.spirit.baseline).length -
        p.rest.spirit.slice(0, p.horizon).filter((x) => x < ECONOMY.spirit.baseline).length,
    ),
  )
  console.log(
    `    PREDICTED: the spirit table has exactly ONE row for this decision – \`perturb.knockPushedWeek\` ${ECONOMY.spirit.perturb.knockPushedWeek}, scaled by\n` +
      `      \`perturbationScale\` (${ECONOMY.spirit.perturbationScale.steady} steady / ${ECONOMY.spirit.perturbationScale.intense} intense) – and it fires on every week \`knockGoverns\` reports a push,\n` +
      `      which is ${KNOCK_PUSH_WEEKS} weeks per push. The return runs FIRST and then the row lands, so a girl sitting at the baseline ends\n` +
      `      that week under it: predicted extra weeks under ${ECONOMY.spirit.baseline} = the governed weeks arm B has and arm A does not.`,
  )
  console.log(
    `\n    ${pad('reading', 44)}${padL('weeks', 10)}${padL('± SEM', 10)}${padL('n', 7)}   what it is`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  console.log(
    `    ${pad('PREDICTED (governed weeks, B − A)', 44)}${padL(predictedWeeks.mean.toFixed(2), 10)}${padL(predictedWeeks.sem.toFixed(3), 10)}${padL(predictedWeeks.n, 7)}   weeks the \`knockPushedWeek\` row fired`,
  )
  console.log(
    `    ${pad('MEASURED (paired, full-grid pairs)', 44)}${padL(measuredWeeks.mean.toFixed(2), 10)}${padL(measuredWeeks.sem.toFixed(3), 10)}${padL(measuredWeeks.n, 7)}   weeks < ${ECONOMY.spirit.baseline}: push − rest`,
  )
  console.log(
    `    ${pad('MEASURED (paired, common horizon)', 44)}${padL(measuredWeeksCommon.mean.toFixed(2), 10)}${padL(measuredWeeksCommon.sem.toFixed(3), 10)}${padL(measuredWeeksCommon.n, 7)}   the same, every pair, to min(weeks)`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  const attachedRest = armOf('rest').reduce((a, c) => a + c.attachedWeeks, 0)
  const injuriesGap = stat(foldBySeed(cleanPairs, (p) => p.push.weeksInjured - p.rest.weeksInjured))
  const onsetGap = stat(foldBySeed(cleanPairs, (p) => p.push.injuries - p.rest.injuries))
  console.log(
    `    ⚠ THE TWO NAMED LEAKS BETWEEN THEM, so the difference is read rather than guessed:\n` +
      `      (a) THE ATTACHMENT LIFT. \`accrueSpirit\` walks toward ${ECONOMY.spirit.baseline} + ${ECONOMY.spirit.attachmentLift} while \`activeEpisode\` returns a row, so a pushed\n` +
      `          week lived at a LIFTED target lands at ~${(ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.intense).toFixed(1)}–${(ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.steady).toFixed(1)} and is NOT under the baseline. ${attachedRest} attached weeks in the rest arm.\n` +
      `      (b) THE INJURY CHANNEL. Pushing multiplies the injury threshold, and \`injuryOnset\` ${ECONOMY.spirit.perturb.injuryOnset} / \`laidUpWeek\` ${ECONOMY.spirit.perturb.laidUpWeek} put her\n` +
      `          under the baseline for weeks the knock row never wrote: ${say(onsetGap)} extra onsets and ${say(injuriesGap)} extra injured\n` +
      `          weeks per pair. ⚠ The arm totals in [P0c] are the blunter reading of the same thing and are the larger signal.\n` +
      `      Both are consequences of pushing rather than confounds – the prediction is the ROW's own weeks, the measurement is\n` +
      `      the decision's, and the distance between them is what the row alone does not tell the owner.`,
  )

  // --- P3. THE PAIRED MATCH-PP COST ----------------------------------------------------------------
  rule('[P3] THE PAIRED MATCH-pp COST OF PUSHING – paired seed-for-seed, temperament-for-temperament')
  const ppClean = stat(foldBySeed(cleanPairs, (p) => winRateOf(p.push) - winRateOf(p.rest)))
  const ppAll = stat(foldBySeed(pairs, (p) => winRateOf(p.push) - winRateOf(p.rest)))
  const matchesGap = stat(foldBySeed(cleanPairs, (p) => p.push.matchesPlayed - p.rest.matchesPlayed))
  const kneeWeeks = PUSH_ARMS.map((a) => `${a} ${armOf(a).reduce((x, c) => x + c.weeksUnderKnee, 0)}`).join(' · ')
  const allWeeks = careers.reduce((a, c) => a + c.weeks, 0)
  console.log(
    `    PREDICTED through the SPIRIT channel: 0.000 pp. \`spiritMatchFactor\` is flat 1.0 at and above the knee (${ECONOMY.spirit.knee})\n` +
      `      and the push row alone lands her at ~${(ECONOMY.spirit.baseline + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.intense).toFixed(1)}–${(ECONOMY.spirit.baseline + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.steady).toFixed(1)}, which is ${(ECONOMY.spirit.baseline + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.intense - ECONOMY.spirit.knee).toFixed(1)} points clear of it – so pushing cannot reach the\n` +
      `      match through spirit. ⚠ MEASURED rather than asserted: weeks under the knee, ${kneeWeeks}, out of ${allWeeks.toLocaleString('en-US')}. Not zero (an\n` +
      `      injury onset is ${(ECONOMY.spirit.perturb.injuryOnset * ECONOMY.spirit.perturbationScale.intense).toFixed(1)} and gets there on its own), and far too rare to carry a win rate.\n` +
      `      Whatever the measurement shows is therefore the OTHER trade: resting gives up ${(100 * (1 - KNOCK_REST_GROWTH)).toFixed(0)}% of a week's development\n` +
      `      (\`KNOCK_REST_GROWTH\` ${KNOCK_REST_GROWTH}), pushing keeps the week whole and buys a loaded injury roll. The delta table predicts no sign.`,
  )
  console.log(`\n    ${pad('reading', 44)}${padL('Δ pp', 10)}${padL('± SEM', 10)}${padL('n', 7)}   what it is`)
  console.log(`    ${'─'.repeat(112)}`)
  console.log(`    ${pad('PREDICTED (spirit channel)', 44)}${padL('0.000', 10)}${padL('–', 10)}${padL('–', 7)}   the factor never leaves 1.0 above the knee`)
  console.log(
    `    ${pad('MEASURED (full-grid pairs)', 44)}${padL(ppClean.mean.toFixed(3), 10)}${padL(ppClean.sem.toFixed(3), 10)}${padL(ppClean.n, 7)}   win rate: push − rest`,
  )
  console.log(
    `    ${pad('MEASURED (every pair)', 44)}${padL(ppAll.mean.toFixed(3), 10)}${padL(ppAll.sem.toFixed(3), 10)}${padL(ppAll.n, 7)}   the same, truncated arms included`,
  )
  console.log(
    `    ${pad('matches PLAYED (full-grid pairs)', 44)}${padL(matchesGap.mean.toFixed(2), 10)}${padL(matchesGap.sem.toFixed(3), 10)}${padL(matchesGap.n, 7)}   push − rest, in matches`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  console.log(
    `    ${pad('lifetime win rate', 22)}` +
      PUSH_ARMS.map((a) => `${a} ${mean(armOf(a).map(winRateOf).filter((x) => !Number.isNaN(x))).toFixed(2)}%`).join('  ·  ') +
      `   ⚠ unpaired, for scale only – the paired rows above are the reading.`,
  )

  // --- PER TEMPERAMENT -----------------------------------------------------------------------------
  console.log(`\n    PER TEMPERAMENT – A DIAGNOSTIC AND NOT FOUR SAMPLES. It is also the EVIDENCE for the fold above: the knock`)
  console.log(`    census, the bond gap and the Δ pp read identically down all four rows, because in wave 1 \`temperament\` reaches`)
  console.log(`    nothing but \`accrueSpirit\` and spirit never reaches the match above the knee. Only "wks < 70" is allowed to move.`)
  console.log(
    `    ${pad('temperament', 14)}${padL('pairs', 7)}${padL('full', 7)}${padL('pred bond', 11)}${padL('bond @ end', 12)}` +
      `${padL('pred wks', 10)}${padL('wks < 70', 10)}${padL('Δ pp', 10)}${padL('pushes', 9)}${padL('rests', 8)}`,
  )
  console.log(`    ${'─'.repeat(98)}`)
  for (const t of TEMPERAMENTS) {
    const ps = pairs.filter((p) => p.temperament === t)
    const cl = ps.filter((p) => p.full)
    const pushes = ps.reduce((a, p) => a + p.push.pushesFirst + p.push.pushesRepeat, 0)
    const rests = ps.reduce((a, p) => a + p.rest.rests, 0)
    console.log(
      `    ${pad(t, 14)}${padL(ps.length, 7)}${padL(cl.length, 7)}${padL(stat(cl.map(predictedOf)).mean.toFixed(2), 11)}` +
        `${padL(stat(cl.map((p) => endBond(p.rest) - endBond(p.push))).mean.toFixed(2), 12)}` +
        `${padL(stat(cl.map((p) => p.push.pushGovernedWeeks - p.rest.pushGovernedWeeks)).mean.toFixed(2), 10)}` +
        `${padL(stat(cl.map((p) => p.push.weeksUnderBaseline - p.rest.weeksUnderBaseline)).mean.toFixed(2), 10)}` +
        `${padL(stat(cl.map((p) => winRateOf(p.push) - winRateOf(p.rest))).mean.toFixed(3), 10)}${padL(pushes, 9)}${padL(rests, 8)}`,
    )
  }
  console.log(`    ${'─'.repeat(98)}`)

  // --- THE VERDICT ---------------------------------------------------------------------------------
  rule('T12 – THE THREE NUMBERS, PREDICTED AGAINST MEASURED')
  // ⚠⚠ THE TEST IS ON THE PAIRED RESIDUAL AND NOT ON TWO MEANS. Both columns are per-seed readings
  // of the SAME seeds, so "predicted − measured" is itself a paired quantity with its own SEM;
  // comparing a prediction against the measurement's SEM alone would ignore the pairing and hand the
  // verdict whichever answer the noisier column wanted. Same argument section [3] makes for its gap.
  const residual = (pred: readonly number[], meas: readonly number[]) =>
    stat(pred.map((x, i) => x - meas[i]))
  const line = (label: string, pred: string, measured: string, res: Stat, why: string) => {
    const ok = Math.abs(res.mean) <= 2 * res.sem
    console.log(
      `    ${pad(label, 38)}${padL(pred, 11)}${padL(measured, 25)}${padL(say(res), 25)}   ${ok ? 'AGREE   ' : 'DISAGREE'}  ${why}`,
    )
  }
  console.log(`    ${pad('number', 38)}${padL('predicted', 11)}${padL('measured', 25)}${padL('predicted − measured', 25)}   verdict   why`)
  console.log(`    ${'─'.repeat(170)}`)
  line(
    '1  bond gap at season end',
    predicted.mean.toFixed(2),
    say(measuredEnd),
    residual(foldBySeed(cleanPairs, predictedOf), foldBySeed(cleanPairs, (p) => endBond(p.rest) - endBond(p.push))),
    `the ${ECONOMY.bond.regressionPerWeek}/wk regression pays the raw deltas back between knocks`,
  )
  line(
    '2  spirit weeks under the baseline',
    predictedWeeks.mean.toFixed(2),
    say(measuredWeeks),
    residual(
      foldBySeed(cleanPairs, (p) => p.push.pushGovernedWeeks - p.rest.pushGovernedWeeks),
      foldBySeed(cleanPairs, (p) => p.push.weeksUnderBaseline - p.rest.weeksUnderBaseline),
    ),
    `the row's own weeks against the decision's – the lift and the injury channel`,
  )
  line(
    '3  match-win cost of pushing (pp)',
    '0.000',
    say(ppClean, 3),
    residual(
      foldBySeed(cleanPairs, () => 0),
      foldBySeed(cleanPairs, (p) => winRateOf(p.push) - winRateOf(p.rest)),
    ),
    `pushing cannot reach the match through spirit above the knee (${ECONOMY.spirit.knee})`,
  )
  console.log(`    ${'─'.repeat(170)}`)
  console.log(`    "AGREE" = the PAIRED residual's mean sits inside its own ± 2 SEM. It is a READING, not a bar: nothing here passes or fails.`)
  console.log(`    ⚠ Every n above is a SEED, not a career: the four temperament arms are the same seeds replayed – see the fold's own note.`)
  console.log(
    `\n    ⚠⚠ A DISAGREEMENT IS THE FINDING AND NOT A LICENCE. This block read \`ECONOMY.bond.delta\`, \`ECONOMY.spirit.perturb\`\n` +
      `       and \`ECONOMY.bond.regressionPerWeek\` and changed none of them; retuning is the owner's call on the record.`,
  )
  console.log(
    `\n    ⚠ AND THE PRICES ABOVE ARE ONLY AS REAL AS [P0]: rests ${armTotals.rest.rests} · pushes ${armTotals.push.first + armTotals.push.repeat} ` +
      `(${armTotals.push.first} first, ${armTotals.push.repeat} repeat) · push-governed weeks ${armTotals.push.gov} (arm A ${armTotals.rest.gov}) ·\n` +
      `      coach-decided knocks ${armTotals.rest.coach + armTotals.push.coach} · knocks unaccounted for 0 · ` +
      `bond moved at the decisions ${armTotals.rest.bondMeasured.toFixed(1)} / ${armTotals.push.bondMeasured.toFixed(1)}.`,
  )
  // ⚠ v75 T9 – THIS PAIR WALKS THROUGH THE SAME THREE SHARED HELPERS the bar grid does
  // (`bookTheFamilyWeeks`, `enterWhatSheCan`, `answerTheBirthday`), so it inherits their refusals and
  // prints them under its own prices rather than leaving them in a table it never shows.
  printRefusalLedger()
  console.log(`\n    ${((Date.now() - startedPair) / 1000).toFixed(1)}s`)
}

if (PUSH_MODE) {
  runPushPair()
  process.exit(0)
}

// =================================================================================================
// ⭐⭐⭐ v75 T7 – THE PAIRED SHOCK ARMS – `npm run bench:spirit -- --shock`
// =================================================================================================
//
// ⚠⚠ WHAT THIS IS. Wave 4 ships the break-up: `rollEnds` dates the row, stamps
// `world.spiritShock`, and `accrueSpirit` charges −22 steady / −34 intense on the week that matches
// (who-she-is §4's spirit-physics table). Invariant 5 owes that a paired measurement, and §4 owes it
// five specific numbers. This block is the payment: one clean pair, 128 seed-pairs PER INTENSITY,
// and every clause but the ending itself held equal.
//
// ⚠⚠ IT DOES NOT TOUCH THE GRID ABOVE AND MUST NOT. `--shock` exits before THE RUN, exactly as
// `--push` and `--sweep` do, so the default printout is byte-identical to what it was before this
// existed. Nothing here changes a constant permanently: the two dials it moves are moved for ONE
// TICK at a time and restored, and the restoration is ASSERTED at the end rather than trusted.
//
// THE PAIR, and every clause is HELD EQUAL rather than merely unmentioned:
//
//   arm A  shocked   the attachment ENDS at `SHOCK_WEEK`
//   arm B  spared    the same attachment, never ended
//
//   · THE ARRIVAL IS FORCED IN **BOTH** ARMS, at the same week, off the same dial. Without it the
//     pair is unmeasurable rather than merely small: the arrival hazard is 1.0–4.0 %/wk at sixteen,
//     so eight weeks after the age gate roughly four careers in five have nobody to lose and «128
//     pairs» would be a grid of empty arms. The brief says «arm B untouched»; on this tree that
//     phrase cannot mean what it meant in wave 3, and the two sentences below are why.
//   · THE ENDING HAZARD IS HELD AT ZERO IN BOTH ARMS FOR EVERY OTHER WEEK, which is the half the
//     brief's «untouched» could not survive contact with wave 4. `rollEnds` is LIVE: over the ~70
//     weeks between the arrival and the end of the walk a fiery girl's episode ends with probability
//     ~1 − (1 − 0.018)^70 ≈ 72 %. An «untouched» arm B is therefore not a control – it is a second,
//     randomly-timed break-up, and the paired difference would be «one ending at a known week» minus
//     «0.7 endings at unknown weeks». Holding the hazard at zero in both arms and firing exactly one
//     ending in arm A is what makes the pair differ in ONE EVENT, which is the only thing a paired
//     reading can price. The hazard's own rate is not this block's subject: it is the census's
//     (`npm run bench:life-arrival`, walked, §3a's duration medians).
//   · `balanced` every week in both arms; the family weeks booked in both (off-season 50/51,
//     `staycation`); the same entry policy (`enterWhatSheCan`); every knock RESTED in both; the
//     birthday she asked for in both; every life beat drained at its registered price in both.
//   · `wealthy`, `DEFAULT_PROFILE`, assigned temperament – this file's own three choices, unchanged.
//
// ⚠⚠ THE DIAL IS THE POKE, AND IT IS A POKE OF THE **THRESHOLD**, NEVER OF THE STREAM. `rollEnds`
// draws one uniform on `seed:life:ends:<week>` and compares it with `endsPerWeek × endsMult[t]`;
// this block moves the constant for one tick and lets the engine draw the same value off the same
// key it always would. Two properties follow and they are the reason this shape was chosen over
// writing `endedWeek` by hand:
//
//   1. THE PAIR STAYS PAIRED. `rngFromSeed` is re-derived at the call site and persists nothing, so
//      the sequence MAIN sees is untouched by the threshold moving. Poking a stream would have
//      re-rolled the world and the two arms would have stopped being one career.
//   2. THE SHIPPED PATH IS THE ONE MEASURED. The ending goes through `endsEligible` → the hazard →
//      `endEpisode` → `world.spiritShock` → the kept feed row → the `'ended'` card → `accrueSpirit`'s
//      shock term. A bench that wrote `endedWeek` and `spiritShock` by hand would be measuring its
//      own two lines and would keep passing on the day `rollEnds` stopped calling either. The
//      receipt below asserts each of those stations fired, PER TEMPERAMENT.
//
// `RETURN_DIAL` and `BOND_DIAL` (the sweeps, above) are the precedent for moving an `ECONOMY` number
// at runtime; this is the third, it is the narrowest of the three – one tick – and it is the only
// one that restores and then CHECKS it restored.
//
// ⚠⚠ INSTRUMENT LAWS, AND THEY ARE STRUCTURAL RATHER THAN A PROMISE (this file printed 842 beats
// raised and ZERO answered while exiting 0, twice, in wave 3):
//   · NO `try`/`catch` IN THIS BLOCK. Not one. The one refusal a walk can legitimately meet – a
//     career-ending injury latching inside the tick – is TESTED (`world.ending !== null` breaks the
//     loop before anything is answered), never caught. The walk answers her through
//     `drainLifeBeatsTallied` bare, and calls neither `answerLifeBeat` nor `answerFork` directly.
//     ⚠⚠ AND THAT IS DELIBERATE ROUTING RATHER THAN STYLE. It was written when the rest of this file
//     still had FIVE BARE `catch {}` BLOCKS that T7 left for a ruling: `bookTheFamilyWeeks`,
//     `enterWhatSheCan`, `answerTheBirthday`, `answerTheLifeBeat`'s `answerLifeBeat` and
//     `answerTheForkTheWayThisArmWould`'s `answerFork`. The last two were the exact swallow this
//     file's own history is about – who-she-is §4a's wave-3 fourth entry recorded the `answerFork`
//     one as «found and fixed with a second bond-neutral drain», and the DRAIN is all that was
//     added: the `catch {}` in front of which it stood was still there, so the day the drain stopped
//     clearing, the file would have gone back to printing `bondAtFork: NaN` in silence.
//     ⭐⭐⭐ v75 T9 PAID THAT DEBT AND ALL FIVE ARE GONE – see [7], THE REFUSAL LEDGER, above the
//     grid. Each became either a TESTED precondition (the shape this very paragraph argues for) or a
//     narrow catch keyed on an exported refusal constant, and every refusal either shape tolerates
//     is COUNTED into a printed table. The routing here is UNCHANGED and is still the stronger
//     statement: this block calls neither `answerLifeBeat` nor `answerFork` at all.
//     ⚠ AND ONE SENTENCE ABOVE NEEDED CORRECTING RATHER THAN KEEPING (T9): «NO try/catch IN THIS
//     BLOCK. Not one» was true of the lines written here, and this walk nonetheless inherited THREE
//     of the five swallows through the shared helpers it calls – `bookTheFamilyWeeks`,
//     `enterWhatSheCan` and `answerTheBirthday`. It does not any more, and the block's own ledger
//     print at the end of [S] is where their counts land.
//     Three sites are untouched by T9 and were never part of the debt (`drainEveryBeat` and the two
//     `drainLifeBeats` calls): they are narrow and RE-THROW anything but the terminal latch, which is
//     a different thing entirely, and they are the shape T9 copied.
//   · PER-TEMPERAMENT ACTUATION, printed and asserted: arrivals forced, endings landed, shocks
//     stamped, `'ended'` cards drained. A zero in any of those columns is a FAILED RUN and exits
//     non-zero – it is never a result of zero.
//   · `–` FOR AN UNMEASURED CELL, never `0.0%`.
//   · TWO EXIT CODES, the house pair (`tools/life-arrival.ts`'s own): a MISSED corridor is a finding
//     for the architect and exits 0 with the miss re-printed; an UNMEASURED column is a broken
//     instrument and exits non-zero.
//   · EVERY BAR'S MEASURED VALUE IS PRINTED WHETHER IT PASSES OR NOT – T16's lesson, which hit its
//     own rate while silently flattening a ladder nobody had asked it to print.

const SHOCK_MODE = process.argv.includes('--shock')

/** ⚠ THE BRIEF'S GRID IS «128 SEED-PAIRS PER INTENSITY», and an intensity is two temperaments, so
 *  the seed count is half of it and every seed is played by both girls on that axis. That is the
 *  census's own paired construction (`tools/life-arrival.ts`): the columns differ in who she is and
 *  in nothing else. `--seeds=N` shrinks it for a smoke run and the header says the grid it ran. */
const SHOCK_SEEDS_ASKED = 64
function shockSeedCount(): number {
  const flag = process.argv.find((a) => a.startsWith('--seeds='))
  if (flag === undefined) return SHOCK_SEEDS_ASKED
  const n = Number(flag.slice('--seeds='.length))
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : SHOCK_SEEDS_ASKED
}

const SHOCK_ARMS = ['shocked', 'spared'] as const
type ShockArm = (typeof SHOCK_ARMS)[number]

/** ⚠⚠ EVERY WEEK BELOW IS DERIVED FROM THE ENGINE'S OWN CONSTANTS AND NONE IS QUOTED, `life-arrival`'s
 *  rule verbatim – a birth-date, an age gate or a return rate that moves has to move these too or the
 *  bars would be read against a window that no longer exists. */
function shockWeekSheTurns(age: number): number {
  for (let w = 0; w < 40 * WEEKS_PER_YEAR; w++) {
    if (kidAgeExact(w, DEFAULT_PROFILE.birthMonth, DEFAULT_PROFILE.birthDay) >= age) return w
  }
  throw new Error(`she never reaches ${age} inside forty years – the calendar moved under this bench`)
}
/** The first week `arrivalEligible`'s age clause can be true. */
const SHOCK_ARRIVAL_WEEK = shockWeekSheTurns(ECONOMY.life.ageGate)
/** ⚠⚠ HOW LONG THE ATTACHMENT RUNS BEFORE IT ENDS, AND IT IS DERIVED FROM THE LIFT'S OWN ARITHMETIC.
 *  §4's prediction is «from a LIFTED 75», so the shock must land on a girl who has actually reached
 *  `baseline + attachmentLift`. `accrueSpirit` walks toward that target by `returnPerWeek` a week, so
 *  the slowest girl needs `ceil(lift / min(returnPerWeek))` weeks to close the gap; four times that
 *  is the margin, and the receipt PRINTS the spirit she actually carried into the shock week rather
 *  than assuming the arithmetic worked. */
const SHOCK_SETTLE_WEEKS = 4 * Math.ceil(ECONOMY.spirit.attachmentLift / Math.min(...Object.values(ECONOMY.spirit.returnPerWeek)))
const SHOCK_WEEK = SHOCK_ARRIVAL_WEEK + SHOCK_SETTLE_WEEKS
/** ⚠ THE POST-SHOCK WINDOW – half a season. It is the shortest window that accumulates matches in
 *  both arms, and it contains BOTH of §4's recovery predictions (~5 weeks steady, ~12 intense) with
 *  room, so a drop measured inside it is a drop during and just after the dip rather than a drop
 *  measured past the end of one. */
const SHOCK_POST_WINDOW = Math.round(WEEKS_PER_YEAR / 2)
/** ...and «after recovery» is everything from the end of that window to the end of the walk. */
const SHOCK_AFTER_FROM = SHOCK_WEEK + SHOCK_POST_WINDOW

/** ⚠ THE ONE SEAM, and the same one `RETURN_DIAL` / `BOND_DIAL` use: `ECONOMY` is `as const` at the
 *  TYPE level only, so a bench that means to move a dial says so here, once, in a named cast. */
const LIFE_DIAL = ECONOMY.life as unknown as {
  arrivalPerWeek: { minor: number; adult: number }
  endsPerWeek: number
}
/** What the dials read before this block touched them – restored and then CHECKED at the end. */
const LIFE_DIAL_SHIPPED = {
  minor: ECONOMY.life.arrivalPerWeek.minor,
  adult: ECONOMY.life.arrivalPerWeek.adult,
  ends: ECONOMY.life.endsPerWeek,
}
/** ⚠ BIG ENOUGH THAT EVERY MULTIPLIER CLEARS 1, DERIVED RATHER THAN CHOSEN: the hazard the engine
 *  compares against is `rate × mult`, `rngFromSeed` returns [0, 1), and the smallest multiplier in
 *  either table is `endsMult.quiet`. A rate of `2 / min(mult)` therefore makes `draw < hazard`
 *  certain for every girl, with the same single draw on the same key. */
const SHOCK_FORCE_RATE =
  2 / Math.min(...Object.values(ECONOMY.life.temperamentMult), ...Object.values(ECONOMY.life.endsMult))

interface ShockCareer {
  seed: string
  arm: ShockArm
  temperament: Temperament
  weeks: number
  endedAs: string | null
  /** spirit indexed BY WEEK (`world.week` after the tick), so every reading below names its week
   *  instead of counting offsets into an array – the off-by-one this file cannot afford. */
  spiritByWeek: number[]
  bondFinal: number
  /** the episodes the ENGINE wrote, read back at the end of the walk. */
  episodes: { sinceWeek: number; knownWeek: number | null; endedWeek: number | null }[]
  /** the week `world.spiritShock` was first seen standing – the T3 mark, observed rather than assumed */
  shockStampedWeek: number | null
  /** ...and the week it cleared again (`spirit >= baseline − shockClearWithin`). */
  shockClearedWeek: number | null
  /** every beat this walk drained, by kind – so the bond skew is arithmetic and not noise. */
  drained: Record<LifeBeatKind, number>
  attachedWeeks: number
  /** ⚠ THE TWO SHAPES THE SHARED HELPERS TAKE (`bookTheFamilyWeeks`, `answerTheBirthday`), carried as
   *  real fields rather than cast in at the call site – T12's own reason for taking a shape. */
  vacations: number
  asks: string[]
  /** ⚠⚠ CUMULATIVE MATCHES INDEXED **BY WEEK**, not sampled at three boundaries. The dip is a set of
   *  weeks and not an interval – she is under the knee for three weeks and then she is not – so a
   *  reading cut on two timestamps cannot price the weeks that actually cost her anything. Two
   *  running totals a week is the cheapest shape that lets any window, contiguous or not, be cut
   *  afterwards, and it is what makes the diagnostic beside bar S2 possible at all. */
  playedByWeek: number[]
  wonByWeek: number[]
}

function runShockCareer(seed: string, arm: ShockArm, temperament: Temperament): ShockCareer {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy' })
  // ⚠ the same single field the bar grid writes, for the same reason – see the file header.
  world.temperament = temperament
  const rng = rngFromSeed(world.seed)
  const career: ShockCareer = {
    seed,
    arm,
    temperament,
    weeks: 0,
    endedAs: null,
    spiritByWeek: [],
    bondFinal: Number.NaN,
    episodes: [],
    shockStampedWeek: null,
    shockClearedWeek: null,
    drained: emptyDrainCounts(),
    attachedWeeks: 0,
    vacations: 0,
    asks: [],
    playedByWeek: [],
    wonByWeek: [],
  }
  const wonSoFar = (): number => world.seasonWins + world.seasonHistory.reduce((sum, h) => sum + h.wins, 0)

  for (let i = 0; i < WEEKS; i++) {
    if (world.ending !== null) break
    if (world.week % WEEKS_PER_YEAR === 0) bookTheFamilyWeeks(world, career)
    world.plan = { ...WEEK_PLAN_PRESETS.balanced }
    enterWhatSheCan(world)

    // --- ⚠⚠ THE DIALS FOR **THIS TICK**, AND THEY ARE WRITTEN EVERY WEEK RATHER THAN TOGGLED ------
    //
    // `tickWeek` increments the week FIRST, so the week this tick will land on is `world.week + 1`
    // and the dials are set for that week, not for the one just finished. Writing all three every
    // week – rather than setting them on the two special weeks and restoring afterwards – is what
    // makes «zero on every other week» a property of the loop instead of of a restore that could be
    // skipped by an early `break`.
    const landingOn = world.week + 1
    const forcedArrival = landingOn === SHOCK_ARRIVAL_WEEK
    LIFE_DIAL.arrivalPerWeek.minor = forcedArrival ? SHOCK_FORCE_RATE : 0
    LIFE_DIAL.arrivalPerWeek.adult = forcedArrival ? SHOCK_FORCE_RATE : 0
    LIFE_DIAL.endsPerWeek = arm === 'shocked' && landingOn === SHOCK_WEEK ? SHOCK_FORCE_RATE : 0

    tickWeek(world, rng)
    career.weeks++
    career.spiritByWeek[world.week] = world.spirit
    if (activeEpisode(world) !== null) career.attachedWeeks++
    // ⚠ THE MARK IS OBSERVED, NEVER INFERRED. `rollEnds` stamps it and `accrueSpirit` clears it in
    // the same tick's tail, so a shock that landed and cleared inside one week would show as a
    // stamp this loop never saw – which is why the CLEAR is read off the transition and the stamp is
    // read off the world, and both are printed.
    if (world.spiritShock !== null && career.shockStampedWeek === null) career.shockStampedWeek = world.spiritShock.week
    if (world.spiritShock === null && career.shockStampedWeek !== null && career.shockClearedWeek === null) {
      career.shockClearedWeek = world.week
    }
    // ⚠⚠ THE LATCH IS TESTED AND NEVER CAUGHT – the anti-stall rule this file's own header states.
    // `answerLifeBeat`, `decideKnock` and `chooseGift` all refuse behind `guardNotEndedForGood`, so
    // breaking HERE is what keeps this block free of the `try/catch` the banner forswears.
    if (world.ending !== null) break

    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
    // ⚠ READ **AFTER** THE TOURNAMENT IS CLOSED, which is where the week's results become countable:
    // `closeTournament` is what folds them into `seasonWins`/`seasonLosses`, so a reading taken
    // before it would file every match under the following week and shift every window by one.
    career.playedByWeek[world.week] = matchesEverPlayed(world)
    career.wonByWeek[world.week] = wonSoFar()

    // --- the parent's decisions, IDENTICAL IN BOTH ARMS --------------------------------------------
    if (pendingKnock(world)) decideKnock(world, 'rest')
    answerTheBirthday(world, career)
    // ⚠ THE DRAIN IS TALLIED, so the −1 the `'ended'` card costs is arithmetic a reader can check
    // rather than a mystery in a bond column (wave-4 brief §0.2). It is NOT an `except` list: the
    // subject of this block is the SHOCK, which is spirit, and the card is a beat like any other.
    const drained = drainLifeBeatsTallied(world)
    for (const kind of Object.keys(drained.byKind) as LifeBeatKind[]) career.drained[kind] += drained.byKind[kind]
  }

  career.endedAs = world.ending === null ? null : world.ending.type
  career.bondFinal = world.bond
  career.episodes = (world.loveEpisodes ?? []).map((e) => ({
    sinceWeek: e.sinceWeek,
    knownWeek: e.knownWeek,
    endedWeek: e.endedWeek,
  }))
  return career
}

/** ⚠⚠ THE RUN DIES HERE RATHER THAN PRINTING A NUMBER. Every caller is a property the pair has to
 *  have before any bar below means anything – the second of this file's two exit codes. */
function shockStall(headline: string, detail: string): never {
  console.error(`\n${'!'.repeat(100)}`)
  console.error(`THE SHOCK ARMS MEASURED NOTHING – NO BAR IS PRINTED`)
  console.error(`  ${headline}`)
  console.error(`  ${detail}`)
  console.error(
    `  ⚠ This is the actuation contract firing, not a crash. A per-temperament zero is a FAILED RUN\n` +
      `    and never a result of zero – see the block header.`,
  )
  console.error(`${'!'.repeat(100)}\n`)
  process.exit(2)
}

interface ShockPair {
  seed: string
  temperament: Temperament
  intensity: 'steady' | 'intense'
  shocked: ShockCareer
  spared: ShockCareer
  /** both arms resolved every week the readings below are cut on */
  usable: boolean
}

const shockMisses: string[] = []
function shockVerdict(bar: string, ok: boolean, detail: string): string {
  if (!ok) shockMisses.push(`${bar} – ${detail}`)
  return ok ? 'HIT ' : 'MISS'
}

/** A window rate, `–` when the window held no matches. ⚠ `0.0%` IS A MEASUREMENT AND A DASH IS AN
 *  ABSENCE, and this is the one place the difference could be smuggled past a reader. */
function windowRate(played: number, won: number): number {
  return played === 0 ? Number.NaN : pct(won, played)
}

/** Cumulative-at-week, with the weeks before the walk reading zero. */
function cumAt(xs: readonly number[], week: number): number {
  for (let w = Math.min(week, xs.length - 1); w >= 0; w--) if (xs[w] !== undefined) return xs[w]
  return 0
}
/** Matches played and won over a CONTIGUOUS window `[from, to)`, in weeks. */
function overWindow(c: ShockCareer, from: number, to: number): { played: number; won: number } {
  return {
    played: cumAt(c.playedByWeek, to - 1) - cumAt(c.playedByWeek, from - 1),
    won: cumAt(c.wonByWeek, to - 1) - cumAt(c.wonByWeek, from - 1),
  }
}
/** ...and over an ARBITRARY SET of weeks, which is what the dip actually is. ⚠ THE WEEK SET IS ONE
 *  ARM'S AND IS APPLIED TO BOTH, or the two columns would be reading two different calendars and the
 *  difference between them would be a difference of windows rather than of careers. */
function overWeeks(c: ShockCareer, weeks: readonly number[]): { played: number; won: number } {
  let played = 0
  let won = 0
  for (const w of weeks) {
    played += cumAt(c.playedByWeek, w) - cumAt(c.playedByWeek, w - 1)
    won += cumAt(c.wonByWeek, w) - cumAt(c.wonByWeek, w - 1)
  }
  return { played, won }
}
function dashed(x: number, digits = 2, suffix = ''): string {
  return Number.isNaN(x) ? '–' : `${x.toFixed(digits)}${suffix}`
}

function runShockPair(): void {
  const startedShock = Date.now()
  const seeds = shockSeedCount()
  const careersS: ShockCareer[] = []
  for (const arm of SHOCK_ARMS) {
    for (const temperament of TEMPERAMENTS) {
      for (let s = 0; s < seeds; s++) careersS.push(runShockCareer(`shock-${s}`, arm, temperament))
    }
  }
  // ⚠⚠ AND THE DIALS GO BACK, AND THE RESTORATION IS CHECKED RATHER THAN TRUSTED. A bench that left
  // `ECONOMY` moved would poison every section that ran after it in the same process; `--shock`
  // exits before THE RUN, so today nothing follows – which is exactly the condition under which a
  // silent leak survives into the wave that adds a section below this one.
  LIFE_DIAL.arrivalPerWeek.minor = LIFE_DIAL_SHIPPED.minor
  LIFE_DIAL.arrivalPerWeek.adult = LIFE_DIAL_SHIPPED.adult
  LIFE_DIAL.endsPerWeek = LIFE_DIAL_SHIPPED.ends

  const pairs: ShockPair[] = []
  for (const temperament of TEMPERAMENTS) {
    for (let s = 0; s < seeds; s++) {
      const seed = `shock-${s}`
      const a = careersS.find((c) => c.arm === 'shocked' && c.temperament === temperament && c.seed === seed)
      const b = careersS.find((c) => c.arm === 'spared' && c.temperament === temperament && c.seed === seed)
      if (a === undefined || b === undefined) shockStall('a pair is missing an arm', `${seed}/${temperament}`)
      pairs.push({
        seed,
        temperament,
        intensity: temperamentIntensity(temperament),
        shocked: a,
        spared: b,
        usable: a.weeks === WEEKS && b.weeks === WEEKS,
      })
    }
  }

  rule(
    `[S] THE PAIRED SHOCK ARMS – who-she-is §4's spirit-physics table, predicted against measured\n` +
      `    ${seeds} seeds × 4 temperaments × {shocked, spared} = ${careersS.length} careers, ` +
      `${careersS.reduce((n, c) => n + c.weeks, 0).toLocaleString('en-US')} resolved weeks\n` +
      `    ${seeds * 2} seed-pairs per INTENSITY (the brief's 128 at the default grid) · ` +
      `arrival forced week ${SHOCK_ARRIVAL_WEEK} in BOTH arms · ending forced week ${SHOCK_WEEK} in arm A only\n` +
      `    post-shock window [${SHOCK_WEEK}, ${SHOCK_AFTER_FROM}) · after-recovery window [${SHOCK_AFTER_FROM}, ${WEEKS}] · ` +
      `constants read from ECONOMY, none changed`,
  )
  if (SHOCK_AFTER_FROM >= WEEKS) {
    shockStall(
      'the after-recovery window does not exist on this grid',
      `shock ${SHOCK_WEEK} + window ${SHOCK_POST_WINDOW} = ${SHOCK_AFTER_FROM}, and the walk stops at ${WEEKS}`,
    )
  }

  // --- [S0] THE RECEIPT ---------------------------------------------------------------------------
  console.log('')
  console.log('  ── [S0] THE RECEIPT – the instrument asserting its own actuation, PER TEMPERAMENT ─────────')
  console.log('')
  console.log(
    `    ${pad('temperament', 12)}${pad('intensity', 10)}${padL('pairs', 7)}${padL('usable', 8)}${padL('arrivals A/B', 14)}` +
      `${padL('ended @W', 10)}${padL('shock stamped', 15)}${padL(`'ended' cards`, 15)}${padL('spirit @W−1', 13)}${padL('spirit @W', 11)}`,
  )
  for (const t of TEMPERAMENTS) {
    const ps = pairs.filter((p) => p.temperament === t)
    const usable = ps.filter((p) => p.usable)
    const arrivalsA = ps.filter((p) => p.shocked.episodes.some((e) => e.sinceWeek === SHOCK_ARRIVAL_WEEK)).length
    const arrivalsB = ps.filter((p) => p.spared.episodes.some((e) => e.sinceWeek === SHOCK_ARRIVAL_WEEK)).length
    const endedAtW = ps.filter((p) => p.shocked.episodes.some((e) => e.endedWeek === SHOCK_WEEK)).length
    const stamped = ps.filter((p) => p.shocked.shockStampedWeek === SHOCK_WEEK).length
    const cards = ps.reduce((n, p) => n + p.shocked.drained.ended, 0)
    const before = mean(usable.map((p) => p.shocked.spiritByWeek[SHOCK_WEEK - 1]))
    const at = mean(usable.map((p) => p.shocked.spiritByWeek[SHOCK_WEEK]))
    console.log(
      `    ${pad(t, 12)}${pad(temperamentIntensity(t), 10)}${padL(ps.length, 7)}${padL(usable.length, 8)}` +
        `${padL(`${arrivalsA}/${arrivalsB}`, 14)}${padL(endedAtW, 10)}${padL(stamped, 15)}${padL(cards, 15)}` +
        `${padL(dashed(before, 1), 13)}${padL(dashed(at, 1), 11)}`,
    )
  }
  console.log('')
  // ⚠⚠ FOUR CLAUSES, PER TEMPERAMENT, EACH ONE A SENTENCE THE v74 STALL COULD NOT HAVE SAID ABOUT
  // ITSELF. A pooled total passes while one column is dead; that is the failure this guard is named
  // after.
  for (const t of TEMPERAMENTS) {
    const ps = pairs.filter((p) => p.temperament === t)
    const usable = ps.filter((p) => p.usable)
    if (usable.length === 0) shockStall(`${t}: not one pair walked both arms to week ${WEEKS}`, 'every reading would be empty')
    const noArrival = usable.filter((p) => !p.shocked.episodes.some((e) => e.sinceWeek === SHOCK_ARRIVAL_WEEK))
    if (noArrival.length > 0) {
      shockStall(
        `${t}: ${noArrival.length} usable pair(s) have no forced arrival at week ${SHOCK_ARRIVAL_WEEK}`,
        `the dial did not reach \`rollArrival\` – e.g. ${noArrival[0].seed}`,
      )
    }
    const notEnded = usable.filter((p) => !p.shocked.episodes.some((e) => e.endedWeek === SHOCK_WEEK))
    if (notEnded.length > 0) {
      shockStall(
        `${t}: ${notEnded.length} usable shocked arm(s) did not end at week ${SHOCK_WEEK}`,
        `the forced ending is not landing – e.g. ${notEnded[0].seed}`,
      )
    }
    const stamped = usable.filter((p) => p.shocked.shockStampedWeek === SHOCK_WEEK).length
    if (stamped === 0) {
      shockStall(`${t}: ZERO shocked arms carried \`world.spiritShock\``, 'the T3 mark never reached the spirit pass')
    }
    const strays = usable.filter((p) => p.spared.episodes.some((e) => e.endedWeek !== null))
    if (strays.length > 0) {
      shockStall(
        `${t}: ${strays.length} SPARED arm(s) broke up anyway`,
        `the control is not a control – e.g. ${strays[0].seed}`,
      )
    }
    const extra = usable.filter((p) => p.shocked.episodes.length !== 1 || p.spared.episodes.length !== 1)
    if (extra.length > 0) {
      shockStall(
        `${t}: ${extra.length} pair(s) hold more than one episode`,
        `the arrival dial is leaking into another week – e.g. ${extra[0].seed}`,
      )
    }
  }
  const endedCards = pairs.reduce((n, p) => n + p.shocked.drained.ended, 0)
  if (endedCards === 0) {
    shockStall(
      `ZERO 'ended' cards were drained across ${pairs.length} shocked arms`,
      "the T4 beat never fired – the walk is measuring an ending the parent was never shown",
    )
  }
  console.log(`    ✓ every temperament: the arrival forced in both arms, the ending landed on week ${SHOCK_WEEK},`)
  console.log(`      \`world.spiritShock\` stamped, the \`'ended'\` card raised and answered, the SPARED arm never ended.`)
  console.log('')
  const drainedAll = emptyDrainCounts()
  const drainedShocked = emptyDrainCounts()
  const drainedSpared = emptyDrainCounts()
  for (const c of careersS) {
    for (const kind of Object.keys(c.drained) as LifeBeatKind[]) {
      drainedAll[kind] += c.drained[kind]
      if (c.arm === 'shocked') drainedShocked[kind] += c.drained[kind]
      else drainedSpared[kind] += c.drained[kind]
    }
  }
  console.log(`    drain skew, shocked arm : ${drainSkewLine(drainedShocked)}`)
  console.log(`    drain skew, spared arm  : ${drainSkewLine(drainedSpared)}`)
  console.log(`    drain skew, both arms   : ${drainSkewLine(drainedAll)}`)
  console.log(`      ⚠ the arms DIFFER here by construction and the difference is the \`'ended'\` card: it exists only`)
  console.log(`        where the ending did. It is bond and never spirit – §4's bars below read spirit and matches.`)
  console.log('')
  console.log(`    ⚠ the ECONOMY dials are back: arrival ${ECONOMY.life.arrivalPerWeek.minor}/${ECONOMY.life.arrivalPerWeek.adult}, ends ${ECONOMY.life.endsPerWeek}`)
  if (
    ECONOMY.life.arrivalPerWeek.minor !== LIFE_DIAL_SHIPPED.minor ||
    ECONOMY.life.arrivalPerWeek.adult !== LIFE_DIAL_SHIPPED.adult ||
    ECONOMY.life.endsPerWeek !== LIFE_DIAL_SHIPPED.ends
  ) {
    shockStall('the ECONOMY dials did not restore', 'every number in this printout was read off a moved constant')
  }

  // --- [S1] THE SHAPE OF THE DIP ------------------------------------------------------------------
  const usablePairs = pairs.filter((p) => p.usable)
  const byIntensity = (i: 'steady' | 'intense') => usablePairs.filter((p) => p.intensity === i)
  const INTENSITIES = ['steady', 'intense'] as const

  /** ⚠ COUNTED FROM THE SHOCK WEEK ITSELF, which is the week the −22/−34 lands: `accrueSpirit`
   *  applies it on the tick whose `world.week` matches the stamp. «Back at +5» therefore means five
   *  weeks after the drop, not five weeks after the week before it. */
  const weeksToBaseline = (c: ShockCareer): number => {
    for (let d = 0; d <= SHOCK_POST_WINDOW; d++) {
      const v = c.spiritByWeek[SHOCK_WEEK + d]
      if (v !== undefined && v >= ECONOMY.spirit.baseline) return d
    }
    return Number.NaN
  }
  /** The weeks she actually spent under the knee, as a LIST – bar S1b counts it and section [S2]'s
   *  diagnostic cuts its matches on it. */
  const kneeWeeks = (c: ShockCareer, from: number): number[] => {
    const out: number[] = []
    for (let w = from; w < SHOCK_AFTER_FROM; w++) if ((c.spiritByWeek[w] ?? ECONOMY.spirit.baseline) < ECONOMY.spirit.knee) out.push(w)
    return out
  }
  const weeksUnderKnee = (c: ShockCareer): number => kneeWeeks(c, SHOCK_WEEK).length
  /** ⚠⚠ THE SAME COUNT WITHOUT THE LANDING WEEK, AND IT IS PRINTED BECAUSE THE TWO CONVENTIONS
   *  DISAGREE BY EXACTLY ONE AND THE DISAGREEMENT IS THE FINDING. §4's row reads «weeks under the
   *  knee AFTER a lifted-75 break-up», and §4's OWN derivation of the 1–2 counts the landing week
   *  (75 − 22 = 53, then 58, then 63: two weeks below 60). So the bar is read on the INCLUSIVE count,
   *  which is §4's own. The exclusive count is here beside it because T3's report used it, and two
   *  entries in §4a that count different weeks under one name would be worse than a miss. */
  const weeksUnderKneeAfter = (c: ShockCareer): number => kneeWeeks(c, SHOCK_WEEK + 1).length
  /** ⚠⚠ WHAT §4's ARITHMETIC ACTUALLY PREDICTS ON THIS ENGINE, AND IT IS NOT «75 + shock». `rollEnds`
   *  runs BEFORE `accrueSpirit` in the same tick, so on the landing week `activeEpisode` is already
   *  null and the RETURN step walks her from the lifted 75 toward the FLAT 70 before the shock is
   *  added. The lift's exit and the shock are the same week. §4's table says «from a lifted 75, −22»
   *  and stops there; the engine does one more step first, and this is it, derived through the same
   *  two constants rather than typed in. */
  const predictedLanding = (i: 'steady' | 'intense'): number => {
    const lifted = ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift
    const rate = ECONOMY.spirit.returnPerWeek[i]
    const returned = lifted - Math.min(rate, lifted - ECONOMY.spirit.baseline)
    return returned + ECONOMY.spirit.shock.breakup[i]
  }

  rule('[S1] THE DIP – §4\'s spirit physics, predicted against measured (shocked arm; the spared arm is the control column)')
  console.log(
    `    ${pad('intensity', 10)}${pad('temperament', 13)}${padL('n', 6)}${padL('shock', 8)}${padL('spirit @W', 11)}${padL('predicted', 11)}` +
      `${padL('wks→baseline', 14)}${padL('bar', 10)}${padL('verdict', 9)}${padL('wks<knee A', 12)}${padL('B', 6)}${padL('paired', 9)}${padL('bar', 10)}${padL('verdict', 9)}`,
  )
  const TO_BASE_BAR: Record<'steady' | 'intense', { text: string; ok: (m: number) => boolean }> = {
    steady: { text: '5 ± 1', ok: (m) => m >= 4 && m <= 6 },
    intense: { text: '12 ± 2', ok: (m) => m >= 10 && m <= 14 },
  }
  const KNEE_BAR: Record<'steady' | 'intense', { text: string; ok: (m: number) => boolean }> = {
    steady: { text: '1 – 2', ok: (m) => m >= 1 && m <= 2 },
    intense: { text: '6 ± 1', ok: (m) => m >= 5 && m <= 7 },
  }
  const toBaseMedian: Partial<Record<'steady' | 'intense', number>> = {}
  const kneeMedian: Partial<Record<'steady' | 'intense', number>> = {}
  for (const i of INTENSITIES) {
    for (const t of TEMPERAMENTS.filter((x) => temperamentIntensity(x) === i)) {
      const ps = usablePairs.filter((p) => p.temperament === t)
      const toBase = ps.map((p) => weeksToBaseline(p.shocked)).filter((x) => !Number.isNaN(x))
      const kneeA = ps.map((p) => weeksUnderKnee(p.shocked))
      const kneeB = ps.map((p) => weeksUnderKnee(p.spared))
      console.log(
        `    ${pad(i, 10)}${pad(t, 13)}${padL(ps.length, 6)}${padL(ECONOMY.spirit.shock.breakup[i], 8)}` +
          `${padL(dashed(mean(ps.map((p) => p.shocked.spiritByWeek[SHOCK_WEEK])), 1), 11)}` +
          `${padL(predictedLanding(i).toFixed(1), 11)}` +
          `${padL(dashed(median(toBase), 1), 14)}${padL('–', 10)}${padL('–', 9)}` +
          `${padL(dashed(median(kneeA), 1), 12)}${padL(dashed(median(kneeB), 1), 6)}` +
          `${padL(dashed(median(ps.map((p) => weeksUnderKnee(p.shocked) - weeksUnderKnee(p.spared))), 1), 9)}${padL('–', 10)}${padL('–', 9)}`,
      )
    }
    // ⚠ THE BAR IS READ PER INTENSITY, which is the axis §4's table has rows for. The per-temperament
    // rows above carry no verdict of their own on purpose – printing four verdicts against two
    // corridors would double-count the same two numbers.
    const ps = byIntensity(i)
    const toBase = ps.map((p) => weeksToBaseline(p.shocked)).filter((x) => !Number.isNaN(x))
    const censored = ps.length - toBase.length
    const kneeA = ps.map((p) => weeksUnderKnee(p.shocked))
    const kneeB = ps.map((p) => weeksUnderKnee(p.spared))
    const paired = ps.map((p) => weeksUnderKnee(p.shocked) - weeksUnderKnee(p.spared))
    if (toBase.length === 0) shockStall(`${i}: not one shocked arm returned to baseline inside ${SHOCK_POST_WINDOW} weeks`, 'the column is unmeasured')
    const mBase = median(toBase)
    const mKnee = median(kneeA)
    toBaseMedian[i] = mBase
    kneeMedian[i] = mKnee
    console.log(
      `    ${pad(i.toUpperCase(), 10)}${pad('– ALL –', 13)}${padL(ps.length, 6)}${padL(ECONOMY.spirit.shock.breakup[i], 8)}` +
        `${padL(dashed(mean(ps.map((p) => p.shocked.spiritByWeek[SHOCK_WEEK])), 1), 11)}` +
        `${padL(predictedLanding(i).toFixed(1), 11)}` +
        `${padL(mBase.toFixed(1), 14)}${padL(TO_BASE_BAR[i].text, 10)}` +
        `${padL(shockVerdict(`bar S1a · ${i} weeks-to-baseline ${TO_BASE_BAR[i].text}`, TO_BASE_BAR[i].ok(mBase), `measured ${mBase.toFixed(1)}`), 9)}` +
        `${padL(mKnee.toFixed(1), 12)}${padL(median(kneeB).toFixed(1), 6)}${padL(median(paired).toFixed(1), 9)}${padL(KNEE_BAR[i].text, 10)}` +
        `${padL(shockVerdict(`bar S1b · ${i} weeks under the knee ${KNEE_BAR[i].text}`, KNEE_BAR[i].ok(mKnee), `measured ${mKnee.toFixed(1)}`), 9)}`,
    )
    if (censored > 0) {
      console.log(`      ⚠ ${censored}/${ps.length} ${i} arms had NOT returned to ${ECONOMY.spirit.baseline} inside the ${SHOCK_POST_WINDOW}-week window and are excluded from the median – printed, never folded in at the window's edge.`)
    }
    console.log(
      `      weeks under the knee NOT counting the landing week (T3's convention): median ` +
        `${median(ps.map((p) => weeksUnderKneeAfter(p.shocked))).toFixed(1)} – printed because the two conventions differ by exactly one week, and §4's own derivation counts the landing week.`,
    )
    console.log(
      `      shock cleared (spirit >= ${ECONOMY.spirit.baseline - ECONOMY.spirit.shockClearWithin}) after ` +
        `${dashed(median(ps.map((p) => (p.shocked.shockClearedWeek === null ? Number.NaN : p.shocked.shockClearedWeek - SHOCK_WEEK)).filter((x) => !Number.isNaN(x))), 1)} weeks (median) · ` +
        `spared arm's median weeks under the knee in the same window: ${median(kneeB).toFixed(1)}`,
    )
  }

  // --- [S2] THE MATCH-WIN DROP --------------------------------------------------------------------
  rule('[S2] THE PRICE IN MATCHES – paired, per intensity · BARS: drop inside [1, 8] pp AND > 2 × SEM')
  console.log(
    `    ${pad('intensity', 10)}${pad('temperament', 13)}${padL('pairs', 7)}${padL('A win%', 9)}${padL('B win%', 9)}` +
      `${padL('Δ pp', 9)}${padL('± SEM', 9)}${padL('2×SEM', 9)}${padL('matches A', 11)}${padL('B', 8)}${padL('corridor', 12)}${padL('verdict', 9)}`,
  )
  const rateOver = (c: ShockCareer, from: number, to: number): number => {
    const w = overWindow(c, from, to)
    return windowRate(w.played, w.won)
  }
  /** ⚠ THE DROP IS **SPARED MINUS SHOCKED**, so a positive number is a price she paid. Stated here
   *  because the sign of a paired difference is the one thing a reader cannot recover from the
   *  number, and the corridor [1, 8] pp is written as a price. */
  const dropOf = (p: ShockPair): number => {
    const a = rateOver(p.shocked, SHOCK_WEEK, SHOCK_AFTER_FROM)
    const b = rateOver(p.spared, SHOCK_WEEK, SHOCK_AFTER_FROM)
    return Number.isNaN(a) || Number.isNaN(b) ? Number.NaN : b - a
  }
  const afterOf = (p: ShockPair): number => {
    const a = rateOver(p.shocked, SHOCK_AFTER_FROM, WEEKS + 1)
    const b = rateOver(p.spared, SHOCK_AFTER_FROM, WEEKS + 1)
    return Number.isNaN(a) || Number.isNaN(b) ? Number.NaN : b - a
  }
  /** ⭐ THE UNASKED NUMBER, AND T16 IS WHY IT IS HERE. The bar reads a 26-week window because that is
   *  what the brief asked for, and a dip three weeks long inside it is diluted by a factor of nine
   *  before the bar ever sees it. This is the SAME paired difference cut on the weeks she was
   *  ACTUALLY under the knee – the shocked arm's own week list, applied to both arms. It carries NO
   *  bar: it is the diagnostic that says whether a missed corridor is «the ending costs nothing» or
   *  «the window is the wrong window». */
  const dipDropOf = (p: ShockPair): number => {
    const weeks = kneeWeeks(p.shocked, SHOCK_WEEK)
    if (weeks.length === 0) return Number.NaN
    const a = overWeeks(p.shocked, weeks)
    const b = overWeeks(p.spared, weeks)
    const ra = windowRate(a.played, a.won)
    const rb = windowRate(b.played, b.won)
    return Number.isNaN(ra) || Number.isNaN(rb) ? Number.NaN : rb - ra
  }
  const dropStat: Partial<Record<'steady' | 'intense', { mean: number; sem: number; n: number }>> = {}
  for (const i of INTENSITIES) {
    for (const t of TEMPERAMENTS.filter((x) => temperamentIntensity(x) === i)) {
      const ps = usablePairs.filter((p) => p.temperament === t)
      const ds = ps.map(dropOf).filter((x) => !Number.isNaN(x))
      const aR = ps.map((p) => rateOver(p.shocked, SHOCK_WEEK, SHOCK_AFTER_FROM)).filter((x) => !Number.isNaN(x))
      const bR = ps.map((p) => rateOver(p.spared, SHOCK_WEEK, SHOCK_AFTER_FROM)).filter((x) => !Number.isNaN(x))
      console.log(
        `    ${pad(i, 10)}${pad(t, 13)}${padL(ps.length, 7)}${padL(dashed(mean(aR)), 9)}${padL(dashed(mean(bR)), 9)}` +
          `${padL(dashed(mean(ds), 3), 9)}${padL(dashed(sem(ds), 3), 9)}${padL(dashed(2 * sem(ds), 3), 9)}` +
          `${padL(mean(ps.map((p) => overWindow(p.shocked, SHOCK_WEEK, SHOCK_AFTER_FROM).played)).toFixed(1), 11)}` +
          `${padL(mean(ps.map((p) => overWindow(p.spared, SHOCK_WEEK, SHOCK_AFTER_FROM).played)).toFixed(1), 8)}${padL('–', 12)}${padL('–', 9)}`,
      )
    }
    const ps = byIntensity(i)
    // ⚠⚠ FOLDED TO ONE VALUE PER SEED BEFORE THE SEM IS TAKEN – section [3]'s own correction, and it
    // bites harder here: the two temperaments inside one intensity read the SAME `returnPerWeek`, the
    // SAME shock and (with the arrival forced) the same everything else, so they are REPLICAS of one
    // another and not two samples. Pooling 2 × n as if it were 2n independent pairs would divide
    // every SEM in this section by √2 for free. The per-temperament rows above are printed so a
    // reader can SEE the replication rather than take this note's word for it.
    const seedIds = [...new Set(ps.map((p) => p.seed))]
    const folded = seedIds
      .map((s) => mean(ps.filter((p) => p.seed === s).map(dropOf).filter((x) => !Number.isNaN(x))))
      .filter((x) => !Number.isNaN(x))
    if (folded.length === 0) shockStall(`${i}: ZERO pairs produced a match-win drop`, 'no window held matches in both arms')
    const m = mean(folded)
    const e = sem(folded)
    dropStat[i] = { mean: m, sem: e, n: folded.length }
    const inCorridor = m >= 1 && m <= 8
    const overSem = Math.abs(m) > 2 * e
    console.log(
      `    ${pad(i.toUpperCase(), 10)}${pad('– FOLDED –', 13)}${padL(folded.length, 7)}${padL('–', 9)}${padL('–', 9)}` +
        `${padL(m.toFixed(3), 9)}${padL(e.toFixed(3), 9)}${padL((2 * e).toFixed(3), 9)}${padL('–', 11)}${padL('–', 8)}` +
        `${padL('[1, 8] pp', 12)}${padL(shockVerdict(`bar S2a · ${i} match-win drop inside [1, 8] pp`, inCorridor, `measured ${m.toFixed(3)} pp`), 9)}`,
    )
    console.log(
      `    ${pad('', 10)}${pad('', 13)}${padL('', 7)}${padL('', 9)}${padL('', 9)}${padL('', 9)}${padL('', 9)}${padL('', 9)}${padL('', 11)}${padL('', 8)}` +
        `${padL('> 2×SEM', 12)}${padL(shockVerdict(`bar S2b · ${i} drop > 2×SEM`, overSem, `|${m.toFixed(3)}| vs ${(2 * e).toFixed(3)}`), 9)}`,
    )
    // ⭐ AND THE UNASKED NUMBER BESIDE THE ASKED ONE (T16). No bar, on purpose.
    const dipFolded = seedIds
      .map((sd) => mean(ps.filter((p) => p.seed === sd).map(dipDropOf).filter((x) => !Number.isNaN(x))))
      .filter((x) => !Number.isNaN(x))
    const dipMatches = mean(ps.map((p) => overWeeks(p.shocked, kneeWeeks(p.shocked, SHOCK_WEEK)).played))
    console.log(
      `      ⭐ diagnostic, NO BAR – the same paired difference cut on the weeks she was UNDER THE KNEE only: ` +
        `${dashed(mean(dipFolded), 3)} pp ± ${dashed(sem(dipFolded), 3)} (n ${dipFolded.length} seeds, ${dashed(dipMatches, 1)} matches per career in those weeks).` ,
    )
    console.log(
      `        the 26-week window holds ${dashed(mean(ps.map((p) => overWindow(p.shocked, SHOCK_WEEK, SHOCK_AFTER_FROM).played)), 1)} matches, of which ${dashed(dipMatches, 1)} fall in the dip – ` +
        `so the bar's window dilutes the dip by about ${dashed(dipMatches === 0 ? Number.NaN : mean(ps.map((p) => overWindow(p.shocked, SHOCK_WEEK, SHOCK_AFTER_FROM).played)) / dipMatches, 1)}×.`,
    )
    console.log(
      `        \`spiritMatchFactor\` at the landing spirit is ${spiritMatchFactor(predictedLanding(i)).toFixed(4)} (1.0000 at or above the knee ${ECONOMY.spirit.knee}) – ` +
        `the whole of what a shock can reach a match through.`,
    )
  }

  rule('[S3] AFTER RECOVERY – weather, not a scar · BAR: the paired difference sits INSIDE 1 × SEM')
  console.log(
    `    ${pad('intensity', 10)}${padL('pairs', 7)}${padL('Δ pp', 10)}${padL('± SEM', 10)}${padL('|Δ|', 10)}${padL('vs 1×SEM', 12)}${padL('verdict', 9)}   window`,
  )
  for (const i of INTENSITIES) {
    const ps = byIntensity(i)
    const seedIds = [...new Set(ps.map((p) => p.seed))]
    const folded = seedIds
      .map((s) => mean(ps.filter((p) => p.seed === s).map(afterOf).filter((x) => !Number.isNaN(x))))
      .filter((x) => !Number.isNaN(x))
    if (folded.length === 0) shockStall(`${i}: ZERO pairs produced an after-recovery reading`, 'the window held no matches in both arms')
    const m = mean(folded)
    const e = sem(folded)
    // ⚠⚠ `<=`, AND THE DEGENERATE CASE IS WHY. The bar is «the difference sits inside noise»; an
    // EXACTLY ZERO paired difference is the strongest form of that claim there is, and it arrives
    // with SEM 0, so a strict `<` would fail the one reading that cannot be a scar. The relation is
    // therefore `|Δ| <= SEM` and both numbers are printed beside it – a reader can see which case
    // produced the verdict rather than take it on the operator's word.
    const ok = Math.abs(m) <= e
    console.log(
      `    ${pad(i, 10)}${padL(folded.length, 7)}${padL(m.toFixed(3), 10)}${padL(e.toFixed(3), 10)}${padL(Math.abs(m).toFixed(3), 10)}${padL(e.toFixed(3), 12)}` +
        `${padL(shockVerdict(`bar S3 · ${i} after-recovery difference inside 1×SEM`, ok, `|${m.toFixed(3)}| vs SEM ${e.toFixed(3)}`), 9)}   [${SHOCK_AFTER_FROM}, ${WEEKS}]`,
    )
  }

  // --- [S4] THE FAIRNESS CORRIDOR ------------------------------------------------------------------
  rule('[S4] ⚠ THE FAIRNESS CORRIDOR, RE-READ ON THESE ARMS – BAR: paired lifetime match-win deltas across temperaments inside ±1.5 pp')
  console.log('    Paired seed-for-seed: the two careers in every delta differ in NOTHING but who she is – the ending is')
  console.log('    forced on the same week for all four, so what is left is the temperament and the shock it scales.')
  console.log(`    ${pad('pair', 20)}${padL('n', 6)}${padL('mean Δ pp', 12)}${padL('± SEM', 10)}${padL('max |Δ| pp', 13)}${padL('inside ±1.5', 13)}   read`)
  const lifetime = new Map<string, number>()
  for (const c of careersS) {
    lifetime.set(`${c.arm}|${c.temperament}|${c.seed}`, rateOver(c, 0, WEEKS + 1))
  }
  // ⚠⚠ THE VACUITY CONTROL, AND IT IS THE ONE THIS SECTION CANNOT DO WITHOUT. A corridor read on a
  // grid where the ending never reached a single match outcome would print ±0.000 pp and «PASS» for
  // every pair – a thing compared with itself (CLAUDE.md, 17.08). So the run counts, per temperament,
  // the careers whose LIFETIME win rate moved between the arms. A zero is not a pass: it is the
  // statement that the shock is invisible to the match engine over a career, and the corridor below
  // is then a reading of that fact rather than of fairness.
  console.log('')
  const armsMoved: Partial<Record<Temperament, number>> = {}
  for (const t of TEMPERAMENTS) {
    let moved = 0
    for (let sIdx = 0; sIdx < seeds; sIdx++) {
      const u = lifetime.get(`shocked|${t}|shock-${sIdx}`)
      const v = lifetime.get(`spared|${t}|shock-${sIdx}`)
      if (u !== undefined && v !== undefined && !Number.isNaN(u) && !Number.isNaN(v) && u !== v) moved++
    }
    armsMoved[t] = moved
  }
  console.log(
    `    careers whose LIFETIME win rate MOVED between the arms: ${TEMPERAMENTS.map((t) => `${t} ${armsMoved[t]}/${seeds}`).join(' · ')}`,
  )
  const movedTotal = TEMPERAMENTS.reduce((n, t) => n + (armsMoved[t] ?? 0), 0)
  if (movedTotal === 0) {
    console.log('    ⚠⚠ ZERO – over this grid the break-up does not reach a single LIFETIME match number. The corridor')
    console.log('       below is therefore a reading of THAT and not of fairness between temperaments, and it is')
    console.log('       printed unsigned: a ±0.000 pp that comes from a thing compared with itself is not a HIT.')
  }
  console.log('')
  let barS4 = true
  let worstShockPair = 0
  for (const arm of SHOCK_ARMS) {
    for (let x = 0; x < TEMPERAMENTS.length; x++) {
      for (let y = x + 1; y < TEMPERAMENTS.length; y++) {
        const a = TEMPERAMENTS[x]
        const b = TEMPERAMENTS[y]
        const deltas: number[] = []
        for (let s = 0; s < seeds; s++) {
          const u = lifetime.get(`${arm}|${a}|shock-${s}`)
          const v = lifetime.get(`${arm}|${b}|shock-${s}`)
          if (u === undefined || v === undefined || Number.isNaN(u) || Number.isNaN(v)) continue
          deltas.push(u - v)
        }
        if (deltas.length === 0) shockStall(`${arm}: ${a} − ${b} produced no comparable careers`, 'the corridor is unmeasured')
        const m = mean(deltas)
        const ok = Math.abs(m) <= 1.5
        // ⚠ THE BAR IS THE SHOCKED ARM'S. The spared arm is printed as the control – it is the same
        // comparison on girls who never broke up, so a corridor that only opens in arm A is the
        // ending's doing and a corridor open in both is the world's.
        if (arm === 'shocked') {
          barS4 &&= ok
          worstShockPair = Math.max(worstShockPair, Math.abs(m))
        }
        const sameIntensity = temperamentIntensity(a) === temperamentIntensity(b)
        console.log(
          `    ${pad(`${arm === 'shocked' ? 'A' : 'B'}  ${a} − ${b}`, 20)}${padL(deltas.length, 6)}${padL(m.toFixed(3), 12)}${padL(sem(deltas).toFixed(3), 10)}` +
            `${padL(deltas.reduce((acc, d) => Math.max(acc, Math.abs(d)), 0).toFixed(3), 13)}${padL(arm === 'shocked' ? verdict(ok) : '–', 13)}   ` +
            (sameIntensity
              ? '⚠ SAME INTENSITY – a replica pair, not a sample (see the note below)'
              : 'steady vs intense – the informative comparison'),
        )
      }
    }
  }
  console.log('')
  console.log(
    `    worst pair |mean Δ| in the SHOCKED arm ${worstShockPair.toFixed(3)} pp vs corridor 1.500 pp → ` +
      (movedTotal === 0
        ? '–   ⚠ UNSIGNED: the arms never diverged on a lifetime number, so there is nothing for a corridor to bound'
        : shockVerdict('bar S4 · fairness corridor ±1.5 pp', barS4, `worst pair ${worstShockPair.toFixed(3)} pp`)),
  )
  console.log('    ⚠⚠ FOUR OF THE SIX PAIRS SHARE AN INTENSITY AND ARE THEREFORE REPLICAS RATHER THAN SAMPLES, and the')
  console.log('       table says which. `temperamentIntensity` is what `accrueSpirit` reads; with the arrival and the')
  console.log('       ending both forced onto fixed weeks, the arrival multiplier, the ends multiplier and the cooldown')
  console.log('       are all held out of the walk – so two girls of one intensity differ only in her openness, which')
  console.log('       reaches `knownWeek` and nothing the match engine can see. A 0.000 there is arithmetic, not a bar.')
  console.log('    ⚠ A BREACH IS A FINDING FOR THE OWNER, NEVER A SILENT REBALANCE (who-she-is §4 names the only')
  console.log('      sanctioned compensator – support-responsiveness, not a stat rebate – and it needs his word first).')

  // --- THE VERDICT SHEET --------------------------------------------------------------------------
  rule('[S] THE VERDICT SHEET')
  console.log(`    ${pad('bar', 52)}${padL('steady', 14)}${padL('intense', 14)}   corridor`)
  console.log(`    ${'─'.repeat(100)}`)
  console.log(
    `    ${pad('S1a  median weeks to baseline', 52)}${padL(dashed(toBaseMedian.steady ?? Number.NaN, 1), 14)}${padL(dashed(toBaseMedian.intense ?? Number.NaN, 1), 14)}   5 ± 1 / 12 ± 2`,
  )
  console.log(
    `    ${pad('S1b  median weeks under the knee', 52)}${padL(dashed(kneeMedian.steady ?? Number.NaN, 1), 14)}${padL(dashed(kneeMedian.intense ?? Number.NaN, 1), 14)}   1 – 2 / 6 ± 1`,
  )
  console.log(
    `    ${pad('S2a  paired match-win drop (pp)', 52)}${padL(dashed(dropStat.steady?.mean ?? Number.NaN, 3), 14)}${padL(dashed(dropStat.intense?.mean ?? Number.NaN, 3), 14)}   inside [1, 8]`,
  )
  console.log(
    `    ${pad('S2b  ...against 2 × SEM', 52)}${padL(dashed(2 * (dropStat.steady?.sem ?? Number.NaN), 3), 14)}${padL(dashed(2 * (dropStat.intense?.sem ?? Number.NaN), 3), 14)}   drop must exceed it`,
  )
  console.log(`    ${'─'.repeat(100)}`)
  console.log('')
  if (shockMisses.length === 0) {
    console.log('    every corridor HIT.')
  } else {
    console.log(`    ⚠⚠ ${shockMisses.length} BAR(S) OFF CORRIDOR. These are FINDINGS FOR THE ARCHITECT and this run exits 0:`)
    console.log('       invariant 5 – numbers are MEASURED, never adjusted. No constant was changed by this block.')
    console.log('')
    for (const m of shockMisses) console.log(`      MISS  ${m}`)
  }
  console.log('')
  console.log(`    ⚠ EXIT CODES: 0 = measured (bars may have missed, and the misses are above); 2 = the instrument`)
  console.log(`      could not measure and printed no bar. «Exited 0» means «measured», never «passed».`)
  // ⚠⚠ v75 T9 – AND THE ONE HONEST CORRECTION TO THIS BLOCK'S OWN BANNER. «NO try/catch IN THIS
  // BLOCK» was true of the lines written here and NOT of the walk: `runShockCareer` calls
  // `bookTheFamilyWeeks`, `enterWhatSheCan` and `answerTheBirthday`, and until T9 all three carried
  // a bare `catch {}` of their own. The routing claim – that the shock walk answers her through
  // `drainLifeBeatsTallied` and calls neither `answerLifeBeat` nor `answerFork` – was and is exact;
  // what it did not cover was the three shared helpers this walk inherits. They are now tested and
  // counted, and this is where the count lands.
  printRefusalLedger()
  console.log(`\n    ${((Date.now() - startedShock) / 1000).toFixed(1)}s`)
}

if (SHOCK_MODE) {
  runShockPair()
  process.exit(0)
}

// =================================================================================================
// THE RUN
// =================================================================================================

const started = Date.now()
const careers: Career[] = []
for (const arm of ARMS) {
  for (const temperament of TEMPERAMENTS) {
    for (let s = 0; s < SEED_COUNT; s++) {
      careers.push(runCareer(`spirit-${s}`, arm, temperament))
    }
  }
}

const of = (arm: Arm, temperament?: Temperament) =>
  careers.filter((c) => c.arm === arm && (temperament === undefined || c.temperament === temperament))
const weeksOf = (cs: readonly Career[], pick: (c: Career) => number[]) => cs.flatMap(pick)

const full = careers.filter((c) => c.weeks === WEEKS).length
rule(
  `SPIRIT BENCH – runbook §6 (wave 1's six bars) + §7 (wave 2's beat arms) · ${SEED_COUNT} seeds × ` +
    `${FORK_MODE ? `${WEEKS} weeks` : `${SEASONS} seasons`} × {care, grind} × 4 temperaments\n` +
    (FORK_MODE
      ? `⚠⚠ --fork: THE DIAGNOSTIC GRID, NOT THE BAR GRID. The walk runs to week ${WEEKS} so the fork at ${FORK_WEEK} is\n` +
        `   reached and the wave-2 deltas can be priced. Bar 3 still reads week ${SEASON_3_WEEK} and is comparable; bars\n` +
        `   1/2/4/5/6 read a longer week series here and are NOT comparable with the four-season run.\n`
      : '') +
    `${careers.length} careers, ${careers.reduce((a, c) => a + c.weeks, 0).toLocaleString('en-US')} resolved weeks · ` +
    `constants read from ECONOMY.spirit / ECONOMY.bond, none changed\n` +
    // ⚠ A CAREER THAT ENDED EARLY IS A SHORTER ARM, and a season-3 reading taken off one that no
    // longer exists is a lie. Printed rather than assumed, so truncation can never hide in a mean.
    `careers that ran all ${FORK_MODE ? `${WEEKS} weeks` : `${SEASONS} seasons`}: ${full}/${careers.length}` +
    (full === careers.length
      ? ''
      : `  ⚠ ${careers.length - full} ENDED EARLY (` +
        [...new Set(careers.filter((c) => c.endedAs !== null).map((c) => c.endedAs))]
          .map((t) => `${t} ${careers.filter((c) => c.endedAs === t).length}`)
          .join(', ') +
        `) – those arms are shorter than the rest`),
)

// --- 1. SPIRIT MOVES -----------------------------------------------------------------------------
rule('[1] SPIRIT MOVES – per-career sd of spirit over weeks · BAR: mean per-career sd ≥ 2.0 points, in BOTH arms')
console.log(`    ${pad('arm', 8)}${pad('temperament', 14)}${padL('careers', 8)}${padL('mean sd', 10)}${padL('min', 8)}${padL('max', 8)}${padL('p10', 8)}${padL('p90', 8)}`)
console.log(`    ${'─'.repeat(72)}`)
const sdByArm: Record<Arm, number[]> = { care: [], grind: [] }
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const cs = of(arm, t)
    const sds = cs.map((c) => sd(c.spirit))
    sdByArm[arm].push(...sds)
    const sorted = [...sds].sort((a, b) => a - b)
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(cs.length, 8)}${padL(mean(sds).toFixed(2), 10)}` +
        `${padL(sorted[0].toFixed(2), 8)}${padL(sorted[sorted.length - 1].toFixed(2), 8)}` +
        `${padL(quantile(sorted, 0.1).toFixed(2), 8)}${padL(quantile(sorted, 0.9).toFixed(2), 8)}`,
    )
  }
}
console.log(`    ${'─'.repeat(72)}`)
const bar1: Record<Arm, boolean> = { care: false, grind: false }
for (const arm of ARMS) {
  const m = mean(sdByArm[arm])
  bar1[arm] = m >= 2
  console.log(`    ${pad(arm, 8)}mean per-career sd ${m.toFixed(2)} vs bar 2.00 → ${verdict(bar1[arm])}`)
}
console.log(`    BAR 1 → ${verdict(bar1.care && bar1.grind)}`)

// --- 2. NO EXTREME DRIFT -------------------------------------------------------------------------
rule('[2] NO EXTREME DRIFT – BARS: weeks at spirit < 20 or > 95 under 2%, and long-run mean 70 ± 4 – held PER TEMPERAMENT ARM')
console.log(`    ${pad('arm', 8)}${pad('temperament', 14)}${padL('weeks', 9)}${padL('mean', 9)}${padL('sd', 8)}${padL('<20 %', 9)}${padL('>95 %', 9)}${padL('min', 8)}${padL('max', 8)}  bars`)
console.log(`    ${'─'.repeat(90)}`)
let bar2extreme = true
let bar2mean = true
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const xs = weeksOf(of(arm, t), (c) => c.spirit)
    const low = xs.filter((x) => x < 20).length
    const high = xs.filter((x) => x > 95).length
    const m = mean(xs)
    const okExtreme = pct(low + high, xs.length) < 2
    const okMean = Math.abs(m - 70) <= 4
    bar2extreme &&= okExtreme
    bar2mean &&= okMean
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(xs.length, 9)}${padL(m.toFixed(2), 9)}${padL(sd(xs).toFixed(2), 8)}` +
        `${padL(pct(low, xs.length).toFixed(2), 9)}${padL(pct(high, xs.length).toFixed(2), 9)}` +
        `${padL(Math.min(...xs).toFixed(1), 8)}${padL(Math.max(...xs).toFixed(1), 8)}  ` +
        `${verdict(okExtreme)}/${verdict(okMean)}`,
    )
  }
}
console.log(`    ${'─'.repeat(90)}`)
console.log(`    BAR 2a (extremes < 2%) → ${verdict(bar2extreme)}      BAR 2b (mean 70 ± 4, per temperament) → ${verdict(bar2mean)}`)

// --- 3. BOND SEPARATES ---------------------------------------------------------------------------
rule('[3] BOND SEPARATES – BARS: grind-vs-care gap ≥ 12 points at season 3, AND gap > 2 × SEM')
// ⚠⚠ THE STATISTICS ARE SEED-PAIRED, AND THAT IS NOT A REFINEMENT. The four temperament arms are
// the SAME 32 careers played four times over, so pooling all 4 × 32 as if they were 128 independent
// samples would divide the SEM by 2 for free and hand bar 3's "> 2 × SEM" half a pass it did not
// earn. Each seed contributes ONE number per arm (its mean over the four temperaments), and the gap
// is the mean of the 32 PAIRED per-seed differences with its own paired SEM - care and grind run
// the same seeds, so the pairing is real.
const seeds = [...new Set(careers.map((c) => c.seed))]
const perSeed = (arm: Arm, pick: (c: Career) => number) =>
  seeds.map((s) => mean(careers.filter((c) => c.arm === arm && c.seed === s).map(pick).filter((x) => !Number.isNaN(x))))
const season3Mean = (c: Career) => mean(c.bond.slice(2 * WEEKS_PER_YEAR, 3 * WEEKS_PER_YEAR))
const bondAt3: Record<Arm, number[]> = { care: perSeed('care', (c) => c.bondAtSeason3), grind: perSeed('grind', (c) => c.bondAtSeason3) }
const bondSeason3Mean: Record<Arm, number[]> = { care: perSeed('care', season3Mean), grind: perSeed('grind', season3Mean) }
const paired = (a: number[], b: number[]) => a.map((x, i) => x - b[i]).filter((d) => !Number.isNaN(d))
const bond3n = paired(bondAt3.care, bondAt3.grind).length
console.log(`    ${pad('reading (n = ' + bond3n + ' paired seeds)', 34)}${padL('care', 12)}${padL('± SEM', 9)}${padL('grind', 12)}${padL('± SEM', 9)}${padL('gap', 9)}${padL('2×SEM', 10)}`)
console.log(`    ${'─'.repeat(95)}`)
const gapsAt3 = paired(bondAt3.care, bondAt3.grind)
const gapAt3 = mean(gapsAt3)
const sem3 = sem(gapsAt3)
const gapsMean3 = paired(bondSeason3Mean.care, bondSeason3Mean.grind)
console.log(
  `    ${pad('bond at the end of season 3', 34)}${padL(mean(bondAt3.care).toFixed(2), 12)}${padL(sem(bondAt3.care).toFixed(3), 9)}` +
    `${padL(mean(bondAt3.grind).toFixed(2), 12)}${padL(sem(bondAt3.grind).toFixed(3), 9)}${padL(gapAt3.toFixed(2), 9)}${padL((2 * sem3).toFixed(3), 10)}`,
)
console.log(
  `    ${pad("season 3's mean bond", 34)}${padL(mean(bondSeason3Mean.care).toFixed(2), 12)}${padL(sem(bondSeason3Mean.care).toFixed(3), 9)}` +
    `${padL(mean(bondSeason3Mean.grind).toFixed(2), 12)}${padL(sem(bondSeason3Mean.grind).toFixed(3), 9)}${padL(mean(gapsMean3).toFixed(2), 9)}${padL((2 * sem(gapsMean3)).toFixed(3), 10)}`,
)
console.log(`    ${'─'.repeat(95)}`)
const bar3gap = gapAt3 >= 12
const bar3sem = gapAt3 > 2 * sem3
console.log(`    gap ${gapAt3.toFixed(2)} vs bar 12.00 → ${verdict(bar3gap)}      paired gap vs 2×SEM ${(2 * sem3).toFixed(3)} → ${verdict(bar3sem)}`)
console.log(`    BAR 3 → ${verdict(bar3gap && bar3sem)}`)
// The ceiling this bar is being asked to clear, computed from the constants rather than guessed:
// bond's restoring force is a FLAT `regressionPerWeek` step toward `start`, so a displacement can
// only be held while |mean weekly delta| >= that step.
console.log(
  `    ⚠ the arithmetic ceiling: bond regresses a FLAT ${ECONOMY.bond.regressionPerWeek}/week toward ${ECONOMY.bond.start}, so an arm can hold a\n` +
    `      displacement only while its decisions are worth ≥ ${ECONOMY.bond.regressionPerWeek}/week. Measured decision rates per career-week:`,
)
for (const arm of ARMS) {
  const cs = of(arm)
  const weeks = cs.reduce((a, c) => a + c.weeks, 0)
  const knocks = cs.reduce((a, c) => a + c.knocks, 0)
  const vac = cs.reduce((a, c) => a + c.vacations, 0)
  const asks = cs.reduce((a, c) => a + c.asks.length, 0)
  console.log(
    `      ${pad(arm, 8)}knocks ${(knocks / weeks).toFixed(4)}/wk · family weeks ${(vac / weeks).toFixed(4)}/wk · birthdays ${(asks / weeks).toFixed(4)}/wk`,
  )
}

// --- 3w2. ⭐⭐⭐ WAVE 2's OWN CENSUS – DID THE ARMS ACTUALLY RUN? ----------------------------------
//
// ⚠⚠ THIS BLOCK IS THE ANSWER TO CLAUDE.md's «before you believe a null result, prove the arm
// contains both the change and its reader». The bond gap above cannot distinguish "the two arms
// answered her differently and it was worth nothing" from "the answering code never executed". These
// counters can, and they are printed beside the bar rather than in a comment for exactly that reason.
console.log(`\n    ⭐ WAVE 2 – THE BEAT ARMS, COUNTED (care backs and matches · grind presses and contradicts)`)
// ⭐⭐⭐ v75 T9 – AND THE `refused` COLUMN IS THE NEWEST OF THEM, IN THE ROW THAT ONCE LIED. Until
// this step `answerLifeBeat` and `answerFork` both stood inside a bare `catch {}`, so «her row was
// answered» and «her row REFUSED and nobody said so» produced the same census: zeroes in `back` and
// `press`, a `–` in `bond @ fork`, and no error. This column is the difference between those two
// readings. ⚠ A COUNT HERE IS NOT A DEFECT – it is the terminal latch landing on the same week as her
// row, which is a real outcome – but a count BESIDE a `–` in `bond @ fork` is the exact shape of the
// stall this file has shipped twice, and it can no longer be reached without printing.
console.log(
  `    ${pad('arm', 8)}${padL('careers', 9)}${padL('beats', 8)}${padL('back', 7)}${padL('press', 7)}${padL('listen', 8)}` +
    `${padL('fork with', 11)}${padL('fork against', 14)}${padL('bond @ fork', 13)}${padL('refused', 9)}`,
)
console.log(`    ${'─'.repeat(86)}`)
const bondAtFork: Record<Arm, number[]> = { care: perSeed('care', (c) => c.bondAtFork), grind: perSeed('grind', (c) => c.bondAtFork) }
for (const arm of ARMS) {
  const cs = of(arm)
  const answers = cs.flatMap((c) => c.beatAnswers)
  const forkBond = cs.map((c) => c.bondAtFork).filter((x) => !Number.isNaN(x))
  console.log(
    `    ${pad(arm, 8)}${padL(cs.length, 9)}${padL(cs.reduce((a, c) => a + c.beatsRaised, 0), 8)}` +
      `${padL(answers.filter((a) => a === 'back').length, 7)}${padL(answers.filter((a) => a === 'press').length, 7)}` +
      `${padL(answers.filter((a) => a === 'listen').length, 8)}` +
      `${padL(cs.filter((c) => c.forkCongruence === 'with').length, 11)}${padL(cs.filter((c) => c.forkCongruence === 'against').length, 14)}` +
      `${padL(forkBond.length === 0 ? '–' : mean(forkBond).toFixed(2), 13)}` +
      `${padL(cs.reduce((a, c) => a + c.refusals, 0), 9)}`,
  )
}
console.log(`    ${'─'.repeat(86)}`)
const beatsFired = careers.reduce((a, c) => a + c.beatsRaised, 0)
// ⭐⭐ THE ARITHMETIC OF WHAT WAVE 2 IS WORTH, OFF THE CONSTANTS AND NOT OFF A GUESS. Both deltas are
// per-career and one-shot, so the separation they can add to the gap is a single subtraction.
const armSpread =
  ECONOMY.bond.delta.beatBacked +
  ECONOMY.bond.delta.forkWithHerWant -
  (ECONOMY.bond.delta.beatPressed + ECONOMY.bond.delta.forkAgainstHerWant)
console.log(
  `    the two wave-2 deltas are worth ${ECONOMY.bond.delta.beatBacked} + ${ECONOMY.bond.delta.forkWithHerWant} = ` +
    `${ECONOMY.bond.delta.beatBacked + ECONOMY.bond.delta.forkWithHerWant} to care and ` +
    `${ECONOMY.bond.delta.beatPressed} ${ECONOMY.bond.delta.forkAgainstHerWant} = ` +
    `${ECONOMY.bond.delta.beatPressed + ECONOMY.bond.delta.forkAgainstHerWant} to grind → ${armSpread} raw points of separation, once per career.`,
)
if (beatsFired === 0) {
  // ⚠⚠ THE FINDING WAVE 2 ACTUALLY MADE, PRINTED BY THE INSTRUMENT ITSELF so that it cannot be
  // mistaken for a quiet pass. Every number in this sentence is derived above, none is quoted.
  console.log(
    `    ⚠⚠ NO BEAT FIRED, AND THE ARMS ABOVE THEREFORE MEASURE NOTHING: her opinion is raised by the tick that\n` +
      `       OPENS THE FORK, which is week ${FORK_WEEK} (schoolEndWeek, birth month ${DEFAULT_PROFILE.birthMonth}); this grid ends at week ${WEEKS};\n` +
      `       and bar 3 reads bond at week ${SEASON_3_WEEK}. ${FORK_WEEK} > ${WEEKS} > ${SEASON_3_WEEK}, so the wave-2 deltas are ` +
      `${FORK_WEEK - SEASON_3_WEEK} weeks LATER than\n` +
      `       the number this bar reports. The gap above is wave 1's, re-measured – not wave 2 failing to move it.\n` +
      `       ⚠ Run \`npm run bench:spirit -- --fork\` to walk past week ${FORK_WEEK} and price the two deltas where they land.`,
  )
} else {
  const forkGaps = paired(bondAtFork.care, bondAtFork.grind)
  // ⚠ NaN IS DROPPED FROM THE ARM COLUMNS AND NEVER SUBSTITUTED, on `bondAtSeason3`'s own argument
  // one screen up: a seed whose careers all ended before the fork contributes no fork reading, and
  // a mean that swallowed it would be reporting a week those careers never saw. The paired gap
  // already drops the seed entirely, which is why its n can be smaller than either column's.
  const defined = (xs: readonly number[]) => xs.filter((x) => !Number.isNaN(x))
  console.log(
    `    ⭐ FORK-WEEK READING (diagnostic, NOT bar 3 – bar 3 is week ${SEASON_3_WEEK} and this is week ${FORK_WEEK}):\n` +
      `       care ${mean(defined(bondAtFork.care)).toFixed(2)} ± ${sem(defined(bondAtFork.care)).toFixed(3)} (n ${defined(bondAtFork.care).length}) · ` +
      `grind ${mean(defined(bondAtFork.grind)).toFixed(2)} ± ${sem(defined(bondAtFork.grind)).toFixed(3)} (n ${defined(bondAtFork.grind).length}) · ` +
      `gap ${mean(forkGaps).toFixed(2)} over ${forkGaps.length} paired seeds, 2×SEM ${(2 * sem(forkGaps)).toFixed(3)}\n` +
      `       ⚠ THIS IS NOT A BAR AND CANNOT BECOME ONE. Bar 3's reading week is the owner's; this row exists only to\n` +
      `       price what a re-aim would be buying, and it changes no constant.`,
  )
}

// --- 3b. THE STOP WANT (v74 T17) -----------------------------------------------------------------
//
// ⭐⭐⭐ THE OWNER MEASURED THIS IN PLAY AND IT IS WHY T17 EXISTS: his world #5, healthy, close home,
// met «I want to stop» at eighteen. Under the old weights that was NO TAIL – `stop` was `lean(worn)`,
// which bottoms out at 1.0 like every other lean, so P(stop) floored at ~22–25% at every state.
//
// ⚠⚠ THIS SECTION IS TWO DIFFERENT KINDS OF NUMBER AND THEY ARE PRINTED APART ON PURPOSE. The GRID is
// the PURE FORMULA – `forkWantWeights` called on a state, no world, no draw, no walk – so it is
// arithmetic and it is exact. The SHARE is a MEASUREMENT off walked careers, with its denominator and
// its actuation counts printed beside it, because a share nobody can prove was measured is worth
// nothing here: this very file once exited 0 having raised 842 beats and answered none of them.
rule('[3b] THE STOP WANT – the pure P(stop) grid, and the walked share with no readable root')
{
  const f = ECONOMY.life.forkStop
  const s = ECONOMY.spirit
  const b = ECONOMY.bond
  console.log(
    `    the formula: stop = ${f.floor} + ${f.gainWorn}×worn + ${f.gainStrained}×strained, ` +
      `worn = (${s.baseline} − spirit)/${s.baseline - s.min}, strained = (${b.start} − bond)/${b.start - b.min} (both clamped 0..1)\n` +
      `    college and tour are UNTOUCHED: college = lean(1−standing), tour = lean(standing)×lean(close), lean ∈ [1.0, ${FORK_WANT_TILT}]\n` +
      `    the driver (WORDING ONLY, never a weight): worn > ${ECONOMY.life.forkStopDriverFrom} → 'worn', else strained > ${ECONOMY.life.forkStopDriverFrom} → 'strained', else 'own'`,
  )
  // The state axis: the two roots together, as the brief reads them («a post-shock worn girl in a
  // strained home», «a drained girl in a cold home»). The standing axis is the fork's own 0..1.
  const STATES: readonly { name: string; worn: number; strained: number }[] = [
    { name: 'unsupported', worn: 0, strained: 0 },
    { name: 'at the driver line', worn: ECONOMY.life.forkStopDriverFrom, strained: 0 },
    { name: 'worn .3', worn: 0.3, strained: 0 },
    { name: 'strained .3', worn: 0, strained: 0.3 },
    { name: 'worn+strained .4', worn: 0.4, strained: 0.4 },
    { name: 'worn+strained .6', worn: 0.6, strained: 0.6 },
    { name: 'drained, cold', worn: 1, strained: 1 },
  ]
  const STANDINGS = [0, 0.25, 0.5, 0.75, 1] as const
  // ⚠ THE GRID IS PRINTED AT A **CLOSE** HOME'S `close` TERM ONLY WHERE THE HOME ALLOWS IT. `close`
  // and `strained` are the same distance read from the two sides of `bond.start`, so a strained state
  // has `close = 0` by construction: the spirit and bond a cell is evaluated at are derived from its
  // own roots, never chosen, which is what keeps the grid a reading of the formula rather than of a
  // set of numbers somebody picked.
  console.log(`\n    P(stop) %, by state × standing  (bond = start − strained×${b.start - b.min}, spirit = baseline − worn×${s.baseline - s.min})`)
  console.log(`    ${pad('state', 22)}${STANDINGS.map((x) => padL(`st ${x}`, 10)).join('')}${padL('driver', 12)}`)
  console.log(`    ${'─'.repeat(22 + 10 * STANDINGS.length + 12)}`)
  for (const state of STATES) {
    const spirit = s.baseline - state.worn * (s.baseline - s.min)
    const bond = b.start - state.strained * (b.start - b.min)
    const cells = STANDINGS.map((standing) => {
      const w = forkWantWeights(standing, spirit, bond)
      const total = FORK_WANTS.reduce((sum, want) => sum + w[want], 0)
      return padL(`${((100 * w.stop) / total).toFixed(1)}`, 10)
    })
    console.log(`    ${pad(state.name, 22)}${cells.join('')}${padL(forkStopDriverOf(spirit, bond), 12)}`)
  }
  // ⚠⚠ THE CONTROL ROW: the SAME grid under the OLD `stop` weight. Without it «3.3%» is a number with
  // nothing to be small compared to, and a reader cannot tell a priced tail from a broken formula.
  const oldStop = (worn: number) => 1 + (FORK_WANT_TILT - 1) * Math.min(1, Math.max(0, worn))
  const oldAt = (standing: number, worn: number, strained: number) => {
    const bond = b.start - strained * (b.start - b.min)
    const w = forkWantWeights(standing, s.baseline - worn * (s.baseline - s.min), bond)
    const stop = oldStop(worn)
    return (100 * stop) / (w.college + w.tour + stop)
  }
  console.log(
    `\n    ⚠ THE OLD FORMULA ON THE SAME GRID (stop = lean(worn)), which is what the owner met:\n` +
      `    ${pad('unsupported', 22)}${STANDINGS.map((x) => padL(oldAt(x, 0, 0).toFixed(1), 10)).join('')}\n` +
      `    ${pad('worn+strained .4', 22)}${STANDINGS.map((x) => padL(oldAt(x, 0.4, 0.4).toFixed(1), 10)).join('')}`,
  )
  // ⚠⚠ AND WHY EVERY ROW ABOVE IS FLAT ACROSS THE STANDING AXIS – a finding rather than a bug, and it
  // is printed because a reader who does not know it will read the flatness as a broken grid. The two
  // standing leans are COMPLEMENTARY: `college = lean(1−standing)` and `tour = lean(standing)`, and
  // while `close` is 0 their sum is `2 + (TILT−1)` at EVERY standing. Every row above is evaluated at
  // `bond <= start` (that is what a `strained` reading means), so `close` is 0 throughout and only the
  // two leans' constant sum reaches the denominator. Standing moves P(stop) only through `close`,
  // which needs a bond ABOVE start – so the second grid is the one where the axis is alive.
  console.log(
    `\n    ...AND AT A HOME ABOVE THE START (close > 0), where the standing axis is not degenerate:\n` +
      `    ${pad('state', 22)}${STANDINGS.map((x) => padL(`st ${x}`, 10)).join('')}${padL('bond', 12)}`,
  )
  for (const bondNow of [b.max, (b.start + b.max) / 2, b.start]) {
    const cells = STANDINGS.map((standing) => {
      const w = forkWantWeights(standing, s.baseline, bondNow)
      return padL((((100 * w.stop) / (w.college + w.tour + w.stop))).toFixed(1), 10)
    })
    console.log(`    ${pad('unsupported', 22)}${cells.join('')}${padL(bondNow, 12)}`)
  }

  // --- the walked half ---------------------------------------------------------------------------
  const reached = careers.filter((c) => c.forkWant !== null)
  const stops = reached.filter((c) => c.forkWant === 'stop')
  const rootless = stops.filter((c) => c.forkDriver === 'own')
  const strictly = stops.filter((c) => c.forkRoots !== null && c.forkRoots.worn === 0 && c.forkRoots.strained === 0)
  const counsel = careers.reduce((a, c) => a + c.counselRows, 0)
  console.log(
    `\n    WALKED – actuation first, because a share without it is not a measurement:\n` +
      `       careers walked ${careers.length} · reached the fork and stated a want ${reached.length} · ` +
      `'fork-counsel' rows raised ${counsel}\n` +
      `       wants drawn: ${FORK_WANTS.map((w) => `${w} ${reached.filter((c) => c.forkWant === w).length}`).join(' · ')}\n` +
      `       drivers at the fork: ${FORK_STOP_DRIVERS.map((d) => `${d} ${reached.filter((c) => c.forkDriver === d).length}`).join(' · ')}`,
  )
  if (reached.length === 0) {
    console.log(
      `    ⚠⚠ NO CAREER REACHED THE FORK, SO THE SHARE BELOW MEASURES NOTHING. The fork opens at week ` +
        `${FORK_WEEK} and this grid ends at week ${WEEKS};\n` +
        `       run \`npm run bench:spirit -- --fork\` (and \`--seeds=N\` for a denominator worth quoting).`,
    )
  } else {
    // ⚠⚠ THE BAR IS THE BRIEF'S OWN DEFINITION OF «UNSUPPORTED» – worn = strained = 0, the state whose
    // arithmetic the architect checked at 3.3%/3.6%. The driver-`'own'` share is printed BESIDE it as
    // a diagnostic and is NOT the bar, and the distinction is a MEASURED finding rather than a
    // convenience: the driver line sits at 0.15, and at the very bottom of the `'own'` band
    // (bond a hair above 59.5) P(stop) is already ~14%, so the `'own'` band is «the root is too small
    // to claim in words», not «there is no root». That is also what the register SAYS – `'own'` is
    // «I have done what I came for», the Barty read, which is a root of its own and the one the owner
    // ruled must stay possible. Both numbers go to the architect; only the first is a corridor.
    const share = (100 * strictly.length) / reached.length
    const ownShare = (100 * rootless.length) / reached.length
    console.log(
      `    ⭐ UNSUPPORTED STOPS – BAR: ≤ 5% of careers that reached the fork meet a stop with NO root at all\n` +
        `       strictly unsupported (worn = strained = 0) ${strictly.length}/${reached.length} = ` +
        `${share.toFixed(1)}% → ${verdict(share <= 5)}\n` +
        `       ⚠ DIAGNOSTIC, NOT A BAR – stops the WORDS claim no root for (driver 'own') ` +
        `${rootless.length}/${reached.length} = ${ownShare.toFixed(1)}%; the 'own' band runs to ~14% P(stop) at its\n` +
        `       own bottom edge, so it is «too small to name» rather than «absent» – see the note in the source.\n` +
        `       all stops ${stops.length}/${reached.length} = ${((100 * stops.length) / reached.length).toFixed(1)}%\n` +
        `       ⚠ THE COUNSEL COUNT ABOVE IS THE PROOF THE ARC RAN: it must equal the number of stops (${stops.length}).` +
        `${counsel === stops.length ? '' : ' ⚠⚠ IT DOES NOT – the arc did not fire on every stop.'}` +
        `${reached.filter((c) => c.forkDriver === 'worn').length === 0 ? '\n       ⚠⚠ AND NO CAREER ON THIS GRID WAS `worn` AT THE FORK, so the worn column of the copy is NOT exercised by this walk.\n          ⚠ THAT READING STANDS AND IS NOT REPAIRED BY [3c] BELOW: [3c] POKES a girl into the band to render the copy, and\n            this row keeps saying what the GAME does. Two arms, two meanings – see [3c]\'s banner.' : ''}`,
    )
  }
}

// --- 3c. THE WORN COLUMN, RENDERED UNDER A POKE (v74 T16b point 4) --------------------------------
//
// ⚠⚠⚠ EVERYTHING IN THIS SECTION IS BENCH-ONLY. See the banner it prints and the header of this file.
// The section walks its own small arm with `poked = true`, keeps those careers in a list of its own,
// and asserts – rather than hopes – that the poke moved the state, that the ENGINE derived the `worn`
// driver from it, and that the STRING the walk selected is the one the engine words from that driver.
if (!FORK_MODE) {
  rule('[3c] THE WORN COLUMN UNDER A POKE – NOT RUN (this is the four-season grid)')
  console.log(
    `    The poke lands on the week before the fork (${FORK_WEEK - 1}) and this grid ends at week ${WEEKS}, so there is\n` +
      `    nothing here to poke. Run \`npm run bench:spirit -- --fork\` for it.`,
  )
} else {
  rule('[3c] THE WORN COLUMN, RENDERED – ⚠⚠ A BENCH-ONLY POKED ARM, AND IT IS NOT THE GAME')
  // ⚠ THE WALKED HALF IS READ OFF `careers` – THE SAME LIST [3b] READ – AND IS COMPUTED BEFORE THE
  // BANNER SO THE BANNER CAN QUOTE IT RATHER THAN ASSERT IT. The day a walked career IS `worn` at the
  // fork, the sentence below changes by itself instead of becoming a lie nobody re-read.
  const walkedReached = careers.filter((c) => c.forkWant !== null)
  const walkedStops = walkedReached.filter((c) => c.forkWant === 'stop')
  const drivers = (cs: readonly Career[], d: ForkStopDriver) => cs.filter((c) => c.forkDriver === d).length
  const walkedWorn = drivers(walkedReached, 'worn')
  console.log('    ⚠⚠⚠ THE ROW MARKED «poked» BELOW RUNS IN A **BENCH-ONLY MODE**. IT IS NOT SHIPPED BEHAVIOUR.')
  console.log(`         The walked grid above reached the fork ${walkedReached.length}× and read the driver \`worn\` on ${walkedWorn} of them.`)
  console.log(
    walkedWorn === 0
      ? '         Her four worn lines and the coach\'s worn read are therefore exercised by NO walk at all. This arm'
      : '         ⚠ THE WALK NOW REACHES THE BAND ITSELF, so this is no longer the only place the column renders. This arm',
  )
  console.log(`         POKES \`world.spirit\` TOOL-SIDE to ${POKED_SPIRIT.toFixed(2)} on week ${FORK_WEEK - 1} – ONE FIELD, written by the`)
  console.log('         bench, on the bench\'s own world – so the column renders inside a real walk at least once.')
  console.log('         NO draw, NO stream, NO engine change, NO second field. `tools/life-arrival.ts` is the precedent.')
  console.log('       ⚠ DO NOT READ THE POKED ROW AS THE GAME. The walked row beside it is the game; its `worn` column')
  console.log('         is the FINDING, and this arm does not move it – it exercises the copy the finding leaves dark.')
  console.log('')
  console.log(
    `    the depth, DERIVED and not chosen: the driver line is worn > ${ECONOMY.life.forkStopDriverFrom} (spirit < ${DRIVER_LINE_SPIRIT.toFixed(2)}); the poke lands at\n` +
      `    ${POKE_WORN_MULTIPLE}× the line – worn ${(POKE_WORN_MULTIPLE * ECONOMY.life.forkStopDriverFrom).toFixed(2)}, spirit ${POKED_SPIRIT.toFixed(2)} – a margin of ${(DRIVER_LINE_SPIRIT - POKED_SPIRIT).toFixed(2)} points against \`accrueSpirit\`'s own\n` +
      `    return of ≤ ${MAX_RETURN_PER_WEEK}/week, which is the most the opening tick can walk back before the want is drawn.`,
  )

  const pokeStarted = Date.now()
  const poked: Career[] = []
  for (const temperament of TEMPERAMENTS) {
    for (let s = 0; s < POKED_SEEDS; s++) poked.push(runCareer(`spirit-${s}`, POKED_ARM, temperament, true))
  }
  // ⚠ THE POKED LIST IS NEVER MERGED INTO THE WALKED ONE. The two rows below are two populations and
  // the table says which is which; `careers` is untouched by this section from end to end.
  const pokedReached = poked.filter((c) => c.forkWant !== null)
  const pokedStops = pokedReached.filter((c) => c.forkWant === 'stop')
  // ⭐⭐ THE THREE RENDER CLASSES, AND THEY ARE DECIDED BY COMPARING TWO STRINGS THE BENCH DID NOT
  // WRITE. `worn` = the driver is visible in her line AND the walk selected it. `flat` = the two
  // readings are the same string, so her pool does not carry the driver at this bond (below the
  // flat-pool cut, or a want that is not `stop`) – an honest reading, never a render. `wrong` = the
  // walk selected something neither reading produces, which is the instrument broken and throws below.
  const herWornRenders = pokedStops.filter((c) => c.render !== null && c.render.herWorn !== c.render.herOwn && c.render.herSaid === c.render.herWorn)
  const herFlat = pokedStops.filter((c) => c.render !== null && c.render.herWorn === c.render.herOwn && c.render.herSaid === c.render.herWorn)
  const herWrong = pokedStops.filter((c) => c.render === null || (c.render.herSaid !== c.render.herWorn && c.render.herSaid !== c.render.herOwn) || (c.render.herWorn !== c.render.herOwn && c.render.herSaid === c.render.herOwn))
  const answeredStops = pokedStops.filter((c) => c.beatAnswers.length > 0)
  const coachWornRenders = answeredStops.filter(
    (c) => c.render !== null && c.render.coachWorn !== null && c.render.coachWorn !== c.render.coachOwn && c.render.coachSaid === c.render.coachWorn,
  )
  const coachWrong = answeredStops.filter((c) => c.render === null || c.render.coachSaid === null || c.render.coachSaid !== c.render.coachWorn || c.render.coachWorn === c.render.coachOwn)

  console.log('')
  console.log(
    `    ${pad('arm', 26)}${padL('careers', 9)}${padL('reached', 9)}${padL('stops', 7)}${padL('worn', 6)}${padL('strained', 10)}${padL('own', 6)}` +
      `${padL('counsel', 9)}${padL('her worn', 10)}${padL('flat pool', 11)}${padL('coach worn', 12)}`,
  )
  console.log(`    ${'─'.repeat(115)}`)
  console.log(
    `    ${pad('walked (THE GAME)', 26)}${padL(careers.length, 9)}${padL(walkedReached.length, 9)}${padL(walkedStops.length, 7)}` +
      `${padL(drivers(walkedReached, 'worn'), 6)}${padL(drivers(walkedReached, 'strained'), 10)}${padL(drivers(walkedReached, 'own'), 6)}` +
      `${padL(careers.reduce((a, c) => a + c.counselRows, 0), 9)}${padL('–', 10)}${padL('–', 11)}${padL('–', 12)}`,
  )
  console.log(
    `    ${pad('poked worn (BENCH-ONLY)', 26)}${padL(poked.length, 9)}${padL(pokedReached.length, 9)}${padL(pokedStops.length, 7)}` +
      `${padL(drivers(pokedReached, 'worn'), 6)}${padL(drivers(pokedReached, 'strained'), 10)}${padL(drivers(pokedReached, 'own'), 6)}` +
      `${padL(poked.reduce((a, c) => a + c.counselRows, 0), 9)}${padL(herWornRenders.length, 10)}${padL(herFlat.length, 11)}${padL(coachWornRenders.length, 12)}`,
  )
  console.log(`    ${'─'.repeat(115)}`)
  // ⚠⚠ AND THE ONE SENTENCE THAT KEEPS AN UNMEASURED CELL FROM READING AS A ZERO. The walked arm
  // captures no strings at all – the capture is `poked`-only by construction – so its three
  // right-hand cells are NOT «it rendered nothing», they are «this instrument was never pointed at
  // it». A `0` in those columns would mean something entirely different from the `–` printed there.
  console.log('    ⚠ `–` IS «NOT CAPTURED», NOT «ZERO»: the string capture runs in the poked arm alone, so the walked')
  console.log('      row has no render columns to report. Its `worn 0` IS measured, and it is this file\'s finding.')
  console.log(`    ⚠ the two rows are two populations: ${POKED_SEEDS} seeds × 4 temperaments × the \`${POKED_ARM}\` policy, walked separately and`)
  console.log('      merged into nothing. No bar, no census and no table in this file reads a poked career.')

  // --- ACTUATION, BEFORE ANY OF IT IS BELIEVED ---------------------------------------------------
  //
  // ⚠⚠ THIS FILE HAS TWICE THIS WAVE EXITED 0 WHILE MEASURING NOTHING (842 beats raised and none
  // answered; a `catch {}` that would have printed `bondAtFork: NaN` for every stopping career). A
  // poke that silently failed would print a `worn` row full of `own` copy and look exactly like a
  // working one, so the numbers that prove it fired are printed BESIDE the row and asserted below it.
  const fired = poked.filter((c) => c.spiritBeforePoke !== null)
  const spiritsAtRead = pokedReached.map((c) => c.render?.spiritAtRead ?? Number.NaN)
  const wornAtRead = pokedReached.map((c) => c.forkRoots?.worn ?? Number.NaN)
  console.log('')
  console.log('    ACTUATION – what the poke actually did, career by career:')
  console.log(
    `       the poke fired on ${fired.length}/${poked.length} careers` +
      `${fired.length === poked.length ? '' : ` (${poked.length - fired.length} ended before week ${FORK_WEEK - 1} and never reached it)`}\n` +
      `       spirit the ENGINE held the week it fired: mean ${mean(fired.map((c) => c.spiritBeforePoke ?? Number.NaN)).toFixed(2)} · ` +
      `min ${Math.min(...fired.map((c) => c.spiritBeforePoke ?? Number.NaN)).toFixed(2)} · max ${Math.max(...fired.map((c) => c.spiritBeforePoke ?? Number.NaN)).toFixed(2)}   ← what it OVERWROTE\n` +
      `       spirit at the read, one tick later: mean ${mean(spiritsAtRead).toFixed(2)} · min ${Math.min(...spiritsAtRead).toFixed(2)} · ` +
      `max ${Math.max(...spiritsAtRead).toFixed(2)}   (poked to ${POKED_SPIRIT.toFixed(2)}, the tick's own return walks her up)\n` +
      `       worn at the read: mean ${mean(wornAtRead).toFixed(3)} · min ${Math.min(...wornAtRead).toFixed(3)} vs the driver line ${ECONOMY.life.forkStopDriverFrom}\n` +
      `       wants drawn under the poke: ${FORK_WANTS.map((w) => `${w} ${pokedReached.filter((c) => c.forkWant === w).length}`).join(' · ')}\n` +
      `       stops answered ${answeredStops.length}/${pokedStops.length} · 'fork-counsel' rows raised ${poked.reduce((a, c) => a + c.counselRows, 0)}` +
      // ⚠⚠ AND «0 = 0» IS NOT «THE ARC FIRED». A zero-stop arm satisfies the equality trivially, which
      // is the shape of every silent stall this file has recorded – so the no-stop case says so in its
      // own words instead of borrowing the reassuring one. (The red arms below throw on it either way.)
      `${pokedStops.length === 0 ? '  ⚠⚠ NO STOP WAS DRAWN AT ALL, so there was nothing for the arc to fire on – this arm measured NOTHING' : poked.reduce((a, c) => a + c.counselRows, 0) === pokedStops.length ? '  ← equal to the stops, so the arc fired on every one' : '  ⚠⚠ NOT EQUAL TO THE STOPS – the arc did not fire on every one'}`,
  )

  // --- THE STRINGS, AND THE ASSERTION THAT THEY ARE THE RIGHT ONES -------------------------------
  console.log('')
  console.log('    THE COPY THE WALK SELECTED. Each line below is `buildLifeBeatPrompt`\'s own string – what a screen')
  console.log('    would have drawn that week – asserted EQUAL to the engine\'s reading of the same girl under `worn`')
  console.log('    and DIFFERENT from its reading under `own`. The second half is what makes the first worth anything.')
  for (const t of TEMPERAMENTS) {
    const mine = herWornRenders.filter((c) => c.temperament === t)
    const first = mine[0]
    console.log(
      `\n       ${pad(t, 8)}${padL(`${mine.length} career(s)`, 13)}  ${first === undefined ? '⚠ no worn line rendered in this voice on this arm' : '✓ worn column, and it is not the `own` line'}`,
    )
    if (first !== undefined && first.render !== null) {
      console.log(`         said : ${first.render.herSaid}`)
      console.log(`         own  : ${first.render.herOwn}   ← the line the SAME girl would have got under the shipped driver`)
    }
  }
  const coachFirst = coachWornRenders[0]
  console.log(
    `\n       ${pad('coach', 8)}${padL(`${coachWornRenders.length} career(s)`, 13)}  ` +
      `${coachFirst === undefined ? '⚠ the counsel never rendered its worn read' : '✓ worn read, and it is not the `own` read'}`,
  )
  if (coachFirst !== undefined && coachFirst.render !== null) {
    console.log(`         said : ${coachFirst.render.coachSaid}`)
    console.log(`         own  : ${coachFirst.render.coachOwn}   ← his read of the same stop under the shipped driver`)
  }

  // --- THE RED ARMS. An UNMEASURED row exits NON-ZERO; it may never be mistaken for a measured one.
  //
  // ⚠⚠ THESE ARE NOT BARS AND THE DISTINCTION IS THIS FILE'S OWN. A bar that misses is a FINDING for
  // the owner and the run still exits 0 (invariant 5). Everything below is the INSTRUMENT: a poke
  // that did not fire, a driver the poke did not produce, or a string the engine does not word from
  // that driver mean this section measured nothing, and a section that measured nothing must not be
  // able to exit 0 – `tools/life-arrival.ts`' rule 3, and the two silent stalls this wave recorded.
  const wrongDriver = pokedReached.filter((c) => c.forkDriver !== 'worn')
  if (fired.length === 0) {
    throw new Error(`the bench-only poke never fired on any of ${poked.length} careers – every row above is the shipped walk with a poked label`)
  }
  if (wrongDriver.length > 0) {
    const w = wrongDriver[0]
    throw new Error(
      `the poke did not move the state: ${wrongDriver.length}/${pokedReached.length} poked careers stated a want under driver ` +
        `${FORK_STOP_DRIVERS.map((d) => `${d} ${wrongDriver.filter((c) => c.forkDriver === d).length}`).join(' · ')} – e.g. ${w.seed}/${w.temperament}, spirit before ${w.spiritBeforePoke} → ` +
        `at the read ${w.render?.spiritAtRead}, worn ${w.forkRoots?.worn.toFixed(3)} against the line ${ECONOMY.life.forkStopDriverFrom}`,
    )
  }
  if (herWrong.length > 0) {
    const w = herWrong[0]
    throw new Error(
      `${w.seed}/${w.temperament}: the walk rendered a stop line the engine does not word from this girl's driver – ` +
        `said «${w.render?.herSaid}» · worn «${w.render?.herWorn}» · own «${w.render?.herOwn}»`,
    )
  }
  if (coachWrong.length > 0) {
    const w = coachWrong[0]
    throw new Error(
      `${w.seed}/${w.temperament}: the counsel rendered a read the engine does not word from 'worn' – ` +
        `said «${w.render?.coachSaid}» · worn «${w.render?.coachWorn}» · own «${w.render?.coachOwn}»`,
    )
  }
  if (herWornRenders.length === 0 || coachWornRenders.length === 0) {
    throw new Error(
      `the worn column did not render: her line ${herWornRenders.length}× and the coach's read ${coachWornRenders.length}× over ` +
        `${pokedStops.length} stops in ${poked.length} poked careers (flat pool ${herFlat.length}) – this section measured nothing`,
    )
  }
  console.log('')
  console.log(
    `    ✓ THE POKE FIRED, THE ENGINE DERIVED \`worn\` FROM IT ON ${drivers(pokedReached, 'worn')}/${pokedReached.length} CAREERS THAT STATED A WANT, and the\n` +
      `      worn column rendered ${herWornRenders.length}× in her own voice and ${coachWornRenders.length}× in the coach's – each string EQUAL to the engine's\n` +
      `      \`worn\` reading and DIFFERENT from its \`own\` reading. ${herFlat.length} stop(s) spoke the flat pool, where her line\n` +
      `      carries no driver at all (bond below the cut) and only the coach's read reaches the player.\n` +
      `    ⚠ AND THE WALKED GRID IS UNCHANGED BY ALL OF IT: its worn column is still ${drivers(walkedReached, 'worn')}. Two arms, two meanings.\n` +
      `    ${((Date.now() - pokeStarted) / 1000).toFixed(1)}s for the poked arm`,
  )
}

// --- 4. NO CLAMPED MEDIANS -----------------------------------------------------------------------
rule('[4] NO CLAMPED MEDIANS – BAR: neither arm’s bond median at 0 or 100')
console.log(`    ${pad('arm', 8)}${padL('median', 10)}${padL('mean', 10)}${padL('p10', 9)}${padL('p90', 9)}${padL('min', 9)}${padL('max', 9)}${padL('at 0 %', 10)}${padL('at 100 %', 10)}`)
console.log(`    ${'─'.repeat(84)}`)
let bar4 = true
for (const arm of ARMS) {
  const xs = weeksOf(of(arm), (c) => c.bond)
  const sorted = [...xs].sort((a, b) => a - b)
  const med = median(sorted)
  const clamped = med === ECONOMY.bond.min || med === ECONOMY.bond.max
  bar4 &&= !clamped
  console.log(
    `    ${pad(arm, 8)}${padL(med.toFixed(2), 10)}${padL(mean(xs).toFixed(2), 10)}${padL(quantile(sorted, 0.1).toFixed(1), 9)}` +
      `${padL(quantile(sorted, 0.9).toFixed(1), 9)}${padL(sorted[0].toFixed(1), 9)}${padL(sorted[sorted.length - 1].toFixed(1), 9)}` +
      `${padL(pct(xs.filter((x) => x === ECONOMY.bond.min).length, xs.length).toFixed(2), 10)}` +
      `${padL(pct(xs.filter((x) => x === ECONOMY.bond.max).length, xs.length).toFixed(2), 10)}`,
  )
}
console.log(`    BAR 4 → ${verdict(bar4)}`)

// --- 5. THE FAIRNESS CORRIDOR --------------------------------------------------------------------
rule('[5] ⚠ THE FAIRNESS CORRIDOR – BAR: paired lifetime match-win deltas across temperaments inside ±1.5 pp')
console.log('    Paired seed-for-seed and arm-for-arm: the two careers in every delta differ in NOTHING but who she is.')
console.log(`    ${pad('pair', 18)}${padL('n', 6)}${padL('mean Δ pp', 12)}${padL('± SEM', 9)}${padL('max |Δ| pp', 13)}${padL('inside ±1.5', 13)}`)
console.log(`    ${'─'.repeat(71)}`)
const winRate = new Map<string, number>()
for (const c of careers) {
  winRate.set(`${c.arm}|${c.temperament}|${c.seed}`, c.matchesPlayed === 0 ? Number.NaN : pct(c.matchesWon, c.matchesPlayed))
}
let bar5 = true
let worstPair = 0
for (let i = 0; i < TEMPERAMENTS.length; i++) {
  for (let j = i + 1; j < TEMPERAMENTS.length; j++) {
    const a = TEMPERAMENTS[i]
    const b = TEMPERAMENTS[j]
    const deltas: number[] = []
    for (const arm of ARMS) {
      for (let s = 0; s < SEED_COUNT; s++) {
        const x = winRate.get(`${arm}|${a}|spirit-${s}`)
        const y = winRate.get(`${arm}|${b}|spirit-${s}`)
        if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) continue
        deltas.push(x - y)
      }
    }
    const m = mean(deltas)
    const worst = deltas.reduce((acc, d) => Math.max(acc, Math.abs(d)), 0)
    const ok = Math.abs(m) <= 1.5
    bar5 &&= ok
    worstPair = Math.max(worstPair, Math.abs(m))
    console.log(
      `    ${pad(`${a} − ${b}`, 18)}${padL(deltas.length, 6)}${padL(m.toFixed(3), 12)}${padL(sem(deltas).toFixed(3), 9)}` +
        `${padL(worst.toFixed(3), 13)}${padL(verdict(ok), 13)}`,
    )
  }
}
console.log(`    ${'─'.repeat(71)}`)
console.log(`    ${pad('lifetime win rate', 18)}${TEMPERAMENTS.map((t) => `${t} ${mean(careers.filter((c) => c.temperament === t).map((c) => pct(c.matchesWon, c.matchesPlayed))).toFixed(2)}%`).join('  ')}`)
console.log(`    worst pair |mean Δ| ${worstPair.toFixed(3)} pp vs corridor 1.500 pp → BAR 5 ${verdict(bar5)}`)
if (!bar5) {
  console.log('    ⚠⚠ A BREACH IS A FINDING FOR THE OWNER, NEVER A SILENT REBALANCE (who-she-is §4 names the only')
  console.log('       sanctioned compensator – support-responsiveness, not a stat rebate – and it needs his word first).')
}

// --- 6. MOOD-WORD OCCUPANCY ----------------------------------------------------------------------
rule('[6] MOOD-WORD OCCUPANCY – the spirit distribution under the CARE arm, and what cut points would fit')
console.log('    ⚠ The five words and their ladder are the OWNER’s (invariant 4) and are not built. This section')
console.log('      reports the distribution there is to cut and the arithmetic of what would fit. It proposes nothing.')
const careSpirit = weeksOf(of('care'), (c) => c.spirit)
const careSorted = [...careSpirit].sort((a, b) => a - b)
console.log(`\n    Deciles of spirit over ${careSorted.length.toLocaleString('en-US')} care-arm weeks:`)
console.log(`    ${['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'].map((d) => padL(d, 8)).join('')}`)
console.log(`    ${[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((q) => padL(quantile(careSorted, q).toFixed(1), 8)).join('')}`)

const BANDS: [string, (x: number) => boolean][] = [
  ['< 60 (under the knee)', (x) => x < 60],
  ['60 – 64.9', (x) => x >= 60 && x < 65],
  ['65 – 67.4', (x) => x >= 65 && x < 67.5],
  ['67.5 – 69.9', (x) => x >= 67.5 && x < 70],
  ['exactly 70.0 (baseline)', (x) => x === 70],
  ['70.1 – 72.4', (x) => x > 70 && x < 72.5],
  ['72.5 – 74.9', (x) => x >= 72.5 && x < 75],
  ['75 – 79.9', (x) => x >= 75 && x < 80],
  ['≥ 80', (x) => x >= 80],
]
console.log('\n    The shape of it, care arm:')
for (const [label, test] of BANDS) {
  const n = careSpirit.filter(test).length
  const share = pct(n, careSpirit.length)
  console.log(`      ${pad(label, 26)}${padL(share.toFixed(2) + '%', 9)}  ${'█'.repeat(Math.round(share / 2))}`)
}

// THE CUT-POINT SEARCH. Five words are five CONTIGUOUS bands of the value axis, so "do cut points
// exist that give all five >= 2%" is a partition of the sorted distinct values into five contiguous
// groups, and the best available set is the one whose SMALLEST group is largest. A DP over the
// cumulative distribution answers both at once.
const distinct = [...new Set(careSpirit)].sort((a, b) => a - b)
const cumulative = new Map<number, number>()
{
  let running = 0
  for (const v of distinct) {
    running += careSpirit.filter((x) => x === v).length
    cumulative.set(v, running)
  }
}
const upto = (index: number) => (index < 0 ? 0 : (cumulative.get(distinct[index]) ?? 0))
const massOf = (from: number, to: number) => upto(to) - upto(from - 1)
/** best[k][i] = the largest achievable MINIMUM band mass when values [0..i] are cut into k bands */
const NEG = -1
const best: number[][] = Array.from({ length: 6 }, () => new Array(distinct.length).fill(NEG))
const cutAt: number[][] = Array.from({ length: 6 }, () => new Array(distinct.length).fill(-1))
for (let i = 0; i < distinct.length; i++) best[1][i] = massOf(0, i)
for (let k = 2; k <= 5; k++) {
  for (let i = k - 1; i < distinct.length; i++) {
    for (let j = k - 2; j < i; j++) {
      if (best[k - 1][j] === NEG) continue
      const score = Math.min(best[k - 1][j], massOf(j + 1, i))
      if (score > best[k][i]) {
        best[k][i] = score
        cutAt[k][i] = j
      }
    }
  }
}
const bestMin = best[5][distinct.length - 1]
const bestShare = pct(bestMin, careSpirit.length)
const bar6 = bestShare >= 2
console.log(`\n    Best five-way split of this distribution: the SMALLEST of the five words can hold at most ${bestShare.toFixed(2)}% of weeks.`)
console.log(`    BAR 6 (each of five ≥ 2% of weeks, cut points free) → ${verdict(bar6)}`)
{
  const edges: number[] = []
  let k = 5
  let i = distinct.length - 1
  while (k > 1) {
    const j = cutAt[k][i]
    edges.unshift(j)
    i = j
    k--
  }
  console.log('\n    The best-available ladder, LOWEST band first – for his read, not a proposal:')
  console.log(`    ${pad('band', 24)}${padL('weeks', 10)}${padL('share', 10)}`)
  console.log(`    ${'─'.repeat(44)}`)
  let from = 0
  const bounds = [...edges, distinct.length - 1]
  for (let b = 0; b < bounds.length; b++) {
    const to = bounds[b]
    const lo = distinct[from]
    const hi = distinct[to]
    const n = massOf(from, to)
    const label = b === 0 ? `spirit < ${(distinct[to + 1] ?? hi).toFixed(1)}` : b === bounds.length - 1 ? `spirit ≥ ${lo.toFixed(1)}` : `${lo.toFixed(1)} – ${hi.toFixed(1)}`
    console.log(`    ${pad(label, 24)}${padL(n, 10)}${padL(pct(n, careSpirit.length).toFixed(2) + '%', 10)}`)
    from = to + 1
  }
  console.log(`    cut points (descending): ${edges.map((e) => distinct[e + 1].toFixed(1)).reverse().join('  ·  ')}`)
}

// --- FOR HIS READ, NO BARS -----------------------------------------------------------------------
rule('FOR HIS READ – no bars on any of these')
console.log('  (a) THE BIRTHDAY ASK-MIX PER TEMPERAMENT. ⚠ The ~1.5× weighting toward her register is runbook §4.4')
console.log('      and is NOT built; the ask rides `seed:birthday:<age>`, which carries no temperament term. An')
console.log('      identical mix across the four is therefore the EXPECTED reading here, and the baseline the')
console.log('      weighting will be measured against once it lands.')
{
  const ids = [...new Set(careers.flatMap((c) => c.asks))].sort()
  console.log(`\n    ${pad('temperament', 14)}${padL('asks', 7)}${ids.map((id) => padL(id, 14)).join('')}`)
  console.log(`    ${'─'.repeat(21 + 14 * ids.length)}`)
  for (const t of TEMPERAMENTS) {
    const asks = careers.filter((c) => c.temperament === t).flatMap((c) => c.asks)
    console.log(
      `    ${pad(t, 14)}${padL(asks.length, 7)}` +
        ids.map((id) => padL(pct(asks.filter((a) => a === id).length, asks.length).toFixed(1) + '%', 14)).join(''),
    )
  }
}
console.log('\n  (b) WEEKS UNDER THE KNEE (spirit < 60 – the only place `spiritMatchFactor` stops being 1.0).')
console.log(`\n    ${pad('arm', 8)}${pad('temperament', 14)}${padL('weeks < 60', 12)}${padL('share', 10)}${padL('per career', 12)}${padL('lowest', 9)}`)
console.log(`    ${'─'.repeat(65)}`)
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const cs = of(arm, t)
    const xs = weeksOf(cs, (c) => c.spirit)
    const under = xs.filter((x) => x < ECONOMY.spirit.knee).length
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(under, 12)}${padL(pct(under, xs.length).toFixed(2) + '%', 10)}` +
        `${padL((under / cs.length).toFixed(2), 12)}${padL(Math.min(...xs).toFixed(1), 9)}`,
    )
  }
}
console.log('\n  (c) BOND OUTCOMES PER TEMPERAMENT. ⚠ Bond has NO temperament term anywhere in wave 1, so any')
console.log('      spread across the four rows of one arm is the feedback path through `spiritMatchFactor` only.')
console.log(`\n    ${pad('arm', 8)}${pad('temperament', 14)}${padL('final', 9)}${padL('mean', 9)}${padL('median', 9)}${padL('min', 8)}${padL('max', 8)}${padL('knocks', 9)}${padL('injuries', 10)}${padL('heavy wks', 11)}`)
console.log(`    ${'─'.repeat(95)}`)
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const cs = of(arm, t)
    const finals = cs.map((c) => c.bond[c.bond.length - 1])
    const xs = weeksOf(cs, (c) => c.bond)
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(mean(finals).toFixed(2), 9)}${padL(mean(xs).toFixed(2), 9)}${padL(median(xs).toFixed(2), 9)}` +
        `${padL(Math.min(...xs).toFixed(1), 8)}${padL(Math.max(...xs).toFixed(1), 8)}` +
        `${padL((cs.reduce((a, c) => a + c.knocks, 0) / cs.length).toFixed(2), 9)}` +
        `${padL((cs.reduce((a, c) => a + c.injuries, 0) / cs.length).toFixed(2), 10)}` +
        `${padL((cs.reduce((a, c) => a + c.heavyWeeks, 0) / cs.length).toFixed(2), 11)}`,
    )
  }
}
console.log('      "heavy wks" = weeks a decision cost her ≥ 3.5 bond inside ONE tick, per career. Only two rows can:')
console.log('      the played-hurt −4 (she was entered under a "cleared, but only just" verdict) and, grind arm only,')
console.log('      the season\'s zero-vacation −3 landing beside the regression. It is NOT an arm-defining decision –')
console.log('      it is what the shared entry policy costs – and it is printed because it is worth more per event than')
console.log('      any row that IS.')

// --- 7. THE REFUSAL LEDGER -----------------------------------------------------------------------
//
// ⚠ LAST, AND AFTER [3c], because [3c] walks a population of its own – see `printRefusalLedger`.
printRefusalLedger()

// --- THE VERDICT ---------------------------------------------------------------------------------
rule('THE SIX BARS')
const bars: [string, boolean, string][] = [
  ['1  spirit moves (per-career sd ≥ 2)', bar1.care && bar1.grind, `care ${mean(sdByArm.care).toFixed(2)} · grind ${mean(sdByArm.grind).toFixed(2)}`],
  ['2a no extremes (< 20 / > 95 under 2%)', bar2extreme, 'per temperament arm'],
  ['2b long-run mean 70 ± 4', bar2mean, 'per temperament arm'],
  ['3  bond separates (≥ 12 at season 3, > 2×SEM)', bar3gap && bar3sem, `gap ${gapAt3.toFixed(2)} · 2×SEM ${(2 * sem3).toFixed(3)}`],
  ['4  no clamped bond medians', bar4, `care ${median(weeksOf(of('care'), (c) => c.bond)).toFixed(1)} · grind ${median(weeksOf(of('grind'), (c) => c.bond)).toFixed(1)}`],
  ['5  fairness corridor ±1.5 pp', bar5, `worst pair ${worstPair.toFixed(3)} pp`],
  ['6  five Mood words ≥ 2% each (cuts free)', bar6, `best smallest band ${bestShare.toFixed(2)}%`],
]
for (const [label, ok, note] of bars) console.log(`    ${verdict(ok)}  ${pad(label, 46)}${note}`)
console.log(`\n    ⚠ A FAILED BAR IS A FINDING FOR THE OWNER. This tool changed no constant and proposes none.`)
// ⚠⚠ v75 T9 – AND THE SHEET SAYS WHAT THE WALK SUPPRESSED, so a bar can never again be read off a
// run that did not fully happen without the reader being told. The table itself is [7], above.
{
  const refusalRows = [...REFUSALS.values()]
  const refusalTotal = refusalRows.reduce((a, r) => a + r.count, 0)
  console.log(
    `    ⚠ REFUSALS ON THIS RUN: ${refusalTotal} over ${refusalRows.length} site/sentence pair(s) – the table is [7]. ` +
      `${refusalTotal === 0 ? 'Nothing was suppressed.' : 'None of them was silent.'}`,
  )
}
console.log(`\n    ${((Date.now() - started) / 1000).toFixed(1)}s`)
