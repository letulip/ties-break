/**
 * growth-pace-probe – HOW FAST DOES SHE ACTUALLY GROW? The owner's question, measured.
 *
 * The owner, 27.08 (his words, kept verbatim because the question is his):
 *
 *   «а не слишком ли быстро растут наши спортсменки? я его уже задавал, кажется. Alice на момент
 *    поступления в колледж играла уже на 500 и шлемах и имела на счету 600к+ в 18-19 лет. Т.е. все
 *    наши юношеские были где-то сильно раньше и всего 1 или 2 сезона, т.е. задолго до открытия окна
 *    с колледжем вообще.»
 *
 * He has asked before and nobody has ever put a number on it. There are two anchors to measure
 * against and they are DIFFERENT CLAIMS, which is the whole reason this file prints two verdicts:
 *
 *   THE PACE ANCHOR – `src/engine/development.ts:10-11`, quoting docs/plan.md Phase 4 verbatim:
 *     "potential + age curves (calibrate to real milestones: points ~17-18, top-100 ~4.5 yrs later,
 *      peak 23-28, decline ~29+)". First points at ~17-18 plus 4.5 years puts the model's OWN
 *     target for a first top-100 at roughly 21.5-22.5. §1 measures the age; §1's verdict is in
 *     YEARS EARLY, not adjectives.
 *
 *   THE OUTCOME ANCHOR – docs/specs/career-outcome-targets.md, agreed with the owner 26.07:
 *     lives from tennis (~top-250) 15-25%, top-100 analog 3-6%, Slam-level <1%, "of runs reaching
 *     the horizon", and that page demands BOTH bases (conditional, and of all starts). §2.
 *
 * Being early and being too common are different failures with different fixes, so a run that is
 * early but inside the outcome band is a TIMING defect, and one outside the band is a REACH defect.
 * §0 says which.
 *
 *   npx vite-node tools/growth-pace-probe.ts [--seeds N] [--policy player|grinder|july] [--proveArm]
 *
 * ⚠ MEASUREMENT ONLY. Every engine number is read, none is written: no ECONOMY knob is patched
 * (not even temporarily, so there is no `finally` to audit), no constant is shadowed, and every
 * career is advanced through `stepCareerWeek` – the same public commands the UI drives.
 *
 * ⚠⚠ HOW THIS INSTRUMENT PROVES IT READS **AFTER** THE TOURNAMENT RESOLVES.
 *
 * `tools/pro-season-probe.ts:388-398` records the class of defect this file could most easily
 * repeat: for three waves that bench read the body BEFORE the reveal was finished, and because
 * `retirementInjury` is opened by `finalizeTournament` – reached only through `skipTournament` –
 * 57% of the pro era's injury onsets were never counted at all. A second live leak of the same
 * class was found the day before this file was written. Everything §4 and §6 measure is written at
 * exactly that moment (`world.ts:476-477`, `bestFinishByTier` at finalize), so the same mistake
 * here would silently move every milestone age LATER by one event or lose it entirely.
 *
 * Three arms, and the third one is the only one that is evidence rather than an assertion:
 *
 *   ARM 1 – `assertResolved` after EVERY step. `stepCareerWeek` ticks, then `skipTournament`s (which
 *           runs `finalizeTournament`) and `closeTournament`s, so a resolved world has
 *           `pendingTournament === null` and no half-revealed draw can be standing when this file
 *           reads anything. If a future `stepCareerWeek` stops closing the reveal, every career in
 *           this corpus throws on its first tournament instead of quietly reporting late ages.
 *   ARM 2 – NO TIER MAY BE PLAYED THAT WAS NEVER ENTERED. `bestFinishByTier` (the play ledger, written
 *           at finalize) is cross-checked against the entry ledger (`stepCareerWeek`'s own return,
 *           captured at commit). A tier that appears in the first and never in the second means the
 *           instrument is reading a world the entry side cannot see, and it throws.
 *   ARM 3 – `--proveArm` REPRODUCES THE ROUND-26 DEFECT ON PURPOSE and requires ARM 1 to fire on it.
 *           A hand-rolled loop ticks and reads BEFORE `skipTournament`, which is precisely the
 *           broken arrangement; it prints the stale `bestFinishByTier` beside the live
 *           `pendingTournament.result` to show the number the defect WOULD have produced, and exits
 *           1 if the guard fails to trip. CLAUDE.md's own rule for the too-tall dialog: a test that
 *           cannot fail on the broken version is not this test. ⚠ `--proveArm` RUNS ALONE and never
 *           beside the corpus – see the note where it returns.
 *
 * ⚠⚠ AND THE INSTRUMENT WAS CAUGHT MOVING ITS OWN SUBJECT, TWICE, BEFORE ANY NUMBER BELOW WAS
 * BELIEVED. Both were found by the cheapest possible control – run the same command twice and diff
 * the output – and both are recorded at the line that fixes them rather than here:
 *   * a once-a-week `tableSize(world, 'wta')` call, added only to print a denominator, moved the
 *     whole corpus (see `snapOf`);
 *   * `--proveArm` sharing a process with the corpus moved it again (see `main`).
 * ⚠⚠ AND THE TWO CANCEL: a run carrying BOTH is byte-identical to a run carrying neither, which is
 * why each was diffed against a SINGLE-VARIABLE control rather than against the first version.
 * Neither is an engine defect and neither writes anything: they are memo reads at weeks the engine
 * would not have made them. The probe is now byte-reproducible run to run, which was verified by
 * diffing two clean runs before the corpus was started.
 */
