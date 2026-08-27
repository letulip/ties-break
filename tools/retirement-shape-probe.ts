// THE SHAPE OF THE RETIREMENT HAZARD - what actually decides who stops, and what does not.
//
//   npx vite-node tools/retirement-shape-probe.ts [--careers N] [--seasons N] [--arms a,b,c]
//
// WHY IT EXISTS. `tools/retirement-rate.ts` measures the LEVEL (2.81% of her matches against the
// research's 2.73%) and reports it by tier. It cannot answer the owner's question of 27.08, which is
// about the SHAPE: he arrived fresh, went deep, and was retired hurt twice on the same half-season -
// «Надо сделать здоровый механизм по травмам […] наказывать тех, кто УЖЕ в низкой кондиции приезжает
// и делает это ПОСТОЯННО (гриндер), а если я приезжаю с 80-90 на турнир, то как будто вполне есть
// высокий шанс доиграть.» That is a claim about which INPUTS move the hazard, and the shipped bench
// aggregates all of them away.
//
// SO THIS PROBE SPLITS THE SAME EVENT FOUR WAYS:
//   1. by ROUND, normalised by the matches she actually played at that round (the raw count is
//      biased by how often she gets there at all, and the raw count is the misleading one);
//   2. by ARRIVAL CONDITION, bucketed - the owner's own design question, stated as a number;
//   3. against the research anchor (docs/research/retirement-and-withdrawal.md §7) on ITS OWN units,
//      which are per match AND per 1000 games, not per season;
//   4. GRINDER vs RESTED, as two policies over the same engine.
//
// ⚠⚠ THE ORDERING HAZARD, AND HOW THIS FILE AVOIDS IT. Round 26 #14b found `tools/pro-season-probe.ts`
// reading the body BEFORE the tournament resolved, so every onset opened by `retirementInjury`
// (inside `finalizeTournament`, world.ts:874) landed after the check and vanished. The order here is
// fixed and the comments name each step:
//
//     tickWeek                 -> the run is SIMULATED; `world.condition` still holds the value every
//                                 match of the run was played at (condition is charged once, at
//                                 finalize - world.ts:751 - so there is no within-week fatigue)
//     READ arrival + matches   <- here, and only here
//     skipTournament           -> finalizeTournament: charges strain, opens `retirementInjury`
//     READ the body            <- after
//
// AND IT IS CHECKED RATHER THAN ASSERTED, by three instrument arms printed with the results:
//   (a) EVERY kid retirement must be followed by an open injury. `finalizeTournament` calls
//       `retirementInjury` unconditionally on `retiredMatch` (world.ts:874) and `rollInjury` at tick
//       step 1c has already found her healthy, so `retirements == retirement-door onsets` is an
//       identity of the engine. If this probe printed a mismatch, the probe would be wrong.
//   (b) EVERY kid match is RE-SIMULATED at its stored seed off the frozen `pendingTournament.players`
//       and must reproduce the winner and the scoreline. A mismatch means the snapshot this probe
//       reads is not the one the engine played, which would void every number below.
//   (c) WITHIN ONE RUN, every kid match must carry the SAME frozen `players[KID_ID].stamina`. That
//       is the no-within-week-fatigue claim stated as a testable identity: `world.condition` is
//       charged once, after the run resolves (world.ts:751), so a five-match title week is simulated
//       at one condition from the first ball to the last. If this probe ever printed a run whose
//       staminas differ, the claim would be false and every "arrival condition" number below would
//       be measuring the wrong thing.
//
// MEASUREMENT ONLY: every entry, tick and commit goes through the public engine commands. No engine
// number is written from here, and nothing under `src/` is touched.
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  recomputeKidRank,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { RETIRE_K, spentness } from '../src/engine/match/point'
import { conditionMatchFactor } from '../src/engine/condition'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const argStr = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const CAREERS = argOf('careers', 12)
const SEASONS = argOf('seasons', 6)
const WEEKS = SEASONS * WEEKS_PER_YEAR
type ArmId = 'rested' | 'grinder' | 'pro'
const ARMS = argStr('arms', 'rested,grinder,pro').split(',') as ArmId[]

