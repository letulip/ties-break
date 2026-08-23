/**
 * THE MASSEUR A/B BENCH – step 2: THE DIAL × THE SEAT (docs/specs/the-masseur-2026-08.md, invariant 4).
 *
 * Run:  npx vite-node tools/masseur-bench.ts [--seeds 32] [--weeks 416]
 *
 * PAIRED ARMS, SAME SEEDS. Arm `none` never hires. Six B-cells hire at the first week the
 * pro-career gate opens (`masseurUnlocked`) and keep him to the end: the three dial rungs
 * (2 / 4 / 7 sessions a week) × travels / stays home. Careers walk the econ bench's own loop
 * (`openCareer`/`stepCareerWeek`, `player` policy – the model of a reasonable parent), so nothing
 * here re-implements an entry policy.
 *
 * WHAT IT MEASURES per cell, paired against `none` on the same seed (SEM = sd/√n reported per cell
 * – the step-1 middle preset cleared only ~1.4 SEM, so this run reports the honesty number itself):
 *   (a) weeks lost to injury, injury onsets, the rehab receipts (weeks bought back);
 *   (b) the money line – salary actually paid AT THE RUNG'S PRICE (read off the ledger, so a
 *       suspended week counts as the $0 it charged), the fares actually charged (and how many of
 *       them a brand discount reached – the Meridian interaction), total staff cost, prize, funds;
 *   (c) what the player reads – pro-phase mean condition, match wins over the pro phase (the
 *       deep-run question: tour arms vs home arms), end W rank, endings, tour receipts.
 *
 * ⚠ THE HIRE (and the dial, and the stance) ARE THE ARMS' ONLY DIVERGENCE, and none of them spends
 * a draw on any stream – so every paired difference below is the masseur's, not a reshuffled
 * world's. (Post-draw threshold moves can still ripple a career – that is the effect being
 * measured, exactly as the physio's own levers do.)
 *
 * ⚠ THE B ARMS MANAGE THE HIRE LIKE A PARENT, NOT LIKE A LATCH. The first probe of this grid hired
 * at the gate and held for ever, and the knife-edge presets answered with bankruptcies: the gate
 * opens while the family's funds are at their junior-years low, and $300-525/wk plus fares tipped
 * careers that A kept alive – measuring a stubbornness nobody plays (the same shape as the coach
 * fare's own measured hazard, docs/specs/coach-travel-2026-08.md). So the walk (re)hires only
 * above HIRE_FLOOR and releases below RELEASE_FLOOR – the `player` policy's own register – and the
 * releases per career are reported. A walk also STOPS at its ending: the engine's tick is total by
 * design, so walking past a bankruptcy would keep billing a dead career and pollute every tally.
 */
