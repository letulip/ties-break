/**
 * his-careers-dose – the §6 dose lever (K) and the rehab-development lever (F), priced by
 * CONTINUING THE OWNER'S OWN SAVES FORWARD rather than by walking a synthetic bench policy.
 * detail/measure-his-careers, owner ask 24.08: «может быть ты можешь померять дозу травм на
 * моделировании моих сейвов как-то на нашем стенде? Там много сезонов.»
 *
 * ⚠ READ-ONLY LAW, inherited from tools/injury-saves-read.ts: the saves are personal, handed in on
 * the command line, loaded through the game's own import door (`decodeExportFile`, i.e. the REAL
 * `migrateSave` path – several of these are v34-v45 against a v59 engine), and NEVER copied,
 * committed or fixtured. The repo keeps only the derived statistics, recorded in
 * docs/specs/the-injury-landscape-2026-08.md §9.
 *
 * WHY THIS EXISTS BESIDE tools/his-cadence-probe.ts. That probe encodes HIS POLICY and walks a
 * career from week 0 to reach his snapshots' age; the girl is a reconstruction. This tool starts
 * from the ACTUAL WORLD – her real skills, her real rank and points, her real book of earned rungs,
 * her real money, her real body, her real MAIN stream position – and only asks what the next three
 * seasons would look like under each dose. His entry rule and his vacation habit are IMPORTED from
 * that probe (`nextEntry`, `bookHisVacation`), not re-typed, so the policy under measurement is
 * provably the one §7 validated against his own landscape.
 *
 * THE ARMS are MEASUREMENT-LOCAL, UNCOMMITTED env-driven patches, the same two §8 used:
 *   TB_SUBKNEE_K / TB_SUBKNEE_JUNIOR  in src/engine/world/injury.ts  (post-draw multiply on tau)
 *   TB_REHAB_F   / TB_REHAB_LONG      in src/engine/world.ts         (growWeek's loadFactor channel)
 * Zero draws move on any stream in either; the frozen MAIN capture (41550 / e6b0c709) cannot see
 * them. Both are reverted byte-clean before the branch is pushed. The absurd-value arms below
 * (K=50, F=-50) are the null-result law's reader-presence proof and are printed with the rest.
 *
 * PAIRING. Every arm re-loads the same save and resumes the same persisted MAIN stream
 * (`rngMain`, v35), so two arms differ by the lever and by nothing else. The 20 snapshots of his
 * five careers are the replicate set: SEM is reported both across snapshots and across the five
 * CAREERS (the conservative figure – two snapshots of one career are not independent).
 *
 * Run: npx vite-node tools/his-careers-dose.ts -- --save /path/a.tsave [...] [--seasons 3]
 *      [--arms K0,K8,K8jr]
 */
