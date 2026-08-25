// ⭐⭐⭐ WHAT THE FEED RECEIVES DURING THE FREEZE – round 26 #10, the owner's «В новостях во время
// колледжа вообще пустота, как будто мир умер».
//
//   npx vite-node tools/college-news-probe.ts                (6 careers × 4 years)
//   npx vite-node tools/college-news-probe.ts -- --careers 12
//
// ⚠⚠ THE QUESTION THIS FILE ANSWERS FIRST, AND IT IS AN INVENTORY, NOT A FIX. «Empty» has two very
// different causes and they need opposite work: either the freeze WRITES NOTHING (the world is
// silent), or it writes rows that the SURFACE THROWS AWAY (Home's news block drops `expense` and
// `income`, and the snapshot only carries the last `SNAPSHOT_EVENTS` = 60 rows). So every column
// below is counted twice: once over everything `addEvent` wrote inside the freeze span, and once
// over the rows that would actually reach the news list.
//
// ⚠ IT READS THE WORLD AND NOT THE FEATURE. Nothing here imports a symbol this round added, so the
// same file runs on the arm with the change reverted and prints the same table – the A/B discipline
// CLAUDE.md asks for. `--budget` re-prints the cap arithmetic (`EVENTS_CAP`, `pruneEvents`).
//
// ⚠ MEASUREMENT ONLY. Nothing under `src/` is touched and no save is written.
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import { chooseGift, pendingBirthday, resumeFromCollege } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ENDINGS } from '../src/engine/ending'
import { EVENTS_CAP, SNAPSHOT_EVENTS } from '../src/engine/world/constants'
import type { Rng } from '../src/engine/rng'
import type { WorldState } from '../src/engine/world'
import type { WorldEvent } from '../src/shared/protocol'

const args = process.argv.slice(2)
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const CAREERS = numOf('careers', 6)
const POLICY = POLICIES[1]
const WALK_CAP = 400
const DUMP = args.includes('--dump')

const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const pct = (a: number, b: number) => (b === 0 ? '   –' : `${((100 * a) / b).toFixed(0)}%`)

/** ⚠ HOME'S OWN FILTER, COPIED RATHER THAN IMPORTED. `HomeScreen.vue`'s `newsGroups` drops
 *  `expense` and `income` (they live on the Money ledger); this is that one line and nothing else,
 *  so a row that passes here is a row the player can actually read in the news list. */
const readsAsNews = (e: WorldEvent): boolean => e.type !== 'expense' && e.type !== 'income'

interface FreezeReport {
  label: string
  fromWeek: number
  untilWeek: number
  weeks: number
  /** every row `addEvent` wrote inside the span, by `type` */
  writtenByType: Map<string, number>
  /** ...and the subset that survives Home's filter */
  newsByType: Map<string, number>
  /** the news rows again, bucketed by what they are ABOUT (a coarse text classification) */
  newsByTopic: Map<string, number>
  /** weeks inside the span that produced at least one news row */
  weeksWithNews: number
  /** how many of the freeze's news rows are still in the world at graduation (post-prune) */
  survived: number
  /** ...and how many of those are inside the snapshot window the UI is handed */
  inSnapshot: number
  /** the events array's size at graduation, and its composition */
  endTotal: number
  endKept: number
  /** ⭐ THE SCREEN AT REST – one row per press of «Another year» */
  rests: RestRow[]
}

/** What the college Home shell's News card holds the moment the press returns. */
interface RestRow {
  week: number
  /** rows Home would print */
  shown: number
  /** ...spread over how many week groups */
  weeks: number
  /** ...of which about the professional field rather than about her */
  world: number
  /** the oldest week still inside the snapshot window */
  oldest: number
  /** ⭐⭐ THE CAP, AS IT ACTUALLY STANDS – the three classes `pruneEvents` spends the 400 on. `rest`
   *  pinned at `EVENTS_ORDINARY_FLOOR` is the SATURATED regime, and it is what decides how deep the
   *  world's own news can reach: everything the tour says is an ordinary row. */
  keep: number
  evidence: number
  rest: number
  /** the oldest ordinary row still alive – the depth of the world's memory, in weeks */
  restFrom: number
  /** ⭐ THE ONE THAT DECIDES WHETHER ANY OF THIS IS SEEN: rows ON THE CARD that say the field has
   *  generations – a champion in a first or a last season, a farewell, a turnover or an intake
   *  line. Zero here means the world is speaking into weeks the player never opens. */
  generational: number
}

