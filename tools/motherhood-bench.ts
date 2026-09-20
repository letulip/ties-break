// THE MOTHERHOOD BENCH – wave 8 T9 (`docs/specs/the-motherhood-2026-09.md`).
//
//   npx vite-node tools/motherhood-bench.ts                  (3 backgrounds x 56 seeds = 168 careers)
//   npx vite-node tools/motherhood-bench.ts -- --seeds 8     (a fast look)
//   npx vite-node tools/motherhood-bench.ts -- --only indep   (section 1 alone)
//
// ⚠⚠ EVERY `ECONOMY.motherhood` NUMBER IS A DRAFT AND THIS FILE IS WHAT THE OWNER'S RULINGS LAND ON
// (the brief's §4 contract: «his word lands on numbers, not on a blank»). The bench MEASURES; the
// corridors are the spec's to argue; ⚠ **NO ENGINE FILE IS TOUCHED BY THIS TASK** – a number that
// comes out wrong is a FINDING and the fix is somebody else's commit. The exit code is non-zero only
// on a section-1 divergence or a crash.
//
// WHAT IT PRINTS, section by section (the spec's own numbering, and the brief's):
//    (1)  INPUT-INDEPENDENCE, FIRST because it is the wave's LAW rather than a tuning – eager-vs-drain
//         on identical MAIN sequences, on the shipped tree and on a control tree. ⚠ IF IT FAILS,
//         NOTHING BELOW MEANS ANYTHING.
//    (2)  the census – share of latched careers reaching a pregnancy by 35.
//    (3)  the age distribution against 24–35, and the per-temperament hazard.
//    (4)  the mid-term ending share – pregnancies whose carrying episode dies before the birth.
//    (5)  the decision – share who return, BY `support` GRADE, on paired arms.
//    (6)  the comeback – rank at the pause against rank +12 months, small-first vs straight-back.
//    (7)  the protected rank – entries it actually buys, and how often it expires unused.
//    (8)  the ranking decay during the absence – MEASURED, not built (it happens by construction).
//    (9)  sponsors – T7's measurement, re-stated with its provenance. No run of this file's own.
//   (10)  the postpartum shock – recovery weeks by `support`, psychologist on and off.
//   (11)  ⚠⚠ THE PLAY-ON ANOMALY T7 HANDED OVER – 46 event-weeks against a twin's 88 across the eight
//         weeks she is supposed to be playing on. An INVESTIGATION, and the cause is named.
//
// ⚠⚠ THE WALK IS THE PROVEN RECIPE AND NOT A NEW ONE (round 44's lesson, four probes dead on bare
// `tickWeek`): `openCareer` + `stepCareerWeek`, the fork continued, the birthday answered neutrally,
// retirement refused until final, every blocking life beat drained through `tools/_lifeBeats`'
// registry. ⚠ THIS WAVE HAS FOUR BLOCKING BEATS and a walker that answered none of them would stall.
//
// ⚠⚠ AND THE DRAIN DECIDES TWO ARMS FOR ANY BENCH THAT DOES NOT SAY OTHERWISE, which is why this file
// FORKS at both of them instead of accepting them: `DRAIN_ANSWER['expecting']` is `worry`, so a
// drained walk carries a **`measured`** grade and nothing else, and `DRAIN_ANSWER['return-plan']` is
// `small-first`, so a drained walk is the SMALL-FIRST comeback and nothing else. A bench that measured
// «the decision by grade» or «the two ramps» off a drained walk would be measuring one cell of each
// table and reporting it as the table. Sections 5, 6 and 10 therefore clone the world AT the card and
// answer it every way; sections 2, 3, 4, 7, 8 and 11 read the drained base walk and say so.
//
// ⚠ ONE PRESET PER BACKGROUND, the wedding bench's own default and two-doors' `--spread` trap
// inherited whole: `openCareer` seeds as `bench-${background}-${index}`, so nine presets would
// collapse onto three seed families. Careers and distinct seeds are the same number here.
//
// ⚠ RNG: careers advance on `resumeMain(world.rngMain)` – the shipped game's own resumption, and the
// thing section 1 asserts about. ⚠ AND EVERY CLONE RESUMES ITS OWN COPY: `structuredClone` carries
// `rngMain: {s, n}`, so a forked arm continues the parent's stream from exactly where the fork
// happened rather than restarting it. Nothing in this file draws on any stream of its own.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, median, type Preset, type Policy } from './econ-bench'
import { drainLifeBeatsTallied, drainCostOf, emptyDrainCounts, drainSkewLine, DRAIN_ANSWER } from './_lifeBeats'
import { answerBirthdayNeutral } from './_birthday'
import {
  answerFork,
  answerLifeBeat,
  answerRetirement,
  chooseGift,
  entryStatus,
  hirePsychologist,
  kidAgeExact,
  kidPoints,
  latchedEpisode,
  leavingViewOf,
  liveSoftBeat,
  loveEpisodesOf,
  pendingBirthday,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  pregnancyEligible,
  setPsychologistFocus,
  toSnapshot,
  LIFE_BEAT_OPTIONS,
  PREGNANCY_PAUSE_DETAIL,
  type WorldState,
} from '../src/engine/world'
// ⚠ `rankIn` IS NOT ON THE `engine/world` BARREL and is imported from the module that owns it, which
// is where `tests/wave8-return-ramp.test.ts` already takes its ladder reads from.
import { rankIn } from '../src/engine/world/ladder'
import { ECONOMY } from '../src/engine/economy'
import { resumeMain } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { WINDOW_BY_TRACK } from '../src/engine/season/ranking'
import type { Temperament } from '../src/engine/spirit'
import type { SeasonEvent } from '../src/engine/season/types'
import type { LifeBeatKind } from '../src/shared/protocol'
// ⚠ `PregnancyState` LIVES ON `world/state.ts` AND NOT ON THE WIRE – the record is engine-only, which
// is `ComebackState`'s own note one type down and is why this import does not come from `protocol`.
import type { PregnancyState } from '../src/engine/world/state'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const strArg = (name: string): string | null => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && typeof process.argv[at + 1] === 'string' ? process.argv[at + 1] : null
}

/** 56 x the three backgrounds = 168 careers, every one a distinct seed – the brief's «160+». */
const SEEDS = argOf('seeds', 56)
/** ⚠ LONGER THAN THE WEDDING BENCH'S 912 BY DESIGN, AND THE ARITHMETIC IS THE WINDOW'S – T7's own
 *  sizing, kept so the two instruments cut the same careers. The hazard's last live rung is 34–35,
 *  the pause opens `playsOnWeeks` (8) after the announcement and runs `termWeeks +
 *  decisionWeeksAfterBirth` (51), and section 6 then wants a FULL SEASON after that. A pregnancy
 *  announced at 34.9 needs (34.9 − 13.56) x 52 + 8 + 51 + 52 = 1221 weeks before its «year after»
 *  closes, so 1300 is that with a month in hand. */
const WALK_WEEKS = argOf('walk', 1300)
/** Section 6's horizon, and it is **T6's own 52** rather than a number chosen here: §D of
 *  `tests/wave8-return-ramp.test.ts` walked its eight careers twelve months from the return, so a
 *  bench that walked thirteen could not confirm or contradict it. */
const RAMP_WEEKS = argOf('ramp', 52)
/** Section 1's grid – how many seeds the independence arm searches before it gives up on finding one
 *  that actually reaches a pregnancy. ⚠ THE SEARCH IS THE POINT: an independence arm walked over a
 *  career that never conceives has not exercised ONE line this wave shipped, and would report
 *  «IDENTICAL» about a property nothing tested. */
const INDEP_SEARCH = argOf('indepSearch', 48)

const ONLY = strArg('only')
const wants = (section: string): boolean => ONLY === null || ONLY === section

const pad = (s: string, n: number): string => s.padEnd(n)
const padL = (s: string, n: number): string => s.padStart(n)
const pct = (n: number, d: number): string => (d === 0 ? '   –' : `${((100 * n) / d).toFixed(1)}%`)
const fix = (n: number, d = 1): string => (Number.isFinite(n) ? n.toFixed(d) : '–')

type Grade = NonNullable<PregnancyState['support']>
const GRADES: readonly Grade[] = ['warm', 'measured', 'cold']
/** ⚠ THE CARD'S OWN OPTION IDS, MAPPED TO THE GRADE EACH ONE PERSISTS – read off
 *  `LIFE_BEAT_OPTIONS['expecting']` rather than transcribed, because a bench that hard-coded the ids
 *  would silently fork three times onto the same answer the day one is renamed (`answerLifeBeat`
 *  refuses an unoffered id, so the failure would at least be loud – but it would be loud in the
 *  middle of a two-hour run). */
const GRADE_ANSWER: Record<Grade, string> = { warm: 'joy', measured: 'worry', cold: 'career-first' }
type Plan = 'small-first' | 'straight-back'
const PLANS: readonly Plan[] = ['small-first', 'straight-back']

// =================================================================================================
// THE RECORD ONE CAREER LEAVES
// =================================================================================================

/** ⭐ ONE PLAY-ON WEEK, AS THE ENTRY POLICY SAW IT – section 11's whole instrument. `considered` is
 *  every event the policy reached the veto with (i.e. past the ranking gate); `pauseRefused` is the
 *  subset the PAUSE turned away, identified by the gate's own refusal detail rather than by
 *  re-deriving the rule here. */
interface PlayOnWeek {
  /** Week index from `announcedWeek`. ⚠ **NEGATIVE FOR THE CONTROL WINDOW**: the observer opens
   *  `playsOnWeeks` weeks BEFORE the announcement, so the same career supplies its own before-and-
   *  after on the same calendar, the same standing and the same wallet. It is not T7's byte-paired
   *  twin – it does not hold the CALENDAR fixed, so an off-season stretch can land in one half and
   *  not the other – and it is reported as what it is: a within-career control that costs no second
   *  tree, beside T7's between-tree one. */
  k: number
  considered: number
  pauseRefused: number
  /** of `considered`, how many were for an event week at or after the pause – the structural half */
  afterPause: number
  entered: number
}

