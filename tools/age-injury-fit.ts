// AGE, INJURY, AND WHAT MONEY MAY BUY – the measurement behind round 30 #26.
//
//   npx vite-node tools/age-injury-fit.ts -- [--save /path/a.tsave] [--seeds N] [--preset N]
//                                            [--policy player|grinder] [--drought 299] [--fromAge 25]
//                                            [--skip-sim] [--skip-floor]
//
// WHY IT EXISTS. Round 30 #22 measured that `ECONOMY.availability.ageInjuryFactor` has no adult limb
// – `default: 0.85`, the table's own lowest value, carries every year from 19 to retirement – and
// gave the owner's own 299-week drought TWO answers that differ by ~70x: «=1 in 190» against a
// generic careful career, «=1 in 3» against his own protection stack. It flagged, correctly, that
// the two are not like for like: the first is a POPULATION rate through both injury doors, the
// second is arithmetic on the WEEKLY door alone. Round 30 #26 asks what to do about the shape, and
// the first thing it needs is that discrepancy SETTLED rather than bracketed.
//
// This file settles it and then measures the two proposals in #26:
//
//   1. HIS EXPOSURE, FROM HIS OWN SAVE. Not a generic careful career – the stack the file actually
//      carries (coach rung -> physio quality, kit grade -> wear, the recovery buff and how much of
//      the window it was actually live for) and the schedule the file actually shows.
//   2. THE DROUGHT, BY SIMULATION, THROUGH BOTH DOORS. Careers walked week by week through
//      `stepCareerWeek` – the same public path the econ, endings and injury benches use – with every
//      onset attributed to the door it came through, and the answer read off sliding windows rather
//      than off a closed form. This is the arm that carries the in-match retirement hazard, which is
//      the whole reason #22 could only bracket the number.
//   3. THE FLOOR, PRICED. #26's proposal is `kitInjuryFactor`'s own rule applied to age: «the FLOOR
//      is new kit, at exactly 1 – the top rung cannot go below it, so no amount of money buys a
//      safety BONUS, it only buys back the penalty of playing on worn kit.» Section 3 prices what
//      that costs the stack at 20, 28 and 34.
//
// ⚠⚠ MEASUREMENT ONLY. NOTHING HERE IS WRITTEN BACK TO ANY CONSTANT, and no engine behaviour is
// changed by this branch: the fitted curve is a PROPOSAL in a spec. The candidate curves are graded
// by `tools/injury-audit.ts --ageCurve`, whose knob patch is the file's own CLI-only counterfactual
// idiom, and the floor is priced here in arithmetic because a floor is STRUCTURAL – there is no knob
// for it, and inventing one would be the engine change this measurement is not allowed to make.
//
// ⚠ THE SAVE IS READ-ONLY AND PERSONAL – the same standing law as `tools/injury-saves-read.ts` and
// `tools/real-vs-bench.ts`. It is handed in on the command line, read through the game's own import
// door (`decodeExportFile`), and NEVER copied into the repo, committed, or used as a fixture. What
// the repo keeps is the DERIVED statistics printed here.
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean } from './econ-bench'
import { decodeExportFile } from '../src/engine/saveCodec'
import { ECONOMY } from '../src/engine/economy'
import { coachById, physioRiskFactor, physioQuality, tierOf } from '../src/engine/coach'
import { kitInjuryFactor, kitWearAt } from '../src/engine/equipment'
import { kitFreshCap } from '../src/engine/offers'
import { ageAtWeek, answerFork, answerRetirement, injuryTau, kidAgeYears, KID_ID } from '../src/engine/world'
import { ENDINGS } from '../src/engine/ending'
import { ageAtPhysicalShare } from '../src/engine/development'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const argv = process.argv.slice(2)
const num = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback
}
const str = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const flag = (name: string): boolean => argv.includes(`--${name}`)

const SAVE = str('save', '')
const SEEDS = num('seeds', 12)
const PRESET_COUNT = num('presets', PRESETS.length)
const POLICY = POLICIES.find((p) => p.id === str('policy', 'player')) ?? POLICIES[0]
/** The owner's own gap: last onset week 597, save at week 896. */
const DROUGHT = num('drought', 299)
/** The age his drought opened at – the window the simulation counts inside. */
const FROM_AGE = num('fromAge', 25)