// --- PART A: the model, before any career is walked -------------------------------------------
//
// The engine's own integration, not an approximation of it. `simulateMatch` (engine.ts:92) draws ONE
// uniform per side for the whole match and compares it against a RUNNING SUM of `retireHazard`:
//
//     retU = [retRng(), retRng()]              // once, at the top
//     retH[s] += retireHazard(pointNumber, players[s].stamina)   // every point
//     side = retH[0] > retU[0] ? 0 : retH[1] > retU[1] ? 1 : null
//
// `retH` is non-decreasing, so P(side s stops within N points) is EXACTLY min(1, Σ h) - not
// 1 − Π(1 − h). The two differ by (Σh)²/2, which is 0.19 points of percentage at a 260-point match:
// small, but the sum is what the engine does and this file reports the engine.
function pRetire(points: number, stamina: number): number {
  let h = 0
  for (let n = 1; n <= points; n++) h += RETIRE_K * spentness(n, stamina)
  return Math.min(1, h)
}

/** Her match stamina at a given arrival condition, through the ONE channel condition has into the
 *  hazard: `kidMatchPlayerFor` (world/player.ts:220) writes `stamina: raw.stamina * factor`. Surface
 *  style and kit scale it too, but neither reads condition, so they are held at 1 here. */
const staminaAt = (rawStamina: number, condition: number) => rawStamina * conditionMatchFactor(condition)

console.log('=== PART A - THE MODEL ITSELF (arithmetic over the shipped functions, zero careers) ===')
console.log(
  `RETIRE_K ${RETIRE_K} · FATIGUE_START 120 · matchStrengthKnee ${ECONOMY.condition.matchStrengthKnee}` +
    ` · matchStrengthFloor ${ECONOMY.condition.matchStrengthFloor} · condition range ` +
    `${ECONOMY.condition.min}..${ECONOMY.condition.max}`,
)
const RAW_STAMINA = 70
const LENGTHS = [120, 150, 180, 200, 230, 260, 300]
const CONDITIONS = [100, 95, 90, 85, 80, 75, 70, 60, 50, 40, 30, 20, 15, 0]
console.log(`\nP(she retires in ONE match), raw stamina ${RAW_STAMINA}, by match length x arrival condition:`)
console.log(`  cond  factor  stam  ` + LENGTHS.map((n) => `${n}pt`.padStart(8)).join(''))
for (const c of CONDITIONS) {
  const f = conditionMatchFactor(c)
  const s = staminaAt(RAW_STAMINA, c)
  console.log(
    `  ${String(c).padStart(4)}  ${f.toFixed(3).padStart(6)}  ${s.toFixed(1).padStart(4)}  ` +
      LENGTHS.map((n) => `${(100 * pRetire(n, s)).toFixed(2)}%`.padStart(8)).join(''),
  )
}
{
  const at = (c: number, n: number) => pRetire(n, staminaAt(RAW_STAMINA, c))
  const lengthLever = at(80, 260) / at(80, 150)
  const conditionLever90to70 = at(70, 260) / at(90, 260)
  const conditionLeverFullRange = at(ECONOMY.condition.min, 260) / at(100, 260)
  const conditionLeverToFloor15 = at(15, 260) / at(90, 260)
  console.log(
    `\n  THE TWO LEVERS, at a 260-point match:` +
      `\n    LENGTH   150pt -> 260pt at the same condition   x${lengthLever.toFixed(2)}` +
      `\n    CONDITION arriving at 90 -> arriving at 70       x${conditionLever90to70.toFixed(2)}   <- the owner's own range` +
      `\n    CONDITION arriving at 90 -> arriving at 15       x${conditionLeverToFloor15.toFixed(2)}   (15 = the medical floor she may enter on)` +
      `\n    CONDITION arriving at 100 -> arriving at ${ECONOMY.condition.min}        x${conditionLeverFullRange.toFixed(2)}   (the whole legal range)`,
  )
}