interface RampArm {
  plan: Plan
  points: number
  rank: number
  entered: number
  /** of `protectedRankEntries`, how many were spent inside the ramp window */
  spent: number
}

interface GradeArm {
  grade: Grade
  returned: boolean
  /** weeks from the birth until `spiritShock` cleared, psychologist standing down */
  recoveryOff: number | null
  /** ...and with a hired psychologist on the `'recovery'` focus */
  recoveryOn: number | null
}

interface MotherCareer {
  seed: string
  background: string
  temperament: Temperament
  endedType: string | null
  walkEndWeek: number
  endAge: number
  /** the week she turns 24 – the hazard's own first rung, so «eligible weeks» has a denominator */
  week24: number
  everLatched: boolean
  /** weeks `pregnancyEligible` would have answered true, counted post-tick – asked of the same four
   *  facts the engine asks, and re-derived here because the predicate is not on the barrel. */
  eligibleWeeks: number
  announcedWeek: number | null
  announceAge: number | null
  pausesWeek: number | null
  dueWeek: number | null
  bornWeek: number | null
  episodeId: string | null
  /** the week the carrying marriage ended, if it did – section 4's own number */
  episodeEndedWeek: number | null
  rankAtPause: number | null
  returnedWeek: number | null
  endedFamily: boolean
  /** ranking decay (section 8), sampled on the four weeks that matter */
  ptsAtAnnounce: number | null
  ptsAtPause: number | null
  ptsAtBirth: number | null
  ptsAtReturn: number | null
  rankAtAnnounce: number | null
  rankAtReturn: number | null
  /** section 7, over the WHOLE freeze horizon on the drained (small-first) base walk */
  freezeEntries: number | null
  freezeSpentByExpiry: number | null
  freezeExpiredUnused: boolean | null
  /** every week she committed to at least one event – section 11's control window is cut out of
   *  this, and the log is cheap: one number per booking week. */
  entryWeeks: number[]
  playOn: PlayOnWeek[]
  grades: GradeArm[]
  ramps: RampArm[]
  byKind: Record<LifeBeatKind, number>
}

// =================================================================================================
// THE WALK
// =================================================================================================

/** ⚠ THE TWO KINDS THIS FILE ANSWERS ITSELF. Everything else goes through the shared registry
 *  untouched; these two are the wave's own forks and the drain would quietly decide them. */
const FORKED: readonly LifeBeatKind[] = ['expecting', 'return-plan']

interface Hooks {
  expecting?: (world: WorldState) => void
  returnPlan?: (world: WorldState) => void
}

/** ⭐⭐ THE DRAIN, WITH THE TWO FORK POINTS VISIBLE. `drainLifeBeatsTallied(world, FORKED)` stops AT
 *  a forked kind with the row still waiting – that is what its `except` list is for, and
 *  `tools/spirit-bench.ts`' two arms are the standing precedent – so the hook sees the world exactly
 *  as it was when the card came up, and the answer this file then gives is byte-for-byte the one the
 *  registry would have given (`DRAIN_ANSWER`, priced through `drainCostOf` BEFORE it lands, the
 *  helper's own order). The tally therefore stays the shared arithmetic and `drainSkewLine` still
 *  states this walk's skew to the point. */
function drainWithHooks(world: WorldState, byKind: Record<LifeBeatKind, number>, hooks: Hooks): void {
  for (let guard = 0; guard < 50; guard++) {
    const t = drainLifeBeatsTallied(world, FORKED)
    for (const k of Object.keys(t.byKind) as LifeBeatKind[]) byKind[k] += t.byKind[k]
    const row = pendingLifeBeat(world)
    if (row === null) return
    if (row.kind === 'expecting') hooks.expecting?.(world)
    else if (row.kind === 'return-plan') hooks.returnPlan?.(world)
    else return
    drainCostOf(row.kind)
    answerLifeBeat(world, DRAIN_ANSWER[row.kind])
    byKind[row.kind]++
  }
  throw new Error('a life-beat queue that will not drain')
}

/** The questions a walked career answers on its way past them – `tools/wedding-bench.ts`' own list. */
function answerWhateverIsOpen(world: WorldState, byKind: Record<LifeBeatKind, number>, hooks: Hooks = {}): void {
  if (world.fork !== null && world.fork.answer === null) {
    drainWithHooks(world, byKind, hooks)
    answerFork(world, 'continue')
  }
  drainWithHooks(world, byKind, hooks)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  // ⚠ REFUSE EVERY RETIREMENT OFFER BUT THE LAST – the wedding bench's conservative arm, and this
  // file needs it more than that one did: a pregnancy window that opens at 24 and closes at 35 needs
  // the longest careers the game produces to be there when it opens.
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
}

/** Tick a clone one week with the same recipe the base walk uses, forks disabled (a clone is already
 *  inside the branch it was cloned for). */
function stepClone(world: WorldState, rng: () => number, policy: Policy, veto?: (w: WorldState, e: SeasonEvent) => boolean): void {
  stepCareerWeek(world, rng, policy, veto)
  if (world.ending === null) answerWhateverIsOpen(world, emptyDrainCounts())
}

// -------------------------------------------------------------------------------------------------
// FORK 1 – the `'expecting'` card: her decision by grade (5), and the recovery by grade (10)
// -------------------------------------------------------------------------------------------------

/** ⭐⭐⭐ THREE ARMS OFF ONE CARD, AND THE PAIRING IS EXACT RATHER THAN MERELY COMPARABLE. The decision
 *  draws ONE number on `seed:life:return:<week>` at `decisionWeekOf(pregnancy)`, and `support` moves
 *  neither the dates nor the key – so all three arms compare the SAME u against three different
 *  thresholds, and the difference between two grades is exactly the mass of u between them. That is
 *  why this is a fork and not three separate careers: three careers would measure the careers.
 *
 *  ⚠ THE ARMS DO DIVERGE ON `bond` (+2.5 / −0.5 / −4) AND THE DIVERGENCE IS REAL RATHER THAN
 *  INCIDENTAL – `returnChanceFor` reads `bond` as well as `support`, so the grade column below is the
 *  answer's TOTAL effect (the grade shift plus the bond it left), which is the honest reading of «the
 *  parent's answer» and the one the owner's word lands on. The two terms are separable on paper
 *  (0.15/0/−0.20 against 0.002 x Δbond ≈ +0.005/−0.001/−0.008) and are not separated here.
 *
 *  ⚠ AND THE RECOVERY IS FORKED AGAIN AT THE BIRTH, because the psychologist is a HIRE and not a
 *  grade: six cells, three grades x {he stands down, he works the `'recovery'` focus}. */
function forkAtExpecting(base: WorldState, policy: Policy): GradeArm[] {
  const arms: GradeArm[] = []
  for (const grade of GRADES) {
    const world = structuredClone(base)
    const rng = resumeMain(world.rngMain)
    const opts = pendingLifeBeatOptions(world)
    if (opts === null || !opts.some((o) => o.id === GRADE_ANSWER[grade])) {
      throw new Error(`the 'expecting' card does not offer «${GRADE_ANSWER[grade]}» – GRADE_ANSWER is stale`)
    }
    answerLifeBeat(world, GRADE_ANSWER[grade])
    const carried = world.pregnancy
    if (carried === null || carried.support !== grade) throw new Error(`«${GRADE_ANSWER[grade]}» did not persist ${grade}`)
    const arm: GradeArm = { grade, returned: false, recoveryOff: null, recoveryOn: null }
    const dueWeek = carried.dueWeek
    let recoveryForked = false
    for (let i = 0; i < 200; i++) {
      stepClone(world, rng, policy)
      // ⭐ THE RECOVERY FORK, TAKEN THE WEEK THE MARK LANDS. `landBirth` stamps
      // `spiritShock = { week, kind: 'postpartum' }` on `dueWeek`, and the magnitude has already been
      // scaled by the grade on that one week (`postpartumSupportScale`) – so a clone taken here
      // carries the grade's own blow and the two psychologist arms then differ only in the RETURN.
      if (!recoveryForked && world.spiritShock?.kind === 'postpartum') {
        recoveryForked = true
        arm.recoveryOff = recoveryWeeks(world, policy, false)
        arm.recoveryOn = recoveryWeeks(world, policy, true)
      }
      if (world.ending !== null) break
      // the record is cleared by `resolveReturnDecision` on BOTH arms – that is the week it resolved
      if (world.pregnancy === null && world.week > dueWeek) break
    }
    arm.returned = world.comeback !== null
    arms.push(arm)
  }
  return arms
}

/** ⭐⭐ HOW MANY WEEKS THE POSTPARTUM MARK STAYS ON HER – the measurement T4 made at the grade level
 *  with the psychologist OFF (3/4/5 steady, 8/11/13 intense, `ECONOMY.spirit.shock`'s own note), now
 *  asked of grown careers and of the seat BOTH ways.
 *
 *  ⚠ THE HIRE IS POSED AND NOT PLAYED, and the two commands are the engine's own: `hirePsychologist`
 *  then `setPsychologistFocus(world, 'recovery')`. A focus the seat refuses (the wrong season, an
 *  unready seat) leaves the arm honest rather than silently unfocused – the refusal is caught and the
 *  cell is reported as a null, never as «the psychologist did nothing».
 *
 *  ⚠ `psychologistWorksThisWeek` STANDS THE WORK DOWN on a college freeze and a booked family week
 *  (ruling J), so a cell that reads long is reading a week he was not paid for, which is the engine
 *  working rather than the bench failing. */