import {
  openCareer,
  stepCareerWeek,
  PRESETS,
  POLICIES,
  type Preset,
  type Policy,
} from './econ-bench'
import { FULL_CAREER_AGE_YEARS, FULL_CAREER_WEEKS } from './endings-bench'
import {
  answerFork,
  answerRetirement,
  closeTournament,
  enterEvent,
  entryStatus,
  seasonIndexOf,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { kidAgeExact } from '../src/engine/world/age'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { SKILL_KEYS } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { COLLEGE_LEAGUE } from '../src/engine/collegeLeague'
import { FIELD } from '../src/engine/season/fieldPros'
import type { CareerEnding } from '../src/shared/protocol'
import type { LadderTrack, TierId } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET. 9 presets x this = the corpus. See the note over `main` for the sizing. */
const SEEDS = argOf('seeds', 100)
const policyArg = args.indexOf('--policy') >= 0 ? args[args.indexOf('--policy') + 1] : 'player'
/** The default is `player` – the reasonable-parent model, the arm `ladder-vs-targets.ts` and
 *  `potential-band-sweep.ts` both use – so this corpus is comparable with theirs rather than with a
 *  grinder that enters everything it can afford. */
/** ⭐⭐ THE THIRD ARM, AND IT EXISTS TO SETTLE AN ATTRIBUTION THIS PAGE COULD NOT OTHERWISE MAKE.
 *  `ladder-vs-targets.ts` run on the 12.08 tree (51a8360, the commit whose own message is «nobody in
 *  160 careers reaches it») reports median best rank #174 and ZERO top-100; the identical command on
 *  today's tree reports #12 and 16 of 16. That is a real drift – and it is NOT attributable, because
 *  `econ-bench`'s `player` POLICY changed between those dates too: on 12.08 it was three fields
 *  (`reserveCents: 5_000_00, restFloor: 70, coachOnEventWeeks: true`) and today it is thirteen,
 *  including a season coach review that HIRES a better coach and the removal of the $5,000 absolute
 *  reserve that the-wall-2026-08.md §6a calls a poverty trap. Comparing the two trees compares the
 *  engine AND the manager, which is CLAUDE.md's shared-checkout hazard wearing different clothes.
 *
 *  `--policy july` is the missing cell: the 12.08 manager, on TODAY's engine. Every field added after
 *  12.08 carries the value econ-bench itself documents as the historical, byte-identical one (the
 *  grinder's), so nothing here is invented – it is the old literal plus the documented defaults.
 *  ⚠ `id` is typed `'grinder' | 'player'` and this IS the player arm as it stood in July, so the id
 *  stays `player` and only the label differs. */
const JULY_PLAYER: Policy = {
  id: 'player',
  label: 'july-player (the 12.08 literal)',
  reserveCents: 5_000_00,
  reserveWeeks: 0,
  restFloor: 70,
  restRelief: 0,
  coachOnEventWeeks: true,
  onlyHerTable: false,
  skipOutgrown: false,
  rescueBelow: null,
  rescueTo: 0,
  offSeasonWeekOff: false,
  vacationSpendShare: 0,
  coachSeasonReview: false,
}
const POLICY: Policy =
  policyArg === 'july' ? JULY_PLAYER : (POLICIES.find((p) => p.id === policyArg) ?? POLICIES[1])
const PROVE_ARM = args.includes('--proveArm')

// -------------------------------------------------------------------------------------------------
// ⭐ THE POTENTIAL-BAND OVERRIDE – measurement only, ONE BAND PER PROCESS, and never in `src/`
// -------------------------------------------------------------------------------------------------
//
// The owner's «может не до 3-6% довести, но как-то все-таки и не так 90+%» needs a SWEEP of
// `ECONOMY.development.potentialBand`, and a sweep must not touch the shipped constant. So the band
// is read from the environment (`TB_POTENTIAL_BAND="lo,hi"`) or from `--band lo,hi`, and applied to
// the live ECONOMY object ONCE, here, before a single career exists. `src/` is byte-identical to
// `wave/the-shop`'s tip in every arm – `git status --porcelain -- src` is the check.
//
// ⚠⚠ AND THE REASON IT IS ONE BAND PER PROCESS RATHER THAN A LOOP. `tools/potential-band-sweep.ts`
// wraps each arm in `withBand(...)` inside ONE process, which is correct for pure arithmetic and is
// exactly the hazard this file's own header records for the corpus: the engine's per-season memos
// are PROCESS-GLOBAL, so a career run after another career in the same process is not the career it
// would have been alone (`--proveArm` moved the median career-best rank #13 → #14 by doing nothing
// but opening one extra world first). A band swept in-process would carry that contamination into
// every arm after the first and it would look exactly like a band effect. Separate processes cannot.
//
// ⚠ WHAT THE PATCH DOES NOT REACH, stated because it is a real (small) limit. `SKILL_CEILING_MAX`
// (development.ts) is computed at MODULE LOAD from `potentialBand[1]`, so it keeps its shipped 86 in
// every arm. Nothing in the simulation reads it – it is the skills-rose axis and two tests – so no
// number below moves with it; but a SHIPPED band change would move that axis, and the report says so.
//
// ⚠ `COHORT.potentialBand` `[1, 22]` (season/cohort.ts) is a DIFFERENT constant and is not touched:
// the 199 rivals and the 1,600 professionals keep their shipped ceilings in every arm, which is what
// makes this a difficulty knob against a fixed field rather than a world parameter.
const bandArgRaw =
  process.env.TB_POTENTIAL_BAND ??
  (args.indexOf('--band') >= 0 ? args[args.indexOf('--band') + 1] : undefined)
const SHIPPED_BAND: readonly [number, number] = [
  ECONOMY.development.potentialBand[0],
  ECONOMY.development.potentialBand[1],
]
if (bandArgRaw !== undefined) {
  const parts = bandArgRaw.split(',').map((s) => Number(s.trim()))
  if (parts.length !== 2 || !parts.every((x) => Number.isFinite(x)) || parts[0] > parts[1]) {
    throw new Error(
      `growth-pace-probe: --band / TB_POTENTIAL_BAND must be "lo,hi" with lo <= hi – got "${bandArgRaw}". REFUSING to run.`,
    )
  }
  // Elementwise, not a replacement: `rollPotential` destructures the array, and a replaced array
  // would leave any reference captured elsewhere pointing at the old one.
  const d = ECONOMY.development as unknown as { potentialBand: [number, number] }
  d.potentialBand[0] = parts[0]
  d.potentialBand[1] = parts[1]
}
const BAND: readonly [number, number] = [
  ECONOMY.development.potentialBand[0],
  ECONOMY.development.potentialBand[1],
]
const BAND_IS_SHIPPED = BAND[0] === SHIPPED_BAND[0] && BAND[1] === SHIPPED_BAND[1]

// -------------------------------------------------------------------------------------------------
// the rungs this file is asked about, by name rather than by index arithmetic
// -------------------------------------------------------------------------------------------------
/** «играла уже на 500 и шлемах» – W500 OR ABOVE is the top three rungs of the ladder. Derived from
 *  `TIER_LADDER` rather than typed out, so a rung inserted above wta500 joins the set for free. */
const W500_AND_UP: readonly TierId[] = TIER_LADDER.slice(TIER_LADDER.indexOf('wta500'))
/** the junior international tour – the `itf` track, which is exactly j30/j60/j300 and is the only
 *  thing in the game that closes at eighteen (`TierDef.maxAgeYears`). */
const JUNIOR_TRACK: LadderTrack = 'itf'
const TRACKS: readonly LadderTrack[] = ['domestic', 'itf', 'wta']

// -------------------------------------------------------------------------------------------------
// the arms
// -------------------------------------------------------------------------------------------------
/** ARM 1. Throws when a half-revealed draw is standing at the moment this file reads the world.
 *  Every read in `runCareer` happens after a call to this. */
function assertResolved(world: WorldState, where: string): void {
  if (world.pendingTournament !== null) {
    throw new Error(
      `growth-pace-probe: READ BEFORE RESOLUTION at ${where} – week ${world.week} still holds a ` +
        `pendingTournament (event ${world.pendingTournament.eventId}, finished=` +
        `${world.pendingTournament.finished}). Everything this file measures is written by ` +
        `finalizeTournament, so a read here is the pro-season-probe round-26 #14 defect. STOP.`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// one career
// -------------------------------------------------------------------------------------------------
interface Snap {
  /** family balance, cents */
  fundsCents: number
  /** her own money, cents */
  kidFundsCents: number
  /** career prize money to date, cents – the tennis paying for itself */
  prizeCents: number
  /** professional-table rank, or null when she holds no paid result yet */
  rank: number | null
  /** the raw cache, whatever it says – kept because "unranked" and "ranked #1400" read differently */
  rankRaw: number | null
  /** ⚠ HOW BIG THE TABLE SHE IS RANKED IN ACTUALLY IS. "#13" means nothing without it: a dense rank
   *  is a place among the rows that exist, and `ladder-vs-targets-2026-08.md` §1c is entirely about
   *  a reader who assumed the professional table was the size of the Slam draw. Printed beside every
   *  rank figure so nobody has to assume again. */
  tableSize: number
  /** ⭐⭐ THE NUMBER THAT DECIDES §8 – the mean of her five attributes, which is `power()`'s own
   *  definition (cohort.ts:190, "every skill, and it used to be four") and therefore the SAME SCALE
   *  as `fieldPros.FIELD.tiers[].core` and as the five attributes `collegeLeagueOpponent` draws from
   *  `COLLEGE_LEAGUE.field`. Comparing her to either without going through this is comparing a
   *  player to a population on two different rulers. */
  skillMean: number
  /** ⭐ AND WHAT SHARE OF HER OWN CEILING THAT IS. `world.potential` is rolled once per career and
   *  never moves (`rollPotential`, development.ts), so `skillMean / potentialMean` is the age curve's
   *  own progress bar and says nothing about the ladder, the field or the money. It is the single
   *  most direct statement of "too fast": a girl who has spent 95% of her headroom at nineteen has
   *  no development left to have, whatever her ranking says. */
  ceilingShare: number
  potentialMean: number
}

interface Career {
  cell: string
  index: number
  weeks: number
  ending: string | null
  bankrupt: boolean
  reachedHorizon: boolean

  /** best (lowest) professional rank ever held WHILE holding a paid result */
  bestWta: number | null
  ageBestWta: number | null
  ageFirstTop100: number | null
  ageFirstTop250: number | null
  /** age the week her power() first reached 90% / 95% of her own rolled ceiling */
  ageAt90Ceiling: number | null
  ageAt95Ceiling: number | null

  /** the state of the career the week she turns eighteen / nineteen */
  at18: Snap | null
  at19: Snap | null

  /** age the week a tier's first MAIN DRAW finished (the play ledger) */
  firstPlayAge: Partial<Record<TierId, number>>
  /** age the week a tier was first COMMITTED to (the entry ledger) */
  firstEntryAge: Partial<Record<TierId, number>>

  /** seasons (0-based index) whose PLAYED MATCHES were majority junior-track */
  juniorSeasonsByMatches: number
  /** ...and whose COMMITTED EVENTS were. Two instruments, same question. */
  juniorSeasonsByEvents: number
  /** seasons whose played matches were majority NON-professional (domestic + junior together) */
  amateurSeasonsByMatches: number
  /** the season index in which professional-track matches first became the majority, or null */
  firstProMajoritySeason: number | null
  /** her age at the start of that season */
  ageProTakeover: number | null
  /** total events committed, by track */
  eventsByTrack: Record<LadderTrack, number>

  /** ⭐ ADDED FOR THE BAND SWEEP – the MEDIAN career's own numbers, which is the half of the
   *  question a top-100 share cannot see. Career prize money at the moment the career stops, and
   *  whether she was ever paid a professional cheque at all (`potential-band-2026-08.md` §3's
   *  "ever paid" column, which is that page's own reading of "is there enough to play for"). */
  finalPrizeCents: number
  everPaid: boolean
}

function zeroTracks(): Record<LadderTrack, number> {
  return { domestic: 0, itf: 0, wta: 0 }
}

const skillMeanOf = (world: WorldState): number =>
  SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0) / SKILL_KEYS.length
/** ⚠ HER CEILING IS THE MEAN OF THE FIVE POTENTIALS, on `power()`'s own definition, because that is
 *  the only reading on which `skillMean / potentialMean` is a share of the SAME quantity. */
const potentialMeanOf = (world: WorldState): number =>
  SKILL_KEYS.reduce((a, k) => a + world.potential[k], 0) / SKILL_KEYS.length

function snapOf(world: WorldState): Snap {
  const raw = world.kidRankWta
  // The paid guard is `ladder-vs-targets.ts:249`'s, verbatim: a dense rank in a table where nobody
  // holds a point ties the whole field at one, so a rank is only a place once she has been paid.
  // ⚠ `typeof === 'number'`: `kidRankWta` is `number | undefined`, and `!== null` admits `undefined`.
  const paid = world.careerTotals.prizeCents > 0 && typeof raw === 'number' ? raw : null
  return {
    fundsCents: world.fundsCents,
    kidFundsCents: world.kidFundsCents,
    prizeCents: world.careerTotals.prizeCents,
    rank: paid,
    rankRaw: typeof raw === 'number' ? raw : null,
    // ⚠⚠ COMPUTED, NOT ASKED – and that is a MEASURED correction to this file, not a style choice.
    // The obvious `tableSize(world, 'wta')` is a pure function by its own doc comment ("Pure
    // derivation, ZERO draws on any stream the tick walks"), and calling it once a week nevertheless
    // MOVED THIS CORPUS. Single-variable control, 9 seeds, the call being the only difference: max age
    // at first top-100 22.7 -> 22.3, mean 19.6 -> 19.5, mean age at her career-best rank 25.7 -> 25.2.
    // It reaches `fieldProsOf`, which is MEMOISED, and a
    // memo read at a week the engine would not have read it is not free. The arithmetic below is the
    // same number (199 cohort + her + FIELD.size = 1800, verified against the live call) with no
    // engine call in it at all, so the instrument cannot move the thing it is measuring.
    tableSize: world.cohort.length + 1 + FIELD.size,
    skillMean: skillMeanOf(world),
    ceilingShare: skillMeanOf(world) / potentialMeanOf(world),
    potentialMean: potentialMeanOf(world),
  }
}

function runCareer(cell: string, preset: Preset, index: number, policy: Policy): Career {
  const { world, rng } = openCareer(preset, index, policy)
  const birthMonth = world.profile.birthMonth
  const birthDay = world.profile.birthDay
  const ageAt = (week: number): number => kidAgeExact(week, birthMonth, birthDay)

  const firstPlayAge: Partial<Record<TierId, number>> = {}
  const firstEntryAge: Partial<Record<TierId, number>> = {}
  const eventsBySeason = new Map<number, Record<LadderTrack, number>>()
  const matchesBySeason = new Map<number, Record<LadderTrack, number>>()
  const eventsByTrack = zeroTracks()
  let bestWta: number | null = null
  let ageBestWta: number | null = null
  let ageFirstTop100: number | null = null
  let ageFirstTop250: number | null = null
  let at18: Snap | null = null
  let at19: Snap | null = null
  let ageAt90Ceiling: number | null = null
  let ageAt95Ceiling: number | null = null
  let historyBanked = 0
  let weeks = 0

  for (; weeks < FULL_CAREER_WEEKS && world.ending === null; weeks++) {
    // The COMMIT week – `stepCareerWeek` enters before it ticks, so an entry belongs to this week
    // and to this season, not to the one the tick may have stepped into.
    const commitWeek = world.week
    const entered = stepCareerWeek(world, rng, policy)
    // ⚠⚠ ARM 1. Nothing below this line may run against a half-revealed draw.
    assertResolved(world, `${cell}/${index} after step`)

    // --- the ENTRY ledger, at commit ---------------------------------------------------------
    const commitSeason = seasonIndexOf(commitWeek)
    let eRow = eventsBySeason.get(commitSeason)
    if (eRow === undefined) {
      eRow = zeroTracks()
      eventsBySeason.set(commitSeason, eRow)
    }
    for (const t of TIER_LADDER) {
      const n = entered[t]
      if (n <= 0) continue
      const track = TIERS[t].track
      eRow[track] += n
      eventsByTrack[track] += n
      if (firstEntryAge[t] === undefined) firstEntryAge[t] = ageAt(commitWeek)
    }

    // --- the PLAY ledger, at finalize --------------------------------------------------------
    // `bestFinishByTier` gains its key inside `finalizeTournament` (world.ts:476-477), so the week a
    // tier first appears here is the week her first MAIN DRAW at that rung finished. It is a
    // high-water mark that never goes backwards and is never pruned, which is what makes a
    // first-appearance watch honest over a 25-season career.
    for (const t of TIER_LADDER) {
      if (world.bestFinishByTier[t] === undefined) continue
      if (firstPlayAge[t] !== undefined) continue
      firstPlayAge[t] = ageAt(world.week)
      // ⚠⚠ ARM 2 – she cannot have PLAYED a rung this bench never saw her ENTER.
      if (firstEntryAge[t] === undefined) {
        throw new Error(
          `growth-pace-probe: PLAYED A TIER IT NEVER SAW ENTERED – ${cell}/${index} finished a ` +
            `${t} at week ${world.week} with no entry in the ledger. The two sides of this ` +
            `instrument disagree, so one of them is reading a world the other cannot see. STOP.`,
        )
      }
    }

    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    // Refuse every offer until the game stops asking – `answerRetirement` throws on a refused FINAL
    // offer, so passing `final` is "retire only when it is no longer a question". The player's own
    // exit choices are therefore held out of the tennis filter, exactly as ladder-vs-targets does.
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)

    // --- the season ledger, banked at wrap-up ------------------------------------------------
    // `seasonHistory` is appended once per finished season and carries `byTrack` (v46): matches
    // won and lost IN EACH TABLE. Captured as it is written rather than read at the end, so the
    // SEASON_HISTORY_CAP (30) can never silently drop the early junior seasons this question is about.
    for (; historyBanked < world.seasonHistory.length; historyBanked++) {
      const row = world.seasonHistory[historyBanked]
      const byTrack = row.byTrack
      if (byTrack === undefined) continue
      const mRow = zeroTracks()
      for (const track of TRACKS) {
        const cellRow = byTrack[track]
        mRow[track] = (cellRow?.wins ?? 0) + (cellRow?.losses ?? 0)
      }
      matchesBySeason.set(row.seasonIndex, mRow)
    }

    // --- the rank watch ----------------------------------------------------------------------
    const snap = snapOf(world)
    if (snap.rank !== null) {
      if (bestWta === null || snap.rank < bestWta) {
        bestWta = snap.rank
        ageBestWta = ageAt(world.week)
      }
      if (ageFirstTop250 === null && snap.rank <= 250) ageFirstTop250 = ageAt(world.week)
      if (ageFirstTop100 === null && snap.rank <= 100) ageFirstTop100 = ageAt(world.week)
    }

    // --- the age curve's own progress bar, independent of every ladder -----------------------
    if (ageAt90Ceiling === null && snap.ceilingShare >= 0.9) ageAt90Ceiling = ageAt(world.week)
    if (ageAt95Ceiling === null && snap.ceilingShare >= 0.95) ageAt95Ceiling = ageAt(world.week)

    // --- the two birthdays he named ----------------------------------------------------------
    const age = ageAt(world.week)
    if (at18 === null && age >= 18) at18 = snap
    if (at19 === null && age >= 19) at19 = snap
  }

  // Anything still unbanked when the career stopped (a career that ends mid-season never wraps it).
  for (; historyBanked < world.seasonHistory.length; historyBanked++) {
    const row = world.seasonHistory[historyBanked]
    const byTrack = row.byTrack
    if (byTrack === undefined) continue
    const mRow = zeroTracks()
    for (const track of TRACKS) {
      const cellRow = byTrack[track]
      mRow[track] = (cellRow?.wins ?? 0) + (cellRow?.losses ?? 0)
    }
    matchesBySeason.set(row.seasonIndex, mRow)
  }

  // ⚠ READ AFTER THE LOOP AND THROUGH AN ANNOTATED LOCAL – the loop's own condition narrows
  // `world.ending` to `null` inside the body, so `world.ending?.type` in there is `never`.
  const endingRow: CareerEnding | null = world.ending
  const ending = endingRow?.type ?? null
  const bankrupt = ending === 'bankruptcy'

  const majority = (row: Record<LadderTrack, number>, of: readonly LadderTrack[]): boolean => {
    const total = row.domestic + row.itf + row.wta
    if (total === 0) return false
    let mine = 0
    for (const t of of) mine += row[t]
    return mine * 2 > total
  }
  let juniorSeasonsByMatches = 0
  let amateurSeasonsByMatches = 0
  let firstProMajoritySeason: number | null = null
  for (const [seasonIndex, row] of [...matchesBySeason.entries()].sort((a, b) => a[0] - b[0])) {
    if (majority(row, [JUNIOR_TRACK])) juniorSeasonsByMatches++
    if (majority(row, ['domestic', 'itf'])) amateurSeasonsByMatches++
    if (firstProMajoritySeason === null && majority(row, ['wta'])) firstProMajoritySeason = seasonIndex
  }
  let juniorSeasonsByEvents = 0
  for (const row of eventsBySeason.values()) if (majority(row, [JUNIOR_TRACK])) juniorSeasonsByEvents++

  return {
    cell,
    index,
    weeks,
    ending,
    bankrupt,
    // career-outcome-targets.md's own definition of the base: the family did not go under and she
    // did not quit. `stopped`/`college` are listed so an arm that answers the fork differently
    // inherits the rule; this arm answers `continue` and refuses, so neither can occur.
    reachedHorizon: !bankrupt && ending !== 'stopped' && ending !== 'college',
    bestWta,
    ageBestWta,
    ageFirstTop100,
    ageFirstTop250,
    ageAt90Ceiling,
    ageAt95Ceiling,
    at18,
    at19,
    firstPlayAge,
    firstEntryAge,
    juniorSeasonsByMatches,
    juniorSeasonsByEvents,
    amateurSeasonsByMatches,
    firstProMajoritySeason,
    ageProTakeover:
      firstProMajoritySeason === null ? null : ageAt(firstProMajoritySeason * WEEKS_PER_YEAR),
    eventsByTrack,
    finalPrizeCents: world.careerTotals.prizeCents,
    everPaid: world.careerTotals.prizeCents > 0,
  }
}

// -------------------------------------------------------------------------------------------------
// ARM 3 – the round-26 defect, reproduced, and the guard required to catch it
// -------------------------------------------------------------------------------------------------
/** A hand-rolled week loop that TICKS AND READS BEFORE `skipTournament` – the exact arrangement
 *  `pro-season-probe.ts:388` records as three waves of missing onsets. It is deliberately NOT
 *  `stepCareerWeek`: the point is to build the broken order and watch ARM 1 catch it. Returns true
 *  when the guard fired. */
function proveArm(): boolean {
  const { world, rng } = openCareer(PRESETS[8], 0, POLICY)
  for (let w = 0; w < 6 * WEEKS_PER_YEAR && world.ending === null; w++) {
    for (const e of world.season) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek) continue
      if (e.deadlineWeek - world.week > 3) continue
      if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
      if (entryStatus(world, e).level === 'blocked') continue
      if (world.fundsCents < TIERS[e.tier].entryFeeCents * 2) continue
      enterEvent(world, e.id)
      break
    }
    tickWeek(world, rng)
    // ⚠⚠ THE DEFECT, ON PURPOSE. `finalizeTournament` has NOT run – it is opened by
    // `skipTournament`, three lines down – so `bestFinishByTier` is still yesterday's answer while
    // the result itself is sitting right there on `pendingTournament`.
    const pending = world.pendingTournament
    if (pending !== null) {
      const tier = world.season.find((e) => e.id === pending.eventId)?.tier ?? null
      const stale = tier === null ? 'n/a' : String(world.bestFinishByTier[tier])
      console.log(
        `  the leaky read, week ${world.week}: pendingTournament=${pending.eventId} ` +
          `(finished=${pending.finished}, tier=${tier ?? '?'}) but bestFinishByTier[${tier ?? '?'}]` +
          ` = ${stale} – the play ledger has not been written yet.`,
      )
      try {
        assertResolved(world, 'proveArm')
      } catch (err) {
        console.log(`  ARM 1 FIRED: ${(err as Error).message.split(' – ')[0]}`)
        return true
      }
      console.log('  ⚠⚠ ARM 1 DID NOT FIRE on a world that is provably mid-reveal.')
      return false
    }
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  console.log('  ⚠⚠ ARM 3 never reached a pending tournament – the proof is inconclusive.')
  return false
}

// -------------------------------------------------------------------------------------------------
// statistics
// -------------------------------------------------------------------------------------------------
function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const pos = (s.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return s[lo]
  return s[lo] * (hi - pos) + s[hi] * (pos - lo)
}
const meanOf = (xs: number[]): number => (xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length)
const f1 = (x: number): string => (Number.isFinite(x) ? x.toFixed(1) : '  – ')
const f2 = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : '  – ')
const pct = (n: number, d: number): string => (d === 0 ? '  – ' : `${((100 * n) / d).toFixed(1)}%`)
const usd = (cents: number): string =>
  Number.isFinite(cents) ? `$${Math.round(cents / 100).toLocaleString('en-US')}` : '–'