import { writeFileSync } from 'node:fs'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import {
  hireMasseur,
  masseurUnlocked,
  setMasseurSessions,
  setMasseurTravels,
  inCollege,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const strArgOf = (name: string): string | null => {
  const at = process.argv.indexOf(`--${name}`)
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : null
}
const SEEDS = argOf('seeds', 32)
const WEEKS = argOf('weeks', 416)
/** `--cells none,4h,4t` walks a subset of the grid (shorthand: none / 2h 2t 4h 4t 7h 7t).
 *  Default = the whole 7-cell grid, byte-compatible with §7's shipped runs. Added for the owner's
 *  22.08 recovery question («дефолтное восстановление … на 7 опустить?»), whose A/B/C arms need the
 *  default rung, not the full dial. */
const CELLS_ARG = strArgOf('cells')
/** `--csv <path>` dumps one row per (preset, cell, seed) with every phase-split metric, so a
 *  cross-ARM comparison (the same seeds walked under a locally patched engine) can be paired
 *  per seed OUTSIDE this process – the runs are separate processes by construction. */
const CSV_PATH = strArgOf('csv')
/** ⭐ `--relief <n>` patches `ECONOMY.masseur.tourRecoveryPerRound` IN PROCESS (the house
 *  Object.assign idiom) – the combined grid's task-3 arms: the owner's «+2 за каждый круг не
 *  многовато?» is answered by running the same grid at 1 and at 2 and reading the tour channel's
 *  SEM. The header line below prints the effective value so an arm can never be mislabelled (the
 *  zsh word-split incident, coach-travel-edge.test.ts). */
const RELIEF = argOf('relief', ECONOMY.masseur.tourRecoveryPerRound)
Object.assign(ECONOMY.masseur, { tourRecoveryPerRound: RELIEF })
const POLICY = POLICIES[1] // 'player' – the reasonable parent
const ARMS_PRESETS = [5, 2] // 25k · middle · middle coach, and 8k · working · middle coach

interface Cell {
  sessions: number | null // null = never hires
  travels: boolean
  label: string
}
const ALL_CELLS: Cell[] = [
  { sessions: null, travels: false, label: 'none' },
  { sessions: 2, travels: false, label: '2/wk home' },
  { sessions: 2, travels: true, label: '2/wk tour' },
  { sessions: 4, travels: false, label: '4/wk home' },
  { sessions: 4, travels: true, label: '4/wk tour' },
  { sessions: 7, travels: false, label: '7/wk home' },
  { sessions: 7, travels: true, label: '7/wk tour' },
]
const CELL_SHORTHAND: Record<string, string> = {
  none: 'none',
  '2h': '2/wk home',
  '2t': '2/wk tour',
  '4h': '4/wk home',
  '4t': '4/wk tour',
  '7h': '7/wk home',
  '7t': '7/wk tour',
}
const CELLS: Cell[] = (() => {
  if (!CELLS_ARG) return ALL_CELLS
  const wanted = CELLS_ARG.split(',').map((s) => CELL_SHORTHAND[s.trim()] ?? s.trim())
  const picked = ALL_CELLS.filter((c) => wanted.includes(c.label))
  // The paired read needs the base arm whatever the caller asked for.
  if (!picked.some((c) => c.sessions === null)) picked.unshift(ALL_CELLS[0])
  return picked
})()
/** The cell every seed must have reached the gate in for the paired fold – the first hired cell
 *  (the shipped grid used '4/wk home'; a subset run uses whatever it walked). */
const GATE_CELL = CELLS.find((c) => c.sessions !== null)?.label ?? 'none'

/** (Re)hire only above this – a parent does not staff up on fumes... */
const HIRE_FLOOR_CENTS = 25_000_00
/** ...and lets the masseur go when the family is down to this, before the bankruptcy latch can. */
const RELEASE_FLOOR_CENTS = 10_000_00

/** One phase's slice of a career – junior = every week before the pro gate opened, pro = from the
 *  gate on (`masseurUnlocked`, i.e. `activeLadderOf === 'wta'` – the same boundary arm C of the
 *  22.08 recovery question patches on, so the split and the patch cannot disagree). */
interface PhaseStats {
  weeks: number
  conditionSum: number
  /** weeks ending under the doctor's HARD floor (ECONOMY.availability.medicalFloor). */
  floorWeeks: number
  onsets: number
  /** weeks she ended injured – the phase-split view of weeks lost (careerTotals.weeksLostToInjury
   *  is whole-career and counts RECOVERED layoffs only, so the two are reported side by side). */
  injuredWeeks: number
  /** arrival vetoes: the doctor pulled her out of an entered draw (the feed's own sentence). */
  vetoes: number
  wins: number
  /** severity mix off `injuryHistory` rows landing in this phase (pruned to 20 rows – at ~8
   *  onsets/career the mix is complete; a pathological career reads its LAST twenty). */
  severity: Record<string, number>
}

const emptyPhase = (): PhaseStats => ({
  weeks: 0,
  conditionSum: 0,
  floorWeeks: 0,
  onsets: 0,
  injuredWeeks: 0,
  vetoes: 0,
  wins: 0,
  severity: {},
})

interface Run {
  unlockWeek: number | null
  hiredWeeks: number
  releases: number
  endedWeek: number | null
  salaryCents: number
  /** ⭐ per-match tour bills («по-матчевая цена») – the travel week's replacement for the salary. */
  tourBillCents: number
  tourBillWeeks: number
  /** ⭐ the return-week sessions actually paid (the receipt line). */
  returnReceipts: number
  /** ⭐ the team's results shares (round 24): coach 10%/5%, masseur 3%/1.5% of gross cheques. */
  coachShareCents: number
  masseurShareCents: number
  /** every `coaching`-category expense EXCLUDING the share – the flat retainer + courts, for the
   *  plan's coach-%-of-prize table. */
  coachFlatCents: number
  fareCents: number
  fareTrips: number
  fareDiscountedTrips: number
  weeksLost: number
  onsets: number
  weeksSaved: number
  tourReceipts: number
  proWins: number
  prizeCents: number
  kidFundsCents: number
  fundsCents: number
  endRankWta: number | null
  meanProCondition: number | null
  ended: string
  junior: PhaseStats
  pro: PhaseStats
}

function walk(presetIndex: number, seedIndex: number, cell: Cell): Run {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICY)
  let unlockWeek: number | null = null
  let hiredWeeks = 0
  let releases = 0
  let endedWeek: number | null = null
  let salaryCents = 0
  let tourBillCents = 0
  let tourBillWeeks = 0
  let returnReceipts = 0
  let coachShareCents = 0
  let masseurShareCents = 0
  let coachFlatCents = 0
  let fareCents = 0
  let fareTrips = 0
  let fareDiscountedTrips = 0
  let onsets = 0
  let weeksSaved = 0
  let tourReceipts = 0
  let proWins = 0
  let injuredBefore = false
  let proWeeks = 0
  let proConditionSum = 0
  let prevSeasonWins = 0
  const junior = emptyPhase()
  const pro = emptyPhase()
  const medicalFloor = ECONOMY.availability.medicalFloor
  for (let w = 0; w < WEEKS; w++) {
    if (unlockWeek === null && masseurUnlocked(world)) unlockWeek = world.week
    // The reasonable parent's staffing rule (see the header): hire at the gate when the money is
    // there, let go before the money is gone, hire again when it comes back. The dial and the
    // stance are set once and PERSIST across a release – they are decisions, not employment.
    if (cell.sessions !== null && unlockWeek !== null && !world.ending && !inCollege(world)) {
      if (!world.masseurHired && world.fundsCents > HIRE_FLOOR_CENTS) {
        hireMasseur(world, true)
        setMasseurSessions(world, cell.sessions)
        if (cell.travels && !world.masseurTravels) setMasseurTravels(world, true)
      } else if (world.masseurHired && world.fundsCents < RELEASE_FLOOR_CENTS) {
        hireMasseur(world, false)
        releases++
      }
    }
    if (world.masseurHired) hiredWeeks++
    stepCareerWeek(world, rng, POLICY)
    // Money, as the LEDGER paid it this week – a suspended week books nothing, and the rung's
    // price is read off the row rather than off a constant.
    // The phase this week belongs to: pro from the week the gate first opened, junior before it.
    const phase = unlockWeek !== null ? pro : junior
    for (const e of world.events) {
      if (e.week !== world.week) continue
      // ⚠ THE `staff` BUCKET HOLDS THREE ROWS NOW (weekly salary, the per-match tour bill, the
      // masseur's results share) and the money story needs them apart – matched by their own
      // texts, never by the bucket alone.
      if (e.text === 'Masseur – weekly salary') salaryCents += -(e.amountCents ?? 0)
      if (e.text.startsWith('Masseur on tour')) {
        tourBillCents += -(e.amountCents ?? 0)
        tourBillWeeks++
      }
      if (e.text.startsWith('Back from the tour')) returnReceipts++
      if (e.text.startsWith("Coach's share of the prize money")) coachShareCents += -(e.amountCents ?? 0)
      if (e.text.startsWith("Masseur's share of the prize money")) masseurShareCents += -(e.amountCents ?? 0)
      if (e.category === 'coaching' && (e.amountCents ?? 0) < 0 && !e.text.startsWith("Coach's share"))
        coachFlatCents += -e.amountCents!
      if (e.category === 'travel' && e.text.includes('masseur travels')) {
        fareCents += -(e.amountCents ?? 0)
        fareTrips++
        if (e.text.includes('covers')) fareDiscountedTrips++
      }
      if (e.text.includes('the masseur bought a week back')) weeksSaved++
      if (e.text.includes('table work on tour')) tourReceipts++
      // The doctor's veto at ARRIVAL (world.ts, the medical-withdrawal arm): she was entered,
      // he pulled her. The entry-time veto is invisible here by construction – the policy skips
      // a blocked event silently – so the under-floor exposure is reported beside it.
      if (e.text.includes('not cleared to play on medical advice')) phase.vetoes++
    }
    const injuredNow = world.injury !== null
    if (injuredNow && !injuredBefore) {
      onsets++
      phase.onsets++
    }
    if (injuredNow) phase.injuredWeeks++
    injuredBefore = injuredNow
    // Match wins, cumulative across season rolls (seasonWins resets at the boundary).
    const cur = world.seasonWins ?? 0
    const wins = cur >= prevSeasonWins ? cur - prevSeasonWins : cur
    prevSeasonWins = cur
    phase.wins += wins
    phase.weeks++
    phase.conditionSum += world.condition
    if (world.condition < medicalFloor) phase.floorWeeks++
    if (unlockWeek !== null) {
      proWins += wins
      proWeeks++
      proConditionSum += world.condition
    }
    // A career that has ENDED is over: the tick is total by design, so walking on would keep
    // billing a dead world and pollute every tally. The paired outcome deltas keep their meaning –
    // ending early IS the outcome.
    if (world.ending) {
      endedWeek = world.week
      break
    }
  }
  // Severity mix off the history rows, split by the week the layoff opened. Rows are pruned to
  // twenty; onsets average well under that, so the mix is whole for a normal career.
  for (const row of world.injuryHistory) {
    const phase = unlockWeek !== null && row.week >= unlockWeek ? pro : junior
    phase.severity[row.severity] = (phase.severity[row.severity] ?? 0) + 1
  }
  return {
    unlockWeek,
    hiredWeeks,
    releases,
    endedWeek,
    salaryCents,
    tourBillCents,
    tourBillWeeks,
    returnReceipts,
    coachShareCents,
    masseurShareCents,
    coachFlatCents,
    fareCents,
    fareTrips,
    fareDiscountedTrips,
    weeksLost: world.careerTotals.weeksLostToInjury ?? 0,
    onsets,
    weeksSaved,
    tourReceipts,
    proWins,
    prizeCents: world.careerTotals.prizeCents ?? 0,
    kidFundsCents: world.kidFundsCents ?? 0,
    fundsCents: world.fundsCents,
    endRankWta: (world as WorldState & { kidRankWta?: number | null }).kidRankWta ?? null,
    meanProCondition: proWeeks > 0 ? proConditionSum / proWeeks : null,
    ended: world.ending?.type ?? 'alive',
    junior,
    pro,
  }
}

