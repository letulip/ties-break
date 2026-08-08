// THE LADDER FLOOR – what does the window's LOWER bound cost her, and what does removing it buy?
//
//   npx vite-node tools/ladder-floor.ts -- --save <path.tsave>      (SAVE ARM)
//   npx vite-node tools/ladder-floor.ts [--seeds N] [--weeks N] [--policy grinder|player|both]
//
// ⚠ WHY IT EXISTS. The owner's round-14 items 7 / 15 / 18 are one defect, measured on his own save
// in docs/specs/round14-triage.md: 165 of 189 future events blocked, 27 of 46 remaining weeks with
// NOTHING enterable, and the reason split is the whole story – everything beneath her says
// `outgrown`, everything above says `locked`. The calendar is full; she may not enter it.
//
// His ruling (06.08): «не делать нижний порог вообще, пусть играет, просто по приоритету более
// актуальный турнир показывать, если есть» – the lower bound stops being a wall and becomes a
// SORTING KEY. The upper bound (an acceptance cut) is the tour's own rule and stays.
//
// THE TWO ARMS, because the defect has two witnesses and they answer different questions:
//
//   SAVE ARM   – his career, every future event on the persisted season blocks, through the real
//                `entryStatus`. This is the number he reported and the one the fix is judged on.
//   CAREER ARM – the econ bench's own presets and policies, ticked for real. PLAYABLE WEEKS per
//                season is the headline; beside it the entry count, the tier mix and her peak rank,
//                because an outgrown rung that now pays points is a behaviour change and the
//                grinder will exploit it.
//
// ⚠ THE DISPLAY COLUMN IS MEASURED HERE TOO, and it has to be: `preferredWeekEvent` was fixed on
// 05.08 (entered → enterable → tallest) against a display column measured to zero, and "enterable"
// is about to mean something much wider. The arm reports what the card pick shows and whether the
// player can act on it, so a regression in the pick surfaces beside the gain in supply.
//
// MEASUREMENT ONLY. It calls engine predicates and counts. No engine number is written from here.

import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import {
  entryStatus,
  tierOpenFor,
  kidPoints,
  ageAtWeek,
  refreshDerivedRankCaches,
  answerFork,
  answerRetirement,
  type WorldState,
} from '../src/engine/world'
import { rankIn } from '../src/engine/world/ladder'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { feedContext, feedShows, preferredWeekEvent } from '../src/composables/tierState'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean, median, type Policy } from './econ-bench'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { TierOpenMap } from '../src/shared/protocol'

const argv = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback
}
const strOf = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const pct = (n: number, d: number): string => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1)}%`)

/** The engine's per-rung verdict, built exactly as `toSnapshot` builds it – so the feed this tool
 *  reads is the feed the screen draws, without paying for a whole snapshot every week. */
function tierOpenMap(world: WorldState): TierOpenMap {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, tierOpenFor(world, t)])) as TierOpenMap
}

/** One event's verdict, off the ENGINE's one gate. `entered` is asked of the world, exactly as
 *  `toSnapshot` asks it. */
interface EventFacts {
  id: string
  week: number
  tier: TierId
  entered: boolean
  eligible: boolean
  ineligibleReason?: string
}
function factsFor(world: WorldState, e: SeasonEvent): EventFacts {
  const gate = entryStatus(world, e)
  return {
    id: e.id,
    week: e.week,
    tier: e.tier,
    entered: world.entries.includes(e.id),
    eligible: gate.level !== 'blocked',
    ineligibleReason: gate.level === 'blocked' ? gate.reason : undefined,
  }
}

// =================================================================================================
// SAVE ARM – his career, every future event
// =================================================================================================

async function saveArm(path: string): Promise<void> {
  const world = await decodeExportFile(new Uint8Array(readFileSync(path)))
  refreshDerivedRankCaches(world)
  const age = ageAtWeek(world.week)
  console.log('')
  console.log('SAVE ARM – every future event on the persisted season blocks, through `entryStatus`')
  console.log(
    `  week ${world.week} · age ${age} · domestic #${rankIn(world, 'domestic')} · itf #${rankIn(world, 'itf')} · wta #${rankIn(world, 'wta')}`,
  )
  console.log(
    `  points: domestic ${kidPoints(world, 'domestic')} · itf ${kidPoints(world, 'itf')} · wta ${kidPoints(world, 'wta')}`,
  )
  const open = TIER_LADDER.filter((t) => tierOpenFor(world, t))
  console.log(`  the engine opens: ${open.length ? open.map((t) => TIERS[t].label).join(', ') : '(nothing)'}`)

  const future = world.season.filter((e) => e.week > world.week).sort((a, b) => a.week - b.week)
  const facts = future.map((e) => factsFor(world, e))
  const enterable = facts.filter((f) => f.eligible || f.entered)
  const reasons = new Map<string, number>()
  for (const f of facts) if (!f.eligible && !f.entered) reasons.set(f.ineligibleReason ?? '?', (reasons.get(f.ineligibleReason ?? '?') ?? 0) + 1)

  const weeks = [...new Set(future.map((e) => e.week))].sort((a, b) => a - b)
  const deadWeeks = weeks.filter((w) => !facts.some((f) => f.week === w && (f.eligible || f.entered)))
  const span = weeks.length ? weeks[weeks.length - 1] - world.week : 0

  console.log('')
  console.log(`  future events: ${facts.length - enterable.length} blocked · ${enterable.length} enterable   (${pct(enterable.length, facts.length)} enterable)`)
  console.log(`  weeks that CARRY an event      : ${weeks.length} of ${span} remaining weeks`)
  console.log(`  weeks where NOTHING is enterable: ${deadWeeks.length} of ${weeks.length}   (${pct(deadWeeks.length, weeks.length)})`)
  console.log(
    `  why the blocked ones refuse    : ${[...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`,
  )

  // THE DISPLAY COLUMN, on the same events: what the feed's own pick puts on each week.
  const feed = feedContext({ ageYears: age, tierOpen: tierOpenMap(world), upcoming: facts })
  let shownActionable = 0
  let shownDeadWithAlternative = 0
  const lines: string[] = []
  for (const w of weeks) {
    const onWeek = facts.filter((f) => f.week === w)
    const shown = preferredWeekEvent(onWeek.filter((f) => feedShows(f, feed)))
    const actionable = shown !== null && (shown.entered || shown.eligible)
    const hadEnterable = onWeek.some((f) => f.eligible || f.entered)
    if (actionable) shownActionable++
    else if (hadEnterable) shownDeadWithAlternative++
    const can = onWeek.filter((f) => f.eligible || f.entered).map((f) => f.tier)
    const no = onWeek.filter((f) => !f.eligible && !f.entered).map((f) => `${f.tier}(${f.ineligibleReason})`)
    lines.push(
      `  w${w}  card: ${padE(shown ? `${shown.tier}${actionable ? '' : ' [dead]'}` : '—', 14)} CAN: ${padE(can.join(',') || '—', 22)} blocked: ${no.join(' ')}`,
    )
  }
  console.log('')
  console.log(`  the card the feed shows: ${shownActionable} of ${weeks.length} weeks actionable · ${shownDeadWithAlternative} dead with an enterable event on the same week`)
  console.log('')
  for (const l of lines) console.log(l)
  console.log('')
  console.log('(nothing of the file enters the repo)')
}