/** Wilson 95% interval – a share of 3-6% on a few hundred runs needs its interval printed beside it
 *  or the reader cannot tell a measurement from a coincidence. */
function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [NaN, NaN]
  const z = 1.96
  const p = k / n
  const d = 1 + (z * z) / n
  const centre = p + (z * z) / (2 * n)
  const half = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return [Math.max(0, (centre - half) / d), Math.min(1, (centre + half) / d)]
}
function shareLine(label: string, k: number, n: number, target: string): string {
  const [lo, hi] = wilson(k, n)
  return `${label.padEnd(38)} ${pct(k, n).padStart(7)}  [${(100 * lo).toFixed(1)}-${(100 * hi).toFixed(1)}%]  n=${String(k).padStart(4)}/${n}   target ${target}`
}
function dist(label: string, xs: number[], unit: (x: number) => string = f1): string {
  if (xs.length === 0) return `${label.padEnd(38)}   – (n=0)`
  const s = [...xs].sort((a, b) => a - b)
  return (
    `${label.padEnd(38)} n=${String(s.length).padStart(4)}  min ${unit(s[0])}  p25 ${unit(quantile(s, 0.25))}` +
    `  med ${unit(quantile(s, 0.5))}  p75 ${unit(quantile(s, 0.75))}  p90 ${unit(quantile(s, 0.9))}  max ${unit(s[s.length - 1])}  mean ${unit(meanOf(s))}`
  )
}