process.env.TB_BENCH_NO_AUTORUN = '1'

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { decodeExportFile } from '../src/engine/saveCodec'
import {
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  activeLadderOf,
  kidPoints,
  buildBirthdayPrompt,
  chooseGift,
  answerFork,
  answerRetirement,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { decideKnock } from '../src/engine/world/knock'
import { advanceRefusal } from '../src/engine/world/multiWeek'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const { nextEntry, bookHisVacation } = await import('./his-cadence-probe')

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const savePaths: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePaths.push(args[++i])
if (savePaths.length === 0) {
  console.error('usage: npx vite-node tools/his-careers-dose.ts -- --save /path/a.tsave [...]')
  process.exit(1)
}
const SEASONS = argOf('seasons', 3)
const WEEKS = SEASONS * WEEKS_PER_YEAR

interface Arm {
  id: string
  K: number
  junior: boolean
  F: number | null
  note: string
}
const ALL_ARMS: Arm[] = [
  { id: 'SHIPPED', K: 0, junior: false, F: null, note: 'K=0, F=1 – the engine as it ships' },
  { id: 'K4', K: 4, junior: false, F: null, note: 'K=4 ungated' },
  { id: 'K8', K: 8, junior: false, F: null, note: 'K=8 ungated (§5 dose, no era gate)' },
  { id: 'K4jr', K: 4, junior: true, F: null, note: 'K=4 JUNIOR-GATED (§5 recommendation)' },
  { id: 'K8jr', K: 8, junior: true, F: null, note: 'K=8 JUNIOR-GATED (§5 recommendation)' },
  { id: 'F0.3', K: 0, junior: false, F: 0.3, note: 'F=0.3, long layoffs 0 (§8 pick), shipped dose' },
  { id: 'F0', K: 0, junior: false, F: 0, note: 'F=0, shipped dose' },
  { id: 'K8-F0.3', K: 8, junior: false, F: 0.3, note: 'the §5+§8 pair, ungated' },
  { id: 'K8-F0', K: 8, junior: false, F: 0, note: 'the maximal pair, ungated' },
  { id: 'K8jr-F0.3', K: 8, junior: true, F: 0.3, note: 'the §5+§8 pair AS RECOMMENDED (era-gated)' },
  { id: 'PROBE-K50', K: 50, junior: false, F: null, note: 'ABSURD: the K reader must be present' },
  { id: 'PROBE-K50jr', K: 50, junior: true, F: null, note: 'ABSURD + gate: the era finding, on camera' },
  { id: 'PROBE-F-50', K: 0, junior: false, F: -50, note: 'ABSURD: the F reader must be present' },
]
const armFilter = args.indexOf('--arms') >= 0 ? new Set(args[args.indexOf('--arms') + 1].split(',')) : null
const ARMS = armFilter ? ALL_ARMS.filter((a) => armFilter.has(a.id)) : ALL_ARMS

interface Run {
  save: string
  career: string
  startWeek: number
  arm: string
  weeks: number
  /** every week she committed to an event, ascending – the schedule the missed-tournament count
   *  is read off */
  playedWeeks: number[]
  entriesByTier: Partial<Record<TierId, number>>
  matches: number
  wins: number
  onsets: number
  sev: Record<'minor' | 'moderate' | 'major' | 'severe', number>
  weeksInjured: number
  weeksSubKnee: number
  meanCondition: number
  trough: number
  vacations: number
  endRank: number
  endPoints: number
  prizeCents: number
  endSkill: number
  ending: string | null
  endedAtWeek: number | null
  ladderAtStart: string
  /** how many of the walked weeks the junior gate would have been OPEN on (activeLadderOf !== wta) */
  juniorWeeks: number
}

function runOne(path: string, arm: Arm): Run {
  if (arm.K > 0) process.env.TB_SUBKNEE_K = String(arm.K)
  else delete process.env.TB_SUBKNEE_K
  if (arm.junior) process.env.TB_SUBKNEE_JUNIOR = '1'
  else delete process.env.TB_SUBKNEE_JUNIOR
  if (arm.F !== null) process.env.TB_REHAB_F = String(arm.F)
  else delete process.env.TB_REHAB_F
  return walk(path, arm.id)
}

const worldCache = new Map<string, string>()
async function loadWorld(path: string): Promise<WorldState> {
  // decode once, then hand every arm a deep copy: `decodeExportFile` is async and the walk is not,
  // and a copy is the only way two arms can start from a byte-identical world.
  if (!worldCache.has(path)) {
    const w = await decodeExportFile(new Uint8Array(readFileSync(path)))
    worldCache.set(path, JSON.stringify(w))
  }
  return JSON.parse(worldCache.get(path)!) as WorldState
}

let pending: WorldState | null = null
function walk(path: string, armId: string): Run {
  const world = pending!
  pending = null
  const career = basename(path).replace('.tsave', '').replace('tennis-sim_', '').replace(/_w\d+$/, '')
  const startWeek = world.week
  const rng = resumeMain(world.rngMain)
  const startSkill = mean(Object.values(world.skills as unknown as Record<string, number>))
  const startPrize = world.careerTotals?.prizeCents ?? 0
  const run: Run = {
    save: basename(path).replace('.tsave', '').replace('tennis-sim_', ''),
    career,
    startWeek,
    arm: armId,
    weeks: 0,
    playedWeeks: [],
    entriesByTier: {},
    matches: 0,
    wins: 0,
    onsets: 0,
    sev: { minor: 0, moderate: 0, major: 0, severe: 0 },
    weeksInjured: 0,
    weeksSubKnee: 0,
    meanCondition: 0,
    trough: ECONOMY.condition.max,
    vacations: 0,
    endRank: 0,
    endPoints: 0,
    prizeCents: 0,
    endSkill: 0,
    ending: null,
    endedAtWeek: null,
    ladderAtStart: activeLadderOf(world),
    juniorWeeks: 0,
  }
  // his last committed play week, so the gap rule starts from his real cadence rather than from
  // "never played": the newest result row in the retained 52-week window.
  let lastPlayWeek = Math.max(
    -99,
    ...world.results.filter((r) => r.playerId === KID_ID).map((r) => r.week),
  )
  const offSeasonBooked = new Set<number>()
  let condSum = 0
  for (let i = 0; i < WEEKS; i++) {
    // --- clear whatever the week is holding, exactly as a player would -------------------
    // Fixed answers, identical in every arm, so no arm can differ through a policy choice:
    // a knock is RESTED (his careful style; `push` is the ×2.2 tau branch and would confound the
    // very thing under measurement), a fork is CONTINUED, a retirement offer is DECLINED, a
    // birthday takes the first option (it moves no money and no state – see chooseGift's note).
    for (let guard = 0; guard < 8; guard++) {
      const refusal = advanceRefusal(world)
      if (refusal === null) break
      if (refusal === 'ending') {
        run.ending = world.ending?.type ?? 'unknown'
        run.endedAtWeek = world.week
        break
      }
      if (refusal === 'tournament') {
        skipTournament(world)
        closeTournament(world)
      } else if (refusal === 'knock') {
        decideKnock(world, 'rest')
      } else if (refusal === 'birthday') {
        const prompt = buildBirthdayPrompt(world)
        if (prompt) chooseGift(world, prompt.options[0].id)
        else break
      } else if (refusal === 'fork') {
        answerFork(world, 'continue')
      } else if (refusal === 'retirement') {
        answerRetirement(world, false)
      } else break
    }
    if (run.ending) break

    // ⚠ HIS MONEY IS LEFT EXACTLY AS SAVED – no top-up, unlike his-cadence-probe, which tops funds
    // up so money never binds. Here money is part of the career being continued, and a dose that
    // costs matches costs prize money too; a bankruptcy ending is a real consequence and is counted.
    const target = world.week + 1
    if (bookHisVacation(world, target, offSeasonBooked)) run.vacations++
    const id = nextEntry(world, lastPlayWeek)
    if (id) {
      const ev = world.season.find((e) => e.id === id)!
      try {
        enterEvent(world, id)
        run.entriesByTier[ev.tier] = (run.entriesByTier[ev.tier] ?? 0) + 1
        run.playedWeeks.push(ev.week)
        lastPlayWeek = ev.week
      } catch {
        /* the gate and the command disagreed – R10-5 says they cannot */
      }
    }
    if (activeLadderOf(world) !== 'wta') run.juniorWeeks++
    if (world.condition < ECONOMY.condition.matchStrengthKnee) run.weeksSubKnee += 1
    tickWeek(world, rng)
    run.weeks++
    if (world.pendingTournament) {
      for (const m of world.pendingTournament.result.matches) {
        if (m.aId !== KID_ID && m.bId !== KID_ID) continue
        run.matches += 1
        if (m.winnerId === KID_ID) run.wins += 1
      }
      skipTournament(world)
      closeTournament(world)
    }
    // ⚠ ONSETS COUNTED AFTER THE RUN COMMITS, not after the tick – the retirement door opens inside
    // `finalizeTournament` and feeds 79% of a careful landscape (spec §1). his-cadence-probe's own
    // marker, and the reason its absolute rates are comparable with the fatigue bench's.
    if (world.injury !== null) {
      run.weeksInjured += 1
      if (world.injury.sinceWeek === world.week) {
        run.onsets += 1
        run.sev[world.injury.severity] += 1
      }
    }
    condSum += world.condition
    run.trough = Math.min(run.trough, world.condition)
    if (world.ending) {
      run.ending = world.ending.type
      run.endedAtWeek = world.week
      break
    }
  }
  run.meanCondition = condSum / Math.max(1, run.weeks)
  run.endRank = (world as unknown as { kidRank: number }).kidRank
  run.endPoints = kidPoints(world, activeLadderOf(world) === 'wta' ? 'wta' : 'itf')
  run.prizeCents = (world.careerTotals?.prizeCents ?? 0) - startPrize
  run.endSkill = mean(Object.values(world.skills as unknown as Record<string, number>))
  void startSkill
  return run
}

const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const semOf = (xs: number[]) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)
  return Math.sqrt(v / xs.length)
}
const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