// --- PART B: the careers ------------------------------------------------------------------------

/** One kid match, with everything the four questions need. */
interface MatchRow {
  arm: ArmId
  tier: TierId
  /** 0 = her first match of the run */
  round: number
  /** rounds LEFT when this match was played: 1 = the final, 2 = SF, 3 = QF, 4 = R16, ... */
  roundsLeft: number
  /** `world.condition` as the run was played - condition is charged once, at finalize */
  arrival: number
  /** the frozen `players[KID_ID].stamina` the hazard actually integrated */
  stamina: number
  /** exact, from the re-simulation at the stored seed */
  points: number
  games: number
  retiredKid: boolean
  retiredOpp: boolean
  /** the point she stopped on, when she did */
  retiredAt: number | null
  /** Σ retireHazard over the match, for HER - the model's own prediction for this exact match */
  hazard: number
}

interface ArmOut {
  rows: MatchRow[]
  /** every match in every draw she entered, kid and AI-AI alike - the research's own denominator */
  allDrawMatches: number
  seasons: number
  events: number
  /** instrument arm (a) */
  retirementDoorOnsets: number
  /** instrument arm (b) */
  resimMismatch: number
  /** instrument arm (c): runs of >1 kid match whose frozen kid stamina is NOT constant */
  runsWithDriftingStamina: number
  runsOfTwoOrMore: number
  /** what one run actually costs: condition before finalize minus after, summed */
  strainCharged: number
  weeklyDoorOnsets: number
  seasonsWithAnyOnset: number
  seasonsWalked: number
  entriesRefused: number
}

/** Keep her book at the top of the merged table so no gate but her BODY can refuse her - lifted
 *  verbatim in intent from `tools/pro-season-probe.ts`, which is where the idiom is documented. */
function stampProBook(world: WorldState): void {
  world.results = world.results.filter((r) => r.playerId !== KID_ID)
  for (let i = 0; i < 8; i++) world.results.push({ playerId: KID_ID, week: world.week, points: 1800, tier: 'wta1000' })
  recomputeKidRank(world)
}

/** The strongest rung the engine will accept her into this week. Reads the ENGINE's own
 *  `entryStatus`, so no policy here can be kinder or crueller than the game is. */
function pickEvent(world: WorldState, minGapFrom: number): string | null {
  const entered = new Set(world.entries)
  const weeksTaken = new Set(world.season.filter((e) => entered.has(e.id)).map((e) => e.week))
  let best: { id: string; rung: number } | null = null
  for (const e of world.season) {
    if (e.week <= world.week || e.week > world.week + 6) continue
    if (entered.has(e.id) || weeksTaken.has(e.week)) continue
    if (e.week < minGapFrom) continue
    if (entryStatus(world, e).level === 'blocked') continue
    const rung = TIER_LADDER.indexOf(e.tier)
    if (!best || rung > best.rung) best = { id: e.id, rung }
  }
  return best?.id ?? null
}

/** ⭐ THE THREE POLICIES, and the difference between them is the owner's question.
 *
 *  `rested`  – she only enters when she is FRESH (condition >= 85) and never two weeks running.
 *              This is "приезжаю с 80-90 на турнир".
 *  `grinder` – she enters every week the calendar offers, whatever she arrives at; only the engine's
 *              own medical block stops her. This is "УЖЕ в низкой кондиции […] ПОСТОЯННО".
 *  `pro`     – `grinder`'s appetite with an elite ranking book, so the draws she plays are the big
 *              ones (a Slam is a 128-bracket) and the runs are deep. This is the era the owner was
 *              actually playing when he wrote the complaint. */
const REST_GATE = argOf('restGate', 85)