// -------------------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------------------
/** THE CORPUS, and why this size. The outcome anchor's tightest row is "top-100 analog 3-6%". At
 *  p = 0.045 a Wilson interval narrower than about +-1.5 points needs n in the high hundreds –
 *  9 presets x 100 seeds = 900 careers puts the half-width near 1.4 points, which is the smallest
 *  corpus on which "inside 3-6%" and "outside it" are distinguishable at all. Anything around the
 *  160 careers `ladder-vs-targets.ts` ran carries a half-width of ~3 points on that row and cannot
 *  answer the question it is quoted for. Every share below therefore prints its interval. */
function main(): void {
  console.log(`\ngrowth-pace-probe – the owner's «а не слишком ли быстро растут наши спортсменки?», measured`)
  console.log(
    `  ${PRESETS.length} presets x ${SEEDS} seeds = ${PRESETS.length * SEEDS} full careers, ` +
      `14 -> ${FULL_CAREER_AGE_YEARS} (${FULL_CAREER_WEEKS} weeks max), policy '${POLICY.label}'`,
  )
  console.log(`  fork answered 'continue', every retirement offer refused, bankruptcy NOT defused.`)
  console.log(
    `  potentialBand [${BAND[0]}, ${BAND[1]}]` +
      `${BAND_IS_SHIPPED ? ' – AS SHIPPED' : ` – OVERRIDDEN (shipped is [${SHIPPED_BAND[0]}, ${SHIPPED_BAND[1]}])`}` +
      `  mean ${((BAND[0] + BAND[1]) / 2).toFixed(1)} · width ${(BAND[1] - BAND[0]).toFixed(1)}` +
      ` · sd of her mean-of-five ceiling ${((BAND[1] - BAND[0]) / Math.sqrt(60)).toFixed(2)}`,
  )

  if (PROVE_ARM) {
    console.log(`\n=== ARM 3 – the round-26 read-order defect, reproduced on purpose ===`)
    const fired = proveArm()
    if (!fired) {
      console.log(`\n⚠⚠ THE INSTRUMENT'S OWN GUARD IS A NULL ARM. Nothing below can be believed.`)
      process.exitCode = 1
      return
    }
    console.log(`  ARM 3 passed: the guard catches the broken read order.`)
    // ⚠⚠ AND IT STOPS HERE, IN ITS OWN PROCESS, WHICH IS ALSO A MEASURED CORRECTION. The first
    // version ran the proof and then the corpus, and the two INTERFERED: the same run with and
    // without `--proveArm` disagreed (median career-best rank #13 vs #14, mean first-top-100 19.9 vs
    // 19.5, max 23.4 vs 22.3), because
    // the proof opens `bench-wealthy-0` – a career the corpus then opens again – and the engine's
    // per-season memos are process-global. An arm that changes the measurement it is vouching for
    // is not a control. Run it as its own command; the corpus run must not carry the flag.
    console.log(`  (the corpus is NOT run in this process – see the note at this line.)\n`)
    return
  }

  const t0 = Date.now()
  const careers: Career[] = []
  for (const preset of PRESETS) {
    for (let i = 0; i < SEEDS; i++) careers.push(runCareer(preset.label, preset, i, POLICY))
  }
  const secs = (Date.now() - t0) / 1000
  const all = careers.length
  const horizon = careers.filter((c) => c.reachedHorizon)
  const H = horizon.length

  console.log(`\n  ${all} careers in ${secs.toFixed(0)}s. Reached the horizon: ${H} (${pct(H, all)}).`)
  const endings = new Map<string, number>()
  for (const c of careers) endings.set(c.ending ?? 'ran out of horizon', (endings.get(c.ending ?? 'ran out of horizon') ?? 0) + 1)
  console.log(
    `  endings: ${[...endings.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
  )

  // ---- §1 THE PACE ANCHOR -------------------------------------------------------------------
  console.log(`\n=== §1 AGE AT FIRST TOP-100 – against development.ts:10-11's own ~17-18 + 4.5yrs = ~22 ===`)
  const t100 = careers.map((c) => c.ageFirstTop100).filter((x): x is number => x !== null)
  const t250 = careers.map((c) => c.ageFirstTop250).filter((x): x is number => x !== null)
  console.log(dist('age at first top-100', t100))
  console.log(dist('age at first top-250', t250))
  console.log(dist('age at her career-best rank', careers.map((c) => c.ageBestWta).filter((x): x is number => x !== null)))
  console.log(dist('career-best rank', careers.map((c) => c.bestWta).filter((x): x is number => x !== null), (x) => `#${Math.round(x)}`))
  if (t100.length > 0) {
    const med = quantile(t100, 0.5)
    console.log(
      `\n  ⇒ median first top-100 at ${f2(med)}. The anchor is ~22.0, so the pace is ` +
        `${f2(22 - med)} years EARLY (negative = late).`,
    )
  }
  console.log(`  histogram, age at first top-100:`)
  for (let a = 14; a <= 30; a++) {
    const n = t100.filter((x) => Math.floor(x) === a).length
    if (n === 0 && a > 26) continue
    console.log(`    ${a}  ${'#'.repeat(Math.round((60 * n) / Math.max(1, t100.length)))} ${n}`)
  }

  // ---- §2 THE OUTCOME ANCHOR ----------------------------------------------------------------
  console.log(`\n=== §2 THE LADDER AGAINST career-outcome-targets.md (26.07) – both bases ===`)
  const rung = (hit: (c: Career) => boolean, label: string, target: string): void => {
    const kH = horizon.filter(hit).length
    const kA = careers.filter(hit).length
    console.log(`  of horizon   ${shareLine(label, kH, H, target)}`)
    console.log(`  of all       ${shareLine(label, kA, all, '–')}`)
  }
  rung((c) => c.eventsByTrack.wta > 0, 'saw the pro contour (any W event)', '50-65%')
  rung((c) => c.bestWta !== null && c.bestWta <= 250, 'lives from tennis (top-250)', '15-25%')
  rung((c) => c.bestWta !== null && c.bestWta <= 100, 'a real star (top-100)', '3-6%')
  rung((c) => c.firstPlayAge.slam !== undefined, 'Slam-level A – PLAYED a Slam draw', '<1%')
  rung((c) => (c.firstPlayAge.slam !== undefined) && (c.bestWta ?? 9999) <= 50, 'Slam-level B – played one AND top-50', '<1%')
  console.log(`  (bankruptcy 14→18, the page's own first row: ${pct(careers.filter((c) => c.bankrupt && c.weeks <= 4 * WEEKS_PER_YEAR).length, all)} of all starts – target is 20-40% failing)`)

  // ---- §3 THE NUMBER HE IS LOOKING AT --------------------------------------------------------
  console.log(`\n=== §3 WORLD RANK AT EXACTLY EIGHTEEN – the number on his screen ===`)
  const at18 = careers.map((c) => c.at18).filter((s): s is Snap => s !== null)
  const ranked18 = at18.map((s) => s.rank).filter((x): x is number => x !== null)
  console.log(`  careers still running at 18: ${at18.length}/${all}; holding a PAID professional rank: ${ranked18.length} (${pct(ranked18.length, at18.length)})`)
  console.log(dist('rank at 18 (paid rank only)', ranked18, (x) => `#${Math.round(x)}`))
  console.log(`  of the ${at18.length} alive at 18: top-100 ${pct(ranked18.filter((r) => r <= 100).length, at18.length)} · top-250 ${pct(ranked18.filter((r) => r <= 250).length, at18.length)} · top-500 ${pct(ranked18.filter((r) => r <= 500).length, at18.length)}`)
  const at19 = careers.map((c) => c.at19).filter((s): s is Snap => s !== null)
  const ranked19 = at19.map((s) => s.rank).filter((x): x is number => x !== null)
  console.log(`  careers still running at 19: ${at19.length}/${all}; holding a PAID professional rank: ${ranked19.length} (${pct(ranked19.length, at19.length)})`)
  console.log(dist('rank at 19 (paid rank only)', ranked19, (x) => `#${Math.round(x)}`))
  console.log(`  of the ${at19.length} alive at 19: top-100 ${pct(ranked19.filter((r) => r <= 100).length, at19.length)} · top-250 ${pct(ranked19.filter((r) => r <= 250).length, at19.length)} · top-500 ${pct(ranked19.filter((r) => r <= 500).length, at19.length)}`)
  console.log(dist('size of the professional table at 18', at18.map((s) => s.tableSize), (x) => String(Math.round(x))))

  // ---- §4 WHAT SHE WAS ENTERING --------------------------------------------------------------
  console.log(`\n=== §4 AGE AT FIRST MAIN DRAW, BY RUNG – «играла уже на 500 и шлемах» ===`)
  console.log(`  (the PLAY ledger: bestFinishByTier's first key, written by finalizeTournament)`)
  for (const t of TIER_LADDER) {
    const ages = careers.map((c) => c.firstPlayAge[t]).filter((x): x is number => x !== undefined)
    if (ages.length === 0) {
      console.log(`    ${t.padEnd(8)} never played by anybody (n=0/${all})`)
      continue
    }
    console.log(`    ${t.padEnd(8)} ${pct(ages.length, all).padStart(7)} of careers · ${dist('', ages).trim()}`)
  }
  const first500 = careers
    .map((c) => {
      const ages = W500_AND_UP.map((t) => c.firstPlayAge[t]).filter((x): x is number => x !== undefined)
      return ages.length === 0 ? null : Math.min(...ages)
    })
    .filter((x): x is number => x !== null)
  console.log(`\n${dist('age at first W500-or-above draw', first500)}`)
  console.log(`  share ever playing W500+: ${pct(first500.length, all)} of all starts`)
  const firstSlam = careers.map((c) => c.firstPlayAge.slam).filter((x): x is number => x !== undefined)
  console.log(dist('age at first SLAM main draw', firstSlam))
  console.log(`  under nineteen at her first W500+: ${pct(first500.filter((a) => a < 19).length, Math.max(1, first500.length))} of those who got there`)

  // ---- §5 THE MONEY --------------------------------------------------------------------------
  console.log(`\n=== §5 BANKED AT 18 AND 19 – he saw «600к+» ===`)
  for (const [label, snaps] of [
    ['at 18', careers.map((c) => c.at18).filter((s): s is Snap => s !== null)],
    ['at 19', careers.map((c) => c.at19).filter((s): s is Snap => s !== null)],
  ] as const) {
    console.log(`  ${label} (n=${snaps.length})`)
    console.log(`    ${dist('family balance', snaps.map((s) => s.fundsCents), usd)}`)
    console.log(`    ${dist('her own account', snaps.map((s) => s.kidFundsCents), usd)}`)
    console.log(`    ${dist('career prize money', snaps.map((s) => s.prizeCents), usd)}`)
    const over = (xs: number[]): string => pct(xs.filter((x) => x >= 600_000_00).length, xs.length)
    console.log(
      `    at or over $600,000: family ${over(snaps.map((s) => s.fundsCents))} · hers ${over(snaps.map((s) => s.kidFundsCents))} · prize ${over(snaps.map((s) => s.prizeCents))}`,
    )
  }

  // ---- §6 HOW MANY JUNIOR SEASONS ------------------------------------------------------------
  console.log(`\n=== §6 HOW MANY JUNIOR SEASONS A CAREER ACTUALLY GETS – «всего 1 или 2 сезона» ===`)
  console.log(dist('junior-majority seasons (by matches)', careers.map((c) => c.juniorSeasonsByMatches), (x) => x.toFixed(1)))
  console.log(dist('junior-majority seasons (by events)', careers.map((c) => c.juniorSeasonsByEvents), (x) => x.toFixed(1)))
  console.log(dist('non-pro-majority seasons (dom+jnr)', careers.map((c) => c.amateurSeasonsByMatches), (x) => x.toFixed(1)))
  const counts = new Map<number, number>()
  for (const c of careers) counts.set(c.juniorSeasonsByMatches, (counts.get(c.juniorSeasonsByMatches) ?? 0) + 1)
  console.log(`  junior seasons, by matches – the whole distribution:`)
  for (const [k, v] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`    ${String(k).padStart(2)} season(s)  ${'#'.repeat(Math.round((60 * v) / all))} ${v}  (${pct(v, all)})`)
  }
  const takeover = careers.map((c) => c.ageProTakeover).filter((x): x is number => x !== null)
  console.log(dist('age when the pro rungs take the majority', takeover))
  console.log(
    `  first J-tour entry: ${dist('', careers.map((c) => { const js = (['j30','j60','j300'] as TierId[]).map((t) => c.firstEntryAge[t]).filter((x): x is number => x !== undefined); return js.length ? Math.min(...js) : NaN }).filter((x) => Number.isFinite(x))).trim()}`,
  )
  console.log(
    `  first W-tour entry: ${dist('', careers.map((c) => { const ws = TIER_LADDER.filter((t) => TIERS[t].track === 'wta').map((t) => c.firstEntryAge[t]).filter((x): x is number => x !== undefined); return ws.length ? Math.min(...ws) : NaN }).filter((x) => Number.isFinite(x))).trim()}`,
  )
  console.log(dist('events per career, junior track', careers.map((c) => c.eventsByTrack.itf), (x) => x.toFixed(1)))
  console.log(dist('events per career, pro track', careers.map((c) => c.eventsByTrack.wta), (x) => x.toFixed(1)))

  // ---- per cell ------------------------------------------------------------------------------
  console.log(`\n=== §7 PER PRESET – is any of this a wealth artefact? ===`)
  console.log(`  cell                              n  top100%  medFirst100  rank@18  jnrSeasons  first500`)
  for (const p of PRESETS) {
    const rows = careers.filter((c) => c.cell === p.label)
    const k = rows.filter((c) => c.bestWta !== null && c.bestWta <= 100).length
    const a100 = rows.map((c) => c.ageFirstTop100).filter((x): x is number => x !== null)
    const r18 = rows.map((c) => c.at18?.rank ?? null).filter((x): x is number => x !== null)
    const f5 = rows
      .map((c) => {
        const ages = W500_AND_UP.map((t) => c.firstPlayAge[t]).filter((x): x is number => x !== undefined)
        return ages.length === 0 ? null : Math.min(...ages)
      })
      .filter((x): x is number => x !== null)
    console.log(
      `  ${p.label.padEnd(30)} ${String(rows.length).padStart(4)}  ${pct(k, rows.length).padStart(6)}` +
        `  ${f2(quantile(a100, 0.5)).padStart(11)}  ${(r18.length ? `#${Math.round(quantile(r18, 0.5))}` : '–').padStart(7)}` +
        `  ${f1(meanOf(rows.map((c) => c.juniorSeasonsByMatches))).padStart(10)}  ${f2(quantile(f5, 0.5)).padStart(8)}`,
    )
  }

  // ---- §8 THE ONE THAT DECIDES pace-versus-field ---------------------------------------------
  // college-the-last-mile-2026-08.md §3 concludes «the field is too strong» from a comparison of
  // COLLEGE_LEAGUE.field against the professional pyramid. That comparison has a THIRD term nobody
  // put in it: how strong OUR NINETEEN-YEAR-OLD actually is. A field is only too strong relative to
  // the population that plays it, and this is the population.
  const { standard, spread } = COLLEGE_LEAGUE.field
  const fieldLo = standard - spread
  const fieldHi = standard + spread
  console.log(`\n=== §8 HER OWN LEVEL AT THE COLLEGE DOOR, against the field she would meet ===`)
  console.log(
    `  COLLEGE_LEAGUE.field = { standard: ${standard}, spread: ${spread} } -> every opponent attribute uniform ${fieldLo}-${fieldHi}`,
  )
  console.log(`  the shipped professional pyramid (fieldPros.FIELD.tiers, core = the same power() mean):`)
  let seen = 0
  for (const t of FIELD.tiers) {
    console.log(
      `    ${t.id.padEnd(11)} ${String(t.count).padStart(4)} rows (world #${seen + 1}-#${seen + t.count})   core ${t.core[0]}-${t.core[1]}`,
    )
    seen += t.count
  }
  console.log(dist('age at 90% of her own ceiling', careers.map((c) => c.ageAt90Ceiling).filter((x): x is number => x !== null)))
  console.log(dist('age at 95% of her own ceiling', careers.map((c) => c.ageAt95Ceiling).filter((x): x is number => x !== null)))
  console.log(`  reached 90% of ceiling at all: ${pct(careers.filter((c) => c.ageAt90Ceiling !== null).length, all)} · 95%: ${pct(careers.filter((c) => c.ageAt95Ceiling !== null).length, all)}`)
  for (const [label, snaps] of [
    ['at 18', careers.map((c) => c.at18).filter((s): s is Snap => s !== null)],
    ['at 19', careers.map((c) => c.at19).filter((s): s is Snap => s !== null)],
  ] as const) {
    const means = snaps.map((s) => s.skillMean)
    console.log(`  ${label}: ${dist('her power() mean', means, f1).trim()}`)
    console.log(`    ${dist('share of her own ceiling spent', snaps.map((s) => 100 * s.ceilingShare), (x) => `${x.toFixed(1)}%`).trim()}`)
    console.log(`    ${dist('her rolled ceiling (potential mean)', snaps.map((s) => s.potentialMean), f1).trim()}`)
    console.log(
      `    above the college field's CENTRE (${standard}): ${pct(means.filter((m) => m > standard).length, means.length)}` +
        ` · above its TOP (${fieldHi}): ${pct(means.filter((m) => m > fieldHi).length, means.length)}`,
    )
  }

  // ---- ⭐ ONE MACHINE-READABLE ROW, so a sweep of processes can be assembled without re-parsing
  // eighty lines of prose per arm. Every field is already printed above; nothing new is computed
  // except the arithmetic of the band itself.
  const share_ = (k: number, n: number): string => (n === 0 ? 'NA' : ((100 * k) / n).toFixed(1))
  const q = (xs: number[], p: number): string => (xs.length === 0 ? 'NA' : quantile(xs, p).toFixed(2))
  const s18 = careers.map((c) => c.at18).filter((s): s is Snap => s !== null)
  const s19 = careers.map((c) => c.at19).filter((s): s is Snap => s !== null)
  const r19 = s19.map((s) => s.rank).filter((x): x is number => x !== null)
  const bestRanks = careers.map((c) => c.bestWta).filter((x): x is number => x !== null)
  const row: Record<string, string> = {
    band: `${BAND[0]}-${BAND[1]}`,
    bandMean: ((BAND[0] + BAND[1]) / 2).toFixed(1),
    bandWidth: (BAND[1] - BAND[0]).toFixed(1),
    policy: POLICY.id === 'player' && POLICY.label.startsWith('july') ? 'july' : POLICY.id,
    n: String(all),
    horizon: String(H),
    top100H: share_(horizon.filter((c) => (c.bestWta ?? 9999) <= 100).length, H),
    top100All: share_(careers.filter((c) => (c.bestWta ?? 9999) <= 100).length, all),
    top250H: share_(horizon.filter((c) => (c.bestWta ?? 9999) <= 250).length, H),
    top250All: share_(careers.filter((c) => (c.bestWta ?? 9999) <= 250).length, all),
    proH: share_(horizon.filter((c) => c.eventsByTrack.wta > 0).length, H),
    slamH: share_(horizon.filter((c) => c.firstPlayAge.slam !== undefined).length, H),
    bankrupt: String(careers.filter((c) => c.bankrupt).length),
    // ⚠ RANK MEDIANS ARE OVER THE CAREERS THAT HELD A PAID RANK AT ALL. `everPaidPct` beside it is
    // what stops that being a survivorship read: a band that pays fewer careers moves both.
    medBestRank: q(bestRanks, 0.5),
    nRanked: String(bestRanks.length),
    everPaidPct: share_(careers.filter((c) => c.everPaid).length, all),
    medFirstTop100: q(careers.map((c) => c.ageFirstTop100).filter((x): x is number => x !== null), 0.5),
    nFirstTop100: String(careers.filter((c) => c.ageFirstTop100 !== null).length),
    medRank19: r19.length === 0 ? 'NA' : quantile(r19, 0.5).toFixed(0),
    medPower19: q(s19.map((s) => s.skillMean), 0.5),
    medCeiling19: q(s19.map((s) => s.potentialMean), 0.5),
    medCeilShare18: q(s18.map((s) => 100 * s.ceilingShare), 0.5),
    medAge90Ceiling: q(careers.map((c) => c.ageAt90Ceiling).filter((x): x is number => x !== null), 0.5),
    medJnrSeasons: q(careers.map((c) => c.juniorSeasonsByMatches), 0.5),
    medFirst500: q(
      careers
        .map((c) => {
          const ages = W500_AND_UP.map((t) => c.firstPlayAge[t]).filter((x): x is number => x !== undefined)
          return ages.length === 0 ? null : Math.min(...ages)
        })
        .filter((x): x is number => x !== null),
      0.5,
    ),
    medPrize19: q(s19.map((s) => s.prizeCents / 100), 0.5),
    medPrizeFinal: q(careers.map((c) => c.finalPrizeCents / 100), 0.5),
    medFunds19: q(s19.map((s) => s.fundsCents / 100), 0.5),
    aboveCollegeCentre19: share_(s19.filter((s) => s.skillMean > standard).length, s19.length),
    aboveCollegeTop19: share_(s19.filter((s) => s.skillMean > fieldHi).length, s19.length),
  }
  console.log(`\nRESULT\t${Object.entries(row).map(([k, v]) => `${k}=${v}`).join('\t')}`)

  console.log('')
}

// ⚠⚠ UNCONDITIONAL, AND THAT IS THE OPPOSITE OF WHAT econ-bench.ts AND endings-bench.ts DO – for
// the reason their own comments give. vite-node 3.2.4 strips the ENTRY FILE from `process.argv`, so
// their `argv.some(a => a.includes('econ-bench'))` guard is false on a bare
// `npx vite-node tools/<file>.ts` and they print nothing and exit 0. Those two survive it because
// they are reached through `npm run bench:econ`, where `npm_lifecycle_script` still carries the
// name; this file has no package script, and the first run of it reproduced their bug exactly –
// empty output, exit 0, "a bench that reports nothing and succeeds is worse than one that crashes".
//
// The NAME check exists in those files to stop an IMPORTER triggering their sweep. Nothing imports
// this one – it is a leaf probe – so the guard has nothing to protect and only a way to fail. The
// `VITEST` clause stays: a test that ever imports this file must not run a 900-career corpus.
//
// ⚠ AND THIS FILE MUST NEVER BE RUN WITH `TB_BENCH_RUN=1`. It imports both of the benches above, and
// that variable is their manual autorun override: setting it starts the econ sweep and the endings
// sweep before a single line of this probe executes.
if (!process.env.VITEST) {
  main()
}