// --- the sweep -----------------------------------------------------------------
const runs: Run[] = []
for (const path of savePaths) {
  for (const arm of ARMS) {
    pending = await loadWorld(path)
    runs.push(runOne(path, arm))
  }
  worldCache.delete(path)
  process.stderr.write(`  ${basename(path)} done (${ARMS.length} arms)\n`)
}
delete process.env.TB_SUBKNEE_K
delete process.env.TB_SUBKNEE_JUNIOR
delete process.env.TB_REHAB_F

console.log(
  `HIS OWN CAREERS, CONTINUED – ${savePaths.length} snapshots x ${ARMS.length} arms x ${SEASONS} seasons ` +
    `(${WEEKS}w each)\n  policy: his-cadence-probe's own nextEntry + bookHisVacation, imported ` +
    `(T1/T0/rescue at their committed defaults) · knee ${ECONOMY.condition.matchStrengthKnee} · ` +
    `recoveryBase ${ECONOMY.condition.recoveryBase} · proPhaseRecoveryBase ${
      (ECONOMY.condition as unknown as { proPhaseRecoveryBase: number }).proPhaseRecoveryBase
    }`,
)

// --- the era finding, first, because it decides how to read everything below ----
const shipped = runs.filter((r) => r.arm === 'SHIPPED')
console.log('\n=== THE ERA GATE ON HIS OWN CAREERS ===')
console.log(
  '  ' + pad('save', 20) + padL('startWk', 8) + padL('ladder', 8) + padL('junior weeks walked', 21) +
    padL('of', 5),
)
for (const r of shipped) {
  console.log(
    '  ' + pad(r.save, 20) + padL(r.startWeek, 8) + padL(r.ladderAtStart, 8) + padL(r.juniorWeeks, 21) +
      padL(r.weeks, 5),
  )
}
const totJr = shipped.reduce((a, r) => a + r.juniorWeeks, 0)
const totW = shipped.reduce((a, r) => a + r.weeks, 0)
console.log(
  `  TOTAL: ${totJr} of ${totW} continued weeks are junior-era weeks ` +
    `(${((100 * totJr) / Math.max(1, totW)).toFixed(1)}%) – a junior-gated K can only act on those.`,
)