function recoveryWeeks(base: WorldState, policy: Policy, withPsychologist: boolean): number | null {
  const world = structuredClone(base)
  const rng = resumeMain(world.rngMain)
  if (withPsychologist) {
    try {
      hirePsychologist(world, true)
      setPsychologistFocus(world, 'recovery')
    } catch {
      return null
    }
    if (world.psychologistFocus !== 'recovery') return null
  }
  const from = world.week
  for (let i = 0; i < 80; i++) {
    stepClone(world, rng, policy)
    if (world.ending !== null) return null
    if (world.spiritShock === null) return world.week - from
  }
  return null
}

// -------------------------------------------------------------------------------------------------
// FORK 2 – the `'return-plan'` card: the two ramps (6), and what the freeze buys (7)
// -------------------------------------------------------------------------------------------------

/** ⭐⭐⭐ THE SMALL-FIRST VETO, AND IT IS THE **ENGINE'S OWN READING OF THE PLAN** RATHER THAN A TIER
 *  LIST INVENTED HERE. `entryVerdict` already labels the entry that parts from a stated small-first
 *  ramp (`EntryStatus.offReturnPlan`), and that label is computed from `onProtectedRank` – «the
 *  entries the freeze had to open». So the arm's booking policy is one line, no boundary is invented,
 *  and there is nothing to re-tune. ⚠ IT IS A VETO IN THE **BENCH** AND A LABEL IN THE ENGINE: the
 *  seam is a preference and not a lock (T6 §C), so a player CAN override it – this arm is the player
 *  who does not.
 *  ⚠ `straight-back` GETS NO VETO AT ALL, which is the asymmetry `offReturnPlan` itself carries: the
 *  answer that names no boundary excludes no rung. */
function offPlanVeto(world: WorldState, event: SeasonEvent): boolean {
  return entryStatus(world, event).offReturnPlan === true
}

function forkAtReturnPlan(base: WorldState, policy: Policy): RampArm[] {
  const arms: RampArm[] = []
  for (const plan of PLANS) {
    const world = structuredClone(base)
    const rng = resumeMain(world.rngMain)
    answerLifeBeat(world, plan)
    if (world.comeback?.returnPlan !== plan) throw new Error('the arm is not the arm')
    const before = world.comeback.protectedRank?.entriesLeft ?? 0
    let entered = 0
    for (let i = 0; i < RAMP_WEEKS; i++) {
      const got = stepCareerWeek(world, rng, policy, plan === 'small-first' ? offPlanVeto : undefined)
      if (Object.values(got).some((n) => n > 0)) entered++
      if (world.ending === null) answerWhateverIsOpen(world, emptyDrainCounts())
      if (world.ending !== null) break
    }
    arms.push({
      plan,
      points: kidPoints(world, 'wta'),
      rank: rankIn(world, 'wta'),
      entered,
      spent: before - (world.comeback?.protectedRank?.entriesLeft ?? 0),
    })
  }
  return arms
}

// =================================================================================================
// ONE CAREER
// =================================================================================================

function runCareer(preset: Preset, index: number, policy: Policy): MotherCareer {
  const { world } = openCareer(preset, index, policy)
  const rng = resumeMain(world.rngMain)
  const out: MotherCareer = {
    seed: world.seed,
    background: preset.background,
    temperament: leavingViewOf(world).temperament,
    endedType: null,
    walkEndWeek: 0,
    endAge: 0,
    week24: 0,
    everLatched: false,
    eligibleWeeks: 0,
    announcedWeek: null,
    announceAge: null,
    pausesWeek: null,
    dueWeek: null,
    bornWeek: null,
    episodeId: null,
    episodeEndedWeek: null,
    rankAtPause: null,
    returnedWeek: null,
    endedFamily: false,
    ptsAtAnnounce: null,
    ptsAtPause: null,
    ptsAtBirth: null,
    ptsAtReturn: null,
    rankAtAnnounce: null,
    rankAtReturn: null,
    freezeEntries: null,
    freezeSpentByExpiry: null,
    freezeExpiredUnused: null,
    entryWeeks: [],
    playOn: [],
    grades: [],
    ramps: [],
    byKind: emptyDrainCounts(),
  }
  let w24 = 0
  while (kidAgeExact(w24, world.profile.birthMonth, world.profile.birthDay) < 24) w24++
  out.week24 = w24

  // ⭐⭐ SECTION 11's INSTRUMENT, AND IT IS A **PURE OBSERVER WEARING THE VETO'S CLOTHES**. The veto
  // hook sits after the ranking gate and before affordability (`stepCareerWeek`'s own placement), so
  // it is handed exactly the events the entry policy is still considering – which is the population
  // the anomaly is about. It returns `false` always, so the base walk is byte-identical to a walk
  // with no veto at all; all it does is count, and only inside the eight play-on weeks.
  let playOnRow: PlayOnWeek | null = null
  const observe = (w: WorldState, e: SeasonEvent): boolean => {
    if (playOnRow === null) return false
    playOnRow.considered++
    if (w.pregnancy !== null && e.week >= w.pregnancy.pausesWeek) playOnRow.afterPause++
    const gate = entryStatus(w, e)
    // ⚠ IDENTIFIED BY THE GATE'S OWN REFUSAL DETAIL, never by re-deriving the rule: `entryVerdict`
    // returns `unavailable` for the pause AND for an exam week and a layoff, so the detail is what
    // tells the pause apart, and it is the engine's single spelling of that sentence.
    if (gate.level === 'blocked' && gate.detail === PREGNANCY_PAUSE_DETAIL) playOnRow.pauseRefused++
    return false
  }

  for (let i = 0; i < WALK_WEEKS; i++) {
    // --- the play-on row for the week that is about to be walked ---
    // ⚠ THE OBSERVER RUNS FORWARD FROM THE ANNOUNCEMENT ONLY – nothing before it knows a pregnancy is
    // coming. The CONTROL half of section 11 is cut out of `entryWeeks` instead, which every week
    // writes: an entry log costs one number per booking week and answers «how often did this same
    // career book, in the eight weeks BEFORE she said it» without a second pass.
    const p0 = world.pregnancy
    playOnRow =
      p0 !== null && world.week >= p0.announcedWeek && world.week < p0.pausesWeek
        ? { k: world.week - p0.announcedWeek, considered: 0, pauseRefused: 0, afterPause: 0, entered: 0 }
        : null
    const entered = stepCareerWeek(world, rng, policy, observe)
    const bookedThisWeek = Object.values(entered).some((n) => n > 0)
    if (bookedThisWeek) out.entryWeeks.push(world.week)
    if (playOnRow !== null) {
      playOnRow.entered = bookedThisWeek ? 1 : 0
      out.playOn.push(playOnRow)
      playOnRow = null
    }
    if (world.ending === null) {
      answerWhateverIsOpen(world, out.byKind, {
        expecting: (w) => {
          out.grades = forkAtExpecting(w, policy)
        },
        returnPlan: (w) => {
          out.ramps = forkAtReturnPlan(w, policy)
        },
      })
    }

    // --- the hooks, all pure reads ---
    // ⚠ THE ENGINE'S OWN GATE AND NEVER A SECOND SPELLING OF IT – `pregnancyEligible` is on the
    // `engine/world` barrel and is exactly «the four clauses, before any stream exists». A bench that
    // re-derived «latched, no pregnancy, no child, no knock» would be the two-spellings defect the
    // engine's own note argues against one layer down, and it would go stale on the week W5 lifts the
    // children clause.
    if (pregnancyEligible(world)) out.eligibleWeeks++
    if (latchedEpisode(world) !== null) out.everLatched = true
    const p = world.pregnancy
    if (p !== null && out.announcedWeek === null) {
      out.announcedWeek = p.announcedWeek
      out.announceAge = kidAgeExact(p.announcedWeek, world.profile.birthMonth, world.profile.birthDay)
      out.pausesWeek = p.pausesWeek
      out.dueWeek = p.dueWeek
      out.episodeId = p.episodeId
      out.ptsAtAnnounce = kidPoints(world, 'wta')
      out.rankAtAnnounce = rankIn(world, 'wta')
    }
    if (p !== null && p.rankAtPause !== null && out.rankAtPause === null) out.rankAtPause = p.rankAtPause
    if (out.pausesWeek !== null && out.ptsAtPause === null && world.week >= out.pausesWeek) {
      out.ptsAtPause = kidPoints(world, 'wta')
    }
    if (out.dueWeek !== null && out.ptsAtBirth === null && world.week >= out.dueWeek) out.ptsAtBirth = kidPoints(world, 'wta')
    const child = world.children[0]
    if (child !== undefined && out.bornWeek === null) out.bornWeek = child.bornWeek
    const c = world.comeback
    if (c !== null && out.returnedWeek === null) {
      out.returnedWeek = c.returnedWeek
      out.ptsAtReturn = kidPoints(world, 'wta')
      out.rankAtReturn = rankIn(world, 'wta')
      out.freezeEntries = c.protectedRank?.entriesLeft ?? null
    }
    // ⚠ SECTION 7 IS READ OFF THE **BASE** WALK, which is the drained `small-first` arm and says so at
    // the section. The freeze's horizon is 156 weeks – three times the ramp arms' window – so this is
    // the only reading in the file that can see an entitlement expire.
    if (c?.protectedRank != null && world.week >= c.protectedRank.validUntilWeek && out.freezeSpentByExpiry === null) {
      out.freezeSpentByExpiry = ECONOMY.motherhood.protectedRankEntries - c.protectedRank.entriesLeft
      out.freezeExpiredUnused = c.protectedRank.entriesLeft > 0
    }
    if (world.ending !== null) break
  }

  out.endedType = world.ending?.type ?? null
  out.endedFamily = world.ending?.type === 'family'
  out.walkEndWeek = world.week
  out.endAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  if (out.episodeId !== null) {
    const ep = loveEpisodesOf(world).find((e) => e.id === out.episodeId)
    out.episodeEndedWeek = ep?.endedWeek ?? null
  }
  return out
}