function bump(m: Map<string, number>, k: string): void {
  m.set(k, (m.get(k) ?? 0) + 1)
}

/** A coarse "what is this row about" bucket, read off the text. Deliberately dumb: the point is to
 *  separate rows about HER from rows about THE WORLD, which is the whole of the owner's complaint. */
function topicOf(e: WorldEvent, kidName: string): string {
  const t = e.text
  if (e.match !== undefined) return 'her match (replayable)'
  if (t.includes(' won the ') && t.includes('first season on tour')) return 'THE WORLD: a champion in a first season'
  if (t.includes(' won the ') && t.includes('last season on tour')) return 'THE WORLD: a champion in a last season'
  if (t.startsWith('🏆 ') && t.includes(' won the ')) return 'THE WORLD: a tour champion'
  if (t.startsWith('The tour turns over')) return 'THE WORLD: the season turnover'
  if (t.includes('joined the professional tour')) return 'THE WORLD: the intake'
  if (t.includes('retired') || t.includes('farewell')) return 'THE WORLD: a retirement'
  if (t.includes('turned professional') || t.includes('joins the')) return 'THE WORLD: an arrival'
  if (t.includes(kidName)) return 'her own life'
  return 'other'
}

function walkToFork(preset: (typeof PRESETS)[number], i: number): { world: WorldState; rng: Rng; label: string } | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng, label: `${preset.background}-${i}` }
  }
  return null
}

/** One career, four years, exactly as the Home shell's «Another year» spends them. */
function walkCollege(at: { world: WorldState; rng: Rng; label: string }): FreezeReport | null {
  const world = structuredClone(at.world)
  const rng = at.rng
  answerFork(world, 'college')
  for (let gapW = 0; gapW < 54 && world.ending === null; gapW++) stepCareerWeek(world, rng, POLICIES[0])
  const college = world.college
  if (!college) return null
  const fromWeek = college.fromWeek
  const untilWeek = college.untilWeek
  // ⚠ THE ROWS ARE COLLECTED AS THEY ARE WRITTEN, not read back at the end: `pruneEvents` runs
  // inside the freeze and would silently eat the early years before anybody counted them. The
  // high-water id is the only honest cursor (`addEvent` ids are monotonic).
  const written: WorldEvent[] = []
  const rests: RestRow[] = []
  let cursor = world.events.length ? Math.max(...world.events.map((e) => e.id)) : 0
  const collect = (): void => {
    for (const e of world.events) if (e.id > cursor) written.push(e)
    if (world.events.length) cursor = Math.max(cursor, ...world.events.map((e) => e.id))
  }
  for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    collect()
    // ⭐⭐ THE REST STATE – THIS IS THE SCREEN HE IS LOOKING AT. Between two presses of «Another
    // year» the college Home shell is drawn off exactly this snapshot window, so the honest measure
    // of «пустота» is not what the freeze WROTE, it is what is inside the last `SNAPSHOT_EVENTS`
    // rows at rest and survives Home's filter.
    const window = world.events.slice(-SNAPSHOT_EVENTS)
    const shown = window.filter(readsAsNews)
    const ordinary = world.events.filter((e) => !e.keep && e.match === undefined)
    rests.push({
      week: world.week,
      shown: shown.length,
      weeks: new Set(shown.map((e) => e.week)).size,
      world: shown.filter((e) => topicOf(e, world.profile.kidName).startsWith('THE WORLD')).length,
      oldest: window.length ? window[0].week : world.week,
      keep: world.events.filter((e) => e.keep).length,
      evidence: world.events.filter((e) => !e.keep && e.match !== undefined).length,
      rest: ordinary.length,
      restFrom: ordinary.length ? ordinary[0].week : world.week,
      generational: shown.filter(
        (e) =>
          e.text.includes('season on tour') ||
          e.text.startsWith('\u{1F44B}') ||
          e.text.startsWith('The tour turns over') ||
          e.text.includes('joined the professional tour'),
      ).length,
    })
    if (DUMP && press === 3) {
      console.log(`\n  ⭐ VERBATIM – the News card at week ${world.week} (${at.label}), exactly as Home groups it:`)
      const byWeek = new Map<number, string[]>()
      for (const e of shown) (byWeek.get(e.week) ?? byWeek.set(e.week, []).get(e.week)!).push(`[${e.type}] ${e.text}`)
      for (const [w, lines] of [...byWeek.entries()].sort((a, b) => b[0] - a[0])) {
        console.log(`      W${w}`)
        for (const l of lines) console.log(`        ${l}`)
      }
      console.log('')
    }
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  collect()
  if (DUMP) {
    const world10 = written.filter((e) => e.text.startsWith('👋') || e.text.startsWith('The tour turns over') || e.text.includes('joined the professional tour'))
    console.log(`  ⭐ THE TOUR'S OWN VOICE inside the freeze – ${world10.length} rows:`)
    for (const e of world10) console.log(`      W${e.week}  ${e.text}`)
    console.log('')
  }
  const inSpan = written.filter((e) => e.week >= fromWeek && e.week < untilWeek)
  const news = inSpan.filter(readsAsNews)
  const writtenByType = new Map<string, number>()
  const newsByType = new Map<string, number>()
  const newsByTopic = new Map<string, number>()
  for (const e of inSpan) bump(writtenByType, e.type)
  for (const e of news) {
    bump(newsByType, e.type)
    bump(newsByTopic, topicOf(e, world.profile.kidName))
  }
  const liveIds = new Set(world.events.map((e) => e.id))
  const snapIds = new Set(world.events.slice(-SNAPSHOT_EVENTS).map((e) => e.id))
  return {
    label: at.label,
    fromWeek,
    untilWeek,
    weeks: untilWeek - fromWeek,
    writtenByType,
    newsByType,
    newsByTopic,
    weeksWithNews: new Set(news.map((e) => e.week)).size,
    survived: news.filter((e) => liveIds.has(e.id)).length,
    inSnapshot: news.filter((e) => snapIds.has(e.id)).length,
    endTotal: world.events.length,
    endKept: world.events.filter((e) => e.keep).length,
    rests,
  }
}