const f = (x: number, d = 2) => x.toFixed(d)
const pct = (n: number, d: number) => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1).padStart(5)}%`)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)

console.log('')
console.log('AGE, INJURY, AND WHAT MONEY MAY BUY – round 30 #26')

// =================================================================================================
// 1. HIS EXPOSURE, READ OFF HIS OWN SAVE
// =================================================================================================
//
// ⚠ TWO OF THE FIVE INPUTS ARE EXTRAPOLATED AND BOTH ARE NAMED WHERE THEY ARE USED. `world.results`
// is a ROLLING RANKING WINDOW, not a career ledger – the file carries her last ~52 weeks of results
// and nothing before that – so "how many weeks of the drought did she compete in" is read off the
// visible year and extended, and `seasonHistory` (which IS whole-career) is printed beside it as the
// cross-check. Her week-by-week CONDITION is not stored at all, so the threshold is computed across a
// band around the condition the save holds rather than at one number.
interface HisStack {
  label: string
  week: number
  age: number
  condition: number
  physioFactor: number
  physioTier: string
  kitFactor: number
  recoveryBuffFactor: number | null
  recoveryBuffWeeksLive: number
  onsets: { week: number; severity: string; weeksOut: number }[]
  lastOnsetWeek: number
  visibleWindowLo: number
  visibleWindowHi: number
  competedWeeksVisible: number
  visibleWeeks: number
  trailing4Visible: Record<number, number>
  matchesBySeason: number[]
  weeksLostToInjury: number
}

async function readHisSave(path: string): Promise<HisStack> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as any
  const coach = coachById(w.seed, ageAtWeek(w.week), w.coachId)
  const tier = coach ? tierOf(coach) : 'self'
  const wear = kitWearAt(w.seed, w.profile.background, w.week, kitFreshCap(w.offers, w.week), w.kit ?? null, [])
  const hist: { week: number; severity: string; weeksOut: number }[] = (w.injuryHistory ?? []).map(
    (h: { week: number; severity: string; weeksOut: number }) => ({
      week: h.week,
      severity: h.severity,
      weeksOut: h.weeksOut,
    }),
  )
  const kidWeeks = new Set<number>(
    (w.results ?? []).filter((r: { playerId: string }) => r.playerId === KID_ID).map((r: { week: number }) => r.week),
  )
  const lo = kidWeeks.size ? Math.min(...kidWeeks) : w.week
  const hi = w.week
  const trailing4: Record<number, number> = {}
  for (let wk = lo; wk <= hi; wk++) {
    const n = [...kidWeeks].filter((x) => x > wk - 4 && x <= wk).length
    trailing4[n] = (trailing4[n] ?? 0) + 1
  }
  return {
    label: basename(path).replace('.tsave', ''),
    week: w.week,
    age: kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay),
    condition: w.condition,
    physioFactor: w.physioActive ? physioRiskFactor(tier) : 1,
    physioTier: `${tier} (quality ${physioQuality(tier)})`,
    kitFactor: kitInjuryFactor(wear),
    recoveryBuffFactor: w.recoveryBuff ? w.recoveryBuff.factor : null,
    recoveryBuffWeeksLive: w.recoveryBuff ? Math.max(0, w.recoveryBuff.untilWeek - w.week) : 0,
    onsets: hist,
    lastOnsetWeek: hist.length ? Math.max(...hist.map((h) => h.week)) : 0,
    visibleWindowLo: lo,
    visibleWindowHi: hi,
    competedWeeksVisible: kidWeeks.size,
    visibleWeeks: hi - lo + 1,
    trailing4Visible: trailing4,
    matchesBySeason: (w.seasonHistory ?? []).map((s: { wins: number; losses: number }) => s.wins + s.losses),
    weeksLostToInjury: w.careerTotals?.weeksLostToInjury ?? 0,
  }
}

/** The weekly threshold, computed from the shipped constants exactly as `injuryTau` composes it,
 *  for one stated body and one stated week. No draw, no world – this is the arithmetic half, and it
 *  is only ever printed beside the simulation, never instead of it. */
function tauFor(opts: {
  condition: number
  ageFactor: number
  consecutive: number
  competing: boolean
  physio: number
  kit: number
  recovery: number
}): number {
  const a = ECONOMY.availability
  let tau = Math.min(a.injuryBaseChance + (100 - opts.condition) * a.injuryFatigueSlope, a.injuryChanceCap)
  tau *= opts.ageFactor
  tau *= opts.consecutive
  if (opts.competing) tau *= a.injuryPlayingMultiplier
  tau *= opts.physio
  tau *= opts.recovery
  tau *= opts.kit
  return Math.min(tau, a.injuryChanceCap)
}

if (SAVE) {
  const h = await readHisSave(SAVE)
  const droughtWeeks = h.week - h.lastOnsetWeek
  const lastOut = h.onsets.find((o) => o.week === h.lastOnsetWeek)?.weeksOut ?? 0
  const atRisk = droughtWeeks - lastOut
  console.log(`\n  1. HIS SAVE – "${h.label}", week ${h.week}, age ${h.age}, ${(h.week / WEEKS_PER_YEAR).toFixed(1)} seasons`)
  console.log(`     onsets ${h.onsets.length}${h.onsets.length >= 20 ? '+ (PRUNED – a floor)' : ' (under the 20-row prune, so this is exact)'} · weeks lost ${h.weeksLostToInjury}`)
  console.log(`     last onset week ${h.lastOnsetWeek} (${h.onsets.find((o) => o.week === h.lastOnsetWeek)?.severity}, ${lastOut}w out)`)
  console.log(`     -> the drought: ${droughtWeeks} weeks, of which ${atRisk} were AT RISK (she was laid off for ${lastOut} of them)`)
  console.log(`\n     THE STACK THE FILE ACTUALLY CARRIES`)
  console.log(`       physio            x${f(h.physioFactor, 3)}   ${h.physioTier}`)
  console.log(`       kit               x${f(h.kitFactor, 3)}   ${h.kitFactor === 1 ? 'EXACTLY the floor – new-kit, nothing purchasable below it' : 'worn'}`)
  console.log(
    `       recovery buff     ${h.recoveryBuffFactor === null ? 'none live' : `x${f(h.recoveryBuffFactor, 3)}`}   ` +
      `⚠ live for ${h.recoveryBuffWeeksLive} more weeks – a BOOKED HOLIDAY, not a standing part of the stack`,
  )
  console.log(`       condition         ${h.condition} at the save`)
  console.log(
    `\n     HER SCHEDULE, off the ROLLING results window (weeks ${h.visibleWindowLo}-${h.visibleWindowHi}): ` +
      `${h.competedWeeksVisible} competed weeks of ${h.visibleWeeks} = ${f((100 * h.competedWeeksVisible) / h.visibleWeeks, 1)}%`,
  )
  console.log(
    `     trailing-4 competed-week mix over that window: ` +
      Object.entries(h.trailing4Visible)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([k, v]) => `${k}->${pct(v, h.visibleWeeks).trim()}`)
        .join(' · '),
  )
  console.log(
    `     matches per banked season (seasonHistory, whole career): ` +
      h.matchesBySeason.map((m) => m).join('/') + `  – the cross-check that the year above is not unusual`,
  )

  // Σ tau across the drought, at the mix her own visible year shows, over a CONDITION BAND.
  // ⚠ The recovery buff is deliberately NOT applied: the file shows it live for four more weeks off a
  // holiday booked the week before the save, so treating it as standing would understate her tau
  // across 299 weeks. Round 30 #22's «...and an elite recovery package live» row is the buffed week,
  // and it is the wrong row for a drought.
  const ageF = ECONOMY.availability.ageInjuryFactor[h.age] ?? ECONOMY.availability.ageInjuryFactor.default
  console.log(`\n     THE WEEKLY DOOR, HER OWN NUMBERS (ageInjuryFactor(${h.age}) = ${ageF}, the table's flat default)`)
  console.log('       condition   tau, quiet week   tau, competing week   E[onsets] over ' + atRisk + 'w   P(zero)')
  const compShare = h.competedWeeksVisible / h.visibleWeeks
  const t4 = Object.entries(h.trailing4Visible)
  const t4Total = t4.reduce((s, [, v]) => s + v, 0)
  for (const cond of [70, 75, 80, h.condition, 88, 92]) {
    // the load factor she actually carried, averaged over her own trailing-4 mix
    let load = 0
    for (const [k, v] of t4) {
      const idx = Math.min(Number(k), ECONOMY.availability.consecutivePlayFactor.length - 1)
      load += (ECONOMY.availability.consecutivePlayFactor[idx] * v) / t4Total
    }
    const quiet = tauFor({ condition: cond, ageFactor: ageF, consecutive: load, competing: false, physio: h.physioFactor, kit: h.kitFactor, recovery: 1 })
    const comp = tauFor({ condition: cond, ageFactor: ageF, consecutive: load, competing: true, physio: h.physioFactor, kit: h.kitFactor, recovery: 1 })
    const perWeek = compShare * comp + (1 - compShare) * quiet
    const lambda = perWeek * atRisk
    console.log(
      `       ${padL(cond, 9)}   ${padL(f(100 * quiet, 3) + '%', 15)}   ${padL(f(100 * comp, 3) + '%', 19)}   ` +
        `${padL(f(lambda, 2), 18)}   ${padL(f(100 * Math.pow(1 - perWeek, atRisk), 1) + '%', 7)}`,
    )
  }
  console.log(
    `     ⚠ THE WEEKLY DOOR ONLY. Section 2 supplies the other one by simulation – that is the whole\n` +
      `       reason round 30 #22 could bracket this number and not pin it.`,
  )
}

