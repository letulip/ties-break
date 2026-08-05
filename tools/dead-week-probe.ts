// THE DEAD-WEEK PROBE – how many weeks of a season the feed fills with a card she cannot act on,
// and whether an enterable event was sitting on that same week all along.
//
//   npm run bench:deadweek -- [--seeds N] [--weeks N] [--policy grinder|player|both]
//
// ⚠ WHY IT EXISTS. The owner, 05.08, on a sixteen-year-old: «у меня сейчас там висит 5 w-серий
// подряд, т.е. я вообще 5 недель не могу нигде играть, хотя j30, j60, j300 мне вполне доступны.
// Вместо этого я вижу 5 карточек с недоступными турнирами.» Five weeks of the season are dead and
// the screen is full of tournaments that refuse him.
//
// ⚠ THE QUESTION IT ANSWERS IS "DISPLAY OR SUPPLY", because the two have completely different
// repairs and a sketch cannot tell them apart:
//
//   DISPLAY - the week DOES carry an event she may enter, and the feed showed a different one.
//             Both feed surfaces collapse a stacked week through `preferredWeekEvent`, which picks
//             the highest LADDER rung and never asks whether she may enter it. Repair is a pick.
//   SUPPLY  - the week carries nothing enterable at all. No display change can help; the repair is
//             in calendar generation, which is a much bigger change.
//
// It reads the SHIPPED predicates - `toSnapshot` for the cards, `feedContext` / `feedShows` /
// `preferredWeekEvent` for the feed - so it cannot disagree with the screen by construction. Zero
// engine changes, zero draws.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean, median, type Policy } from './econ-bench'
import { answerFork, answerRetirement, toSnapshot, type WorldState } from '../src/engine/world'
import { feedContext, feedShows, preferredWeekEvent } from '../src/composables/tierState'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { UpcomingEvent } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const strOf = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const SEEDS = argOf('seeds', 6)
const WEEKS = argOf('weeks', 10 * WEEKS_PER_YEAR)
const POLICY_ARG = strOf('policy', 'both')
/** How far out the week is judged. One record per CALENDAR week, taken at a fixed distance, so a
 *  week is not counted eight times over as it walks through the horizon. */
const AT_DISTANCE = 4

interface WeekVerdict {
  week: number
  ageYears: number
  /** the card the feed puts on this week, if any */
  shownTier: TierId | null
  /** ...and can the player do anything with it? (entered counts - it is hers) */
  actionable: boolean
  /** did the season hold an event she MAY enter that week, whether or not it was shown? */
  hadEnterable: boolean
  /** the rung of the best one she could have entered */
  enterableTier: TierId | null
  blockedReason: string | null
  /** how many OTHER events sat on that week beside the one shown */
  others: number
  /** ...and why each of them refused her */
  otherReasons: string[]
}

interface CareerRow {
  policy: string
  /** weeks judged */
  judged: number
  /** a card is shown and she cannot act on it */
  dead: number
  /** ...and an enterable event WAS on that week: a display defect */
  deadWithAlternative: number
  /** ...and there was nothing enterable: a supply problem */
  deadWithNothing: number
  /** longest run of consecutive dead weeks inside one 8-week horizon, as the player sees it */
  worstRun: number
  worstRunAge: number
  byReason: Map<string, number>
  hiddenByRung: Map<string, number>
  ages: number[]
  /** DEAD weeks split by WHY the shown card refuses, then by display vs supply */
  splitByReason: Map<string, { display: number; supply: number; alone: number; alsoBlocked: Map<string, number> }>
}

function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
  }
}