// =================================================================================================
// CAREER ARM – the econ bench's own careers, ticked for real
// =================================================================================================

interface CareerRow {
  policy: string
  seasons: number
  /** weeks that carry at least one event at all */
  weeksWithEvent: number
  /** ...of those, weeks that carry at least one event she may ENTER (or is already in) */
  playableWeeks: number
  /** weeks judged (non-ended) */
  weeks: number
  /** entries committed, and their rungs */
  entries: number
  byTier: Map<TierId, number>
  /** the card pick: weeks where the shown card refuses her, split by whether one was available */
  shownDead: number
  shownDeadWithAlternative: number
  /** her best (lowest) rank ever held, per table */
  peakWta: number | null
  peakItf: number | null
  /** the best-18 W book at the end, and how much of it came from rungs she had outgrown */
  endWtaPoints: number
}

function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
  }
}

function runCareer(presetIndex: number, index: number, policy: Policy, weeks: number): CareerRow {
  const { world, rng } = openCareer(PRESETS[presetIndex], index, policy)
  const row: CareerRow = {
    policy: policy.id,
    seasons: 0,
    weeksWithEvent: 0,
    playableWeeks: 0,
    weeks: 0,
    entries: 0,
    byTier: new Map(),
    shownDead: 0,
    shownDeadWithAlternative: 0,
    peakWta: null,
    peakItf: null,
    endWtaPoints: 0,
  }
  for (let i = 0; i < weeks && world.ending === null; i++) {
    const entered = stepCareerWeek(world, rng, policy)
    answerWhateverIsOpen(world)
    for (const t of TIER_LADDER) {
      if (entered[t] > 0) {
        row.entries += entered[t]
        row.byTier.set(t, (row.byTier.get(t) ?? 0) + entered[t])
      }
    }
    row.weeks++
    // ⚠ ONE RECORD PER CALENDAR WEEK, taken at a fixed distance, so a week is not counted eight
    // times as it walks through the horizon. Same discipline as the dead-week probe's AT_DISTANCE.
    const target = world.week + 4
    const onWeek = world.season.filter((e) => e.week === target)
    if (onWeek.length > 0) {
      const facts = onWeek.map((e) => factsFor(world, e))
      row.weeksWithEvent++
      const hadEnterable = facts.some((f) => f.eligible || f.entered)
      if (hadEnterable) row.playableWeeks++
      const feed = feedContext({ ageYears: ageAtWeek(world.week), tierOpen: tierOpenMap(world), upcoming: facts })
      const shown = preferredWeekEvent(facts.filter((f) => feedShows(f, feed)))
      if (shown && !(shown.entered || shown.eligible)) {
        row.shownDead++
        if (hadEnterable) row.shownDeadWithAlternative++
      }
    }
    const wta = rankIn(world, 'wta')
    if (kidPoints(world, 'wta') > 0 && (row.peakWta === null || wta < row.peakWta)) row.peakWta = wta
    const itf = rankIn(world, 'itf')
    if (kidPoints(world, 'itf') > 0 && (row.peakItf === null || itf < row.peakItf)) row.peakItf = itf
  }
  row.seasons = row.weeks / WEEKS_PER_YEAR
  row.endWtaPoints = kidPoints(world, 'wta')
  return row
}