// =================================================================================================
// 2. THE DROUGHT, BY SIMULATION, THROUGH BOTH DOORS
// =================================================================================================
//
// ⚠ WHY SLIDING WINDOWS AND NOT A CLOSED FORM. The question is «how likely is a 299-week gap», and a
// closed form has to assume a constant hazard, independence between weeks, and one door. A career
// walked through `stepCareerWeek` has none of those assumptions in it: tau moves with her condition,
// her schedule and her kit; the in-match retirement hazard fires on how spent she is; and a layoff
// removes exposure for weeks afterwards. So the window is counted, not derived.
//
// ⚠ TWO DENOMINATORS, PRINTED SEPARATELY BECAUSE THEY ANSWER TWO QUESTIONS AND ONLY ONE OF THEM IS
// HIS. Sliding windows inside one career are NOT independent, so the window share is «pick a random
// 299-week stretch of an adult career: is it clean?» – which is the right frame for «is what I am
// looking at unusual», because he is looking at one stretch. The per-career share is «does a career
// EVER contain such a stretch», which is a strictly larger number and the right frame for «will this
// happen to somebody».
//
// ⚠ THE ARMS. `as-is` is the preset walking its own ladder. `his-stack` forces the two protections
// his file actually carries and nothing else: an elite medical team (the preset already hires one)
// and kit held at the new-kit floor every week – which is not a cheat, it is what a signed kit deal
// does in his save (`kitFreshCap`), and it is why his `kitInjuryFactor` reads exactly 1.000. The
// recovery buff is NOT forced, for the reason section 1 gives.
const WEEK_ONSET_PREFIXES = ['Injury: ', 'Bad news from the clinic: ']
const RETIRE_ONSET_PREFIXES = ['She had to stop: ', 'She stopped, and this time it is serious: ']
const FULL_CAREER_WEEKS = (Math.ceil(ageAtPhysicalShare(ENDINGS.lastOfferPeakShare)) + 2 - 14 + 1) * WEEKS_PER_YEAR