/** THE SCREEN'S OWN ANSWER for one calendar week, through the shipped predicates. */
function verdictFor(
  upcoming: readonly UpcomingEvent[],
  feed: ReturnType<typeof feedContext>,
  week: number,
  ageYears: number,
): WeekVerdict | null {
  const onWeek = upcoming.filter((e) => e.week === week)
  if (onWeek.length === 0) return null // an empty week is fine - ruling 9, «пустые недели это нормально»
  const shown = preferredWeekEvent(onWeek.filter((e) => feedShows(e, feed)))
  const enterable = onWeek.filter((e) => e.eligible || e.entered)
  const best = preferredWeekEvent(enterable)
  return {
    week,
    ageYears,
    shownTier: shown?.tier ?? null,
    actionable: shown !== null && (shown.entered || shown.eligible),
    hadEnterable: enterable.length > 0,
    enterableTier: best?.tier ?? null,
    blockedReason: shown && !shown.entered && !shown.eligible ? (shown.ineligibleReason ?? '?') : null,
    others: onWeek.length - 1,
    otherReasons: onWeek
      .filter((e) => e.id !== shown?.id)
      .map((e) => (e.entered ? 'entered' : e.eligible ? 'OPEN' : (e.ineligibleReason ?? '?'))),
  }
}

function runCareer(presetIndex: number, index: number, policy: Policy): CareerRow {
  const { world, rng } = openCareer(PRESETS[presetIndex], index, policy)
  const row: CareerRow = {
    policy: policy.id,
    judged: 0,
    dead: 0,
    deadWithAlternative: 0,
    deadWithNothing: 0,
    worstRun: 0,
    worstRunAge: 0,
    byReason: new Map(),
    hiddenByRung: new Map(),
    ages: [],
    splitByReason: new Map(),
  }
  for (let i = 0; i < WEEKS && world.ending === null; i++) {
    stepCareerWeek(world, rng, policy)
    answerWhateverIsOpen(world)
    const snap = toSnapshot(world)
    const feed = feedContext({ ageYears: snap.ageYears ?? 0, tierOpen: snap.tierOpen, upcoming: snap.upcoming })
    const age = snap.ageYears ?? 0

    // (a) one record per calendar week, judged at a fixed distance
    const v = verdictFor(snap.upcoming, feed, world.week + AT_DISTANCE, age)
    if (v && v.shownTier !== null) {
      row.judged++
      if (!v.actionable) {
        row.dead++
        row.ages.push(age)
        const r = v.blockedReason ?? '?'
        row.byReason.set(r, (row.byReason.get(r) ?? 0) + 1)
        const split = row.splitByReason.get(r) ?? { display: 0, supply: 0, alone: 0, alsoBlocked: new Map() }
        if (v.hadEnterable) split.display++
        else {
          split.supply++
          if (v.others === 0) split.alone++
          for (const other of v.otherReasons) split.alsoBlocked.set(other, (split.alsoBlocked.get(other) ?? 0) + 1)
        }
        row.splitByReason.set(r, split)
        if (v.hadEnterable) {
          row.deadWithAlternative++
          const k = `${v.shownTier} hid ${v.enterableTier}`
          row.hiddenByRung.set(k, (row.hiddenByRung.get(k) ?? 0) + 1)
        } else {
          row.deadWithNothing++
        }
      }
    }

    // (b) THE OWNER'S OWN READING: the longest run of dead weeks visible on ONE screen.
    let run = 0
    for (let w = world.week + 1; w <= world.week + 8; w++) {
      const x = verdictFor(snap.upcoming, feed, w, age)
      if (x && x.shownTier !== null && !x.actionable) {
        run++
        if (run > row.worstRun) {
          row.worstRun = run
          row.worstRunAge = age
        }
      } else if (x && x.shownTier !== null) {
        run = 0
      }
      // a genuinely empty week neither breaks the run nor extends it: there is no card to blame
    }
  }
  return row
}