// =================================================================================================
// (1) INPUT-INDEPENDENCE – the law, before any number about pregnancy
// =================================================================================================
//
// Two walks of ONE seed under the SAME policy. The NEUTRAL arm answers only what blocks, with the
// drain registry's answers. The EAGER arm answers every blocking beat with a DIFFERENT priced option,
// answers every live soft row, and picks a different birthday gift. The MAIN stream's position must
// be IDENTICAL week by week – CLAUDE.md's invariant 2, «player choices may never re-roll the world's
// dice», and it is a FAIRNESS property rather than a nicety.
//
// ⚠⚠ AND WAVE 8 IS THE FIRST WAVE FOR WHICH THE WEDDING BENCH'S OWN JUSTIFICATION IS NO LONGER TRUE,
// which is stated here rather than discovered by whoever reads a red. Wave 7's (g) argued the law
// safe because «everything either arm may differ on moves `bond` and nothing else (§4a.2's law)». In
// this wave the `'expecting'` answer ALSO persists `support`, and BOTH `support` and `bond` are read
// by `returnChanceFor` – so two arms that answer that card differently can legitimately reach
// DIFFERENT DECISIONS off the same draw, and from that week on they are two different careers.
//
// ⚠ THAT IS NOT A RE-ROLL AND MUST NOT BE REPORTED AS ONE. The dice are identical: the same key is
// derived on the same week and returns the same u; what differs is the threshold u is compared
// against, which is the wave's entire design. So the arm below reports THREE things and never one:
//   · whether the MAIN position is identical over the whole walk;
//   · if it is not, the FIRST week it parts and what the two worlds' life state was there, so a
//     reader can tell «the world re-rolled» from «she decided differently»;
//   · and the unambiguous half, asserted on every career: answering a blocking beat takes ZERO MAIN
//     draws – `rngMain.n` before and after the answer.

function isWrapWeek(week: number): boolean {
  return week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS
}

function eagerDrain(world: WorldState, zeroDraw: { ok: boolean; at: number | null }): void {
  for (let guard = 0; guard < 200; guard++) {
    const row = pendingLifeBeat(world)
    if (row === null) return
    const opts = pendingLifeBeatOptions(world)
    if (opts === null) return
    const pick = opts.find((o) => o.id !== DRAIN_ANSWER[row.kind]) ?? opts[0]
    const before = world.rngMain.n
    answerLifeBeat(world, pick.id)
    if (world.rngMain.n !== before && zeroDraw.ok) {
      zeroDraw.ok = false
      zeroDraw.at = world.week
    }
  }
  throw new Error('the eager arm could not drain the queue')
}

function eagerAnswers(world: WorldState, zeroDraw: { ok: boolean; at: number | null }): void {
  if (world.fork !== null && world.fork.answer === null) {
    eagerDrain(world, zeroDraw)
    answerFork(world, 'continue')
  }
  eagerDrain(world, zeroDraw)
  if (pendingBirthday(world) !== null) {
    const prompt = toSnapshot(world).birthdayPrompt
    if (prompt) chooseGift(world, prompt.options[prompt.options.length - 1].id)
  }
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  // ...and the soft surface, answered rather than left: a different world from the neutral arm's in
  // exactly the way the law says must not matter.
  const soft = liveSoftBeat(world)
  if (soft !== null && pendingLifeBeat(world) === null) {
    const opts = LIFE_BEAT_OPTIONS[soft.kind]
    const pick = opts.find((o) => o.id !== DRAIN_ANSWER[soft.kind]) ?? opts[0]
    answerLifeBeat(world, pick.id)
  }
}

/** ⭐⭐⭐ THE ARM REPORTS **PER CHANNEL** AND NOT PER LINE, AND THAT IS THE ONE PLACE THIS FILE PARTS
 *  FROM `tools/wedding-bench.ts` SECTION (g) ON PURPOSE. Wave 7 compared one printed line per week and
 *  called any difference a P0, which was sound while «everything either arm may differ on moves `bond`
 *  and nothing else» held. It does not hold in wave 8 – the `'return-plan'` answer changes WHICH
 *  EVENTS she books, by design – so a whole-line comparison would report the wave's own headline
 *  feature as a violation of the law.
 *
 *  ⚠⚠ THE LAW IS ABOUT **MAIN** AND ABOUT NOTHING ELSE (CLAUDE.md invariant 2: «a no-action run and an
 *  action-laden run under the same code must tap identical MAIN sequences… player choices may never
 *  re-roll the world's dice»). So `main` is the verdict, and `funds` and `cond` are carried beside it
 *  as evidence a reader can weigh rather than as a second gate. A run where MAIN agrees and
 *  `condition` does not is a world where the same dice produced a different life, which is what a
 *  choice IS. */
interface Channel {
  name: string
  firstPart: number | null
  /** the two values at that week, for the reader */
  a: string
  b: string
}

interface IndepResult {
  seed: string
  weeks: number
  channels: Channel[]
  /** what the two arms' life state was at the first parting – «decided differently» or «re-rolled» */
  partReason: string
  reachedExpecting: boolean
  reachedReturnPlan: boolean
  zeroDraw: boolean
  zeroDrawAt: number | null
}

/** ⚠ `force` IS THE CONTROL TREE'S OWN PARAMETER AND IT IS NOT A CONVENIENCE. The search below
 *  rejects a seed whose neutral arm never raises an `'expecting'` card, which is right when hunting a
 *  NON-VACUOUS shipped arm and exactly wrong for the control: the control tree is the one with the
 *  hazard reverse-edited to 0, where NO seed can raise that card and the law must still hold. So the
 *  control run pins the shipped run's own seed (`--indepBg` / `--indepIndex`) and forces both walks.
 *  `reachedExpecting: false` is then the TRUE and expected reading of the control, not a failure. */
function independenceArm(preset: Preset, index: number, policy: Policy, weeks: number, force = false): IndepResult {
  const zeroDraw = { ok: true, at: null as number | null }
  const seen = { expecting: false, returnPlan: false }
  /** ⚠ FOUR CHANNELS, RECORDED SEPARATELY. `main` is the law; `season` is the world's own output on a
   *  wrap week; `funds` and `cond` are the two scalars wave 7's single printed line folded in with
   *  them, and folding them is what would have made this wave's own feature look like a violation. */
  const walk = (
    eager: boolean,
  ): { main: string[]; funds: string[]; cond: string[]; season: string[]; bond: string[]; spirit: string[]; states: string[] } => {
    const { world } = openCareer(preset, index, policy)
    const rng = resumeMain(world.rngMain)
    const main: string[] = []
    const funds: string[] = []
    const cond: string[] = []
    const season: string[] = []
    // ⚠ `bond` AND `spirit` ARE CARRIED AS CHANNELS OF THEIR OWN so that a drift in `condition` can be
    // ATTRIBUTED rather than described. Wave 7's law was «everything either arm may differ on moves
    // `bond` and nothing else», and the honest way to check whether that still holds is to watch the
    // chain in order: if `bond` parts, then `spirit`, then `condition`, the coupling is named; if
    // `condition` parts first, it is not this chain and the note says so.
    const bond: string[] = []
    const spirit: string[] = []
    const states: string[] = []
    const byKind = emptyDrainCounts()
    for (let i = 0; i < weeks; i++) {
      stepCareerWeek(world, rng, policy)
      if (world.ending === null) {
        const row = pendingLifeBeat(world)
        if (row?.kind === 'expecting') seen.expecting = true
        if (row?.kind === 'return-plan') seen.returnPlan = true
        // ⚠ THE ZERO-DRAW READ IS TAKEN ON THE **EAGER** ARM ONLY, and deliberately: it wraps each
        // `answerLifeBeat` individually, whereas the neutral arm answers through the shared drain,
        // where `answerFork` and the birthday ride in the same call and a moved `rngMain.n` could not
        // be attributed to a beat. One arm asserting it per answer is the stronger reading, and both
        // arms answer the same cards.
        if (eager) eagerAnswers(world, zeroDraw)
        else answerWhateverIsOpen(world, byKind)
      }
      main.push(`w${world.week} rng ${world.rngMain.s}/${world.rngMain.n}`)
      funds.push(String(world.fundsCents))
      cond.push(String(world.condition))
      if (isWrapWeek(world.week)) {
        const v = leavingViewOf(world)
        season.push(
          `season ${v.seasonIndex} pts ${v.points} rank ${v.endRank ?? '–'} prev ${v.prevPoints}/${v.prevEndRank ?? '–'} pro ${v.professional}`,
        )
      } else season.push('–')
      bond.push(String(world.bond))
      spirit.push(String(world.spirit))
      states.push(
        `preg ${world.pregnancy === null ? '–' : `${world.pregnancy.support ?? '?'}@${world.pregnancy.announcedWeek}`}` +
          ` kids ${world.children.length} comeback ${world.comeback === null ? '–' : world.comeback.returnPlan ?? '?'}` +
          ` end ${world.ending?.type ?? '–'} bond ${world.bond}`,
      )
      if (world.ending !== null) break
    }
    return { main, funds, cond, season, bond, spirit, states }
  }
  const a = walk(false)
  // ⚠ THE SEARCH PAYS FOR ONE WALK AND NOT TWO. A seed whose neutral arm never raises an
  // `'expecting'` card cannot exercise the wave's own beats in either arm, so the eager walk is not
  // run at all – the caller is looking for a seed that CAN carry the property, and a rejected seed
  // costs half of what it used to. ⚠ IT IS SOUND ONLY BECAUSE THE TWO ARMS ARE IDENTICAL UP TO THE
  // FIRST CARD BY THE VERY PROPERTY UNDER TEST; if they were not, the arm reports the divergence
  // below and the search is moot.
  if (!seen.expecting && !force) {
    return {
      seed: `${preset.background}-${index}`,
      weeks: a.main.length,
      channels: [],
      partReason: '',
      reachedExpecting: false,
      reachedReturnPlan: false,
      zeroDraw: zeroDraw.ok,
      zeroDrawAt: zeroDraw.at,
    }
  }
  const b = walk(true)
  const len = Math.max(a.main.length, b.main.length)
  const channelOf = (name: string, xs: string[], ys: string[]): Channel => {
    for (let i = 0; i < len; i++) {
      if (xs[i] !== ys[i]) return { name, firstPart: i, a: xs[i] ?? '(walk over)', b: ys[i] ?? '(walk over)' }
    }
    return { name, firstPart: null, a: '', b: '' }
  }
  const channels = [
    channelOf('MAIN position', a.main, b.main),
    channelOf('season wrap', a.season, b.season),
    channelOf('funds', a.funds, b.funds),
    channelOf('bond', a.bond, b.bond),
    channelOf('spirit', a.spirit, b.spirit),
    channelOf('condition', a.cond, b.cond),
  ]
  const earliest = channels
    .map((c) => c.firstPart)
    .filter((x): x is number => x !== null)
    .sort((x, y) => x - y)[0]
  const partReason =
    earliest === undefined
      ? ''
      : `  neutral state: ${a.states[earliest] ?? '(walk over)'}\n  eager state:   ${b.states[earliest] ?? '(walk over)'}`
  return {
    seed: `${preset.background}-${index}`,
    weeks: len,
    channels,
    partReason,
    reachedExpecting: seen.expecting,
    reachedReturnPlan: seen.returnPlan,
    zeroDraw: zeroDraw.ok,
    zeroDrawAt: zeroDraw.at,
  }
}