// --- per-arm aggregates ---------------------------------------------------------
function cell(armId: string): Run[] {
  return runs.filter((r) => r.arm === armId)
}
/** paired difference against SHIPPED, one pair per save */
function paired(armId: string, get: (r: Run) => number): { d: number; sem: number; semCareer: number } {
  const base = new Map(shipped.map((r) => [r.save, get(r)]))
  const ds = cell(armId).map((r) => get(r) - (base.get(r.save) ?? 0))
  const byCareer = new Map<string, number[]>()
  for (const r of cell(armId)) {
    const d = get(r) - (base.get(r.save) ?? 0)
    byCareer.set(r.career, [...(byCareer.get(r.career) ?? []), d])
  }
  return { d: mean(ds), sem: semOf(ds), semCareer: semOf([...byCareer.values()].map(mean)) }
}

console.log(`\n=== THE DOSE TABLE – per season of continued play (${SEASONS} seasons x ${savePaths.length} snapshots per arm) ===`)
console.log(
  '  ' + pad('arm', 12) + padL('onsets/s', 14) + padL('mi/mo/ma/se', 13) + padL('wksLost/s', 12) +
    padL('events/s', 10) + padL('matches/s', 10) + padL('meanCond', 9) + padL('subknee/s', 10) +
    padL('endRank', 8) + padL('prize/s', 14) + padL('endSkill', 9) + padL('endings', 8),
)
for (const arm of ARMS) {
  const rs = cell(arm.id)
  if (rs.length === 0) continue
  const seasons = rs.reduce((a, r) => a + r.weeks / WEEKS_PER_YEAR, 0)
  const perSeason = (get: (r: Run) => number) => rs.reduce((a, r) => a + get(r), 0) / seasons
  const sevTot = (['minor', 'moderate', 'major', 'severe'] as const).map((s) => rs.reduce((a, r) => a + r.sev[s], 0))
  const persSem = semOf(rs.map((r) => (r.onsets * WEEKS_PER_YEAR) / Math.max(1, r.weeks)))
  console.log(
    '  ' + pad(arm.id, 12) +
      padL(`${perSeason((r) => r.onsets).toFixed(2)} ±${persSem.toFixed(2)}`, 14) +
      padL(sevTot.join('/'), 13) +
      padL(perSeason((r) => r.weeksInjured).toFixed(2), 12) +
      padL(perSeason((r) => r.playedWeeks.length).toFixed(1), 10) +
      padL(perSeason((r) => r.matches).toFixed(1), 10) +
      padL(mean(rs.map((r) => r.meanCondition)).toFixed(1), 9) +
      padL(perSeason((r) => r.weeksSubKnee).toFixed(1), 10) +
      padL(mean(rs.map((r) => r.endRank)).toFixed(0), 8) +
      padL(`$${Math.round(perSeason((r) => r.prizeCents) / 100).toLocaleString('en-US')}`, 14) +
      padL(mean(rs.map((r) => r.endSkill)).toFixed(2), 9) +
      padL(rs.filter((r) => r.ending !== null).length, 8),
  )
}

