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
// His ruling (06.08), quoted verbatim in docs/specs/ladder-floor-2026-08.md: do not have a lower
// bound at all, let her play, and just lead with the more relevant tournament of the week when there
// is one. The lower bound stops being a wall and becomes a SORTING KEY. The upper bound (an
// acceptance cut) is the tour's own rule and stays.
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
import { coachLadderNote } from '../src/engine/world'
import { coachById, tierOf } from '../src/engine/coach'
import { coachManagesLoad } from '../src/engine/coachLoad'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean, median, type Policy } from './econ-bench'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { CoachTier, TierOpenMap } from '../src/shared/protocol'

const argv = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback
}
const strOf = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const pct = (n: number, d: number): string => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1)}%`)

/** ⚠ IS ANYBODY BEING PAID TO HAVE A VIEW – the same gate `toSnapshot` puts on both of the coach's
 *  opinions, so this tool cannot hear a line the screen would not print. A self-coached career gets
 *  silence, which is the rule the load wave set and this wave inherits. */
function hasCoach(world: WorldState): boolean {
  return coachManagesLoad(tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)))
}

/** HIS RUNG, the one `toSnapshot` computes once per snapshot for the body arm. */
function coachTierOf(world: WorldState): CoachTier {
  return tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId))
}

/** WHAT THE COACH SAYS ABOUT THIS TRIP'S LADDER, exactly as the card would carry it – the engine's
 *  own `coachLadderNote`, never re-derived here. Null when he has nothing to say, which the speak
 *  rate below is the whole point of measuring. */
function coachSays(world: WorldState, e: SeasonEvent): string | null {
  if (!hasCoach(world)) return null
  return coachLadderNote(world, e, coachTierOf(world))
}

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
  /** THE SPEAK RATE – cards judged, and cards the coach had something to say about. A coach who
   *  cautions every week is wallpaper, so this is a first-class number rather than a footnote. */
  cardsJudged: number
  coachSpoke: number
  /** ...and the same two on the card the feed ACTUALLY SHOWS, which is the only rate a player can
   *  experience: both feeds collapse a stacked week through `preferredWeekEvent`, so a line on a
   *  card that never renders is not wallpaper - it is not there at all. */
  shownCards: number
  shownSpoke: number
  /** ...and which of his three arguments it was */
  byLine: Map<string, number>
  /** his rung, for the tier attribution */
  coachTier: string
  /** entries he advised against that were taken anyway (0 on the listening arm by construction) */
  vetoed: number
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

function runCareer(presetIndex: number, index: number, policy: Policy, weeks: number, listen: boolean): CareerRow {
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
    cardsJudged: 0,
    coachSpoke: 0,
    shownCards: 0,
    shownSpoke: 0,
    byLine: new Map(),
    coachTier: 'self',
    vetoed: 0,
    peakWta: null,
    peakItf: null,
    endWtaPoints: 0,
  }
  // ⚠ THE LISTENING ARM IS A PLAYER, NOT A RULE. The veto is the parent doing what his coach tells
  // him – the engine refuses nothing, which is the whole of the owner's ruling. `undefined` is the
  // historical arm byte for byte (see `EntryVeto` in econ-bench.ts).
  const veto = listen
    ? (w: WorldState, e: SeasonEvent) => {
        const said = coachSays(w, e)
        if (said !== null) row.vetoed++
        return said !== null
      }
    : undefined
  for (let i = 0; i < weeks && world.ending === null; i++) {
    const entered = stepCareerWeek(world, rng, policy, veto)
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
      // THE SPEAK RATE, on the cards a player would actually be looking at: enterable ones, judged
      // once each at the same fixed distance. A card he cannot speak about (blocked) is not a card
      // he was silent on.
      for (let k = 0; k < onWeek.length; k++) {
        if (!facts[k].eligible && !facts[k].entered) continue
        row.cardsJudged++
        const said = coachSays(world, onWeek[k])
        if (said === null) continue
        row.coachSpoke++
        const kind = said.includes('is the week') ? 'this week' : said.includes('would not move') ? 'the book' : 'the block ahead'
        row.byLine.set(kind, (row.byLine.get(kind) ?? 0) + 1)
      }
      const hadEnterable = facts.some((f) => f.eligible || f.entered)
      if (hadEnterable) row.playableWeeks++
      const feed = feedContext({ ageYears: ageAtWeek(world.week), tierOpen: tierOpenMap(world), upcoming: facts })
      const shown = preferredWeekEvent(facts.filter((f) => feedShows(f, feed)))
      if (shown && !(shown.entered || shown.eligible)) {
        row.shownDead++
        if (hadEnterable) row.shownDeadWithAlternative++
      }
      if (shown && (shown.entered || shown.eligible)) {
        row.shownCards++
        const ev = onWeek.find((e) => e.id === shown.id)
        if (ev && coachSays(world, ev) !== null) row.shownSpoke++
      }
    }
    const wta = rankIn(world, 'wta')
    if (kidPoints(world, 'wta') > 0 && (row.peakWta === null || wta < row.peakWta)) row.peakWta = wta
    const itf = rankIn(world, 'itf')
    if (kidPoints(world, 'itf') > 0 && (row.peakItf === null || itf < row.peakItf)) row.peakItf = itf
  }
  row.seasons = row.weeks / WEEKS_PER_YEAR
  row.endWtaPoints = kidPoints(world, 'wta')
  row.coachTier = coachTierOf(world)
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
  // THE COACH – how often he speaks, which argument he uses, and whether his rung changed it. A
  // coach who cautions every week is wallpaper; a high rate here is a wrong threshold.
  const cards = sum((r) => r.cardsJudged)
  const spoke = sum((r) => r.coachSpoke)
  const lines = new Map<string, number>()
  for (const r of rows) for (const [k, n] of r.byLine) lines.set(k, (lines.get(k) ?? 0) + n)
  console.log(
    `  THE COACH, as the player MEETS him: ${sum((r) => r.shownSpoke)} of ${sum((r) => r.shownCards)} rendered cards` +
      ` (${pct(sum((r) => r.shownSpoke), sum((r) => r.shownCards))}) – both feeds show ONE card a week`,
  )
  console.log(
    `  ...over every enterable card, rendered or not: ${spoke} of ${cards} (${pct(spoke, cards)})` +
      (lines.size ? ` · ${[...lines.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}` : ''),
  )
  const byRung = new Map<string, { cards: number; spoke: number; careers: number }>()
  for (const r of rows) {
    const acc = byRung.get(r.coachTier) ?? { cards: 0, spoke: 0, careers: 0 }
    acc.cards += r.cardsJudged
    acc.spoke += r.coachSpoke
    acc.careers += 1
    byRung.set(r.coachTier, acc)
  }
  console.log(
    `  ...by HIS rung : ` +
      [...byRung.entries()].map(([t, v]) => `${t} ${pct(v.spoke, v.cards)} (${v.careers} careers)`).join(' · '),
  )
  if (sum((r) => r.vetoed) > 0) console.log(`  entries he talked her out of                    : ${sum((r) => r.vetoed)}`)
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
  const listen = argv.includes('--listen')
  const policies = policyArg === 'both' ? POLICIES : POLICIES.filter((p) => p.id === policyArg)
  console.log('')
  console.log('THE LADDER FLOOR – playable weeks, entries, the tier mix and her climb')
  console.log(
    `  ${PRESETS.length} presets x ${seeds} seeds x ${policies.length} policies · ${weeks} weeks · card judged 4 weeks out` +
      (listen ? ' · LISTENING ARM: the parent does what his coach says' : ''),
  )
  for (const policy of policies) {
    const rows: CareerRow[] = []
    for (let p = 0; p < PRESETS.length; p++) {
      for (let i = 0; i < seeds; i++) rows.push(runCareer(p, i, policy, weeks, listen))
    }
    report(rows, `POLICY ${policy.label}${listen ? ' + LISTENS' : ''}`)
  }
  console.log('')
}

// ⚠ NOT the `NAMED_ON_THE_COMMAND_LINE` guard the sweep benches carry, and the difference is the
// argv shape rather than a preference: vite-node 3.2.4 strips the entry file, so on the SAVE arm
// (`-- --save <path>`) nothing left in argv names this file and that guard never fires – it ran and
// printed nothing. Nothing imports this module, so the VITEST check is the whole of what it needs.
if (!process.env.VITEST) void main()