const fmt = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
const sd = (xs: number[]) => {
  if (xs.length < 2) return NaN
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1))
}
const sem = (xs: number[]) => sd(xs) / Math.sqrt(xs.length)

const SEVERITIES = ['minor', 'moderate', 'major', 'severe']
const csvRows: string[] = [
  'preset,cell,seed,unlockWeek,endedWeek,ended,weeksLost,weeksSaved,tourReceipts,onsets,' +
    'salaryCents,tourBillCents,tourBillWeeks,returnReceipts,coachShareCents,masseurShareCents,coachFlatCents,kidFundsCents,' +
    'fareCents,fareTrips,releases,hiredWeeks,prizeCents,fundsCents,endRankWta,' +
    'jWeeks,jCondMean,jFloorWeeks,jOnsets,jInjWeeks,jVetoes,jWins,' +
    'pWeeks,pCondMean,pFloorWeeks,pOnsets,pInjWeeks,pVetoes,pWins,' +
    SEVERITIES.map((s) => `jSev_${s}`).join(',') +
    ',' +
    SEVERITIES.map((s) => `pSev_${s}`).join(','),
]

/** One phase's arm-level line: means over the careers in the fold, SEM beside each. */
function phaseLine(label: string, runs: Run[], pick: (r: Run) => PhaseStats): string {
  const cond = runs.map((r) => {
    const p = pick(r)
    return p.weeks > 0 ? p.conditionSum / p.weeks : NaN
  }).filter((x) => Number.isFinite(x))
  const floorShare = runs.map((r) => {
    const p = pick(r)
    return p.weeks > 0 ? p.floorWeeks / p.weeks : NaN
  }).filter((x) => Number.isFinite(x))
  const of = (f: (p: PhaseStats) => number) => runs.map((r) => f(pick(r)))
  const sevTotals = SEVERITIES.map((s) => mean(of((p) => p.severity[s] ?? 0)))
  return (
    `${label} cond ${mean(cond).toFixed(1)}±${sem(cond).toFixed(2)}` +
    ` | <floor ${(mean(floorShare) * 100).toFixed(2)}%` +
    ` | onsets ${mean(of((p) => p.onsets)).toFixed(2)}±${sem(of((p) => p.onsets)).toFixed(2)}` +
    ` | injWks ${mean(of((p) => p.injuredWeeks)).toFixed(2)}±${sem(of((p) => p.injuredWeeks)).toFixed(2)}` +
    ` | vetoes ${mean(of((p) => p.vetoes)).toFixed(2)}` +
    ` | wins ${mean(of((p) => p.wins)).toFixed(1)}±${sem(of((p) => p.wins)).toFixed(1)}` +
    ` | sev m/M/j/s ${sevTotals.map((x) => x.toFixed(2)).join('/')}`
  )
}

