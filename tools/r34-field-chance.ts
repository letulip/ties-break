// ROUND 34 #5 – DOES THE PRE-DRAW FIGURE HOLD STILL, AND WHAT DOES IT READ ON THE RUNGS ROUND 31 #3
// CALLED DEGENERATE?
//
//   npx vite-node tools/r34-field-chance.ts [--seeds 3] [--weeks 4] [--windows 6] [--presets 8,6,4]
//
// HIS WORDS: «за 2 недели до турнира можно сняться бесплатно, но ты не знаешь шансов, а за неделю ты
// знаешь шансы, но сняться бесплатно нельзя. В итоге у тебя нет планирования… может общую цифру
// шанса на проход первого тура делать, но чтобы она всё-таки реальность отражала и не скакала от
// недели к неделе?»
//
// THREE QUESTIONS, AND THE THIRD IS THE ONE THAT COULD HAVE STOPPED THE BUILD:
//
//   1. STABILITY. One tournament, followed week by week while it sits on screen BEFORE its draw:
//      does the number the card prints move? Printed as the INTEGER PERCENT, because that is what
//      the player reads – a raw drift of 0.004 is not a thing anybody can see.
//   2. THE CONTROL. The same tournament, the same weeks, the OPPONENT-based figure – the one round
//      31 #4 was reported for («каждую неделю это другой турнир с другой соперницей»). His own
//      example was 80% becoming 54% two weeks later. If the control does not swing, the arm is
//      wrong before the hypothesis is (CLAUDE.md).
//   3. DEGENERACY. Round 31 #3 measured the field-strength BAND as degenerate on junior and
//      domestic cards – every one of them read `strong` against fields she outrated. That was the
//      defect that round FIXED (the band stopped reading a standings table), but «it was fixed» is
//      a claim, and shipping a number that is the same on every junior card would be shipping the
//      old defect with a decimal point on it. So the spread is measured per rung.
//
// ⚠⚠ THE CONTROL IS THE SAME CALL, NOT A SECOND MODEL. Both arms come out of ONE `upcomingEvents`
// pass per week, over a world whose only difference is that the tracked event's WEEK has been moved
// to `world.week + DRAW_LEAD_WEEKS` in a COPY of `world.season`. That flips `drawMade` and nothing
// else: `drawnField` keys its stream on the event's ID and reads only its TIER, `selectEntrants`
// never reads a week, `buildDraw` reads only `TIERS[tier].drawSize`, and `rivalConditions` is folded
// at `world.week`, which is untouched. So the opponent this prints is the one the pre-round-31 card
// would have named on that week, exactly, and the field figure beside it is the shipped one.
//
// ⚠ NON-W RUNGS ONLY FOR THE CONTROL, and that is a real restriction rather than a convenience:
// `wtaExclusionFor` groups a week's W events to keep two rungs from drawing the same professional,
// so moving a W event's week WOULD change its field. The junior and domestic rungs take no
// exclusion set at all, which is also where question 3 lives.
//
// Zero engine changes, zero draws of its own.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'
import { answerFork, answerRetirement, type WorldState } from '../src/engine/world'
import { upcomingEvents } from '../src/engine/world/snapshot'
import { DRAW_LEAD_WEEKS } from '../src/engine/season/preview'
import { TIERS, TIER_LADDER, TIER_SHORT } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 3)
const WEEKS = argOf('weeks', 4)
const WINDOWS = argOf('windows', 6)
const START = argOf('start', 40)
const PRESET_ARG = (() => {
  const i = args.indexOf('--presets')
  return i >= 0 && args[i + 1] ? args[i + 1].split(',').map(Number) : [8, 6, 4]
})()

function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
  }
}

/** ONE WEEK'S READING OF ONE EVENT, both arms, through the shipped snapshot path. */
interface Reading {
  week: number
  /** the shipped pre-draw figure, as the card prints it */
  fieldPct: number | null
  /** the pre-round-31 opponent figure for the same event on the same week */
  oppPct: number | null
  oppName: string
  band: string
}

/** The probe: `world.season` copied with ONE event's week moved past the draw lead. See the header
 *  for why this is byte-exact on a non-W rung. */
function readBoth(world: WorldState, id: string): Reading | null {
  const shipped = upcomingEvents(world).find((e) => e.id === id)
  if (!shipped) return null
  const probe = {
    ...world,
    season: world.season.map((e) => (e.id === id ? { ...e, week: world.week + DRAW_LEAD_WEEKS } : e)),
  } as WorldState
  const drawn = upcomingEvents(probe).find((e) => e.id === id)
  return {
    week: world.week,
    fieldPct: shipped.preview.fieldChance === null ? null : Math.round(shipped.preview.fieldChance * 100),
    oppPct:
      drawn?.preview.firstMatchChance == null ? null : Math.round(drawn.preview.firstMatchChance * 100),
    oppName: drawn?.preview.opponentName ?? '',
    band: shipped.preview.fieldStrength,
  }
}

interface Tally {
  events: number
  fieldMoved: number
  fieldSpan: number[]
  oppMoved: number
  oppSpan: number[]
  oppNames: number
  /** ⚠ THE HANDOVER STEP – how far the card's number JUMPS at week − 1, when the ring stops
   *  answering «a typical opponent at this level» and starts answering «this girl». It is real news
   *  rather than instability, and it is the number the owner should see before he meets it. */
  handover: number[]
}
const overall: Tally = { events: 0, fieldMoved: 0, fieldSpan: [], oppMoved: 0, oppSpan: [], oppNames: 0, handover: [] }
/** Question 3: every pre-draw figure ever printed, by rung. */
const byTier = new Map<TierId, number[]>(TIER_LADDER.map((t) => [t, []]))
const bandsByTier = new Map<TierId, Set<string>>(TIER_LADDER.map((t) => [t, new Set<string>()]))