function walk(arm: ArmId, seed: string): ArmOut {
  const out: ArmOut = {
    rows: [],
    allDrawMatches: 0,
    seasons: SEASONS,
    events: 0,
    retirementDoorOnsets: 0,
    resimMismatch: 0,
    runsWithDriftingStamina: 0,
    runsOfTwoOrMore: 0,
    strainCharged: 0,
    weeklyDoorOnsets: 0,
    seasonsWithAnyOnset: 0,
    seasonsWalked: 0,
    entriesRefused: 0,
  }
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: 'elite' })
  world.potential = { serve: 80, ret: 78, composure: 78, stamina: 78, groundstrokes: 80 }
  // ⚠ THE TRAINING PLAN IS A CONFOUND AND `--plan` IS THE CONTROL FOR IT. Left to itself an arm
  // called "grinder" wants the grind preset, but the preset trains her HARDER as well as resting her
  // less, so she develops faster, meets the field closer, and plays LONGER matches - which moves the
  // one quantity the hazard actually integrates. `--plan balanced` pins both arms to one slider and
  // leaves the entry policy as the only difference, which is the owner's question stated exactly.
  const forced = argStr('plan', '')
  world.plan = { ...WEEK_PLAN_PRESETS[(forced || (arm === 'rested' ? 'light' : 'grind')) as 'light' | 'balanced' | 'grind'] }
  const rng = resumeMain(world.rngMain)
  let lastPlayWeek = -2
  let onsetThisSeason = false
  let season = 0

  for (let w = 0; w < WEEKS; w++) {
    world.fundsCents = 5_000_000_00 // money is never the reason; the economy has its own bench
    if (arm === 'pro' && world.week % 26 === 0) stampProBook(world)
    const mayEnter = arm === 'rested' ? world.condition >= REST_GATE : true
    const gap = arm === 'rested' ? lastPlayWeek + 2 : 0
    if (mayEnter) {
      const id = pickEvent(world, gap)
      if (id) {
        const ev = world.season.find((e) => e.id === id)!
        try {
          enterEvent(world, id)
          lastPlayWeek = ev.week
        } catch {
          out.entriesRefused += 1
        }
      }
    }

    const wasInjured = world.injury !== null
    const eidBefore = world.nextEventId
    tickWeek(world, rng)

    // ⚠⚠ READ HERE. The run has been SIMULATED (tick phase 3b) and NOT yet finalized, so
    // `world.condition` is still the value `kidMatchPlayerFor` scaled her by for every match of it.
    const p = world.pendingTournament
    if (p) {
      const event = world.season.find((e) => e.id === p.eventId)
      const tier = event?.tier
      const arrival = world.condition
      const frozen = p.players[KID_ID]
      if (tier && event && frozen) {
        out.events += 1
        out.allDrawMatches += p.result.matches.length
        const totalRounds = Math.log2(TIERS[tier].drawSize)
        // instrument (c): the no-within-week-fatigue identity. One frozen `MatchPlayer` per player
        // per RUN, so every match of the run integrates the same stamina - collected below.
        const staminaSeen = new Set<number>()

        for (const m of p.result.matches) {
          if (m.aId !== KID_ID && m.bId !== KID_ID) continue
          const a = p.players[m.aId]
          const b = p.players[m.bId]
          if (!a || !b || !m.seed) continue
          // instrument (b): re-simulate at the stored seed off the frozen snapshots.
          const res = simulateMatch(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: m.seed })
          const score = res.sets.map((s) => `${s.a}-${s.b}`).join(' ')
          const winnerId = res.winner === 0 ? m.aId : m.bId
          if (score !== (m.score ?? '') || winnerId !== m.winnerId) out.resimMismatch += 1
          const kidIsA = m.aId === KID_ID
          const kidStamina = kidIsA ? a.stamina : b.stamina
          staminaSeen.add(kidStamina)
          let hazard = 0
          for (let n = 1; n <= res.totalPoints; n++) hazard += RETIRE_K * spentness(n, kidStamina)
          out.rows.push({
            arm,
            tier,
            round: m.round,
            roundsLeft: totalRounds - m.round,
            arrival,
            stamina: kidStamina,
            points: res.totalPoints,
            games: (m.score ?? '').split(' ').filter(Boolean).reduce((n, set) => n + set.split('-').reduce((x, g) => x + Number(g), 0), 0),
            retiredKid: m.retiredId === KID_ID,
            retiredOpp: !!m.retiredId && m.retiredId !== KID_ID,
            retiredAt: res.retired ? res.retired.pointNumber : null,
            hazard,
          })
        }
        const kidMatchCount = p.result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID).length
        if (kidMatchCount > 1) {
          out.runsOfTwoOrMore += 1
          if (staminaSeen.size > 1) out.runsWithDriftingStamina += 1
        }
      }
      // ...AND ONLY NOW. `skipTournament` runs `finalizeTournament`: the strain is charged and
      // `retirementInjury` opens the layoff.
      const condBefore = world.condition
      skipTournament(world)
      closeTournament(world)
      out.strainCharged += condBefore - world.condition
    }

    // ⚠⚠ COUNTED OFF THE ONSET'S OWN SENTENCE, WITH NO `!wasInjured` GATE - AND THE GATE IS A SECOND
    // LEAK OF THE ROUND-26 #14b BUG, still live in `tools/pro-season-probe.ts`. That probe counts an
    // onset only on the `world.injury !== null && !wasInjured` EDGE. `rollInjury` clears an expired
    // layoff at tick step 1c, so a week that starts injured, is cleared, and then produces a
    // retirement injury at finalize begins AND ends with `world.injury` set: the edge never fires and
    // the onset is invisible. Measured on the first run of this file: 65 retirements read off
    // `MatchRecord.retiredId` against 60 edges in the grinder arm, 57 against 55 in the pro arm.
    // `onsetInjury` (world/injury.ts:412) emits EXACTLY ONE `'injury'` event per onset and the six
    // prefixes below are its whole vocabulary - the two other `'injury'`-typed events in the engine
    // are the walkover and the medical withdrawal (world/phaseHerWeek.ts:298, :317), neither of which
    // is an onset, and neither of which starts with one of these.
    const onsets = world.events.filter((ev) => ev.id >= eidBefore && ev.type === 'injury')
    const retOnsets = onsets.filter((ev) => ev.text.startsWith('She had to stop') || ev.text.startsWith('She stopped,')).length
    const weeklyOnsets = onsets.filter((ev) => ev.text.startsWith('Injury:') || ev.text.startsWith('Bad news from the clinic')).length
    out.retirementDoorOnsets += retOnsets
    out.weeklyDoorOnsets += weeklyOnsets
    if (retOnsets + weeklyOnsets > 0) onsetThisSeason = true
    void wasInjured
    if (world.week % WEEKS_PER_YEAR === 0) {
      out.seasonsWalked += 1
      if (onsetThisSeason) out.seasonsWithAnyOnset += 1
      onsetThisSeason = false
      season += 1
    }
  }
  void season
  return out
}