// =================================================================================================
const t0 = Date.now()
const forks: Array<{ world: WorldState; rng: Rng; label: string }> = []
for (let k = 0; forks.length < CAREERS && k < CAREERS * 4; k++) {
  const at = walkToFork(PRESETS[k % PRESETS.length], k)
  if (at) forks.push(at)
}
const reports: FreezeReport[] = []
for (const at of forks) {
  const r = walkCollege(at)
  if (r) reports.push(r)
}

console.log(`\n⭐⭐⭐ WHAT THE FEED RECEIVES DURING THE FREEZE – ${reports.length} careers × ${ENDINGS.collegeYears} years`)
console.log(`  EVENTS_CAP = ${EVENTS_CAP}   SNAPSHOT_EVENTS = ${SNAPSHOT_EVENTS}   Home drops type=expense|income\n`)

const totalWeeks = reports.reduce((s, r) => s + r.weeks, 0)
const seasons = totalWeeks / WEEKS_PER_YEAR
const sum = (pick: (r: FreezeReport) => number) => reports.reduce((s, r) => s + pick(r), 0)
const merge = (pick: (r: FreezeReport) => Map<string, number>) => {
  const out = new Map<string, number>()
  for (const r of reports) for (const [k, v] of pick(r)) out.set(k, (out.get(k) ?? 0) + v)
  return [...out.entries()].sort((a, b) => b[1] - a[1])
}

const writtenTotal = merge((r) => r.writtenByType).reduce((s, [, v]) => s + v, 0)
const newsTotal = merge((r) => r.newsByType).reduce((s, [, v]) => s + v, 0)
console.log(`  freeze span                    ${totalWeeks} weeks over ${reports.length} careers (${seasons.toFixed(0)} college seasons)`)
console.log(`  rows WRITTEN inside the freeze ${pad(writtenTotal, 6)}   ${(writtenTotal / totalWeeks).toFixed(2)} / week`)
console.log(`  ...that Home would SHOW        ${pad(newsTotal, 6)}   ${(newsTotal / totalWeeks).toFixed(2)} / week   ${pct(newsTotal, writtenTotal)} of them`)
console.log(`  weeks with at least one        ${pad(sum((r) => r.weeksWithNews), 6)}   ${pct(sum((r) => r.weeksWithNews), totalWeeks)} of freeze weeks\n`)

console.log(`  ${padE('written, by type', 26)}${pad('rows', 8)}${pad('/season', 10)}   shown on Home?`)
console.log(`  ${'-'.repeat(70)}`)
for (const [k, v] of merge((r) => r.writtenByType)) {
  const shown = k !== 'expense' && k !== 'income'
  console.log(`  ${padE(k, 26)}${pad(v, 8)}${pad((v / seasons).toFixed(1), 10)}   ${shown ? 'yes' : 'NO – filtered out'}`)
}