function walkOne(presetIndex: number, seedIndex: number): void {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICIES[1])
  for (let w = 0; w < START; w++) {
    answerWhateverIsOpen(world)
    if (world.ending) return
    stepCareerWeek(world, rng, POLICIES[1])
  }
  console.log(`\n  ${PRESETS[presetIndex].label}  seed ${seedIndex}`)
  for (let window = 0; window < WINDOWS; window++) observeWindow(world, rng, presetIndex, seedIndex)
}

/** One observation window: pick up every event still `WEEKS` weeks clear of its draw, then follow
 *  them as the career walks those weeks. Several windows per career, because the interesting
 *  question is per TOURNAMENT and one career start offers only the two or three cards at the far
 *  end of the eight-week horizon. */
function observeWindow(
  world: WorldState,
  rng: ReturnType<typeof openCareer>['rng'],
  presetIndex: number,
  seedIndex: number,
): void {
  const tracked = upcomingEvents(world)
    .filter((e) => e.week - world.week > WEEKS + DRAW_LEAD_WEEKS)
    .map((e) => ({ id: e.id, tier: e.tier, week: e.week }))
  const rows = new Map<string, Reading[]>()
  for (const t of tracked) rows.set(t.id, [])

  for (let step = 0; step <= WEEKS; step++) {
    answerWhateverIsOpen(world)
    if (world.ending) break
    for (const t of tracked) {
      const r = readBoth(world, t.id)
      if (r) rows.get(t.id)!.push(r)
    }
    if (step === WEEKS) break
    stepCareerWeek(world, rng, POLICIES[1])
  }

  void presetIndex
  void seedIndex
  for (const t of tracked) {
    const seen = rows.get(t.id)!.filter((r) => r.fieldPct !== null)
    if (seen.length < 2) continue
    const fields = seen.map((r) => r.fieldPct!)
    const opps = seen.map((r) => r.oppPct).filter((n): n is number => n !== null)
    const fieldSpan = Math.max(...fields) - Math.min(...fields)
    const oppSpan = opps.length > 1 ? Math.max(...opps) - Math.min(...opps) : 0
    const names = new Set(seen.map((r) => r.oppName).filter(Boolean)).size
    overall.events++
    if (fieldSpan > 0) overall.fieldMoved++
    if (oppSpan > 0) overall.oppMoved++
    overall.fieldSpan.push(fieldSpan)
    overall.oppSpan.push(oppSpan)
    overall.oppNames += names
    const last = seen[seen.length - 1]
    if (last.oppPct !== null && last.fieldPct !== null) overall.handover.push(Math.abs(last.oppPct - last.fieldPct))
    byTier.get(t.tier)!.push(...fields)
    for (const r of seen) bandsByTier.get(t.tier)!.add(r.band)
    console.log(
      `    ${TIER_SHORT[t.tier].padEnd(7)} w${t.week}  FIELD ${fields.map((n) => `${n}%`).join(' ')}` +
        `  (span ${fieldSpan})   OPPONENT ${opps.map((n) => `${n}%`).join(' ')}  (span ${oppSpan}, ${names} names)`,
    )
  }
}

console.log('ROUND 34 #5 – the pre-draw figure, followed week by week, against the opponent figure it replaces')
for (const p of PRESET_ARG) for (let s = 0; s < SEEDS; s++) walkOne(p, s)

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
console.log('\n==================================================================================')
console.log(`STABILITY – ${overall.events} tournaments, each read up to ${WEEKS + 1}x while pre-draw`)
console.log(
  `  FIELD figure moved at all on ${overall.fieldMoved} of ${overall.events}` +
    `   mean span ${mean(overall.fieldSpan).toFixed(2)} pts   worst ${Math.max(0, ...overall.fieldSpan)} pts`,
)
console.log(
  `  OPPONENT figure moved at all on ${overall.oppMoved} of ${overall.events}` +
    `   mean span ${mean(overall.oppSpan).toFixed(2)} pts   worst ${Math.max(0, ...overall.oppSpan)} pts`,
)
console.log(`  distinct opponents named across the same weeks: ${overall.oppNames} for ${overall.events} tournaments`)
console.log(
  `  HANDOVER at week - 1 – the card's number moves ${mean(overall.handover).toFixed(1)} pts on average ` +
    `(worst ${Math.max(0, ...overall.handover)}) when the ring changes question. News, not flicker – but he meets it.`,
)

console.log('\nDEGENERACY (round 31 #3) – what the figure READS per rung, over every observation')
console.log('  rung        n    min   mean    max   distinct%   bands seen')
for (const t of TIER_LADDER) {
  const xs = byTier.get(t)!
  if (!xs.length) continue
  const distinct = new Set(xs).size
  console.log(
    `  ${TIER_SHORT[t].padEnd(9)} ${String(xs.length).padStart(4)}  ${String(Math.min(...xs)).padStart(4)}%` +
      ` ${mean(xs).toFixed(1).padStart(6)}% ${String(Math.max(...xs)).padStart(5)}%   ${String(distinct).padStart(6)}` +
      `      ${[...bandsByTier.get(t)!].join('/')}`,
  )
}
console.log(`\n  (${TIER_LADDER.filter((t) => byTier.get(t)!.length).map((t) => TIERS[t].label).length} rungs observed)`)