interface SimCareer {
  preset: string
  /** one entry per lived week: her age that week */
  ages: number[]
  /** index into `ages` for every onset, with the door it came through */
  onsets: { i: number; age: number; door: 'week' | 'retirement' }[]
  /** Σ injuryTau over the at-risk weeks from FROM_AGE on – the weekly door's own prediction */
  tauSumAdult: number
  atRiskAdult: number
  meanConditionAdult: number
  /** adult weeks on which she committed to at least one event – the exposure column that makes a
   *  tau comparison against a real save honest (his own year reads 45.3%). */
  competedAdultWeeks: number
  adultWeeks: number
}

function runSim(presetIdx: number, seedIdx: number, hisStack: boolean): SimCareer {
  const preset = PRESETS[presetIdx]
  const { world, rng } = openCareer(preset, seedIdx, POLICY)
  const row: SimCareer = {
    preset: preset.label, ages: [], onsets: [], tauSumAdult: 0, atRiskAdult: 0, meanConditionAdult: 0,
    competedAdultWeeks: 0, adultWeeks: 0,
  }
  let condSum = 0
  for (let i = 0; i < FULL_CAREER_WEEKS && world.ending === null; i++) {
    // the endings bench's maximum-exposure arm: money never latches the career shut
    world.debtSinceWeek = null
    // ⚠ THE ONE THING THE `his-stack` ARM FORCES, and it is applied BEFORE the tick so the roll sees
    // it. `kitWearAt` returns 0 when the line was replaced this week, so this reproduces the
    // new-kit floor his sponsor's freshness cap holds him at – it does not invent a rung below it.
    if (hisStack && world.kit) {
      world.kit.grade = { strings: 'pro', frame: 'pro', shoes: 'pro' }
      world.kit.sinceWeek = { strings: world.week, frame: world.week, shoes: world.week }
    }
    const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    const atRisk = world.injury === null
    // the same pre-tick read `tools/injury-cause-probe.ts` documents: `injuryTau` is pure and spends
    // no draw, and the week number is the only input the tick has not moved yet.
    let tau = 0
    if (atRisk) {
      world.week += 1
      tau = injuryTau(world)
      world.week -= 1
    }
    const firstEventId = world.nextEventId
    const wasInjured = world.injury !== null
    const entered = stepCareerWeek(world, rng, POLICY)
    const enteredCount = Object.values(entered).reduce((a, b) => a + b, 0)
    const idx = row.ages.length
    row.ages.push(age)
    if (age >= FROM_AGE) {
      row.adultWeeks += 1
      if (enteredCount > 0) row.competedAdultWeeks += 1
      condSum += world.condition
      if (atRisk) {
        row.tauSumAdult += tau
        row.atRiskAdult += 1
      }
    }
    if (!wasInjured && world.injury !== null && world.injury.sinceWeek === world.week) {
      const fresh = world.events.filter((ev) => ev.id >= firstEventId)
      const onsetRow = fresh.find(
        (ev) =>
          ev.type === 'injury' &&
          (WEEK_ONSET_PREFIXES.some((p) => ev.text.startsWith(p)) || RETIRE_ONSET_PREFIXES.some((p) => ev.text.startsWith(p))),
      )
      const door: 'week' | 'retirement' =
        onsetRow && RETIRE_ONSET_PREFIXES.some((p) => onsetRow.text.startsWith(p)) ? 'retirement' : 'week'
      row.onsets.push({ i: idx, age, door })
    }
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  }
  row.meanConditionAdult = row.atRiskAdult === 0 ? 0 : condSum / Math.max(1, row.ages.filter((a) => a >= FROM_AGE).length)
  return row
}