console.log(`\n  ${padE('the news rows, by topic', 34)}${pad('rows', 8)}${pad('/season', 10)}`)
console.log(`  ${'-'.repeat(56)}`)
for (const [k, v] of merge((r) => r.newsByTopic)) console.log(`  ${padE(k, 34)}${pad(v, 8)}${pad((v / seasons).toFixed(1), 10)}`)

console.log(`\n  ⭐ AND WHAT IS STILL THERE WHEN SHE GRADUATES`)
console.log(`     freeze news rows written        ${pad(newsTotal, 6)}`)
console.log(`     ...surviving pruneEvents        ${pad(sum((r) => r.survived), 6)}   ${pct(sum((r) => r.survived), newsTotal)}`)
console.log(`     ...inside the snapshot window   ${pad(sum((r) => r.inSnapshot), 6)}   ${pct(sum((r) => r.inSnapshot), newsTotal)}`)
console.log(`     events array at graduation      ${pad((sum((r) => r.endTotal) / reports.length).toFixed(0), 6)} rows mean (${(sum((r) => r.endKept) / reports.length).toFixed(0)} kept)`)

console.log(`\n  ⭐⭐ THE SCREEN AT REST – the News card the moment «Another year» hands control back`)
console.log(`  ${padE('career', 14)}${pad('press', 6)}${pad('week', 6)}${pad('rows shown', 12)}${pad('groups', 8)}${pad('field', 7)}${pad('spans', 8)}${pad('keep', 6)}${pad('match', 7)}${pad('ordinary', 10)}${pad('news depth', 12)}${pad('generational', 14)}`)
console.log(`  ${'-'.repeat(104)}`)
for (const r of reports) {
  for (let i = 0; i < r.rests.length; i++) {
    const x = r.rests[i]
    console.log(
      `  ${padE(r.label, 14)}${pad(i + 1, 6)}${pad(x.week, 6)}${pad(x.shown, 12)}${pad(x.weeks, 8)}${pad(x.world, 7)}${pad(`${x.week - x.oldest}w`, 8)}` +
        `${pad(x.keep, 6)}${pad(x.evidence, 7)}${pad(x.rest, 10)}${pad(`${x.week - x.restFrom}w`, 12)}${pad(x.generational, 14)}`,
    )
  }
}
const allRests = reports.flatMap((r) => r.rests)
console.log(`  ${'-'.repeat(104)}`)
console.log(
  `  ${padE('MEAN', 14)}${pad('', 7)}${pad('', 7)}` +
    `${pad((allRests.reduce((s, x) => s + x.shown, 0) / allRests.length).toFixed(1), 18)}` +
    `${pad((allRests.reduce((s, x) => s + x.weeks, 0) / allRests.length).toFixed(1), 13)}` +
    `${pad((allRests.reduce((s, x) => s + x.world, 0) / allRests.length).toFixed(1), 17)}` +
    `${pad(`${(allRests.reduce((s, x) => s + (x.week - x.oldest), 0) / allRests.length).toFixed(0)}w`, 8)}` +
    `${pad((allRests.reduce((s, x) => s + x.keep, 0) / allRests.length).toFixed(0), 6)}` +
    `${pad((allRests.reduce((s, x) => s + x.evidence, 0) / allRests.length).toFixed(0), 7)}` +
    `${pad((allRests.reduce((s, x) => s + x.rest, 0) / allRests.length).toFixed(0), 10)}` +
    `${pad(`${(allRests.reduce((s, x) => s + (x.week - x.restFrom), 0) / allRests.length).toFixed(0)}w`, 12)}` +
    `${pad((allRests.reduce((s, x) => s + x.generational, 0) / allRests.length).toFixed(1), 14)}`,
)
console.log(`  rest states with NO generational line  ${allRests.filter((x) => x.generational === 0).length} / ${allRests.length}`)
console.log(`  rest states with ZERO news rows  ${allRests.filter((x) => x.shown === 0).length} / ${allRests.length}`)

console.log(`\n  per career:`)
console.log(`  ${padE('career', 14)}${pad('weeks', 7)}${pad('written', 9)}${pad('news', 7)}${pad('wks+', 6)}${pad('end rows', 10)}`)
for (const r of reports) {
  const w = [...r.writtenByType.values()].reduce((s, v) => s + v, 0)
  const n = [...r.newsByType.values()].reduce((s, v) => s + v, 0)
  console.log(`  ${padE(r.label, 14)}${pad(r.weeks, 7)}${pad(w, 9)}${pad(n, 7)}${pad(r.weeksWithNews, 6)}${pad(r.endTotal, 10)}`)
}
console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`)