for (const presetIndex of ARMS_PRESETS) {
  console.log(`\n== ${PRESETS[presetIndex].label} · policy ${POLICY.id} · ${SEEDS} paired seeds · ${WEEKS} weeks · relief ${RELIEF}/round ==`)
  // Walk every cell for every seed – the `none` arm once per seed, paired against each B-cell.
  const bySeed: Array<Record<string, Run>> = []
  for (let i = 0; i < SEEDS; i++) {
    const row: Record<string, Run> = {}
    for (const cell of CELLS) row[cell.label] = walk(presetIndex, i, cell)
    bySeed.push(row)
  }
  if (CSV_PATH) {
    for (let i = 0; i < SEEDS; i++) {
      for (const cell of CELLS) {
        const r = bySeed[i][cell.label]
        const j = r.junior
        const p = r.pro
        csvRows.push(
          [
            PRESETS[presetIndex].label.replace(/\s+/g, ''), cell.label.replace(/\s+/g, ''), i,
            r.unlockWeek ?? '', r.endedWeek ?? '', r.ended, r.weeksLost, r.weeksSaved,
            r.tourReceipts, r.onsets, r.salaryCents, r.tourBillCents, r.tourBillWeeks,
            r.returnReceipts, r.coachShareCents, r.masseurShareCents, r.coachFlatCents,
            r.kidFundsCents, r.fareCents, r.fareTrips, r.releases,
            r.hiredWeeks, r.prizeCents, r.fundsCents, r.endRankWta ?? '',
            j.weeks, j.weeks > 0 ? (j.conditionSum / j.weeks).toFixed(3) : '', j.floorWeeks,
            j.onsets, j.injuredWeeks, j.vetoes, j.wins,
            p.weeks, p.weeks > 0 ? (p.conditionSum / p.weeks).toFixed(3) : '', p.floorWeeks,
            p.onsets, p.injuredWeeks, p.vetoes, p.wins,
            ...SEVERITIES.map((s) => j.severity[s] ?? 0),
            ...SEVERITIES.map((s) => p.severity[s] ?? 0),
          ].join(','),
        )
      }
    }
  }
  const reached = bySeed.filter((row) => row[GATE_CELL].unlockWeek !== null)
  console.log(`reached the pro gate: ${reached.length}/${bySeed.length}`)
  if (!reached.length) continue
  // The base game's own profile, phase-split – what the recovery question is actually about.
  {
    const base = reached.map((row) => row.none)
    console.log(`\n-- base (none) phase profile (n=${base.length}) --`)
    console.log(phaseLine('junior     ', base, (r) => r.junior))
    console.log(phaseLine('pro        ', base, (r) => r.pro))
    console.log(
      `endings     ${JSON.stringify(count(base.map((r) => r.ended)))} | weeksLost ${mean(base.map((r) => r.weeksLost)).toFixed(1)}±${sem(base.map((r) => r.weeksLost)).toFixed(2)} | prize ${fmt(mean(base.map((r) => r.prizeCents)))} | endRank ${mean(base.filter((r) => r.endRankWta !== null).map((r) => r.endRankWta!)).toFixed(0)}`,
    )
    // ⭐ The plan's coach-%-of-prize table, "after" column (docs/plans/the-team-share.md §2): the
    // base game's own coach economics – flat + the round-24 results share – against GROSS prize
    // (family-kept + her ramp: the cheque as the tournament wrote it).
    const gross = base.map((r) => r.prizeCents + r.kidFundsCents)
    const cShare = base.map((r) => r.coachShareCents)
    const cFlat = base.map((r) => r.coachFlatCents)
    const pct = base.map((_, i) => (gross[i] > 0 ? (100 * (cShare[i] + cFlat[i])) / gross[i] : NaN)).filter(Number.isFinite)
    console.log(
      `team share  coach flat ${fmt(mean(cFlat))} + share ${fmt(mean(cShare))} on gross prize ${fmt(mean(gross))}` +
        ` -> coach ${(mean(pct)).toFixed(2)}% of prize (was 5.7% Alice / 0.94% Ines flat-only)`,
    )
  }
  for (const cell of CELLS.slice(1)) {
    const b = reached.map((row) => row[cell.label])
    const a = reached.map((row) => row.none)
    const d = (f: (r: Run) => number) => b.map((r, i) => f(r) - f(a[i]))
    const dWeeks = d((r) => r.weeksLost)
    const dOnsets = d((r) => r.onsets)
    const dCond = d((r) => r.meanProCondition ?? 0)
    const dWins = d((r) => r.proWins)
    const dPrize = d((r) => r.prizeCents)
    const dFunds = d((r) => r.fundsCents)
    const ranked = reached.filter((row) => row[cell.label].endRankWta !== null && row.none.endRankWta !== null)
    const dRank = ranked.map((row) => row[cell.label].endRankWta! - row.none.endRankWta!)
    console.log(`\n-- cell ${cell.label} (n=${b.length}) --`)
    console.log(
      `weeksLost   B ${mean(b.map((r) => r.weeksLost)).toFixed(1)} vs A ${mean(a.map((r) => r.weeksLost)).toFixed(1)} | paired ${mean(dWeeks).toFixed(2)} sem ${sem(dWeeks).toFixed(2)}`,
    )
    console.log(
      `onsets      B ${mean(b.map((r) => r.onsets)).toFixed(2)} vs A ${mean(a.map((r) => r.onsets)).toFixed(2)} | paired ${mean(dOnsets).toFixed(2)} sem ${sem(dOnsets).toFixed(2)}`,
    )
    console.log(
      `condition   B ${mean(b.map((r) => r.meanProCondition ?? 0)).toFixed(1)} vs A ${mean(a.map((r) => r.meanProCondition ?? 0)).toFixed(1)} | paired ${mean(dCond).toFixed(2)} sem ${sem(dCond).toFixed(2)}`,
    )
    console.log(
      `proWins     B ${mean(b.map((r) => r.proWins)).toFixed(1)} vs A ${mean(a.map((r) => r.proWins)).toFixed(1)} | paired ${mean(dWins).toFixed(2)} sem ${sem(dWins).toFixed(2)}`,
    )
    console.log(
      `receipts    rehab ${mean(b.map((r) => r.weeksSaved)).toFixed(2)} | tour ${mean(b.map((r) => r.tourReceipts)).toFixed(2)} | return sessions ${mean(b.map((r) => r.returnReceipts)).toFixed(2)}`,
    )
    console.log(
      `money       salary ${fmt(mean(b.map((r) => r.salaryCents)))} over ${mean(b.map((r) => r.hiredWeeks)).toFixed(0)} hired wks (${mean(b.map((r) => r.releases)).toFixed(1)} releases) | tour bills ${fmt(mean(b.map((r) => r.tourBillCents)))} over ${mean(b.map((r) => r.tourBillWeeks)).toFixed(1)} wks | fares ${fmt(mean(b.map((r) => r.fareCents)))} over ${mean(b.map((r) => r.fareTrips)).toFixed(1)} trips (${mean(b.map((r) => r.fareDiscountedTrips)).toFixed(1)} discounted) | staff total ${fmt(mean(b.map((r) => r.salaryCents + r.tourBillCents + r.fareCents + r.masseurShareCents)))}`,
    )
    console.log(
      `team share  coach ${fmt(mean(b.map((r) => r.coachShareCents)))} (Δ vs none ${fmt(mean(d((r) => r.coachShareCents)))}) | masseur ${fmt(mean(b.map((r) => r.masseurShareCents)))} | coach flat ${fmt(mean(b.map((r) => r.coachFlatCents)))}`,
    )
    console.log(
      `outcome     prize ${fmt(mean(dPrize))} sem ${fmt(sem(dPrize))} | funds ${fmt(mean(dFunds))} | rank ${mean(dRank).toFixed(1)} (n=${dRank.length}, neg=better) | endings B ${JSON.stringify(count(b.map((r) => r.ended)))} vs A ${JSON.stringify(count(a.map((r) => r.ended)))}`,
    )
    console.log(phaseLine('junior     ', b, (r) => r.junior))
    console.log(phaseLine('pro        ', b, (r) => r.pro))
  }
}

if (CSV_PATH) {
  writeFileSync(CSV_PATH, csvRows.join('\n') + '\n')
  console.log(`\ncsv: ${csvRows.length - 1} rows -> ${CSV_PATH}`)
}

function count(xs: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const x of xs) out[x] = (out[x] ?? 0) + 1
  return out
}