interface ArmResult {
  label: string
  careers: number
  adultWeeks: number
  windows: number
  cleanWindows: number
  careersWithCleanRun: number
  careersWithEnoughAdultWeeks: number
  onsetsAdult: number
  retireShareAdult: number
  meanTauAdult: number
  meanCondAdult: number
  competedShare: number
  longestRuns: number[]
}

function foldArm(label: string, careers: SimCareer[]): ArmResult {
  let windows = 0
  let clean = 0
  let withRun = 0
  let eligible = 0
  let adultWeeks = 0
  let onsetsAdult = 0
  let retireAdult = 0
  const longestRuns: number[] = []
  for (const c of careers) {
    const start = c.ages.findIndex((a) => a >= FROM_AGE)
    if (start < 0) continue
    const n = c.ages.length - start
    adultWeeks += n
    const onsetIdx = c.onsets.filter((o) => o.i >= start).map((o) => o.i)
    onsetsAdult += onsetIdx.length
    retireAdult += c.onsets.filter((o) => o.i >= start && o.door === 'retirement').length
    // the longest clean run inside the adult stretch
    let best = 0
    let prev = start - 1
    for (const oi of [...onsetIdx, c.ages.length]) {
      best = Math.max(best, oi - prev - 1)
      prev = oi
    }
    longestRuns.push(best)
    if (n < DROUGHT) continue
    eligible += 1
    if (best >= DROUGHT) withRun += 1
    const onsetSet = new Set(onsetIdx)
    for (let s = start; s + DROUGHT - 1 < c.ages.length; s++) {
      windows += 1
      let dirty = false
      for (let k = s; k < s + DROUGHT; k++) if (onsetSet.has(k)) { dirty = true; break }
      if (!dirty) clean += 1
    }
  }
  return {
    label,
    careers: careers.length,
    adultWeeks,
    windows,
    cleanWindows: clean,
    careersWithCleanRun: withRun,
    careersWithEnoughAdultWeeks: eligible,
    onsetsAdult,
    retireShareAdult: onsetsAdult === 0 ? 0 : retireAdult / onsetsAdult,
    meanTauAdult: mean(careers.map((c) => (c.atRiskAdult === 0 ? 0 : c.tauSumAdult / c.atRiskAdult))),
    meanCondAdult: mean(careers.filter((c) => c.meanConditionAdult > 0).map((c) => c.meanConditionAdult)),
    competedShare:
      careers.reduce((a, c) => a + c.adultWeeks, 0) === 0
        ? 0
        : careers.reduce((a, c) => a + c.competedAdultWeeks, 0) / careers.reduce((a, c) => a + c.adultWeeks, 0),
    longestRuns,
  }
}