// --- the report ---------------------------------------------------------------------------------

const pct = (n: number, d: number, dp = 2) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(dp)}%`)
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

console.log(`\n\n=== PART B - THE CAREERS (${CAREERS} careers x ${SEASONS} seasons, per arm) ===`)

const byArm = new Map<ArmId, ArmOut[]>()
for (const arm of ARMS) {
  const outs: ArmOut[] = []
  for (let s = 0; s < CAREERS; s++) outs.push(walk(arm, `retshape-${arm}-${s}`))
  byArm.set(arm, outs)
}

const merge = (outs: ArmOut[]) => ({
  rows: outs.flatMap((o) => o.rows),
  allDrawMatches: sum(outs.map((o) => o.allDrawMatches)),
  events: sum(outs.map((o) => o.events)),
  retDoor: sum(outs.map((o) => o.retirementDoorOnsets)),
  weeklyDoor: sum(outs.map((o) => o.weeklyDoorOnsets)),
  mismatch: sum(outs.map((o) => o.resimMismatch)),
  drifting: sum(outs.map((o) => o.runsWithDriftingStamina)),
  multiMatchRuns: sum(outs.map((o) => o.runsOfTwoOrMore)),
  strain: sum(outs.map((o) => o.strainCharged)),
  seasonsWalked: sum(outs.map((o) => o.seasonsWalked)),
  seasonsWithOnset: sum(outs.map((o) => o.seasonsWithAnyOnset)),
})

console.log('\n--- INSTRUMENT CHECK (read this before any number below) ---')
for (const arm of ARMS) {
  const m = merge(byArm.get(arm)!)
  const kidRets = m.rows.filter((r) => r.retiredKid).length
  console.log(
    `  ${arm.padEnd(8)} re-sim mismatches ${String(m.mismatch).padStart(4)}/${String(m.rows.length).padStart(5)}` +
      `   her retirements ${String(kidRets).padStart(3)}   retirement-door onsets ${String(m.retDoor).padStart(3)}` +
      `   ${kidRets === m.retDoor ? 'IDENTITY HOLDS' : '⚠ MISMATCH - the read is in the wrong place'}`,
  )
  console.log(
    `           multi-match runs ${String(m.multiMatchRuns).padStart(4)}, of which the kid's frozen stamina DRIFTS between` +
      ` rounds: ${m.drifting}   ${m.drifting === 0 ? '<- no within-week fatigue, confirmed' : '⚠ the claim is false'}` +
      `   · mean strain charged per run ${(m.strain / Math.max(1, m.events)).toFixed(1)}`,
  )
}