function report(rows: CareerRow[], label: string): void {
  const sum = (f: (r: CareerRow) => number) => rows.reduce((n, r) => n + f(r), 0)
  const seasons = sum((r) => r.seasons)
  const weeksWithEvent = sum((r) => r.weeksWithEvent)
  const playable = sum((r) => r.playableWeeks)
  console.log('')
  console.log(`══ ${label} · ${rows.length} careers · ${seasons.toFixed(0)} career-seasons ══`)
  console.log(`  PLAYABLE WEEKS per season (>=1 enterable event) : ${(playable / seasons).toFixed(1)} of ${(weeksWithEvent / seasons).toFixed(1)} weeks that carry one`)
  console.log(`  ...as a share of the weeks that carry an event  : ${pct(playable, weeksWithEvent)}`)
  console.log(`  entries per season                              : ${(sum((r) => r.entries) / seasons).toFixed(1)}`)
  const byTier = new Map<TierId, number>()
  for (const r of rows) for (const [t, n] of r.byTier) byTier.set(t, (byTier.get(t) ?? 0) + n)
  console.log(
    `  the tier mix (entries/season)                   : ` +
      TIER_LADDER.filter((t) => (byTier.get(t) ?? 0) > 0)
        .map((t) => `${t} ${((byTier.get(t) ?? 0) / seasons).toFixed(2)}`)
        .join(' · '),
  )
  console.log(
    `  the card pick: DEAD cards ${sum((r) => r.shownDead)} of ${weeksWithEvent} weeks judged` +
      ` · of those, ${sum((r) => r.shownDeadWithAlternative)} had an enterable event on the same week (the DISPLAY column)`,
  )
  const wta = rows.map((r) => r.peakWta).filter((x): x is number => x !== null).sort((a, b) => a - b)
  const itf = rows.map((r) => r.peakItf).filter((x): x is number => x !== null).sort((a, b) => a - b)
  const p10 = (xs: number[]) => (xs.length ? xs[Math.min(xs.length - 1, Math.max(0, Math.round(xs.length / 10) - 1))] : 0)
  console.log(
    `  her peak W rank: best #${wta[0] ?? '–'} · p10 #${p10(wta) || '–'} · median #${wta.length ? median(wta).toFixed(0) : '–'} · worst #${wta[wta.length - 1] ?? '–'}` +
      `   (${wta.length}/${rows.length} ever held a professional ranking)`,
  )
  console.log(
    `  her peak ITF rank: best #${itf[0] ?? '–'} · median #${itf.length ? median(itf).toFixed(0) : '–'}   (${itf.length}/${rows.length} ever ranked)`,
  )
  console.log(`  her W book at career end: mean ${mean(rows.map((r) => r.endWtaPoints)).toFixed(0)} pts · median ${median(rows.map((r) => r.endWtaPoints)).toFixed(0)}`)
}

async function main(): Promise<void> {
  const save = strOf('save', '')
  if (save) {
    await saveArm(save)
    return
  }
  const seeds = argOf('seeds', 4)
  const weeks = argOf('weeks', 8 * WEEKS_PER_YEAR)
  const policyArg = strOf('policy', 'both')
  const policies = policyArg === 'both' ? POLICIES : POLICIES.filter((p) => p.id === policyArg)
  console.log('')
  console.log('THE LADDER FLOOR – playable weeks, entries, the tier mix and her climb')
  console.log(`  ${PRESETS.length} presets x ${seeds} seeds x ${policies.length} policies · ${weeks} weeks · card judged 4 weeks out`)
  for (const policy of policies) {
    const rows: CareerRow[] = []
    for (let p = 0; p < PRESETS.length; p++) {
      for (let i = 0; i < seeds; i++) rows.push(runCareer(p, i, policy, weeks))
    }
    report(rows, `POLICY ${policy.label}`)
  }
  console.log('')
}

// ⚠ NOT the `NAMED_ON_THE_COMMAND_LINE` guard the sweep benches carry, and the difference is the
// argv shape rather than a preference: vite-node 3.2.4 strips the entry file, so on the SAVE arm
// (`-- --save <path>`) nothing left in argv names this file and that guard never fires – it ran and
// printed nothing. Nothing imports this module, so the VITEST check is the whole of what it needs.
if (!process.env.VITEST) void main()