if (!flag('skip-sim')) {
  console.log(`\n  2. THE DROUGHT, BY SIMULATION – ${DROUGHT}-week windows from age ${FROM_AGE}, BOTH doors, policy "${POLICY.label}"`)
  const arms: ArmResult[] = []
  // ⚠ THE ELITE RUNG IS FOUND BY ITS TIER, NOT BY ITS INDEX. `PRESETS[PRESET_COUNT - 1]` is the elite
  // cell only when the whole ladder is run, and a `--presets 2` smoke run would silently grade a
  // working family's budget coach as "his rungs" – a null arm that looks like a result.
  const eliteIdx = Math.max(0, PRESETS.slice(0, PRESET_COUNT).findIndex((p) => p.coachTier === 'elite'))
  for (const [label, hisStack, presets] of [
    ['generic careful career (all rungs)', false, [...Array(PRESET_COUNT).keys()]],
    [`his rungs: ${PRESETS[eliteIdx].coachTier} medical team`, false, [eliteIdx]],
    [`his stack: ${PRESETS[eliteIdx].coachTier} team + new-kit floor`, true, [eliteIdx]],
  ] as [string, boolean, number[]][]) {
    const careers: SimCareer[] = []
    const seedsHere = presets.length === 1 ? SEEDS * Math.max(1, Math.round(PRESET_COUNT / 2)) : SEEDS
    for (const p of presets) for (let s = 0; s < seedsHere; s++) careers.push(runSim(p, s, hisStack))
    arms.push(foldArm(label, careers))
  }
  console.log(
    '     ' + padR('arm', 40) + padL('careers', 8) + padL('adult wks', 10) + padL('mean tau', 10) + padL('mean cond', 10) +
      padL('onsets/100w', 12) + padL('via retire', 11) + padL('competed wks', 14),
  )
  for (const a of arms) {
    console.log(
      '     ' + padR(a.label, 40) + padL(a.careers, 8) + padL(a.adultWeeks, 10) + padL(f(100 * a.meanTauAdult, 3) + '%', 10) +
        padL(f(a.meanCondAdult, 0), 10) + padL(f((100 * a.onsetsAdult) / Math.max(1, a.adultWeeks), 2), 12) +
        padL(pct(a.retireShareAdult * a.onsetsAdult, a.onsetsAdult).trim(), 11) +
        padL(f(100 * a.competedShare, 1) + '%', 14),
    )
  }
  console.log(`\n     ...and the ${DROUGHT}-week question itself, both denominators:`)
  console.log(
    '     ' + padR('arm', 40) + padL('windows', 9) + padL('CLEAN windows', 15) + padL('careers w/ such a run', 23) +
      padL('median longest run', 20),
  )
  for (const a of arms) {
    const sorted = [...a.longestRuns].sort((x, y) => x - y)
    const med = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
    console.log(
      '     ' + padR(a.label, 40) + padL(a.windows, 9) + padL(`${a.cleanWindows} = ${pct(a.cleanWindows, a.windows).trim()}`, 15) +
        padL(`${a.careersWithCleanRun}/${a.careersWithEnoughAdultWeeks} = ${pct(a.careersWithCleanRun, a.careersWithEnoughAdultWeeks).trim()}`, 23) +
        padL(`${med}w`, 20),
    )
  }
}