console.log('\n--- 1. RETIREMENTS BY ROUND, NORMALISED BY THE MATCHES PLAYED THERE ---')
console.log('   (roundsLeft: 1 = the final, 2 = SF, 3 = QF, 4 = R16, 5 = R32, 6 = R64, 7 = R128)')
for (const arm of ARMS) {
  const m = merge(byArm.get(arm)!)
  console.log(`\n  ${arm}:`)
  console.log('    round-in-run   matches   her ret   rate      either    mean pts   mean games')
  const maxRound = Math.max(0, ...m.rows.map((r) => r.round))
  for (let r = 0; r <= maxRound; r++) {
    const cell = m.rows.filter((x) => x.round === r)
    if (cell.length === 0) continue
    const her = cell.filter((x) => x.retiredKid).length
    const either = cell.filter((x) => x.retiredKid || x.retiredOpp).length
    console.log(
      `    match #${String(r + 1).padStart(2)}      ${String(cell.length).padStart(7)}   ${String(her).padStart(7)}` +
        `   ${pct(her, cell.length).padStart(6)}   ${pct(either, cell.length).padStart(6)}` +
        `   ${(sum(cell.map((x) => x.points)) / cell.length).toFixed(0).padStart(8)}` +
        `   ${(sum(cell.map((x) => x.games)) / cell.length).toFixed(1).padStart(10)}`,
    )
  }
  console.log('    named round    matches   her ret   rate      either    mean pts   mean games')
  const NAMES: Record<number, string> = { 1: 'F', 2: 'SF', 3: 'QF', 4: 'R16', 5: 'R32', 6: 'R64', 7: 'R128' }
  for (const rl of [7, 6, 5, 4, 3, 2, 1]) {
    const cell = m.rows.filter((x) => x.roundsLeft === rl)
    if (cell.length === 0) continue
    const her = cell.filter((x) => x.retiredKid).length
    const either = cell.filter((x) => x.retiredKid || x.retiredOpp).length
    console.log(
      `    ${(NAMES[rl] ?? String(rl)).padEnd(11)}    ${String(cell.length).padStart(7)}   ${String(her).padStart(7)}` +
        `   ${pct(her, cell.length).padStart(6)}   ${pct(either, cell.length).padStart(6)}` +
        `   ${(sum(cell.map((x) => x.points)) / cell.length).toFixed(0).padStart(8)}` +
        `   ${(sum(cell.map((x) => x.games)) / cell.length).toFixed(1).padStart(10)}`,
    )
  }
}