const padEnd = (s: string, w: number): string => (s.length >= w ? s : s + ' '.repeat(w - s.length))
const pct = (n: number, d: number): string => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1)}%`)

function report(rows: CareerRow[], label: string): void {
  const judged = rows.reduce((n, r) => n + r.judged, 0)
  const dead = rows.reduce((n, r) => n + r.dead, 0)
  const alt = rows.reduce((n, r) => n + r.deadWithAlternative, 0)
  const none = rows.reduce((n, r) => n + r.deadWithNothing, 0)
  console.log('')
  console.log(`══ ${label} · ${rows.length} careers ══`)
  console.log(`  weeks judged (a card was shown)   : ${judged}`)
  console.log(`  DEAD – the card refuses her       : ${dead} (${pct(dead, judged)})`)
  console.log(`    of those, DISPLAY (she could have entered something else that week) : ${alt} (${pct(alt, dead)})`)
  console.log(`    of those, SUPPLY  (the week held nothing enterable at all)          : ${none} (${pct(none, dead)})`)
  const runs = rows.map((r) => r.worstRun)
  console.log(
    `  worst run of dead weeks on ONE screen: max ${Math.max(0, ...runs)} · median ${median(runs).toFixed(1)} · mean ${mean(runs).toFixed(2)}` +
      ` · careers reaching 3+ ${rows.filter((r) => r.worstRun >= 3).length}/${rows.length}`,
  )
  const ages = rows.flatMap((r) => r.ages).sort((a, b) => a - b)
  if (ages.length) {
    const byAge = new Map<number, number>()
    for (const a of ages) byAge.set(a, (byAge.get(a) ?? 0) + 1)
    console.log(
      `  the ages it lands at                : ` +
        [...byAge.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([a, n]) => `${a}y ${n}`).join(' · '),
    )
  }
  const reasons = new Map<string, number>()
  for (const r of rows) for (const [k, n] of r.byReason) reasons.set(k, (reasons.get(k) ?? 0) + n)
  console.log(
    `  why the shown card refuses          : ` +
      [...reasons.entries()].sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(' · '),
  )
  // THE SPLIT THAT DECIDES THE REPAIR, per reason the shown card refuses.
  const split = new Map<string, { display: number; supply: number; alone: number; alsoBlocked: Map<string, number> }>()
  for (const r of rows) {
    for (const [k, v] of r.splitByReason) {
      const acc = split.get(k) ?? { display: 0, supply: 0, alone: 0, alsoBlocked: new Map<string, number>() }
      acc.display += v.display
      acc.supply += v.supply
      acc.alone += v.alone
      for (const [rr, n] of v.alsoBlocked) acc.alsoBlocked.set(rr, (acc.alsoBlocked.get(rr) ?? 0) + n)
      split.set(k, acc)
    }
  }
  console.log('  DISPLAY vs SUPPLY, per reason the shown card refuses:')
  for (const [k, v] of [...split.entries()].sort((x, y) => y[1].display + y[1].supply - x[1].display - x[1].supply)) {
    const tot = v.display + v.supply
    console.log(
      `      ${padEnd(k, 13)} ${String(tot).padStart(4)} dead · display ${String(v.display).padStart(4)} (${pct(v.display, tot)})` +
        ` · supply ${String(v.supply).padStart(4)} · of the supply weeks, ${v.alone} carried NO other event` +
        (v.alsoBlocked.size
          ? ` · the others refused for: ${[...v.alsoBlocked.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => `${r} ${n}`).join(', ')}`
          : ''),
    )
  }
  const hidden = new Map<string, number>()
  for (const r of rows) for (const [k, n] of r.hiddenByRung) hidden.set(k, (hidden.get(k) ?? 0) + n)
  if (hidden.size) {
    console.log(`  what the shown card HID (top 8)     :`)
    for (const [k, n] of [...hidden.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8)) {
      console.log(`      ${padEnd(k, 26)} ${n}`)
    }
  }
}

export function main(): void {
  const policies = POLICY_ARG === 'both' ? POLICIES : POLICIES.filter((p) => p.id === POLICY_ARG)
  console.log('')
  console.log('THE DEAD-WEEK PROBE – cards the player cannot act on, and what they hid')
  console.log(`  ${PRESETS.length} presets x ${SEEDS} seeds x ${policies.length} · ${WEEKS} weeks · judged ${AT_DISTANCE} weeks out`)
  for (const policy of policies) {
    const rows: CareerRow[] = []
    for (let p = 0; p < PRESETS.length; p++) {
      for (let i = 0; i < SEEDS; i++) rows.push(runCareer(p, i, policy))
    }
    report(rows, `POLICY ${policy.label}`)
  }
  console.log('')
}

// ⚠ vite-node 3.2.4 strips the entry file from `process.argv` – the same guard the other benches use.
const NAMED_ON_THE_COMMAND_LINE =
  process.argv.some((a) => a.includes('dead-week-probe')) ||
  (process.env.npm_lifecycle_script ?? '').includes('dead-week-probe')
if (!process.env.VITEST && NAMED_ON_THE_COMMAND_LINE) {
  main()
}
