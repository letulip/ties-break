// THE WEDDING BENCH – `npm run bench:wedding` (wave 7 T8, docs/specs/the-wedding-2026-09.md).
//
//   npx vite-node tools/wedding-bench.ts                 (3 presets x 56 seeds = 168 careers)
//   npx vite-node tools/wedding-bench.ts -- --seeds 20   (a fast look)
//
// ⚠⚠ EVERY `ECONOMY.wedding` NUMBER IS A DRAFT AND THIS FILE IS WHAT THE OWNER'S RULINGS LAND ON
// (the brief's §4 contract). The bench MEASURES; the corridors are the spec's to argue; the exit
// code is non-zero only on a section-(g) divergence or a crash.
//
// WHAT IT PRINTS, section by section (the spec's own letters):
//   (g)  the INPUT-INDEPENDENCE arm, FIRST because it is the wave's law rather than a tuning: two
//        walks of one seed – neutral drain answers only, against eagerly-answered-everything with
//        different choices – must show identical MAIN positions and season results week by week.
//   (a)  the census: latched by 30, median age at the wedding, and the split by trajectory.
//   (b)  the latch factor: endings per 100 episode-years, latched vs unlatched. ⚠ THE CONTROL ARM
//        IS A REVERSE EDIT, NOT A FLAG: run once shipped, then set `latchEndFactor` to 1 in
//        economy.ts, run again, restore (the frozen-career protocol's control discipline). The
//        header prints the live value so each log self-describes which arm it is.
//   (c)  the cost against the wallet, per wealth preset.
//   (d)  the bond trajectory – the answer mix under the drain is degenerate by construction
//        (every `'engaged'` drains at `distance`), so the medians show the SCALE the ±corridors
//        live on rather than testing a corridor.
//   (e)  the engagement-cancel rate (builder 1's deviation #5 – its measured frequency).
//   (f)  the spouse-view realised rate and the occasion mix (builder 2 shipped deterministic
//        occasions with no hazard constant; this says whether that is chatty, quiet, or right).
//
// ⚠⚠ THE WALK IS THE PROVEN RECIPE AND NOT A NEW ONE (round 44's own lesson, four probes dead on
// bare `tickWeek`): `openCareer` + `stepCareerWeek` + two-doors' answer-whatever-is-open shape –
// the fork continued, the birthday answered neutrally, the retirement refused until final, every
// blocking life beat drained through `tools/_lifeBeats`' registry. The drain's bond skew is known
// arithmetic and printed (`drainSkewLine`), never noise.
//
// ⚠ ONE PRESET PER BACKGROUND, AND IT IS THE DEFAULT RATHER THAN AN OPTION – two-doors' `--spread`
// trap, inherited whole: `openCareer` seeds as `bench-${background}-${index}`, so the nine presets
// collapse onto three seed families, and everything the life layer derives (temperament, arrivals,
// endings, the wedding draw itself) is a function of the seed. Careers and distinct seeds are the
// same number here; the cost is the coach tier held fixed inside each background, which is the
// wealth axis (c) wants anyway.
//
// ⚠ RNG: careers advance on `resumeMain(world.rngMain)` – the shipped game's own resumption, and
// the thing section (g) asserts about. `createWorld` leaves `rngMain.n` at 0, so this is
// byte-identical to `openCareer`'s historical `rngFromSeed(world.seed)` arm (probed 18.09). Nothing
// in this file draws on any stream of its own.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, median, type Preset, type Policy } from './econ-bench'
import { drainLifeBeatsTallied, emptyDrainCounts, drainSkewLine, DRAIN_ANSWER } from './_lifeBeats'
import { answerBirthdayNeutral } from './_birthday'
import {
  answerFork,
  answerLifeBeat,
  answerRetirement,
  chooseGift,
  kidAgeExact,
  leavingViewOf,
  lifeLogOf,
  liveSoftBeat,
  loveEpisodesOf,
  pendingBirthday,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  toSnapshot,
  weddingEligible,
  LIFE_BEAT_OPTIONS,
  SPOUSE_VIEW_OCCASIONS,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { resumeMain } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { Temperament } from '../src/engine/spirit'
import type { LifeBeatKind, LoveEpisode } from '../src/shared/protocol'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
/** 56 x the three backgrounds = 168 careers, every one a distinct seed. */
const SEEDS = argOf('seeds', 56)
/** 912 weeks from 13.56 is age 31.1 – past the census's 30 with a season in hand for (d)'s +52
 *  capture on a late wedding. */
const WALK_WEEKS = argOf('walk', 912)

const pad = (s: string, n: number): string => s.padEnd(n)
const padL = (s: string, n: number): string => s.padStart(n)
const pct = (n: number, d: number): string => (d === 0 ? '   –' : `${((100 * n) / d).toFixed(1)}%`)
const money = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`

// =================================================================================================
// THE WALK – one career, with the wedding's own hooks
// =================================================================================================

interface EngagedMark {
  week: number
  episodeId: string
  /** bond AFTER the week's drains – the registry's −1 has landed, which is the honest reading of a
   *  walk whose answer mix is the drain. */
  bondAfter: number
}

interface LatchMark {
  week: number
  age: number
  /** the wallet as the bill landed: the post-charge balance plus the charge, same tick. */
  fundsBeforeCents: number
  bondAtWedding: number
  /** bond 52 weeks after the latch, or null when the walk ended first. */
  bondSeasonAfter: number | null
}

interface WeddingOutcome {
  seed: string
  background: string
  temperament: Temperament
  endedType: string | null
  walkEndWeek: number
  endAge: number
  week23: number
  episodes: LoveEpisode[]
  engaged: EngagedMark[]
  latches: LatchMark[]
  /** weeks `weddingEligible` answered true, counted post-tick – the hazard's own denominator. */
  eligibleWeeks: number
  spouseRows: { week: number; occasion: string }[]
  byKind: Record<LifeBeatKind, number>
}

/** The questions a walked career answers on its way past them – two-doors' own list, tallied. */
function answerWhateverIsOpen(world: WorldState, byKind: Record<LifeBeatKind, number>): void {
  const fold = (t: { byKind: Record<LifeBeatKind, number> }): void => {
    for (const k of Object.keys(t.byKind) as LifeBeatKind[]) byKind[k] += t.byKind[k]
  }
  if (world.fork !== null && world.fork.answer === null) {
    fold(drainLifeBeatsTallied(world))
    answerFork(world, 'continue')
  }
  fold(drainLifeBeatsTallied(world))
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  // ⚠ REFUSE EVERY OFFER BUT THE LAST – two-doors' conservative arm: the census is of the longest
  // careers the game produces, and a door unreachable on this arm is unreachable, full stop.
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
}

function runCareer(preset: Preset, index: number, policy: Policy): WeddingOutcome {
  const { world } = openCareer(preset, index, policy)
  const rng = resumeMain(world.rngMain)
  const out: WeddingOutcome = {
    seed: world.seed,
    background: preset.background,
    temperament: leavingViewOf(world).temperament,
    endedType: null,
    walkEndWeek: 0,
    endAge: 0,
    week23: 0,
    episodes: [],
    engaged: [],
    latches: [],
    eligibleWeeks: 0,
    spouseRows: [],
    byKind: emptyDrainCounts(),
  }
  const seenLatch = new Set<string>()
  let engagedSeen = 0

  for (let i = 0; i < WALK_WEEKS; i++) {
    stepCareerWeek(world, rng, policy)
    if (world.ending === null) answerWhateverIsOpen(world, out.byKind)

    // --- the hooks, all pure reads ---
    if (weddingEligible(world)) out.eligibleWeeks++
    const rows = lifeLogOf(world)
    for (const row of rows) {
      if (row.kind !== 'engaged') continue
      if (out.engaged.some((e) => e.week === row.week && e.episodeId === row.detail)) continue
      out.engaged.push({ week: row.week, episodeId: row.detail, bondAfter: world.bond ?? ECONOMY.bond.start })
      engagedSeen++
    }
    for (const e of loveEpisodesOf(world)) {
      if (e.latchedWeek === null || seenLatch.has(e.id)) continue
      seenLatch.add(e.id)
      out.latches.push({
        week: e.latchedWeek,
        age: kidAgeExact(e.latchedWeek, world.profile.birthMonth, world.profile.birthDay),
        fundsBeforeCents: world.fundsCents + ECONOMY.wedding.costCents,
        bondAtWedding: world.bond ?? ECONOMY.bond.start,
        bondSeasonAfter: null,
      })
    }
    for (const l of out.latches) {
      if (l.bondSeasonAfter === null && world.week >= l.week + WEEKS_PER_YEAR) {
        l.bondSeasonAfter = world.bond ?? ECONOMY.bond.start
      }
    }
    if (world.ending !== null) break
  }

  out.endedType = world.ending?.type ?? null
  out.walkEndWeek = world.week
  out.endAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  out.episodes = loveEpisodesOf(world).map((e) => ({ ...e }))
  out.spouseRows = lifeLogOf(world)
    .filter((r) => r.kind === 'spouse-view')
    .map((r) => ({ week: r.week, occasion: r.detail }))
  // the week she turns 23 – the gate's own reading, scanned rather than derived twice
  let w23 = 0
  while (kidAgeExact(w23, world.profile.birthMonth, world.profile.birthDay) < ECONOMY.wedding.ageGate) w23++
  out.week23 = w23
  if (engagedSeen !== out.engaged.length) throw new Error('engaged bookkeeping drifted')
  return out
}

// =================================================================================================
// (g) THE INPUT-INDEPENDENCE ARM – the law, before any tuning number
// =================================================================================================
//
// Two walks of ONE seed under the SAME policy. The NEUTRAL arm answers only what blocks, with the
// drain registry's answers, and never touches a soft row. The EAGER arm answers every blocking beat
// with a DIFFERENT priced option, answers every live soft row, and picks a different birthday gift.
// Everything either arm may differ on moves `bond` and nothing else (§4a.2's law), so the MAIN
// stream's position and the season's results must be IDENTICAL week by week. A divergence is a P0
// finding: the exit code goes non-zero and the first differing weeks are printed.

function isWrapWeek(week: number): boolean {
  return week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS
}

function eagerAnswers(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) {
    eagerDrain(world)
    answerFork(world, 'continue')
  }
  eagerDrain(world)
  if (pendingBirthday(world) !== null) {
    const prompt = toSnapshot(world).birthdayPrompt
    if (prompt) chooseGift(world, prompt.options[prompt.options.length - 1].id)
  }
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  // ...and the soft surface, answered rather than left: a different world from the neutral arm's
  // in exactly the way the law says must not matter.
  const soft = liveSoftBeat(world)
  if (soft !== null && pendingLifeBeat(world) === null) {
    const opts = LIFE_BEAT_OPTIONS[soft.kind]
    const pick = opts.find((o) => o.id !== DRAIN_ANSWER[soft.kind]) ?? opts[0]
    answerLifeBeat(world, pick.id)
  }
}

function eagerDrain(world: WorldState): void {
  for (let guard = 0; guard < 200; guard++) {
    const row = pendingLifeBeat(world)
    if (row === null) return
    const opts = pendingLifeBeatOptions(world)
    if (opts === null) return
    const pick = opts.find((o) => o.id !== DRAIN_ANSWER[row.kind]) ?? opts[0]
    answerLifeBeat(world, pick.id)
  }
  throw new Error('the eager arm could not drain the queue')
}

function independenceArm(preset: Preset, index: number, policy: Policy): { diverged: string[]; weeks: number } {
  const walk = (eager: boolean): string[] => {
    const { world } = openCareer(preset, index, policy)
    const rng = resumeMain(world.rngMain)
    const prints: string[] = []
    for (let i = 0; i < WALK_WEEKS; i++) {
      stepCareerWeek(world, rng, policy)
      if (world.ending === null) {
        if (eager) eagerAnswers(world)
        else answerWhateverIsOpen(world, emptyDrainCounts())
      }
      let line = `w${world.week} rng ${world.rngMain.s}/${world.rngMain.n} funds ${world.fundsCents} cond ${world.condition}`
      if (isWrapWeek(world.week)) {
        const v = leavingViewOf(world)
        line += ` | season ${v.seasonIndex} pts ${v.points} rank ${v.endRank ?? '–'} prev ${v.prevPoints}/${v.prevEndRank ?? '–'} pro ${v.professional}`
      }
      prints.push(line)
      if (world.ending !== null) break
    }
    return prints
  }
  const a = walk(false)
  const b = walk(true)
  const diverged: string[] = []
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len && diverged.length < 6; i++) {
    if (a[i] !== b[i]) diverged.push(`  neutral: ${a[i] ?? '(walk over)'}\n  eager:   ${b[i] ?? '(walk over)'}`)
  }
  return { diverged, weeks: len }
}

// =================================================================================================
// THE FOLDS
// =================================================================================================

/** Pre-23 trajectory classifier, stated once and printed with the table: episode-weeks are counted
 *  BEFORE the week she turns 23 (the gate), so a latched episode growing long cannot classify its
 *  own career. `one-long` = one attachment dominates that history (the longest span holds ≥60% of
 *  her pre-23 episode-weeks); `several-short` = it does not; `quiet-before-23` = there was nothing
 *  to classify, and the bucket is reported rather than folded away. */
type Trajectory = 'one-long' | 'several-short' | 'quiet-before-23'

function trajectoryOf(o: WeddingOutcome): Trajectory {
  const spans = o.episodes
    .map((e) => Math.max(0, Math.min(e.endedWeek ?? o.walkEndWeek, o.week23) - e.sinceWeek))
    .filter((len) => len > 0)
  const total = spans.reduce((s, x) => s + x, 0)
  if (total === 0) return 'quiet-before-23'
  return Math.max(...spans) / total >= 0.6 ? 'one-long' : 'several-short'
}

function latchedBy30(o: WeddingOutcome): boolean {
  return o.latches.some((l) => l.age < 30)
}

function main(): void {
  const seedsPerPreset = SEEDS
  const policy = POLICIES[1] // `player` – the arm that reaches professional winters (two-doors' own note)
  const presets = PRESETS.filter((p, i) => PRESETS.findIndex((q) => q.background === p.background) === i)
  const wed = ECONOMY.wedding

  console.log('')
  console.log('THE WEDDING BENCH – wave 7 T8 (docs/specs/the-wedding-2026-09.md)')
  console.log(
    `  ${presets.length} presets x ${seedsPerPreset} seeds = ${presets.length * seedsPerPreset} careers, ` +
      `every one a distinct seed · walk ${WALK_WEEKS} weeks (to age ~${(13.56 + WALK_WEEKS / 52).toFixed(1)}) · policy "${policy.label}"`,
  )
  console.log(
    `  constants under measurement: perWeek ${wed.perWeek} · minEpisodeWeeks ${wed.minEpisodeWeeks} · ` +
      `ageGate ${wed.ageGate} (RULED) · weeksAfterEngagement ${wed.weeksAfterEngagement} · cost ${money(wed.costCents)}`,
  )
  console.log(
    // ⚠ the `as number` is two-doors' own idiom: the constant's literal type and the control value
    // have no overlap, which is `vue-tsc` seeing that the control arm is a DIFFERENT TREE.
    `  latchEndFactor THIS RUN: ${wed.latchEndFactor}  ` +
      `${(wed.latchEndFactor as number) === 1 ? '<- NEUTRALISED CONTROL ARM (reverse edit)' : '(shipped draft)'}`,
  )
  console.log(
    `  bond deltas: engaged +${wed.blessBond}/${wed.distanceBond}/${wed.opposeBond} · ` +
      `spouse-view +${wed.spouseViewHearBond}/${wed.spouseViewLevelBond}/${wed.spouseViewBrushBond} · ` +
      `spouse cooldown ${wed.spouseViewCooldownWeeks} wks · money line ${money(wed.spouseViewSpendCents)}`,
  )
  console.log('')

  // --- (g) FIRST: the law before the numbers ---
  console.log('  ── (g) INPUT-INDEPENDENCE: neutral-drain walk vs eager-different-answers walk, one seed ──')
  const indep = independenceArm(presets[1] ?? presets[0], 0, policy)
  if (indep.diverged.length === 0) {
    console.log(`  ✅ IDENTICAL over ${indep.weeks} weeks: MAIN position, funds, condition and every season wrap agree byte for byte.`)
  } else {
    console.log('  ❌ P0 – THE TWO ARMS DIVERGED. Player choices re-rolled the world. First differing weeks:')
    for (const d of indep.diverged) console.log(d)
    process.exitCode = 1
  }
  console.log('')

  // --- the grid ---
  const census: WeddingOutcome[] = []
  const byKind = emptyDrainCounts()
  for (const preset of presets) {
    for (let i = 0; i < seedsPerPreset; i++) {
      const o = runCareer(preset, i, policy)
      census.push(o)
      for (const k of Object.keys(o.byKind) as LifeBeatKind[]) byKind[k] += o.byKind[k]
    }
  }
  console.log(`  ${drainSkewLine(byKind)}  (per career: /${census.length})`)
  console.log('')

  // --- (a) THE CENSUS ---
  console.log('  ── (a) THE CENSUS: latched by 30, and the split by trajectory ──')
  console.log('')
  const latched = census.filter((o) => o.latches.length > 0)
  const by30 = census.filter(latchedBy30)
  const ages = latched.flatMap((o) => o.latches.map((l) => l.age)).sort((a, b) => a - b)
  console.log(
    `  latched by 30: ${by30.length}/${census.length} = ${pct(by30.length, census.length)}   ` +
      `(ever latched in the walk: ${latched.length}, weddings: ${ages.length})`,
  )
  console.log(
    `  median age at the wedding: ${ages.length ? median(ages).toFixed(1) : '–'} ` +
      `(min ${ages.length ? ages[0].toFixed(1) : '–'}, max ${ages.length ? ages[ages.length - 1].toFixed(1) : '–'})`,
  )
  const elig = census.map((o) => o.eligibleWeeks).sort((a, b) => a - b)
  console.log(
    `  eligible weeks per career: median ${median(elig).toFixed(0)}, p10 ${elig[Math.floor(elig.length * 0.1)]}, ` +
      `p90 ${elig[Math.floor(elig.length * 0.9)]}  (the hazard's own denominator, counted post-tick)`,
  )
  console.log('')
  console.log(`  ${pad('voice', 10)}${padL('girls', 7)}${padL('latched<30', 12)}${padL('share', 8)}${padL('med elig wks', 14)}`)
  for (const t of ['sunny', 'fiery', 'quiet', 'deep'] as const) {
    const rows = census.filter((o) => o.temperament === t)
    const hit = rows.filter(latchedBy30).length
    const el = rows.map((o) => o.eligibleWeeks)
    console.log(
      `  ${pad(t, 10)}${padL(String(rows.length), 7)}${padL(`${hit}/${rows.length}`, 12)}${padL(pct(hit, rows.length), 8)}` +
        `${padL(el.length ? median(el).toFixed(0) : '–', 14)}`,
    )
  }
  console.log('')
  console.log('  the trajectory split (classifier: pre-23 episode-weeks; one-long = longest span ≥60% of them):')
  console.log(`  ${pad('trajectory', 18)}${padL('girls', 7)}${padL('latched<30', 12)}${padL('share', 8)}${padL('med episodes', 14)}`)
  for (const traj of ['one-long', 'several-short', 'quiet-before-23'] as const) {
    const rows = census.filter((o) => trajectoryOf(o) === traj)
    const hit = rows.filter(latchedBy30).length
    const eps = rows.map((o) => o.episodes.length)
    console.log(
      `  ${pad(traj, 18)}${padL(String(rows.length), 7)}${padL(`${hit}/${rows.length}`, 12)}${padL(pct(hit, rows.length), 8)}` +
        `${padL(eps.length ? median(eps).toFixed(1) : '–', 14)}`,
    )
  }
  console.log('  ⚠ a population at 0% here is a finding to bring, not to smooth (brief T2).')
  console.log('')

  // --- (b) THE LATCH FACTOR ---
  console.log(`  ── (b) THE LATCH FACTOR: endings per 100 episode-years, at latchEndFactor ${wed.latchEndFactor} ──`)
  console.log('')
  let latchedYears = 0
  let unlatchedYears = 0
  let latchedEndings = 0
  let unlatchedEndings = 0
  for (const o of census) {
    for (const e of o.episodes) {
      const closes = e.endedWeek ?? o.walkEndWeek
      if (e.latchedWeek !== null) {
        latchedYears += Math.max(0, closes - e.latchedWeek) / WEEKS_PER_YEAR
        unlatchedYears += Math.max(0, e.latchedWeek - e.sinceWeek) / WEEKS_PER_YEAR
        if (e.endedWeek !== null) latchedEndings++
      } else {
        unlatchedYears += Math.max(0, closes - e.sinceWeek) / WEEKS_PER_YEAR
        if (e.endedWeek !== null) unlatchedEndings++
      }
    }
  }
  const rate = (endings: number, years: number): string => (years === 0 ? '–' : ((100 * endings) / years).toFixed(1))
  console.log(`  ${pad('population', 14)}${padL('endings', 9)}${padL('episode-years', 15)}${padL('per 100 yrs', 13)}`)
  console.log(
    `  ${pad('latched', 14)}${padL(String(latchedEndings), 9)}${padL(latchedYears.toFixed(1), 15)}${padL(rate(latchedEndings, latchedYears), 13)}`,
  )
  console.log(
    `  ${pad('unlatched', 14)}${padL(String(unlatchedEndings), 9)}${padL(unlatchedYears.toFixed(1), 15)}${padL(rate(unlatchedEndings, unlatchedYears), 13)}`,
  )
  console.log('  ⚠ the 1.0 arm is the SAME command on the SAME tree with the constant reverse-edited, then restored (spec §3b).')
  console.log('')

  // --- (c) THE COST ---
  console.log(`  ── (c) THE COST: ${money(wed.costCents)} against the family wallet at the wedding week ──`)
  console.log('')
  console.log(`  ${pad('preset', 12)}${padL('weddings', 10)}${padL('median share', 14)}${padL('>20% of funds', 15)}${padL('wallet <= 0', 13)}`)
  for (const preset of presets) {
    const marks = census.filter((o) => o.background === preset.background).flatMap((o) => o.latches)
    const solvent = marks.filter((l) => l.fundsBeforeCents > 0)
    const shares = solvent.map((l) => wed.costCents / l.fundsBeforeCents).sort((a, b) => a - b)
    const over = solvent.filter((l) => wed.costCents > 0.2 * l.fundsBeforeCents).length
    console.log(
      `  ${pad(preset.background, 12)}${padL(String(marks.length), 10)}` +
        `${padL(shares.length ? `${(100 * median(shares)).toFixed(1)}%` : '–', 14)}` +
        `${padL(marks.length ? `${over}/${solvent.length}` : '–', 15)}${padL(String(marks.length - solvent.length), 13)}`,
    )
  }
  console.log('')

  // --- (d) THE BOND TRAJECTORY ---
  console.log('  ── (d) THE BOND TRAJECTORY under the drain (answer mix degenerate: every engagement = distance) ──')
  console.log('')
  const bondEng = census.flatMap((o) => o.engaged.map((e) => e.bondAfter)).sort((a, b) => a - b)
  const bondWed = census.flatMap((o) => o.latches.map((l) => l.bondAtWedding)).sort((a, b) => a - b)
  const bondYr = census
    .flatMap((o) => o.latches.map((l) => l.bondSeasonAfter))
    .filter((b): b is number => b !== null)
    .sort((a, b) => a - b)
  const line = (label: string, xs: number[]): void => {
    console.log(
      `  ${pad(label, 26)}${padL(xs.length ? median(xs).toFixed(1) : '–', 8)}  (n ${xs.length}` +
        `${xs.length ? `, p10 ${xs[Math.floor(xs.length * 0.1)].toFixed(1)}, p90 ${xs[Math.floor(xs.length * 0.9)].toFixed(1)}` : ''})`,
    )
  }
  line('median bond at engagement', bondEng)
  line('median bond at the wedding', bondWed)
  line('median bond a season later', bondYr)
  console.log(
    `  the corridors this scale carries: engaged +${wed.blessBond}/${wed.distanceBond}/${wed.opposeBond}, ` +
      `spouse-view +${wed.spouseViewHearBond}/${wed.spouseViewLevelBond}/${wed.spouseViewBrushBond}, on a 0–100 bond that regresses to ${ECONOMY.bond.start}.`,
  )
  console.log('')

  // --- (e) THE ENGAGEMENT-CANCEL RATE ---
  console.log('  ── (e) THE ENGAGEMENT-CANCEL RATE: the episode dies inside the 8 weeks (deviation #5) ──')
  console.log('')
  let landedN = 0
  let cancelled = 0
  let pending = 0
  for (const o of census) {
    for (const mark of o.engaged) {
      const e = o.episodes.find((ep) => ep.id === mark.episodeId)
      if (e === undefined) continue
      if (e.latchedWeek !== null) landedN++
      else if (e.endedWeek !== null) cancelled++
      else pending++
    }
  }
  const engagedTotal = landedN + cancelled + pending
  console.log(
    `  engagements ${engagedTotal}: landed ${landedN} (${pct(landedN, engagedTotal)}) · ` +
      `CANCELLED ${cancelled} (${pct(cancelled, engagedTotal)}) · still inside the 8 weeks at walk end ${pending}`,
  )
  console.log('')

  // --- (f) THE SPOUSE-VIEW REALISED RATE ---
  console.log('  ── (f) THE SPOUSE-VIEW REALISED RATE and the occasion mix ──')
  console.log('')
  let latchedWeeksTotal = 0
  for (const o of census) {
    for (const e of o.episodes) {
      if (e.latchedWeek === null) continue
      latchedWeeksTotal += Math.max(0, (e.endedWeek ?? o.walkEndWeek) - e.latchedWeek)
    }
  }
  const spouseRows = census.flatMap((o) => o.spouseRows)
  const perSeason = latchedWeeksTotal === 0 ? 0 : spouseRows.length / (latchedWeeksTotal / WEEKS_PER_YEAR)
  console.log(
    `  ${spouseRows.length} spouse-view beats over ${(latchedWeeksTotal / WEEKS_PER_YEAR).toFixed(1)} latched seasons = ` +
      `${perSeason.toFixed(2)} per latched season  (cooldown ceiling ${(WEEKS_PER_YEAR / wed.spouseViewCooldownWeeks).toFixed(1)})`,
  )
  for (const occ of SPOUSE_VIEW_OCCASIONS) {
    const n = spouseRows.filter((r) => r.occasion === occ).length
    console.log(`    ${pad(occ, 16)}${padL(String(n), 6)}${padL(pct(n, spouseRows.length), 9)}`)
  }
  console.log('')

  // --- the endings mix, so the census's denominator is legible ---
  console.log('  ── the walk itself: how the careers ended (the census denominator) ──')
  const kinds = new Map<string, number>()
  for (const o of census) kinds.set(o.endedType ?? '(reached walk end)', (kinds.get(o.endedType ?? '(reached walk end)') ?? 0) + 1)
  for (const [k, n] of [...kinds.entries()].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${pad(k, 22)}${padL(String(n), 6)}${padL(pct(n, census.length), 9)}`)
  }
  const endAges = census.map((o) => o.endAge).sort((a, b) => a - b)
  console.log(`  final age: median ${median(endAges).toFixed(1)}, p10 ${endAges[Math.floor(endAges.length * 0.1)].toFixed(1)}`)
  console.log('')
}

main()