console.log('\n--- 2. RETIREMENTS BY ARRIVAL CONDITION ---')
console.log('   ⭐ the owner\'s design question, as a number: does arriving fresh buy safety?')
const BUCKETS: [string, (c: number) => boolean][] = [
  ['>= 90', (c) => c >= 90],
  ['80-89', (c) => c >= 80 && c < 90],
  ['70-79', (c) => c >= 70 && c < 80],
  ['60-69', (c) => c >= 60 && c < 70],
  ['< 60 ', (c) => c < 60],
]
{
  const all = ARMS.flatMap((a) => merge(byArm.get(a)!).rows)
  console.log('\n  POOLED over every arm - the population question:')
  console.log('    arrival    matches   her ret   rate      mean pts   mean games   mean cond-factor   Σ hazard/match')
  for (const [label, test] of BUCKETS) {
    const cell = all.filter((r) => test(r.arrival))
    if (cell.length === 0) continue
    const her = cell.filter((r) => r.retiredKid).length
    console.log(
      `    ${label}    ${String(cell.length).padStart(7)}   ${String(her).padStart(7)}   ${pct(her, cell.length).padStart(6)}` +
        `   ${(sum(cell.map((r) => r.points)) / cell.length).toFixed(0).padStart(8)}` +
        `   ${(sum(cell.map((r) => r.games)) / cell.length).toFixed(1).padStart(10)}` +
        `   ${(sum(cell.map((r) => conditionMatchFactor(r.arrival))) / cell.length).toFixed(3).padStart(16)}` +
        `   ${(100 * (sum(cell.map((r) => r.hazard)) / cell.length)).toFixed(3).padStart(13)}%`,
    )
  }
  // ⚠ AND THE SAME CUT WITHIN EACH ARM, because the pooled table cannot separate "she arrived worn"
  // from "she is in the arm that also plays longer matches". Inside one arm the policy is constant
  // and the condition column is her own week-to-week variation, which is the honest read.
  for (const a of ARMS) {
    const rows = merge(byArm.get(a)!).rows
    console.log(`\n  WITHIN THE ${a.toUpperCase()} ARM ALONE - policy held constant:`)
    console.log('    arrival    matches   her ret   rate      mean pts   mean games')
    for (const [label, test] of BUCKETS) {
      const cell = rows.filter((r) => test(r.arrival))
      if (cell.length === 0) continue
      const her = cell.filter((r) => r.retiredKid).length
      console.log(
        `    ${label}    ${String(cell.length).padStart(7)}   ${String(her).padStart(7)}   ${pct(her, cell.length).padStart(6)}` +
          `   ${(sum(cell.map((r) => r.points)) / cell.length).toFixed(0).padStart(8)}` +
          `   ${(sum(cell.map((r) => r.games)) / cell.length).toFixed(1).padStart(10)}`,
      )
    }
  }
  // ⭐ AND THE SAME CUT AT A FIXED MATCH LENGTH, which is the only way to see the condition channel
  // on its own: pooling lets the LENGTH confound do all the work, and the confound IS the finding.
  console.log('\n  HELD AT A FIXED LENGTH (matches of 150-250 points only) - the condition channel alone:')
  console.log('    arrival    matches   her ret   rate      mean pts')
  for (const [label, test] of BUCKETS) {
    const cell = all.filter((r) => test(r.arrival) && r.points >= 150 && r.points <= 250)
    if (cell.length === 0) continue
    const her = cell.filter((r) => r.retiredKid).length
    console.log(
      `    ${label}    ${String(cell.length).padStart(7)}   ${String(her).padStart(7)}   ${pct(her, cell.length).padStart(6)}` +
        `   ${(sum(cell.map((r) => r.points)) / cell.length).toFixed(0).padStart(8)}`,
    )
  }
}