console.log('\n=== PAIRED AGAINST SHIPPED (same save, same resumed MAIN stream, same policy) ===')
console.log(
  '  ' + pad('arm', 12) + padL('d onsets (3s)', 22) + padL('d wksLost', 22) + padL('d events', 22) +
    padL('MISSED of his', 14) + padL('extra', 7),
)
for (const arm of ARMS) {
  if (arm.id === 'SHIPPED') continue
  const rs = cell(arm.id)
  if (rs.length === 0) continue
  const o = paired(arm.id, (r) => r.onsets)
  const w = paired(arm.id, (r) => r.weeksInjured)
  const e = paired(arm.id, (r) => r.playedWeeks.length)
  // ⭐ THE NUMBER HE FEELS: of the tournament weeks the SHIPPED arm played, how many this arm did
  // not – and how many it played that the shipped arm did not (the schedule re-flows around a
  // layoff, so both directions are reported rather than netted silently).
  const baseWeeks = new Map(shipped.map((r) => [r.save, new Set(r.playedWeeks)]))
  let missed = 0
  let extra = 0
  for (const r of rs) {
    const b = baseWeeks.get(r.save) ?? new Set<number>()
    const mineSet = new Set(r.playedWeeks)
    for (const wk of b) if (!mineSet.has(wk)) missed++
    for (const wk of mineSet) if (!b.has(wk)) extra++
  }
  const fmt = (x: { d: number; sem: number; semCareer: number }) =>
    `${x.d >= 0 ? '+' : ''}${x.d.toFixed(2)} ±${x.sem.toFixed(2)} (±${x.semCareer.toFixed(2)} by career)`
  console.log(
    '  ' + pad(arm.id, 12) + padL(fmt(o), 22) + padL(fmt(w), 22) + padL(fmt(e), 22) +
      padL(`${missed} (${(missed / rs.length).toFixed(1)}/save)`, 14) + padL(extra, 7),
  )
}

// --- per-save detail, so nothing hides in a mean ---------------------------------
console.log('\n=== PER SAVE: onsets over the continued window, by arm ===')
console.log('  ' + pad('save', 20) + ARMS.map((a) => padL(a.id, 12)).join(''))
for (const path of savePaths) {
  const s = basename(path).replace('.tsave', '').replace('tennis-sim_', '')
  console.log(
    '  ' + pad(s, 20) +
      ARMS.map((a) => padL(runs.find((r) => r.save === s && r.arm === a.id)?.onsets ?? '-', 12)).join('') +
      '   ' +
      // a career that ENDS inside the window walks fewer weeks than the rest; naming the ending and
      // the week is what stops its short row from reading as a quiet zero.
      [...new Set(runs.filter((r) => r.save === s && r.ending !== null).map((r) => `${r.arm}:${r.ending}@w${r.endedAtWeek}`))].join(' '),
  )
}
console.log('\n  arm legend: ' + ARMS.map((a) => `${a.id} = ${a.note}`).join(' · '))