// =================================================================================================
// 3. THE FLOOR, PRICED – what `kitInjuryFactor`'s rule costs the stack when it is applied to age
// =================================================================================================
//
// THE PROPOSAL (round 30 #26, and it is #26's own words): «Age becomes a FLOOR the multipliers
// cannot go under, precisely as new kit is. A physio, a masseur and fresh shoes buy back wear and bad
// luck; they do not buy youth.»
//
// ⚠ THE SHAPE THAT ACTUALLY WORKS, AND THE TWO THAT DO NOT – worth recording, because the obvious
// forms are the ones that cancel. A floor written as `tau >= injuryBaseChance x ageInjuryFactor(age)`
// reads beautifully and does NOTHING age-dependent: the age factor is already a multiplier on tau, so
// it appears on both sides and divides out – the ratio between the protected and unprotected
// threshold is the same at 20 and at 34. Same for a floor written against the exposed hazard. For the
// stack's purchasing power to shrink with age, the floor has to be ON THE PROTECTION PRODUCT itself:
//
//     protection      = physioRiskFactor x recoveryBuffFactor         (<= 1; kit is excluded because
//                                                                      kit is never below 1 anyway)
//     protectionFloor = pBest + (1 - pBest) x climb(age)
//     tau            *= max(protection, protectionFloor(age))
//
// where `pBest` is the best product the shop actually sells and `climb(age)` is HOW FAR UP THE AGE
// CURVE SHE ALREADY IS, normalised:  (ageF(age) - ageF(prime)) / (ageF(top) - ageF(prime)).
//
// ⭐ THAT IS THE WHOLE POINT: THE FLOOR HAS NO FREE NUMBERS IN IT. It is derived from the age curve
// the same run fits, so the two cannot drift apart, and it says something a player can hear – «the
// share of her protection age has taken is exactly the share of the age curve she has already
// climbed». At the prime the floor is `pBest` and the stack is worth every cent of it; at the top of
// the curve the floor is 1 and money buys nothing on the injury threshold at all.
if (!flag('skip-floor')) {
  const curveSpec = str('curve', '')
  const table: { [age: number]: number; default: number } = curveSpec
    ? (() => {
        const t: { [age: number]: number; default: number } = { default: NaN }
        for (const pair of curveSpec.split(',')) {
          const [k, v] = pair.split(':')
          if (k.trim() === 'default') t.default = Number(v)
          else t[Number(k)] = Number(v)
        }
        return t
      })()
    : ECONOMY.availability.ageInjuryFactor
  const ageF = (a: number) => table[a] ?? table.default
  const ADULT = Array.from({ length: 22 }, (_, i) => 19 + i)
  const prime = Math.min(...ADULT.map(ageF))
  const top = Math.max(...ADULT.map(ageF))
  const pBest = physioRiskFactor('elite') * 0.85 // elite medical team x the elite recovery package
  const climb = (a: number) => (top === prime ? 0 : Math.max(0, Math.min(1, (ageF(a) - prime) / (top - prime))))
  const floorAt = (a: number) => pBest + (1 - pBest) * climb(a)
  console.log(`\n  3. THE FLOOR, PRICED – curve ${curveSpec ? '(--curve)' : '(shipped)'}: prime ${f(prime, 2)}, top ${f(top, 2)}, best purchasable protection ${f(pBest, 3)}`)
  console.log(
    '     ' + padR('age', 6) + padL('ageFactor', 10) + padL('climb', 8) + padL('floor', 8) + padL('protection kept', 17) +
      padL('% off tau still buyable', 24) + padL('tau @cond 85, quiet week', 26),
  )
  for (const a of [20, 24, 28, 30, 32, 34, 36]) {
    const fl = floorAt(a)
    const kept = Math.max(pBest, fl)
    console.log(
      '     ' + padR(a, 6) + padL(f(ageF(a), 2), 10) + padL(f(climb(a), 2), 8) + padL(f(fl, 3), 8) + padL(f(kept, 3), 17) +
        padL(f(100 * (1 - kept), 1) + '%', 24) + '  ' +
        padL(
          f(100 * tauFor({ condition: 85, ageFactor: ageF(a), consecutive: 1, competing: false, physio: kept, kit: 1, recovery: 1 }), 3) +
            '%  (unfloored ' +
            f(100 * tauFor({ condition: 85, ageFactor: ageF(a), consecutive: 1, competing: false, physio: pBest, kit: 1, recovery: 1 }), 3) +
            '%)',
          26,
        ),
    )
  }
  console.log(
    `     ⚠ THE POPULATION COST OF THE FLOOR IS NOT BENCHED HERE and cannot be: a floor is structural,\n` +
      `       there is no knob for it, and adding one is the engine change this measurement is not allowed\n` +
      `       to make. It is BRACKETED instead – run injury-audit with ECONOMY.physio.riskReduction at 1.0\n` +
      `       for the upper bound (no medical protection anywhere, at any age) and shipped for the lower.`,
  )
}
console.log('')