// =================================================================================================
// MAIN
// =================================================================================================

function main(): void {
  const policy = POLICIES[1] // `player` – the arm that reaches professional winters (two-doors' note)
  const presets = PRESETS.filter((p, i) => PRESETS.findIndex((q) => q.background === p.background) === i)
  const m = ECONOMY.motherhood
  const hazard = m.perWeekByAge.map((r) => `${r.fromAge}:${(r.perWeek * 52 * 100).toFixed(1)}%/yr`).join(' ')

  console.log('')
  console.log('THE MOTHERHOOD BENCH – wave 8 T9 (docs/specs/the-motherhood-2026-09.md)')
  console.log(
    `  ${presets.length} presets x ${SEEDS} seeds = ${presets.length * SEEDS} careers, every one a distinct seed · ` +
      `walk ${WALK_WEEKS} weeks (to age ~${(13.56 + WALK_WEEKS / 52).toFixed(1)}) · policy "${policy.label}"`,
  )
  // ⚠ THE HEADER PRINTS THE LIVE CONSTANTS SO EACH LOG SELF-DESCRIBES WHICH ARM IT IS – the wedding
  // bench's own rule for a reverse-edited control («the header prints the live value»).
  console.log(`  perWeekByAge THIS RUN: ${hazard}`)
  console.log(
    `  the arc: playsOn ${m.playsOnWeeks} · term ${m.termWeeks} · decision +${m.decisionWeeksAfterBirth} ` +
      `(the pause is ${m.termWeeks + m.decisionWeeksAfterBirth} weeks) · answers +${m.joyBond}/${m.worryBond}/${m.careerFirstBond}`,
  )
  console.log(
    `  the decision: base ${m.returnBase} · support ${GRADES.map((g) => `${g} ${m.returnSupportShift[g] >= 0 ? '+' : ''}${m.returnSupportShift[g]}`).join(' / ')} · ` +
      `spirit ${m.returnSpiritPerPoint}/pt · bond ${m.returnBondPerPoint}/pt · age −${m.returnAgePerYearOver}/yr over ${m.returnAgePivotYears} · ` +
      `clamp ${m.returnChanceMin}–${m.returnChanceMax}`,
  )
  console.log(
    `  the return: freeze ${m.protectedRankEntries} entries / ${m.protectedRankWeeks} wks (RULED) · ` +
      `ramp ${m.comebackStages.map((s) => `${s.fromWeeksBack}w:${s.factor}`).join(' ')} · wta window ${WINDOW_BY_TRACK.wta}`,
  )
  console.log(
    `  the shock: postpartum ${ECONOMY.spirit.shock.postpartum?.steady}/${ECONOMY.spirit.shock.postpartum?.intense} ` +
      `x support ${GRADES.map((g) => ECONOMY.spirit.postpartumSupportScale[g]).join('/')} · return ${ECONOMY.spirit.returnPerWeek.steady}/${ECONOMY.spirit.returnPerWeek.intense} per wk`,
  )
  console.log('')

  // --- (1) FIRST: the law before the numbers ---
  if (wants('indep')) {
    console.log('  ── (1) INPUT-INDEPENDENCE: neutral-drain walk vs eager-different-answers walk ──')
    // ⚠⚠ THE SEED IS SEARCHED AND NOT PICKED, and that is the whole difference between this arm and a
    // vacuous one. An independence walk over a career that never conceives has not exercised ONE line
    // this wave shipped: it would report «IDENTICAL» about a property nothing tested, which is
    // CLAUDE.md's 17.08 null-arm shape wearing the law's clothes. So the arm walks seeds until one
    // actually raises an `'expecting'` card, and prints which seed that was.
    let found: IndepResult | null = null
    let searched = 0
    const pinBg = strArg('indepBg')
    const pinIx = strArg('indepIndex')
    if (pinBg !== null && pinIx !== null) {
      const preset = presets.find((p) => p.background === pinBg)
      if (preset === undefined) throw new Error(`no preset with background "${pinBg}"`)
      searched = 1
      found = independenceArm(preset, Number(pinIx), policy, WALK_WEEKS, true)
      console.log(`  ⚠ SEED PINNED by --indepBg/--indepIndex – this is the CONTROL-TREE form (see the function's note).`)
    } else {
      for (let i = 0; i < INDEP_SEARCH && found === null; i++) {
        for (const preset of presets) {
          searched++
          const r = independenceArm(preset, i, policy, WALK_WEEKS)
          if (r.reachedExpecting) {
            found = r
            break
          }
        }
      }
    }
    if (found === null) {
      console.log(`  ⚠⚠ NO SEED IN ${searched} REACHED AN 'expecting' CARD – the arm is VACUOUS and is reported as such.`)
      process.exitCode = 1
    } else {
      console.log(
        `  seed "${found.seed}" (searched ${searched}) · reached the 'expecting' card ${found.reachedExpecting ? 'YES' : 'no'} · ` +
          `the 'return-plan' card ${found.reachedReturnPlan ? 'YES' : 'no'}`,
      )
      const mainCh = found.channels.find((c) => c.name === 'MAIN position')!
      if (found.channels.every((c) => c.firstPart === null)) {
        console.log(
          `  ✅ IDENTICAL over ${found.weeks} weeks: MAIN position, funds, condition and every season wrap agree byte for byte.`,
        )
      } else {
        console.log(`  ${pad('channel', 18)}${padL('first parts at', 16)}   the two values there`)
        for (const c of found.channels) {
          console.log(
            `  ${pad(c.name, 18)}${padL(c.firstPart === null ? 'never' : `week ${c.firstPart}`, 16)}   ` +
              (c.firstPart === null ? '–' : `${c.a}  vs  ${c.b}`),
          )
        }
        console.log('  the life state on the week the first channel parts:')
        console.log(found.partReason)
      }
      // ⚠⚠ THE VERDICT IS THE **MAIN** CHANNEL AND NOTHING ELSE. Everything a player may answer
      // differently in this wave moves `bond`, `support` or `returnPlan`; `returnPlan` decides WHICH
      // EVENTS she books, so `funds`, `condition` and the season wrap are all entitled to part. What
      // the law forbids is the world's dice moving, and that is this line.
      if (mainCh.firstPart === null) {
        console.log(`  ✅ THE LAW HOLDS: the MAIN stream is IDENTICAL over all ${found.weeks} weeks – no player choice re-rolled the world.`)
      } else {
        console.log(`  ❌ P0 – THE MAIN STREAM PARTED AT WEEK ${mainCh.firstPart}. Player choices re-rolled the world.`)
        process.exitCode = 1
      }
      // ⭐⭐ THE UNAMBIGUOUS HALF, AND IT IS THE ONE THAT IS A LAW RATHER THAN A CONSEQUENCE:
      // `rngMain.n` is read either side of every `answerLifeBeat` the eager arm makes, so «a player's
      // answer may not spend a MAIN draw» is asserted per ANSWER and not merely inferred from two
      // walks agreeing. It cannot be satisfied by a career that simply had no cards.
      console.log(
        found.zeroDraw
          ? '  ✅ ZERO MAIN DRAWS on every answer – `rngMain.n` is unmoved either side of every `answerLifeBeat`.'
          : `  ❌ P0 – AN ANSWER SPENT A MAIN DRAW, first at week ${found.zeroDrawAt}. A player's choice moved the world's dice.`,
      )
      if (!found.zeroDraw) process.exitCode = 1
    }
    console.log('')
  }
  if (ONLY === 'indep') return

  // --- the grid ---
  const census: MotherCareer[] = []
  const byKind = emptyDrainCounts()
  for (const preset of presets) {
    for (let i = 0; i < SEEDS; i++) {
      const c = runCareer(preset, i, policy)
      census.push(c)
      for (const k of Object.keys(c.byKind) as LifeBeatKind[]) byKind[k] += c.byKind[k]
    }
  }
  console.log(`  ${drainSkewLine(byKind)}  (per career: /${census.length})`)
  console.log('')

  const latched = census.filter((c) => c.everLatched)
  const preg = census.filter((c) => c.announcedWeek !== null)
  const by35 = preg.filter((c) => (c.announceAge ?? 99) < 35)

  // --- (2) THE CENSUS ---
  console.log('  ── (2) THE CENSUS: share of latched careers reaching a pregnancy by 35 ──')
  console.log('')
  console.log(`  ever married (latched at any point in the walk): ${latched.length}/${census.length} = ${pct(latched.length, census.length)}`)
  console.log(
    `  reached a pregnancy: ${preg.length} = ${pct(preg.length, latched.length)} OF MARRIED, ${pct(preg.length, census.length)} of all careers`,
  )
  console.log(`  ...announced BEFORE 35 (the corridor's own clause): ${by35.length} = ${pct(by35.length, latched.length)} of married`)
  console.log('  PREDICTED 15–30% of latched (his digest\'s 2–4%/yr over ~8.5 married window-years: 1−0.98^8.5 ≈ 16%, 1−0.96^8.5 ≈ 29%)')
  console.log('  ⭐ CROSS-CHECK, T7\'s instrument on its own 240 careers: 25/106 married = 23.6%, median announcement age 30.3.')
  const elig = census.map((c) => c.eligibleWeeks).sort((a, b) => a - b)
  console.log(
    `  eligible weeks per career: median ${median(elig).toFixed(0)}, p10 ${elig[Math.floor(elig.length * 0.1)]}, ` +
      `p90 ${elig[Math.floor(elig.length * 0.9)]}  (the hazard's own denominator, counted post-tick)`,
  )
  console.log('')

  // --- (3) THE AGES AND THE PER-TEMPERAMENT HAZARD ---
  console.log('  ── (3) THE AGE DISTRIBUTION against 24–35, and the per-temperament hazard ──')
  console.log('')
  const ages = preg.map((c) => c.announceAge!).sort((a, b) => a - b)
  if (ages.length > 0) {
    console.log(
      `  announcement age: median ${fix(median(ages))} (min ${fix(ages[0])}, max ${fix(ages[ages.length - 1])}, ` +
        `p10 ${fix(ages[Math.floor(ages.length * 0.1)])}, p90 ${fix(ages[Math.floor(ages.length * 0.9)])})`,
    )
    console.log(`  ${pad('rung', 10)}${padL('announcements', 15)}${padL('share', 8)}   (the hazard's own rungs)`)
    // ⚠ THE `as number` IS TWO-DOORS' OWN IDIOM, kept here for the same reason the wedding bench's
    // control line carries one: the table's literal types have no overlap with the open-ended top,
    // and widening once at the read is honester than a sentinel the compiler believes in.
    const rungs = m.perWeekByAge.map((r, i) => ({
      from: r.fromAge as number,
      to: (m.perWeekByAge[i + 1]?.fromAge as number | undefined) ?? 99,
      perWeek: r.perWeek,
    }))
    for (const r of rungs) {
      const n = ages.filter((a) => a >= r.from && a < r.to).length
      console.log(`  ${pad(`${r.from}–${r.to >= 99 ? '' : r.to}`, 10)}${padL(String(n), 15)}${padL(pct(n, ages.length), 8)}`)
    }
    const under = ages.filter((a) => a < 24).length
    const over = ages.filter((a) => a >= 35).length
    console.log(`  outside the window: under 24 ${under}, 35+ ${over}  (both must be ZERO – the rungs read 0 there)`)
  }
  console.log('')
  console.log('  the per-temperament hazard – ⚠ the fairness corridor is ±1.5 pp on the SHARE OF MARRIED:')
  console.log(`  ${pad('voice', 10)}${padL('girls', 7)}${padL('married', 9)}${padL('pregnant', 10)}${padL('of married', 12)}${padL('med elig wks', 14)}`)
  // ⚠⚠ A VOICE WITH TOO FEW MARRIAGES IS EXCLUDED FROM THE SPREAD AND IS NAMED RATHER THAN DROPPED.
  // The corridor is ±1.5 pp; a cell built on four marriages moves 25 pp when one of them conceives,
  // so folding it in would report SAMPLING as unfairness. `MIN_VOICE` is the bench's own floor and is
  // stated with the table so nobody reads an exclusion as a zero.
  const MIN_VOICE = 20
  const shares: number[] = []
  const thin: string[] = []
  for (const t of ['sunny', 'fiery', 'quiet', 'deep'] as const) {
    const rows = census.filter((c) => c.temperament === t)
    const mar = rows.filter((c) => c.everLatched)
    const pr = rows.filter((c) => c.announcedWeek !== null)
    if (mar.length >= MIN_VOICE) shares.push((100 * pr.length) / mar.length)
    else if (rows.length > 0) thin.push(`${t} (${mar.length} married)`)
    const el = rows.map((c) => c.eligibleWeeks)
    console.log(
      `  ${pad(t, 10)}${padL(String(rows.length), 7)}${padL(String(mar.length), 9)}${padL(String(pr.length), 10)}` +
        `${padL(pct(pr.length, mar.length), 12)}${padL(el.length ? median(el).toFixed(0) : '–', 14)}`,
    )
  }
  if (shares.length > 1) {
    const spread = Math.max(...shares) - Math.min(...shares)
    console.log(
      `  spread across the ${shares.length} voices with ${MIN_VOICE}+ marriages: ${fix(spread)} pp ` +
        `${spread <= 1.5 ? '– INSIDE the ±1.5 pp corridor' : '– ⚠ OUTSIDE the ±1.5 pp corridor'}`,
    )
  } else {
    console.log(`  ⚠ fewer than two voices reach ${MIN_VOICE} marriages – the corridor is NOT measurable on this grid.`)
  }
  if (thin.length > 0) console.log(`  excluded as too thin to carry a 1.5 pp corridor: ${thin.join(' · ')}`)
  console.log('  ⚠ the hazard reads AGE ALONE (no temperament term – `rollPregnancy`\'s own decision), so a spread here is')
  console.log('    a spread in who MARRIES and how long the marriage lives, which is wave 7\'s mechanic and not this one\'s.')
  console.log('')

  // --- (4) THE MID-TERM ENDING SHARE ---
  console.log('  ── (4) THE MID-TERM ENDING SHARE: the carrying marriage dies before the birth ──')
  console.log('')
  // ⚠ THE WINDOWS ARE NAMED AND BOUNDED. «Ended at some point after the announcement» over a
  // 1300-week walk is a fact about the rest of her life and not about the pregnancy – every marriage
  // eventually ends or the career does – so the second row is cut at the DECISION, which closes the
  // arc, and nothing wider is reported at all.
  const midTerm = preg.filter((c) => c.episodeEndedWeek !== null && c.dueWeek !== null && c.episodeEndedWeek < c.dueWeek)
  const beforeDecision = preg.filter(
    (c) => c.episodeEndedWeek !== null && c.pausesWeek !== null && c.episodeEndedWeek < c.pausesWeek + m.termWeeks + m.decisionWeeksAfterBirth,
  )
  console.log(`  pregnancies whose carrying episode ended BEFORE the birth: ${midTerm.length}/${preg.length} = ${pct(midTerm.length, preg.length)}`)
  console.log(
    `  ...and before the DECISION closes the arc (${m.termWeeks + m.decisionWeeksAfterBirth} wks from the pause): ` +
      `${beforeDecision.length}/${preg.length} = ${pct(beforeDecision.length, preg.length)}`,
  )
  console.log('  PREDICTED ~5% (wave 7 measured 6.2 endings / 100 latched episode-years over a ~40-week term)')
  console.log('  ⚠ THE DECOUPLING LAW IS WHAT MAKES THIS A NUMBER AND NOT A CRASH (RULED 20.09): the birth and the')
  console.log('    decision read `world.pregnancy` and never the episode\'s aliveness, so these careers walk on.')
  console.log('')

  // --- (5) THE DECISION ---
  console.log('  ── (5) THE DECISION: share who RETURN, by `support` grade – PAIRED ARMS off one card ──')
  console.log('')
  const forked = census.filter((c) => c.grades.length === GRADES.length)
  console.log(`  ${forked.length} pregnancies forked three ways at the \`'expecting'\` card (same seed, same week, same draw)`)
  console.log(`  ${pad('grade', 10)}${padL('answer', 14)}${padL('bond', 7)}${padL('returned', 11)}${padL('share', 9)}${padL('drafted', 10)}`)
  for (const g of GRADES) {
    const arms = forked.map((c) => c.grades.find((a) => a.grade === g)!).filter((a) => a !== undefined)
    const ret = arms.filter((a) => a.returned).length
    const drafted = m.returnBase + m.returnSupportShift[g]
    const bond = g === 'warm' ? m.joyBond : g === 'measured' ? m.worryBond : m.careerFirstBond
    console.log(
      `  ${pad(g, 10)}${padL(GRADE_ANSWER[g], 14)}${padL(`${bond >= 0 ? '+' : ''}${bond}`, 7)}${padL(`${ret}/${arms.length}`, 11)}` +
        `${padL(pct(ret, arms.length), 9)}${padL(drafted.toFixed(2), 10)}`,
    )
  }
  console.log('  ⚠ THE «drafted» COLUMN IS THE BASE PLUS THE GRADE SHIFT ONLY – her `spirit`, the `bond` the answer itself')
  console.log('    left, and her age all move the live chance, so the measured share is the answer\'s TOTAL effect.')
  console.log(`  drafted base ${m.returnBase} = the \`measured\` rate exactly (returnSupportShift.measured is 0).`)
  console.log('')

  // --- (6) THE COMEBACK ---
  console.log(`  ── (6) THE COMEBACK: rank at the pause vs rank +${RAMP_WEEKS} weeks, small-first vs straight-back ──`)
  console.log('')
  const ramped = census.filter((c) => c.ramps.length === PLANS.length)
  console.log(`  ${ramped.length} returns forked two ways at the \`'return-plan'\` card (T6 §D's own apparatus, at bench scale)`)
  console.log(`  ${pad('arm', 16)}${padL('mean pts', 11)}${padL('med pts', 10)}${padL('mean rank', 11)}${padL('med rank', 10)}${padL('entered', 9)}${padL('freeze spent', 14)}`)
  const armStats = (plan: Plan): { pts: number[]; ranks: number[]; entered: number[]; spent: number[] } => {
    const arms = ramped.map((c) => c.ramps.find((a) => a.plan === plan)!)
    return {
      pts: arms.map((a) => a.points),
      ranks: arms.map((a) => a.rank),
      entered: arms.map((a) => a.entered),
      spent: arms.map((a) => a.spent),
    }
  }
  const mean = (xs: number[]): number => (xs.length === 0 ? NaN : xs.reduce((s, x) => s + x, 0) / xs.length)
  for (const plan of PLANS) {
    const s = armStats(plan)
    console.log(
      `  ${pad(plan, 16)}${padL(fix(mean(s.pts), 0), 11)}${padL(s.pts.length ? median(s.pts).toFixed(0) : '–', 10)}` +
        `${padL(fix(mean(s.ranks), 0), 11)}${padL(s.ranks.length ? median(s.ranks).toFixed(0) : '–', 10)}` +
        `${padL(fix(mean(s.entered), 1), 9)}${padL(fix(mean(s.spent), 1), 14)}`,
    )
  }
  const small = armStats('small-first')
  const straight = armStats('straight-back')
  let straightAhead = 0
  let smallAhead = 0
  let tied = 0
  for (let i = 0; i < ramped.length; i++) {
    if (straight.pts[i] > small.pts[i]) straightAhead++
    else if (small.pts[i] > straight.pts[i]) smallAhead++
    else tied++
  }
  console.log('')
  console.log(
    `  head to head on WTA points at +${RAMP_WEEKS} wks: straight-back ahead on ${straightAhead}/${ramped.length}, ` +
      `small-first ahead on ${smallAhead}/${ramped.length}, tied ${tied}`,
  )
  console.log('  ⚠⚠ §2 T6 PREDICTS «the wrong ramp must measurably fail more often». T6\'s OWN §D measured the arms')
  console.log('     REVERSING on 8 of 8 posed careers (mean 141 pts straight against 55 small, 12.0 of 12 entries spent')
  console.log('     against 0.0). This row either CONFIRMS or CONTRADICTS that at bench scale; it does not tune it.')
  console.log('')
  console.log('  ...and what the year did to the RANK she paused with:')
  const regained = { 'small-first': 0, 'straight-back': 0 } as Record<Plan, number>
  let withFreeze = 0
  for (const c of ramped) {
    if (c.rankAtPause === null) continue
    withFreeze++
    for (const plan of PLANS) {
      const a = c.ramps.find((x) => x.plan === plan)!
      if (a.rank <= c.rankAtPause) regained[plan]++
    }
  }
  const pauseRanks = ramped.map((c) => c.rankAtPause).filter((r): r is number => r !== null)
  console.log(
    `  rank at the pause: median ${pauseRanks.length ? median(pauseRanks).toFixed(0) : '–'} over ${withFreeze} careers that paused holding one`,
  )
  for (const plan of PLANS) {
    console.log(
      `  ${pad(plan, 16)}back to at least her rank at the pause within ${RAMP_WEEKS} wks: ` +
        `${regained[plan]}/${withFreeze} = ${pct(regained[plan], withFreeze)}`,
    )
  }
  console.log('')
  // ⚠⚠ THE PRODUCT, AND IT IS **CHECKED AND NEVER FORCED ON EITHER FACTOR** (§2 T5's split, and the
  // brief's third law). The research's ~40% is «of mothers, return SUCCESSFULLY»; the model splits it
  // into a DRAWN decision to try and an EMERGENT success, so the only honest comparison is the
  // product of the two measured shares against that sentence.
  const tried = preg.filter((c) => c.returnedWeek !== null).length
  const triedShare = preg.length === 0 ? 0 : tried / preg.length
  const bestRegain = Math.max(
    withFreeze === 0 ? 0 : regained['small-first'] / withFreeze,
    withFreeze === 0 ? 0 : regained['straight-back'] / withFreeze,
  )
  console.log('  THE PRODUCT SANITY LINE (⚠ checked, never forced on either factor – §2 T5\'s split):')
  console.log(
    `    tried (base walk, drained \`measured\` grade) ${tried}/${preg.length} = ${pct(tried, preg.length)} · ` +
      `regained the band (best arm) ${fix(100 * bestRegain)}% · PRODUCT ${fix(100 * triedShare * bestRegain)}%`,
  )
  console.log('    against the research\'s ~40% «of mothers, return successfully» – and 0.65 x ~0.6 ≈ 0.4 on paper.')
  console.log('')

  // --- (7) THE PROTECTED RANK ---
  console.log(`  ── (7) THE PROTECTED RANK: what ${m.protectedRankEntries} entries / ${m.protectedRankWeeks} weeks actually buys ──`)
  console.log('')
  const returners = census.filter((c) => c.returnedWeek !== null)
  const withRank = returners.filter((c) => c.freezeEntries !== null)
  console.log(`  returns: ${returners.length} · came back holding a freeze: ${withRank.length} = ${pct(withRank.length, returners.length)}`)
  console.log('  ⚠ A COMEBACK IS A FACT AND A FREEZE IS AN ENTITLEMENT (`ComebackState`\'s own note): a career that paused')
  console.log('    with no WTA ranking worth protecting still came back, and is the difference between these two counts.')
  const expired = withRank.filter((c) => c.freezeSpentByExpiry !== null)
  if (expired.length > 0) {
    const spent = expired.map((c) => c.freezeSpentByExpiry!)
    const unused = expired.filter((c) => c.freezeExpiredUnused === true).length
    console.log(
      `  freezes that reached their ${m.protectedRankWeeks}-week expiry inside the walk: ${expired.length} · ` +
        `entries spent by then: mean ${fix(mean(spent))}, median ${median(spent).toFixed(1)}, of ${m.protectedRankEntries}`,
    )
    console.log(`  expired with at least one entry UNUSED: ${unused}/${expired.length} = ${pct(unused, expired.length)}`)
  } else {
    console.log(`  ⚠ NO freeze reached its ${m.protectedRankWeeks}-week expiry inside a ${WALK_WEEKS}-week walk – the`)
    console.log('    horizon is longer than what is left of these careers, and that is an ABSENCE OF EVIDENCE rather')
    console.log('    than a zero. The ramp arms below say what the first year spends.')
  }
  console.log('  ⚠⚠ THE BASE WALK IS THE **small-first** ARM (the registry\'s own `return-plan` answer), so the figures above')
  console.log('     are the careful ramp\'s. The two-arm spend is section 6\'s «freeze spent» column.')
  for (const plan of PLANS) {
    const s = armStats(plan)
    const none = s.spent.filter((x) => x === 0).length
    console.log(
      `  ${pad(plan, 16)}spent in the first ${RAMP_WEEKS} wks: mean ${fix(mean(s.spent))} of ${m.protectedRankEntries} · ` +
        `careers that spent NONE ${none}/${s.spent.length}`,
    )
  }
  console.log('')

  // --- (8) THE RANKING DECAY ---
  console.log('  ── (8) THE RANKING DECAY during the absence – ⭐ MEASURED, NOT BUILT ──')
  console.log('')
  console.log(
    `  it happens by construction: WINDOW_BY_TRACK.wta is "${WINDOW_BY_TRACK.wta}" and the pause is ` +
      `${m.termWeeks + m.decisionWeeksAfterBirth} weeks, so every result that made her rank ages out before she is back.`,
  )
  const decay = preg.filter((c) => c.ptsAtAnnounce !== null && c.ptsAtReturn !== null)
  if (decay.length > 0) {
    const cols: [string, (c: MotherCareer) => number | null][] = [
      ['at the announcement', (c) => c.ptsAtAnnounce],
      ['at the pause', (c) => c.ptsAtPause],
      ['at the birth', (c) => c.ptsAtBirth],
      ['at the return', (c) => c.ptsAtReturn],
    ]
    console.log(`  ${pad('WTA points', 22)}${padL('mean', 10)}${padL('median', 10)}${padL('max', 10)}${padL('at zero', 10)}`)
    for (const [label, read] of cols) {
      const xs = decay.map(read).filter((x): x is number => x !== null)
      const zero = xs.filter((x) => x === 0).length
      console.log(
        `  ${pad(label, 22)}${padL(fix(mean(xs), 0), 10)}${padL(xs.length ? median(xs).toFixed(0) : '–', 10)}` +
          `${padL(String(Math.max(0, ...xs)), 10)}${padL(pct(zero, xs.length), 10)}`,
      )
    }
    const kept = decay.filter((c) => (c.ptsAtAnnounce ?? 0) > 0).map((c) => (100 * (c.ptsAtReturn ?? 0)) / (c.ptsAtAnnounce ?? 1))
    if (kept.length > 0) {
      console.log(`  points kept from the announcement to the return: mean ${fix(mean(kept))}%, median ${fix(median(kept))}%`)
    }
    const ranks = decay.filter((c) => c.rankAtAnnounce !== null && c.rankAtReturn !== null)
    console.log(
      `  live WTA rank: median ${ranks.length ? median(ranks.map((c) => c.rankAtAnnounce!)).toFixed(0) : '–'} at the announcement ` +
        `→ ${ranks.length ? median(ranks.map((c) => c.rankAtReturn!)).toFixed(0) : '–'} at the return`,
    )
  }
  console.log('  ⚠ THIS IS WHY THE FALL DOOR NEEDED ITS CLAUSE (82b23137): the three terms it latches on – points halved,')
  console.log('    rank doubled, thirty places gone – are exactly what a year of not playing produces.')
  console.log('')

  // --- (9) SPONSORS ---
  console.log('  ── (9) SPONSORS: T7\'s measurement, re-stated with its provenance (no run of this file\'s own) ──')
  console.log('')
  console.log('  Two arms from ONE commit (82b23137), 240 careers each, differing only by `perWeekByAge` reverse-edited')
  console.log('  to 0 in the control – each paused career against ITSELF without the pregnancy. Pairing witnessed:')
  console.log('  $139,814,780 of brand money on both sides over the 52 weeks before the announcement, identical to the cent.')
  console.log('    the absence (51 wks)   82.1% of the control · contracted 76.1% · merch 99.8% · kit weeks 88.9%')
  console.log('    the year after         62.5%                · contracted 60.1% · merch 68.6% · kit weeks 24.3%')
  console.log('    over 155 weeks         70.0% – $3,865,406 less per paused career')
  console.log('    goodbye letters on the `events` clause, inside the absence: 15 in the arm, 0 in the control')
  console.log('  ⭐ THE DECISION: `ECONOMY.motherhood.pauseBrandFactor` DOES NOT ENTER – the world already charges the')
  console.log('    research\'s «sponsors partially lost during the pause», and a 0.6 factor would take her to ~58% and')
  console.log('    would take it DURING the absence, where the measurement shows the contract still paying.')
  console.log('  ⚠ Absurd-value check: `decisionWeeksAfterBirth` 20 → 156 (a 187-week absence) moved every column –')
  console.log('    the absence window 82.1% → 67.3%, kit weeks 88.9% → 29.3%, `events` goodbyes 15 → 24.')
  console.log('')

  // --- (10) THE POSTPARTUM SHOCK ---
  console.log('  ── (10) THE POSTPARTUM SHOCK: recovery weeks by `support`, psychologist off and on ──')
  console.log('')
  console.log(`  ${pad('grade', 10)}${padL('x magnitude', 13)}${padL('psy OFF', 10)}${padL('n', 5)}${padL('psy ON', 10)}${padL('n', 5)}${padL('T4 predicted', 16)}`)
  const T4_PREDICTED: Record<Grade, string> = { warm: '3 / 8', measured: '4 / 11', cold: '5 / 13' }
  for (const g of GRADES) {
    const arms = forked.map((c) => c.grades.find((a) => a.grade === g)!).filter((a) => a !== undefined)
    const off = arms.map((a) => a.recoveryOff).filter((x): x is number => x !== null)
    const on = arms.map((a) => a.recoveryOn).filter((x): x is number => x !== null)
    console.log(
      `  ${pad(g, 10)}${padL(String(ECONOMY.spirit.postpartumSupportScale[g]), 13)}` +
        `${padL(off.length ? median(off).toFixed(1) : '–', 10)}${padL(String(off.length), 5)}` +
        `${padL(on.length ? median(on).toFixed(1) : '–', 10)}${padL(String(on.length), 5)}${padL(T4_PREDICTED[g], 16)}`,
    )
  }
  console.log('  ⚠ THE «T4 predicted» COLUMN IS steady / intense ON A POSED CAREER at the lifted 75 with the psychologist')
  console.log('    OFF (`ECONOMY.spirit.shock`\'s own note, tests/wave8-birth.test.ts §E). This bench walks GROWN careers,')
  console.log('    so the medians fold both intensities and whatever spirit the pause left her on.')
  console.log('  ⚠ `psy ON` hires the seat and buys the `\'recovery\'` focus on the birth week; a seat that REFUSES the')
  console.log('    focus is reported as a missing cell (n), never as «he did nothing».')
  console.log('')

  // --- (11) THE PLAY-ON ANOMALY ---
  console.log(`  ── (11) ⚠⚠ THE PLAY-ON ANOMALY: the ${m.playsOnWeeks} weeks she is supposed to be playing on ──`)
  console.log('')
  console.log('  T7 measured 46 event-weeks in the paused arm against its own twin\'s 88 – HALF – across these weeks,')
  console.log('  and handed the cause to this task. The instrument below is the entry policy\'s own veto hook, used as a')
  console.log('  PURE OBSERVER: every event the policy still had in hand, and what the gate said about it.')
  console.log('')
  const playOnCareers = preg.filter((c) => c.playOn.length > 0)
  const rowsByK = new Map<number, { weeks: number; considered: number; refused: number; after: number; entered: number }>()
  for (const c of playOnCareers) {
    for (const r of c.playOn) {
      const acc = rowsByK.get(r.k) ?? { weeks: 0, considered: 0, refused: 0, after: 0, entered: 0 }
      acc.weeks++
      acc.considered += r.considered
      acc.refused += r.pauseRefused
      acc.after += r.afterPause
      acc.entered += r.entered
      rowsByK.set(r.k, acc)
    }
  }
  console.log(`  ${playOnCareers.length} careers x ${m.playsOnWeeks} weeks, by week index from the announcement:`)
  console.log(
    `  ${pad('week k', 8)}${padL('career-wks', 12)}${padL('considered', 12)}${padL('at/after pause', 16)}${padL('PAUSE-REFUSED', 15)}${padL('entry-weeks', 13)}${padL('rate', 8)}`,
  )
  let totEntered = 0
  let totWeeks = 0
  for (const k of [...rowsByK.keys()].sort((a, b) => a - b)) {
    const r = rowsByK.get(k)!
    totEntered += r.entered
    totWeeks += r.weeks
    console.log(
      `  ${pad(String(k), 8)}${padL(String(r.weeks), 12)}${padL(String(r.considered), 12)}${padL(String(r.after), 16)}` +
        `${padL(String(r.refused), 15)}${padL(String(r.entered), 13)}${padL(pct(r.entered, r.weeks), 8)}`,
    )
  }
  console.log(`  ${pad('TOTAL', 8)}${padL(String(totWeeks), 12)}${padL('', 12)}${padL('', 16)}${padL('', 15)}${padL(String(totEntered), 13)}${padL(pct(totEntered, totWeeks), 8)}`)
  console.log('')
  // ⚠⚠ THE WITHIN-CAREER CONTROL, AND ITS LIMITS ARE STATED BEFORE ITS NUMBER. T7's control was the
  // SAME career on a tree with the hazard reverse-edited to 0 – byte-identical up to the
  // announcement, which is the strongest pairing there is. This one is cheaper and weaker: the eight
  // weeks IMMEDIATELY BEFORE she says it, on the same career, same standing, same wallet. What it
  // does NOT hold fixed is the CALENDAR – an off-season stretch or an exam block can fall in one half
  // and not the other – so it is reported beside T7's figure and never instead of it.
  let preEntered = 0
  let preWeeks = 0
  for (const c of playOnCareers) {
    const a = c.announcedWeek!
    preWeeks += m.playsOnWeeks
    preEntered += c.entryWeeks.filter((w) => w >= a - m.playsOnWeeks && w < a).length
  }
  console.log(`  ⚠ THE WITHIN-CAREER CONTROL – the ${m.playsOnWeeks} weeks IMMEDIATELY BEFORE the announcement, same careers:`)
  console.log(
    `  ${pad('window', 34)}${padL('career-wks', 12)}${padL('entry-weeks', 13)}${padL('rate', 8)}`,
  )
  console.log(`  ${pad(`the ${m.playsOnWeeks} weeks before she says it`, 34)}${padL(String(preWeeks), 12)}${padL(String(preEntered), 13)}${padL(pct(preEntered, preWeeks), 8)}`)
  console.log(`  ${pad(`the ${m.playsOnWeeks} «she plays on» weeks`, 34)}${padL(String(totWeeks), 12)}${padL(String(totEntered), 13)}${padL(pct(totEntered, totWeeks), 8)}`)
  console.log(
    `  the play-on window delivers ${preEntered === 0 ? '–' : `${((100 * totEntered) / preEntered).toFixed(0)}%`} of the control's entry-weeks` +
      `   (T7's between-tree pairing: 46 / 88 = 52%)`,
  )
  console.log('')
  console.log('  ⚠⚠ THE ARITHMETIC THIS TABLE IS PREDICTED AGAINST, WRITTEN BEFORE IT RAN. The pause is read at the')
  console.log('     **EVENT\'S** week and not at the entry week – `pauseCovering(world, event.week)`, world/medical.ts –')
  console.log('     and a parent commits ahead: `deadlineWeek = week − 2` (season/calendar.ts) and the entry policy')
  console.log('     books within ENTRY_LOOKAHEAD = 3 weeks of that deadline, so on week w the bookable events are')
  console.log('     exactly `event.week ∈ [w+2, w+5]`. The pause shuts everything from `pausesWeek = announce + 8`:')
  console.log('')
  console.log('        k = 0,1,2   all four candidate weeks are before the pause   → nothing lost')
  console.log('        k = 3,4,5   one, two, then three of the four are past it    → thinning')
  console.log('        k = 6,7     every candidate week is past the pause          → ZERO bookable')
  console.log('')
  console.log('     So «she plays on for eight weeks» books for **six** of them and books NOTHING in the last two –')
  console.log('     and with a per-event-week booking rate q, the window delivers 3 + (1−(1−q)^3) + (1−(1−q)^2) + q')
  console.log('     entry-weeks against the control\'s 8 x (1−(1−q)^4). At T7\'s own 88/200 = 0.44 that is 51.5 against')
  console.log('     88, i.e. 58% – and T7 measured 46/88 = 52%.')
  console.log('')

  // --- the endings mix, so the census's denominator is legible ---
  console.log('  ── the walk itself: how the careers ended (the census denominator) ──')
  const kinds = new Map<string, number>()
  for (const c of census) kinds.set(c.endedType ?? '(reached walk end)', (kinds.get(c.endedType ?? '(reached walk end)') ?? 0) + 1)
  for (const [k, n] of [...kinds.entries()].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${pad(k, 22)}${padL(String(n), 6)}${padL(pct(n, census.length), 9)}`)
  }
  const endAges = census.map((c) => c.endAge).sort((a, b) => a - b)
  console.log(`  final age: median ${fix(median(endAges))}, p10 ${fix(endAges[Math.floor(endAges.length * 0.1)])}`)
  console.log(`  careers ending 'family': ${census.filter((c) => c.endedFamily).length}`)
  console.log('')
}

main()