console.log('\n--- 3. AGAINST THE RESEARCH (docs/research/retirement-and-withdrawal.md §7) ---')
console.log('   anchors: 2.73% of matches end in a retirement by either player (7,291 of ~266,900');
console.log('            women\'s ITF matches, PLOS ONE 2024); 1.36 retirements per 1000 games played.')
for (const arm of ARMS) {
  const m = merge(byArm.get(arm)!)
  const her = m.rows.filter((r) => r.retiredKid).length
  const opp = m.rows.filter((r) => r.retiredOpp).length
  const games = sum(m.rows.map((r) => r.games))
  console.log(
    `\n  ${arm}:  ${m.rows.length} of HER matches in ${m.events} events (${m.allDrawMatches} matches in those draws all told)`,
  )
  console.log(`    per HER match, either player stopped   ${pct(her + opp, m.rows.length)}   <- the research's own measure, 2.73%`)
  console.log(`      of which hers                        ${pct(her, m.rows.length)}`)
  console.log(`      of which her opponent's              ${pct(opp, m.rows.length)}`)
  console.log(
    `    per match IN THE DRAWS SHE PLAYED      ${pct(her + opp, m.allDrawMatches)}   <- an AI-AI match resolves` +
      ` by closed form and can NEVER retire`,
  )
  console.log(`    per 1000 games (either)                ${((1000 * (her + opp)) / games).toFixed(2)}   <- research 1.36`)
  console.log(`      hers alone                           ${((1000 * her) / games).toFixed(2)}`)
  console.log(`    HER retirements per season             ${(her / m.seasonsWalked).toFixed(2)}   over ${m.seasonsWalked} seasons walked`)
  console.log(`    her matches per season                 ${(m.rows.length / m.seasonsWalked).toFixed(1)}`)
  console.log(
    `    season injury prevalence               ${pct(m.seasonsWithOnset, m.seasonsWalked, 0)}` +
      `   (retirement door ${m.retDoor}, weekly door ${m.weeklyDoor})`,
  )
}

console.log('\n--- 4. THE GRINDER ---')
{
  const rows = (a: ArmId) => merge(byArm.get(a)!).rows
  const rate = (rs: MatchRow[]) => (rs.length === 0 ? 0 : rs.filter((r) => r.retiredKid).length / rs.length)
  const meanArr = (rs: MatchRow[]) => (rs.length === 0 ? 0 : sum(rs.map((r) => r.arrival)) / rs.length)
  const meanPts = (rs: MatchRow[]) => (rs.length === 0 ? 0 : sum(rs.map((r) => r.points)) / rs.length)
  console.log('    arm        her matches   mean arrival   mean pts   her ret/match   her ret/season')
  for (const a of ARMS) {
    const m = merge(byArm.get(a)!)
    const rs = rows(a)
    console.log(
      `    ${a.padEnd(9)}  ${String(rs.length).padStart(11)}   ${meanArr(rs).toFixed(1).padStart(12)}` +
        `   ${meanPts(rs).toFixed(0).padStart(8)}   ${(100 * rate(rs)).toFixed(2).padStart(13)}%` +
        `   ${(rs.filter((r) => r.retiredKid).length / m.seasonsWalked).toFixed(2).padStart(14)}`,
    )
  }
  if (ARMS.includes('rested') && ARMS.includes('grinder')) {
    const r = rate(rows('rested'))
    const g = rate(rows('grinder'))
    console.log(
      `\n    ⭐ grinder / rested per-match risk ratio: ${r === 0 ? 'n/a' : (g / r).toFixed(2)}x` +
        `   (the owner's «наказывать гриндера» wants this WELL above 1)`,
    )
  }
}
